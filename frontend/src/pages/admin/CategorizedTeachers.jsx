import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import api from '../../services/api'

const AVAILABLE_CLASSES = [
  'PP1', 'PP2', 'PP3',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Form 1', 'Form 2', 'Form 3', 'Form 4'
]

const CategorizedTeachers = () => {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('all')

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/admin/staff')
      const teacherList = (response.data || []).filter(s => s.role === 'teacher')
      setTeachers(teacherList)
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
      toast.error('Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  // Group teachers by assigned classes
  const groupedTeachers = {}
  
  teachers.forEach(teacher => {
    const classes = teacher.assignedClasses && teacher.assignedClasses.length > 0
      ? teacher.assignedClasses
      : (teacher.assignedClass ? [teacher.assignedClass] : ['Unassigned'])
    
    classes.forEach(cls => {
      if (!groupedTeachers[cls]) {
        groupedTeachers[cls] = []
      }
      if (!groupedTeachers[cls].find(t => t._id === teacher._id)) {
        groupedTeachers[cls].push(teacher)
      }
    })
  })

  // Get sorted classes
  const sortedClasses = Object.keys(groupedTeachers).sort((a, b) => {
    const aIndex = AVAILABLE_CLASSES.indexOf(a)
    const bIndex = AVAILABLE_CLASSES.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const displayClasses = selectedClass === 'all' 
    ? sortedClasses 
    : [selectedClass].filter(c => groupedTeachers[c])

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Teachers by Class</h1>
            <p className="text-gray-600 mt-1">View teachers organized by assigned classes</p>
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Classes</option>
            {AVAILABLE_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            {displayClasses.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No teachers found</p>
              </div>
            ) : (
              displayClasses.map((className) => (
                <div key={className} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white">
                      {className} ({groupedTeachers[className].length} {groupedTeachers[className].length === 1 ? 'teacher' : 'teachers'})
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedTeachers[className].map((teacher) => (
                        <div
                          key={teacher._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            {teacher.photo ? (
                              <img 
                                src={teacher.photo.startsWith('http') ? teacher.photo : `http://localhost:5000${teacher.photo}`} 
                                alt={teacher.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg ${teacher.photo ? 'hidden' : ''}`}
                            >
                              {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{teacher.name}</h3>
                              <p className="text-sm text-gray-600">{teacher.email}</p>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">Classes: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {teacher.assignedClasses.map((cls, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                      {cls}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {teacher.sid && (
                              <p className="text-gray-600">
                                <span className="font-medium">School:</span> {teacher.sid.name || 'N/A'}
                              </p>
                            )}
                            <p className="text-gray-600">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                teacher.status === 'Active' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {teacher.status || 'Active'}
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

export default CategorizedTeachers

