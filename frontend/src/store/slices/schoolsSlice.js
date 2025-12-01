import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchSchools = createAsyncThunk(
  'schools/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/schools')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch schools')
    }
  }
)

export const createSchool = createAsyncThunk(
  'schools/create',
  async (schoolData, { rejectWithValue }) => {
    try {
      const response = await api.post('/schools', schoolData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create school')
    }
  }
)

export const updateSchool = createAsyncThunk(
  'schools/update',
  async ({ id, schoolData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/schools/${id}`, schoolData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update school')
    }
  }
)

export const deleteSchool = createAsyncThunk(
  'schools/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/schools/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete school')
    }
  }
)

const schoolsSlice = createSlice({
  name: 'schools',
  initialState: {
    schools: [],
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
      // Fetch schools
      .addCase(fetchSchools.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSchools.fulfilled, (state, action) => {
        state.loading = false
        state.schools = action.payload
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create school
      .addCase(createSchool.fulfilled, (state, action) => {
        state.schools.push(action.payload.school)
      })
      .addCase(createSchool.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update school
      .addCase(updateSchool.fulfilled, (state, action) => {
        const index = state.schools.findIndex(s => s._id === action.payload.school._id)
        if (index !== -1) {
          state.schools[index] = action.payload.school
        }
      })
      // Delete school
      .addCase(deleteSchool.fulfilled, (state, action) => {
        state.schools = state.schools.filter(s => s._id !== action.payload)
      })
  },
})

export const { clearError } = schoolsSlice.actions
export default schoolsSlice.reducer

