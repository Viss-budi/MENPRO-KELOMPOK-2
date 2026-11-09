import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, LoaderCircle, Mail, MailCheck, MailX, MapPin, Phone, RefreshCw, Send, X } from 'lucide-react'
import { getSettings, kirimPesan } from '../../../services/api'
import { useApi } from '../../../hooks/useApi'
import { useDialogModal, useTutupBerAnimasi } from '../../../hooks/useDialog'
import { BULAN_SINGKAT } from '../../../utils/format'
import styles from './HubungiKamiModal.module.css'

// Modal Hubungi Kami dari desain UI/UX (POP-UP.svg): form, dialog "Pesan terkirim", dialog "Pesan belum terkirim".
// Kontak di panel kiri dari GET /settings (kontrak 2.5), teks desain dipakai bila data belum ada.
const MAKS_NAMA = 100
const MAKS_PESAN = 1000
const SUBJEK = [
  'Pertanyaan umum',
  'Kolaborasi dan kerja sama',
  'Pendaftaran dan open recruitment',
  'Informasi kegiatan',
  'Lainnya',
]
const KONTAK_DEFAULT = {
  contact_email: 'himafor@uinssc.ac.id',
  contact_phone: '+62 812 3456 7890',
  contact_address: 'UIN Siber Syekh Nurjati',
}
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PESAN = {
  nama: 'Nama wajib diisi',
  emailKosong: 'Email wajib diisi',
  emailSalah: 'Format email tidak valid',
  subjek: 'Pilih topik pesan',
  pesan: 'Pesan wajib diisi',
}

function validasiPesan({ nama, email, subjek, pesan }) {
  const errors = {}
  if (!nama.trim()) errors.nama = PESAN.nama
  const e = email.trim()
  if (!e) errors.email = PESAN.emailKosong
  else if (!POLA_EMAIL.test(e)) errors.email = PESAN.emailSalah
  if (!subjek) errors.subjek = PESAN.subjek
  if (!pesan.trim()) errors.pesan = PESAN.pesan
  return errors
}

// 2026-10-08 09:12 -> "08 Okt 2026, 09.12"
function formatWaktu(d) {
  const dd = String(d.getDate()).padStart(2, '0')
  const jam = String(d.getHours()).padStart(2, '0')
  const menit = String(d.getMinutes()).padStart(2, '0')
  return `${dd} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}, ${jam}.${menit}`
}

const ikon = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
const SOSIAL = [
  {
    kunci: 'social_instagram',
    label: 'Instagram',
    gambar: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...ikon} />
        <circle cx="12" cy="12" r="4" {...ikon} />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
      </>
    ),
  },
  {
    kunci: 'social_youtube',
    label: 'YouTube',
    gambar: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...ikon} />
        <path d="M10 9.2L15 12L10 14.8V9.2Z" fill="currentColor" />
      </>
    ),
  },
  {
    kunci: 'social_tiktok',
    label: 'TikTok',
    gambar: <path d="M14 4V14.5A3.5 3.5 0 1 1 10.5 11M14 4C14.4 6.4 16 8 18.5 8.2" {...ikon} />,
  },
  {
    kunci: 'social_x',
    label: 'X',
    gambar: <path d="M5.5 5.5L18.5 18.5M18.5 5.5L5.5 18.5" {...ikon} strokeWidth="2" />,
  },
]

function nomorWhatsApp(telepon) {
  let angka = String(telepon ?? '').replace(/\D/g, '')
  if (angka.startsWith('0')) angka = `62${angka.slice(1)}`
  return angka
}

function HubungiKamiModal({ onTutup }) {
  const [tampilan, setTampilan] = useState('form') // form | sukses | gagal
  const [nilai, setNilai] = useState({ nama: '', email: '', subjek: '', pesan: '' })
  const [errors, setErrors] = useState({})
  const [mengirim, setMengirim] = useState(false)
  const [terkirim, setTerkirim] = useState(null)
  const [pesanGagal, setPesanGagal] = useState('')
  const kotakRef = useRef(null)
  const abortRef = useRef(null)
  const { menutup, tutup } = useTutupBerAnimasi(onTutup)
  useDialogModal(kotakRef, tutup)

  const { data: settings } = useApi((signal) => getSettings(signal), 'settings-hubungi-kami')
  const kontak = { ...KONTAK_DEFAULT, ...(settings ?? {}) }
  const sosial = SOSIAL.filter((s) => settings?.[s.kunci])
  const wa = nomorWhatsApp(kontak.contact_phone)

  useEffect(() => () => abortRef.current?.abort(), [])

  // Setelah berganti tampilan (form, sukses, gagal), pindahkan fokus ke elemen utamanya.
  useEffect(() => {
    kotakRef.current?.querySelector('[data-fokus-awal]')?.focus({ preventScroll: true })
  }, [tampilan])

  function ubah(kolom, isi) {
    setNilai((n) => ({ ...n, [kolom]: isi }))
    if (errors[kolom]) setErrors((e) => ({ ...e, [kolom]: '' }))
  }

  async function kirim(e) {
    e?.preventDefault()
    if (mengirim) return
    const masalah = validasiPesan(nilai)
    setErrors(masalah)
    const pertama = ['nama', 'email', 'subjek', 'pesan'].find((k) => masalah[k])
    if (pertama) {
      kotakRef.current?.querySelector(`[name="${pertama}"]`)?.focus()
      return
    }

    const ac = new AbortController()
    abortRef.current = ac
    setMengirim(true)
    try {
      await kirimPesan(
        { name: nilai.nama.trim(), email: nilai.email.trim(), subject: nilai.subjek, message: nilai.pesan.trim() },
        ac.signal
      )
      setTerkirim({ subjek: nilai.subjek, waktu: formatWaktu(new Date()) })
      setTampilan('sukses')
    } catch (err) {
      if (err.name === 'AbortError') return
      // Pesan server hanya dipakai untuk kesalahan isian (4xx); selain itu pakai teks umum dari desain.
      const dariServer = err.status >= 400 && err.status < 500 && err.status !== 404
      setPesanGagal(dariServer ? err.message : '')
      setTampilan('gagal')
    } finally {
      setMengirim(false)
    }
  }

  function kirimLagi() {
    setNilai({ nama: '', email: '', subjek: '', pesan: '' })
    setErrors({})
    setTerkirim(null)
    setTampilan('form')
  }

  function keBeranda() {
    window.location.assign('/#beranda')
    tutup()
  }

  const kolom = (nama) => ({
    name: nama,
    value: nilai[nama],
    onChange: (e) => ubah(nama, e.target.value),
    'aria-invalid': errors[nama] ? 'true' : undefined,
    'aria-describedby': errors[nama] ? `err-${nama}` : undefined,
    disabled: mengirim,
  })
  const galat = (nama) =>
    errors[nama] ? (
      <p id={`err-${nama}`} className={styles.galat} role="alert">
        {errors[nama]}
      </p>
    ) : null

  return createPortal(
    <div
      className={styles.lapisan}
      data-state={menutup ? 'tutup' : 'buka'}
      onMouseDown={(e) => e.target === e.currentTarget && !mengirim && tutup()}
    >
      <div ref={kotakRef} className={styles.kotak} role="dialog" aria-modal="true" aria-labelledby="judul-hubungi">
        {tampilan === 'form' && (
          <div key="form" className={styles.modal}>
            <aside className={styles.kiri}>
              <span className={styles.lingkar1} aria-hidden="true" />
              <span className={styles.lingkar2} aria-hidden="true" />
              <h2 className={styles.judulKiri}>Hubungi Kami</h2>
              <p className={styles.deskKiri}>
                Punya pertanyaan, ide kolaborasi, atau ingin bergabung? Kami siap membantu.
              </p>

              <ul className={styles.kontak}>
                <li>
                  <span className={styles.kotakIkon}><Mail size={20} strokeWidth={1.9} aria-hidden="true" /></span>
                  <span className={styles.kontakTeks}>
                    <a href={`mailto:${kontak.contact_email}`} className={styles.kontakUtama}>{kontak.contact_email}</a>
                    <span className={styles.kontakSub}>Email resmi HIMAFOR</span>
                  </span>
                </li>
                <li>
                  <span className={styles.kotakIkon}><Phone size={20} strokeWidth={1.9} aria-hidden="true" /></span>
                  <span className={styles.kontakTeks}>
                    <a href={`tel:${String(kontak.contact_phone).replace(/[^\d+]/g, '')}`} className={styles.kontakUtama}>
                      {kontak.contact_phone}
                    </a>
                    <span className={styles.kontakSub}>Senin – Jumat, 09.00 – 15.00 WIB</span>
                  </span>
                </li>
                <li>
                  <span className={styles.kotakIkon}><MapPin size={20} strokeWidth={1.9} aria-hidden="true" /></span>
                  <span className={styles.kontakTeks}>
                    <span className={styles.kontakUtama}>{kontak.contact_address}</span>
                    <span className={styles.kontakSub}>Sekretariat HIMAFOR, Cirebon</span>
                  </span>
                </li>
              </ul>

              {sosial.length > 0 && (
                <div className={styles.sosial}>
                  <p className={styles.labelKecil}>Ikuti kami</p>
                  <div className={styles.sosialBaris}>
                    {sosial.map((s) => (
                      <a
                        key={s.kunci}
                        href={settings[s.kunci]}
                        className={styles.sosialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">{s.gambar}</svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <p className={styles.catatan}>Kami biasanya membalas dalam 1–2 hari kerja.</p>
            </aside>

            <form className={styles.kanan} onSubmit={kirim} noValidate>
              <button type="button" className={styles.tutup} onClick={tutup} aria-label="Tutup" disabled={mengirim}>
                <X size={20} strokeWidth={2} aria-hidden="true" />
              </button>
              <h2 id="judul-hubungi" className={styles.judulKanan}>Kirim Pesan</h2>
              <p className={styles.deskKanan}>Isi formulir berikut dan tim HIMAFOR akan menghubungimu.</p>

              <div className={styles.dua}>
                <div className={styles.baris}>
                  <label htmlFor="hk-nama" className={styles.label}>Nama Lengkap</label>
                  <input
                    id="hk-nama"
                    type="text"
                    data-fokus-awal
                    className={styles.input}
                    placeholder="Masukkan nama kamu"
                    maxLength={MAKS_NAMA}
                    autoComplete="name"
                    {...kolom('nama')}
                  />
                  {galat('nama')}
                </div>
                <div className={styles.baris}>
                  <label htmlFor="hk-email" className={styles.label}>Email</label>
                  <input
                    id="hk-email"
                    type="email"
                    className={styles.input}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    {...kolom('email')}
                  />
                  {galat('email')}
                </div>
              </div>

              <div className={styles.baris}>
                <label htmlFor="hk-subjek" className={styles.label}>Subjek</label>
                <div className={styles.pilih}>
                  <select
                    id="hk-subjek"
                    className={`${styles.input} ${styles.select} ${nilai.subjek ? '' : styles.kosong}`}
                    {...kolom('subjek')}
                  >
                    <option value="" disabled>Pilih topik pesan</option>
                    {SUBJEK.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={18} strokeWidth={2} className={styles.panah} aria-hidden="true" />
                </div>
                {galat('subjek')}
              </div>

              <div className={styles.baris}>
                <label htmlFor="hk-pesan" className={styles.label}>Pesan</label>
                <textarea
                  id="hk-pesan"
                  className={`${styles.input} ${styles.area}`}
                  placeholder="Tulis pesan kamu di sini..."
                  maxLength={MAKS_PESAN}
                  {...kolom('pesan')}
                />
                {galat('pesan')}
              </div>

              <button type="submit" className={styles.kirim} disabled={mengirim}>
                {mengirim ? (
                  <>
                    <LoaderCircle size={18} strokeWidth={2.4} className={styles.putar} aria-hidden="true" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={17} strokeWidth={2.2} aria-hidden="true" />
                    Kirim Pesan
                  </>
                )}
              </button>
              {wa && (
                <a
                  className={styles.wa}
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lebih suka chat langsung? Hubungi via WhatsApp →
                </a>
              )}
            </form>
          </div>
        )}

        {tampilan === 'sukses' && (
          <div key="sukses" className={styles.dialog}>
            <span className={`${styles.statusIkon} ${styles.ok}`}>
              <MailCheck size={34} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h2 id="judul-hubungi" className={styles.judulDialog} tabIndex={-1} data-fokus-awal>Pesan terkirim</h2>
            <p className={styles.teksDialog}>
              Terima kasih telah menghubungi HIMAFOR.<br />
              Kami akan membalas melalui email Anda dalam beberapa hari.
            </p>
            {terkirim && (
              <div className={styles.ringkas}>
                <strong>{terkirim.subjek}</strong>
                <span>Dikirim: {terkirim.waktu}</span>
              </div>
            )}
            <div className={styles.aksi}>
              <button type="button" className={styles.tombolUtama} onClick={keBeranda}>Kembali ke Beranda</button>
              <button type="button" className={styles.tombolGaris} onClick={kirimLagi}>Kirim Pesan Lain</button>
            </div>
          </div>
        )}

        {tampilan === 'gagal' && (
          <div key="gagal" className={styles.dialog}>
            <span className={`${styles.statusIkon} ${styles.bahaya}`}>
              <MailX size={34} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h2 id="judul-hubungi" className={styles.judulDialog} tabIndex={-1} data-fokus-awal>Pesan belum terkirim</h2>
            <p className={styles.teksDialog} role="alert">
              {pesanGagal || 'Terjadi gangguan saat mengirim pesan.'}<br />
              Isi form Anda masih tersimpan, silakan coba lagi.
            </p>
            <div className={styles.aksi}>
              <button type="button" className={styles.tombolUtama} onClick={kirim} disabled={mengirim}>
                {mengirim ? (
                  <LoaderCircle size={16} strokeWidth={2.4} className={styles.putar} aria-hidden="true" />
                ) : (
                  <RefreshCw size={16} strokeWidth={2.2} aria-hidden="true" />
                )}
                {mengirim ? 'Mengirim...' : 'Coba Kirim Lagi'}
              </button>
              <button type="button" className={styles.tombolGaris} onClick={keBeranda}>Kembali ke Beranda</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default HubungiKamiModal
