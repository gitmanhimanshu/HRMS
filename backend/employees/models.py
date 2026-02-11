from django.db import models
from django.core.validators import EmailValidator
from django.utils import timezone
from datetime import timedelta

class Company(models.Model):
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Companies'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Employee(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='employees')
    employee_id = models.CharField(max_length=50)
    full_name = models.CharField(max_length=200)
    email = models.EmailField(validators=[EmailValidator()])
    password = models.CharField(max_length=128)
    department = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    position = models.CharField(max_length=100, blank=True)
    profile_picture = models.URLField(max_length=500, blank=True, null=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['company', 'employee_id'], ['company', 'email']]

    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"

class PasswordResetOTP(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='password_resets')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"OTP for {self.employee.email} - {self.otp}"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['employee', 'date']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.date} - {self.status}"

class Leave(models.Model):
    LEAVE_TYPES = [
        ('Sick', 'Sick Leave'),
        ('Casual', 'Casual Leave'),
        ('Earned', 'Earned Leave'),
    ]
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type} ({self.start_date} to {self.end_date})"

class InvitedEmployee(models.Model):
    email = models.EmailField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invited_employees')
    invited_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='sent_invitations')
    created_date = models.DateTimeField(default=timezone.now)
    is_accepted = models.BooleanField(default=False)
    accepted_date = models.DateTimeField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    invitation_token = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['-created_date']
        unique_together = ['email', 'company']

    def accept_invitation(self):
        self.is_accepted = True
        self.accepted_date = timezone.now()
        self.save()

    def __str__(self):
        return f"Invitation to {self.email} (Accepted: {self.is_accepted})"
