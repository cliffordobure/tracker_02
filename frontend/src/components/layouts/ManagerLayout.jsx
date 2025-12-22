import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { useSelector } from 'react-redux'
import logo from '../../assets/logo.png'
import backgroundImage from '../../assets/background_image.png'

const ManagerLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', path: '/manager', icon: '📊' },
    { name: 'Parents', path: '/manager/parents', icon: '👨‍👩‍👧' },
    { name: 'Drivers', path: '/manager/drivers', icon: '🚗' },
    { name: 'Routes', path: '/manager/routes', icon: '🗺️' },
    { name: 'Bus Stops', path: '/manager/stops', icon: '🚏' },
    { name: 'Students', path: '/manager/students', icon: '👨‍🎓' },
    { name: 'Kids', path: '/manager/kids', icon: '👶' },
    { name: 'Staff', path: '/manager/teachers', icon: '👨‍💼' },
    { name: 'Inbox', path: '/manager/inbox', icon: '📥' },
    { name: 'Outbox', path: '/manager/outbox', icon: '📤' },
    { name: 'Notices', path: '/manager/notices', icon: '📢' },
    { name: 'Driver Ratings', path: '/manager/driver-ratings', icon: '⭐' },
    { name: 'Reports', path: '/manager/reports', icon: '📄' },
  ]

  const isActive = (path) => {
    if (path === '/manager') {
      return location.pathname === '/manager'
    }
    return location.pathname.startsWith(path)
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
      {/* Mobile Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200 lg:hidden sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 p-1.5 shadow-md">
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Manager Dashboard
                </h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-2 shadow-lg ring-2 ring-primary-100 transform hover:scale-105 transition-transform duration-200">
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
                  Manager Dashboard
                </h1>
                <p className="text-xs text-gray-500 font-medium">School Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden xl:block bg-gradient-to-r from-primary-50 to-yellow-50 px-4 py-2 rounded-lg border border-primary-100">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-primary-100 shadow-md">
                    <span className="text-white font-bold text-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-600 truncate max-w-[200px]">{user?.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-md hover:shadow-lg border border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile Sidebar Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-yellow-50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 p-1.5 shadow-md">
                <img src={logo} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Menu</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile User Info */}
          <div className="lg:hidden p-4 border-b border-gray-200 bg-gradient-to-br from-primary-50 via-yellow-50 to-primary-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-primary-100 shadow-md">
                <span className="text-white font-bold text-xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'M'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md border border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 lg:p-6 h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] overflow-y-auto">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path)
                      setSidebarOpen(false)
                    }}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3
                      ${
                        isActive(item.path)
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary-700'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full lg:w-auto min-w-0">
          {children}
        </main>
      </div>
      </div>
    </div>
  )
}

export default ManagerLayout
