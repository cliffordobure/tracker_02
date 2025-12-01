import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import api from '../../services/api'

const RoutesPage = () => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [students, setStudents] = useState([])
  const [stops, setStops] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    driver: '',
    stops: [],
    students: []
  })

  useEffect(() => {
    fetchRoutesList()
    fetchDrivers()
    fetchStudents()
    fetchStops()
  }, [])

  const fetchRoutesList = async () => {
    try {
      setLoading(true)
      const response = await api.get('/routes')
      setRoutes(response.data || [])
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/manager/drivers')
      setDrivers(response.data)
    } catch (error) {
      console.error('Failed to fetch drivers:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students')
      setStudents(response.data || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchStops = async () => {
    try {
      const response = await api.get('/stops')
      setStops(response.data || [])
    } catch (error) {
      console.error('Failed to fetch stops:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRoute) {
        await api.put(`/routes/${editingRoute._id}`, formData)
        toast.success('Route updated successfully!')
      } else {
        await api.post('/routes', formData)
        toast.success('Route created successfully!')
      }
      setShowModal(false)
      resetForm()
      fetchRoutesList()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save route')
    }
  }

  const handleEdit = (route) => {
    setEditingRoute(route)
    setFormData({
      name: route.name || '',
      driver: route.driver?._id || route.driver || '',
      stops: route.stops?.map(s => s._id || s) || [],
      students: route.students?.map(s => s._id || s) || []
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return
    
    try {
      await api.delete(`/routes/${id}`)
      toast.success('Route deleted successfully!')
      fetchRoutesList()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete route')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      driver: '',
      stops: [],
      students: []
    })
    setEditingRoute(null)
  }

  const toggleStop = (stopId) => {
    const stops = formData.stops.includes(stopId)
      ? formData.stops.filter(s => s !== stopId)
      : [...formData.stops, stopId]
    setFormData({ ...formData, stops })
  }

  const toggleStudent = (studentId) => {
    const students = formData.students.includes(studentId)
      ? formData.students.filter(s => s !== studentId)
      : [...formData.students, studentId]
    setFormData({ ...formData, students })
  }

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Routes</h1>
            <p className="text-gray-600 mt-1">Manage bus routes</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            + Add Route
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stops</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No routes found. Create your first route!
                      </td>
                    </tr>
                  ) : (
                    routes.map((route) => (
                      <tr key={route._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{route.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {route.driver?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {route.stops?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {route.students?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(route)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(route._id)}
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
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                    <select
                      value={formData.driver}
                      onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                      className="input"
                    >
                      <option value="">Select Driver</option>
                      {drivers.map((driver) => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bus Stops</label>
                    <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                      {stops.length === 0 ? (
                        <p className="text-sm text-gray-500">No stops available. Create stops first!</p>
                      ) : (
                        stops.map((stop) => (
                          <label key={stop._id} className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={formData.stops.includes(stop._id)}
                              onChange={() => toggleStop(stop._id)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">{stop.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Students</label>
                    <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                      {students.length === 0 ? (
                        <p className="text-sm text-gray-500">No students available</p>
                      ) : (
                        students.map((student) => (
                          <label key={student._id} className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={formData.students.includes(student._id)}
                              onChange={() => toggleStudent(student._id)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">{student.name}</span>
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
                    {editingRoute ? 'Update' : 'Create'} Route
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

export default RoutesPage

