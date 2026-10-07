-- Jalankan di SQL Editor TiDB Cloud (pilih database sesuai DB_NAME)

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  alt VARCHAR(200),
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  category ENUM('Seminar','Event','Workshop','Lomba','Lainnya') NOT NULL DEFAULT 'Event',
  description TEXT,
  thumbnail_url VARCHAR(500),
  location VARCHAR(200),
  start_at DATETIME NOT NULL,
  end_at DATETIME NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 1,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pub_start (is_published, start_at)
);

CREATE TABLE IF NOT EXISTS news (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(250) NOT NULL,
  slug VARCHAR(270) NOT NULL UNIQUE,
  category ENUM('Berita','Kegiatan','Prestasi','Pengumuman') NOT NULL DEFAULT 'Berita',
  excerpt VARCHAR(300),
  content MEDIUMTEXT,
  cover_url VARCHAR(500),
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pub_date (is_published, published_at)
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT
);

-- Seed (dari desain)
INSERT INTO settings VALUES
 ('stat_members','150'),('stat_events','30'),('stat_achievements','10'),('stat_years','5'),
 ('contact_email','himafor@uinssc.ac.id'),('contact_phone','+62 812 3456 7890'),
 ('contact_address','UIN Siber Syekh Nurjati Cirebon');

INSERT INTO events (title,slug,category,location,thumbnail_url,start_at,end_at) VALUES
 ('Stadium General','stadium-general','Seminar','Aula Gedung F, UIN SSC','https://placehold.co/600x400','2026-08-19 08:00:00','2026-08-19 12:00:00'),
 ('Seminar Moderasi Beragama','seminar-moderasi-beragama','Seminar','Gedung FITK Lt. 5, UIN SSC','https://placehold.co/600x400','2026-02-26 08:00:00','2026-02-26 12:00:00'),
 ('Informatics Fair 2026','informatics-fair-2026','Event','Gedung FITK Lt. 5, UIN SSC','https://placehold.co/600x400','2026-10-12 08:00:00','2026-10-12 16:00:00'),
 ('Seminar Teknologi & Inovasi Digital','seminar-teknologi-inovasi-digital','Seminar','UIN SSC','https://placehold.co/600x400','2026-09-28 08:00:00','2026-09-28 12:00:00');

INSERT INTO news (title,slug,category,excerpt,cover_url,published_at) VALUES
 ('Lisensi Lembaga Sertifikasi Profesi berdasarkan Keputusan Ketua BNSP Nomor KEP 2390/BNSP/VII/2026','lisensi-lsp-bnsp','Berita','Lisensi LSP resmi terbit.','https://placehold.co/600x400','2026-09-22 09:00:00'),
 ('WEDITY HIMAFOR','wedity-himafor','Kegiatan','Dokumentasi kegiatan WEDITY.','https://placehold.co/600x400','2026-09-18 09:00:00'),
 ('Open Recruitment Volunteer Informatics Fair 2026 Resmi Dibuka!','open-recruitment-volunteer-if-2026','Kegiatan','Pendaftaran volunteer dibuka.','https://placehold.co/600x400','2026-09-03 09:00:00');

INSERT INTO hero_slides (image_url, alt, sort_order) VALUES
 ('https://placehold.co/1600x700', 'Gedung kampus UIN SSC', 1);
