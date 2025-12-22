import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import api from '../../services/api'

const OnLeave = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSchool, setFilterSchool] = useState('all')
  const [schools, setSchools] = useState([])

  useEffect(() => {
    fetchStudents()
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const response = await api.get('/admin/schools')
      setSchools(response.data || [])
    } catch (error) {
      console.error('Failed to fetch schools:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students')
      // Filter students with status 'Leave'
      const leaveStudents = (response.data || []).filter(s => s.status === 'Leave')
      setStudents(leaveStudents)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast.error('Failed to fetch students on leave')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReturn = async (studentId) => {
    if (!window.confirm('Approve this student to return to active status?')) return
    
    try {
      await api.put(`/admin/students/${studentId}`, { status: 'Active' })
      toast.success('Student status updated successfully!')
      fetchStudents()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student status')
    }
  }

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchLower) ||
      student.grade?.toLowerCase().includes(searchLower) ||
      student.sid?.name?.toLowerCase().includes(searchLower)
    
    const matchesSchool = filterSchool === 'all' || student.sid?._id === filterSchool || student.sid === filterSchool
    
    return matchesSearch && matchesSchool
  })

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Students On Leave</h1>
            <p className="text-gray-600 mt-1">View and manage students currently on leave</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, grade, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by School</label>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Schools</option>
                {schools.map(school => (
                  <option key={school._id} value={school._id}>{school.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              {searchTerm || filterSchool !== 'all' 
                ? 'No students match your filters' 
                : 'No students are currently on leave'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Left School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.photo ? (
                          <img 
                            src={student.photo.startsWith('http') ? student.photo : `http://localhost:5000${student.photo}`} 
                            alt={student.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23999'%3E${student.name?.charAt(0)?.toUpperCase() || 'S'}%3C/text%3E%3C/svg%3E`
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{student.grade || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{student.sid?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {student.leftSchool 
                            ? new Date(student.leftSchool).toLocaleString()
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {student.parents && student.parents.length > 0 ? (
                            <div className="space-y-1">
                              {student.parents.map((parent, idx) => (
                                <div key={parent._id || idx} className="flex items-center space-x-2">
                                  <span>{parent.name || parent}</span>
                                  {parent.email && (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleApproveReturn(student._id)}
                          className="text-green-600 hover:text-green-900 font-semibold"
                        >
                          Approve Return
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
    </AdminLayout>
  )
}

export default OnLeave

