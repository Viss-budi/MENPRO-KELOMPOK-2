import { useEffect, useState } from 'react'
import Button from '../../../../../components/common/Button/Button'
import ImageWithFallback from '../../../../../components/common/ImageWithFallback/ImageWithFallback'
import { ROUTES } from '../../../../../constants/routes'

import gedung from '../../../../../assets/images/hero-gedung.webp'
import logo from '../../../../../assets/images/logo-himafor.webp'
import kegiatan from '../../../../../assets/images/kegiatan-informatics-fair.webp'
import volunteer from '../../../../../assets/images/volunteer-tim.webp'

import styles from './HeroSection.module.css'

const slides = [
  {
    id: 1,
    badge: 'Selamat Datang di HIMAFOR',
    title: 'HIMAFOR',
    subtitle: 'Himpunan Mahasiswa Informatika',
    description:
      'Ruang Informasi dan Kolaborasi Mahasiswa Informatika Universitas Islam Negeri Siber Syekh Nurjati Cirebon.',
    image: gedung,
    imageAlt: 'Gedung UIN Siber Syekh Nurjati Cirebon',
    primaryButton: 'Lihat Kegiatan',
    primaryRoute: ROUTES.agenda,
    secondaryButton: 'Tentang HIMAFOR',
    secondaryRoute: ROUTES.tentang,
  },
  {
    id: 2,
    badge: 'Kegiatan HIMAFOR',
    title: 'Berkarya Bersama',
    subtitle: 'Membangun Pengalaman dan Kolaborasi',
    description:
      'Temukan berbagai kegiatan mahasiswa Informatika untuk mengembangkan pengalaman, kreativitas, dan kolaborasi.',
    image: kegiatan,
    imageAlt: 'Kegiatan Informatics Fair HIMAFOR',
    primaryButton: 'Lihat Kegiatan',
    primaryRoute: ROUTES.agenda,
    secondaryButton: 'Tentang HIMAFOR',
    secondaryRoute: ROUTES.tentang,
  },
  {
    id: 3,
    badge: 'Bersama HIMAFOR',
    title: 'Tumbuh Bersama',
    subtitle: 'Berkolaborasi dan Berkontribusi',
    description:
      'Menjadi ruang bagi mahasiswa Informatika untuk berkembang, berkolaborasi, dan memberikan kontribusi.',
    image: volunteer,
    imageAlt: 'Tim HIMAFOR',
    primaryButton: 'Lihat Kegiatan',
    primaryRoute: ROUTES.agenda,
    secondaryButton: 'Tentang HIMAFOR',
    secondaryRoute: ROUTES.tentang,
  },
]

function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const current = slides[currentSlide]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 6000)

    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <section
      className={styles.hero}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Konten kiri */}
      <div className={styles.content}>
        <div className={styles.text}>
          <span className={styles.badge}>{current.badge}</span>

          <h1 className={styles.title}>{current.title}</h1>

          <p className={styles.subtitle}>{current.subtitle}</p>

          <p className={styles.description}>{current.description}</p>

          <div className={styles.actions}>
            <Button href={current.primaryRoute} className={styles.primaryBtn}>
              <span className={styles.buttonIcon}>📅</span>
              {current.primaryButton}
              <span className={styles.arrow}>→</span>
            </Button>

            <Button href={current.secondaryRoute} variant="outline" className={styles.secondaryBtn}>
              {current.secondaryButton}
            </Button>
          </div>
        </div>
      </div>

      {/* Media kanan dengan ukuran tetap & konsisten */}
      <div className={styles.media}>
        <div className={styles.imageContainer}>
          <ImageWithFallback
            key={current.id}
            src={current.image}
            alt={current.imageAlt}
          />
        </div>

        {/* Shape biru diagonal */}
        <div className={styles.blueShape} />

        {/* Logo HIMAFOR */}
        <div className={styles.logo}>
          <ImageWithFallback src={logo} alt="Logo HIMAFOR" />
        </div>

        {/* Dekorasi garis */}
        <div className={styles.lines}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      {/* Navigasi carousel */}
      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.navButton}
          onClick={previousSlide}
          aria-label="Slide sebelumnya"
        >
          ‹
        </button>

        <div className={styles.dots}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`${styles.dot} ${
                index === currentSlide ? styles.activeDot : ''
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Pindah ke slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.navButton}
          onClick={nextSlide}
          aria-label="Slide berikutnya"
        >
          ›
        </button>
      </div>
    </section>
  )
}

export default HeroSection