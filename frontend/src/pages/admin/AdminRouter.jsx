import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Schools from './Schools'
import Managers from './Managers'
import Staff from './Staff'
import Reports from './Reports'
import Parents from './Parents'
import Students from './Students'
import ActiveSuspendedSchools from './ActiveSuspendedSchools'
import ActiveSuspendedDrivers from './ActiveSuspendedDrivers'

const AdminRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/schools" element={<Schools />} />
      <Route path="/managers" element={<Managers />} />
      <Route path="/parents" element={<Parents />} />
      <Route path="/students" element={<Students />} />
      <Route path="/active-suspended-schools" element={<ActiveSuspendedSchools />} />
      <Route path="/active-suspended-drivers" element={<ActiveSuspendedDrivers />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default AdminRouter

