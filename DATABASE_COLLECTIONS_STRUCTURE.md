# JepsonMath Database Collections Structure

This document describes the actual database structure based on production data.

## Collections Overview

The database contains 9 main collections:
- `admins` - Admin user data
- `appSettings` - System-wide configuration settings
- `assessmentAssignments` - Junction table for assessment assignments  
- `assessmentResults` - Student assessment completion data
- `assessments` - Assessment templates created by teachers
- `customStandards` - Custom math standards
- `students` - Student-specific data (DEPRECATED - data moved to users)
- `teachers` - Teacher-specific data (DEPRECATED - data moved to users)
- `users` - Primary user collection (students, teachers, admins)

---

## Collection: `users` (Primary User Collection)

**Purpose**: Contains all users (students, teachers, admins) with authentication and profile data.

### Student User Object
```typescript
{
  // Authentication & Identity
  uid: "6U5COMQ2ioYAQpozuS3ZfecBDQI2",           // Firebase Auth UID (PRIMARY KEY)
  email: "s-723717356@vacavilleusd.org",          // Student email for login
  displayName: "Rebecca Morgan",                   // Full name for display
  role: "student",                                 // User role
  
  // Personal Information
  firstName: "Rebecca",
  lastName: "Morgan", 
  grade: "7",                                      // Grade level
  districtId: "vacavilleusd.org",                 // School district
  
  // Class Assignment
  assignedTeacher: "Ey2Po5PBmpg17XmRbXsUtnq521E2", // Teacher UID
  className: "6th Period - Math 7",                // Class name
  period: "6th Period",                            // Class period
  schoolOfAttendance: "6th Period - Math 7",      // School/class info
  
  // Google Classroom Integration
  googleId: "102788426812762176592",              // Google user ID
  courseId: "801308270377",                       // Google Classroom course ID
  courseName: "6th Period - Math 7",              // Google Classroom course name
  section: "6th Period",                          // Google Classroom section
  
  // IEP/504 Information
  hasIEP: false,                                  // Has IEP plan
  has504: false,                                  // Has 504 plan
  accommodations: [],                             // Array of accommodations
  currentGoals: [],                               // Array of IEP goal IDs
  
  // System Fields
  isActive: true,                                 // Account status
  createdAt: Timestamp,                           // Account creation
  lastLogin: Timestamp,                           // Last login time
  updatedAt: Timestamp                            // Last update
}
```

### Teacher User Object
```typescript
{
  // Authentication & Identity
  uid: "Ey2Po5PBmpg17XmRbXsUtnq521E2",           // Firebase Auth UID (PRIMARY KEY)
  email: "ryand@vacavilleusd.org",                // Teacher email
  displayName: "Ryan Davis - VUSD Jepson",       // Full name for display
  role: "teacher",                                // User role
  
  // Personal Information
  firstName: "Ryan",
  lastName: "Davis - VUSD Jepson",
  
  // Teaching Information
  subjects: ["Math"],                             // Subjects taught
  gradesTaught: [],                              // Grades taught
  assignedStudents: [],                          // Student UIDs (may be deprecated)
  createdAssessments: [],                        // Assessment IDs (may be deprecated)
  
  // System Fields
  isActive: true,
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

---

## Collection: `admins`

**Purpose**: Admin-specific data and permissions.

### Admin Object
```typescript
{
  // Authentication & Identity
  uid: "OQXA6hoMeLXGvQmvTff7H1zbieh2",           // Firebase Auth UID
  email: "casemanagevue@gmail.com",               // Admin email
  displayName: "Admin (rd)",                      // Display name
  role: "admin",                                  // User role
  
  // Personal Information
  firstName: "Admin",
  lastName: "(rd)",
  
  // Permissions
  permissions: [                                  // Admin permissions
    "MANAGE_SYSTEM",
    "MANAGE_USERS", 
    "VIEW_ALL_DATA"
  ],
  systemAccess: ["all"],                         // System access levels
  
  // System Fields
  isActive: true,
  createdAt: Timestamp,
  lastLogin: Timestamp,
  updatedAt: Timestamp
}
```

---

## Collection: `assessmentAssignments` (Junction Table)

**Purpose**: Links assessments to students (who gets what assessment).

### Assessment Assignment Object
```typescript
{
  // Assignment Relationship
  assessmentId: "fMV0eQLszk62XDyCL4r9",          // Points to assessment document
  studentUid: "H25BsPsjEBYbQFD7GuCAnRW4lsl1",    // Points to student UID
  assignedBy: "system-assignment-fix",            // Who assigned (teacher UID or system)
  
  // Assignment Details
  status: "assigned",                             // assigned|started|completed|overdue
  priority: "medium",                             // low|medium|high
  notes: "Auto-assigned ESA assessment to restore functionality",
  accommodations: [],                             // Student-specific accommodations
  
  // Timestamps
  assignedAt: Timestamp,                          // When assigned
  createdAt: Timestamp,                           // Record creation
  updatedAt: Timestamp                            // Last update
}
```

---

## Collection: `assessmentResults`

**Purpose**: Student completion data for assessments.

### Assessment Result Object
```typescript
{
  // Result Identity
  assessmentId: "Ydh7zwl9P27PA3XYHsB3",          // Points to assessment
  studentUid: "npq0VdqCm2WB920es0RzmEzStjH3",     // Student who completed
  goalId: "",                                     // IEP goal ID (if applicable)
  
  // Scoring
  score: 2,                                       // Points earned
  totalPoints: 6,                                 // Total possible points
  percentage: 33,                                 // Calculated percentage
  timeSpent: 3,                                   // Minutes spent
  
  // Attempt Information
  attemptNumber: 1,                               // Which attempt (1, 2, 3...)
  isRetake: false,                                // Is this a retake?
  previousAttempts: [],                           // Previous attempt data
  
  // Question Responses
  responses: [                                    // Array of question responses
    {
      questionId: "q_1757009820374_hxxfhned5",    // Question identifier
      isCorrect: false,                           // Correct/incorrect
      pointsEarned: 0,                            // Points for this question
      studentAnswer: "0"                          // Student's answer
    },
    // ... more responses
  ],
  
  // Completion Details
  completedAt: Timestamp,                         // When completed
  gradedBy: "csv-import",                         // Who/what graded it
  feedback: "",                                   // Teacher feedback
  accommodationsUsed: [],                         // Accommodations used
  uploadedFiles: [],                              // Uploaded files/photos
  
  // Migration Tracking (for CSV imports)
  migratedAt: Timestamp,                          // When imported
  migratedBy: "matrix-csv-import",                // Import source
  migrationReason: "Historical data import from matrix CSV format"
}
```

---

## Collection: `assessments`

**Purpose**: Assessment templates created by teachers.

### Assessment Object
```typescript
{
  // Assessment Identity
  title: "ESA C4",                               // Assessment name
  description: "ESA C4",                         // Description
  category: "ESA",                               // ESA|SA|PA|HW|Other
  createdBy: "Ey2Po5PBmpg17XmRbXsUtnq521E2",    // Teacher UID who created
  goalId: "",                                    // IEP goal ID (if applicable)
  
  // Academic Details
  gradeLevel: 7,                                 // Target grade
  standard: "",                                  // Overall standard (optional)
  totalPoints: 6,                                // Total possible points
  timeLimit: 0,                                  // Time limit (0 = no limit)
  instructions: "Read each question carefully and select the best answer. You may use notes and a calculator.",
  
  // Questions Array
  questions: [                                   // Array of question objects
    {
      id: "q_1757696883701_bpy2vrwii",          // Unique question ID
      questionText: "Order from least to greatest. $\\frac{10}{3}$ $\\frac{10}{12}$ $\\frac{13}{24}$ $\\frac{1}{6}$",
      questionType: "short-answer",              // Question type
      correctAnswer: "1/6 13/14 10/12 10/3",    // Correct answer
      acceptableAnswers: ["1/6 13/14 5/6 10/3"], // Alternative correct answers
      points: 1,                                 // Points for this question
      standard: "CUSTOM:7Q1.ESA-1",             // Standard for this question
      standards: ["CUSTOM:7Q1.ESA-1"],          // Standards array
      explanation: "Type in the fraction in order with 1 space between (example: 1/6 2/6 6/7 7/7)"
    },
    // ... more questions
  ],
  
  // File Upload Settings
  allowFileUpload: true,                         // Allow file uploads
  requireFileUpload: true,                       // Require file uploads
  fileUploadInstructions: "Take a clear photo of your work showing all calculations and steps.",
  maxFileSize: 10,                               // Max file size in MB
  allowedFileTypes: ["jpg,jpeg,png", "pdf"],     // Allowed file types
  photoOrientation: "landscape",                 // Photo orientation
  
  // Multi-page Settings
  requireMultiplePages: false,
  requiredPageCount: 2,
  allowExtraPages: true,
  pageLabels: [],
  
  // Retake Settings
  allowRetakes: false,                           // Allow retakes
  maxRetakes: 1,                                 // Max retake attempts
  retakeMode: "separate",                        // separate|combined
  retakeInstructions: "You may retake this assessment to improve your score.",
  
  // Legacy Fields (should be empty)
  studentSeisId: "",                             // DEPRECATED
  studentUid: "",                                // DEPRECATED
  
  // System Fields
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Collection: `customStandards`

**Purpose**: Custom math standards created by teachers.

### Custom Standard Object
```typescript
{
  // Standard Identity
  code: "7Q1.ESA-4",                            // Standard code
  name: "7Q1.ESA-4",                            // Standard name
  description: "Fractions: Add/subtract unlike denominators", // Description
  grade: "7",                                    // Grade level
  
  // System Fields
  createdBy: "OQXA6hoMeLXGvQmvTff7H1zbieh2",    // Creator UID
  isActive: true,                                // Active status
  usageCount: 0,                                 // How many times used
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Key Relationships

### How Assignments Work:
1. **Teacher creates assessment** → Saved to `assessments` collection
2. **Teacher assigns to students** → Records created in `assessmentAssignments` collection
3. **Student completes assessment** → Result saved to `assessmentResults` collection

### Data Flow:
```
assessments (templates)
    ↓
assessmentAssignments (who gets what)
    ↓  
assessmentResults (completion data)
```

### Student-Teacher Relationship:
- **Primary**: `users.assignedTeacher` field points to teacher UID
- **Secondary**: `assessmentAssignments` shows which teacher assigned what

### Question-Standard Relationship:
- **Assessment level**: `assessments.standard` (optional overall standard)
- **Question level**: `assessments.questions[].standard` (specific question standards)
- **Results level**: Question responses link to question IDs which contain standards

---

## Collection: `appSettings`

**Purpose**: System-wide configuration settings that apply to the entire application.

### App Setting Object
```typescript
{
  // Setting Identity
  id: "academicPeriods",                         // Setting identifier
  type: "academicPeriods",                       // Setting type
  
  // Academic Period Configuration
  value: {
    academicYear: "2024-2025",                   // School year
    periodType: "quarters",                      // quarters|semesters|trimesters
    periods: [                                   // Array of periods
      {
        id: "q1",                                // Period ID
        name: "Quarter 1",                       // Full name
        shortName: "Q1",                         // Short name
        startDate: "2024-08-01T00:00:00.000Z",   // Period start (ISO string)
        endDate: "2024-10-31T23:59:59.999Z"      // Period end (ISO string)
      },
      {
        id: "q2",
        name: "Quarter 2", 
        shortName: "Q2",
        startDate: "2024-11-01T00:00:00.000Z",
        endDate: "2025-01-31T23:59:59.999Z"
      },
      // ... more periods
    ]
  },
  
  // Metadata
  createdBy: "OQXA6hoMeLXGvQmvTff7H1zbieh2",     // Admin UID who created
  updatedBy: "OQXA6hoMeLXGvQmvTff7H1zbieh2",     // Admin UID who last updated
  createdAt: Timestamp,                          // Creation time
  updatedAt: Timestamp,                          // Last update time
  isActive: true,                                // Whether setting is active
  description: "Academic period configuration for 2024-2025 using quarters"
}
```

### Usage:
- **Admin Configuration**: Set via `/admin/periods` interface
- **System-wide Application**: Used by gradebook, reports, filtering
- **Automatic Loading**: Loaded on app startup and cached
- **Real-time Updates**: Changes apply immediately across all users

---

## Current State Analysis

Based on diagnostics:
- **✅ 77 users** (students, teachers, admins)
- **✅ 7 assessments** (ESA C1-C6, CH 1a Test)  
- **✅ 274 assignment records** (clean, no duplicates)
- **✅ 185 assessment results** (students completing work)
- **✅ Students properly assigned to teacher** (`assignedTeacher` field set)
- **✅ Assignment system working** (assignments created and retrievable)
