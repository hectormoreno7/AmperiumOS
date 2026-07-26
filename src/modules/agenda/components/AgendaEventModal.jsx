import {
  useMemo,
  useState,
} from 'react'
import branding from '../../../shared/constants/branding'
import styles from './AgendaEventModal.module.css'
import reminderStyles from './AgendaReminderMode.module.css'

const EMPTY_EVENT = {
  scheduleKind: 'reminder',
  title: '',
  description: '',
  type: 'personal',
  date: new Date()
    .toISOString()
    .slice(0, 10),
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  location: '',
  mapsUrl: '',
  clientId: '',
  clientName: '',
  reminderMinutes: [0],
  status: 'pendiente',
}

const REMINDERS = [
  [0, 'A la hora'],
  [10, '10 minutos antes'],
  [15, '15 minutos antes'],
  [30, '30 minutos antes'],
  [60, '1 hora antes'],
  [180, '3 horas antes'],
  [1440, '1 día antes'],
]

const QUICK_TIMES = [
  [10, 'En 10 min'],
  [30, 'En 30 min'],
  [60, 'En 1 hora'],
  [180, 'En 3 horas'],
]

const localDateAndTime = (date) => ({
  date: [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-'),
  time: `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`,
})

const overlaps = (
  startA,
  endA,
  startB,
  endB,
) => startA < endB && endA > startB

function AgendaEventModal({
  open,
  event,
  initialDate,
  clients,
  scheduleItems,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] =
    useState(() => ({
      ...EMPTY_EVENT,
      date:
        initialDate ||
        EMPTY_EVENT.date,
      ...(event || {}),
    }))
  const [error, setError] =
    useState('')

  const conflicts = useMemo(() => {
    if (
      form.scheduleKind !== 'event' ||
      form.allDay ||
      !form.date ||
      !form.startTime ||
      !form.endTime
    ) {
      return []
    }

    return scheduleItems.filter(
      (item) =>
        item.id !== event?.id &&
        item.date === form.date &&
        (
          item.allDay ||
          overlaps(
            form.startTime,
            form.endTime,
            item.startTime,
            item.endTime,
          )
        ),
    )
  }, [event?.id, form, scheduleItems])

  if (!open) return null

  const update = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

  const toggleReminder = (minutes) =>
    setForm((current) => ({
      ...current,
      reminderMinutes:
        current.reminderMinutes.includes(
          minutes,
        )
          ? current.reminderMinutes.filter(
              (value) =>
                value !== minutes,
            )
          : [
              ...current.reminderMinutes,
              minutes,
            ],
    }))

  const setQuickTime = (minutes) => {
    const value = localDateAndTime(
      // The current time is read when the user presses a shortcut.
      // eslint-disable-next-line react-hooks/purity
      new Date(Date.now() + minutes * 60000),
    )
    setForm((current) => ({
      ...current,
      date: value.date,
      startTime: value.time,
      endTime: value.time,
      allDay: false,
      reminderMinutes: [0],
    }))
  }

  const setTomorrow = () => {
    const target = new Date()
    target.setDate(target.getDate() + 1)
    target.setHours(9, 0, 0, 0)
    const value = localDateAndTime(target)
    setForm((current) => ({
      ...current,
      date: value.date,
      startTime: value.time,
      endTime: value.time,
      allDay: false,
      reminderMinutes: [0],
    }))
  }

  const submit = async (submitEvent) => {
    submitEvent.preventDefault()

    if (!form.title.trim()) {
      setError(
        'Escribe el asunto del recordatorio.',
      )
      return
    }

    if (!form.date) {
      setError('Selecciona una fecha.')
      return
    }

    if (
      form.scheduleKind === 'event' &&
      !form.allDay &&
      (
        !form.startTime ||
        !form.endTime ||
        form.endTime <=
          form.startTime
      )
    ) {
      setError(
        'La hora final debe ser posterior a la inicial.',
      )
      return
    }

    try {
      await onSave(form)
    } catch (saveError) {
      setError(
        saveError?.message ||
          'No fue posible guardar.',
      )
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={onClose}
    >
      <section
        className={styles.modal}
        onMouseDown={(mouseEvent) =>
          mouseEvent.stopPropagation()
        }
      >
        <header className={styles.header}>
          <div className={styles.brand}>
            <img
              src={
                branding.logos
                  .horizontalSimpleDarkBackground
              }
              alt={branding.appName}
            />

            <div>
              <span>Agenda Amperium</span>
              <h2>
                {event
                  ? 'Editar recordatorio'
                  : 'Nuevo recordatorio'}
              </h2>
              <p>
                Reserva el horario y configura sus avisos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <form
          className={styles.form}
          onSubmit={submit}
        >
          <div className={reminderStyles.modePicker}>
            <button
              type="button"
              className={
                form.scheduleKind !== 'event'
                  ? reminderStyles.activeMode
                  : ''
              }
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  scheduleKind: 'reminder',
                  allDay: false,
                  reminderMinutes: [0],
                }))
              }
            >
              <strong>Recordatorio</strong>
              <span>Avísame en un momento concreto</span>
            </button>
            <button
              type="button"
              className={
                form.scheduleKind === 'event'
                  ? reminderStyles.activeMode
                  : ''
              }
              onClick={() =>
                update('scheduleKind', 'event')
              }
            >
              <strong>Evento</strong>
              <span>Reservar un horario</span>
            </button>
          </div>

          {form.scheduleKind !== 'event' ? (
            <section className={reminderStyles.quickReminder}>
              <strong>¿Cuándo te recuerdo?</strong>
              <div>
                {QUICK_TIMES.map(([minutes, label]) => (
                  <button
                    type="button"
                    key={minutes}
                    onClick={() => setQuickTime(minutes)}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" onClick={setTomorrow}>
                  Mañana a las 9
                </button>
              </div>
              <small>
                También puedes elegir una fecha y hora exactas.
              </small>
            </section>
          ) : null}

          <div className={`${styles.gridTwo} ${
            form.scheduleKind !== 'event'
              ? reminderStyles.reminderForm
              : ''
          }`}>
            <label className={styles.full}>
              Asunto
              <input
                autoFocus
                value={form.title}
                onChange={(changeEvent) =>
                  update(
                    'title',
                    changeEvent.target.value,
                  )
                }
                placeholder="Ej. Llamar al proveedor"
              />
            </label>

            <label>
              Tipo
              <select
                value={form.type}
                onChange={(changeEvent) =>
                  update(
                    'type',
                    changeEvent.target.value,
                  )
                }
              >
                <option value="personal">
                  Personal
                </option>
                <option value="llamada">
                  Llamada
                </option>
                <option value="visita">
                  Visita
                </option>
                <option value="consulta">
                  Consulta
                </option>
              </select>
            </label>

            {form.scheduleKind === 'event' ? <label>
              Cliente opcional
              <select
                value={form.clientId}
                onChange={(changeEvent) => {
                  const selected =
                    clients.find(
                      (client) =>
                        client.id ===
                        changeEvent.target
                          .value,
                    )
                  update(
                    'clientId',
                    selected?.id || '',
                  )
                  update(
                    'clientName',
                    selected?.name || '',
                  )
                }}
              >
                <option value="">
                  Sin cliente
                </option>
                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.name}
                  </option>
                ))}
              </select>
            </label> : null}

            <label>
              Fecha
              <input
                type="date"
                value={form.date}
                onChange={(changeEvent) =>
                  update(
                    'date',
                    changeEvent.target.value,
                  )
                }
              />
            </label>

            {form.scheduleKind === 'event' ? <label className={styles.allDay}>
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(changeEvent) =>
                  update(
                    'allDay',
                    changeEvent.target.checked,
                  )
                }
              />
              Todo el día
            </label> : null}

            {!form.allDay ? (
              <>
                <label>
                  {form.scheduleKind === 'event'
                    ? 'Inicia'
                    : 'Hora del aviso'}
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(
                      changeEvent,
                    ) =>
                      update(
                        'startTime',
                        changeEvent.target
                          .value,
                      )
                    }
                  />
                </label>

                {form.scheduleKind === 'event' ? <label>
                  Termina
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(
                      changeEvent,
                    ) =>
                      update(
                        'endTime',
                        changeEvent.target
                          .value,
                      )
                    }
                  />
                </label> : null}
              </>
            ) : null}

            {form.scheduleKind === 'event' ? <label>
              Ubicación
              <input
                value={form.location}
                onChange={(changeEvent) =>
                  update(
                    'location',
                    changeEvent.target.value,
                  )
                }
                placeholder="Dirección o referencia"
              />
            </label> : null}

            {form.scheduleKind === 'event' ? <label>
              Enlace de Maps
              <input
                value={form.mapsUrl}
                onChange={(changeEvent) =>
                  update(
                    'mapsUrl',
                    changeEvent.target.value,
                  )
                }
                placeholder="https://maps.google.com/..."
              />
            </label> : null}

            <label className={styles.full}>
              Detalles
              <textarea
                rows="3"
                value={form.description}
                onChange={(changeEvent) =>
                  update(
                    'description',
                    changeEvent.target.value,
                  )
                }
              />
            </label>
          </div>

          {form.scheduleKind === 'event' ? <section className={styles.reminders}>
            <strong>Recordarme</strong>
            <div>
              {REMINDERS.map(
                ([minutes, label]) => (
                  <button
                    type="button"
                    key={minutes}
                    className={
                      form.reminderMinutes.includes(
                        minutes,
                      )
                        ? styles.selected
                        : ''
                    }
                    onClick={() =>
                      toggleReminder(
                        minutes,
                      )
                    }
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </section> : (
            <div className={reminderStyles.reminderSummary}>
              Te avisaremos el <strong>{form.date}</strong> a las{' '}
              <strong>{form.startTime}</strong>.
            </div>
          )}

          {conflicts.length ? (
            <div className={styles.conflict}>
              <strong>
                Este horario se cruza con:
              </strong>
              {conflicts.map((item) => (
                <span key={item.key || item.id}>
                  {item.startTime}–{item.endTime}{' '}
                  {item.title}
                </span>
              ))}
            </div>
          ) : null}

          {error ? (
            <div className={styles.error}>
              {error}
            </div>
          ) : null}

          <footer className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : 'Guardar recordatorio'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default AgendaEventModal
