import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../../config/firebase'

const listsCollection = collection(db, 'listas')

const normalize = (snapshot) => {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    title: String(data.title || 'Lista'),
    linkType: String(data.linkType || ''),
    linkId: String(data.linkId || ''),
    linkLabel: String(data.linkLabel || ''),
    items: Array.isArray(data.items)
      ? data.items.map((item) => ({
          id: String(item.id),
          text: String(item.text || ''),
          done: Boolean(item.done),
        }))
      : [],
    createdAt:
      data.createdAt?.toDate?.()
        ?.toISOString() || '',
  }
}

export const subscribeToLists = (
  onChange,
  onError,
) =>
  onSnapshot(
    listsCollection,
    (snapshot) =>
      onChange(
        snapshot.docs
          .map(normalize)
          .sort((a, b) =>
            b.createdAt.localeCompare(
              a.createdAt,
            ),
          ),
      ),
    onError,
  )

export const createList = (value) =>
  addDoc(listsCollection, {
    title:
      String(value.title || '').trim() ||
      'Lista',
    linkType: value.linkType || '',
    linkId: value.linkId || '',
    linkLabel: value.linkLabel || '',
    items: value.items || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

export const updateListItems = (
  id,
  items,
) =>
  updateDoc(doc(db, 'listas', id), {
    items,
    updatedAt: serverTimestamp(),
  })

export const updateList = (id, value) =>
  updateDoc(doc(db, 'listas', id), {
    title: String(value.title || '').trim() || 'Lista',
    linkType: value.linkType || '',
    linkId: value.linkId || '',
    linkLabel: value.linkLabel || '',
    items: value.items || [],
    updatedAt: serverTimestamp(),
  })

export const deleteList = (id) =>
  deleteDoc(doc(db, 'listas', id))
