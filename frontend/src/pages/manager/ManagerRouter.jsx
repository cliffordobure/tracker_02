import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Students from './Students'
import Parents from './Parents'
import Drivers from './Drivers'
import Teachers from './Teachers'
import RoutesPage from './Routes'
import Stops from './Stops'
import DriverRatings from './DriverRatings'
import Reports from './Reports'
import Notices from './Notices'
import Kids from './Kids'
import Inbox from './Inbox'
import Outbox from './Outbox'
import OnLeave from './OnLeave'
import PendingLeaveRequests from './PendingLeaveRequests'
import CategorizedStudents from './CategorizedStudents'
import CategorizedTeachers from './CategorizedTeachers'

const ManagerRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/categorized-students" element={<CategorizedStudents />} />
      <Route path="/parents" element={<Parents />} />
      <Route path="/drivers" element={<Drivers />} />
      <Route path="/teachers" element={<Teachers />} />
      <Route path="/categorized-teachers" element={<CategorizedTeachers />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/stops" element={<Stops />} />
      <Route path="/driver-ratings" element={<DriverRatings />} />
      <Route path="/notices" element={<Notices />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/kids" element={<Kids />} />
      <Route path="/on-leave" element={<OnLeave />} />
      <Route path="/pending-leave-requests" element={<PendingLeaveRequests />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/outbox" element={<Outbox />} />
      <Route path="*" element={<Navigate to="/manager" replace />} />
    </Routes>
  )
}

export default ManagerRouter

