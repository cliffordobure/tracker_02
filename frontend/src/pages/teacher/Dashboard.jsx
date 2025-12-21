import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import TeacherLayout from '../../components/layouts/TeacherLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'

// Animated number counter component
const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime = null
    const startValue = 0
    const endValue = value || 0

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const currentValue = Math.floor(startValue + (endValue - startValue) * progress)
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{displayValue}</span>
}

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    students: 0,
    diaryEntries: 0,
    notices: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentDiary, setRecentDiary] = useState([])
  const [recentNotices, setRecentNotices] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [studentsRes, diaryRes, noticesRes] = await Promise.all([
        api.get('/teacher/students').catch(() => ({ data: { data: [] } })),
        api.get('/teacher/diary?limit=5').catch(() => ({ data: { data: [] } })),
        api.get('/teacher/notices?limit=5').catch(() => ({ data: { data: [] } }))
      ])

      const students = studentsRes.data?.data || []
      const diary = diaryRes.data?.data || []
      const notices = noticesRes.data?.data || []

      setStats({
        students: students.length,
        diaryEntries: diaryRes.data?.total || 0,
        notices: noticesRes.data?.total || 0
      })

      setRecentDiary(diary.slice(0, 5))
      setRecentNotices(notices.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      title: 'Students', 
      value: stats.students, 
      icon: '👨‍🎓', 
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    { 
      title: 'Diary Entries', 
      value: stats.diaryEntries, 
      icon: '📝', 
      bgGradient: 'from-green-50 to-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    { 
      title: 'Notices', 
      value: stats.notices, 
      icon: '📢', 
      bgGradient: 'from-yellow-50 to-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
  ]

  return (
    <TeacherLayout>
      <div className="min-h-screen">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Welcome back, <span className="font-semibold text-primary-700">{user?.name}</span>
                {user?.assignedClass && (
                  <span className="ml-2 text-primary-600">• Class: {user.assignedClass}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {statCards.map((stat, index) => (
                  <div
                    key={stat.title}
                    className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-2 ${stat.borderColor} p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slide-up`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`bg-gradient-to-br ${stat.bgGradient} rounded-lg p-4 mb-4`}>
                      <div className="flex items-center justify-between">
                        <span className="text-4xl">{stat.icon}</span>
                        <div className={`text-right ${stat.textColor}`}>
                          <p className="text-3xl font-bold">
                            <AnimatedNumber value={stat.value} />
                          </p>
                          <p className="text-sm font-medium mt-1">{stat.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Diary Entries */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                      Recent Diary Entries
                    </h2>
                    <a
                      href="/teacher/diary"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View All →
                    </a>
                  </div>
                  {recentDiary.length > 0 ? (
                    <div className="space-y-3">
                      {recentDiary.map((entry, index) => (
                        <div
                          key={entry._id || index}
                          className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {entry.student?.name || 'Unknown Student'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {entry.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(entry.date || entry.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {entry.parentSignature && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Signed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg">No diary entries yet</p>
                      <p className="text-sm mt-2">Create your first diary entry to get started</p>
                    </div>
                  )}
                </div>

                {/* Recent Notices */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                      Recent Notices
                    </h2>
                    <a
                      href="/teacher/notices"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View All →
                    </a>
                  </div>
                  {recentNotices.length > 0 ? (
                    <div className="space-y-3">
                      {recentNotices.map((notice, index) => (
                        <div
                          key={notice._id || index}
                          className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="font-semibold text-gray-800">{notice.title}</p>
                                {notice.priority && (
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    notice.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                    notice.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {notice.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {notice.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notice.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg">No notices yet</p>
                      <p className="text-sm mt-2">Create a notice to communicate with parents</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  )
}

export default Dashboard

