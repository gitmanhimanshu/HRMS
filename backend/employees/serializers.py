from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import Company, Employee, Attendance, Leave, InvitedEmployee
import secrets

class CompanyRegistrationSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=200)
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    department = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def create(self, validated_data):
        company_name = validated_data.pop('company_name')
        company = Company.objects.create(name=company_name)
        
        # Auto-generate employee ID
        employee_count = Employee.objects.filter(company=company).count()
        employee_id = f"EMP{str(employee_count + 1).zfill(4)}"
        
        validated_data['employee_id'] = employee_id
        validated_data['password'] = make_password(validated_data['password'])
        validated_data['is_admin'] = True
        employee = Employee.objects.create(company=company, **validated_data)
        
        return employee

class CompanySerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']

class EmployeeSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    
    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'full_name', 'email', 'password', 'department', 'phone', 'position', 'profile_picture', 'is_admin', 'created_at']
        read_only_fields = ['id', 'employee_id', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
    
    def create(self, validated_data):
        company = self.context['request'].employee.company
        
        # Auto-generate employee ID
        employee_count = Employee.objects.filter(company=company).count()
        validated_data['employee_id'] = f"EMP{str(employee_count + 1).zfill(4)}"
        
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Only hash password if it's being updated
        if 'password' in validated_data and validated_data['password']:
            validated_data['password'] = make_password(validated_data['password'])
        elif 'password' in validated_data and not validated_data['password']:
            # Remove password from validated_data if it's empty
            validated_data.pop('password')
        return super().update(instance, validated_data)

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'employee_id', 'employee_name', 'date', 'status', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at', 'employee_name', 'employee_id']
    
    def validate(self, data):
        # Check if attendance already exists for this employee on this date
        employee = data.get('employee')
        date = data.get('date')
        
        if employee and date:
            # Check if we're updating (instance exists) or creating new
            if self.instance is None:  # Creating new record
                if Attendance.objects.filter(employee=employee, date=date).exists():
                    raise serializers.ValidationError({
                        'error': f'Attendance for this employee on {date.strftime("%d %b %Y")} has already been marked.'
                    })
        
        return data

class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Leave
        fields = ['id', 'employee', 'employee_id', 'employee_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'employee_name', 'employee_id']

class InvitedEmployeeSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.CharField(source='invited_by.full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = InvitedEmployee
        fields = ['id', 'email', 'company', 'company_name', 'invited_by', 'invited_by_name', 
                  'created_date', 'is_accepted', 'accepted_date', 'is_expired', 'invitation_token']
        read_only_fields = ['id', 'created_date', 'is_accepted', 'accepted_date', 
                           'is_expired', 'invitation_token', 'invited_by_name', 'company_name']
    
    def create(self, validated_data):
        # Generate unique invitation token
        validated_data['invitation_token'] = secrets.token_urlsafe(32)
        return super().create(validated_data)
