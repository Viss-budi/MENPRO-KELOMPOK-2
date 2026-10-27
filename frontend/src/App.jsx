// App.jsx – "Router manual" berbasis window.location.pathname.
// Ini solusi sementara sampai tim menyepakati library router (mis. React Router).
// Navigasi menggunakan history.replaceState + listener popstate & pageshow.

import { useState, useEffect, useCallback } from 'react'
import Home from './pages/public/Home/Home'
import Login from './pages/admin/Login/Login'
import Dashboard from './pages/admin/Dashboard/Dashboard'
import Kelola from './pages/admin/Kelola/Kelola'
import KelolaBerita from './pages/admin/Berita/KelolaBerita'
import AdminLayout from './components/admin/AdminLayout/AdminLayout'
import { bolehAkses, cariMenu, labelSubhalaman } from './components/admin/AdminLayout/menu'
import SesiLoading from './components/admin/SesiLoading/SesiLoading'
import ErrorPage from './components/common/ErrorPage/ErrorPage'
import { ROUTES } from './constants/routes'
import { ERROR_PAGES, MAINTENANCE_EVENT } from './constants/errorPages'
import { PESAN_SESI_BERAKHIR, SESI_BERAKHIR_EVENT } from './constants/auth'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { getMe, logoutAdmin } from './services/api'

// ── Konstanta rute ────────────────────────────────────────────────────────────
const PATH_HOME = '/'
const PATH_ADMIN = ROUTES.admin || '/admin'
const PATH_LOGIN = ROUTES.adminLogin || '/admin/login'

// Nilai "halaman" yang bukan path sungguhan (tidak diawali '/'), jadi URL tidak ikut dikoreksi
const PAGE_NOT_FOUND = 'not-found'
const PAGE_ADMIN_LOADING = 'admin-loading' // menunggu GET /auth/me
const PAGE_ADMIN_ERROR = 'admin-error' // /auth/me gagal karena jaringan atau server
const PREVIEW_PREFIX = '/_error/' // hanya mode dev: /_error/404, /_error/500, dst.

// Mode pemeliharaan lewat frontend/.env (nilai dibaca saat build/restart dev server):
//   VITE_MAINTENANCE=true
//   VITE_MAINTENANCE_UNTIL=2026-10-25 00:00:00   (opsional, WIB)
const MAINTENANCE_AWAL =
  import.meta.env.VITE_MAINTENANCE === 'true'
    ? { estimatedEnd: import.meta.env.VITE_MAINTENANCE_UNTIL || null }
    : null

// Rute publik yang halamannya belum dibuat: sementara tetap menampilkan Home (perilaku lama).
// Hapus dari daftar ini setiap kali halamannya selesai dibuat.
const RUTE_PUBLIK_BELUM_ADA = [ROUTES.agenda, ROUTES.tentang, ROUTES.dokumentasi, ROUTES.prestasi]

// ── Penjaga sesi ─────────────────────────────────────────────────────────────
// Sesi memakai cookie HttpOnly, jadi frontend tidak bisa membacanya. Status sesi
// ditanyakan ke server lewat GET /auth/me (kontrak 4.3 dan 7.2), lalu disimpan di state:
//   'unknown' = belum dicek | 'in' = login | 'out' = belum login | 'error' = gagal mengecek
// Tidak ada apa pun tentang sesi yang disimpan di localStorage.

function normalisasi(pathname) {
  // Hilangkan trailing slash (misal /admin/login/ -> /admin/login)
  return (pathname || '').replace(/\/+$/, '') || '/'
}

// Halaman admin = login + semua path di menu admin (termasuk sub-halamannya, mis. /admin/berita/tambah).
// Path /admin/xyz lain dianggap 404.
function wilayahAdmin(path) {
  return path === PATH_LOGIN || cariMenu(path) !== null
}

// Kembalikan halaman yang seharusnya ditampilkan berdasarkan pathname dan status sesi.
function halamanYangTepat(pathname, status) {
  const path = normalisasi(pathname)

  if (wilayahAdmin(path)) {
    if (status === 'unknown') return PAGE_ADMIN_LOADING
    if (status === 'error') return PAGE_ADMIN_ERROR
    if (path === PATH_LOGIN) return status === 'in' ? PATH_ADMIN : PATH_LOGIN
    return status === 'in' ? path : PATH_LOGIN
  }
  if (path === PATH_HOME || RUTE_PUBLIK_BELUM_ADA.includes(path)) return PATH_HOME

  // Pratinjau halaman error saat pengembangan
  if (import.meta.env.DEV && path.startsWith(PREVIEW_PREFIX)) {
    const variant = path.slice(PREVIEW_PREFIX.length)
    if (ERROR_PAGES[variant]) return `preview:${variant}`
  }

  // Path lain (termasuk /admin/xyz) tidak dikenal -> 404 (URL dibiarkan apa adanya)
  return PAGE_NOT_FOUND
}

// Bersihkan sisa sesi versi lama (kontrak 1.0 menyimpan token di localStorage)
function bersihkanSisaSesiLama() {
  try {
    localStorage.removeItem('himafor_token')
    localStorage.removeItem('himafor_user')
  } catch {
    // localStorage dinonaktifkan; tidak ada yang perlu dibersihkan
  }
}

// ── Komponen App ──────────────────────────────────────────────────────────────
function App() {
  const [pathname, setPathname] = useState(() => normalisasi(window.location.pathname))
  const [auth, setAuth] = useState({ status: 'unknown', user: null })
  // Pesan "Sesi berakhir" - ditampilkan di halaman Login sampai pengguna login lagi
  const [sessionMessage, setSessionMessage] = useState('')
  // Status koneksi & mode pemeliharaan untuk halaman publik
  const { online, retry } = useOnlineStatus()
  const [maintenance, setMaintenance] = useState(MAINTENANCE_AWAL) // { estimatedEnd } | null

  const halaman = halamanYangTepat(pathname, auth.status)
  const perluCekSesi = wilayahAdmin(pathname)

  // ── Navigasi ────────────────────────────────────────────────────────────────

  // Pindah halaman di dalam admin; push supaya tombol Back kembali ke halaman sebelumnya
  const navigate = useCallback((path) => {
    window.history.pushState(null, '', path)
    setPathname(normalisasi(path))
    window.scrollTo(0, 0)
  }, [])

  // Login berhasil: simpan user; halaman otomatis berpindah ke dashboard (lihat efek koreksi URL)
  const handleLoginSuccess = useCallback((user) => {
    setSessionMessage('')
    setAuth({ status: 'in', user })
  }, [])

  // Logout: cabut sesi di server, lalu kembali ke login. Back tidak bisa membuka dashboard lagi
  // karena halaman admin selalu dicek ulang terhadap status sesi.
  const handleLogout = useCallback(async () => {
    await logoutAdmin()
    setSessionMessage('')
    setAuth({ status: 'out', user: null })
  }, [])

  // ── Koreksi URL: samakan alamat di bar browser dengan halaman yang tampil ─────
  useEffect(() => {
    if (halaman.startsWith('/') && halaman !== normalisasi(window.location.pathname)) {
      window.history.replaceState(null, '', halaman)
    }
  }, [halaman])

  // ── Cek sesi: dilakukan sekali saat halaman admin/login dibuka ────────────────
  useEffect(() => {
    if (!perluCekSesi || auth.status !== 'unknown') return undefined
    const ac = new AbortController()
    getMe(ac.signal)
      .then((user) => setAuth(user ? { status: 'in', user } : { status: 'out', user: null }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setAuth({ status: 'error', user: null })
      })
    return () => ac.abort()
  }, [perluCekSesi, auth.status])

  useEffect(bersihkanSisaSesiLama, [])

  // ── Listener popstate + pageshow ─────────────────────────────────────────────
  useEffect(() => {
    // popstate: tombol Back/Forward browser
    function onPopState() {
      setPathname(normalisasi(window.location.pathname))
    }

    // pageshow: halaman dikembalikan dari cache back/forward (bfcache), JS tidak berjalan ulang.
    // Status sesi bisa sudah basi, jadi minta dicek ulang ke server.
    function onPageShow(e) {
      if (!e.persisted) return
      setPathname(normalisasi(window.location.pathname))
      setAuth({ status: 'unknown', user: null })
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  // ── Sesi habis: api.js mengirim event ini saat endpoint dashboard membalas 401 ─
  useEffect(() => {
    function onSesiBerakhir() {
      setSessionMessage(PESAN_SESI_BERAKHIR)
      setAuth({ status: 'out', user: null })
    }
    window.addEventListener(SESI_BERAKHIR_EVENT, onSesiBerakhir)
    return () => window.removeEventListener(SESI_BERAKHIR_EVENT, onSesiBerakhir)
  }, [])

  // ── Listener pemeliharaan: api.js mengirim event ini jika server membalas 503 ─
  useEffect(() => {
    const onMaintenance = (e) => setMaintenance({ estimatedEnd: e.detail?.estimatedEnd ?? null })
    window.addEventListener(MAINTENANCE_EVENT, onMaintenance)
    return () => window.removeEventListener(MAINTENANCE_EVENT, onMaintenance)
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────
  if (halaman === PAGE_ADMIN_LOADING) return <SesiLoading />
  if (halaman === PAGE_ADMIN_ERROR) return <ErrorPage variant="500" />

  if (halaman === PATH_LOGIN) {
    return <Login onLoginSuccess={handleLoginSuccess} sessionMessage={sessionMessage} />
  }

  const itemAdmin = cariMenu(halaman)
  if (itemAdmin) {
    const akses = bolehAkses(itemAdmin, auth.user?.role)

    // Menu tetap menyala di sub-halaman (activePath = path menu), sedangkan breadcrumb
    // menampilkan nama sub-halamannya (subLabel), mis. "Admin / Berita / Tambah Berita".
    let isi
    if (halaman === PATH_ADMIN) {
      isi = <Dashboard user={auth.user} onNavigate={navigate} />
    } else if (itemAdmin.key === 'berita' && akses) {
      isi = <KelolaBerita pathname={halaman} onNavigate={navigate} />
    } else {
      isi = <Kelola item={itemAdmin} akses={akses} onNavigate={navigate} />
    }

    return (
      <AdminLayout
        user={auth.user}
        activePath={itemAdmin.path}
        currentPath={halaman}
        subLabel={labelSubhalaman(itemAdmin, halaman)}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        {isi}
      </AdminLayout>
    )
  }

  // ── Halaman publik ──────────────────────────────────────────────────────────
  if (halaman.startsWith('preview:')) {
    return (
      <ErrorPage
        variant={halaman.slice('preview:'.length)}
        estimatedEnd="2026-10-25 00:00:00"
        onRetry={retry}
      />
    )
  }
  if (!online) return <ErrorPage variant="offline" onRetry={retry} />
  if (maintenance) return <ErrorPage variant="maintenance" estimatedEnd={maintenance.estimatedEnd} />
  if (halaman === PAGE_NOT_FOUND) return <ErrorPage variant="404" />

  return <Home />
}

export default App
