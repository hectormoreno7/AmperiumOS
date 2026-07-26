import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom'
import { useAuth } from '../../modules/auth/context/AuthContext'
import branding from '../../shared/constants/branding'
import app from '../../shared/constants/app'
import {
  enabledModules,
  getModuleByPath,
} from '../../shared/constants/modules'
import styles from './AppLayout.module.css'
import useCompanyConfiguration from '../../modules/configuracion/hooks/useCompanyConfiguration'

const RELEASE_STORAGE_KEY = 'amperium-last-seen-version'
const RELEASE_READ_EVENT = 'amperium-release-notes-read'
const OPEN_RELEASE_EVENT = 'amperium-open-release-notes'

function AppLayout() {
  const companyConfiguration =
    useCompanyConfiguration()
  const companyLogo =
    companyConfiguration.logoUrl
  const companyIcon =
    companyConfiguration.iconUrl
  const location = useLocation()
  const userMenuRef = useRef(null)
  const { user, logout } = useAuth()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false)

  const [userMenuOpen, setUserMenuOpen] =
    useState(false)

  const [loggingOut, setLoggingOut] =
    useState(false)


  const [hasUnreadReleaseNotes, setHasUnreadReleaseNotes] =
    useState(false)

  const currentModule = getModuleByPath(
    location.pathname,
  )

  const currentPageTitle =
    currentModule?.label ?? branding.appName

  const userEmail =
    user?.email ?? 'Usuario autorizado'

  useEffect(() => {
    const savedState = localStorage.getItem(
      'amperium-sidebar-collapsed',
    )

    if (savedState !== null) {
      setSidebarCollapsed(
        savedState === 'true',
      )
    }
  }, [])

  useEffect(() => {
    setMobileSidebarOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          event.target,
        )
      ) {
        setUserMenuOpen(false)
      }
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        setMobileSidebarOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    document.addEventListener(
      'touchstart',
      handleOutsideClick,
    )

    document.addEventListener(
      'keydown',
      handleEscapeKey,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )

      document.removeEventListener(
        'touchstart',
        handleOutsideClick,
      )

      document.removeEventListener(
        'keydown',
        handleEscapeKey,
      )
    }
  }, [])

  useEffect(() => {
    const updateUnreadState = () => {
      if (!app.isProduction) {
        setHasUnreadReleaseNotes(false)
        return
      }

      const lastSeenVersion = localStorage.getItem(
        RELEASE_STORAGE_KEY,
      )

      setHasUnreadReleaseNotes(
        lastSeenVersion !== app.version,
      )
    }

    updateUnreadState()

    window.addEventListener(
      RELEASE_READ_EVENT,
      updateUnreadState,
    )

    window.addEventListener(
      'storage',
      updateUnreadState,
    )

    return () => {
      window.removeEventListener(
        RELEASE_READ_EVENT,
        updateUnreadState,
      )

      window.removeEventListener(
        'storage',
        updateUnreadState,
      )
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed((currentState) => {
      const nextState = !currentState

      localStorage.setItem(
        'amperium-sidebar-collapsed',
        String(nextState),
      )

      return nextState
    })
  }

  const handleLogout = async () => {
    if (loggingOut) {
      return
    }

    const confirmed = window.confirm(
      '¿Quieres cerrar la sesión de Amperium OS?',
    )

    if (!confirmed) {
      return
    }

    setUserMenuOpen(false)
    setLoggingOut(true)

    try {
      await logout()
    } catch (error) {
      console.error(
        'No fue posible cerrar la sesión:',
        error,
      )

      window.alert(
        'No fue posible cerrar la sesión.',
      )
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div
      className={`${styles.appShell} ${
        sidebarCollapsed
          ? styles.sidebarCollapsed
          : ''
      }`}
    >
      <aside
        className={`${styles.sidebar} ${
          mobileSidebarOpen
            ? styles.sidebarMobileOpen
            : ''
        }`}
      >
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <NavLink
              to="/dashboard"
              className={styles.brand}
              aria-label="Ir al dashboard"
            >
              <img
                className={
                  styles.brandHorizontal
                }
                src={
                  companyLogo ||
                  branding.logos.horizontalSimpleDarkBackground
                }
                alt={branding.companyName}
              />

              <img
                className={styles.brandIsotipo}
                src={
                  companyIcon ||
                  companyLogo ||
                  branding.logos.isotipoDarkBackground
                }
                alt={branding.companyName}
              />
            </NavLink>

            <button
              type="button"
              className={
                styles.desktopCollapseButton
              }
              onClick={toggleSidebar}
              aria-label={
                sidebarCollapsed
                  ? 'Expandir menú lateral'
                  : 'Contraer menú lateral'
              }
              title={
                sidebarCollapsed
                  ? 'Expandir menú'
                  : 'Contraer menú'
              }
            >
              <span>
                {sidebarCollapsed ? '›' : '‹'}
              </span>
            </button>
          </div>

          <nav className={styles.navigation}>
            <span
              className={styles.navigationTitle}
            >
              Navegación
            </span>

            {enabledModules.map((module) => (
              <NavLink
                key={module.id}
                to={module.path}
                title={
                  sidebarCollapsed
                    ? module.label
                    : module.description
                }
                className={({ isActive }) =>
                  `${
                    styles.navigationItem
                  } ${
                    isActive
                      ? styles.navigationItemActive
                      : ''
                  }`
                }
              >
                <span
                  className={
                    styles.navigationIcon
                  }
                >
                  {module.icon}
                </span>

                <span
                  className={
                    styles.navigationLabel
                  }
                >
                  {module.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div
              className={
                styles.systemBrandCard
              }
            >
              <img
                src={
                  companyLogo ||
                  branding.appLogos.completeDarkBackground
                }
                alt={branding.appName}
                className={
                  styles.systemBrandLogo
                }
              />

              <span
                className={
                  styles.systemVersion
                }
              >
                Versión {app.version}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {mobileSidebarOpen && (
        <button
          type="button"
          className={styles.mobileOverlay}
          onClick={() =>
            setMobileSidebarOpen(false)
          }
          aria-label="Cerrar menú"
        />
      )}

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={
                styles.mobileMenuButton
              }
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Abrir menú"
            >
              ☰
            </button>

            <div
              className={
                styles.pageInformation
              }
            >
              <img
                src={
                  companyLogo ||
                  branding.appLogos.complete
                }
                alt={branding.appName}
                className={
                  styles.topbarBrandLogo
                }
              />

              <h1>{currentPageTitle}</h1>
            </div>
          </div>

          <div
            className={styles.topbarActions}
          >
            <button
              type="button"
              className={
                styles.notificationButton
              }
              onClick={() =>
                window.dispatchEvent(
                  new Event(OPEN_RELEASE_EVENT),
                )
              }
              aria-label={
                hasUnreadReleaseNotes
                  ? 'Ver novedades pendientes'
                  : 'Ver novedades de la versión'
              }
              title={
                hasUnreadReleaseNotes
                  ? 'Tienes novedades sin leer'
                  : 'Novedades de la versión'
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M10 21h4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              {hasUnreadReleaseNotes && (
                <span
                  className={
                    styles.notificationIndicator
                  }
                  aria-hidden="true"
                />
              )}
            </button>

            <div
              ref={userMenuRef}
              className={
                styles.userMenuContainer
              }
            >
              <button
                type="button"
                className={`${
                  styles.userMenu
                } ${
                  userMenuOpen
                    ? styles.userMenuActive
                    : ''
                }`}
                onClick={() =>
                  setUserMenuOpen(
                    (currentState) =>
                      !currentState,
                  )
                }
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="Abrir menú de usuario"
              >
                <div
                  className={styles.userAvatar}
                >
                  HM
                </div>

                <div
                  className={
                    styles.userInformation
                  }
                >
                  <strong>
                    Héctor Moreno
                  </strong>
                  <span>Administrador</span>
                </div>

                <span
                  className={
                    styles.userMenuArrow
                  }
                >
                  {userMenuOpen ? '⌃' : '⌄'}
                </span>
              </button>

              {userMenuOpen && (
                <div
                  className={
                    styles.userDropdown
                  }
                  role="menu"
                >
                  <div
                    className={
                      styles.userDropdownHeader
                    }
                  >
                    <strong>
                      Héctor Moreno
                    </strong>

                    <span>{userEmail}</span>
                  </div>

                  <NavLink
                    to="/configuracion"
                    className={
                      styles.userDropdownItem
                    }
                    role="menuitem"
                  >
                    <span>⚙</span>
                    Configuración
                  </NavLink>

                  <div
                    className={
                      styles.userDropdownDivider
                    }
                  />

                  <button
                    type="button"
                    className={`${
                      styles.userDropdownItem
                    } ${styles.logoutItem}`}
                    onClick={handleLogout}
                    role="menuitem"
                    disabled={loggingOut}
                  >
                    <span>↪</span>

                    {loggingOut
                      ? 'Cerrando sesión...'
                      : 'Cerrar sesión'}
                  </button>

                  <div
                    className={
                      styles.userDropdownVersion
                    }
                  >
                    Amperium OS v
                    {app.version}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
