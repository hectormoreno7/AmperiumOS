import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../../config/firebase'
import {
  loginWithEmail,
  logoutUser,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] =
    useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
        setAuthLoading(false)
      },
      (error) => {
        console.error(
          'No fue posible comprobar la sesión:',
          error,
        )

        setUser(null)
        setAuthLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const login = async (email, password) => {
    return loginWithEmail(email, password)
  }

  const logout = async () => {
    await logoutUser()
  }

  const contextValue = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, authLoading],
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider.',
    )
  }

  return context
}