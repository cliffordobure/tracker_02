import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchJourneyHistory } from '../../store/slices/driverSlice'
import DriverLayout from '../../components/layouts/DriverLayout'

const History = () => {
  const dispatch = useDispatch()
  const { journeyHistory, historyLoading } = useSelector((state) => state.driver)
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    dispatch(fetchJourneyHistory({ page, limit: 20, startDate, endDate }))
  }, [dispatch, page, startDate, endDate])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startedAt, endedAt) => {
    if (!startedAt || !endedAt) return 'N/A'
    const start = new Date(startedAt)
    const end = new Date(endedAt)
    const diffMs = end - start
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    if (diffHours > 0) {
      return `${diffHours}h ${mins}m`
    }
    return `${mins}m`
  }

  const handleFilter = () => {
    setPage(1)
    dispatch(fetchJourneyHistory({ page: 1, limit: 20, startDate, endDate }))
  }

  const clearFilter = () => {
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  return (
    <DriverLayout>
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Journey History</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">View your past journeys and trips</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Filter Journeys</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
              >
                Apply Filter
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilter}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Journey History List */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Past Journeys</h2>
          {historyLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="text-gray-500 mt-4 text-sm">Loading journey history...</p>
            </div>
          ) : journeyHistory.length > 0 ? (
            <div className="space-y-4">
              {journeyHistory.map((journey) => (
                <div
                  key={journey.id}
                  className="border border-gray-200 rounded-lg p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">
                          {journey.journeyType === 'pickup' ? '🚌' : '🏠'}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {journey.route?.name || 'Unknown Route'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {journey.journeyType === 'pickup' ? 'Pickup Journey' : 'Drop-off Journey'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Started</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(journey.startedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Ended</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(journey.endedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDuration(journey.startedAt, journey.endedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Students</p>
                          <p className="text-sm font-medium text-gray-900">
                            {journey.students?.length || 0} students
                          </p>
                        </div>
                      </div>
                      {journey.students && journey.students.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Students:</p>
                          <div className="flex flex-wrap gap-2">
                            {journey.students.slice(0, 5).map((student, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                              >
                                {student.studentId?.name || `Student ${idx + 1}`}
                              </span>
                            ))}
                            {journey.students.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                +{journey.students.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📜</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Journey History</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Your completed journeys will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  )
}

export default History



