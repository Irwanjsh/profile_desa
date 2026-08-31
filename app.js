/* ================================================================
   DATA
================================================================ */
/* ---- Integrasi UMKM: Tani Cihawuk (Supabase, read-only) ---- */
// Kredensial anon (public) yang sama seperti dipakai Tani Cihawuk sendiri.
// Aman di frontend karena akses data dibatasi RLS di database, bukan oleh key ini.
const TANI_SUPABASE_URL      = 'https://qapjuutsgsqyuknvufkn.supabase.co';
const TANI_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcGp1dXRzZ3NxeXVrbnZ1ZmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzY5ODYsImV4cCI6MjEwMjgxMjk4Nn0.CvLyVWEKMOlBofgKUmJ8qZax1m5Dn3gwK0Ytn7BB-2k';
// Satu-satunya tempat yang perlu diubah kalau domain Tani Cihawuk berpindah.
const TANI_CIHAWUK_URL = 'https://irwanjsh.github.io/umkm_cihawuk';

const taniClient = window.supabase.createClient(TANI_SUPABASE_URL, TANI_SUPABASE_ANON_KEY);

/* ---- Backend Desa Cihawuk sendiri (terpisah dari Tani Cihawuk) ---- */
// Read-only dari sisi index.html publik. Insert/update/delete hanya lewat admin/ (Auth admin).
const DESA_SUPABASE_URL      = 'https://gghtoftwabbpgotkspky.supabase.co';
const DESA_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaHRvZnR3YWJicGdvdGtzcGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjI0MzcsImV4cCI6MjEwMzM5ODQzN30.Q7heS_rEmo89F-v54yUWKIk4wixYTw7dULypiCLZ2U4';
const desaClient = window.supabase.createClient(DESA_SUPABASE_URL, DESA_SUPABASE_ANON_KEY);

// 6 kategori resmi Tani Cihawuk (schema.sql: check constraint kolom kategori)
const CAT_CLASS = {
  'Sayuran':'cat-pertanian',
  'Buah':'cat-perkebunan',
  'Hasil Olahan':'cat-olahan',
  'Tanaman Hias':'cat-kerajinan',
  'Rempah & Bumbu':'cat-rempah',
  'Lainnya':'cat-lainnya'
};

/* ================================================================
   NAVIGATION MODULE
================================================================ */
const VALID_VIEWS = ['beranda','profil','umkm','wisata','edukasi','advokasi','berita'];

function showView(viewName){
  if(!VALID_VIEWS.includes(viewName)) viewName = 'beranda';

  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');

  updateActiveNavigation(viewName);
  window.scrollTo({ top:0 });

  if(location.hash !== '#' + viewName){ history.pushState(null, '', '#' + viewName); }
  closeDrawer();

  if(viewName === 'beranda'){
    loadBerandaUmkmPreview();
    loadBerandaWisataPreview();
    loadBerandaEdukasiPreview();
    loadBerandaBeritaPreview();
  }
  if(viewName === 'profil'){ initMap(); setTimeout(invalidateMapSize, 250); loadStrukturStaf(); }
  if(viewName === 'umkm'){ loadUmkmView(); }
  if(viewName === 'wisata'){ loadWisataView(); }
  if(viewName === 'edukasi'){ loadEdukasiView(); }
  if(viewName === 'berita'){ loadBeritaView(); }
}

function updateActiveNavigation(viewName){
  document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.getAttribute('data-nav') === viewName));
}
function handleHashNavigation(){
  const hash = location.hash.replace('#','');
  showView(VALID_VIEWS.includes(hash) ? hash : 'beranda');
}
function openDrawer(){ document.getElementById('mobileDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('open'); }
function closeDrawer(){ document.getElementById('mobileDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('open'); }
window.addEventListener('popstate', handleHashNavigation);

/* ================================================================
   UMKM MODULE — data dari Supabase Tani Cihawuk (read-only, query saat
   halaman dibuka; bukan Realtime, sesuai keputusan Opsi A)
================================================================ */
let umkmCache = null; // hasil query terakhir, dipakai ulang oleh filter tanpa query ulang

async function fetchApprovedProducts(){
  const { data, error } = await taniClient
    .from('products')
    .select('*, producers(nama_usaha, whatsapp, alamat)')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending:false });

  if(error){
    console.error('[UMKM] Gagal memuat produk dari Tani Cihawuk:', error.message);
    return null;
  }
  return data || [];
}

function formatRupiah(angka){
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

function renderProductCard(p){
  const producerName = p.producers ? p.producers.nama_usaha : '-';
  const producerWa   = p.producers ? p.producers.whatsapp : '';
  const habis = p.ketersediaan === 'Habis';
  const fotoSrc = p.foto_path || 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=600&q=70';
  return `
  <div class="bg-white rounded-2xl border border-stone overflow-hidden scale-hover">
    <div class="h-40 overflow-hidden relative">
      <img src="${fotoSrc}" class="w-full h-full object-cover" alt="${p.nama}">
      <span class="cat-badge ${CAT_CLASS[p.kategori] || 'cat-lainnya'} absolute top-3 left-3">${p.kategori}</span>
      ${habis ? `<span class="cat-badge badge-habis absolute top-3 right-3">Habis</span>` : ''}
    </div>
    <div class="p-4">
      <h4 class="font-display font-bold text-[15px] mb-1">${p.nama}</h4>
      <p class="text-[11.5px] text-[#6b8577] italic mb-2"><i class="fa-solid fa-leaf mr-1"></i>${producerName}</p>
      <p class="text-[12.5px] text-[#3c5347] mb-3 line-clamp-2">${p.deskripsi || ''}</p>
      <div class="flex items-center justify-between gap-2">
        <span class="font-bold text-dark text-[13.5px]">${formatRupiah(p.harga)}</span>
        <div class="flex items-center gap-2">
          <a href="${TANI_CIHAWUK_URL}/produk-detail.html?id=${p.id}" target="_blank" rel="noopener" class="text-[11.5px] font-bold text-terra">Lihat Detail</a>
          ${!habis ? `<button onclick="orderWA('${p.nama.replace(/'/g,"\\'")}', '${producerWa}')" class="bg-dark text-white text-[12px] font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5"><i class="fa-brands fa-whatsapp"></i> Pesan</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function renderProductGrid(list, targetId){
  const grid = document.getElementById(targetId);
  if(!grid) return;
  if(list === null){
    grid.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-10">Gagal memuat data produk. Silakan muat ulang halaman.</p>`;
    return;
  }
  if(list.length === 0){
    grid.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-10">Belum ada produk yang tersedia saat ini.</p>`;
    return;
  }
  grid.innerHTML = list.map(renderProductCard).join('');
}

async function loadUmkmView(){
  const grid = document.getElementById('umkm-grid');
  if(grid) grid.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-10"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat produk...</p>`;

  umkmCache = await fetchApprovedProducts();
  renderProductGrid(umkmCache, 'umkm-grid');
  loadUmkmStats();
}

async function loadUmkmStats(){
  try {
    // Hitung produsen aktif langsung dari tabel producers
    const [{ count: jumlahProdusen }, { data: produk }] = await Promise.all([
      taniClient.from('producers').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      taniClient.from('products').select('id, kategori').eq('status', 'APPROVED')
    ]);

    const jumlahProduk   = produk ? produk.length : 0;
    const jumlahKategori = produk ? new Set(produk.map(p => p.kategori).filter(Boolean)).size : 0;

    const elProdusen = document.getElementById('stat-produsen');
    const elProduk   = document.getElementById('stat-produk');
    const elKategori = document.getElementById('stat-kategori');

    if(elProdusen) elProdusen.textContent = jumlahProdusen ?? '–';
    if(elProduk)   elProduk.textContent   = jumlahProduk;
    if(elKategori) elKategori.textContent = jumlahKategori;
  } catch(e) {
    console.warn('[UmkmStats] Gagal memuat statistik:', e.message);
  }
}

function filterProducts(cat, btn){
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if(umkmCache === null) return;
  const list = cat === 'semua' ? umkmCache : umkmCache.filter(p => p.kategori === cat);
  renderProductGrid(list, 'umkm-grid');
}

function orderWA(namaProduk, nomorWa){
  if(!nomorWa){
    showToast('Nomor WhatsApp pelaku usaha belum tersedia.');
    return;
  }
  const pesan = encodeURIComponent(`Halo, saya tertarik dengan produk "${namaProduk}" yang saya lihat di Portal Desa Cihawuk. Apakah masih tersedia?`);
  window.open(`https://wa.me/${nomorWa}?text=${pesan}`, '_blank');
}

/* ================================================================
   WISATA MODULE
================================================================ */
const WISATA_BADGE_CLASS = { 'Wisata Alam':'cat-alam', 'Agrowisata':'cat-agro' };
const WISATA_FALLBACK_IMG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=75';

async function fetchWisata(){
  const { data, error } = await desaClient.from('wisata').select('*').order('urutan', { ascending:true });
  if(error){ console.error('[Wisata] Gagal memuat:', error.message); return null; }
  return data || [];
}

function renderWisataBlock(w, i){
  const reversed = i % 2 === 1;
  const badgeClass = WISATA_BADGE_CLASS[w.badge] || 'cat-lainnya';
  const img = w.foto_url || WISATA_FALLBACK_IMG;
  const tags = w.tags || [];
  return `
  <div class="grid md:grid-cols-2 gap-8 items-center ${reversed ? 'md:[direction:rtl]' : ''}">
    <div class="rounded-2xl overflow-hidden h-72 md:h-80 [direction:ltr]"><img src="${img}" class="w-full h-full object-cover" alt="${w.nama}"></div>
    <div class="[direction:ltr]">
      <span class="cat-badge ${badgeClass} mb-3 inline-block">${w.badge}</span>
      <h3 class="font-display text-2xl font-bold text-dark mb-3">${w.nama}</h3>
      <p class="text-[13.5px] text-[#3c5347] leading-relaxed mb-5">${w.deskripsi}</p>
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="bg-white border border-stone rounded-xl p-3 text-center">
          <i class="fa-solid fa-mountain text-terra text-[13px] mb-1"></i>
          <p class="text-[10px] text-[#6b8577] uppercase tracking-wide">Ketinggian</p>
          <p class="font-bold text-[13px]">${w.ketinggian || '-'}</p>
        </div>
        <div class="bg-white border border-stone rounded-xl p-3 text-center">
          <i class="fa-solid fa-clock text-terra text-[13px] mb-1"></i>
          <p class="text-[10px] text-[#6b8577] uppercase tracking-wide">Durasi</p>
          <p class="font-bold text-[13px]">${w.durasi || '-'}</p>
        </div>
        <div class="bg-white border border-stone rounded-xl p-3 text-center">
          <i class="fa-solid fa-ticket text-terra text-[13px] mb-1"></i>
          <p class="text-[10px] text-[#6b8577] uppercase tracking-wide">Tiket</p>
          <p class="font-bold text-[13px]">${w.tiket || '-'}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        ${tags.map(t => `<span class="text-[11.5px] font-semibold border border-stone rounded-full px-3 py-1.5 text-[#4b6355]">${t}</span>`).join('')}
      </div>
    </div>
  </div>`;
}

async function loadWisataView(){
  const container = document.getElementById('wisata-list');
  if(!container) return;
  container.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-10"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat destinasi wisata...</p>`;

  const list = await fetchWisata();
  if(list === null){ container.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-10">Gagal memuat data wisata. Silakan muat ulang halaman.</p>`; return; }
  if(list.length === 0){ container.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-10">Belum ada destinasi wisata yang ditambahkan.</p>`; return; }

  container.innerHTML = list.map(renderWisataBlock).join('');
}

function renderWisataPreviewCard(w){
  const badgeClass = WISATA_BADGE_CLASS[w.badge] || 'cat-lainnya';
  const img = w.foto_url || WISATA_FALLBACK_IMG;
  return `
  <div class="bg-white rounded-2xl border border-stone overflow-hidden scale-hover cursor-pointer" onclick="showView('wisata')">
    <div class="h-44 overflow-hidden relative"><img src="${img}" class="w-full h-full object-cover" alt="${w.nama}"><span class="cat-badge ${badgeClass} absolute top-3 left-3">${w.badge}</span></div>
    <div class="p-5">
      <h4 class="font-display font-bold text-[16px] mb-2">${w.nama}</h4>
      <p class="text-[13px] text-[#3c5347] mb-3 line-clamp-2">${w.deskripsi}</p>
      <span class="inline-flex items-center gap-2 text-terra font-bold text-[13px]">Lihat Detail <i class="fa-solid fa-arrow-right"></i></span>
    </div>
  </div>`;
}

async function loadBerandaWisataPreview(){
  const target = document.getElementById('beranda-wisata-preview');
  if(target) target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-6"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat destinasi...</p>`;
  const list = await fetchWisata();
  if(target){
    if(list === null){ target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-6">Gagal memuat destinasi wisata.</p>`; return; }
    if(list.length === 0){ target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-6">Belum ada destinasi wisata.</p>`; return; }
    target.innerHTML = list.slice(0,3).map(renderWisataPreviewCard).join('');
  }
}

/* ================================================================
   EDUKASI MODULE — data dari backend desa sendiri (query saat view
   Edukasi dibuka)
================================================================ */
async function fetchEdukasi(){
  const { data, error } = await desaClient.from('edukasi').select('*').order('urutan', { ascending:true });
  if(error){ console.error('[Edukasi] Gagal memuat:', error.message); return null; }
  return data || [];
}

async function loadEdukasiView(){
  const wrap = document.getElementById('edukasi-accordion');
  if(!wrap) return;
  wrap.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-10"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat konten edukasi...</p>`;

  const list = await fetchEdukasi();
  if(list === null){ wrap.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-10">Gagal memuat konten edukasi. Silakan muat ulang halaman.</p>`; return; }
  if(list.length === 0){ wrap.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-10">Belum ada konten edukasi yang ditambahkan.</p>`; return; }

  wrap.innerHTML = list.map((e,i) => `
    <div class="acc-item bg-white rounded-2xl border border-stone overflow-hidden ${i===0 ? 'open':''}" id="acc-${e.id}">
      <button class="w-full flex items-center justify-between gap-4 p-5 text-left" onclick="toggleAccordion('${e.id}')">
        <span class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-full bg-terra/10 text-terra flex items-center justify-center flex-shrink-0"><i class="fa-solid ${e.icon || 'fa-book'}"></i></span>
          <span class="font-display font-bold text-[15.5px] text-dark">${e.judul}</span>
        </span>
        <i class="fa-solid fa-chevron-down acc-caret text-terra"></i>
      </button>
      <div class="acc-panel">
        <div class="px-5 pb-6 pt-0 text-[13.5px] text-[#3c5347] leading-relaxed">
          ${e.foto_url ? `<img src="${e.foto_url}" class="w-full max-h-80 object-cover rounded-xl mb-4 border border-stone shadow-sm" alt="${e.judul}">` : ''}
          ${e.konten}
        </div>
      </div>
    </div>
  `).join('');
}
function toggleAccordion(id){ document.getElementById('acc-' + id).classList.toggle('open'); }

async function loadBerandaEdukasiPreview(){
  const target = document.getElementById('beranda-edukasi-preview');
  if(!target) return;
  target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-white/60 py-6"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat edukasi...</p>`;
  const list = await fetchEdukasi();
  if(!list || list.length === 0){
    target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-white/60 py-6">Belum ada konten edukasi.</p>`;
    return;
  }
  // Tampilkan maks 4 kartu edukasi di beranda
  target.innerHTML = list.slice(0,4).map(e => `
    <div class="bg-white/5 border border-white/10 rounded-2xl p-6 scale-hover flex flex-col gap-2 cursor-pointer hover:bg-white/10 transition-colors" onclick="showView('edukasi')">
      ${e.foto_url
        ? `<img src="${e.foto_url}" class="w-full h-28 object-cover rounded-xl mb-1 border border-white/10" alt="${e.judul}">`
        : `<i class="fa-solid ${e.icon || 'fa-book-open'} text-terra text-2xl mb-1"></i>`}
      <h4 class="text-white font-bold text-[15px] leading-snug">${e.judul}</h4>
      <p class="text-white/55 text-[12.5px] line-clamp-2">${e.ringkasan || e.konten?.substring(0,80) || ''}</p>
    </div>`).join('');
}

/* ================================================================
   ADVOKASI MODULE
================================================================ */
// Alamat email resmi tujuan laporan advokasi warga desa.
const DESA_EMAIL_TUJUAN = 'cihawukpesat@gmail.com';

function handleFormAdvokasi(e){
  e.preventDefault();

  const nama    = document.getElementById('f-nama').value.trim();
  const wa      = document.getElementById('f-wa').value.trim();
  const kategori= document.getElementById('f-kategori').value;
  const lokasi  = document.getElementById('f-lokasi').value.trim();
  const judul   = document.getElementById('f-judul').value.trim();
  const detail  = document.getElementById('f-detail').value.trim();

  if(!nama || !wa || !lokasi || !judul || !detail){
    showToast('Mohon lengkapi semua kolom terlebih dahulu.');
    return;
  }

  const subject = `[Laporan Warga - ${kategori}] ${judul}`;
  const body =
`Nama Lengkap: ${nama}
Nomor WhatsApp: ${wa}
Kategori: ${kategori}
Lokasi Kejadian: ${lokasi}
Judul Laporan: ${judul}

Detail Laporan:
${detail}`;

  const mailtoUrl = `mailto:${DESA_EMAIL_TUJUAN}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoUrl;

  document.getElementById('formAdvokasi').reset();
  showToast('Email laporan telah disiapkan. Aplikasi email Anda akan terbuka untuk melanjutkan pengiriman.');
}
function showToast(msg){
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
}

/* ================================================================
   MAP MODULE
================================================================ */
let mapObj = null;
function initMap(){
  if(mapObj) return;
  mapObj = L.map('map-profil').setView([-7.2023, 107.7562], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(mapObj);
  L.marker([-7.2023, 107.7562]).addTo(mapObj).bindPopup('<b>Kantor Desa Cihawuk</b><br>Pusat pemerintahan desa');
  L.marker([-7.2150, 107.7680]).addTo(mapObj).bindPopup('<b>Puncak Cae</b><br>2.253 mdpl &mdash; jalur wisata lintas pegunungan');
  L.marker([-7.1980, 107.7510]).addTo(mapObj).bindPopup('<b>Kawasan Pertanian &amp; Kebun Teh</b><br>Sentra kentang, wortel, kubis &amp; teh');
  L.marker([-7.2090, 107.7605]).addTo(mapObj).bindPopup('<b>Curug Ciung &amp; Panganten</b><br>Kawasan wisata air terjun');
}
function invalidateMapSize(){ if(mapObj) mapObj.invalidateSize(); }

/* ================================================================
   STRUKTUR STAF MODULE — data dari backend desa sendiri (read-only)
================================================================ */
function stafBoxDark(s){
  const avatarHtml = s.foto_url
    ? `<img src="${s.foto_url}" class="w-16 h-16 rounded-full object-cover border-2 border-terra mx-auto mb-3 shadow-md" alt="${s.nama}">`
    : `<div class="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-2"><i class="fa-solid fa-user-tie text-terra text-lg"></i></div>`;
  return `
  <div class="bg-forest text-white rounded-2xl px-8 py-6 text-center w-full max-w-xs shadow-lg">
    ${avatarHtml}
    <p class="text-[10.5px] uppercase tracking-wide text-white/60 font-semibold">${s.jabatan}</p>
    <p class="font-display font-bold text-[15.5px] mt-1">${s.nama}</p>
  </div>`;
}

function stafBoxLight(s){
  const avatarHtml = s.foto_url
    ? `<img src="${s.foto_url}" class="w-14 h-14 rounded-full object-cover border-2 border-terra/60 mx-auto mb-2 shadow-sm" alt="${s.nama}">`
    : `<div class="w-10 h-10 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto mb-2"><i class="fa-solid fa-user text-terra"></i></div>`;
  return `
  <div class="bg-white border border-stone rounded-2xl px-8 py-5 text-center w-full max-w-xs shadow-sm">
    ${avatarHtml}
    <p class="text-[10.5px] uppercase tracking-wide text-[#5c7568] font-semibold">${s.jabatan}</p>
    <p class="font-display font-bold text-[15px] mt-1 text-dark">${s.nama}</p>
  </div>`;
}

function stafBoxSmall(s){
  const avatarHtml = s.foto_url
    ? `<img src="${s.foto_url}" class="w-12 h-12 rounded-full object-cover border border-terra/40 mx-auto mb-2 shadow-xs" alt="${s.nama}">`
    : `<div class="w-9 h-9 rounded-full bg-stone flex items-center justify-center mx-auto mb-2 text-[#5c7568]"><i class="fa-solid fa-user text-xs"></i></div>`;
  return `
  <div class="bg-white border border-stone rounded-xl px-4 py-4 text-center shadow-xs">
    ${avatarHtml}
    <p class="text-[10px] uppercase tracking-wide text-[#5c7568] font-semibold">${s.jabatan}</p>
    <p class="font-semibold text-[13px] mt-1 text-dark">${s.nama}</p>
  </div>`;
}

async function loadStrukturStaf(){
  const container = document.getElementById('staf-org-chart');
  if(!container) return;
  container.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-6"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat struktur organisasi...</p>`;

  const { data, error } = await desaClient
    .from('staf_desa')
    .select('*')
    .order('tingkat', { ascending:true })
    .order('urutan', { ascending:true });

  if(error){
    console.error('[StrukturStaf] Gagal memuat:', error.message);
    container.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-6">Gagal memuat data struktur organisasi.</p>`;
    return;
  }
  if(!data || data.length === 0){
    container.innerHTML = `<p class="text-center text-[13.5px] text-[#6b8577] py-6">Struktur organisasi belum tersedia.</p>`;
    return;
  }

  // Kelompokkan per tingkat, lalu render: tingkat pertama = box gelap,
  // grup berisi 1 orang di tingkat berikutnya = box terang besar,
  // grup berisi >1 orang = grid box kecil (Kaur/Kasi, dst).
  const groups = {};
  data.forEach(s => { (groups[s.tingkat] = groups[s.tingkat] || []).push(s); });
  const tingkatKeys = Object.keys(groups).map(Number).sort((a,b) => a - b);

  let html = '';
  tingkatKeys.forEach((t, idx) => {
    const items = groups[t];
    if(idx > 0) html += '<div class="org-line"></div>';

    // Kelompokkan lagi berdasarkan nilai `kelompok`
    const clusters = {};
    items.forEach(s => {
      const k = (s.kelompok || '').trim();
      (clusters[k] = clusters[k] || []).push(s);
    });
    const clusterKeys = Object.keys(clusters);

    // Jika dalam 1 tingkat hanya ada 1 kelompok (atau semua kosong/null)
    if (clusterKeys.length <= 1) {
      if (items.length === 1) {
        html += idx === 0 ? stafBoxDark(items[0]) : stafBoxLight(items[0]);
      } else {
        html += `<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-3xl">${items.map(stafBoxSmall).join('')}</div>`;
      }
    } else {
      // Ada lebih dari 1 kelompok berbeda di tingkat yang sama (struktur bercabang)
      let gridColClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl';
      if (clusterKeys.length === 2) gridColClass = 'grid-cols-1 md:grid-cols-2 max-w-3xl';
      else if (clusterKeys.length === 3) gridColClass = 'grid-cols-1 md:grid-cols-3 max-w-5xl';

      const clusterHtml = clusterKeys.map(k => {
        const clusterItems = clusters[k];
        const titleHtml = k ? `<p class="text-[11px] font-bold uppercase tracking-wider text-terra text-center mb-3">${k}</p>` : '';
        const cardsHtml = clusterItems.length === 1
          ? stafBoxLight(clusterItems[0])
          : `<div class="grid grid-cols-1 gap-3 w-full">${clusterItems.map(stafBoxSmall).join('')}</div>`;

        return `
          <div class="flex flex-col items-center w-full">
            ${titleHtml}
            ${cardsHtml}
          </div>
        `;
      }).join('');

      html += `<div class="grid ${gridColClass} gap-6 w-full items-start">${clusterHtml}</div>`;
    }
  });

  container.innerHTML = html;
}

/* ================================================================
   BERITA MODULE
================================================================ */
let beritaCache = null;

async function fetchBerita(){
  const { data, error } = await desaClient
    .from('berita')
    .select('*')
    .order('created_at', { ascending:false });

  if(error){
    console.error('[Berita] Gagal memuat berita:', error.message);
    return null;
  }
  return data || [];
}

// Map untuk menyimpan data berita — lebih aman dari inline JSON di onclick
const _beritaMap = {};

function renderBeritaCard(b){
  const fotoSrc = b.foto_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=70';
  const tgl = b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const ringkasanText = b.ringkasan || (b.konten ? b.konten.substring(0, 120) + '...' : '');
  // Simpan objek di map, gunakan ID sebagai kunci agar tidak ada risiko karakter khusus di onclick
  _beritaMap[b.id] = b;

  return `
  <div class="bg-white rounded-2xl border border-stone overflow-hidden scale-hover flex flex-col h-full shadow-xs">
    <div class="h-48 overflow-hidden relative">
      <img src="${fotoSrc}" class="w-full h-full object-cover" alt="${b.judul.replace(/"/g,'&quot;')}">
      <span class="cat-badge bg-terra text-white absolute top-3 left-3 shadow-md">${b.kategori || 'Berita'}</span>
    </div>
    <div class="p-5 flex flex-col flex-1">
      <div class="flex items-center gap-2 text-[11.5px] text-[#6b8577] mb-2 font-medium">
        <span><i class="fa-regular fa-calendar mr-1"></i>${tgl}</span>
        <span>&middot;</span>
        <span><i class="fa-regular fa-user mr-1"></i>${b.penulis || 'Admin'}</span>
      </div>
      <h3 class="font-display font-bold text-[17px] text-dark mb-2.5 line-clamp-2 leading-snug">${b.judul}</h3>
      <p class="text-[13px] text-[#3c5347] mb-4 line-clamp-3 leading-relaxed flex-1">${ringkasanText}</p>
      <button onclick="openBeritaModalDetail('${b.id}')" class="btn-terra w-full py-2.5 rounded-xl text-[13px] flex items-center justify-center gap-2 mt-auto">
        Baca Selengkapnya <i class="fa-solid fa-arrow-right text-[11px]"></i>
      </button>
    </div>
  </div>`;
}

async function loadBeritaView(){
  const grid = document.getElementById('berita-grid');
  if(!grid) return;
  grid.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-10"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat berita...</p>`;

  beritaCache = await fetchBerita();
  renderBeritaGrid(beritaCache);
}

function renderBeritaGrid(list){
  const grid = document.getElementById('berita-grid');
  if(!grid) return;
  if(list === null){
    grid.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-10">Gagal memuat berita desa. Silakan muat ulang halaman.</p>`;
    return;
  }
  if(list.length === 0){
    grid.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-10">Belum ada berita yang diterbitkan saat ini.</p>`;
    return;
  }
  grid.innerHTML = list.map(renderBeritaCard).join('');
}

function filterBerita(kategori, btn){
  document.querySelectorAll('.berita-filter-btn').forEach(b => {
    b.classList.remove('bg-dark','text-white','border-dark');
    b.classList.add('bg-white','text-[#4b6355]','border-stone');
  });
  btn.classList.remove('bg-white','text-[#4b6355]','border-stone');
  btn.classList.add('bg-dark','text-white','border-dark');

  if(!beritaCache) return;
  if(kategori === 'semua'){
    renderBeritaGrid(beritaCache);
  } else {
    const filtered = beritaCache.filter(b => b.kategori === kategori);
    renderBeritaGrid(filtered);
  }
}

function openBeritaModalDetail(id){
  const b = _beritaMap[id];
  if(!b) return;
  const target = document.getElementById('beritaDetailContent');
  const tgl = b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const fotoHtml = b.foto_url ? `<div class="rounded-2xl overflow-hidden mb-6 max-h-96 border border-stone shadow-xs"><img src="${b.foto_url}" class="w-full h-full object-cover" alt="${b.judul}"></div>` : '';

  target.innerHTML = `
    <span class="cat-badge bg-terra text-white mb-3 inline-block">${b.kategori || 'Berita'}</span>
    <h2 class="font-display font-bold text-2xl md:text-3xl text-dark mb-3 leading-tight">${b.judul}</h2>
    <div class="flex items-center gap-3 text-[12.5px] text-[#6b8577] mb-6 pb-4 border-b border-stone">
      <span><i class="fa-regular fa-calendar mr-1.5 text-terra"></i>${tgl}</span>
      <span>&middot;</span>
      <span><i class="fa-regular fa-user mr-1.5 text-terra"></i>${b.penulis || 'Redaksi Desa Cihawuk'}</span>
    </div>
    ${fotoHtml}
    <div class="text-[14px] text-[#2d4237] leading-relaxed space-y-4">
      ${b.konten.replace(/\n/g, '<br>')}
    </div>
  `;

  document.getElementById('modalBeritaDetail').classList.add('active');
}

function closeBeritaModalDetail(){
  document.getElementById('modalBeritaDetail').classList.remove('active');
}

async function loadBerandaBeritaPreview(){
  const target = document.getElementById('beranda-berita-preview');
  if(!target) return;
  target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-6"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat berita...</p>`;
  const list = await fetchBerita();
  if(!list || list.length === 0){
    target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-6">Belum ada berita terbaru.</p>`;
    return;
  }
  target.innerHTML = list.slice(0, 3).map(renderBeritaCard).join('');
}

/* ================================================================
   REALTIME SYNCHRONIZATION (Supabase Realtime)
================================================================ */
function initRealtimeSubscriptions(){
  try {
    // Realtime listener untuk data profil desa (Wisata, Edukasi, Berita, Staf)
    desaClient
      .channel('realtime-desa-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wisata' }, () => {
        loadBerandaWisataPreview();
        const v = document.getElementById('view-wisata');
        if(v && v.classList.contains('active')) loadWisataView();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'edukasi' }, () => {
        loadBerandaEdukasiPreview();
        const v = document.getElementById('view-edukasi');
        if(v && v.classList.contains('active')) loadEdukasiView();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'berita' }, () => {
        loadBerandaBeritaPreview();
        const v = document.getElementById('view-berita');
        if(v && v.classList.contains('active')) loadBeritaView();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staf_desa' }, () => {
        const v = document.getElementById('view-profil');
        if(v && v.classList.contains('active')) loadStrukturStaf();
      })
      .subscribe();

    // Realtime listener untuk data UMKM & Produsen Tani Cihawuk
    taniClient
      .channel('realtime-tani-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadBerandaUmkmPreview();
        loadUmkmStats();
        const v = document.getElementById('view-umkm');
        if(v && v.classList.contains('active')) loadUmkmView();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'producers' }, () => {
        loadUmkmStats();
        const v = document.getElementById('view-umkm');
        if(v && v.classList.contains('active')) loadUmkmView();
      })
      .subscribe();
  } catch(err) {
    console.warn('[Realtime] Gagal inisialisasi subscription:', err.message);
  }
}

/* ================================================================
   INIT
================================================================ */
async function loadBerandaUmkmPreview(){
  const target = document.getElementById('beranda-umkm-preview');
  if(target) target.innerHTML = `<p class="col-span-full text-center text-[13.5px] text-[#6b8577] py-6"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat produk...</p>`;
  const list = await fetchApprovedProducts();
  renderProductGrid(list ? list.slice(0,4) : list, 'beranda-umkm-preview');
}

document.addEventListener('DOMContentLoaded', () => {
  loadBerandaUmkmPreview();
  loadBerandaWisataPreview();
  loadBerandaEdukasiPreview();
  loadBerandaBeritaPreview();

  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => filterProducts(btn.getAttribute('data-cat'), btn)));
  document.getElementById('formAdvokasi').addEventListener('submit', handleFormAdvokasi);

  handleHashNavigation();
  initRealtimeSubscriptions();
});
