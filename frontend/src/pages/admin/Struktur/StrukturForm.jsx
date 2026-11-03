import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, CircleAlert, Info, RefreshCw, Trash2, Upload } from 'lucide-react'
import AvatarPengurus from '../../../components/common/AvatarPengurus/AvatarPengurus'
import { createMember, getAdminDepartments, getPeriods, uploadImage } from '../../../services/api'
import { klikBiasa } from '../../../utils/nav'
import { pesanGagal } from '../../../utils/pesanGagal'
import {
  MAKS_JABATAN,
  MAKS_NAMA,
  formatUkuran,
  validasiFileFoto,
  validasiPengurus,
} from './strukturUtils'
import { PATH_STRUKTUR } from './rute'
import base from '../Berita/Berita.module.css'
import styles from './StrukturForm.module.css'

const PESAN_GAGAL_SIMPAN = 'Data pengurus gagal disimpan, silakan coba lagi'
const PESAN_GAGAL_DEPARTMENT = 'Daftar department belum dapat dimuat. Silakan coba lagi.'
const PESAN_TANPA_PERIODE = 'Belum ada periode aktif. Hubungi tim backend untuk menyiapkan periode.'

// Form tambah pengurus (desain 05 sampai 11).
// onNavigate : (path) => void
// onSukses   : ({ id, nama }) => void
function StrukturForm({ onNavigate, onSukses }) {
  const [nama, setNama] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  // foto: null | { file: File, nama, ukuran }; preview = blob URL
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)

  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  // Periode aktif + pilihan department. muat: 'memuat' | 'siap' | 'gagal'
  const [muat, setMuat] = useState('memuat')
  const [muatKe, setMuatKe] = useState(0)
  const [periode, setPeriode] = useState(null)
  const [daftarDepartment, setDaftarDepartment] = useState([])
  const [pesanMuat, setPesanMuat] = useState('')

  const namaId = useId()
  const jabatanId = useId()
  const departmentIdEl = useId()
  const fotoId = useId()

  const namaRef = useRef(null)
  const jabatanRef = useRef(null)
  const departmentRef = useRef(null)
  const fotoInputRef = useRef(null)
  const bannerRef = useRef(null)
  const abortRef = useRef(null)

  // ── Ambil periode aktif dan daftar department-nya ───────────────────────
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const { active } = await getPeriods(ac.signal)
        if (!active) {
          setPeriode(null)
          setDaftarDepartment([])
          setPesanMuat(PESAN_TANPA_PERIODE)
          setMuat('gagal')
          return
        }
        const dept = await getAdminDepartments(active, ac.signal)
        setPeriode(active)
        setDaftarDepartment(dept)
        setMuat('siap')
      } catch (err) {
        if (err.name === 'AbortError') return
        setPesanMuat(pesanGagal(err, PESAN_GAGAL_DEPARTMENT))
        setMuat('gagal')
      }
    })()
    return () => ac.abort()
  }, [muatKe])

  // Bersihkan blob URL saat ganti foto atau unmount
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
    const masalah = validasiFileFoto(file)
    if (masalah) {
      setErrors((prev) => ({ ...prev, foto: masalah }))
      return
    }
    setPreview(URL.createObjectURL(file))
    setFoto({ file, nama: file.name, ukuran: file.size })
    bersihkan('foto')
  }

  function ubahFile(e) {
    pilihFile(e.target.files?.[0])
    e.target.value = ''
  }

  function hapusFoto() {
    setPreview(null)
    setFoto(null)
    bersihkan('foto')
  }

  function muatUlang() {
    setBanner(null)
    setMuat('memuat')
    setMuatKe((n) => n + 1)
  }

  // ── Simpan ──────────────────────────────────────────────────────────────
  async function simpan(e) {
    e.preventDefault()
    if (menyimpan) return

    const masalah = validasiPengurus({ nama, jabatan, departmentId })
    if (Object.keys(masalah).length > 0) {
      setErrors((prev) => ({ foto: prev.foto, ...masalah }))
      setBanner(null)
      if (masalah.nama) namaRef.current?.focus()
      else if (masalah.jabatan) jabatanRef.current?.focus()
      else departmentRef.current?.focus()
      return
    }
    if (!periode) {
      setBanner({ pesan: pesanMuat || PESAN_TANPA_PERIODE })
      return
    }

    setBanner(null)
    setMenyimpan(true)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    try {
      // 1) Unggah foto bila ada. Tanpa foto, photo_url null dan website memakai foto bawaan.
      const urlFoto = foto?.file ? await uploadImage(foto.file, ac.signal) : null

      // 2) Simpan pengurus
      const hasil = await createMember(
        {
          name: nama.trim(),
          position: jabatan.trim(),
          department_id: Number(departmentId),
          photo_url: urlFoto,
          period: periode,
          is_active: 1,
        },
        ac.signal
      )
      onSukses({ id: hasil?.id ?? null, nama: nama.trim() })
    } catch (err) {
      if (err.name === 'AbortError') return
      setBanner({ pesan: pesanGagal(err, PESAN_GAGAL_SIMPAN) })
    } finally {
      setMenyimpan(false)
    }
  }

  function batal(e) {
    if (e && !klikBiasa(e)) return
    e?.preventDefault()
    abortRef.current?.abort()
    onNavigate(PATH_STRUKTUR)
  }

  const department = daftarDepartment.find((d) => String(d.id) === String(departmentId))
  const errNama = errors.nama
  const errJabatan = errors.jabatan
  const errDepartment = errors.department
  const errFoto = errors.foto

  return (
    <form className={base.page} onSubmit={simpan} noValidate>
      <header className={base.head}>
        <div>
          <h1 className={base.title}>Tambah Pengurus</h1>
          <p className={base.subtitle}>Isi data pengurus lalu tekan Simpan.</p>
        </div>
        <div className={base.actions}>
          <button type="button" className={`${base.btn} ${base.outline} ${styles.batal}`} onClick={batal}>
            Batal
          </button>
          <button
            type="submit"
            className={`${base.btn} ${base.primary} ${styles.simpan}`}
            disabled={menyimpan}
            aria-busy={menyimpan}
          >
            {menyimpan && <RefreshCw className={styles.putar} size={16} strokeWidth={2.2} aria-hidden="true" />}
            {menyimpan ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </header>

      {(banner || muat === 'gagal') && (
        <div
          ref={bannerRef}
          tabIndex={-1}
          role="alert"
          className={styles.banner}
        >
          <CircleAlert size={22} strokeWidth={2} aria-hidden="true" />
          <span>{banner ? banner.pesan : pesanMuat}</span>
          {!banner && muat === 'gagal' && (
            <button type="button" className={styles.bannerAksi} onClick={muatUlang}>
              Muat Ulang
            </button>
          )}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.kolomKiri}>
          {/* ── Data Pengurus ──────────────────────────────── */}
          <section className={`${styles.card} ${styles.cardData}`} aria-label="Data pengurus">
            <h2 className={styles.cardTitle}>Data Pengurus</h2>

            <div className={styles.field}>
              <label htmlFor={namaId} className={styles.label}>Nama Lengkap</label>
              <div className={styles.inputWrap}>
                <input
                  ref={namaRef}
                  id={namaId}
                  type="text"
                  className={`${styles.input} ${errNama ? styles.inputError : ''}`}
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value)
                    bersihkan('nama')
                  }}
                  placeholder="Masukkan nama lengkap"
                  autoComplete="off"
                  disabled={menyimpan}
                  maxLength={MAKS_NAMA}
                  aria-invalid={errNama ? 'true' : 'false'}
                  aria-describedby={errNama ? `${namaId}-err` : undefined}
                />
                {errNama && <CircleAlert className={styles.inputIcon} size={18} strokeWidth={2} aria-hidden="true" />}
              </div>
              <p id={`${namaId}-err`} className={styles.fieldError} role={errNama ? 'alert' : undefined}>
                {errNama}
              </p>
            </div>

            <div className={styles.baris}>
              <div className={styles.field}>
                <label htmlFor={jabatanId} className={styles.label}>Jabatan</label>
                <div className={styles.inputWrap}>
                  <input
                    ref={jabatanRef}
                    id={jabatanId}
                    type="text"
                    className={`${styles.input} ${errJabatan ? styles.inputError : ''}`}
                    value={jabatan}
                    onChange={(e) => {
                      setJabatan(e.target.value)
                      bersihkan('jabatan')
                    }}
                    placeholder="Contoh: Ketua Divisi"
                    autoComplete="off"
                    disabled={menyimpan}
                    maxLength={MAKS_JABATAN}
                    aria-invalid={errJabatan ? 'true' : 'false'}
                    aria-describedby={errJabatan ? `${jabatanId}-err` : undefined}
                  />
                  {errJabatan && <CircleAlert className={styles.inputIcon} size={18} strokeWidth={2} aria-hidden="true" />}
                </div>
                <p id={`${jabatanId}-err`} className={styles.fieldError} role={errJabatan ? 'alert' : undefined}>
                  {errJabatan}
                </p>
              </div>

              <div className={styles.field}>
                <label htmlFor={departmentIdEl} className={styles.label}>Department</label>
                <div className={styles.inputWrap}>
                  <select
                    ref={departmentRef}
                    id={departmentIdEl}
                    className={`${styles.input} ${styles.select} ${departmentId ? '' : styles.kosong} ${errDepartment ? styles.inputError : ''}`}
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value)
                      bersihkan('department')
                    }}
                    disabled={menyimpan || muat === 'memuat'}
                    aria-invalid={errDepartment ? 'true' : 'false'}
                    aria-describedby={errDepartment ? `${departmentIdEl}-err` : undefined}
                  >
                    <option value="">{muat === 'memuat' ? 'Memuat department...' : 'Pilih Department'}</option>
                    {daftarDepartment.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={styles.panah} size={18} strokeWidth={2} aria-hidden="true" />
                </div>
                <p id={`${departmentIdEl}-err`} className={styles.fieldError} role={errDepartment ? 'alert' : undefined}>
                  {errDepartment}
                </p>
              </div>
            </div>

            <p className={styles.hint}>Semua kolom wajib diisi, kecuali foto.</p>
          </section>

          {/* ── Pratinjau di Website ───────────────────────── */}
          <section className={`${styles.card} ${styles.pratinjau}`} aria-label="Pratinjau di website">
            <div className={styles.pratinjauTeks}>
              <h2 className={styles.pratinjauJudul}>Pratinjau di Website</h2>
              <p className={styles.pratinjauDesc}>Beginilah kartu pengurus tampil untuk pengunjung.</p>
              <p className={styles.catatan}>
                <Info size={18} strokeWidth={1.9} aria-hidden="true" />
                Jika foto kosong, kartu memakai foto bawaan.
              </p>
              <p className={styles.catatanKecil}>Nama panjang otomatis turun ke baris kedua.</p>
            </div>

            <div className={styles.kartu} aria-hidden="true">
              <AvatarPengurus src={preview} ukuran={60} />
              <span className={styles.kartuNama}>{nama.trim() || 'Nama Lengkap'}</span>
              <span className={styles.kartuJabatan}>{jabatan.trim() || 'Jabatan'}</span>
              <span className={styles.kartuDept}>
                {department ? `Department ${department.name}` : 'Department'}
              </span>
            </div>
          </section>
        </div>

        {/* ── Foto Pengurus ────────────────────────────────── */}
        <aside className={`${styles.card} ${styles.cardFoto}`} aria-label="Foto pengurus">
          <div className={styles.fotoHead}>
            <h2 className={styles.cardTitleFoto}>Foto Pengurus</h2>
            <span className={styles.opsional}>Opsional</span>
          </div>

          <div className={`${styles.fotoBulat} ${errFoto ? styles.fotoSalah : ''}`}>
            <AvatarPengurus src={preview} nama="Pratinjau foto pengurus" ukuran={126} cincin={!errFoto} />
          </div>

          <div className={styles.fotoAksi}>
            <label className={`${base.btn} ${base.outline} ${styles.tombolFoto} ${foto ? '' : styles.tombolUnggah}`}>
              <Upload size={16} strokeWidth={2} aria-hidden="true" />
              {foto ? 'Ganti' : 'Unggah Foto'}
              <input
                ref={fotoInputRef}
                id={fotoId}
                type="file"
                className={base.srOnly}
                accept="image/png,image/jpeg"
                onChange={ubahFile}
                disabled={menyimpan}
                aria-invalid={errFoto ? 'true' : 'false'}
                aria-describedby={`${fotoId}-info`}
              />
            </label>
            {foto && (
              <button
                type="button"
                className={`${base.btn} ${base.danger} ${styles.tombolFoto}`}
                onClick={hapusFoto}
                disabled={menyimpan}
              >
                <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                Hapus
              </button>
            )}
          </div>

          {errFoto ? (
            <p id={`${fotoId}-info`} className={`${styles.fotoInfo} ${styles.fotoInfoSalah}`} role="alert">{errFoto}</p>
          ) : foto ? (
            <p id={`${fotoId}-info`} className={styles.fotoInfo}>
              {foto.nama} · {formatUkuran(foto.ukuran)}
            </p>
          ) : (
            <p id={`${fotoId}-info`} className={styles.fotoInfo}>
              JPG / PNG, maks. 2 MB. Tanpa foto, foto bawaan dipakai.
            </p>
          )}
        </aside>
      </div>
    </form>
  )
}

export default StrukturForm
