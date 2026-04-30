import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Items from './pages/Items'
import NewItem from './pages/NewItem'
import ItemDetail from './pages/ItemDetail'
import Releases from './pages/Releases'
import Audits from './pages/Audits'
import AuditDetail from './pages/AuditDetail'
import InitialAuditDetail from './pages/InitialAuditDetail'
import Reports from './pages/Reports'
import ActivityLogs from './pages/ActivityLogs'
import Branches from './pages/Branches'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/items" element={<Items />} />
              <Route path="/items/new" element={<NewItem />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/releases" element={<Releases />} />
              <Route path="/audits" element={<Audits />} />
              <Route path="/audits/initial/:id" element={<InitialAuditDetail />} />
              <Route path="/audits/:id" element={<AuditDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
