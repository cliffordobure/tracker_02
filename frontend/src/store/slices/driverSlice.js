import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchRoute = createAsyncThunk(
  'driver/route',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/driver/route')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch route')
    }
  }
)

export const updateLocation = createAsyncThunk(
  'driver/location',
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      const response = await api.post('/driver/location', { latitude, longitude })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update location')
    }
  }
)

export const startJourney = createAsyncThunk(
  'driver/journey/start',
  async ({ journeyType }, { rejectWithValue }) => {
    try {
      const response = await api.post('/driver/journey/start', { journeyType })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start journey')
    }
  }
)

export const endJourney = createAsyncThunk(
  'driver/journey/end',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/driver/journey/end')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end journey')
    }
  }
)

export const pickupStudent = createAsyncThunk(
  'driver/student/pickup',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.post('/driver/student/pickup', { studentId })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pickup student')
    }
  }
)

export const dropStudent = createAsyncThunk(
  'driver/student/drop',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.post('/driver/student/drop', { studentId })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to drop student')
    }
  }
)

export const skipStudent = createAsyncThunk(
  'driver/student/skip',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.post('/driver/student/skip', { studentId })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to skip student')
    }
  }
)

export const fetchJourneyStatus = createAsyncThunk(
  'driver/journey/status',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/driver/journey/status')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch journey status')
    }
  }
)

export const fetchJourneyHistory = createAsyncThunk(
  'driver/journey/history',
  async ({ page = 1, limit = 20, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = { page, limit }
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const response = await api.get('/driver/journey/history', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch journey history')
    }
  }
)

const driverSlice = createSlice({
  name: 'driver',
  initialState: {
    route: null,
    students: [],
    currentJourney: null,
    journeyHistory: [],
    location: null,
    loading: false,
    journeyLoading: false,
    historyLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setLocation: (state, action) => {
      state.location = action.payload
    },
    updateStudentStatus: (state, action) => {
      const { studentId, status } = action.payload
      const student = state.students.find(s => s.id === studentId)
      if (student) {
        student.status = status
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Route
      .addCase(fetchRoute.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRoute.fulfilled, (state, action) => {
        state.loading = false
        state.route = action.payload.route
        state.students = action.payload.students || []
      })
      .addCase(fetchRoute.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Location
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.location = action.payload.location
      })
      // Start Journey
      .addCase(startJourney.pending, (state) => {
        state.journeyLoading = true
        state.error = null
      })
      .addCase(startJourney.fulfilled, (state, action) => {
        state.journeyLoading = false
        state.currentJourney = action.payload.journey
      })
      .addCase(startJourney.rejected, (state, action) => {
        state.journeyLoading = false
        state.error = action.payload
      })
      // End Journey
      .addCase(endJourney.pending, (state) => {
        state.journeyLoading = true
      })
      .addCase(endJourney.fulfilled, (state) => {
        state.journeyLoading = false
        state.currentJourney = null
      })
      .addCase(endJourney.rejected, (state, action) => {
        state.journeyLoading = false
        state.error = action.payload
      })
      // Pickup/Drop Student
      .addCase(pickupStudent.fulfilled, (state, action) => {
        const studentId = action.payload.student?.id || action.payload.studentId
        const student = state.students.find(s => s.id === studentId || s.id === action.payload.student?._id)
        if (student) {
          // Update based on backend response
          if (action.payload.student?.pickup) {
            student.pickup = action.payload.student.pickup
          } else if (action.payload.pickup) {
            student.pickup = action.payload.pickup
          } else {
            student.pickup = new Date().toISOString()
          }
          student.status = 'Active' // Backend sets status to 'Active' after pickup
        }
      })
      .addCase(dropStudent.fulfilled, (state, action) => {
        const studentId = action.payload.student?.id || action.payload.studentId
        const student = state.students.find(s => s.id === studentId || s.id === action.payload.student?._id)
        if (student) {
          // Update based on backend response
          if (action.payload.student?.dropped) {
            student.dropped = action.payload.student.dropped
          } else if (action.payload.dropped) {
            student.dropped = action.payload.dropped
          } else {
            student.dropped = new Date().toISOString()
          }
          student.status = 'Active' // Backend sets status to 'Active' after drop
        }
      })
      // Fetch Journey Status
      .addCase(fetchJourneyStatus.fulfilled, (state, action) => {
        if (action.payload.hasActiveJourney && action.payload.journey) {
          state.currentJourney = action.payload.journey
        } else {
          state.currentJourney = null
        }
      })
      // Journey History
      .addCase(fetchJourneyHistory.pending, (state) => {
        state.historyLoading = true
        state.error = null
      })
      .addCase(fetchJourneyHistory.fulfilled, (state, action) => {
        state.historyLoading = false
        state.journeyHistory = action.payload.data || []
      })
      .addCase(fetchJourneyHistory.rejected, (state, action) => {
        state.historyLoading = false
        state.error = action.payload
      })
  },
})

export const { clearError, setLocation, updateStudentStatus } = driverSlice.actions
export default driverSlice.reducer



