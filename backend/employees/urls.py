from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register_company, login, logout,
    forgot_password, verify_otp, reset_password,
    send_invitation, verify_invitation, accept_invitation, invitation_list,
    CompanyViewSet, EmployeeViewSet, AttendanceViewSet, LeaveViewSet,MyAttendanceAPIView
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'leaves', LeaveViewSet, basename='leave')

urlpatterns = [
    path('auth/register/', register_company, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/forgot-password/', forgot_password, name='forgot_password'),
    path('auth/verify-otp/', verify_otp, name='verify_otp'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('invitations/send/', send_invitation, name='send_invitation'),
    path('invitations/verify/', verify_invitation, name='verify_invitation'),
    path('invitations/accept/', accept_invitation, name='accept_invitation'),
    path('invitations/list/', invitation_list, name='invitation_list'),
    path('attendance/my-attendance/', MyAttendanceAPIView.as_view(), name='my-attendance'),
    path('', include(router.urls)),
]
