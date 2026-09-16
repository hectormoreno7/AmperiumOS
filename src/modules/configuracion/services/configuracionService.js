import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import {
  auth,
  db,
  storage,
} from '../../../config/firebase'

const configurationReference = doc(
  db,
  'empresa',
  'configuracion',
)

export const DEFAULT_CONFIGURATION = {
  companyName: 'Amperium',
  legalName: '',
  slogan: 'De la idea a la energía',
  phone: '+52 228 405 5421',
  email: 'amperiumoficial@gmail.com',
  address: 'Xalapa, Veracruz',
  responsibleName: 'Ing. Héctor Zárate',
  logoUrl: '',
  iconUrl: '',
  responsibleSignatureUrl: '',
  primaryColor: '#D4A017',
  secondaryColor: '#242424',
  taxRate: 16,
  utilityRate: 30,
  defaultAdvanceRate: 70,
  warranty:
    'La garantía está sujeta al tipo de instalación, equipo y fabricante.',
  terms:
    'La aprobación implica la aceptación de los términos, alcances y condiciones del servicio.',
}

const normalizeConfiguration = (
  value = {},
) => ({
  ...DEFAULT_CONFIGURATION,
  ...value,
  taxRate: 16,
  utilityRate: Number(
    value.utilityRate ??
      DEFAULT_CONFIGURATION.utilityRate,
  ),
  defaultAdvanceRate: Number(
    value.defaultAdvanceRate ??
      DEFAULT_CONFIGURATION.defaultAdvanceRate,
  ),
})

export const subscribeToConfiguration = (
  onChange,
  onError,
) =>
  onSnapshot(
    configurationReference,
    (snapshot) =>
      onChange(
        normalizeConfiguration(
          snapshot.exists()
            ? snapshot.data()
            : {},
        ),
      ),
    onError,
  )

export const saveConfiguration = async (
  configuration,
) =>
  setDoc(
    configurationReference,
    {
      ...normalizeConfiguration(
        configuration,
      ),
      updatedAt: serverTimestamp(),
      updatedBy:
        auth.currentUser?.uid || '',
    },
    { merge: true },
  )

export const getConfiguration = async () => {
  const snapshot = await getDoc(
    configurationReference,
  )

  return normalizeConfiguration(
    snapshot.exists()
      ? snapshot.data()
      : {},
  )
}

export const uploadConfigurationAsset =
  async (file, assetName) => {
    if (!file) return ''

    const extension =
      file.name.split('.').pop() || 'png'
    const assetReference = ref(
      storage,
      `configuracion/${assetName}.${extension}`,
    )

    await uploadBytes(
      assetReference,
      file,
      {
        contentType: file.type,
      },
    )

    return getDownloadURL(assetReference)
  }

export const applyConfigurationTheme = (
  configuration,
) => {
  const root =
    document.documentElement
  root.style.setProperty(
    '--color-gold',
    configuration.primaryColor,
  )
  root.style.setProperty(
    '--color-graphite',
    configuration.secondaryColor,
  )
}
