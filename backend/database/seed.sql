-- Data dummy HIMAFOR (sesuai desain). Aman dijalankan berulang.
-- Jalankan SETELAH schema.sql, di database yang sama.
-- Peringatan: menghapus isi hero_slides, events, news. Jangan jalankan jika sudah ada data asli.

DELETE FROM hero_slides;
DELETE FROM events;
DELETE FROM news;

-- ============ HERO (carousel background) ============
INSERT INTO hero_slides (image_url, alt, sort_order, is_active) VALUES
 ('https://placehold.co/1600x700/png?text=Hero+1', 'Gedung kampus UIN SSC', 1, 1),
 ('https://placehold.co/1600x700/png?text=Hero+2', 'Kegiatan HIMAFOR', 2, 1),
 ('https://placehold.co/1600x700/png?text=Hero+3', 'Mahasiswa Informatika', 3, 1);

-- ============ EVENTS (Kegiatan Terbaru + Kalender) ============
INSERT INTO events (title, slug, category, description, thumbnail_url, location, start_at, end_at, is_featured, is_published) VALUES
 ('Stadium General', 'stadium-general', 'Seminar',
  'Kuliah umum bersama praktisi industri teknologi untuk mahasiswa Informatika.',
  'https://placehold.co/600x400/png?text=Stadium+General', 'Aula Gedung F, UIN SSC',
  '2026-08-19 08:00:00', '2026-08-19 12:00:00', 1, 1),
 ('Seminar Moderasi Beragama', 'seminar-moderasi-beragama', 'Seminar',
  'Seminar tentang penguatan moderasi beragama di lingkungan kampus.',
  'https://placehold.co/600x400/png?text=Moderasi+Beragama', 'Gedung FITK Lt. 5, UIN SSC',
  '2026-02-26 08:00:00', '2026-02-26 12:00:00', 1, 1),
 ('Informatics Fair 2026', 'informatics-fair-2026', 'Event',
  'Festival tahunan HIMAFOR berisi lomba, seminar, dan pameran karya mahasiswa.',
  'https://placehold.co/600x400/png?text=Informatics+Fair+2026', 'Gedung FITK Lt. 5, UIN SSC',
  '2026-10-12 08:00:00', '2026-10-12 16:00:00', 1, 1),
 ('Seminar Teknologi & Inovasi Digital', 'seminar-teknologi-inovasi-digital', 'Seminar',
  'Seminar tentang tren teknologi dan inovasi digital.',
  'https://placehold.co/600x400/png?text=Seminar+Teknologi', 'Gedung FITK Lt. 5, UIN SSC',
  '2026-09-28 08:00:00', '2026-09-28 12:00:00', 1, 1),
 ('Rapat Koordinasi Pengurus', 'rapat-koordinasi-pengurus', 'Lainnya',
  'Rapat koordinasi pengurus HIMAFOR membahas persiapan Informatics Fair.',
  'https://placehold.co/600x400/png?text=Rapat+Koordinasi', 'Ruang Himpunan, UIN SSC',
  '2026-10-01 13:00:00', '2026-10-01 15:00:00', 0, 1),
 ('Workshop Git & GitHub', 'workshop-git-github', 'Workshop',
  'Workshop dasar version control untuk kolaborasi tim.',
  'https://placehold.co/600x400/png?text=Workshop+Git', 'Lab Komputer 2, UIN SSC',
  '2026-10-05 09:00:00', '2026-10-05 12:00:00', 1, 1),
 ('Lomba Web Development Internal', 'lomba-web-development-internal', 'Lomba',
  'Lomba pembuatan website antar mahasiswa Informatika.',
  'https://placehold.co/600x400/png?text=Lomba+Web', 'Lab Komputer 1, UIN SSC',
  '2026-10-20 08:00:00', '2026-10-20 16:00:00', 1, 1);

-- ============ NEWS (Informasi & Berita Terbaru) ============
INSERT INTO news (title, slug, category, excerpt, content, cover_url, published_at, is_published) VALUES
 ('Lisensi Lembaga Sertifikasi Profesi berdasarkan Keputusan Ketua BNSP Nomor KEP 2390/BNSP/VII/2026',
  'lisensi-lsp-bnsp', 'Berita',
  'Lisensi LSP resmi terbit berdasarkan keputusan Ketua BNSP.',
  'Lisensi Lembaga Sertifikasi Profesi resmi terbit berdasarkan Keputusan Ketua BNSP Nomor KEP 2390/BNSP/VII/2026. Lisensi ini membuka peluang sertifikasi kompetensi bagi mahasiswa Informatika.',
  'https://placehold.co/600x400/png?text=Lisensi+BNSP', '2026-09-22 09:00:00', 1),
 ('WEDITY HIMAFOR', 'wedity-himafor', 'Kegiatan',
  'Dokumentasi kegiatan WEDITY HIMAFOR.',
  'WEDITY HIMAFOR berlangsung meriah dengan antusiasme tinggi dari seluruh anggota. Kegiatan ini mempererat kebersamaan antar angkatan.',
  'https://placehold.co/600x400/png?text=WEDITY', '2026-09-18 09:00:00', 1),
 ('Open Recruitment Volunteer Informatics Fair 2026 Resmi Dibuka!', 'open-recruitment-volunteer-if-2026', 'Kegiatan',
  'Pendaftaran volunteer Informatics Fair 2026 telah dibuka.',
  'HIMAFOR membuka pendaftaran volunteer untuk Informatics Fair 2026. Daftarkan dirimu dan jadilah bagian dari acara terbesar tahun ini.',
  'https://placehold.co/600x400/png?text=Open+Recruitment', '2026-09-03 09:00:00', 1),
 ('Juara 2 Lomba Web Development Tingkat Nasional', 'juara-2-lomba-web-nasional', 'Prestasi',
  'Mahasiswa Informatika raih juara 2 tingkat nasional.',
  'Mahasiswa Informatika UIN SSC meraih juara 2 pada lomba web development tingkat nasional.',
  'https://placehold.co/600x400/png?text=Prestasi', '2026-08-25 09:00:00', 1),
 ('Pengumuman Jadwal Informatics Fair 2026', 'pengumuman-jadwal-informatics-fair-2026', 'Pengumuman',
  'Jadwal lengkap rangkaian Informatics Fair 2026.',
  'Berikut jadwal lengkap rangkaian acara Informatics Fair 2026. Pantau terus kanal resmi HIMAFOR untuk pembaruan.',
  'https://placehold.co/600x400/png?text=Pengumuman', '2026-08-10 09:00:00', 1),
 ('Workshop Dasar Git dan GitHub Sukses Digelar', 'workshop-git-github-sukses', 'Kegiatan',
  'Puluhan peserta ikuti workshop dasar Git dan GitHub.',
  'Puluhan peserta mengikuti workshop dasar Git dan GitHub yang diselenggarakan HIMAFOR.',
  'https://placehold.co/600x400/png?text=Workshop', '2026-07-20 09:00:00', 1);

-- ============ SETTINGS (Statistics + Footer) ============
INSERT INTO settings (setting_key, setting_value) VALUES
 ('stat_members', '150'),
 ('stat_events', '30'),
 ('stat_achievements', '10'),
 ('stat_years', '5'),
 ('footer_tagline', 'Bersama membangun kolaborasi, berinovasi, dan berkontribusi untuk informatika yang lebih baik.'),
 ('contact_email', 'himafor@uinssc.ac.id'),
 ('contact_phone', '+62 812 3456 7890'),
 ('contact_address', 'UIN Siber Syekh Nurjati Cirebon'),
 ('social_instagram', 'https://instagram.com/himafor'),
 ('social_youtube', 'https://youtube.com/@himafor'),
 ('social_tiktok', 'https://tiktok.com/@himafor'),
 ('social_x', 'https://x.com/himafor')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
