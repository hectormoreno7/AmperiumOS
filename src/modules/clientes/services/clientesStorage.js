import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../../config/firebase'

const CLIENTS_COLLECTION = 'clientes'

const clientsCollection = collection(
  db,
  CLIENTS_COLLECTION,
)

const normalizeText = (value) =>
  String(value ?? '').trim()

const normalizePhones = (phones) => {
  if (!Array.isArray(phones)) {
    return []
  }

  return phones
    .map((phone) => String(phone ?? '').trim())
    .filter(Boolean)
}

const normalizeStatus = (status) =>
  status === 'inactive' ? 'inactive' : 'active'

const normalizeActivity = (activity) => ({
  quotations: Number(activity?.quotations ?? 0),
  services: Number(activity?.services ?? 0),
  notes: Number(activity?.notes ?? 0),
  payments: Number(activity?.payments ?? 0),
})

const timestampToISOString = (value) => {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return null
}

const normalizeClientDocument = (
  documentSnapshot,
) => {
  const data = documentSnapshot.data()

  const phones = normalizePhones(
    data.phones,
  )
  const legacyPhone = normalizeText(
    data.phone ||
      data.telefono ||
      data.telefonoPrincipal,
  )
  const normalizedPhones =
    phones.length > 0
      ? phones
      : legacyPhone
        ? [legacyPhone]
        : []

  return {
    id: documentSnapshot.id,

    name: normalizeText(data.name),
    contactName: normalizeText(
      data.contactName,
    ),
    phones: normalizedPhones,
    phone: normalizedPhones[0] || '',
    email: normalizeText(data.email),
    address: normalizeText(data.address),
    notes: normalizeText(data.notes),

    status: normalizeStatus(data.status),

    activity: normalizeActivity(data.activity),

    createdAt:
      timestampToISOString(data.createdAt) ??
      new Date().toISOString(),

    updatedAt:
      timestampToISOString(data.updatedAt) ??
      timestampToISOString(data.createdAt) ??
      new Date().toISOString(),
  }
}

const prepareClientData = (clientData) => {
  const phones = normalizePhones(
    clientData.phones,
  )
  const legacyPhone = normalizeText(
    clientData.phone ||
      clientData.telefono,
  )
  const normalizedPhones =
    phones.length > 0
      ? phones
      : legacyPhone
        ? [legacyPhone]
        : []

  return {
  name: normalizeText(clientData.name),

  contactName: normalizeText(
    clientData.contactName,
  ),

  phones: normalizedPhones,

  phone: normalizedPhones[0] || '',

  email: normalizeText(clientData.email),

  address: normalizeText(clientData.address),

  notes: normalizeText(clientData.notes),

  status: normalizeStatus(clientData.status),
  }
}

export const subscribeToClients = (
  onClientsChange,
  onError,
) => {
  const clientsQuery = query(clientsCollection)

  return onSnapshot(
    clientsQuery,
    (querySnapshot) => {
      const clients = querySnapshot.docs
        .map(normalizeClientDocument)
        .sort((clientA, clientB) =>
          clientA.name.localeCompare(
            clientB.name,
            'es',
            {
              sensitivity: 'base',
            },
          ),
        )

      onClientsChange(clients)
    },
    (error) => {
      console.error(
        'No fue posible sincronizar los clientes:',
        error,
      )

      if (typeof onError === 'function') {
        onError(error)
      }
    },
  )
}

export const createClient = async (
  clientData,
) => {
  const preparedData =
    prepareClientData(clientData)

  const documentReference = await addDoc(
    clientsCollection,
    {
      ...preparedData,

      activity: normalizeActivity(
        clientData.activity,
      ),

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  )

  return documentReference.id
}

export const updateClient = async (
  clientId,
  clientData,
) => {
  if (!clientId) {
    throw new Error(
      'No se recibió el identificador del cliente.',
    )
  }

  const clientReference = doc(
    db,
    CLIENTS_COLLECTION,
    clientId,
  )

  const preparedData =
    prepareClientData(clientData)

  await updateDoc(clientReference, {
    ...preparedData,
    updatedAt: serverTimestamp(),
  })

  return clientId
}

export const updateClientStatus = async (
  clientId,
  status,
) => {
  if (!clientId) {
    throw new Error(
      'No se recibió el identificador del cliente.',
    )
  }

  const clientReference = doc(
    db,
    CLIENTS_COLLECTION,
    clientId,
  )

  await updateDoc(clientReference, {
    status: normalizeStatus(status),
    updatedAt: serverTimestamp(),
  })

  return clientId
}

export const removeClient = async (
  clientId,
) => {
  if (!clientId) {
    throw new Error(
      'No se recibió el identificador del cliente.',
    )
  }

  const clientReference = doc(
    db,
    CLIENTS_COLLECTION,
    clientId,
  )

  await deleteDoc(clientReference)

  return clientId
}
