import { useRef, useState } from 'react'
import { Bell, BellOff, ChevronDown, ExternalLink, LogOut, User } from 'lucide-react'
import { useTutupLuar } from '../../../hooks/useTutupLuar'
import { klikBiasa } from '../../../utils/nav'
import styles from './TopbarMenu.module.css'

// Pindah fokus antar menuitem dengan panah atas/bawah, Home, dan End.
function geserFokus(e, panel) {
  const daftar = [...panel.querySelectorAll('[role="menuitem"]')]
  if (daftar.length === 0) return
  const i = daftar.indexOf(document.activeElement)
  let tujuan = null
  if (e.key === 'ArrowDown') tujuan = daftar[(i + 1) % daftar.length]
  else if (e.key === 'ArrowUp') tujuan = daftar[(i - 1 + daftar.length) % daftar.length]
  else if (e.key === 'Home') tujuan = daftar[0]
  else if (e.key === 'End') tujuan = daftar[daftar.length - 1]
  if (tujuan) {
    e.preventDefault()
    tujuan.focus()
  }
}

// Lonceng notifikasi. Kontrak v1.3 belum punya endpoint notifikasi atau pesan masuk, jadi daftar
// diisi dari luar lewat prop `daftar` ([{ id, judul, pesan, waktu, path, dibaca }]); selama kosong
// panel menampilkan keadaan kosong dan titik merah tidak muncul.
export function Notifikasi({ daftar = [], onPergi }) {
  const [buka, setBuka] = useState(false)
  const wadahRef = useRef(null)
  const tombolRef = useRef(null)
  const belumBaca = daftar.filter((n) => !n.dibaca).length

  useTutupLuar(wadahRef, buka, (dariEsc) => {
    setBuka(false)
    if (dariEsc) tombolRef.current?.focus()
  })

  return (
    <div ref={wadahRef} className={styles.wadah}>
      <button
        ref={tombolRef}
        type="button"
        className={`${styles.bell} ${buka ? styles.bellAktif : ''}`}
        aria-label={belumBaca > 0 ? `Notifikasi, ${belumBaca} belum dibaca` : 'Notifikasi'}
        aria-haspopup="dialog"
        aria-expanded={buka}
        onClick={() => setBuka((v) => !v)}
      >
        <Bell size={18} strokeWidth={1.9} aria-hidden="true" />
        {belumBaca > 0 && <span className={styles.titik} aria-hidden="true" />}
      </button>

      {buka && (
        <div role="dialog" aria-label="Notifikasi" className={`${styles.panel} ${styles.panelNotif}`}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelJudul}>Notifikasi</h2>
            {belumBaca > 0 && <span className={styles.jumlah}>{belumBaca} baru</span>}
          </div>
          {daftar.length === 0 ? (
            <div className={styles.kosong}>
              <span className={styles.kosongIkon} aria-hidden="true">
                <BellOff size={22} strokeWidth={1.8} />
              </span>
              <p className={styles.kosongJudul}>Belum ada notifikasi</p>
              <p className={styles.kosongTeks}>Pesan masuk dan pembaruan penting akan muncul di sini.</p>
            </div>
          ) : (
            <ul className={styles.notifDaftar}>
              {daftar.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`${styles.notif} ${n.dibaca ? '' : styles.notifBaru}`}
                    onClick={() => {
                      setBuka(false)
                      if (n.path) onPergi(n.path)
                    }}
                  >
                    <span className={styles.notifJudul}>{n.judul}</span>
                    {n.pesan && <span className={styles.notifPesan}>{n.pesan}</span>}
                    {n.waktu && <span className={styles.notifWaktu}>{n.waktu}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// Menu akun: nama, email, peran, lalu Lihat Website dan Keluar.
export function Akun({ nama, email, peran, onLogout }) {
  const [buka, setBuka] = useState(false)
  const [keluar, setKeluar] = useState(false)
  const wadahRef = useRef(null)
  const tombolRef = useRef(null)
  const panelRef = useRef(null)

  useTutupLuar(wadahRef, buka, (dariEsc) => {
    setBuka(false)
    if (dariEsc) tombolRef.current?.focus()
  })

  function bukaMenu() {
    setBuka((v) => !v)
  }

  async function klikKeluar() {
    if (keluar) return
    setKeluar(true)
    try {
      await onLogout()
    } finally {
      setKeluar(false)
    }
  }

  return (
    <div ref={wadahRef} className={styles.wadah}>
      <button
        ref={tombolRef}
        type="button"
        className={`${styles.akun} ${buka ? styles.akunAktif : ''}`}
        aria-haspopup="menu"
        aria-expanded={buka}
        aria-label={`Menu akun ${nama}`}
        onClick={bukaMenu}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !buka) {
            e.preventDefault()
            setBuka(true)
          }
        }}
      >
        <span className={styles.akunAvatar}>
          <User size={18} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className={styles.akunNama}>{nama}</span>
        <ChevronDown className={`${styles.akunChevron} ${buka ? styles.akunChevronBuka : ''}`} size={16} strokeWidth={2} aria-hidden="true" />
      </button>

      {buka && (
        <div
          ref={(el) => {
            panelRef.current = el
            // Fokus awal ke menuitem pertama begitu panel tampil
            if (el && !el.contains(document.activeElement)) el.querySelector('[role="menuitem"]')?.focus()
          }}
          role="menu"
          aria-label="Menu akun"
          className={`${styles.panel} ${styles.panelAkun}`}
          onKeyDown={(e) => geserFokus(e, panelRef.current)}
        >
          <div className={styles.akunInfo}>
            <span className={styles.akunAvatarBesar}>
              <User size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div className={styles.akunTeks}>
              <p className={styles.akunInfoNama}>{nama}</p>
              {email && <p className={styles.akunEmail}>{email}</p>}
              {peran && <span className={styles.peran}>{peran}</span>}
            </div>
          </div>
          <a
            role="menuitem"
            className={styles.menuItem}
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (klikBiasa(e)) setBuka(false)
            }}
          >
            <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            Lihat Website
          </a>
          <button
            type="button"
            role="menuitem"
            className={`${styles.menuItem} ${styles.menuKeluar}`}
            onClick={klikKeluar}
            disabled={keluar}
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
            {keluar ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      )}
    </div>
  )
}
