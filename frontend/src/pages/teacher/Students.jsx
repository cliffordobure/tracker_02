import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import TeacherLayout from '../../components/layouts/TeacherLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const Students = () => {
  const { user } = useSelector((state) => state.auth)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/teacher/students')
      setStudents(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkLeaving = async (studentId) => {
    if (!window.confirm('Mark this student as leaving school?')) {
      return
    }

    try {
      await api.post(`/teacher/students/${studentId}/leave-school`)
      toast.success('Student marked as leaving school')
      fetchStudents()
    } catch (error) {
      console.error('Error marking student as leaving:', error)
      toast.error(error.response?.data?.message || 'Failed to mark student as leaving')
    }
  }

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <TeacherLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  My Students
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {user?.assignedClass ? `Class: ${user.assignedClass}` : 'Manage your assigned class'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-12 max-w-md mx-auto">
                <div className="text-6xl mb-4">👨‍🎓</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {searchTerm ? 'No students found' : 'No students assigned'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : user?.assignedClass 
                      ? `No students are currently assigned to ${user.assignedClass}`
                      : 'You don\'t have a class assigned yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Parent
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <tr
                        key={student._id}
                        className="hover:bg-gray-50 transition-colors duration-150 animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg mr-3 ring-2 ring-primary-100">
                              {student.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                              {student.address && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">{student.address}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {student.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.parents && student.parents.length > 0 ? (
                            <div>
                              {student.parents.map((parent, idx) => (
                                <div key={parent._id || idx} className="text-sm">
                                  {parent.name || parent.email}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No parent assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.leftSchool ? (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Left School
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!student.leftSchool && (
                            <button
                              onClick={() => handleMarkLeaving(student._id)}
                              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all duration-200 transform hover:scale-105 font-medium"
                            >
                              Mark Leaving
                            </button>
                          )}
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
    </TeacherLayout>
  )
}

export default Students

