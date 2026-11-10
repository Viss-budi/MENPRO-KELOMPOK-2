import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Funnel, Search, X } from 'lucide-react'
import { useTutupLuar } from '../../../hooks/useTutupLuar'
import styles from './AlatTabel.module.css'

// Ikon cari dan filter di kepala tabel (desain "01 Daftar default"), dipakai tabel Berita dan Struktur.
// Komponen ini dikendalikan induk: ia hanya menampilkan dan melaporkan perubahan.
//
//   variant    : 'header' = ikon di kepala tabel (layar lebar) ; 'bar' = baris alat di atas tabel (HP)
//   label      : nama tabel untuk pembaca layar, mis. "pengurus"
//   placeholder: teks kolom cari
//   query / onQuery     : kata pencarian
//   grup       : [{ key, label, opsi: [{ value, label }] }]  (value '' = semua)
//   nilai      : { [key]: value }
//   onUbah     : (key, value) => void ; onReset : () => void
function AlatTabel({ variant = 'header', label, placeholder, query, onQuery, grup = [], nilai = {}, onUbah, onReset }) {
  const id = useId()
  const [cariDibuka, setCariDibuka] = useState(false)
  const [filterDibuka, setFilterDibuka] = useState(false)
  const [posisi, setPosisi] = useState(null)
  const inputRef = useRef(null)
  const tombolCariRef = useRef(null)
  const tombolFilterRef = useRef(null)
  const panelRef = useRef(null)

  // Kolom cari tetap terbuka selama ada kata pencarian, supaya tidak ada pencarian "tersembunyi".
  const cariTerbuka = cariDibuka || query !== ''
  const jumlahFilter = grup.filter((g) => (nilai[g.key] ?? '') !== '').length

  function klikCari() {
    if (cariTerbuka) {
      onQuery('')
      setCariDibuka(false)
      return
    }
    setCariDibuka(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function tutupCari() {
    onQuery('')
    setCariDibuka(false)
    tombolCariRef.current?.focus()
  }

  function onKeyInput(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      tutupCari()
    }
  }

  // Panel filter dirender di <body> (portal) karena kartu tabel memotong isi yang meluber.
  const hitungPosisi = useCallback(() => {
    const el = tombolFilterRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPosisi({ top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) })
  }, [])

  useLayoutEffect(() => {
    if (!filterDibuka) return undefined
    hitungPosisi()
    window.addEventListener('resize', hitungPosisi)
    window.addEventListener('scroll', hitungPosisi, true)
    return () => {
      window.removeEventListener('resize', hitungPosisi)
      window.removeEventListener('scroll', hitungPosisi, true)
    }
  }, [filterDibuka, hitungPosisi])

  useTutupLuar([tombolFilterRef, panelRef], filterDibuka, (dariEsc) => {
    setFilterDibuka(false)
    if (dariEsc) tombolFilterRef.current?.focus()
  })

  const adaFilter = grup.length > 0

  return (
    <div className={`${styles.alat} ${variant === 'bar' ? styles.bar : styles.header}`}>
      <div className={`${styles.cari} ${cariTerbuka ? styles.cariBuka : ''}`} data-cari-buka={cariTerbuka || undefined}>
        <Search size={16} strokeWidth={2} aria-hidden="true" className={styles.cariIkon} />
        <input
          ref={inputRef}
          id={`${id}-cari`}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          className={styles.input}
          placeholder={placeholder}
          aria-label={`Cari ${label}`}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={onKeyInput}
          tabIndex={cariTerbuka ? 0 : -1}
        />
        {query !== '' && (
          <button
            type="button"
            className={styles.hapusKata}
            aria-label="Hapus kata pencarian"
            onClick={() => {
              onQuery('')
              inputRef.current?.focus()
            }}
          >
            <X size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        ref={tombolCariRef}
        type="button"
        className={`${styles.ikon} ${cariTerbuka ? styles.ikonAktif : ''}`}
        aria-label={cariTerbuka ? `Tutup pencarian ${label}` : `Cari ${label}`}
        aria-expanded={cariTerbuka}
        aria-controls={`${id}-cari`}
        title="Cari"
        onClick={klikCari}
      >
        <Search size={20} strokeWidth={2.4} aria-hidden="true" />
      </button>

      {adaFilter && (
        <>
          <button
            ref={tombolFilterRef}
            type="button"
            className={`${styles.ikon} ${jumlahFilter > 0 || filterDibuka ? styles.ikonAktif : ''}`}
            aria-label={jumlahFilter > 0 ? `Filter ${label}, ${jumlahFilter} aktif` : `Filter ${label}`}
            aria-haspopup="dialog"
            aria-expanded={filterDibuka}
            aria-controls={filterDibuka ? `${id}-filter` : undefined}
            title="Filter"
            onClick={() => setFilterDibuka((v) => !v)}
          >
            <Funnel size={20} strokeWidth={2.4} aria-hidden="true" />
            {jumlahFilter > 0 && <span className={styles.titik} aria-hidden="true" />}
          </button>

          {filterDibuka &&
            createPortal(
              <div
                ref={panelRef}
                id={`${id}-filter`}
                role="dialog"
                aria-label={`Filter ${label}`}
                className={styles.panel}
                style={posisi ? { top: posisi.top, right: posisi.right } : { visibility: 'hidden' }}
              >
                {grup.map((g) => {
                  const terpilih = nilai[g.key] ?? ''
                  return (
                    <fieldset key={g.key} className={styles.grup}>
                      <legend className={styles.grupJudul}>{g.label}</legend>
                      <div className={styles.opsi}>
                        {g.opsi.map((o) => {
                          const aktif = terpilih === o.value
                          return (
                            <button
                              key={o.value || 'semua'}
                              type="button"
                              className={`${styles.chip} ${aktif ? styles.chipAktif : ''}`}
                              aria-pressed={aktif}
                              onClick={() => onUbah(g.key, o.value)}
                            >
                              {aktif && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                              {o.label}
                            </button>
                          )
                        })}
                      </div>
                    </fieldset>
                  )
                })}
                <div className={styles.kaki}>
                  <button type="button" className={styles.reset} onClick={onReset} disabled={jumlahFilter === 0}>
                    Reset filter
                  </button>
                  <button type="button" className={styles.selesai} onClick={() => setFilterDibuka(false)}>
                    Selesai
                  </button>
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  )
}

// Label filter yang sedang aktif, ditampilkan di bawah tabel/atas daftar agar pengguna tahu
// kenapa hasilnya lebih sedikit. Tiap chip bisa dilepas satu per satu.
export function ChipFilterAktif({ grup, nilai, onUbah, onReset }) {
  const aktif = grup
    .map((g) => ({ g, o: g.opsi.find((x) => x.value === (nilai[g.key] ?? '')) }))
    .filter(({ o }) => o && o.value !== '')
  if (aktif.length === 0) return null
  return (
    <ul className={styles.chipDaftar} aria-label="Filter aktif">
      {aktif.map(({ g, o }) => (
        <li key={g.key}>
          <span className={styles.chipAktifLabel}>
            {g.label}: <strong>{o.label}</strong>
            <button
              type="button"
              className={styles.chipLepas}
              aria-label={`Hapus filter ${g.label}: ${o.label}`}
              onClick={() => onUbah(g.key, '')}
            >
              <X size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
      {aktif.length > 1 && (
        <li>
          <button type="button" className={styles.resetTeks} onClick={onReset}>
            Reset semua
          </button>
        </li>
      )}
    </ul>
  )
}

export default AlatTabel
