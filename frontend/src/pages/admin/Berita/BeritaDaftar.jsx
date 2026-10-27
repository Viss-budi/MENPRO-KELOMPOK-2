import { useEffect, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ImageOff,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import ConfirmDialog from '../../../components/admin/ConfirmDialog/ConfirmDialog'
import { useApi } from '../../../hooks/useApi'
import { deleteNews, getAdminNews } from '../../../services/api'
import { formatTanggalSingkat } from '../../../utils/format'
import { resolveImage } from '../../../utils/image'
import { klikBiasa } from '../../../utils/nav'
import { pesanGagal } from '../../../utils/pesanGagal'
import { PATH_TAMBAH_BERITA, pathUbahBerita } from './rute'
import base from './Berita.module.css'
import styles from './BeritaDaftar.module.css'

const PER_HALAMAN = 10
const BARIS_SKELETON = [0, 1, 2, 3, 4]

// Gambar mini; bila cover_url kosong atau gagal dimuat tampil kotak ikon.
function Thumb({ src }) {
  const [gagal, setGagal] = useState(false)
  if (!src || gagal) {
    return (
      <span className={styles.thumbKosong} aria-hidden="true">
        <ImageOff size={18} strokeWidth={1.8} />
      </span>
    )
  }
  return <img className={styles.thumb} src={src} alt="" loading="lazy" onError={() => setGagal(true)} />
}

// page / onPage : halaman daftar disimpan di induk supaya tidak hilang saat pindah ke form
// onNavigate    : (path) => void ; onSukses : ({ judul, pesan }) => void (menampilkan toast)
function BeritaDaftar({ page, onPage, onNavigate, onSukses }) {
  const [muatUlang, setMuatUlang] = useState(0)
  const [target, setTarget] = useState(null) // berita yang akan dihapus (membuka dialog)
  const [menghapus, setMenghapus] = useState(false)
  const [errorHapus, setErrorHapus] = useState('')

  // Setiap daftar dibuka (termasuk setelah tambah/ubah) dan setiap halaman/muatUlang berubah, data diambil ulang.
  const { data, loading, error } = useApi(
    (signal) => getAdminNews({ page, perPage: PER_HALAMAN }, signal),
    `berita-${page}-${muatUlang}`
  )

  const items = data?.items ?? []
  const total = Number(data?.meta?.total) || 0
  const totalHalaman = Number(data?.meta?.total_pages) || 1

  // Menghapus berita terakhir di halaman > 1: mundur satu halaman supaya tidak tampil kosong.
  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) onPage(page - 1)
  }, [data, page, onPage])

  function bukaHapus(item) {
    setErrorHapus('')
    setTarget(item)
  }

  function tutupHapus() {
    if (menghapus) return
    setTarget(null)
    setErrorHapus('')
  }

  async function konfirmasiHapus() {
    if (!target || menghapus) return
    const judul = target.title
    setMenghapus(true)
    setErrorHapus('')
    try {
      await deleteNews(target.id)
      setTarget(null)
      setMuatUlang((n) => n + 1) // daftar diperbarui otomatis
      onSukses({ judul: 'Berita berhasil dihapus', pesan: `“${judul}” sudah dihapus dari daftar.` })
    } catch (err) {
      if (err.status === 404) {
        // Sudah dihapus pihak lain: tujuan pengguna tercapai, jadi tutup dialog dan segarkan daftar
        setTarget(null)
        setMuatUlang((n) => n + 1)
        onSukses({ judul: 'Berita sudah terhapus', pesan: `“${judul}” sudah dihapus sebelumnya. Daftar diperbarui.` })
        return
      }
      // Dialog tetap terbuka dengan pesan dari server; pengguna boleh mencoba lagi atau membatalkan
      setErrorHapus(pesanGagal(err, 'Berita gagal dihapus, silakan coba lagi'))
    } finally {
      setMenghapus(false)
    }
  }

  function pergi(e, path) {
    if (!klikBiasa(e)) return
    e.preventDefault()
    onNavigate(path)
  }

  const kosong = !loading && !error && total === 0 && items.length === 0 && page === 1
  const adaData = !loading && !error && items.length > 0

  const tombolTambah = (
    <a
      href={PATH_TAMBAH_BERITA}
      className={`${base.btn} ${base.primary}`}
      onClick={(e) => pergi(e, PATH_TAMBAH_BERITA)}
    >
      <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
      Tambah Berita
    </a>
  )

  return (
    <div className={base.page}>
      <header className={base.head}>
        <div>
          <h1 className={base.title}>Kelola Berita</h1>
          <p className={base.subtitle}>Tambah, ubah, dan hapus berita yang tampil di website.</p>
        </div>
        <div className={base.actions}>{tombolTambah}</div>
      </header>

      {error && (
        <div className={base.panel} role="alert">
          <span className={`${base.panelIcon} ${base.panelIconWarn}`}>
            <CircleAlert size={28} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <h2 className={base.panelTitle}>Daftar berita belum dapat dimuat</h2>
          <p className={base.panelText}>{pesanGagal(error, 'Terjadi gangguan saat mengambil data. Silakan coba lagi.')}</p>
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
              <Newspaper size={34} strokeWidth={1.8} />
            </span>
          </span>
          <h2 className={base.panelTitle}>Belum ada berita</h2>
          <p className={base.panelText}>Mulai dengan menambahkan berita pertama HIMAFOR.</p>
          {tombolTambah}
        </div>
      )}

      {!error && !kosong && (
        <>
          <p className={styles.meta} role="status" aria-live="polite">
            {loading
              ? 'Memuat berita...'
              : total > items.length
                ? `Menampilkan ${items.length} dari ${total} berita`
                : `Menampilkan ${items.length} berita`}
          </p>

          <div className={styles.card} aria-busy={loading}>
            <table className={styles.table}>
              <caption className={base.srOnly}>Daftar berita</caption>
              <colgroup>
                <col className={styles.colThumb} />
                <col />
                <col className={styles.colTanggal} />
                <col className={styles.colAksi} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col"><span className={base.srOnly}>Gambar</span></th>
                  <th scope="col">Judul Berita</th>
                  <th scope="col" className={styles.kolTanggal}>Tanggal</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  BARIS_SKELETON.map((n) => (
                    <tr key={`skel-${n}`} aria-hidden="true">
                      <td><span className={`${base.skel} ${styles.skelThumb}`} /></td>
                      <td><span className={`${base.skel} ${styles.skelJudul}`} /></td>
                      <td className={styles.kolTanggal}><span className={`${base.skel} ${styles.skelTanggal}`} /></td>
                      <td><span className={`${base.skel} ${styles.skelAksi}`} /></td>
                    </tr>
                  ))}

                {adaData &&
                  items.map((item) => {
                    const tanggal = formatTanggalSingkat(item.published_at)
                    return (
                      <tr key={item.id}>
                        <td><Thumb key={item.id} src={resolveImage(item.cover_url)} /></td>
                        <td className={styles.selJudul}>
                          <span className={styles.judul} title={item.title}>{item.title}</span>
                          <span className={styles.tanggalKecil}>{tanggal}</span>
                        </td>
                        <td className={styles.kolTanggal}>
                          <span className={styles.tanggal}>
                            <Calendar size={15} strokeWidth={1.9} aria-hidden="true" />
                            {tanggal}
                          </span>
                        </td>
                        <td>
                          <div className={styles.aksi}>
                            <a
                              href={pathUbahBerita(item.id)}
                              className={`${base.btn} ${base.outline} ${base.sm} ${styles.btnAksi}`}
                              aria-label={`Edit berita ${item.title}`}
                              onClick={(e) => pergi(e, pathUbahBerita(item.id))}
                            >
                              <Pencil size={15} strokeWidth={2} aria-hidden="true" />
                              <span className={styles.labelAksi}>Edit</span>
                            </a>
                            <button
                              type="button"
                              className={`${base.btn} ${base.danger} ${base.sm} ${styles.btnAksi}`}
                              aria-label={`Hapus berita ${item.title}`}
                              onClick={() => bukaHapus(item)}
                            >
                              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                              <span className={styles.labelAksi}>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {totalHalaman > 1 && (
            <nav className={styles.pager} aria-label="Halaman daftar berita">
              <button
                type="button"
                className={`${base.btn} ${base.outline} ${base.sm}`}
                onClick={() => onPage(page - 1)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
                Sebelumnya
              </button>
              <span className={styles.pagerInfo}>Halaman {page} dari {totalHalaman}</span>
              <button
                type="button"
                className={`${base.btn} ${base.outline} ${base.sm}`}
                onClick={() => onPage(page + 1)}
                disabled={page >= totalHalaman || loading}
              >
                Berikutnya
                <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}

      {target && (
        <ConfirmDialog
          judul="Hapus berita ini?"
          pesan={`Berita “${target.title}” akan dihapus permanen dan tidak dapat dikembalikan.`}
          error={errorHapus}
          loading={menghapus}
          labelLoading="Menghapus..."
          onConfirm={konfirmasiHapus}
          onCancel={tutupHapus}
        />
      )}
    </div>
  )
}

export default BeritaDaftar
