import { useState, useEffect } from 'react'
import { attendanceAPI } from '../services/api'

function MyAttendance() {
  const [attendanceData, setAttendanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    fetchAttendance()
  }, [selectedMonth, selectedYear])

  const fetchAttendance = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await attendanceAPI.getMyAttendance(selectedMonth, selectedYear)
      setAttendanceData(response.data)
    } catch (err) {
      setError('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-500 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'Absent':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 text-sm">Loading attendance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">My Attendance Tracker</h2>
        <p className="text-xs text-gray-500">Track your daily attendance records</p>
      </div>

      <div className="p-4">
        {/* Month/Year Selector */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-xs">
            {error}
          </div>
        )}

        {attendanceData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Total Days</div>
                <div className="text-2xl font-bold text-blue-700">{attendanceData.total_days}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="text-xs text-green-600 font-medium mb-1">Present</div>
                <div className="text-2xl font-bold text-green-700">{attendanceData.present_days}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 font-medium mb-1">Absent</div>
                <div className="text-2xl font-bold text-red-700">{attendanceData.absent_days}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-600 font-medium mb-1">No Record</div>
                <div className="text-2xl font-bold text-gray-700">{attendanceData.no_record_days}</div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-gray-200 rounded overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2">
                <h3 className="font-semibold text-sm">
                  {months[selectedMonth - 1]} {selectedYear}
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-7 gap-0">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="bg-gray-100 border-b border-r border-gray-200 px-2 py-2 text-center">
                      <span className="text-xs font-semibold text-gray-600">{day}</span>
                    </div>
                  ))}
                  
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-b border-r border-gray-200 p-2 bg-gray-50"></div>
                  ))}
                  
                  {/* Days with attendance data */}
                  {attendanceData.daily_data && attendanceData.daily_data.length > 0 ? (
                    attendanceData.daily_data.map((dayData) => {
                      const isToday = new Date().toDateString() === new Date(dayData.date).toDateString()
                      return (
                        <div
                          key={dayData.day}
                          className={`border-b border-r border-gray-200 p-2 min-h-[80px] ${
                            isToday ? 'bg-blue-50' : 'bg-white'
                          } hover:bg-gray-50 transition-colors`}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold ${
                                isToday ? 'text-blue-600' : 'text-gray-700'
                              }`}>
                                {dayData.day}
                              </span>
                              {isToday && (
                                <span className="text-[10px] bg-blue-600 text-white px-1 rounded">Today</span>
                              )}
                            </div>
                            <div className={`flex-1 flex items-center justify-center border rounded ${
                              getStatusColor(dayData.status)
                            }`}>
                              <div className="text-center">
                                <div className="flex justify-center mb-1">
                                  {getStatusIcon(dayData.status)}
                                </div>
                                <span className="text-[10px] font-medium">{dayData.status}</span>
                              </div>
                            </div>
                            {dayData.notes && (
                              <div className="mt-1 text-[9px] text-gray-500 truncate" title={dayData.notes}>
                                {dayData.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-7 text-center py-8 text-gray-500 text-sm">
                      No attendance data available for this month
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-4 justify-center text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-gray-600">No Record</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyAttendance
