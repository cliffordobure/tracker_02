import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import TeacherLayout from '../../components/layouts/TeacherLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

const Diary = () => {
  const { user } = useSelector((state) => state.auth)
  const [entries, setEntries] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingEntry, setViewingEntry] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [formData, setFormData] = useState({
    studentId: '',
    sendToAll: false,
    content: '',
    date: new Date().toISOString().split('T')[0],
    teacherNote: ''
  })

  useEffect(() => {
    fetchEntries()
    fetchStudents()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const response = await api.get('/teacher/diary')
      setEntries(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching diary entries:', error)
      toast.error('Failed to load diary entries')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/teacher/students')
      setStudents(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        content: formData.content,
        date: formData.date,
        teacherNote: formData.teacherNote || undefined
      }

      if (formData.sendToAll) {
        payload.sendToAll = true
      } else if (formData.studentId) {
        payload.studentId = formData.studentId
      }

      if (editingEntry) {
        await api.put(`/teacher/diary/${editingEntry._id}`, payload)
        toast.success('Diary entry updated successfully')
      } else {
        await api.post('/teacher/diary', payload)
        toast.success('Diary entry created successfully')
      }

      setShowModal(false)
      setEditingEntry(null)
      setFormData({
        studentId: '',
        sendToAll: false,
        content: '',
        date: new Date().toISOString().split('T')[0],
        teacherNote: ''
      })
      fetchEntries()
    } catch (error) {
      console.error('Error saving diary entry:', error)
      toast.error(error.response?.data?.message || 'Failed to save diary entry')
    }
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setFormData({
      studentId: entry.student?.id || '',
      sendToAll: false,
      content: entry.content || '',
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      teacherNote: entry.teacherNote || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this diary entry?')) {
      return
    }

    try {
      await api.delete(`/teacher/diary/${entryId}`)
      toast.success('Diary entry deleted successfully')
      fetchEntries()
    } catch (error) {
      console.error('Error deleting diary entry:', error)
      toast.error(error.response?.data?.message || 'Failed to delete diary entry')
    }
  }

  const handleViewEntry = (entry) => {
    setViewingEntry(entry)
    setShowViewModal(true)
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
                  Diary Entries
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Manage and create diary entries for your students
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingEntry(null)
                  setFormData({
                    studentId: '',
                    sendToAll: false,
                    content: '',
                    date: new Date().toISOString().split('T')[0],
                    teacherNote: ''
                  })
                  setShowModal(true)
                }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Entry</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading diary entries...</p>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-12 max-w-md mx-auto">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No diary entries yet</h3>
                <p className="text-gray-600 mb-6">Create your first diary entry to communicate with parents</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200"
                >
                  Create Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {entries.map((entry, index) => (
                <div
                  key={entry._id || entry.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 animate-slide-up cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleViewEntry(entry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary-100">
                          {entry.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{entry.student?.name || 'Unknown Student'}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(entry.date || entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto flex items-center space-x-2">
                          {entry.parentNote && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center space-x-1">
                              <span>💬</span>
                              <span>Parent Note</span>
                            </span>
                          )}
                          {entry.parentSignature && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                              ✓ Signed
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap line-clamp-3">{entry.content}</p>
                      {entry.attachments && entry.attachments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.attachments.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm text-primary-600 hover:text-primary-700 underline"
                              >
                                Attachment {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {entry.parentNote && (
                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <p className="text-sm font-semibold text-blue-800 mb-1">Parent Note Preview:</p>
                          <p className="text-sm text-blue-700 line-clamp-2">{entry.parentNote}</p>
                          <p className="text-xs text-blue-600 mt-2 font-medium">Click to view full note →</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(entry)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id || entry.id)}
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

        {/* View Entry Modal */}
        {showViewModal && viewingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-yellow-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Diary Entry Details
                  </h2>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Student Info */}
                <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-primary-100">
                    {viewingEntry.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{viewingEntry.student?.name || 'Unknown Student'}</h3>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(viewingEntry.date || viewingEntry.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {viewingEntry.parentSignature && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        ✓ Signed by parent on {new Date(viewingEntry.parentSignature.signedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Diary Content */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Diary Entry:</h4>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingEntry.content}</p>
                  </div>
                </div>

                {/* Parent Note Section */}
                {viewingEntry.parentNote ? (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-300 shadow-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-2xl">💬</span>
                      <h4 className="text-xl font-bold text-blue-800">Parent Note</h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{viewingEntry.parentNote}</p>
                    </div>
                    {viewingEntry.parentSignature?.signedAt && (
                      <p className="text-sm text-blue-600 mt-3 font-medium">
                        Note added on {new Date(viewingEntry.parentSignature.signedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                    <p className="text-gray-500 text-lg">No note from parent for this diary entry</p>
                  </div>
                )}

                {/* Attachments */}
                {viewingEntry.attachments && viewingEntry.attachments.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Attachments:</h4>
                    <div className="flex flex-wrap gap-3">
                      {viewingEntry.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-all duration-200 font-medium inline-flex items-center space-x-2"
                        >
                          <span>📎</span>
                          <span>Attachment {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      handleEdit(viewingEntry)
                    }}
                    className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium"
                  >
                    Edit Entry
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  {editingEntry ? 'Edit Diary Entry' : 'Create Diary Entry'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {!editingEntry && (
                  <>
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        id="sendToAll"
                        checked={formData.sendToAll}
                        onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked, studentId: '' })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="sendToAll" className="text-sm font-medium text-gray-700">
                        Send to all students in class
                      </label>
                    </div>
                    {!formData.sendToAll && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Student
                        </label>
                        <select
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required={!formData.sendToAll}
                        >
                          <option value="">Select a student</option>
                          {students.map((student) => (
                            <option key={student._id || student.id} value={student._id || student.id}>
                              {student.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter diary entry content..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher Note (Optional, max 500 chars)
                  </label>
                  <textarea
                    value={formData.teacherNote}
                    onChange={(e) => setFormData({ ...formData, teacherNote: e.target.value })}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Private note (visible after parent signs)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.teacherNote.length}/500</p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingEntry(null)
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-medium"
                  >
                    {editingEntry ? 'Update' : 'Create'}
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

export default Diary

