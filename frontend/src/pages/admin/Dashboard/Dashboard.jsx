import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CircleAlert,
  Clock,
  Image as ImageIcon,
  Newspaper,
  RefreshCw,
  Trophy,
  User,
} from 'lucide-react'
import { getAdminSummary } from '../../../services/api'
import { ROUTES } from '../../../constants/routes'
import styles from './Dashboard.module.css'

// Kartu ringkasan (urutan dan nama sesuai desain UI/UX).
// key = nama kunci pada GET /admin/summary (kontrak 5.1). Saat ini backend baru mengirim
// events, news, members. Kartu yang kuncinya belum ada di respons tampil "Belum tersedia";
// begitu backend menambahkan kuncinya, angka langsung muncul tanpa mengubah kode ini.
const KARTU = [
  { key: 'events', label: 'Kegiatan', icon: CalendarCheck, path: `${ROUTES.admin}/kegiatan` },
  { key: 'news', label: 'Berita', icon: Newspaper, path: `${ROUTES.admin}/berita` },
  { key: 'agenda', label: 'Agenda', icon: Calendar, path: `${ROUTES.admin}/kalender` },
  { key: 'galleries', label: 'Dokumentasi', icon: ImageIcon, path: `${ROUTES.admin}/dokumentasi` },
  { key: 'achievements', label: 'Prestasi', icon: Trophy, path: `${ROUTES.admin}/prestasi` },
]

const ZONA = 'Asia/Jakarta'
const formatHari = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA,
})
const formatJam = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA,
})

// Ambil jumlah dari ringkasan; null bila kunci tidak ada atau bukan angka.
function ambilJumlah(ringkasan, key) {
  const total = Number(ringkasan?.[key]?.total)
  return Number.isFinite(total) && total >= 0 ? total : null
}

function klikBiasa(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

// status: 'loading' | 'ready' | 'error'
function Dashboard({ user, onNavigate }) {
  const [status, setStatus] = useState('loading')
  const [ringkasan, setRingkasan] = useState(null)
  const [diperbarui, setDiperbarui] = useState(null)
  const abortRef = useRef(null)
  const [hariIni] = useState(() => new Date())

  // Mengambil ringkasan. Status awal sudah 'loading', jadi pemanggilan pertama tidak perlu mengubahnya.
  const ambil = useCallback((ac) => {
    getAdminSummary(ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return
        setRingkasan(data)
        setDiperbarui(new Date())
        setStatus('ready')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setStatus('error')
      })
  }, [])

  // Setiap halaman dibuka (termasuk kembali dari halaman kelola) angka diambil ulang dari server.
  useEffect(() => {
    const ac = new AbortController()
    abortRef.current = ac
    ambil(ac)
    return () => ac.abort()
  }, [ambil])

  function muatUlang() {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setStatus('loading')
    ambil(ac)
  }

  const loading = status === 'loading'
  const error = status === 'error'
  const nama = user?.name || 'Pengguna'

  function bukaKelola(e, path) {
    if (!klikBiasa(e)) return
    e.preventDefault()
    onNavigate(path)
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Berikut ringkasan data website HIMAFOR.</p>
      </header>

      <section className={styles.banner} aria-label="Sambutan">
        <span className={`${styles.dot} ${styles.dotA}`} aria-hidden="true" />
        <span className={`${styles.dot} ${styles.dotB}`} aria-hidden="true" />
        <span className={`${styles.dot} ${styles.dotC}`} aria-hidden="true" />
        <span className={styles.wedge} aria-hidden="true" />
        <span className={styles.bannerAvatar}>
          <User size={30} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <div className={styles.bannerText}>
          <h2 className={styles.bannerTitle}>Selamat datang, {nama}</h2>
          <p className={styles.bannerSub}>Pantau jumlah data tiap modul dalam sekali lihat.</p>
        </div>
        <p className={styles.date}>
          <Calendar size={16} strokeWidth={2} aria-hidden="true" />
          {formatHari.format(hariIni)}
        </p>
      </section>

      <section className={styles.summary} aria-labelledby="judul-ringkasan" aria-busy={loading}>
        <div className={styles.summaryHead}>
          <h2 id="judul-ringkasan" className={styles.summaryTitle}>Ringkasan Data</h2>

          <div className={styles.summaryTools}>
            <p className={`${styles.meta} ${error ? styles.metaError : ''}`} role="status" aria-live="polite">
              {loading && (
                <>
                  <RefreshCw className={styles.spin} size={15} strokeWidth={2} aria-hidden="true" />
                  Memuat data...
                </>
              )}
              {error && (
                <>
                  <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
                  Gagal memuat data
                </>
              )}
              {status === 'ready' && diperbarui && (
                <>
                  <Clock size={15} strokeWidth={2} aria-hidden="true" />
                  Terakhir diperbarui {formatJam.format(diperbarui)}
                </>
              )}
            </p>
            <button
              type="button"
              className={`${styles.reload} ${error ? styles.reloadError : ''}`}
              onClick={muatUlang}
              disabled={loading}
            >
              <RefreshCw size={16} strokeWidth={2.1} aria-hidden="true" />
              Muat Ulang
            </button>
          </div>
        </div>

        <ul className={styles.grid}>
          {KARTU.map(({ key, label, icon: Icon, path }) => {
            const jumlah = status === 'ready' ? ambilJumlah(ringkasan, key) : null
            return (
              <li key={key} className={`${styles.card} ${error ? styles.cardError : ''}`}>
                <span className={styles.cardIcon}>
                  <Icon size={24} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <p className={styles.cardLabel}>{label}</p>

                <div className={styles.cardValue}>
                  {loading && <span className={styles.skelNum} aria-hidden="true" />}
                  {error && (
                    <p className={styles.errorMsg}>
                      <CircleAlert size={15} strokeWidth={2.1} aria-hidden="true" />
                      Data belum dapat dimuat
                    </p>
                  )}
                  {status === 'ready' && jumlah !== null && (
                    <>
                      <span className={styles.number} aria-label={`${label}: ${jumlah}`}>{jumlah}</span>
                      {jumlah === 0 && <span className={styles.pill}>Belum ada data</span>}
                    </>
                  )}
                  {status === 'ready' && jumlah === null && (
                    <>
                      <span className={`${styles.number} ${styles.numberOff}`} aria-hidden="true">–</span>
                      <span className={styles.pill}>Belum tersedia</span>
                    </>
                  )}
                </div>

                {loading && <span className={styles.skelLink} aria-hidden="true" />}
                {error && (
                  <span className={`${styles.link} ${styles.linkOff}`} aria-disabled="true">Kelola</span>
                )}
                {status === 'ready' && (
                  <a href={path} className={styles.link} onClick={(e) => bukaKelola(e, path)}>
                    Kelola
                    <ArrowRight size={16} strokeWidth={2.1} aria-hidden="true" />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export default Dashboard
