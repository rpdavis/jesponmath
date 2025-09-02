// User Management Types
export interface AppUser {
  id: string; // Document ID in Firestore
  firebaseUid: string; // Firebase Auth UID
  email: string;
  userType: 'teacher' | 'student';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  lastLogin: any;
}

export interface Teacher extends AppUser {
  userType: 'teacher';
  employeeId?: string;
  teacherId?: string; // Unique teacher identifier
  department?: string;
  schoolDistrict: string;
  schoolSite: string;
  role: 'case-manager' | 'general-education' | 'special-education' | 'administrator' | 'support-staff';
  permissions: TeacherPermission[];
  caseloadStudents?: string[]; // Array of student SEIS IDs
  googleClassroomId?: string; // For Google Classroom integration
  googleWorkspaceEmail?: string; // Google Workspace email if different
}

export interface Student extends AppUser {
  userType: 'student';
  seisId?: string; // Links to IEP data
  studentId?: string;
  grade: string;
  class: string; // Student's class/homeroom
  period?: string; // Class period
  schoolSite: string;
  caseManager?: string;
  teacherId?: string; // Links to assigned teacher
  serviceProviders: string[]; // Array of up to 7 service provider user IDs
  assignedGoals: string[]; // Array of goal IDs assigned to this student
  parentEmail?: string;
  studentEmail?: string; // Student's school email for login
  accommodations?: string[];
  isIEPStudent: boolean;
  googleClassroomId?: string; // For Google Classroom integration
  enrolledClasses?: string[]; // Array of Google Classroom class IDs
}

export interface TeacherPermission {
  resource: 'students' | 'goals' | 'assessments' | 'reports' | 'iep-manager';
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'teacher' | 'student';
}

export interface UserSession {
  user: AppUser;
  permissions: TeacherPermission[];
  isAuthenticated: boolean;
  sessionStarted: any;
}

// Default permissions for different roles
export const DEFAULT_PERMISSIONS: Record<Teacher['role'], TeacherPermission[]> = {
  'case-manager': [
    { resource: 'students', actions: ['read', 'write'] },
    { resource: 'goals', actions: ['read', 'write'] },
    { resource: 'assessments', actions: ['read', 'write'] },
    { resource: 'reports', actions: ['read', 'write'] },
    { resource: 'iep-manager', actions: ['read', 'write'] }
  ],
  'special-education': [
    { resource: 'students', actions: ['read', 'write'] },
    { resource: 'goals', actions: ['read', 'write'] },
    { resource: 'assessments', actions: ['read', 'write'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'iep-manager', actions: ['read'] }
  ],
  'general-education': [
    { resource: 'students', actions: ['read'] },
    { resource: 'goals', actions: ['read'] },
    { resource: 'assessments', actions: ['read', 'write'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'iep-manager', actions: ['read'] }
  ],
  'administrator': [
    { resource: 'students', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'goals', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'assessments', actions: ['read', 'write', 'delete', 'admin'] },
    { resource: 'reports', actions: ['read', 'write', 'admin'] },
    { resource: 'iep-manager', actions: ['read', 'write', 'admin'] }
  ],
  'support-staff': [
    { resource: 'students', actions: ['read'] },
    { resource: 'goals', actions: ['read'] },
    { resource: 'assessments', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'iep-manager', actions: ['read'] }
  ]
};
