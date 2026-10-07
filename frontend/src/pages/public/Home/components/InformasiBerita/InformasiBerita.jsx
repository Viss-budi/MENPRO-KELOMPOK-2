import React from 'react';
import { Calendar, ArrowRight, Users, CalendarCheck, Trophy, UserCheck } from 'lucide-react';
import styles from './InformasiBerita.module.css';

const InformasiBerita = () => {
  const news = [
    {
      id: 1,
      image: '/path-to-news-1.jpg',
      tag: 'Berita',
      title: 'Lisensi Lembaga Sertifikasi Profesi berdasarkan Keputusan Ketua BNSP Nomor KEP 2390/BNSP/VII/2026.',
      date: '22 September 2026'
    },
    {
      id: 2,
      image: '/path-to-news-2.jpg',
      tag: 'Kegiatan',
      title: 'WEDITY HIMAFOR',
      date: '10 September 2026'
    },
    {
      id: 3,
      image: '/path-to-news-3.jpg',
      tag: 'Kegiatan',
      title: 'Open Recruitmen Volunteer Informatics Fair 2026 Resmi Dibuka!',
      date: '03 September 2026'
    }
  ];

  const stats = [
    { icon: <Users size={24} />, value: '150+', label: 'Anggota Aktif' },
    { icon: <CalendarCheck size={24} />, value: '30+', label: 'Kegiatan Terlaksana' },
    { icon: <Trophy size={24} />, value: '10+', label: 'Prestasi Mahasiswa' },
    { icon: <UserCheck size={24} />, value: '5+', label: 'Tahun Berkarya' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Informasi & Berita Terbaru</h2>
          <p className={styles.subtitle}>Jangan lewatkan update terbaru seputar HIMAFOR.</p>
        </div>
        <a href="#" className={styles.seeAllLink}>
          Lihat Semua Berita <ArrowRight size={16} />
        </a>
      </div>

      <div className={styles.mainGrid}>
        {/* KIRI: Daftar Berita (3 Kolom) */}
        {news.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardImageWrapper}>
              <img src={item.image} alt={item.title} className={styles.cardImage} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.tag}>{item.tag}</span>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <div className={styles.cardMeta}>
                <Calendar size={14} className={styles.metaIcon} />
                {item.date}
              </div>
              <a href="#" className={styles.readMoreLink}>
                Baca Selengkapnya <ArrowRight size={14} />
              </a>
            </div>
          </div>
        ))}

        {/* KANAN: Statistik / Pencapaian */}
        <div className={styles.statsCard}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <div className={styles.iconCircle}>{stat.icon}</div>
                <div className={styles.statText}>
                  <h4 className={styles.statValue}>{stat.value}</h4>
                  <p className={styles.statLabel}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformasiBerita;