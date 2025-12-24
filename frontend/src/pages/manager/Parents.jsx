import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import { fetchParents, createParent } from '../../store/slices/managerParentsSlice'
import api from '../../services/api'
import { BACKEND_URL } from '../../config/api'

const Parents = () => {
  const dispatch = useDispatch()
  const { parents, loading } = useSelector((state) => state.managerParents)
  const [showModal, setShowModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [selectedParentStudents, setSelectedParentStudents] = useState([])
  const [selectedParentName, setSelectedParentName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingParent, setEditingParent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })

  useEffect(() => {
    dispatch(fetchParents())
  }, [dispatch])

  const filteredParents = parents.filter((parent) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      parent.name?.toLowerCase().includes(searchLower) ||
      parent.email?.toLowerCase().includes(searchLower) ||
      parent.phone?.toLowerCase().includes(searchLower)
    )
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingParent) {
        const data = { ...formData }
        if (!data.password) {
          delete data.password
        }
        await api.put(`/manager/parents/${editingParent._id}`, data)
        toast.success('Parent updated successfully!')
      } else {
        await dispatch(createParent(formData)).unwrap()
        toast.success('Parent created successfully!')
      }
      setShowModal(false)
      resetForm()
      dispatch(fetchParents())
    } catch (error) {
      toast.error(error.response?.data?.message || error || 'Failed to save parent')
    }
  }

  const handleEdit = (parent) => {
    setEditingParent(parent)
    setFormData({
      name: parent.name || '',
      email: parent.email || '',
      password: '',
      phone: parent.phone || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parent? This action cannot be undone.')) return
    
    try {
      await api.delete(`/manager/parents/${id}`)
      toast.success('Parent deleted successfully!')
      dispatch(fetchParents())
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete parent')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: ''
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

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Parents
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Manage parent accounts and information
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
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
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Parent</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {loading ? (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading parents...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
            {filteredParents.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No parents match your search' : 'No parents yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try a different search term' : 'Get started by adding your first parent'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      resetForm()
                      setShowModal(true)
                    }}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Add First Parent
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParents.map((parent, index) => (
                      <tr 
                        key={parent._id} 
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-200 animate-slide-up"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {parent.name?.charAt(0)?.toUpperCase() || 'P'}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">{parent.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{parent.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {parent.phone ? (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                              {parent.phone}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewStudents(parent)}
                            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                              {parent.students?.length || 0} {parent.students?.length === 1 ? 'child' : 'children'}
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(parent)}
                              className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(parent._id)}
                              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{editingParent ? 'Edit Parent' : 'Add New Parent'}</span>
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white/20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter parent name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password {!editingParent && '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingParent}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder={editingParent ? 'Leave empty to keep current' : 'Enter password'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {editingParent ? 'Update Parent' : 'Create Parent'}
                  </button>
                </div>
              </form>
              </div>
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
      </div>
    </ManagerLayout>
  )
}

export default Parents
