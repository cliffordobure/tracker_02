import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import api from '../../services/api'

const AVAILABLE_GRADES = [
  'PP1', 'PP2', 'PP3',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Form 1', 'Form 2', 'Form 3', 'Form 4'
]

const CategorizedStudents = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState('all')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students')
      setStudents(response.data || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  // Group students by grade
  const groupedStudents = students.reduce((acc, student) => {
    const grade = student.grade || 'Unassigned'
    if (!acc[grade]) {
      acc[grade] = []
    }
    acc[grade].push(student)
    return acc
  }, {})

  // Get sorted grades
  const sortedGrades = Object.keys(groupedStudents).sort((a, b) => {
    const aIndex = AVAILABLE_GRADES.indexOf(a)
    const bIndex = AVAILABLE_GRADES.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const displayGrades = selectedGrade === 'all' 
    ? sortedGrades 
    : [selectedGrade].filter(g => groupedStudents[g])

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Students by Class</h1>
            <p className="text-gray-600 mt-1">View students organized by grade/class</p>
          </div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Classes</option>
            {AVAILABLE_GRADES.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            {displayGrades.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              displayGrades.map((grade) => (
                <div key={grade} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">
                      {grade} ({groupedStudents[grade].length} {groupedStudents[grade].length === 1 ? 'student' : 'students'})
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedStudents[grade].map((student) => (
                        <div
                          key={student._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            {student.photo ? (
                              <img 
                                src={student.photo.startsWith('http') ? student.photo : `http://localhost:5000${student.photo}`} 
                                alt={student.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg ${student.photo ? 'hidden' : ''}`}
                            >
                              {student.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.sid?.name || 'No school'}</p>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            {student.route && (
                              <p className="text-gray-600">
                                <span className="font-medium">Route:</span> {student.route.name}
                              </p>
                            )}
                            <p className="text-gray-600">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                student.status === 'Active' ? 'bg-green-100 text-green-800' :
                                student.status === 'Missing' ? 'bg-red-100 text-red-800' :
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
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default CategorizedStudents

