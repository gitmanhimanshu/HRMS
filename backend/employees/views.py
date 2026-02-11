from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password, make_password
from django.db import IntegrityError
from django.utils import timezone
from .models import Company, Employee, Attendance, Leave, PasswordResetOTP, InvitedEmployee
from .serializers import (
    CompanyRegistrationSerializer, CompanySerializer,
    EmployeeSerializer, AttendanceSerializer, LeaveSerializer
)
from .email_service import send_otp_email
import secrets
import random
import os
from datetime import datetime
from calendar import monthrange
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import AnonymousUser
import jwt
from django.conf import settings



class EmployeeUserWrapper:
    """A wrapper class that makes Employee model compatible with Django's authentication system"""
    def __init__(self, employee):
        self.employee = employee
        self.id = employee.id
        self.pk = employee.id
        self.is_active = True
        
    def __getattr__(self, attr):
        # Delegate attribute access to the underlying employee
        return getattr(self.employee, attr)
    
    def has_perm(self, perm):
        return True  # For simplicity, grant all permissions
    
    def is_anonymous(self):
        return False
    
    def is_authenticated(self):
        return True


class EmployeeJWTAuthentication:
    """Custom JWT authentication that works with Employee model"""
    def authenticate(self, request):
        header = request.META.get('HTTP_AUTHORIZATION')
        
        if header is None:
            return None
            
        try:
            # Extract token from header (format: 'Bearer <token>')
            scheme, token = header.split(' ')
            if scheme.lower() != 'bearer':
                return None
        except ValueError:
            return None
        
        try:
            # Decode the JWT token
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = decoded_token.get('user_id')
            
            if user_id is None:
                return None
                
            # Get the employee based on the user_id from the token
            from .models import Employee
            try:
                employee = Employee.objects.get(pk=user_id)
                employee_wrapper = EmployeeUserWrapper(employee)
                return (employee_wrapper, token)
            except Employee.DoesNotExist:
                return None
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Override the method to manually create the token
        # Get the user from the validated data
        from django.contrib.auth import authenticate
        username_field = getattr(Employee, 'USERNAME_FIELD', 'email')
        username = attrs.get(username_field)
        password = attrs.get('password')
        
        # Since we're using email/password, we need to authenticate differently
        try:
            employee = Employee.objects.get(email=username)
            if check_password(password, employee.password):
                employee_wrapper = EmployeeUserWrapper(employee)
                refresh = RefreshToken.for_user(employee_wrapper)
                
                data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'employee': {
                        'id': employee.id,
                        'employee_id': employee.employee_id,
                        'full_name': employee.full_name,
                        'email': employee.email,
                        'is_admin': employee.is_admin,
                        'company': employee.company.name
                    }
                }
                return data
            else:
                raise serializers.ValidationError('Invalid credentials')
        except Employee.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')

# Simple token storage (in production, use Redis or database)
active_tokens = {}
# Simple token storage (in production, use Redis or database)
active_tokens = {}

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_company(request):
    serializer = CompanyRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            employee = serializer.save()
            employee_wrapper = EmployeeUserWrapper(employee)
            refresh = RefreshToken.for_user(employee_wrapper)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'employee': {
                    'id': employee.id,
                    'employee_id': employee.employee_id,
                    'full_name': employee.full_name,
                    'email': employee.email,
                    'is_admin': employee.is_admin,
                    'company': employee.company.name
                }
            }, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({'error': 'Employee ID or Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        employee = Employee.objects.get(email=email)
        if check_password(password, employee.password):
            employee_wrapper = EmployeeUserWrapper(employee)
            refresh = RefreshToken.for_user(employee_wrapper)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'employee': {
                    'id': employee.id,
                    'employee_id': employee.employee_id,
                    'full_name': employee.full_name,
                    'email': employee.email,
                    'is_admin': employee.is_admin,
                    'company': employee.company.name
                }
            })
    except Employee.DoesNotExist:
        pass
    
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        employee = Employee.objects.get(email=email)
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Save OTP to database
        PasswordResetOTP.objects.create(
            employee=employee,
            otp=otp
        )
        
        # Send OTP via email
        success, message = send_otp_email(employee.email, otp, employee.full_name)
        
        if success:
            return Response({
                'message': 'OTP sent to your email',
                'email': email
            })
        else:
            return Response({'error': message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Employee.DoesNotExist:
        # Don't reveal if email exists or not (security)
        return Response({
            'message': 'If this email exists, an OTP has been sent',
            'email': email
        })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        employee = Employee.objects.get(email=email)
        otp_record = PasswordResetOTP.objects.filter(
            employee=employee,
            otp=otp,
            is_used=False
        ).order_by('-created_at').first()
        
        if not otp_record:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not otp_record.is_valid():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        
        return Response({
            'message': 'OTP verified successfully',
            'reset_token': reset_token,
            'email': email
        })
        
    except Employee.DoesNotExist:
        return Response({'error': 'Invalid email'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    
    if not email or not otp or not new_password:
        return Response({'error': 'Email, OTP, and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        employee = Employee.objects.get(email=email)
        otp_record = PasswordResetOTP.objects.filter(
            employee=employee,
            otp=otp,
            is_used=False
        ).order_by('-created_at').first()
        
        if not otp_record:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not otp_record.is_valid():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update password
        employee.password = make_password(new_password)
        employee.save()
        
        # Mark OTP as used
        otp_record.is_used = True
        otp_record.save()
        
        return Response({'message': 'Password reset successfully'})
        
    except Employee.DoesNotExist:
        return Response({'error': 'Invalid email'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout(request):
    from rest_framework_simplejwt.tokens import RefreshToken
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully'})
    except Exception as e:
        return Response({'message': 'Logged out successfully'})

class IsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        # Use custom JWT authentication that works with Employee model
        auth = EmployeeJWTAuthentication()
        result = auth.authenticate(request)
        
        if result is not None:
            user, _ = result
            # user here is an EmployeeUserWrapper containing the employee
            request.employee = user.employee  # Access the actual employee object
            return True
        
        return False

class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CompanySerializer
    authentication_classes = []
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Company.objects.filter(id=self.request.employee.company.id)

class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    authentication_classes = []
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Employee.objects.filter(company=self.request.employee.company)
        # Non-admin can only see themselves
        if not self.request.employee.is_admin:
            queryset = queryset.filter(id=self.request.employee.id)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        if not self.request.employee.is_admin:
            raise permissions.PermissionDenied("Only admins can add employees")
        serializer.save(company=self.request.employee.company)

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        employee = self.get_object()
        attendance_records = employee.attendance_records.all()
        serializer = AttendanceSerializer(attendance_records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def leaves(self, request, pk=None):
        employee = self.get_object()
        leaves = employee.leaves.all()
        serializer = LeaveSerializer(leaves, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_admin(self, request, pk=None):
        if not self.request.employee.is_admin:
            raise permissions.PermissionDenied("Only admins can change admin status")
        
        employee = self.get_object()
        
        # Prevent removing admin status from yourself
        if employee.id == self.request.employee.id:
            return Response(
                {'error': 'You cannot change your own admin status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee.is_admin = not employee.is_admin
        employee.save()
        
        return Response({
            'message': f"Employee is now {'an admin' if employee.is_admin else 'not an admin'}",
            'is_admin': employee.is_admin
        })
    
    @action(detail=False, methods=['get', 'patch'])
    def profile(self, request):
        """Get or update current user's profile"""
        employee = request.employee
        
        if request.method == 'GET':
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            # Don't allow changing email, employee_id, or company
            data = request.data.copy()
            data.pop('email', None)
            data.pop('employee_id', None)
            data.pop('company', None)
            
            serializer = self.get_serializer(employee, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    authentication_classes = []
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Attendance.objects.filter(employee__company=self.request.employee.company)
        # Non-admin can only see their own attendance
        if not self.request.employee.is_admin:
            queryset = queryset.filter(employee=self.request.employee)
        return queryset

    def perform_create(self, serializer):
        if not self.request.employee.is_admin:
            raise permissions.PermissionDenied("Only admins can mark attendance")
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def my_attendance(self, request):
        """Get current user's attendance for a specific month"""
        from datetime import datetime
        from calendar import monthrange
        
        month = int(request.query_params.get('month', datetime.now().month))
        year = int(request.query_params.get('year', datetime.now().year))
        
        # Get all days in the month
        num_days = monthrange(year, month)[1]
        
        # Get attendance records for the month
        attendance_records = Attendance.objects.filter(
            employee=request.employee,
            date__year=year,
            date__month=month
        )
        
        # Create a dictionary for quick lookup
        attendance_dict = {record.date.day: record for record in attendance_records}
        
        # Build response with all days
        daily_data = []
        for day in range(1, num_days + 1):
            date_obj = datetime(year, month, day).date()
            if day in attendance_dict:
                record = attendance_dict[day]
                daily_data.append({
                    'date': date_obj,
                    'day': day,
                    'status': record.status,
                    'notes': record.notes,
                    'has_record': True
                })
            else:
                daily_data.append({
                    'date': date_obj,
                    'day': day,
                    'status': 'No Record',
                    'notes': '',
                    'has_record': False
                })
        
        return Response({
            'month': month,
            'year': year,
            'total_days': num_days,
            'present_days': len([r for r in attendance_records if r.status == 'Present']),
            'absent_days': len([r for r in attendance_records if r.status == 'Absent']),
            'no_record_days': num_days - len(attendance_records),
            'daily_data': daily_data
        })

class LeaveViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveSerializer
    authentication_classes = []
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Leave.objects.filter(employee__company=self.request.employee.company)
        # Non-admin can only see their own leaves
        if not self.request.employee.is_admin:
            queryset = queryset.filter(employee=self.request.employee)
        return queryset

    def perform_create(self, serializer):
        # Non-admin can only create leave for themselves
        if not self.request.employee.is_admin:
            serializer.save(employee=self.request.employee)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'Approved'
        leave.save()
        return Response({'status': 'Leave approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        leave.status = 'Rejected'
        leave.save()
        return Response({'status': 'Leave rejected'})

# Invitation endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_invitation(request):
    """Admin can send invitation to join company"""
    if not request.employee.is_admin:
        return Response({'error': 'Only admins can send invitations'}, status=status.HTTP_403_FORBIDDEN)
    
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists in company
    if Employee.objects.filter(company=request.employee.company, email=email).exists():
        return Response({'error': 'Employee with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if invitation already sent
    existing_invitation = InvitedEmployee.objects.filter(
        email=email, 
        company=request.employee.company,
        is_accepted=False
    ).first()
    
    if existing_invitation:
        return Response({'error': 'Invitation already sent to this email'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Create invitation
        from .serializers import InvitedEmployeeSerializer
        serializer = InvitedEmployeeSerializer(data={
            'email': email,
            'company': request.employee.company.id,
            'invited_by': request.employee.id
        })
        
        if serializer.is_valid():
            invitation = serializer.save()
            
            # Generate invitation link
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            invitation_link = f"{frontend_url}/accept-invitation?token={invitation.invitation_token}"
            
            # Send invitation email
            from .email_service import send_invitation_email
            success, message = send_invitation_email(
                to_email=email,
                invitation_link=invitation_link,
                company_name=request.employee.company.name,
                inviter_name=request.employee.full_name
            )
            
            if success:
                return Response({
                    'message': 'Invitation sent successfully',
                    'invitation': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                # Delete invitation if email failed
                invitation.delete()
                return Response({'error': f'Failed to send email: {message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_invitation(request):
    """Verify invitation token"""
    token = request.query_params.get('token')
    
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from .models import InvitedEmployee
        invitation = InvitedEmployee.objects.get(invitation_token=token, is_accepted=False, is_expired=False)
        
        return Response({
            'valid': True,
            'email': invitation.email,
            'company_name': invitation.company.name,
            'invited_by': invitation.invited_by.full_name
        })
    except InvitedEmployee.DoesNotExist:
        return Response({'valid': False, 'error': 'Invalid or expired invitation'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def accept_invitation(request):
    """Accept invitation and create employee account"""
    token = request.data.get('token')
    password = request.data.get('password')
    full_name = request.data.get('full_name')
    department = request.data.get('department', 'General')
    phone = request.data.get('phone', '')
    position = request.data.get('position', '')
    
    if not token or not password or not full_name:
        return Response({'error': 'Token, password, and full name are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from .models import InvitedEmployee
        invitation = InvitedEmployee.objects.get(invitation_token=token, is_accepted=False, is_expired=False)
        
        # Check if email already exists
        if Employee.objects.filter(company=invitation.company, email=invitation.email).exists():
            return Response({'error': 'Employee with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Auto-generate employee ID
        employee_count = Employee.objects.filter(company=invitation.company).count()
        employee_id = f"EMP{str(employee_count + 1).zfill(4)}"
        
        # Create employee
        employee = Employee.objects.create(
            company=invitation.company,
            employee_id=employee_id,
            full_name=full_name,
            email=invitation.email,
            password=make_password(password),
            department=department,
            phone=phone,
            position=position,
            is_admin=False
        )
        
        # Mark invitation as accepted
        invitation.accept_invitation()
        
        # Generate JWT token for auto-login
        employee_wrapper = EmployeeUserWrapper(employee)
        refresh = RefreshToken.for_user(employee_wrapper)
        
        return Response({
            'message': 'Account created successfully',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'employee': {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'full_name': employee.full_name,
                'email': employee.email,
                'is_admin': employee.is_admin,
                'company': employee.company.name
            }
        }, status=status.HTTP_201_CREATED)
    
    except InvitedEmployee.DoesNotExist:
        return Response({'error': 'Invalid or expired invitation'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def invitation_list(request):
    """Get list of all invitations sent by current company"""
    if not request.employee.is_admin:
        return Response({'error': 'Only admins can view invitations'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from .models import InvitedEmployee
        from .serializers import InvitedEmployeeSerializer
        from rest_framework.pagination import PageNumberPagination
        
        # Get all invitations for current company
        invitations = InvitedEmployee.objects.filter(company=request.employee.company).order_by('-created_date')
        
        # Apply pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        result_page = paginator.paginate_queryset(invitations, request)
        
        serializer = InvitedEmployeeSerializer(result_page, many=True)
        
        return paginator.get_paginated_response(serializer.data)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MyAttendanceAPIView(APIView):
    authentication_classes = []
    permission_classes = [IsAuthenticated]

    def get(self, request):
        month = int(request.query_params.get('month', datetime.now().month))
        year = int(request.query_params.get('year', datetime.now().year))

        num_days = monthrange(year, month)[1]

        # If Admin → All company employees
        if request.employee.is_admin:
            employees = Employee.objects.filter(company=request.employee.company)

            response_data = []

            for emp in employees:
                attendance_records = Attendance.objects.filter(
                    employee=emp,
                    date__year=year,
                    date__month=month
                )

                # Create a dictionary for quick lookup of attendance by day
                attendance_dict = {record.date.day: record for record in attendance_records}

                # Build daily data for the employee
                daily_data = []
                for day in range(1, num_days + 1):
                    date_obj = datetime(year, month, day).date()
                    if day in attendance_dict:
                        record = attendance_dict[day]
                        daily_data.append({
                            "date": date_obj,
                            "day": day,
                            "status": record.status,
                            "notes": record.notes,
                            "has_record": True
                        })
                    else:
                        daily_data.append({
                            "date": date_obj,
                            "day": day,
                            "status": "No Record",
                            "notes": "",
                            "has_record": False
                        })

                present_count = attendance_records.filter(status='Present').count()
                absent_count = attendance_records.filter(status='Absent').count()

                response_data.append({
                    "employee_id": emp.employee_id,
                    "employee_name": emp.full_name,
                    "department": emp.department,
                    "total_days": num_days,
                    "present_days": present_count,
                    "absent_days": absent_count,
                    "no_record_days": num_days - attendance_records.count(),
                    "daily_data": daily_data  # Include daily data for each employee
                })

            return Response({
                "month": month,
                "year": year,
                "total_employees": employees.count(),
                "employees_attendance": response_data
            })

        # 🔹 If Normal Employee → Only Own Attendance
        else:
            attendance_records = Attendance.objects.filter(
                employee=request.employee,
                date__year=year,
                date__month=month
            )

            attendance_dict = {record.date.day: record for record in attendance_records}

            daily_data = []

            for day in range(1, num_days + 1):
                date_obj = datetime(year, month, day).date()

                if day in attendance_dict:
                    record = attendance_dict[day]
                    daily_data.append({
                        "date": date_obj,
                        "day": day,
                        "status": record.status,
                        "notes": record.notes,
                        "has_record": True
                    })
                else:
                    daily_data.append({
                        "date": date_obj,
                        "day": day,
                        "status": "No Record",
                        "notes": "",
                        "has_record": False
                    })

            return Response({
                "month": month,
                "year": year,
                "total_days": num_days,
                "present_days": attendance_records.filter(status='Present').count(),
                "absent_days": attendance_records.filter(status='Absent').count(),
                "no_record_days": num_days - attendance_records.count(),
                "daily_data": daily_data
            })