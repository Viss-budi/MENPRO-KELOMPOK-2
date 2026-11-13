import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Paginasi.module.css'

// Kaki tabel: "Halaman X dari Y", pilihan jumlah baris, dan tombol halaman bernomor.
//   total        : jumlah seluruh baris (setelah disaring)
//   halaman      : halaman aktif (mulai dari 1) ; perHalaman : jumlah baris per halaman
//   onHalaman    : (n) => void ; onPerHalaman : (n) => void
//   opsi         : pilihan jumlah baris per halaman
//   label        : nama tabel untuk pembaca layar (mis. "pengurus")
const OPSI_BARIS = [5, 10, 25, 50]

// Nomor halaman yang ditampilkan; "…" menggantikan lompatan panjang. Mis. 1 … 4 5 6 … 12
function daftarNomor(halaman, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const hasil = [1]
  const awal = Math.max(2, halaman - 1)
  const akhir = Math.min(total - 1, halaman + 1)
  if (awal > 2) hasil.push('…a')
  for (let n = awal; n <= akhir; n++) hasil.push(n)
  if (akhir < total - 1) hasil.push('…b')
  hasil.push(total)
  return hasil
}

function Paginasi({ total, halaman, perHalaman, onHalaman, onPerHalaman, opsi = OPSI_BARIS, label = 'data' }) {
  if (!total) return null
  const jumlahHalaman = Math.max(1, Math.ceil(total / perHalaman))
  const aktif = Math.min(Math.max(1, halaman), jumlahHalaman)

  return (
    <div className={styles.kaki}>
      <div className={styles.kiri}>
        <span className={styles.info}>
          Halaman <b>{aktif}</b> dari <b>{jumlahHalaman}</b>
        </span>
        <label className={styles.baris}>
          <span>Tampilkan</span>
          <select
            className={styles.pilih}
            value={perHalaman}
            onChange={(e) => onPerHalaman(Number(e.target.value))}
            aria-label={`Jumlah baris ${label} per halaman`}
          >
            {opsi.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>baris</span>
        </label>
      </div>

      {jumlahHalaman > 1 && (
        <nav className={styles.nomor} aria-label={`Halaman tabel ${label}`}>
          <button
            type="button"
            className={styles.tombol}
            onClick={() => onHalaman(aktif - 1)}
            disabled={aktif <= 1}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {daftarNomor(aktif, jumlahHalaman).map((n) =>
            typeof n === 'string' ? (
              <span key={n} className={styles.titik} aria-hidden="true">…</span>
            ) : (
              <button
                key={n}
                type="button"
                className={`${styles.tombol} ${n === aktif ? styles.aktif : ''}`}
                onClick={() => onHalaman(n)}
                aria-label={`Halaman ${n}`}
                aria-current={n === aktif ? 'page' : undefined}
              >
                {n}
              </button>
            )
          )}
          <button
            type="button"
            className={styles.tombol}
            onClick={() => onHalaman(aktif + 1)}
            disabled={aktif >= jumlahHalaman}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}

export default Paginasi
