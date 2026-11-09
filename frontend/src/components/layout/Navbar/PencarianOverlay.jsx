import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Newspaper, Search, Trophy, X, Zap } from 'lucide-react'
import { getAllEvents, getAllNews } from '../../../services/api'
import { useApi } from '../../../hooks/useApi'
import { useDialogModal, useTutupBerAnimasi } from '../../../hooks/useDialog'
import { NAV_ITEMS } from '../../../constants/navigation'
import { BULAN, formatTanggal, parseDb } from '../../../utils/format'
import styles from './PencarianOverlay.module.css'

// Tampilan pencarian dari desain UI/UX (POP-UP.svg). Kontrak API belum punya endpoint pencarian,
// jadi kegiatan dan berita diambil sekali lalu disaring di browser.
// Grup "Dokumentasi" di desain belum ada sumber datanya, jadi belum ditampilkan.
const GRUP = [
  { id: 'kegiatan', judul: 'Kegiatan', Ikon: Zap, kelasIkon: styles.ikonKegiatan },
  { id: 'berita', judul: 'Berita', Ikon: Newspaper, kelasIkon: styles.ikonBerita },
  { id: 'prestasi', judul: 'Prestasi', Ikon: Trophy, kelasIkon: styles.ikonPrestasi },
]
const POPULER = ['Hackathon', 'Workshop', 'Bakti Sosial', 'Study Club', 'Makrab']
const MAKS_PER_GRUP = 4

// "2026-10-01" s.d. "2026-10-10" -> "01-10 Oktober 2026"
function rentangTanggal(mulai, selesai) {
  if (!mulai) return ''
  const a = parseDb(mulai)
  const b = selesai ? parseDb(selesai) : null
  if (!b || (a.year === b.year && a.month === b.month && a.day === b.day)) return formatTanggal(mulai)
  const dd = (n) => String(n).padStart(2, '0')
  if (a.year === b.year && a.month === b.month) return `${dd(a.day)}-${dd(b.day)} ${BULAN[a.month - 1]} ${a.year}`
  return `${formatTanggal(mulai)} - ${formatTanggal(selesai)}`
}

function susunDaftar(kegiatan = [], berita = []) {
  const daftar = []
  kegiatan.forEach((k) => {
    const sub = [rentangTanggal(k.start_at, k.end_at), k.location].filter(Boolean).join(' · ')
    daftar.push({
      id: `k-${k.id}`,
      grup: 'kegiatan',
      judul: k.title,
      sub,
      href: '/#kegiatan', // TODO: ganti ke halaman detail (/kegiatan/{slug}) setelah routing disepakati
      teks: `${k.title} ${k.location ?? ''} ${k.category ?? ''}`,
    })
  })
  berita.forEach((b) => {
    const sub = [b.category, b.published_at ? formatTanggal(b.published_at) : ''].filter(Boolean).join(' · ')
    daftar.push({
      id: `b-${b.id}`,
      grup: b.category === 'Prestasi' ? 'prestasi' : 'berita',
      judul: b.title,
      sub,
      href: '/#berita', // TODO: ganti ke halaman baca berita (/berita/{slug}) setelah routing disepakati
      teks: `${b.title} ${b.excerpt ?? ''} ${b.category ?? ''}`,
    })
  })
  return daftar
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Sorot({ teks, kata }) {
  if (kata.length === 0) return teks
  const pola = new RegExp(`(${kata.map(escapeRegex).join('|')})`, 'gi')
  return teks.split(pola).map((bagian, i) => (i % 2 ? <mark key={i}>{bagian}</mark> : bagian))
}

function PencarianOverlay({ onTutup }) {
  const [q, setQ] = useState('')
  const [aktif, setAktif] = useState(0)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const daftarRef = useRef(null)
  const { menutup, tutup } = useTutupBerAnimasi(onTutup)
  useDialogModal(panelRef, tutup)

  const { data, loading, error } = useApi(
    (signal) => Promise.all([getAllEvents(signal), getAllNews(signal)]),
    'pencarian-navbar'
  )
  const semua = useMemo(() => susunDaftar(data?.[0], data?.[1]), [data])

  const kata = useMemo(() => q.trim().toLowerCase().split(/\s+/).filter(Boolean), [q])
  const hasil = useMemo(() => {
    if (kata.length === 0) return []
    return semua.filter((item) => {
      const jerami = item.teks.toLowerCase()
      return kata.every((k) => jerami.includes(k))
    })
  }, [semua, kata])

  // Kelompokkan, batasi per grup, lalu ratakan supaya urutan panah atas/bawah sama dengan tampilan.
  const grupTampil = GRUP.map((g) => ({ ...g, items: hasil.filter((h) => h.grup === g.id).slice(0, MAKS_PER_GRUP) })).filter(
    (g) => g.items.length > 0
  )
  const rata = grupTampil.flatMap((g) => g.items)
  // Nomor urut pertama tiap grup, supaya setiap hasil punya nomor tetap tanpa mengubah variabel saat render.
  const awalGrup = grupTampil.map((_, i) => grupTampil.slice(0, i).reduce((n, g) => n + g.items.length, 0))
  const urutAktif = Math.min(aktif, Math.max(rata.length - 1, 0))

  useEffect(() => {
    daftarRef.current?.querySelector('[data-aktif="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [urutAktif, q])

  function ubahQ(nilai) {
    setQ(nilai)
    setAktif(0)
  }

  function onKeyDown(e) {
    if (rata.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktif((urutAktif + 1) % rata.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktif((urutAktif - 1 + rata.length) % rata.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      daftarRef.current?.querySelector('[data-aktif="true"]')?.click()
    }
  }

  const halamanCepat = NAV_ITEMS.filter((n) => ['Kegiatan', 'Kalender', 'Dokumentasi', 'Prestasi'].includes(n.label)).map(
    (n) => ({ ...n, href: n.href.startsWith('#') ? `/${n.href}` : n.href })
  )

  return createPortal(
    <div
      className={styles.lapisan}
      data-state={menutup ? 'tutup' : 'buka'}
      onMouseDown={(e) => e.target === e.currentTarget && tutup()}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Pencarian" className={styles.panel}>
        <div className={styles.kolomCari}>
          <Search size={22} strokeWidth={2.2} className={styles.ikonCari} aria-hidden="true" />
          <input
            ref={inputRef}
            data-fokus-awal
            type="text"
            value={q}
            onChange={(e) => ubahQ(e.target.value)}
            onKeyDown={onKeyDown}
            className={styles.input}
            placeholder="Cari kegiatan, berita, atau prestasi..."
            aria-label="Kata kunci pencarian"
            autoComplete="off"
            spellCheck="false"
            maxLength={100}
          />
          {q && (
            <button
              type="button"
              className={styles.hapus}
              aria-label="Hapus kata kunci"
              onClick={() => {
                ubahQ('')
                inputRef.current?.focus()
              }}
            >
              <X size={16} strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}
          <button type="button" className={styles.esc} onClick={tutup} aria-label="Tutup pencarian">
            Esc
          </button>
        </div>

        <div className={styles.isi}>
          <div className={styles.kiri} ref={daftarRef} aria-live="polite">
            {loading && kata.length > 0 && (
              <div className={styles.skeletonWrap} aria-hidden="true">
                <span className={styles.skeleton} />
                <span className={styles.skeleton} />
              </div>
            )}
            {!loading && error && kata.length > 0 && (
              <p className={styles.kosong}>Data pencarian belum bisa dimuat. Coba lagi beberapa saat lagi.</p>
            )}
            {kata.length === 0 && (
              <p className={styles.kosong}>Ketik untuk mencari kegiatan, berita, atau prestasi HIMAFOR.</p>
            )}
            {!loading && !error && kata.length > 0 && rata.length === 0 && (
              <p className={styles.kosong}>
                Tidak ada hasil untuk “{q.trim()}”. Coba kata kunci lain atau pilih pencarian populer.
              </p>
            )}
            {grupTampil.map((g, gi) => (
              <section key={g.id} className={styles.grup} aria-label={g.judul}>
                <h3 className={styles.grupJudul}>{g.judul}</h3>
                <ul className={styles.daftar}>
                  {g.items.map((item, ii) => {
                    const nomor = awalGrup[gi] + ii
                    const sedangAktif = nomor === urutAktif
                    return (
                      <li key={item.id} style={{ '--urut': nomor }} className={styles.itemWrap}>
                        <a
                          href={item.href}
                          className={`${styles.item} ${sedangAktif ? styles.itemAktif : ''}`}
                          data-aktif={sedangAktif}
                          onClick={tutup}
                          onMouseEnter={() => setAktif(nomor)}
                        >
                          <span className={`${styles.ikon} ${g.kelasIkon}`}>
                            <g.Ikon size={20} strokeWidth={2} aria-hidden="true" />
                          </span>
                          <span className={styles.teks}>
                            <span className={styles.judul}>
                              <Sorot teks={item.judul} kata={kata} />
                            </span>
                            {item.sub && <span className={styles.sub}>{item.sub}</span>}
                          </span>
                          <ArrowRight size={18} strokeWidth={2} className={styles.panah} aria-hidden="true" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>

          <aside className={styles.kanan}>
            <h3 className={styles.grupJudul}>Pencarian populer</h3>
            <div className={styles.chips}>
              {POPULER.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={styles.chip}
                  onClick={() => {
                    ubahQ(p)
                    inputRef.current?.focus()
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <h3 className={`${styles.grupJudul} ${styles.judulCepat}`}>Halaman cepat</h3>
            <ul className={styles.cepat}>
              {halamanCepat.map((h) => (
                <li key={h.label}>
                  <a href={h.href} className={styles.cepatLink} onClick={tutup}>
                    {h.label}
                    <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className={styles.kaki}>
          <span className={styles.petunjuk}>
            {rata.length > 0 && (
              <>
                <kbd className={styles.kbd}>Enter</kbd> untuk membuka hasil
              </>
            )}
          </span>
          {kata.length > 0 && !loading && !error && (
            <span className={styles.jumlah}>{hasil.length} hasil ditemukan</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PencarianOverlay
