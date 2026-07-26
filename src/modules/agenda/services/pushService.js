import {
  getMessaging,
  getToken,
  isSupported,
} from 'firebase/messaging'
import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  app,
  auth,
  db,
} from '../../../config/firebase'

export const getPushAvailability =
  async () => {
    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      return 'unsupported'
    }

    if (!(await isSupported())) {
      return 'unsupported'
    }

    if (
      !import.meta.env
        .VITE_FIREBASE_VAPID_KEY
    ) {
      return 'unconfigured'
    }

    return Notification.permission
  }

export const enablePushNotifications =
  async () => {
    const vapidKey =
      import.meta.env
        .VITE_FIREBASE_VAPID_KEY

    if (!vapidKey) {
      const configurationError =
        new Error(
          'Los avisos todavía requieren completar su configuración de envío.',
        )
      configurationError.code =
        'push/unconfigured'
      throw configurationError
    }

    const permission =
      await Notification.requestPermission()

    if (permission !== 'granted') {
      throw new Error(
        'El permiso de notificaciones no fue concedido.',
      )
    }

    const registration =
      await navigator.serviceWorker.ready
    const messaging = getMessaging(app)
    const token = await getToken(
      messaging,
      {
        vapidKey,
        serviceWorkerRegistration:
          registration,
      },
    )

    if (!token) {
      throw new Error(
        'No fue posible registrar este dispositivo.',
      )
    }

    const userId =
      auth.currentUser?.uid

    if (!userId) {
      throw new Error(
        'Inicia sesión antes de activar las notificaciones.',
      )
    }

    await setDoc(
      doc(
        db,
        'usuarios',
        userId,
        'dispositivos',
        token,
      ),
      {
        token,
        platform:
          navigator.platform || '',
        userAgent:
          navigator.userAgent,
        enabled: true,
        updatedAt:
          serverTimestamp(),
      },
      { merge: true },
    )

    return token
  }

export const sendTestNotification =
  async () => {
    const availability =
      await getPushAvailability()

    if (availability !== 'granted') {
      throw new Error(
        'Activa primero el permiso de notificaciones.',
      )
    }

    const registration =
      await navigator.serviceWorker.ready

    await registration.showNotification(
      'Prueba de Amperium OS',
      {
        body:
          'Los avisos están activos en este dispositivo.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `amperium-test-${Date.now()}`,
        silent: false,
        data: {
          url: '/configuracion',
        },
      },
    )
  }
