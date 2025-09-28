# Firestore Security Rules Changelog

This document tracks all changes made to Firestore security rules for the JepsonMath application.

## Current Rules Version: 2025-09-28

### Recent Changes

#### 2025-09-28: Added customStandards Collection Rules
**Change**: Added missing security rules for `customStandards` collection
**Reason**: Admins were getting permission denied errors when accessing standards management
**Rules Added**:
```javascript
// Custom standards collection
match /customStandards/{standardId} {
  // Teachers and admins can read/write custom standards
  allow read, write: if isTeacher() || isAdmin();
  // Students can read standards (for assessment taking)
  allow read: if isStudent();
}
```

#### 2025-09-28: Added appSettings Collection Support
**Change**: Added security rules for new `appSettings` collection
**Reason**: Enable system-wide configuration storage (academic periods, etc.)
**Rules Added**:
```javascript
// App settings collection
match /appSettings/{settingId} {
  // Admins can read/write all settings
  allow read, write: if isAdmin();
  // Teachers can read settings (but not write)
  allow read: if isTeacher();
  // Students can read certain settings
  allow read: if isStudent() && (settingId == 'academicPeriods');
}
```

#### 2025-09-28: Fixed Student Assessment Access
**Change**: Updated assessments collection rules to allow students to read assessment documents
**Reason**: Students were getting permission denied errors when trying to view assigned assessments
**Before**:
```javascript
// Students can read assessments assigned to them
allow read: if isStudent() && resource.data.studentUid == request.auth.uid;
```
**After**:
```javascript
// Students can read any assessment (they need to see assessment content to take it)
// Assignment validation is handled at the application level
allow read: if isStudent();
```

### Current Complete Rules Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'admin';
    }
    
    function isTeacher() {
      return isAuthenticated() && (getUserData().role == 'teacher' || getUserData().role == 'admin');
    }
    
    function isStudent() {
      return isAuthenticated() && getUserData().role == 'student';
    }
    
    // Base users collection (authentication data)
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow read: if isAdmin();
      allow read: if isTeacher();
      allow write: if isAdmin();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Teachers collection
    match /teachers/{teacherId} {
      allow read: if isAuthenticated() && request.auth.uid == teacherId;
      allow read: if isAdmin();
      allow write: if isAdmin();
      allow write: if isAuthenticated() && request.auth.uid == teacherId;
    }
    
    // Students collection
    match /students/{studentId} {
      allow read: if isAuthenticated() && request.auth.uid == studentId;
      allow read: if isTeacher() || isAdmin();
      allow write: if isTeacher() || isAdmin();
    }
    
    // Goals collection
    match /goals/{goalId} {
      allow read, write: if isTeacher() || isAdmin();
      allow read: if isStudent() && resource.data.studentUid == request.auth.uid;
    }
    
    // Assessments collection
    match /assessments/{assessmentId} {
      allow read, write: if isTeacher() || isAdmin();
      allow read: if isStudent();
    }
    
    // Assessment results
    match /assessmentResults/{resultId} {
      allow read: if isTeacher() || isAdmin();
      allow read: if isStudent() && resource.data.studentUid == request.auth.uid;
      allow write: if isTeacher() || isAdmin();
      allow write: if isStudent() && request.resource.data.studentUid == request.auth.uid;
    }
    
    // Assessment assignments (junction table)
    match /assessmentAssignments/{assignmentId} {
      allow read: if isTeacher() || isAdmin();
      allow read: if isStudent() && resource.data.studentUid == request.auth.uid;
      allow write: if isTeacher() || isAdmin();
      allow update: if isStudent() && 
                       resource.data.studentUid == request.auth.uid &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'startedAt', 'completedAt', 'updatedAt']);
    }
    
    // App settings collection
    match /appSettings/{settingId} {
      allow read, write: if isAdmin();
      allow read: if isTeacher();
      allow read: if isStudent() && (settingId == 'academicPeriods');
    }
    
    // User profiles (legacy - for compatibility)
    match /userProfiles/{document} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

### Missing Rules Issues

#### Custom Standards Collection
**Issue**: No security rules defined for `customStandards` collection
**Impact**: Admins getting permission denied errors when accessing standards
**Status**: Needs to be added

#### Potential Missing Collections
- `customStandards` - Custom math standards created by teachers/admins
- `admins` - Admin-specific data collection

### Next Steps
1. Add security rules for `customStstandards` collection
2. Verify all collections have proper rules
3. Test all permission scenarios
4. Document any additional rule changes
