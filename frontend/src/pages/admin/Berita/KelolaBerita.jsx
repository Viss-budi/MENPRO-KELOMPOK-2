import { useCallback, useState } from 'react'
import Toast from '../../../components/admin/Toast/Toast'
import BeritaDaftar from './BeritaDaftar'
import BeritaForm from './BeritaForm'
import { PATH_BERITA, bacaRuteBerita } from './rute'

// Halaman Kelola Berita (US-3). Memilih tampilan dari path:
//   /admin/berita -> daftar ; /admin/berita/tambah -> form tambah ; /admin/berita/:id/ubah -> form edit
// Toast dan nomor halaman daftar disimpan di sini supaya tetap ada saat pindah daftar <-> form.
// pathname   : path halaman yang sedang tampil (dari App.jsx)
// onNavigate : (path) => void
function KelolaBerita({ pathname, onNavigate }) {
  const rute = bacaRuteBerita(pathname) ?? { mode: 'daftar' }
  const [toast, setToast] = useState(null)
  const [halaman, setHalaman] = useState(1)

  const tampilkanToast = useCallback((isi) => setToast({ ...isi, id: Date.now() }), [])
  const tutupToast = useCallback(() => setToast(null), [])

  // Meninggalkan daftar (ke form tambah/ubah): toast milik daftar (mis. "berhasil dihapus")
  // dibuang supaya tidak muncul lagi di atas form atau saat kembali ke daftar.
  // Navigasi dari form memakai onNavigate langsung, jadi toast hasil simpan tetap tampil.
  const keluarDaftar = useCallback(
    (path) => {
      setToast(null)
      onNavigate(path)
    },
    [onNavigate]
  )

  // Form berhasil disimpan: kembali ke daftar (daftar mengambil data baru saat dibuka) lalu beri kabar.
  // Berita baru muncul paling atas, jadi tambah selalu kembali ke halaman 1.
  const selesaiSimpan = useCallback(
    ({ edit, judul }) => {
      if (!edit) setHalaman(1)
      tampilkanToast({
        judul: edit ? 'Berita berhasil diperbarui' : 'Berita berhasil disimpan',
        pesan: `“${judul}” sudah tampil di daftar.`,
      })
      onNavigate(PATH_BERITA)
    },
    [onNavigate, tampilkanToast]
  )

  return (
    <>
      {rute.mode === 'daftar' ? (
        <BeritaDaftar
          page={halaman}
          onPage={setHalaman}
          onNavigate={keluarDaftar}
          onSukses={tampilkanToast}
        />
      ) : (
        // key: pindah dari tambah ke ubah (atau antar id) selalu memulai form dari awal
        <BeritaForm
          key={`${rute.mode}-${rute.id ?? ''}`}
          mode={rute.mode}
          id={rute.id}
          onNavigate={onNavigate}
          onSukses={selesaiSimpan}
        />
      )}
      <Toast toast={toast} onClose={tutupToast} />
    </>
  )
}

export default KelolaBerita
