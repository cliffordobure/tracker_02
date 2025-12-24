import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import { fetchDashboardStats } from '../../store/slices/managerSlice'
import { BACKEND_URL } from '../../config/api'

const CategorizedStudents = () => {
  const dispatch = useDispatch()
  const { dashboardStats, loading } = useSelector((state) => state.manager)
  const [selectedGrade, setSelectedGrade] = useState('all')

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  const categorizedStudents = dashboardStats?.categorizedStudents || {}
  const allGrades = Object.keys(categorizedStudents).sort((a, b) => {
    // Sort grades: Unassigned last, then alphabetically
    if (a === 'Unassigned') return 1
    if (b === 'Unassigned') return -1
    return a.localeCompare(b)
  })

  const displayGrades = selectedGrade === 'all' 
    ? allGrades 
    : [selectedGrade].filter(g => categorizedStudents[g])

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Students by Grade
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  View students organized by grade/class
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="all">All Classes</option>
                  {allGrades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
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
                <p className="text-gray-600 font-medium">Loading students...</p>
              </div>
            </div>
          ) : displayGrades.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {selectedGrade !== 'all' ? 'No students in this grade' : 'No students registered yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {displayGrades.map((grade, index) => (
                <div
                  key={grade}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up"
                >
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">
                      {grade} ({categorizedStudents[grade].length} {categorizedStudents[grade].length === 1 ? 'student' : 'students'})
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorizedStudents[grade].map((student) => (
                        <div
                          key={student._id}
                          className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            {student.photo && student.photo.trim() ? (
                              <img
                                src={student.photo.startsWith('http') || student.photo.startsWith('data:image') ? student.photo : `${BACKEND_URL}${student.photo.startsWith('/') ? '' : '/'}${student.photo}`}
                                alt={student.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-md ${student.photo && student.photo.trim() ? 'hidden' : ''}`}
                            >
                              {student.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.grade || 'No grade'}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            {student.route && (
                              <p className="text-gray-600">
                                <span className="font-medium">Route:</span> 
                                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  {student.route.name}
                                </span>
                              </p>
                            )}
                            <p className="text-gray-600">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                student.status === 'Active' ? 'bg-green-100 text-green-800' :
                                student.status === 'Missing' ? 'bg-red-100 text-red-800' :
                                student.status === 'Leave' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {student.status || 'Active'}
                              </span>
                            </p>
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

export default CategorizedStudents

