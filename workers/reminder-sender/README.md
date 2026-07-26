# Emisor gratuito de recordatorios

Este Worker revisa Agenda y Servicios cada minuto y envía los avisos mediante Firebase Cloud Messaging.

Variables secretas requeridas en Cloudflare:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Se configuran con `npx wrangler secret put NOMBRE`.

La cuenta gratuita de Cloudflare Workers es suficiente para el uso personal previsto. No subas la clave privada al repositorio.
