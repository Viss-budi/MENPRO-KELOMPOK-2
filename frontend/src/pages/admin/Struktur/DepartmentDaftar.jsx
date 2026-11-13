import { useMemo, useState } from 'react'
import { CircleAlert, LayoutGrid, Pencil, Plus, RefreshCw, SearchX, Trash2 } from 'lucide-react'
import AlatTabel from '../../../components/admin/AlatTabel/AlatTabel'
import ConfirmDialog from '../../../components/admin/ConfirmDialog/ConfirmDialog'
import Paginasi from '../../../components/admin/Paginasi/Paginasi'
import { useApi } from '../../../hooks/useApi'
import { deleteDepartment, getAdminDepartmentsAll } from '../../../services/api'
import { pesanGagal } from '../../../utils/pesanGagal'
import { kepalaDepartment, normalisasiKata } from './strukturUtils'
import base from '../Berita/Berita.module.css'
import aksi from '../Berita/BeritaDaftar.module.css'
import tabel from './StrukturDaftar.module.css'
import styles from './DepartmentDaftar.module.css'

// Nama sudah diawali "Department" (mis. "Department LEADE") dipakai apa adanya, selain itu diberi awalan.
const namaTampil = (nama) => (/^department\b/i.test(nama || '') ? nama : `Department ${nama || '—'}`)

// Tabel Department di bawah tabel pengurus.
// pengurus  : daftar pengurus (dari tabel di atasnya) untuk mencari kepala department
// onSukses  : ({ judul, pesan }) => void (toast) ; onBerubah : () => void (muat ulang daftar pengurus)
function DepartmentDaftar({ pengurus, onSukses, onBerubah }) {
  const [muatUlang, setMuatUlang] = useState(0)
  const [kata, setKata] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [perHalaman, setPerHalaman] = useState(10)
  const [target, setTarget] = useState(null)
  const [menghapus, setMenghapus] = useState(false)
  const [errorHapus, setErrorHapus] = useState('')

  const { data, loading, error } = useApi((signal) => getAdminDepartmentsAll(signal), `department-${muatUlang}`)
  const semua = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const items = useMemo(() => {
    const kataKunci = normalisasiKata(kata).split(' ').filter(Boolean)
    return semua.filter((d) => {
      if (kataKunci.length === 0) return true
      const bahan = normalisasiKata(`${namaTampil(d.name)} ${kepalaDepartment(pengurus, d.id)}`)
      return kataKunci.every((k) => bahan.includes(k))
    })
  }, [semua, kata, pengurus])
  const halamanAktif = Math.min(halaman, Math.max(1, Math.ceil(items.length / perHalaman)))
  const tampil = items.slice((halamanAktif - 1) * perHalaman, halamanAktif * perHalaman)

  function bukaHapus(d) {
    setErrorHapus('')
    setTarget(d)
  }
  function tutupHapus() {
    if (menghapus) return
    setTarget(null)
    setErrorHapus('')
  }

  async function konfirmasiHapus() {
    if (!target || menghapus) return
    const nama = namaTampil(target.name)
    setMenghapus(true)
    setErrorHapus('')
    try {
      // Departemen berisi anggota hanya bisa dihapus bersama anggotanya (?with_members=1); pengguna sudah diberi tahu di dialog
      const r = await deleteDepartment(target.id, { denganAnggota: Number(target.member_count) > 0 })
      setTarget(null)
      setMuatUlang((n) => n + 1)
      onBerubah?.()
      const hapus = Number(r.members_deleted) || 0
      onSukses?.({
        judul: 'Department berhasil dihapus',
        pesan: hapus > 0 ? `"${nama}" dan ${hapus} anggotanya sudah dihapus.` : `"${nama}" sudah dihapus dari daftar.`,
      })
    } catch (err) {
      if (err.status === 404) {
        setTarget(null)
        setMuatUlang((n) => n + 1)
        onBerubah?.()
        onSukses?.({ judul: 'Department sudah terhapus', pesan: `"${nama}" sudah dihapus sebelumnya. Daftar diperbarui.` })
        return
      }
      setErrorHapus(pesanGagal(err, 'Department gagal dihapus, silakan coba lagi'))
    } finally {
      setMenghapus(false)
    }
  }

  const alat = (variant) => (
    <AlatTabel
      variant={variant}
      label="department"
      placeholder="Cari nama department..."
      query={kata}
      onQuery={(v) => {
        setKata(v)
        setHalaman(1)
      }}
    />
  )
  const adaData = !loading && !error && tampil.length > 0
  const tidakCocok = !loading && !error && semua.length > 0 && items.length === 0
  const kosong = !loading && !error && semua.length === 0
  const alatSiap = !loading && !error && semua.length > 0

  // Tambah dan Ubah Department belum punya halaman form (belum ada desainnya), jadi tombolnya dinonaktifkan
  const tombolTambah = (
    <button
      type="button"
      className={`${base.btn} ${base.primary}`}
      disabled
      title="Form tambah department belum tersedia"
    >
      <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
      Tambah Department
    </button>
  )

  return (
    <section className={styles.bagian} aria-labelledby="judul-department">
      <header className={base.head}>
        <div>
          <h2 id="judul-department" className={`${base.title} ${styles.judul}`}>Kelola Department</h2>
          <p className={base.subtitle}>Atur data department yang tampil di halaman Struktur Organisasi website.</p>
        </div>
        <div className={base.actions}>{tombolTambah}</div>
      </header>

      {error ? (
        <div className={base.panel} role="alert">
          <span className={`${base.panelIcon} ${base.panelIconWarn}`}>
            <CircleAlert size={28} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <h3 className={base.panelTitle}>Data department belum dapat dimuat</h3>
          <p className={base.panelText}>{pesanGagal(error, 'Terjadi kendala saat mengambil data. Silakan coba lagi.')}</p>
          <button type="button" className={`${base.btn} ${base.primary}`} onClick={() => setMuatUlang((n) => n + 1)}>
            <RefreshCw size={16} strokeWidth={2.1} aria-hidden="true" />
            Muat Ulang
          </button>
        </div>
      ) : (
        <div className={tabel.card} aria-busy={loading}>
          <table className={tabel.table}>
            <caption className={base.srOnly}>Daftar department</caption>
            <colgroup>
              <col />
              <col className={tabel.colJabatan} />
              <col className={tabel.colDept} />
              <col className={tabel.colAksi} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Department</th>
                <th scope="col">Kepala Department</th>
                <th scope="col">Jumlah Anggota</th>
                <th scope="col" className={tabel.thAlat}>
                  <span className={base.srOnly}>Aksi</span>
                  {alatSiap && alat('header')}
                </th>
              </tr>
            </thead>
            <tbody>
              {kosong && (
                <tr className={tabel.barisKosong}>
                  <td colSpan={4}>
                    <div className={tabel.tidakCocok}>
                      <p className={tabel.tidakCocokJudul}>Belum ada department</p>
                    </div>
                  </td>
                </tr>
              )}
              {tidakCocok && (
                <tr className={tabel.barisKosong}>
                  <td colSpan={4}>
                    <div className={tabel.tidakCocok} role="status">
                      <span className={tabel.tidakCocokIkon} aria-hidden="true"><SearchX size={26} strokeWidth={1.8} /></span>
                      <p className={tabel.tidakCocokJudul}>Tidak ada department yang cocok</p>
                      <button type="button" className={`${base.btn} ${base.outline} ${base.sm}`} onClick={() => setKata('')}>
                        Reset pencarian
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {loading &&
                [0, 1, 2].map((n) => (
                  <tr key={`skel-${n}`} aria-hidden="true">
                    <td>
                      <div className={tabel.selPengurus}>
                        <span className={`${base.skel} ${tabel.skelFoto}`} />
                        <span className={`${base.skel} ${tabel.skelNama}`} />
                      </div>
                    </td>
                    <td data-label="Kepala Department"><span className={`${base.skel} ${tabel.skelJabatan}`} /></td>
                    <td data-label="Jumlah Anggota"><span className={`${base.skel} ${tabel.skelBadge}`} /></td>
                    <td className={tabel.selAksi}><span className={`${base.skel} ${tabel.skelAksi}`} /></td>
                  </tr>
                ))}
              {adaData &&
                tampil.map((d) => {
                  const kepala = kepalaDepartment(pengurus, d.id)
                  const nama = namaTampil(d.name)
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className={tabel.selPengurus}>
                          <span className={styles.ikon} aria-hidden="true"><LayoutGrid size={20} strokeWidth={1.9} /></span>
                          <span className={tabel.nama} title={nama}>{nama}</span>
                        </div>
                      </td>
                      <td className={tabel.selJabatan} data-label="Kepala Department">
                        {kepala || <span className={tabel.belumDiisi}>Belum ada</span>}
                      </td>
                      <td data-label="Jumlah Anggota">
                        <span className={tabel.badge}>{Number(d.member_count) || 0} Anggota</span>
                      </td>
                      <td className={tabel.selAksi}>
                        <div className={aksi.aksi}>
                          <button
                            type="button"
                            className={`${base.btn} ${base.outline} ${base.sm} ${aksi.btnAksi} ${aksi.btnEdit}`}
                            aria-label={`Edit ${nama}`}
                            disabled
                            title="Form ubah department belum tersedia"
                          >
                            <Pencil size={15} strokeWidth={2} aria-hidden="true" />
                            <span className={aksi.labelAksi}>Edit</span>
                          </button>
                          <button
                            type="button"
                            className={`${base.btn} ${base.danger} ${base.sm} ${aksi.btnAksi} ${aksi.btnHapus}`}
                            aria-label={`Hapus ${nama}`}
                            onClick={() => bukaHapus(d)}
                          >
                            <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                            <span className={aksi.labelAksi}>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {adaData && (
            <Paginasi
              total={items.length}
              halaman={halamanAktif}
              perHalaman={perHalaman}
              onHalaman={setHalaman}
              onPerHalaman={(n) => {
                setPerHalaman(n)
                setHalaman(1)
              }}
              label="department"
            />
          )}
        </div>
      )}

      {target && (
        <ConfirmDialog
          judul="Hapus department ini?"
          pesan={
            Number(target.member_count) > 0
              ? `"${namaTampil(target.name)}" masih punya ${target.member_count} anggota. Menghapusnya juga akan menghapus semua anggotanya secara permanen.`
              : `"${namaTampil(target.name)}" akan dihapus permanen dan tidak dapat dikembalikan.`
          }
          error={errorHapus}
          loading={menghapus}
          labelLoading="Menghapus..."
          onConfirm={konfirmasiHapus}
          onCancel={tutupHapus}
        />
      )}
    </section>
  )
}

export default DepartmentDaftar
