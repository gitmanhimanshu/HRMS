# HRMS Lite - Backend Documentation

## Overview
HRMS Lite is a Human Resource Management System built with Django REST Framework. It provides comprehensive employee management, attendance tracking, leave management, and invitation-based onboarding.

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Models](#database-models)
3. [Authentication Flow](#authentication-flow)
4. [User Roles & Permissions](#user-roles--permissions)
5. [API Endpoints](#api-endpoints)
6. [Setup Instructions](#setup-instructions)
7. [Environment Variables](#environment-variables)

---

## System Architecture

### Tech Stack
- **Framework**: Django 4.x + Django REST Framework
- **Authentication**: JWT (JSON Web Tokens) using `djangorestframework-simplejwt`
- **Database**: SQLite (default) / PostgreSQL (production)
- **Email**: SMTP for OTP and invitation emails

### Key Components
- **Custom JWT Authentication**: Works with Employee model instead of Django's User model
- **Multi-tenant**: Company-based data isolation
- **Role-based Access Control**: Admin vs Non-admin permissions

---

## Database Models

### 1. Company
Represents an organization/company in the system.

**Fields:**
- `name` - Company name
- `created_at` - Timestamp of creation

**Relationships:**
- One-to-Many with Employee
- One-to-Many with InvitedEmployee

---

### 2. Employee
Core user model representing employees within a company.

**Fields:**
- `company` - ForeignKey to Company
- `employee_id` - Auto-generated unique ID (e.g., EMP0001)
- `full_name` - Employee's full name
- `email` - Unique email within company
- `password` - Hashed password
- `department` - Department name
- `phone` - Contact number
- `position` - Job title/position
- `profile_picture` - URL to profile image
- `is_admin` - Boolean flag for admin privileges
- `created_at` - Timestamp of creation

**Unique Constraints:**
- (`company`, `employee_id`) - Employee ID unique per company
- (`company`, `email`) - Email unique per company

**Relationships:**
- Many-to-One with Company
- One-to-Many with Attendance
- One-to-Many with Leave
- One-to-Many with PasswordResetOTP
- One-to-Many with InvitedEmployee (as inviter)

---

### 3. Attendance
Tracks daily attendance records for employees.

**Fields:**
- `employee` - ForeignKey to Employee
- `date` - Date of attendance
- `status` - Choice: 'Present' or 'Absent'
- `notes` - Optional notes/remarks
- `created_at` - Timestamp of record creation

**Unique Constraints:**
- (`employee`, `date`) - One attendance record per employee per day

**Relationships:**
- Many-to-One with Employee

---

### 4. Leave
Manages leave requests and approvals.

**Fields:**
- `employee` - ForeignKey to Employee
- `leave_type` - Choice: 'Sick', 'Casual', 'Earned'
- `start_date` - Leave start date
- `end_date` - Leave end date
- `reason` - Reason for leave
- `status` - Choice: 'Pending', 'Approved', 'Rejected'
- `created_at` - Request creation timestamp
- `updated_at` - Last update timestamp

**Relationships:**
- Many-to-One with Employee

---

### 5. PasswordResetOTP
Stores OTP tokens for password reset functionality.

**Fields:**
- `employee` - ForeignKey to Employee
- `otp` - 6-digit OTP code
- `created_at` - OTP generation time
- `expires_at` - Expiration time (10 minutes from creation)
- `is_used` - Boolean flag to prevent reuse

**Methods:**
- `is_valid()` - Checks if OTP is not used and not expired

**Relationships:**
- Many-to-One with Employee

---

### 6. InvitedEmployee
Manages employee invitation system.

**Fields:**
- `email` - Email of invited person
- `company` - ForeignKey to Company
- `invited_by` - ForeignKey to Employee (admin who sent invitation)
- `created_date` - Invitation creation timestamp
- `is_accepted` - Boolean flag for acceptance status
- `accepted_date` - Timestamp when invitation was accepted
- `is_expired` - Boolean flag for expiration
- `invitation_token` - Unique token for invitation link

**Unique Constraints:**
- (`email`, `company`) - One invitation per email per company

**Methods:**
- `accept_invitation()` - Marks invitation as accepted

**Relationships:**
- Many-to-One with Company
- Many-to-One with Employee (inviter)

---

## Authentication Flow

### 1. Company Registration
**Endpoint**: `POST /api/auth/register/`

**Process:**
1. User provides company name, full name, email, password, department
2. System creates new Company record
3. System creates first Employee with `is_admin=True`
4. Auto-generates employee_id (EMP0001)
5. Returns JWT tokens (access + refresh)

**Response:**
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "employee": {
    "id": 1,
    "employee_id": "EMP0001",
    "full_name": "John Doe",
    "email": "john@company.com",
    "is_admin": true,
    "company": "My Company"
  }
}
```

---

### 2. Login
**Endpoint**: `POST /api/auth/login/`

**Process:**
1. User provides email and password
2. System verifies credentials using `check_password()`
3. Returns JWT tokens if valid

---

### 3. Password Reset Flow

#### Step 1: Request OTP
**Endpoint**: `POST /api/auth/forgot-password/`
- User provides email
- System generates 6-digit OTP
- OTP sent via email
- OTP valid for 10 minutes

#### Step 2: Verify OTP
**Endpoint**: `POST /api/auth/verify-otp/`
- User provides email and OTP
- System validates OTP
- Returns reset token if valid

#### Step 3: Reset Password
**Endpoint**: `POST /api/auth/reset-password/`
- User provides email, OTP, and new password
- System validates OTP again
- Updates password and marks OTP as used

---

### 4. JWT Token Authentication

**Custom Implementation:**
- Uses `EmployeeUserWrapper` class to make Employee model compatible with JWT
- Custom `EmployeeJWTAuthentication` class for token validation
- Tokens include employee ID and company information

**Token Usage:**
```
Authorization: Bearer <access_token>
```

---

## User Roles & Permissions

### Admin Privileges
Admins (`is_admin=True`) can:
- ✅ View all employees in company
- ✅ Add new employees manually
- ✅ Edit any employee's information
- ✅ Toggle admin status of other employees (not themselves)
- ✅ Mark attendance for any employee
- ✅ View all attendance records in company
- ✅ View company-wide attendance grid
- ✅ View all leave requests in company
- ✅ Approve/reject leave requests
- ✅ Send invitations to new employees
- ✅ View all sent invitations

### Non-Admin Privileges
Regular employees (`is_admin=False`) can:
- ✅ View their own profile
- ✅ Edit their own profile (except email, employee_id, company)
- ✅ View their own attendance records
- ✅ Submit leave requests for themselves
- ✅ View their own leave requests
- ❌ Cannot view other employees' data
- ❌ Cannot mark attendance
- ❌ Cannot approve/reject leaves
- ❌ Cannot send invitations

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register/` | Register new company | No |
| POST | `/api/auth/login/` | Login employee | No |
| POST | `/api/auth/logout/` | Logout (blacklist token) | Yes |
| POST | `/api/auth/forgot-password/` | Request password reset OTP | No |
| POST | `/api/auth/verify-otp/` | Verify OTP | No |
| POST | `/api/auth/reset-password/` | Reset password with OTP | No |

---

### Company Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/companies/` | Get current company details | Yes | No |

---

### Employee Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/employees/` | List employees | Yes | Admin sees all, Non-admin sees self |
| POST | `/api/employees/` | Add new employee | Yes | Yes |
| GET | `/api/employees/{id}/` | Get employee details | Yes | Admin only (or self) |
| PATCH | `/api/employees/{id}/` | Update employee | Yes | Admin only (or self) |
| DELETE | `/api/employees/{id}/` | Delete employee | Yes | Yes |
| GET | `/api/employees/profile/` | Get current user profile | Yes | No |
| PATCH | `/api/employees/profile/` | Update current user profile | Yes | No |
| POST | `/api/employees/{id}/toggle_admin/` | Toggle admin status | Yes | Yes |
| GET | `/api/employees/{id}/attendance/` | Get employee attendance | Yes | Admin only (or self) |
| GET | `/api/employees/{id}/leaves/` | Get employee leaves | Yes | Admin only (or self) |

---

### Attendance Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/attendance/` | List attendance records | Yes | Admin sees all, Non-admin sees self |
| POST | `/api/attendance/` | Mark attendance | Yes | Yes |
| GET | `/api/attendance/{id}/` | Get attendance record | Yes | Admin only (or self) |
| PATCH | `/api/attendance/{id}/` | Update attendance | Yes | Yes |
| DELETE | `/api/attendance/{id}/` | Delete attendance | Yes | Yes |
| GET | `/api/attendance/my-attendance/` | Get monthly attendance grid | Yes | No |

**My Attendance Response (Admin):**
```json
{
  "month": 2,
  "year": 2026,
  "total_employees": 5,
  "employees_attendance": [
    {
      "employee_id": "EMP0001",
      "employee_name": "John Doe",
      "department": "IT",
      "total_days": 28,
      "present_days": 20,
      "absent_days": 3,
      "no_record_days": 5,
      "daily_data": [
        {
          "date": "2026-02-01",
          "day": 1,
          "status": "Present",
          "notes": "",
          "has_record": true
        }
      ]
    }
  ]
}
```

**My Attendance Response (Non-Admin):**
```json
{
  "month": 2,
  "year": 2026,
  "total_days": 28,
  "present_days": 20,
  "absent_days": 3,
  "no_record_days": 5,
  "daily_data": [...]
}
```

---

### Leave Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/leaves/` | List leave requests | Yes | Admin sees all, Non-admin sees self |
| POST | `/api/leaves/` | Create leave request | Yes | No |
| GET | `/api/leaves/{id}/` | Get leave details | Yes | Admin only (or self) |
| PATCH | `/api/leaves/{id}/` | Update leave | Yes | Admin only (or self) |
| DELETE | `/api/leaves/{id}/` | Delete leave | Yes | Admin only (or self) |
| POST | `/api/leaves/{id}/approve/` | Approve leave | Yes | Yes |
| POST | `/api/leaves/{id}/reject/` | Reject leave | Yes | Yes |

---

### Invitation Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/invitations/send/` | Send invitation email | Yes | Yes |
| GET | `/api/invitations/verify/` | Verify invitation token | No | No |
| POST | `/api/invitations/accept/` | Accept invitation & create account | No | No |
| GET | `/api/invitations/list/` | List all invitations | Yes | Yes |

---

## How to Create a Company

### Method 1: Direct Registration (First Admin)

**Step 1**: Call registration endpoint
```bash
POST /api/auth/register/
Content-Type: application/json

{
  "company_name": "Tech Solutions Inc",
  "full_name": "John Doe",
  "email": "john@techsolutions.com",
  "password": "securepass123",
  "department": "Management",
  "phone": "+1234567890"
}
```

**Step 2**: System automatically:
1. Creates Company record with name "Tech Solutions Inc"
2. Creates Employee record with:
   - `employee_id`: "EMP0001"
   - `is_admin`: true
   - All provided details
3. Returns JWT tokens for immediate login

**Step 3**: Admin can now:
- Add employees manually via `/api/employees/`
- Send invitations via `/api/invitations/send/`

---

### Method 2: Invitation-Based Onboarding

**Step 1**: Admin sends invitation
```bash
POST /api/invitations/send/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newemployee@techsolutions.com"
}
```

**Step 2**: System:
1. Creates InvitedEmployee record
2. Generates unique invitation token
3. Sends email with invitation link

**Step 3**: Invited person receives email with link:
```
https://yourapp.com/accept-invitation?token=<unique_token>
```

**Step 4**: Invited person accepts invitation
```bash
POST /api/invitations/accept/
Content-Type: application/json

{
  "token": "<unique_token>",
  "full_name": "Jane Smith",
  "password": "securepass456",
  "department": "Engineering",
  "phone": "+1234567891",
  "position": "Software Engineer"
}
```

**Step 5**: System:
1. Validates invitation token
2. Creates Employee record with auto-generated employee_id
3. Marks invitation as accepted
4. Returns JWT tokens for auto-login

---

## Database Relationships Diagram

```
Company
  ├── employees (One-to-Many)
  │     └── Employee
  │           ├── attendance_records (One-to-Many) → Attendance
  │           ├── leaves (One-to-Many) → Leave
  │           ├── password_resets (One-to-Many) → PasswordResetOTP
  │           └── sent_invitations (One-to-Many) → InvitedEmployee
  │
  └── invited_employees (One-to-Many)
        └── InvitedEmployee
              └── invited_by (Many-to-One) → Employee
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create `.env` file in backend directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optional, defaults to SQLite)
DATABASE_URL=postgresql://user:password@localhost:5432/hrms_db

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend URL for invitation links
FRONTEND_URL=http://localhost:3000
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

Server will start at `http://localhost:8000`

---

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SECRET_KEY` | Django secret key | Yes | - |
| `DEBUG` | Debug mode | No | False |
| `ALLOWED_HOSTS` | Allowed hosts | No | localhost |
| `DATABASE_URL` | Database connection string | No | SQLite |
| `EMAIL_HOST` | SMTP server | Yes | - |
| `EMAIL_PORT` | SMTP port | Yes | 587 |
| `EMAIL_HOST_USER` | Email username | Yes | - |
| `EMAIL_HOST_PASSWORD` | Email password | Yes | - |
| `FRONTEND_URL` | Frontend URL for links | Yes | - |

---

## Key Features

### 1. Multi-Tenancy
- Each company's data is isolated
- Employees can only access data within their company
- Company-based filtering on all queries

### 2. Auto-Generated Employee IDs
- Format: EMP0001, EMP0002, etc.
- Sequential numbering per company
- Automatically assigned on employee creation

### 3. Attendance Tracking
- Daily attendance marking (Present/Absent)
- One record per employee per day
- Monthly attendance grid view
- Separate views for admin (all employees) and non-admin (self only)

### 4. Leave Management
- Three leave types: Sick, Casual, Earned
- Three statuses: Pending, Approved, Rejected
- Date range support (start_date to end_date)
- Admin approval workflow

### 5. Invitation System
- Email-based invitations
- Unique token per invitation
- Token expiration support
- Auto-login after acceptance

### 6. Password Reset
- OTP-based password reset
- 6-digit OTP code
- 10-minute expiration
- One-time use only

---

## Security Features

1. **Password Hashing**: Uses Django's `make_password()` with PBKDF2
2. **JWT Authentication**: Secure token-based authentication
3. **Token Expiration**: Access tokens expire after configured time
4. **OTP Expiration**: Password reset OTPs expire after 10 minutes
5. **Permission Checks**: Role-based access control on all endpoints
6. **Company Isolation**: Automatic filtering by company
7. **Unique Constraints**: Prevents duplicate emails and employee IDs

---

## Common Workflows

### Admin Workflow
1. Register company (becomes first admin)
2. Send invitations to employees OR add employees manually
3. Mark daily attendance for employees
4. Review and approve/reject leave requests
5. View company-wide attendance reports

### Employee Workflow
1. Accept invitation and create account
2. Login with credentials
3. View own attendance records
4. Submit leave requests
5. Update own profile

---

## API Response Formats

### Success Response
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2"
}
```

### Error Response
```json
{
  "error": "Error message here"
}
```

### Validation Error Response
```json
{
  "field_name": ["Error message for this field"]
}
```

---

## Testing

### Test Company Registration
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "full_name": "Test Admin",
    "email": "admin@test.com",
    "password": "test123",
    "department": "Management"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "test123"
  }'
```

### Test Authenticated Request
```bash
curl -X GET http://localhost:8000/api/employees/ \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Troubleshooting

### Issue: Email not sending
- Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
- For Gmail, use App Password instead of regular password
- Verify EMAIL_USE_TLS is True

### Issue: JWT token invalid
- Check if token is expired
- Verify SECRET_KEY is consistent
- Ensure Authorization header format: `Bearer <token>`

### Issue: Permission denied
- Verify user has required admin privileges
- Check if accessing own data vs other employees' data
- Confirm JWT token is valid and not expired

---

## Production Deployment

### Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set strong `SECRET_KEY`
- [ ] Configure HTTPS
- [ ] Set up proper email service
- [ ] Enable CORS for frontend domain
- [ ] Set up static file serving
- [ ] Configure database backups
- [ ] Set up logging and monitoring

---

## License
MIT License

## Support
For issues and questions, please contact the development team.
