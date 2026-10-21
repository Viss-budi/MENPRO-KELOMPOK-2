import { ArrowLeft, Construction, ShieldAlert } from 'lucide-react'
import { ROUTES } from '../../../constants/routes'
import styles from './Kelola.module.css'

// Penampung sementara untuk halaman kelola yang belum dibuat (Kegiatan, Berita, dst.).
// Menu admin sudah mengarah ke path-nya; ganti komponen ini dengan halaman sebenarnya
// di App.jsx saat card halaman kelola dikerjakan.
// akses === false: pengguna (editor) tidak berhak membuka halaman ini (kontrak 403).
function Kelola({ item, akses = true, onNavigate }) {
  const Icon = akses ? Construction : ShieldAlert

  function kembali(e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onNavigate(ROUTES.admin)
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{akses ? `Kelola ${item.label}` : 'Akses ditolak'}</h1>
      <div className={styles.panel} role={akses ? undefined : 'alert'}>
        <span className={`${styles.icon} ${akses ? '' : styles.iconWarn}`}>
          <Icon size={28} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <p className={styles.text}>
          {akses
            ? `Halaman kelola ${item.label.toLowerCase()} sedang disiapkan.`
            : 'Akun Anda tidak memiliki hak untuk membuka halaman ini.'}
        </p>
        <a href={ROUTES.admin} className={styles.back} onClick={kembali}>
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  )
}

export default Kelola
