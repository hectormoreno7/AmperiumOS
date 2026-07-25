const app = {
  name: 'Amperium OS',
  version: __APP_VERSION__,
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  copyright: `© ${new Date().getFullYear()} Amperium`,
}

export default app
