import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import api from '../../services/api'
import { BACKEND_URL } from '../../config/api'

const OnLeave = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/manager/students/on-leave')
      setStudents(response.data || [])
    } catch (error) {
      console.error('Failed to fetch students on leave:', error)
      toast.error('Failed to fetch students on leave')
    } finally {
      setLoading(false)
    }
  }

  const handleActivateStudent = async (studentId) => {
    if (!window.confirm('Activate this student and mark them as Active?')) return
    
    try {
      await api.put(`/manager/students/${studentId}/activate`)
      toast.success('Student activated successfully!')
      fetchStudents()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate student')
    }
  }

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.grade?.toLowerCase().includes(searchLower) ||
      student.route?.name?.toLowerCase().includes(searchLower) ||
      student.parents?.some(p => 
        (typeof p === 'string' ? false : p.name?.toLowerCase().includes(searchLower) || p.email?.toLowerCase().includes(searchLower))
      )
    )
  })

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Students On Leave
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  View and manage students currently on leave
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 animate-fade-in">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading students on leave...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No students match your search' : 'No students on leave'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try a different search term' : 'All students are currently active'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Photo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Parents</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Left School</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <tr 
                        key={student._id} 
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-200 animate-slide-up"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.photo && student.photo.trim() ? (
                            <img
                              src={student.photo.startsWith('http') || student.photo.startsWith('data:image') ? student.photo : `${BACKEND_URL}${student.photo.startsWith('/') ? '' : '/'}${student.photo}`}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${student.photo && student.photo.trim() ? 'hidden' : ''}`}
                          >
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{student.grade || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{student.route?.name || 'No route'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {student.parents && student.parents.length > 0 ? (
                              <div className="space-y-1">
                                {student.parents.map((parent, idx) => (
                                  <div key={parent._id || idx} className="flex items-center space-x-2">
                                    <span>{typeof parent === 'object' ? parent.name : parent}</span>
                                    {typeof parent === 'object' && parent.email && (
                                      <span className="text-xs text-gray-400">({parent.email})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No parents</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {student.leftSchool 
                              ? new Date(student.leftSchool).toLocaleString()
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleActivateStudent(student._id)}
                            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Activate</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}

export default OnLeave

