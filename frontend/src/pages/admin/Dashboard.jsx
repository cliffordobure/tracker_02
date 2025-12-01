import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboardStats } from '../../store/slices/adminSlice'
import AdminLayout from '../../components/layouts/AdminLayout'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { dashboardStats, loading } = useSelector((state) => state.admin)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  const stats = [
    { title: 'Schools', value: dashboardStats?.schools || 0, icon: '🏫', color: 'bg-blue-500' },
    { title: 'Managers', value: dashboardStats?.managers || 0, icon: '👥', color: 'bg-green-500' },
    { title: 'Routes', value: dashboardStats?.routes || 0, icon: '🗺️', color: 'bg-yellow-500' },
    { title: 'Students', value: dashboardStats?.students || 0, icon: '👨‍🎓', color: 'bg-purple-500' },
  ]

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Dashboard

