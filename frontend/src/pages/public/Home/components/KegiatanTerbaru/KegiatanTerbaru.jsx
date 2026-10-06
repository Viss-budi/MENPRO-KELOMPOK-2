import React from 'react';
import { Calendar, MapPin, ArrowRight, TrendingUp, Briefcase, Users } from 'lucide-react';
import styles from './KegiatanTerbaru.module.css';

// Import aset gambar dari folder src/assets/images/
import stadiumImg from '../../../../../assets/images/kegiatan-stadium-general.webp';
import seminarImg from '../../../../../assets/images/kegiatan-seminar-moderasi.webp';
import informaticsImg from '../../../../../assets/images/kegiatan-informatics-fair.webp';
import volunteerImg from '../../../../../assets/images/volunteer-tim.webp'; // Gambar untuk CTA Section

const KegiatanTerbaru = () => {
  const activities = [
    {
      id: 1,
      image: stadiumImg,
      tag: 'Seminar',
      title: 'Stadium General',
      date: '19 Agustus 2026',
      location: 'Aula Gedung F, UIN SSC'
    },
    {
      id: 2,
      image: seminarImg,
      tag: 'Seminar',
      title: 'Seminar Moderasi Beragama',
      date: '26 Februari 2026',
      location: 'Gedung FITK Lt. 5, UIN SSC'
    },
    {
      id: 3,
      image: informaticsImg,
      tag: 'Event',
      title: 'Informatics Fair 2026',
      date: '12 Oktober 2026',
      location: 'Gedung FITK Lt. 5, UIN SSC'
    }
  ];

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
          {activities.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardImageWrapper}>
                <img src={item.image} alt={item.title} className={styles.cardImage} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.tag}>{item.tag}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <Calendar className={styles.metaIcon} size={16} />
                    {item.date}
                  </div>
                  <div className={styles.metaItem}>
                    <MapPin className={styles.metaIcon} size={16} />
                    {item.location}
                  </div>
                </div>

                <a href="#" className={styles.detailLink}>
                  Lihat Detail <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* KANAN: Kalender */}
        <div className={styles.calendarWidget}>
          <h3 className={styles.calendarTitle}>Kalender HIMAFOR</h3>
          
          <div className={styles.calendarHeader}>
            <button className={styles.navBtn}>&lt;</button>
            <span className={styles.monthYear}>September 2026</span>
            <button className={styles.navBtn}>&gt;</button>
          </div>

          <div className={styles.daysGrid}>
            <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
          </div>

          <div className={styles.datesGrid}>
            {[...Array(27)].map((_, i) => (
              <div key={i} className={styles.dateItem}>{i + 1}</div>
            ))}
            <div className={`${styles.dateItem} ${styles.activeDate}`}>28</div>
            <div className={styles.dateItem}>29</div>
            <div className={styles.dateItem}>30</div>
          </div>

          <div className={styles.agendaSection}>
            <h4 className={styles.agendaTitle}>Agenda Hari Ini</h4>
            <div className={styles.agendaCard}>
              <div className={styles.agendaInfo}>
                <div className={styles.agendaDot}></div>
                <div>
                  <p className={styles.agendaName}>Seminar Teknologi & Inovasi Digital</p>
                  <p className={styles.agendaTime}>09.00 - 12.00</p>
                </div>
              </div>
              <ArrowRight size={16} className={styles.agendaArrow} />
            </div>
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className={styles.ctaContainer}>
        <div className={styles.ctaImageWrapper}>
          {/* Menggunakan variabel import volunteerImg */}
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