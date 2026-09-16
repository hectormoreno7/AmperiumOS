let cachedAccessToken = null
let accessTokenExpiresAt = 0

const encodeBase64Url = (value) => {
  const bytes =
    typeof value === 'string'
      ? new TextEncoder().encode(value)
      : new Uint8Array(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

const importPrivateKey = async (pem) => {
  const body = pem
    .replace(
      /-----BEGIN PRIVATE KEY-----/g,
      '',
    )
    .replace(
      /-----END PRIVATE KEY-----/g,
      '',
    )
    .replace(/\s/g, '')
  const binary = atob(body)
  const bytes = Uint8Array.from(
    binary,
    (character) =>
      character.charCodeAt(0),
  )

  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  )
}

const getAccessToken = async (env) => {
  if (
    cachedAccessToken &&
    Date.now() < accessTokenExpiresAt
  ) {
    return cachedAccessToken
  }

  const now = Math.floor(
    Date.now() / 1000,
  )
  const header = encodeBase64Url(
    JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
    }),
  )
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: env.FIREBASE_CLIENT_EMAIL,
      scope:
        'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging',
      aud:
        'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const unsigned = `${header}.${payload}`
  const key = await importPrivateKey(
    env.FIREBASE_PRIVATE_KEY.replace(
      /\\n/g,
      '\n',
    ),
  )
  const signature =
    await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(
        unsigned,
      ),
    )
  const assertion = `${unsigned}.${encodeBase64Url(
    signature,
  )}`
  const response = await fetch(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: {
        'content-type':
          'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:
          'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `OAuth ${response.status}: ${await response.text()}`,
    )
  }

  const result = await response.json()
  cachedAccessToken =
    result.access_token
  accessTokenExpiresAt =
    Date.now() +
    (result.expires_in - 120) * 1000
  return cachedAccessToken
}

const fieldValue = (field) => {
  if (!field) return null
  if ('stringValue' in field) {
    return field.stringValue
  }
  if ('booleanValue' in field) {
    return field.booleanValue
  }
  if ('integerValue' in field) {
    return Number(field.integerValue)
  }
  if ('doubleValue' in field) {
    return Number(field.doubleValue)
  }
  if ('arrayValue' in field) {
    return (
      field.arrayValue.values || []
    ).map(fieldValue)
  }
  return null
}

const decodeDocument = (document) => {
  const data = {
    name: document.name,
    id: document.name.split('/').pop(),
  }

  Object.entries(
    document.fields || {},
  ).forEach(([key, value]) => {
    data[key] = fieldValue(value)
  })
  return data
}

const firestoreBase = (env) =>
  `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`

const listCollection = async (
  env,
  token,
  collection,
) => {
  const response = await fetch(
    `${firestoreBase(
      env,
    )}/${collection}?pageSize=1000`,
    {
      headers: {
        authorization:
          `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Firestore ${response.status}: ${await response.text()}`,
    )
  }

  const result = await response.json()
  return (result.documents || []).map(
    decodeDocument,
  )
}

const listDevices = async (
  env,
  token,
) => {
  const response = await fetch(
    `${firestoreBase(
      env,
    ).replace(/\/documents$/, '')}/documents:runQuery`,
    {
      method: 'POST',
      headers: {
        authorization:
          `Bearer ${token}`,
        'content-type':
          'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [
            {
              collectionId:
                'dispositivos',
              allDescendants: true,
            },
          ],
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Devices ${response.status}: ${await response.text()}`,
    )
  }

  const rows = await response.json()
  return rows
    .filter((row) => row.document)
    .map((row) =>
      decodeDocument(row.document),
    )
    .filter(
      (device) =>
        device.enabled !== false &&
        device.token,
    )
}

const patchSentReminders = async (
  env,
  token,
  documentName,
  sentReminders,
) => {
  const relativeName =
    documentName.split(
      '/documents/',
    )[1]
  const response = await fetch(
    `${firestoreBase(
      env,
    )}/${relativeName}?updateMask.fieldPaths=sentReminders`,
    {
      method: 'PATCH',
      headers: {
        authorization:
          `Bearer ${token}`,
        'content-type':
          'application/json',
      },
      body: JSON.stringify({
        fields: {
          sentReminders: {
            arrayValue: {
              values: sentReminders.map(
                (value) => ({
                  stringValue: value,
                }),
              ),
            },
          },
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Patch ${response.status}: ${await response.text()}`,
    )
  }
}

const sendFcm = async (
  env,
  accessToken,
  deviceToken,
  reminder,
) => {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        authorization:
          `Bearer ${accessToken}`,
        'content-type':
          'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          data: {
            url: reminder.url,
            eventId:
              reminder.eventId,
            title: reminder.title,
            body: reminder.body,
            sentAt: new Date().toISOString(),
          },
          webpush: {
            headers: {
              Urgency: 'high',
              TTL: '120',
            },
            fcmOptions: {
              link: reminder.url,
            },
          },
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `FCM ${response.status}: ${await response.text()}`,
    )
  }
}

const reminderDate = (
  item,
  minutes,
  env,
) => {
  const time =
    item.startTime ||
    item.scheduledTime ||
    '09:00'
  const date =
    item.date ||
    item.scheduledDate
  const occurrence = new Date(
    `${date}T${time}:00${
      env.UTC_OFFSET || '-06:00'
    }`,
  )
  return new Date(
    occurrence.getTime() -
      minutes * 60000,
  )
}

const collectDueReminders = (
  agenda,
  services,
  env,
) => {
  const now = Date.now()
  const tolerance = 90000
  const due = []

  const consider = (
    item,
    minutes,
    source,
  ) => {
    const reminderId = `${
      item.date ||
      item.scheduledDate
    }T${
      item.startTime ||
      item.scheduledTime ||
      '09:00'
    }:${minutes}`
    const sent = item.sentReminders || []
    const firesAt = reminderDate(
      item,
      minutes,
      env,
    ).getTime()

    if (
      !sent.includes(reminderId) &&
      firesAt <= now &&
      firesAt > now - tolerance
    ) {
      due.push({
        item,
        source,
        reminderId,
        minutes,
      })
    }
  }

  agenda
    .filter(
      (item) =>
        item.status === 'pendiente',
    )
    .forEach((item) =>
      (
        item.reminderMinutes || [15]
      ).forEach((minutes) =>
        consider(
          item,
          Number(minutes),
          'agenda',
        ),
      ),
    )

  services
    .filter(
      (item) =>
        item.scheduledDate &&
        item.reminderEnabled !== false &&
        item.archived !== true &&
        ![
          'finalizado',
          'realizado',
          'cancelado',
          'archivado',
        ].includes(item.status),
    )
    .forEach((item) =>
      [60, 15].forEach((minutes) =>
        consider(
          item,
          minutes,
          'service',
        ),
      ),
    )

  return due
}

const run = async (env) => {
  const token = await getAccessToken(
    env,
  )
  const [agenda, services, devices] =
    await Promise.all([
      listCollection(
        env,
        token,
        'agenda',
      ),
      listCollection(
        env,
        token,
        'servicios',
      ),
      listDevices(env, token),
    ])
  const due = collectDueReminders(
    agenda,
    services,
    env,
  )

  for (const reminder of due) {
    const item = reminder.item
    const time =
      item.startTime ||
      item.scheduledTime ||
      ''
    const title =
      reminder.source === 'service'
        ? `Servicio: ${item.title}`
        : item.title
    const body =
      reminder.minutes === 0
        ? `Es ahora${time ? ` · ${time}` : ''}`
        : `En ${reminder.minutes} minutos${time ? ` · ${time}` : ''}`

    await Promise.allSettled(
      devices.map((device) =>
        sendFcm(
          env,
          token,
          device.token,
          {
            title,
            body,
            url:
              reminder.source ===
              'service'
                ? `/servicios?open=${item.id}`
                : `/agenda`,
            eventId: item.id,
          },
        ),
      ),
    )

    await patchSentReminders(
      env,
      token,
      item.name,
      [
        ...(item.sentReminders || []),
        reminder.reminderId,
      ],
    )
  }

  return {
    checked:
      agenda.length +
      services.length,
    devices: devices.length,
    sent: due.length,
  }
}

export default {
  async scheduled(
    _controller,
    env,
    context,
  ) {
    context.waitUntil(run(env))
  },

  async fetch(_request, env) {
    try {
      const result = await run(env)
      return Response.json(result)
    } catch (error) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 500 },
      )
    }
  },
}
