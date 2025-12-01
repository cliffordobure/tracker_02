import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStudentLocations } from '../../store/slices/parentSlice'
import ParentLayout from '../../components/layouts/ParentLayout'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { studentLocations, loading } = useSelector((state) => state.parent)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchStudentLocations())
  }, [dispatch])

  return (
    <ParentLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">My Children</h2>
            {studentLocations.length > 0 ? (
              <div className="space-y-4">
                {studentLocations.map((student) => (
                  <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Location: {student.latitude ? `${student.latitude}, ${student.longitude}` : 'Not available'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No children registered</p>
            )}
          </div>
        )}
      </div>
    </ParentLayout>
  )
}

export default Dashboard

