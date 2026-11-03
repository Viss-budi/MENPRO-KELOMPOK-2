// Aturan validasi form tambah pengurus (sesuai batas backend dan desain UI/UX).

export const MAKS_NAMA = 100
export const MAKS_JABATAN = 100
// Batas 2 MB mengikuti desain UI/UX (backend menerima sampai 5 MB).
export const MAKS_UKURAN_FOTO = 2 * 1024 * 1024
// Desain: "JPG / PNG". Backend juga menerima WEBP, tetapi desain tidak menyebutnya.
export const TIPE_FOTO = ['image/jpeg', 'image/png']

// Nama yang dipasang backend pada posisi inti yang belum diisi
export const NAMA_BELUM_DIISI = '(Belum diisi)'

export const PESAN = {
  namaKosong: 'Nama wajib diisi',
  namaPanjang: `Nama maksimal ${MAKS_NAMA} karakter`,
  jabatanKosong: 'Jabatan wajib diisi',
  jabatanPanjang: `Jabatan maksimal ${MAKS_JABATAN} karakter`,
  departmentKosong: 'Department wajib dipilih',
  fotoFormat: 'Format foto harus JPG atau PNG. Pilih foto lain.',
  fotoBesar: 'Ukuran foto melebihi 2 MB. Pilih foto lain.',
}

// Periksa file foto. Mengembalikan pesan error, atau '' bila lolos.
export function validasiFileFoto(file) {
  if (!TIPE_FOTO.includes(file.type)) return PESAN.fotoFormat
  if (file.size > MAKS_UKURAN_FOTO) return PESAN.fotoBesar
  return ''
}

// Periksa seluruh form sebelum dikirim (foto diperiksa terpisah saat dipilih).
// Mengembalikan { nama?, jabatan?, department? } (objek kosong = valid).
export function validasiPengurus({ nama, jabatan, departmentId }) {
  const errors = {}
  const n = nama.trim()
  if (!n) errors.nama = PESAN.namaKosong
  else if (n.length > MAKS_NAMA) errors.nama = PESAN.namaPanjang
  const j = jabatan.trim()
  if (!j) errors.jabatan = PESAN.jabatanKosong
  else if (j.length > MAKS_JABATAN) errors.jabatan = PESAN.jabatanPanjang
  if (!departmentId) errors.department = PESAN.departmentKosong
  return errors
}

// 188416 -> "184 KB"; 2411724 -> "2,3 MB"
export function formatUkuran(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
