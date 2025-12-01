import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import { fetchStudents, createStudent, updateStudent, deleteStudent } from '../../store/slices/managerStudentsSlice'
import api from '../../services/api'

const Students = () => {
  const dispatch = useDispatch()
  const { students, loading } = useSelector((state) => state.managerStudents)
  const { user } = useSelector((state) => state.auth)
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
    status: 'Active'
  })

  useEffect(() => {
    dispatch(fetchStudents())
    fetchRoutes()
    fetchParents()
  }, [dispatch])

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/routes')
      setRoutes(response.data)
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    }
  }

  const fetchParents = async () => {
    try {
      const response = await api.get('/manager/parents')
      setParents(response.data)
    } catch (error) {
      console.error('Failed to fetch parents:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        route: formData.route || undefined,
        parents: formData.parents || []
      }

      if (editingStudent) {
        await dispatch(updateStudent({ id: editingStudent._id, studentData: data })).unwrap()
        toast.success('Student updated successfully!')
      } else {
        await dispatch(createStudent(data)).unwrap()
        toast.success('Student created successfully!')
      }
      setShowModal(false)
      resetForm()
      dispatch(fetchStudents())
    } catch (error) {
      toast.error(error || 'Failed to save student')
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name || '',
      grade: student.grade || '',
      address: student.address || '',
      latitude: student.latitude || '',
      longitude: student.longitude || '',
      route: student.route?._id || student.route || '',
      parents: student.parents?.map(p => p._id || p) || [],
      status: student.status || 'Active'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return
    
    try {
      await dispatch(deleteStudent(id)).unwrap()
      toast.success('Student deleted successfully!')
      dispatch(fetchStudents())
    } catch (error) {
      toast.error(error || 'Failed to delete student')
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
      status: 'Active'
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
    <ManagerLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Students</h1>
            <p className="text-gray-600 mt-1">Manage students in your school</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No students found. Create your first student!
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.grade || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{student.address || '-'}</td>
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
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="input"
                    />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                    <select
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      className="input"
                    >
                      <option value="">Select Route</option>
                      {routes.map((route) => (
                        <option key={route._id} value={route._id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
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
                    <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                      {parents.length === 0 ? (
                        <p className="text-sm text-gray-500">No parents available</p>
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
    </ManagerLayout>
  )
}

export default Students

