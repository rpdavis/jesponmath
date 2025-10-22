// Role-based access control configuration for JepsonMath Assessment System
// Based on CaseManageVue pattern but simplified for assessment focus

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher', 
  STUDENT: 'student'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Permission actions for the assessment system
export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_ALL_DATA: 'view_all_data',
  DELETE_USERS: 'delete_users',
  
  // Teacher permissions
  CREATE_ASSESSMENTS: 'create_assessments',
  EDIT_ASSESSMENTS: 'edit_assessments',
  DELETE_ASSESSMENTS: 'delete_assessments',
  MANAGE_STUDENTS: 'manage_students',
  VIEW_STUDENT_RESULTS: 'view_student_results',
  IMPORT_CLASSROOM: 'import_classroom',
  ASSIGN_ASSESSMENTS: 'assign_assessments',
  
  // Student permissions
  TAKE_ASSESSMENTS: 'take_assessments',
  VIEW_OWN_RESULTS: 'view_own_results',
  VIEW_OWN_PROGRESS: 'view_own_progress'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permissions matrix - defines what each role can do
export const PERMISSIONS_MATRIX: Record<UserRole, Permission[]> = {
  [ROLES.ADMIN]: [
    // Full system access
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.CREATE_ASSESSMENTS,
    PERMISSIONS.EDIT_ASSESSMENTS,
    PERMISSIONS.DELETE_ASSESSMENTS,
    PERMISSIONS.MANAGE_STUDENTS,
    PERMISSIONS.VIEW_STUDENT_RESULTS,
    PERMISSIONS.IMPORT_CLASSROOM,
    PERMISSIONS.ASSIGN_ASSESSMENTS,
    PERMISSIONS.TAKE_ASSESSMENTS, // For testing purposes
    PERMISSIONS.VIEW_OWN_RESULTS,
    PERMISSIONS.VIEW_OWN_PROGRESS
  ],
  
  [ROLES.TEACHER]: [
    // Assessment and student management
    PERMISSIONS.CREATE_ASSESSMENTS,
    PERMISSIONS.EDIT_ASSESSMENTS,
    PERMISSIONS.DELETE_ASSESSMENTS,
    PERMISSIONS.MANAGE_STUDENTS, // Can add/manage their own students
    PERMISSIONS.VIEW_STUDENT_RESULTS, // Only for their assigned students
    PERMISSIONS.IMPORT_CLASSROOM,
    PERMISSIONS.ASSIGN_ASSESSMENTS,
    PERMISSIONS.TAKE_ASSESSMENTS, // For preview/testing
    PERMISSIONS.VIEW_OWN_RESULTS,
    PERMISSIONS.VIEW_OWN_PROGRESS
  ],
  
  [ROLES.STUDENT]: [
    // Assessment taking and viewing own results
    PERMISSIONS.TAKE_ASSESSMENTS,
    PERMISSIONS.VIEW_OWN_RESULTS,
    PERMISSIONS.VIEW_OWN_PROGRESS
  ]
};

// Route access control
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Admin routes
  '/admin': [PERMISSIONS.MANAGE_SYSTEM],
  '/admin/users': [PERMISSIONS.MANAGE_USERS],
  '/admin/system': [PERMISSIONS.MANAGE_SYSTEM],
  
  // Teacher routes
  '/assessment/create': [PERMISSIONS.CREATE_ASSESSMENTS],
  '/assessment/edit': [PERMISSIONS.EDIT_ASSESSMENTS],
  '/students': [PERMISSIONS.MANAGE_STUDENTS],
  '/progress': [PERMISSIONS.VIEW_STUDENT_RESULTS],
  
  // Student routes
  '/assessments': [PERMISSIONS.TAKE_ASSESSMENTS],
  '/my-results': [PERMISSIONS.VIEW_OWN_RESULTS],
  '/my-progress': [PERMISSIONS.VIEW_OWN_PROGRESS]
};

// Role descriptions for UI
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [ROLES.ADMIN]: 'System Administrator - Full access to all features, user management, and system settings',
  [ROLES.TEACHER]: 'Teacher - Create and manage assessments, add and manage students, view student progress, import from Google Classroom',
  [ROLES.STUDENT]: 'Student - Take assigned assessments and view personal results and progress'
};

// Default role assignment based on email domain
export const EMAIL_DOMAIN_ROLES: Record<string, UserRole> = {
  // Add your school domains here
  'admin.school.edu': ROLES.ADMIN,
  'teacher.school.edu': ROLES.TEACHER,
  'student.school.edu': ROLES.STUDENT,
  // Gmail defaults to teacher for manual assignment
  'gmail.com': ROLES.TEACHER
};

// Utility functions
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = PERMISSIONS_MATRIX[userRole];
  return rolePermissions.includes(permission);
}

export function canAccessRoute(userRole: UserRole, routePath: string): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[routePath];
  if (!requiredPermissions) return true; // No restrictions
  
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
}

export function assignRoleFromEmail(email: string): UserRole {
  const domain = email.split('@')[1];
  
  // Check if this email already exists in our database as a student
  // For now, default to student for gmail accounts (common for students)
  if (domain === 'gmail.com') {
    return ROLES.STUDENT; // Most Gmail users will be students
  }
  
  return EMAIL_DOMAIN_ROLES[domain] || ROLES.STUDENT; // Default to student instead of teacher
}

export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role as UserRole);
}

// Role hierarchy for UI display order
export const ROLE_HIERARCHY: UserRole[] = [
  ROLES.ADMIN,
  ROLES.TEACHER,
  ROLES.STUDENT
];

// Navigation menu items based on role
export const NAVIGATION_ITEMS: Record<UserRole, Array<{
  path: string;
  label: string;
  icon: string;
  permission?: Permission;
}>> = {
  [ROLES.ADMIN]: [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/users', label: 'Manage Users', icon: '👥', permission: PERMISSIONS.MANAGE_USERS },
    { path: '/admin/teachers', label: 'Manage Teachers', icon: '👨‍🏫', permission: PERMISSIONS.MANAGE_USERS },
    { path: '/students', label: 'Manage Students', icon: '🎓', permission: PERMISSIONS.MANAGE_STUDENTS },
    { path: '/assessment/create', label: 'Create Assessment', icon: '➕', permission: PERMISSIONS.CREATE_ASSESSMENTS },
    { path: '/manage-assessments', label: 'Manage Assessments', icon: '📋' },
    { path: '/gradebook', label: 'Gradebook', icon: '📊' },
    { path: '/assessments', label: 'All Assessments', icon: '📝' },
    { path: '/progress', label: 'Progress Tracking', icon: '📈', permission: PERMISSIONS.VIEW_STUDENT_RESULTS },
    { path: '/admin/migration', label: 'Database Migration', icon: '🔄', permission: PERMISSIONS.MANAGE_SYSTEM },
    { path: '/admin/csv-migration', label: 'CSV Import', icon: '📊', permission: PERMISSIONS.MANAGE_SYSTEM },
    { path: '/admin/standards', label: 'Manage Standards', icon: '📏', permission: PERMISSIONS.MANAGE_SYSTEM },
    { path: '/admin/aeries-export', label: 'Export to Aeries', icon: '📤' },
    { path: '/admin/system', label: 'System Settings', icon: '⚙️', permission: PERMISSIONS.MANAGE_SYSTEM }
  ],
  
  [ROLES.TEACHER]: [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/students', label: 'My Students', icon: '🎓', permission: PERMISSIONS.VIEW_STUDENT_RESULTS },
    { path: '/assessment/create', label: 'Create Assessment', icon: '➕', permission: PERMISSIONS.CREATE_ASSESSMENTS },
    { path: '/manage-assessments', label: 'Manage Assessments', icon: '📋' },
    { path: '/gradebook', label: 'Gradebook', icon: '📊' },
    { path: '/assessments', label: 'My Assessments', icon: '📝' },
    { path: '/progress', label: 'Student Progress', icon: '📈', permission: PERMISSIONS.VIEW_STUDENT_RESULTS },
    { path: '/admin/aeries-export', label: 'Export to Aeries', icon: '📤' }
  ],
  
  [ROLES.STUDENT]: [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/assessments', label: 'My Assessments', icon: '📝', permission: PERMISSIONS.TAKE_ASSESSMENTS },
    { path: '/my-results', label: 'My Results', icon: '📊', permission: PERMISSIONS.VIEW_OWN_RESULTS }
  ]
};

export default {
  ROLES,
  PERMISSIONS,
  PERMISSIONS_MATRIX,
  ROUTE_PERMISSIONS,
  ROLE_DESCRIPTIONS,
  EMAIL_DOMAIN_ROLES,
  NAVIGATION_ITEMS,
  hasPermission,
  canAccessRoute,
  assignRoleFromEmail,
  isValidRole
};
