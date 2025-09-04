import { createRouter, createWebHistory } from 'vue-router'
import AssessmentHome from '@/components/AssessmentHome.vue'
import RoleBasedLogin from '@/components/auth/RoleBasedLogin.vue'
import AssessmentEditor from '@/components/assessments/AssessmentEditor.vue'
import AssessmentGenerator from '@/components/assessments/AssessmentGenerator.vue'
import StudentAssessments from '@/components/assessments/StudentAssessments.vue'
import StudentResults from '@/components/StudentResults.vue'
import AssessmentTaking from '@/components/assessments/AssessmentTaking.vue'
import ProgressTracking from '@/components/ProgressTracking.vue'
import StudentManagement from '@/components/StudentManagement.vue'
import AssessmentManagement from '@/components/AssessmentManagement.vue'
import UserManagement from '@/components/admin/UserManagement.vue'
import TeacherManagement from '@/components/admin/TeacherManagement.vue'
import Gradebook from '@/components/Gradebook.vue'
import { authGuard, guestGuard, teacherGuard, adminGuard, studentGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    {
      path: '/login',
      name: 'login',
      component: RoleBasedLogin,
      beforeEnter: guestGuard
    },
    
    // Protected routes - require authentication
    {
      path: '/',
      name: 'home',
      component: AssessmentHome,
      beforeEnter: authGuard
    },
    
    // Teacher & Admin routes
    {
      path: '/assessment/create',
      name: 'create-assessment',
      component: AssessmentEditor,
      beforeEnter: [authGuard, teacherGuard]
    },
    {
      path: '/assessment/edit/:id',
      name: 'edit-assessment',
      component: AssessmentEditor,
      beforeEnter: [authGuard, teacherGuard]
    },
    {
      path: '/assessment/generate',
      name: 'generate-assessment',
      component: AssessmentGenerator,
      beforeEnter: [authGuard, teacherGuard]
    },
    {
      path: '/assessment/:id',
      name: 'take-assessment',
      component: AssessmentTaking,
      beforeEnter: authGuard
    },
    {
      path: '/assessment/:assessmentId/results/:resultId',
      name: 'view-assessment-result',
      component: () => import('@/components/assessments/AssessmentResult.vue'),
      beforeEnter: authGuard
    },
    {
      path: '/progress',
      name: 'progress-tracking',
      component: ProgressTracking,
      beforeEnter: [authGuard, teacherGuard]
    },
    {
      path: '/students',
      name: 'student-management',
      component: StudentManagement,
      beforeEnter: [authGuard, teacherGuard] // Both teachers and admins can access, but with different views
    },
    {
      path: '/manage-assessments',
      name: 'assessment-management',
      component: AssessmentManagement,
      beforeEnter: [authGuard, teacherGuard]
    },
    {
      path: '/gradebook',
      name: 'gradebook',
      component: Gradebook,
      beforeEnter: [authGuard, teacherGuard]
    },
    
    // Student routes (can also be accessed by teachers/admins)
    {
      path: '/assessments',
      name: 'student-assessments',
      component: StudentAssessments,
      beforeEnter: authGuard
    },
    {
      path: '/my-results',
      name: 'student-results',
      component: StudentResults,
      beforeEnter: authGuard
    },
    
    // Admin-only routes
    {
      path: '/admin',
      name: 'admin',
      redirect: '/admin/users',
      beforeEnter: [authGuard, adminGuard]
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: UserManagement,
      beforeEnter: [authGuard, adminGuard]
    },
    {
      path: '/admin/teachers',
      name: 'admin-teachers',
      component: TeacherManagement,
      beforeEnter: [authGuard, adminGuard]
    },
    
    // Fallback redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

export default router
