// Helper Preview File Gambar
function setupImagePreview(fileInputId, imgId, placeholderId) {
  const fileInput = document.getElementById(fileInputId);
  const img = document.getElementById(imgId);
  const placeholder = document.getElementById(placeholderId);

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        img.src = evt.target.result;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    }
  });
}

function setPreviewUrl(imgId, placeholderId, url) {
  const img = document.getElementById(imgId);
  const placeholder = document.getElementById(placeholderId);
  if (url) {
    img.src = url;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else {
    img.src = '';
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }
}

// Switch Tab Handler
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

/* -----------------------------------------------------------
   1. STRUKTUR STAF DESA
   ----------------------------------------------------------- */
function openStafModal(staf) {
  document.getElementById('stafForm').reset();
  document.getElementById('stafFormError').classList.add('hidden');

  if (staf) {
    document.getElementById('stafModalTitle').textContent = 'Edit Data Staf';
    document.getElementById('staf-id').value = staf.id;
    document.getElementById('staf-nama').value = staf.nama;
    document.getElementById('staf-jabatan').value = staf.jabatan;
    document.getElementById('staf-tingkat').value = staf.tingkat;
    document.getElementById('staf-urutan').value = staf.urutan;
    document.getElementById('staf-foto-existing').value = staf.foto_url || '';
    setPreviewUrl('stafPreviewImg', 'stafPreviewPlaceholder', staf.foto_url);
  } else {
    document.getElementById('stafModalTitle').textContent = 'Tambah Staf Baru';
    document.getElementById('staf-id').value = '';
    document.getElementById('staf-foto-existing').value = '';
    setPreviewUrl('stafPreviewImg', 'stafPreviewPlaceholder', null);
  }
  document.getElementById('stafModal').classList.add('active');
}

function closeStafModal() {
  document.getElementById('stafModal').classList.remove('active');
}

async function renderStafTable() {
  const list = await window.DesaData.getStafDesa();
  const tbody = document.getElementById('stafTableBody');
  const empty = document.getElementById('stafEmptyState');

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = list.map(s => {
    const avatarHtml = s.foto_url
      ? `<img src="${s.foto_url}" class="w-10 h-10 rounded-full object-cover border border-stone" alt="${s.nama}">`
      : `<div class="w-10 h-10 rounded-full bg-forest/10 text-forest font-bold flex items-center justify-center text-xs"><i class="fa-solid fa-user"></i></div>`;

    return `
    <tr class="border-t border-stone hover:bg-stone/20 transition">
      <td class="px-4 py-3">${avatarHtml}</td>
      <td class="px-4 py-3 font-semibold text-dark">${s.nama}</td>
      <td class="px-4 py-3 text-[#3c5347]">${s.jabatan}</td>
      <td class="px-4 py-3 text-[#3c5347]"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone/70">Tingkat ${s.tingkat}</span></td>
      <td class="px-4 py-3 text-[#3c5347]">${s.urutan}</td>
      <td class="px-4 py-3 text-right">
        <button onclick='openStafModal(${JSON.stringify(s)})' class="text-terra font-bold text-[12.5px] hover:underline mr-3"><i class="fa-solid fa-pen-to-square mr-1"></i>Edit</button>
        <button onclick="handleDeleteStaf('${s.id}')" class="text-red-500 font-bold text-[12.5px] hover:underline"><i class="fa-solid fa-trash mr-1"></i>Hapus</button>
      </td>
    </tr>`;
  }).join('');
}

async function handleDeleteStaf(id) {
  if (!confirm('Hapus data staf ini?')) return;
  const result = await window.DesaData.deleteStaf(id);
  if (result.ok) { renderStafTable(); }
  else { alert('Gagal menghapus: ' + result.message); }
}

document.getElementById('stafForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('stafSubmitBtn');
  const errBox = document.getElementById('stafFormError');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const fileInput = document.getElementById('staf-foto-file');
    let fotoUrl = document.getElementById('staf-foto-existing').value || null;

    if (fileInput.files && fileInput.files[0]) {
      btn.textContent = 'Mengunggah Foto...';
      const uploadedUrl = await window.DesaData.uploadFotoFile(fileInput.files[0], 'staf');
      if (uploadedUrl) fotoUrl = uploadedUrl;
    }

    const item = {
      id: document.getElementById('staf-id').value || null,
      nama: document.getElementById('staf-nama').value.trim(),
      jabatan: document.getElementById('staf-jabatan').value.trim(),
      foto_url: fotoUrl,
      tingkat: document.getElementById('staf-tingkat').value,
      urutan: document.getElementById('staf-urutan').value
    };

    const result = await window.DesaData.saveStaf(item);
    if (result.ok) {
      closeStafModal();
      renderStafTable();
    } else {
      errBox.textContent = 'Gagal menyimpan: ' + result.message;
      errBox.classList.remove('hidden');
    }
  } catch (err) {
    errBox.textContent = 'Terjadi kesalahan: ' + err.message;
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
});

/* -----------------------------------------------------------
   2. KONTEN EDUKASI
   ----------------------------------------------------------- */
function openEdukasiModal(item) {
  document.getElementById('edukasiForm').reset();
  document.getElementById('edukasiFormError').classList.add('hidden');

  if (item) {
    document.getElementById('edukasiModalTitle').textContent = 'Edit Topik Edukasi';
    document.getElementById('edukasi-id').value = item.id;
    document.getElementById('edukasi-judul').value = item.judul;
    document.getElementById('edukasi-icon').value = item.icon;
    document.getElementById('edukasi-urutan').value = item.urutan;
    document.getElementById('edukasi-konten').value = item.konten;
    document.getElementById('edukasi-foto-existing').value = item.foto_url || '';
    setPreviewUrl('edukasiPreviewImg', 'edukasiPreviewPlaceholder', item.foto_url);
  } else {
    document.getElementById('edukasiModalTitle').textContent = 'Tambah Topik Edukasi Baru';
    document.getElementById('edukasi-id').value = '';
    document.getElementById('edukasi-foto-existing').value = '';
    setPreviewUrl('edukasiPreviewImg', 'edukasiPreviewPlaceholder', null);
  }
  document.getElementById('edukasiModal').classList.add('active');
}

function closeEdukasiModal() {
  document.getElementById('edukasiModal').classList.remove('active');
}

async function renderEdukasiTable() {
  const list = await window.DesaData.getEdukasi();
  const tbody = document.getElementById('edukasiTableBody');
  const empty = document.getElementById('edukasiEmptyState');

  if (list.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = list.map(e => {
    const imgHtml = e.foto_url
      ? `<img src="${e.foto_url}" class="w-12 h-9 rounded-lg object-cover border border-stone" alt="${e.judul}">`
      : `<div class="w-12 h-9 rounded-lg bg-terra/10 text-terra flex items-center justify-center text-xs"><i class="fa-solid ${e.icon || 'fa-book'}"></i></div>`;

    return `
    <tr class="border-t border-stone hover:bg-stone/20 transition">
      <td class="px-4 py-3">${imgHtml}</td>
      <td class="px-4 py-3 font-semibold text-dark">${e.judul}</td>
      <td class="px-4 py-3 text-[#3c5347]"><i class="fa-solid ${e.icon}"></i> ${e.icon}</td>
      <td class="px-4 py-3 text-[#3c5347]">${e.urutan}</td>
      <td class="px-4 py-3 text-right">
        <button onclick='openEdukasiModal(${JSON.stringify(e)})' class="text-terra font-bold text-[12.5px] hover:underline mr-3"><i class="fa-solid fa-pen-to-square mr-1"></i>Edit</button>
        <button onclick="handleDeleteEdukasi('${e.id}')" class="text-red-500 font-bold text-[12.5px] hover:underline"><i class="fa-solid fa-trash mr-1"></i>Hapus</button>
      </td>
    </tr>`;
  }).join('');
}

async function handleDeleteEdukasi(id) {
  if (!confirm('Hapus topik edukasi ini?')) return;
  const result = await window.DesaData.deleteEdukasi(id);
  if (result.ok) { renderEdukasiTable(); } else { alert('Gagal menghapus: ' + result.message); }
}

document.getElementById('edukasiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('edukasiSubmitBtn');
  const errBox = document.getElementById('edukasiFormError');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const fileInput = document.getElementById('edukasi-foto-file');
    let fotoUrl = document.getElementById('edukasi-foto-existing').value || null;

    if (fileInput.files && fileInput.files[0]) {
      btn.textContent = 'Mengunggah Sampul...';
      const uploadedUrl = await window.DesaData.uploadFotoFile(fileInput.files[0], 'edukasi');
      if (uploadedUrl) fotoUrl = uploadedUrl;
    }

    const item = {
      id: document.getElementById('edukasi-id').value || null,
      judul: document.getElementById('edukasi-judul').value.trim(),
      icon: document.getElementById('edukasi-icon').value.trim(),
      foto_url: fotoUrl,
      urutan: document.getElementById('edukasi-urutan').value,
      konten: document.getElementById('edukasi-konten').value.trim()
    };

    const result = await window.DesaData.saveEdukasi(item);
    if (result.ok) { closeEdukasiModal(); renderEdukasiTable(); }
    else {
      errBox.textContent = 'Gagal menyimpan: ' + result.message;
      errBox.classList.remove('hidden');
    }
  } catch (err) {
    errBox.textContent = 'Terjadi kesalahan: ' + err.message;
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
});

/* -----------------------------------------------------------
   3. DESTINASI WISATA
   ----------------------------------------------------------- */
function openWisataModal(item) {
  document.getElementById('wisataForm').reset();
  document.getElementById('wisataFormError').classList.add('hidden');

  if (item) {
    document.getElementById('wisataModalTitle').textContent = 'Edit Destinasi Wisata';
    document.getElementById('wisata-id').value = item.id;
    document.getElementById('wisata-nama').value = item.nama;
    document.getElementById('wisata-badge').value = item.badge;
    document.getElementById('wisata-urutan').value = item.urutan;
    document.getElementById('wisata-deskripsi').value = item.deskripsi;
    document.getElementById('wisata-ketinggian').value = item.ketinggian || '';
    document.getElementById('wisata-durasi').value = item.durasi || '';
    document.getElementById('wisata-tiket').value = item.tiket || '';
    document.getElementById('wisata-tags').value = (item.tags || []).join(', ');
    document.getElementById('wisata-foto-existing').value = item.foto_url || '';
    setPreviewUrl('wisataPreviewImg', 'wisataPreviewPlaceholder', item.foto_url);
  } else {
    document.getElementById('wisataModalTitle').textContent = 'Tambah Destinasi Baru';
    document.getElementById('wisata-id').value = '';
    document.getElementById('wisata-foto-existing').value = '';
    setPreviewUrl('wisataPreviewImg', 'wisataPreviewPlaceholder', null);
  }
  document.getElementById('wisataModal').classList.add('active');
}

function closeWisataModal() {
  document.getElementById('wisataModal').classList.remove('active');
}

async function renderWisataTable() {
  const list = await window.DesaData.getWisata();
  const tbody = document.getElementById('wisataTableBody');
  const empty = document.getElementById('wisataEmptyState');

  if (list.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = list.map(w => {
    const imgHtml = w.foto_url
      ? `<img src="${w.foto_url}" class="w-14 h-10 rounded-lg object-cover border border-stone" alt="${w.nama}">`
      : `<div class="w-14 h-10 rounded-lg bg-stone/70 text-dark flex items-center justify-center text-xs"><i class="fa-solid fa-mountain-sun"></i></div>`;

    return `
    <tr class="border-t border-stone hover:bg-stone/20 transition">
      <td class="px-4 py-3">${imgHtml}</td>
      <td class="px-4 py-3 font-semibold text-dark">${w.nama}</td>
      <td class="px-4 py-3 text-[#3c5347]"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-forest/10 text-forest">${w.badge}</span></td>
      <td class="px-4 py-3 text-[#3c5347]">${w.tiket || '-'}</td>
      <td class="px-4 py-3 text-[#3c5347]">${w.urutan}</td>
      <td class="px-4 py-3 text-right">
        <button onclick='openWisataModal(${JSON.stringify(w)})' class="text-terra font-bold text-[12.5px] hover:underline mr-3"><i class="fa-solid fa-pen-to-square mr-1"></i>Edit</button>
        <button onclick="handleDeleteWisata('${w.id}')" class="text-red-500 font-bold text-[12.5px] hover:underline"><i class="fa-solid fa-trash mr-1"></i>Hapus</button>
      </td>
    </tr>`;
  }).join('');
}

async function handleDeleteWisata(id) {
  if (!confirm('Hapus destinasi wisata ini?')) return;
  const result = await window.DesaData.deleteWisata(id);
  if (result.ok) { renderWisataTable(); } else { alert('Gagal menghapus: ' + result.message); }
}

document.getElementById('wisataForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('wisataSubmitBtn');
  const errBox = document.getElementById('wisataFormError');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const fileInput = document.getElementById('wisata-foto-file');
    let fotoUrl = document.getElementById('wisata-foto-existing').value || null;

    if (fileInput.files && fileInput.files[0]) {
      btn.textContent = 'Mengunggah Foto Wisata...';
      const uploadedUrl = await window.DesaData.uploadFotoFile(fileInput.files[0], 'wisata');
      if (uploadedUrl) fotoUrl = uploadedUrl;
    }

    const tagsRaw = document.getElementById('wisata-tags').value.trim();
    const item = {
      id: document.getElementById('wisata-id').value || null,
      nama: document.getElementById('wisata-nama').value.trim(),
      foto_url: fotoUrl,
      badge: document.getElementById('wisata-badge').value,
      urutan: document.getElementById('wisata-urutan').value,
      deskripsi: document.getElementById('wisata-deskripsi').value.trim(),
      ketinggian: document.getElementById('wisata-ketinggian').value.trim(),
      durasi: document.getElementById('wisata-durasi').value.trim(),
      tiket: document.getElementById('wisata-tiket').value.trim(),
      tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    const result = await window.DesaData.saveWisata(item);
    if (result.ok) { closeWisataModal(); renderWisataTable(); }
    else {
      errBox.textContent = 'Gagal menyimpan: ' + result.message;
      errBox.classList.remove('hidden');
    }
  } catch (err) {
    errBox.textContent = 'Terjadi kesalahan: ' + err.message;
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
});

/* -----------------------------------------------------------
   4. BERITA DESA
   ----------------------------------------------------------- */
function openBeritaModal(item) {
  document.getElementById('beritaForm').reset();
  document.getElementById('beritaFormError').classList.add('hidden');

  if (item) {
    document.getElementById('beritaModalTitle').textContent = 'Edit Artikel Berita';
    document.getElementById('berita-id').value = item.id;
    document.getElementById('berita-judul').value = item.judul;
    document.getElementById('berita-kategori').value = item.kategori || 'Kegiatan Desa';
    document.getElementById('berita-penulis').value = item.penulis || 'Humas Desa Cihawuk';
    document.getElementById('berita-ringkasan').value = item.ringkasan || '';
    document.getElementById('berita-konten').value = item.konten || '';
    document.getElementById('berita-foto-existing').value = item.foto_url || '';
    setPreviewUrl('beritaPreviewImg', 'beritaPreviewPlaceholder', item.foto_url);
  } else {
    document.getElementById('beritaModalTitle').textContent = 'Tambah Berita Baru';
    document.getElementById('berita-id').value = '';
    document.getElementById('berita-foto-existing').value = '';
    document.getElementById('berita-penulis').value = 'Humas Desa Cihawuk';
    setPreviewUrl('beritaPreviewImg', 'beritaPreviewPlaceholder', null);
  }
  document.getElementById('beritaModal').classList.add('active');
}

function closeBeritaModal() {
  document.getElementById('beritaModal').classList.remove('active');
}

async function renderBeritaTable() {
  const list = await window.DesaData.getBerita();
  const tbody = document.getElementById('beritaTableBody');
  const empty = document.getElementById('beritaEmptyState');

  if (list.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = list.map(b => {
    const imgHtml = b.foto_url
      ? `<img src="${b.foto_url}" class="w-14 h-10 rounded-lg object-cover border border-stone" alt="${b.judul}">`
      : `<div class="w-14 h-10 rounded-lg bg-terra/10 text-terra flex items-center justify-center text-xs"><i class="fa-solid fa-newspaper"></i></div>`;

    const tgl = b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    return `
    <tr class="border-t border-stone hover:bg-stone/20 transition">
      <td class="px-4 py-3">${imgHtml}</td>
      <td class="px-4 py-3 font-semibold text-dark max-w-xs truncate">${b.judul}</td>
      <td class="px-4 py-3 text-[#3c5347]"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cream text-terra border border-stone">${b.kategori || 'Berita'}</span></td>
      <td class="px-4 py-3 text-[#3c5347] text-[12.5px]">${b.penulis || 'Admin'}</td>
      <td class="px-4 py-3 text-[#3c5347] text-[12.5px]">${tgl}</td>
      <td class="px-4 py-3 text-right">
        <button onclick='openBeritaModal(${JSON.stringify(b)})' class="text-terra font-bold text-[12.5px] hover:underline mr-3"><i class="fa-solid fa-pen-to-square mr-1"></i>Edit</button>
        <button onclick="handleDeleteBerita('${b.id}')" class="text-red-500 font-bold text-[12.5px] hover:underline"><i class="fa-solid fa-trash mr-1"></i>Hapus</button>
      </td>
    </tr>`;
  }).join('');
}

async function handleDeleteBerita(id) {
  if (!confirm('Hapus artikel berita ini?')) return;
  const result = await window.DesaData.deleteBerita(id);
  if (result.ok) { renderBeritaTable(); } else { alert('Gagal menghapus: ' + result.message); }
}

document.getElementById('beritaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('beritaSubmitBtn');
  const errBox = document.getElementById('beritaFormError');
  errBox.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const fileInput = document.getElementById('berita-foto-file');
    let fotoUrl = document.getElementById('berita-foto-existing').value || null;

    if (fileInput.files && fileInput.files[0]) {
      btn.textContent = 'Mengunggah Sampul Berita...';
      const uploadedUrl = await window.DesaData.uploadFotoFile(fileInput.files[0], 'berita');
      if (uploadedUrl) fotoUrl = uploadedUrl;
    }

    const item = {
      id: document.getElementById('berita-id').value || null,
      judul: document.getElementById('berita-judul').value.trim(),
      foto_url: fotoUrl,
      kategori: document.getElementById('berita-kategori').value,
      penulis: document.getElementById('berita-penulis').value.trim(),
      ringkasan: document.getElementById('berita-ringkasan').value.trim(),
      konten: document.getElementById('berita-konten').value.trim()
    };

    const result = await window.DesaData.saveBerita(item);
    if (result.ok) { closeBeritaModal(); renderBeritaTable(); }
    else {
      errBox.textContent = 'Gagal menyimpan: ' + result.message;
      errBox.classList.remove('hidden');
    }
  } catch (err) {
    errBox.textContent = 'Terjadi kesalahan: ' + err.message;
    errBox.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Berita';
  }
});

// INIT
(async () => {
  // Register Image Preview listeners
  setupImagePreview('staf-foto-file', 'stafPreviewImg', 'stafPreviewPlaceholder');
  setupImagePreview('edukasi-foto-file', 'edukasiPreviewImg', 'edukasiPreviewPlaceholder');
  setupImagePreview('wisata-foto-file', 'wisataPreviewImg', 'wisataPreviewPlaceholder');
  setupImagePreview('berita-foto-file', 'beritaPreviewImg', 'beritaPreviewPlaceholder');

  // Auth verification
  const admin = await window.DesaAuth.requireAdmin();
  if (!admin) return;

  document.getElementById('adminName').textContent = 'Admin: ' + admin.nama;
  document.getElementById('dashboardContent').classList.remove('hidden');

  renderStafTable();
  renderEdukasiTable();
  renderWisataTable();
  renderBeritaTable();
})();
