import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import { fetchSchools } from '../../store/slices/schoolsSlice'
import { fetchManagers, createManager, updateManager, deleteManager } from '../../store/slices/managersSlice'
import api from '../../services/api'

const Managers = () => {
  const dispatch = useDispatch()
  const { managers, loading } = useSelector((state) => state.managers)
  const { schools } = useSelector((state) => state.schools)
  const [showModal, setShowModal] = useState(false)
  const [editingManager, setEditingManager] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    sid: '',
    phone: '',
    isStaff: false,
    permissions: [],
    status: 'Active'
  })

  useEffect(() => {
    dispatch(fetchManagers())
    dispatch(fetchSchools())
  }, [dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData }
      if (!editingManager && !data.password) {
        toast.error('Password is required for new managers')
        return
      }
      if (editingManager && !data.password) {
        delete data.password
      }

      if (editingManager) {
        await dispatch(updateManager({ id: editingManager._id, managerData: data })).unwrap()
        toast.success('Manager updated successfully!')
      } else {
        await dispatch(createManager(data)).unwrap()
        toast.success('Manager created successfully!')
      }
      setShowModal(false)
      resetForm()
      dispatch(fetchManagers())
    } catch (error) {
      toast.error(error || 'Failed to save manager')
    }
  }

  const handleEdit = (manager) => {
    setEditingManager(manager)
    setFormData({
      name: manager.name || '',
      email: manager.email || '',
      password: '',
      sid: manager.sid?._id || manager.sid || '',
      phone: manager.phone || '',
      isStaff: manager.isStaff || false,
      permissions: manager.permissions || [],
      status: manager.status || 'Active'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to suspend this manager?')) return
    
    try {
      await dispatch(deleteManager(id)).unwrap()
      toast.success('Manager suspended successfully!')
      dispatch(fetchManagers())
    } catch (error) {
      toast.error(error || 'Failed to suspend manager')
    }
  }

  const togglePermission = (permission) => {
    const permissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission]
    setFormData({ ...formData, permissions })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      sid: '',
      phone: '',
      isStaff: false,
      permissions: [],
      status: 'Active'
    })
    setEditingManager(null)
  }

  const allPermissions = [
    'dashboard', 'report', 'staff', 'map', 'noticeboard', 
    'school', 'students', 'parents', 'driver', 'route', 
    'stops', 'send', 'receive'
  ]

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Managers</h1>
            <p className="text-gray-600 mt-1">Manage school managers</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            + Add Manager
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {managers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No managers found. Create your first manager!
                      </td>
                    </tr>
                  ) : (
                    managers.map((manager) => (
                      <tr key={manager._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                          {manager.isStaff && (
                            <div className="text-xs text-gray-500">Staff</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{manager.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {manager.sid?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{manager.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              manager.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {manager.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(manager)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(manager._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {manager.status === 'Active' ? 'Suspend' : 'Activate'}
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
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingManager ? 'Edit Manager' : 'Add New Manager'}
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
                      Password {!editingManager && '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingManager}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      placeholder={editingManager ? 'Leave empty to keep current' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                    <select
                      required
                      value={formData.sid}
                      onChange={(e) => setFormData({ ...formData, sid: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
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
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isStaff}
                        onChange={(e) => setFormData({ ...formData, isStaff: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Is Staff Member</span>
                    </label>
                  </div>
                  {formData.isStaff && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Permissions
                      </label>
                      <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg">
                        {allPermissions.map((perm) => (
                          <label key={perm} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700 capitalize">{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
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
                    {editingManager ? 'Update' : 'Create'} Manager
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

export default Managers

