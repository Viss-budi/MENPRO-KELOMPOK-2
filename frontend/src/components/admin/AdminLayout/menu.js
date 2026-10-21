import {
  Calendar,
  CalendarCheck,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Newspaper,
  SlidersVertical,
  Trophy,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { ROUTES } from '../../../constants/routes'

// Menu samping admin (sesuai desain UI/UX). Dipakai juga oleh App.jsx untuk memetakan URL.
// roles : kosong = admin dan editor; ['admin'] = hanya admin (kontrak bagian 6).
// Halaman kelola selain Dashboard belum dibuat; sementara memakai halaman "sedang disiapkan".
export const MENU = [
  { key: 'dashboard', label: 'Dashboard', path: ROUTES.admin, icon: LayoutDashboard, group: 'utama' },
  { key: 'kegiatan', label: 'Kegiatan', path: `${ROUTES.admin}/kegiatan`, icon: CalendarCheck, group: 'utama' },
  { key: 'berita', label: 'Berita', path: `${ROUTES.admin}/berita`, icon: Newspaper, group: 'utama' },
  { key: 'kalender', label: 'Kalender', path: `${ROUTES.admin}/kalender`, icon: Calendar, group: 'utama' },
  { key: 'dokumentasi', label: 'Dokumentasi', path: `${ROUTES.admin}/dokumentasi`, icon: ImageIcon, group: 'utama' },
  { key: 'prestasi', label: 'Prestasi', path: `${ROUTES.admin}/prestasi`, icon: Trophy, group: 'utama' },
  { key: 'struktur', label: 'Tentang & Struktur', path: `${ROUTES.admin}/struktur`, icon: Users, group: 'utama', roles: ['admin'] },
  { key: 'pesan', label: 'Pesan Masuk', path: `${ROUTES.admin}/pesan`, icon: Mail, group: 'utama' },
  { key: 'pengguna', label: 'Pengguna', path: `${ROUTES.admin}/pengguna`, icon: UserRoundCheck, group: 'sistem', roles: ['admin'] },
  { key: 'pengaturan', label: 'Pengaturan', path: `${ROUTES.admin}/pengaturan`, icon: SlidersVertical, group: 'sistem', roles: ['admin'] },
]

export const GRUP_MENU = [
  { key: 'utama', label: 'Menu Utama' },
  { key: 'sistem', label: 'Sistem' },
]

export function cariMenu(path) {
  return MENU.find((item) => item.path === path) ?? null
}

export function bolehAkses(item, role) {
  return !item.roles || item.roles.includes(role)
}
