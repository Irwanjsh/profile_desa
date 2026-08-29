/* ============================================================
   DESA CIHAWUK — Modul Autentikasi Admin (auth-desa.js)

   Fungsi:
   - Menangani login admin via Supabase Auth.
   - Verifikasi otorisasi user ID ke tabel public.staf_admin.
   - Menangani logout & pembatasan akses halaman dashboard.
   ============================================================ */
(function(){
  const client = window.DesaSupabase;
  if (!client) {
    console.error('[DesaAuth] window.DesaSupabase belum tersedia. Pastikan supabase-desa.js dimuat lebih dulu.');
  }

  /**
   * Mengautentikasi email & password user via Supabase Auth,
   * lalu memverifikasi apakah User ID pengguna terdaftar sebagai admin di tabel staf_admin.
   */
  async function login(email, password) {
    if (!client) {
      return { ok: false, message: 'Koneksi ke Supabase belum siap. Silakan muat ulang halaman.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, message: 'Email atau password salah.' };
      }

      const userId = data.user.id;
      console.log('[DesaAuth] Logged in Auth User ID:', userId);

      const { data: adminRow, error: adminErr } = await client
        .from('staf_admin')
        .select('user_id, nama')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminErr) {
        console.error('[DesaAuth] Error checking staf_admin:', adminErr);
        await client.auth.signOut();
        return { ok: false, message: 'Gagal verifikasi database: ' + (adminErr.message || adminErr.details || 'RLS / Permission Error') };
      }

      if (!adminRow) {
        console.warn('[DesaAuth] User ID (' + userId + ') tidak ditemukan di tabel staf_admin');
        await client.auth.signOut();
        return { ok: false, message: 'Akun ini tidak memiliki akses admin. (User ID ' + userId + ' belum terdaftar di tabel staf_admin)' };
      }

      return { ok: true, nama: adminRow.nama };
    } catch (err) {
      console.error('[DesaAuth] login exception:', err);
      return { ok: false, message: 'Terjadi kesalahan tak terduga: ' + (err.message || err) };
    }
  }

  /**
   * Keluar dari akun (Sign Out) dan mengarahkan kembali ke halaman login.
   */
  async function logout() {
    if (client) await client.auth.signOut();
    window.location.href = 'login.html';
  }

  /**
   * Memastikan halaman yang dibuka sedang diakses oleh admin yang terdaftar.
   * Jika tidak ada sesi valid atau bukan admin, akan diarahkan ke login.html.
   */
  async function requireAdmin() {
    if (!client) return null;

    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }

    const userId = session.user.id;
    const { data: adminRow, error } = await client
      .from('staf_admin')
      .select('user_id, nama')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !adminRow) {
      console.warn('[DesaAuth] requireAdmin denied for userId:', userId);
      await client.auth.signOut();
      window.location.href = 'login.html';
      return null;
    }

    return adminRow; // Data admin: { user_id, nama }
  }

  window.DesaAuth = { login, logout, requireAdmin };
})();
