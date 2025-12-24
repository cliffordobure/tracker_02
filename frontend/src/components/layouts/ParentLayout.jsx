import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import backgroundImage from '../../assets/background_image.png'

const ParentLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { notifications } = useSelector((state) => state.parent)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const unreadNotifications = notifications.filter(n => !n.isRead).length

  const isActive = (path) => {
    if (path === '/parent') {
      return location.pathname === '/parent' || location.pathname === '/parent/'
    }
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/parent', label: 'Dashboard', icon: '📊' },
    { path: '/parent/map', label: 'Live Map', icon: '🗺️' },
    { path: '/parent/kids', label: 'My Kids', icon: '👨‍👧‍👦' },
    { path: '/parent/notifications', label: 'Notifications', icon: '🔔', badge: unreadNotifications }
  ]

  const handleNavClick = (path) => {
    navigate(path)
    setSidebarOpen(false) // Close sidebar on mobile after navigation
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white bg-opacity-85 pointer-events-none"></div>
      
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                P
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Parent Portal</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Parent</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar and Main Content */}
      <div className="flex relative">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-green-600 shadow-lg lg:shadow-sm min-h-[calc(100vh-73px)] border-r border-green-700 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                      isActive(item.path)
                        ? 'bg-green-800 text-white font-semibold border border-green-700'
                        : 'text-white hover:bg-green-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <span className="text-lg sm:text-xl">{item.icon}</span>
                      <span className="text-sm sm:text-base">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-73px)] w-full lg:w-auto">
          {children}
        </main>
      </div>
      </div>
    </div>
  )
}

export default ParentLayout

