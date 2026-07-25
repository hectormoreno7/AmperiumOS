import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { generateFolio, FOLIO_TYPES } from '../../../core/folios/folioService'

const COLLECTION_NAME = 'cotizaciones'
const CLIENTS_COLLECTION = 'clientes'
const quotationsCollection = collection(db, COLLECTION_NAME)
const TAX_RATE = 0.16

const normalizeText = (value) => String(value ?? '').trim()
const normalizeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100

const normalizePayment = (payment, index = 0) => ({
  id: normalizeText(payment?.id) || `${Date.now()}-${index}`,
  amount: roundMoney(Math.max(0, normalizeNumber(payment?.amount))),
  method: normalizeText(payment?.method) || 'transferencia',
  date: normalizeText(payment?.date) || new Date().toISOString().slice(0, 10),
  note: normalizeText(payment?.note),
  createdAt: normalizeText(payment?.createdAt) || new Date().toISOString(),
})

const normalizePayments = (payments) => {
  if (!Array.isArray(payments)) return []

  return payments
    .map(normalizePayment)
    .filter((payment) => payment.amount > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

const calculateFinancialSummary = (total, payments) => {
  const paidAmount = roundMoney(
    payments.reduce((sum, payment) => sum + payment.amount, 0),
  )
  const pendingAmount = roundMoney(Math.max(0, normalizeNumber(total) - paidAmount))

  let financialStatus = 'pendiente'
  if (normalizeNumber(total) > 0 && pendingAmount <= 0.01) {
    financialStatus = 'liquidada'
  } else if (paidAmount > 0) {
    financialStatus = 'anticipo'
  }

  return { paidAmount, pendingAmount, financialStatus }
}

export const calculateQuotationItem = (rawItem, taxEnabled = false) => {
  const quantity = Math.max(0, normalizeNumber(rawItem.quantity))
  const enteredCost = Math.max(0, normalizeNumber(rawItem.costPrice ?? rawItem.unitPrice))
  const profitRate = Math.max(0, normalizeNumber(rawItem.profitRate))
  const conceptType = rawItem.conceptType === 'service' ? 'service' : 'product'

  let baseCost = enteredCost
  let netSalePrice = 0
  let taxAmount = 0
  let finalUnitPrice = 0

  if (conceptType === 'product') {
    baseCost = roundMoney(enteredCost / (1 + TAX_RATE))
    netSalePrice = roundMoney(baseCost * (1 + profitRate / 100))
    taxAmount = roundMoney(netSalePrice * TAX_RATE)
    finalUnitPrice = roundMoney(netSalePrice + taxAmount)
  } else {
    netSalePrice = roundMoney(enteredCost * (1 + profitRate / 100))
    taxAmount = taxEnabled ? roundMoney(netSalePrice * TAX_RATE) : 0
    finalUnitPrice = roundMoney(netSalePrice + taxAmount)
  }

  return {
    quantity,
    enteredCost,
    baseCost,
    profitRate,
    conceptType,
    netSalePrice,
    taxAmount,
    finalUnitPrice,
    amountBeforeTax: roundMoney(quantity * netSalePrice),
    taxTotal: roundMoney(quantity * taxAmount),
    amount: roundMoney(quantity * finalUnitPrice),
  }
}

const normalizeItems = (items, taxEnabled = false) => {
  if (!Array.isArray(items)) return []

  return items
    .map((item, index) => {
      const calculation = calculateQuotationItem(item, taxEnabled)

      return {
        id: item.id || `${Date.now()}-${index}`,
        quantity: calculation.quantity,
        unit: normalizeText(item.unit) || 'Pza.',
        description: normalizeText(item.description),
        conceptType: calculation.conceptType,
        costPrice: calculation.enteredCost,
        profitRate: calculation.profitRate,
        baseCost: calculation.baseCost,
        netSalePrice: calculation.netSalePrice,
        taxAmount: calculation.taxAmount,
        unitPrice: calculation.finalUnitPrice,
      }
    })
    .filter((item) => item.description)
}

export const calculateQuotationTotals = (items, taxEnabled, advanceRate) => {
  const normalizedItems = normalizeItems(items, taxEnabled)
  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.netSalePrice,
    0,
  )
  const tax = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.taxAmount,
    0,
  )
  const total = subtotal + tax
  const advanceAmount = total * (normalizeNumber(advanceRate) / 100)

  return {
    subtotal: roundMoney(subtotal),
    tax: roundMoney(tax),
    total: roundMoney(total),
    advanceAmount: roundMoney(advanceAmount),
    remainingAmount: roundMoney(total - advanceAmount),
  }
}

const timestampToISOString = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  return null
}

const normalizeQuotationDocument = (snapshot) => {
  const data = snapshot.data()
  const taxEnabled = Boolean(data.taxEnabled)
  const advanceRate = normalizeNumber(data.advanceRate || 70)
  const items = normalizeItems(data.items, taxEnabled)
  const totals = calculateQuotationTotals(items, taxEnabled, advanceRate)
  const payments = normalizePayments(data.payments)
  const financial = calculateFinancialSummary(totals.total, payments)

  return {
    id: snapshot.id,
    folio: normalizeText(data.folio),
    sequence: normalizeNumber(data.sequence),
    status: normalizeText(data.status) || 'borrador',
    clientId: normalizeText(data.clientId),
    clientName: normalizeText(data.clientName),
    projectName: normalizeText(data.projectName),
    contactName: normalizeText(data.contactName),
    phone: normalizeText(data.phone),
    email: normalizeText(data.email),
    address: normalizeText(data.address),
    paymentMethod: normalizeText(data.paymentMethod) || 'transferencia',
    advanceRate,
    deliveryTime: normalizeText(data.deliveryTime),
    warranty: normalizeText(data.warranty),
    validityDays: normalizeNumber(data.validityDays || 10),
    summary: normalizeText(data.summary),
    notes: normalizeText(data.notes),
    generalConditions: normalizeText(data.generalConditions),
    exclusions: normalizeText(data.exclusions),
    includedScope: normalizeText(data.includedScope),
    excludedScope: normalizeText(data.excludedScope),
    diagramImage: normalizeText(data.diagramImage),
    diagramImageName: normalizeText(data.diagramImageName),
    responsibleName: normalizeText(data.responsibleName) || 'Ing. Héctor Zárate',
    responsibleSignature: normalizeText(data.responsibleSignature),
    clientSignature: normalizeText(data.clientSignature),
    taxEnabled,
    items,
    totals,
    payments,
    ...financial,
    issuedAt: timestampToISOString(data.issuedAt),
    createdAt: timestampToISOString(data.createdAt) ?? new Date().toISOString(),
    updatedAt:
      timestampToISOString(data.updatedAt) ??
      timestampToISOString(data.createdAt) ??
      new Date().toISOString(),
  }
}

const prepareQuotationData = (quotation) => {
  const taxEnabled = Boolean(quotation.taxEnabled)
  const advanceRate = normalizeNumber(quotation.advanceRate || 70)
  const items = normalizeItems(quotation.items, taxEnabled)
  const totals = calculateQuotationTotals(items, taxEnabled, advanceRate)
  const payments = normalizePayments(quotation.payments)
  const financial = calculateFinancialSummary(totals.total, payments)

  return {
    folio: normalizeText(quotation.folio),
    sequence: normalizeNumber(quotation.sequence),
    status: normalizeText(quotation.status) || 'borrador',
    clientId: normalizeText(quotation.clientId),
    clientName: normalizeText(quotation.clientName),
    projectName: normalizeText(quotation.projectName),
    contactName: normalizeText(quotation.contactName),
    phone: normalizeText(quotation.phone),
    email: normalizeText(quotation.email),
    address: normalizeText(quotation.address),
    paymentMethod: normalizeText(quotation.paymentMethod) || 'transferencia',
    advanceRate,
    deliveryTime: normalizeText(quotation.deliveryTime),
    warranty: normalizeText(quotation.warranty),
    validityDays: normalizeNumber(quotation.validityDays || 10),
    summary: normalizeText(quotation.summary),
    notes: normalizeText(quotation.notes),
    generalConditions: normalizeText(quotation.generalConditions),
    exclusions: normalizeText(quotation.exclusions),
    includedScope: normalizeText(quotation.includedScope),
    excludedScope: normalizeText(quotation.excludedScope),
    diagramImage: normalizeText(quotation.diagramImage),
    diagramImageName: normalizeText(quotation.diagramImageName),
    responsibleName: normalizeText(quotation.responsibleName) || 'Ing. Héctor Zárate',
    responsibleSignature: normalizeText(quotation.responsibleSignature),
    clientSignature: normalizeText(quotation.clientSignature),
    taxEnabled,
    items,
    totals,
    payments,
    ...financial,
  }
}

const updateClientQuotationCount = async (clientId, delta) => {
  if (!clientId || !delta) return

  const clientReference = doc(db, CLIENTS_COLLECTION, clientId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(clientReference)
    if (!snapshot.exists()) return

    const activity = snapshot.data()?.activity ?? {}
    const current = Number(activity.quotations ?? 0)

    transaction.update(clientReference, {
      'activity.quotations': Math.max(0, current + delta),
      updatedAt: serverTimestamp(),
    })
  })
}

export const subscribeToQuotations = (onChange, onError) => {
  const quotationsQuery = query(quotationsCollection)

  return onSnapshot(
    quotationsQuery,
    (querySnapshot) => {
      const quotations = querySnapshot.docs
        .map(normalizeQuotationDocument)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      onChange(quotations)
    },
    (error) => {
      console.error('No fue posible sincronizar las cotizaciones:', error)
      onError?.(error)
    },
  )
}

export const createQuotation = async (quotation) => {
  const prepared = prepareQuotationData({ ...quotation, status: 'borrador' })
  const reference = await addDoc(quotationsCollection, {
    ...prepared,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateClientQuotationCount(prepared.clientId, 1)
  return reference.id
}

export const updateQuotation = async (quotationId, quotation, previousClientId = '') => {
  if (!quotationId) {
    throw new Error('No se recibió el identificador de la cotización.')
  }

  const prepared = prepareQuotationData(quotation)
  await updateDoc(doc(db, COLLECTION_NAME, quotationId), {
    ...prepared,
    updatedAt: serverTimestamp(),
  })

  if (previousClientId !== prepared.clientId) {
    if (previousClientId) await updateClientQuotationCount(previousClientId, -1)
    if (prepared.clientId) await updateClientQuotationCount(prepared.clientId, 1)
  }

  return quotationId
}

export const finalizeQuotation = async (quotationId, quotation, previousClientId = '') => {
  const prepared = prepareQuotationData(quotation)

  if (quotationId && quotation.folio) {
    const finalData = {
      ...prepared,
      folio: quotation.folio,
      sequence: quotation.sequence || prepared.sequence,
      status: 'enviada',
    }

    await updateQuotation(quotationId, finalData, previousClientId)
    return { id: quotationId, ...finalData }
  }

  const folioData = await generateFolio(FOLIO_TYPES.QUOTATION)
  const finalData = {
    ...prepared,
    folio: folioData.folio,
    sequence: folioData.sequence,
    status: 'enviada',
  }

  if (quotationId) {
    await updateDoc(doc(db, COLLECTION_NAME, quotationId), {
      ...finalData,
      issuedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (previousClientId !== prepared.clientId) {
      if (previousClientId) await updateClientQuotationCount(previousClientId, -1)
      if (prepared.clientId) await updateClientQuotationCount(prepared.clientId, 1)
    }

    return { id: quotationId, ...finalData }
  }

  const reference = await addDoc(quotationsCollection, {
    ...finalData,
    issuedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateClientQuotationCount(prepared.clientId, 1)
  return { id: reference.id, ...finalData }
}

export const addQuotationPayment = async (quotationId, payment) => {
  if (!quotationId) throw new Error('No se recibió la cotización.')

  const reference = doc(db, COLLECTION_NAME, quotationId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)
    if (!snapshot.exists()) throw new Error('La cotización ya no existe.')

    const data = snapshot.data()
    const currentPayments = normalizePayments(data.payments)
    const total = normalizeNumber(data.totals?.total)
    const currentFinancial = calculateFinancialSummary(total, currentPayments)
    const amount = roundMoney(normalizeNumber(payment.amount))

    if (amount <= 0) throw new Error('El pago debe ser mayor a cero.')
    if (amount > currentFinancial.pendingAmount + 0.01) {
      throw new Error('El pago supera el saldo pendiente.')
    }

    const newPayment = normalizePayment({
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      amount,
      method: payment.method,
      date: payment.date || new Date().toISOString().slice(0, 10),
      note: payment.note,
      createdAt: new Date().toISOString(),
    })

    const payments = [newPayment, ...currentPayments]
    const financial = calculateFinancialSummary(total, payments)

    transaction.update(reference, {
      payments,
      ...financial,
      updatedAt: serverTimestamp(),
    })
  })
}

export const removeQuotationPayment = async (quotationId, paymentId) => {
  if (!quotationId || !paymentId) throw new Error('No se recibió el pago.')

  const reference = doc(db, COLLECTION_NAME, quotationId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)
    if (!snapshot.exists()) throw new Error('La cotización ya no existe.')

    const data = snapshot.data()
    const payments = normalizePayments(data.payments).filter(
      (payment) => payment.id !== paymentId,
    )
    const financial = calculateFinancialSummary(data.totals?.total || 0, payments)

    transaction.update(reference, {
      payments,
      ...financial,
      updatedAt: serverTimestamp(),
    })
  })
}

export const removeQuotation = async (quotation) => {
  const quotationId = typeof quotation === 'string' ? quotation : quotation?.id
  if (!quotationId) {
    throw new Error('No se recibió el identificador de la cotización.')
  }

  await deleteDoc(doc(db, COLLECTION_NAME, quotationId))
  if (typeof quotation === 'object') {
    await updateClientQuotationCount(quotation.clientId, -1)
  }
  return quotationId
}
