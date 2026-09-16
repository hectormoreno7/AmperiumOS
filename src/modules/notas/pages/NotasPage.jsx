import {
  useEffect,
  useState,
} from 'react'
import {
  FileDown,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import SignaturePad from '../../cotizaciones/components/SignaturePad'
import { subscribeToClients } from '../../clientes/services/clientesStorage'
import { createClient } from '../../clientes/services/clientesStorage'
import {
  createNote,
  removeNote,
  subscribeToNotes,
} from '../services/notasService'
import { generateNotePdf } from '../services/notasPdfService'
import branding from '../../../shared/constants/branding'
import useCompanyConfiguration from '../../configuracion/hooks/useCompanyConfiguration'
import styles from './NotasPage.module.css'
import itemStyles from './NotasItems.module.css'

const EMPTY = {
  clientMode: 'existing',
  clientId: '',
  clientName: '',
  phone: '',
  details: '',
  items: [
    {
      quantity: 1,
      description: '',
      unitCost: '',
    },
  ],
  taxEnabled: false,
  taxRate: 16,
  paymentMethod: 'efectivo',
  paymentDetails: '',
  signature: '',
}

const money = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value || 0))

function NotasPage() {
  const companyConfiguration =
    useCompanyConfiguration()
  const [notes, setNotes] = useState([])
  const [clients, setClients] =
    useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] =
    useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribeNotes =
      subscribeToNotes(setNotes, (value) =>
        setError(value.message),
      )
    const unsubscribeClients =
      subscribeToClients(setClients)
    return () => {
      unsubscribeNotes()
      unsubscribeClients()
    }
  }, [])

  const update = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

  const updateItem = (
    index,
    field,
    value,
  ) =>
    setForm((current) => ({
      ...current,
      items: current.items.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item,
      ),
    }))

  const subtotal = form.items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity || 0) *
        Number(item.unitCost || 0),
    0,
  )
  const total =
    subtotal *
    (form.taxEnabled
      ? 1 + Number(form.taxRate) / 100
      : 1)

  const openNoteForm = () => {
    setForm({
      ...EMPTY,
      items: EMPTY.items.map((item) => ({
        ...item,
      })),
      taxRate: 16,
    })
    setError('')
    setOpen(true)
  }

  const save = async (event) => {
    event.preventDefault()
    if (
      !form.items.some((item) =>
        item.description.trim(),
      )
    ) {
      setError(
        'Agrega por lo menos una descripción.',
      )
      return
    }
    if (total <= 0) {
      setError(
        'Ingresa un importe mayor a cero.',
      )
      return
    }
    setSaving(true)
    try {
      let clientId = form.clientId
      if (
        form.clientMode === 'new' &&
        form.clientName.trim()
      ) {
        clientId = await createClient({
          name: form.clientName,
          phones: form.phone
            ? [form.phone]
            : [],
          status: 'active',
        })
      }
      await createNote({
        ...form,
        clientId,
        concept:
          form.items[0]?.description ||
          'Nota de venta',
      })
      setForm({
        ...EMPTY,
        taxRate: 16,
      })
      setOpen(false)
      setError('')
    } catch (value) {
      setError(value.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.page}>
      {error ? (
        <p className={styles.error}>
          {error}
        </p>
      ) : null}

      <div className={styles.list}>
        {notes.map((note) => (
          <article key={note.id}>
            <div>
              <span>{note.folio}</span>
              <h2>{note.concept}</h2>
              <p>
                {note.clientName ||
                  'Venta rápida'}
              </p>
            </div>
            <div className={styles.amount}>
              <strong>
                {money(note.total)}
              </strong>
              <small
                className={styles.paid}
              >
                Realizado
              </small>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() =>
                  generateNotePdf(note)
                }
              >
                <FileDown size={16} />
                PDF
              </button>
              <button
                type="button"
                aria-label="Eliminar"
                onClick={() =>
                  removeNote(note.id)
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        className={styles.fab}
        onClick={openNoteForm}
      >
        <Plus size={26} />
      </button>

      {open ? (
        <div className={styles.overlay}>
          <form
            className={styles.modal}
            onSubmit={save}
          >
            <header>
              <div className={styles.headerBrand}>
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
                  <span>Notas rápidas</span>
                  <h2>Nueva nota rápida</h2>
                  <p>
                    Registra y cobra sin crear un servicio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </header>
            <div className={styles.form}>
              <label>
                Cliente opcional
                <select
                  value={
                    form.clientMode === 'new'
                      ? '__new__'
                      : form.clientId
                  }
                  onChange={(event) => {
                    if (
                      event.target.value ===
                      '__new__'
                    ) {
                      update('clientMode', 'new')
                      update('clientId', '')
                      update('clientName', '')
                      update('phone', '')
                      return
                    }
                    const client =
                      clients.find(
                        (item) =>
                          item.id ===
                          event.target.value,
                      )
                    update(
                      'clientId',
                      client?.id || '',
                    )
                    update(
                      'clientName',
                      client?.name || '',
                    )
                    update(
                      'phone',
                      client?.phones?.[0] ||
                        client?.phone ||
                        '',
                    )
                    update(
                      'clientMode',
                      'existing',
                    )
                  }}
                >
                  <option value="">
                    Venta rápida
                  </option>
                  <option value="__new__">
                    + Nuevo cliente
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
              <label>
                Nombre del cliente
                <input
                  autoFocus
                  value={form.clientName}
                  onChange={(event) =>
                    update(
                      'clientName',
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Juan Pérez"
                />
              </label>
              <label>
                Teléfono
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    update(
                      'phone',
                      event.target.value,
                    )
                  }
                  placeholder="228 000 0000"
                />
              </label>
              <label className={styles.full}>
                Detalle opcional
                <textarea
                  rows="3"
                  value={form.details}
                  onChange={(event) =>
                    update(
                      'details',
                      event.target.value,
                    )
                  }
                />
              </label>
              <div className={`${styles.full} ${itemStyles.items}`}>
                {form.items.map((item, index) => (
                  <div key={index}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      aria-label="Cantidad"
                      onChange={(event) =>
                        updateItem(index, 'quantity', event.target.value)
                      }
                    />
                    <input
                      value={item.description}
                      placeholder="Descripción"
                      onChange={(event) =>
                        updateItem(index, 'description', event.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      placeholder="Costo"
                      onChange={(event) =>
                        updateItem(index, 'unitCost', event.target.value)
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    update('items', [
                      ...form.items,
                      {
                        quantity: 1,
                        description: '',
                        unitCost: '',
                      },
                    ])
                  }
                >
                  + Agregar concepto
                </button>
              </div>
              <label>
                Medio de pago
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    update(
                      'paymentMethod',
                      event.target.value,
                    )
                  }
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="mixto">Mixto</option>
                </select>
              </label>
              <label>
                Detalle de pago
                <input
                  value={form.paymentDetails}
                  onChange={(event) =>
                    update(
                      'paymentDetails',
                      event.target.value,
                    )
                  }
                  placeholder="Opcional para pago mixto"
                />
              </label>
              <label className={itemStyles.tax}>
                <input
                  type="checkbox"
                  checked={form.taxEnabled}
                  onChange={(event) =>
                    update(
                      'taxEnabled',
                      event.target.checked,
                    )
                  }
                />
                Agregar IVA ({form.taxRate}%)
              </label>
              <strong className={itemStyles.total}>
                Total: {money(total)}
              </strong>
              <div className={styles.full}>
                <SignaturePad
                  label="Firma de conformidad"
                  value={form.signature}
                  onChange={(value) =>
                    update(
                      'signature',
                      value,
                    )
                  }
                />
              </div>
            </div>
            <footer>
              <button
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Guardando…'
                  : 'Guardar nota'}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default NotasPage
