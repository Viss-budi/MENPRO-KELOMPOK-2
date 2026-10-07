import { useState } from 'react';
import { Calendar, MapPin, ArrowRight, TrendingUp, Briefcase, Users } from 'lucide-react';
import { getEvents, getCalendar, getEventsByDate } from '../../../../../services/api';
import { useApi } from '../../../../../hooks/useApi';
import { BULAN, formatTanggal, formatJam, dateKey, todayParts } from '../../../../../utils/format';
import volunteerImg from '../../../../../assets/images/volunteer-tim.webp';
import styles from './KegiatanTerbaru.module.css';
import { resolveImage } from '../../../../../utils/image';
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function Kalender() {
  const today = todayParts();
  const todayKey = dateKey(today.year, today.month, today.day);

  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState(todayKey);

  const { data: marks } = useApi(
    (signal) => getCalendar(view.year, view.month, signal),
    `calendar-${view.year}-${view.month}`
  );
  const { data: agenda, loading: agendaLoading, error: agendaError } = useApi(
    (signal) => getEventsByDate(selected, signal),
    `agenda-${selected}`
  );

  const markedDays = new Set((marks || []).map((m) => m.event_date));
  const offset = (new Date(view.year, view.month - 1, 1).getDay() + 6) % 7; // Senin = kolom pertama
  const daysInMonth = new Date(view.year, view.month, 0).getDate();

  const moveMonth = (delta) =>
    setView(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });

  return (
    <div className={styles.calendarWidget}>
      <h3 className={styles.calendarTitle}>Kalender HIMAFOR</h3>

      <div className={styles.calendarHeader}>
        <button type="button" className={styles.navBtn} onClick={() => moveMonth(-1)} aria-label="Bulan sebelumnya">&lt;</button>
        <span className={styles.monthYear}>{BULAN[view.month - 1]} {view.year}</span>
        <button type="button" className={styles.navBtn} onClick={() => moveMonth(1)} aria-label="Bulan berikutnya">&gt;</button>
      </div>

      <div className={styles.daysGrid}>
        {HARI.map((h) => <div key={h}>{h}</div>)}
      </div>

      <div className={styles.datesGrid}>
        {Array.from({ length: offset }, (_, i) => <div key={`kosong-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const key = dateKey(view.year, view.month, i + 1);
          const className = [
            styles.dateItem,
            styles.dateButton,
            key === selected ? styles.activeDate : '',
            markedDays.has(key) ? styles.hasEvent : '',
          ].join(' ');
          return (
            <button type="button" key={key} className={className} onClick={() => setSelected(key)}>
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className={styles.agendaSection}>
        <h4 className={styles.agendaTitle}>
          {selected === todayKey ? 'Agenda Hari Ini' : `Agenda ${formatTanggal(selected)}`}
        </h4>

        {agendaLoading && <p className={styles.agendaTime}>Memuat agenda...</p>}
        {agendaError && <p className={styles.agendaTime}>Gagal memuat agenda.</p>}
        {!agendaLoading && !agendaError && agenda?.length === 0 && (
          <p className={styles.agendaTime}>Tidak ada agenda.</p>
        )}

        {!agendaError && (agenda || []).map((a) => (
          <div key={a.id} className={styles.agendaCard}>
            <div className={styles.agendaInfo}>
              <div className={styles.agendaDot}></div>
              <div>
                <p className={styles.agendaName}>{a.title}</p>
                <p className={styles.agendaTime}>
                  {formatJam(a.start_at)}{a.end_at ? ` - ${formatJam(a.end_at)}` : ''}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className={styles.agendaArrow} />
          </div>
        ))}
      </div>
    </div>
  );
}

const KegiatanTerbaru = () => {
  const { data: activities, loading, error } = useApi((signal) => getEvents(3, signal), 'events');

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <h2 className={styles.title}>Kegiatan Terbaru</h2>
        <p className={styles.subtitle}>Temukan berbagai kegiatan dan program HIMAFOR.</p>
      </div>

      <div className={styles.mainGrid}>
        {/* KIRI: Daftar Kegiatan */}
        <div className={styles.activitiesGrid}>
          {loading && <p className={styles.statusText}>Memuat kegiatan...</p>}
          {error && <p className={styles.statusText}>Gagal memuat kegiatan: {error.message}</p>}
          {!loading && !error && activities?.length === 0 && (
            <p className={styles.statusText}>Belum ada kegiatan.</p>
          )}

          {(activities || []).map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardImageWrapper}>
                <img src={resolveImage(item.thumbnail_url)} alt={item.title} className={styles.cardImage} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.tag}>{item.category}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>

                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <Calendar className={styles.metaIcon} size={16} />
                    {formatTanggal(item.start_at)}
                  </div>
                  <div className={styles.metaItem}>
                    <MapPin className={styles.metaIcon} size={16} />
                    {item.location}
                  </div>
                </div>

                {/* TODO: arahkan ke halaman detail (/kegiatan/{item.slug}) setelah routing disepakati */}
                <a href="#" className={styles.detailLink}>
                  Lihat Detail <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* KANAN: Kalender */}
        <Kalender />
      </div>

      {/* CTA SECTION */}
      <div className={styles.ctaContainer}>
        <div className={styles.ctaImageWrapper}>
          <img src={volunteerImg} alt="Pengurus HIMAFOR" className={styles.ctaImage} />
        </div>

        <div className={styles.ctaContent}>
          <span className={styles.ctaTag}>Bergabung Bersama Kami</span>
          <h2 className={styles.ctaTitle}>Mau ikut berkontribusi?</h2>
          <p className={styles.ctaDesc}>
            Bergabung sebagai panitia atau volunteer dalam berbagai kegiatan HIMAFOR.
          </p>
          <button className={styles.ctaButton}>
            Lihat Kesempatan <ArrowRight size={16} />
          </button>
        </div>

        <div className={styles.ctaBenefits}>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}><TrendingUp size={24} /></div>
            <span>Pengembangan<br/>Diri</span>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}><Briefcase size={24} /></div>
            <span>Menambah<br/>Pengalaman</span>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}><Users size={24} /></div>
            <span>Jaringan<br/>Lebih Luas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KegiatanTerbaru;
