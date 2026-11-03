// Rute halaman Kelola Struktur Organisasi
export const PATH_STRUKTUR = '/admin/struktur'
export const PATH_TAMBAH_PENGURUS = '/admin/struktur/tambah'

// Baca mode dari path:
//   /admin/struktur         -> { mode: 'daftar' }
//   /admin/struktur/tambah  -> { mode: 'tambah' }
//   lainnya                 -> null
export function bacaRuteStruktur(path) {
  if (path === PATH_STRUKTUR) return { mode: 'daftar' }
  if (path === PATH_TAMBAH_PENGURUS) return { mode: 'tambah' }
  return null
}
