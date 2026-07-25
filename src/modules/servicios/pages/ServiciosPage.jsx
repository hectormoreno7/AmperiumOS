import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import {
  useLocation,
  useSearchParams,
} from 'react-router-dom'

import {
  createClient,
  subscribeToClients,
} from '../../clientes/services/clientesStorage'

import {
  createService,
  finalizeService,
  removeService,
  subscribeToServices,
  updateService,
  updateServiceStatus,
} from '../services/serviciosService'

import ServiceFormModal from '../components/ServiceFormModal'

import styles from './ServiciosPage.module.css'

const STATUS_OPTIONS = [
  {
    value: 'todos',
    label: 'Todos',
  },
  {
    value: 'borrador',
    label: 'Borradores',
  },
  {
    value: 'programado',
    label: 'Programados',
  },
  {
    value: 'en_proceso',
    label: 'En proceso',
  },
  {
    value: 'finalizado',
    label: 'Finalizados',
  },
  {
    value: 'cancelado',
    label: 'Cancelados',
  },
  {
    value: 'archivado',
    label: 'Archivados',
  },
]

const STATUS_LABELS = {
  borrador: 'Borrador',
  programado: 'Programado',
  en_proceso: 'En proceso',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  archivado: 'Archivado',
}

const PRIORITY_LABELS = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )

const getServiceIdentifier = (
  service,
) =>
  String(
    service?.id ||
      service?.serviceId ||
      service?.servicioId ||
      service?.folio ||
      '',
  ).trim()

function ServiciosPage() {
  const [searchParams] =
    useSearchParams()

  const location = useLocation()

  const requestedServiceId =
    searchParams.get('open')

  const openedFromUrlRef =
    useRef('')

  const [services, setServices] =
    useState([])

  const [clients, setClients] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('todos')

  const [modalOpen, setModalOpen] =
    useState(false)

  const [
    editingService,
    setEditingService,
  ] = useState(null)

  useEffect(() => {
    setLoading(true)

    const unsubscribeServices =
      subscribeToServices(
        (updatedServices) => {
          setServices(
            updatedServices,
          )

          setLoading(false)
        },

        (subscriptionError) => {
          setError(
            subscriptionError.message ||
              'No fue posible cargar los servicios.',
          )

          setLoading(false)
        },
      )

    const unsubscribeClients =
      subscribeToClients(
        setClients,

        (subscriptionError) => {
          setError(
            subscriptionError.message ||
              'No fue posible cargar los clientes.',
          )
        },
      )

    return () => {
      unsubscribeServices()
      unsubscribeClients()
    }
  }, [])

  useEffect(() => {
    if (
      loading ||
      !requestedServiceId
    ) {
      return
    }

    if (
      openedFromUrlRef.current ===
      requestedServiceId
    ) {
      return
    }

    const stateService =
      location.state?.openService

    const requestedService =
      services.find(
        (service) => {
          const identifiers = [
            service.id,
            service.serviceId,
            service.servicioId,
            service.folio,
          ]
            .filter(Boolean)
            .map(String)

          return identifiers.includes(
            String(
              requestedServiceId,
            ),
          )
        },
      ) ||
      (stateService &&
      getServiceIdentifier(
        stateService,
      ) ===
        String(requestedServiceId)
        ? stateService
        : null)

    if (!requestedService) {
      setError(
        'No se encontró el servicio seleccionado.',
      )

      openedFromUrlRef.current =
        requestedServiceId

      return
    }

    openedFromUrlRef.current =
      requestedServiceId

    setEditingService(
      requestedService,
    )

    setModalOpen(true)
  }, [
    loading,
    location.state,
    requestedServiceId,
    services,
  ])

  const filteredServices =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(search)

      return services.filter(
        (service) => {
          const matchesStatus =
            statusFilter ===
              'todos' ||
            service.status ===
              statusFilter

          if (!matchesStatus) {
            return false
          }

          if (!normalizedSearch) {
            return true
          }

          const searchableText =
            normalizeText(
              [
                service.folio,
                service.clientName,
                service.title,
                service.description,
                service.phone,
                service.address,
              ].join(' '),
            )

          return searchableText.includes(
            normalizedSearch,
          )
        },
      )
    }, [
      search,
      services,
      statusFilter,
    ])

  const summary = useMemo(
    () => ({
      total: services.length,

      pending: services.filter(
        (service) =>
          service.status ===
            'programado' ||
          service.status ===
            'en_proceso',
      ).length,

      completed: services.filter(
        (service) =>
          service.status ===
          'finalizado',
      ).length,
    }),
    [services],
  )

  const openNewService = () => {
    setEditingService(null)
    setModalOpen(true)
    setError('')
  }

  const openEditService = (
    service,
  ) => {
    setEditingService(service)
    setModalOpen(true)
    setError('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingService(null)
  }

  const handleSave = async (
    formData,
    action,
  ) => {
    setSaving(true)
    setError('')

    try {
      let preparedData = {
        ...formData,
      }

      if (
        formData.clientMode ===
          'new' &&
        formData.saveClient &&
        !formData.clientId
      ) {
        const newClientId =
          await createClient({
            name:
              formData.clientName,

            contactName:
              formData.contactName,

            phones: formData.phone
              ? [formData.phone]
              : [],

            email:
              formData.email,

            address:
              formData.address,

            notes: '',

            status: 'active',

            activity: {
              quotations: 0,
              services: 0,
              notes: 0,
              payments: 0,
            },
          })

        preparedData = {
          ...preparedData,
          clientId: newClientId,
        }
      }

      if (editingService?.id) {
        if (action === 'finalize') {
          await finalizeService(
            editingService.id,
            preparedData,
            editingService.clientId,
          )
        } else {
          await updateService(
            editingService.id,
            {
              ...preparedData,
              status:
                preparedData.status ||
                'borrador',
            },
            editingService.clientId,
          )
        }
      } else if (
        action === 'finalize'
      ) {
        await finalizeService(
          '',
          preparedData,
        )
      } else {
        await createService({
          ...preparedData,
          status: 'borrador',
        })
      }

      closeModal()
    } catch (saveError) {
      setError(
        saveError.message ||
          'No fue posible guardar el servicio.',
      )

      throw saveError
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (
    service,
  ) => {
    const confirmed =
      window.confirm(
        `¿Eliminar el servicio ${
          service.folio ||
          service.title ||
          ''
        }?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await removeService(service)
    } catch (deleteError) {
      setError(
        deleteError.message ||
          'No fue posible eliminar el servicio.',
      )
    }
  }

  const handleStatusChange =
    async (
      service,
      nextStatus,
    ) => {
      try {
        setError('')

        await updateServiceStatus(
          service.id,
          nextStatus,
        )
      } catch (statusError) {
        setError(
          statusError.message ||
            'No fue posible actualizar el estado.',
        )
      }
    }

  return (
    <section
      className={styles.page}
    >
      <header
        className={
          styles.pageHeader
        }
      >
        <div
          className={styles.brandMark}
        >
          A
        </div>

        <div>
          <span
            className={styles.eyebrow}
          >
            AMPERIUM OS
          </span>

          <h1>Servicios</h1>

          <p>
            Registra, programa y da
            seguimiento a los trabajos.
          </p>
        </div>
      </header>

      <div
        className={
          styles.summaryGrid
        }
      >
        <article>
          <span>
            Servicios registrados
          </span>

          <strong>
            {summary.total}
          </strong>
        </article>

        <article>
          <span>
            Pendientes
          </span>

          <strong>
            {summary.pending}
          </strong>
        </article>

        <article>
          <span>
            Finalizados
          </span>

          <strong>
            {summary.completed}
          </strong>
        </article>
      </div>

      <div
        className={styles.toolbar}
      >
        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Buscar por folio, cliente, servicio o dirección..."
        />

        <div
          className={styles.filters}
        >
          {STATUS_OPTIONS.map(
            (option) => (
              <button
                key={option.value}
                type="button"
                className={
                  statusFilter ===
                  option.value
                    ? styles.filterActive
                    : ''
                }
                onClick={() =>
                  setStatusFilter(
                    option.value,
                  )
                }
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      </div>

      {error ? (
        <div
          className={
            styles.errorBanner
          }
        >
          {error}
        </div>
      ) : null}

      <div
        className={
          styles.contentCard
        }
      >
        <div
          className={
            styles.listHeader
          }
        >
          <strong>
            Historial de servicios
          </strong>

          <span>
            {filteredServices.length}
          </span>
        </div>

        {loading ? (
          <div
            className={
              styles.emptyState
            }
          >
            <strong>
              Sincronizando con
              Firestore...
            </strong>
          </div>
        ) : filteredServices.length ? (
          <div
            className={
              styles.serviceList
            }
          >
            {filteredServices.map(
              (service) => (
                <article
                  key={service.id}
                  className={
                    styles.serviceCard
                  }
                >
                  <div
                    className={
                      styles.cardTop
                    }
                  >
                    <div
                      className={
                        styles.cardIdentity
                      }
                    >
                      <div
                        className={
                          styles.folioRow
                        }
                      >
                        <span
                          className={
                            styles.folio
                          }
                        >
                          {service.folio ||
                            'SIN FOLIO'}
                        </span>

                        <span
                          className={`${styles.statusBadge} ${
                            styles[
                              `status_${service.status}`
                            ] || ''
                          }`}
                        >
                          {STATUS_LABELS[
                            service.status
                          ] ||
                            service.status}
                        </span>

                        <span
                          className={`${styles.priorityBadge} ${
                            styles[
                              `priority_${service.priority}`
                            ] || ''
                          }`}
                        >
                          {PRIORITY_LABELS[
                            service.priority
                          ] ||
                            service.priority}
                        </span>
                      </div>

                      <h2>
                        {service.title ||
                          'Servicio sin nombre'}
                      </h2>

                      <p>
                        {service.clientName ||
                          'Cliente no especificado'}
                      </p>
                    </div>
                  </div>

                  <p
                    className={
                      styles.description
                    }
                  >
                    {service.description ||
                      'Sin descripción'}
                  </p>

                  <div
                    className={
                      styles.serviceInfo
                    }
                  >
                    <div>
                      <span>
                        Fecha
                      </span>

                      <strong>
                        {service.scheduledDate ||
                          'Sin fecha'}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Hora
                      </span>

                      <strong>
                        {service.scheduledTime ||
                          'Sin hora'}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Responsable
                      </span>

                      <strong>
                        {service.assignedTo ||
                          'Sin asignar'}
                      </strong>
                    </div>
                  </div>

                  {service.address ? (
                    <div
                      className={
                        styles.addressRow
                      }
                    >
                      <MapPin
                        size={16}
                        strokeWidth={1.8}
                      />

                      <span>
                        {service.address}
                      </span>
                    </div>
                  ) : null}

                  <div
                    className={
                      styles.statusControls
                    }
                  >
                    <select
                      value={
                        service.status
                      }
                      onChange={(
                        event,
                      ) =>
                        handleStatusChange(
                          service,
                          event.target
                            .value,
                        )
                      }
                    >
                      <option value="borrador">
                        Borrador
                      </option>

                      <option value="programado">
                        Programado
                      </option>

                      <option value="en_proceso">
                        En proceso
                      </option>

                      <option value="finalizado">
                        Finalizado
                      </option>

                      <option value="cancelado">
                        Cancelado
                      </option>

                      <option value="archivado">
                        Archivado
                      </option>
                    </select>
                  </div>

                  <div
                    className={
                      styles.cardActions
                    }
                  >
                    {service.mapsUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            service.mapsUrl,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                      >
                        <MapPin
                          size={16}
                        />

                        Mapa
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        openEditService(
                          service,
                        )
                      }
                    >
                      <Pencil
                        size={16}
                      />

                      Ver / editar
                    </button>

                    <button
                      type="button"
                      className={
                        styles.deleteButton
                      }
                      onClick={() =>
                        handleDelete(
                          service,
                        )
                      }
                    >
                      <Trash2
                        size={16}
                      />

                      Eliminar
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <div
            className={
              styles.emptyState
            }
          >
            <strong>
              No hay servicios
            </strong>

            <p>
              Registra el primer
              servicio para comenzar.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        className={
          styles.floatingButton
        }
        onClick={
          openNewService
        }
        aria-label="Nuevo servicio"
        title="Nuevo servicio"
      >
        <Plus
          size={27}
          strokeWidth={2}
        />
      </button>

      <ServiceFormModal
        open={modalOpen}
        service={editingService}
        clients={clients}
        saving={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </section>
  )
}

export default ServiciosPage