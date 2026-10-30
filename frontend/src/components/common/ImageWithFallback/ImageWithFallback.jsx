import { useState } from 'react'
import styles from './ImageWithFallback.module.css'

function ImageWithFallback({ src, alt, className = '', ...rest }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`${styles.fallback} ${className}`} role="img" aria-label={alt} {...rest}>
        {alt}
      </div>
    )
  }

  return (
    <img
      className={`${styles.image} ${className}`}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}

export default ImageWithFallback
