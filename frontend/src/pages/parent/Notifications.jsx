import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../store/slices/parentSlice'
import ParentLayout from '../../components/layouts/ParentLayout'

const Notifications = () => {
  const dispatch = useDispatch()
  const { notifications, notificationsLoading } = useSelector((state) => state.parent)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  const handleMarkAsRead = async (notificationId) => {
    await dispatch(markNotificationRead(notificationId))
  }

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllNotificationsRead())
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead
    if (filter === 'read') return notif.isRead
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationIcon = (type) => {
    const iconMap = {
      'pickup': '🚌',
      'drop': '🏠',
      'delay': '⏰',
      'route_change': '🔄',
      'general': '📢',
      'emergency': '🚨'
    }
    return iconMap[type] || '📢'
  }

  const getNotificationColor = (type, isRead) => {
    if (isRead) return 'border-gray-200 bg-gray-50'
    
    const colorMap = {
      'pickup': 'border-blue-200 bg-blue-50',
      'drop': 'border-green-200 bg-green-50',
      'delay': 'border-yellow-200 bg-yellow-50',
      'route_change': 'border-purple-200 bg-purple-50',
      'emergency': 'border-red-200 bg-red-50',
      'general': 'border-gray-200 bg-gray-50'
    }
    return colorMap[type] || 'border-gray-200 bg-gray-50'
  }

  return (
    <ParentLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        {notificationsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-xl p-5 transition-all ${
                  getNotificationColor(notification.type, notification.isRead)
                } ${!notification.isRead ? 'shadow-sm' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-3xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className={`font-semibold ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      {notification.student && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Student:</span> {notification.student.name}
                        </p>
                      )}
                      {notification.route && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Route:</span> {notification.route.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4 px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filter === 'unread' ? 'No Unread Notifications' :
               filter === 'read' ? 'No Read Notifications' :
               'No Notifications Yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' ? 'You\'re all caught up! All notifications have been read.' :
               filter === 'read' ? 'No read notifications to display.' :
               'You\'ll see notifications here when there are updates about your children.'}
            </p>
          </div>
        )}
      </div>
    </ParentLayout>
  )
}

export default Notifications



