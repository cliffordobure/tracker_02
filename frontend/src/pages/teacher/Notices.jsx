import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import TeacherLayout from '../../components/layouts/TeacherLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const Notices = () => {
  const { user } = useSelector((state) => state.auth)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'general',
    priority: 'normal'
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/teacher/notices')
      setNotices(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching notices:', error)
      toast.error('Failed to load notices')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingNotice) {
        await api.put(`/teacher/notices/${editingNotice._id}`, formData)
        toast.success('Notice updated successfully')
      } else {
        await api.post('/teacher/notices', formData)
        toast.success('Notice created successfully')
      }

      setShowModal(false)
      setEditingNotice(null)
      setFormData({
        title: '',
        message: '',
        category: 'general',
        priority: 'normal'
      })
      fetchNotices()
    } catch (error) {
      console.error('Error saving notice:', error)
      toast.error(error.response?.data?.message || 'Failed to save notice')
    }
  }

  const handleEdit = (notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title || '',
      message: notice.message || '',
      category: notice.category || 'general',
      priority: notice.priority || 'normal'
    })
    setShowModal(true)
  }

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) {
      return
    }

    try {
      await api.delete(`/teacher/notices/${noticeId}`)
      toast.success('Notice deleted successfully')
      fetchNotices()
    } catch (error) {
      console.error('Error deleting notice:', error)
      toast.error(error.response?.data?.message || 'Failed to delete notice')
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'event':
        return '🎉'
      case 'academic':
        return '📚'
      case 'transport':
        return '🚌'
      case 'fee':
        return '💰'
      default:
        return '📢'
    }
  }

  return (
    <TeacherLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Notices
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Create and manage notices for parents
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingNotice(null)
                  setFormData({
                    title: '',
                    message: '',
                    category: 'general',
                    priority: 'normal'
                  })
                  setShowModal(true)
                }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Notice</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notices...</p>
              </div>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-12 max-w-md mx-auto">
                <div className="text-6xl mb-4">📢</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No notices yet</h3>
                <p className="text-gray-600 mb-6">Create your first notice to communicate with parents</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200"
                >
                  Create Notice
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {notices.map((notice, index) => (
                <div
                  key={notice._id || notice.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-3xl">{getCategoryIcon(notice.category)}</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800">{notice.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(notice.priority)}`}>
                              {notice.priority}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {notice.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              • {new Date(notice.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{notice.message}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(notice)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(notice._id || notice.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  {editingNotice ? 'Edit Notice' : 'Create Notice'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter notice title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter notice message..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="event">Event</option>
                      <option value="academic">Academic</option>
                      <option value="transport">Transport</option>
                      <option value="fee">Fee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingNotice(null)
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-medium"
                  >
                    {editingNotice ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}

export default Notices

