import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../services/api'

// Async thunk for token refresh
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const response = await authAPI.refreshAccessToken(auth.refreshToken)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Token refresh failed')
    }
  }
)

const initialState = {
  employee: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: true,
  tokenRefreshing: false,
  tokenRefreshError: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { employee, access, refresh } = action.payload
      state.employee = employee
      state.accessToken = access
      state.refreshToken = refresh
      state.isAuthenticated = true
      state.loading = false
      state.tokenRefreshError = null
      
      // Store in localStorage
      localStorage.setItem('token', access)
      localStorage.setItem('refreshToken', refresh)
      localStorage.setItem('employee', JSON.stringify(employee))
    },
    logout: (state) => {
      state.employee = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.loading = false
      state.tokenRefreshing = false
      state.tokenRefreshError = null
      
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('employee')
    },
    restoreAuth: (state) => {
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      const employee = localStorage.getItem('employee')
      
      if (token && refreshToken && employee) {
        try {
          state.employee = JSON.parse(employee)
          state.accessToken = token
          state.refreshToken = refreshToken
          state.isAuthenticated = true
        } catch (error) {
          // If parsing fails, clear invalid data
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('employee')
          state.loading = false
          return
        }
      }
      state.loading = false
    },
    updateEmployee: (state, action) => {
      state.employee = { ...state.employee, ...action.payload }
      localStorage.setItem('employee', JSON.stringify(state.employee))
    },
    setTokens: (state, action) => {
      const { access, refresh } = action.payload
      state.accessToken = access
      state.refreshToken = refresh
      localStorage.setItem('token', access)
      localStorage.setItem('refreshToken', refresh)
    },
    clearLoading: (state) => {
      state.loading = false
    },
    clearTokenRefreshError: (state) => {
      state.tokenRefreshError = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshToken.pending, (state) => {
        state.tokenRefreshing = true
        state.tokenRefreshError = null
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.tokenRefreshing = false
        state.accessToken = action.payload.access
        state.tokenRefreshError = null
        // Update localStorage
        localStorage.setItem('token', action.payload.access)
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.tokenRefreshing = false
        state.tokenRefreshError = action.payload
        // If token refresh fails, logout
        state.employee = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('employee')
      })
  }
})

export const { 
  setCredentials, 
  logout, 
  restoreAuth, 
  updateEmployee,
  setTokens,
  clearLoading,
  clearTokenRefreshError
} = authSlice.actions

export default authSlice.reducer