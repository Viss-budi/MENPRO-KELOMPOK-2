// Klik biasa dialihkan ke navigasi internal (router manual di App.jsx);
// Ctrl/Cmd/Shift/Alt atau klik tengah tetap dibuka browser (tab baru, dsb).
export function klikBiasa(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}
