import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState } from 'react'
import styles from './UpdatePrompt.module.css'

function UpdatePrompt() {
  const [updating, setUpdating] =
    useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('No fue posible registrar la actualización de Amperium OS:', error)
    },
  })

  if (!needRefresh && !offlineReady) {
    return null
  }

  const closePrompt = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  const installUpdate = async () => {
    if (updating) return

    setUpdating(true)

    try {
      await updateServiceWorker(true)
    } catch (error) {
      console.error(
        'No fue posible instalar la actualización:',
        error,
      )
      setUpdating(false)
    }
  }

  return (
    <section className={styles.prompt} role="status" aria-live="polite">
      <div className={styles.icon} aria-hidden="true">
        {needRefresh ? '↻' : '✓'}
      </div>

      <div className={styles.content}>
        <strong>
          {needRefresh
            ? 'Nueva versión disponible'
            : 'Amperium OS listo sin conexión'}
        </strong>

        <p>
          {needRefresh
            ? 'Actualiza para instalar las mejoras más recientes.'
            : 'La aplicación ya puede abrirse con conectividad limitada.'}
        </p>
      </div>

      <div className={styles.actions}>
        {needRefresh && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={installUpdate}
            disabled={updating}
          >
            {updating
              ? 'Actualizando...'
              : 'Actualizar ahora'}
          </button>
        )}

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={closePrompt}
        >
          {needRefresh ? 'Después' : 'Cerrar'}
        </button>
      </div>
    </section>
  )
}

export default UpdatePrompt
