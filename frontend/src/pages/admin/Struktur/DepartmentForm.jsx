import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, CircleAlert, LayoutGrid, RefreshCw, Trash2, Upload } from 'lucide-react'
import ConfirmDialog from '../../../components/admin/ConfirmDialog/ConfirmDialog'
import {
  createDepartment,
  deleteDepartment,
  getAdminDepartment,
  getAdminStruktur,
  updateDepartment,
  uploadImage,
} from '../../../services/api'
import { resolveImage } from '../../../utils/image'
import { klikBiasa } from '../../../utils/nav'
import { pesanGagal } from '../../../utils/pesanGagal'
import {
  MAKS_DESKRIPSI,
  MAKS_NAMA_DEPARTMENT,
  namaFileDariUrl,
  validasiDepartment,
  validasiFileLogo,
} from './departmentUtils'
import { PATH_STRUKTUR } from './rute'
import { formatUkuran, kepalaDepartment } from './strukturUtils'
import base from '../Berita/Berita.module.css'
import fs from './StrukturForm.module.css'
import styles from './DepartmentForm.module.css'

const PESAN_GAGAL_SIMPAN = 'Data department gagal disimpan, silakan coba lagi'
// Nama field di respons error backend -> kolom di form ini
const KOLOM_ERROR = { name: 'nama', description: 'deskripsi', logo_url: 'foto', sort_order: 'urutan' }

// Form tambah dan ubah department (desain 02-tambah-department dan 03-edit-department).
// mode       : 'tambah' | 'ubah' ; id : id department (mode ubah)
// onNavigate : (path) => void
// onSukses   : ({ id, nama, edit, tanpaPerubahan }) => void ; onHapus : ({ nama, sudahTerhapus }) => void
function DepartmentForm({ mode = 'tambah', id, onNavigate, onSukses, onHapus }) {
  const edit = mode === 'ubah'
  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [urutan, setUrutan] = useState('')
  const [aktif, setAktif] = useState(true)

  // logo: null | { file, nama, ukuran } ; preview = blob URL
  const [logo, setLogo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [logoDihapus, setLogoDihapus] = useState(false)
  const [seret, setSeret] = useState(false)

  const [awal, setAwal] = useState(null)
  const [kepala, setKepala] = useState('')
  const [muat, setMuat] = useState(edit ? 'memuat' : 'siap')
  const [muatKe, setMuatKe] = useState(0)
  const [tidakAda, setTidakAda] = useState(false)
  const [pesanMuat, setPesanMuat] = useState('')

  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const [konfirmHapus, setKonfirmHapus] = useState(false)
  const [menghapus, setMenghapus] = useState(false)
  const [errorHapus, setErrorHapus] = useState('')

  const namaId = useId()
  const kepalaId = useId()
  const deskripsiId = useId()
  const urutanId = useId()
  const anggotaId = useId()
  const logoId = useId()
  const aktifId = useId()

  const namaRef = useRef(null)
  const deskripsiRef = useRef(null)
  const urutanRef = useRef(null)
  const bannerRef = useRef(null)
  const logoInputRef = useRef(null)
  const abortRef = useRef(null)

  // ── Mode ubah: muat department, lalu cari kepalanya dari daftar pengurus ──
  useEffect(() => {
    if (!edit) return undefined
    const ac = new AbortController()
    ;(async () => {
      try {
        const data = await getAdminDepartment(id, ac.signal)
        setAwal(data)
        setNama(data.name ?? '')
        setDeskripsi(data.description ?? '')
        setUrutan(data.sort_order === null || data.sort_order === undefined ? '' : String(data.sort_order))
        setAktif(data.is_active === 1)
        setMuat('siap')
        // Kepala hanya keterangan tambahan: gagal memuatnya tidak menghalangi pengeditan
        try {
          const { items } = await getAdminStruktur(ac.signal)
          setKepala(kepalaDepartment(items, data.id))
        } catch (err) {
          if (err.name === 'AbortError') return
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        if (err.status === 404) {
          setTidakAda(true)
          return
        }
        setPesanMuat(pesanGagal(err, 'Data department belum dapat dimuat. Silakan coba lagi.'))
        setMuat('gagal')
      }
    })()
    return () => ac.abort()
  }, [edit, id, muatKe])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])
  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    if (banner) bannerRef.current?.focus()
  }, [banner])

  const bersihkan = useCallback((kolom) => {
    setErrors((prev) => (prev[kolom] ? { ...prev, [kolom]: '' } : prev))
    setBanner(null)
  }, [])

  function pilihFile(file) {
    if (!file) return
    const masalah = validasiFileLogo(file)
    if (masalah) {
      setErrors((prev) => ({ ...prev, foto: masalah }))
      return
    }
    setPreview(URL.createObjectURL(file))
    setLogo({ file, nama: file.name, ukuran: file.size })
    setLogoDihapus(false)
    bersihkan('foto')
  }
  function ubahFile(e) {
    pilihFile(e.target.files?.[0])
    e.target.value = ''
  }
  function hapusLogo() {
    setPreview(null)
    setLogo(null)
    setLogoDihapus(true)
    bersihkan('foto')
  }
  function lepas(e) {
    e.preventDefault()
    setSeret(false)
    if (!terkunci) pilihFile(e.dataTransfer?.files?.[0])
  }

  function muatUlang() {
    setBanner(null)
    setMuat('memuat')
    setMuatKe((n) => n + 1)
  }

  async function simpan(e) {
    e.preventDefault()
    if (menyimpan) return
    const masalah = validasiDepartment({ nama, deskripsi, urutan, awal })
    if (Object.keys(masalah).length > 0) {
      setErrors((prev) => ({ foto: prev.foto, ...masalah }))
      setBanner(null)
      if (masalah.nama) namaRef.current?.focus()
      else if (masalah.deskripsi) deskripsiRef.current?.focus()
      else urutanRef.current?.focus()
      return
    }

    setBanner(null)
    setMenyimpan(true)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    try {
      if (edit) {
        // PUT parsial: hanya field yang berubah yang dikirim
        const badan = {}
        if (nama.trim() !== awal.name) badan.name = nama.trim()
        if (deskripsi.trim() !== (awal.description ?? '')) badan.description = deskripsi.trim() || null
        if (Number(urutan) !== awal.sort_order) badan.sort_order = Number(urutan)
        if (aktif !== (awal.is_active === 1)) badan.is_active = aktif ? 1 : 0
        if (logo?.file) badan.logo_url = await uploadImage(logo.file, ac.signal)
        else if (logoDihapus && awal.logo_url) badan.logo_url = null

        if (Object.keys(badan).length === 0) {
          onSukses({ id: Number(id), nama: nama.trim(), edit: true, tanpaPerubahan: true })
          return
        }
        await updateDepartment(id, badan, ac.signal)
        onSukses({ id: Number(id), nama: nama.trim(), edit: true })
        return
      }

      const urlLogo = logo?.file ? await uploadImage(logo.file, ac.signal) : null
      const badan = { name: nama.trim(), sort_order: Number(urutan), is_active: aktif ? 1 : 0 }
      if (deskripsi.trim()) badan.description = deskripsi.trim()
      if (urlLogo) badan.logo_url = urlLogo
      const hasil = await createDepartment(badan, ac.signal)
      onSukses({ id: hasil?.id ?? null, nama: nama.trim() })
    } catch (err) {
      if (err.name === 'AbortError') return
      const perField = {}
      const sisa = []
      for (const e2 of err.errors ?? []) {
        const kolom = KOLOM_ERROR[e2.field]
        if (kolom && !perField[kolom]) perField[kolom] = e2.message
        else if (!kolom) sisa.push(e2.message)
      }
      // 409: nama (atau slug-nya) sudah dipakai department lain -> tampil di kolom nama
      if (err.status === 409 && err.message && !perField.nama) perField.nama = err.message
      if (Object.keys(perField).length > 0) {
        setErrors((prev) => ({ ...prev, ...perField }))
        if (perField.nama) namaRef.current?.focus()
        else if (perField.deskripsi) deskripsiRef.current?.focus()
        else if (perField.urutan) urutanRef.current?.focus()
      }
      if (Object.keys(perField).length === 0 || sisa.length > 0) {
        setBanner({ pesan: sisa[0] ?? pesanGagal(err, PESAN_GAGAL_SIMPAN) })
      }
    } finally {
      setMenyimpan(false)
    }
  }

  async function hapusDepartment() {
    if (menghapus || !awal) return
    setErrorHapus('')
    setMenghapus(true)
    const namaHapus = awal.name
    try {
      // Department berisi anggota ikut menghapus anggotanya (?with_members=1); pengguna sudah diperingatkan di dialog
      const r = await deleteDepartment(awal.id, { denganAnggota: Number(awal.member_count) > 0 })
      onHapus?.({ nama: namaHapus, anggotaDihapus: Number(r.members_deleted) || 0 })
    } catch (err) {
      if (err.status === 404) {
        onHapus?.({ nama: namaHapus, sudahTerhapus: true })
        return
      }
      setErrorHapus(pesanGagal(err, 'Department gagal dihapus, silakan coba lagi'))
      setMenghapus(false)
    }
  }

  function kembali(e) {
    if (e && !klikBiasa(e)) return
    e?.preventDefault()
    abortRef.current?.abort()
    onNavigate(PATH_STRUKTUR)
  }

  const terkunci = menyimpan || (edit && muat !== 'siap')
  const logoTersimpan = edit && awal?.logo_url && !logoDihapus ? awal.logo_url : null
  const srcLogo = preview ?? (logoTersimpan ? resolveImage(logoTersimpan) : null)
  const adaLogo = Boolean(logo || logoTersimpan)
  const namaFile = logo ? logo.nama : namaFileDariUrl(logoTersimpan || '') || 'Logo department'
  const ukuranFile = logo ? formatUkuran(logo.ukuran) : ''
  const errNama = errors.nama
  const errDeskripsi = errors.deskripsi
  const errUrutan = errors.urutan
  const errFoto = errors.foto
  const jumlahAnggota = edit ? Number(awal?.member_count) || 0 : 0

  if (tidakAda) {
    return (
      <div className={base.page}>
        <header className={base.head}>
          <div>
            <h1 className={base.title}>Edit Department</h1>
            <p className={base.subtitle}>Data department yang dicari tidak tersedia.</p>
          </div>
        </header>
        <div className={base.panel} role="alert">
          <span className={`${base.panelIcon} ${base.panelIconWarn}`}>
            <CircleAlert size={28} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <h2 className={base.panelTitle}>Department tidak ditemukan</h2>
          <p className={base.panelText}>Data ini mungkin sudah dihapus. Kembali ke daftar untuk melihat data terbaru.</p>
          <a href={PATH_STRUKTUR} className={`${base.btn} ${base.primary}`} onClick={kembali}>
            Kembali ke Daftar
          </a>
        </div>
      </div>
    )
  }

  return (
    <form className={base.page} onSubmit={simpan} noValidate>
      <header className={base.head}>
        <div>
          <h1 className={base.title}>{edit ? 'Edit Department' : 'Tambah Department'}</h1>
          <p className={base.subtitle}>
            {edit && muat === 'memuat'
              ? 'Memuat data department...'
              : edit
                ? 'Ubah data department yang tampil di halaman Struktur Organisasi website.'
                : 'Isi data department yang akan tampil di halaman Struktur Organisasi website.'}
          </p>
        </div>
        <div className={base.actions}>
          <a href={PATH_STRUKTUR} className={`${base.btn} ${base.outline}`} onClick={kembali}>
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
            Kembali
          </a>
        </div>
      </header>

      {(banner || muat === 'gagal') && (
        <div ref={bannerRef} tabIndex={-1} role="alert" className={fs.banner}>
          <CircleAlert size={22} strokeWidth={2} aria-hidden="true" />
          <span>{banner ? banner.pesan : pesanMuat}</span>
          {!banner && muat === 'gagal' && (
            <button type="button" className={fs.bannerAksi} onClick={muatUlang}>
              Muat Ulang
            </button>
          )}
        </div>
      )}

      <section className={styles.kartu} aria-label="Informasi department">
        <h2 className={styles.judulKartu}>
          <span className={styles.garis} aria-hidden="true" />
          Informasi Department
        </h2>

        <div className={styles.isi}>
          <div className={styles.kiri}>
            <div className={fs.field}>
              <label htmlFor={namaId} className={fs.label}>
                Nama Department <span className={styles.wajib} aria-hidden="true">*</span>
              </label>
              <div className={fs.inputWrap}>
                <input
                  ref={namaRef}
                  id={namaId}
                  type="text"
                  className={`${fs.input} ${errNama ? fs.inputError : ''}`}
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value)
                    bersihkan('nama')
                  }}
                  placeholder="Contoh: Department LEADE"
                  autoComplete="off"
                  disabled={terkunci}
                  maxLength={MAKS_NAMA_DEPARTMENT}
                  aria-required="true"
                  aria-invalid={errNama ? 'true' : 'false'}
                  aria-describedby={errNama ? `${namaId}-err` : undefined}
                />
                {errNama && <CircleAlert className={fs.inputIcon} size={18} strokeWidth={2} aria-hidden="true" />}
              </div>
              <p id={`${namaId}-err`} className={`${fs.fieldError} ${styles.galat}`} role={errNama ? 'alert' : undefined}>{errNama}</p>
            </div>

            {/* Backend belum punya field kepala department. Kepala = pengurus department itu yang jabatannya
                diawali "Kepala", jadi di sini hanya ditampilkan (tidak bisa dipilih). */}
            <div className={fs.field}>
              <label htmlFor={kepalaId} className={fs.label}>Kepala Department</label>
              <div className={fs.inputWrap}>
                <select id={kepalaId} className={`${fs.input} ${fs.select} ${kepala ? '' : fs.kosong}`} disabled aria-describedby={`${kepalaId}-info`}>
                  <option>
                    {kepala || (edit ? 'Belum ada kepala department' : 'Dipilih setelah pengurus ditambahkan')}
                  </option>
                </select>
                <ChevronDown className={fs.panah} size={18} strokeWidth={2} aria-hidden="true" />
              </div>
              <p id={`${kepalaId}-info`} className={styles.petunjuk}>
                Diatur lewat jabatan pengurus (diawali "Kepala") di tabel pengurus.
              </p>
            </div>

            <div className={fs.field}>
              <label htmlFor={deskripsiId} className={fs.label}>Deskripsi Singkat</label>
              <div className={styles.areaWrap}>
                <textarea
                  ref={deskripsiRef}
                  id={deskripsiId}
                  className={`${fs.input} ${styles.area} ${errDeskripsi ? fs.inputError : ''}`}
                  value={deskripsi}
                  onChange={(e) => {
                    setDeskripsi(e.target.value)
                    bersihkan('deskripsi')
                  }}
                  placeholder="Tuliskan deskripsi singkat tentang department ini..."
                  disabled={terkunci}
                  maxLength={MAKS_DESKRIPSI}
                  rows={4}
                  aria-invalid={errDeskripsi ? 'true' : 'false'}
                  aria-describedby={errDeskripsi ? `${deskripsiId}-err` : undefined}
                />
                <span className={styles.hitung} aria-live="off">{deskripsi.length}/{MAKS_DESKRIPSI}</span>
              </div>
              <p id={`${deskripsiId}-err`} className={`${fs.fieldError} ${styles.galat}`} role={errDeskripsi ? 'alert' : undefined}>{errDeskripsi}</p>
            </div>

            <div className={fs.baris}>
              <div className={fs.field}>
                <label htmlFor={urutanId} className={fs.label}>
                  Urutan Tampil <span className={styles.wajib} aria-hidden="true">*</span>
                </label>
                <div className={fs.inputWrap}>
                  <input
                    ref={urutanRef}
                    id={urutanId}
                    type="text"
                    inputMode="numeric"
                    className={`${fs.input} ${errUrutan ? fs.inputError : ''}`}
                    value={urutan}
                    onChange={(e) => {
                      setUrutan(e.target.value.replace(/[^\d]/g, '').slice(0, 7))
                      bersihkan('urutan')
                    }}
                    placeholder="Contoh: 1"
                    autoComplete="off"
                    disabled={terkunci}
                    aria-required="true"
                    aria-invalid={errUrutan ? 'true' : 'false'}
                    aria-describedby={errUrutan ? `${urutanId}-err` : undefined}
                  />
                  {errUrutan && <CircleAlert className={fs.inputIcon} size={18} strokeWidth={2} aria-hidden="true" />}
                </div>
                <p id={`${urutanId}-err`} className={`${fs.fieldError} ${styles.galat}`} role={errUrutan ? 'alert' : undefined}>{errUrutan}</p>
              </div>

              <div className={fs.field}>
                <label htmlFor={anggotaId} className={fs.label}>Jumlah Anggota</label>
                <input id={anggotaId} type="text" className={`${fs.input} ${styles.baca}`} value={`${jumlahAnggota} Anggota`} readOnly tabIndex={-1} />
              </div>
            </div>
          </div>

          <div className={styles.kanan}>
            <span className={fs.label} id={`${logoId}-label`}>Ikon / Foto Department</span>
            {adaLogo ? (
              <div className={`${styles.berkas} ${errFoto ? styles.berkasSalah : ''}`}>
                <span className={styles.berkasIkon}>
                  {srcLogo ? <img src={srcLogo} alt="" /> : <LayoutGrid size={30} strokeWidth={1.8} aria-hidden="true" />}
                </span>
                <div className={styles.berkasInfo}>
                  <p className={styles.berkasNama} title={namaFile}>{namaFile}</p>
                  {ukuranFile && <p className={styles.berkasUkuran}>{ukuranFile}</p>}
                  <div className={styles.berkasAksi}>
                    <label className={`${styles.pil} ${styles.pilBiru} ${terkunci ? styles.pilMati : ''}`}>
                      Ganti
                      <input
                        ref={logoInputRef}
                        id={logoId}
                        type="file"
                        className={base.srOnly}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={ubahFile}
                        disabled={terkunci}
                        aria-describedby={`${logoId}-info`}
                      />
                    </label>
                    <button type="button" className={`${styles.pil} ${styles.pilMerah}`} onClick={hapusLogo} disabled={terkunci}>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                className={`${styles.zona} ${seret ? styles.zonaSeret : ''} ${errFoto ? styles.zonaSalah : ''} ${terkunci ? styles.zonaMati : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (!terkunci) setSeret(true)
                }}
                onDragLeave={() => setSeret(false)}
                onDrop={lepas}
              >
                <span className={styles.zonaIkon} aria-hidden="true"><Upload size={22} strokeWidth={2} /></span>
                <span className={styles.zonaTeks}><b>Klik untuk unggah</b> atau seret file</span>
                <span className={styles.zonaCatatan}>PNG, JPG, atau WEBP (maks. 2 MB)</span>
                <input
                  ref={logoInputRef}
                  id={logoId}
                  type="file"
                  className={base.srOnly}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={ubahFile}
                  disabled={terkunci}
                  aria-labelledby={`${logoId}-label`}
                  aria-describedby={`${logoId}-info`}
                />
              </label>
            )}
            <p id={`${logoId}-info`} className={`${styles.fotoPesan} ${errFoto ? styles.fotoPesanSalah : ''}`} role={errFoto ? 'alert' : undefined}>
              {errFoto || 'Opsional. Tanpa gambar, website memakai ikon bawaan.'}
            </p>

            <div className={styles.tampil}>
              <div>
                <p className={styles.tampilJudul} id={`${aktifId}-judul`}>Tampilkan di Website</p>
                <p className={styles.tampilTeks} id={`${aktifId}-teks`}>Department muncul di halaman Struktur Organisasi.</p>
              </div>
              <button
                type="button"
                id={aktifId}
                role="switch"
                aria-checked={aktif}
                aria-labelledby={`${aktifId}-judul`}
                aria-describedby={`${aktifId}-teks`}
                className={`${styles.sakelar} ${aktif ? styles.sakelarAktif : ''}`}
                onClick={() => setAktif((v) => !v)}
                disabled={terkunci}
              >
                <span className={styles.sakelarBulat} />
              </button>
            </div>
          </div>
        </div>

        <footer className={styles.kaki}>
          {edit && awal && (
            <button
              type="button"
              className={`${base.btn} ${base.danger} ${styles.hapus}`}
              onClick={() => {
                setErrorHapus('')
                setKonfirmHapus(true)
              }}
              disabled={menyimpan}
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
              Hapus Department
            </button>
          )}
          <div className={styles.kakiKanan}>
            <button type="button" className={`${base.btn} ${base.outline} ${fs.batal}`} onClick={kembali}>
              Batal
            </button>
            <button
              type="submit"
              className={`${base.btn} ${base.primary} ${fs.simpan} ${styles.simpan}`}
              disabled={terkunci}
              aria-busy={menyimpan}
            >
              {menyimpan && <RefreshCw className={fs.putar} size={16} strokeWidth={2.2} aria-hidden="true" />}
              {menyimpan ? 'Menyimpan...' : edit ? 'Simpan Perubahan' : 'Simpan Department'}
            </button>
          </div>
        </footer>
      </section>

      {konfirmHapus && (
        <ConfirmDialog
          judul="Hapus department ini?"
          pesan={
            Number(awal?.member_count) > 0
              ? `"${awal?.name}" masih punya ${awal.member_count} anggota. Menghapusnya juga akan menghapus semua anggotanya secara permanen.`
              : `"${awal?.name}" akan dihapus permanen dan tidak dapat dikembalikan.`
          }
          error={errorHapus}
          loading={menghapus}
          labelLoading="Menghapus..."
          onConfirm={hapusDepartment}
          onCancel={() => {
            if (!menghapus) setKonfirmHapus(false)
          }}
        />
      )}
    </form>
  )
}

export default DepartmentForm
