import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardStats } from '../../store/slices/managerSlice'
import { fetchDrivers } from '../../store/slices/managerDriversSlice'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import BusTrackingMap from '../../components/BusTrackingMap'
import api from '../../services/api'

// Animated number counter component
const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime = null
    const startValue = 0
    const endValue = value || 0

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const currentValue = Math.floor(startValue + (endValue - startValue) * progress)
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{displayValue}</span>
}

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { dashboardStats, loading } = useSelector((state) => state.manager)
  const { drivers, loading: driversLoading } = useSelector((state) => state.managerDrivers)
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('overview')
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    dispatch(fetchDashboardStats())
    // Fetch drivers immediately on mount
    dispatch(fetchDrivers())
    fetchUnreadMessages()
    
    // Refresh drivers every 5 seconds to catch new trips and updates (more frequent)
    const interval = setInterval(() => {
      dispatch(fetchDrivers())
      fetchUnreadMessages()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [dispatch])


  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/manager/messages/inbox')
      const unread = (response.data || []).filter(m => !m.isRead).length
      setUnreadMessages(unread)
    } catch (error) {
      console.error('Failed to fetch unread messages:', error)
    }
  }

  const stats = [
    { 
      title: 'Parents', 
      value: dashboardStats?.parents || 0, 
      icon: '👨‍👩‍👧', 
      color: 'bg-blue-500',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700'
    },
    { 
      title: 'Students', 
      value: dashboardStats?.students || 0, 
      icon: '👨‍🎓', 
      color: 'bg-green-500',
      bgGradient: 'from-green-50 to-green-100',
      textColor: 'text-green-700'
    },
    { 
      title: 'Routes', 
      value: dashboardStats?.routes || 0, 
      icon: '🗺️', 
      color: 'bg-yellow-500',
      bgGradient: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700'
    },
    { 
      title: 'Drivers', 
      value: dashboardStats?.drivers || 0, 
      icon: '🚗', 
      color: 'bg-purple-500',
      bgGradient: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-700'
    },
  ]

  const activeDrivers = drivers?.filter(driver => 
    driver.latitude && driver.longitude && driver.status !== 'Deleted'
  ) || []

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Welcome back, <span className="font-semibold text-primary-700">{user?.name}</span>
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 transform ${
                    activeTab === 'overview'
                      ? 'bg-primary-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 transform ${
                    activeTab === 'tracking'
                      ? 'bg-primary-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  Live Tracking
                </button>
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
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 p-6 border border-gray-100 animate-slide-up"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.title}</p>
                            <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              <AnimatedNumber value={stat.value} />
                            </p>
                          </div>
                          <div className={`${stat.color} w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-xl transform rotate-3 hover:rotate-6 transition-transform duration-300`}>
                            {stat.icon}
                          </div>
                        </div>
                        <div className={`h-2 bg-gradient-to-r ${stat.bgGradient} rounded-full transform scale-x-0 hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                      </div>
                    ))}
                  </div>

                  {/* Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div 
                      style={{ animationDelay: '400ms' }}
                      className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-up group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Routes</h3>
                        <svg className="w-10 h-10 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <p className="text-5xl font-bold mb-3">
                        <AnimatedNumber value={dashboardStats?.routes || 0} />
                      </p>
                      <p className="text-primary-100 text-sm font-medium">Operational routes</p>
                    </div>

                    <div 
                      style={{ animationDelay: '500ms' }}
                      className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-up group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Students</h3>
                        <svg className="w-10 h-10 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-5xl font-bold mb-3">
                        <AnimatedNumber value={dashboardStats?.students || 0} />
                      </p>
                      <p className="text-emerald-100 text-sm font-medium">Enrolled students</p>
                    </div>

                    <div 
                      style={{ animationDelay: '600ms' }}
                      className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-up group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Buses</h3>
                        <svg className="w-10 h-10 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <p className="text-5xl font-bold mb-3">
                        <AnimatedNumber value={activeDrivers.length} />
                      </p>
                      <p className="text-amber-100 text-sm font-medium">Currently on route</p>
                    </div>
                  </div>

                  {/* Messaging Widget */}
                  <div 
                    style={{ animationDelay: '700ms' }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 animate-slide-up cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => navigate('/manager/inbox')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Messages
                      </h3>
                      {unreadMessages > 0 && (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                          {unreadMessages} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Unread messages</p>
                        <p className="text-2xl font-bold text-primary-600">{unreadMessages}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/manager/inbox')
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                      >
                        View Inbox
                      </button>
                    </div>
                  </div>

                  {/* System Status */}
                  <div 
                    style={{ animationDelay: '1000ms' }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100 animate-slide-up"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      System Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-gray-800">Tracking</span>
                        </div>
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md">Online</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-gray-800">Notifications</span>
                        </div>
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md">Online</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-800">Drivers</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-md">
                          <AnimatedNumber value={dashboardStats?.drivers || 0} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bus Tracking Tab */}
              {activeTab === 'tracking' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div 
                      style={{ animationDelay: '100ms' }}
                      className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 text-white animate-slide-up transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-primary-100 text-sm font-medium mb-1">Active Buses</p>
                          <p className="text-4xl font-bold">
                            <AnimatedNumber value={activeDrivers.length} />
                          </p>
                        </div>
                        <svg className="w-12 h-12 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>
                    
                    <div 
                      style={{ animationDelay: '200ms' }}
                      className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg p-6 text-white animate-slide-up transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-sm font-medium mb-1">Total Drivers</p>
                          <p className="text-4xl font-bold">
                            <AnimatedNumber value={dashboardStats?.drivers || 0} />
                          </p>
                        </div>
                        <svg className="w-12 h-12 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div 
                      style={{ animationDelay: '300ms' }}
                      className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-lg p-6 text-white animate-slide-up transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-amber-100 text-sm font-medium mb-1">Routes</p>
                          <p className="text-4xl font-bold">
                            <AnimatedNumber value={dashboardStats?.routes || 0} />
                          </p>
                        </div>
                        <svg className="w-12 h-12 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Map Container */}
                  <div 
                    style={{ animationDelay: '400ms' }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 animate-slide-up"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
                          Live Tracking
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                          Real-time monitoring of all active buses. Click markers for driver details.
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center space-x-3 px-5 py-2.5 bg-gradient-to-r from-primary-50 to-primary-100 rounded-full border-2 border-primary-200 shadow-md">
                        <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse shadow-lg"></div>
                        <span className="text-sm font-bold text-primary-700">Live Updates</span>
                      </div>
                    </div>
                    
                    {/* Map with enhanced styling */}
                    <div className="h-[600px] md:h-[700px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
                      <BusTrackingMap 
                        drivers={activeDrivers || []} 
                        onRefreshDrivers={() => dispatch(fetchDrivers())}
                      />
                    </div>
                    
                    {/* Status Messages */}
                    {!driversLoading && drivers.length === 0 && (
                      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 animate-fade-in">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-blue-900">
                            No drivers registered. Add drivers to enable tracking.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!driversLoading && drivers.length > 0 && activeDrivers.length === 0 && (
                      <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 animate-fade-in">
                        <div className="flex items-start space-x-3">
                          <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900 mb-2">
                              Waiting for location updates
                            </p>
                            <p className="text-xs text-amber-700 mb-4">
                              Drivers will appear on the map once they update their location via the mobile app.
                            </p>
                            <button
                              onClick={() => dispatch(fetchDrivers())}
                              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 text-sm font-semibold shadow-md"
                            >
                              Refresh
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Drivers List */}
                  {activeDrivers.length > 0 && (
                    <div 
                      style={{ animationDelay: '500ms' }}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 animate-slide-up"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                          <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Active Drivers
                        </h3>
                        <button
                          onClick={() => dispatch(fetchDrivers())}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 transform hover:scale-105 text-sm font-semibold shadow-md flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Refresh</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeDrivers.map((driver, index) => (
                          <div
                            key={driver._id}
                            style={{ animationDelay: `${(500 + index * 100)}ms` }}
                            className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 animate-slide-up group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-lg text-gray-900 group-hover:text-primary-700 transition-colors">{driver.name}</h4>
                              <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-md"></div>
                                <span className="text-xs font-bold text-green-700">Live</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold text-gray-800">Route:</span> {driver.currentRoute?.name || 'N/A'}
                                </p>
                              </div>
                              {driver.vehicleNumber && (
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-800">Vehicle:</span> 
                                    <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded font-mono text-xs font-bold">
                                      {driver.vehicleNumber}
                                    </span>
                                  </p>
                                </div>
                              )}
                              {driver.phone && (
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-800">Contact:</span> {driver.phone}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}

export default Dashboard
