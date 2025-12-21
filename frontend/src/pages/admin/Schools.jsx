import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import MapPicker from '../../components/MapPicker'
import { fetchSchools, createSchool, updateSchool, deleteSchool } from '../../store/slices/schoolsSlice'
import api from '../../services/api'

const Schools = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { schools, loading } = useSelector((state) => state.schools)
  const [showModal, setShowModal] = useState(false)
  const [editingSchool, setEditingSchool] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    county: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    status: 'Active'
  })

  useEffect(() => {
    dispatch(fetchSchools())
  }, [dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.phone || formData.phone.trim() === '') {
      toast.error('Phone number is required')
      return
    }
    
    // Validate location is selected (optional validation - remove if location is not required)
    // if (!formData.latitude || !formData.longitude) {
    //   toast.error('Please select a location on the map')
    //   return
    // }
    
    try {
      const data = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      }

      if (editingSchool) {
        await dispatch(updateSchool({ id: editingSchool._id, schoolData: data })).unwrap()
        toast.success('School updated successfully!')
      } else {
        await dispatch(createSchool(data)).unwrap()
        toast.success('School created successfully!')
      }
      setShowModal(false)
      resetForm()
      dispatch(fetchSchools())
    } catch (error) {
      toast.error(error || 'Failed to save school')
    }
  }

  const handleLocationChange = (lat, lng) => {
    setFormData({
      ...formData,
      latitude: lat.toString(),
      longitude: lng.toString()
    })
  }

  const handleEdit = (school) => {
    setEditingSchool(school)
    setFormData({
      name: school.name || '',
      address: school.address || '',
      city: school.city || '',
      county: school.county || '',
      phone: school.phone || '',
      email: school.email || '',
      latitude: school.latitude ? school.latitude.toString() : '',
      longitude: school.longitude ? school.longitude.toString() : '',
      status: school.status || 'Active'
    })
    setShowModal(true)
  }

  const handleSuspend = async (id) => {
    if (!window.confirm('Are you sure you want to suspend this school?')) return
    
    try {
      await dispatch(updateSchool({ id, schoolData: { status: 'Suspended' } })).unwrap()
      toast.success('School suspended successfully!')
      dispatch(fetchSchools())
    } catch (error) {
      toast.error(error || 'Failed to suspend school')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) return
    
    try {
      await dispatch(deleteSchool(id)).unwrap()
      toast.success('School deleted successfully!')
      dispatch(fetchSchools())
    } catch (error) {
      toast.error(error || 'Failed to delete school')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      county: '',
      phone: '',
      email: '',
      latitude: '',
      longitude: '',
      status: 'Active'
    })
    setEditingSchool(null)
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Schools</h1>
            <p className="text-gray-600 mt-1">Manage all schools in the system</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            + Add School
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City/County
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No schools found. Create your first school!
                      </td>
                    </tr>
                  ) : (
                    schools.map((school) => (
                      <tr key={school._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{school.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{school.city || '-'}</div>
                          <div className="text-sm text-gray-500">{school.county || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{school.phone || '-'}</div>
                          <div className="text-sm text-gray-500">{school.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              school.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {school.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(school)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSuspend(school._id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            {school.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(school._id)}
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
                {editingSchool ? 'Edit School' : 'Add New School'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      County
                    </label>
                    <input
                      type="text"
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">School Location (Select on Map)</label>
                    <MapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={handleLocationChange}
                      height="400px"
                    />
                    {/* Hidden inputs for form validation */}
                    <input
                      type="hidden"
                      value={formData.latitude}
                    />
                    <input
                      type="hidden"
                      value={formData.longitude}
                    />
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
                    {editingSchool ? 'Update' : 'Create'} School
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

export default Schools

