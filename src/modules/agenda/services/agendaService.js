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
import {
  auth,
  db,
} from '../../../config/firebase'

const COLLECTION = 'agenda'
const agendaCollection = collection(
  db,
  COLLECTION,
)

const text = (value) =>
  String(value ?? '').trim()

const timestampToISOString = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString()
  }
  return null
}

const normalizeEvent = (snapshot) => {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    scheduleKind:
      text(data.scheduleKind) || 'event',
    title: text(data.title),
    description: text(data.description),
    type: text(data.type) || 'personal',
    date: text(data.date),
    startTime: text(data.startTime),
    endTime: text(data.endTime),
    allDay: Boolean(data.allDay),
    location: text(data.location),
    mapsUrl: text(data.mapsUrl),
    clientId: text(data.clientId),
    clientName: text(data.clientName),
    reminderMinutes: Array.isArray(
      data.reminderMinutes,
    )
      ? data.reminderMinutes.map(Number)
      : [15],
    status:
      text(data.status) || 'pendiente',
    ownerId: text(data.ownerId),
    sentReminders: Array.isArray(
      data.sentReminders,
    )
      ? data.sentReminders
      : [],
    createdAt:
      timestampToISOString(
        data.createdAt,
      ) || new Date().toISOString(),
    updatedAt:
      timestampToISOString(
        data.updatedAt,
      ) || new Date().toISOString(),
  }
}

const prepareEvent = (event) => ({
  scheduleKind:
    text(event.scheduleKind) || 'reminder',
  title: text(event.title),
  description: text(event.description),
  type: text(event.type) || 'personal',
  date: text(event.date),
  startTime: text(event.startTime),
  endTime: text(event.endTime),
  allDay: Boolean(event.allDay),
  location: text(event.location),
  mapsUrl: text(event.mapsUrl),
  clientId: text(event.clientId),
  clientName: text(event.clientName),
  reminderMinutes: Array.isArray(
    event.reminderMinutes,
  )
    ? event.reminderMinutes.map(Number)
    : [15],
  status:
    text(event.status) || 'pendiente',
  ownerId:
    text(event.ownerId) ||
    auth.currentUser?.uid ||
    '',
  sentReminders: Array.isArray(
    event.sentReminders,
  )
    ? event.sentReminders
    : [],
})

export const subscribeToAgenda = (
  onChange,
  onError,
) =>
  onSnapshot(
    query(agendaCollection),
    (snapshot) => {
      const events = snapshot.docs
        .map(normalizeEvent)
        .sort(
          (a, b) =>
            `${a.date}T${a.startTime}`.localeCompare(
              `${b.date}T${b.startTime}`,
            ),
        )

      onChange(events)
    },
    onError,
  )

export const createAgendaEvent = async (
  event,
) =>
  addDoc(agendaCollection, {
    ...prepareEvent(event),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

export const updateAgendaEvent = async (
  eventId,
  event,
) =>
  updateDoc(
    doc(db, COLLECTION, eventId),
    {
      ...prepareEvent(event),
      sentReminders: [],
      updatedAt: serverTimestamp(),
    },
  )

export const updateAgendaEventStatus =
  async (eventId, status) =>
    updateDoc(
      doc(db, COLLECTION, eventId),
      {
        status,
        updatedAt: serverTimestamp(),
      },
    )

export const removeAgendaEvent = async (
  eventId,
) =>
  deleteDoc(
    doc(db, COLLECTION, eventId),
  )
