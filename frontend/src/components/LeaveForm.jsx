import { useState, useEffect } from 'react'
import { employeeAPI, leaveAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function LeaveForm({ onSuccess }) {
  const { currentEmployee } = useAuth()
  const [employees, setEmployees] = useState([])
  const [formData, setFormData] = useState({
    employee: '',
    leave_type: 'Sick',
    start_date: '',
    end_date: '',
    reason: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (currentEmployee?.is_admin) {
      fetchEmployees()
    } else {
      setFormData(prev => ({ ...prev, employee: currentEmployee?.id }))
    }
  }, [currentEmployee])

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll()
      // Handle both paginated and non-paginated responses
      const employeeData = response.data.results || response.data
      setEmployees(Array.isArray(employeeData) ? employeeData : [])
    } catch (err) {
      setError('Failed to load employees')
      setEmployees([])
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await leaveAPI.create(formData)
      setSuccess(true)
      setFormData({
        employee: currentEmployee?.is_admin ? '' : currentEmployee?.id,
        leave_type: 'Sick',
        start_date: '',
        end_date: '',
        reason: ''
      })
      setTimeout(() => setSuccess(false), 3000)
      onSuccess()
    } catch (err) {
      // Handle different error formats
      let errorMessage = 'Failed to submit leave request'
      
      if (err.response?.data) {
        const errorData = err.response.data
        
        // Check for custom error message
        if (errorData.error) {
          errorMessage = errorData.error
        }
        // Check for non_field_errors
        else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0] || 'This leave request already exists.'
        }
        // Check for field-specific errors
        else if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0]
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0]
          } else {
            errorMessage = firstError
          }
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const leaveTypes = [
    { value: 'Sick', icon: '🤒', color: 'from-red-500 to-pink-500' },
    { value: 'Casual', icon: '🏖️', color: 'from-blue-500 to-cyan-500' },
    { value: 'Earned', icon: '✨', color: 'from-purple-500 to-indigo-500' }
  ]

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 h-[600px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center flex-shrink-0">
        <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Request Leave</h2>
          <p className="text-xs text-gray-500">Submit your leave application</p>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-xs flex items-start shadow-sm animate-slideDown">
            <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-3 text-xs flex items-start shadow-sm animate-slideDown">
            <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Success</p>
              <p>Leave request submitted successfully!</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentEmployee?.is_admin && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employee_id} - {emp.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {leaveTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, leave_type: type.value })}
                  className={`py-2 px-2 rounded font-medium transition-all text-xs ${
                    formData.leave_type === type.value
                      ? `bg-gradient-to-r ${type.color} text-white shadow-md`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-lg mb-0.5">{type.icon}</div>
                  <div>{type.value}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Please provide a reason for your leave..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Leave Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LeaveForm
