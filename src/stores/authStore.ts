// Authentication store for JepsonMath Assessment System
// Based on CaseManageVue authStore pattern

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged, 
  signOut, 
  getIdToken,
  updateProfile,
  type User
} from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/firebase/config';
import { ROLES, assignRoleFromEmail, isValidRole, type UserRole } from '@/config/roles';
import { getUserProfile } from '@/firebase/userServices';
import { COLLECTIONS, type Teacher, type Student } from '@/types/users';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  // Additional fields from teacher/student profiles
  firstName?: string;
  lastName?: string;
  googleId?: string; // For students from Google Classroom
  seisId?: string; // For students
  aeriesId?: string; // For both teachers and students
  assignedTeacher?: string; // For students
  schoolId?: string;
  isActive: boolean;
  createdAt: any;
  lastLogin: any;
  isDemo?: boolean;
  // Course/class information (for students)
  courseId?: string;
  courseName?: string;
  section?: string;
  period?: string;
  className?: string;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<AppUser | null>(null);
  const firebaseUser = ref<User | null>(null);
  const isLoading = ref(true);
  const error = ref('');
  const success = ref('');

  // Token refresh management
  let tokenRefreshInterval: number | null = null;

  // Computed properties
  const isAuthenticated = computed(() => !!currentUser.value);
  const isAdmin = computed(() => currentUser.value?.role === ROLES.ADMIN);
  const isTeacher = computed(() => currentUser.value?.role === ROLES.TEACHER);
  const isStudent = computed(() => currentUser.value?.role === ROLES.STUDENT);
  const userRole = computed(() => currentUser.value?.role);
  const displayName = computed(() => 
    currentUser.value?.displayName || 
    currentUser.value?.email || 
    'User'
  );

  // Initialize auth state listener
  const initAuth = () => {
    console.log('🔧 Initializing auth state listener...');
    
    onAuthStateChanged(auth, async (user) => {
      isLoading.value = true;
      
      if (user) {
        try {
          console.log('✅ Firebase user authenticated:', user.email);
          firebaseUser.value = user;
          
          // Get base user data from users collection
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Get detailed profile from role-specific collection
            const detailedProfile = await getUserProfile(user.uid);
            
            currentUser.value = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || userData.displayName || '',
              role: userData.role,
              firstName: detailedProfile?.firstName,
              lastName: detailedProfile?.lastName,
              googleId: (detailedProfile as Student)?.googleId,
              seisId: (detailedProfile as Student)?.seisId,
              aeriesId: detailedProfile?.aeriesId,
              assignedTeacher: (detailedProfile as Student)?.assignedTeacher,
              schoolId: detailedProfile?.schoolId,
              isActive: userData.isActive !== false,
              createdAt: userData.createdAt,
              lastLogin: userData.lastLogin,
              isDemo: userData.isDemo,
              // Course/class info for students
              courseId: (detailedProfile as Student)?.courseId,
              courseName: (detailedProfile as Student)?.courseName,
              section: (detailedProfile as Student)?.section,
              period: (detailedProfile as Student)?.period,
              className: (detailedProfile as Student)?.className
            };
            
            // Update last login
            await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
              lastLogin: serverTimestamp()
            });
            
            console.log('✅ User profile loaded:', currentUser.value.email, 'Role:', currentUser.value.role);
            console.log('🔍 DEBUG - User data from Firestore:', userData);
            console.log('🔍 DEBUG - Detailed profile:', detailedProfile);
            console.log('🔍 DEBUG - Final currentUser:', currentUser.value);
            setupTokenRefresh();
          } else {
            console.log('⚠️ User not found in Firestore users collection');
            currentUser.value = null;
            firebaseUser.value = null;
          }
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          currentUser.value = null;
          firebaseUser.value = null;
        }
      } else {
        console.log('👤 No Firebase user authenticated');
        currentUser.value = null;
        firebaseUser.value = null;
        clearTokenRefresh();
      }
      
      isLoading.value = false;
    });
  };

  // Set up automatic token refresh
  const setupTokenRefresh = () => {
    clearTokenRefresh();
    
    console.log('🔧 Setting up token refresh...');
    
    tokenRefreshInterval = setInterval(async () => {
      if (auth.currentUser) {
        console.log('🔄 Refreshing Firebase token...');
        try {
          await getIdToken(auth.currentUser, true);
          console.log('✅ Token refreshed successfully');
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          await logout();
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
  };

  // Clear token refresh interval
  const clearTokenRefresh = () => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
      console.log('⏰ Token refresh cleared');
    }
  };

  // Google OAuth login
  const loginWithGoogle = async () => {
    try {
      error.value = '';
      success.value = '';
      
      // Use the pre-configured Google provider with Classroom scopes
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (!user.email) {
        throw new Error('No email address found in Google account');
      }
      
      // Check if user exists in Firestore users collection (existing user check)
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
      
      // If user already exists in the system, allow them through
      if (userDoc.exists()) {
        console.log('✅ Existing user found in users collection, allowing sign-in');
        success.value = 'Successfully signed in with Google!';
        return true;
      }
      
      // NEW USER: Check if this email is authorized BEFORE allowing sign-in
      // Check if user exists in students collection by email
      const studentsQuery = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('email', '==', user.email)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      
      // Check if user exists in teachers collection by email
      const teachersQuery = query(
        collection(db, COLLECTIONS.TEACHERS),
        where('email', '==', user.email)
      );
      const teachersSnapshot = await getDocs(teachersQuery);
      
      // If email is not found in either collection, reject the sign-in
      if (studentsSnapshot.empty && teachersSnapshot.empty) {
        console.log('🚫 Unauthorized email attempted sign-in:', user.email);
        await signOut(auth); // Sign out the user immediately
        error.value = 'Access denied. Your email address is not authorized for this system. Please contact your teacher or administrator to be added.';
        return false;
      }
      
      // User is authorized - determine their role
      let existingRole: UserRole;
      let existingData: any = null;
      
      if (!studentsSnapshot.empty) {
        existingRole = ROLES.STUDENT;
        existingData = studentsSnapshot.docs[0];
        console.log('✅ Authorized student found:', user.email);
      } else {
        const teacherDoc = teachersSnapshot.docs[0];
        const teacherData = teacherDoc.data();
        existingRole = teacherData.role || ROLES.TEACHER;
        existingData = teacherDoc;
        console.log('✅ Authorized teacher/admin found:', user.email, 'Role:', existingRole);
      }
      
      // At this point, user is authorized but doesn't have a users collection entry yet
      // Create their account records
      const role = existingRole;
      
      const baseUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        role,
        isActive: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      // Create base user record
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), baseUser);
      
      // Create role-specific record ONLY if user doesn't already exist in either collection
      if (role === ROLES.TEACHER || role === ROLES.ADMIN) {
          // Check if user already exists in teachers collection with the correct UID
          const existingTeacherByUid = await getDoc(doc(db, COLLECTIONS.TEACHERS, user.uid));
          if (!existingTeacherByUid.exists() && existingData) {
            // Teacher was pre-authorized but needs record with Firebase UID
            const existingTeacherData = existingData.data();
            
            // If the existing teacher document has a different ID, merge it
            if (existingData.id !== user.uid) {
              console.log('🔄 Merging existing teacher record with Firebase UID...');
              const mergedTeacherData = {
                ...existingTeacherData,
                uid: user.uid,
                displayName: user.displayName || existingTeacherData.displayName,
                lastLogin: serverTimestamp()
              };
              await setDoc(doc(db, COLLECTIONS.TEACHERS, user.uid), mergedTeacherData);
              await deleteDoc(doc(db, COLLECTIONS.TEACHERS, existingData.id));
              console.log('✅ Teacher record merged with Firebase UID');
            } else {
              console.log('⚠️ Teacher record already exists with correct UID');
            }
          } else if (!existingTeacherByUid.exists()) {
            // Create new teacher record (shouldn't happen since we verified authorization)
            const teacherData = {
              ...baseUser,
              role,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              subjects: ['Math'],
              gradesTaught: [],
              assignedStudents: [],
              createdAssessments: []
            };
            await setDoc(doc(db, COLLECTIONS.TEACHERS, user.uid), teacherData);
            console.log('✅ Created teacher record');
        } else {
          console.log('⚠️ Teacher record already exists, skipping creation');
        }
      } else if (role === ROLES.STUDENT) {
          // Student exists from pre-authorization (Google Classroom import or manual add)
          const existingStudentByUid = await getDoc(doc(db, COLLECTIONS.STUDENTS, user.uid));
          
          if (!existingStudentByUid.exists() && existingData) {
            const existingStudentData = existingData.data();
            
            // If the existing student document has a different ID, merge it
            if (existingData.id !== user.uid) {
              console.log('🔄 Merging existing student record with Firebase UID...');
              const mergedStudentData = {
                ...existingStudentData,
                uid: user.uid,
                displayName: user.displayName || existingStudentData.displayName,
                lastLogin: serverTimestamp()
              };
              await setDoc(doc(db, COLLECTIONS.STUDENTS, user.uid), mergedStudentData);
              await deleteDoc(doc(db, COLLECTIONS.STUDENTS, existingData.id));
              console.log('✅ Student record merged with Firebase UID');
            } else {
              console.log('⚠️ Student record already exists with correct UID');
            }
          } else if (!existingStudentByUid.exists()) {
            // This shouldn't happen since we verified authorization, but handle it
            console.warn('⚠️ Authorized student email found but no student record to merge');
        } else {
          console.log('⚠️ Student record already exists, skipping creation');
        }
      }
      
      console.log('✅ New user created with role:', role);
      success.value = 'Successfully signed in with Google!';
      return true;
    } catch (err: any) {
      console.error('❌ Google login error:', err);
      error.value = err.message || 'Google sign-in failed';
      return false;
    }
  };

  // Email/password login
  const loginWithEmail = async (email: string, password: string) => {
    try {
      error.value = '';
      success.value = '';
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid));
      if (!userDoc.exists()) {
        throw new Error('User account not found in system');
      }
      
      success.value = 'Successfully signed in!';
      return true;
    } catch (err: any) {
      console.error('❌ Email login error:', err);
      
      switch (err.code) {
        case 'auth/user-not-found':
          error.value = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          error.value = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          error.value = 'Please enter a valid email address';
          break;
        case 'auth/too-many-requests':
          error.value = 'Too many failed attempts. Please try again later';
          break;
        default:
          error.value = err.message || 'Sign-in failed';
      }
      return false;
    }
  };

  // Email/password registration
  const registerWithEmail = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRole = ROLES.TEACHER
  ) => {
    try {
      error.value = '';
      success.value = '';
      
      if (!isValidRole(role)) {
        throw new Error('Invalid role specified');
      }
      
      // SECURITY: Check if this email is pre-authorized before allowing registration
      // Check if user exists in students collection by email
      const studentsQuery = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('email', '==', email)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      
      // Check if user exists in teachers collection by email
      const teachersQuery = query(
        collection(db, COLLECTIONS.TEACHERS),
        where('email', '==', email)
      );
      const teachersSnapshot = await getDocs(teachersQuery);
      
      // If email is not found in either collection, reject the registration
      if (studentsSnapshot.empty && teachersSnapshot.empty) {
        console.log('🚫 Unauthorized email attempted registration:', email);
        error.value = 'Access denied. Your email address is not authorized for this system. Please contact your teacher or administrator to be added.';
        return false;
      }
      
      // Determine the authorized role
      let authorizedRole: UserRole;
      let existingData: any = null;
      
      if (!studentsSnapshot.empty) {
        authorizedRole = ROLES.STUDENT;
        existingData = studentsSnapshot.docs[0];
        console.log('✅ Authorized student email for registration:', email);
      } else {
        const teacherDoc = teachersSnapshot.docs[0];
        const teacherData = teacherDoc.data();
        authorizedRole = teacherData.role || ROLES.TEACHER;
        existingData = teacherDoc;
        console.log('✅ Authorized teacher/admin email for registration:', email, 'Role:', authorizedRole);
      }
      
      // Create Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile
      await updateProfile(result.user, {
        displayName
      });
      
      // Create base user profile in Firestore
      const baseUser = {
        uid: result.user.uid,
        email,
        displayName,
        role: authorizedRole, // Use the pre-authorized role
        isActive: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), baseUser);
      
      // Merge with existing role-specific profile
      if (authorizedRole === ROLES.TEACHER || authorizedRole === ROLES.ADMIN) {
        if (existingData && existingData.id !== result.user.uid) {
          // Merge existing teacher data with new UID
          const existingTeacherData = existingData.data();
          const mergedTeacherData = {
            ...existingTeacherData,
            ...baseUser,
            role: authorizedRole,
            firstName: displayName.split(' ')[0] || existingTeacherData.firstName || '',
            lastName: displayName.split(' ').slice(1).join(' ') || existingTeacherData.lastName || ''
          };
          await setDoc(doc(db, COLLECTIONS.TEACHERS, result.user.uid), mergedTeacherData);
          await deleteDoc(doc(db, COLLECTIONS.TEACHERS, existingData.id));
          console.log('✅ Merged teacher record with new Firebase UID');
        } else if (existingData) {
          // Update existing record
          await setDoc(doc(db, COLLECTIONS.TEACHERS, result.user.uid), {
            ...existingData.data(),
            ...baseUser,
            role: authorizedRole
          }, { merge: true });
        }
      } else if (authorizedRole === ROLES.STUDENT) {
        if (existingData && existingData.id !== result.user.uid) {
          // Merge existing student data with new UID
          const existingStudentData = existingData.data();
          const mergedStudentData = {
            ...existingStudentData,
            ...baseUser,
            role: ROLES.STUDENT,
            displayName: displayName || existingStudentData.displayName
          };
          await setDoc(doc(db, COLLECTIONS.STUDENTS, result.user.uid), mergedStudentData);
          await deleteDoc(doc(db, COLLECTIONS.STUDENTS, existingData.id));
          console.log('✅ Merged student record with new Firebase UID');
        } else if (existingData) {
          // Update existing record
          await setDoc(doc(db, COLLECTIONS.STUDENTS, result.user.uid), {
            ...existingData.data(),
            ...baseUser,
            role: ROLES.STUDENT
          }, { merge: true });
        }
      }
      
      success.value = 'Account created successfully!';
      return true;
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          error.value = 'An account with this email already exists';
          break;
        case 'auth/weak-password':
          error.value = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          error.value = 'Please enter a valid email address';
          break;
        default:
          error.value = err.message || 'Account creation failed';
      }
      return false;
    }
  };

  // Demo login (anonymous)
  const loginDemo = async () => {
    try {
      error.value = '';
      success.value = '';
      
      const result = await signInAnonymously(auth);
      
      // Create demo user profile
      const baseUser = {
        uid: result.user.uid,
        email: 'demo@jepsonmath.com',
        displayName: 'Demo Teacher',
        role: ROLES.TEACHER,
        isActive: true,
        isDemo: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), baseUser);
      
      // Create demo teacher profile
      const demoTeacher = {
        ...baseUser,
        role: ROLES.TEACHER,
        firstName: 'Demo',
        lastName: 'Teacher',
        subjects: ['Math'],
        gradesTaught: ['6', '7', '8'],
        assignedStudents: [],
        createdAssessments: []
      };
      
      await setDoc(doc(db, COLLECTIONS.TEACHERS, result.user.uid), demoTeacher);
      
      success.value = 'Demo access granted!';
      return true;
    } catch (err: any) {
      console.error('❌ Demo login error:', err);
      error.value = 'Demo access failed';
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log('🚪 Logging out user:', currentUser.value?.email);
      
      clearTokenRefresh();
      await signOut(auth);
      
      currentUser.value = null;
      firebaseUser.value = null;
      error.value = '';
      success.value = 'Signed out successfully';
      
      return true;
    } catch (err: any) {
      console.error('❌ Logout error:', err);
      error.value = 'Sign out failed';
      return false;
    }
  };

  // Update user role (admin only)
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      if (!isAdmin.value) {
        throw new Error('Only administrators can update user roles');
      }
      
      if (!isValidRole(newRole)) {
        throw new Error('Invalid role specified');
      }
      
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Update current user if updating own role
      if (currentUser.value && currentUser.value.uid === userId) {
        currentUser.value.role = newRole;
      }
      
      console.log('✅ User role updated:', userId, 'to', newRole);
      return true;
    } catch (err: any) {
      console.error('❌ Role update error:', err);
      error.value = err.message || 'Failed to update user role';
      return false;
    }
  };

  // Clear messages
  const clearMessages = () => {
    error.value = '';
    success.value = '';
  };

  // Initialize auth when store is created
  initAuth();

  return {
    // State
    currentUser: computed(() => currentUser.value),
    firebaseUser: computed(() => firebaseUser.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    success: computed(() => success.value),
    
    // Computed
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    userRole,
    displayName,
    
    // Actions
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    loginDemo,
    logout,
    updateUserRole,
    clearMessages,
    
    // Internal
    setupTokenRefresh,
    clearTokenRefresh
  };
});
