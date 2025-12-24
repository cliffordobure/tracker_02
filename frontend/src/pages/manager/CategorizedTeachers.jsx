import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import { fetchDashboardStats } from '../../store/slices/managerSlice'
import { BACKEND_URL } from '../../config/api'

const CategorizedTeachers = () => {
  const dispatch = useDispatch()
  const { dashboardStats, loading } = useSelector((state) => state.manager)
  const [selectedClass, setSelectedClass] = useState('all')

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  const categorizedTeacher = dashboardStats?.categorizedTeacher || {}
  const allClasses = Object.keys(categorizedTeacher).sort((a, b) => {
    // Sort classes: Unassigned last, then alphabetically
    if (a === 'Unassigned') return 1
    if (b === 'Unassigned') return -1
    return a.localeCompare(b)
  })

  const displayClasses = selectedClass === 'all' 
    ? allClasses 
    : [selectedClass].filter(c => categorizedTeacher[c])

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Teachers by Class
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  View teachers organized by assigned class
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="all">All Classes</option>
                  {allClasses.map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 animate-fade-in">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading teachers...</p>
              </div>
            </div>
          ) : displayClasses.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No teachers found</h3>
                <p className="text-gray-600">
                  {selectedClass !== 'all' ? 'No teachers assigned to this class' : 'No teachers registered yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {displayClasses.map((className, index) => (
                <div
                  key={className}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up"
                >
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">
                      {className} ({categorizedTeacher[className].length} {categorizedTeacher[className].length === 1 ? 'teacher' : 'teachers'})
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedTeacher[className].map((teacher) => (
                        <div
                          key={teacher._id}
                          className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            {teacher.photo && teacher.photo.trim() ? (
                              <img
                                src={teacher.photo.startsWith('http') || teacher.photo.startsWith('data:image') ? teacher.photo : `${BACKEND_URL}${teacher.photo.startsWith('/') ? '' : '/'}${teacher.photo}`}
                                alt={teacher.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-md ${teacher.photo && teacher.photo.trim() ? 'hidden' : ''}`}
                            >
                              {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{teacher.name}</h3>
                              <p className="text-sm text-gray-600 truncate">{teacher.email}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            {teacher.phone && (
                              <p className="text-gray-600">
                                <span className="font-medium">Phone:</span> {teacher.phone}
                              </p>
                            )}
                            <p className="text-gray-600">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                teacher.status === 'Active' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {teacher.status || 'Active'}
                              </span>
                            </p>
                            {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
                              <p className="text-gray-600">
                                <span className="font-medium">Classes:</span> 
                                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  {teacher.assignedClasses.join(', ')}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}

export default CategorizedTeachers

