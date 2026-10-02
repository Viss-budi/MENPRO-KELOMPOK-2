import React from 'react';
// Kita ganti ikon brand dengan MessageCircle, Video, dan Link agar tidak error
import { Mail, Phone, MapPin, MessageCircle, Video, Link } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Kolom 1: Profil */}
          <div className={styles.colProfile}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoPlaceholder}></div>
              <div>
                <h3 className={styles.brandName}>HIMAFOR</h3>
                <p className={styles.brandSub}>Himpunan Mahasiswa Informatika</p>
              </div>
            </div>
            <p className={styles.description}>
              Bersama membangun kolaborasi, berinovasi, dan berkontribusi untuk Informatika yang lebih baik.
            </p>
          </div>

          {/* Kolom 2: Tautan Cepat */}
          <div className={styles.colLinks}>
            <h4 className={styles.heading}>Tautan Cepat</h4>
            <ul className={styles.linkList}>
              <li><a href="#">Beranda</a></li>
              <li><a href="#">Tentang</a></li>
              <li><a href="#">Kegiatan</a></li>
              <li><a href="#">Kalender</a></li>
              <li><a href="#">Dokumentasi</a></li>
              <li><a href="#">Prestasi</a></li>
            </ul>
          </div>

          {/* Kolom 3: Kontak Kami */}
          <div className={styles.colContact}>
            <h4 className={styles.heading}>Kontak Kami</h4>
            <ul className={styles.contactList}>
              <li>
                <Mail size={16} className={styles.contactIcon} />
                <span>himafor@uinssc.ac.id</span>
              </li>
              <li>
                <Phone size={16} className={styles.contactIcon} />
                <span>+62 812 3456 7890</span>
              </li>
              <li>
                <MapPin size={16} className={styles.contactIcon} />
                <span>UIN Siber Syekh Nurjati Cirebon</span>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Ikuti Kami (Ikon sudah disesuaikan) */}
          <div className={styles.colSocial}>
            <h4 className={styles.heading}>Ikuti Kami</h4>
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialBtn}><MessageCircle size={18} /></a>
              <a href="#" className={styles.socialBtn}><Video size={18} /></a>
              <a href="#" className={styles.socialBtn}><Link size={18} /></a>
            </div>
          </div>
        </div>

        {/* Footer Bawah */}
        <div className={styles.bottomBar}>
          <p>© 2026 HIMAFOR. All rights reserved.</p>
          <p>Informatics • Collaboration • Innovation</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;