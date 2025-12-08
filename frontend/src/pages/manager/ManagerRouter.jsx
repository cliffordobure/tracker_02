import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Students from './Students'
import Parents from './Parents'
import Drivers from './Drivers'
import Teachers from './Teachers'
import RoutesPage from './Routes'
import Stops from './Stops'

const ManagerRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/parents" element={<Parents />} />
      <Route path="/drivers" element={<Drivers />} />
      <Route path="/teachers" element={<Teachers />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/stops" element={<Stops />} />
      <Route path="*" element={<Navigate to="/manager" replace />} />
    </Routes>
  )
}

export default ManagerRouter

