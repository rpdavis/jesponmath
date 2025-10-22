# Teacher Permission Issue Fix

## Issue Summary
Teachers were unable to add students to their classes, either through Google Classroom import or manual entry. They were encountering permission errors when attempting to create student records.

## Root Cause
The issue was caused by **Firestore security rules** that were too restrictive:

### The Problem
When creating a student, the application performs a batch write to **two Firestore collections**:
1. **`users` collection** - Contains basic user authentication data (uid, email, role, etc.)
2. **`students` collection** - Contains student-specific data (grade, assessments, goals, etc.)

**Previous Firestore Rules:**
```javascript
// users collection - Line 35
allow write: if isAdmin();  // ❌ Only admins could write to users collection
```

This meant that teachers could write to the `students` collection, but the entire batch operation failed because they couldn't write to the `users` collection.

## Solution Applied

### 1. Updated Firestore Security Rules
Modified `/firestore.rules` to allow teachers to **create** new student user records (but not modify existing users or change roles):

```javascript
// Base users collection (authentication data)
match /users/{userId} {
  // READ permissions (unchanged)
  allow read: if isAuthenticated() && request.auth.uid == userId;
  allow read: if isAdmin();
  allow read: if isTeacher();
  
  // CREATE permissions - NEW
  allow create: if isTeacher() && request.resource.data.role == 'student';
  allow create: if isAdmin();
  
  // UPDATE permissions - MORE SPECIFIC
  allow update: if isAuthenticated() && request.auth.uid == userId && 
                   (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'uid']));
  allow update: if isAdmin();
  
  // DELETE permissions
  allow delete: if isAdmin();
}
```

**Key Security Features:**
- Teachers can only CREATE users with role='student' (not teachers or admins)
- Teachers cannot UPDATE existing user records (except their own profile)
- Teachers cannot DELETE user records
- Users can update their own profile but cannot change their role or uid
- Admins retain full permissions

### 2. Updated Role Permissions
Modified `/src/config/roles.ts` to reflect that teachers have `MANAGE_STUDENTS` permission:

**Before:**
```typescript
[ROLES.TEACHER]: [
  // ...
  // REMOVED: MANAGE_STUDENTS (can't add/delete students)
],
```

**After:**
```typescript
[ROLES.TEACHER]: [
  // ...
  PERMISSIONS.MANAGE_STUDENTS, // Can add/manage their own students
],
```

### 3. Deployed to Firebase
The updated Firestore rules were deployed successfully:
```bash
firebase deploy --only firestore:rules
✔ Deploy complete!
```

## What Teachers Can Now Do
✅ Add students manually through the Student Management interface
✅ Import students from Google Classroom
✅ View and edit their assigned students
✅ Assign assessments to students
✅ View student results and progress

## What Teachers Still Cannot Do (Security Maintained)
❌ Create teacher or admin accounts
❌ Modify other teachers' accounts
❌ Change user roles
❌ Delete user accounts
❌ Access students not assigned to them (at data level)

## Testing
To verify the fix:
1. Log in as a teacher account
2. Navigate to Student Management
3. Try adding a student manually
4. Try importing from Google Classroom
5. Both should now work without permission errors

## Technical Details
- **Files Modified:**
  - `firestore.rules` - Updated security rules for users collection
  - `src/config/roles.ts` - Added MANAGE_STUDENTS permission to teacher role
  
- **Collections Affected:**
  - `users` - Now allows create operations for teachers (student role only)
  - `students` - Already had correct permissions
  
- **Functions Involved:**
  - `createStudent()` in `src/firebase/userServices.ts`
  - Batch write operation that creates both user and student records

## Date Fixed
October 20, 2025

