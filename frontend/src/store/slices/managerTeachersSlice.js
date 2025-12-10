import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchTeachers = createAsyncThunk(
  'managerTeachers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/manager/teachers')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teachers')
    }
  }
)

export const createTeacher = createAsyncThunk(
  'managerTeachers/create',
  async (teacherData, { rejectWithValue }) => {
    try {
      const response = await api.post('/manager/teachers', teacherData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create teacher')
    }
  }
)

export const updateTeacher = createAsyncThunk(
  'managerTeachers/update',
  async ({ id, teacherData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/manager/teachers/${id}`, teacherData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update teacher')
    }
  }
)

export const deleteTeacher = createAsyncThunk(
  'managerTeachers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/manager/teachers/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete teacher')
    }
  }
)

const managerTeachersSlice = createSlice({
  name: 'managerTeachers',
  initialState: {
    teachers: [],
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
      .addCase(fetchTeachers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false
        state.teachers = action.payload
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.teachers.push(action.payload.teacher)
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        const index = state.teachers.findIndex(t => t._id === action.payload.teacher._id)
        if (index !== -1) {
          state.teachers[index] = action.payload.teacher
        }
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        state.teachers = state.teachers.filter(t => t._id !== action.payload)
      })
  },
})

export const { clearError } = managerTeachersSlice.actions
export default managerTeachersSlice.reducer









