import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ManagerLayout from '../../components/layouts/ManagerLayout'
import api from '../../services/api'

const Outbox = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [filterType, setFilterType] = useState('all') // all, parent, driver
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [parents, setParents] = useState([])
  const [drivers, setDrivers] = useState([])
  const [students, setStudents] = useState([])
  const [composeData, setComposeData] = useState({
    toType: 'parent',
    toId: '',
    studentId: '',
    subject: '',
    message: ''
  })

  useEffect(() => {
    fetchMessages()
    if (showComposeModal) {
      fetchParents()
      fetchDrivers()
      fetchStudents()
    }
  }, [filterType, showComposeModal])

  const fetchParents = async () => {
    try {
      const response = await api.get('/manager/parents')
      setParents(response.data || [])
    } catch (error) {
      console.error('Failed to fetch parents:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/manager/drivers')
      setDrivers(response.data || [])
    } catch (error) {
      console.error('Failed to fetch drivers:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/manager/students')
      setStudents(response.data || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!composeData.toId || !composeData.message.trim()) {
      toast.error('Please select a recipient and enter a message')
      return
    }

    try {
      await api.post('/manager/messages', composeData)
      toast.success('Message sent successfully!')
      setShowComposeModal(false)
      setComposeData({
        toType: 'parent',
        toId: '',
        studentId: '',
        subject: '',
        message: ''
      })
      fetchMessages()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message')
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get('/manager/messages/outbox', {
        params: { toType: filterType !== 'all' ? filterType : undefined }
      })
      setMessages(response.data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to fetch messages')
    } finally {
      setLoading(false)
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
                  Outbox
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Messages sent to parents and drivers
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Messages</option>
                  <option value="parent">To Parents</option>
                  <option value="driver">To Drivers</option>
                </select>
                <button
                  onClick={() => setShowComposeModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Compose
                </button>
              </div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No messages in outbox</h3>
              <p className="text-gray-600">You haven't sent any messages yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Messages List */}
              <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
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
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
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
                          <span className="font-semibold">Related to student:</span> {selectedMessage.studentId?.name || selectedMessage.studentId}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <p>Select a message to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Compose Message</h2>
                <button
                  onClick={() => {
                    setShowComposeModal(false)
                    setComposeData({
                      toType: 'parent',
                      toId: '',
                      studentId: '',
                      subject: '',
                      message: ''
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                <select
                  value={composeData.toType}
                  onChange={(e) => {
                    setComposeData({ ...composeData, toType: e.target.value, toId: '', studentId: '' })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="parent">Parent</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {composeData.toType === 'parent' ? 'Parent' : 'Driver'}
                </label>
                <select
                  value={composeData.toId}
                  onChange={(e) => setComposeData({ ...composeData, toId: e.target.value, studentId: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select {composeData.toType === 'parent' ? 'Parent' : 'Driver'}...</option>
                  {(composeData.toType === 'parent' ? parents : drivers).map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} {item.email ? `(${item.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {composeData.toType === 'parent' && composeData.toId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Related Student (Optional)</label>
                  <select
                    value={composeData.studentId}
                    onChange={(e) => setComposeData({ ...composeData, studentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Student (Optional)...</option>
                    {(() => {
                      const selectedParent = parents.find(p => p._id === composeData.toId)
                      if (!selectedParent || !selectedParent.students) return null
                      
                      const parentStudentIds = selectedParent.students.map(s => 
                        typeof s === 'object' ? s._id?.toString() || s.toString() : s.toString()
                      )
                      
                      return students
                        .filter(student => parentStudentIds.includes(student._id.toString()))
                        .map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.name} - {student.grade}
                          </option>
                        ))
                    })()}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject (Optional)</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Message subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Type your message here..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowComposeModal(false)
                    setComposeData({
                      toType: 'parent',
                      toId: '',
                      studentId: '',
                      subject: '',
                      message: ''
                    })
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors font-semibold"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagerLayout>
  )
}

export default Outbox

