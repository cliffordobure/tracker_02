import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchRoute, fetchJourneyStatus, startJourney, endJourney, pickupStudent, dropStudent } from '../../store/slices/driverSlice'
import DriverLayout from '../../components/layouts/DriverLayout'
import toast from 'react-hot-toast'
import { BACKEND_URL } from '../../config/api'

const Journey = () => {
  const dispatch = useDispatch()
  const { route, students, loading, journeyLoading, currentJourney } = useSelector((state) => state.driver)
  const [journeyType, setJourneyType] = useState('pickup')
  const [isJourneyActive, setIsJourneyActive] = useState(false)
  const [hasActiveJourneyError, setHasActiveJourneyError] = useState(false)

  useEffect(() => {
    dispatch(fetchRoute())
    // Check for active journey on mount and set interval to keep it synced
    const checkJourneyStatus = async () => {
      const result = await dispatch(fetchJourneyStatus())
      if (result.payload?.hasActiveJourney) {
        setIsJourneyActive(true)
        setHasActiveJourneyError(false)
      } else {
        setIsJourneyActive(false)
        setHasActiveJourneyError(false)
      }
    }
    checkJourneyStatus()
    // Check every 10 seconds to keep in sync with mobile app
    const interval = setInterval(checkJourneyStatus, 10000)
    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    // Check if there's an active journey
    if (currentJourney) {
      setIsJourneyActive(true)
      setHasActiveJourneyError(false)
    } else {
      setIsJourneyActive(false)
    }
  }, [currentJourney])

  const handleStartJourney = async () => {
    try {
      await dispatch(startJourney({ journeyType })).unwrap()
      setIsJourneyActive(true)
      setHasActiveJourneyError(false)
      toast.success('Journey started successfully')
      // Refresh journey status
      dispatch(fetchJourneyStatus())
    } catch (error) {
      // Check if error is about active journey
      if (error && (error.includes('active trip') || error.includes('active journey'))) {
        setHasActiveJourneyError(true)
        setIsJourneyActive(true) // Set as active so button shows
        // Refresh journey status to get the active journey
        dispatch(fetchJourneyStatus()).then((result) => {
          if (result.payload?.hasActiveJourney) {
            setIsJourneyActive(true)
          }
        })
      }
      toast.error(error || 'Failed to start journey')
    }
  }

  const handleEndJourney = async () => {
    if (!window.confirm('Are you sure you want to end this journey?')) {
      return
    }
    try {
      await dispatch(endJourney()).unwrap()
      setIsJourneyActive(false)
      setHasActiveJourneyError(false)
      toast.success('Journey ended successfully')
      dispatch(fetchRoute()) // Refresh route data
      dispatch(fetchJourneyStatus()) // Refresh journey status
    } catch (error) {
      toast.error(error || 'Failed to end journey')
    }
  }

  const handlePickup = async (studentId) => {
    try {
      await dispatch(pickupStudent(studentId)).unwrap()
      toast.success('Student picked up')
      dispatch(fetchRoute()) // Refresh route data
    } catch (error) {
      toast.error(error || 'Failed to pickup student')
    }
  }

  const handleDrop = async (studentId) => {
    try {
      await dispatch(dropStudent(studentId)).unwrap()
      toast.success('Student dropped off')
      dispatch(fetchRoute()) // Refresh route data
    } catch (error) {
      toast.error(error || 'Failed to drop student')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'picked_up': { label: 'Picked Up', color: 'bg-green-100 text-green-800' },
      'dropped': { label: 'Dropped', color: 'bg-gray-100 text-gray-800' }
    }
    const statusInfo = statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  // Include 'Active' status students in pending (they haven't been picked up yet)
  const pendingStudents = students.filter(s => 
    s.status === 'pending' || 
    !s.status || 
    s.status === 'Active' ||
    (s.status !== 'picked_up' && s.status !== 'dropped' && !s.pickup && !s.dropped)
  )
  const pickedUpStudents = students.filter(s => s.status === 'picked_up' || (s.pickup && !s.dropped))
  const droppedStudents = students.filter(s => s.status === 'dropped' || s.dropped)

  return (
    <DriverLayout>
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Journey Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage your current journey and student pickups</p>
        </div>

        {/* Journey Control */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Journey Control</h2>
          {(hasActiveJourneyError || isJourneyActive) ? (
            <div className="space-y-4">
              <div className={`${hasActiveJourneyError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border-2 rounded-lg p-4`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <p className={`font-semibold ${hasActiveJourneyError ? 'text-red-900' : 'text-green-900'}`}>
                      {hasActiveJourneyError ? '⚠️ Active Journey Detected' : '✅ Journey Active'}
                    </p>
                    <p className={`text-sm mt-1 ${hasActiveJourneyError ? 'text-red-700' : 'text-green-700'}`}>
                      {hasActiveJourneyError 
                        ? 'You have an active journey. Please end it before starting a new one.'
                        : `Type: ${currentJourney?.journeyType === 'pickup' ? 'Pickup' : currentJourney?.journeyType === 'drop-off' ? 'Drop-off' : journeyType === 'pickup' ? 'Pickup' : 'Drop-off'}`
                      }
                      {currentJourney?.startedAt && (
                        <span className="block mt-1 text-xs">
                          Started: {new Date(currentJourney.startedAt).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleEndJourney}
                    disabled={journeyLoading}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{journeyLoading ? 'Ending...' : 'End Journey'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Journey Type</label>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setJourneyType('pickup')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      journeyType === 'pickup'
                        ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🚌 Pickup
                  </button>
                  <button
                    onClick={() => setJourneyType('drop-off')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      journeyType === 'drop-off'
                        ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🏠 Drop-off
                  </button>
                </div>
              </div>
              <button
                onClick={handleStartJourney}
                disabled={journeyLoading || !route}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {journeyLoading ? 'Starting...' : 'Start Journey'}
              </button>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Students</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-500 mt-2 text-sm">Loading students...</p>
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-4">
              {/* Pending Students */}
              {pendingStudents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending ({pendingStudents.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pendingStudents.map((student) => (
                      <div
                        key={student.id}
                        className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {student.photo ? (
                            <img 
                              src={student.photo.startsWith('http') || student.photo.startsWith('data:image') ? student.photo : `${BACKEND_URL}${student.photo.startsWith('/') ? '' : '/'}${student.photo}`} 
                              alt={student.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 ${student.photo ? 'hidden' : ''}`}
                          >
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{student.grade || 'No grade'}</p>
                          </div>
                        </div>
                        {getStatusBadge(student.status)}
                        {student.address && (
                          <p className="text-xs text-gray-600 mt-2 truncate">📍 {student.address}</p>
                        )}
                        {isJourneyActive && (
                          <button
                            onClick={() => handlePickup(student.id)}
                            className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                          >
                            Mark as Picked Up
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Picked Up Students */}
              {pickedUpStudents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Picked Up ({pickedUpStudents.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pickedUpStudents.map((student) => (
                      <div
                        key={student.id}
                        className="border border-green-200 bg-green-50 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {student.photo ? (
                            <img 
                              src={student.photo.startsWith('http') || student.photo.startsWith('data:image') ? student.photo : `${BACKEND_URL}${student.photo.startsWith('/') ? '' : '/'}${student.photo}`} 
                              alt={student.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 ${student.photo ? 'hidden' : ''}`}
                          >
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{student.grade || 'No grade'}</p>
                          </div>
                        </div>
                        {getStatusBadge(student.status)}
                        {student.pickup && (
                          <p className="text-xs text-gray-600 mt-2">
                            Picked up: {new Date(student.pickup).toLocaleTimeString()}
                          </p>
                        )}
                        {isJourneyActive && (
                          <button
                            onClick={() => handleDrop(student.id)}
                            className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            Mark as Dropped
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropped Students */}
              {droppedStudents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Dropped ({droppedStudents.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {droppedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="border border-gray-200 bg-gray-50 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {student.photo ? (
                            <img 
                              src={student.photo.startsWith('http') || student.photo.startsWith('data:image') ? student.photo : `${BACKEND_URL}${student.photo.startsWith('/') ? '' : '/'}${student.photo}`} 
                              alt={student.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 ${student.photo ? 'hidden' : ''}`}
                          >
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{student.grade || 'No grade'}</p>
                          </div>
                        </div>
                        {getStatusBadge(student.status)}
                        {student.dropped && (
                          <p className="text-xs text-gray-600 mt-2">
                            Dropped: {new Date(student.dropped).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingStudents.length === 0 && pickedUpStudents.length === 0 && droppedStudents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm sm:text-base">No students assigned to this route</p>
                </div>
              )}
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

export default Journey



