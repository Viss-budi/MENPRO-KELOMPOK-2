import { useEffect, useRef } from 'react'

// Menutup popover/dropdown saat klik di luar atau menekan Esc.
// `refs` = satu ref atau daftar ref (mis. pemicu + panel yang dirender lewat portal).
// Hanya aktif selama `aktif` true. onTutup(dariEsc): dariEsc true bila ditutup dengan Esc
// (pemanggil biasanya mengembalikan fokus ke tombol pemicu).
export function useTutupLuar(refs, aktif, onTutup) {
  const tutupRef = useRef(onTutup)
  const refsRef = useRef(refs)

  useEffect(() => {
    tutupRef.current = onTutup
    refsRef.current = refs
  })

  useEffect(() => {
    if (!aktif) return undefined
    const daftar = () => [].concat(refsRef.current).filter(Boolean)
    function onDown(e) {
      if (daftar().some((r) => r.current?.contains(e.target))) return
      tutupRef.current(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        tutupRef.current(true)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [aktif])
}
