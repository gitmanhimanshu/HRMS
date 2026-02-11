from django.contrib import admin
from .models import Company, Employee, Attendance, Leave

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'email', 'department', 'is_admin', 'company', 'created_at']
    list_filter = ['company', 'department', 'is_admin']
    search_fields = ['employee_id', 'full_name', 'email']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'status', 'created_at']
    list_filter = ['status', 'date', 'employee__company']
    search_fields = ['employee__employee_id', 'employee__full_name']

@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'status', 'created_at']
    list_filter = ['status', 'leave_type', 'employee__company']
    search_fields = ['employee__employee_id', 'employee__full_name']
