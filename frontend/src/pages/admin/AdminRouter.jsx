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
import CategorizedStudents from './CategorizedStudents'
import CategorizedTeachers from './CategorizedTeachers'
import OnLeave from './OnLeave'
import Inbox from './Inbox'
import Outbox from './Outbox'
import TrackingReport from './TrackingReport'

const AdminRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/schools" element={<Schools />} />
      <Route path="/managers" element={<Managers />} />
      <Route path="/parents" element={<Parents />} />
      <Route path="/students" element={<Students />} />
      <Route path="/students-by-class" element={<CategorizedStudents />} />
      <Route path="/teachers-by-class" element={<CategorizedTeachers />} />
      <Route path="/on-leave" element={<OnLeave />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/outbox" element={<Outbox />} />
      <Route path="/active-suspended-schools" element={<ActiveSuspendedSchools />} />
      <Route path="/active-suspended-drivers" element={<ActiveSuspendedDrivers />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/tracking-report" element={<TrackingReport />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default AdminRouter

