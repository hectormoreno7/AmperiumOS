import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import AppLayout from '../layouts/AppLayout/AppLayout'

import DashboardPage from '../modules/dashboard/pages/DashboardPage'
import ClientesPage from '../modules/clientes/pages/ClientesPage'
import CotizacionesPage from '../modules/cotizaciones/pages/CotizacionesPage'
import ServiciosPage from '../modules/servicios/pages/ServiciosPage'

import ModulePlaceholderPage from '../shared/pages/ModulePlaceholderPage'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/clientes"
          element={<ClientesPage />}
        />

        <Route
          path="/cotizaciones"
          element={
            <CotizacionesPage />
          }
        />

        <Route
          path="/servicios"
          element={<ServiciosPage />}
        />

        <Route
          path="/notas"
          element={
            <ModulePlaceholderPage
              title="Notas"
              description="Genera notas de venta, registra pagos y controla saldos pendientes."
            />
          }
        />

        <Route
          path="/agenda"
          element={
            <ModulePlaceholderPage
              title="Agenda"
              description="Organiza visitas, servicios, instalaciones y recordatorios."
            />
          }
        />

        <Route
          path="/configuracion"
          element={
            <ModulePlaceholderPage
              title="Configuración"
              description="Administra usuarios, módulos, folios y preferencias del sistema."
            />
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  )
}

export default AppRoutes