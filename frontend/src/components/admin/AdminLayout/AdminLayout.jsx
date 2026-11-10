import { useEffect, useState } from 'react'
import { LogOut, Menu as MenuIcon, User, X } from 'lucide-react'
import logo from '../../../assets/images/logo-himafor.webp'
import { GRUP_MENU, MENU, bolehAkses, cariMenu } from './menu'
import CariAdmin from './CariAdmin'
import { Akun, Notifikasi } from './TopbarMenu'
import styles from './AdminLayout.module.css'

const NAMA_ROLE = { admin: 'Administrator', editor: 'Editor' }

// Klik biasa dialihkan ke navigasi internal; Ctrl/Cmd/Shift/klik tengah tetap dibuka browser.
function klikBiasa(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

// Kerangka halaman admin: menu samping + bilah atas. Dipakai semua halaman kelola.
// activePath  : path menu yang menyala (salah satu path di MENU)
// currentPath : path yang sedang tampil; beda dari activePath di sub-halaman (mis. /admin/berita/tambah).
//               Bila tidak diisi dianggap sama dengan activePath.
// subLabel    : nama sub-halaman untuk breadcrumb ("Tambah Berita"), opsional
// onNavigate  : (path) => void ; onLogout : () => void
// notifikasi  : [{ id, judul, pesan, waktu, path, dibaca }] untuk lonceng (kontrak belum punya endpoint, default kosong)
// pesanBaru   : jumlah Pesan Masuk belum dibaca untuk lencana di menu (0 = lencana tidak tampil)
function AdminLayout({ user, activePath, currentPath, subLabel, onNavigate, onLogout, notifikasi = [], pesanBaru = 0, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const aktif = cariMenu(activePath)
  const role = user?.role
  const nama = user?.name || 'Pengguna'
  const lokasiSaatIni = currentPath ?? activePath

  // Judul tab sesuai halaman, dikembalikan saat layout dilepas
  useEffect(() => {
    const sebelumnya = document.title
    document.title = `${subLabel ?? aktif?.label ?? 'Admin'} | Admin HIMAFOR`
    return () => {
      document.title = sebelumnya
    }
  }, [aktif, subLabel])

  // Escape menutup menu di layar kecil
  useEffect(() => {
    if (!drawerOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // Tujuan yang sama dengan halaman yang sedang tampil tidak perlu didorong ke riwayat lagi.
  // Dari sub-halaman, klik menu induknya (mis. "Berita") tetap berpindah ke halaman utama menu.
  function pergi(e, path) {
    if (!klikBiasa(e)) return
    e.preventDefault()
    setDrawerOpen(false)
    if (path !== lokasiSaatIni) onNavigate(path)
  }

  // Berpindah dari bilah atas (hasil pencarian, notifikasi): sama seperti klik menu, tanpa menumpuk riwayat.
  function keHalaman(path) {
    setDrawerOpen(false)
    if (path !== lokasiSaatIni) onNavigate(path)
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#konten-admin">Lewati ke konten</a>

      <aside
        id="menu-admin"
        className={`${styles.sidebar} ${drawerOpen ? styles.open : ''}`}
        aria-label="Menu admin"
      >
        <div className={styles.brand}>
          <span className={styles.brandLogo}>
            <img src={logo} alt="" width="38" height="39" />
          </span>
          <div className={styles.brandText}>
            <p className={styles.brandName}>HIMAFOR</p>
            <p className={styles.brandSub}>Admin Panel</p>
          </div>
          <button
            type="button"
            className={styles.closeDrawer}
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.nav}>
          {GRUP_MENU.map((grup) => {
            const items = MENU.filter((m) => m.group === grup.key && bolehAkses(m, role))
            if (items.length === 0) return null
            return (
              <div key={grup.key} className={styles.group}>
                <p className={styles.groupLabel}>{grup.label}</p>
                <ul className={styles.list}>
                  {items.map((item) => {
                    const Icon = item.icon
                    const sedangAktif = item.path === activePath
                    return (
                      <li key={item.key}>
                        <a
                          href={item.path}
                          className={`${styles.item} ${sedangAktif ? styles.itemActive : ''}`}
                          aria-current={sedangAktif ? 'page' : undefined}
                          onClick={(e) => pergi(e, item.path)}
                        >
                          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                          <span>{item.label}</span>
                          {item.key === 'pesan' && pesanBaru > 0 && (
                            <span className={styles.badge} aria-label={`${pesanBaru} pesan belum dibaca`}>
                              {pesanBaru > 99 ? '99+' : pesanBaru}
                            </span>
                          )}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className={styles.profile}>
          <div className={styles.profileTop}>
            <span className={styles.avatar}>
              <User size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div className={styles.profileText}>
              <p className={styles.profileName}>{nama}</p>
              <p className={styles.profileRole}>{NAMA_ROLE[role] ?? 'Pengguna'}</p>
            </div>
          </div>
          <button type="button" className={styles.logout} onClick={onLogout}>
            <LogOut size={17} strokeWidth={2} aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {drawerOpen && <div className={styles.scrim} onClick={() => setDrawerOpen(false)} aria-hidden="true" />}

      <div className={styles.body}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.burger}
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
            aria-expanded={drawerOpen}
            aria-controls="menu-admin"
          >
            <MenuIcon size={22} strokeWidth={2} aria-hidden="true" />
          </button>

          <nav className={styles.crumbs} aria-label="Lokasi halaman">
            <span className={styles.crumbRoot}>Admin</span>
            <span className={styles.crumbSep} aria-hidden="true">/</span>
            {subLabel ? (
              <>
                <a
                  href={activePath}
                  className={`${styles.crumbRoot} ${styles.crumbLink}`}
                  onClick={(e) => pergi(e, activePath)}
                >
                  {aktif?.label ?? 'Admin'}
                </a>
                <span className={styles.crumbSep} aria-hidden="true">/</span>
                <span className={styles.crumbNow} aria-current="page">{subLabel}</span>
              </>
            ) : (
              <span className={styles.crumbNow}>{aktif?.label ?? 'Admin'}</span>
            )}
          </nav>

          <div className={styles.tools}>
            <CariAdmin role={role} onPergi={keHalaman} />
            <Notifikasi daftar={notifikasi} onPergi={keHalaman} />
            <Akun nama={nama} email={user?.email} peran={NAMA_ROLE[role]} onLogout={onLogout} />
          </div>
        </header>

        <main id="konten-admin" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
