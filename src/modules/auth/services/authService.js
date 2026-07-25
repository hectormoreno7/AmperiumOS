import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../../../config/firebase'

export const loginWithEmail = async (
  email,
  password,
) => {
  const normalizedEmail = String(email ?? '')
    .trim()
    .toLowerCase()

  if (!normalizedEmail) {
    throw new Error(
      'Escribe tu correo electrónico.',
    )
  }

  if (!password) {
    throw new Error('Escribe tu contraseña.')
  }

  const userCredential =
    await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    )

  return userCredential.user
}

export const logoutUser = async () => {
  await signOut(auth)
}