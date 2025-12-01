import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchParents = createAsyncThunk(
  'managerParents/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/manager/parents')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch parents')
    }
  }
)

export const createParent = createAsyncThunk(
  'managerParents/create',
  async (parentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/manager/parents', parentData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create parent')
    }
  }
)

const managerParentsSlice = createSlice({
  name: 'managerParents',
  initialState: {
    parents: [],
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
      .addCase(fetchParents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchParents.fulfilled, (state, action) => {
        state.loading = false
        state.parents = action.payload
      })
      .addCase(fetchParents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createParent.fulfilled, (state, action) => {
        state.parents.push(action.payload.parent)
      })
  },
})

export const { clearError } = managerParentsSlice.actions
export default managerParentsSlice.reducer

