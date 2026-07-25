import { useState } from 'react'
import branding from '../../../shared/constants/branding'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

const getLoginErrorMessage = (error) => {
  const errorCode = error?.code ?? ''

  if (
    errorCode === 'auth/invalid-credential' ||
    errorCode === 'auth/wrong-password' ||
    errorCode === 'auth/user-not-found'
  ) {
    return 'El correo o la contraseña no son correctos.'
  }

  if (errorCode === 'auth/invalid-email') {
    return 'El correo electrónico no es válido.'
  }

  if (errorCode === 'auth/user-disabled') {
    return 'Este usuario se encuentra desactivado.'
  }

  if (errorCode === 'auth/too-many-requests') {
    return 'Se realizaron demasiados intentos. Intenta nuevamente más tarde.'
  }

  if (errorCode === 'auth/network-request-failed') {
    return 'No fue posible conectar. Revisa tu conexión a internet.'
  }

  return error?.message || 'No fue posible iniciar sesión.'
}

function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] =
    useState(false)
  const [submitting, setSubmitting] =
    useState(false)
  const [errorMessage, setErrorMessage] =
    useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (submitting) {
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      await login(email, password)

      sessionStorage.setItem(
        'amperium-show-login-toast',
        'true',
      )
    } catch (error) {
      console.error(
        'No fue posible iniciar sesión:',
        error,
      )

      setErrorMessage(
        getLoginErrorMessage(error),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.loginPanel}>
        <div className={styles.brandSection}>
          <div className={styles.brandDecoration} />

          <div className={styles.brandContent}>
            <img
              src={
                branding.appLogos
                  .completeDarkBackground
              }
              alt={branding.appName}
              className={styles.logo}
            />

            <p>
              Administración de clientes,
              servicios y operaciones.
            </p>
          </div>

          <span className={styles.slogan}>
            {branding.slogan}
          </span>
        </div>

        <div className={styles.formSection}>
          <div className={styles.formWrapper}>
            <header className={styles.formHeader}>
              <h1>Iniciar sesión</h1>

              <p>
                Ingresa con tu cuenta autorizada.
              </p>
            </header>

            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >
              <label className={styles.field}>
                <span>Correo electrónico</span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </label>

              <label className={styles.field}>
                <span>Contraseña</span>

                <div
                  className={styles.passwordField}
                >
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={submitting}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (currentValue) =>
                          !currentValue,
                      )
                    }
                    disabled={submitting}
                  >
                    {showPassword
                      ? 'Ocultar'
                      : 'Mostrar'}
                  </button>
                </div>
              </label>

              {errorMessage && (
                <div
                  className={styles.errorMessage}
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting}
              >
                {submitting
                  ? 'Verificando...'
                  : 'Entrar'}
              </button>
            </form>

            <span className={styles.restricted}>
              Acceso exclusivo para usuarios
              autorizados.
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage