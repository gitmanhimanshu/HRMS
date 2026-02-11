import { useState, useEffect } from 'react'
import { leaveAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

function LeaveList() {
  const { currentEmployee } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchLeaves()
  }, [currentPage])

  const fetchLeaves = async () => {
    try {
      const response = await leaveAPI.getAll(currentPage)
      setLeaves(response.data.results || response.data)
      setTotalCount(response.data.count || (response.data.results || response.data).length)
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 10))
      }
    } catch (err) {
      setError('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approve(id)
      fetchLeaves()
    } catch (err) {
      setError('Failed to approve leave')
    }
  }

  const handleReject = async (id) => {
    try {
      await leaveAPI.reject(id)
      fetchLeaves()
    } catch (err) {
      setError('Failed to reject leave')
    }
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const filteredLeaves = filter === 'all' 
    ? leaves 
    : leaves.filter(leave => leave.status === filter)

  const stats = {
    total: totalCount,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100">
        <div className="flex flex-col items-center justify-center">
          <svg className="animate-spin h-12 w-12 text-purple-600 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 font-medium">Loading leave requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 h-[600px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Leave Requests</h2>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Total: {stats.total}</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Pending: {stats.pending}</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Approved: {stats.approved}</span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Rejected: {stats.rejected}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('Pending')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'Pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('Approved')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'Approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => handleFilterChange('Rejected')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'Rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-xs flex-shrink-0">
            {error}
          </div>
        )}

        {filteredLeaves.length === 0 ? (
          <div className="text-center py-8 flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No leave requests found</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {filteredLeaves.map((leave) => (
                <div key={leave.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar 
                          src={leave.employee_picture} 
                          name={leave.employee_name} 
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{leave.employee_name}</h3>
                          <p className="text-xs text-gray-500">{leave.employee_id}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-medium">
                            {leave.leave_type}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-1 text-gray-900 font-medium">
                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500">Reason:</span>
                        <span className="ml-1 text-gray-700">{leave.reason}</span>
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status}
                      </span>
                      {currentEmployee?.is_admin && leave.status === 'Pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApprove(leave.id)}
                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  ← Prev
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                        currentPage === i + 1
                          ? 'bg-purple-600 text-white'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default LeaveList
