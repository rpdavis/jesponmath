// Firebase services for teacher and student management
// Separate collections with proper data structure

import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import { auth, db } from './config';
import { 
  COLLECTIONS, 
  validateTeacherData, 
  validateStudentData,
  type Teacher, 
  type Student, 
  type BaseUser,
  type CreateTeacherData,
  type CreateStudentData,
  type UserSearchFilters,
  type UserStats,
  type BulkImportResult
} from '@/types/users';
import { ROLES, assignRoleFromEmail } from '@/config/roles';

// ==================== TEACHER SERVICES ====================

export async function createTeacher(teacherData: CreateTeacherData, password?: string): Promise<Teacher> {
  // Validate data
  const errors = validateTeacherData(teacherData);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // Check if email already exists in students collection
  const studentsQuery = query(
    collection(db, COLLECTIONS.STUDENTS),
    where('email', '==', teacherData.email)
  );
  const studentsSnapshot = await getDocs(studentsQuery);
  
  if (!studentsSnapshot.empty) {
    throw new Error(`Email ${teacherData.email} already exists as a student. Cannot create teacher with same email.`);
  }

  try {
    let userCredential;
    let uid: string;

    // Create Firebase Auth user if password provided
    if (password) {
      userCredential = await createUserWithEmailAndPassword(auth, teacherData.email, password);
      uid = userCredential.user.uid;
      
      // Update Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName: teacherData.displayName || `${teacherData.firstName} ${teacherData.lastName}`
      });
    } else {
      // Generate UID for external creation (admin-created accounts)
      uid = doc(collection(db, COLLECTIONS.TEACHERS)).id;
    }

    // Create base user record
    const baseUser: BaseUser = {
      uid,
      email: teacherData.email,
      displayName: teacherData.displayName || `${teacherData.firstName} ${teacherData.lastName}`,
      role: teacherData.role || ROLES.TEACHER,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create teacher-specific record
    const teacher: Teacher = {
      ...baseUser,
      role: teacherData.role || ROLES.TEACHER,
      firstName: teacherData.firstName,
      lastName: teacherData.lastName,
      aeriesId: teacherData.aeriesId,
      schoolId: teacherData.schoolId,
      department: teacherData.department,
      subjects: teacherData.subjects || ['Math'],
      gradesTaught: teacherData.gradesTaught || [],
      phoneNumber: teacherData.phoneNumber,
      assignedStudents: [],
      createdAssessments: []
    };

    // Save to both collections
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.USERS, uid), baseUser);
    batch.set(doc(db, COLLECTIONS.TEACHERS, uid), teacher);
    await batch.commit();

    console.log('✅ Teacher created:', teacher.email);
    return teacher;
  } catch (error: any) {
    console.error('❌ Error creating teacher:', error);
    throw new Error(`Failed to create teacher: ${error.message}`);
  }
}

export async function getTeacher(uid: string): Promise<Teacher | null> {
  try {
    const teacherDoc = await getDoc(doc(db, COLLECTIONS.TEACHERS, uid));
    if (teacherDoc.exists()) {
      return { uid, ...teacherDoc.data() } as Teacher;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting teacher:', error);
    throw error;
  }
}

export async function updateTeacher(uid: string, updates: Partial<Teacher>): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Update base user data if needed
    const baseUpdates: Partial<BaseUser> = {};
    if (updates.displayName) baseUpdates.displayName = updates.displayName;
    if (updates.email) baseUpdates.email = updates.email;
    if (updates.role) baseUpdates.role = updates.role;
    if (updates.isActive !== undefined) baseUpdates.isActive = updates.isActive;
    
    if (Object.keys(baseUpdates).length > 0) {
      baseUpdates.updatedAt = serverTimestamp();
      batch.update(doc(db, COLLECTIONS.USERS, uid), baseUpdates);
    }
    
    // Update teacher-specific data
    const teacherUpdates = { ...updates, updatedAt: serverTimestamp() };
    batch.update(doc(db, COLLECTIONS.TEACHERS, uid), teacherUpdates);
    
    await batch.commit();
    console.log('✅ Teacher updated:', uid);
  } catch (error) {
    console.error('❌ Error updating teacher:', error);
    throw error;
  }
}

export async function deleteTeacher(uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTIONS.USERS, uid));
    batch.delete(doc(db, COLLECTIONS.TEACHERS, uid));
    await batch.commit();
    
    console.log('✅ Teacher deleted:', uid);
  } catch (error) {
    console.error('❌ Error deleting teacher:', error);
    throw error;
  }
}

export async function getAllTeachers(filters?: UserSearchFilters): Promise<Teacher[]> {
  try {
    let q = query(collection(db, COLLECTIONS.TEACHERS));
    
    // Apply filters
    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    if (filters?.schoolId) {
      q = query(q, where('schoolId', '==', filters.schoolId));
    }
    if (filters?.department) {
      q = query(q, where('department', '==', filters.department));
    }
    
    // Order by last name
    q = query(q, orderBy('lastName'));
    
    const snapshot = await getDocs(q);
    const teachers = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as Teacher[];
    
    // Apply search filter (client-side)
    if (filters?.searchQuery) {
      const searchQuery = filters.searchQuery.toLowerCase();
      return teachers.filter(teacher =>
        teacher.firstName.toLowerCase().includes(searchQuery) ||
        teacher.lastName.toLowerCase().includes(searchQuery) ||
        teacher.email.toLowerCase().includes(searchQuery) ||
        teacher.aeriesId?.toLowerCase().includes(searchQuery)
      );
    }
    
    return teachers;
  } catch (error) {
    console.error('❌ Error getting teachers:', error);
    throw error;
  }
}

// ==================== STUDENT SERVICES ====================

export async function createStudent(studentData: CreateStudentData, password?: string): Promise<Student> {
  // Validate data (only email required)
  const errors = validateStudentData(studentData);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  // Check if email already exists in teachers collection
  const teachersQuery = query(
    collection(db, COLLECTIONS.TEACHERS),
    where('email', '==', studentData.email)
  );
  const teachersSnapshot = await getDocs(teachersQuery);
  
  if (!teachersSnapshot.empty) {
    throw new Error(`Email ${studentData.email} already exists as a teacher. Cannot create student with same email.`);
  }

  // Check for duplicate SSID only if SSID is provided
  // Check for existing student by email (handled by createUser function)

  try {
    let userCredential;
    let uid: string;

    // Always create Firebase Auth user (required for OAuth to work)
    if (password) {
      // Manual creation with provided password
      userCredential = await createUserWithEmailAndPassword(auth, studentData.email, password);
      uid = userCredential.user.uid;
      console.log('✅ Created Firebase Auth user with provided password');
    } else {
      // Google Classroom import - create with temporary password
      // Student can sign in with Google OAuth later
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      userCredential = await createUserWithEmailAndPassword(auth, studentData.email, tempPassword);
      uid = userCredential.user.uid;
      console.log('✅ Created Firebase Auth user with temporary password for Google Classroom import');
    }
    
    // Update Firebase Auth profile
    await updateProfile(userCredential.user, {
      displayName: studentData.displayName || `${studentData.firstName} ${studentData.lastName}`
    });
    
    // Sign out immediately to prevent auto-login during import
    await signOut(auth);
    console.log('🔄 Signed out after creation to prevent auto-login');

    // Create base user record for users collection
    const baseUser: BaseUser = {
      uid,
      email: studentData.email,
      displayName: studentData.displayName || `${studentData.firstName} ${studentData.lastName}`,
      role: ROLES.STUDENT,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create student-specific record for students collection
    const student: any = {
      ...baseUser,
      firstName: studentData.firstName || '',
      lastName: studentData.lastName || '',
      grade: studentData.grade || '',
      hasIEP: studentData.hasIEP || false,
      has504: studentData.has504 || false,
      assignedAssessments: [],
      completedAssessments: [],
      currentGoals: [],
      accommodations: studentData.accommodations || []
    };
    
    // Only add optional fields if they have values (avoid undefined)
    if (studentData.seisId) student.seisId = studentData.seisId;
    if (studentData.aeriesId) student.aeriesId = studentData.aeriesId;
    if (studentData.districtId) student.districtId = studentData.districtId;
    if (studentData.schoolId) student.schoolId = studentData.schoolId;
    if (studentData.schoolOfAttendance) student.schoolOfAttendance = studentData.schoolOfAttendance;
    if (studentData.assignedTeacher) student.assignedTeacher = studentData.assignedTeacher;
    if (studentData.caseManager) student.caseManager = studentData.caseManager;
    
    // Google Classroom fields (if imported from Google Classroom)
    if (studentData.googleId) student.googleId = studentData.googleId;
    if (studentData.courseId) student.courseId = studentData.courseId;
    if (studentData.courseName) student.courseName = studentData.courseName;
    if (studentData.section) student.section = studentData.section;
    if (studentData.className) student.className = studentData.className;
    if (studentData.period) student.period = studentData.period;

    // Save to students collection with detailed logging
    console.log('💾 Creating student in students collection...');
    console.log('🎓 Student data (includes auth):', student);
    console.log('🔍 Google fields being saved:', {
      googleId: student.googleId,
      courseId: student.courseId,
      courseName: student.courseName,
      section: student.section,
      assignedTeacher: student.assignedTeacher
    });
    
    // Create both users and students records
    const batch = writeBatch(db);
    
    // Add to users collection
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);
    batch.set(userDocRef, baseUser);
    console.log('📝 Added to batch - users collection:', uid);
    
    // Add to students collection  
    const studentDocRef = doc(db, COLLECTIONS.STUDENTS, uid);
    batch.set(studentDocRef, student);
    console.log('📝 Added to batch - students collection:', uid);
    
    // Commit the batch
    await batch.commit();
    console.log('✅ Created both users and students records');
    console.log('🔍 Student record created with Google metadata:', {
      googleId: student.googleId,
      courseId: student.courseId,
      courseName: student.courseName,
      section: student.section,
      assignedTeacher: student.assignedTeacher
    });
    console.log('✅ Student creation completed for:', student.email);

    // Verify both documents were created
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
    
    console.log('📋 VERIFICATION RESULTS:');
    console.log('  - Users doc exists:', userDoc.exists());
    console.log('  - Students doc exists:', studentDoc.exists());
    
    if (studentDoc.exists()) {
      console.log('  - Students doc data (Google fields):', {
        googleId: studentDoc.data()?.googleId,
        courseId: studentDoc.data()?.courseId,
        courseName: studentDoc.data()?.courseName,
        section: studentDoc.data()?.section,
        assignedTeacher: studentDoc.data()?.assignedTeacher
      });
    }
    
    if (!userDoc.exists()) {
      console.error('❌ CRITICAL: Users document was not created!');
    }
    if (!studentDoc.exists()) {
      console.error('❌ CRITICAL: Students document was not created!');
    }
    
    console.log('✅ Student created successfully in both collections:', student.email);
    return student;
  } catch (error: any) {
    console.error('❌ Error creating student:', error);
    throw new Error(`Failed to create student: ${error.message}`);
  }
}

export async function getStudent(uid: string): Promise<Student | null> {
  try {
    const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
    if (studentDoc.exists()) {
      return { uid, ...studentDoc.data() } as Student;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting student:', error);
    throw error;
  }
}

export async function getStudentBySSID(ssid: string): Promise<Student | null> {
  try {
    const q = query(collection(db, COLLECTIONS.STUDENTS), where('ssid', '==', ssid));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { uid: doc.id, ...doc.data() } as Student;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting student by SSID:', error);
    throw error;
  }
}

export async function getStudentBySEISId(seisId: string): Promise<Student | null> {
  try {
    const q = query(collection(db, COLLECTIONS.STUDENTS), where('seisId', '==', seisId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { uid: doc.id, ...doc.data() } as Student;
    }
      return null;
  } catch (error) {
    console.error('❌ Error getting student by SEIS ID:', error);
    throw error;
  }
}

export async function updateStudent(uid: string, updates: Partial<Student>): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Update base user data if needed
    const baseUpdates: Partial<BaseUser> = {};
    if (updates.displayName) baseUpdates.displayName = updates.displayName;
    if (updates.email) baseUpdates.email = updates.email;
    if (updates.isActive !== undefined) baseUpdates.isActive = updates.isActive;
    
    if (Object.keys(baseUpdates).length > 0) {
      baseUpdates.updatedAt = serverTimestamp();
      batch.update(doc(db, COLLECTIONS.USERS, uid), baseUpdates);
    }
    
    // Update student-specific data
    const studentUpdates = { ...updates, updatedAt: serverTimestamp() };
    batch.update(doc(db, COLLECTIONS.STUDENTS, uid), studentUpdates);
    
    await batch.commit();
    console.log('✅ Student updated:', uid);
  } catch (error) {
    console.error('❌ Error updating student:', error);
    throw error;
  }
}

export async function deleteStudent(uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTIONS.USERS, uid));
    batch.delete(doc(db, COLLECTIONS.STUDENTS, uid));
    await batch.commit();
    
    console.log('✅ Student deleted:', uid);
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    throw error;
  }
}

export async function getAllStudents(filters?: UserSearchFilters): Promise<Student[]> {
  try {
    let q = query(collection(db, COLLECTIONS.STUDENTS));
    
    // Apply filters
    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    if (filters?.schoolId) {
      q = query(q, where('schoolId', '==', filters.schoolId));
    }
    if (filters?.grade) {
      q = query(q, where('grade', '==', filters.grade));
    }
    
    // Order by last name
    q = query(q, orderBy('lastName'));
    
    const snapshot = await getDocs(q);
    const students = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as Student[];
    
    // Apply search filter (client-side)
    if (filters?.searchQuery) {
      const searchQuery = filters.searchQuery.toLowerCase();
      return students.filter(student =>
        student.firstName.toLowerCase().includes(searchQuery) ||
        student.lastName.toLowerCase().includes(searchQuery) ||
        student.email.toLowerCase().includes(searchQuery) ||
        student.googleId?.toLowerCase().includes(searchQuery) ||
        student.seisId?.toLowerCase().includes(searchQuery) ||
        student.aeriesId?.toLowerCase().includes(searchQuery)
      );
    }
    
    return students;
  } catch (error) {
    console.error('❌ Error getting students:', error);
    throw error;
  }
}

export async function getStudentsByTeacher(teacherUid: string): Promise<Student[]> {
  try {
    // Simplified query to avoid index requirements initially
    const q = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('assignedTeacher', '==', teacherUid)
    );
    
    const snapshot = await getDocs(q);
    const students = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as Student[];
    
    // Filter active students and sort on client side
    return students
      .filter(student => student.isActive)
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
      
  } catch (error) {
    console.error('❌ Error getting students by teacher:', error);
    
    // If no students assigned to this teacher yet, return empty array
    if (error instanceof Error && error.message.includes('index')) {
      console.log('📝 No students assigned to teacher yet (empty collection)');
      return [];
    }
    
    throw error;
  }
}

// ==================== USER MANAGEMENT SERVICES ====================

export async function getUserProfile(uid: string): Promise<Teacher | Student | null> {
  try {
    // First check if it's a teacher
    const teacher = await getTeacher(uid);
    if (teacher) return teacher;
    
    // Then check if it's a student
    const student = await getStudent(uid);
    if (student) return student;
    
    return null;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    throw error;
  }
}

export async function updateUserRole(uid: string, newRole: 'teacher' | 'admin' | 'student'): Promise<void> {
  try {
    // Get current user data
    const currentUser = await getUserProfile(uid);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const batch = writeBatch(db);
    
    // Update base user role
    batch.update(doc(db, COLLECTIONS.USERS, uid), {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    
    // If changing between teacher/student, we need to move data
    if (currentUser.role === 'student' && (newRole === 'teacher' || newRole === 'admin')) {
      // Convert student to teacher
      const student = currentUser as Student;
      const teacher: Teacher = {
        uid: student.uid,
        email: student.email,
        displayName: student.displayName,
        role: newRole,
        isActive: student.isActive,
        createdAt: student.createdAt,
        updatedAt: serverTimestamp(),
        lastLogin: student.lastLogin,
        firstName: student.firstName,
        lastName: student.lastName,
        assignedStudents: [],
        createdAssessments: []
      };
      
      batch.set(doc(db, COLLECTIONS.TEACHERS, uid), teacher);
      batch.delete(doc(db, COLLECTIONS.STUDENTS, uid));
      
    } else if ((currentUser.role === 'teacher' || currentUser.role === 'admin') && newRole === 'student') {
      // Convert teacher to student - this would need additional data
      throw new Error('Converting teacher to student requires additional student data (SSID, grade, etc.)');
      
    } else {
      // Same collection, just update role
      if (currentUser.role === 'student') {
        batch.update(doc(db, COLLECTIONS.STUDENTS, uid), {
          role: newRole,
          updatedAt: serverTimestamp()
        });
      } else {
        batch.update(doc(db, COLLECTIONS.TEACHERS, uid), {
          role: newRole,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    await batch.commit();
    console.log('✅ User role updated:', uid, 'to', newRole);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    throw error;
  }
}

export async function getUserStats(): Promise<UserStats> {
  try {
    const [teachersSnapshot, studentsSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.TEACHERS)),
      getDocs(collection(db, COLLECTIONS.STUDENTS))
    ]);
    
    const teachers = teachersSnapshot.docs.map(doc => doc.data()) as Teacher[];
    const students = studentsSnapshot.docs.map(doc => doc.data()) as Student[];
    
    return {
      totalUsers: teachers.length + students.length,
      totalTeachers: teachers.length,
      totalStudents: students.length,
      activeUsers: teachers.filter(t => t.isActive).length + students.filter(s => s.isActive).length,
      inactiveUsers: teachers.filter(t => !t.isActive).length + students.filter(s => !s.isActive).length,
      adminUsers: teachers.filter(t => t.role === 'admin').length,
      studentsWithIEP: students.filter(s => s.hasIEP).length,
      studentsWith504: students.filter(s => s.has504).length
    };
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    throw error;
  }
}

// ==================== BULK OPERATIONS ====================

export async function bulkCreateStudents(studentsData: CreateStudentData[]): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    successful: 0,
    failed: 0,
    errors: [],
    imported: []
  };

  try {
    const batch = writeBatch(db);
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore batch limit
    
    for (const studentData of studentsData) {
      try {
        // Validate individual student
        const errors = validateStudentData(studentData);
        if (errors.length > 0) {
          result.failed++;
          result.errors.push(`${studentData.firstName} ${studentData.lastName}: ${errors.join(', ')}`);
          continue;
        }
        
        // Check for duplicate SSID only if provided
        // Skip duplicate check - handled by email validation
        
        const uid = doc(collection(db, COLLECTIONS.STUDENTS)).id;
        
        // Create base user
        const baseUser: BaseUser = {
          uid,
          email: studentData.email,
          displayName: studentData.displayName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Student',
          role: ROLES.STUDENT,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Create student with only defined fields
        const student: any = {
          ...baseUser,
          role: ROLES.STUDENT,
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          // No SSID field - using Firebase UID
          grade: studentData.grade || '',
          hasIEP: studentData.hasIEP || false,
          has504: studentData.has504 || false,
          assignedAssessments: [],
          completedAssessments: [],
          currentGoals: [],
          accommodations: studentData.accommodations || []
        };
        
        // Add optional fields only if they exist
        if (studentData.seisId) student.seisId = studentData.seisId;
        if (studentData.aeriesId) student.aeriesId = studentData.aeriesId;
        if (studentData.districtId) student.districtId = studentData.districtId;
        if (studentData.schoolId) student.schoolId = studentData.schoolId;
        if (studentData.schoolOfAttendance) student.schoolOfAttendance = studentData.schoolOfAttendance;
        if (studentData.assignedTeacher) student.assignedTeacher = studentData.assignedTeacher;
        if (studentData.caseManager) student.caseManager = studentData.caseManager;
        
        batch.set(doc(db, COLLECTIONS.USERS, uid), baseUser);
        batch.set(doc(db, COLLECTIONS.STUDENTS, uid), student);
        
        result.successful++;
        result.imported.push(student);
        batchCount++;
        
        // Commit batch if we hit the limit
        if (batchCount >= maxBatchSize) {
          await batch.commit();
          batchCount = 0;
        }
        
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${studentData.firstName} ${studentData.lastName}: ${error.message}`);
      }
    }
    
    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log('✅ Bulk import completed:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Error in bulk student creation:', error);
    throw error;
  }
}

export async function assignStudentToTeacher(studentUid: string, teacherUid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Update student's assigned teacher
    batch.update(doc(db, COLLECTIONS.STUDENTS, studentUid), {
      assignedTeacher: teacherUid,
      updatedAt: serverTimestamp()
    });
    
    // Add student to teacher's assigned students list
    const teacher = await getTeacher(teacherUid);
    if (teacher) {
      const assignedStudents = teacher.assignedStudents || [];
      if (!assignedStudents.includes(studentUid)) {
        assignedStudents.push(studentUid);
        batch.update(doc(db, COLLECTIONS.TEACHERS, teacherUid), {
          assignedStudents,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    await batch.commit();
    console.log('✅ Student assigned to teacher:', studentUid, '→', teacherUid);
  } catch (error) {
    console.error('❌ Error assigning student to teacher:', error);
    throw error;
  }
}

// ==================== SEARCH AND UTILITIES ====================

export async function searchUsers(searchQuery: string, role?: 'teacher' | 'student'): Promise<(Teacher | Student)[]> {
  try {
    const results: (Teacher | Student)[] = [];
    
    if (!role || role === 'teacher') {
      const teachers = await getAllTeachers({ searchQuery });
      results.push(...teachers);
    }
    
    if (!role || role === 'student') {
      const students = await getAllStudents({ searchQuery });
      results.push(...students);
    }
    
    return results.sort((a, b) => a.lastName.localeCompare(b.lastName));
  } catch (error) {
    console.error('❌ Error searching users:', error);
    throw error;
  }
}

export async function getActiveStudentsCount(): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Error getting active students count:', error);
    return 0;
  }
}

export async function getActiveTeachersCount(): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTIONS.TEACHERS),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Error getting active teachers count:', error);
    return 0;
  }
}

export default {
  // Teacher services
  createTeacher,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getAllTeachers,
  
  // Student services
  createStudent,
  getStudent,
  getStudentBySSID,
  getStudentBySEISId,
  updateStudent,
  deleteStudent,
  getAllStudents,
  getStudentsByTeacher,
  
  // User management
  getUserProfile,
  updateUserRole,
  getUserStats,
  
  // Bulk operations
  bulkCreateStudents,
  assignStudentToTeacher,
  
  // Search and utilities
  searchUsers,
  getActiveStudentsCount,
  getActiveTeachersCount
};