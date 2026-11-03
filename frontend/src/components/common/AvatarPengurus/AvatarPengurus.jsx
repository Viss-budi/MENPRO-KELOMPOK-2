import { useState } from 'react'
import { User } from 'lucide-react'
import styles from './AvatarPengurus.module.css'

// Foto pengurus bulat. Bila foto kosong atau gagal dimuat, tampil foto bawaan
// (siluet orang berlatar biru muda) sesuai desain UI/UX.
//   src     : URL foto (sudah lewat resolveImage) atau kosong
//   nama    : untuk teks alternatif foto
//   ukuran  : diameter dalam px (angka), atau '100%' untuk mengikuti pembungkus
//   cincin  : true = beri lingkaran tipis di sekeliling (dipakai di form)
function AvatarPengurus({ src, nama = '', ukuran = 44, cincin = false, className = '' }) {
  // Simpan src yang gagal dimuat; saat src berganti (foto baru), otomatis dicoba lagi
  const [srcGagal, setSrcGagal] = useState(null)
  const gagal = srcGagal === src

  const gaya = { width: ukuran, height: ukuran }
  const kelas = `${styles.avatar} ${cincin ? styles.cincin : ''} ${className}`

  if (!src || gagal) {
    return (
      <span className={`${kelas} ${styles.bawaan}`} style={gaya} aria-hidden="true">
        <User size={typeof ukuran === 'number' ? Math.round(ukuran * 0.45) : 48} strokeWidth={1.9} />
      </span>
    )
  }
  return (
    <img
      className={`${kelas} ${styles.foto}`}
      style={gaya}
      src={src}
      alt={nama}
      loading="lazy"
      onError={() => setSrcGagal(src)}
    />
  )
}

export default AvatarPengurus
