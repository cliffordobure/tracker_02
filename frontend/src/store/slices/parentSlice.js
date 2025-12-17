import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchStudents = createAsyncThunk(
  'parent/students',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/parent/students')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch students')
    }
  }
)

export const fetchNotifications = createAsyncThunk(
  'parent/notifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/parent/notifications')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications')
    }
  }
)

export const markNotificationRead = createAsyncThunk(
  'parent/notifications/read',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/parent/notifications/${notificationId}/read`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read')
    }
  }
)

export const markAllNotificationsRead = createAsyncThunk(
  'parent/notifications/read-all',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.put('/parent/notifications/read-all')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read')
    }
  }
)

const parentSlice = createSlice({
  name: 'parent',
  initialState: {
    students: [],
    studentLocations: [],
    notifications: [],
    loading: false,
    notificationsLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false
        state.students = action.payload.data || []
        // Also update studentLocations for backward compatibility
        state.studentLocations = action.payload.data || []
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.notificationsLoading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false
        state.notifications = action.payload.data || []
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.notificationsLoading = false
        state.error = action.payload
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload.notification.id)
        if (notification) {
          notification.isRead = true
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.isRead = true
        })
      })
  },
})

export const { clearError } = parentSlice.actions
export default parentSlice.reducer

