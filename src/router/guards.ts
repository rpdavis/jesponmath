// Router guards for JepsonMath Assessment System
// Based on CaseManageVue guards pattern

import { type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { canAccessRoute, ROLES, type UserRole } from '@/config/roles';

// Auth guard - ensures user is authenticated
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  console.log('🛡️ Auth Guard:', {
    to: to.path,
    from: from.path,
    isLoading: authStore.isLoading,
    isAuthenticated: authStore.isAuthenticated
  });
  
  // Wait for auth to initialize
  let attempts = 0;
  const maxAttempts = 100; // 5 seconds max wait
  
  while (authStore.isLoading && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    console.error('❌ Auth guard timeout - redirecting to login');
    next('/login');
    return;
  }
  
  if (!authStore.isAuthenticated) {
    console.log('🚫 User not authenticated - redirecting to login');
    next('/login');
    return;
  }
  
  if (!authStore.currentUser?.role) {
    console.log('🚫 User has no role assigned - redirecting to login');
    next('/login');
    return;
  }
  
  console.log('✅ Auth guard passed:', authStore.currentUser.email);
  next();
};

// Role guard - ensures user has required role
export const roleGuard = (allowedRoles: UserRole[]) => {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();
    
    // Wait for auth to initialize (same as authGuard)
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds max wait
    
    while (authStore.isLoading && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
    }
    
    console.log('🛡️ Role Guard:', {
      to: to.path,
      toFull: to.fullPath,
      userRole: authStore.userRole,
      currentUserRole: authStore.currentUser?.role,
      allowedRoles,
      allowedRolesString: JSON.stringify(allowedRoles),
      isAuthenticated: authStore.isAuthenticated,
      isLoading: authStore.isLoading,
      attempts
    });
    
    if (!authStore.isAuthenticated || !authStore.currentUser?.role) {
      console.log('🚫 Not authenticated for role guard - redirecting to login');
      next('/login');
      return;
    }
    
    const userRole = authStore.currentUser.role;
    const isAllowed = allowedRoles.includes(userRole);
    
    console.log('🔍 Role check:', {
      userRole,
      allowedRoles,
      isAllowed,
      includesCheck: `allowedRoles.includes("${userRole}") = ${isAllowed}`
    });
    
    if (!isAllowed) {
      console.log('🚫 Role not allowed:', userRole, 'Required:', allowedRoles);
      console.log('🚫 Redirecting to /');
      
      // Always redirect to home - let home page show appropriate content
      next('/');
      return;
    }
    
    console.log('✅ Role guard passed:', userRole);
    next();
  };
};

// Admin guard - shorthand for admin-only routes
export const adminGuard = roleGuard([ROLES.ADMIN]);

// Teacher guard - allows teachers and admins
export const teacherGuard = roleGuard([ROLES.ADMIN, ROLES.TEACHER]);

// Student guard - allows students only (for student-specific routes)
export const studentGuard = roleGuard([ROLES.STUDENT]);

// Permission guard - checks specific permissions
export const permissionGuard = (routePath: string) => {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();
    
    console.log('🛡️ Permission Guard:', {
      to: to.path,
      routePath,
      userRole: authStore.userRole
    });
    
    if (!authStore.isAuthenticated || !authStore.currentUser?.role) {
      console.log('🚫 Not authenticated for permission guard');
      next('/login');
      return;
    }
    
    const userRole = authStore.currentUser.role;
    
    if (!canAccessRoute(userRole, routePath)) {
      console.log('🚫 Permission denied for route:', routePath, 'Role:', userRole);
      
      // Redirect to appropriate dashboard
      switch (userRole) {
        case ROLES.ADMIN:
          next('/admin');
          break;
        case ROLES.TEACHER:
          next('/');
          break;
        case ROLES.STUDENT:
          next('/assessments');
          break;
        default:
          next('/login');
      }
      return;
    }
    
    console.log('✅ Permission guard passed for route:', routePath);
    next();
  };
};

// Guest guard - only allows unauthenticated users (for login page)
export const guestGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  console.log('🛡️ Guest Guard:', {
    to: to.path,
    isAuthenticated: authStore.isAuthenticated
  });
  
  // Wait for auth to initialize
  let attempts = 0;
  const maxAttempts = 100;
  
  while (authStore.isLoading && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  
  if (authStore.isAuthenticated) {
    console.log('🔄 User already authenticated - redirecting to home');
    
    // Always redirect to home page - let the home page show role-specific content
    next('/');
    return;
  }
  
  console.log('✅ Guest guard passed');
  next();
};

// Setup global navigation guards
export const setupGuards = (router: any) => {
  console.log('🛡️ Setting up router guards...');
  
  // Global before guard for debugging
  router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    console.log('🧭 Navigation:', from.path, '→', to.path);
    next();
  });
  
  // Global after guard for debugging
  router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    console.log('✅ Navigation completed:', from.path, '→', to.path);
  });
  
  console.log('🛡️ Router guards setup completed');
};

export default {
  authGuard,
  roleGuard,
  adminGuard,
  teacherGuard,
  studentGuard,
  permissionGuard,
  guestGuard,
  setupGuards
};
