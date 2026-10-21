import { LoaderCircle } from 'lucide-react'
import styles from './SesiLoading.module.css'

// Tampil singkat saat GET /auth/me berjalan, supaya halaman admin/login tidak berkedip.
function SesiLoading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <LoaderCircle className={styles.spinner} size={28} strokeWidth={2} aria-hidden="true" />
      <p className={styles.text}>Memeriksa sesi...</p>
    </div>
  )
}

export default SesiLoading
