import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import { fetchDashboardStats } from '../../store/slices/managerSlice'
import { fetchStudents } from '../../store/slices/managerStudentsSlice'
import { fetchParents } from '../../store/slices/managerParentsSlice'
import { fetchDrivers } from '../../store/slices/managerDriversSlice'
import { fetchTeachers } from '../../store/slices/managerTeachersSlice'
import api from '../../services/api'

const Reports = () => {
  const dispatch = useDispatch()
  const { dashboardStats, loading: statsLoading } = useSelector((state) => state.manager)
  const { students } = useSelector((state) => state.managerStudents)
  const { parents } = useSelector((state) => state.managerParents)
  const { drivers } = useSelector((state) => state.managerDrivers)
  const { teachers } = useSelector((state) => state.managerTeachers)
  const [routes, setRoutes] = useState([])
  const [stops, setStops] = useState([])
  const [trips, setTrips] = useState([])
  const [reportType, setReportType] = useState('summary')
  const [loading, setLoading] = useState(true)
  const [tripsLoading, setTripsLoading] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [dispatch])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        dispatch(fetchDashboardStats()),
        dispatch(fetchStudents()),
        dispatch(fetchParents()),
        dispatch(fetchDrivers()),
        dispatch(fetchTeachers()),
        fetchRoutes(),
        fetchStops()
      ])
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrips = async () => {
    setTripsLoading(true)
    try {
      const response = await api.get('/manager/trips', {
        params: {
          limit: 1000 // Get all trips for report
        }
      })
      setTrips(response.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setTripsLoading(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/routes')
      setRoutes(response.data || [])
    } catch (error) {
      console.error('Failed to fetch routes:', error)
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

  const handlePrint = () => {
    window.print()
  }

  const generateReportData = () => {
    switch (reportType) {
      case 'summary':
        if (!dashboardStats) return null
        return {
          title: 'School Summary Report',
          date: new Date().toLocaleDateString(),
          data: [
            { label: 'Total Students', value: dashboardStats.students || 0 },
            { label: 'Total Parents', value: dashboardStats.parents || 0 },
            { label: 'Total Routes', value: dashboardStats.routes || 0 },
            { label: 'Total Drivers', value: dashboardStats.drivers || 0 },
            { label: 'Total Staff', value: teachers?.length || 0 },
            { label: 'Total Bus Stops', value: stops?.length || 0 },
          ]
        }
      case 'students':
        return {
          title: 'Students Report',
          date: new Date().toLocaleDateString(),
          data: students || []
        }
      case 'parents':
        return {
          title: 'Parents Report',
          date: new Date().toLocaleDateString(),
          data: parents || []
        }
      case 'drivers':
        return {
          title: 'Drivers Report',
          date: new Date().toLocaleDateString(),
          data: drivers || []
        }
      case 'staff':
        return {
          title: 'Staff Report',
          date: new Date().toLocaleDateString(),
          data: teachers || []
        }
      case 'routes':
        return {
          title: 'Routes Report',
          date: new Date().toLocaleDateString(),
          data: routes || []
        }
      case 'trips':
        return {
          title: 'Trips Report',
          date: new Date().toLocaleDateString(),
          data: trips || []
        }
      default:
        return null
    }
  }

  // Load trips when trips report is selected
  useEffect(() => {
    if (reportType === 'trips' && trips.length === 0 && !tripsLoading) {
      fetchTrips()
    }
  }, [reportType])

  const reportData = generateReportData()

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
            <p className="text-gray-600 mt-1">Generate and print school reports</p>
          </div>
          {reportData && (
            <button
              onClick={handlePrint}
              className="btn btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Report</span>
            </button>
          )}
        </div>

        {/* Report Type Selection */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="input"
          >
            <option value="summary">School Summary</option>
            <option value="students">Students Report</option>
            <option value="parents">Parents Report</option>
            <option value="drivers">Drivers Report</option>
            <option value="staff">Staff Report</option>
            <option value="routes">Routes Report</option>
            <option value="trips">Trips Report</option>
          </select>
        </div>

        {(loading || statsLoading || (reportType === 'trips' && tripsLoading)) ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        ) : reportData ? (
          <div className="card print:shadow-none">
            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">{reportData.title}</h2>
              <p className="text-gray-600 mt-1">Generated on: {reportData.date}</p>
            </div>

            {/* Screen Header */}
            <div className="print:hidden mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">{reportData.title}</h2>
              <p className="text-gray-600 mt-1">Generated on: {reportData.date}</p>
            </div>

            {/* Report Content */}
            <div className="report-content">
              {reportType === 'summary' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportData.data.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-1">{item.label}</div>
                        <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {reportType === 'students' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </>
                        )}
                        {reportType === 'parents' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Children</th>
                          </>
                        )}
                        {reportType === 'drivers' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                          </>
                        )}
                        {reportType === 'staff' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </>
                        )}
                        {reportType === 'routes' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stops</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                          </>
                        )}
                        {reportType === 'trips' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data && reportData.data.length > 0 ? (
                        reportData.data.map((item, index) => (
                          <tr key={item._id || index} className="hover:bg-gray-50">
                            {reportType === 'students' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.grade || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.route?.name || 'Not assigned'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : item.status === 'Missing'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.status || 'Active'}
                                  </span>
                                </td>
                              </>
                            )}
                            {reportType === 'parents' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.phone || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.students?.length || 0}
                                </td>
                              </>
                            )}
                            {reportType === 'drivers' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.phone || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.vehicleNumber || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.currentRoute?.name || 'Not assigned'}
                                </td>
                              </>
                            )}
                            {reportType === 'staff' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.phone || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.assignedClass || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.status || 'Active'}
                                  </span>
                                </td>
                              </>
                            )}
                            {reportType === 'routes' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.driver?.name || 'Not assigned'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.stops?.length || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.students?.length || 0}
                                </td>
                              </>
                            )}
                            {reportType === 'trips' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div>{new Date(item.startedAt).toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(item.startedAt).toLocaleTimeString()}
                                    {item.endedAt && ` - ${new Date(item.endedAt).toLocaleTimeString()}`}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.journeyType === 'pickup'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {item.journeyType === 'pickup' ? 'Pickup' : 'Drop-off'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="font-medium">{item.driver?.name || 'N/A'}</div>
                                  {item.driver?.vehicleNumber && (
                                    <div className="text-xs text-gray-500">{item.driver.vehicleNumber}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.routeName || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="font-medium">{item.studentsCount || 0} students</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {item.students?.slice(0, 3).map(s => s.name).join(', ')}
                                    {item.students?.length > 3 && ` +${item.students.length - 3} more`}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.duration ? `${item.duration} min` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : item.status === 'in_progress'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.status === 'completed' ? 'Completed' :
                                     item.status === 'in_progress' ? 'In Progress' : 'Cancelled'}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={
                              reportType === 'students' ? 4 :
                              reportType === 'parents' ? 4 :
                              reportType === 'drivers' ? 5 :
                              reportType === 'staff' ? 5 :
                              reportType === 'routes' ? 4 :
                              reportType === 'trips' ? 7 :
                              reportType === 'routes' ? 4 :
                              reportType === 'trips' ? 7 : 4
                            }
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-2">No report data available</p>
            {reportType === 'summary' && !dashboardStats && (
              <p className="text-sm text-gray-400">Dashboard statistics are loading...</p>
            )}
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-content, .report-content * {
            visibility: visible;
          }
          .report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          button, select, .card {
            break-inside: avoid;
          }
        }
      `}</style>
    </ManagerLayout>
  )
}

export default Reports

