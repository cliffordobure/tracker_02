import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AdminLayout from '../../components/layouts/AdminLayout'
import { fetchReports } from '../../store/slices/adminSlice'
import { fetchDashboardStats } from '../../store/slices/adminSlice'

const Reports = () => {
  const dispatch = useDispatch()
  const { reports, dashboardStats, loading } = useSelector((state) => state.admin)
  const [reportType, setReportType] = useState('summary')

  useEffect(() => {
    dispatch(fetchDashboardStats())
    dispatch(fetchReports())
  }, [dispatch])

  const handlePrint = () => {
    window.print()
  }

  const generateReportData = () => {
    switch (reportType) {
      case 'summary':
        if (!dashboardStats) return null
        return {
          title: 'System Summary Report',
          date: new Date().toLocaleDateString(),
          data: [
            { label: 'Total Schools', value: dashboardStats.schools || 0 },
            { label: 'Total Managers', value: dashboardStats.managers || 0 },
            { label: 'Total Routes', value: dashboardStats.routes || 0 },
            { label: 'Total Drivers', value: dashboardStats.drivers || 0 },
            { label: 'Active Drivers', value: dashboardStats.activeDrivers || 0 },
            { label: 'Total Students', value: dashboardStats.students || 0 },
            { label: 'Total Parents', value: dashboardStats.parents || 0 },
          ]
        }
      case 'schools':
        return {
          title: 'Schools Report',
          date: new Date().toLocaleDateString(),
          data: reports?.schools || []
        }
      case 'managers':
        return {
          title: 'Managers Report',
          date: new Date().toLocaleDateString(),
          data: reports?.managers || []
        }
      case 'staff':
        return {
          title: 'Staff Report',
          date: new Date().toLocaleDateString(),
          data: reports?.staff || []
        }
      default:
        return null
    }
  }

  const reportData = generateReportData()

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
            <p className="text-gray-600 mt-1">Generate and print system reports</p>
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
            <option value="summary">System Summary</option>
            <option value="schools">Schools Report</option>
            <option value="managers">Managers Report</option>
            <option value="staff">Staff Report</option>
          </select>
        </div>

        {loading && !dashboardStats && !reports ? (
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
                        {reportType === 'schools' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </>
                        )}
                        {reportType === 'managers' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </>
                        )}
                        {reportType === 'staff' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data && reportData.data.length > 0 ? (
                        reportData.data.map((item, index) => (
                          <tr key={item._id || index} className="hover:bg-gray-50">
                            {reportType === 'schools' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.city || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                              </>
                            )}
                            {reportType === 'managers' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.sid?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                              </>
                            )}
                            {reportType === 'staff' && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.sid?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.role === 'teacher'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {item.role === 'teacher' ? 'Teacher' : 'Staff'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      item.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.status}
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
                              reportType === 'schools' ? 3 : reportType === 'managers' ? 4 : 5
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
            {reportType !== 'summary' && !reports && (
              <p className="text-sm text-gray-400">Report data is loading...</p>
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
    </AdminLayout>
  )
}

export default Reports

