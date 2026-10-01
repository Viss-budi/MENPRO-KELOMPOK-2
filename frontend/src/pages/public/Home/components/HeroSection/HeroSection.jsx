import Button from '../../../../../components/common/Button/Button'
import ImageWithFallback from '../../../../../components/common/ImageWithFallback/ImageWithFallback'
import { ROUTES } from '../../../../../constants/routes'
import styles from './HeroSection.module.css'

// Teks masih statis; sumber data (GET /api/home) menunggu field dari BE.
// Gambar belum ada: isi prop src setelah aset dari UI/UX tersedia.
function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <span className={styles.badge}>Selamat Datang di HIMAFOR</span>
        <h1 className={styles.title}>HIMAFOR</h1>
        <p className={styles.subtitle}>Himpunan Mahasiswa Informatika</p>
        <p className={styles.description}>
          Ruang Informasi dan Kolaborasi Mahasiswa Informatika Universitas Islam Negeri Syekh
          Nurjati Cirebon.
        </p>
        <div className={styles.actions}>
          <Button href={ROUTES.agenda}>Lihat Kegiatan</Button>
          <Button href={ROUTES.tentang} variant="outline">
            Tentang HIMAFOR
          </Button>
        </div>
      </div>
      <div className={styles.media}>
        <ImageWithFallback alt="Gedung kampus dan logo HIMAFOR" />
      </div>
    </section>
  )
}

export default HeroSection
