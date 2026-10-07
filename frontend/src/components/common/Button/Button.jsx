import styles from './Button.module.css'

function Button({ children, variant = 'primary', href, onClick, type = 'button' }) {
  const className = `${styles.button} ${styles[variant]}`

  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    )
  }

  return (
    <button className={className} type={type} onClick={onClick}>
      {children}
    </button>
  )
}

export default Button
