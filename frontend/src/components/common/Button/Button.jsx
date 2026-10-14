import styles from './Button.module.css'

function Button({
  children,
  variant = 'primary',
  href,
  onClick,
  type = 'button',
  className = '',
}) {
  const buttonClassName = `${styles.button} ${styles[variant]} ${className}`

  if (href) {
    return (
      <a className={buttonClassName} href={href}>
        {children}
      </a>
    )
  }

  return (
    <button
      className={buttonClassName}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button