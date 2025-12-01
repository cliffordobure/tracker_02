import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchRoutes = createAsyncThunk(
  'routes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/routes')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch routes')
    }
  }
)

const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    routes: [],
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
      .addCase(fetchRoutes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loading = false
        state.routes = action.payload
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = routesSlice.actions
export default routesSlice.reducer

