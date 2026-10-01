# Requirements Specification
## UpToSkills Intern Management & Workforce Tracking System

**Version**: 1.0  
**Last Updated**: June 2026  
**Technology Stack**: JavaScript, React, Next.js, Node.js, PostgreSQL, Redis, Cloudinary

---

## 1. Introduction

This document specifies the detailed functional and non-functional requirements for the UpToSkills Intern Management & Workforce Tracking System. The system will serve as a centralized, secure platform for managing interns, captains, team leads, and administrative operations.

---

## 2. System Overview

### 2.1 Purpose
To provide a centralized, secure, scalable, and role-based platform for:
- Intern and workforce management
- Attendance tracking and monitoring
- Performance ratings and evaluations
- Social media task management
- Real-time analytics and reporting
- Audit logging and compliance

### 2.2 Scope
**In Scope:**
- Authentication & Authorization
- Workforce Management
- Attendance Management
- Rating & Performance System
- Social Media Task Module
- Analytics & Reporting
- Audit & Monitoring
- Dashboard System
- Notifications

**Out of Scope:**
- HR Integration (future phase)
- Mobile application (future phase)
- Real-time chat (future phase)
- Third-party OAuth (future phase)

---

## 3. User Roles & Hierarchy

### 3.1 Role Hierarchy
```
┌─────────────┐
│    ADMIN    │
└──────┬──────┘
       │
┌──────▼──────────────┐
│    SENIOR TL        │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│      TL (Team Lead) │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│     CAPTAIN         │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│      INTERN         │
└─────────────────────┘
```

### 3.2 Role Definitions

#### **ADMIN**
- **Purpose**: System-level management and oversight
- **Permissions**:
  - Access all users and their data
  - Manage all departments
  - Manage Senior Team Leads
  - Assign roles and permissions
  - Delete/suspend accounts
  - View complete system analytics
  - Access audit logs
  - Manage all campaigns
  - View all reports
  - System-wide configuration

#### **SENIOR TL (Senior Team Lead)**
- **Purpose**: Manage multiple team leads and captains across assigned departments
- **Permissions**:
  - Access assigned department(s)
  - Manage TLs under them
  - Manage Captains under assigned TLs
  - View assigned interns
  - Mark attendance for TLs and Captains
  - Assign performance ratings to TLs and Captains
  - Verify social task submissions
  - View department analytics
  - Generate department reports

- **Restrictions**:
  - Cannot access Admin routes
  - Cannot manage unrelated departments
  - Cannot access global system configuration

#### **TL (Team Lead)**
- **Purpose**: Manage captains and their interns
- **Permissions**:
  - Access assigned Captains
  - View assigned Interns
  - Mark attendance for Captains and Interns
  - Assign performance ratings to Captains
  - Verify social task submissions
  - View team analytics
  - Generate team reports

- **Restrictions**:
  - Cannot access Senior TL management
  - Cannot access Admin data
  - Cannot manage unrelated teams

#### **CAPTAIN**
- **Purpose**: Daily intern management and supervision
- **Permissions**:
  - Manage interns under them
  - Mark intern attendance
  - Assign performance ratings to interns
  - Verify intern social task submissions
  - View intern reports and performance

- **Restrictions**:
  - Cannot access TL or Senior TL data
  - Cannot access unrelated interns

#### **INTERN**
- **Purpose**: Perform assigned tasks and track personal metrics
- **Permissions**:
  - Login to personal dashboard
  - View own attendance records
  - View own performance ratings
  - Upload screenshot proofs
  - View assigned social media tasks
  - Track personal progress

- **Restrictions**:
  - Cannot access other users' data
  - Cannot access management features
  - Cannot modify attendance
  - Cannot modify ratings

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

#### 4.1.1 Login Process
**Requirement**: Secure email and password-based authentication

**Flow**:
1. User navigates to login page
2. User enters email and password
3. System validates email format and existence
4. System verifies password using Argon2 hashing
5. On success: JWT access token generated
6. Refresh token generated and stored in Redis
7. User session created
8. User redirected to role-specific dashboard
9. On failure: Appropriate error message shown (max 3 attempts, then rate limit)

**Technical Details**:
- Password hashing: Argon2
- Access token expiration: 15 minutes
- Refresh token expiration: 7 days
- Rate limiting: 5 failed attempts per 15 minutes
- Session storage: Redis

#### 4.1.2 Role-Based Access Control (RBAC)
**Requirement**: Implement hierarchical role-based access control

**Implementation**:
- Every route is protected by role middleware
- Each API endpoint validates:
  - Valid JWT token
  - User's role
  - Ownership of accessed resource
  - Hierarchy permissions
- Middleware stack:
  1. Token verification
  2. Role validation
  3. Ownership validation
  4. Hierarchy validation
  5. Request validation

#### 4.1.3 Session Management
**Requirement**: Track and manage user sessions securely

**Features**:
- Store active sessions in Redis
- Track login timestamp and IP address
- Automatically expire inactive sessions (30 minutes)
- Allow users to logout and invalidate tokens
- Display active sessions (optional: for admin)

#### 4.1.4 Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

---

### 4.2 User & Workforce Management

#### 4.2.1 User Management
**Requirement**: CRUD operations for users with role assignment

**Features**:
- Create user (Admin/Senior TL based on hierarchy)
- Update user information (Admin/own user)
- Delete/suspend user (Admin/Senior TL)
- View user list (based on role hierarchy)
- Assign roles to users
- Assign users to departments/teams

**Data Captured**:
- Full name
- Email (unique)
- Password
- Role
- Department
- Reporting Manager (hierarchy)
- Status (Active/Inactive/Suspended)
- Created date
- Last login

#### 4.2.2 Department Management
**Requirement**: Organize users into departments

**Features**:
- Create departments (Admin only)
- Assign users to departments
- View department members
- Update department information
- Archive departments

**Data Captured**:
- Department name
- Department code
- Description
- Created date

#### 4.2.3 Team Hierarchy
**Requirement**: Map reporting relationships and team structure

**Features**:
- Assign team members to managers
- Display org chart (Admin/Senior TL)
- Validate hierarchy consistency
- Prevent circular reporting relationships

---

### 4.3 Attendance Management

#### 4.3.1 Attendance Marking
**Requirement**: Track daily attendance with flexible status options

**Allowed Status**:
- Present
- Absent
- Late
- Leave/WFH
- Unrecorded (default)

**Who Can Mark**:
| Role | Can Mark For |
|---|---|
| Captain | Assigned Interns |
| TL | Assigned Captains, Interns |
| Senior TL | Assigned TLs, Captains |
| Admin | Anyone |

**Requirements**:
- Mark attendance daily (ideally morning)
- Add optional remarks
- Cannot modify attendance for past dates (except admin)
- Bulk marking capability
- Mark future attendance (up to 7 days)

#### 4.3.2 Attendance History
**Requirement**: Maintain complete attendance records

**Features**:
- View attendance for any past date
- Filter by date range
- Filter by user/team
- Calculate attendance percentage
- Generate attendance reports

**Data Captured**:
- User ID
- Date
- Status
- Marked by (manager ID)
- Remarks
- Timestamp

#### 4.3.3 Attendance Analytics
**Requirement**: Provide insights into attendance patterns

**Metrics**:
- Monthly attendance percentage
- Average attendance by team
- Absent count by user
- Late arrivals trend
- Attendance comparison (team vs department)

**Reports**:
- Monthly attendance report
- Team attendance summary
- Individual attendance details

---

### 4.4 Rating & Performance System

#### 4.4.1 Performance Rating
**Requirement**: Systematic monthly performance evaluation

**Rating Scale**: 1-5 (with options like Excellent, Good, Average, Below Average, Poor)

**Who Can Rate**:
| Rater Role | Can Rate |
|---|---|
| Captain | Assigned Interns |
| TL | Assigned Captains, Interns |
| Senior TL | Assigned TLs, Captains |
| Admin | Anyone |

**Features**:
- Assign monthly ratings (once per month per person)
- Add reviewer comments (required)
- Prevent duplicate ratings in same month
- View historical ratings
- Update ratings within 24 hours (with audit trail)

**Data Captured**:
- User ID being rated
- Rater ID
- Rating (1-5)
- Comments
- Date rated
- Month/period

#### 4.4.2 Rating Analytics
**Requirement**: Analyze performance trends

**Metrics**:
- Average rating by user
- Average rating by team
- Rating distribution
- Performance trends over months
- Reviewer rating patterns

---

### 4.5 Social Media Task Module

#### 4.5.1 Task Creation
**Requirement**: Create and manage social media campaign tasks

**Who Can Create**:
- Admin
- Senior TL

**Task Details**:
- Task title (e.g., "LinkedIn Repost Campaign")
- Description
- Task link/URL
- Deadline
- Target audience (e.g., Specific interns, department, all)
- Status (Active, Pending, Completed, Archived)

#### 4.5.2 Task Assignment
**Requirement**: Distribute tasks to interns

**Process**:
1. Task created and marked Active
2. Task distributed to assigned interns
3. Interns receive notification
4. Interns see task in dashboard
5. Interns complete task (e.g., repost on LinkedIn)

#### 4.5.3 Proof Submission
**Requirement**: Interns submit screenshot proof of task completion

**Features**:
- Upload screenshot image
- Support formats: JPEG, PNG (max 5MB)
- Proof stored in Cloudinary with unique naming
- Metadata stored in PostgreSQL
- Multiple proofs per task allowed
- Status: Pending, Approved, Rejected

**Data Captured**:
- Task ID
- Intern ID
- Image URL (Cloudinary)
- Upload timestamp
- Verification status

#### 4.5.4 Proof Verification Workflow
**Requirement**: Verify task completion through screenshot proof

**Who Can Verify**:
- Captain (for interns)
- TL (for captains, interns)
- Senior TL (for all under them)
- Admin (for anyone)

**Verification Process**:
1. Reviewer receives notification of pending proof
2. Reviewer views proof image
3. Reviewer checks if proof is valid
4. Reviewer approves or rejects
5. On approval: Status set to "Approved", record saved permanently
6. On rejection: Status set to "Rejected", feedback provided
7. Cron job runs daily to delete images older than 24 hours
8. Verification data remains in database permanently

**Cron Job Details**:
- Runs daily at 2 AM
- Deletes image files from Cloudinary
- Keeps metadata and verification status in database
- Sends notification about cleanup

---

### 4.6 Dashboard System

#### 4.6.1 Admin Dashboard
**Displays**:
- Global system statistics
  - Total users by role
  - Total departments
  - Active interns
  - Pending approvals
- User management section
- All attendance records (filterable)
- All ratings (filterable)
- Department overview
- Recent activities
- Audit logs
- System alerts/warnings

#### 4.6.2 Senior TL Dashboard
**Displays**:
- Department overview
- Team statistics
  - Number of TLs
  - Number of Captains
  - Number of Interns
- Assigned department attendance overview
- Recent activities in department
- Ratings assigned to team members
- Pending proof verifications
- Department analytics

#### 4.6.3 TL Dashboard
**Displays**:
- Team overview
  - Assigned Captains
  - Assigned Interns
- Team attendance summary
- Individual attendance details
- Ratings for team members
- Pending proof verifications
- Team analytics

#### 4.6.4 Captain Dashboard
**Displays**:
- Assigned interns list
- Daily attendance marking interface
- Recent attendance records
- Intern performance ratings
- Pending proof verifications
- Notifications

#### 4.6.5 Intern Dashboard
**Displays**:
- Personal information
- Assigned tasks (active and completed)
- Personal attendance record
- Personal ratings/performance
- Proof upload interface
- Notifications
- Profile/settings

---

### 4.7 Notification System

#### 4.7.1 Notification Types
- New task assigned
- Attendance marked/missing
- Rating assigned
- Proof submitted
- Proof approved/rejected
- System announcements
- Permission changes

#### 4.7.2 Notification Delivery
- In-app notifications (real-time)
- Email notifications (optional)
- Notification history
- Mark as read/unread
- Archive old notifications

---

### 4.8 Analytics & Reporting

#### 4.8.1 Analytics Available
- **Attendance Analytics**: Percentage, trends, patterns
- **Performance Analytics**: Rating trends, team performance, outliers
- **Social Task Analytics**: Completion rate, pending tasks, verification stats
- **Team Productivity**: Active members, inactive members, overall performance
- **Department Overview**: Metrics across all departments

#### 4.8.2 Reports
- Monthly attendance report
- Monthly performance report
- Department summary report
- Team productivity report
- Audit trail report

#### 4.8.3 Report Features
- Download as PDF/CSV
- Customize date range
- Filter by team/department
- Compare periods

---

### 4.9 Audit & Monitoring

#### 4.9.1 Activities Logged
- User login (successful and failed)
- User logout
- Account creation/modification
- Role changes
- Attendance changes
- Rating assignments
- Task verifications
- Proof uploads/deletions
- Sensitive operations (delete user, etc.)
- Permission changes

#### 4.9.2 Audit Log Details
- Timestamp
- User ID
- Action type
- Resource affected
- Before/after values
- IP address (optional)
- Status (success/failure)

#### 4.9.3 Audit Features
- View audit logs (Admin only, or Senior TL for their dept)
- Search by user/date/action
- Export audit logs
- Real-time audit monitoring dashboard
- Retention: Minimum 1 year

---

## 5. Non-Functional Requirements

### 5.1 Security Requirements

#### 5.1.1 Authentication Security
- ✓ JWT-based token authentication
- ✓ Refresh token rotation
- ✓ Secure password hashing (Argon2)
- ✓ Session tracking in Redis
- ✓ Automatic session expiration
- ✓ Device fingerprinting (optional future)

#### 5.1.2 API Security
- ✓ Protected API endpoints (all require JWT)
- ✓ Role validation middleware
- ✓ Ownership validation before resource access
- ✓ Input validation using Joi/Yup
- ✓ Centralized error handling (no sensitive data in errors)

#### 5.1.3 Infrastructure Security
- ✓ Rate limiting (5 requests per second per IP)
- ✓ Brute-force protection (account lockout after 5 failed logins)
- ✓ CORS properly configured
- ✓ CSRF protection on forms
- ✓ Secure headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✓ HTTPS enforced

#### 5.1.4 Data Protection
- ✓ SQL injection prevention (parameterized queries)
- ✓ XSS prevention (input sanitization, output encoding)
- ✓ Password encryption in database
- ✓ Sensitive data encryption at rest (optional)
- ✓ Secure file upload (MIME validation, size validation)
- ✓ Unique file naming to prevent guessing
- ✓ Auto-deletion of sensitive files

#### 5.1.5 Compliance
- ✓ Audit trail for all sensitive operations
- ✓ Data retention policies
- ✓ User consent for data collection
- ✓ Privacy policy implemented

### 5.2 Performance Requirements

| Metric | Target |
|---|---|
| **Page Load Time** | < 3 seconds |
| **API Response Time** | < 500ms (avg), < 2s (p95) |
| **Database Query Time** | < 100ms |
| **Concurrent Users** | Min 100, Target 200+ |
| **Daily Requests** | 100,000+ |
| **System Uptime** | 99.5% (excluding planned maintenance) |

### 5.3 Scalability Requirements
- ✓ Horizontal scaling ready
- ✓ Database indexing for fast queries
- ✓ Caching layer (Redis)
- ✓ Connection pooling
- ✓ Load balancing ready
- ✓ Future multi-tenant support in design

### 5.4 Availability & Reliability
- ✓ Automated backups (daily)
- ✓ Disaster recovery plan
- ✓ Error monitoring and alerts
- ✓ Graceful error handling
- ✓ Fallback mechanisms

### 5.5 Usability Requirements
- ✓ Responsive design (desktop, tablet, mobile)
- ✓ Intuitive navigation
- ✓ Clear role-based dashboards
- ✓ Helpful error messages
- ✓ Accessibility standards (WCAG 2.1 AA)

### 5.6 Maintainability
- ✓ Modular code structure
- ✓ Clear documentation
- ✓ Consistent coding standards
- ✓ Easy to onboard developers
- ✓ Automated testing
- ✓ CI/CD pipeline ready

---

## 6. Technology Stack

### 6.1 Frontend
```
Framework:    Next.js (React)
Language:     JavaScript (ES6+)
Styling:      Tailwind CSS
UI Library:   Shadcn UI
State Mgmt:   Zustand or Context API
API Client:   Axios
Data Fetching: TanStack Query (React Query)
Form Handling: React Hook Form
Validation:   Joi/Yup
```

### 6.2 Backend
```
Runtime:      Node.js
Language:     JavaScript (ES6+)
Framework:    Fastify
Database:     PostgreSQL
Cache:        Redis
File Storage: Cloudinary / S3
Password Hash: Argon2
Validation:   Joi/Yup
Logging:      Pino Logger
Auth:         JWT
Job Queue:    Node Cron (or Bull)
API Docs:     Swagger/OpenAPI
```

### 6.3 Database
```
Primary DB:   PostgreSQL 13+
Cache Layer:  Redis
Connection:   pg driver with pooling
```

### 6.4 Infrastructure
```
Frontend:     Vercel or VPS
Backend:      Linux VPS or Cloud VM
Database:     PostgreSQL Server
Cache:        Redis Server
Storage:      Cloudinary or S3
```

---

## 7. API Architecture

### 7.1 API Versioning
- Current version: /api/v1/
- Future versions: /api/v2/, etc.

### 7.2 API Endpoints Structure

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
```

#### Users
```
GET    /api/v1/users                 # List users (role-based)
POST   /api/v1/users                 # Create user
GET    /api/v1/users/:id             # Get user details
PUT    /api/v1/users/:id             # Update user
DELETE /api/v1/users/:id             # Delete/suspend user
```

#### Attendance
```
GET    /api/v1/attendance            # List attendance (role-based)
POST   /api/v1/attendance            # Mark attendance
PUT    /api/v1/attendance/:id        # Update attendance
GET    /api/v1/attendance/user/:id   # User attendance history
GET    /api/v1/attendance/stats      # Attendance analytics
```

#### Ratings
```
GET    /api/v1/ratings               # List ratings
POST   /api/v1/ratings               # Assign rating
PUT    /api/v1/ratings/:id           # Update rating
GET    /api/v1/ratings/user/:id      # User ratings history
GET    /api/v1/ratings/stats         # Rating analytics
```

#### Social Tasks
```
GET    /api/v1/tasks                 # List tasks
POST   /api/v1/tasks                 # Create task
PUT    /api/v1/tasks/:id             # Update task
DELETE /api/v1/tasks/:id             # Archive task

GET    /api/v1/tasks/:id/proofs      # Get proofs for task
POST   /api/v1/tasks/:id/proofs      # Submit proof
PUT    /api/v1/tasks/proofs/:id      # Verify proof
```

#### Analytics
```
GET    /api/v1/analytics/dashboard   # Dashboard metrics
GET    /api/v1/analytics/attendance  # Attendance analytics
GET    /api/v1/analytics/ratings     # Rating analytics
GET    /api/v1/analytics/tasks       # Task analytics
```

#### Audit
```
GET    /api/v1/audit/logs            # View audit logs
```

### 7.3 Response Format
```javascript
// Success Response
{
  success: true,
  data: {...},
  message: "Operation successful"
}

// Error Response
{
  success: false,
  error: "Error code",
  message: "Human readable error",
  details: {...}
}
```

---

## 8. Database Schema Overview

### Core Tables
- `users` - User accounts and profiles
- `roles` - Role definitions
- `departments` - Department information
- `attendance` - Attendance records
- `ratings` - Performance ratings
- `social_tasks` - Social media campaigns
- `proof_submissions` - Screenshot proofs
- `notifications` - User notifications
- `audit_logs` - System audit trail
- `sessions` - Active sessions

### Database Constraints
- UUID primary keys
- Foreign key relationships enforced
- Unique constraints on email, codes
- Not null constraints on required fields
- Check constraints on status values
- Soft deletes for user deletions

---

## 9. Development Phases

### Phase 1: Core Backend (Days 1-7)
- Authentication system
- Database setup
- Authorization middleware
- User management APIs
- Attendance APIs
- Attendance marking logic

### Phase 2: Additional APIs & Ratings (Days 8-14)
- Rating system APIs
- Social task APIs
- Proof submission APIs
- Analytics calculation
- Notification system foundation

### Phase 3: Frontend Development (Days 15-28)
- Admin dashboard
- Role-specific dashboards
- Authentication pages
- Attendance UI
- Ratings UI
- Proof upload interface
- Task viewing and submission

### Phase 4: Security & Testing (Days 29-35)
- Rate limiting
- Audit logging
- CSRF protection
- Security testing
- Performance testing
- Bug fixes

### Phase 5: Deployment & Documentation (Days 36+)
- Deployment to production
- Documentation
- API documentation
- User guides
- Monitoring setup

---

## 10. Success Criteria

✓ All functional requirements implemented
✓ All security requirements met
✓ Performance targets achieved
✓ 95%+ test coverage
✓ Zero critical security vulnerabilities
✓ Clean, maintainable code
✓ Complete documentation
✓ Production-ready deployment

---

## 11. Constraints & Assumptions

### Constraints
- Only JavaScript (no TypeScript)
- Next.js for frontend framework
- PostgreSQL for database
- Redis for caching
- Cloudinary for file storage
- All users must login to access system

### Assumptions
- Users have valid email addresses
- Users have reliable internet connection
- System deployed on secure VPS
- Database backups managed separately
- Email service available for notifications

---

## 12. Future Enhancements (Out of Scope - Phase 2)
- Google OAuth integration
- Mobile application
- Real-time chat
- AI-powered analytics
- Email digest reports
- Multi-language support
- Dark mode
- HR system integration
- Advanced permission customization
- Microservices architecture

---

## 13. Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Project Manager | - | - | - |
| Tech Lead | - | - | - |
| Client Representative | - | - | - |

---

**End of Requirements Document**
