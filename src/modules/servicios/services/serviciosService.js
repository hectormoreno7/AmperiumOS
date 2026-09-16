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
import {
  generateFolio,
  FOLIO_TYPES,
} from '../../../core/folios/folioService'

const SERVICES_COLLECTION = 'servicios'
const CLIENTS_COLLECTION = 'clientes'

const servicesCollection = collection(
  db,
  SERVICES_COLLECTION,
)

const normalizeText = (value) =>
  String(value ?? '').trim()

const normalizeNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

const normalizeStatus = (status) => {
  const validStatuses = [
    'borrador',
    'programado',
    'en_proceso',
    'finalizado',
    'cancelado',
    'archivado',
  ]

  return validStatuses.includes(status)
    ? status
    : 'borrador'
}

const normalizePriority = (priority) => {
  const validPriorities = [
    'baja',
    'normal',
    'alta',
    'urgente',
  ]

  return validPriorities.includes(priority)
    ? priority
    : 'normal'
}

const normalizeImages = (images) => {
  if (!Array.isArray(images)) {
    return []
  }

  return images
    .map((image, index) => ({
      id:
        normalizeText(image?.id) ||
        `${Date.now()}-${index}`,

      name: normalizeText(image?.name),
      data: normalizeText(
        image?.data ||
        image?.src ||
        image?.url,
      ),
    }))
    .filter((image) => image.data)
}

const normalizeExpenses = (expenses) => {
  if (!Array.isArray(expenses)) {
    return []
  }

  return expenses
    .map((expense, index) => ({
      id:
        normalizeText(expense?.id) ||
        `${Date.now()}-${index}`,
      description: normalizeText(
        expense?.description,
      ),
      amount: Math.max(
        0,
        normalizeNumber(expense?.amount),
      ),
      date: normalizeText(expense?.date),
    }))
    .filter(
      (expense) =>
        expense.description ||
        expense.amount > 0,
    )
}

const timestampToISOString = (value) => {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString()
  }

  return null
}

const normalizeServiceDocument = (
  documentSnapshot,
) => {
  const data = documentSnapshot.data()
  const expenses = normalizeExpenses(
    data.expenses,
  )
  const extrasSubtotal =
    normalizeNumber(
      data.extrasSubtotal,
    ) ||
    expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0,
    )
  const extraTaxEnabled = Boolean(
    data.extraTaxEnabled,
  )
  const extrasTax =
    normalizeNumber(data.extrasTax) ||
    (extraTaxEnabled
      ? extrasSubtotal * 0.16
      : 0)
  const quotedTotal = normalizeNumber(
    data.quotedTotal,
  )
  const finalTotal =
    normalizeNumber(data.finalTotal) ||
    quotedTotal +
      extrasSubtotal +
      extrasTax
  const paidAmount = normalizeNumber(
    data.paidAmount,
  )
  const pendingAmount = Math.max(
    0,
    finalTotal - paidAmount,
  )

  return {
    id: documentSnapshot.id,

    folio: normalizeText(data.folio),
    sequence: normalizeNumber(data.sequence),
    originType: normalizeText(data.originType),
    originQuotationId: normalizeText(
      data.originQuotationId,
    ),
    originQuotationFolio: normalizeText(
      data.originQuotationFolio,
    ),
    quotedTotal,
    extrasSubtotal,
    extrasTax,
    finalTotal,
    extraTaxEnabled,
    paidAmount,
    pendingAmount,
    financialStatus:
      pendingAmount <= 0.01
        ? 'liquidada'
        : paidAmount > 0
          ? 'anticipo'
          : 'pendiente',
    archived: Boolean(data.archived),
    archivedAt:
      timestampToISOString(
        data.archivedAt,
      ),
    expenses,

    status: normalizeStatus(data.status),
    priority: normalizePriority(
      data.priority,
    ),

    clientId: normalizeText(data.clientId),
    clientName: normalizeText(
      data.clientName,
    ),

    contactName: normalizeText(
      data.contactName,
    ),

    phone: normalizeText(data.phone),
    email: normalizeText(data.email),

    title: normalizeText(data.title),
    description: normalizeText(
      data.description,
    ),

    address: normalizeText(data.address),
    mapsUrl: normalizeText(data.mapsUrl),

    scheduledDate: normalizeText(
      data.scheduledDate,
    ),

    scheduledTime: normalizeText(
      data.scheduledTime,
    ),

    reminderEnabled:
      data.reminderEnabled !== false,

    estimatedDuration: normalizeText(
      data.estimatedDuration,
    ),

    assignedTo: normalizeText(
      data.assignedTo,
    ),

    observations: normalizeText(
      data.observations,
    ),

    internalNotes: normalizeText(
      data.internalNotes,
    ),

    images: normalizeImages(data.images),

    completedAt:
      timestampToISOString(
        data.completedAt,
      ),

    createdAt:
      timestampToISOString(
        data.createdAt,
      ) ?? new Date().toISOString(),

    updatedAt:
      timestampToISOString(
        data.updatedAt,
      ) ??
      timestampToISOString(
        data.createdAt,
      ) ??
      new Date().toISOString(),
  }
}

const prepareServiceData = (
  serviceData,
) => ({
  folio: normalizeText(
    serviceData.folio,
  ),

  sequence: normalizeNumber(
    serviceData.sequence,
  ),

  originType: normalizeText(
    serviceData.originType,
  ),

  originQuotationId: normalizeText(
    serviceData.originQuotationId,
  ),

  originQuotationFolio: normalizeText(
    serviceData.originQuotationFolio,
  ),

  quotedTotal: normalizeNumber(
    serviceData.quotedTotal,
  ),

  extrasSubtotal: normalizeNumber(
    serviceData.extrasSubtotal,
  ),

  extrasTax: normalizeNumber(
    serviceData.extrasTax,
  ),

  finalTotal: normalizeNumber(
    serviceData.finalTotal ||
      serviceData.quotedTotal,
  ),

  extraTaxEnabled: Boolean(
    serviceData.extraTaxEnabled,
  ),

  paidAmount: normalizeNumber(
    serviceData.paidAmount,
  ),

  pendingAmount: normalizeNumber(
    serviceData.pendingAmount,
  ),

  financialStatus:
    normalizeText(
      serviceData.financialStatus,
    ) || 'pendiente',

  expenses: normalizeExpenses(
    serviceData.expenses,
  ),

  archived: Boolean(
    serviceData.archived,
  ),

  status: normalizeStatus(
    serviceData.status,
  ),

  priority: normalizePriority(
    serviceData.priority,
  ),

  clientId: normalizeText(
    serviceData.clientId,
  ),

  clientName: normalizeText(
    serviceData.clientName,
  ),

  contactName: normalizeText(
    serviceData.contactName,
  ),

  phone: normalizeText(
    serviceData.phone,
  ),

  email: normalizeText(
    serviceData.email,
  ),

  title: normalizeText(
    serviceData.title,
  ),

  description: normalizeText(
    serviceData.description,
  ),

  address: normalizeText(
    serviceData.address,
  ),

  mapsUrl: normalizeText(
    serviceData.mapsUrl,
  ),

  scheduledDate: normalizeText(
    serviceData.scheduledDate,
  ),

  scheduledTime: normalizeText(
    serviceData.scheduledTime,
  ),

  reminderEnabled:
    serviceData.reminderEnabled !== false,

  estimatedDuration: normalizeText(
    serviceData.estimatedDuration,
  ),

  assignedTo: normalizeText(
    serviceData.assignedTo,
  ),

  observations: normalizeText(
    serviceData.observations,
  ),

  internalNotes: normalizeText(
    serviceData.internalNotes,
  ),

  images: normalizeImages(
    serviceData.images,
  ),
})

const updateClientServiceCount = async (
  clientId,
  delta,
) => {
  if (!clientId || !delta) {
    return
  }

  const clientReference = doc(
    db,
    CLIENTS_COLLECTION,
    clientId,
  )

  await runTransaction(
    db,
    async (transaction) => {
      const clientSnapshot =
        await transaction.get(
          clientReference,
        )

      if (!clientSnapshot.exists()) {
        return
      }

      const activity =
        clientSnapshot.data()?.activity ??
        {}

      const currentServices = Number(
        activity.services ?? 0,
      )

      transaction.update(
        clientReference,
        {
          'activity.services': Math.max(
            0,
            currentServices + delta,
          ),

          updatedAt: serverTimestamp(),
        },
      )
    },
  )
}

export const subscribeToServices = (
  onServicesChange,
  onError,
) => {
  const servicesQuery = query(
    servicesCollection,
  )

  return onSnapshot(
    servicesQuery,

    (querySnapshot) => {
      const services =
        querySnapshot.docs
          .map(
            normalizeServiceDocument,
          )
          .sort(
            (serviceA, serviceB) =>
              new Date(
                serviceB.updatedAt,
              ) -
              new Date(
                serviceA.updatedAt,
              ),
          )

      onServicesChange(services)
    },

    (error) => {
      console.error(
        'No fue posible sincronizar los servicios:',
        error,
      )

      onError?.(error)
    },
  )
}

export const createService = async (
  serviceData,
) => {
  const preparedData =
    prepareServiceData({
      ...serviceData,
      status:
        serviceData.status ||
        'borrador',
    })

  const documentReference =
    await addDoc(
      servicesCollection,
      {
        ...preparedData,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    )

  await updateClientServiceCount(
    preparedData.clientId,
    1,
  )

  return documentReference.id
}

export const updateService = async (
  serviceId,
  serviceData,
  previousClientId = '',
) => {
  if (!serviceId) {
    throw new Error(
      'No se recibió el identificador del servicio.',
    )
  }

  const preparedData =
    prepareServiceData(serviceData)

  await updateDoc(
    doc(
      db,
      SERVICES_COLLECTION,
      serviceId,
    ),
    {
      ...preparedData,

      updatedAt:
        serverTimestamp(),
    },
  )

  if (
    previousClientId !==
    preparedData.clientId
  ) {
    if (previousClientId) {
      await updateClientServiceCount(
        previousClientId,
        -1,
      )
    }

    if (preparedData.clientId) {
      await updateClientServiceCount(
        preparedData.clientId,
        1,
      )
    }
  }

  return serviceId
}

export const finalizeService = async (
  serviceId,
  serviceData,
  previousClientId = '',
) => {
  const preparedData =
    prepareServiceData(serviceData)

  if (
    serviceId &&
    serviceData.folio
  ) {
    const finalData = {
      ...preparedData,
      folio: serviceData.folio,
      sequence:
        serviceData.sequence ||
        preparedData.sequence,
      status:
        serviceData.status ===
        'finalizado'
          ? 'finalizado'
          : 'programado',
    }

    await updateService(
      serviceId,
      finalData,
      previousClientId,
    )

    return {
      id: serviceId,
      ...finalData,
    }
  }

  const folioData =
    await generateFolio(
      FOLIO_TYPES.SERVICE,
    )

  const finalData = {
    ...preparedData,
    folio: folioData.folio,
    sequence: folioData.sequence,
    status: 'programado',
  }

  if (serviceId) {
    await updateDoc(
      doc(
        db,
        SERVICES_COLLECTION,
        serviceId,
      ),
      {
        ...finalData,

        updatedAt:
          serverTimestamp(),
      },
    )

    if (
      previousClientId !==
      preparedData.clientId
    ) {
      if (previousClientId) {
        await updateClientServiceCount(
          previousClientId,
          -1,
        )
      }

      if (preparedData.clientId) {
        await updateClientServiceCount(
          preparedData.clientId,
          1,
        )
      }
    }

    return {
      id: serviceId,
      ...finalData,
    }
  }

  const documentReference =
    await addDoc(
      servicesCollection,
      {
        ...finalData,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    )

  await updateClientServiceCount(
    preparedData.clientId,
    1,
  )

  return {
    id: documentReference.id,
    ...finalData,
  }
}

export const updateServiceStatus = async (
  serviceId,
  status,
  serviceContext = {},
) => {
  if (!serviceId) {
    throw new Error(
      'No se recibió el identificador del servicio.',
    )
  }

  const normalizedStatus =
    normalizeStatus(status)

  const updateData = {
    status: normalizedStatus,

    updatedAt:
      serverTimestamp(),
  }

  if (
    normalizedStatus ===
    'finalizado'
  ) {
    updateData.completedAt =
      serverTimestamp()
    updateData.scheduledDate = ''
    updateData.scheduledTime = ''

    if (
      serviceContext.financialStatus ===
        'liquidada' ||
      Number(
        serviceContext.pendingAmount ||
          0,
      ) <= 0
    ) {
      updateData.archived = true
      updateData.archivedAt =
        serverTimestamp()
    }
  }

  await updateDoc(
    doc(
      db,
      SERVICES_COLLECTION,
      serviceId,
    ),
    updateData,
  )

  if (
    normalizedStatus ===
      'finalizado' &&
    serviceContext.originQuotationId
  ) {
    const quotationReference = doc(
      db,
      'cotizaciones',
      serviceContext.originQuotationId,
    )

    await runTransaction(
      db,
      async (transaction) => {
        const quotationSnapshot =
          await transaction.get(
            quotationReference,
          )

        if (
          !quotationSnapshot.exists()
        ) {
          return
        }

        const quotation =
          quotationSnapshot.data()

        if (
          (
            quotation.financialStatus ===
              'liquidada' ||
            Number(
              quotation.pendingAmount ||
                0,
            ) <= 0
          ) &&
          Number(
            serviceContext.pendingAmount ||
              0,
          ) <= 0
        ) {
          transaction.update(
            quotationReference,
            {
              archived: true,
              archivedAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp(),
            },
          )
        }
      },
    )
  }

  return serviceId
}

export const liquidateService = async (
  service,
) => {
  if (!service?.id) {
    throw new Error(
      'No se recibió el servicio.',
    )
  }

  const serviceReference = doc(
    db,
    SERVICES_COLLECTION,
    service.id,
  )

  await runTransaction(
    db,
    async (transaction) => {
      const serviceSnapshot =
        await transaction.get(
          serviceReference,
        )

      if (!serviceSnapshot.exists()) {
        throw new Error(
          'El servicio ya no existe.',
        )
      }

      const serviceData =
        serviceSnapshot.data()
      const finalTotal = normalizeNumber(
        serviceData.finalTotal ||
          service.finalTotal ||
          serviceData.quotedTotal,
      )
      const quotationReference =
        serviceData.originQuotationId
          ? doc(
              db,
              'cotizaciones',
              serviceData.originQuotationId,
            )
          : null
      const quotationSnapshot =
        quotationReference
          ? await transaction.get(
              quotationReference,
            )
          : null
      const shouldArchive =
        serviceData.status ===
          'finalizado'

      transaction.update(
        serviceReference,
        {
          paidAmount: finalTotal,
          pendingAmount: 0,
          financialStatus:
            'liquidada',
          archived: shouldArchive,
          ...(shouldArchive
            ? {
                archivedAt:
                  serverTimestamp(),
              }
            : {}),
          updatedAt:
            serverTimestamp(),
        },
      )

      if (
        quotationReference &&
        quotationSnapshot?.exists()
      ) {
        const quotation =
          quotationSnapshot.data()
        const quotationTotal =
          normalizeNumber(
            quotation.totals?.total,
          )
        const quotationPending =
          Math.max(
            0,
            quotationTotal -
              normalizeNumber(
                quotation.paidAmount,
              ),
          )
        const payments = [
          ...(Array.isArray(
            quotation.payments,
          )
            ? quotation.payments
            : []),
        ]

        if (quotationPending > 0) {
          payments.unshift({
            id:
              typeof crypto !==
                'undefined' &&
              crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            amount:
              quotationPending,
            method:
              'liquidación desde servicio',
            date: new Date()
              .toISOString()
              .slice(0, 10),
            note:
              'Liquidación al cerrar servicio',
            createdAt:
              new Date().toISOString(),
          })
        }

        transaction.update(
          quotationReference,
          {
            payments,
            paidAmount:
              quotationTotal,
            pendingAmount: 0,
            financialStatus:
              'liquidada',
            archived: shouldArchive,
            ...(shouldArchive
              ? {
                  archivedAt:
                    serverTimestamp(),
                }
              : {}),
            updatedAt:
              serverTimestamp(),
          },
        )
      }
    },
  )
}

export const removeService = async (
  service,
) => {
  const serviceId =
    typeof service === 'string'
      ? service
      : service?.id

  if (!serviceId) {
    throw new Error(
      'No se recibió el identificador del servicio.',
    )
  }

  await deleteDoc(
    doc(
      db,
      SERVICES_COLLECTION,
      serviceId,
    ),
  )

  if (
    typeof service === 'object' &&
    service.clientId
  ) {
    await updateClientServiceCount(
      service.clientId,
      -1,
    )
  }

  return serviceId
}
