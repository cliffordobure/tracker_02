import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchStudents, fetchNotifications } from '../../store/slices/parentSlice'
import ParentLayout from '../../components/layouts/ParentLayout'

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { students, notifications, loading } = useSelector((state) => state.parent)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchStudents())
    dispatch(fetchNotifications())
  }, [dispatch])

  const unreadNotifications = notifications.filter(n => !n.isRead).length
  const activeStudents = students.filter(s => s.status === 'active' || s.status === 'on_bus').length
  const studentsWithRoute = students.filter(s => s.route).length

  const stats = [
    {
      title: 'My Children',
      value: students.length,
      icon: '👨‍👧‍👦',
      color: 'bg-blue-500',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      onClick: () => navigate('/parent/kids')
    },
    {
      title: 'Active Students',
      value: activeStudents,
      icon: '🚌',
      color: 'bg-green-500',
      bgGradient: 'from-green-50 to-green-100',
      textColor: 'text-green-700'
    },
    {
      title: 'With Routes',
      value: studentsWithRoute,
      icon: '🗺️',
      color: 'bg-purple-500',
      bgGradient: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-700'
    },
    {
      title: 'Notifications',
      value: unreadNotifications,
      icon: '🔔',
      color: 'bg-orange-500',
      bgGradient: 'from-orange-50 to-orange-100',
      textColor: 'text-orange-700',
      onClick: () => navigate('/parent/notifications'),
      badge: unreadNotifications > 0
    }
  ]

  const recentNotifications = notifications.slice(0, 5)
  const recentStudents = students.slice(0, 3)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Active', color: 'bg-green-100 text-green-800' },
      'on_bus': { label: 'On Bus', color: 'bg-blue-100 text-blue-800' },
      'picked_up': { label: 'Picked Up', color: 'bg-yellow-100 text-yellow-800' },
      'dropped': { label: 'Dropped', color: 'bg-gray-100 text-gray-800' },
      'inactive': { label: 'Inactive', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <ParentLayout>
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Welcome back, {user?.name || 'Parent'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              onClick={stat.onClick}
              className={`bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 sm:hover:scale-105 ${
                stat.onClick ? 'hover:border-blue-300' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{stat.title}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${stat.color} flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 ml-2`}>
                  {stat.icon}
                </div>
              </div>
              {stat.badge && unreadNotifications > 0 && (
                <div className="mt-2 sm:mt-3">
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadNotifications} new
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* My Children Section */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">My Children</h2>
              <button
                onClick={() => navigate('/parent/kids')}
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
              >
                <span className="hidden sm:inline">View All →</span>
                <span className="sm:hidden">All →</span>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2 text-sm">Loading...</p>
              </div>
            ) : recentStudents.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                    onClick={() => navigate('/parent/kids')}
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          {student.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{student.grade || 'No grade'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {getStatusBadge(student.status)}
                        {student.route && (
                          <p className="text-xs text-gray-500 mt-1 hidden sm:block truncate max-w-[100px]">{student.route.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 text-sm sm:text-base">No children registered yet</p>
              </div>
            )}
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Notifications</h2>
              <button
                onClick={() => navigate('/parent/notifications')}
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
              >
                <span className="hidden sm:inline">View All →</span>
                <span className="sm:hidden">All →</span>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2 text-sm">Loading...</p>
              </div>
            ) : recentNotifications.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors active:scale-98 ${
                      notification.isRead
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                    onClick={() => navigate('/parent/notifications')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-2 mb-1">
                          <span className="text-base sm:text-lg flex-shrink-0">
                            {notification.type === 'pickup' ? '🚌' :
                             notification.type === 'drop' ? '🏠' :
                             notification.type === 'delay' ? '⏰' : '📢'}
                          </span>
                          <p className={`text-xs sm:text-sm font-medium ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          } break-words`}>
                            {notification.message}
                          </p>
                        </div>
                        {notification.student && (
                          <p className="text-xs text-gray-500 mt-1 ml-6 sm:ml-7">
                            For: {notification.student.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 ml-6 sm:ml-7">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 text-sm sm:text-base">No notifications yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 sm:mt-5 md:mt-6 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/parent/map')}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors active:bg-blue-100"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">🗺️</span>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Live Map</p>
                <p className="text-xs sm:text-sm text-gray-600">Track bus location</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/parent/kids')}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors active:bg-green-100"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">👨‍👧‍👦</span>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">My Kids</p>
                <p className="text-xs sm:text-sm text-gray-600">View children details</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/parent/notifications')}
              className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors active:bg-orange-100 sm:col-span-2 lg:col-span-1"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">🔔</span>
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Notifications</p>
                <p className="text-xs sm:text-sm text-gray-600">View all updates</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </ParentLayout>
  )
}

export default Dashboard
