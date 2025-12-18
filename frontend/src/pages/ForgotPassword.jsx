import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_URL } from '../config/api'
import logo from '../assets/logo.png'

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    role: 'admin',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, {
        email: formData.email,
        role: formData.role,
      })

      toast.success(
        'If an account with that email exists, a password reset link has been sent.'
      )
      navigate('/login')
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to request password reset'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-yellow-100 to-primary-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-16 w-16 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password</h1>
          <p className="text-gray-600 text-sm">
            Enter your email and role and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
              required
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="parent">Parent</option>
              <option value="driver">Driver</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending reset link...' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-2 text-sm text-primary-600 hover:underline"
          >
            Back to login
          </button>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword


