import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Schools from './Schools'
import Managers from './Managers'
import Students from './Students'
import Parents from './Parents'

const AdminRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/schools" element={<Schools />} />
      <Route path="/managers" element={<Managers />} />
      <Route path="/students" element={<Students />} />
      <Route path="/parents" element={<Parents />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default AdminRouter

