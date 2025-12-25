import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import api from '../../services/api'
import { BACKEND_URL } from '../../config/api'

const PendingLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [reviewingId, setReviewingId] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [reviewStatus, setReviewStatus] = useState('approved')
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/manager/leave-requests/pending')
      setLeaveRequests(response.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch pending leave requests:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch pending leave requests')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewClick = (request) => {
    setSelectedRequest(request)
    setReviewStatus('approved')
    setReviewNotes('')
    setShowReviewModal(true)
  }

  const handleReviewSubmit = async () => {
    if (!selectedRequest) return

    setReviewingId(selectedRequest.id)
    try {
      await api.put(`/manager/leave-requests/${selectedRequest.id}/review`, {
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined
      })
      
      toast.success(`Leave request ${reviewStatus} successfully!`)
      setShowReviewModal(false)
      setSelectedRequest(null)
      setReviewNotes('')
      fetchPendingRequests()
    } catch (error) {
      console.error('Failed to review leave request:', error)
      toast.error(error.response?.data?.message || 'Failed to review leave request')
    } finally {
      setReviewingId(null)
    }
  }

  const filteredRequests = leaveRequests.filter((request) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      request.studentName?.toLowerCase().includes(searchLower) ||
      request.studentGrade?.toLowerCase().includes(searchLower) ||
      request.parentName?.toLowerCase().includes(searchLower) ||
      request.parentEmail?.toLowerCase().includes(searchLower) ||
      request.reason?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Pending Leave Requests
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Review and approve or reject leave requests from parents
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search requests..."
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
                  onClick={fetchPendingRequests}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
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
                <p className="text-gray-600 font-medium">Loading pending leave requests...</p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No requests match your search' : 'No pending leave requests'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try a different search term' : 'All leave requests have been reviewed'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request, index) => (
                <div
                  key={request.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 animate-slide-up p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {request.studentName?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{request.studentName}</h3>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                              {request.studentGrade || 'N/A'}
                            </span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                              Pending
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span><strong>Dates:</strong> {formatDate(request.startDate)} - {formatDate(request.endDate)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span><strong>Parent:</strong> {request.parentName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-500">{request.parentEmail}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span><strong>Requested:</strong> {formatDate(request.createdAt)}</span>
                            </div>
                          </div>
                          {request.reason && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Reason:</strong> {request.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                      <button
                        onClick={() => handleReviewClick(request)}
                        disabled={reviewingId === request.id}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 transform hover:scale-105 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Leave Request</h2>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2"><strong>Student:</strong> {selectedRequest.studentName}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Parent:</strong> {selectedRequest.parentName}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Dates:</strong> {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}</p>
                {selectedRequest.reason && (
                  <p className="text-sm text-gray-600"><strong>Reason:</strong> {selectedRequest.reason}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="approved"
                      checked={reviewStatus === 'approved'}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-gray-700 font-medium">Approve</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="rejected"
                      checked={reviewStatus === 'rejected'}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="text-gray-700 font-medium">Reject</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedRequest(null)
                    setReviewNotes('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewingId === selectedRequest.id}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 font-semibold ${
                    reviewStatus === 'approved'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {reviewingId === selectedRequest.id ? 'Processing...' : reviewStatus === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  )
}

export default PendingLeaveRequests

