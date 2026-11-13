// Rute halaman Kelola Struktur Organisasi
export const PATH_STRUKTUR = '/admin/struktur'
export const PATH_TAMBAH_PENGURUS = '/admin/struktur/tambah'
export const pathUbahPengurus = (id) => `${PATH_STRUKTUR}/${id}/ubah`

export const PATH_TAMBAH_DEPARTMENT = '/admin/struktur/department/tambah'
export const pathUbahDepartment = (id) => `${PATH_STRUKTUR}/department/${id}/ubah`

// Baca mode dari path:
//   /admin/struktur            -> { mode: 'daftar' }
//   /admin/struktur/tambah     -> { mode: 'tambah' }
//   /admin/struktur/7/ubah     -> { mode: 'ubah', id: 7 }
//   /admin/struktur/department/tambah     -> { mode: 'tambahDept' }
//   /admin/struktur/department/3/ubah     -> { mode: 'ubahDept', id: 3 }
//   lainnya                    -> null
export function bacaRuteStruktur(path) {
  if (path === PATH_STRUKTUR) return { mode: 'daftar' }
  if (path === PATH_TAMBAH_PENGURUS) return { mode: 'tambah' }
  const cocok = /^\/admin\/struktur\/(\d+)\/ubah$/.exec(path)
  if (cocok) return { mode: 'ubah', id: Number(cocok[1]) }
  if (path === PATH_TAMBAH_DEPARTMENT) return { mode: 'tambahDept' }
  const dept = /^\/admin\/struktur\/department\/(\d+)\/ubah$/.exec(path)
  if (dept) return { mode: 'ubahDept', id: Number(dept[1]) }
  return null
}
