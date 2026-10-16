import { getUser, clearSession, isTokenExpired, getToken } from '../../../utils/auth'
import { ROUTES } from '../../../constants/routes'
import styles from './Dashboard.module.css'

// Kunci sessionStorage untuk pesan sesi berakhir
export const SESI_BERAKHIR_KEY = 'himafor_sesi_berakhir'

function Dashboard({ onLogout, sessionMessage }) {
  const user = getUser()

  // Cek token setiap aksi navigasi/menu (skenario 5)
  function handleMenuAction(aksi) {
    if (isTokenExpired(getToken())) {
      clearSession()
      sessionStorage.setItem(SESI_BERAKHIR_KEY, '1')
      window.history.replaceState(null, '', ROUTES.adminLogin)
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }
    aksi()
  }

  function handleLogout() {
    clearSession()
    onLogout()
  }

  const roleTampil = user?.role === 'editor' ? 'Editor' : 'Admin'

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.brand}>HIMAFOR Admin</span>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main className={styles.main}>
        {/* Pesan sesi berakhir (bila baru saja redirect dari sesi habis) */}
        {sessionMessage && (
          <div
            className={styles.sessionAlert}
            role="alert"
            aria-live="assertive"
          >
            {sessionMessage}
          </div>
        )}

        <div className={styles.card}>
          <h1 className={styles.title}>Dashboard Admin</h1>
          <p className={styles.welcome}>
            Selamat datang,{' '}
            <strong>{user?.name ?? 'Pengguna'}</strong>
          </p>
          <p className={styles.meta}>
            Role: <span className={styles.role}>{roleTampil}</span>
          </p>
          <p className={styles.meta}>
            Email: {user?.email ?? '-'}
          </p>

          {/* Contoh menu – setiap klik memvalidasi sesi terlebih dahulu */}
          <nav className={styles.menuNav} aria-label="Menu dashboard">
            <ul className={styles.menuList}>
              <li>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => handleMenuAction(() => alert('Fitur Berita belum tersedia'))}
                >
                  Kelola Berita
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => handleMenuAction(() => alert('Fitur Kegiatan belum tersedia'))}
                >
                  Kelola Kegiatan
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
