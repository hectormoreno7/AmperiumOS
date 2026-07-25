import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import SignaturePad from './SignaturePad'
import {
  calculateQuotationItem,
  calculateQuotationTotals,
} from '../services/cotizacionesService'
import styles from './QuotationFormModal.module.css'

const GENERAL_CONDITIONS = `La presente cotización tiene vigencia de 10 días naturales a partir de la fecha de emisión.
Los precios podrán variar por disponibilidad, cambios de proveedor o condiciones del mercado.
El anticipo solicitado permite programación del servicio y adquisición de materiales y/o equipos.
No aplicarán reembolsos sobre materiales adquiridos o trabajos ejecutados.
La garantía estará sujeta al tipo de instalación, equipo y fabricante.
No aplica garantía por manipulación de terceros, variaciones de voltaje, humedad, vandalismo o mal uso.
Trabajos foráneos podrán generar costos adicionales por viáticos, hospedaje o transporte.
Cambios de alcance podrán requerir cotización complementaria.
La aprobación de esta cotización implica aceptación de términos, alcances y condiciones del servicio.`

const INCLUDED_SCOPE = `Suministro de materiales y equipos cotizados.
Mano de obra de instalación.
Puesta en marcha y pruebas básicas de funcionamiento.
Configuración básica de equipos, cuando aplique.`

const EMPTY_ITEM = () => ({
  id: crypto.randomUUID(),
  quantity: 1,
  unit: 'Pza.',
  description: '',
  conceptType: 'product',
  costPrice: 0,
  profitRate: 35,
})

const INITIAL_FORM = {
  clientMode: 'new',
  saveClient: true,
  clientId: '',
  clientName: '',
  projectName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  paymentMethod: 'transferencia',
  advanceRate: 70,
  deliveryTime: '',
  warranty: '',
  validityDays: 10,
  summary: '',
  notes: '',
  taxEnabled: false,
  status: 'borrador',
  items: [EMPTY_ITEM()],
  generalConditions: GENERAL_CONDITIONS,
  exclusions: '',
  includedScope: INCLUDED_SCOPE,
  excludedScope: '',
  diagramImage: '',
  diagramImageName: '',
  responsibleName: 'Ing. Héctor Zárate',
  responsibleSignature: '',
  clientSignature: '',
}

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

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
          new Error('La imagen no es válida.'),
        )

      image.onload = () => {
        const maxSize = 1600
        const scale = Math.min(
          1,
          maxSize /
            Math.max(
              image.width,
              image.height,
            ),
        )

        const canvas =
          document.createElement('canvas')

        canvas.width = Math.max(
          1,
          Math.round(image.width * scale),
        )

        canvas.height = Math.max(
          1,
          Math.round(image.height * scale),
        )

        canvas
          .getContext('2d')
          .drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height,
          )

        resolve(
          canvas.toDataURL(
            'image/jpeg',
            0.78,
          ),
        )
      }

      image.src = reader.result
    }

    reader.readAsDataURL(file)
  })

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0))

function QuotationFormModal({
  open,
  quotation,
  clients,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] =
    useState(INITIAL_FORM)

  const [error, setError] =
    useState('')

  const [
    processingImage,
    setProcessingImage,
  ] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setError('')

    setForm(
      quotation
        ? {
            ...INITIAL_FORM,
            ...quotation,
            clientMode: quotation.clientId
              ? 'existing'
              : 'new',
            saveClient:
              Boolean(quotation.clientId),
            items: quotation.items?.length
              ? quotation.items.map(
                  (item) => ({
                    ...EMPTY_ITEM(),
                    ...item,
                  }),
                )
              : [EMPTY_ITEM()],
          }
        : {
            ...INITIAL_FORM,
            items: [EMPTY_ITEM()],
          },
    )
  }, [open, quotation])

  const totals = useMemo(
    () =>
      calculateQuotationTotals(
        form.items,
        form.taxEnabled,
        form.advanceRate,
      ),
    [
      form.items,
      form.taxEnabled,
      form.advanceRate,
    ],
  )

  if (!open) {
    return null
  }

  const updateField = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

  const changeClientMode = (clientMode) => {
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

  const selectClient = (clientId) => {
    const client = clients.find(
      (item) => item.id === clientId,
    )

    if (!client) {
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
      clientId: client.id,
      clientName: client.name,
      contactName:
        client.contactName || '',
      phone: client.phones?.[0] || '',
      email: client.email || '',
      address: client.address || '',
      saveClient: false,
    }))
  }

  const updateItem = (
    itemId,
    field,
    value,
  ) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }))

  const addItem = () =>
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        EMPTY_ITEM(),
      ],
    }))

  const removeItem = (itemId) =>
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter(
              (item) =>
                item.id !== itemId,
            ),
    }))

  const handleImage = async (event) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError(
        'Selecciona una imagen válida.',
      )

      return
    }

    setProcessingImage(true)
    setError('')

    try {
      const diagramImage =
        await compressImage(file)

      setForm((current) => ({
        ...current,
        diagramImage,
        diagramImageName: file.name,
      }))
    } catch (imageError) {
      setError(imageError.message)
    } finally {
      setProcessingImage(false)
      event.target.value = ''
    }
  }

  const validate = () => {
    if (!form.clientName.trim()) {
      return 'Escribe o selecciona un cliente.'
    }

    if (
      form.clientMode === 'existing' &&
      !form.clientId
    ) {
      return 'Selecciona un cliente existente.'
    }

    if (!form.projectName.trim()) {
      return 'Escribe el nombre del proyecto o trabajo.'
    }

    const validItems =
      form.items.filter((item) =>
        item.description.trim(),
      )

    if (!validItems.length) {
      return 'Agrega al menos un concepto con descripción.'
    }

    return ''
  }

  const submit = async (action) => {
    setError('')

    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    const validItems =
      form.items.filter((item) =>
        item.description.trim(),
      )

    await onSave(
      {
        ...form,
        items: validItems,
      },
      action,
    )
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
        <header className={styles.header}>
          <div
            className={styles.headerBrand}
          >
            <div
              className={styles.headerSymbol}
            >
              A
            </div>

            <div>
              <span>AMPERIUM</span>

              <h2>
                {quotation
                  ? 'Editar cotización'
                  : 'Nueva cotización'}
              </h2>
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

        <div className={styles.form}>
          <section className={styles.section}>
            <h3>Cliente y proyecto</h3>

            <div className={styles.gridTwo}>
              <label>
                Tipo de cliente

                <select
                  value={form.clientMode}
                  onChange={(event) =>
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

              <label>
                Proyecto o trabajo

                <input
                  value={form.projectName}
                  onChange={(event) =>
                    updateField(
                      'projectName',
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Instalación eléctrica residencial"
                />
              </label>
            </div>

            {form.clientMode ===
            'existing' ? (
              <label>
                Seleccionar cliente

                <select
                  value={form.clientId}
                  onChange={(event) =>
                    selectClient(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Seleccionar cliente
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
              </label>
            ) : (
              <label>
                Nombre del cliente

                <input
                  value={form.clientName}
                  onChange={(event) =>
                    updateField(
                      'clientName',
                      event.target.value,
                    )
                  }
                  placeholder="Nombre de la persona o empresa"
                />
              </label>
            )}

            <div className={styles.gridThree}>
              <label>
                Contacto

                <input
                  value={form.contactName}
                  onChange={(event) =>
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
                  onChange={(event) =>
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
                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value,
                    )
                  }
                  placeholder="correo@ejemplo.com"
                />
              </label>
            </div>

            <label>
              Dirección

              <input
                value={form.address}
                onChange={(event) =>
                  updateField(
                    'address',
                    event.target.value,
                  )
                }
                placeholder="Dirección del cliente o proyecto"
              />
            </label>

            {form.clientMode === 'new' ? (
              <label
                className={styles.taxToggle}
              >
                <input
                  type="checkbox"
                  checked={form.saveClient}
                  onChange={(event) =>
                    updateField(
                      'saveClient',
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Guardar este cliente en el
                  módulo Clientes para usarlo
                  posteriormente.
                </span>
              </label>
            ) : null}
          </section>

          <section className={styles.section}>
            <div
              className={
                styles.sectionTitleRow
              }
            >
              <div>
                <h3>Conceptos</h3>

                <p>
                  Material/equipo: el costo
                  capturado incluye IVA.
                  Servicio: el IVA depende de
                  la cotización.
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={addItem}
              >
                + Agregar concepto
              </button>
            </div>

            <div className={styles.itemsHeader}>
              <span>Cant.</span>
              <span>Unidad</span>
              <span>Tipo</span>
              <span>Descripción</span>
              <span>Costo</span>
              <span>Ganancia</span>
              <span>P. final</span>
              <span>Importe</span>
              <span />
            </div>

            <div className={styles.itemsList}>
              {form.items.map((item) => {
                const calculation =
                  calculateQuotationItem(
                    item,
                    form.taxEnabled,
                  )

                return (
                  <div
                    className={styles.itemRow}
                    key={item.id}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          'quantity',
                          event.target.value,
                        )
                      }
                    />

                    <select
                      value={item.unit}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          'unit',
                          event.target.value,
                        )
                      }
                    >
                      <option value="Pza.">
                        Pieza
                      </option>

                      <option value="m">
                        M
                      </option>

                      <option value="Serv.">
                        Serv.
                      </option>

                      <option value="Lote">
                        Lote
                      </option>
                    </select>

                    <select
                      value={item.conceptType}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          'conceptType',
                          event.target.value,
                        )
                      }
                    >
                      <option value="product">
                        Material/equipo
                      </option>

                      <option value="service">
                        Servicio
                      </option>
                    </select>

                    <textarea
                      rows="2"
                      value={item.description}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          'description',
                          event.target.value,
                        )
                      }
                      placeholder="Descripción del concepto"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.costPrice}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          'costPrice',
                          event.target.value,
                        )
                      }
                    />

                    <div
                      className={
                        styles.percentInput
                      }
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.profitRate
                        }
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            'profitRate',
                            event.target.value,
                          )
                        }
                      />

                      <span>%</span>
                    </div>

                    <strong>
                      {money(
                        calculation.finalUnitPrice,
                      )}
                    </strong>

                    <strong>
                      {money(
                        calculation.amount,
                      )}
                    </strong>

                    <button
                      type="button"
                      className={
                        styles.removeButton
                      }
                      onClick={() =>
                        removeItem(item.id)
                      }
                      aria-label="Eliminar concepto"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h3>
              Condiciones comerciales
            </h3>

            <div className={styles.gridFour}>
              <label>
                Forma de pago

                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    updateField(
                      'paymentMethod',
                      event.target.value,
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
                </select>
              </label>

              <label>
                Anticipo

                <div
                  className={
                    styles.percentInput
                  }
                >
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.advanceRate}
                    onChange={(event) =>
                      updateField(
                        'advanceRate',
                        event.target.value,
                      )
                    }
                  />

                  <span>%</span>
                </div>
              </label>

              <label>
                Entrega

                <input
                  value={form.deliveryTime}
                  onChange={(event) =>
                    updateField(
                      'deliveryTime',
                      event.target.value,
                    )
                  }
                  placeholder="Ej. 5 días hábiles"
                />
              </label>

              <label>
                Garantía

                <input
                  value={form.warranty}
                  onChange={(event) =>
                    updateField(
                      'warranty',
                      event.target.value,
                    )
                  }
                  placeholder="Ej. 90 días"
                />
              </label>
            </div>

            <label className={styles.taxToggle}>
              <input
                type="checkbox"
                checked={form.taxEnabled}
                onChange={(event) =>
                  updateField(
                    'taxEnabled',
                    event.target.checked,
                  )
                }
              />

              <span>
                Aplicar IVA del 16% a servicios.
                Los materiales/equipos siempre
                conservan el IVA correspondiente
                dentro de su precio final.
              </span>
            </label>

            <div className={styles.gridTwo}>
              <label>
                Resumen ejecutivo

                <textarea
                  rows="3"
                  value={form.summary}
                  onChange={(event) =>
                    updateField(
                      'summary',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Notas

                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(event) =>
                    updateField(
                      'notes',
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Imagen o diagrama</h3>

            <div className={styles.imageArea}>
              {form.diagramImage ? (
                <img
                  src={form.diagramImage}
                  alt="Diagrama del proyecto"
                />
              ) : (
                <div>
                  Sin imagen agregada
                </div>
              )}

              <div>
                <label
                  className={styles.fileButton}
                >
                  {processingImage
                    ? 'Procesando...'
                    : 'Agregar imagen'}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    disabled={processingImage}
                  />
                </label>

                {form.diagramImage ? (
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        diagramImage: '',
                        diagramImageName: '',
                      }))
                    }
                  >
                    Quitar imagen
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3>
              Términos y condiciones
            </h3>

            <label>
              Condiciones generales

              <textarea
                rows="10"
                value={
                  form.generalConditions
                }
                onChange={(event) =>
                  updateField(
                    'generalConditions',
                    event.target.value,
                  )
                }
              />
            </label>

            <div className={styles.gridTwo}>
              <label>
                Alcance incluido

                <textarea
                  rows="7"
                  value={form.includedScope}
                  onChange={(event) =>
                    updateField(
                      'includedScope',
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Alcance no incluido

                <textarea
                  rows="7"
                  value={form.excludedScope}
                  onChange={(event) =>
                    updateField(
                      'excludedScope',
                      event.target.value,
                    )
                  }
                  placeholder="Agrega lo que no está contemplado."
                />
              </label>
            </div>

            <label>
              Exclusiones / excepciones

              <textarea
                rows="6"
                value={form.exclusions}
                onChange={(event) =>
                  updateField(
                    'exclusions',
                    event.target.value,
                  )
                }
                placeholder="Agrega exclusiones particulares de esta cotización."
              />
            </label>
          </section>

          <section className={styles.section}>
            <h3>Firmas</h3>

            <div className={styles.gridTwo}>
              <div>
                <label>
                  Responsable

                  <input
                    value={
                      form.responsibleName
                    }
                    onChange={(event) =>
                      updateField(
                        'responsibleName',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <SignaturePad
                  value={
                    form.responsibleSignature
                  }
                  onChange={(value) =>
                    updateField(
                      'responsibleSignature',
                      value,
                    )
                  }
                  label="Firma de Amperium"
                />
              </div>

              <SignaturePad
                value={form.clientSignature}
                onChange={(value) =>
                  updateField(
                    'clientSignature',
                    value,
                  )
                }
                label="Firma del cliente"
              />
            </div>
          </section>

          <section className={styles.summaryBox}>
            <div>
              <span>Subtotal</span>

              <strong>
                {money(totals.subtotal)}
              </strong>
            </div>

            <div>
              <span>IVA</span>

              <strong>
                {money(totals.tax)}
              </strong>
            </div>

            <div className={styles.totalRow}>
              <span>Total</span>

              <strong>
                {money(totals.total)}
              </strong>
            </div>

            <div>
              <span>
                Anticipo {form.advanceRate}%
              </span>

              <strong>
                {money(
                  totals.advanceAmount,
                )}
              </strong>
            </div>

            <div>
              <span>Saldo restante</span>

              <strong>
                {money(
                  totals.remainingAmount,
                )}
              </strong>
            </div>
          </section>

          {error ? (
            <div className={styles.error}>
              {error}
            </div>
          ) : null}

          <footer className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.draftButton}
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
                ? 'Generando...'
                : 'Guardar y generar PDF'}
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

export default QuotationFormModal