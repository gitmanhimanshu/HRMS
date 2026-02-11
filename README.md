# HRMS Lite - Human Resource Management System

A modern, full-stack HRMS application for managing employees, attendance, and leave requests with role-based access control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![Django](https://img.shields.io/badge/django-4.x-green.svg)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

HRMS Lite is a lightweight Human Resource Management System designed for small to medium-sized companies. It provides essential HR functionalities including:

- **Company Registration & Multi-tenancy**: Each company has isolated data
- **Employee Management**: Add, edit, and manage employee records
- **Attendance Tracking**: Daily attendance marking with monthly grid view
- **Leave Management**: Submit, approve, and track leave requests
- **Invitation System**: Email-based employee onboarding
- **Role-Based Access**: Admin and employee roles with different permissions
- **Profile Management**: Employees can update their own profiles

---

## ✨ Features

### For Admins
- ✅ Register and create company
- ✅ Add employees manually or via email invitation
- ✅ Mark daily attendance for all employees
- ✅ View company-wide attendance grid (monthly calendar view)
- ✅ Approve/reject leave requests
- ✅ Toggle admin status for employees
- ✅ View all employees, attendance, and leave records
- ✅ Send and track invitations

### For Employees
- ✅ Accept invitation and create account
- ✅ View personal attendance records
- ✅ Submit leave requests
- ✅ View leave request status
- ✅ Update personal profile
- ✅ Upload profile picture

### General Features
- ✅ JWT-based authentication
- ✅ Password reset via OTP (email)
- ✅ Responsive design (mobile-friendly)
- ✅ Real-time data updates
- ✅ Secure API endpoints
- ✅ Token refresh mechanism

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.8+ | Programming language |
| **Django** | 4.x | Web framework |
| **Django REST Framework** | 3.x | REST API framework |
| **djangorestframework-simplejwt** | 5.x | JWT authentication |

| **PostgreSQL** | 13+ | Database (production) |
| **SMTP** | - | Email service |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library |
| **Vite** | 5.0.11 | Build tool & dev server |
| **React Router DOM** | 7.13.0 | Client-side routing |
| **Axios** | 1.6.5 | HTTP client |
| **Tailwind CSS** | 3.4.1 | Styling framework |

### Development Tools
- **Git** - Version control
- **npm** - Package manager (frontend)
- **pip** - Package manager (backend)

---

## 🏗 Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React App (Vite)                                     │  │
│  │  - Components (Auth, Employee, Attendance, Leave)     │  │
│  │  - Context (AuthContext)                              │  │
│  │  - Services (API calls with Axios)                    │  │
│  │  - Routing (React Router)                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕ HTTP/HTTPS                       │
│                    (REST API + JWT Tokens)                   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Django REST Framework                                │  │
│  │  - Views (ViewSets & API Views)                       │  │
│  │  - Serializers (Data validation)                      │  │
│  │  - Custom JWT Authentication                          │  │
│  │  - Permission Classes                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Django ORM                                           │  │
│  │  - Models (Company, Employee, Attendance, Leave)      │  │
│  │  - Relationships & Constraints                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (SQLite/PostgreSQL)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  - SMTP Server (Email for OTP & Invitations)                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication**:
   - User submits credentials → Frontend sends to `/api/auth/login/`
   - Backend validates → Returns JWT tokens (access + refresh)
   - Frontend stores tokens in localStorage
   - All subsequent requests include `Authorization: Bearer <token>` header

2. **API Request Flow**:
   - Frontend makes API call via Axios
   - Axios interceptor adds JWT token to headers
   - Backend validates token via custom JWT authentication
   - Backend checks permissions (admin vs non-admin)
   - Backend filters data by company (multi-tenancy)
   - Backend returns JSON response
   - Frontend updates UI

3. **Token Refresh**:
   - When access token expires (401 error)
   - Frontend automatically calls `/api/auth/token/refresh/`
   - Backend validates refresh token
   - Returns new access token
   - Frontend retries original request

---

## 📁 Project Structure

```
hrms-lite/
├── backend/                      # Django backend
│   ├── employees/                # Main app
│   │   ├── migrations/           # Database migrations
│   │   ├── models.py             # Database models
│   │   ├── views.py              # API views
│   │   ├── serializers.py        # DRF serializers
│   │   ├── urls.py               # URL routing
│   │   ├── admin.py              # Django admin config
│   │   ├── email_service.py      # Email utilities
│   │   └── apps.py               # App configuration
│   ├── hrms_lite/                # Project settings
│   │   ├── settings.py           # Django settings
│   │   ├── urls.py               # Root URL config
│   │   ├── wsgi.py               # WSGI config
│   │   └── asgi.py               # ASGI config
│   ├── manage.py                 # Django management script
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── .gitignore                # Git ignore rules
│   └── README.md                 # Backend documentation
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Auth.jsx          # Login/Register
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── AcceptInvitation.jsx
│   │   │   ├── EmployeeList.jsx
│   │   │   ├── EmployeeForm.jsx
│   │   │   ├── InviteEmployee.jsx
│   │   │   ├── InvitationList.jsx
│   │   │   ├── AttendanceForm.jsx
│   │   │   ├── CompanyAttendance.jsx
│   │   │   ├── MyAttendance.jsx
│   │   │   ├── LeaveForm.jsx
│   │   │   ├── LeaveList.jsx
│   │   │   ├── ProfileEdit.jsx
│   │   │   └── Avatar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── services/
│   │   │   └── api.js            # API service layer
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── public/                   # Static assets
│   ├── index.html                # HTML template
│   ├── package.json              # Node dependencies
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS config
│   ├── postcss.config.js         # PostCSS config
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   └── .gitignore                # Git ignore rules
│
└── README.md                     # This file
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.8 or higher
- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Git** (for version control)
- **SMTP Email Account** (Gmail recommended for development)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/gitmanhimanshu/HRMS.git
cd hrms-lite
```

---

### 2. Backend Setup

#### Step 1: Navigate to backend directory
```bash
cd backend
```

#### Step 2: Create virtual environment
```bash
# Windows
python -m venv env
env\Scripts\activate

# macOS/Linux
python3 -m venv env
source env/bin/activate
```

#### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Configure environment variables
```bash
# Copy example env file
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

Edit `.env` file with your configuration (see [Environment Configuration](#environment-configuration))

#### Step 5: Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Step 6: Create superuser (optional)
```bash
python manage.py createsuperuser
```

#### Step 7: Start backend server
```bash
python manage.py runserver
```

Backend will run at: `http://localhost:8000`

---

### 3. Frontend Setup

#### Step 1: Open new terminal and navigate to frontend
```bash
cd frontend
```

#### Step 2: Install dependencies
```bash
npm install
```

#### Step 3: Configure environment variables
```bash
# Copy example env file
copy .env.example .env    # Windows
cp .env.example .env      # macOS/Linux
```

Edit `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

#### Step 4: Start development server
```bash
npm run dev
```

Frontend will run at: `http://localhost:3000`

---

## ⚙️ Environment Configuration

### Backend (.env)

```env
# Django Settings
SECRET_KEY=your-secret-key-here-generate-a-strong-random-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Optional - defaults to SQLite)
# DATABASE_URL=postgresql://user:password@localhost:5432/hrms_db

# Email Configuration (Required for OTP and Invitations)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend URL (for invitation links)
FRONTEND_URL=http://localhost:3000

```

### Frontend (.env)

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000/api
```

### Gmail App Password Setup

For Gmail SMTP:
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password: Security → 2-Step Verification → App Passwords
4. Use the generated password in `EMAIL_HOST_PASSWORD`

---

## 🎮 Running the Application

### Development Mode

1. **Start Backend** (Terminal 1):
```bash
cd backend
env\Scripts\activate    # Windows
source env/bin/activate # macOS/Linux
python manage.py runserver
```

2. **Start Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Django Admin: http://localhost:8000/admin

### Production Build

#### Backend
```bash
cd backend
pip install gunicorn
gunicorn hrms_lite.wsgi:application --bind 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register/` | Register new company | No |
| POST | `/auth/login/` | Login employee | No |
| POST | `/auth/logout/` | Logout (blacklist token) | Yes |
| POST | `/auth/forgot-password/` | Request password reset OTP | No |
| POST | `/auth/verify-otp/` | Verify OTP | No |
| POST | `/auth/reset-password/` | Reset password | No |

### Employee Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/employees/` | List employees | Yes |
| POST | `/employees/` | Add employee (admin only) | Yes |
| GET | `/employees/{id}/` | Get employee details | Yes |
| PATCH | `/employees/{id}/` | Update employee | Yes |
| DELETE | `/employees/{id}/` | Delete employee (admin only) | Yes |
| GET | `/employees/profile/` | Get current user profile | Yes |
| PATCH | `/employees/profile/` | Update current user profile | Yes |
| POST | `/employees/{id}/toggle_admin/` | Toggle admin status | Yes |

### Attendance Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/attendance/` | List attendance records | Yes |
| POST | `/attendance/` | Mark attendance (admin only) | Yes |
| GET | `/attendance/my-attendance/` | Get monthly attendance grid | Yes |

### Leave Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/leaves/` | List leave requests | Yes |
| POST | `/leaves/` | Create leave request | Yes |
| POST | `/leaves/{id}/approve/` | Approve leave (admin only) | Yes |
| POST | `/leaves/{id}/reject/` | Reject leave (admin only) | Yes |

### Invitation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/invitations/send/` | Send invitation (admin only) | Yes |
| GET | `/invitations/verify/` | Verify invitation token | No |
| POST | `/invitations/accept/` | Accept invitation | No |
| GET | `/invitations/list/` | List all invitations | Yes |

For detailed API documentation, see [backend/README.md](backend/README.md)

---

## 👥 User Roles

### Admin
- First user who registers the company becomes admin
- Can add/edit/delete employees
- Can mark attendance for all employees
- Can view company-wide attendance grid
- Can approve/reject leave requests
- Can send invitations to new employees
- Can toggle admin status for other employees

### Employee
- Joins via invitation or admin creation
- Can view own profile and attendance
- Can submit leave requests
- Can update own profile information
- Cannot access other employees' data

---

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: PBKDF2 algorithm with salt
3. **Token Expiration**: Access tokens expire after configured time
4. **Token Refresh**: Automatic token refresh mechanism
5. **OTP Expiration**: Password reset OTPs expire after 10 minutes
6. **Role-Based Access**: Strict permission checks on all endpoints
7. **Company Isolation**: Multi-tenant data isolation
8. **CORS Protection**: Configured allowed origins
9. **SQL Injection Protection**: Django ORM parameterized queries
10. **XSS Protection**: React's built-in XSS protection

---

## 🔄 Frontend-Backend Connection

### How They Connect

1. **API Base URL Configuration**:
   - Frontend: `VITE_API_BASE_URL` in `.env`
   - Axios instance created with base URL
   - All API calls use this base URL

2. **Authentication Flow**:
   ```javascript
   // Frontend: Login request
   axios.post('/auth/login/', { email, password })
   
   // Backend: Returns JWT tokens
   { access: "token", refresh: "token", employee: {...} }
   
   // Frontend: Stores tokens
   localStorage.setItem('token', access)
   localStorage.setItem('refreshToken', refresh)
   ```

3. **Authenticated Requests**:
   ```javascript
   // Frontend: Axios interceptor adds token
   config.headers.Authorization = `Bearer ${token}`
   
   // Backend: Custom JWT authentication validates
   EmployeeJWTAuthentication.authenticate(request)
   ```

4. **CORS Configuration**:
   ```python
   # Backend: settings.py
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
   ]
   ```

5. **Proxy Configuration** (Development):
   ```javascript
   // Frontend: vite.config.js
   server: {
     proxy: {
       '/api': 'http://localhost:8000'
     }
   }
   ```

### Data Flow Example: Mark Attendance

```
1. Admin clicks "Mark Attendance" button
   ↓
2. Frontend: AttendanceForm.jsx
   - Collects employee, date, status
   - Calls attendanceAPI.create(data)
   ↓
3. Frontend: api.js
   - Axios adds JWT token to headers
   - POST /api/attendance/
   ↓
4. Backend: views.py - AttendanceViewSet
   - EmployeeJWTAuthentication validates token
   - IsAuthenticated checks permission
   - Checks if user is admin
   - Validates data via AttendanceSerializer
   - Checks for duplicate attendance
   - Saves to database
   ↓
5. Backend: Returns response
   { id: 1, employee: 1, date: "2026-02-11", status: "Present" }
   ↓
6. Frontend: Updates UI
   - Shows success message
   - Refreshes attendance list
```

---

## 📸 Screenshots

### Login Page
- Company registration
- Employee login
- Forgot password

### Admin Dashboard
- Employee management
- Attendance marking
- Company-wide attendance grid
- Leave approval
- Invitation management

### Employee Dashboard
- Personal attendance view
- Leave request submission
- Profile management

---

## 🚢 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)

1. Set environment variables
2. Configure PostgreSQL database
3. Set `DEBUG=False`
4. Configure `ALLOWED_HOSTS`
5. Collect static files: `python manage.py collectstatic`
6. Run migrations: `python manage.py migrate`
7. Use Gunicorn: `gunicorn hrms_lite.wsgi:application`

### Frontend Deployment (Vercel/Netlify)

1. Build: `npm run build`
2. Set `VITE_API_BASE_URL` to production backend URL
3. Deploy `dist` folder
4. Configure redirects for SPA routing

### Environment Variables for Production

**Backend**:
- `SECRET_KEY`: Strong random key
- `DEBUG`: False
- `ALLOWED_HOSTS`: Your domain
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ALLOWED_ORIGINS`: Frontend domain
- Email settings

**Frontend**:
- `VITE_API_BASE_URL`: Production backend URL

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🐛 Troubleshooting

### Backend Issues

**Issue**: Email not sending
- Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
- For Gmail, use App Password
- Verify EMAIL_USE_TLS is True

**Issue**: CORS errors
- Add frontend URL to CORS_ALLOWED_ORIGINS in settings.py
- Restart backend server

**Issue**: Database errors
- Run migrations: `python manage.py migrate`
- Check database connection settings

### Frontend Issues

**Issue**: API connection failed
- Verify VITE_API_BASE_URL in .env
- Check if backend is running
- Check browser console for errors

**Issue**: Token expired
- Token refresh should happen automatically
- Clear localStorage and login again

**Issue**: Build errors
- Delete node_modules and package-lock.json
- Run `npm install` again

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@hrms-lite.com

---

## 🎯 Roadmap

- [ ] Dashboard with analytics
- [ ] Payroll management
- [ ] Performance reviews
- [ ] Document management
- [ ] Mobile app (React Native)
- [ ] Biometric attendance
- [ ] Shift management
- [ ] Notifications system

---

## 👨‍💻 Authors

- Your Name - Initial work

---

## 🙏 Acknowledgments

- Django REST Framework documentation
- React documentation
- Tailwind CSS
- All contributors

---

**Made with ❤️ using Django & React**
