# Google OAuth2 Setup Guide

## 🎯 **Complete OAuth2 Configuration**

Your Math Games MRD app now has a **streamlined OAuth2 authentication flow**:

1. **User visits app** → **Role Selection** (Teacher/Student) → **Google Sign-In** → **Dashboard/Games**

## 📋 **Required Setup Steps**

### **Step 1: Configure OAuth Consent Screen**

**URL:** https://console.cloud.google.com/apis/credentials/consent?project=mathgamesmrd

**Settings:**
```
App name: Math Games MRD
User support email: [Your admin email]
Developer contact information: [Your email]
App domain: mathgamesmrd.web.app
Authorized domains: mathgamesmrd.web.app
```

**Required Scopes:**
```
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/classroom.courses.readonly
https://www.googleapis.com/auth/classroom.rosters.readonly
```

### **Step 2: Create OAuth2 Client ID**

**URL:** https://console.cloud.google.com/apis/credentials?project=mathgamesmrd

**Create Credentials → OAuth 2.0 Client ID:**
```
Application type: Web application
Name: Math Games MRD Web Client
Authorized JavaScript origins: https://mathgamesmrd.web.app
Authorized redirect URIs: https://mathgamesmrd.web.app/__/auth/handler
```

**Copy the Client ID** - it will look like:
`712458807273-abcd1234efgh5678ijkl9012mnop3456.apps.googleusercontent.com`

### **Step 3: Update Firebase Configuration**

**File:** `src/firebase/config.ts`

Replace this line:
```typescript
clientId: "712458807273-YOUR_CLIENT_ID_SUFFIX.apps.googleusercontent.com",
```

With your actual Client ID:
```typescript
clientId: "712458807273-abcd1234efgh5678ijkl9012mnop3456.apps.googleusercontent.com",
```

And change:
```typescript
export const OAUTH2_ENABLED = false; // Set to true once you have Client ID
```

To:
```typescript
export const OAUTH2_ENABLED = true; // OAuth2 is now configured
```

### **Step 4: Deploy Updated Configuration**

```bash
npm run build
firebase deploy --only hosting
```

## 🔄 **New Authentication Flow**

### **What Users Experience:**

1. **Visit:** https://mathgamesmrd.web.app/login
2. **Choose Role:** Teacher or Student
3. **Google Sign-In:** Popup with Google authentication
4. **Automatic Account Creation:** If first time, creates user account
5. **Redirect:** Teachers → Dashboard, Students → Games

### **Role Detection Logic:**

The app automatically determines user type based on:
- **Email Domain:** `@vacavilleusd.org` vs `@student.vacavilleusd.org`
- **User Selection:** What they chose in step 2
- **Google Workspace Directory:** (If available)

## 🗂️ **Database Structure (Simplified)**

### **Single `users` Collection:**

```javascript
{
  // Document ID: auto-generated
  firebaseUid: "firebase-auth-uid",
  email: "user@vacavilleusd.org",
  userType: "teacher" | "student",
  firstName: "John",
  lastName: "Smith",
  isActive: true,
  
  // Teacher-specific fields (only if userType === "teacher")
  role: "case-manager",
  permissions: [...],
  schoolDistrict: "Vacaville USD",
  schoolSite: "Will C. Wood High School",
  caseloadStudents: ["student-id-1", "student-id-2"],
  
  // Student-specific fields (only if userType === "student")  
  grade: "7",
  studentId: "STU123456",
  caseManager: "John Smith",
  isIEPStudent: false,
  
  // Timestamps
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  lastLogin: "2024-01-15T10:30:00Z"
}
```

**Benefits:**
- ✅ Single authentication flow
- ✅ Easier user management
- ✅ Simple teacher-student relationships
- ✅ Consistent permissions system

## 🧪 **Testing the Setup**

### **Before OAuth2 Configuration:**
- Users see setup instructions
- Fallback to email/password login
- Registration system still works

### **After OAuth2 Configuration:**
- Seamless Google sign-in
- Automatic account creation
- Role-based redirects
- Google Classroom integration ready

### **Test URLs:**
- **Main Login:** https://mathgamesmrd.web.app/login
- **Auth Tester:** https://mathgamesmrd.web.app/auth-tester
- **Old Login (Fallback):** https://mathgamesmrd.web.app/login-old

## 🔒 **Security Features**

### **Domain Restrictions:**
- OAuth consent screen limits to your domain
- Email validation for role assignment
- Teacher approval required for students

### **Permission System:**
- Role-based access control
- Resource-specific permissions
- Automatic permission assignment

### **Session Management:**
- Firebase Authentication tokens
- Automatic session refresh
- Secure sign-out

## 🚀 **What Happens Next**

### **Once OAuth2 is Configured:**

1. **Teachers can:**
   - Sign in with Google Workspace accounts
   - Access IEP management tools
   - Import students from Google Classroom
   - Assign games and track progress

2. **Students can:**
   - Sign in with school Google accounts
   - Access assigned games
   - Track their progress
   - Complete assessments

3. **Administrators can:**
   - Manage all users from single collection
   - Bulk import from Google Classroom
   - Generate reports and analytics

## ⚡ **Quick Start Checklist**

- [ ] Configure OAuth consent screen
- [ ] Create OAuth2 Client ID
- [ ] Update `src/firebase/config.ts` with Client ID
- [ ] Set `OAUTH2_ENABLED = true`
- [ ] Deploy to Firebase
- [ ] Test authentication flow
- [ ] Create first admin user
- [ ] Import student data

**Status:** Ready for OAuth2 configuration!  
**Next:** Complete Google Cloud Console setup
