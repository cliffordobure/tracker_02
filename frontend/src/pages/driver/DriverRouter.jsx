import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Journey from './Journey'
import History from './History'

const DriverRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/journey" element={<Journey />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to="/driver" replace />} />
    </Routes>
  )
}

export default DriverRouter



