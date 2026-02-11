import { useState, useEffect } from 'react'
import EmployeeList from './components/EmployeeList'
import EmployeeForm from './components/EmployeeForm'
import InviteEmployee from './components/InviteEmployee'
import InvitationList from './components/InvitationList'
import AttendanceForm from './components/AttendanceForm'
import CompanyAttendance from './components/CompanyAttendance'
import MyAttendance from './components/MyAttendance'

import LeaveForm from './components/LeaveForm'
import LeaveList from './components/LeaveList'
import ProfileEdit from './components/ProfileEdit'
import Auth from './components/Auth'
import { useAuth } from './context/AuthContext'

function App() {
  const { currentEmployee, isAuthenticated, loading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Set default tab based on user role when authenticated
  useEffect(() => {
    if (isAuthenticated && currentEmployee && !loading) {
      console.log('Auth state:', { isAuthenticated, currentEmployee, loading, activeTab })
      console.log('Employee data:', currentEmployee)
      // Only set tab if it's empty
      if (!activeTab) {
        // Admin: employees tab, Non-admin: profile tab
        const defaultTab = currentEmployee.is_admin ? 'employees' : 'profile'
        console.log('Setting default tab:', defaultTab, 'for', currentEmployee.email)
        setActiveTab(defaultTab)
      }
    }
  }, [isAuthenticated, currentEmployee, loading, activeTab])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth />
  }

  

  return (
    <div className="min-h-screen bg-gray-50">
     
     
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">HRMS Lite</h1>
              <p className="text-sm sm:text-base text-indigo-100 mt-1">
                {currentEmployee?.company} - {currentEmployee?.full_name} 
                {currentEmployee?.is_admin && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">Admin</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('profile')} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button 
                onClick={logout} 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab !== 'profile' && (
          <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
            <button
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'employees' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('employees')}
            >
              {currentEmployee?.is_admin ? 'Employees' : 'My Profile'}
            </button>
            {currentEmployee?.is_admin && (
              <button
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'attendance' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('attendance')}
              >
                Mark Attendance
              </button>
            )}
            <button
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'my-attendance' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('my-attendance')}
            >
              My Attendance
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'leaves' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('leaves')}
            >
              Leaves
            </button>
            {currentEmployee?.is_admin && (
              <button
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'invitations' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('invitations')}
              >
                Invitations
              </button>
            )}
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {currentEmployee?.is_admin && (
              <div className="lg:col-span-1 space-y-6">
                <EmployeeForm onSuccess={handleRefresh} />
                <InviteEmployee onSuccess={handleRefresh} />
              </div>
            )}
            <div className={currentEmployee?.is_admin ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <EmployeeList key={refreshKey} onDelete={handleRefresh} />
            </div>
          </div>
        )}



        {console.log('Rendering attendance tab:', activeTab, 'is_admin:', currentEmployee?.is_admin) || 
         (activeTab === 'attendance' && currentEmployee?.is_admin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AttendanceForm onSuccess={handleRefresh} />
            </div>
            <div className="lg:col-span-2">
              <CompanyAttendance key={refreshKey} />
            </div>
          </div>
        ))}

        {/* {activeTab === 'my-attendance' && (
          <div className="max-w-4xl mx-auto">
            <MyAttendance />
          </div>
        )} */}

        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <LeaveForm onSuccess={handleRefresh} />
            </div>
            <div className="lg:col-span-2">
              <LeaveList key={refreshKey} />
            </div>
          </div>
        )}

        {activeTab === 'invitations' && currentEmployee?.is_admin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <InviteEmployee onSuccess={handleRefresh} />
            </div>
            <div className="lg:col-span-2">
              <InvitationList key={refreshKey} />
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('employees')}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <ProfileEdit />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
