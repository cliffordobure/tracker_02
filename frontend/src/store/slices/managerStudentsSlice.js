import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchStudents = createAsyncThunk(
  'managerStudents/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/students')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch students')
    }
  }
)

export const createStudent = createAsyncThunk(
  'managerStudents/create',
  async (studentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/students', studentData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create student')
    }
  }
)

export const updateStudent = createAsyncThunk(
  'managerStudents/update',
  async ({ id, studentData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/students/${id}`, studentData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update student')
    }
  }
)

export const deleteStudent = createAsyncThunk(
  'managerStudents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/students/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete student')
    }
  }
)

const managerStudentsSlice = createSlice({
  name: 'managerStudents',
  initialState: {
    students: [],
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
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false
        state.students = action.payload
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.students.push(action.payload.student)
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const index = state.students.findIndex(s => s._id === action.payload.student._id)
        if (index !== -1) {
          state.students[index] = action.payload.student
        }
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(s => s._id !== action.payload)
      })
  },
})

export const { clearError } = managerStudentsSlice.actions
export default managerStudentsSlice.reducer

