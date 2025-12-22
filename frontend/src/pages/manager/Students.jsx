import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import MapPicker from '../../components/MapPicker'
import { fetchStudents, createStudent, updateStudent, deleteStudent } from '../../store/slices/managerStudentsSlice'
import api from '../../services/api'

// Available grades/classes for selection
const AVAILABLE_GRADES = [
  'PP1',
  'PP2',
  'PP3',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12'
]

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
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    address: '',
    latitude: '',
    longitude: '',
    stop: '', // Selected stop ID
    route: '',
    parents: [],
    status: 'Active',
    photo: ''
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
      status: student.status || 'Active',
      photo: student.photo || ''
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
      status: 'Active',
      photo: ''
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

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.grade?.toLowerCase().includes(searchLower) ||
      student.address?.toLowerCase().includes(searchLower) ||
      student.route?.name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Students
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Manage student records and information
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
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
                  <span>Add Student</span>
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
              <p className="text-gray-600 font-medium">Loading students...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No students match your search' : 'No students yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try a different search term' : 'Get started by adding your first student'}
                </p>
                <button
                  onClick={() => {
                    resetForm()
                    setShowModal(true)
                  }}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Add First Student
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Photo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <tr 
                        key={student._id} 
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-200 animate-slide-up"
                      >
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
                          <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                            {student.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={student.address || '-'}>
                            {student.address || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.route?.name ? (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                              {student.route.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                              student.status === 'Active'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : student.status === 'Missing'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(student._id)}
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
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{editingStudent ? 'Edit Student' : 'Add New Student'}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter student name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Photo</label>
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    />
                    {formData.photo && (
                      <div className="mt-2">
                        <img src={formData.photo} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="">Select Grade</option>
                      {AVAILABLE_GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter address"
                    />
                  </div>
                  
                  {/* Location Selection Method */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Location Method</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <label className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        locationMethod === 'stop' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
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
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-semibold text-gray-700 block">Existing Stop</span>
                          <span className="text-xs text-gray-500">Select from stops</span>
                        </div>
                      </label>
                      <label className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        locationMethod === 'map' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="locationMethod"
                          value="map"
                          checked={locationMethod === 'map'}
                          onChange={(e) => setLocationMethod('map')}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-semibold text-gray-700 block">Map Picker</span>
                          <span className="text-xs text-gray-500">Pick from map</span>
                        </div>
                      </label>
                    </div>

                    {/* Option 1: Select from Existing Stops */}
                    {locationMethod === 'stop' && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Stop</label>
                        <select
                          value={formData.stop}
                          onChange={(e) => handleStopSelect(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Route</label>
                    <select
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Missing">Missing</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Parents</label>
                    <div className="border-2 border-gray-200 rounded-xl p-4 max-h-32 overflow-y-auto bg-gray-50">
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
                    {editingStudent ? 'Update Student' : 'Create Student'}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  )
}

export default Students
