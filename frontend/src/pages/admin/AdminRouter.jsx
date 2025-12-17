import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Schools from './Schools'
import Managers from './Managers'
import Staff from './Staff'
import Reports from './Reports'

const AdminRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/schools" element={<Schools />} />
      <Route path="/managers" element={<Managers />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default AdminRouter

