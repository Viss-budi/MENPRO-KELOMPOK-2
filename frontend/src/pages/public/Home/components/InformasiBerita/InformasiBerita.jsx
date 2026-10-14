import { Calendar, ArrowRight } from 'lucide-react';
import { getNews, getSettings } from '../../../../../services/api';
import { useApi } from '../../../../../hooks/useApi';
import { formatTanggal } from '../../../../../utils/format';
import styles from './InformasiBerita.module.css';
import { resolveImage } from '../../../../../utils/image';
// Ikon statistik digambar ulang dari desain UI/UX (lingkaran 54px + ikon garis 2px)
const STAT_ICON_PATHS = {
  users: [
    'M50 43C52.7614 43 55 40.7614 55 38C55 35.2386 52.7614 33 50 33C47.2386 33 45 35.2386 45 38C45 40.7614 47.2386 43 50 43Z',
    'M41 56C41 49.3333 44 46 50 46C56 46 59 49.3333 59 56H41Z',
    'M64 44C66.2091 44 68 42.2091 68 40C68 37.7909 66.2091 36 64 36C61.7909 36 60 37.7909 60 40C60 42.2091 61.7909 44 64 44Z',
    'M62 56C62 50.6667 64 48 68 48C71.3333 48 73 50.6667 73 56',
  ],
  calendar: [
    'M64 107H48C46.3431 107 45 108.343 45 110V124C45 125.657 46.3431 127 48 127H64C65.6569 127 67 125.657 67 124V110C67 108.343 65.6569 107 64 107Z',
    'M45 114H67M51 103V109M61 103V109M51 120L55 124L62 116',
  ],
  trophy: [
    'M48 179H64V189C64 191.122 63.1571 193.157 61.6569 194.657C60.1566 196.157 58.1217 197 56 197C53.8783 197 51.8434 196.157 50.3431 194.657C48.8429 193.157 48 191.122 48 189V179Z',
    'M48 182H43V185C43 186.326 43.5268 187.598 44.4645 188.536C45.4021 189.473 46.6739 190 48 190M64 182H69V185C69 185.657 68.8707 186.307 68.6194 186.913C68.3681 187.52 67.9998 188.071 67.5355 188.536C67.0712 189 66.52 189.368 65.9134 189.619C65.3068 189.871 64.6566 190 64 190',
    'M56 197V202M50 204H62',
  ],
  userCheck: [
    'M56 264C59.3137 264 62 261.314 62 258C62 254.686 59.3137 252 56 252C52.6863 252 50 254.686 50 258C50 261.314 52.6863 264 56 264Z',
    'M44 277C44 270.333 48 267 56 267C64 267 68 270.333 68 277H44Z',
    'M53 258L55 260L59 256',
  ],
}

const STAT_ICON_VIEWBOX_Y = { users: 17, calendar: 90, trophy: 164, userCheck: 237 }

const StatIcon = ({ name }) => (
  <svg
    className={styles.iconCircle}
    viewBox={`29 ${STAT_ICON_VIEWBOX_Y[name]} 54 54`}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      className={styles.iconBg}
      cx="56"
      cy={STAT_ICON_VIEWBOX_Y[name] + 27}
      r="27"
    />
    <g
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {STAT_ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  </svg>
);

const InformasiBerita = () => {
  const { data: news, loading, error } = useApi((signal) => getNews(3, signal), 'news');
  const { data: settings } = useApi(getSettings, 'settings');

  // Angka statistik dari tabel settings; nilai awal dipakai jika API belum/tidak tersedia
  const stat = (key, fallback) => `${settings?.[key] ?? fallback}+`;
  const stats = [
    { icon: <StatIcon name="users" />, value: stat('stat_members', 74), label: 'Anggota Aktif' },
    { icon: <StatIcon name="calendar" />, value: stat('stat_events', 30), label: 'Kegiatan Terlaksana' },
    { icon: <StatIcon name="trophy" />, value: stat('stat_achievements', 10), label: 'Prestasi Mahasiswa' },
    { icon: <StatIcon name="userCheck" />, value: stat('stat_years', 4), label: 'Tahun Berkarya' }
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
        {error && <p className={styles.statusText}>Gagal memuat berita</p>}
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
                {stat.icon}
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