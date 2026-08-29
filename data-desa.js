/* ============================================================
   DESA CIHAWUK — Layer Manajemen Data (Admin & Backend)
   ============================================================ */
(function(){
  const client = window.DesaSupabase;
  if (!client) {
    console.error('[DesaData] window.DesaSupabase belum tersedia. Pastikan supabase-desa.js dimuat lebih dulu.');
  }

  /**
   * Helper untuk mengunggah gambar/foto ke Supabase Storage (bucket: desa-assets).
   * Berfungsi dengan fallback ke Data URL (Base64) apabila Storage Bucket belum dibuat/diizinkan.
   */
  async function uploadFotoFile(file, folder = 'uploads') {
    if (!file) return null;

    if (client && client.storage) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { data, error } = await client.storage
          .from('desa-assets')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: publicUrlData } = client.storage.from('desa-assets').getPublicUrl(fileName);
          if (publicUrlData && publicUrlData.publicUrl) {
            return publicUrlData.publicUrl;
          }
        } else {
          console.warn('[DesaData] Supabase Storage upload error, mengalihkan ke Base64:', error ? error.message : 'No data');
        }
      } catch (err) {
        console.warn('[DesaData] Storage exception, mengalihkan ke Base64:', err);
      }
    }

    // Fallback: Konversi gambar ke Data URL (Base64 string) jika Storage belum siap
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // -----------------------------------------------------------
  // 1. STAF DESA
  // -----------------------------------------------------------
  async function getStafDesa() {
    const { data, error } = await client
      .from('staf_desa')
      .select('*')
      .order('tingkat', { ascending: true })
      .order('urutan', { ascending: true });

    if (error) {
      console.error('[DesaData] getStafDesa:', error.message);
      return [];
    }
    return data || [];
  }

  async function saveStaf(item) {
    const payload = {
      nama: item.nama,
      jabatan: item.jabatan,
      foto_url: item.foto_url || null,
      tingkat: Number(item.tingkat),
      urutan: Number(item.urutan)
    };

    if (item.id) {
      const { error } = await client.from('staf_desa').update(payload).eq('id', item.id);
      if (error) {
        console.error('[DesaData] saveStaf (update):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    } else {
      const { error } = await client.from('staf_desa').insert(payload);
      if (error) {
        console.error('[DesaData] saveStaf (insert):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    }
  }

  async function deleteStaf(id) {
    const { error } = await client.from('staf_desa').delete().eq('id', id);
    if (error) {
      console.error('[DesaData] deleteStaf:', error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  // -----------------------------------------------------------
  // 2. EDUKASI
  // -----------------------------------------------------------
  async function getEdukasi() {
    const { data, error } = await client
      .from('edukasi')
      .select('*')
      .order('urutan', { ascending: true });

    if (error) {
      console.error('[DesaData] getEdukasi:', error.message);
      return [];
    }
    return data || [];
  }

  async function saveEdukasi(item) {
    const payload = {
      judul: item.judul,
      icon: item.icon || 'fa-circle-info',
      konten: item.konten,
      foto_url: item.foto_url || null,
      urutan: Number(item.urutan)
    };

    if (item.id) {
      const { error } = await client.from('edukasi').update(payload).eq('id', item.id);
      if (error) {
        console.error('[DesaData] saveEdukasi (update):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    } else {
      const { error } = await client.from('edukasi').insert(payload);
      if (error) {
        console.error('[DesaData] saveEdukasi (insert):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    }
  }

  async function deleteEdukasi(id) {
    const { error } = await client.from('edukasi').delete().eq('id', id);
    if (error) {
      console.error('[DesaData] deleteEdukasi:', error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  // -----------------------------------------------------------
  // 3. WISATA
  // -----------------------------------------------------------
  async function getWisata() {
    const { data, error } = await client
      .from('wisata')
      .select('*')
      .order('urutan', { ascending: true });

    if (error) {
      console.error('[DesaData] getWisata:', error.message);
      return [];
    }
    return data || [];
  }

  async function saveWisata(item) {
    const payload = {
      nama: item.nama,
      foto_url: item.foto_url || null,
      badge: item.badge,
      deskripsi: item.deskripsi,
      ketinggian: item.ketinggian,
      durasi: item.durasi,
      tiket: item.tiket,
      tags: item.tags || [],
      urutan: Number(item.urutan)
    };

    if (item.id) {
      const { error } = await client.from('wisata').update(payload).eq('id', item.id);
      if (error) {
        console.error('[DesaData] saveWisata (update):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    } else {
      const { error } = await client.from('wisata').insert(payload);
      if (error) {
        console.error('[DesaData] saveWisata (insert):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    }
  }

  async function deleteWisata(id) {
    const { error } = await client.from('wisata').delete().eq('id', id);
    if (error) {
      console.error('[DesaData] deleteWisata:', error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  // -----------------------------------------------------------
  // 4. BERITA DESA
  // -----------------------------------------------------------
  async function getBerita() {
    const { data, error } = await client
      .from('berita')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DesaData] getBerita:', error.message);
      return [];
    }
    return data || [];
  }

  async function saveBerita(item) {
    const payload = {
      judul: item.judul,
      ringkasan: item.ringkasan || null,
      konten: item.konten,
      foto_url: item.foto_url || null,
      kategori: item.kategori || 'Kegiatan Desa',
      penulis: item.penulis || 'Humas Desa Cihawuk',
      urutan: Number(item.urutan || 0)
    };

    if (item.id) {
      const { error } = await client.from('berita').update(payload).eq('id', item.id);
      if (error) {
        console.error('[DesaData] saveBerita (update):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    } else {
      const { error } = await client.from('berita').insert(payload);
      if (error) {
        console.error('[DesaData] saveBerita (insert):', error.message);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    }
  }

  async function deleteBerita(id) {
    const { error } = await client.from('berita').delete().eq('id', id);
    if (error) {
      console.error('[DesaData] deleteBerita:', error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  // Export Modul DesaData
  window.DesaData = {
    uploadFotoFile,
    getStafDesa, saveStaf, deleteStaf,
    getEdukasi, saveEdukasi, deleteEdukasi,
    getWisata, saveWisata, deleteWisata,
    getBerita, saveBerita, deleteBerita
  };
})();
