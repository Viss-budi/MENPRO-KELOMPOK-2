-- Sprint 2: keamanan login + modul anggota (jabatan).
-- Jalankan SETELAH schema.sql (dan erd_extension.sql). Per statement di SQL Editor TiDB Cloud
-- atau sekaligus: npm run sql -- database/sprint2.sql   (jalankan SEKALI)

-- 1) Kolom keamanan di tabel users
ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL;

-- 2) Tabel anggota / jabatan (ditampilkan di publik)
CREATE TABLE IF NOT EXISTS members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  division VARCHAR(100) NULL,
  photo_url VARCHAR(500) NULL,
  period VARCHAR(20) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_members_active (is_active, sort_order)
);

-- 3) Data dummy (nama fiktif)
INSERT INTO members (name, position, division, photo_url, period, sort_order) VALUES
 ('Rizki Ramadhan', 'Ketua Umum', NULL, 'https://placehold.co/400x400/png?text=Ketua', '2026/2027', 1),
 ('Nabila Putri', 'Wakil Ketua Umum', NULL, 'https://placehold.co/400x400/png?text=Wakil', '2026/2027', 2),
 ('Fajar Hidayat', 'Sekretaris', NULL, 'https://placehold.co/400x400/png?text=Sekretaris', '2026/2027', 3),
 ('Salsabila Rahma', 'Bendahara', NULL, 'https://placehold.co/400x400/png?text=Bendahara', '2026/2027', 4),
 ('Andi Saputra', 'Kepala Divisi', 'Akademik', 'https://placehold.co/400x400/png?text=Akademik', '2026/2027', 5),
 ('Dewi Anggraini', 'Kepala Divisi', 'Media & Humas', 'https://placehold.co/400x400/png?text=Humas', '2026/2027', 6),
 ('Budi Santoso', 'Kepala Divisi', 'Kewirausahaan', 'https://placehold.co/400x400/png?text=Wirausaha', '2026/2027', 7),
 ('Putri Ayu', 'Anggota', 'Media & Humas', NULL, '2026/2027', 8);
