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
      <div className="min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent animate-fade-in">
                  📄 Reports
                </h1>
                <p className="text-gray-600 mt-1 text-sm">Generate and print school reports</p>
              </div>
              {reportData && (
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Report</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {/* Report Type Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg mb-6 p-6 animate-slide-up">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white font-medium"
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading report data...</p>
            </div>
          ) : reportData ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg print:shadow-none animate-slide-up">
              {/* Print Header - Only visible when printing */}
              <div className="hidden print:block mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">{reportData.title}</h2>
                <p className="text-gray-600 mt-1">Generated on: {reportData.date}</p>
              </div>

              {/* Screen Header */}
              <div className="print:hidden mb-6 border-b border-gray-200 pb-4 px-6 pt-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">{reportData.title}</h2>
                <p className="text-gray-600 mt-1 text-sm">Generated on: {reportData.date}</p>
              </div>

              {/* Report Content */}
              <div className="report-content px-6 pb-6">
                {reportType === 'summary' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reportData.data.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-slide-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{item.label}</div>
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-xl">📊</span>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-gray-900">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
                        <tr>
                          {reportType === 'students' && (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Grade</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Route</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                            </>
                          )}
                          {reportType === 'parents' && (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Phone</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Children</th>
                            </>
                          )}
                          {reportType === 'drivers' && (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Phone</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Vehicle</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Route</th>
                            </>
                          )}
                          {reportType === 'staff' && (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Name</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Phone</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Class</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                            </>
                          )}
                          {reportType === 'routes' && (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Route Name</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Driver</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Stops</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Students</th>
                            </>
                          )}
                          {reportType === 'trips' && (
                            <>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Date & Time</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Type</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Driver</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Route</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Students</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Duration</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                            </>
                          )}
                      </tr>
                    </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.data && reportData.data.length > 0 ? (
                          reportData.data.map((item, index) => (
                            <tr 
                              key={item._id || index} 
                              className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-200 animate-slide-up"
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              {reportType === 'students' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {item.grade || '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {item.route?.name || <span className="text-gray-400 italic">Not assigned</span>}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
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
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{item.phone || <span className="text-gray-400">-</span>}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {item.students?.length || 0} {item.students?.length === 1 ? 'child' : 'children'}
                                    </span>
                                  </td>
                                </>
                              )}
                              {reportType === 'drivers' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{item.phone || <span className="text-gray-400">-</span>}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                                      {item.vehicleNumber || <span className="text-gray-400">-</span>}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {item.currentRoute?.name || <span className="text-gray-400 italic">Not assigned</span>}
                                  </td>
                                </>
                              )}
                              {reportType === 'staff' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{item.phone || <span className="text-gray-400">-</span>}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {item.assignedClass || '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
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
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {item.driver?.name || <span className="text-gray-400 italic">Not assigned</span>}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      {item.stops?.length || 0} stops
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {item.students?.length || 0} students
                                    </span>
                                  </td>
                                </>
                              )}
                              {reportType === 'trips' && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">{new Date(item.startedAt).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500 font-mono">
                                      {new Date(item.startedAt).toLocaleTimeString()}
                                      {item.endedAt && ` - ${new Date(item.endedAt).toLocaleTimeString()}`}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                        item.journeyType === 'pickup'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {item.journeyType === 'pickup' ? 'Pickup' : 'Drop-off'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">{item.driver?.name || 'N/A'}</div>
                                    {item.driver?.vehicleNumber && (
                                      <div className="text-xs text-gray-500 font-mono">{item.driver.vehicleNumber}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                    {item.routeName || <span className="text-gray-400">N/A</span>}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-semibold text-gray-900">{item.studentsCount || 0} students</div>
                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                      {item.students?.slice(0, 3).map(s => s.name).join(', ')}
                                      {item.students?.length > 3 && ` +${item.students.length - 3} more`}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {item.duration ? `${item.duration} min` : '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
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
                              className="px-6 py-12 text-center"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                  <span className="text-3xl">📊</span>
                                </div>
                                <p className="text-gray-600 font-medium text-lg mb-1">No data available</p>
                                <p className="text-sm text-gray-500">Try selecting a different report type</p>
                              </div>
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
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg text-center py-12 animate-slide-up">
              <div className="flex flex-col items-center justify-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <span className="text-4xl">📄</span>
                </div>
                <p className="text-gray-600 font-medium text-lg mb-2">No report data available</p>
                {reportType === 'summary' && !dashboardStats && (
                  <p className="text-sm text-gray-500">Dashboard statistics are loading...</p>
                )}
              </div>
            </div>
          )}
        </div>
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

