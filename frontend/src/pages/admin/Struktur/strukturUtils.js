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

// ── Pencarian dan filter daftar pengurus (dilakukan di browser; daftar admin memuat semua pengurus periode aktif) ──

// Huruf kecil tanpa tanda aksen dan tanda baca pembuka, supaya "Arif" cocok dengan "‘Arif" dan "Rifa'ah" dengan "rifaah".
export function normalisasiKata(teks) {
  return String(teks ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc'`"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const FILTER_INTI = 'inti'

// Nilai filter Department untuk satu pengurus: 'inti' (tanpa departemen) atau id departemen.
export function nilaiDepartment(item) {
  return item.department_id ? String(item.department_id) : FILTER_INTI
}

// Teks label kolom Department, juga dipakai sebagai bahan pencarian.
export function labelDepartment(item) {
  return item.department_id ? `Department ${item.department_name || ''}`.trim() : 'Pengurus Inti'
}

// Pilihan filter Department dari data yang ada: Semua, Pengurus Inti (bila ada), lalu tiap departemen.
export function opsiDepartment(items) {
  const opsi = [{ value: '', label: 'Semua' }]
  if (items.some((i) => !i.department_id)) opsi.push({ value: FILTER_INTI, label: 'Pengurus Inti' })
  const lihat = new Set()
  for (const i of items) {
    if (!i.department_id || lihat.has(i.department_id)) continue
    lihat.add(i.department_id)
    opsi.push({ value: String(i.department_id), label: i.department_name || `Department ${i.department_id}` })
  }
  return opsi
}

// q: kata pencarian (tiap kata harus ada di nama, jabatan, atau department) ; department: '' | 'inti' | id
export function saringPengurus(items, { q = '', department = '' } = {}) {
  const kata = normalisasiKata(q).split(' ').filter(Boolean)
  return items.filter((item) => {
    if (department && nilaiDepartment(item) !== department) return false
    if (kata.length === 0) return true
    const bahan = normalisasiKata(`${item.name} ${item.position} ${labelDepartment(item)}`)
    return kata.every((k) => bahan.includes(k))
  })
}
