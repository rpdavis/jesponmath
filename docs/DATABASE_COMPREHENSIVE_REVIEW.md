# JepsonMath Assessment System - Comprehensive Database Review

## 🗂️ **Database Architecture Overview**

### **Firebase Services Used:**
- **Firestore Database**: Primary NoSQL document database
- **Firebase Authentication**: User authentication and identity management  
- **Firebase Storage**: File and image storage for assessment uploads
- **Firebase Security Rules**: Data access control and permissions
- **Firebase Indexes**: Query optimization for complex operations

---

## 📊 **Collection Structure**

### **Core Collections:**

#### **1. `users` Collection**
**Purpose**: Base authentication and role data for all users
**Document ID**: Firebase Auth UID

```typescript
{
  uid: string,                    // Firebase Auth UID (matches document ID)
  email: string,                  // Primary email address
  displayName: string,            // Full name for display
  role: 'admin' | 'teacher' | 'student', // User role
  isActive: boolean,              // Account status
  createdAt: Timestamp,           // Account creation
  updatedAt: Timestamp,           // Last modification
  lastLogin?: Timestamp           // Last login time
}
```

#### **2. `teachers` Collection**
**Purpose**: Teacher-specific data and metadata
**Document ID**: Firebase Auth UID (same as users collection)

```typescript
{
  // Inherits all BaseUser fields
  uid: string,
  email: string,
  displayName: string,
  role: 'teacher' | 'admin',
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Teacher-specific fields
  firstName: string,
  lastName: string,
  schoolDistrict?: string,
  schoolSite?: string,
  employeeId?: string,
  teacherId?: string,
  department?: string,
  permissions?: Permission[],
  caseloadStudents?: string[],     // Array of student UIDs
  googleClassroomId?: string,
  googleWorkspaceEmail?: string
}
```

#### **3. `students` Collection**
**Purpose**: Student-specific data with class/period information
**Document ID**: Firebase Auth UID

```typescript
{
  // Inherits all BaseUser fields
  uid: string,
  email: string,
  displayName: string,
  role: 'student',
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Student-specific fields
  firstName: string,
  lastName: string,
  seisId?: string,                 // SEIS identifier
  aeriesId?: string,               // Aeries student ID
  districtId?: string,             // District identifier
  grade: string,                   // Grade level (e.g., "7", "8")
  birthdate?: string,
  schoolOfAttendance?: string,
  caseManager?: string,
  iepDate?: string,
  eligibilityStatus?: string,
  hasIEP?: boolean,
  has504?: boolean,
  
  // Class and period information
  className?: string,              // Teacher name or class name
  period?: string,                 // Class period (e.g., "Period 4")
  courseId?: string,               // Google Classroom course ID
  courseName?: string,             // Google Classroom course name
  section?: string,                // Course section
  
  // Google Classroom integration
  googleId?: string,               // Google user ID
  
  // Assessment tracking
  accommodations: string[],        // IEP accommodations
  assignedAssessments: string[],   // Array of assessment IDs assigned to student
  completedAssessments: string[],  // Array of completed assessment IDs
  currentGoals: string[],          // Array of active goal IDs
  
  // Teacher assignment
  assignedTeacher?: string         // UID of assigned teacher
}
```

#### **4. `goals` Collection**
**Purpose**: IEP goals linked to students
**Document ID**: Auto-generated

```typescript
{
  id: string,                      // Document ID
  studentSeisId: string,           // Student SEIS ID
  studentUid?: string,             // Student Firebase UID
  category: 'HW' | 'Assign' | 'ESA' | 'SA' | 'PA' | 'Other',
  areaOfNeed: string,
  goalNumber: string,
  baseline: string,
  goalText: string,
  standard: string,                // Math standard (e.g., "7.EE.4a")
  gradeLevel: number,              // Extracted from standard
  startDate: string,
  endDate: string,
  personResponsible: string,
  purposeOfGoal?: string,
  objectives: Objective[],
  progressReports: ProgressReport[],
  currentProgress: string,
  isActive: boolean,
  isMet: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **5. `assessments` Collection**
**Purpose**: Assessment templates and assignments
**Document ID**: Auto-generated

```typescript
{
  id: string,                      // Document ID
  goalId: string,                  // Associated goal ID
  studentSeisId?: string,          // Legacy field (being phased out)
  studentUid?: string,             // Legacy field (being phased out)
  createdBy: string,               // Teacher UID who created assessment
  title: string,
  description: string,
  standard?: string,               // Optional standard for entire assessment
  gradeLevel: number,
  category: 'HW' | 'Assign' | 'ESA' | 'SA' | 'PA' | 'Other',
  questions: AssessmentQuestion[],
  totalPoints: number,
  timeLimit?: number,              // in minutes
  instructions: string,
  accommodations: string[],
  
  // File upload options
  allowFileUpload?: boolean,
  requireFileUpload?: boolean,
  fileUploadInstructions?: string,
  maxFileSize?: number,            // Max file size in MB
  allowedFileTypes?: string[],     // Allowed file extensions
  photoOrientation?: 'portrait' | 'landscape',
  
  // Multi-page photo capture
  requireMultiplePages?: boolean,
  requiredPageCount?: number,
  pageLabels?: string[],
  allowExtraPages?: boolean,
  
  // Retake options
  allowRetakes?: boolean,
  maxRetakes?: number,
  retakeMode?: 'separate' | 'combined',
  retakeInstructions?: string,
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
  assignedAt?: Timestamp
}
```

#### **6. `assessmentResults` Collection**
**Purpose**: Completed assessment data with scores and responses
**Document ID**: Auto-generated

```typescript
{
  id: string,                      // Document ID
  assessmentId: string,            // Reference to assessment
  studentSeisId: string,           // Student SEIS ID (for legacy compatibility)
  studentUid: string,              // Student Firebase UID (primary identifier)
  goalId: string,                  // Associated goal ID
  responses: AssessmentResponse[], // Individual question responses
  score: number,                   // Total score earned
  totalPoints: number,             // Total possible points
  percentage: number,              // Score percentage
  timeSpent: number,               // Time in minutes
  completedAt: Timestamp,          // Completion timestamp
  gradedBy: string,                // Who graded (auto-graded or teacher UID)
  feedback: string,                // Teacher feedback
  accommodationsUsed: string[],    // Accommodations used for this attempt
  
  // Retake tracking
  attemptNumber?: number,          // Which attempt (1, 2, 3, etc.)
  isRetake?: boolean,              // Whether this is a retake
  previousAttempts?: AssessmentAttempt[], // For combined mode
  
  // File uploads
  uploadedFiles?: UploadedFile[],  // Student-uploaded files/photos
  
  // Migration tracking
  studentEmail?: string,
  migratedAt?: Timestamp,
  migratedBy?: string,
  migrationReason?: string
}
```

---

## 🔄 **Database Operations**

### **Create Operations**

#### **Assessment Creation (Template-Based)**
**Location**: `src/firebase/iepServices.ts` → `createAssessment()`

```typescript
// Creates ONE assessment template that can be assigned to multiple students
const assessmentData = {
  ...data,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
const docRef = await addDoc(collection(db, 'assessments'), assessmentData);

// Then updates each assigned student's assignedAssessments array
await updateDoc(doc(db, 'students', studentUid), {
  assignedAssessments: arrayUnion(assessmentId)
});
```

#### **Student Creation**
**Location**: `src/firebase/userServices.ts` → `createStudent()`

```typescript
// Dual-collection approach for data separation
const batch = writeBatch(db);

// 1. Create base user record
batch.set(doc(db, COLLECTIONS.USERS, uid), baseUserData);

// 2. Create student-specific record
batch.set(doc(db, COLLECTIONS.STUDENTS, uid), studentData);

await batch.commit();
```

#### **Assessment Result Saving**
**Location**: `src/firebase/iepServices.ts` → `saveAssessmentResult()`

```typescript
const docRef = await addDoc(collection(db, 'assessmentResults'), {
  ...resultData,
  completedAt: serverTimestamp()
});
```

### **Read Operations**

#### **Assessment Retrieval by Student**
**Location**: `src/firebase/iepServices.ts` → `getAssessmentsByStudent()`

```typescript
// New template-based approach: Query students collection for assignedAssessments
const studentDoc = await getDoc(doc(db, 'students', studentId));
const assignedAssessmentIds = studentDoc.data()?.assignedAssessments || [];

// Then fetch each assessment
const assessments = await Promise.all(
  assignedAssessmentIds.map(id => getDoc(doc(db, 'assessments', id)))
);
```

#### **Assessment Results Retrieval**
**Location**: `src/firebase/iepServices.ts` → `getAssessmentResultsByStudent()`

```typescript
// Dual-query approach to catch all results
const queries = [
  query(collection(db, 'assessmentResults'), where('studentSeisId', '==', studentId)),
  query(collection(db, 'assessmentResults'), where('studentUid', '==', studentId))
];

const results = await Promise.all(queries.map(q => getDocs(q)));
// Deduplicate and sort results
```

#### **Teacher's Students**
**Location**: `src/firebase/userServices.ts` → `getStudentsByTeacher()`

```typescript
const q = query(
  collection(db, COLLECTIONS.STUDENTS),
  where('assignedTeacher', '==', teacherUid),
  where('isActive', '==', true)
);
```

### **Update Operations**

#### **Assessment Assignment**
**Location**: `src/firebase/iepServices.ts` → `assignAssessmentToStudent()`

```typescript
// Add assessment ID to student's assignedAssessments array
await updateDoc(doc(db, 'students', studentUid), {
  assignedAssessments: arrayUnion(assessmentId)
});
```

#### **Assessment Unassignment**
**Location**: `src/firebase/iepServices.ts` → `unassignAssessmentFromStudent()`

```typescript
// Remove assessment ID from student's assignedAssessments array
await updateDoc(doc(db, 'students', studentUid), {
  assignedAssessments: arrayRemove(assessmentId)
});
```

#### **Assessment Result Updates (Manual Grading)**
**Location**: `src/components/assessments/AssessmentResult.vue`

```typescript
// Update specific response with manual adjustment
await updateDoc(doc(db, 'assessmentResults', resultId), {
  [`responses.${responseIndex}.pointsEarned`]: newPoints,
  [`responses.${responseIndex}.manuallyAdjusted`]: true,
  [`responses.${responseIndex}.adjustedBy`]: teacherEmail,
  [`responses.${responseIndex}.adjustedAt`]: serverTimestamp(),
  [`responses.${responseIndex}.adjustmentReason`]: reason,
  lastModified: serverTimestamp(),
  modifiedBy: teacherEmail
});
```

### **Delete Operations**

#### **Cascading Assessment Deletion**
**Location**: `src/firebase/iepServices.ts` → `deleteAssessment()`

```typescript
// 1. Find all results for this assessment
const resultsQuery = query(
  collection(db, 'assessmentResults'),
  where('assessmentId', '==', assessmentId)
);

// 2. Delete all results and assessment in batch
const batch = writeBatch(db);
resultsSnapshot.docs.forEach(resultDoc => {
  batch.delete(resultDoc.ref);
});
batch.delete(doc(db, 'assessments', assessmentId));
await batch.commit();
```

#### **Cascading Student Deletion**
**Location**: `src/firebase/userServices.ts` → `deleteStudent()`

```typescript
// 1. Get all student identifiers
const studentIdentifiers = [uid, googleId, seisId];

// 2. Find all assessment results
const resultQueries = [
  query(collection(db, 'assessmentResults'), where('studentUid', '==', uid)),
  query(collection(db, 'assessmentResults'), where('studentSeisId', 'in', studentIdentifiers))
];

// 3. Delete storage files
for (const storagePath of storagePaths) {
  const fileRef = storageRef(storage, storagePath);
  await deleteObject(fileRef);
}

// 4. Batch delete all related data
const batches = [];
let currentBatch = writeBatch(db);
// Delete results, clean assignment references, delete student records
```

---

## 🔐 **Security Rules**

### **Current Rules Structure**
**Location**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isAdmin() { return isAuthenticated() && getUserData().role == 'admin'; }
    function isTeacher() { return isAuthenticated() && (getUserData().role == 'teacher' || getUserData().role == 'admin'); }
    function isStudent() { return isAuthenticated() && getUserData().role == 'student'; }
    
    // Collection-specific rules
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin() || isTeacher());
      allow write: if isAdmin() || (isAuthenticated() && request.auth.uid == userId);
    }
    
    match /students/{studentId} {
      allow read: if isAuthenticated() && request.auth.uid == studentId;
      allow read: if isTeacher() || isAdmin();
      allow write: if isTeacher() || isAdmin();
    }
    
    match /assessmentResults/{resultId} {
      allow read: if isTeacher() || isAdmin();
      allow read: if isStudent() && resource.data.studentUid == request.auth.uid;
      allow write: if isTeacher() || isAdmin();
      allow write: if isStudent() && request.resource.data.studentUid == request.auth.uid;
    }
    
    // Development rule (TODO: Remove in production)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### **Access Patterns**

#### **Admin Access:**
- ✅ Full read/write access to all collections
- ✅ User management capabilities
- ✅ System-wide visibility

#### **Teacher Access:**
- ✅ Read/write students assigned to them
- ✅ Read/write goals for their students
- ✅ Read/write assessments they created
- ✅ Read/write assessment results for their students

#### **Student Access:**
- ✅ Read their own user data
- ✅ Read their own student record
- ✅ Read assessments assigned to them
- ✅ Write assessment results for their own submissions
- ✅ Read their own assessment results

---

## 📈 **Database Indexes**

### **Current Composite Indexes**
**Location**: `firestore.indexes.json`

#### **Users Collection Indexes:**
```json
{
  "fields": [
    {"fieldPath": "userType", "order": "ASCENDING"},
    {"fieldPath": "isActive", "order": "ASCENDING"},
    {"fieldPath": "lastName", "order": "ASCENDING"}
  ]
}
```

#### **Students Collection Indexes:**
```json
{
  "fields": [
    {"fieldPath": "assignedTeacher", "order": "ASCENDING"},
    {"fieldPath": "isActive", "order": "ASCENDING"},
    {"fieldPath": "lastName", "order": "ASCENDING"}
  ]
}
```

#### **Assessment Results Indexes:**
```json
{
  "fields": [
    {"fieldPath": "studentSeisId", "order": "ASCENDING"},
    {"fieldPath": "completedAt", "order": "DESCENDING"}
  ]
}
```

#### **Assessments Index:**
```json
{
  "fields": [
    {"fieldPath": "createdBy", "order": "ASCENDING"},
    {"fieldPath": "createdAt", "order": "DESCENDING"}
  ]
}
```

---

## ⚠️ **Data Validation & Error Handling**

### **Validation Patterns**

#### **User Data Validation**
**Location**: `src/types/users.ts`

```typescript
export function validateTeacherData(data: CreateTeacherData): string[] {
  const errors: string[] = [];
  
  if (!data.email) errors.push('Email is required');
  if (!data.firstName) errors.push('First name is required');
  if (!data.lastName) errors.push('Last name is required');
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  return errors;
}
```

#### **Assessment Data Validation**
**Patterns Used:**
- ✅ Required field validation before database operations
- ✅ Type checking with TypeScript interfaces
- ✅ Email format validation with regex
- ✅ Duplicate prevention through unique constraints
- ✅ Role-based access validation

### **Error Handling Patterns**

#### **Try-Catch with Logging**
```typescript
export async function createStudent(studentData: CreateStudentData): Promise<Student> {
  try {
    // Validation
    const errors = validateStudentData(studentData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    // Database operations...
    
    console.log('✅ Student created successfully:', student.email);
    return student;
  } catch (error: any) {
    console.error('❌ Error creating student:', error);
    throw new Error(`Failed to create student: ${error.message}`);
  }
}
```

#### **Batch Operation Error Recovery**
```typescript
// Handle Firestore batch limits (500 operations max)
const batches = [];
let currentBatch = writeBatch(db);
let operationCount = 0;

results.forEach(result => {
  currentBatch.delete(result.ref);
  operationCount++;
  
  if (operationCount >= 450) { // Safety margin
    batches.push(currentBatch);
    currentBatch = writeBatch(db);
    operationCount = 0;
  }
});
```

---

## 🔄 **Data Migration & Re-grading**

### **Assessment Migration Service**
**Location**: `src/firebase/assessmentMigrationService.ts`

#### **Purpose**: Handle re-grading when assessments are updated

```typescript
export const migrateAssessmentResults = async (
  assessmentId: string, 
  updatedAssessment: Assessment,
  migratedBy: string
): Promise<MigrationResult> => {
  
  // 1. Get existing results
  const existingResults = await getExistingResults(assessmentId);
  
  // 2. Re-grade each result
  const migrations = await Promise.all(
    existingResults.map(result => regradeResult(result, updatedAssessment, migratedBy))
  );
  
  // 3. Update results in batch
  const batch = writeBatch(db);
  migrations.forEach(({ resultId, updatedResult }) => {
    batch.update(doc(db, 'assessmentResults', resultId), updatedResult);
  });
  
  await batch.commit();
};
```

---

## 📊 **Storage Architecture**

### **Firebase Storage Structure**
```
/assessments/
  /{studentUid}/
    /{assessmentId}/
      /{timestamp}_{filename}
```

### **File Upload Handling**
**Location**: `src/components/assessments/AssessmentTaking.vue`

```typescript
// Upload file to Firebase Storage
const storageRef = ref(storage, `assessments/${studentId}/${assessmentId}/${fileName}`);
await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(storageRef);

// Save file metadata to Firestore
const fileData: UploadedFile = {
  id: fileId,
  fileName,
  originalName: file.name,
  fileSize: file.size,
  fileType: file.type,
  uploadUrl: downloadURL,
  uploadedAt: serverTimestamp()
};
```

---

## 🎯 **Performance Optimizations**

### **Query Optimizations**

#### **1. JavaScript Sorting Instead of Firestore Ordering**
```typescript
// Avoid composite index requirements
const assessments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
assessments.sort((a, b) => {
  const aTime = a.createdAt?.seconds || 0;
  const bTime = b.createdAt?.seconds || 0;
  return new Date(bTime).getTime() - new Date(aTime).getTime();
});
```

#### **2. Batch Operations for Large Deletions**
```typescript
// Handle Firestore's 500-operation batch limit
const batches = [];
let currentBatch = writeBatch(db);
let operationCount = 0;

items.forEach(item => {
  currentBatch.delete(item.ref);
  operationCount++;
  
  if (operationCount >= 450) {
    batches.push(currentBatch);
    currentBatch = writeBatch(db);
    operationCount = 0;
  }
});
```

#### **3. Parallel Query Execution**
```typescript
// Execute multiple queries simultaneously
const queries = [
  getDocs(query1),
  getDocs(query2),
  getDocs(query3)
];
const results = await Promise.all(queries);
```

---

## 🚨 **Known Issues & Technical Debt**

### **1. Legacy Field Dependencies**
- **Issue**: `studentSeisId` still used alongside `studentUid`
- **Impact**: Dual queries required for assessment results
- **Solution**: Gradual migration to UID-only system

### **2. Development Security Rule**
```javascript
// TODO: Remove this in production
match /{document=**} {
  allow read, write: if true;
}
```
- **Risk**: Open access in development
- **Action**: Must be removed before production deployment

### **3. Index Requirements**
- **Issue**: Some queries removed `orderBy` to avoid index requirements
- **Impact**: Client-side sorting required
- **Solution**: Create appropriate composite indexes

### **4. File Storage Cleanup**
- **Status**: ✅ Fixed - Implemented in `deleteStudent()` function
- **Previous Issue**: Orphaned files when students deleted
- **Solution**: Cascading deletion includes storage cleanup

---

## 📋 **Data Integrity Measures**

### **1. Referential Integrity**
- **Assessment → Student**: Tracked via `assignedAssessments` array
- **Results → Assessment**: Foreign key via `assessmentId`
- **Results → Student**: Dual identifiers (`studentUid` + `studentSeisId`)
- **Goals → Student**: Linked via `studentSeisId` and `studentUid`

### **2. Cascading Deletes**
- ✅ **Assessment Deletion**: Removes all associated results
- ✅ **Student Deletion**: Removes results, files, and assignment references
- ✅ **Storage Cleanup**: Deletes uploaded files when parent records deleted

### **3. Data Validation**
- ✅ **Email Uniqueness**: Cross-collection validation
- ✅ **Required Fields**: Validated before database writes
- ✅ **Type Safety**: TypeScript interfaces enforce structure
- ✅ **Role Validation**: Security rules enforce access patterns

---

## 🔮 **Future Considerations**

### **1. Database Scaling**
- **Current**: Single Firestore database
- **Future**: Consider regional databases for performance
- **Monitoring**: Track read/write operations and costs

### **2. Search Capabilities**
- **Current**: Simple field-based queries
- **Future**: Full-text search with Algolia integration
- **Use Cases**: Search assessments by content, student names

### **3. Analytics & Reporting**
- **Current**: Real-time queries for dashboards
- **Future**: Data warehouse for complex analytics
- **Tools**: BigQuery integration for advanced reporting

### **4. Backup & Recovery**
- **Current**: Firebase automatic backups
- **Future**: Custom backup strategies for compliance
- **Requirements**: FERPA compliance for student data

---

## 📊 **Database Statistics**

### **Current Collections:**
- **users**: ~50-100 documents
- **teachers**: ~10-20 documents  
- **students**: ~30-80 documents
- **goals**: ~100-500 documents
- **assessments**: ~50-200 documents
- **assessmentResults**: ~200-1000 documents

### **Query Patterns:**
- **Most Frequent**: Student assessment retrieval
- **Most Complex**: Assessment result aggregation by teacher
- **Most Critical**: Real-time assessment taking and submission

### **Storage Usage:**
- **Assessment Files**: ~100MB-1GB per month
- **Student Photos**: ~10-50MB per assessment
- **Total Estimated**: ~500MB-5GB annually

---

## 🎯 **Conclusion**

The JepsonMath Assessment System uses a well-structured Firebase architecture with:

✅ **Strengths:**
- Clear separation of concerns with multiple collections
- Robust security rules with role-based access
- Comprehensive error handling and validation
- Efficient template-based assessment system
- Proper cascading deletes and data cleanup

⚠️ **Areas for Improvement:**
- Remove development security rules before production
- Complete migration from legacy SEIS-based queries
- Implement comprehensive backup strategy
- Add performance monitoring and alerting

The database is well-designed for the current scale and provides a solid foundation for future growth and feature additions.

---

**Last Updated**: January 2025 - JepsonMath Assessment System v1.0.4
**Document Version**: 1.0
**Next Review**: March 2025
