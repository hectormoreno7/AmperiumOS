import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../../config/firebase'
import {
  FOLIO_TYPES,
  generateFolio,
} from '../../../core/folios/folioService'

const notesCollection = collection(
  db,
  'notas',
)
const text = (value) =>
  String(value ?? '').trim()
const number = (value) =>
  Number(value || 0)

const normalizeItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      quantity: number(item.quantity) || 1,
      description: text(
        item.description,
      ),
      unitCost: number(item.unitCost),
    }))
    .filter(
      (item) =>
        item.description ||
        item.unitCost > 0,
    )

const normalize = (snapshot) => {
  const data = snapshot.data()
  const items = normalizeItems(data.items)
  const subtotal =
    items.length > 0
      ? items.reduce(
          (sum, item) =>
            sum +
            item.quantity *
              item.unitCost,
          0,
        )
      : number(data.total)
  const taxEnabled = Boolean(
    data.taxEnabled,
  )
  const taxRate = 16
  const tax = taxEnabled
    ? subtotal * (taxRate / 100)
    : 0
  const total = subtotal + tax
  return {
    id: snapshot.id,
    folio: text(data.folio),
    sequence: number(data.sequence),
    clientId: text(data.clientId),
    clientName: text(data.clientName),
    phone: text(data.phone),
    concept:
      text(data.concept) ||
      items[0]?.description ||
      'Nota de venta',
    details: text(data.details),
    items,
    subtotal,
    taxEnabled,
    taxRate,
    tax,
    total,
    paymentMethod:
      text(data.paymentMethod) ||
      'efectivo',
    paymentDetails: text(
      data.paymentDetails,
    ),
    status: 'realizado',
    signature: text(data.signature),
    createdAt:
      data.createdAt?.toDate?.()
        ?.toISOString() || '',
  }
}

export const subscribeToNotes = (
  onChange,
  onError,
) =>
  onSnapshot(
    query(notesCollection),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map(normalize)
          .sort((a, b) =>
            b.folio.localeCompare(a.folio),
          ),
      ),
    onError,
  )

export const createNote = async (
  note,
) => {
  const folio = await generateFolio(
    FOLIO_TYPES.NOTE,
  )
  return addDoc(notesCollection, {
    ...note,
    folio: folio.folio,
    sequence: folio.sequence,
    items: normalizeItems(note.items),
    taxEnabled: Boolean(
      note.taxEnabled,
    ),
    taxRate: 16,
    status: 'realizado',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const removeNote = async (id) =>
  deleteDoc(doc(db, 'notas', id))
