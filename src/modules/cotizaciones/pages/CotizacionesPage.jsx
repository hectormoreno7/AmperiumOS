import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useSearchParams,
} from 'react-router-dom'

import {
  createClient,
  subscribeToClients,
} from '../../clientes/services/clientesStorage'

import QuotationFormModal from '../components/QuotationFormModal'

import {
  addQuotationPayment,
  createQuotation,
  finalizeQuotation,
  removeQuotation,
  removeQuotationPayment,
  subscribeToQuotations,
  updateQuotation,
} from '../services/cotizacionesService'

import {
  generateQuotationPdf,
} from '../services/cotizacionesPdfService'

import styles from './CotizacionesPage.module.css'

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const normalizePhone = (value) =>
  String(value ?? '').replace(/\D/g, '')

const normalizeIdentifier = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) {
    return 'Sin fecha'
  }

  let date

  if (typeof value?.toDate === 'function') {
    date = value.toDate()
  } else if (
    typeof value?.seconds === 'number'
  ) {
    date = new Date(
      value.seconds * 1000,
    )
  } else {
    date = new Date(value)
  }

  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(date)
}

const financialLabel = (status) => {
  if (status === 'liquidada') {
    return 'Liquidada'
  }

  if (status === 'anticipo') {
    return 'Anticipo recibido'
  }

  return 'Pendiente de pago'
}

const EMPTY_PAYMENT = {
  amount: '',
  method: 'transferencia',
  date: new Date()
    .toISOString()
    .slice(0, 10),
  note: '',
}

function quotationMatchesIdentifier(
  quotation,
  requestedIdentifier,
) {
  const normalizedRequestedIdentifier =
    normalizeIdentifier(
      requestedIdentifier,
    )

  if (
    !quotation ||
    !normalizedRequestedIdentifier
  ) {
    return false
  }

  const identifiers = [
    quotation.id,
    quotation.quotationId,
    quotation.cotizacionId,
    quotation.folio,
    quotation.quoteNumber,
    quotation.numero,
  ]

  return identifiers.some(
    (identifier) =>
      normalizeIdentifier(identifier) ===
      normalizedRequestedIdentifier,
  )
}

function CotizacionesPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const requestedQuotationId =
    searchParams.get('open') || ''

  const openedFromUrlRef =
    useRef('')

  const [quotations, setQuotations] =
    useState([])

  const [clients, setClients] =
    useState([])

  const [search, setSearch] =
    useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    financialFilter,
    setFinancialFilter,
  ] = useState('all')

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false)

  const [
    editingQuotation,
    setEditingQuotation,
  ] = useState(null)

  const [
    paymentQuotation,
    setPaymentQuotation,
  ] = useState(null)

  const [
    paymentForm,
    setPaymentForm,
  ] = useState(EMPTY_PAYMENT)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    paymentSaving,
    setPaymentSaving,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [
    paymentError,
    setPaymentError,
  ] = useState('')

  /*
   * Sincronización principal con Firestore.
   * Este efecto debe existir una sola vez.
   */
  useEffect(() => {
    setLoading(true)

    const unsubscribeQuotations =
      subscribeToQuotations(
        (items) => {
          setQuotations(
            Array.isArray(items)
              ? items
              : [],
          )

          setLoading(false)
          setError('')
        },
        (firebaseError) => {
          console.error(
            'No fue posible sincronizar las cotizaciones:',
            firebaseError,
          )

          setQuotations([])
          setLoading(false)

          setError(
            firebaseError?.message ||
              'No fue posible cargar las cotizaciones.',
          )
        },
      )

    const unsubscribeClients =
      subscribeToClients(
        (items) => {
          setClients(
            Array.isArray(items)
              ? items
              : [],
          )
        },
        (firebaseError) => {
          console.error(
            'No fue posible sincronizar los clientes:',
            firebaseError,
          )
        },
      )

    return () => {
      if (
        typeof unsubscribeQuotations ===
        'function'
      ) {
        unsubscribeQuotations()
      }

      if (
        typeof unsubscribeClients ===
        'function'
      ) {
        unsubscribeClients()
      }
    }
  }, [])

  /*
   * Abre exclusivamente la cotización
   * indicada en ?open=.
   */
  useEffect(() => {
    if (!requestedQuotationId) {
      openedFromUrlRef.current = ''
      return
    }

    if (loading) {
      return
    }

    if (
      openedFromUrlRef.current ===
      requestedQuotationId
    ) {
      return
    }

    const requestedQuotation =
      quotations.find((quotation) =>
        quotationMatchesIdentifier(
          quotation,
          requestedQuotationId,
        ),
      )

    if (!requestedQuotation) {
      openedFromUrlRef.current =
        requestedQuotationId

      setModalOpen(false)
      setEditingQuotation(null)

      setError(
        'No fue posible encontrar la cotización seleccionada.',
      )

      return
    }

    openedFromUrlRef.current =
      requestedQuotationId

    setError('')
    setEditingQuotation(
      requestedQuotation,
    )
    setModalOpen(true)
  }, [
    loading,
    quotations,
    requestedQuotationId,
  ])

  /*
   * Mantiene actualizado el modal de pagos
   * cuando Firestore devuelve cambios.
   */
  useEffect(() => {
    if (!paymentQuotation?.id) {
      return
    }

    const updatedQuotation =
      quotations.find(
        (quotation) =>
          quotation.id ===
          paymentQuotation.id,
      )

    if (updatedQuotation) {
      setPaymentQuotation(
        updatedQuotation,
      )
    }
  }, [
    quotations,
    paymentQuotation?.id,
  ])

  const filteredQuotations =
    useMemo(() => {
      const query = normalize(search)

      return quotations.filter(
        (quotation) => {
          const matchesStatus =
            statusFilter === 'all' ||
            quotation.status ===
              statusFilter

          const matchesFinancial =
            financialFilter === 'all' ||
            quotation.financialStatus ===
              financialFilter

          const searchable = normalize(
            [
              quotation.folio,
              quotation.clientName,
              quotation.projectName,
              quotation.contactName,
              quotation.phone,
            ].join(' '),
          )

          return (
            matchesStatus &&
            matchesFinancial &&
            (
              !query ||
              searchable.includes(query)
            )
          )
        },
      )
    }, [
      quotations,
      search,
      statusFilter,
      financialFilter,
    ])

  const summary = useMemo(
    () =>
      quotations.reduce(
        (result, quotation) => ({
          total:
            result.total +
            Number(
              quotation.totals?.total ||
                0,
            ),

          paid:
            result.paid +
            Number(
              quotation.paidAmount ||
                0,
            ),

          pending:
            result.pending +
            Number(
              quotation.pendingAmount ||
                0,
            ),
        }),
        {
          total: 0,
          paid: 0,
          pending: 0,
        },
      ),
    [quotations],
  )

  const clearOpenParameter = () => {
    openedFromUrlRef.current = ''

    if (!searchParams.has('open')) {
      return
    }

    const nextParams =
      new URLSearchParams(
        searchParams,
      )

    nextParams.delete('open')

    setSearchParams(nextParams, {
      replace: true,
    })
  }

  const openNew = () => {
    clearOpenParameter()
    setError('')
    setEditingQuotation(null)
    setModalOpen(true)
  }

  const openEdit = (quotation) => {
    clearOpenParameter()
    setError('')
    setEditingQuotation(quotation)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) {
      return
    }

    clearOpenParameter()
    setModalOpen(false)
    setEditingQuotation(null)
  }

  const openPayments = (quotation) => {
    setPaymentQuotation(quotation)

    setPaymentForm({
      ...EMPTY_PAYMENT,

      amount:
        Number(
          quotation.pendingAmount ||
            0,
        ) > 0
          ? quotation.pendingAmount
          : '',
    })

    setPaymentError('')
  }

  const closePayments = () => {
    if (paymentSaving) {
      return
    }

    setPaymentQuotation(null)
    setPaymentForm(EMPTY_PAYMENT)
    setPaymentError('')
  }

  const findExistingClient = (
    quotationData,
  ) => {
    const normalizedName =
      normalize(
        quotationData.clientName,
      )

    const normalizedPhone =
      normalizePhone(
        quotationData.phone,
      )

    return clients.find((client) => {
      const sameName =
        normalizedName &&
        normalize(client.name) ===
          normalizedName

      const clientPhones =
        Array.isArray(client.phones)
          ? client.phones
          : client.phone
            ? [client.phone]
            : []

      const samePhone =
        normalizedPhone &&
        clientPhones.some(
          (phone) =>
            normalizePhone(phone) ===
            normalizedPhone,
        )

      return sameName || samePhone
    })
  }

  const resolveClientId = async (
    quotationData,
  ) => {
    if (
      quotationData.clientMode ===
        'existing' &&
      quotationData.clientId
    ) {
      return quotationData.clientId
    }

    if (!quotationData.saveClient) {
      return (
        quotationData.clientId || ''
      )
    }

    const existingClient =
      findExistingClient(
        quotationData,
      )

    if (existingClient) {
      return existingClient.id
    }

    return createClient({
      name:
        quotationData.clientName,

      contactName:
        quotationData.contactName,

      phones: quotationData.phone
        ? [quotationData.phone]
        : [],

      email:
        quotationData.email,

      address:
        quotationData.address,

      notes: '',
      status: 'active',

      activity: {
        quotations: 0,
        services: 0,
        notes: 0,
        payments: 0,
      },
    })
  }

  const handleSave = async (
    quotationData,
    action = 'draft',
  ) => {
    if (saving) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const resolvedClientId =
        await resolveClientId(
          quotationData,
        )

      const preparedQuotation = {
        ...quotationData,
        clientId: resolvedClientId,
      }

      delete preparedQuotation.clientMode
      delete preparedQuotation.saveClient

      if (action === 'finalize') {
        const finalQuotation =
          await finalizeQuotation(
            editingQuotation?.id,
            preparedQuotation,
            editingQuotation?.clientId ||
              '',
          )

        await generateQuotationPdf(
          finalQuotation,
        )
      } else if (editingQuotation) {
        await updateQuotation(
          editingQuotation.id,
          {
            ...preparedQuotation,

            status:
              editingQuotation.status ||
              'borrador',
          },
          editingQuotation.clientId ||
            '',
        )
      } else {
        await createQuotation(
          preparedQuotation,
        )
      }

      clearOpenParameter()
      setModalOpen(false)
      setEditingQuotation(null)
    } catch (firebaseError) {
      console.error(firebaseError)

      setError(
        firebaseError?.message ||
          'No fue posible guardar la cotización.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (
    quotation,
  ) => {
    const label =
      quotation.folio ||
      quotation.projectName ||
      'esta cotización'

    const confirmed =
      window.confirm(
        `¿Eliminar ${label}? Esta acción no se puede deshacer.`,
      )

    if (!confirmed) {
      return
    }

    try {
      await removeQuotation(
        quotation,
      )
    } catch (firebaseError) {
      setError(
        firebaseError?.message ||
          'No fue posible eliminar la cotización.',
      )
    }
  }

  const handlePdf = async (
    quotation,
  ) => {
    try {
      await generateQuotationPdf(
        quotation,
      )
    } catch (pdfError) {
      console.error(pdfError)

      setError(
        'No fue posible generar el PDF.',
      )
    }
  }

  const handleAddPayment = async () => {
    if (
      !paymentQuotation ||
      paymentSaving
    ) {
      return
    }

    const amount = Number(
      paymentForm.amount,
    )

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setPaymentError(
        'Escribe un importe mayor a cero.',
      )

      return
    }

    if (
      amount >
      Number(
        paymentQuotation.pendingAmount ||
          0,
      ) +
        0.01
    ) {
      setPaymentError(
        'El pago no puede ser mayor al saldo pendiente.',
      )

      return
    }

    setPaymentSaving(true)
    setPaymentError('')

    try {
      await addQuotationPayment(
        paymentQuotation.id,
        {
          amount,
          method: paymentForm.method,
          date: paymentForm.date,
          note: paymentForm.note,
        },
      )

      setPaymentForm({
        ...EMPTY_PAYMENT,
        amount: '',
      })
    } catch (firebaseError) {
      setPaymentError(
        firebaseError?.message ||
          'No fue posible registrar el pago.',
      )
    } finally {
      setPaymentSaving(false)
    }
  }

  const handleRemovePayment = async (
    payment,
  ) => {
    if (
      !paymentQuotation ||
      paymentSaving
    ) {
      return
    }

    const confirmed =
      window.confirm(
        `¿Eliminar el pago de ${money(
          payment.amount,
        )}?`,
      )

    if (!confirmed) {
      return
    }

    setPaymentSaving(true)
    setPaymentError('')

    try {
      await removeQuotationPayment(
        paymentQuotation.id,
        payment.id,
      )
    } catch (firebaseError) {
      setPaymentError(
        firebaseError?.message ||
          'No fue posible eliminar el pago.',
      )
    } finally {
      setPaymentSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.brandMark}>
          A
        </div>

        <div>
          <span className={styles.eyebrow}>
            AMPERIUM
          </span>

          <h1>Cotizaciones</h1>

          <p>
            Control comercial y financiero de cada propuesta.
          </p>
        </div>
      </header>

      <section className={styles.summaryGrid}>
        <article>
          <span>Total cotizado</span>

          <strong>
            {money(summary.total)}
          </strong>
        </article>

        <article>
          <span>Total recibido</span>

          <strong>
            {money(summary.paid)}
          </strong>
        </article>

        <article>
          <span>Por cobrar</span>

          <strong>
            {money(summary.pending)}
          </strong>
        </article>
      </section>

      <section className={styles.toolbar}>
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Buscar cliente, proyecto o folio"
        />

        <div className={styles.filters}>
          {[
            ['all', 'Todas'],
            ['borrador', 'Borradores'],
            ['enviada', 'Enviadas'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() =>
                setStatusFilter(value)
              }
              className={
                statusFilter === value
                  ? styles.filterActive
                  : ''
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.filters}>
          {[
            [
              'all',
              'Todos los cobros',
            ],
            [
              'pendiente',
              'Pendientes',
            ],
            [
              'anticipo',
              'Con anticipo',
            ],
            [
              'liquidada',
              'Liquidadas',
            ],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() =>
                setFinancialFilter(
                  value,
                )
              }
              className={
                financialFilter ===
                value
                  ? styles.filterActive
                  : ''
              }
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div
          className={
            styles.errorBanner
          }
        >
          {error}
        </div>
      ) : null}

      <section
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
            {loading
              ? 'Cargando...'
              : `${filteredQuotations.length} cotizaciones`}
          </strong>

          <span>
            {
              quotations.filter(
                (item) =>
                  item.status ===
                  'borrador',
              ).length
            }{' '}
            borradores
          </span>
        </div>

        {loading ? (
          <div
            className={
              styles.emptyState
            }
          >
            Sincronizando con Firestore...
          </div>
        ) : filteredQuotations.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <strong>
              No hay cotizaciones
            </strong>

            <p>
              Usa el botón flotante para crear la primera.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.quotationList
            }
          >
            {filteredQuotations.map(
              (quotation) => {
                const total =
                  Number(
                    quotation.totals
                      ?.total || 0,
                  )

                const paid =
                  Number(
                    quotation.paidAmount ||
                      0,
                  )

                const pending =
                  Number(
                    quotation.pendingAmount ||
                      0,
                  )

                const progress =
                  total > 0
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          (
                            paid /
                            total
                          ) *
                            100,
                        ),
                      )
                    : 0

                const quotationDate =
                  quotation.issuedAt ||
                  quotation.createdAt ||
                  quotation.updatedAt

                return (
                  <article
                    className={
                      styles.quotationCard
                    }
                    key={
                      quotation.id
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
                            {quotation.folio ||
                              'BORRADOR'}
                          </span>

                          <span
                            className={`${styles.statusBadge} ${
                              styles[
                                `status_${quotation.status}`
                              ] || ''
                            }`}
                          >
                            {quotation.status ===
                            'enviada'
                              ? 'Enviada'
                              : 'Borrador'}
                          </span>
                        </div>

                        <h2>
                          {quotation.projectName ||
                            'Sin nombre de proyecto'}
                        </h2>

                        <p>
                          {quotation.clientName ||
                            'Sin cliente'}
                        </p>
                      </div>

                      <div
                        className={
                          styles.totalBlock
                        }
                      >
                        <span>
                          Total
                        </span>

                        <strong>
                          {money(total)}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.dateRow
                      }
                    >
                      <span>
                        Cotización del{' '}
                        <strong>
                          {formatDate(
                            quotationDate,
                          )}
                        </strong>
                      </span>

                      <span>
                        {quotation.items
                          ?.length || 0}{' '}
                        conceptos
                      </span>
                    </div>

                    <div
                      className={
                        styles.financePanel
                      }
                    >
                      <div
                        className={
                          styles.financeHeader
                        }
                      >
                        <span
                          className={`${styles.financeBadge} ${
                            styles[
                              `finance_${quotation.financialStatus}`
                            ] || ''
                          }`}
                        >
                          {financialLabel(
                            quotation.financialStatus,
                          )}
                        </span>

                        <small>
                          {Math.round(
                            progress,
                          )}
                          % cubierto
                        </small>
                      </div>

                      <div
                        className={
                          styles.progressTrack
                        }
                      >
                        <span
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <div
                        className={
                          styles.moneyGrid
                        }
                      >
                        <div>
                          <span>
                            Pagado
                          </span>

                          <strong>
                            {money(paid)}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Pendiente
                          </span>

                          <strong>
                            {money(
                              pending,
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div
                      className={
                        styles.cardActions
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            quotation,
                          )
                        }
                      >
                        Editar
                      </button>

                      {quotation.folio ? (
                        <button
                          type="button"
                          onClick={() =>
                            handlePdf(
                              quotation,
                            )
                          }
                        >
                          PDF
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className={
                          styles.paymentButton
                        }
                        onClick={() =>
                          openPayments(
                            quotation,
                          )
                        }
                      >
                        Cobros
                      </button>

                      <button
                        type="button"
                        className={
                          styles.deleteButton
                        }
                        onClick={() =>
                          handleDelete(
                            quotation,
                          )
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
      </section>

      <button
        type="button"
        className={
          styles.floatingButton
        }
        onClick={openNew}
        aria-label="Nueva cotización"
      >
        +
      </button>

      <QuotationFormModal
        open={modalOpen}
        quotation={editingQuotation}
        clients={clients}
        saving={saving}
        onClose={closeModal}
        onSave={handleSave}
      />

      {paymentQuotation ? (
        <div
          className={
            styles.paymentOverlay
          }
          onMouseDown={
            closePayments
          }
        >
          <section
            className={
              styles.paymentModal
            }
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header
              className={
                styles.paymentModalHeader
              }
            >
              <div>
                <span>
                  {paymentQuotation.folio ||
                    'BORRADOR'}
                </span>

                <h2>
                  Control de cobros
                </h2>

                <p>
                  {
                    paymentQuotation.clientName
                  }{' '}
                  ·{' '}
                  {
                    paymentQuotation.projectName
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePayments
                }
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>

            <div
              className={
                styles.paymentSummary
              }
            >
              <div>
                <span>Total</span>

                <strong>
                  {money(
                    paymentQuotation
                      .totals?.total,
                  )}
                </strong>
              </div>

              <div>
                <span>Pagado</span>

                <strong>
                  {money(
                    paymentQuotation
                      .paidAmount,
                  )}
                </strong>
              </div>

              <div>
                <span>Pendiente</span>

                <strong>
                  {money(
                    paymentQuotation
                      .pendingAmount,
                  )}
                </strong>
              </div>
            </div>

            {Number(
              paymentQuotation.pendingAmount ||
                0,
            ) > 0 ? (
              <div
                className={
                  styles.paymentForm
                }
              >
                <label>
                  Importe

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      paymentForm.amount
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (current) => ({
                          ...current,
                          amount:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  Método

                  <select
                    value={
                      paymentForm.method
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (current) => ({
                          ...current,
                          method:
                            event.target
                              .value,
                        }),
                      )
                    }
                  >
                    <option value="transferencia">
                      Transferencia
                    </option>

                    <option value="efectivo">
                      Efectivo
                    </option>

                    <option value="tarjeta">
                      Tarjeta
                    </option>

                    <option value="deposito">
                      Depósito
                    </option>

                    <option value="otro">
                      Otro
                    </option>
                  </select>
                </label>

                <label>
                  Fecha

                  <input
                    type="date"
                    value={
                      paymentForm.date
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (current) => ({
                          ...current,
                          date:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label
                  className={
                    styles.paymentNote
                  }
                >
                  Nota

                  <input
                    value={
                      paymentForm.note
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (current) => ({
                          ...current,
                          note:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="Ej. Anticipo para materiales"
                  />
                </label>

                <button
                  type="button"
                  className={
                    styles.registerPaymentButton
                  }
                  onClick={
                    handleAddPayment
                  }
                  disabled={
                    paymentSaving
                  }
                >
                  {paymentSaving
                    ? 'Guardando...'
                    : 'Registrar pago'}
                </button>
              </div>
            ) : (
              <div
                className={
                  styles.liquidatedMessage
                }
              >
                Esta cotización está liquidada.
              </div>
            )}

            {paymentError ? (
              <div
                className={
                  styles.paymentError
                }
              >
                {paymentError}
              </div>
            ) : null}

            <div
              className={
                styles.paymentHistory
              }
            >
              <div
                className={
                  styles.paymentHistoryTitle
                }
              >
                <h3>
                  Historial de pagos
                </h3>

                <span>
                  {paymentQuotation
                    .payments?.length ||
                    0}{' '}
                  movimientos
                </span>
              </div>

              {paymentQuotation.payments
                ?.length ? (
                paymentQuotation.payments.map(
                  (payment) => (
                    <article
                      key={payment.id}
                      className={
                        styles.paymentItem
                      }
                    >
                      <div>
                        <strong>
                          {money(
                            payment.amount,
                          )}
                        </strong>

                        <span>
                          {formatDate(
                            payment.date,
                          )}{' '}
                          ·{' '}
                          {
                            payment.method
                          }
                        </span>

                        {payment.note ? (
                          <p>
                            {
                              payment.note
                            }
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemovePayment(
                            payment,
                          )
                        }
                        disabled={
                          paymentSaving
                        }
                      >
                        Eliminar
                      </button>
                    </article>
                  ),
                )
              ) : (
                <div
                  className={
                    styles.noPayments
                  }
                >
                  Todavía no hay pagos registrados.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default CotizacionesPage