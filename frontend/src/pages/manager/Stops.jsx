import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import MapPicker from '../../components/MapPicker'
import api from '../../services/api'

const Stops = () => {
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStop, setEditingStop] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    order: 0
  })

  useEffect(() => {
    fetchStops()
  }, [])

  const fetchStops = async () => {
    try {
      const response = await api.get('/stops')
      setStops(response.data || [])
    } catch (error) {
      console.error('Failed to fetch stops:', error)
    } finally {
      setLoading(false)
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
    
    // Validate that location is selected
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please select a location on the map')
      return
    }

    try {
      const data = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        order: parseInt(formData.order) || 0
      }

      if (editingStop) {
        await api.put(`/stops/${editingStop._id}`, data)
        toast.success('Stop updated successfully!')
      } else {
        await api.post('/stops', data)
        toast.success('Stop created successfully!')
      }
      setShowModal(false)
      resetForm()
      fetchStops()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save stop')
    }
  }

  const handleEdit = (stop) => {
    setEditingStop(stop)
    setFormData({
      name: stop.name || '',
      address: stop.address || '',
      latitude: stop.latitude ? stop.latitude.toString() : '',
      longitude: stop.longitude ? stop.longitude.toString() : '',
      order: stop.order || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stop?')) return
    
    try {
      await api.delete(`/stops/${id}`)
      toast.success('Stop deleted successfully!')
      fetchStops()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete stop')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      order: 0
    })
    setEditingStop(null)
  }

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bus Stops</h1>
            <p className="text-gray-600 mt-1">Manage bus stops for routes</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            + Add Stop
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stops.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No stops found. Create your first stop!
                      </td>
                    </tr>
                  ) : (
                    stops.map((stop) => (
                      <tr key={stop._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{stop.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stop.address || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stop.latitude && stop.longitude
                            ? `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stop.order || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(stop)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(stop._id)}
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
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingStop ? 'Edit Stop' : 'Add New Stop'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stop Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Location on Map *</label>
                    <MapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={handleLocationChange}
                      height="400px"
                    />
                    {/* Hidden inputs for form validation */}
                    <input
                      type="hidden"
                      required
                      value={formData.latitude}
                    />
                    <input
                      type="hidden"
                      required
                      value={formData.longitude}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="input"
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
                    {editingStop ? 'Update' : 'Create'} Stop
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

export default Stops

