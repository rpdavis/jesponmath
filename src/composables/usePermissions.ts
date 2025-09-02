// Permissions composable for JepsonMath Assessment System
// Based on CaseManageVue usePermissions pattern

import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { 
  hasPermission, 
  canAccessRoute, 
  PERMISSIONS, 
  ROLES,
  NAVIGATION_ITEMS,
  type Permission,
  type UserRole 
} from '@/config/roles';

export function usePermissions() {
  const authStore = useAuthStore();

  // Role checks
  const isAdmin = computed(() => authStore.isAdmin);
  const isTeacher = computed(() => authStore.isTeacher);
  const isStudent = computed(() => authStore.isStudent);
  const userRole = computed(() => authStore.userRole);

  // Permission checking functions
  const can = (permission: Permission): boolean => {
    const role = authStore.userRole;
    return role ? hasPermission(role, permission) : false;
  };

  const canRoute = (routePath: string): boolean => {
    const role = authStore.userRole;
    return role ? canAccessRoute(role, routePath) : false;
  };

  // Specific permission checks for common actions
  const canManageUsers = computed(() => can(PERMISSIONS.MANAGE_USERS));
  const canManageSystem = computed(() => can(PERMISSIONS.MANAGE_SYSTEM));
  const canCreateAssessments = computed(() => can(PERMISSIONS.CREATE_ASSESSMENTS));
  const canEditAssessments = computed(() => can(PERMISSIONS.EDIT_ASSESSMENTS));
  const canDeleteAssessments = computed(() => can(PERMISSIONS.DELETE_ASSESSMENTS));
  const canManageStudents = computed(() => can(PERMISSIONS.MANAGE_STUDENTS));
  const canViewStudentResults = computed(() => can(PERMISSIONS.VIEW_STUDENT_RESULTS));
  const canImportClassroom = computed(() => can(PERMISSIONS.IMPORT_CLASSROOM));
  const canAssignAssessments = computed(() => can(PERMISSIONS.ASSIGN_ASSESSMENTS));
  const canTakeAssessments = computed(() => can(PERMISSIONS.TAKE_ASSESSMENTS));
  const canViewOwnResults = computed(() => can(PERMISSIONS.VIEW_OWN_RESULTS));
  const canViewOwnProgress = computed(() => can(PERMISSIONS.VIEW_OWN_PROGRESS));

  // Navigation items based on role
  const navigationItems = computed(() => {
    const role = authStore.userRole;
    if (!role) return [];
    
    const items = NAVIGATION_ITEMS[role] || [];
    
    // Filter items based on permissions
    return items.filter(item => {
      if (!item.permission) return true; // No permission required
      return can(item.permission);
    });
  });

  // Check if user can edit a specific student
  const canEditStudent = (student: any): boolean => {
    const currentUser = authStore.currentUser;
    if (!currentUser || !student) return false;

    // Admin can edit all students
    if (currentUser.role === ROLES.ADMIN) return true;
    
    // Teachers can edit their assigned students
    if (currentUser.role === ROLES.TEACHER) {
      // If student has teacherId, check if it matches current user
      if (student.teacherId) {
        return student.teacherId === currentUser.uid;
      }
      // If no specific teacher assigned, any teacher can edit
      return true;
    }
    
    // Students cannot edit other students
    return false;
  };

  // Check if user can view a specific student's data
  const canViewStudent = (student: any): boolean => {
    const currentUser = authStore.currentUser;
    if (!currentUser || !student) return false;

    // Admin can view all students
    if (currentUser.role === ROLES.ADMIN) return true;
    
    // Teachers can view their assigned students
    if (currentUser.role === ROLES.TEACHER) {
      if (student.teacherId) {
        return student.teacherId === currentUser.uid;
      }
      return true; // Can view all if no specific assignment
    }
    
    // Students can only view their own data
    if (currentUser.role === ROLES.STUDENT) {
      return student.seisId === currentUser.seisId;
    }
    
    return false;
  };

  // Check if user can view/edit a specific assessment
  const canEditAssessment = (assessment: any): boolean => {
    const currentUser = authStore.currentUser;
    if (!currentUser || !assessment) return false;

    // Admin can edit all assessments
    if (currentUser.role === ROLES.ADMIN) return true;
    
    // Teachers can edit their own assessments
    if (currentUser.role === ROLES.TEACHER) {
      return assessment.createdBy === currentUser.uid;
    }
    
    return false;
  };

  // Check if user can take a specific assessment
  const canTakeAssessment = (assessment: any): boolean => {
    const currentUser = authStore.currentUser;
    if (!currentUser || !assessment) return false;

    // Must have take assessments permission
    if (!can(PERMISSIONS.TAKE_ASSESSMENTS)) return false;

    // Students can only take assessments assigned to them
    if (currentUser.role === ROLES.STUDENT) {
      return assessment.studentSeisId === currentUser.seisId;
    }
    
    // Teachers and admins can take assessments for preview/testing
    return true;
  };

  // Check if user can view assessment results
  const canViewAssessmentResults = (assessment: any): boolean => {
    const currentUser = authStore.currentUser;
    if (!currentUser || !assessment) return false;

    // Admin can view all results
    if (currentUser.role === ROLES.ADMIN) return true;
    
    // Teachers can view results for their assessments or students
    if (currentUser.role === ROLES.TEACHER) {
      return assessment.createdBy === currentUser.uid || 
             assessment.teacherId === currentUser.uid;
    }
    
    // Students can view their own results
    if (currentUser.role === ROLES.STUDENT) {
      return assessment.studentSeisId === currentUser.seisId;
    }
    
    return false;
  };

  // Role-based UI helpers
  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case ROLES.ADMIN: return '#dc2626'; // Red
      case ROLES.TEACHER: return '#059669'; // Green  
      case ROLES.STUDENT: return '#2563eb'; // Blue
      default: return '#6b7280'; // Gray
    }
  };

  const getRoleIcon = (role: UserRole): string => {
    switch (role) {
      case ROLES.ADMIN: return '👑';
      case ROLES.TEACHER: return '👨‍🏫';
      case ROLES.STUDENT: return '🎓';
      default: return '👤';
    }
  };

  // Debug helper
  const debugPermissions = () => {
    const role = authStore.userRole;
    console.log('🔍 Permission Debug:', {
      role,
      permissions: Object.values(PERMISSIONS).filter(p => can(p)),
      navigationItems: navigationItems.value
    });
  };

  return {
    // Role checks
    isAdmin,
    isTeacher,
    isStudent,
    userRole,
    
    // Permission functions
    can,
    canRoute,
    
    // Specific permissions
    canManageUsers,
    canManageSystem,
    canCreateAssessments,
    canEditAssessments,
    canDeleteAssessments,
    canManageStudents,
    canViewStudentResults,
    canImportClassroom,
    canAssignAssessments,
    canTakeAssessments,
    canViewOwnResults,
    canViewOwnProgress,
    
    // Entity-specific permissions
    canEditStudent,
    canViewStudent,
    canEditAssessment,
    canTakeAssessment,
    canViewAssessmentResults,
    
    // Navigation
    navigationItems,
    
    // UI helpers
    getRoleColor,
    getRoleIcon,
    
    // Debug
    debugPermissions
  };
}
