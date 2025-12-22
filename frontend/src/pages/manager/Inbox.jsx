import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import api from '../../services/api'

const Inbox = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [filterType, setFilterType] = useState('all') // all, parent, driver

  useEffect(() => {
    fetchMessages()
  }, [filterType])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get('/manager/messages/inbox', {
        params: { fromType: filterType !== 'all' ? filterType : undefined }
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.put(`/manager/messages/${messageId}/read`)
      fetchMessages()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleReply = async (messageId, replyText) => {
    try {
      await api.post(`/manager/messages/${messageId}/reply`, { message: replyText })
      toast.success('Reply sent successfully!')
      setSelectedMessage(null)
      fetchMessages()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply')
    }
  }

  return (
    <ManagerLayout>
      <div className="min-h-screen">
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Inbox
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Messages received from parents and drivers
                </p>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Messages</option>
                <option value="parent">From Parents</option>
                <option value="driver">From Drivers</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No messages in inbox</h3>
              <p className="text-gray-600">You haven't received any messages yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Messages List */}
              <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="font-semibold text-gray-800">Messages ({messages.length})</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      onClick={() => {
                        setSelectedMessage(message)
                        if (!message.isRead) handleMarkAsRead(message._id)
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !message.isRead ? 'bg-blue-50' : ''
                      } ${selectedMessage?._id === message._id ? 'bg-primary-50 border-l-4 border-primary-600' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{message.fromName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 capitalize">{message.from || 'Unknown'}</p>
                        </div>
                        {!message.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium mb-1">{message.subject || 'No Subject'}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{message.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Detail */}
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
                {selectedMessage ? (
                  <div className="p-6">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject || 'No Subject'}</h2>
                          <p className="text-sm text-gray-600 mt-1">
                            From: <span className="font-semibold">{selectedMessage.fromName}</span> ({selectedMessage.from})
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(selectedMessage.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                    {selectedMessage.studentId && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Related to student:</span> {selectedMessage.studentId?.name || selectedMessage.studentId}
                        </p>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Reply</h3>
                      <textarea
                        id="replyText"
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                        placeholder="Type your reply..."
                      />
                      <button
                        onClick={() => {
                          const replyText = document.getElementById('replyText').value
                          if (replyText.trim()) {
                            handleReply(selectedMessage._id, replyText)
                          } else {
                            toast.error('Please enter a reply message')
                          }
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors font-semibold"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>Select a message to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}

export default Inbox

