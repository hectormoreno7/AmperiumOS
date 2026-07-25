import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../config/firebase'

const requireValue = (value, message) => {
  if (!String(value ?? '').trim()) {
    throw new Error(message)
  }
}

export const timestampToISOString = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  return null
}

export const mapDocument = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export const createDocument = async (collectionName, data) => {
  requireValue(collectionName, 'La colección es obligatoria.')

  const reference = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return reference.id
}

export const setDocument = async (
  collectionName,
  documentId,
  data,
  options = { merge: true },
) => {
  requireValue(collectionName, 'La colección es obligatoria.')
  requireValue(documentId, 'El identificador del documento es obligatorio.')

  await setDoc(
    doc(db, collectionName, documentId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    options,
  )

  return documentId
}

export const getDocument = async (collectionName, documentId) => {
  requireValue(collectionName, 'La colección es obligatoria.')
  requireValue(documentId, 'El identificador del documento es obligatorio.')

  const snapshot = await getDoc(doc(db, collectionName, documentId))
  return snapshot.exists() ? mapDocument(snapshot) : null
}

export const getDocuments = async (collectionName, ...constraints) => {
  requireValue(collectionName, 'La colección es obligatoria.')

  const reference = collection(db, collectionName)
  const source = constraints.length ? query(reference, ...constraints) : reference
  const snapshot = await getDocs(source)
  return snapshot.docs.map(mapDocument)
}

export const updateDocument = async (collectionName, documentId, data) => {
  requireValue(collectionName, 'La colección es obligatoria.')
  requireValue(documentId, 'El identificador del documento es obligatorio.')

  await updateDoc(doc(db, collectionName, documentId), {
    ...data,
    updatedAt: serverTimestamp(),
  })

  return documentId
}

export const deleteDocument = async (collectionName, documentId) => {
  requireValue(collectionName, 'La colección es obligatoria.')
  requireValue(documentId, 'El identificador del documento es obligatorio.')

  await deleteDoc(doc(db, collectionName, documentId))
  return documentId
}

export const subscribeToCollection = (
  collectionName,
  onChange,
  onError,
  ...constraints
) => {
  requireValue(collectionName, 'La colección es obligatoria.')

  const reference = collection(db, collectionName)
  const source = constraints.length ? query(reference, ...constraints) : reference

  return onSnapshot(
    source,
    (snapshot) => onChange(snapshot.docs.map(mapDocument)),
    (error) => {
      console.error(`Error al sincronizar ${collectionName}:`, error)
      onError?.(error)
    },
  )
}
