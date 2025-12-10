import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboardStats } from '../../store/slices/managerSlice'
import { fetchDrivers } from '../../store/slices/managerDriversSlice'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import BusTrackingMap from '../../components/BusTrackingMap'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { dashboardStats, loading } = useSelector((state) => state.manager)
  const { drivers, loading: driversLoading } = useSelector((state) => state.managerDrivers)
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    dispatch(fetchDashboardStats())
    // Fetch drivers immediately on mount
    dispatch(fetchDrivers())
    
    // Refresh drivers every 5 seconds to catch new trips and updates (more frequent)
    const interval = setInterval(() => {
      dispatch(fetchDrivers())
    }, 5000)
    
    return () => clearInterval(interval)
  }, [dispatch])

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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-gray-50 to-primary-50">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Welcome back, <span className="font-semibold text-primary-700">{user?.name}</span>
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'tracking'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bus Tracking
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
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-gray-100"
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

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Active Routes</h3>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <p className="text-3xl font-bold mb-2">{dashboardStats?.routes || 0}</p>
                      <p className="text-primary-100 text-sm">Total routes in your school</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Active Students</h3>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-3xl font-bold mb-2">{dashboardStats?.students || 0}</p>
                      <p className="text-green-100 text-sm">Students enrolled</p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Active Buses</h3>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <p className="text-3xl font-bold mb-2">{activeDrivers.length}</p>
                      <p className="text-yellow-100 text-sm">Buses currently on route</p>
                    </div>
                  </div>

                  {/* Recent Activity or Additional Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                          <span className="text-sm font-medium text-gray-700">Total Drivers</span>
                          <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">{dashboardStats?.drivers || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Quick Stats
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Parents Registered</span>
                          <span className="text-sm font-semibold text-gray-900">{dashboardStats?.parents || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Routes</span>
                          <span className="text-sm font-semibold text-gray-900">{dashboardStats?.routes || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Active Buses</span>
                          <span className="text-sm font-semibold text-primary-600">{activeDrivers.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Students</span>
                          <span className="text-sm font-semibold text-gray-900">{dashboardStats?.students || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bus Tracking Tab */}
              {activeTab === 'tracking' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Bus Tracking</h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                          Monitor all active buses in real-time. Click on a bus marker to see driver details.
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                        <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">Live Updates</span>
                      </div>
                    </div>
                    
                    {/* Always show map - it loads in background without loading indicators */}
                    <div className="h-[600px] md:h-[700px] rounded-lg overflow-hidden">
                      <BusTrackingMap 
                        drivers={activeDrivers || []} 
                        onRefreshDrivers={() => dispatch(fetchDrivers())}
                      />
                    </div>
                    
                    {/* Show helpful messages below map if no drivers or no active buses */}
                    {!driversLoading && drivers.length === 0 && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>No drivers found.</strong> Add drivers to start tracking.
                        </p>
                      </div>
                    )}
                    
                    {!driversLoading && drivers.length > 0 && activeDrivers.length === 0 && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          <strong>No active buses at the moment.</strong> Drivers need to update their location from the mobile app. 
                          Once a driver updates their location, it will appear on the map in real-time.
                        </p>
                        <button
                          onClick={() => {
                            dispatch(fetchDrivers())
                          }}
                          className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                          Refresh Drivers
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Drivers List */}
                  {activeDrivers.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Drivers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeDrivers.map((driver) => (
                          <div
                            key={driver._id}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Route:</span> {driver.currentRoute?.name || 'No Route'}
                            </p>
                            {driver.vehicleNumber && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Vehicle:</span> {driver.vehicleNumber}
                              </p>
                            )}
                            {driver.phone && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Phone:</span> {driver.phone}
                              </p>
                            )}
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
