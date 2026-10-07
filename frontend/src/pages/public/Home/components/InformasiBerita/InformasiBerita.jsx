import { Calendar, ArrowRight, Users, CalendarCheck, Trophy, UserCheck } from 'lucide-react';
import { getNews, getSettings } from '../../../../../services/api';
import { useApi } from '../../../../../hooks/useApi';
import { formatTanggal } from '../../../../../utils/format';
import styles from './InformasiBerita.module.css';
import { resolveImage } from '../../../../../utils/image';
const InformasiBerita = () => {
  const { data: news, loading, error } = useApi((signal) => getNews(3, signal), 'news');
  const { data: settings } = useApi(getSettings, 'settings');

  // Angka statistik dari tabel settings; nilai awal dipakai jika API belum/tidak tersedia
  const stat = (key, fallback) => `${settings?.[key] ?? fallback}+`;
  const stats = [
    { icon: <Users size={24} />, value: stat('stat_members', 150), label: 'Anggota Aktif' },
    { icon: <CalendarCheck size={24} />, value: stat('stat_events', 30), label: 'Kegiatan Terlaksana' },
    { icon: <Trophy size={24} />, value: stat('stat_achievements', 10), label: 'Prestasi Mahasiswa' },
    { icon: <UserCheck size={24} />, value: stat('stat_years', 5), label: 'Tahun Berkarya' }
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
        {loading && <p className={styles.statusText}>Memuat berita...</p>}
        {error && <p className={styles.statusText}>Gagal memuat berita: {error.message}</p>}
        {!loading && !error && news?.length === 0 && (
          <p className={styles.statusText}>Belum ada berita.</p>
        )}

        {(news || []).map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardImageWrapper}>
              <img src={resolveImage(item.cover_url)} alt={item.title} className={styles.cardImage} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.tag}>{item.category}</span>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <div className={styles.cardMeta}>
                <Calendar size={14} className={styles.metaIcon} />
                {formatTanggal(item.published_at)}
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