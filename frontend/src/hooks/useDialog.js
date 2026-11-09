import { useCallback, useEffect, useRef, useState } from 'react'

const FOKUSABEL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const kurangiGerak = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Menutup dialog dengan animasi keluar dulu. `menutup` dipakai untuk data-state di CSS,
// `onTutup` dipanggil setelah animasi selesai (langsung bila pengguna memilih kurangi gerak).
export function useTutupBerAnimasi(onTutup, durasi = 200) {
  const [menutup, setMenutup] = useState(false)
  const timer = useRef(null)
  const onTutupRef = useRef(onTutup)

  useEffect(() => {
    onTutupRef.current = onTutup
  })
  useEffect(() => () => clearTimeout(timer.current), [])

  const tutup = useCallback(() => {
    if (timer.current) return
    setMenutup(true)
    timer.current = setTimeout(() => onTutupRef.current(), kurangiGerak() ? 0 : durasi)
  }, [durasi])

  return { menutup, tutup }
}

// Perilaku dialog modal: kunci scroll halaman, Esc menutup, Tab berputar di dalam dialog,
// fokus awal ke elemen [data-fokus-awal] (atau elemen pertama), dan fokus kembali ke pemicu saat ditutup.
export function useDialogModal(ref, onEscape) {
  const escapeRef = useRef(onEscape)

  useEffect(() => {
    escapeRef.current = onEscape
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const pemicu = document.activeElement

    const lebarScrollbar = window.innerWidth - document.documentElement.clientWidth
    const { overflow, paddingRight } = document.body.style
    document.body.style.overflow = 'hidden'
    if (lebarScrollbar > 0) document.body.style.paddingRight = `${lebarScrollbar}px`

    const awal = el.querySelector('[data-fokus-awal]') || el.querySelector(FOKUSABEL)
    awal?.focus({ preventScroll: true })

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        escapeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const daftar = [...el.querySelectorAll(FOKUSABEL)].filter((n) => n.offsetParent !== null)
      if (daftar.length === 0) return
      const pertama = daftar[0]
      const terakhir = daftar[daftar.length - 1]
      if (e.shiftKey && (document.activeElement === pertama || !el.contains(document.activeElement))) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && (document.activeElement === terakhir || !el.contains(document.activeElement))) {
        e.preventDefault()
        pertama.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      if (pemicu && document.contains(pemicu)) pemicu.focus({ preventScroll: true })
    }
  }, [ref])
}
