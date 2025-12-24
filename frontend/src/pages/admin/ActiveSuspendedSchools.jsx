import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import { fetchSchools, updateSchool } from '../../store/slices/schoolsSlice'

const ActiveSuspendedSchools = () => {
  const dispatch = useDispatch()
  const { schools, loading } = useSelector((state) => state.schools)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'Active', 'Suspended'
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(fetchSchools())
  }, [dispatch])

  const handleToggleStatus = async (school) => {
    const newStatus = school.status === 'Active' ? 'Suspended' : 'Active'
    const action = newStatus === 'Suspended' ? 'suspend' : 'activate'
    
    if (!window.confirm(`Are you sure you want to ${action} this school?`)) return
    
    try {
      await dispatch(updateSchool({ id: school._id, schoolData: { status: newStatus } })).unwrap()
      toast.success(`School ${action}d successfully!`)
      dispatch(fetchSchools())
    } catch (error) {
      toast.error(error || `Failed to ${action} school`)
    }
  }

  const filteredSchools = schools.filter((school) => {
    // Filter by status
    if (filterStatus !== 'all' && school.status !== filterStatus) {
      return false
    }
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase()
    return (
      school.name?.toLowerCase().includes(searchLower) ||
      school.city?.toLowerCase().includes(searchLower) ||
      school.county?.toLowerCase().includes(searchLower) ||
      school.email?.toLowerCase().includes(searchLower) ||
      school.phone?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Active/Suspended Schools</h1>
            <p className="text-gray-600 mt-1">Manage school activation status</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search schools..."
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
              <option value="all">All Schools</option>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchools.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'No schools match your search or filter criteria.' 
                          : 'No schools found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSchools.map((school) => (
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
                            onClick={() => handleToggleStatus(school)}
                            className={`px-4 py-2 rounded-lg font-medium ${
                              school.status === 'Active'
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {school.status === 'Active' ? 'Suspend' : 'Activate'}
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

export default ActiveSuspendedSchools

