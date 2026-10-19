// App.jsx – "Router manual" berbasis window.location.pathname.
// Ini solusi sementara sampai tim menyepakati library router (mis. React Router).
// Navigasi menggunakan history.replaceState + listener popstate & pageshow.

import { useState, useEffect, useCallback } from 'react'
import Home from './pages/public/Home/Home'
import Login from './pages/admin/Login/Login'
import Dashboard from './pages/admin/Dashboard/Dashboard'
import { SESI_BERAKHIR_KEY } from './pages/admin/Dashboard/Dashboard'
import { ROUTES } from './constants/routes'
import { getToken, isTokenExpired, clearSession } from './utils/auth'

// ── Konstanta rute ────────────────────────────────────────────────────────────
const PATH_HOME = '/'
const PATH_ADMIN = ROUTES.admin || '/admin'
const PATH_LOGIN = ROUTES.adminLogin || '/admin/login'

// ── Penjaga sesi ─────────────────────────────────────────────────────────────
// Kembalikan halaman yang seharusnya ditampilkan berdasarkan token dan pathname.
function halamanYangTepat(pathname) {
  const token = getToken()
  const expired = isTokenExpired(token)
  // Normalisasi: hilangkan trailing slash (misal /admin/login/ -> /admin/login)
  const normalized = (pathname || '').replace(/\/+$/, '') || '/'

  if (normalized === PATH_ADMIN) {
    // Tanpa token atau token kedaluwarsa → paksa ke login
    if (!token || expired) return PATH_LOGIN
    return PATH_ADMIN
  }
  if (normalized === PATH_LOGIN) {
    // Sudah login valid → langsung ke dashboard
    if (token && !expired) return PATH_ADMIN
    return PATH_LOGIN
  }
  // Selain /admin dan /admin/login → halaman publik
  return PATH_HOME
}

// Tentukan halaman awal dan koreksi URL sekaligus (sebelum React render pertama)
function inisialisasiHalaman() {
  const target = halamanYangTepat(window.location.pathname)
  // Koreksi URL tanpa memicu popstate (replaceState tidak memicu popstate)
  if (target !== window.location.pathname) {
    window.history.replaceState(null, '', target)
  }
  return target
}

// Baca + hapus pesan sesi dari sessionStorage (sekali pakai)
function ambilPesanSesi() {
  const msg = sessionStorage.getItem(SESI_BERAKHIR_KEY) || ''
  if (msg) sessionStorage.removeItem(SESI_BERAKHIR_KEY)
  return msg
}

// ── Komponen App ──────────────────────────────────────────────────────────────
function App() {
  // State halaman aktif – inisialisasi sekaligus koreksi URL
  const [halaman, setHalaman] = useState(inisialisasiHalaman)
  // Pesan "Sesi berakhir" — ditampilkan sekali di halaman Login
  const [sessionMessage, setSessionMessage] = useState(ambilPesanSesi)

  // ── Navigasi ────────────────────────────────────────────────────────────────

  // Navigasi ke dashboard setelah login berhasil (replaceState agar Back tidak membuka form login)
  const goToDashboard = useCallback(() => {
    window.history.replaceState(null, '', PATH_ADMIN)
    setHalaman(PATH_ADMIN)
    setSessionMessage('')
  }, [])

  // Logout: hapus sesi dan balik ke login dengan replaceState.
  // Setelah ini tombol Back browser tidak bisa membuka dashboard.
  const handleLogout = useCallback(() => {
    clearSession()
    window.history.replaceState(null, '', PATH_LOGIN)
    setHalaman(PATH_LOGIN)
    setSessionMessage('')
  }, [])

  // ── Listener popstate + pageshow ─────────────────────────────────────────────
  useEffect(() => {
    // popstate: dipicu oleh tombol Back/Forward browser atau dispatchEvent manual
    function onPopState() {
      const target = halamanYangTepat(window.location.pathname)

      // Jika Back browser coba buka /admin tanpa sesi valid → paksa ke login via replaceState
      if (target !== window.location.pathname) {
        window.history.replaceState(null, '', target)
      }

      // Baca pesan sesi berakhir jika ada (dari dispatch manual di Dashboard)
      setSessionMessage(ambilPesanSesi())
      setHalaman(target)
    }

    // pageshow: menangkap cache back/forward (bfcache) — browser tidak
    // menjalankan ulang JS untuk halaman dari cache; event ini tetap berjalan.
    function onPageShow(e) {
      if (e.persisted) {
        // Halaman dikembalikan dari cache; periksa ulang token
        const target = halamanYangTepat(window.location.pathname)
        if (target !== window.location.pathname) {
          window.history.replaceState(null, '', target)
        }
        setSessionMessage(ambilPesanSesi())
        setHalaman(target)
      }
    }

    window.addEventListener('popstate', onPopState)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────
  if (halaman === PATH_LOGIN) {
    return (
      <Login
        onLoginSuccess={goToDashboard}
        sessionMessage={sessionMessage}
      />
    )
  }

  if (halaman === PATH_ADMIN) {
    return (
      <Dashboard
        onLogout={handleLogout}
        sessionMessage={sessionMessage}
      />
    )
  }

  // Default: halaman publik
  return <Home />
}

export default App
