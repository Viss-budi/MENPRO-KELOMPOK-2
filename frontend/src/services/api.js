// Alamat backend. Ganti lewat frontend/.env -> VITE_API_URL
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

async function get(path, signal) {
  const res = await fetch(`${BASE_URL}${path}`, { signal })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Request gagal (${res.status})`)
  return json.data
}

export const getHeroSlides = (signal) => get('/hero-slides', signal)
export const getEvents = (limit = 3, signal) => get(`/events?limit=${limit}&featured=1`, signal)
export const getEventsByDate = (date, signal) => get(`/events?date=${date}`, signal)
export const getCalendar = (year, month, signal) => get(`/calendar?year=${year}&month=${month}`, signal)
export const getNews = (perPage = 3, signal) => get(`/news?per_page=${perPage}`, signal)
export const getSettings = (signal) => get('/settings', signal)
