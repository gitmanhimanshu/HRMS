import { useState } from 'react'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ForgotPassword from './ForgotPassword'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const [registerData, setRegisterData] = useState({
    company_name: '',
    full_name: '',
    email: '',
    password: '',
    department: '',
    phone: ''
  })

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />
  }

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '', general: '' })
  }

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '', general: '' })
  }

  const validateRegisterForm = () => {
    const newErrors = {}
    
    // Company name validation
    if (!registerData.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    } else if (registerData.company_name.trim().length < 2) {
      newErrors.company_name = 'Company name must be at least 2 characters'
    }
    
    // Full name validation
    if (!registerData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    } else if (registerData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters'
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!registerData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(registerData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!registerData.password) {
      newErrors.password = 'Password is required'
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (!/(?=.*[a-z])/.test(registerData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(registerData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(registerData.password)) {
      newErrors.password = 'Password must contain at least one number'
    }
    
    // Department validation
    if (!registerData.department.trim()) {
      newErrors.department = 'Department is required'
    }
    
    // Phone validation (optional but if provided, should be valid)
    if (registerData.phone && registerData.phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(registerData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }
    
    return newErrors
  }

  const validateLoginForm = () => {
    const newErrors = {}
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!loginData.password) {
      newErrors.password = 'Password is required'
    }
    
    return newErrors
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Frontend validation
    const validationErrors = validateLoginForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setLoading(true)
    setErrors({})

    try {
      const response = await authAPI.login(loginData)
      login(response.data.employee, response.data.access, response.data.refresh)
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.'
      
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'object') {
          setErrors(errorData)
          return
        }
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.'
      }
      
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    // Frontend validation
    const validationErrors = validateRegisterForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setLoading(true)
    setErrors({})

    try {
      const response = await authAPI.register(registerData)
      login(response.data.employee, response.data.access, response.data.refresh)
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.'
      
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'object') {
          setErrors(errorData)
          return
        }
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.'
      }
      
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">HRMS Lite</h1>
          <p className="text-gray-600">Human Resource Management System</p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            className={`flex-1 py-3 font-medium transition-colors border-b-2 ${
              isLogin 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500'
            }`}
            onClick={() => { setIsLogin(true); setErrors({}); }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 font-medium transition-colors border-b-2 ${
              !isLogin 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500'
            }`}
            onClick={() => { setIsLogin(false); setErrors({}); }}
          >
            Create Company
          </button>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {errors.general}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                name="company_name"
                value={registerData.company_name}
                onChange={handleRegisterChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.company_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={registerData.full_name}
                onChange={handleRegisterChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                minLength={6}
                placeholder="Min 6 chars, 1 uppercase, 1 lowercase, 1 number"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password ? (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Must contain: 6+ characters, uppercase, lowercase, and number
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                name="department"
                value={registerData.department}
                onChange={handleRegisterChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={registerData.phone}
                onChange={handleRegisterChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Auth
