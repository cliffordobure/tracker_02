import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import api from '../../services/api'

const DriverRatings = () => {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [filters, setFilters] = useState({
    driverId: '',
    studentId: '',
    parentId: '',
    minRating: '',
    maxRating: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })
  const [selectedRating, setSelectedRating] = useState(null)

  useEffect(() => {
    fetchDrivers()
    fetchRatings()
  }, [])

  useEffect(() => {
    fetchRatings()
  }, [filters, pagination.currentPage])

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/manager/drivers')
      setDrivers(response.data || [])
    } catch (error) {
      console.error('Failed to fetch drivers:', error)
    }
  }

  const fetchRatings = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      }
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key]
        }
      })

      const response = await api.get('/manager/drivers/ratings', { params })
      
      if (response.data.success) {
        setRatings(response.data.data || [])
        setPagination(response.data.pagination || pagination)
        setSummary(response.data.summary || null)
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch ratings')
    } finally {
      setLoading(false)
    }
  }


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, currentPage: 1 })) // Reset to first page
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (filters.driverId) params.driverId = filters.driverId
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      params.format = 'csv'

      const response = await api.get('/manager/drivers/ratings/export', {
        params,
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `driver-ratings-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Ratings exported successfully!')
    } catch (error) {
      console.error('Failed to export ratings:', error)
      toast.error('Failed to export ratings')
    }
  }

  const clearFilters = () => {
    setFilters({
      driverId: '',
      studentId: '',
      parentId: '',
      minRating: '',
      maxRating: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            } transition-all duration-200`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {rating}
        </span>
      </div>
    )
  }

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent animate-fade-in">
                  ⭐ Driver Ratings
                </h1>
                <p className="text-gray-600 mt-1 text-sm">View and manage driver ratings from parents</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExport}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Total Ratings</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {summary.totalRatings}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Average Rating</div>
                    <div className="text-3xl font-bold text-gray-800 flex items-center space-x-2">
                      <span>{summary.averageRating.toFixed(1)}</span>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-2xl">⭐</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">5 Star Ratings</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {summary.ratingDistribution['5'] || 0}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">1-2 Star Ratings</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {(summary.ratingDistribution['1'] || 0) + (summary.ratingDistribution['2'] || 0)}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg mb-6 p-6 animate-slide-up">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver
                </label>
                <select
                  value={filters.driverId}
                  onChange={(e) => handleFilterChange('driverId', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                >
                  <option value="">All Drivers</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} {driver.vehicleNumber ? `(${driver.vehicleNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Rating
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                >
                  <option value="">Any</option>
                  <option value="1">1+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Rating
                </label>
                <select
                  value={filters.maxRating}
                  onChange={(e) => handleFilterChange('maxRating', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                >
                  <option value="">Any</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                >
                  <option value="createdAt">Date</option>
                  <option value="rating">Rating</option>
                  <option value="driverName">Driver Name</option>
                </select>
              </div>

              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              <div>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ratings Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden animate-slide-up">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading ratings...</p>
              </div>
            ) : ratings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <span className="text-4xl">⭐</span>
                </div>
                <p className="text-gray-600 font-medium text-lg mb-2">No ratings found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters to see more results</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Driver
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Parent
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Comment
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ratings.map((rating, index) => (
                        <tr 
                          key={rating.id} 
                          className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-200 animate-slide-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {rating.driver?.photo ? (
                                <img
                                  src={rating.driver.photo}
                                  alt={rating.driver.name}
                                  className="h-12 w-12 rounded-full object-cover mr-3 ring-2 ring-primary-100"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mr-3 ring-2 ring-primary-100">
                                  <span className="text-white font-semibold text-lg">
                                    {rating.driver?.name?.charAt(0) || 'D'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {rating.driver?.name || 'Unknown'}
                                </div>
                                {rating.driver?.vehicleNumber && (
                                  <div className="text-xs text-gray-500 font-mono">
                                    {rating.driver.vehicleNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {rating.parent?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {rating.parent?.email || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {rating.student?.name || 'Unknown'}
                            </div>
                            {rating.student?.grade && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {rating.student.grade}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStars(rating.rating)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {rating.comment || <span className="text-gray-400 italic">No comment</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {rating.comment && (
                              <button
                                onClick={() => setSelectedRating(rating)}
                                className="text-primary-600 hover:text-primary-800 font-semibold transition-colors duration-200 flex items-center space-x-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: Math.max(1, prev.currentPage - 1),
                          }))
                        }
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: Math.min(
                              prev.totalPages,
                              prev.currentPage + 1
                            ),
                          }))
                        }
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700 font-medium">
                          Showing{' '}
                          <span className="font-semibold text-primary-600">
                            {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-semibold text-primary-600">
                            {Math.min(
                              pagination.currentPage * pagination.itemsPerPage,
                              pagination.totalItems
                            )}
                          </span>{' '}
                          of <span className="font-semibold text-primary-600">{pagination.totalItems}</span> results
                        </p>
                      </div>
                      <div>
                        <nav
                          className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px"
                          aria-label="Pagination"
                        >
                          <button
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                currentPage: Math.max(1, prev.currentPage - 1),
                              }))
                            }
                            disabled={pagination.currentPage === 1}
                            className="relative inline-flex items-center px-3 py-2 rounded-l-lg border-2 border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                          >
                            Previous
                          </button>
                          {[...Array(pagination.totalPages)].map((_, i) => {
                            const page = i + 1
                            if (
                              page === 1 ||
                              page === pagination.totalPages ||
                              (page >= pagination.currentPage - 1 &&
                                page <= pagination.currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() =>
                                    setPagination((prev) => ({ ...prev, currentPage: page }))
                                  }
                                  className={`relative inline-flex items-center px-4 py-2 border-2 text-sm font-semibold transition-all duration-200 ${
                                    page === pagination.currentPage
                                      ? 'z-10 bg-gradient-to-r from-primary-600 to-primary-700 border-primary-600 text-white shadow-md'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            } else if (
                              page === pagination.currentPage - 2 ||
                              page === pagination.currentPage + 2
                            ) {
                              return (
                                <span
                                  key={page}
                                  className="relative inline-flex items-center px-4 py-2 border-2 border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              )
                            }
                            return null
                          })}
                          <button
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                currentPage: Math.min(
                                  prev.totalPages,
                                  prev.currentPage + 1
                                ),
                              }))
                            }
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="relative inline-flex items-center px-3 py-2 rounded-r-lg border-2 border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Comment Modal */}
          {selectedRating && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slide-up">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-2xl">⭐</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">Rating Details</h3>
                    </div>
                    <button
                      onClick={() => setSelectedRating(null)}
                      className="text-white hover:text-gray-200 transition-colors duration-200 p-1 rounded-lg hover:bg-white/20"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Driver</div>
                      <div className="flex items-center space-x-3">
                        {selectedRating.driver?.photo ? (
                          <img
                            src={selectedRating.driver.photo}
                            alt={selectedRating.driver.name}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-100"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-primary-100">
                            <span className="text-white font-semibold">
                              {selectedRating.driver?.name?.charAt(0) || 'D'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{selectedRating.driver?.name || 'Unknown'}</div>
                          {selectedRating.driver?.vehicleNumber && (
                            <div className="text-sm text-gray-500 font-mono">{selectedRating.driver.vehicleNumber}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parent</div>
                      <div className="font-semibold text-gray-900">{selectedRating.parent?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{selectedRating.parent?.email || ''}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Student</div>
                      <div className="font-semibold text-gray-900">{selectedRating.student?.name || 'Unknown'}</div>
                      {selectedRating.student?.grade && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          {selectedRating.student.grade}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(selectedRating.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rating</div>
                    <div className="flex items-center space-x-2">
                      {renderStars(selectedRating.rating)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comment</div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg text-gray-900 border-2 border-gray-200 min-h-[100px]">
                      {selectedRating.comment || <span className="text-gray-400 italic">No comment provided</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}

export default DriverRatings

