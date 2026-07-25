import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import Toast from '../../../shared/components/toast/Toast'
import branding from '../../../shared/constants/branding'
import LoginPage from './LoginPage'
import { useAuth } from '../context/AuthContext'
import styles from './AuthGate.module.css'

function AuthGate({ children }) {
  const {
    user,
    authLoading,
    isAuthenticated,
  } = useAuth()

  const [toast, setToast] = useState({
    open: false,
    title: '',
    message: '',
    type: 'success',
  })

  const closeToast = useCallback(() => {
    setToast((currentToast) => ({
      ...currentToast,
      open: false,
    }))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const shouldShowToast =
      sessionStorage.getItem(
        'amperium-show-login-toast',
      )

    if (shouldShowToast !== 'true') {
      return
    }

    sessionStorage.removeItem(
      'amperium-show-login-toast',
    )

    setToast({
      open: true,
      title: 'Sesión iniciada',
      message: user?.email
        ? `Bienvenido, ${user.email}`
        : 'Bienvenido a Amperium OS.',
      type: 'success',
    })
  }, [isAuthenticated, user])

  if (authLoading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingMark}>
          <img
            src={branding.appLogos.isotipo}
            alt=""
          />
        </div>

        <img
          src={branding.appLogos.complete}
          alt={branding.appName}
          className={styles.loadingLogo}
        />

        <p>Comprobando acceso...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className={styles.authenticatedApp}>
      {children}

      <Toast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        duration={3500}
        onClose={closeToast}
      />
    </div>
  )
}

export default AuthGate