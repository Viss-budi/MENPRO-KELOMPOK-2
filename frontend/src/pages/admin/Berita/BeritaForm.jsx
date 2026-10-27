import { useEffect, useId, useRef, useState } from 'react'
import {
  Bold,
  CircleAlert,
  ImageOff,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  RefreshCw,
  SearchX,
  Trash2,
  Upload,
} from 'lucide-react'
import { createNews, getAdminNewsById, updateNews, uploadImage } from '../../../services/api'
import { resolveImage } from '../../../utils/image'
import { klikBiasa } from '../../../utils/nav'
import { pesanGagal } from '../../../utils/pesanGagal'
import {
  MAKS_JUDUL,
  formatUkuran,
  namaFile,
  ringkas,
  validasiBerita,
  validasiFileGambar,
} from './beritaUtils'
import { PATH_BERITA } from './rute'
import base from './Berita.module.css'
import styles from './BeritaForm.module.css'

const PESAN_GAGAL_SIMPAN = 'Berita gagal disimpan, silakan coba lagi'

// Alat format teks ada di desain, tetapi isi berita pada kontrak (5.4 dan 7.3) adalah teks biasa
// yang ditampilkan apa adanya. Tombolnya dinonaktifkan sampai tim sepakat format isi berita.
const ALAT_EDITOR = [
  { key: 'tebal', label: 'Tebal', icon: Bold },
  { key: 'miring', label: 'Miring', icon: Italic },
  { key: 'daftar', label: 'Daftar', icon: List },
  { key: 'tautan', label: 'Tautan', icon: LinkIcon },
  { key: 'gambar', label: 'Sisipkan gambar', icon: ImageIcon },
]

// mode: 'tambah' | 'ubah' (dengan id)
// onNavigate : (path) => void
// onSukses   : ({ edit, judul }) => void ; induk kembali ke daftar dan menampilkan toast
function BeritaForm({ mode, id, onNavigate, onSukses }) {
  const edit = mode === 'ubah'

  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  // gambar: null | { file: File|null, url: string|null, nama, ukuran }
  //   url terisi = sudah ada di server (data lama, atau file yang sudah berhasil diunggah)
  const [gambar, setGambar] = useState(null)
  const [preview, setPreview] = useState(null) // blob: untuk file yang baru dipilih
  const [isiAwal, setIsiAwal] = useState('') // isi berita saat dimuat (untuk mengetahui isi berubah)

  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null) // { pesan, n } n supaya pesan sama tetap memicu fokus
  const [menyimpan, setMenyimpan] = useState(false)
  const [seret, setSeret] = useState(false)

  // Memuat data lama (hanya mode ubah): 'memuat' | 'siap' | 'gagal' | 'tidak-ada'
  const [muat, setMuat] = useState(edit ? 'memuat' : 'siap')
  const [pesanMuat, setPesanMuat] = useState('')
  const [muatKe, setMuatKe] = useState(0)

  const judulId = useId()
  const isiId = useId()
  const gambarId = useId()
  const judulRef = useRef(null)
  const isiRef = useRef(null)
  const fileRef = useRef(null)
  const bannerRef = useRef(null)
  const abortRef = useRef(null)

  // ── Muat data lama untuk mengisi form edit ─────────────────────────────────
  useEffect(() => {
    if (!edit) return undefined
    const ac = new AbortController()
    getAdminNewsById(id, ac.signal)
      .then((data) => {
        setJudul(data.title ?? '')
        setIsi(data.content ?? '')
        setIsiAwal(data.content ?? '')
        setGambar(
          data.cover_url
            ? { file: null, url: data.cover_url, nama: namaFile(data.cover_url), ukuran: null }
            : null
        )
        setMuat('siap')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setPesanMuat(pesanGagal(err, 'Terjadi gangguan saat mengambil data berita. Silakan coba lagi.'))
        setMuat(err.status === 404 ? 'tidak-ada' : 'gagal')
      })
    return () => ac.abort()
  }, [edit, id, muatKe])

  // Lepas blob pratinjau saat diganti atau saat form ditutup; batalkan request yang masih jalan.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])
  useEffect(() => () => abortRef.current?.abort(), [])

  // Pesan gagal simpan: pindahkan fokus ke kotak pesan supaya terbaca pembaca layar.
  useEffect(() => {
    if (banner) bannerRef.current?.focus()
  }, [banner])

  // ── Perubahan kolom ────────────────────────────────────────────────────────
  function bersihkan(kolom) {
    if (errors[kolom]) setErrors((prev) => ({ ...prev, [kolom]: '' }))
    if (banner) setBanner(null)
  }

  function ubahJudul(e) {
    setJudul(e.target.value)
    bersihkan('judul')
  }

  function ubahIsi(e) {
    setIsi(e.target.value)
    bersihkan('isi')
  }

  function pilihFile(file) {
    if (!file) return
    const masalah = validasiFileGambar(file)
    if (masalah) {
      // Gambar sebelumnya (bila ada) tetap dipakai; hanya pesan kolom yang muncul
      setErrors((prev) => ({ ...prev, gambar: masalah }))
      return
    }
    setPreview(URL.createObjectURL(file))
    setGambar({ file, url: null, nama: file.name, ukuran: file.size })
    bersihkan('gambar')
  }

  function ubahFile(e) {
    pilihFile(e.target.files?.[0])
    e.target.value = '' // supaya file yang sama bisa dipilih ulang setelah dihapus
  }

  function lepasFile(e) {
    e.preventDefault()
    setSeret(false)
    pilihFile(e.dataTransfer?.files?.[0])
  }

  function hapusGambar() {
    setPreview(null)
    setGambar(null)
  }

  // ── Simpan ─────────────────────────────────────────────────────────────────
  async function simpan(e) {
    e.preventDefault()
    if (menyimpan) return

    const masalah = validasiBerita({ judul, isi, gambar })
    if (Object.keys(masalah).length > 0) {
      setErrors(masalah)
      setBanner(null)
      // Fokus ke kolom pertama yang bermasalah
      if (masalah.judul) judulRef.current?.focus()
      else if (masalah.isi) isiRef.current?.focus()
      else fileRef.current?.focus()
      return
    }

    setErrors({})
    setBanner(null)
    setMenyimpan(true)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    try {
      // 1) Unggah gambar baru. URL disimpan di state: bila langkah 2 gagal, percobaan berikutnya
      //    tidak mengunggah ulang file yang sama.
      let urlGambar = gambar.url
      if (!urlGambar) {
        urlGambar = await uploadImage(gambar.file, ac.signal)
        setGambar((g) => (g ? { ...g, url: urlGambar } : g))
      }

      // 2) Simpan berita. created_by/author_id diisi server dari sesi login (kontrak 1.3).
      const judulBersih = judul.trim()
      if (edit) {
        const badan = { title: judulBersih, content: isi, cover_url: urlGambar }
        // Ringkasan hanya dibuat ulang bila isi berita berubah, agar ringkasan buatan tangan tidak tertimpa
        if (isi !== isiAwal) badan.excerpt = ringkas(isi)
        await updateNews(id, badan, ac.signal)
      } else {
        await createNews(
          { title: judulBersih, content: isi, excerpt: ringkas(isi), cover_url: urlGambar },
          ac.signal
        )
      }
      onSukses({ edit, judul: judulBersih })
    } catch (err) {
      if (err.name === 'AbortError') return
      // Isi form TIDAK dihapus: seluruh state tetap, pengguna cukup menekan Simpan lagi.
      setBanner({ pesan: pesanGagal(err, PESAN_GAGAL_SIMPAN), n: Date.now() })
    } finally {
      setMenyimpan(false)
    }
  }

  function batal(e) {
    if (e && !klikBiasa(e)) return
    e?.preventDefault()
    onNavigate(PATH_BERITA)
  }

  // ── Keadaan memuat data lama ───────────────────────────────────────────────
  if (muat !== 'siap') {
    const memuat = muat === 'memuat'
    const tidakAda = muat === 'tidak-ada'
    return (
      <div className={base.page}>
        <header className={base.head}>
          <div>
            <h1 className={base.title}>Edit Berita</h1>
            <p className={base.subtitle}>
              {memuat ? 'Memuat data berita...' : 'Ubah data berita lalu tekan Simpan.'}
            </p>
          </div>
        </header>

        {memuat ? (
          <div className={styles.grid} aria-busy="true">
            <div className={styles.card}>
              <span className={`${base.skel} ${styles.skelJudul}`} />
              <span className={`${base.skel} ${styles.skelIsi}`} />
            </div>
            <div className={styles.card}>
              <span className={`${base.skel} ${styles.skelGambar}`} />
            </div>
          </div>
        ) : (
          <div className={base.panel} role="alert">
            <span className={`${base.panelIcon} ${base.panelIconWarn}`}>
              {tidakAda ? (
                <SearchX size={28} strokeWidth={1.9} aria-hidden="true" />
              ) : (
                <CircleAlert size={28} strokeWidth={1.9} aria-hidden="true" />
              )}
            </span>
            <h2 className={base.panelTitle}>
              {tidakAda ? 'Berita tidak ditemukan' : 'Data berita belum dapat dimuat'}
            </h2>
            <p className={base.panelText}>
              {tidakAda ? 'Berita ini mungkin sudah dihapus.' : pesanMuat}
            </p>
            <div className={base.actions}>
              <a
                href={PATH_BERITA}
                className={`${base.btn} ${base.outline}`}
                onClick={batal}
              >
                Kembali ke Daftar
              </a>
              {!tidakAda && (
                <button
                  type="button"
                  className={`${base.btn} ${base.primary}`}
                  onClick={() => {
                    setMuat('memuat')
                    setMuatKe((n) => n + 1)
                  }}
                >
                  <RefreshCw size={16} strokeWidth={2.1} aria-hidden="true" />
                  Muat Ulang
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const srcGambar = preview ?? (gambar?.url ? resolveImage(gambar.url) : undefined)
  const errJudul = errors.judul
  const errIsi = errors.isi
  const errGambar = errors.gambar

  return (
    <form className={base.page} onSubmit={simpan} noValidate>
      <header className={base.head}>
        <div>
          <h1 className={base.title}>{edit ? 'Edit Berita' : 'Tambah Berita'}</h1>
          <p className={base.subtitle}>
            {edit ? 'Ubah data berita lalu tekan Simpan.' : 'Isi form berikut lalu tekan Simpan.'}
          </p>
        </div>
        <div className={base.actions}>
          <button
            type="button"
            className={`${base.btn} ${base.outline}`}
            onClick={batal}
            disabled={menyimpan}
          >
            Batal
          </button>
          <button
            type="submit"
            className={`${base.btn} ${base.primary}`}
            disabled={menyimpan}
            aria-busy={menyimpan}
          >
            {menyimpan ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </header>

      {banner && (
        <div ref={bannerRef} tabIndex={-1} role="alert" className={styles.banner}>
          <CircleAlert size={22} strokeWidth={2} aria-hidden="true" />
          <span>{banner.pesan}</span>
        </div>
      )}

      <div className={styles.grid}>
        {/* ── Kiri: judul dan isi ─────────────────────────── */}
        <section className={styles.card} aria-label="Isi berita">
          <h2 className={styles.cardTitle}>Isi Berita</h2>

          <div className={styles.field}>
            <label htmlFor={judulId} className={styles.label}>Judul Berita</label>
            <div className={styles.inputWrap}>
              <input
                ref={judulRef}
                id={judulId}
                type="text"
                className={`${styles.input} ${errJudul ? styles.inputError : ''}`}
                value={judul}
                onChange={ubahJudul}
                placeholder="Masukkan judul berita"
                autoComplete="off"
                disabled={menyimpan}
                aria-invalid={errJudul ? 'true' : 'false'}
                aria-describedby={errJudul ? `${judulId}-err` : undefined}
              />
              {errJudul && (
                <CircleAlert className={styles.inputIcon} size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </div>
            {errJudul && (
              <p id={`${judulId}-err`} className={styles.fieldError} role="alert">{errJudul}</p>
            )}
            {!errJudul && judul.trim().length > MAKS_JUDUL - 30 && (
              <p className={styles.hitung}>{judul.trim().length} / {MAKS_JUDUL} karakter</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={isiId} className={styles.label}>Isi Berita</label>
            <div className={`${styles.editor} ${errIsi ? styles.editorError : ''}`}>
              <div className={styles.toolbar} role="toolbar" aria-label="Format teks (segera hadir)">
                {ALAT_EDITOR.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={styles.toolBtn}
                    disabled
                    aria-label={`${label} (segera hadir)`}
                    title={`${label} (segera hadir)`}
                  >
                    <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                ))}
                <span className={styles.toolSep} aria-hidden="true" />
              </div>
              <textarea
                ref={isiRef}
                id={isiId}
                className={styles.textarea}
                value={isi}
                onChange={ubahIsi}
                placeholder="Tulis isi berita di sini..."
                disabled={menyimpan}
                aria-invalid={errIsi ? 'true' : 'false'}
                aria-describedby={errIsi ? `${isiId}-err` : undefined}
              />
            </div>
            {errIsi && (
              <p id={`${isiId}-err`} className={styles.fieldError} role="alert">{errIsi}</p>
            )}
          </div>
        </section>

        {/* ── Kanan: gambar ───────────────────────────────── */}
        <aside className={styles.card} aria-label="Gambar berita">
          <h2 className={styles.cardTitle}>Gambar Berita</h2>

          {gambar ? (
            <div>
              <div className={styles.previewBox}>
                {srcGambar ? (
                  <img className={styles.previewImg} src={srcGambar} alt="Pratinjau gambar berita" />
                ) : (
                  <span className={styles.previewKosong}>
                    <ImageOff size={28} strokeWidth={1.7} aria-hidden="true" />
                    <span>Pratinjau tidak tersedia</span>
                  </span>
                )}
              </div>
              <p className={styles.fileMeta}>
                {gambar.nama}
                {gambar.ukuran ? ` · ${formatUkuran(gambar.ukuran)}` : ''}
              </p>
              <div className={styles.previewAksi}>
                <label className={`${base.btn} ${base.outline} ${base.sm} ${styles.gantiGambar}`}>
                  <Upload size={15} strokeWidth={2} aria-hidden="true" />
                  Ganti Gambar
                  <input
                    ref={fileRef}
                    type="file"
                    className={base.srOnly}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={ubahFile}
                    disabled={menyimpan}
                  />
                </label>
                <button
                  type="button"
                  className={`${base.btn} ${base.danger} ${base.sm}`}
                  onClick={hapusGambar}
                  disabled={menyimpan}
                >
                  <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor={gambarId}
              className={`${styles.dropzone} ${errGambar ? styles.dropError : ''} ${seret ? styles.dropAktif : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setSeret(true)
              }}
              onDragLeave={() => setSeret(false)}
              onDrop={lepasFile}
            >
              <Upload size={30} strokeWidth={1.8} aria-hidden="true" />
              <strong>Klik atau seret gambar ke sini</strong>
              <small>PNG / JPG / WEBP, maks. 2 MB</small>
              <input
                ref={fileRef}
                id={gambarId}
                type="file"
                className={base.srOnly}
                accept="image/png,image/jpeg,image/webp"
                onChange={ubahFile}
                disabled={menyimpan}
                aria-invalid={errGambar ? 'true' : 'false'}
                aria-describedby={errGambar ? `${gambarId}-err` : undefined}
              />
            </label>
          )}

          {errGambar && (
            <p id={`${gambarId}-err`} className={styles.fieldError} role="alert">{errGambar}</p>
          )}
        </aside>
      </div>
    </form>
  )
}

export default BeritaForm
