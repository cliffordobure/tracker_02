import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStudents } from '../../store/slices/parentSlice'
import ParentLayout from '../../components/layouts/ParentLayout'

const MyKids = () => {
  const dispatch = useDispatch()
  const { students, loading } = useSelector((state) => state.parent)

  useEffect(() => {
    dispatch(fetchStudents())
  }, [dispatch])

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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
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
                      src={student.photo.startsWith('http') ? student.photo : `http://localhost:5000${student.photo}`} 
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
                <div className="mb-4">
                  {getStatusBadge(student.status)}
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
      </div>
    </ParentLayout>
  )
}

export default MyKids



