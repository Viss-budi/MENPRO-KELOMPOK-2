import { useState, useRef, useId } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { loginAdmin } from '../../../services/api'
import { setSession } from '../../../utils/auth'
import gedung from '../../../assets/images/login-gedung.webp'
import logo from '../../../assets/images/logo-himafor.webp'
import styles from './Login.module.css'

// Pesan validasi sisi klien
// Teks panel kiri (sesuai desain UI/UX)
const FITUR = ['Kegiatan', 'Berita', 'Dokumentasi', 'Prestasi']

const VALIDASI = {
  emailKosong: 'Email wajib diisi',
  emailFormat: 'Format email tidak valid',
  passwordKosong: 'Password wajib diisi',
}

function validasiForm(email, password) {
  const errors = {}
  if (!email.trim()) {
    errors.email = VALIDASI.emailKosong
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = VALIDASI.emailFormat
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
  const [loading, setLoading] = useState(false)

  // Untuk membatalkan request jika komponen dilepas
  const abortRef = useRef(null)

  const emailId = useId()
  const passwordId = useId()
  const errorLiveId = useId()

  // Bersihkan error saat pengguna mulai mengetik
  function handleEmailChange(e) {
    setEmail(e.target.value)
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
    if (globalError) setGlobalError('')
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value)
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }))
    if (globalError) setGlobalError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return // Cegah kirim ganda

    // Validasi sisi klien
    const errors = validasiForm(email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    setGlobalError('')
    setFieldErrors({})

    // Batalkan request sebelumnya jika masih berjalan
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const { token, user } = await loginAdmin(email, password, abortRef.current.signal)
      setSession(token, user)
      // Navigasi ke dashboard; onLoginSuccess mengurus history
      onLoginSuccess()
    } catch (err) {
      if (err.name === 'AbortError') return
      setGlobalError(err.message || 'Login gagal, silakan coba lagi beberapa saat')
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
          <h1 className={styles.title}>Masuk ke Admin Panel</h1>
          <p className={styles.subtitle}>Gunakan akun admin HIMAFOR untuk melanjutkan.</p>

          {/* Pesan sesi berakhir — ditampilkan sekali setelah redirect dari dashboard */}
          {sessionMessage && (
            <div role="alert" aria-live="assertive" className={styles.sessionAlert}>
              {sessionMessage}
            </div>
          )}

          {/* Pesan error global — dibaca langsung oleh pembaca layar */}
          <div
            id={errorLiveId}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className={styles.alertBox}
          >
            {globalError && <p className={styles.alertText}>{globalError}</p>}
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
                Email / Username
              </label>
              <div className={styles.inputWrap}>
                <Mail className={styles.iconLeft} size={18} strokeWidth={1.9} aria-hidden="true" />
                <input
                  id={emailId}
                  type="email"
                  className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={fieldErrors.email ? 'true' : 'false'}
                  aria-describedby={fieldErrors.email ? `${emailId}-err` : undefined}
                  disabled={loading}
                  placeholder="admin@himafor.ac.id"
                />
              </div>
              {fieldErrors.email && (
                <span id={`${emailId}-err`} className={styles.fieldError} role="alert" aria-live="polite">
                  {fieldErrors.email}
                </span>
              )}
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
                  className={`${styles.input} ${styles.inputPassword} ${fieldErrors.password ? styles.inputError : ''}`}
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? `${passwordId}-err` : undefined}
                  disabled={loading}
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
              {fieldErrors.password && (
                <span id={`${passwordId}-err`} className={styles.fieldError} role="alert" aria-live="polite">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/*
              "Ingat saya" dan "Lupa password?" ada di desain UI/UX, tetapi
              endpoint BE-nya belum tersedia. Keduanya hanya tampilan dulu:
              checkbox belum memengaruhi sesi, tombol belum punya aksi.
            */}
            <div className={styles.options}>
              <label className={styles.remember}>
                <input type="checkbox" className={styles.checkbox} defaultChecked disabled={loading} />
                <span>Ingat saya</span>
              </label>
              <button type="button" className={styles.forgot}>Lupa password?</button>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Memproses...' : (<>Masuk<ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" /></>)}
            </button>
          </form>

          <p className={styles.note}>
            <Lock size={14} strokeWidth={1.75} aria-hidden="true" />
            Hanya untuk pengurus HIMAFOR yang terdaftar sebagai Admin.
          </p>
        </div>

        <p className={styles.copyright}>© 2026 HIMAFOR. All rights reserved.</p>
      </main>
    </div>
  )
}

export default Login
