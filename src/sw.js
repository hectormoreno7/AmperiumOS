/// <reference lib="webworker" />
import {
  clientsClaim,
} from 'workbox-core'
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
} from 'workbox-precaching'
import {
  createHandlerBoundToURL,
} from 'workbox-precaching'
import {
  NavigationRoute,
  registerRoute,
} from 'workbox-routing'
import {
  initializeApp,
} from 'firebase/app'
import {
  getMessaging,
  onBackgroundMessage,
} from 'firebase/messaging/sw'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
clientsClaim()

self.addEventListener(
  'message',
  (event) => {
    if (
      event.data?.type ===
      'SKIP_WAITING'
    ) {
      self.skipWaiting()
      event.ports?.[0]?.postMessage({
        updated: true,
      })
    }
  },
)

registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL(
      'index.html',
    ),
  ),
)

const firebaseApp = initializeApp({
  apiKey:
    import.meta.env
      .VITE_FIREBASE_API_KEY,
  authDomain:
    import.meta.env
      .VITE_FIREBASE_AUTH_DOMAIN,
  projectId:
    import.meta.env
      .VITE_FIREBASE_PROJECT_ID,
  storageBucket:
    import.meta.env
      .VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    import.meta.env
      .VITE_FIREBASE_APP_ID,
})

const messaging =
  getMessaging(firebaseApp)

onBackgroundMessage(
  messaging,
  (payload) => {
    const notification =
      payload.notification || {}
    const data = payload.data || {}

    self.registration.showNotification(
      notification.title ||
        data.title ||
        'Recordatorio de Amperium OS',
      {
        body:
          notification.body ||
          data.body ||
          'Tienes una actividad programada.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag:
          data.eventId ||
          data.serviceId ||
          'amperium-reminder',
        renotify: true,
        silent: false,
        data: {
          url:
            data.url ||
            '/agenda',
        },
      },
    )
  },
)

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close()
    const url =
      event.notification.data?.url ||
      '/agenda'

    event.waitUntil(
      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      }).then((clients) => {
        const existing =
          clients.find((client) =>
            'focus' in client,
          )

        if (existing) {
          existing.navigate(url)
          return existing.focus()
        }

        return self.clients.openWindow(url)
      }),
    )
  },
)
