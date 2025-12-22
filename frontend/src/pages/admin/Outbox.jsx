import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layouts/AdminLayout'
import api from '../../services/api'

const Outbox = () => {
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
      // Fetch messages where admin is the sender
      const response = await api.get('/admin/messages/outbox', {
        params: { toType: filterType !== 'all' ? filterType : undefined }
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      // If endpoint doesn't exist, try alternative
      try {
        const allMessages = await api.get('/admin/messages')
        // Filter for outbox (messages FROM admin)
        const user = JSON.parse(localStorage.getItem('user'))
        const outboxMessages = (allMessages.data || []).filter(m => 
          m.from === 'admin' || m.fromId === user?._id
        )
        setMessages(outboxMessages)
      } catch (fallbackError) {
        toast.error('Failed to fetch messages')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Outbox</h1>
            <p className="text-gray-600 mt-1">Messages sent to parents and drivers</p>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Messages</option>
            <option value="parent">To Parents</option>
            <option value="driver">To Drivers</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No messages in outbox</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Sent Messages ({messages.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?._id === message._id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{message.toName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 capitalize">{message.to || 'Unknown'}</p>
                      </div>
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
                          To: <span className="font-semibold">{selectedMessage.toName}</span> ({selectedMessage.to})
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

export default Outbox

