import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import MapPicker from '../../components/MapPicker'
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
  const [stops, setStops] = useState([])
  const [locationMethod, setLocationMethod] = useState('stop') // 'stop' or 'map'
  const [createNewStop, setCreateNewStop] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    address: '',
    latitude: '',
    longitude: '',
    stop: '', // Selected stop ID
    route: '',
    parents: [],
    status: 'Active'
  })

  useEffect(() => {
    dispatch(fetchStudents())
    fetchRoutes()
    fetchParents()
    fetchStops()
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

  const fetchStops = async () => {
    try {
      const response = await api.get('/stops')
      setStops(response.data || [])
    } catch (error) {
      console.error('Failed to fetch stops:', error)
    }
  }

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
      stop: '' // Clear stop selection when using map
    }))
  }

  const handleStopSelect = (stopId) => {
    const selectedStop = stops.find(s => s._id === stopId)
    if (selectedStop) {
      setFormData({
        ...formData,
        stop: stopId,
        latitude: selectedStop.latitude ? selectedStop.latitude.toString() : '',
        longitude: selectedStop.longitude ? selectedStop.longitude.toString() : '',
        address: selectedStop.address || formData.address
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      let stopId = null
      let finalLatitude = formData.latitude
      let finalLongitude = formData.longitude
      let finalAddress = formData.address

      // If location method is map and createNewStop is checked, create a new stop
      if (locationMethod === 'map' && createNewStop && formData.latitude && formData.longitude) {
        try {
          // Create a new stop from the map location
          const stopName = formData.name ? `${formData.name}'s Stop` : `Stop at ${formData.address || 'Location'}`
          const stopResponse = await api.post('/stops', {
            name: stopName,
            address: formData.address || '',
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            order: stops.length + 1
          })
          stopId = stopResponse.data.stop._id
          toast.success('New stop created automatically!')
        } catch (error) {
          console.error('Failed to create stop:', error)
          toast.error('Failed to create stop, but continuing with student creation...')
        }
      } else if (locationMethod === 'stop' && formData.stop) {
        // If using existing stop, get its location
        const selectedStop = stops.find(s => s._id === formData.stop)
        if (selectedStop) {
          finalLatitude = selectedStop.latitude
          finalLongitude = selectedStop.longitude
          finalAddress = selectedStop.address || formData.address
          stopId = formData.stop
        }
      }

      const data = {
        name: formData.name,
        grade: formData.grade,
        address: finalAddress,
        latitude: finalLatitude ? parseFloat(finalLatitude) : undefined,
        longitude: finalLongitude ? parseFloat(finalLongitude) : undefined,
        route: formData.route || undefined,
        parents: formData.parents || [],
        status: formData.status
      }

      if (editingStudent) {
        await dispatch(updateStudent({ id: editingStudent._id, studentData: data })).unwrap()
        toast.success('Student updated successfully!')
      } else {
        await dispatch(createStudent(data)).unwrap()
        toast.success('Student created successfully!')
        // Refresh stops if a new one was created
        if (stopId && createNewStop) {
          fetchStops()
        }
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
    
    // Try to find matching stop for this student
    const matchingStop = stops.find(s => 
      s.latitude === student.latitude && s.longitude === student.longitude
    )
    
    setFormData({
      name: student.name || '',
      grade: student.grade || '',
      address: student.address || '',
      latitude: student.latitude ? student.latitude.toString() : '',
      longitude: student.longitude ? student.longitude.toString() : '',
      stop: matchingStop?._id || '',
      route: student.route?._id || student.route || '',
      parents: student.parents?.map(p => p._id || p) || [],
      status: student.status || 'Active'
    })
    
    // Set location method based on whether we found a matching stop
    setLocationMethod(matchingStop ? 'stop' : 'map')
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
      stop: '',
      route: '',
      parents: [],
      status: 'Active'
    })
    setLocationMethod('stop')
    setCreateNewStop(false)
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
                  
                  {/* Location Selection Method */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Location Method</label>
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="locationMethod"
                          value="stop"
                          checked={locationMethod === 'stop'}
                          onChange={(e) => {
                            setLocationMethod('stop')
                            setCreateNewStop(false)
                            if (formData.stop) {
                              handleStopSelect(formData.stop)
                            }
                          }}
                          className="form-radio"
                        />
                        <span className="text-sm text-gray-700">Select from Existing Stops</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="locationMethod"
                          value="map"
                          checked={locationMethod === 'map'}
                          onChange={(e) => setLocationMethod('map')}
                          className="form-radio"
                        />
                        <span className="text-sm text-gray-700">Pick from Map</span>
                      </label>
                    </div>

                    {/* Option 1: Select from Existing Stops */}
                    {locationMethod === 'stop' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Stop</label>
                        <select
                          value={formData.stop}
                          onChange={(e) => handleStopSelect(e.target.value)}
                          className="input"
                        >
                          <option value="">Select a Stop</option>
                          {stops.map((stop) => (
                            <option key={stop._id} value={stop._id}>
                              {stop.name} {stop.address ? `(${stop.address})` : ''}
                            </option>
                          ))}
                        </select>
                        {stops.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            No stops available. Create stops first or use "Pick from Map" option.
                          </p>
                        )}
                        {formData.stop && (
                          <p className="text-xs text-gray-600 mt-2">
                            Location will be set from selected stop: {formData.latitude ? `${parseFloat(formData.latitude).toFixed(6)}, ${parseFloat(formData.longitude).toFixed(6)}` : 'Loading...'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Option 2: Pick from Map */}
                    {locationMethod === 'map' && (
                      <div className="mb-4">
                        <MapPicker
                          latitude={formData.latitude}
                          longitude={formData.longitude}
                          onLocationChange={handleLocationChange}
                          height="400px"
                        />
                        <label className="flex items-center space-x-2 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createNewStop}
                            onChange={(e) => setCreateNewStop(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Automatically create a new stop at this location
                          </span>
                        </label>
                        {createNewStop && (
                          <p className="text-xs text-gray-500 mt-1">
                            A new stop will be created with the name "{formData.name ? `${formData.name}'s Stop` : 'New Stop'}" at this location.
                          </p>
                        )}
                      </div>
                    )}
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
