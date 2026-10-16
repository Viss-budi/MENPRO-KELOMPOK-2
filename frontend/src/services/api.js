// Alamat backend. Ganti lewat frontend/.env -> VITE_API_URL
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

// ── GET ──────────────────────────────────────────────────────────────────────
async function get(path, signal) {
  const res = await fetch(`${BASE_URL}${path}`, { signal })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request gagal (${res.status})`)
  return json.data
}

// ── POST ─────────────────────────────────────────────────────────────────────
// Menyertakan Content-Type dan X-Requested-With (wajib oleh middleware anti-CSRF BE).
async function post(path, body, signal) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.message || `Request gagal (${res.status})`)
    err.status = res.status
    throw err
  }
  return json
}

// ── Auth ─────────────────────────────────────────────────────────────────────
// Mengembalikan { token, user }. Seluruh parsing ada di sini; komponen tidak
// boleh membaca respons mentah.
// Pemetaan error:
//   400, 401, 429 → tampilkan message dari server
//   5xx / gagal jaringan → "Login gagal, silakan coba lagi beberapa saat"
export async function loginAdmin(email, password, signal) {
  const PESAN_JARINGAN = 'Login gagal, silakan coba lagi beberapa saat'
  let res
  try {
    res = await post('/auth/login', { email, password }, signal)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    // Gagal jaringan (fetch melempar sebelum dapat respons) atau 5xx
    const status = err.status ?? 0
    if (status >= 400 && status < 500) {
      // 400, 401, 429 – pesan dari server sudah ada di err.message
      throw err
    }
    // 500 ke atas atau tidak ada koneksi sama sekali
    throw new Error(PESAN_JARINGAN)
  }
  const { token, user } = res.data ?? {}
  return { token, user }
}

// ── Endpoint publik ───────────────────────────────────────────────────────────
export const getHeroSlides = (signal) => get('/hero-slides', signal)
export const getEvents = (limit = 3, signal) => get(`/events?limit=${limit}&featured=1`, signal)
export const getEventsByDate = (date, signal) => get(`/events?date=${date}`, signal)
export const getCalendar = (year, month, signal) => get(`/calendar?year=${year}&month=${month}`, signal)
export const getNews = (perPage = 3, signal) => get(`/news?per_page=${perPage}`, signal)
export const getSettings = (signal) => get('/settings', signal)
