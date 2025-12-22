import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import MapPicker from '../../components/MapPicker'
import api from '../../services/api'
import { fetchSchools } from '../../store/slices/schoolsSlice'

const AVAILABLE_GRADES = [
  'PP1', 'PP2', 'PP3',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
]

const Students = () => {
  const dispatch = useDispatch()
  const { schools } = useSelector((state) => state.schools)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [routes, setRoutes] = useState([])
  const [parents, setParents] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    address: '',
    latitude: '',
    longitude: '',
    route: '',
    parents: [],
    sid: '',
    status: 'Active',
    photo: ''
  })

  useEffect(() => {
    fetchStudents()
    dispatch(fetchSchools())
  }, [dispatch])

  useEffect(() => {
    if (formData.sid) {
      fetchRoutes()
      fetchParents()
    }
  }, [formData.sid])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students')
      setStudents(response.data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/routes')
      // Filter routes by selected school
      const filtered = response.data.filter(r => r.sid === formData.sid || r.sid?._id === formData.sid)
      setRoutes(filtered)
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    }
  }

  const fetchParents = async () => {
    try {
      const response = await api.get('/admin/parents')
      // Filter parents by selected school or show all
      const filtered = formData.sid 
        ? response.data.filter(p => !p.sid || p.sid === formData.sid || p.sid?._id === formData.sid)
        : response.data
      setParents(filtered)
    } catch (error) {
      console.error('Failed to fetch parents:', error)
    }
  }

  const handleLocationChange = (lat, lng) => {
    setFormData({
      ...formData,
      latitude: lat.toString(),
      longitude: lng.toString()
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.sid) {
      toast.error('School is required')
      return
    }
    
    try {
      const data = {
        name: formData.name,
        grade: formData.grade,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        route: formData.route || undefined,
        parents: formData.parents || [],
        sid: formData.sid,
        status: formData.status,
        photo: formData.photo || undefined
      }

      if (editingStudent) {
        await api.put(`/admin/students/${editingStudent._id}`, data)
        toast.success('Student updated successfully!')
      } else {
        await api.post('/admin/students', data)
        toast.success('Student created successfully!')
      }
      setShowModal(false)
      resetForm()
      fetchStudents()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student')
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name || '',
      grade: student.grade || '',
      address: student.address || '',
      latitude: student.latitude ? student.latitude.toString() : '',
      longitude: student.longitude ? student.longitude.toString() : '',
      route: student.route?._id || student.route || '',
      parents: student.parents?.map(p => p._id || p) || [],
      sid: student.sid?._id || student.sid || '',
      status: student.status || 'Active',
      photo: student.photo || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return
    
    try {
      await api.delete(`/admin/students/${id}`)
      toast.success('Student deleted successfully!')
      fetchStudents()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      address: '',
      latitude: '',
      longitude: '',
      route: '',
      parents: [],
      sid: '',
      status: 'Active',
      photo: ''
    })
    setEditingStudent(null)
  }

  const toggleParent = (parentId) => {
    const parents = formData.parents.includes(parentId)
      ? formData.parents.filter(p => p !== parentId)
      : [...formData.parents, parentId]
    setFormData({ ...formData, parents })
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Students</h1>
            <p className="text-gray-600 mt-1">Manage all students in the system</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            + Add Student
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
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
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {student.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.sid?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.grade || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.route?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : student.status === 'Missing'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setFormData({ ...formData, photo: reader.result })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="input"
                    />
                    {formData.photo && (
                      <div className="mt-2">
                        <img src={formData.photo} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                    <select
                      required
                      value={formData.sid}
                      onChange={(e) => setFormData({ ...formData, sid: e.target.value, route: '' })}
                      className="input"
                    >
                      <option value="">Select School</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="input"
                    >
                      <option value="">Select Grade</option>
                      {AVAILABLE_GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                    <select
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      className="input"
                      disabled={!formData.sid}
                    >
                      <option value="">Select Route</option>
                      {routes.map((route) => (
                        <option key={route._id} value={route._id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location (Select on Map)</label>
                    <MapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={handleLocationChange}
                      height="400px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="Active">Active</option>
                      <option value="Missing">Missing</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parents</label>
                    <div className="border-2 border-gray-200 rounded-lg p-4 max-h-32 overflow-y-auto bg-gray-50">
                      {parents.length === 0 ? (
                        <p className="text-sm text-gray-500">No parents available. Select a school first.</p>
                      ) : (
                        parents.map((parent) => (
                          <label key={parent._id} className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={formData.parents.includes(parent._id)}
                              onChange={() => toggleParent(parent._id)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">{parent.name} ({parent.email})</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingStudent ? 'Update' : 'Create'} Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Students
