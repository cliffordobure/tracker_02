import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchStudents } from '../../store/slices/parentSlice'
import ParentLayout from '../../components/layouts/ParentLayout'
import BusTrackingMap from '../../components/BusTrackingMap'

const LiveMap = () => {
  const dispatch = useDispatch()
  const { students, loading } = useSelector((state) => state.parent)

  useEffect(() => {
    dispatch(fetchStudents())
  }, [dispatch])

  // Convert students to drivers format for the map component
  const drivers = students
    .filter(s => s.route && s.route.driver && s.route.driver.location)
    .map(s => ({
      _id: s.route.driver.id,
      name: s.route.driver.name,
      latitude: s.route.driver.location.latitude,
      longitude: s.route.driver.location.longitude,
      vehicleNumber: s.route.driver.vehicleNumber,
      currentRoute: {
        _id: s.route.id,
        name: s.route.name
      }
    }))

  return (
    <ParentLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Bus Tracking</h1>
          <p className="text-gray-600 mt-2">Track your children's bus in real-time</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-[calc(100vh-250px)] min-h-[600px]">
            <BusTrackingMap drivers={drivers} />
          </div>
        </div>

        {students.length === 0 && !loading && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <span className="font-medium">No active routes found.</span> Your children may not have routes assigned yet.
            </p>
          </div>
        )}
      </div>
    </ParentLayout>
  )
}

export default LiveMap



