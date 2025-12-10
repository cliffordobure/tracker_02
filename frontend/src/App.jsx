import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import PrivateRoute from './utils/PrivateRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminRouter from './pages/admin/AdminRouter'
import ManagerRouter from './pages/manager/ManagerRouter'
import ParentDashboard from './pages/parent/Dashboard'

function App() {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)

  useEffect(() => {
    // Set axios default header if token exists
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [token])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminRouter />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/*"
        element={
          <PrivateRoute allowedRoles={['manager']}>
            <ManagerRouter />
          </PrivateRoute>
        }
      />
      <Route
        path="/parent/*"
        element={
          <PrivateRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default App

