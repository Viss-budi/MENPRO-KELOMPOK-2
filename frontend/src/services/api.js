import { MAINTENANCE_EVENT } from '../constants/errorPages'
import { SESI_BERAKHIR_EVENT } from '../constants/auth'

// Alamat API. Pakai alamat relatif (/api/v1): cookie login hanya berlaku di origin yang sama,
// dan saat development Vite meneruskan /api ke backend (lihat vite.config.js).
// Jangan isi VITE_API_URL dengan http://localhost:5000, cookie sesi tidak akan terkirim.
const BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

// ── Pemanggil dasar ──────────────────────────────────────────────────────────
// - Sesi memakai cookie HttpOnly: dikirim otomatis, tidak ada token di sisi frontend.
// - POST/PUT/DELETE wajib header X-Requested-With (kontrak 1.1 dan 7.1).
// - admin: true = endpoint dashboard; 401 berarti sesi habis -> kirim SESI_BERAKHIR_EVENT.
// - Publik: 503 berarti pemeliharaan -> kirim MAINTENANCE_EVENT.
// - senyap: true = jangan kirim MAINTENANCE_EVENT (untuk fitur kecil seperti form kontak; errornya ditangani pemanggil).
// - body berupa FormData (upload) dikirim apa adanya; Content-Type diatur browser (kontrak 7.1).
async function request(method, path, { body, signal, admin = false, senyap = false } = {}) {
  const headers = {}
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (method !== 'GET') headers['X-Requested-With'] = 'himafor'
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))

  if (res.status === 503 && !admin && !senyap) {
    window.dispatchEvent(
      new CustomEvent(MAINTENANCE_EVENT, { detail: { estimatedEnd: json.estimated_end ?? null } })
    )
  }
  if (res.status === 401 && admin) {
    window.dispatchEvent(new CustomEvent(SESI_BERAKHIR_EVENT))
  }
  if (!res.ok) {
    const err = new Error(json.message || `Request gagal (${res.status})`)
    err.status = res.status
    // Validasi per field (berita, anggota, departemen): [{ field, message }] — kontrak 1.2 dan 7.3
    err.errors = Array.isArray(json.errors) ? json.errors : []
    throw err
  }
  return json
}

const get = async (path, signal) => (await request('GET', path, { signal })).data

// ── Auth ─────────────────────────────────────────────────────────────────────
// Mengembalikan data user { id, name, email, role }. Token TIDAK ada di respons;
// server memasang cookie himafor_token (HttpOnly).
// Pemetaan error:
//   400, 401, 403, 429 -> tampilkan message dari server
//   5xx / gagal jaringan -> "Login gagal, silakan coba lagi beberapa saat"
export async function loginAdmin(email, password, signal) {
  const PESAN_JARINGAN = 'Login gagal, silakan coba lagi beberapa saat'
  let json
  try {
    json = await request('POST', '/auth/login', { body: { email, password }, signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    const status = err.status ?? 0
    if (status >= 400 && status < 500) throw err
    throw new Error(PESAN_JARINGAN)
  }
  const user = json.data?.user
  if (!user) throw new Error(PESAN_JARINGAN)
  return user
}

// Cek sesi saat aplikasi dibuka/di-refresh. null = belum login atau sesi habis (401).
// Error lain (jaringan, 5xx) dilempar supaya pemanggil tidak salah mengira pengguna sudah keluar.
export async function getMe(signal) {
  try {
    const json = await request('GET', '/auth/me', { signal })
    return json.data?.user ?? null
  } catch (err) {
    if (err.status === 401) return null
    throw err
  }
}

// Kontrak 4.2: selalu 200. Kegagalan jaringan diabaikan; sesi lokal tetap dibersihkan pemanggil.
export async function logoutAdmin() {
  try {
    await request('POST', '/auth/logout')
  } catch {
    // Abaikan
  }
}

// ── Dashboard admin ──────────────────────────────────────────────────────────
// Kontrak 5.1: { events, news, members } masing-masing { total, active }
export async function getAdminSummary(signal) {
  const json = await request('GET', '/admin/summary', { signal, admin: true })
  return json.data ?? {}
}

// ── Kelola berita (kontrak 5.2 dan 5.4) ──────────────────────────────────────
// Daftar berpaginasi, termasuk berita yang belum dipublikasikan.
// Pencarian dan filter dilakukan server (kontrak 5.2.1):
//   q            -> kata kunci (maks 100 karakter), dicari di judul dan ringkasan
//   category     -> Berita | Kegiatan | Prestasi | Pengumuman
//   isPublished  -> 1 (terbit) | 0 (draf)
// Mengembalikan { items, meta: { page, per_page, total, total_pages } }
export async function getAdminNews({ page = 1, perPage = 10, q = '', category = '', isPublished = '' } = {}, signal) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  const kata = String(q).trim().slice(0, 100)
  if (kata) params.set('q', kata)
  if (category) params.set('category', category)
  if (isPublished !== '' && isPublished != null) params.set('is_published', String(isPublished))
  const json = await request('GET', `/news/admin/all?${params}`, { signal, admin: true })
  return { items: json.data ?? [], meta: json.meta ?? {} }
}

// Satu berita lengkap untuk mengisi form edit (termasuk content).
export async function getAdminNewsById(id, signal) {
  const json = await request('GET', `/news/admin/${id}`, { signal, admin: true })
  return json.data
}

// POST /news -> 201 { data: { id, slug } }
export async function createNews(body, signal) {
  const json = await request('POST', '/news', { body, signal, admin: true })
  return json.data
}

// PUT /news/:id -> 200. Hanya field yang dikirim yang berubah.
export async function updateNews(id, body, signal) {
  await request('PUT', `/news/${id}`, { body, signal, admin: true })
}

// DELETE /news/:id -> 200 (404 bila sudah terhapus)
export async function deleteNews(id, signal) {
  await request('DELETE', `/news/${id}`, { signal, admin: true })
}

// ── Upload gambar (kontrak 5.7) ──────────────────────────────────────────────
// multipart/form-data, field "image". Mengembalikan URL yang dimasukkan ke cover_url dsb.
export async function uploadImage(file, signal) {
  const form = new FormData()
  form.append('image', file)
  const json = await request('POST', '/upload', { body: form, signal, admin: true })
  const url = json.data?.url
  if (!url) throw new Error('Upload gagal, silakan coba lagi')
  return url
}

// ── Kelola struktur organisasi (anggota, departemen, periode) ───────────────
// Khusus admin (403 jika editor).
// GET /periods -> { active, periods } (publik). active = periode yang tampil di website.
export async function getPeriods(signal) {
  const json = await request('GET', '/periods', { signal })
  return { active: json.data?.active ?? null, periods: json.data?.periods ?? [] }
}

// Daftar pengurus periode aktif untuk halaman admin.
// GET /members/admin/all?period=&per_page=100 -> { items, meta }
// Mengembalikan { period, items }. period null = belum ada periode aktif.
export async function getAdminStruktur(signal) {
  const { active } = await getPeriods(signal)
  if (!active) return { period: null, items: [] }
  const q = new URLSearchParams({ period: active, per_page: '100' })
  const json = await request('GET', `/members/admin/all?${q}`, { signal, admin: true })
  return { period: active, items: json.data ?? [] }
}

// Pencarian pengurus untuk kolom "Cari di admin" (kontrak 5.2.1: q dicari di nama, jabatan, nama departemen).
// Khusus admin. Mengembalikan data[] (maks `batas` pengurus) pada periode aktif.
export async function cariPengurus(q, batas = 5, signal) {
  const { active } = await getPeriods(signal)
  const params = new URLSearchParams({ per_page: String(batas), q: String(q).trim().slice(0, 100) })
  if (active) params.set('period', active)
  const json = await request('GET', `/members/admin/all?${params}`, { signal, admin: true })
  return json.data ?? []
}

// Departemen aktif pada satu periode, untuk pilihan dropdown di form.
// GET /departments/admin/all?period=&is_active=1&per_page=100 -> data[]
export async function getAdminDepartments(period, signal) {
  const q = new URLSearchParams({ period, is_active: '1', per_page: '100' })
  const json = await request('GET', `/departments/admin/all?${q}`, { signal, admin: true })
  return json.data ?? []
}

// POST /members -> 201 { data: { id } }
// body: { name, position, department_id, photo_url, period, is_active }
export async function createMember(body, signal) {
  const json = await request('POST', '/members', { body, signal, admin: true })
  return json.data
}

// GET /members/admin/:id -> satu pengurus lengkap untuk mengisi form ubah
// { id, name, position, period, group_name, department_id, department_name, photo_url, sort_order, is_active, is_core }
export async function getAdminMember(id, signal) {
  const json = await request('GET', `/members/admin/${id}`, { signal, admin: true })
  return json.data
}

// PUT /members/:id -> 200. Hanya field yang dikirim yang berubah.
// Posisi utama BPH (is_core = 1) hanya boleh mengubah name, photo_url, is_active; selain itu 409.
export async function updateMember(id, body, signal) {
  await request('PUT', `/members/${id}`, { body, signal, admin: true })
}

// DELETE /members/:id -> 200 (404 bila sudah terhapus, 409 untuk posisi utama BPH)
export async function deleteMember(id, signal) {
  await request('DELETE', `/members/${id}`, { signal, admin: true })
}

// ── Endpoint publik ───────────────────────────────────────────────────────────
export const getHeroSlides = (signal) => get('/hero-slides', signal)
export const getEvents = (limit = 3, signal) => get(`/events?limit=${limit}&featured=1`, signal)
export const getEventsByDate = (date, signal) => get(`/events?date=${date}`, signal)
export const getCalendar = (year, month, signal) => get(`/calendar?year=${year}&month=${month}`, signal)
export const getNews = (perPage = 3, signal) => get(`/news?per_page=${perPage}`, signal)
export const getSettings = (signal) => get('/settings', signal)

// Bahan pencarian di navbar. Kontrak belum punya endpoint pencarian, jadi data diambil
// sekali lalu disaring di browser (maks 50 per jenis, batas limit dan per_page di kontrak 2.1 dan 2.4).
export const getAllEvents = (signal) => get('/events?limit=50', signal)
export const getAllNews = (signal) => get('/news?per_page=50', signal)

// Form Hubungi Kami. POST /contact masih RENCANA di kontrak (bagian 10.2), backend belum ada.
// Isi body (name, email, subject, message) adalah usulan frontend; sesuaikan bila kontraknya sudah final.
// Selama backend belum siap, isi VITE_CONTACT_MOCK=1 di .env.local untuk mensimulasikan pengiriman berhasil.
export async function kirimPesan(body, signal) {
  if (import.meta.env.VITE_CONTACT_MOCK === '1') {
    await new Promise((resolve) => setTimeout(resolve, 900))
    return { id: 0 }
  }
  const json = await request('POST', '/contact', { body, signal, senyap: true })
  return json.data
}
// GET /structure?period= -> { period, inti: [{ group, members }], departments }
// Tanpa period = periode aktif. Hanya pengurus is_active=1 (publik).
export const getStructure = (period, signal) =>
  get(`/structure${period ? `?period=${encodeURIComponent(period)}` : ''}`, signal)
// GET /members?period= -> data[] (publik, hanya is_active=1): { id, name, position, group_name, department_id, photo_url, period }
export const getMembers = (period, signal) =>
  get(`/members${period ? `?period=${encodeURIComponent(period)}` : ''}`, signal)
// GET /departments/:slug?period= -> { department, members }
export const getDepartment = (slug, period, signal) =>
  get(`/departments/${encodeURIComponent(slug)}${period ? `?period=${encodeURIComponent(period)}` : ''}`, signal)
