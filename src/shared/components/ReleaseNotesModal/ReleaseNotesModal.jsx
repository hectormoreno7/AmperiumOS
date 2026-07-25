import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import app from '../../constants/app'
import releases from '../../constants/releases'
import styles from './ReleaseNotesModal.module.css'

const NOTIFICATIONS_STORAGE_KEY =
  'amperium-notifications'

const DELETED_STORAGE_KEY =
  'amperium-deleted-notifications'

const RELEASE_STORAGE_KEY =
  'amperium-last-seen-version'

const OPEN_EVENT =
  'amperium-open-release-notes'

const READ_EVENT =
  'amperium-release-notes-read'

const createReleaseNotification = (release) => ({
  id: `release-${release.version}`,
  type: 'release',
  title: release.title,
  summary: release.summary,
  version: release.version,
  date: release.date,
  changes: release.changes ?? [],
  read: false,
  createdAt: new Date().toISOString(),
})

const readStorageArray = (key) => {
  try {
    const savedValue =
      localStorage.getItem(key)

    if (!savedValue) {
      return []
    }

    const parsedValue =
      JSON.parse(savedValue)

    return Array.isArray(parsedValue)
      ? parsedValue
      : []
  } catch {
    return []
  }
}

const saveNotifications = (
  notifications,
) => {
  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notifications),
  )
}

const saveDeletedNotifications = (
  deletedIds,
) => {
  localStorage.setItem(
    DELETED_STORAGE_KEY,
    JSON.stringify(deletedIds),
  )
}

const buildNotificationHistory = () => {
  const savedNotifications =
    readStorageArray(
      NOTIFICATIONS_STORAGE_KEY,
    )

  const deletedIds =
    readStorageArray(
      DELETED_STORAGE_KEY,
    )

  const notificationsMap =
    new Map(
      savedNotifications.map(
        (notification) => [
          notification.id,
          notification,
        ],
      ),
    )

  releases.forEach((release) => {
    const notificationId =
      `release-${release.version}`

    if (
      deletedIds.includes(
        notificationId,
      )
    ) {
      return
    }

    const existingNotification =
      notificationsMap.get(
        notificationId,
      )

    if (existingNotification) {
      notificationsMap.set(
        notificationId,
        {
          ...createReleaseNotification(
            release,
          ),
          ...existingNotification,
          title: release.title,
          summary: release.summary,
          date: release.date,
          changes:
            release.changes ?? [],
        },
      )

      return
    }

    notificationsMap.set(
      notificationId,
      createReleaseNotification(
        release,
      ),
    )
  })

  return Array.from(
    notificationsMap.values(),
  ).sort((notificationA, notificationB) => {
    const versionA =
      notificationA.version
        .split('.')
        .map(Number)

    const versionB =
      notificationB.version
        .split('.')
        .map(Number)

    for (
      let index = 0;
      index <
      Math.max(
        versionA.length,
        versionB.length,
      );
      index += 1
    ) {
      const numberA =
        versionA[index] ?? 0

      const numberB =
        versionB[index] ?? 0

      if (numberA !== numberB) {
        return numberB - numberA
      }
    }

    return 0
  })
}

function ReleaseNotesModal() {
  const [open, setOpen] =
    useState(false)

  const [
    selectedNotificationId,
    setSelectedNotificationId,
  ] = useState(null)

  const [
    notifications,
    setNotifications,
  ] = useState(() =>
    buildNotificationHistory(),
  )

  const selectedNotification =
    useMemo(
      () =>
        notifications.find(
          (notification) =>
            notification.id ===
            selectedNotificationId,
        ) ?? null,
      [
        notifications,
        selectedNotificationId,
      ],
    )

  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.read,
        ).length,
      [notifications],
    )

  const notifyReadStateChanged = () => {
    window.dispatchEvent(
      new Event(READ_EVENT),
    )
  }

  const updateNotifications = (
    updater,
  ) => {
    setNotifications(
      (currentNotifications) => {
        const nextNotifications =
          typeof updater === 'function'
            ? updater(
                currentNotifications,
              )
            : updater

        saveNotifications(
          nextNotifications,
        )

        return nextNotifications
      },
    )
  }

  const markAsRead = (
    notificationId,
  ) => {
    updateNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) =>
            notification.id ===
            notificationId
              ? {
                  ...notification,
                  read: true,
                }
              : notification,
        ),
    )

    const notification =
      notifications.find(
        (currentNotification) =>
          currentNotification.id ===
          notificationId,
      )

    if (
      notification?.version ===
      app.version
    ) {
      localStorage.setItem(
        RELEASE_STORAGE_KEY,
        app.version,
      )
    }

    notifyReadStateChanged()
  }

  const openNotification = (
    notificationId,
  ) => {
    setSelectedNotificationId(
      notificationId,
    )

    markAsRead(notificationId)
  }

  const markAllAsRead = () => {
    updateNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) => ({
            ...notification,
            read: true,
          }),
        ),
    )

    localStorage.setItem(
      RELEASE_STORAGE_KEY,
      app.version,
    )

    notifyReadStateChanged()
  }

  const deleteNotification = (
    notificationId,
  ) => {
    const confirmed =
      window.confirm(
        '¿Eliminar esta notificación?',
      )

    if (!confirmed) {
      return
    }

    const deletedIds =
      readStorageArray(
        DELETED_STORAGE_KEY,
      )

    if (
      !deletedIds.includes(
        notificationId,
      )
    ) {
      saveDeletedNotifications([
        ...deletedIds,
        notificationId,
      ])
    }

    updateNotifications(
      (currentNotifications) =>
        currentNotifications.filter(
          (notification) =>
            notification.id !==
            notificationId,
        ),
    )

    if (
      selectedNotificationId ===
      notificationId
    ) {
      setSelectedNotificationId(null)
    }

    notifyReadStateChanged()
  }

  const clearHistory = () => {
    if (
      notifications.length === 0
    ) {
      return
    }

    const confirmed =
      window.confirm(
        '¿Borrar todo el historial de notificaciones?',
      )

    if (!confirmed) {
      return
    }

    const currentDeletedIds =
      readStorageArray(
        DELETED_STORAGE_KEY,
      )

    const newDeletedIds =
      notifications.map(
        (notification) =>
          notification.id,
      )

    saveDeletedNotifications(
      Array.from(
        new Set([
          ...currentDeletedIds,
          ...newDeletedIds,
        ]),
      ),
    )

    updateNotifications([])

    setSelectedNotificationId(null)

    localStorage.setItem(
      RELEASE_STORAGE_KEY,
      app.version,
    )

    notifyReadStateChanged()
  }

  const closePanel = () => {
    setOpen(false)
    setSelectedNotificationId(null)
  }

  useEffect(() => {
    const refreshedNotifications =
      buildNotificationHistory()

    setNotifications(
      refreshedNotifications,
    )

    saveNotifications(
      refreshedNotifications,
    )
  }, [])

  useEffect(() => {
    const currentVersionNotification =
      notifications.find(
        (notification) =>
          notification.version ===
          app.version,
      )

    if (
      currentVersionNotification &&
      !currentVersionNotification.read
    ) {
      localStorage.removeItem(
        RELEASE_STORAGE_KEY,
      )

      notifyReadStateChanged()
    }
  }, [notifications])

  useEffect(() => {
    const openNotificationCenter =
      () => {
        const refreshedNotifications =
          buildNotificationHistory()

        setNotifications(
          refreshedNotifications,
        )

        saveNotifications(
          refreshedNotifications,
        )

        setOpen(true)
      }

    window.addEventListener(
      OPEN_EVENT,
      openNotificationCenter,
    )

    return () => {
      window.removeEventListener(
        OPEN_EVENT,
        openNotificationCenter,
      )
    }
  }, [])

  useEffect(() => {
    const handleEscape = (event) => {
      if (
        event.key === 'Escape' &&
        open
      ) {
        closePanel()
      }
    }

    window.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closePanel()
        }
      }}
    >
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
      >
        <header
          className={styles.header}
        >
          <div>
            <span
              className={styles.eyebrow}
            >
              Amperium OS
            </span>

            <h2
              id="notification-center-title"
            >
              Notificaciones
            </h2>

            <p>
              {unreadCount > 0
                ? `${unreadCount} sin leer`
                : 'Todo está al día'}
            </p>
          </div>

          <button
            type="button"
            className={
              styles.closeButton
            }
            onClick={closePanel}
            aria-label="Cerrar notificaciones"
          >
            ×
          </button>
        </header>

        <div
          className={styles.toolbar}
        >
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={
              unreadCount === 0
            }
          >
            Marcar todo como leído
          </button>

          <button
            type="button"
            className={
              styles.clearButton
            }
            onClick={clearHistory}
            disabled={
              notifications.length === 0
            }
          >
            Borrar historial
          </button>
        </div>

        <div
          className={styles.content}
        >
          <aside
            className={
              styles.notificationsList
            }
          >
            {notifications.length === 0 ? (
              <div
                className={
                  styles.emptyState
                }
              >
                <span>🔔</span>

                <strong>
                  Sin notificaciones
                </strong>

                <p>
                  Las novedades del sistema
                  aparecerán aquí.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <article
                    key={
                      notification.id
                    }
                    className={`${
                      styles.notificationCard
                    } ${
                      !notification.read
                        ? styles.unreadCard
                        : ''
                    } ${
                      selectedNotificationId ===
                      notification.id
                        ? styles.selectedCard
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      className={
                        styles.notificationMain
                      }
                      onClick={() =>
                        openNotification(
                          notification.id,
                        )
                      }
                    >
                      <span
                        className={
                          styles.notificationIcon
                        }
                      >
                        ↑
                      </span>

                      <span
                        className={
                          styles.notificationText
                        }
                      >
                        <span
                          className={
                            styles.notificationTop
                          }
                        >
                          <strong>
                            {
                              notification.title
                            }
                          </strong>

                          {!notification.read && (
                            <span
                              className={
                                styles.unreadDot
                              }
                              aria-label="Sin leer"
                            />
                          )}
                        </span>

                        <span
                          className={
                            styles.notificationSummary
                          }
                        >
                          {
                            notification.summary
                          }
                        </span>

                        <span
                          className={
                            styles.notificationMeta
                          }
                        >
                          Versión{' '}
                          {
                            notification.version
                          }{' '}
                          ·{' '}
                          {
                            notification.date
                          }
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        styles.deleteButton
                      }
                      onClick={() =>
                        deleteNotification(
                          notification.id,
                        )
                      }
                      aria-label={`Eliminar notificación ${notification.title}`}
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </article>
                ),
              )
            )}
          </aside>

          <section
            className={
              styles.notificationDetail
            }
          >
            {selectedNotification ? (
              <>
                <div
                  className={
                    styles.detailHeader
                  }
                >
                  <span>
                    Actualización del sistema
                  </span>

                  <h3>
                    {
                      selectedNotification.title
                    }
                  </h3>

                  <p>
                    Versión{' '}
                    {
                      selectedNotification.version
                    }
                  </p>
                </div>

                <p
                  className={
                    styles.detailSummary
                  }
                >
                  {
                    selectedNotification.summary
                  }
                </p>

                <ul
                  className={
                    styles.changesList
                  }
                >
                  {selectedNotification.changes.map(
                    (change) => (
                      <li key={change}>
                        {change}
                      </li>
                    ),
                  )}
                </ul>

                <footer
                  className={
                    styles.detailFooter
                  }
                >
                  <span>
                    {
                      selectedNotification.date
                    }
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      deleteNotification(
                        selectedNotification.id,
                      )
                    }
                  >
                    Eliminar notificación
                  </button>
                </footer>
              </>
            ) : (
              <div
                className={
                  styles.selectState
                }
              >
                <span>🔔</span>

                <strong>
                  Selecciona una notificación
                </strong>

                <p>
                  Aquí podrás consultar todos
                  los cambios de cada versión.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

export default ReleaseNotesModal