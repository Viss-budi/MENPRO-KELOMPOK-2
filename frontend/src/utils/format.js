export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const pad = (n) => String(n).padStart(2, '0')

// "2026-10-12 08:00:00" atau "2026-10-12" -> { year, month, day, time }
export function parseDb(value) {
  const [datePart, timePart = ''] = String(value).split(/[ T]/)
  const [year, month, day] = datePart.split('-').map(Number)
  return { year, month, day, time: timePart.slice(0, 5) }
}

export function formatTanggal(value) {
  const { year, month, day } = parseDb(value)
  return `${pad(day)} ${BULAN[month - 1]} ${year}`
}

// "2026-10-12 08:00:00" -> "08.00"
export const formatJam = (value) => parseDb(value).time.replace(':', '.')

export const dateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`

export function todayParts() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}
