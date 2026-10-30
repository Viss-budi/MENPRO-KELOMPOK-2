import { ROUTES } from '../../../constants/routes'

// Router manual (App.jsx) hanya mengenal path persis, jadi sub-halaman berita didefinisikan di sini
// dan didaftarkan ke menu lewat components/admin/AdminLayout/menu.js.
//   /admin/berita            -> daftar
//   /admin/berita/tambah     -> form tambah
//   /admin/berita/12/ubah    -> form edit berita id 12
export const PATH_BERITA = `${ROUTES.admin}/berita`
export const PATH_TAMBAH_BERITA = `${PATH_BERITA}/tambah`
export const pathUbahBerita = (id) => `${PATH_BERITA}/${id}/ubah`

// -> { mode: 'daftar' } | { mode: 'tambah' } | { mode: 'ubah', id } | null (bukan rute berita)
export function bacaRuteBerita(path) {
  if (typeof path !== 'string') return null
  if (path === PATH_BERITA) return { mode: 'daftar' }
  if (!path.startsWith(`${PATH_BERITA}/`)) return null

  const sisa = path.slice(PATH_BERITA.length + 1)
  if (sisa === 'tambah') return { mode: 'tambah' }
  const cocok = /^(\d+)\/ubah$/.exec(sisa)
  if (cocok) return { mode: 'ubah', id: Number(cocok[1]) }
  return null
}
