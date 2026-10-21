import { useEffect, useRef, useState } from 'react'
import { Clock, Compass, Mail, RefreshCw, Server, WifiOff, Wrench } from 'lucide-react'
import Navbar from '../../layout/Navbar/Navbar'
import Footer from '../../layout/Footer/Footer'
import Button from '../Button/Button'
import { ERROR_PAGES } from '../../../constants/errorPages'
import { formatJam, formatTanggal } from '../../../utils/format'
import styles from './ErrorPage.module.css'

const ICONS = {
  compass: Compass,
  server: Server,
  wrench: Wrench,
  wifiOff: WifiOff,
  refresh: RefreshCw,
  mail: Mail,
}

// "2026-10-25 00:00:00" -> "Perkiraan selesai: 25 Oktober 2026, 00.00 WIB"
function formatEstimasi(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  return `Perkiraan selesai: ${formatTanggal(value)}, ${formatJam(value)} WIB`
}

// variant: '404' | '500' | 'maintenance' | 'offline'
// estimatedEnd: hanya untuk 'maintenance' (format DB atau ISO), opsional
// onRetry: dipakai tombol dengan action 'retry'; boleh async
function ErrorPage({ variant = '404', estimatedEnd, onRetry }) {
  const page = ERROR_PAGES[variant] ?? ERROR_PAGES[500]
  const Icon = ICONS[page.icon]
  const estimasi = variant === 'maintenance' ? formatEstimasi(estimatedEnd) : null
  const titleRef = useRef(null)
  const [busy, setBusy] = useState(false)

  // Judul tab sesuai halaman, dikembalikan saat halaman error hilang
  useEffect(() => {
    const previous = document.title
    document.title = `${page.title} | HIMAFOR`
    return () => {
      document.title = previous
    }
  }, [page.title])

  // Pindahkan fokus ke judul: pembaca layar langsung membacakan apa yang terjadi
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [variant])

  async function runAction(action) {
    if (action === 'retry' && onRetry) {
      setBusy(true)
      try {
        await onRetry()
      } finally {
        setBusy(false)
      }
      return
    }
    window.location.reload()
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <span className={`${styles.deco} ${styles.decoTopRight}`} aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoTopRightDot}`} aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoBottomLeft}`} aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoDotA}`} aria-hidden="true" />
        <span className={`${styles.deco} ${styles.decoDotB}`} aria-hidden="true" />

        <div className={styles.content}>
          <div
            className={`${styles.halo} ${page.rings === 2 ? styles.haloDouble : styles.haloSingle}`}
            aria-hidden="true"
          >
            <span className={styles.core}>
              <Icon size={34} strokeWidth={1.9} />
            </span>
          </div>

          {page.code && (
            <p className={styles.code} aria-hidden="true">
              {page.code}
            </p>
          )}

          <div className={styles.text} aria-live={page.live ? 'polite' : undefined}>
            <h1
              ref={titleRef}
              tabIndex={-1}
              className={`${styles.title} ${page.code ? '' : styles.titleNoCode}`}
            >
              {page.title}
            </h1>
            <p className={styles.description}>{page.description}</p>
          </div>

          {estimasi && (
            <p className={styles.estimate}>
              <Clock size={18} strokeWidth={2} aria-hidden="true" />
              {estimasi}
            </p>
          )}

          <div className={styles.actions}>
            {page.actions.map((a) => {
              const ActionIcon = a.icon ? ICONS[a.icon] : null
              const isBusy = busy && a.action === 'retry'
              return (
                <Button
                  key={a.label}
                  variant={a.variant}
                  href={a.href}
                  onClick={a.href ? undefined : () => runAction(a.action)}
                  className={styles.btn}
                  disabled={isBusy}
                >
                  {ActionIcon && <ActionIcon size={16} strokeWidth={2.2} aria-hidden="true" />}
                  {isBusy ? a.busyLabel : a.label}
                </Button>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ErrorPage
