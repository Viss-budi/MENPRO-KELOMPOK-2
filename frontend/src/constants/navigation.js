import { ROUTES } from './routes'

// Menu navbar. Urutan sama dengan "Tautan Cepat" di Footer.
// href '#...' = bagian di halaman Home, href '/...' = halaman terpisah
// (halamannya dibuat belakangan, tautan sudah mengikuti ROUTES).
export const NAV_ITEMS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang', href: ROUTES.tentang },
  { label: 'Kegiatan', href: '#kegiatan' },
  { label: 'Kalender', href: '#kalender' },
  { label: 'Dokumentasi', href: ROUTES.dokumentasi },
  { label: 'Prestasi', href: ROUTES.prestasi },
]

export const NAV_CTA = { label: 'Hubungi Kami', href: '#kontak' }
