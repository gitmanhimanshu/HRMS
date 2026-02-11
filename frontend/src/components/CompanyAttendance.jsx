import { useState, useEffect, useMemo } from 'react';
import { attendanceAPI } from '../services/api';

function CompanyAttendance() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, selectedYear]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await attendanceAPI.getAllEmployeesAttendance(selectedMonth, selectedYear);
      setAttendanceData(response.data);
      console.log('Attendance Data:', response.data); // For debugging
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    if (!attendanceData || !attendanceData.employees_attendance) return [];
    const unique = new Set(
      attendanceData.employees_attendance.map(emp => emp.department)
    );
    return Array.from(unique);
  }, [attendanceData]);

  const filteredEmployees = useMemo(() => {
    if (!attendanceData || !attendanceData.employees_attendance) return [];

    return attendanceData.employees_attendance.filter(emp => {
      const matchesSearch =
        emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(search.toLowerCase());

      const matchesDepartment =
        departmentFilter === '' ||
        emp.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [attendanceData, search, departmentFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Company Attendance Tracker</h2>
      </div>

      <div className="p-4">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">

          {/* Month */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded text-sm"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>

          {/* Year */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded text-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          />

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-3">{error}</div>
        )}

        {attendanceData && attendanceData.employees_attendance && (
          <div className="overflow-x-auto">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Attendance Grid View - {months[selectedMonth - 1]} {selectedYear}</h3>
            </div>
            
            {/* Grid View Table */}
            <table className="min-w-full text-xs border">
              <thead className="bg-gray-50">
                {/* First row - Day names */}
                <tr>
                  <th className="px-3 py-2 text-left border sticky left-0 bg-gray-50 z-10" rowSpan="2">Employee</th>
                  {Array.from({ length: attendanceData.total_days }, (_, i) => {
                    const date = new Date(selectedYear, selectedMonth - 1, i + 1);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    
                    return (
                      <th key={i} className={`px-2 py-1 border text-center w-12 ${isWeekend ? 'bg-red-50' : ''}`}>
                        <div className={`text-[10px] font-semibold ${isWeekend ? 'text-red-600' : 'text-gray-600'}`}>{dayName}</div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 border text-center w-16 sticky right-0 bg-gray-50 z-10" rowSpan="2">%</th>
                </tr>
                
                {/* Second row - Date numbers */}
                <tr>
                  {Array.from({ length: attendanceData.total_days }, (_, i) => {
                    const date = new Date(selectedYear, selectedMonth - 1, i + 1);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    
                    return (
                      <th key={i} className={`px-2 py-1 border text-center w-12 ${isWeekend ? 'bg-red-50' : ''}`}>
                        <div className={`text-sm font-bold ${isWeekend ? 'text-red-700' : 'text-gray-800'}`}>{i + 1}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((emp, index) => {
                  // Calculate percentage based on present days
                  const percentage = attendanceData.total_days > 0 
                    ? Math.round((emp.present_days / attendanceData.total_days) * 100)
                    : 0;

                  return (
                    <tr key={index} className="border hover:bg-gray-50">
                      <td className="px-2 py-1 border max-w-[120px] sticky left-0 bg-white z-10">
                        <div className="font-medium text-xs truncate" title={emp.employee_name}>{emp.employee_name}</div>
                        <div className="text-gray-500 text-xs truncate" title={emp.employee_id}>{emp.employee_id}</div>
                        <div className="text-gray-400 text-xs truncate" title={emp.department}>{emp.department}</div>
                      </td>
                      
                      {/* Show daily attendance status */}
                      {emp.daily_data && emp.daily_data.map((dayData, dayIndex) => {
                        const status = dayData.status;
                        
                        return (
                          <td key={dayIndex} className="px-1 py-1 border text-center align-middle">
                            <div 
                              className={`w-7 h-7 mx-auto flex items-center justify-center rounded border text-xs font-semibold ${getStatusColor(status)}`}
                              title={`Day ${dayIndex + 1} (${dayData.date.split('T')[0]}): ${status}${dayData.notes ? ` - ${dayData.notes}` : ''}`}
                            >
                              {status.charAt(0)}
                            </div>
                          </td>
                        );
                      })}
                      

                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Legend */}
            <div className="mt-4 flex gap-4 justify-center text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 flex items-center justify-center rounded border border-green-300 bg-green-100 text-green-800 text-[8px]">
                  P
                </div>
                <span className="text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 flex items-center justify-center rounded border border-red-300 bg-red-100 text-red-800 text-[8px]">
                  A
                </div>
                <span className="text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 flex items-center justify-center rounded border border-gray-300 bg-gray-100 text-gray-800 text-[8px]">
                  N
                </div>
                <span className="text-gray-600">No Record</span>
              </div>
            </div>
          </div>
        )}
        
        {attendanceData && !attendanceData.employees_attendance && (
          <div className="text-center py-8 text-gray-500">
            You don't have admin access to view company attendance.
          </div>
        )}

      </div>
    </div>
  );
}

export default CompanyAttendance;
