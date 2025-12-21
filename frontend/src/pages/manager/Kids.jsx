import { useEffect, useState } from 'react'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const Kids = () => {
  const [drivers, setDrivers] = useState([])
  const [unassignedRoutes, setUnassignedRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDrivers, setExpandedDrivers] = useState({})
  const [expandedRoutes, setExpandedRoutes] = useState({})

  useEffect(() => {
    fetchKids()
  }, [])

  const fetchKids = async () => {
    try {
      setLoading(true)
      const response = await api.get('/manager/kids')
      setDrivers(response.data.drivers || [])
      setUnassignedRoutes(response.data.unassignedRoutes || [])
      
      // Auto-expand first driver
      if (response.data.drivers && response.data.drivers.length > 0) {
        setExpandedDrivers({ [response.data.drivers[0].id]: true })
      }
    } catch (error) {
      console.error('Failed to fetch kids data:', error)
      toast.error('Failed to load kids data')
    } finally {
      setLoading(false)
    }
  }

  const toggleDriver = (driverId) => {
    setExpandedDrivers(prev => ({
      ...prev,
      [driverId]: !prev[driverId]
    }))
  }

  const toggleRoute = (routeId) => {
    setExpandedRoutes(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }))
  }

  if (loading) {
    return (
      <ManagerLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading kids data...</p>
          </div>
        </div>
      </ManagerLayout>
    )
  }

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Kids
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  View drivers, their routes, and assigned students
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Drivers Section */}
          {drivers.length === 0 && unassignedRoutes.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-600">No drivers or routes found. Please add drivers and routes first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Drivers with Routes */}
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in"
                >
                  {/* Driver Header */}
                  <div
                    className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 cursor-pointer"
                    onClick={() => toggleDriver(driver.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{driver.name}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-white/80 text-sm">
                            <span>🚗 {driver.vehicleNumber}</span>
                            {driver.phone && <span>📞 {driver.phone}</span>}
                            <span>📍 {driver.routes.length} Route{driver.routes.length !== 1 ? 's' : ''}</span>
                            <span>👨‍🎓 {driver.totalStudents} Student{driver.totalStudents !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg
                          className={`w-6 h-6 text-white transform transition-transform duration-200 ${
                            expandedDrivers[driver.id] ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Routes */}
                  {expandedDrivers[driver.id] && (
                    <div className="p-6 space-y-4">
                      {driver.routes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No routes assigned to this driver</p>
                        </div>
                      ) : (
                        driver.routes.map((route) => (
                          <div
                            key={route.id}
                            className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 overflow-hidden"
                          >
                            {/* Route Header */}
                            <div
                              className="px-5 py-4 cursor-pointer hover:bg-yellow-100/50 transition-colors"
                              onClick={() => toggleRoute(route.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                                    🗺️
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900">{route.name}</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {route.students.length} Student{route.students.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                                <svg
                                  className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${
                                    expandedRoutes[route.id] ? 'rotate-180' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* Students */}
                            {expandedRoutes[route.id] && (
                              <div className="px-5 py-4 bg-white border-t border-yellow-200">
                                {route.students.length === 0 ? (
                                  <div className="text-center py-4 text-gray-500">
                                    <p>No students assigned to this route</p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {route.students.map((student) => (
                                      <div
                                        key={student.id}
                                        className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {student.photo ? (
                                              <img
                                                src={student.photo}
                                                alt={student.name}
                                                className="w-full h-full rounded-full object-cover"
                                              />
                                            ) : (
                                              student.name?.charAt(0)?.toUpperCase() || 'S'
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-bold text-gray-900 truncate">{student.name}</h5>
                                            <div className="flex items-center space-x-2 mt-1">
                                              {student.grade && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                  {student.grade}
                                                </span>
                                              )}
                                              <span
                                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                  student.status === 'Active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : student.status === 'Missing'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                              >
                                                {student.status}
                                              </span>
                                            </div>
                                            {student.address && (
                                              <p className="text-xs text-gray-500 truncate mt-1" title={student.address}>
                                                📍 {student.address}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Unassigned Routes */}
              {unassignedRoutes.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                    <h3 className="text-xl font-bold text-white">
                      Routes Without Drivers ({unassignedRoutes.length})
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {unassignedRoutes.map((route) => (
                      <div
                        key={route.id}
                        className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden"
                      >
                        <div
                          className="px-5 py-4 cursor-pointer hover:bg-gray-200/50 transition-colors"
                          onClick={() => toggleRoute(`unassigned-${route.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold">
                                🗺️
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-gray-900">{route.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {route.students.length} Student{route.students.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${
                                expandedRoutes[`unassigned-${route.id}`] ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {expandedRoutes[`unassigned-${route.id}`] && (
                          <div className="px-5 py-4 bg-white border-t border-gray-200">
                            {route.students.length === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                <p>No students assigned to this route</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {route.students.map((student) => (
                                  <div
                                    key={student.id}
                                    className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {student.photo ? (
                                          <img
                                            src={student.photo}
                                            alt={student.name}
                                            className="w-full h-full rounded-full object-cover"
                                          />
                                        ) : (
                                          student.name?.charAt(0)?.toUpperCase() || 'S'
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-gray-900 truncate">{student.name}</h5>
                                        <div className="flex items-center space-x-2 mt-1">
                                          {student.grade && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                              {student.grade}
                                            </span>
                                          )}
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                                              student.status === 'Active'
                                                ? 'bg-green-100 text-green-700'
                                                : student.status === 'Missing'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                          >
                                            {student.status}
                                          </span>
                                        </div>
                                        {student.address && (
                                          <p className="text-xs text-gray-500 truncate mt-1" title={student.address}>
                                            📍 {student.address}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}

export default Kids

