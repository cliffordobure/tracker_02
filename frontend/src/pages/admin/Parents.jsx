import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import api from '../../services/api'
import { fetchSchools } from '../../store/slices/schoolsSlice'
import { BACKEND_URL } from '../../config/api'

const Parents = () => {
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const { schools } = useSelector((state) => state.schools)
  const dispatch = useDispatch()
  const [showModal, setShowModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [selectedParentStudents, setSelectedParentStudents] = useState([])
  const [selectedParentName, setSelectedParentName] = useState('')
  const [editingParent, setEditingParent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    sid: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchParents()
    dispatch(fetchSchools())
  }, [dispatch])

  const fetchParents = async () => {
    try {
      const response = await api.get('/admin/parents')
      setParents(response.data)
    } catch (error) {
      console.error('Failed to fetch parents:', error)
      toast.error('Failed to fetch parents')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData }
      if (!editingParent && !data.password) {
        toast.error('Password is required for new parents')
        return
      }
      if (editingParent && !data.password) {
        delete data.password
      }

      if (editingParent) {
        await api.put(`/admin/parents/${editingParent._id}`, data)
        toast.success('Parent updated successfully!')
      } else {
        await api.post('/admin/parents', data)
        toast.success('Parent created successfully!')
      }
      setShowModal(false)
      resetForm()
      fetchParents()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save parent')
    }
  }

  const handleEdit = (parent) => {
    setEditingParent(parent)
    setFormData({
      name: parent.name || '',
      email: parent.email || '',
      password: '',
      phone: parent.phone || '',
      sid: parent.sid?._id || parent.sid || '',
      status: parent.status || 'Active'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parent? This action cannot be undone.')) return
    
    try {
      await api.delete(`/admin/parents/${id}`)
      toast.success('Parent deleted successfully!')
      fetchParents()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete parent')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      sid: '',
      status: 'Active'
    })
    setEditingParent(null)
  }

  const handleViewStudents = (parent) => {
    setSelectedParentStudents(parent.students || [])
    setSelectedParentName(parent.name)
    setShowStudentsModal(true)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Active', color: 'bg-green-100 text-green-800' },
      'on_bus': { label: 'On Bus', color: 'bg-blue-100 text-blue-800' },
      'picked_up': { label: 'Picked Up', color: 'bg-yellow-100 text-yellow-800' },
      'dropped': { label: 'Dropped', color: 'bg-gray-100 text-gray-800' },
      'inactive': { label: 'Inactive', color: 'bg-red-100 text-red-800' },
      'Missing': { label: 'Missing', color: 'bg-red-100 text-red-800' },
      'Leave': { label: 'Leave', color: 'bg-yellow-100 text-yellow-800' },
      'Active': { label: 'Active', color: 'bg-green-100 text-green-800' }
    }
    const statusInfo = statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const filteredParents = parents.filter((parent) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      parent.name?.toLowerCase().includes(searchLower) ||
      parent.email?.toLowerCase().includes(searchLower) ||
      parent.phone?.toLowerCase().includes(searchLower) ||
      parent.sid?.name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Parents</h1>
            <p className="text-gray-600 mt-1">Manage all parents in the system</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search parents..."
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
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="btn btn-primary"
            >
              + Add Parent
            </button>
          </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? 'No parents match your search.' : 'No parents found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredParents.map((parent) => (
                      <tr key={parent._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{parent.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parent.sid?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewStudents(parent)}
                            className="text-sm text-gray-900 hover:text-primary-600 hover:underline transition-colors cursor-pointer"
                          >
                            {parent.students?.length || 0} child(ren)
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              parent.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {parent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(parent)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(parent._id)}
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
                {editingParent ? 'Edit Parent' : 'Add New Parent'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {!editingParent && '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingParent}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      placeholder={editingParent ? 'Leave empty to keep current' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                    <select
                      value={formData.sid}
                      onChange={(e) => setFormData({ ...formData, sid: e.target.value })}
                      className="input"
                    >
                      <option value="">Select School (Optional)</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name}
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
                      <option value="Suspended">Suspended</option>
                    </select>
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
                    {editingParent ? 'Update' : 'Create'} Parent
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Students Modal */}
        {showStudentsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Children of {selectedParentName}</span>
                  </h2>
                  <button
                    onClick={() => setShowStudentsModal(false)}
                    className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white/20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {selectedParentStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No children registered</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedParentStudents.map((student) => (
                      <div
                        key={student._id || student.id}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="flex items-center space-x-4 mb-4">
                          {student.photo ? (
                            <img 
                              src={
                                student.photo.startsWith('http') || student.photo.startsWith('data:image') 
                                  ? student.photo 
                                  : `${BACKEND_URL}${student.photo.startsWith('/') ? '' : '/'}${student.photo}`
                              } 
                              alt={student.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary-200"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-md ${student.photo ? 'hidden' : ''}`}
                          >
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.grade || 'No grade assigned'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            {getStatusBadge(student.status)}
                          </div>
                          
                          {student.route && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Route:</span>
                              <span className="text-sm text-gray-900 font-semibold">{student.route.name || student.route}</span>
                            </div>
                          )}
                          
                          {student.address && (
                            <div className="flex items-start justify-between">
                              <span className="text-sm font-medium text-gray-700">Address:</span>
                              <span className="text-sm text-gray-900 text-right max-w-[200px]">{student.address}</span>
                            </div>
                          )}
                          
                          {student.sid && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">School:</span>
                              <span className="text-sm text-gray-900">{student.sid.name || student.sid}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Parents
