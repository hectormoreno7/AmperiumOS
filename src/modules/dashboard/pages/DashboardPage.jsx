import { Link } from 'react-router-dom'
import PageHeader from '../../../shared/components/PageHeader/PageHeader'
import StatCard from '../../../shared/components/StatCard/StatCard'
import branding from '../../../shared/constants/branding'
import styles from './DashboardPage.module.css'

const formatCurrentDate = () => {
  const formattedDate =
    new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())

  return (
    formattedDate.charAt(0).toUpperCase() +
    formattedDate.slice(1)
  )
}

const quickActions = [
  {
    title: 'Nueva cotización',
    description:
      'Crear una propuesta comercial.',
    path: '/cotizaciones',
    icon: '▤',
  },
  {
    title: 'Nuevo cliente',
    description:
      'Registrar un cliente en el sistema.',
    path: '/clientes',
    icon: '♙',
  },
  {
    title: 'Nuevo servicio',
    description:
      'Programar o registrar un servicio.',
    path: '/servicios',
    icon: '⚒',
  },
  {
    title: 'Abrir agenda',
    description:
      'Consultar próximos trabajos.',
    path: '/agenda',
    icon: '◷',
  },
]

function DashboardPage() {
  const currentHour = new Date().getHours()

  const greeting =
    currentHour < 12
      ? 'Buenos días'
      : currentHour < 19
        ? 'Buenas tardes'
        : 'Buenas noches'

  return (
    <section className={styles.dashboard}>
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <span className={styles.date}>
            {formatCurrentDate()}
          </span>

          <h2>{greeting}, Héctor</h2>

          <p>
            Aquí tienes el resumen general del
            sistema.
          </p>
        </div>

        <div className={styles.welcomeBrand}>
<img
  src={
    branding.logos
      .horizontalSimpleDarkBackground
  }
  alt={branding.companyName}
/>
        </div>
      </div>

      <PageHeader
        title="Resumen general"
        description="Indicadores principales de la operación de Amperium."
      />

      <div className={styles.statsGrid}>
        <StatCard
          title="Servicios para hoy"
          value="0"
          description="No hay servicios programados."
          icon="⚒"
          trend="Hoy"
        />

        <StatCard
          title="Cotizaciones vigentes"
          value="0"
          description="Cotizaciones pendientes de seguimiento."
          icon="▤"
          trend="10 días"
        />

        <StatCard
          title="Clientes registrados"
          value="0"
          description="Base general de clientes."
          icon="♙"
          trend="Total"
        />

        <StatCard
          title="Pendiente de cobro"
          value="$0.00"
          description="Saldos pendientes registrados."
          icon="$"
          trend="Mes"
        />
      </div>

      <div className={styles.dashboardGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Acciones rápidas</h3>
              <p>
                Accesos principales del sistema.
              </p>
            </div>
          </div>

          <div className={styles.quickActions}>
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className={styles.quickAction}
              >
                <span
                  className={
                    styles.quickActionIcon
                  }
                >
                  {action.icon}
                </span>

                <div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>

                <span
                  className={
                    styles.quickActionArrow
                  }
                >
                  ›
                </span>
              </Link>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Próximos servicios</h3>
              <p>
                Trabajos programados en agenda.
              </p>
            </div>

            <Link to="/agenda">
              Ver agenda
            </Link>
          </div>

          <div className={styles.emptyState}>
            <div
              className={styles.emptyStateIcon}
            >
              ◷
            </div>

            <strong>
              No hay servicios próximos
            </strong>

            <p>
              Los servicios programados
              aparecerán aquí automáticamente.
            </p>

            <Link to="/servicios">
              Registrar servicio
            </Link>
          </div>
        </article>
      </div>

      <article className={styles.activityPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Actividad reciente</h3>
            <p>
              Últimos movimientos realizados en
              el sistema.
            </p>
          </div>
        </div>

        <div className={styles.activityEmpty}>
          <span>◇</span>
          <p>
            Aún no hay actividad registrada.
          </p>
        </div>
      </article>
    </section>
  )
}

export default DashboardPage