import { NAV_CTA } from './navigation'

// Nama event yang dikirim api.js saat backend membalas 503 (mode pemeliharaan).
export const MAINTENANCE_EVENT = 'himafor:maintenance'

// Isi halaman error publik, sesuai desain UI/UX (himafor-error-publik).
// icon   : nama ikon (dipetakan di ErrorPage.jsx)
// rings  : 1 = satu lingkaran halo, 2 = dua lingkaran (halaman tanpa kode angka)
// action : 'reload' memuat ulang halaman, 'retry' memanggil onRetry dari induk
export const ERROR_PAGES = {
  404: {
    code: '404',
    icon: 'compass',
    rings: 1,
    title: 'Halaman tidak ditemukan',
    description: 'Halaman yang Anda cari tidak ada atau sudah dipindahkan. Periksa kembali alamat yang dimasukkan.',
    actions: [
      { label: 'Kembali ke Beranda', href: '/', variant: 'primary' },
      { label: 'Lihat Kegiatan', href: '/#kegiatan', variant: 'outline' },
    ],
  },
  500: {
    code: '500',
    icon: 'server',
    rings: 1,
    live: true,
    title: 'Terjadi kesalahan pada server',
    description: 'Maaf, terjadi gangguan saat memproses permintaan Anda. Silakan coba lagi beberapa saat.',
    actions: [
      { label: 'Muat Ulang', action: 'reload', icon: 'refresh', variant: 'primary' },
      { label: 'Kembali ke Beranda', href: '/', variant: 'outline' },
    ],
  },
  maintenance: {
    icon: 'wrench',
    rings: 2,
    live: true,
    title: 'Website sedang dalam pemeliharaan',
    description: 'Kami sedang melakukan pembaruan agar layanan lebih baik. Silakan kembali beberapa saat lagi.',
    actions: [
      { label: NAV_CTA.label, href: NAV_CTA.href, icon: 'mail', variant: 'outline' },
    ],
  },
  offline: {
    icon: 'wifiOff',
    rings: 2,
    live: true,
    title: 'Tidak ada koneksi internet',
    description: 'Periksa jaringan Anda lalu coba lagi.',
    actions: [
      { label: 'Coba Lagi', action: 'retry', busyLabel: 'Memeriksa...', icon: 'refresh', variant: 'primary' },
    ],
  },
}
