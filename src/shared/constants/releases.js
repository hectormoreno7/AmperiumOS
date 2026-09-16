const releases = [
  {
    version: '1.1.0',
    date: '25 de julio de 2026',
    title: 'Listas prácticas',
    summary:
      'Se incorporan checklists generales y vinculados al trabajo.',
    changes: [
      'Nuevo módulo de Listas con casillas para marcar pendientes.',
      'Listas generales sin configuración obligatoria.',
      'Vinculación opcional con cotizaciones o servicios.',
      'Acceso Lista desde cada cotización y servicio.',
      'Notas comerciales renombradas como Servicio express.',
      'Corrección del detalle de notificaciones en iPhone.',
    ],
  },
  {
    version: '1.0.1',
    date: '25 de julio de 2026',
    title: 'Avisos y tasa de IVA',
    summary:
      'Se mejora la apertura de avisos y el control de recordatorios de servicios.',
    changes: [
      'Las notificaciones abren directamente su sección en la aplicación.',
      'IVA fijo del 16%, sin posibilidad de modificación.',
      'Avisos automáticos para servicios programados.',
      'Control para activar o desactivar el aviso desde cada servicio.',
    ],
  },
  {
    version: '1.0.0',
    date: '25 de julio de 2026',
    title: 'Primera versión estable',
    summary:
      'Amperium OS queda listo para uso personal con clientes, cotizaciones, servicios, notas, agenda y configuración.',
    changes: [
      'Primera versión estable para uso diario.',
      'Clientes, cotizaciones, servicios y notas conectados.',
      'Agenda con recordatorios y notificaciones en segundo plano.',
      'Contenido completo de avisos administrado por la aplicación.',
      'IVA de notas vinculado a la configuración de empresa.',
      'Documentos PDF con identidad personalizable.',
      'Configuración de empresa organizada por secciones.',
      'Actualizaciones automáticas de la aplicación instalada.',
    ],
  },
  {
    version: '0.4.0',
    date: '25 de julio de 2026',
    title: 'Avisos y configuración',
    summary:
      'Amperium OS incorpora la administración y prueba de notificaciones por dispositivo.',
    changes: [
      'Nueva sección de Configuración.',
      'Estado del permiso de notificaciones.',
      'Activación desde un interruptor.',
      'Notificación inmediata de prueba.',
      'Solicitud del sonido predeterminado del dispositivo.',
      'Guía de permisos y modos de Concentración en iPhone.',
      'Configuración de empresa, colores, logo, firma y valores financieros.',
      'Garantías y términos predeterminados.',
      'Contenido visible y prioritario en recordatorios enviados.',
      'Los servicios finalizados dejan de aparecer en Agenda.',
      'Recordatorios simplificados con fecha y hora destacadas.',
      'Historial automático de recordatorios vencidos.',
      'Nuevo módulo de notas rápidas con folio, pago y firma.',
      'Notas con partidas, IVA opcional y medios de pago.',
      'PDF de nota generado únicamente bajo solicitud.',
      'Eliminación segura de fichas de clientes.',
      'Ventana de notas con encabezado claro y logotipo.',
      'Configuración organizada por menús y subsecciones.',
      'Logotipo e isotipo personalizables en la interfaz.',
    ],
  },
  {
    version: '0.3.0',
    date: '25 de julio de 2026',
    title: 'Agenda y recordatorios',
    summary:
      'Amperium OS incorpora una agenda enfocada en recordatorios rápidos y eventos.',
    changes: [
      'Creación de recordatorios rápidos.',
      'Avisos en 10 minutos, 30 minutos, 1 hora o 3 horas.',
      'Programación manual por fecha y hora.',
      'Eventos con horarios, clientes y ubicaciones.',
      'Integración de servicios programados con la agenda.',
      'Compatibilidad con notificaciones en el teléfono.',
      'Nuevo interruptor de permisos para los avisos de Agenda.',
      'Instalación inmediata de actualizaciones en iPhone.',
      'Corrección del guardado y las llamadas a teléfonos de clientes.',
    ],
  },
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
