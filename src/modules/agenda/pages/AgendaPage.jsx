import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  subscribeToClients,
} from '../../clientes/services/clientesStorage'
import {
  subscribeToServices,
} from '../../servicios/services/serviciosService'
import AgendaEventModal from '../components/AgendaEventModal'
import {
  createAgendaEvent,
  removeAgendaEvent,
  subscribeToAgenda,
  updateAgendaEvent,
  updateAgendaEventStatus,
} from '../services/agendaService'
import {
  enablePushNotifications,
  getPushAvailability,
} from '../services/pushService'
import styles from './AgendaPage.module.css'
import notificationStyles from './AgendaNotifications.module.css'
import historyStyles from './AgendaHistory.module.css'

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    date.getDate(),
  ).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fromDateKey = (key) => {
  const [year, month, day] = key
    .split('-')
    .map(Number)
  return new Date(
    year,
    month - 1,
    day,
  )
}

const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const addHour = (time) => {
  const [hours, minutes] = time
    .split(':')
    .map(Number)
  const total =
    hours * 60 + minutes + 60
  return `${String(
    Math.floor(total / 60) % 24,
  ).padStart(2, '0')}:${String(
    total % 60,
  ).padStart(2, '0')}`
}

const DAY_FORMAT = new Intl.DateTimeFormat(
  'es-MX',
  {
    weekday: 'short',
    day: 'numeric',
  },
)

const LONG_DATE =
  new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const TYPE_LABELS = {
  personal: 'Personal',
  llamada: 'Llamada',
  visita: 'Visita',
  consulta: 'Consulta',
  servicio: 'Servicio',
}

function AgendaPage() {
  const [events, setEvents] =
    useState([])
  const [services, setServices] =
    useState([])
  const [clients, setClients] =
    useState([])
  const [selectedDate, setSelectedDate] =
    useState(toDateKey(new Date()))
  const [modalOpen, setModalOpen] =
    useState(false)
  const [editingEvent, setEditingEvent] =
    useState(null)
  const [saving, setSaving] =
    useState(false)
  const [error, setError] =
    useState('')
  const [pushStatus, setPushStatus] =
    useState('default')
  const [pushNotice, setPushNotice] =
    useState('')
  const [currentTime, setCurrentTime] =
    useState(() => Date.now())

  useEffect(() => {
    const unsubscribeAgenda =
      subscribeToAgenda(
        setEvents,
        (agendaError) =>
          setError(
            agendaError?.message ||
              'No fue posible cargar la agenda.',
          ),
      )
    const unsubscribeServices =
      subscribeToServices(
        setServices,
        (servicesError) =>
          setError(
            servicesError?.message ||
              'No fue posible cargar los servicios.',
          ),
      )
    const unsubscribeClients =
      subscribeToClients(setClients)

    getPushAvailability().then(
      setPushStatus,
    )

    return () => {
      unsubscribeAgenda()
      unsubscribeServices()
      unsubscribeClients()
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(
      () => setCurrentTime(Date.now()),
      30000,
    )
    return () =>
      window.clearInterval(timer)
  }, [])

  const serviceItems = useMemo(
    () =>
      services
        .filter(
          (service) =>
            service.scheduledDate &&
            !service.archived &&
            ![
              'cancelado',
              'finalizado',
              'realizado',
              'archivado',
            ].includes(service.status),
        )
        .map((service) => ({
          key: `service-${service.id}`,
          id: service.id,
          source: 'service',
          type: 'servicio',
          title: service.title,
          description:
            service.description,
          date:
            service.scheduledDate,
          startTime:
            service.scheduledTime ||
            '09:00',
          endTime: addHour(
            service.scheduledTime ||
              '09:00',
          ),
          allDay: false,
          location: service.address,
          mapsUrl: service.mapsUrl,
          clientName:
            service.clientName,
          status: service.status,
        })),
    [services],
  )

  const scheduleItems = useMemo(
    () => [
      ...events.map((event) => ({
        ...event,
        key: `event-${event.id}`,
        source: 'agenda',
      })),
      ...serviceItems,
    ],
    [events, serviceItems],
  )

  const dayItems = useMemo(
    () =>
      scheduleItems
        .filter(
          (item) =>
            item.date === selectedDate &&
            item.status !==
              'cancelado' &&
            !(
              item.scheduleKind ===
                'reminder' &&
              new Date(
                `${item.date}T${item.startTime}:00`,
              ).getTime() < currentTime
            ),
        )
        .sort((a, b) =>
          (
            a.allDay
              ? '00:00'
              : a.startTime
          ).localeCompare(
            b.allDay
              ? '00:00'
              : b.startTime,
          ),
        ),
    [
      scheduleItems,
      selectedDate,
      currentTime,
    ],
  )

  const expiredReminders = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.scheduleKind ===
              'reminder' &&
            new Date(
              `${event.date}T${event.startTime}:00`,
            ).getTime() < currentTime,
        )
        .sort((a, b) =>
          `${b.date}T${b.startTime}`.localeCompare(
            `${a.date}T${a.startTime}`,
          ),
        )
        .slice(0, 10),
    [events, currentTime],
  )

  const weekDays = useMemo(() => {
    const center =
      fromDateKey(selectedDate)
    const day = center.getDay()
    const mondayOffset =
      day === 0 ? -6 : 1 - day
    const monday = addDays(
      center,
      mondayOffset,
    )

    return Array.from(
      { length: 7 },
      (_, index) =>
        addDays(monday, index),
    )
  }, [selectedDate])

  const openNew = () => {
    setEditingEvent(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingEvent(null)
  }

  const handleSave = async (event) => {
    setSaving(true)

    try {
      if (editingEvent) {
        await updateAgendaEvent(
          editingEvent.id,
          event,
        )
      } else {
        await createAgendaEvent(event)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (event) => {
    if (
      !window.confirm(
        `¿Eliminar “${event.title}”?`,
      )
    ) {
      return
    }

    await removeAgendaEvent(event.id)
  }

  const handleComplete = async (
    event,
  ) => {
    await updateAgendaEventStatus(
      event.id,
      event.status === 'realizado'
        ? 'pendiente'
        : 'realizado',
    )
  }

  const handleEnablePush = async () => {
    setError('')
    setPushNotice('')

    if (pushStatus === 'granted') {
      setPushNotice(
        'Los avisos están permitidos. Para desactivarlos por completo, abre Configuración del iPhone, busca Amperium OS y entra en Notificaciones.',
      )
      return
    }

    try {
      await enablePushNotifications()
      setPushStatus('granted')
    } catch (pushError) {
      if (
        pushError.code ===
        'push/unconfigured'
      ) {
        setPushNotice(
          'El permiso está listo para usarse, pero falta conectar la clave de envío de Firebase para recibir avisos con la aplicación cerrada.',
        )
      } else {
        setPushNotice(
          pushError.message,
        )
      }
      setPushStatus(
        await getPushAvailability(),
      )
    }
  }

  const moveDay = (amount) =>
    setSelectedDate(
      toDateKey(
        addDays(
          fromDateKey(selectedDate),
          amount,
        ),
      ),
    )

  return (
    <section className={styles.page}>
      <div className={styles.topActions}>
        <div>
          <strong>
            {LONG_DATE.format(
              fromDateKey(selectedDate),
            )}
          </strong>
          <span>
            {dayItems.length}{' '}
            actividades programadas
          </span>
        </div>

        <div className={notificationStyles.control}>
          <div>
            <strong>Avisos</strong>
            <span>
              {pushStatus === 'granted'
                ? 'Activados'
                : pushStatus === 'unsupported'
                  ? 'No disponibles'
                  : pushStatus === 'unconfigured'
                    ? 'Pendientes de configuración'
                    : 'Desactivados'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Activar avisos"
            aria-checked={
              pushStatus === 'granted'
            }
            className={`${notificationStyles.switch} ${
              pushStatus === 'granted'
                ? notificationStyles.switchOn
                : ''
            }`}
            onClick={handleEnablePush}
            disabled={
              pushStatus === 'unsupported'
            }
          >
            <span />
          </button>
        </div>
      </div>

      {pushNotice ? (
        <div
          className={
            notificationStyles.notice
          }
        >
          {pushNotice}
        </div>
      ) : null}

      <div className={styles.week}>
        <button
          type="button"
          onClick={() => moveDay(-7)}
          aria-label="Semana anterior"
        >
          <ChevronLeft size={20} />
        </button>

        {weekDays.map((date) => {
          const key = toDateKey(date)
          const count =
            scheduleItems.filter(
              (item) =>
                item.date === key &&
                item.status !==
                  'cancelado',
            ).length

          return (
            <button
              type="button"
              key={key}
              className={
                key === selectedDate
                  ? styles.selectedDay
                  : ''
              }
              onClick={() =>
                setSelectedDate(key)
              }
            >
              <span>
                {DAY_FORMAT.format(date)}
              </span>
              {count ? (
                <small>{count}</small>
              ) : null}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => moveDay(7)}
          aria-label="Semana siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.dateNav}>
        <button
          type="button"
          onClick={() => moveDay(-1)}
        >
          <ChevronLeft size={17} />
          Día anterior
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(changeEvent) =>
            setSelectedDate(
              changeEvent.target.value,
            )
          }
        />

        <button
          type="button"
          onClick={() => moveDay(1)}
        >
          Día siguiente
          <ChevronRight size={17} />
        </button>
      </div>

      {error ? (
        <div className={styles.error}>
          {error}
        </div>
      ) : null}

      <div className={styles.timeline}>
        {dayItems.length ? (
          dayItems.map((item) => (
            <article
              key={item.key}
              className={`${styles.event} ${
                styles[
                  `type_${item.type}`
                ] || ''
              } ${
                item.status ===
                'realizado'
                  ? styles.completed
                  : ''
              }`}
            >
              <div className={styles.time}>
                <strong>
                  {item.allDay
                    ? 'Todo el día'
                    : item.startTime}
                </strong>
                {!item.allDay &&
                item.scheduleKind !==
                  'reminder' ? (
                  <span>
                    {item.endTime}
                  </span>
                ) : null}
              </div>

              <div className={styles.details}>
                <span>
                  {item.scheduleKind ===
                  'reminder'
                    ? 'Recordatorio'
                    : TYPE_LABELS[
                        item.type
                      ] || item.type}
                </span>
                <h2>{item.title}</h2>
                {item.clientName ? (
                  <p>
                    {item.clientName}
                  </p>
                ) : null}
                {item.description ? (
                  <small>
                    {item.description}
                  </small>
                ) : null}
                {item.location ? (
                  <div>
                    <MapPin size={14} />
                    {item.location}
                  </div>
                ) : null}
              </div>

              <div className={styles.actions}>
                {item.source ===
                'service' ? (
                  <button
                    type="button"
                    onClick={() =>
                      window.location.assign(
                        `/servicios?open=${encodeURIComponent(
                          item.id,
                        )}`,
                      )
                    }
                  >
                    Abrir servicio
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleComplete(item)
                      }
                      title="Marcar realizado"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(
                          item,
                        )
                        setModalOpen(true)
                      }}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(item)
                      }
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            <strong>
              El horario está libre
            </strong>
            <p>
              Crea un recordatorio rápido o reserva un evento.
            </p>
            <button
              type="button"
              onClick={openNew}
            >
              <Plus size={18} />
              Nuevo recordatorio
            </button>
          </div>
        )}
      </div>

      {expiredReminders.length ? (
        <details className={historyStyles.history}>
          <summary>
            Historial de recordatorios
            <span>{expiredReminders.length}</span>
          </summary>
          <div>
            {expiredReminders.map((event) => (
              <article key={event.id}>
                <time>
                  {event.date} · {event.startTime}
                </time>
                <strong>{event.title}</strong>
                {event.description ? (
                  <small>
                    {event.description}
                  </small>
                ) : null}
              </article>
            ))}
          </div>
        </details>
      ) : null}

      <button
        type="button"
        className={styles.floatingButton}
        onClick={openNew}
        aria-label="Nuevo recordatorio"
      >
        <Plus size={27} />
      </button>

      <AgendaEventModal
        key={`${modalOpen}-${
          editingEvent?.id ||
          selectedDate
        }`}
        open={modalOpen}
        event={editingEvent}
        initialDate={selectedDate}
        clients={clients}
        scheduleItems={scheduleItems}
        saving={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </section>
  )
}

export default AgendaPage
