import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const refreshToken = localStorage.getItem('refreshToken')
    const employee = localStorage.getItem('employee')
    
    if ((token || refreshToken) && employee) {
      try {
        setCurrentEmployee(JSON.parse(employee))
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Failed to parse employee data:', error)
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = (employee, accessToken, refreshToken) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('employee', JSON.stringify(employee))
    setCurrentEmployee(employee)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      // Call the backend logout endpoint to blacklist the refresh token
      await authAPI.logout(refreshToken);
    } catch (error) {
      // If logout API fails, continue with client-side cleanup
      console.error('Logout API call failed:', error);
    }
    
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('employee')
    setCurrentEmployee(null)
    setIsAuthenticated(false)
  }

  const updateEmployee = (updatedData) => {
    const updated = { ...currentEmployee, ...updatedData }
    localStorage.setItem('employee', JSON.stringify(updated))
    setCurrentEmployee(updated)
  }

  const value = {
    currentEmployee,
    isAuthenticated,
    loading,
    login,
    logout,
    updateEmployee
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
