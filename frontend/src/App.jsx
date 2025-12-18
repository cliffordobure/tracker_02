import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import PrivateRoute from './utils/PrivateRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminRouter from './pages/admin/AdminRouter'
import ManagerRouter from './pages/manager/ManagerRouter'
import ParentRouter from './pages/parent/ParentRouter'
import DriverRouter from './pages/driver/DriverRouter'

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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
            <ParentRouter />
          </PrivateRoute>
        }
      />
      <Route
        path="/driver/*"
        element={
          <PrivateRoute allowedRoles={['driver']}>
            <DriverRouter />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default App

