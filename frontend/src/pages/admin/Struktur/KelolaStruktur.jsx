import { useCallback, useState } from 'react'
import Toast from '../../../components/admin/Toast/Toast'
import StrukturDaftar from './StrukturDaftar'
import DepartmentForm from './DepartmentForm'
import StrukturForm from './StrukturForm'
import { PATH_STRUKTUR, bacaRuteStruktur } from './rute'

// Halaman Kelola Struktur Organisasi.
// Memilih tampilan dari path:
//   /admin/struktur         -> daftar pengurus
//   /admin/struktur/tambah  -> form tambah pengurus
//   /admin/struktur/7/ubah  -> form ubah pengurus id 7
//   /admin/struktur/department/tambah dan /department/3/ubah -> form department
// pathname   : path halaman yang sedang tampil (dari App.jsx)
// onNavigate : (path) => void
function KelolaStruktur({ pathname, onNavigate }) {
  const rute = bacaRuteStruktur(pathname) ?? { mode: 'daftar' }
  const [toast, setToast] = useState(null)
  const [baruId, setBaruId] = useState(null)

  const tutupToast = useCallback(() => setToast(null), [])

  // Meninggalkan daftar (ke form): toast dibuang supaya tidak muncul lagi di atas form.
  const keluarDaftar = useCallback(
    (path) => {
      setToast(null)
      onNavigate(path)
    },
    [onNavigate]
  )

  // Form berhasil disimpan: kembali ke daftar, tandai baris baru, lalu beri kabar.
  const selesaiSimpan = useCallback(
    ({ id, nama, edit, tanpaPerubahan }) => {
      setBaruId(id ?? null)
      setToast({
        id: Date.now(),
        judul: tanpaPerubahan
          ? 'Tidak ada perubahan'
          : edit
            ? 'Data pengurus berhasil diperbarui'
            : 'Pengurus berhasil ditambahkan',
        pesan: tanpaPerubahan
          ? `Data "${nama}" tidak berubah.`
          : edit
            ? `Perubahan pada "${nama}" sudah tampil di daftar.`
            : `"${nama}" sudah tampil di daftar.`,
      })
      onNavigate(PATH_STRUKTUR)
    },
    [onNavigate]
  )

  // Pengurus dihapus dari form ubah (Zona Berbahaya): kembali ke daftar dan beri kabar.
  const selesaiHapus = useCallback(
    ({ nama, sudahTerhapus }) => {
      setBaruId(null)
      setToast({
        id: Date.now(),
        judul: sudahTerhapus ? 'Pengurus sudah terhapus' : 'Pengurus berhasil dihapus',
        pesan: sudahTerhapus ? `"${nama}" sudah dihapus sebelumnya. Daftar diperbarui.` : `"${nama}" sudah dihapus dari daftar.`,
      })
      onNavigate(PATH_STRUKTUR)
    },
    [onNavigate]
  )

  // Form department (tambah/ubah) selesai: kembali ke daftar dan beri kabar.
  const selesaiSimpanDept = useCallback(
    ({ nama, edit, tanpaPerubahan }) => {
      setBaruId(null)
      setToast({
        id: Date.now(),
        judul: tanpaPerubahan ? 'Tidak ada perubahan' : edit ? 'Department berhasil diperbarui' : 'Department berhasil ditambahkan',
        pesan: tanpaPerubahan
          ? `Data "${nama}" tidak berubah.`
          : edit
            ? `Perubahan pada "${nama}" sudah tampil di daftar.`
            : `"${nama}" sudah tampil di daftar.`,
      })
      onNavigate(PATH_STRUKTUR)
    },
    [onNavigate]
  )

  const selesaiHapusDept = useCallback(
    ({ nama, sudahTerhapus, anggotaDihapus = 0 }) => {
      setBaruId(null)
      setToast({
        id: Date.now(),
        judul: sudahTerhapus ? 'Department sudah terhapus' : 'Department berhasil dihapus',
        pesan: sudahTerhapus
          ? `"${nama}" sudah dihapus sebelumnya. Daftar diperbarui.`
          : anggotaDihapus > 0
            ? `"${nama}" dan ${anggotaDihapus} anggotanya sudah dihapus.`
            : `"${nama}" sudah dihapus dari daftar.`,
      })
      onNavigate(PATH_STRUKTUR)
    },
    [onNavigate]
  )

  // Toast dari daftar sendiri (mis. berhasil dihapus)
  const tampilkanToast = useCallback((isi) => {
    setBaruId(null)
    setToast({ id: Date.now(), ...isi })
  }, [])

  return (
    <>
      {rute.mode === 'daftar' ? (
        <StrukturDaftar baruId={baruId} onNavigate={keluarDaftar} onSukses={tampilkanToast} />
      ) : rute.mode === 'tambahDept' || rute.mode === 'ubahDept' ? (
        <DepartmentForm
          key={`${rute.mode}-${rute.id ?? ''}`}
          mode={rute.mode === 'ubahDept' ? 'ubah' : 'tambah'}
          id={rute.id}
          onNavigate={onNavigate}
          onSukses={selesaiSimpanDept}
          onHapus={selesaiHapusDept}
        />
      ) : (
        // key: pindah antara tambah dan ubah (atau antar id) selalu memulai form dari awal
        <StrukturForm
          key={`${rute.mode}-${rute.id ?? ''}`}
          mode={rute.mode}
          id={rute.id}
          onNavigate={onNavigate}
          onSukses={selesaiSimpan}
          onHapus={selesaiHapus}
        />
      )}
      <Toast toast={toast} onClose={tutupToast} />
    </>
  )
}

export default KelolaStruktur
