import {
  useEffect,
  useState,
} from 'react'

import branding from '../../../shared/constants/branding'
import useCompanyConfiguration from '../../configuracion/hooks/useCompanyConfiguration'
import styles from './ServiceFormModal.module.css'

const createImageId = () => {
  if (
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()}`
}

const INITIAL_FORM = {
  clientMode: 'new',
  saveClient: true,

  clientId: '',
  clientName: '',
  contactName: '',
  phone: '',
  email: '',

  title: '',
  description: '',

  address: '',
  mapsUrl: '',

  scheduledDate: '',
  scheduledTime: '',
  estimatedDuration: '',

  assignedTo:
    'Ing. Héctor Zárate',

  priority: 'normal',
  status: 'borrador',

  observations: '',
  internalNotes: '',

  images: [],
  expenses: [],
  quotedTotal: 0,
  paidAmount: 0,
  extraTaxEnabled: false,
}

const compressImage = (
  file,
) =>
  new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader()

      reader.onerror = () =>
        reject(
          new Error(
            'No fue posible leer la imagen.',
          ),
        )

      reader.onload = () => {
        const image = new Image()

        image.onerror = () =>
          reject(
            new Error(
              'La imagen no es válida.',
            ),
          )

        image.onload = () => {
          const maxSize = 1400

          const scale = Math.min(
            1,
            maxSize /
              Math.max(
                image.width,
                image.height,
              ),
          )

          const canvas =
            document.createElement(
              'canvas',
            )

          canvas.width = Math.max(
            1,
            Math.round(
              image.width * scale,
            ),
          )

          canvas.height = Math.max(
            1,
            Math.round(
              image.height * scale,
            ),
          )

          const context =
            canvas.getContext('2d')

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height,
          )

          resolve(
            canvas.toDataURL(
              'image/jpeg',
              0.72,
            ),
          )
        }

        image.src = reader.result
      }

      reader.readAsDataURL(file)
    },
  )

function ServiceFormModal({
  open,
  service,
  clients = [],
  saving,
  onClose,
  onSave,
}) {
  const companyConfiguration =
    useCompanyConfiguration()
  const [form, setForm] =
    useState(INITIAL_FORM)

  const [error, setError] =
    useState('')

  const [
    processingImages,
    setProcessingImages,
  ] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setError('')

    if (service) {
      setForm({
        ...INITIAL_FORM,
        ...service,

        clientMode:
          service.clientId
            ? 'existing'
            : 'new',

        saveClient:
          Boolean(service.clientId),

        images:
          Array.isArray(
            service.images,
          )
            ? service.images
            : [],
      })

      return
    }

    setForm({
      ...INITIAL_FORM,
      images: [],
    })
  }, [open, service])

  if (!open) {
    return null
  }

  const updateField = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const changeClientMode = (
    clientMode,
  ) => {
    setForm((current) => ({
      ...current,

      clientMode,
      clientId: '',
      clientName: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',

      saveClient:
        clientMode === 'new',
    }))
  }

  const selectClient = (
    clientId,
  ) => {
    const selectedClient =
      clients.find(
        (client) =>
          client.id === clientId,
      )

    if (!selectedClient) {
      setForm((current) => ({
        ...current,

        clientId: '',
        clientName: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
      }))

      return
    }

    setForm((current) => ({
      ...current,

      clientId:
        selectedClient.id,

      clientName:
        selectedClient.name,

      contactName:
        selectedClient.contactName ||
        '',

      phone:
        selectedClient.phones?.[0] ||
        '',

      email:
        selectedClient.email ||
        '',

      address:
        selectedClient.address ||
        '',

      saveClient: false,
    }))
  }

  const handleImages = async (
    event,
  ) => {
    const files = Array.from(
      event.target.files || [],
    )

    if (!files.length) {
      return
    }

    const invalidFile =
      files.find(
        (file) =>
          !file.type.startsWith(
            'image/',
          ),
      )

    if (invalidFile) {
      setError(
        'Selecciona únicamente imágenes válidas.',
      )

      event.target.value = ''
      return
    }

    setProcessingImages(true)
    setError('')

    try {
      const processedImages =
        await Promise.all(
          files.map(
            async (file) => ({
              id: createImageId(),
              name: file.name,
              data:
                await compressImage(
                  file,
                ),
            }),
          ),
        )

      setForm((current) => ({
        ...current,

        images: [
          ...current.images,
          ...processedImages,
        ].slice(0, 8),
      }))
    } catch (imageError) {
      setError(
        imageError.message ||
          'No fue posible procesar las imágenes.',
      )
    } finally {
      setProcessingImages(false)
      event.target.value = ''
    }
  }

  const removeImage = (
    imageId,
  ) => {
    setForm((current) => ({
      ...current,

      images:
        current.images.filter(
          (image) =>
            image.id !== imageId,
        ),
    }))
  }

  const addExpense = () => {
    setForm((current) => ({
      ...current,
      expenses: [
        ...(current.expenses || []),
        {
          id: createImageId(),
          description: '',
          amount: '',
          date: new Date()
            .toISOString()
            .slice(0, 10),
        },
      ],
    }))
  }

  const updateExpense = (
    expenseId,
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      expenses: (
        current.expenses || []
      ).map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              [field]: value,
            }
          : expense,
      ),
    }))
  }

  const removeExpense = (
    expenseId,
  ) => {
    setForm((current) => ({
      ...current,
      expenses: (
        current.expenses || []
      ).filter(
        (expense) =>
          expense.id !== expenseId,
      ),
    }))
  }

  const validate = () => {
    if (
      !form.clientName.trim()
    ) {
      return 'Escribe o selecciona un cliente.'
    }

    if (
      form.clientMode ===
        'existing' &&
      !form.clientId
    ) {
      return 'Selecciona un cliente existente.'
    }

    if (!form.title.trim()) {
      return 'Escribe el nombre del servicio.'
    }

    if (
      !form.description.trim()
    ) {
      return 'Escribe la descripción del trabajo.'
    }

    return ''
  }

  const submit = async (
    action,
  ) => {
    setError('')

    const validationError =
      validate()

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const normalizedExpenses = (
        form.expenses || []
      )
        .map((expense) => ({
          ...expense,
          description:
            expense.description.trim(),
          amount: Number(
            expense.amount || 0,
          ),
        }))
        .filter(
          (expense) =>
            expense.description ||
            expense.amount > 0,
        )
      const extrasSubtotal =
        normalizedExpenses.reduce(
          (total, expense) =>
            total + expense.amount,
          0,
        )
      const extrasTax =
        form.extraTaxEnabled
          ? extrasSubtotal * 0.16
          : 0
      const finalTotal =
        Number(form.quotedTotal || 0) +
        extrasSubtotal +
        extrasTax
      const paidAmount = Number(
        form.paidAmount || 0,
      )
      const pendingAmount = Math.max(
        0,
        finalTotal - paidAmount,
      )

      await onSave(
        {
          ...form,
          expenses: normalizedExpenses,
          extrasSubtotal,
          extrasTax,
          finalTotal,
          pendingAmount,
          financialStatus:
            pendingAmount <= 0.01
              ? 'liquidada'
              : paidAmount > 0
                ? 'anticipo'
                : 'pendiente',
        },
        action,
      )
    } catch (saveError) {
      setError(
        saveError.message ||
          'No fue posible guardar el servicio.',
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
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header
          className={styles.header}
        >
          <div
            className={
              styles.headerBrand
            }
          >
            <img
              src={
                companyConfiguration.logoUrl ||
                branding.logos
                  .horizontalSimpleDarkBackground
              }
              alt={branding.appName}
              className={styles.brandLogo}
            />

            <div className={styles.headerText}>
              <span>
                Gestión de servicios
              </span>

              <h2>
                {service
                  ? 'Editar servicio'
                  : 'Nuevo servicio'}
              </h2>

              <p>
                Registra el cliente, la fecha y los detalles del trabajo.
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

        <div
          className={styles.form}
        >
          <section
            className={styles.section}
          >
            <h3>
              Cliente
            </h3>

            <div
              className={
                styles.gridTwo
              }
            >
              <label>
                Tipo de cliente

                <select
                  value={
                    form.clientMode
                  }
                  onChange={(
                    event,
                  ) =>
                    changeClientMode(
                      event.target.value,
                    )
                  }
                >
                  <option value="new">
                    Cliente nuevo
                  </option>

                  <option value="existing">
                    Cliente existente
                  </option>
                </select>
              </label>

              {form.clientMode ===
              'existing' ? (
                <label>
                  Seleccionar cliente

                  <select
                    value={
                      form.clientId
                    }
                    onChange={(
                      event,
                    ) =>
                      selectClient(
                        event.target
                          .value,
                      )
                    }
                  >
                    <option value="">
                      Seleccionar cliente
                    </option>

                    {clients.map(
                      (client) => (
                        <option
                          key={
                            client.id
                          }
                          value={
                            client.id
                          }
                        >
                          {
                            client.name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>
              ) : (
                <label>
                  Nombre del cliente

                  <input
                    value={
                      form.clientName
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'clientName',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Nombre o empresa"
                  />
                </label>
              )}
            </div>

            <div
              className={
                styles.gridThree
              }
            >
              <label>
                Contacto

                <input
                  value={
                    form.contactName
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'contactName',
                      event.target.value,
                    )
                  }
                  placeholder="Persona de contacto"
                />
              </label>

              <label>
                Teléfono

                <input
                  value={form.phone}
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'phone',
                      event.target.value,
                    )
                  }
                  placeholder="228..."
                />
              </label>

              <label>
                Correo

                <input
                  type="email"
                  value={form.email}
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'email',
                      event.target.value,
                    )
                  }
                  placeholder="correo@ejemplo.com"
                />
              </label>
            </div>

            {form.clientMode ===
            'new' ? (
              <label
                className={
                  styles.checkRow
                }
              >
                <input
                  type="checkbox"
                  checked={
                    form.saveClient
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'saveClient',
                      event.target
                        .checked,
                    )
                  }
                />

                <span>
                  Guardar cliente en
                  el módulo Clientes.
                </span>
              </label>
            ) : null}
          </section>

          <section
            className={styles.section}
          >
            <h3>
              Información del servicio
            </h3>

            <div
              className={
                styles.gridTwo
              }
            >
              <label>
                Nombre del servicio

                <input
                  value={form.title}
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'title',
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Instalación de cámaras"
                />
              </label>

              <label>
                Prioridad

                <select
                  value={
                    form.priority
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'priority',
                      event.target.value,
                    )
                  }
                >
                  <option value="baja">
                    Baja
                  </option>

                  <option value="normal">
                    Normal
                  </option>

                  <option value="alta">
                    Alta
                  </option>

                  <option value="urgente">
                    Urgente
                  </option>
                </select>
              </label>
            </div>

            <label>
              Descripción del trabajo

              <textarea
                rows="5"
                value={
                  form.description
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    'description',
                    event.target.value,
                  )
                }
                placeholder="Describe el servicio solicitado."
              />
            </label>

            <div
              className={
                styles.gridTwo
              }
            >
              <label>
                Dirección

                <input
                  value={
                    form.address
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'address',
                      event.target.value,
                    )
                  }
                  placeholder="Ubicación del servicio"
                />
              </label>

              <label>
                Enlace de Google Maps

                <input
                  value={
                    form.mapsUrl
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'mapsUrl',
                      event.target.value,
                    )
                  }
                  placeholder="https://maps.google.com/..."
                />
              </label>
            </div>
          </section>

          <section
            className={styles.section}
          >
            <h3>
              Programación
            </h3>

            <div
              className={
                styles.gridFour
              }
            >
              <label>
                Fecha

                <input
                  type="date"
                  value={
                    form.scheduledDate
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'scheduledDate',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Hora

                <input
                  type="time"
                  value={
                    form.scheduledTime
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'scheduledTime',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Duración estimada

                <input
                  value={
                    form.estimatedDuration
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'estimatedDuration',
                      event.target.value,
                    )
                  }
                  placeholder="Ej. 4 horas"
                />
              </label>

              <label>
                Responsable

                <input
                  value={
                    form.assignedTo
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'assignedTo',
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section
            className={styles.section}
          >
            <div className={styles.sectionTitleRow}>
              <div>
                <h3>
                  Extras y materiales cobrables
                </h3>

                <p>
                  Agrega trabajos o materiales que se cobrarán además del importe original.
                </p>
              </div>

              <button
                type="button"
                className={styles.addExpenseButton}
                onClick={addExpense}
              >
                + Agregar movimiento
              </button>
            </div>

            <div className={styles.financialInputs}>
              <label>
                Importe base del servicio

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quotedTotal}
                  onChange={(event) =>
                    updateField(
                      'quotedTotal',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className={styles.taxCheck}>
                <input
                  type="checkbox"
                  checked={
                    form.extraTaxEnabled
                  }
                  onChange={(event) =>
                    updateField(
                      'extraTaxEnabled',
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Aplicar IVA (16%) a los extras
                </span>
              </label>
            </div>

            {(form.expenses || []).length ? (
              <div className={styles.expenseList}>
                {form.expenses.map(
                  (expense) => (
                    <div
                      className={styles.expenseRow}
                      key={expense.id}
                    >
                      <input
                        value={expense.description}
                        onChange={(event) =>
                          updateExpense(
                            expense.id,
                            'description',
                            event.target.value,
                          )
                        }
                        placeholder="Extensión, material o trabajo adicional"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expense.amount}
                        onChange={(event) =>
                          updateExpense(
                            expense.id,
                            'amount',
                            event.target.value,
                          )
                        }
                        placeholder="$0.00"
                      />

                      <input
                        type="date"
                        value={expense.date}
                        onChange={(event) =>
                          updateExpense(
                            expense.id,
                            'date',
                            event.target.value,
                          )
                        }
                      />

                      <button
                        type="button"
                        className={styles.removeExpenseButton}
                        onClick={() =>
                          removeExpense(
                            expense.id,
                          )
                        }
                        aria-label="Eliminar movimiento"
                      >
                        ×
                      </button>
                    </div>
                  ),
                )}

                <strong className={styles.expenseTotal}>
                  Total de extras:{' '}
                  {new Intl.NumberFormat(
                    'es-MX',
                    {
                      style: 'currency',
                      currency: 'MXN',
                    },
                  ).format(
                    form.expenses.reduce(
                      (total, expense) =>
                        total +
                        Number(
                          expense.amount ||
                            0,
                        ),
                      0,
                    ),
                  )}
                </strong>
              </div>
            ) : (
              <div className={styles.emptyExpenses}>
                Aún no hay extras registrados.
              </div>
            )}
          </section>

          <section
            className={styles.section}
          >
            <h3>
              Evidencias
            </h3>

            <div
              className={
                styles.imageActions
              }
            >
              <label
                className={
                  styles.fileButton
                }
              >
                {processingImages
                  ? 'Procesando...'
                  : 'Agregar imágenes'}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={
                    processingImages
                  }
                  onChange={
                    handleImages
                  }
                />
              </label>

              <span>
                Máximo 8 imágenes
                comprimidas.
              </span>
            </div>

            {form.images.length ? (
              <div
                className={
                  styles.imageGrid
                }
              >
                {form.images.map(
                  (image) => (
                    <article
                      key={image.id}
                    >
                      <img
                        src={
                          image.data
                        }
                        alt={
                          image.name ||
                          'Evidencia'
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            image.id,
                          )
                        }
                      >
                        Quitar
                      </button>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div
                className={
                  styles.emptyImages
                }
              >
                Sin evidencias agregadas
              </div>
            )}
          </section>

          <section
            className={styles.section}
          >
            <h3>
              Observaciones
            </h3>

            <div
              className={
                styles.gridTwo
              }
            >
              <label>
                Observaciones visibles

                <textarea
                  rows="5"
                  value={
                    form.observations
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'observations',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Notas internas

                <textarea
                  rows="5"
                  value={
                    form.internalNotes
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'internalNotes',
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </section>

          {error ? (
            <div
              className={styles.error}
            >
              {error}
            </div>
          ) : null}

          <footer
            className={styles.actions}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="button"
              className={
                styles.draftButton
              }
              onClick={() =>
                submit('draft')
              }
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : 'Guardar borrador'}
            </button>

            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={() =>
                submit('finalize')
              }
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : 'Guardar servicio'}
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

export default ServiceFormModal
