import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Calendar,
  CalendarArrowDown,
  CalendarArrowUp,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ImageOff,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  Trash2,
} from 'lucide-react'
import AlatTabel, { ChipFilterAktif } from '../../../components/admin/AlatTabel/AlatTabel'
import ConfirmDialog from '../../../components/admin/ConfirmDialog/ConfirmDialog'
import { useApi } from '../../../hooks/useApi'
import { useDebounce } from '../../../hooks/useDebounce'
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

// Filter daftar (kontrak 5.2.1: category dan is_published dicocokkan persis oleh server)
const GRUP_FILTER = [
  {
    key: 'kategori',
    label: 'Kategori',
    opsi: [
      { value: '', label: 'Semua' },
      { value: 'Berita', label: 'Berita' },
      { value: 'Kegiatan', label: 'Kegiatan' },
      { value: 'Prestasi', label: 'Prestasi' },
      { value: 'Pengumuman', label: 'Pengumuman' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    opsi: [
      { value: '', label: 'Semua' },
      { value: '1', label: 'Terbit' },
      { value: '0', label: 'Draf' },
    ],
  },
]

// Opsi urutan
const OPSI_URUT = [
  { key: 'terbaru', label: 'Terbaru', icon: CalendarArrowDown },
  { key: 'terlama', label: 'Terlama', icon: CalendarArrowUp },
  { key: 'az',      label: 'A \u2192 Z', icon: ArrowDownAZ },
  { key: 'za',      label: 'Z \u2192 A', icon: ArrowUpAZ },
]

// Fungsi pengurutan client-side
function urutkanItems(items, urutan) {
  if (!items || items.length === 0) return items
  const copy = [...items]
  switch (urutan) {
    case 'terbaru':
      return copy.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    case 'terlama':
      return copy.sort((a, b) => new Date(a.published_at) - new Date(b.published_at))
    case 'az':
      return copy.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'id'))
    case 'za':
      return copy.sort((a, b) => (b.title ?? '').localeCompare(a.title ?? '', 'id'))
    default:
      return copy
  }
}

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
// saring / onSaring : { q, kategori, status } disimpan di induk juga; onSaring(patch) sekaligus kembali ke halaman 1
// onNavigate    : (path) => void ; onSukses : ({ judul, pesan }) => void (menampilkan toast)
function BeritaDaftar({ page, onPage, saring, onSaring, onNavigate, onSukses }) {
  const [muatUlang, setMuatUlang] = useState(0)
  const [target, setTarget] = useState(null) // berita yang akan dihapus (membuka dialog)
  const [menghapus, setMenghapus] = useState(false)
  const [errorHapus, setErrorHapus] = useState('')
  const [urutan, setUrutan] = useState('terbaru')
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false)
  const dropdownRef = useRef(null)

  // Setiap daftar dibuka (termasuk setelah tambah/ubah) dan setiap halaman/muatUlang berubah, data diambil ulang.
  // Kolom cari menampilkan ketikan langsung; permintaan ke server menunggu jeda mengetik.
  const kata = useDebounce(saring.q, 350).trim()
  const { kategori, status } = saring
  const adaSaringan = kata !== '' || kategori !== '' || status !== ''

  const { data, loading, error } = useApi(
    (signal) => getAdminNews({ page, perPage: PER_HALAMAN, q: kata, category: kategori, isPublished: status }, signal),
    `berita-${page}-${muatUlang}-${kata}-${kategori}-${status}`
  )

  const rawItems = data?.items ?? []
  const total = Number(data?.meta?.total) || 0
  const totalHalaman = Number(data?.meta?.total_pages) || 1

  // Terapkan urutan client-side
  const items = urutkanItems(rawItems, urutan)

  // Menghapus berita terakhir di halaman > 1: mundur satu halaman supaya tidak tampil kosong.
  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) onPage(page - 1)
  }, [data, page, onPage])

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!dropdownTerbuka) return
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownTerbuka(false)
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setDropdownTerbuka(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [dropdownTerbuka])

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
      onSukses({ judul: 'Berita berhasil dihapus', pesan: `"${judul}" sudah dihapus dari daftar.` })
    } catch (err) {
      if (err.status === 404) {
        // Sudah dihapus pihak lain: tujuan pengguna tercapai, jadi tutup dialog dan segarkan daftar
        setTarget(null)
        setMuatUlang((n) => n + 1)
        onSukses({ judul: 'Berita sudah terhapus', pesan: `"${judul}" sudah dihapus sebelumnya. Daftar diperbarui.` })
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

  function pilihUrutan(key) {
    setUrutan(key)
    setDropdownTerbuka(false)
  }

  const kosong = !loading && !error && total === 0 && items.length === 0 && page === 1 && !adaSaringan
  const tidakCocok = !loading && !error && total === 0 && items.length === 0 && adaSaringan
  const adaData = !loading && !error && items.length > 0
  const nilaiFilter = useMemo(() => ({ kategori, status }), [kategori, status])
  const resetFilter = () => onSaring({ kategori: '', status: '' })
  const resetSemua = () => onSaring({ q: '', kategori: '', status: '' })

  const opsiAktif = OPSI_URUT.find((o) => o.key === urutan) ?? OPSI_URUT[0]

  const tombolTambah = (
    <a
      href={PATH_TAMBAH_BERITA}
      className={`${base.btn} ${base.primary} ${styles.btnTambah}`}
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
          {/* ── Baris info + tombol urut ─────────────────── */}
          <div className={styles.metaBar}>
            <p className={styles.meta} role="status" aria-live="polite">
              {loading
                ? 'Memuat berita...'
                : adaSaringan
                  ? `Menampilkan ${rawItems.length} dari ${total} hasil`
                  : total > rawItems.length
                  ? `Menampilkan ${rawItems.length} dari ${total} berita`
                  : `Menampilkan ${rawItems.length} berita`}
            </p>

            {/* Tombol dropdown urutan */}
            <div className={styles.urutWrap} ref={dropdownRef}>
              <button
                type="button"
                className={styles.urutBtn}
                aria-haspopup="listbox"
                aria-expanded={dropdownTerbuka}
                aria-label={`Urutan: ${opsiAktif.label}`}
                onClick={() => setDropdownTerbuka((v) => !v)}
                disabled={loading}
              >
                <ArrowUpDown size={15} strokeWidth={2} aria-hidden="true" />
                <span>Urut: {opsiAktif.label}</span>
              </button>

              {dropdownTerbuka && (
                <ul
                  className={styles.urutDropdown}
                  role="listbox"
                  aria-label="Pilih urutan berita"
                >
                  {OPSI_URUT.map(({ key, label, icon: Ikon }) => (
                    <li
                      key={key}
                      role="option"
                      aria-selected={urutan === key}
                      className={`${styles.urutOpsi} ${urutan === key ? styles.urutAktif : ''}`}
                      onClick={() => pilihUrutan(key)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pilihUrutan(key) }}
                      tabIndex={0}
                    >
                      <Ikon size={15} strokeWidth={2} aria-hidden="true" />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={styles.chipBaris}>
            <ChipFilterAktif
              grup={GRUP_FILTER}
              nilai={nilaiFilter}
              onUbah={(key, nilai) => onSaring({ [key]: nilai })}
              onReset={resetFilter}
            />
          </div>

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
                  <th scope="col" className={styles.thAlat}>
                    <span className={styles.thLabel}>Aksi</span>
                    <AlatTabel
                      variant="header"
                      label="berita"
                      placeholder="Cari judul berita..."
                      query={saring.q}
                      onQuery={(q) => onSaring({ q })}
                      grup={GRUP_FILTER}
                      nilai={nilaiFilter}
                      onUbah={(key, nilai) => onSaring({ [key]: nilai })}
                      onReset={resetFilter}
                    />
                  </th>
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

                {tidakCocok && (
                  <tr className={styles.barisKosong}>
                    <td colSpan={4}>
                      <div className={styles.tidakCocok} role="status">
                        <span className={styles.tidakCocokIkon} aria-hidden="true">
                          <SearchX size={26} strokeWidth={1.8} />
                        </span>
                        <p className={styles.tidakCocokJudul}>Tidak ada berita yang cocok</p>
                        <p className={styles.tidakCocokTeks}>
                          {kata ? `Tidak ada hasil untuk "${kata}".` : 'Tidak ada berita pada filter yang dipilih.'} Coba
                          kata lain atau atur ulang pencarian.
                        </p>
                        <button type="button" className={`${base.btn} ${base.outline} ${base.sm}`} onClick={resetSemua}>
                          Reset pencarian
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

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
                              className={`${base.btn} ${base.outline} ${base.sm} ${styles.btnAksi} ${styles.btnEdit}`}
                              aria-label={`Edit berita ${item.title}`}
                              onClick={(e) => pergi(e, pathUbahBerita(item.id))}
                            >
                              <Pencil size={15} strokeWidth={2} aria-hidden="true" />
                              <span className={styles.labelAksi}>Edit</span>
                            </a>
                            <button
                              type="button"
                              className={`${base.btn} ${base.danger} ${base.sm} ${styles.btnAksi} ${styles.btnHapus}`}
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
          pesan={`Berita "${target.title}" akan dihapus permanen dan tidak dapat dikembalikan.`}
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
