import { useEffect, useState } from 'react'
import { Menu, Search, X } from 'lucide-react'
import Button from '../../common/Button/Button'
import { NAV_ITEMS, NAV_CTA } from '../../../constants/navigation'
import logo from '../../../assets/images/logo-himafor.webp'
import styles from './Navbar.module.css'

// Menu yang sedang aktif: hash di URL, atau path halaman. Tanpa hash di "/" = Beranda.
function currentKey() {
  if (window.location.hash) return window.location.hash
  return window.location.pathname === '/' ? '#beranda' : window.location.pathname
}

// Navbar sengaja statis: tidak memanggil API dan logo ikut ter-bundle,
// jadi struktur menu tetap tampil walau sinyal buruk atau backend mati.
function Navbar() {
  const [active, setActive] = useState(currentKey)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sync = () => setActive(currentKey())
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const closeMenu = () => setOpen(false)

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="#beranda" className={styles.brand} onClick={closeMenu} aria-label="HIMAFOR, ke Beranda">
          <img src={logo} alt="Logo HIMAFOR" className={styles.logo} width="65" height="67" />
          <span className={styles.brandText}>
            <span className={styles.brandName}>HIMAFOR</span>
            <span className={styles.brandSub}>Himpunan Mahasiswa Informatika</span>
          </span>
        </a>

        <nav
          id="menu-utama"
          aria-label="Navigasi utama"
          className={`${styles.nav} ${open ? styles.navOpen : ''}`}
        >
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  data-label={item.label}
                  className={`${styles.link} ${active === item.href ? styles.linkActive : ''}`}
                  aria-current={active === item.href ? 'page' : undefined}
                  onClick={() => {
                    setActive(item.href)
                    closeMenu()
                  }}
                >
                  <span className={styles.label}>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <Button href={NAV_CTA.href} className={`${styles.cta} ${styles.ctaMobile}`}>
            {NAV_CTA.label}
          </Button>
        </nav>

        <div className={styles.actions}>
          {/* TODO: fitur pencarian belum ada, tombol ini hanya mengikuti desain */}
          <button type="button" className={styles.iconBtn} aria-label="Cari">
            <Search size={17.6} strokeWidth={2.5} />
          </button>
          <Button href={NAV_CTA.href} className={`${styles.cta} ${styles.ctaDesktop}`}>
            {NAV_CTA.label}
          </Button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.toggle}`}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="menu-utama"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
