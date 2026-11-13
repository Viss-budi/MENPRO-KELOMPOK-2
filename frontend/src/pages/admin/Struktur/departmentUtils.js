// Aturan validasi form tambah/ubah department (batas mengikuti backend: utils/validators/department.js).

export const MAKS_NAMA_DEPARTMENT = 75
export const MAKS_DESKRIPSI = 500
export const MAKS_URUTAN = 1000000
export const MAKS_UKURAN_LOGO = 2 * 1024 * 1024
// Backend menerima JPG, PNG, dan WEBP (kontrak 5.7). SVG ditolak oleh endpoint upload.
export const TIPE_LOGO = ['image/jpeg', 'image/png', 'image/webp']

export const PESAN_DEPT = {
  namaKosong: 'Nama department wajib diisi',
  namaPanjang: `Nama maksimal ${MAKS_NAMA_DEPARTMENT} karakter`,
  deskripsiPanjang: `Deskripsi maksimal ${MAKS_DESKRIPSI} karakter`,
  urutanKosong: 'Urutan tampil wajib diisi',
  urutanSalah: 'Urutan tampil harus berupa bilangan bulat',
  logoFormat: 'Format file harus PNG, JPG, atau WEBP. Pilih file lain.',
  logoBesar: 'Ukuran file melebihi 2 MB. Pilih file lain.',
}

// Mengembalikan pesan error, atau '' bila lolos.
export function validasiFileLogo(file) {
  if (!TIPE_LOGO.includes(file.type)) return PESAN_DEPT.logoFormat
  if (file.size > MAKS_UKURAN_LOGO) return PESAN_DEPT.logoBesar
  return ''
}

// Mengembalikan { nama?, deskripsi?, urutan? } (objek kosong = valid).
// `awal` (mode ubah): nilai lama; data lama yang melebihi batas tidak dipersoalkan selama tidak diubah.
export function validasiDepartment({ nama, deskripsi, urutan, awal }) {
  const errors = {}
  const n = nama.trim()
  if (!n) errors.nama = PESAN_DEPT.namaKosong
  else if (n.length > MAKS_NAMA_DEPARTMENT && n !== awal?.name) errors.nama = PESAN_DEPT.namaPanjang
  const d = deskripsi.trim()
  if (d.length > MAKS_DESKRIPSI && d !== (awal?.description ?? '')) errors.deskripsi = PESAN_DEPT.deskripsiPanjang
  const u = String(urutan).trim()
  if (!u) errors.urutan = PESAN_DEPT.urutanKosong
  else if (!/^\d+$/.test(u) || Number(u) > MAKS_URUTAN) errors.urutan = PESAN_DEPT.urutanSalah
  return errors
}

// "/uploads/leade-icon.png" atau "https://.../v1/leade-icon.png?x=1" -> "leade-icon.png"
export function namaFileDariUrl(url) {
  try {
    const bersih = String(url).split(/[?#]/)[0]
    return decodeURIComponent(bersih.split('/').filter(Boolean).pop() || '')
  } catch {
    return ''
  }
}
