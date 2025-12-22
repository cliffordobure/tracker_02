import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import { fetchSchools, updateSchool } from '../../store/slices/schoolsSlice'

const ActiveSuspendedSchools = () => {
  const dispatch = useDispatch()
  const { schools, loading } = useSelector((state) => state.schools)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'Active', 'Suspended'

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

  const filteredSchools = filterStatus === 'all' 
    ? schools 
    : schools.filter(school => school.status === filterStatus)

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Active/Suspended Schools</h1>
            <p className="text-gray-600 mt-1">Manage school activation status</p>
          </div>
          <div className="flex items-center space-x-4">
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
                        No schools found.
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

