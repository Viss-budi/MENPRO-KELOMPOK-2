// Aturan form berita. Batas panjang mengikuti kontrak API v1.2 bagian 5.4.
export const MAKS_JUDUL = 250
export const MAKS_RINGKASAN = 300
// Batas 2 MB mengikuti teks desain UI/UX (backend sendiri menerima sampai 5 MB).
export const MAKS_UKURAN_GAMBAR = 2 * 1024 * 1024
export const TIPE_GAMBAR = ['image/jpeg', 'image/png', 'image/webp']

export const PESAN = {
  judulKosong: 'Judul wajib diisi',
  judulPanjang: `Judul maksimal ${MAKS_JUDUL} karakter`,
  isiKosong: 'Isi berita wajib diisi',
  gambarKosong: 'Gambar wajib dipilih',
  gambarFormat: 'Format gambar harus PNG, JPG, atau WEBP',
  gambarBesar: 'Ukuran gambar maksimal 2 MB',
}

// Periksa file yang baru dipilih. Mengembalikan teks error, atau '' bila lolos.
export function validasiFileGambar(file) {
  if (!TIPE_GAMBAR.includes(file.type)) return PESAN.gambarFormat
  if (file.size > MAKS_UKURAN_GAMBAR) return PESAN.gambarBesar
  return ''
}

// Periksa seluruh form sebelum dikirim. Mengembalikan { judul?, isi?, gambar? } (objek kosong = valid).
export function validasiBerita({ judul, isi, gambar }) {
  const errors = {}
  const j = judul.trim()
  if (!j) errors.judul = PESAN.judulKosong
  else if (j.length > MAKS_JUDUL) errors.judul = PESAN.judulPanjang
  if (!isi.trim()) errors.isi = PESAN.isiKosong
  if (!gambar) errors.gambar = PESAN.gambarKosong
  return errors
}

// Form tidak punya kolom ringkasan, jadi excerpt dibuat dari isi berita (maks 300 karakter, kontrak 5.4).
export function ringkas(isi) {
  const bersih = String(isi)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (bersih.length <= MAKS_RINGKASAN) return bersih
  return `${bersih.slice(0, MAKS_RINGKASAN - 1).trimEnd()}…`
}

// 188416 -> "184 KB"; 2411724 -> "2,3 MB"
export function formatUkuran(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

// "http://host/uploads/1790843132424.png" -> "1790843132424.png"
export function namaFile(url) {
  const bagian = String(url ?? '').split('?')[0].split('/').pop() || ''
  try {
    return decodeURIComponent(bagian)
  } catch {
    return bagian
  }
}
