import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardStats } from '../../store/slices/adminSlice'
import AdminLayout from '../../components/layouts/AdminLayout'

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { dashboardStats, loading } = useSelector((state) => state.admin)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  const stats = [
    { 
      title: 'Schools', 
      value: dashboardStats?.schools || 0, 
      icon: '🏫', 
      color: 'bg-blue-500',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      path: '/admin/schools'
    },
    { 
      title: 'Managers', 
      value: dashboardStats?.managers || 0, 
      icon: '👥', 
      color: 'bg-green-500',
      bgGradient: 'from-green-50 to-green-100',
      textColor: 'text-green-700',
      path: '/admin/managers'
    },
    { 
      title: 'Total Routes', 
      value: dashboardStats?.routes || 0, 
      icon: '🗺️', 
      color: 'bg-yellow-500',
      bgGradient: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700'
    },
    { 
      title: 'Total Drivers', 
      value: dashboardStats?.drivers || 0, 
      icon: '🚗', 
      color: 'bg-indigo-500',
      bgGradient: 'from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-700'
    },
  ]

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-gray-50 to-primary-50">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Welcome back, <span className="font-semibold text-primary-700">{user?.name}</span>
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    onClick={() => stat.path && navigate(stat.path)}
                    className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-gray-100 ${
                      stat.path ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`${stat.color} w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-2xl md:text-3xl shadow-lg`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className={`mt-4 h-1 bg-gradient-to-r ${stat.bgGradient} rounded-full`}></div>
                  </div>
                ))}
              </div>

              {/* Quick Actions & System Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Buses Card */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Active Buses</h3>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold mb-2">{dashboardStats?.activeDrivers || 0}</p>
                  <p className="text-primary-100 text-sm">Buses currently tracking</p>
                </div>

                {/* Total Routes Card */}
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Total Routes</h3>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold mb-2">{dashboardStats?.routes || 0}</p>
                  <p className="text-yellow-100 text-sm">Active routes across all schools</p>
                </div>

                {/* Active Managers Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Active Managers</h3>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl font-bold mb-2">{dashboardStats?.managers || 0}</p>
                  <p className="text-green-100 text-sm">Managers across all schools</p>
                </div>
              </div>

              {/* System Overview & Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Status */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    System Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Tracking System</span>
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Notification Service</span>
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Database</span>
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Connected</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">API Server</span>
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">Online</span>
                    </div>
                  </div>
                </div>

                {/* Quick Statistics */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Quick Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Active Schools</span>
                      <span className="text-sm font-semibold text-gray-900">{dashboardStats?.schools || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Active Managers</span>
                      <span className="text-sm font-semibold text-gray-900">{dashboardStats?.managers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Total Drivers</span>
                      <span className="text-sm font-semibold text-gray-900">{dashboardStats?.drivers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Active Buses</span>
                      <span className="text-sm font-semibold text-primary-600">{dashboardStats?.activeDrivers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Total Routes</span>
                      <span className="text-sm font-semibold text-primary-600">{dashboardStats?.routes || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/admin/schools')}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-left border border-blue-200"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">🏫</span>
                      <span className="font-semibold text-gray-800">Manage Schools</span>
                    </div>
                    <p className="text-xs text-gray-600">Add or edit schools</p>
                  </button>
                  <button
                    onClick={() => navigate('/admin/managers')}
                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 text-left border border-green-200"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">👥</span>
                      <span className="font-semibold text-gray-800">Manage Managers</span>
                    </div>
                    <p className="text-xs text-gray-600">Create or update managers</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default Dashboard
