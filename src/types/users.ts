// User type definitions for JepsonMath Assessment System
// Separate collections for teachers and students

import type { UserRole } from '@/config/roles';

// Base user interface (for authentication)
export interface BaseUser {
  uid: string; // Firebase Auth UID
  email: string; // Required for all users
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  lastLogin?: any; // Firestore timestamp
  isDemo?: boolean; // For demo accounts
}

// Admin-specific data structure (includes auth data)
export interface Admin extends BaseUser {
  role: 'admin';
  
  // Auth fields (merged from users collection)
  displayName: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  lastLogin?: any;
  
  // Admin-specific fields
  firstName?: string;
  lastName?: string;
  permissions?: string[]; // System permissions
  systemAccess?: string[]; // What parts of system they can access
}

// Teacher-specific data structure (includes auth data)
export interface Teacher extends BaseUser {
  role: 'teacher' | 'admin'; // Keep admin compatibility for now
  
  // Auth fields (merged from users collection)
  displayName: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  lastLogin?: any;
  
  // Required fields
  firstName: string;
  lastName: string;
  
  // Optional fields
  aeriesId?: string; // Aeries teacher ID
  schoolId?: string;
  department?: string;
  subjects?: string[]; // Math, English, etc.
  gradesTaught?: string[]; // K, 1, 2, 3, etc.
  
  // Professional info
  certification?: string;
  yearsExperience?: number;
  phoneNumber?: string;
  
  // System permissions (for admin roles)
  permissions?: string[];
  
  // Classroom integration
  googleClassroomId?: string;
  classroomCourses?: string[]; // Course IDs they teach
  
  // Assignment tracking
  assignedStudents?: string[]; // Student SEIS IDs
  createdAssessments?: string[]; // Assessment IDs they created
}

// Student-specific data structure (includes auth data)
export interface Student extends BaseUser {
  role: 'student';
  
  // Auth fields (merged from users collection)
  displayName: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  lastLogin?: any;
  
  // Required fields (only email from BaseUser)
  firstName: string; // Can be empty string
  lastName: string; // Can be empty string
  
  // Optional identification
  seisId?: string; // Special Education Information System ID
  aeriesId?: string; // Aeries student ID
  districtId?: string;
  
  // Academic info
  grade: string; // K, 1, 2, 3, etc.
  birthdate?: string; // Student birthdate
  schoolId?: string;
  schoolOfAttendance?: string;
  
  // Class and period information for gradebook
  className?: string; // e.g., "Algebra 1", "Pre-Algebra"
  period?: string; // e.g., "1", "2", "A", "B"
  courseId?: string; // Google Classroom course ID if imported
  
  // Google Classroom specific fields
  googleId?: string; // Google user ID
  courseName?: string; // Google Classroom course name
  section?: string; // Google Classroom section
  
  // IEP/504 information
  hasIEP: boolean;
  has504: boolean;
  eligibilityStatus?: 'Active' | 'Inactive' | 'Pending';
  iepDate?: string; // IEP date
  planType?: 'IEP' | '504' | 'None';
  
  // Assignment and tracking
  assignedTeacher?: string; // Teacher UID
  caseManager?: string;
  serviceProviders?: string[];
  
  // Assessment tracking
  assignedAssessments?: string[]; // Assessment IDs
  completedAssessments?: string[]; // Assessment result IDs
  currentGoals?: string[]; // IEP goal IDs
  
  // Accommodations
  accommodations?: string[];
  
  // Parent/Guardian info
  parentEmail?: string;
  guardianName?: string;
  emergencyContact?: string;
  
  // Classroom integration
  googleClassroomId?: string;
  classroomCourses?: string[]; // Course IDs they're enrolled in
}

// User creation/update DTOs
export interface CreateTeacherData {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role?: 'teacher' | 'admin';
  aeriesId?: string;
  schoolId?: string;
  department?: string;
  subjects?: string[];
  gradesTaught?: string[];
  phoneNumber?: string;
}

export interface CreateStudentData {
  email: string; // Only required field
  firstName?: string;
  lastName?: string;
  displayName?: string;
  seisId?: string;
  aeriesId?: string;
  districtId?: string;
  grade?: string;
  schoolId?: string;
  schoolOfAttendance?: string;
  hasIEP?: boolean;
  has504?: boolean;
  assignedTeacher?: string;
  caseManager?: string;
  
  // Class and period information
  className?: string;
  period?: string;
  courseId?: string;
  
  // Google Classroom specific fields
  googleId?: string;
  courseName?: string;
  section?: string;
  accommodations?: string[];
}

// Database collection names
export const COLLECTIONS = {
  USERS: 'users', // Base authentication data (keeping for now)
  ADMINS: 'admins', // Admin data (new)
  TEACHERS: 'teachers', // Teacher-specific data
  STUDENTS: 'students', // Student-specific data
  ASSESSMENTS: 'assessments',
  ASSESSMENT_RESULTS: 'assessmentResults',
  GOALS: 'goals'
} as const;

// User search and filter types
export interface UserSearchFilters {
  searchQuery?: string;
  role?: UserRole;
  isActive?: boolean;
  schoolId?: string;
  grade?: string; // For students
  department?: string; // For teachers
}

// User statistics
export interface UserStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  studentsWithIEP: number;
  studentsWith504: number;
}

// Import/Export types
export interface BulkImportResult {
  successful: number;
  failed: number;
  errors: string[];
  imported: (Teacher | Student)[];
}

export interface GoogleClassroomImportData {
  courseId: string;
  courseName: string;
  students: Array<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  }>;
  teacher?: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Validation functions
export function validateTeacherData(data: CreateTeacherData): string[] {
  const errors: string[] = [];
  
  if (!data.email) errors.push('Email is required');
  if (!data.firstName) errors.push('First name is required');
  if (!data.lastName) errors.push('Last name is required');
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Please enter a valid email address');
  }
  
  return errors;
}

export function validateStudentData(data: CreateStudentData): string[] {
  const errors: string[] = [];
  
  // Only email is required as requested
  if (!data.email) errors.push('Email is required');
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Please enter a valid email address');
  }
  
  // Optional field validations (only if provided)
  
  return errors;
}

// Helper functions
export function getFullName(user: Teacher | Student): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function getUserDisplayInfo(user: Teacher | Student): string {
  const name = getFullName(user);
  if (user.role === 'student') {
    return `${name} (Google ID: ${(user as Student).googleId || 'N/A'})`;
  } else {
    return `${name} (${user.role})`;
  }
}

export function isTeacher(user: BaseUser | Teacher | Student): user is Teacher {
  return user.role === 'teacher' || user.role === 'admin';
}

export function isStudent(user: BaseUser | Teacher | Student): user is Student {
  return user.role === 'student';
}

export default {
  COLLECTIONS,
  validateTeacherData,
  validateStudentData,
  getFullName,
  getUserDisplayInfo,
  isTeacher,
  isStudent
};
