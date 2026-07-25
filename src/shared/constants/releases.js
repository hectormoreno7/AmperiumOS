const releases = [
  {
    version: '0.2.6',
    date: '24 de julio de 2026',
    title: 'Centro de notificaciones',
    summary:
      'Amperium OS ahora conserva un historial de novedades y actualizaciones.',
    changes: [
      'Historial permanente de notificaciones.',
      'Notificaciones leídas y no leídas.',
      'Eliminación individual de notificaciones.',
      'Opción para borrar todo el historial.',
      'Versión visible en cada notificación.',
      'Aviso automático cuando se publica una versión nueva.',
      'Las notificaciones anteriores permanecen disponibles.',
    ],
  },
  {
    version: '0.2.5',
    date: '23 de julio de 2026',
    title: 'Nuevo diseño de cotizaciones',
    summary:
      'Se mejoró la presentación del PDF de cotizaciones utilizando la identidad visual de Amperium.',
    changes: [
      'Nuevo encabezado para cotizaciones.',
      'Logo simple de Amperium.',
      'Marca de agua con isotipo.',
      'Hoja de términos y condiciones.',
      'Diseño en oro satinado.',
    ],
  },
  {
    version: '0.2.4',
    date: '23 de julio de 2026',
    title: 'Mejoras del PDF',
    summary:
      'Se incorporaron elementos visuales y comerciales al PDF de cotizaciones.',
    changes: [
      'Pie de página empresarial.',
      'Firmas de cliente y responsable.',
      'Imagen o esquema del proyecto.',
      'Alcances y exclusiones.',
    ],
  },
  {
    version: '0.2.3',
    date: '23 de julio de 2026',
    title: 'Cotizaciones, IVA y PDF',
    summary:
      'Se agregó el cálculo comercial para materiales, equipos y servicios.',
    changes: [
      'Cálculo de IVA para materiales.',
      'Ganancia porcentual por concepto.',
      'Guardar cotizaciones como borrador.',
      'Finalizar cotización.',
      'Generación inicial del PDF.',
    ],
  },
  {
    version: '0.2.2',
    date: '23 de julio de 2026',
    title: 'Formulario ampliado de cotizaciones',
    summary:
      'Se agregaron datos comerciales, firmas, alcances y condiciones.',
    changes: [
      'Ganancia individual por concepto.',
      'Unidades de pieza, metro, servicio y lote.',
      'Anticipo calculado automáticamente.',
      'Condiciones generales editables.',
      'Alcances incluidos y no incluidos.',
    ],
  },
  {
    version: '0.2.1',
    date: '23 de julio de 2026',
    title: 'Módulo de cotizaciones',
    summary:
      'Primera versión funcional del módulo de cotizaciones.',
    changes: [
      'Creación de cotizaciones.',
      'Edición de borradores.',
      'Selección de clientes.',
      'Conceptos y totales.',
      'Guardado en Firestore.',
    ],
  },
  {
    version: '0.2.0',
    date: '23 de julio de 2026',
    title: 'Core del sistema',
    summary:
      'Nueva base técnica compartida para folios, Firestore, fechas, moneda, estados y documentos.',
    changes: [
      'Generador global y transaccional de folios.',
      'Formato oficial AMP-C, AMP-N, AMP-SC y AMP-SN.',
      'Servicio reutilizable para operaciones con Firestore.',
      'Configuración central de Amperium.',
      'Utilidades comunes para fechas, moneda e impuestos.',
      'Estados oficiales para cotizaciones, pagos y servicios.',
      'Base común para la generación y descarga de documentos.',
    ],
  },
  {
    version: '0.1.0',
    date: '23 de julio de 2026',
    title: 'Primera base operativa',
    summary:
      'Primera versión formal de Amperium OS con identidad visual, acceso seguro y administración inicial de clientes.',
    changes: [
      'Nueva identidad visual de Amperium OS.',
      'Inicio de sesión conectado con Firebase Authentication.',
      'Layout principal adaptable para computadora y teléfono.',
      'Dashboard inicial.',
      'Módulo de clientes conectado con Firestore.',
      'Preparación para actualizaciones automáticas de la aplicación.',
    ],
  },
]

export const currentRelease = releases[0]

export const getReleaseByVersion = (version) =>
  releases.find(
    (release) => release.version === version,
  ) ?? currentRelease

export default releases