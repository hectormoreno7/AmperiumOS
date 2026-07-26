import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { COLLECTIONS, SETTINGS_DOCUMENTS } from '../constants/collections'

export const FOLIO_TYPES = Object.freeze({
  QUOTATION: 'C',
  SERVICE: 'S',
  NOTE: 'N',
})

const VALID_TYPES = new Set(Object.values(FOLIO_TYPES))
const FOLIO_PREFIX = 'AMP'
const MIN_DIGITS = 4

const validateType = (type) => {
  const normalizedType = String(type ?? '').trim().toUpperCase()
  if (!VALID_TYPES.has(normalizedType)) {
    throw new Error(`Tipo de folio no válido: ${type}`)
  }
  return normalizedType
}

const getMonthYear = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${month}${year}`
}

export const formatFolio = (type, sequence, date = new Date()) => {
  const normalizedType = validateType(type)
  const numericSequence = Number(sequence)

  if (!Number.isInteger(numericSequence) || numericSequence < 1) {
    throw new Error('La secuencia del folio debe ser un entero mayor a cero.')
  }

  return `${FOLIO_PREFIX}-${normalizedType}-${getMonthYear(date)}-${String(
    numericSequence,
  ).padStart(MIN_DIGITS, '0')}`
}

export const generateFolio = async (type, date = new Date()) => {
  const normalizedType = validateType(type)
  const counterReference = doc(
    db,
    COLLECTIONS.SETTINGS,
    SETTINGS_DOCUMENTS.FOLIOS,
  )

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterReference)
    const currentSequence = snapshot.exists()
      ? Number(snapshot.data()?.globalSequence ?? 0)
      : 0
    const nextSequence = currentSequence + 1
    const folio = formatFolio(normalizedType, nextSequence, date)

    transaction.set(
      counterReference,
      {
        globalSequence: nextSequence,
        lastFolio: folio,
        lastType: normalizedType,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return {
      folio,
      sequence: nextSequence,
      type: normalizedType,
    }
  })
}
