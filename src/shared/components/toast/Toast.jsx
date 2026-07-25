import { useEffect } from 'react'
import styles from './Toast.module.css'

function Toast({
  open,
  title,
  message,
  type = 'success',
  duration = 3500,
  onClose,
}) {
  useEffect(() => {
    if (!open || !onClose) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      onClose()
    }, duration)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [open, duration, onClose])

  if (!open) {
    return null
  }

  const icons = {
    success: '✓',
    error: '!',
    warning: '!',
    info: 'i',
    reminder: '◷',
  }

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.icon}>
        {icons[type] ?? icons.info}
      </div>

      <div className={styles.content}>
        {title && <strong>{title}</strong>}

        {message && <p>{message}</p>}
      </div>

      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        ×
      </button>

      <span
        className={styles.progress}
        style={{
          animationDuration: `${duration}ms`,
        }}
      />
    </div>
  )
}

export default Toast