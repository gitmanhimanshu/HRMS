import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create an instance without interceptors first
const apiWithoutInterceptors = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await apiWithoutInterceptors.post('/auth/token/refresh/', {
            refresh: refreshToken
          });
          
          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh;
          localStorage.setItem('token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('employee');
          window.location.href = '/'; // Redirect to login
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('employee');
        window.location.href = '/'; // Redirect to login
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getAccessToken: () => localStorage.getItem('token'),
  refreshAccessToken: (refreshToken) => {
    return axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
  },
  logout: (refreshToken) => {
    // Send refresh token to blacklist it on the server
    if (refreshToken) {
      return apiWithoutInterceptors.post(`${API_BASE_URL}/auth/logout/`, { refresh_token: refreshToken });
    } else {
      return apiWithoutInterceptors.post(`${API_BASE_URL}/auth/logout/`);
    }
  },
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  verifyOTP: (data) => api.post('/auth/verify-otp/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
};

export const invitationAPI = {
  send: (data) => api.post('/invitations/send/', data),
  verify: (token) => api.get(`/invitations/verify/?token=${token}`),
  accept: (data) => api.post('/invitations/accept/', data),
  getList: (page = 1) => api.get(`/invitations/list/?page=${page}`),
};

export const employeeAPI = {
  getAll: () => api.get('/employees/'),
  getById: (id) => api.get(`/employees/${id}/`),
  create: (data) => api.post('/employees/', data),
  delete: (id) => api.delete(`/employees/${id}/`),
  toggleAdmin: (id) => api.post(`/employees/${id}/toggle_admin/`),
  getAttendance: (id) => api.get(`/employees/${id}/attendance/`),
  getLeaves: (id) => api.get(`/employees/${id}/leaves/`),
  getProfile: () => api.get('/employees/profile/'),
  updateProfile: (data) => api.patch('/employees/profile/', data),
};

export const leaveAPI = {
  getAll: (page = 1) => api.get(`/leaves/?page=${page}`),
  create: (data) => api.post('/leaves/', data),
  approve: (id) => api.post(`/leaves/${id}/approve/`),
  reject: (id) => api.post(`/leaves/${id}/reject/`),
};

export const attendanceAPI = {
  getAll: (page = 1) => api.get(`/attendance/?page=${page}`),
  create: (data) => api.post('/attendance/', data),
  getMyAttendance: (month, year) => api.get(`/attendance/my-attendance/?month=${month}&year=${year}`),
  getAllEmployeesAttendance: (month, year) => api.get(`/attendance/my-attendance/?month=${month}&year=${year}`),
  getEmployeeAttendance: (employeeId, month, year) => api.get(`/employees/${employeeId}/attendance/?month=${month}&year=${year}`),
};

export default api;
