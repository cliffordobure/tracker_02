import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { fetchStudents } from '../../store/slices/parentSlice'
import ParentLayout from '../../components/layouts/ParentLayout'
import api from '../../services/api'
import { BACKEND_URL } from '../../config/api'

const MyKids = () => {
  const dispatch = useDispatch()
  const { students, loading } = useSelector((state) => state.parent)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [leaveReason, setLeaveReason] = useState('')

  useEffect(() => {
    dispatch(fetchStudents())
  }, [dispatch])

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Active', color: 'bg-green-100 text-green-800' },
      'Active': { label: 'Active', color: 'bg-green-100 text-green-800' },
      'Leave': { label: 'On Leave', color: 'bg-orange-100 text-orange-800' },
      'on_bus': { label: 'On Bus', color: 'bg-blue-100 text-blue-800' },
      'picked_up': { label: 'Picked Up', color: 'bg-yellow-100 text-yellow-800' },
      'dropped': { label: 'Dropped', color: 'bg-gray-100 text-gray-800' },
      'inactive': { label: 'Inactive', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const handleRequestLeave = (student) => {
    setSelectedStudent(student)
    setLeaveReason('')
    setShowLeaveModal(true)
  }

  const handleSubmitLeaveRequest = async () => {
    if (!leaveReason.trim()) {
      toast.error('Please provide a reason for leave')
      return
    }

    try {
      await api.post(`/parent/students/${selectedStudent.id}/request-leave`, { reason: leaveReason })
      toast.success('Leave request submitted successfully!')
      setShowLeaveModal(false)
      dispatch(fetchStudents())
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request')
    }
  }

  const handleActivateStudent = async (studentId) => {
    if (!window.confirm('Mark this student as Active and ready to return to school?')) return

    try {
      await api.put(`/parent/students/${studentId}/activate`)
      toast.success('Student activated successfully!')
      dispatch(fetchStudents())
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate student')
    }
  }

  const formatLocation = (lat, lng) => {
    if (!lat || !lng) return 'Not available'
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`
  }

  return (
    <ParentLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
          <p className="text-gray-600 mt-2">View and manage your children's information</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading children...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Student Header */}
                <div className="flex items-center space-x-4 mb-4">
                  {student.photo ? (
                    <img 
                      src={student.photo.startsWith('http') || student.photo.startsWith('data:image') ? student.photo : `${BACKEND_URL}${student.photo.startsWith('/') ? '' : '/'}${student.photo}`} 
                      alt={student.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl ${student.photo ? 'hidden' : ''}`}
                  >
                    {student.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.grade || 'No grade assigned'}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4 flex items-center justify-between">
                  {getStatusBadge(student.status)}
                  <div className="flex space-x-2">
                    {student.status === 'Active' || student.status === 'active' ? (
                      <button
                        onClick={() => handleRequestLeave(student)}
                        className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors"
                      >
                        Request Leave
                      </button>
                    ) : student.status === 'Leave' ? (
                      <button
                        onClick={() => handleActivateStudent(student.id)}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
                      >
                        Mark Active
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Route Information */}
                {student.route ? (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="mr-2">🚌</span> Route Information
                    </h4>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Route:</span> {student.route.name}
                    </p>
                    {student.route.driver && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Driver:</span> {student.route.driver.name}
                        </p>
                        {student.route.driver.vehicleNumber && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Vehicle:</span> {student.route.driver.vehicleNumber}
                          </p>
                        )}
                        {student.route.driver.location && (
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Location:</span> {formatLocation(
                              student.route.driver.location.latitude,
                              student.route.driver.location.longitude
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">⚠️</span> No route assigned yet
                    </p>
                  </div>
                )}

                {/* Student Details */}
                <div className="space-y-2 text-sm">
                  {student.address && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-20">Address:</span>
                      <span className="text-gray-600 flex-1">{student.address}</span>
                    </div>
                  )}
                  {student.latitude && student.longitude && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-20">Location:</span>
                      <span className="text-gray-600 flex-1 text-xs">
                        {formatLocation(student.latitude, student.longitude)}
                      </span>
                    </div>
                  )}
                  {student.pickup && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-20">Pickup:</span>
                      <span className="text-gray-600 flex-1">
                        {new Date(student.pickup).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {student.dropped && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 w-20">Dropped:</span>
                      <span className="text-gray-600 flex-1">
                        {new Date(student.dropped).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">👨‍👧‍👦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Children Registered</h3>
            <p className="text-gray-600">
              Your children will appear here once they are registered and assigned to you.
            </p>
          </div>
        )}

        {/* Leave Request Modal */}
        {showLeaveModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <span>🏖️</span>
                    <span>Request Leave for {selectedStudent.name}</span>
                  </h2>
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white/20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Leave *
                  </label>
                  <textarea
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Please provide a reason for the leave request..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 min-h-[120px]"
                    rows="4"
                  />
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitLeaveRequest}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentLayout>
  )
}

export default MyKids



