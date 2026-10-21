import { useState, useRef, useId, useEffect } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, Info, Lock, User } from 'lucide-react'
import { loginAdmin } from '../../../services/api'
import gedung from '../../../assets/images/login-gedung.webp'
import logo from '../../../assets/images/logo-himafor.webp'
import styles from './Login.module.css'

// Pesan validasi sisi klien
// Teks panel kiri (sesuai desain UI/UX)
const FITUR = ['Kegiatan', 'Berita', 'Dokumentasi', 'Prestasi']

const VALIDASI = {
  usernameKosong: 'Username wajib diisi',
  passwordKosong: 'Password wajib diisi',
}

// Teks desain UI/UX untuk kredensial salah (BE membalas 401).
const PESAN_KREDENSIAL = 'Username atau password salah.'

// Lama tombol Login nonaktif setelah server membalas 429 (terlalu banyak percobaan)
const JEDA_429_MS = 30_000

// Hanya cek kolom kosong (sesuai desain). Format & kebenaran akun diputuskan BE.
function validasiForm(username, password) {
  const errors = {}
  if (!username.trim()) {
    errors.email = VALIDASI.usernameKosong
  }
  if (!password) {
    errors.password = VALIDASI.passwordKosong
  }
  return errors
}

function Login({ onLoginSuccess, sessionMessage }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [kredensialSalah, setKredensialSalah] = useState(false) // 401 → kedua kolom merah
  const [loading, setLoading] = useState(false)
  const [jeda, setJeda] = useState(false) // 429 -> tombol Login nonaktif sebentar

  // Untuk membatalkan request jika komponen dilepas
  const abortRef = useRef(null)

  // Jeda singkat setelah 429 supaya pengguna tidak terus mengirim ulang
  useEffect(() => {
    if (!jeda) return undefined
    const t = setTimeout(() => setJeda(false), JEDA_429_MS)
    return () => clearTimeout(t)
  }, [jeda])

  const emailId = useId()
  const passwordId = useId()
  const errorLiveId = useId()

  // Bersihkan error saat pengguna mulai mengetik
  function handleEmailChange(e) {
    setEmail(e.target.value)
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
    if (globalError) setGlobalError('')
    if (kredensialSalah) setKredensialSalah(false)
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value)
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }))
    if (globalError) setGlobalError('')
    if (kredensialSalah) setKredensialSalah(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading || jeda) return // Cegah kirim ganda

    // Validasi sisi klien
    const errors = validasiForm(email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    setGlobalError('')
    setKredensialSalah(false)
    setFieldErrors({})

    // Batalkan request sebelumnya jika masih berjalan
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      // Server memasang cookie sesi (HttpOnly); frontend hanya menerima data user.
      const user = await loginAdmin(email, password, abortRef.current.signal)
      // Pindah ke dashboard; App.jsx mengurus history
      onLoginSuccess(user)
    } catch (err) {
      if (err.name === 'AbortError') return
      if (err.status === 401) {
        setKredensialSalah(true)
        setGlobalError(PESAN_KREDENSIAL)
      } else if (err.status === 429) {
        // Batas percobaan login terlampaui: tampilkan pesan server, tombol dinonaktifkan sementara
        setGlobalError(err.message)
        setJeda(true)
      } else {
        setGlobalError(err.message || 'Login gagal, silakan coba lagi beberapa saat')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Lingkaran dekoratif latar kanan */}
      <span className={`${styles.blob} ${styles.blobA}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobB}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobC}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobD}`} aria-hidden="true" />

      {/* Panel kiri: foto gedung + pita biru diagonal (dekoratif) */}
      <aside className={styles.visual}>
        <div className={styles.photoClip} aria-hidden="true">
          <img src={gedung} alt="" className={styles.photo} />
          <span className={styles.photoShade} />
        </div>
        <span className={styles.stripe} aria-hidden="true" />

        <div className={styles.brand}>
          <span className={styles.brandLogo}>
            <img src={logo} alt="" width="56" height="58" />
          </span>
          <div className={styles.brandText}>
            <p className={styles.brandName}>HIMAFOR</p>
            <p className={styles.brandSub}>Admin Panel</p>
          </div>
        </div>

        <span className={styles.lines} aria-hidden="true" />

        <div className={styles.infoCard}>
          <h2 className={styles.infoTitle}>Kelola website HIMAFOR</h2>
          <p className={styles.infoText}>
            Tambah kegiatan, berita, dokumentasi, dan prestasi dalam satu tempat.
          </p>
          <ul className={styles.chips}>
            {FITUR.map((f) => (
              <li key={f} className={styles.chip}>{f}</li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Panel kanan: formulir */}
      <main className={styles.panel}>
        <a href="/" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={2.25} aria-hidden="true" />
          Kembali ke website
        </a>

        <div className={styles.content}>
          <div className={styles.logoWrap}>
            <img src={logo} alt="Logo HIMAFOR" width="94" height="97" />
          </div>
          <h1 className={styles.title}>Login Admin Panel</h1>
          <p className={styles.subtitle}>Gunakan akun admin HIMAFOR untuk melanjutkan.</p>

          {/* Area pesan (tinggi tetap agar form tidak melompat). Sesi berakhir = info biru,
              error login = merah. Dibaca pembaca layar lewat role="alert". */}
          <div className={styles.alertBox}>
            {sessionMessage && !globalError && (
              <div role="status" aria-live="polite" className={styles.infoAlert}>
                <Info size={20} strokeWidth={2} aria-hidden="true" />
                <span>{sessionMessage}</span>
              </div>
            )}
            {globalError && (
              <div id={errorLiveId} role="alert" aria-live="assertive" className={styles.errorAlert}>
                <CircleAlert size={20} strokeWidth={2} aria-hidden="true" />
                <span>{globalError}</span>
              </div>
            )}
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            aria-describedby={globalError ? errorLiveId : undefined}
          >
            {/* Kolom Email */}
            <div className={styles.field}>
              <label htmlFor={emailId} className={styles.label}>
                Username
              </label>
              <div className={styles.inputWrap}>
                <User className={styles.iconLeft} size={18} strokeWidth={1.9} aria-hidden="true" />
                <input
                  id={emailId}
                  type="text"
                  className={`${styles.input} ${fieldErrors.email || kredensialSalah ? styles.inputError : ''}`}
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={fieldErrors.email || kredensialSalah ? 'true' : 'false'}
                  aria-describedby={fieldErrors.email ? `${emailId}-err` : undefined}
                  disabled={loading}
                  placeholder="Masukkan username"
                />
              </div>
              <div className={styles.errorSlot}>
                {fieldErrors.email && (
                  <span id={`${emailId}-err`} className={styles.fieldError} role="alert" aria-live="polite">
                    {fieldErrors.email}
                  </span>
                )}
              </div>
            </div>

            {/* Kolom Password */}
            <div className={styles.field}>
              <label htmlFor={passwordId} className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrap}>
                <Lock className={styles.iconLeft} size={18} strokeWidth={1.9} aria-hidden="true" />
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPassword} ${fieldErrors.password || kredensialSalah ? styles.inputError : ''}`}
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  aria-invalid={fieldErrors.password || kredensialSalah ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? `${passwordId}-err` : undefined}
                  disabled={loading}
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                >
                  {showPassword
                    ? <EyeOff size={18} strokeWidth={1.9} aria-hidden="true" />
                    : <Eye size={18} strokeWidth={1.9} aria-hidden="true" />}
                </button>
              </div>
              <div className={styles.errorSlot}>
                {fieldErrors.password && (
                  <span id={`${passwordId}-err`} className={styles.fieldError} role="alert" aria-live="polite">
                    {fieldErrors.password}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || jeda}
              aria-busy={loading}
            >
              {loading ? 'Memproses...' : (<>Login<ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" /></>)}
            </button>
          </form>

          <p className={styles.note}>
            <Lock size={14} strokeWidth={1.75} aria-hidden="true" />
            Hanya untuk pengurus HIMAFOR yang terdaftar.
          </p>
        </div>

        <p className={styles.copyright}>© 2026 HIMAFOR. All rights reserved.</p>
      </main>
    </div>
  )
}

export default Login
