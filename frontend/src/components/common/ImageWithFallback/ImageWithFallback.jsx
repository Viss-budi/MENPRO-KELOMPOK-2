import { useState } from 'react'
import styles from './ImageWithFallback.module.css'

function ImageWithFallback({ src, alt }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={styles.fallback} role="img" aria-label={alt}>
        {alt}
      </div>
    )
  }

  return <img className={styles.image} src={src} alt={alt} onError={() => setFailed(true)} />
}

export default ImageWithFallback
