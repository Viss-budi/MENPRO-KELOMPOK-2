import { useState, useRef, useId } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { loginAdmin } from '../../../services/api'
import { setSession } from '../../../utils/auth'
import styles from './Login.module.css'

// Pesan validasi sisi klien
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
      <main className={styles.card} role="main">
        <div className={styles.header}>
          <h1 className={styles.title}>Masuk ke Dashboard</h1>
          <p className={styles.subtitle}>Khusus pengurus HIMAFOR</p>
        </div>

        {/* Pesan sesi berakhir — ditampilkan sekali setelah redirect dari dashboard */}
        {sessionMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className={styles.sessionAlert}
          >
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
          {globalError && (
            <p className={styles.alertText}>{globalError}</p>
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
              Email
            </label>
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
              placeholder="contoh@himafor.ac.id"
            />
            {fieldErrors.email && (
              <span
                id={`${emailId}-err`}
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Kolom Password */}
          <div className={styles.field}>
            <label htmlFor={passwordId} className={styles.label}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
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
                tabIndex={0}
                disabled={loading}
              >
                {showPassword
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span
                id={`${passwordId}-err`}
                className={styles.fieldError}
                role="alert"
                aria-live="polite"
              >
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/*
            Elemen "Lupa password" dan "Ingat saya" dari wireframe:
            tidak dibuat berfungsi karena endpoint BE belum tersedia.
            Disebutkan di laporan akhir.
          */}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p className={styles.note}>
          Halaman ini hanya untuk pengurus HIMAFOR yang telah terdaftar.
        </p>
      </main>
    </div>
  )
}

export default Login
