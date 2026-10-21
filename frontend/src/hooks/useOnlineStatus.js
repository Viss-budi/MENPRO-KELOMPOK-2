import { useCallback, useEffect, useState } from 'react'

// Status koneksi untuk halaman "Tidak ada koneksi internet".
// navigator.onLine hanya tahu ada/tidaknya jaringan lokal (Wi-Fi tersambung tapi
// tanpa internet tetap dianggap online), jadi tombol "Coba Lagi" memeriksa langsung
// ke server sendiri lewat retry().
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const retry = useCallback(async () => {
    try {
      // Respons apa pun (termasuk 404) berarti server terjangkau; yang gagal hanya jaringan.
      await fetch('/favicon.svg', { method: 'HEAD', cache: 'no-store' })
      setOnline(true)
    } catch {
      setOnline(false)
    }
  }, [])

  return { online, retry }
}
