import { useMemo, useState } from 'react'
import { CircleAlert, RefreshCw, Users } from 'lucide-react'
import Navbar from '../../../components/layout/Navbar/Navbar'
import Footer from '../../../components/layout/Footer/Footer'
import { useApi } from '../../../hooks/useApi'
import AvatarPengurus from '../../../components/common/AvatarPengurus/AvatarPengurus'
import { getMembers, getStructure } from '../../../services/api'
import { resolveImage } from '../../../utils/image'
import { pesanGagal } from '../../../utils/pesanGagal'
import styles from './Tentang.module.css'

// Kartu satu pengurus. Tanpa foto (atau foto gagal dimuat), AvatarPengurus memakai foto bawaan.
function KartuPengurus({ member }) {
  return (
    <article className={styles.card}>
      <div className={styles.avatarWrap}>
        <AvatarPengurus
          src={member.photo_url ? resolveImage(member.photo_url) : null}
          nama={member.name}
          ukuran="100%"
          className={styles.avatarImg}
        />
      </div>
      <h3 className={styles.nama}>{member.name}</h3>
      <p className={styles.jabatan}>{member.position}</p>
    </article>
  )
}

function Tentang() {
  const [muatUlang, setMuatUlang] = useState(0)

  // Struktur organisasi (pengurus inti + daftar department), lalu anggota per department
  const { data, loading, error } = useApi(async (signal) => {
    const struktur = await getStructure(signal)
    const anggota = await getMembers(signal)
    return { struktur, anggota }
  }, `struktur-publik-${muatUlang}`)

  const blokInti = useMemo(() => data?.struktur?.inti ?? [], [data])

  // Department aktif beserta anggotanya; department tanpa anggota tidak ditampilkan
  const blokDepartment = useMemo(() => {
    const anggota = Array.isArray(data?.anggota) ? data.anggota : []
    return (data?.struktur?.departments ?? [])
      .map((d) => ({ ...d, members: anggota.filter((m) => m.department_id === d.id) }))
      .filter((d) => d.members.length > 0)
  }, [data])

  const kosong = !loading && !error && blokInti.length === 0 && blokDepartment.length === 0

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className={styles.hero}>
          <span className={styles.badge}>Struktur Organisasi</span>
          <h1 className={styles.title}>Pengurus HIMAFOR</h1>
          <p className={styles.subtitle}>
            Mengenal jajaran kepengurusan Himpunan Mahasiswa Informatika yang berdedikasi membangun sinergi dan inovasi.
          </p>
        </section>

        {/* ── Keadaan Memuat (Skeleton) ───────────────────── */}
        {loading && (
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className={styles.skelCard} />
            ))}
          </div>
        )}

        {/* ── Keadaan Gagal ────────────────────────────────── */}
        {!loading && error && (
          <div className={styles.panel} role="alert">
            <CircleAlert size={36} color="#DC2626" />
            <h2 className={styles.panelTitle}>Gagal Memuat Struktur</h2>
            <p className={styles.panelText}>
              {pesanGagal(error, 'Terjadi gangguan saat mengambil data pengurus. Silakan coba beberapa saat lagi.')}
            </p>
            <button
              type="button"
              className={styles.btnRetry}
              onClick={() => setMuatUlang((n) => n + 1)}
            >
              <RefreshCw size={16} />
              Muat Ulang
            </button>
          </div>
        )}

        {/* ── Keadaan Kosong ───────────────────────────────── */}
        {kosong && (
          <div className={styles.panel}>
            <Users size={40} color="#94A3B8" />
            <h2 className={styles.panelTitle}>Belum Ada Data Pengurus</h2>
            <p className={styles.panelText}>
              Data struktur kepengurusan belum dipublikasikan.
            </p>
          </div>
        )}

        {/* ── Tampilan Struktur Pengurus ───────────────────── */}
        {!loading && !error && !kosong && (
          <>
            {blokInti.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Pengurus Inti</h2>
                  <div className={styles.sectionLine} />
                </div>
                <div className={styles.grid}>
                  {blokInti.flatMap((blok) => blok.members).map((member) => (
                    <KartuPengurus key={member.id} member={member} />
                  ))}
                </div>
              </section>
            )}

            {blokDepartment.map((dept) => (
              <section key={dept.id} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Department {dept.name}</h2>
                  <div className={styles.sectionLine} />
                </div>
                <div className={styles.grid}>
                  {dept.members.map((member) => (
                    <KartuPengurus key={member.id} member={member} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

export default Tentang

