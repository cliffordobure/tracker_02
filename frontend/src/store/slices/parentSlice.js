import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = '/api'

export const fetchStudentLocations = createAsyncThunk(
  'parent/students/locations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/parent/students/locations`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch locations')
    }
  }
)

const parentSlice = createSlice({
  name: 'parent',
  initialState: {
    studentLocations: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentLocations.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchStudentLocations.fulfilled, (state, action) => {
        state.loading = false
        state.studentLocations = action.payload.data || []
      })
      .addCase(fetchStudentLocations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default parentSlice.reducer

