import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes'
import AuthGate from '../modules/auth/components/AuthGate'
import { AuthProvider } from '../modules/auth/context/AuthContext'
import ReleaseNotesModal from '../shared/components/ReleaseNotesModal/ReleaseNotesModal'
import UpdatePrompt from '../shared/components/UpdatePrompt/UpdatePrompt'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <AppRoutes />
          <ReleaseNotesModal />
          <UpdatePrompt />
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
