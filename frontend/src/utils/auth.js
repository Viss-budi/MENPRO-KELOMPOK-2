// Utilitas autentikasi berbasis localStorage + JWT.
// JANGAN cetak token atau password ke console.

const TOKEN_KEY = 'himafor_token'
const USER_KEY = 'himafor_user'

// ── Token ─────────────────────────────────────────────────────────────────────

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// Simpan token dan data user setelah login berhasil.
export function setSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // localStorage mungkin penuh atau dinonaktifkan; biarkan sesi tetap di memori
  }
}

// Hapus sesi: dipanggil saat logout maupun sesi berakhir.
export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // Abaikan; tidak ada yang perlu dibersihkan
  }
}

// Kembalikan data user yang tersimpan, atau null bila tidak ada / rusak.
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ── JWT ───────────────────────────────────────────────────────────────────────

// Baca payload JWT dari bagian tengah token (index 1).
// Kembalikan null bila token kosong, tidak berformat 3 bagian, atau payload rusak.
function parseJwtPayload(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // atob hanya terima Base64 standar; JWT memakai Base64URL → ganti - dan _
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

// Kembalikan true jika token tidak ada, tidak dapat dibaca, atau sudah melewati exp.
// Token rusak dianggap kedaluwarsa (fail-safe).
export function isTokenExpired(token) {
  const payload = parseJwtPayload(token ?? getToken())
  if (!payload || typeof payload.exp !== 'number') return true
  // exp dalam detik epoch; Date.now() dalam milidetik
  return Date.now() >= payload.exp * 1000
}
