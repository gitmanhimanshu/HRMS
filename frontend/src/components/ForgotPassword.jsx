import { useState } from 'react'
import { authAPI } from '../services/api'

function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const response = await authAPI.forgotPassword({ email })
      setSuccess(response.data.message)
      setStep(2)
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data)
      } else {
        setErrors({ general: 'Network error. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      const response = await authAPI.verifyOTP({ email, otp })
      setSuccess(response.data.message)
      setStep(3)
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data)
      } else {
        setErrors({ general: 'Network error. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setErrors({ newPassword: 'Password must be at least 6 characters' })
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.resetPassword({ 
        email, 
        otp, 
        new_password: newPassword 
      })
      setSuccess(response.data.message)
      setTimeout(() => {
        onBack()
      }, 2000)
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data)
      } else {
        setErrors({ general: 'Network error. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full -mr-20 -mt-20 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-full -ml-16 -mb-16 opacity-20"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600 text-sm">
              {step === 1 && 'Enter your email to receive OTP'}
              {step === 2 && 'Enter the OTP sent to your email'}
              {step === 3 && 'Create a new password'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              ></div>
            </div>
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step >= s 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step > s ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : s}
                </div>
                <p className={`text-xs mt-2 font-medium ${step >= s ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {s === 1 ? 'Email' : s === 2 ? 'Verify' : 'Reset'}
                </p>
              </div>
            ))}
          </div>

          {errors.general && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrors({ ...errors, email: '', general: '' })
                    }}
                    required
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="your.email@company.com"
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-red-600 flex items-center"><span className="mr-1">⚠</span>{errors.email}</p>}
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setErrors({ ...errors, otp: '', general: '' })
                  }}
                  required
                  maxLength={6}
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-3xl tracking-[0.5em] font-bold transition-all ${
                    errors.otp ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="000000"
                />
                {errors.otp && <p className="mt-2 text-sm text-red-600 flex items-center"><span className="mr-1">⚠</span>{errors.otp}</p>}
                <p className="mt-3 text-xs text-gray-500 text-center bg-gray-50 py-2 rounded-lg">
                  OTP sent to <span className="font-semibold text-indigo-600">{email}</span>
                </p>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-indigo-600 py-2 text-sm font-medium hover:text-indigo-700 transition-colors"
              >
                ← Resend OTP
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setErrors({ ...errors, newPassword: '', general: '' })
                    }}
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter new password"
                  />
                </div>
                {errors.newPassword && <p className="mt-2 text-sm text-red-600 flex items-center"><span className="mr-1">⚠</span>{errors.newPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setErrors({ ...errors, confirmPassword: '', general: '' })
                    }}
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                </div>
                {errors.confirmPassword && <p className="mt-2 text-sm text-red-600 flex items-center"><span className="mr-1">⚠</span>{errors.confirmPassword}</p>}
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <button 
            onClick={onBack}
            className="w-full mt-6 text-gray-600 py-2.5 text-sm font-medium hover:text-gray-800 transition-colors flex items-center justify-center group"
          >
            <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
