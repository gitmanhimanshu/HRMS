import { useState, useEffect } from 'react'
import { invitationAPI } from '../services/api'

function InvitationList() {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchInvitations()
  }, [currentPage])

  const fetchInvitations = async () => {
    try {
      const response = await invitationAPI.getList(currentPage)
      setInvitations(response.data.results || response.data)
      setTotalCount(response.data.count || (response.data.results || response.data).length)
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 10))
      }
    } catch (err) {
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const filteredInvitations = filter === 'all' 
    ? invitations 
    : filter === 'accepted'
    ? invitations.filter(inv => inv.is_accepted)
    : invitations.filter(inv => !inv.is_accepted && !inv.is_expired)

  const stats = {
    total: totalCount,
    accepted: invitations.filter(i => i.is_accepted).length,
    pending: invitations.filter(i => !i.is_accepted && !i.is_expired).length,
    expired: invitations.filter(i => i.is_expired).length
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 text-sm">Loading invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 h-[600px] flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Invitation History</h2>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Total: {stats.total}</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Accepted: {stats.accepted}</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Pending: {stats.pending}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('accepted')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'accepted'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Accepted
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-xs flex-shrink-0">
            {error}
          </div>
        )}

        {filteredInvitations.length === 0 ? (
          <div className="text-center py-8 flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No invitations found</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {filteredInvitations.map((invitation) => (
                <div key={invitation.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{invitation.email}</h3>
                          <p className="text-xs text-gray-500">
                            Invited by {invitation.invited_by_name}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Sent:</span>
                          <span className="ml-1 text-gray-900 font-medium">
                            {new Date(invitation.created_date).toLocaleDateString()}
                          </span>
                        </div>
                        {invitation.is_accepted && invitation.accepted_date && (
                          <div>
                            <span className="text-gray-500">Accepted:</span>
                            <span className="ml-1 text-gray-900 font-medium">
                              {new Date(invitation.accepted_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        invitation.is_accepted 
                          ? 'bg-green-100 text-green-800' 
                          : invitation.is_expired
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invitation.is_accepted ? 'Accepted' : invitation.is_expired ? 'Expired' : 'Pending'}
                      </span>
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
                          ? 'bg-indigo-600 text-white'
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

export default InvitationList
