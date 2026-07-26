import { useEffect, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Smartphone,
  Volume2,
} from 'lucide-react'
import {
  enablePushNotifications,
  getPushAvailability,
  sendTestNotification,
} from '../../agenda/services/pushService'
import BusinessSettings from '../components/BusinessSettings'
import styles from './ConfiguracionPage.module.css'

const STATUS_TEXT = {
  granted: 'Permitidas',
  denied: 'Bloqueadas en el dispositivo',
  default: 'Sin activar',
  unsupported: 'No disponibles',
  unconfigured: 'Pendientes de configuración',
}

function ConfiguracionPage() {
  const [activeMenu, setActiveMenu] =
    useState('empresa')
  const [status, setStatus] =
    useState('default')
  const [working, setWorking] =
    useState(false)
  const [message, setMessage] =
    useState('')

  useEffect(() => {
    getPushAvailability().then(setStatus)
  }, [])

  const activate = async () => {
    if (status === 'granted') return
    setWorking(true)
    setMessage('')

    try {
      await enablePushNotifications()
      setStatus('granted')
      setMessage(
        'Este dispositivo quedó registrado correctamente.',
      )
    } catch (error) {
      setStatus(
        await getPushAvailability(),
      )
      setMessage(error.message)
    } finally {
      setWorking(false)
    }
  }

  const testNotification = async () => {
    setWorking(true)
    setMessage('')

    try {
      await sendTestNotification()
      setMessage(
        'Prueba enviada. Bloquea el teléfono o cambia de aplicación para comprobar cómo se muestra.',
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className={styles.page}>
      <nav className={styles.mainMenu}>
        <button
          type="button"
          className={
            activeMenu === 'empresa'
              ? styles.mainActive
              : ''
          }
          onClick={() => setActiveMenu('empresa')}
        >
          Empresa y sistema
        </button>
        <button
          type="button"
          className={
            activeMenu === 'avisos'
              ? styles.mainActive
              : ''
          }
          onClick={() => setActiveMenu('avisos')}
        >
          Avisos del dispositivo
        </button>
      </nav>

      {activeMenu === 'empresa' ? (
        <BusinessSettings />
      ) : null}

      {activeMenu === 'avisos' ? (
      <>
      <article className={styles.card}>
        <div className={styles.cardHeading}>
          <span className={styles.icon}>
            <Bell size={22} />
          </span>
          <div>
            <h2>Notificaciones</h2>
            <p>
              Permisos y pruebas de avisos para este dispositivo.
            </p>
          </div>
        </div>

        <div className={styles.setting}>
          <div>
            <strong>Permitir avisos</strong>
            <span>
              {STATUS_TEXT[status] ||
                'Comprobando…'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Permitir avisos"
            aria-checked={
              status === 'granted'
            }
            className={`${styles.switch} ${
              status === 'granted'
                ? styles.switchOn
                : ''
            }`}
            onClick={activate}
            disabled={
              working ||
              status === 'unsupported'
            }
          >
            <span />
          </button>
        </div>

        <div className={styles.setting}>
          <div>
            <strong>Sonido del sistema</strong>
            <span>
              Se solicita el tono predeterminado del iPhone.
            </span>
          </div>
          <Volume2 size={21} />
        </div>

        <button
          type="button"
          className={styles.testButton}
          onClick={testNotification}
          disabled={
            working ||
            status !== 'granted'
          }
        >
          <CheckCircle2 size={18} />
          {working
            ? 'Comprobando…'
            : 'Enviar notificación de prueba'}
        </button>

        {message ? (
          <p className={styles.message}>
            {message}
          </p>
        ) : null}
      </article>

      <article className={styles.card}>
        <div className={styles.cardHeading}>
          <span className={styles.icon}>
            <Smartphone size={22} />
          </span>
          <div>
            <h2>Ajustes del iPhone</h2>
            <p>
              El teléfono conserva el control final del sonido.
            </p>
          </div>
        </div>

        <ol className={styles.steps}>
          <li>
            En Mostrar previsualizaciones selecciona Siempre para ver el
            contenido completo en la pantalla bloqueada.
          </li>
          <li>Abre Ajustes del iPhone.</li>
          <li>Entra en Notificaciones.</li>
          <li>Selecciona Amperium OS.</li>
          <li>
            Activa los avisos en pantalla bloqueada y los sonidos disponibles.
          </li>
          <li>
            Revisa que Concentración no silencie Amperium OS.
          </li>
        </ol>

        <p className={styles.warning}>
          Una PWA puede solicitar el sonido normal de una notificación,
          pero no reproducir un tono personalizado ni insistir como una
          alarma del reloj. Esa modalidad requiere una aplicación nativa.
        </p>
      </article>
      </>
      ) : null}
    </section>
  )
}

export default ConfiguracionPage
