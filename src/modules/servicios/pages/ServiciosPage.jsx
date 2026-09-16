import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Bell,
  BellOff,
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
  liquidateService,
  removeService,
  subscribeToServices,
  updateService,
  updateServiceStatus,
} from '../services/serviciosService'
import {
  generateServicePdf,
} from '../services/serviciosPdfService'

import ServiceFormModal from '../components/ServiceFormModal'

import styles from './ServiciosPage.module.css'

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

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0))

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

  const [view, setView] =
    useState('active')

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
          const isArchived =
            service.archived ||
            (
              service.status ===
                'finalizado' &&
              service.financialStatus ===
                'liquidada'
            )

          if (
            view === 'history'
              ? !isArchived
              : isArchived
          ) {
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
      view,
    ])

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
    if (
      service.originQuotationId ||
      service.status === 'finalizado'
    ) {
      setError(
        'Los servicios vinculados o finalizados forman parte del historial y no se pueden eliminar.',
      )
      return
    }

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

  const handlePdf = async (service) => {
    try {
      await generateServicePdf(service)
    } catch (pdfError) {
      console.error(pdfError)
      setError(
        'No fue posible generar el PDF del servicio.',
      )
    }
  }

  const handleFinalize = async (
    service,
  ) => {
    const confirmed = window.confirm(
      `¿Finalizar ${service.folio || service.title} y generar su PDF?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      await updateServiceStatus(
        service.id,
        'finalizado',
        service,
      )
      await generateServicePdf({
        ...service,
        status: 'finalizado',
        completedAt:
          new Date().toISOString(),
      })
    } catch (finalizeError) {
      setError(
        finalizeError?.message ||
          'No fue posible finalizar el servicio.',
      )
    }
  }

  const toggleServiceReminder = async (
    service,
  ) => {
    try {
      await updateService(
        service.id,
        {
          ...service,
          reminderEnabled:
            service.reminderEnabled === false,
        },
        service.clientId,
      )
    } catch (reminderError) {
      setError(
        reminderError?.message ||
          'No fue posible cambiar el aviso.',
      )
    }
  }

  const handleLiquidate = async (
    service,
  ) => {
    const confirmed = window.confirm(
      `¿Liquidar el saldo de ${money(
        service.pendingAmount,
      )}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await liquidateService(service)
    } catch (paymentError) {
      setError(
        paymentError?.message ||
          'No fue posible liquidar el servicio.',
      )
    }
  }

  return (
    <section
      className={styles.page}
    >
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

        <div className={styles.viewSwitch}>
          <button
            type="button"
            className={
              view === 'active'
                ? styles.viewActive
                : ''
            }
            onClick={() =>
              setView('active')
            }
          >
            Activos
          </button>

          <button
            type="button"
            className={
              view === 'history'
                ? styles.viewActive
                : ''
            }
            onClick={() =>
              setView('history')
            }
          >
            Historial
          </button>
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
            {view === 'history'
              ? 'Historial de servicios'
              : 'Servicios activos'}
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

                  {service.originQuotationFolio ||
                  service.quotedTotal > 0 ||
                  service.expenses?.length ? (
                    <div
                      className={
                        styles.financePanel
                      }
                    >
                      {service.originQuotationFolio ? (
                        <span>
                          Origen:{' '}
                          <strong>
                            {
                              service.originQuotationFolio
                            }
                          </strong>
                        </span>
                      ) : null}

                      <div>
                        <span>
                          Total final
                          <strong>
                            {money(
                              service.finalTotal ||
                                service.quotedTotal,
                            )}
                          </strong>
                        </span>

                        <span>
                          Pagado
                          <strong>
                            {money(
                              service.paidAmount,
                            )}
                          </strong>
                        </span>

                        <span>
                          Extras
                          <strong>
                            {money(
                              service.expenses?.reduce(
                                (
                                  total,
                                  expense,
                                ) =>
                                  total +
                                  Number(
                                    expense.amount ||
                                      0,
                                  ),
                                0,
                              ),
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>
                  ) : null}

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
                      styles.cardActions
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        window.location.assign(
                          `/listas?type=servicio&id=${encodeURIComponent(
                            service.id,
                          )}`,
                        )
                      }
                    >
                      Lista
                    </button>

                    {service.scheduledDate &&
                    ![
                      'finalizado',
                      'cancelado',
                      'archivado',
                    ].includes(
                      service.status,
                    ) ? (
                      <button
                        type="button"
                        className={
                          service.reminderEnabled ===
                          false
                            ? styles.reminderOff
                            : styles.reminderOn
                        }
                        onClick={() =>
                          toggleServiceReminder(
                            service,
                          )
                        }
                        title={
                          service.reminderEnabled ===
                          false
                            ? 'Activar avisos'
                            : 'Desactivar avisos'
                        }
                      >
                        {service.reminderEnabled ===
                        false ? (
                          <BellOff size={16} />
                        ) : (
                          <Bell size={16} />
                        )}
                        {service.reminderEnabled ===
                        false
                          ? 'Activar aviso'
                          : 'Aviso activo'}
                      </button>
                    ) : null}

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

                    {service.originQuotationId ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.location.assign(
                            `/cotizaciones?open=${encodeURIComponent(
                              service.originQuotationId,
                            )}`,
                          )
                        }
                      >
                        Ver cotización
                      </button>
                    ) : null}

                    {service.folio &&
                    service.status !==
                      'finalizado' ? (
                      <button
                        type="button"
                        className={
                          styles.finalizeButton
                        }
                        onClick={() =>
                          handleFinalize(
                            service,
                          )
                        }
                      >
                        Finalizar y generar PDF
                      </button>
                    ) : null}

                    {service.pendingAmount >
                    0 ? (
                      <button
                        type="button"
                        className={
                          styles.liquidateButton
                        }
                        onClick={() =>
                          handleLiquidate(
                            service,
                          )
                        }
                      >
                        Liquidar
                      </button>
                    ) : null}

                    {service.folio &&
                    service.status ===
                      'finalizado' ? (
                      <button
                        type="button"
                        onClick={() =>
                          handlePdf(service)
                        }
                      >
                        PDF final
                      </button>
                    ) : null}

                    {!service.originQuotationId &&
                    service.status ===
                      'borrador' ? (
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
                    ) : null}
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
