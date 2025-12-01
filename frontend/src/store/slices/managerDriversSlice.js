import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchDrivers = createAsyncThunk(
  'managerDrivers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/manager/drivers')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch drivers')
    }
  }
)

export const createDriver = createAsyncThunk(
  'managerDrivers/create',
  async (driverData, { rejectWithValue }) => {
    try {
      const response = await api.post('/manager/drivers', driverData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create driver')
    }
  }
)

export const updateDriver = createAsyncThunk(
  'managerDrivers/update',
  async ({ id, driverData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/manager/drivers/${id}`, driverData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update driver')
    }
  }
)

export const deleteDriver = createAsyncThunk(
  'managerDrivers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/manager/drivers/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete driver')
    }
  }
)

const managerDriversSlice = createSlice({
  name: 'managerDrivers',
  initialState: {
    drivers: [],
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
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false
        state.drivers = action.payload
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createDriver.fulfilled, (state, action) => {
        state.drivers.push(action.payload.driver)
      })
      .addCase(updateDriver.fulfilled, (state, action) => {
        const index = state.drivers.findIndex(d => d._id === action.payload.driver._id)
        if (index !== -1) {
          state.drivers[index] = action.payload.driver
        }
      })
      .addCase(deleteDriver.fulfilled, (state, action) => {
        state.drivers = state.drivers.filter(d => d._id !== action.payload)
      })
  },
})

export const { clearError } = managerDriversSlice.actions
export default managerDriversSlice.reducer

