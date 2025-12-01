import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { useSelector } from 'react-redux'

const AdminLayout = ({ children }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-800">Super Admin</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-64px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/admin/schools')}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Schools
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/admin/managers')}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Managers
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/admin/students')}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Students
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/admin/parents')}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Parents
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
