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
import HistorialPage from '../modules/historial/pages/HistorialPage'
import AgendaPage from '../modules/agenda/pages/AgendaPage'
import ConfiguracionPage from '../modules/configuracion/pages/ConfiguracionPage'
import NotasPage from '../modules/notas/pages/NotasPage'
import ListasPage from '../modules/listas/pages/ListasPage'

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
          path="/historial"
          element={<HistorialPage />}
        />

        <Route
          path="/notas"
          element={<NotasPage />}
        />

        <Route
          path="/listas"
          element={<ListasPage />}
        />

        <Route
          path="/agenda"
          element={<AgendaPage />}
        />

        <Route
          path="/configuracion"
          element={<ConfiguracionPage />}
        />

        <Route
          path="/configuracion-anterior"
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
