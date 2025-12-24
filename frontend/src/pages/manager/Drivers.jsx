import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import { fetchDrivers, createDriver, updateDriver, deleteDriver } from '../../store/slices/managerDriversSlice'

const Drivers = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { drivers, loading } = useSelector((state) => state.managerDrivers)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    vehicleNumber: '',
    photo: ''
  })

  useEffect(() => {
    dispatch(fetchDrivers())
  }, [dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData }
      if (editingDriver && !data.password) {
        delete data.password
      }

      if (!data.vehicleNumber || data.vehicleNumber.trim() === '') {
        toast.error('Vehicle number is required')
        return
      }

      if (editingDriver) {
        await dispatch(updateDriver({ id: editingDriver._id, driverData: data })).unwrap()
        toast.success('Driver updated successfully!')
      } else {
        await dispatch(createDriver(data)).unwrap()
        toast.success('Driver created successfully!')
      }
      setShowModal(false)
      resetForm()
      dispatch(fetchDrivers())
    } catch (error) {
      toast.error(error || 'Failed to save driver')
    }
  }

  const handleEdit = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name || '',
      email: driver.email || '',
      password: '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      vehicleNumber: driver.vehicleNumber || '',
      photo: driver.photo || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return
    
    try {
      await dispatch(deleteDriver(id)).unwrap()
      toast.success('Driver deleted successfully!')
      dispatch(fetchDrivers())
    } catch (error) {
      toast.error(error || 'Failed to delete driver')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      licenseNumber: '',
      vehicleNumber: '',
      photo: ''
    })
    setEditingDriver(null)
  }

  const filteredDrivers = drivers.filter((driver) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      driver.name?.toLowerCase().includes(searchLower) ||
      driver.email?.toLowerCase().includes(searchLower) ||
      driver.phone?.toLowerCase().includes(searchLower) ||
      driver.vehicleNumber?.toLowerCase().includes(searchLower) ||
      driver.licenseNumber?.toLowerCase().includes(searchLower)
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
                  Drivers
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Manage bus drivers and their information
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search drivers..."
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
                  <span>Add Driver</span>
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
              <p className="text-gray-600 font-medium">Loading drivers...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
            {drivers.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No drivers yet</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first driver</p>
                <button
                  onClick={() => {
                    resetForm()
                    setShowModal(true)
                  }}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Add First Driver
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Photo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID Number</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Speed</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDrivers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          {searchTerm ? 'No drivers match your search.' : 'No drivers found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredDrivers.map((driver, index) => (
                      <tr 
                        key={driver._id} 
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-200 animate-slide-up"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.photo ? (
                            <img 
                              src={driver.photo.startsWith('http') ? driver.photo : `http://localhost:5000${driver.photo}`} 
                              alt={driver.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23999'%3E${driver.name?.charAt(0)?.toUpperCase() || 'D'}%3C/text%3E%3C/svg%3E`
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{driver.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{driver.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.phone ? (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                              {driver.phone}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.licenseNumber ? (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium font-mono">
                              {driver.licenseNumber}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.vehicleNumber ? (
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium font-mono">
                              {driver.vehicleNumber}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.speed !== undefined && driver.speed !== null ? (
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium font-mono ${
                              driver.speed > 60 ? 'bg-red-50 text-red-700' : 
                              driver.speed > 30 ? 'bg-yellow-50 text-yellow-700' : 
                              'bg-green-50 text-green-700'
                            }`}>
                              {driver.speed.toFixed(1)} km/h
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {driver.latitude && driver.longitude && (
                              <>
                                <button
                                  onClick={() => navigate(`/manager/map?driver=${driver._id}`)}
                                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center space-x-1"
                                  title="View on Map"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                  </svg>
                                  <span>Map</span>
                                </button>
                                {driver.currentRoute && (
                                  <button
                                    onClick={() => navigate(`/manager/routes?route=${driver.currentRoute._id || driver.currentRoute}`)}
                                    className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center space-x-1"
                                    title="View Route"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <span>Route</span>
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(driver)}
                              className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(driver._id)}
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
                      ))
                    )}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</span>
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
                      placeholder="Enter driver name"
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
                      Password {!editingDriver && '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingDriver}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder={editingDriver ? 'Leave empty to keep current' : 'Enter password'}
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ID Number</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-mono"
                      placeholder="Enter ID number"
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
                          // Check file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image size must be less than 5MB. Please compress the image.')
                            return
                          }
                          
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            // Compress image if it's too large
                            const img = new Image()
                            img.onload = () => {
                              const canvas = document.createElement('canvas')
                              let width = img.width
                              let height = img.height
                              
                              // Resize if image is larger than 800px
                              const maxDimension = 800
                              if (width > maxDimension || height > maxDimension) {
                                if (width > height) {
                                  height = (height / width) * maxDimension
                                  width = maxDimension
                                } else {
                                  width = (width / height) * maxDimension
                                  height = maxDimension
                                }
                              }
                              
                              canvas.width = width
                              canvas.height = height
                              const ctx = canvas.getContext('2d')
                              ctx.drawImage(img, 0, 0, width, height)
                              
                              // Convert to base64 with compression (0.8 quality)
                              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
                              setFormData({ ...formData, photo: compressedDataUrl })
                            }
                            img.src = reader.result
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-mono"
                      placeholder="Enter vehicle number"
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
                    {editingDriver ? 'Update Driver' : 'Create Driver'}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </ManagerLayout>
  )
}

export default Drivers

