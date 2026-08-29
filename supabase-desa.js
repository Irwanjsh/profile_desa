/* ============================================================
   DESA CIHAWUK — Konfigurasi Supabase Client (Backend Admin Desa)

   PENTING:
   - File ini mengonfigurasi koneksi ke Supabase Backend Desa Cihawuk.
   - Menggunakan Anon Key publik yang aman dipakai di browser (akses dibatasi RLS).
   - Membutuhkan SDK Supabase JS dimuat lebih dulu via CDN:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ============================================================ */
(function(){

  const SUPABASE_URL      = 'https://gghtoftwabbpgotkspky.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaHRvZnR3YWJicGdvdGtzcGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjI0MzcsImV4cCI6MjEwMzM5ODQzN30.Q7heS_rEmo89F-v54yUWKIk4wixYTw7dULypiCLZ2U4';

  if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
    console.error(
      '[DesaSupabase] Library Supabase JS belum termuat. Pastikan tag ' +
      '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> ' +
      'dipasang SEBELUM <script src="supabase-desa.js">.'
    );
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.DesaSupabase = client;

})();
