import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import Students from './Students'
import Diary from './Diary'
import Notices from './Notices'

const TeacherRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/diary" element={<Diary />} />
      <Route path="/notices" element={<Notices />} />
      <Route path="*" element={<Navigate to="/teacher" replace />} />
    </Routes>
  )
}

export default TeacherRouter

