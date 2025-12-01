import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchManagers = createAsyncThunk(
  'managers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/managers')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch managers')
    }
  }
)

export const createManager = createAsyncThunk(
  'managers/create',
  async (managerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/managers', managerData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create manager')
    }
  }
)

export const updateManager = createAsyncThunk(
  'managers/update',
  async ({ id, managerData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/managers/${id}`, managerData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update manager')
    }
  }
)

export const deleteManager = createAsyncThunk(
  'managers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/managers/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete manager')
    }
  }
)

const managersSlice = createSlice({
  name: 'managers',
  initialState: {
    managers: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch managers
      .addCase(fetchManagers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        state.loading = false
        state.managers = action.payload
      })
      .addCase(fetchManagers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create manager
      .addCase(createManager.fulfilled, (state, action) => {
        state.managers.push(action.payload.manager)
      })
      // Update manager
      .addCase(updateManager.fulfilled, (state, action) => {
        const index = state.managers.findIndex(m => m._id === action.payload.manager._id)
        if (index !== -1) {
          state.managers[index] = action.payload.manager
        }
      })
      // Delete manager
      .addCase(deleteManager.fulfilled, (state, action) => {
        state.managers = state.managers.filter(m => m._id !== action.payload)
      })
  },
})

export const { clearError } = managersSlice.actions
export default managersSlice.reducer

