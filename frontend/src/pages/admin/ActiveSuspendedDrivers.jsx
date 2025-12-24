import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import api from '../../services/api'

const ActiveSuspendedDrivers = () => {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'Active', 'Suspended'
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/admin/drivers')
      setDrivers(response.data)
    } catch (error) {
      console.error('Failed to fetch drivers:', error)
      toast.error('Failed to fetch drivers')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (driver) => {
    const newStatus = driver.status === 'Active' ? 'Suspended' : 'Active'
    const action = newStatus === 'Suspended' ? 'suspend' : 'activate'
    
    if (!window.confirm(`Are you sure you want to ${action} this driver?`)) return
    
    try {
      await api.put(`/admin/drivers/${driver._id}/status`, { status: newStatus })
      toast.success(`Driver ${action}d successfully!`)
      fetchDrivers()
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} driver`)
    }
  }

  const filteredDrivers = drivers.filter((driver) => {
    // Filter by status
    if (filterStatus !== 'all' && driver.status !== filterStatus) {
      return false
    }
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase()
    return (
      driver.name?.toLowerCase().includes(searchLower) ||
      driver.email?.toLowerCase().includes(searchLower) ||
      driver.phone?.toLowerCase().includes(searchLower) ||
      driver.vehicleNumber?.toLowerCase().includes(searchLower) ||
      driver.sid?.name?.toLowerCase().includes(searchLower) ||
      driver.currentRoute?.name?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Active/Suspended Drivers</h1>
            <p className="text-gray-600 mt-1">Manage driver activation status</p>
          </div>
          <div className="flex items-center space-x-4">
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Drivers</option>
              <option value="Active">Active Only</option>
              <option value="Suspended">Suspended Only</option>
            </select>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'No drivers match your search or filter criteria.' 
                          : 'No drivers found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <tr key={driver._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.photo ? (
                            <img 
                              src={driver.photo.startsWith('http') ? driver.photo : `http://localhost:5000${driver.photo}`} 
                              alt={driver.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${driver.photo ? 'hidden' : ''}`}
                          >
                            {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.sid?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.phone || '-'}</div>
                          <div className="text-sm text-gray-500">{driver.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.vehicleNumber || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.currentRoute?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              driver.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {driver.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleToggleStatus(driver)}
                            className={`px-4 py-2 rounded-lg font-medium ${
                              driver.status === 'Active'
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {driver.status === 'Active' ? 'Suspend' : 'Activate'}
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
      </div>
    </AdminLayout>
  )
}

export default ActiveSuspendedDrivers

