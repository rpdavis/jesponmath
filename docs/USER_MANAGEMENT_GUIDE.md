# Math Games MRD - User Management Guide

## 🗂️ **User Collection Structure**

### **Collection:** `users`
**Location:** Firestore Database → `users` collection

---

## 👨‍🏫 **Teacher User Fields**

### **Required Fields:**
```javascript
{
  // Base User Fields
  id: "auto-generated-doc-id",           // Firestore document ID
  firebaseUid: "firebase-auth-uid",      // Firebase Authentication UID
  email: "teacher@vacavilleusd.org",     // Primary email address
  userType: "teacher",                   // Always "teacher" for teachers
  firstName: "John",                     // First name
  lastName: "Smith",                     // Last name
  isActive: true,                        // Account status (true/false)
  createdAt: "2024-01-15T10:30:00Z",    // Account creation timestamp
  updatedAt: "2024-01-15T10:30:00Z",    // Last update timestamp
  lastLogin: "2024-01-15T10:30:00Z",    // Last login timestamp

  // Teacher-Specific Required Fields
  schoolDistrict: "Vacaville USD",       // School district name
  schoolSite: "Will C. Wood High School", // Specific school site
  role: "case-manager",                  // Teacher role (see roles below)
  permissions: [                         // Array of permission objects
    {
      resource: "students",
      actions: ["read", "write"]
    }
  ]
}
```

### **Optional Fields:**
```javascript
{
  // Optional Teacher Fields
  employeeId: "EMP12345",                // District employee ID
  teacherId: "TCH001",                   // Unique teacher identifier
  department: "Special Education",        // Department/subject area
  caseloadStudents: ["SEIS001", "SEIS002"], // Array of student SEIS IDs
  googleClassroomId: "classroom-id",     // Google Classroom teacher ID
  googleWorkspaceEmail: "john@vacaville.k12.ca.us" // Google Workspace email
}
```

---

## 🎓 **Student User Fields**

### **Required Fields:**
```javascript
{
  // Base User Fields
  id: "auto-generated-doc-id",           // Firestore document ID
  firebaseUid: "firebase-auth-uid",      // Firebase Authentication UID
  email: "student@vacavilleusd.org",     // Student email or generated email
  userType: "student",                   // Always "student" for students
  firstName: "Jane",                     // First name
  lastName: "Doe",                       // Last name
  isActive: false,                       // Requires teacher approval initially
  createdAt: "2024-01-15T10:30:00Z",    // Account creation timestamp
  updatedAt: "2024-01-15T10:30:00Z",    // Last update timestamp
  lastLogin: "2024-01-15T10:30:00Z",    // Last login timestamp

  // Student-Specific Required Fields
  grade: "7",                            // Current grade level
  schoolSite: "Will C. Wood High School", // School site
  isIEPStudent: false                    // Whether student has IEP
}
```

### **Optional Fields:**
```javascript
{
  // Optional Student Fields
  seisId: "SEIS001",                     // Special Education Information System ID
  studentId: "STU123456",                // District student ID
  caseManager: "John Smith",             // Case manager name
  teacherId: "TCH001",                   // Assigned teacher ID
  parentEmail: "parent@email.com",       // Parent/guardian email
  studentEmail: "jane.doe@vacaville.k12.ca.us", // Student's school email
  accommodations: ["Extended time", "Small group"], // IEP accommodations
  googleClassroomId: "classroom-student-id", // Google Classroom student ID
  enrolledClasses: ["class1", "class2"]  // Array of Google Classroom class IDs
}
```

---

## 🔐 **Teacher Roles & Permissions**

### **Available Roles:**

#### **1. `administrator`**
**Description:** Full system access, can manage all users and data
**Permissions:**
- **Students:** read, write, delete, admin
- **Goals:** read, write, delete, admin  
- **Assessments:** read, write, delete, admin
- **Reports:** read, write, admin
- **IEP Manager:** read, write, admin

#### **2. `case-manager`**
**Description:** Manages IEP students, goals, and assessments
**Permissions:**
- **Students:** read, write
- **Goals:** read, write
- **Assessments:** read, write
- **Reports:** read, write
- **IEP Manager:** read, write

#### **3. `special-education`**
**Description:** Special education teacher with IEP access
**Permissions:**
- **Students:** read, write
- **Goals:** read, write
- **Assessments:** read, write
- **Reports:** read
- **IEP Manager:** read

#### **4. `general-education`**
**Description:** General education teacher with limited access
**Permissions:**
- **Students:** read
- **Goals:** read
- **Assessments:** read, write
- **Reports:** read
- **IEP Manager:** read

#### **5. `support-staff`**
**Description:** Support staff with read-only access
**Permissions:**
- **Students:** read
- **Goals:** read
- **Assessments:** read
- **Reports:** read
- **IEP Manager:** read

---

## 🛠️ **Admin User Management Tasks**

### **Creating an Admin User:**

1. **Register as Administrator:**
   - Go to: https://mathgamesmrd.web.app/register
   - Select "Teacher"
   - Choose "Administrator" role
   - Complete registration

2. **Manual Database Creation:**
   ```javascript
   // Add to Firestore users collection
   {
     firebaseUid: "your-firebase-uid",
     email: "admin@vacavilleusd.org",
     userType: "teacher",
     firstName: "Admin",
     lastName: "User",
     role: "administrator",
     schoolDistrict: "Vacaville USD",
     schoolSite: "District Office",
     isActive: true,
     permissions: [
       { resource: "students", actions: ["read", "write", "delete", "admin"] },
       { resource: "goals", actions: ["read", "write", "delete", "admin"] },
       { resource: "assessments", actions: ["read", "write", "delete", "admin"] },
       { resource: "reports", actions: ["read", "write", "admin"] },
       { resource: "iep-manager", actions: ["read", "write", "admin"] }
     ]
   }
   ```

### **Managing Users:**

#### **Approve Student Accounts:**
```javascript
// Update student document
{
  isActive: true,
  updatedAt: serverTimestamp(),
  approvedBy: "admin-user-id",
  approvedAt: serverTimestamp()
}
```

#### **Assign Students to Teachers:**
```javascript
// Update student document
{
  teacherId: "teacher-user-id",
  caseManager: "Teacher Name",
  updatedAt: serverTimestamp()
}

// Update teacher's caseload
{
  caseloadStudents: ["student-seis-id-1", "student-seis-id-2"],
  updatedAt: serverTimestamp()
}
```

#### **Bulk Import Students:**
Use the IEP Manager at: https://mathgamesmrd.web.app/iep-manager

---

## 🔍 **Permission System**

### **Resources:**
- `students` - Student data management
- `goals` - IEP goals management  
- `assessments` - Assessment creation/assignment
- `reports` - Progress reports and analytics
- `iep-manager` - IEP data import/export

### **Actions:**
- `read` - View data
- `write` - Create/edit data
- `delete` - Remove data
- `admin` - Full administrative access

### **Permission Checking:**
The system automatically checks permissions based on user role and the `permissions` array in their user document.

---

## 📊 **Database Queries for Admin**

### **Get All Teachers:**
```javascript
// Firestore query
collection('users')
  .where('userType', '==', 'teacher')
  .where('isActive', '==', true)
```

### **Get Students Needing Approval:**
```javascript
// Firestore query  
collection('users')
  .where('userType', '==', 'student')
  .where('isActive', '==', false)
```

### **Get Students by Grade:**
```javascript
// Firestore query
collection('users')
  .where('userType', '==', 'student')
  .where('grade', '==', '7')
  .where('isActive', '==', true)
```

---

## 🚀 **Getting Started as Admin**

1. **Create your admin account** using the registration system
2. **Access the Auth Tester** to verify permissions
3. **Use IEP Manager** to import student data from CSV
4. **Approve pending student registrations**
5. **Assign students to appropriate teachers**
6. **Configure Google OAuth2** for enhanced functionality

**Admin Dashboard:** https://mathgamesmrd.web.app/dashboard (after login)

---

## 🔐 **OAuth2 Integration Benefits**

Once OAuth2 is configured:
- **Single Sign-On** with Google Workspace
- **Automatic user creation** from Google directory
- **Google Classroom integration** for roster imports
- **Enhanced security** with domain restrictions
- **Seamless user experience** for teachers and students

The system is designed to work with or without OAuth2, so you can start managing users immediately!
