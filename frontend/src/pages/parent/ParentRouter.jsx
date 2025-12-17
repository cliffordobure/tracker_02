import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import LiveMap from './LiveMap'
import MyKids from './MyKids'
import Notifications from './Notifications'

const ParentRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/map" element={<LiveMap />} />
      <Route path="/kids" element={<MyKids />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="*" element={<Navigate to="/parent" replace />} />
    </Routes>
  )
}

export default ParentRouter



