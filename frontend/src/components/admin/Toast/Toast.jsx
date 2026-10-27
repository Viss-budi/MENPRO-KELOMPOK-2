import { useEffect } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import styles from './Toast.module.css'

const DURASI_MS = 6000

// Notifikasi singkat di pojok kanan bawah (desain 09, 12, 04).
//   toast   : { id, judul, pesan, tipe?: 'sukses' | 'gagal' } atau null
//   onClose : () => void ; hilang otomatis setelah 6 detik
// Pembungkus live-region selalu ada, supaya pembaca layar membacakan toast yang baru muncul.
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(onClose, DURASI_MS)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  const gagal = toast?.tipe === 'gagal'
  const Icon = gagal ? CircleAlert : CircleCheck

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`${styles.toast} ${gagal ? styles.gagal : styles.sukses}`}>
          <span className={styles.icon} aria-hidden="true">
            <Icon size={22} strokeWidth={2} />
          </span>
          <div className={styles.body}>
            <p className={styles.judul}>{toast.judul}</p>
            {toast.pesan && <p className={styles.pesan}>{toast.pesan}</p>}
          </div>
          <button type="button" className={styles.tutup} onClick={onClose} aria-label="Tutup notifikasi">
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export default Toast
