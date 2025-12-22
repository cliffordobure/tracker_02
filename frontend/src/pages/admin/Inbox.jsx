import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
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
      // Fetch messages where admin is the recipient
      const response = await api.get('/admin/messages/inbox', {
        params: { fromType: filterType !== 'all' ? filterType : undefined }
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      // If endpoint doesn't exist, try alternative
      try {
        const allMessages = await api.get('/admin/messages')
        // Filter for inbox (messages TO admin)
        const inboxMessages = (allMessages.data || []).filter(m => 
          m.to === 'admin' || m.toId === JSON.parse(localStorage.getItem('user'))?._id
        )
        setMessages(inboxMessages)
      } catch (fallbackError) {
        toast.error('Failed to fetch messages')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.put(`/admin/messages/${messageId}/read`)
      fetchMessages()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleReply = async (messageId, replyText) => {
    try {
      await api.post(`/admin/messages/${messageId}/reply`, { message: replyText })
      toast.success('Reply sent successfully!')
      setSelectedMessage(null)
      fetchMessages()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply')
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Inbox</h1>
            <p className="text-gray-600 mt-1">Messages received from parents and drivers</p>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Messages</option>
            <option value="parent">From Parents</option>
            <option value="driver">From Drivers</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No messages in inbox</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
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
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
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
                        <span className="font-semibold">Related to student:</span> {selectedMessage.studentId}
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
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <p>Select a message to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Inbox

