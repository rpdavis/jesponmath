# Current Firestore Security Rules

This document contains the current Firestore security rules for the JepsonMath Assessment System.

## Rules File Content

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return resource.data.role;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isTeacher() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    
    function isStudent() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student';
    }
    
    // Users collection - base authentication data
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
      allow read, write: if isAdmin();
    }
    
    // Teachers collection - teacher-specific data
    match /teachers/{teacherId} {
      allow read, write: if isAuthenticated() && request.auth.uid == teacherId;
      allow read, write: if isAdmin();
    }
    
    // Students collection - student-specific data
    match /students/{studentId} {
      allow read, write: if isTeacher() || isAdmin();
      allow read: if isStudent() && request.auth.uid == studentId;
    }
    
    // Goals collection - IEP goals
    match /goals/{goalId} {
      allow read, write: if isTeacher() || isAdmin();
      allow read: if isStudent() && request.auth.uid == resource.data.studentSeisId;
    }
    
    // Assessments collection - assessment templates and assignments
    match /assessments/{assessmentId} {
      allow read, write: if isTeacher() || isAdmin();
      allow read: if isStudent() && request.auth.uid == resource.data.studentSeisId;
    }
    
    // Assessment Results collection - completed assessment data
    match /assessmentResults/{resultId} {
      allow read, write: if isTeacher() || isAdmin();
      allow write: if isStudent() && request.auth.uid == resource.data.studentSeisId;
      allow read: if isStudent() && request.auth.uid == resource.data.studentSeisId;
    }
  }
}
```

## Rule Explanations

### Authentication Requirements
- All operations require user authentication (`isAuthenticated()`)
- Role-based access control using `admin`, `teacher`, `student` roles

### Access Patterns

#### **Admin Access:**
- **Full read/write access** to all collections
- **User management** capabilities
- **System-wide visibility**

#### **Teacher Access:**
- **Read/write students** - Can manage their assigned students
- **Read/write goals** - Can create and modify IEP goals
- **Read/write assessments** - Can create and assign assessments
- **Read/write assessment results** - Can view and grade student work

#### **Student Access:**
- **Read own user data** - Can view their own profile
- **Read own student record** - Can see their student information
- **Read assigned goals** - Can view their IEP goals
- **Read assigned assessments** - Can see assessments assigned to them
- **Write assessment results** - Can submit completed assessments
- **Read own results** - Can view their assessment results

### Security Features
- **User isolation** - Students can only access their own data
- **Teacher boundaries** - Teachers can only access their assigned students
- **Admin oversight** - Admins have full system access
- **Data integrity** - Prevents unauthorized modifications

### Collection Structure
- **`users`** - Base authentication and role data
- **`teachers`** - Teacher-specific information
- **`students`** - Student-specific information with class/period data
- **`goals`** - IEP goals linked to students
- **`assessments`** - Assessment templates and assignments
- **`assessmentResults`** - Completed assessment data with scores

## Last Updated
January 2025 - JepsonMath Assessment System v1.0
