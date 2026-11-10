import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, FileSearch, LoaderCircle, Newspaper, Plus, Search, User, X } from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { useDebounce } from '../../../hooks/useDebounce'
import { useTutupLuar } from '../../../hooks/useTutupLuar'
import { cariPengurus, getAdminNews } from '../../../services/api'
import { formatTanggalSingkat } from '../../../utils/format'
import { PATH_TAMBAH_BERITA, pathUbahBerita } from '../../../pages/admin/Berita/rute'
import { PATH_STRUKTUR, PATH_TAMBAH_PENGURUS } from '../../../pages/admin/Struktur/rute'
import { labelDepartment, normalisasiKata } from '../../../pages/admin/Struktur/strukturUtils'
import { MENU, bolehAkses } from './menu'
import styles from './CariAdmin.module.css'

const MIN_HURUF = 2
const BATAS_DATA = 5

// Aksi cepat (selain berpindah halaman). `roles` mengikuti hak akses di kontrak bagian 6.
const AKSI = [
  { key: 'aksi-berita', label: 'Tambah Berita', kata: 'tambah buat berita baru', path: PATH_TAMBAH_BERITA },
  { key: 'aksi-pengurus', label: 'Tambah Pengurus', kata: 'tambah buat pengurus anggota baru', path: PATH_TAMBAH_PENGURUS, roles: ['admin'] },
]

// Sorot bagian teks yang cocok dengan kata pencarian (tanpa innerHTML).
function Sorot({ teks, kata }) {
  const bersih = String(teks ?? '')
  const kunci = kata.trim()
  if (!kunci) return bersih
  const i = bersih.toLowerCase().indexOf(kunci.toLowerCase())
  if (i < 0) return bersih
  return (
    <>
      {bersih.slice(0, i)}
      <mark className={styles.sorot}>{bersih.slice(i, i + kunci.length)}</mark>
      {bersih.slice(i + kunci.length)}
    </>
  )
}

// Pencarian di bilah atas admin: halaman, aksi cepat, lalu data berita dan pengurus dari server
// (kontrak 5.2.1: parameter q pada /news/admin/all dan /members/admin/all). Pengurus hanya untuk admin.
//   role : role pengguna ; onPergi : (path) => void
function CariAdmin({ role, onPergi }) {
  const id = useId()
  const [q, setQ] = useState('')
  const [buka, setBuka] = useState(false)
  const [mobileBuka, setMobileBuka] = useState(false)
  const [aktif, setAktif] = useState(0)
  const wadahRef = useRef(null)
  const inputRef = useRef(null)
  const tombolHpRef = useRef(null)
  const listRef = useRef(null)

  const kata = q.trim()
  const kataTunda = useDebounce(kata, 300)
  const adalah = role === 'admin'

  // ── Data dari server ───────────────────────────────────
  const cariData = kataTunda.length >= MIN_HURUF
  const { data, loading } = useApi(async (signal) => {
    if (!cariData) return { berita: [], pengurus: [], gagal: false }
    const [b, p] = await Promise.allSettled([
      getAdminNews({ perPage: BATAS_DATA, q: kataTunda }, signal),
      adalah ? cariPengurus(kataTunda, BATAS_DATA, signal) : Promise.resolve([]),
    ])
    if (signal.aborted) throw new DOMException('Dibatalkan', 'AbortError')
    return {
      berita: b.status === 'fulfilled' ? b.value.items : [],
      pengurus: p.status === 'fulfilled' ? p.value : [],
      gagal: b.status === 'rejected' && (!adalah || p.status === 'rejected'),
    }
  }, `${cariData ? kataTunda : ''}|${role}`)

  // Hasil lama tidak boleh tampil untuk kata yang sudah berubah
  const perluData = kata.length >= MIN_HURUF
  const segar = perluData && cariData && kataTunda === kata && !loading
  const menunggu = perluData && !segar

  // ── Susun daftar hasil (urut = urutan navigasi keyboard) ──
  const kelompok = useMemo(() => {
    const cocok = (teks) => !kata || normalisasiKata(teks).includes(normalisasiKata(kata))
    const halaman = MENU.filter((m) => bolehAkses(m, role) && cocok(m.label)).map((m) => ({
      key: `h-${m.key}`,
      ikon: m.icon,
      judul: m.label,
      sub: m.group === 'sistem' ? 'Sistem' : 'Halaman',
      path: m.path,
    }))
    const aksi = AKSI.filter((a) => (!a.roles || a.roles.includes(role)) && cocok(`${a.label} ${a.kata}`)).map((a) => ({
      key: a.key,
      ikon: Plus,
      judul: a.label,
      sub: 'Aksi cepat',
      path: a.path,
    }))
    const berita = (segar ? data.berita : []).map((b) => ({
      key: `b-${b.id}`,
      ikon: Newspaper,
      judul: b.title,
      sub: [formatTanggalSingkat(b.published_at), b.is_published === 0 ? 'Draf' : null].filter(Boolean).join(' · '),
      path: pathUbahBerita(b.id),
    }))
    const pengurus = (segar ? data.pengurus : []).map((m) => ({
      key: `p-${m.id}`,
      ikon: User,
      judul: m.name,
      sub: `${m.position} · ${labelDepartment(m)}`,
      path: PATH_STRUKTUR,
    }))
    return [
      { key: 'berita', label: 'Berita', items: berita },
      { key: 'pengurus', label: 'Pengurus', items: pengurus },
      { key: 'halaman', label: kata ? 'Halaman' : 'Pintasan', items: halaman.slice(0, kata ? 6 : 6) },
      { key: 'aksi', label: 'Aksi cepat', items: aksi },
    ].filter((g) => g.items.length > 0)
  }, [kata, role, segar, data])

  const datar = useMemo(() => kelompok.flatMap((g) => g.items), [kelompok])
  const awalGrup = kelompok.map((_, i) => kelompok.slice(0, i).reduce((n, g) => n + g.items.length, 0))
  const idAktif = datar.length > 0 ? Math.min(aktif, datar.length - 1) : -1

  // Gulirkan pilihan aktif agar tetap terlihat
  useEffect(() => {
    if (!buka || idAktif < 0) return
    listRef.current?.querySelector(`[data-nomor="${idAktif}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [idAktif, buka])

  function tutup({ kosongkan = false } = {}) {
    setBuka(false)
    setMobileBuka(false)
    if (kosongkan) setQ('')
  }

  useTutupLuar(wadahRef, buka || mobileBuka, (dariEsc) => {
    tutup({ kosongkan: dariEsc })
    // Layar kecil: kolom cari ikut tertutup, jadi fokus dikembalikan ke ikon cari.
    if (dariEsc && tombolHpRef.current?.offsetParent) tombolHpRef.current.focus()
  })

  function pilih(item) {
    if (!item) return
    tutup({ kosongkan: true })
    inputRef.current?.blur()
    onPergi(item.path)
  }

  function onKeyInput(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!buka) {
        setBuka(true)
        return
      }
      if (datar.length === 0) return
      const arah = e.key === 'ArrowDown' ? 1 : -1
      setAktif((idAktif + arah + datar.length) % datar.length)
    } else if (e.key === 'Enter') {
      if (buka && idAktif >= 0) {
        e.preventDefault()
        pilih(datar[idAktif])
      }
    } else if (e.key === 'Home' && buka && datar.length > 0) {
      e.preventDefault()
      setAktif(0)
    } else if (e.key === 'End' && buka && datar.length > 0) {
      e.preventDefault()
      setAktif(datar.length - 1)
    }
  }

  // Pintasan "/" atau Ctrl/Cmd+K memfokuskan kolom cari dari mana saja di halaman admin
  useEffect(() => {
    function onKey(e) {
      const el = document.activeElement
      const mengetik = el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)
      const pintasan = (e.key === '/' && !mengetik && !e.ctrlKey && !e.metaKey && !e.altKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      if (!pintasan) return
      e.preventDefault()
      if (window.matchMedia('(max-width: 900px)').matches) setMobileBuka(true)
      setBuka(true)
      // Menunggu kolom tampil (layar kecil) sebelum difokuskan
      setTimeout(() => inputRef.current?.focus(), 0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const idList = `${id}-hasil`
  const tampilPanel = buka && (kata === '' || datar.length > 0 || perluData)
  const kosongTotal = datar.length === 0 && segar

  return (
    <div ref={wadahRef} className={`${styles.wadah} ${mobileBuka ? styles.hpBuka : ''}`}>
      <button
        ref={tombolHpRef}
        type="button"
        className={styles.tombolHp}
        aria-label="Cari di admin"
        aria-expanded={mobileBuka}
        onClick={() => {
          setMobileBuka(true)
          setBuka(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
      >
        <Search size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className={styles.kolom}>
        <Search size={16} strokeWidth={2} aria-hidden="true" className={styles.ikonCari} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={tampilPanel}
          aria-controls={idList}
          aria-autocomplete="list"
          aria-activedescendant={tampilPanel && idAktif >= 0 ? `${id}-opsi-${idAktif}` : undefined}
          aria-label="Cari di admin"
          placeholder="Cari di admin..."
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setAktif(0)
            setBuka(true)
          }}
          onFocus={() => setBuka(true)}
          onClick={() => setBuka(true)}
          onKeyDown={onKeyInput}
          className={styles.input}
        />
        {menunggu ? (
          <LoaderCircle size={16} strokeWidth={2.2} className={styles.putar} aria-label="Mencari" />
        ) : kata !== '' ? (
          <button
            type="button"
            className={styles.hapus}
            aria-label="Hapus kata pencarian"
            onClick={() => {
              setQ('')
              inputRef.current?.focus()
            }}
          >
            <X size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : (
          <kbd className={styles.kbd} aria-hidden="true">/</kbd>
        )}
      </div>

      {tampilPanel && (
        <div className={styles.panel}>
          <div id={idList} ref={listRef} role="listbox" aria-label="Hasil pencarian" className={styles.daftar}>
            {kelompok.map((g, gi) => (
              <Fragment key={g.key}>
                <p className={styles.grup} role="presentation">{g.label}</p>
                {g.items.map((item, ii) => {
                  const nomor = awalGrup[gi] + ii
                  const Ikon = item.ikon
                  return (
                    <div
                      key={item.key}
                      id={`${id}-opsi-${nomor}`}
                      data-nomor={nomor}
                      role="option"
                      aria-selected={nomor === idAktif}
                      className={`${styles.opsi} ${nomor === idAktif ? styles.opsiAktif : ''}`}
                      onMouseMove={() => nomor !== idAktif && setAktif(nomor)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pilih(item)}
                    >
                      <span className={styles.opsiIkon}><Ikon size={16} strokeWidth={2} aria-hidden="true" /></span>
                      <span className={styles.opsiTeks}>
                        <span className={styles.opsiJudul}><Sorot teks={item.judul} kata={kata} /></span>
                        <span className={styles.opsiSub}>{item.sub}</span>
                      </span>
                      {nomor === idAktif && <CornerDownLeft size={14} strokeWidth={2} className={styles.enter} aria-hidden="true" />}
                    </div>
                  )
                })}
              </Fragment>
            ))}

            {menunggu && datar.length === 0 && <p className={styles.info} role="status">Mencari "{kata}"...</p>}

            {kosongTotal && (
              <div className={styles.kosong} role="status">
                <FileSearch size={22} strokeWidth={1.8} aria-hidden="true" />
                <p>{data?.gagal ? 'Data belum dapat dimuat. Coba lagi sebentar.' : `Tidak ada hasil untuk "${kata}".`}</p>
              </div>
            )}
          </div>

          <p className={styles.kaki} aria-hidden="true">
            <span><kbd>↑</kbd><kbd>↓</kbd> pilih</span>
            <span><kbd>Enter</kbd> buka</span>
            <span><kbd>Esc</kbd> tutup</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default CariAdmin
