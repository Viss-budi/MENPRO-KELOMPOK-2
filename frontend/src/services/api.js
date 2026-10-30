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
// - body berupa FormData (upload) dikirim apa adanya; Content-Type diatur browser (kontrak 7.1).
async function request(method, path, { body, signal, admin = false } = {}) {
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

  if (res.status === 503 && !admin) {
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
// Mengembalikan { items, meta: { page, per_page, total, total_pages } }
export async function getAdminNews({ page = 1, perPage = 10 } = {}, signal) {
  const json = await request('GET', `/news/admin/all?page=${page}&per_page=${perPage}`, {
    signal,
    admin: true,
  })
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

// ── Endpoint publik ───────────────────────────────────────────────────────────
export const getHeroSlides = (signal) => get('/hero-slides', signal)
export const getEvents = (limit = 3, signal) => get(`/events?limit=${limit}&featured=1`, signal)
export const getEventsByDate = (date, signal) => get(`/events?date=${date}`, signal)
export const getCalendar = (year, month, signal) => get(`/calendar?year=${year}&month=${month}`, signal)
export const getNews = (perPage = 3, signal) => get(`/news?per_page=${perPage}`, signal)
export const getSettings = (signal) => get('/settings', signal)
