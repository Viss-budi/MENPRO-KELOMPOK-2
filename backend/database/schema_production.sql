-- Himafor: skema database PRODUCTION (API Contract v1.4, Sprint 4)
-- Jalankan pada database kosong. Tanpa data dummy.
-- CREATE DATABASE himafor_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE himafor_prod;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  token_version INT NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(75) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description VARCHAR(500) NULL,
  logo_url VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_departments_slug (slug),
  INDEX idx_departments_list (is_active, sort_order)
);

-- department_id NULL = BPH. is_core = 1 = posisi utama BPH.
CREATE TABLE members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(75) NOT NULL,
  position VARCHAR(100) NOT NULL,
  group_name VARCHAR(50) NULL,
  department_id BIGINT NULL,
  photo_url VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_core TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_members_active (is_active, sort_order),
  INDEX idx_members_department (department_id),
  CONSTRAINT fk_members_department FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE TABLE events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'Event',
  description TEXT NULL,
  thumbnail_url VARCHAR(500) NULL,
  location VARCHAR(200) NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 1,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_events_slug (slug),
  INDEX idx_events_public (is_published, start_at),
  CONSTRAINT fk_events_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE news (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL DEFAULT 'Berita',
  excerpt VARCHAR(300) NULL,
  content MEDIUMTEXT NULL,
  cover_url VARCHAR(500) NULL,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  author_id BIGINT NULL,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_news_slug (slug),
  INDEX idx_news_public (is_published, published_at),
  CONSTRAINT fk_news_user FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Data awal: 6 slot posisi utama BPH (nonaktif sampai diisi admin)
INSERT INTO members (name, position, group_name, sort_order, is_active, is_core) VALUES
 ('(Belum diisi)', 'Ketua Umum',    NULL,         1, 0, 1),
 ('(Belum diisi)', 'Wakil Ketua',   NULL,         2, 0, 1),
 ('(Belum diisi)', 'Sekretaris',    'Sekretaris', 3, 0, 1),
 ('(Belum diisi)', 'Sekretaris II', 'Sekretaris', 4, 0, 1),
 ('(Belum diisi)', 'Bendahara',     'Bendahara',  5, 0, 1),
 ('(Belum diisi)', 'Bendahara II',  'Bendahara',  6, 0, 1);

INSERT INTO settings (setting_key, setting_value) VALUES
 ('stat_members','0'),('stat_events','0'),('stat_achievements','0'),('stat_years','0'),
 ('footer_tagline',''),('contact_email',''),('contact_phone',''),('contact_address','');