import { useEffect, useRef, useState } from 'react'

// fetcher(signal) -> Promise. Dipanggil ulang setiap `key` berubah.
// Request otomatis dibatalkan saat komponen dilepas atau key berganti.
export function useApi(fetcher, key) {
  const fetcherRef = useRef(fetcher)
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    const controller = new AbortController()

    fetcherRef
      .current(controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key, data: null, error })
      })

    return () => controller.abort()
  }, [key])

  const settled = result.key === key
  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    loading: !settled,
  }
}
