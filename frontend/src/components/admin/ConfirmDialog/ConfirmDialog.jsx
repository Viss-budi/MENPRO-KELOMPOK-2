import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CircleAlert, Trash2 } from 'lucide-react'
import styles from './ConfirmDialog.module.css'

// Dialog konfirmasi untuk aksi yang tidak bisa dibatalkan (mis. hapus berita).
// Dirender hanya saat dibutuhkan: induk memasangnya ({target && <ConfirmDialog ... />}).
//   judul, pesan : teks dialog
//   error        : pesan gagal dari server; dialog tetap terbuka supaya pengguna bisa mencoba lagi
//   loading      : true selama permintaan berjalan (tombol nonaktif, Esc/klik latar diabaikan)
//   onConfirm    : () => void ; onCancel : () => void
function ConfirmDialog({
  judul,
  pesan,
  error = '',
  labelYa = 'Ya',
  labelBatal = 'Batal',
  labelLoading = 'Memproses...',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const descId = useId()
  const dialogRef = useRef(null)
  const batalRef = useRef(null)

  // Saat dibuka: fokus ke "Batal" (aksi yang aman), kunci gulir latar; saat ditutup: kembalikan fokus.
  useEffect(() => {
    const sebelumnya = document.activeElement
    const overflowAwal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    batalRef.current?.focus()
    return () => {
      document.body.style.overflow = overflowAwal
      if (sebelumnya instanceof HTMLElement) sebelumnya.focus()
    }
  }, [])

  // Setelah gagal, tombol aktif lagi tetapi fokus sempat hilang: kembalikan ke "Batal".
  useEffect(() => {
    if (error) batalRef.current?.focus()
  }, [error])

  // Esc menutup dialog; Tab berputar di dalam dialog saja.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (!loading) onCancel()
        return
      }
      if (e.key !== 'Tab') return
      const fokusable = dialogRef.current?.querySelectorAll('button:not([disabled])')
      if (!fokusable || fokusable.length === 0) {
        e.preventDefault()
        return
      }
      const pertama = fokusable[0]
      const terakhir = fokusable[fokusable.length - 1]
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault()
        pertama.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  function klikLatar(e) {
    if (e.target === e.currentTarget && !loading) onCancel()
  }

  return createPortal(
    <div className={styles.scrim} onMouseDown={klikLatar}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <span className={styles.icon} aria-hidden="true">
          <Trash2 size={28} strokeWidth={1.9} />
        </span>
        <h2 id={titleId} className={styles.title}>{judul}</h2>
        <p id={descId} className={styles.text}>{pesan}</p>

        {error && (
          <p className={styles.error} role="alert">
            <CircleAlert size={16} strokeWidth={2.1} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <div className={styles.actions}>
          <button
            ref={batalRef}
            type="button"
            className={`${styles.btn} ${styles.batal}`}
            onClick={onCancel}
            disabled={loading}
          >
            {labelBatal}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.ya}`}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? labelLoading : labelYa}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmDialog
