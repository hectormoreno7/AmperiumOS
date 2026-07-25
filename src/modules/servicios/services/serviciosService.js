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

  return {
    id: documentSnapshot.id,

    folio: normalizeText(data.folio),
    sequence: normalizeNumber(data.sequence),

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
  }

  await updateDoc(
    doc(
      db,
      SERVICES_COLLECTION,
      serviceId,
    ),
    updateData,
  )

  return serviceId
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