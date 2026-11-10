import { useEffect, useState } from 'react'

// Mengembalikan `nilai` yang tertunda `ms` milidetik; dipakai agar kolom cari
// tidak memanggil API di setiap ketukan tombol.
export function useDebounce(nilai, ms = 350) {
  const [tertunda, setTertunda] = useState(nilai)

  useEffect(() => {
    const timer = setTimeout(() => setTertunda(nilai), ms)
    return () => clearTimeout(timer)
  }, [nilai, ms])

  return tertunda
}
