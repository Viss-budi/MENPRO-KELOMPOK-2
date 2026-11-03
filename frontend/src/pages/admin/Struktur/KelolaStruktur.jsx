import { useCallback, useState } from 'react'
import Toast from '../../../components/admin/Toast/Toast'
import StrukturDaftar from './StrukturDaftar'
import StrukturForm from './StrukturForm'
import { PATH_STRUKTUR, bacaRuteStruktur } from './rute'

// Halaman Kelola Struktur Organisasi.
// Memilih tampilan dari path:
//   /admin/struktur         -> daftar pengurus
//   /admin/struktur/tambah  -> form tambah pengurus
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
    ({ id, nama }) => {
      setBaruId(id ?? null)
      setToast({
        id: Date.now(),
        judul: 'Pengurus berhasil ditambahkan',
        pesan: `"${nama}" sudah tampil di daftar.`,
      })
      onNavigate(PATH_STRUKTUR)
    },
    [onNavigate]
  )

  return (
    <>
      {rute.mode === 'daftar' ? (
        <StrukturDaftar baruId={baruId} onNavigate={keluarDaftar} />
      ) : (
        <StrukturForm onNavigate={onNavigate} onSukses={selesaiSimpan} />
      )}
      <Toast toast={toast} onClose={tutupToast} />
    </>
  )
}

export default KelolaStruktur
