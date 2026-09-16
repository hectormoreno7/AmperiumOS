const modules = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: '⌂',
    description: 'Resumen general de Amperium OS.',
    enabled: true,
  },
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: '♙',
    description: 'Clientes, contactos e historial.',
    enabled: true,
  },
  {
    id: 'cotizaciones',
    label: 'Cotizaciones',
    path: '/cotizaciones',
    icon: '▤',
    description: 'Creación y seguimiento de cotizaciones.',
    enabled: true,
  },
  {
    id: 'servicios',
    label: 'Servicios',
    path: '/servicios',
    icon: '⚒',
    description: 'Registro y seguimiento de servicios.',
    enabled: true,
  },
  {
    id: 'notas',
    label: 'Servicio express',
    path: '/notas',
    icon: '▧',
    description: 'Trabajos rápidos, cobros y recibos.',
    enabled: true,
  },
  {
    id: 'listas',
    label: 'Listas',
    path: '/listas',
    icon: '✓',
    description: 'Pendientes generales o vinculados.',
    enabled: true,
  },
  {
    id: 'historial',
    label: 'Historial',
    path: '/historial',
    icon: '◫',
    description: 'Registros finalizados y liquidados.',
    enabled: true,
  },
  {
    id: 'agenda',
    label: 'Agenda',
    path: '/agenda',
    icon: '◷',
    description: 'Servicios, visitas y recordatorios.',
    enabled: true,
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    path: '/configuracion',
    icon: '⚙',
    description: 'Configuración general del sistema.',
    enabled: true,
  },
]

export const enabledModules = modules.filter((module) => module.enabled)

export const getModuleByPath = (pathname) =>
  modules.find((module) => module.path === pathname)

export default modules
