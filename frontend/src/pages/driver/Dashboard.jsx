import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchRoute, updateLocation } from '../../store/slices/driverSlice'
import DriverLayout from '../../components/layouts/DriverLayout'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { route, students, loading, location } = useSelector((state) => state.driver)
  const { user } = useSelector((state) => state.auth)
  const [locationTracking, setLocationTracking] = useState(false)
  const [watchId, setWatchId] = useState(null)

  useEffect(() => {
    dispatch(fetchRoute())
  }, [dispatch])

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setLocationTracking(true)
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        dispatch(updateLocation({ latitude, longitude }))
      },
      (error) => {
        console.error('Error getting location:', error)
        toast.error('Failed to get location')
        setLocationTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
    setWatchId(id)
    toast.success('Location tracking started')
  }

  const stopLocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setLocationTracking(false)
    toast.success('Location tracking stopped')
  }

  const pendingStudents = students.filter(s => s.status === 'pending' || !s.status).length
  const pickedUpStudents = students.filter(s => s.status === 'picked_up').length
  const droppedStudents = students.filter(s => s.status === 'dropped').length
  const totalStudents = students.length

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents,
      icon: '👨‍🎓',
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    {
      title: 'Pending',
      value: pendingStudents,
      icon: '⏳',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Picked Up',
      value: pickedUpStudents,
      icon: '✅',
      color: 'bg-green-500',
      textColor: 'text-green-700'
    },
    {
      title: 'Dropped',
      value: droppedStudents,
      icon: '🏠',
      color: 'bg-purple-500',
      textColor: 'text-purple-700'
    }
  ]

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'picked_up': { label: 'Picked Up', color: 'bg-green-100 text-green-800' },
      'dropped': { label: 'Dropped', color: 'bg-gray-100 text-gray-800' },
      'active': { label: 'Active', color: 'bg-blue-100 text-blue-800' }
    }
    const statusInfo = statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <DriverLayout>
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Welcome back, {user?.name || 'Driver'}</p>
        </div>

        {/* Route Info Card */}
        {route ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg sm:rounded-xl shadow-sm border border-green-200 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Current Route</h2>
                <p className="text-xl sm:text-2xl font-semibold text-green-700">{route.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {route.stops?.length || 0} stops • {totalStudents} students
                </p>
              </div>
              <button
                onClick={() => navigate('/driver/journey')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
              >
                Manage Journey →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-900">No Route Assigned</h3>
                <p className="text-sm text-yellow-700 mt-1">Please contact your manager to assign a route.</p>
              </div>
            </div>
          </div>
        )}

        {/* Location Tracking */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Location Tracking</h2>
              <p className="text-sm text-gray-600">
                {locationTracking ? '📍 Tracking active' : '📍 Tracking inactive'}
              </p>
              {location && (
                <p className="text-xs text-gray-500 mt-1">
                  Last update: {new Date(location.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
            {!locationTracking ? (
              <button
                onClick={startLocationTracking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
              >
                Start Tracking
              </button>
            ) : (
              <button
                onClick={stopLocationTracking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
              >
                Stop Tracking
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6"
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
            </div>
          ))}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Students on Route</h2>
            <button
              onClick={() => navigate('/driver/journey')}
              className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium"
            >
              Manage →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-500 mt-2 text-sm">Loading students...</p>
            </div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                      {student.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{student.grade || 'No grade'}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(student.status)}
                  </div>
                  {student.address && (
                    <p className="text-xs text-gray-500 mt-2 truncate">📍 {student.address}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm sm:text-base">No students assigned to this route</p>
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  )
}

export default Dashboard



