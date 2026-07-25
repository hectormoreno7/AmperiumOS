import logoHorizontal from '../../assets/branding/logos/logo-horizontal.svg'
import logoHorizontalNegro from '../../assets/branding/logos/logo-horizontal-negro.svg'

import logoHorizontalSimple from '../../assets/branding/logos/logo-horizontal-simple.svg'
import logoHorizontalSimpleNegro from '../../assets/branding/logos/logo-horizontal-simple-negro.svg'

import isotipo from '../../assets/branding/logos/isotipo.svg'
import isotipoNegro from '../../assets/branding/logos/isotipo-negro.svg'

const branding = {
  companyName: 'Amperium',
  appName: 'Amperium OS',
  shortName: 'Amperium',
  slogan: 'De la idea a la energía',

  contact: {
    phone: '+52 228 405 5421',
    email: 'amperiumoficial@gmail.com',
    instagram: '@amperiumoficial',
  },

  colors: {
    gold: '#D4A017',
    black: '#000000',
    graphite: '#242424',
    gray: '#D9DBE2',
    white: '#FFFFFF',
  },

  /*
   * Identidad comercial de Amperium.
   * Se conserva para cotizaciones, notas, PDFs
   * y documentos comerciales.
   */
  logos: {
    horizontal: logoHorizontal,
    horizontalDarkBackground: logoHorizontalNegro,

    horizontalSimple: logoHorizontalSimple,
    horizontalSimpleDarkBackground: logoHorizontalSimpleNegro,

    isotipo,
    isotipoDarkBackground: isotipoNegro,
  },

  /*
   * Identidad exclusiva de Amperium OS.
   */
  appLogos: {
    complete:
      '/assets/branding/amperium-os/logo-completo.png',

    completeDarkBackground:
      '/assets/branding/amperium-os/logo-completo-negro.png',

    isotipo:
      '/assets/branding/amperium-os/isotipo.png',
  },
}

export default branding