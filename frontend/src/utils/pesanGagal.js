// Pesan gagal yang ditampilkan ke pengguna, mengikuti kontrak API bagian 7.3:
//   400, 401, 403, 404, 409, 413, 429 -> tampilkan message dari server
//   503 (fitur belum siap)            -> pesan "sedang disiapkan", bukan error mentah
//   500 / jaringan / lainnya          -> pesan umum dari pemanggil
const TAMPILKAN_DARI_SERVER = [400, 401, 403, 404, 409, 413, 429]

export function pesanGagal(err, pesanUmum) {
  const status = err?.status
  if (status === 503) return 'Fitur ini sedang disiapkan. Silakan hubungi tim backend.'
  if (TAMPILKAN_DARI_SERVER.includes(status) && err.message) return err.message
  return pesanUmum
}
