import { useState } from 'react'
import { CircleAlert, Plus, RefreshCw, Users } from 'lucide-react'
import AvatarPengurus from '../../../components/common/AvatarPengurus/AvatarPengurus'
import { useApi } from '../../../hooks/useApi'
import { getAdminStruktur } from '../../../services/api'
import { resolveImage } from '../../../utils/image'
import { klikBiasa } from '../../../utils/nav'
import { pesanGagal } from '../../../utils/pesanGagal'
import { PATH_TAMBAH_PENGURUS } from './rute'
import { NAMA_BELUM_DIISI } from './strukturUtils'
import base from '../Berita/Berita.module.css'
import styles from './StrukturDaftar.module.css'

const BARIS_SKELETON = [0, 1, 2, 3, 4, 5]

// Kolom Department: pengurus inti (tanpa departemen) berlabel "Pengurus Inti",
// pengurus departemen berlabel "Department <nama>".
function LabelDepartment({ item }) {
  if (!item.department_id) return <span className={styles.badge}>Pengurus Inti</span>
  const nama = item.department_name || '—'
  return (
    <span className={styles.badge} title={`Department ${nama}`}>
      Department {nama}
    </span>
  )
}

// baruId     : id pengurus yang baru ditambahkan (barisnya diberi warna hijau muda)
// onNavigate : (path) => void
function StrukturDaftar({ baruId, onNavigate }) {
  const [muatUlang, setMuatUlang] = useState(0)

  const { data, loading, error } = useApi((signal) => getAdminStruktur(signal), `struktur-${muatUlang}`)

  const items = data?.items ?? []
  const kosong = !loading && !error && items.length === 0
  const adaData = !loading && !error && items.length > 0

  function ke(e, path) {
    if (!klikBiasa(e)) return
    e.preventDefault()
    onNavigate(path)
  }

  const tombolTambah = (kelas) => (
    <a
      href={PATH_TAMBAH_PENGURUS}
      className={`${base.btn} ${base.primary} ${kelas ?? ''}`}
      onClick={(e) => ke(e, PATH_TAMBAH_PENGURUS)}
    >
      <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
      Tambah Pengurus
    </a>
  )

  return (
    <div className={base.page}>
      <header className={base.head}>
        <div>
          <h1 className={base.title}>Kelola Struktur Organisasi</h1>
          <p className={base.subtitle}>Atur data pengurus yang tampil di halaman Struktur Organisasi website.</p>
        </div>
        <div className={base.actions}>{tombolTambah()}</div>
      </header>

      {error && (
        <div className={base.panel} role="alert">
          <span className={`${base.panelIcon} ${base.panelIconWarn}`}>
            <CircleAlert size={28} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <h2 className={base.panelTitle}>Data pengurus belum dapat dimuat</h2>
          <p className={base.panelText}>
            {pesanGagal(error, 'Terjadi kendala saat mengambil data. Silakan coba lagi.')}
          </p>
          <button
            type="button"
            className={`${base.btn} ${base.primary}`}
            onClick={() => setMuatUlang((n) => n + 1)}
          >
            <RefreshCw size={16} strokeWidth={2.1} aria-hidden="true" />
            Muat Ulang
          </button>
        </div>
      )}

      {kosong && (
        <div className={`${base.panel} ${styles.kosong}`}>
          <span className={styles.kosongHalo} aria-hidden="true">
            <span className={styles.kosongIcon}>
              <Users size={34} strokeWidth={1.8} />
            </span>
          </span>
          <h2 className={base.panelTitle}>Belum ada data pengurus</h2>
          <p className={base.panelText}>Tambahkan pengurus pertama agar susunan organisasi tampil di website.</p>
          {tombolTambah()}
        </div>
      )}

      {!error && !kosong && (
        <>
          <p className={styles.meta} role="status" aria-live="polite">
            {loading ? <span className={`${base.skel} ${styles.skelMeta}`} aria-label="Memuat data" /> : `Menampilkan ${items.length} pengurus`}
          </p>

          <div className={styles.card} aria-busy={loading}>
            <table className={styles.table}>
              <caption className={base.srOnly}>Daftar pengurus organisasi</caption>
              <colgroup>
                <col className={styles.colNama} />
                <col className={styles.colJabatan} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Pengurus</th>
                  <th scope="col">Jabatan</th>
                  <th scope="col">Department</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  BARIS_SKELETON.map((n) => (
                    <tr key={`skel-${n}`} aria-hidden="true">
                      <td>
                        <div className={styles.selPengurus}>
                          <span className={`${base.skel} ${styles.skelFoto}`} />
                          <span className={styles.skelTeks}>
                            <span className={`${base.skel} ${styles.skelNama}`} />
                            <span className={`${base.skel} ${styles.skelSub}`} />
                          </span>
                        </div>
                      </td>
                      <td data-label="Jabatan"><span className={`${base.skel} ${styles.skelJabatan}`} /></td>
                      <td data-label="Department"><span className={`${base.skel} ${styles.skelBadge}`} /></td>
                    </tr>
                  ))}

                {adaData &&
                  items.map((item) => (
                    <tr key={item.id} className={item.id === baruId ? styles.barisBaru : ''}>
                      <td>
                        <div className={styles.selPengurus}>
                          <AvatarPengurus
                            src={item.photo_url ? resolveImage(item.photo_url) : null}
                            nama={item.name}
                            ukuran={44}
                          />
                          <span
                            className={`${styles.nama} ${item.name === NAMA_BELUM_DIISI ? styles.belumDiisi : ''}`}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className={styles.selJabatan} data-label="Jabatan">{item.position}</td>
                      <td data-label="Department"><LabelDepartment item={item} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default StrukturDaftar
