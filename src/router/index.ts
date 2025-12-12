import { createRouter, createWebHistory } from 'vue-router'
import AssessmentHome from '@/components/AssessmentHome.vue'
import RoleBasedLogin from '@/components/auth/RoleBasedLogin.vue'
import AssessmentEditor from '@/components/assessments/AssessmentEditor.vue'
import AssessmentGenerator from '@/components/assessments/AssessmentGenerator.vue'
import StudentAssessments from '@/components/assessments/StudentAssessments.vue'
import StudentResults from '@/components/StudentResults.vue'
import StudentSummary from '@/components/StudentSummary.vue'
import AssessmentTaking from '@/components/assessments/AssessmentTaking.vue'
import ProgressTracking from '@/components/ProgressTracking.vue'
import StudentManagement from '@/components/StudentManagement.vue'
import AssessmentManagement from '@/components/AssessmentManagement.vue'
import GoalManagement from '@/components/management/GoalManagement.vue'
import ProgressAssessment from '@/components/ProgressAssessment.vue'
import ProgressAssessmentGradebook from '@/components/ProgressAssessmentGradebook.vue'
import ProgressAssessmentManagement from '@/components/management/ProgressAssessmentManagement.vue'
import UserManagement from '@/components/admin/UserManagement.vue'
import TeacherManagement from '@/components/admin/TeacherManagement.vue'
import AdminFixer from '@/components/admin/AdminFixer.vue'
import DatabaseMigration from '@/components/admin/DatabaseMigration.vue'
import CSVMigration from '@/components/admin/CSVMigration.vue'
import StandardsManager from '@/components/admin/StandardsManager.vue'
import AcademicPeriodManager from '@/components/admin/AcademicPeriodManager.vue'
import AeriesGradeExport from '@/components/admin/AeriesGradeExport.vue'
import StandardAssessmentExport from '@/components/admin/StandardAssessmentExport.vue'
import CategoryMigration from '@/components/admin/CategoryMigration.vue'
import GoalImporter from '@/components/admin/GoalImporter.vue'
import GoalFixer from '@/components/admin/GoalFixer.vue'
import StudentTeacherFixer from '@/components/admin/StudentTeacherFixer.vue'
import GoalQuestionDebugger from '@/components/admin/GoalQuestionDebugger.vue'
import GoalTemplateAnalyzer from '@/components/admin/GoalTemplateAnalyzer.vue'
import GoalTemplateManagement from '@/components/admin/GoalTemplateManagement.vue'
import RubricManagement from '@/components/admin/RubricManagement.vue'
import FluencyDuplicateFixer from '@/components/admin/FluencyDuplicateFixer.vue'
import SystemSettings from '@/components/admin/SystemSettings.vue'
import BackupExport from '@/components/admin/BackupExport.vue'
import MathDiagnostic from '@/components/diagnostics/MathDiagnostic.vue'
import AdaptiveMathDiagnostic from '@/components/diagnostics/AdaptiveMathDiagnostic.vue'
import MathFactsDiagnostic from '@/components/diagnostics/MathFactsDiagnostic.vue'
import FoundationalFluency from '@/components/diagnostics/FoundationalFluency.vue'
import FoundationalFluencyManagement from '@/components/diagnostics/FoundationalFluencyManagement.vue'
import FoundationalFluencyResults from '@/components/diagnostics/FoundationalFluencyResults.vue'
import FoundationalFluencyPrintable from '@/components/diagnostics/FoundationalFluencyPrintable.vue'
import MathFluencyPlacementDiagnostic from '@/components/diagnostics/MathFluencyPlacementDiagnostic.vue'
import MathFluencyTeacherView from '@/components/diagnostics/MathFluencyTeacherView.vue'
import MathFluencyStudentProgressView from '@/components/diagnostics/MathFluencyStudentProgressView.vue'
import StrategyLesson from '@/components/lessons/StrategyLesson.vue'
import AccelerationSimulator from '@/views/AccelerationSimulator.vue'
import DebugModeManager from '@/components/diagnostics/DebugModeManager.vue'
import FluencyCPMReport from '@/components/diagnostics/FluencyCPMReport.vue'
import FluencyProgressReset from '@/components/admin/FluencyProgressReset.vue'
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
      beforeEnter: guestGuard,
    },

    // Protected routes - require authentication
    {
      path: '/',
      name: 'home',
      component: AssessmentHome,
      beforeEnter: authGuard,
    },

    // Teacher & Admin routes
    {
      path: '/assessment/create',
      name: 'create-assessment',
      component: AssessmentEditor,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/assessment/edit/:id',
      name: 'edit-assessment',
      component: AssessmentEditor,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/assessment/generate',
      name: 'generate-assessment',
      component: AssessmentGenerator,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/assessment/:id',
      name: 'take-assessment',
      component: AssessmentTaking,
      beforeEnter: authGuard,
    },
    {
      path: '/assessment/:assessmentId/results/:resultId',
      name: 'view-assessment-result',
      component: () => import('@/components/assessments/AssessmentResult.vue'),
      beforeEnter: authGuard,
    },
    {
      path: '/progress',
      name: 'progress-tracking',
      component: ProgressTracking,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/students',
      name: 'student-management',
      component: StudentManagement,
      beforeEnter: [authGuard, teacherGuard], // Both teachers and admins can access, but with different views
    },
    {
      path: '/manage-assessments',
      name: 'assessment-management',
      component: AssessmentManagement,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/gradebook',
      name: 'gradebook',
      component: Gradebook,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/goals',
      name: 'goal-management',
      component: GoalManagement,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/progress-assessment',
      name: 'progress-assessment',
      component: ProgressAssessment,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/progress-assessment-gradebook',
      name: 'progress-assessment-gradebook',
      component: ProgressAssessmentGradebook,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/progress-assessment-management',
      name: 'progress-assessment-management',
      component: ProgressAssessmentManagement,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/diagnostic/math',
      name: 'math-diagnostic',
      component: MathDiagnostic,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/diagnostic/math/adaptive',
      name: 'adaptive-math-diagnostic',
      component: AdaptiveMathDiagnostic,
      beforeEnter: [authGuard, teacherGuard],
    },
    {
      path: '/diagnostic/math-facts',
      name: 'math-facts-diagnostic',
      component: MathFactsDiagnostic,
      beforeEnter: [authGuard], // Allow students to access when assigned
    },
    {
      path: '/fluency/placement-diagnostic',
      name: 'fluency-placement-diagnostic',
      component: MathFluencyPlacementDiagnostic,
      beforeEnter: [authGuard], // Students can take when assigned, teachers can administer
    },
    {
      path: '/fluency/lesson/:lessonId',
      name: 'strategy-lesson',
      component: StrategyLesson,
      beforeEnter: [authGuard], // Students can access lessons
    },
    {
      path: '/fluency/teacher-view',
      name: 'fluency-teacher-view',
      component: MathFluencyTeacherView,
      beforeEnter: [authGuard, teacherGuard], // Teachers only
    },
    {
      path: '/fluency/acceleration-simulator',
      name: 'acceleration-simulator',
      component: AccelerationSimulator,
      beforeEnter: [authGuard, teacherGuard], // Teachers only - test acceleration logic
    },
    {
      path: '/fluency/debug-manager',
      name: 'debug-mode-manager',
      component: DebugModeManager,
      beforeEnter: [authGuard, teacherGuard], // Teachers only - enable debug logging for students
    },
    {
      path: '/fluency/cpm-report',
      name: 'fluency-cpm-report',
      component: FluencyCPMReport,
      beforeEnter: [authGuard, teacherGuard], // Teachers only - CPM reporting for IEPs
    },
    {
      path: '/fluency/reset-progress',
      name: 'fluency-reset-progress',
      component: FluencyProgressReset,
      beforeEnter: [authGuard, teacherGuard], // Teachers only - reset student progress for testing
    },
    {
      path: '/fluency/teacher-view/:studentUid',
      name: 'fluency-teacher-student-detail',
      component: () => import('@/components/diagnostics/MathFluencyTeacherStudentDetail.vue'),
      beforeEnter: [authGuard, teacherGuard], // Teachers only - individual student fact grid
    },
    {
      path: '/fluency/paper-assessment',
      name: 'fluency-paper-assessment',
      component: () => import('@/components/diagnostics/MathFluencyPaperAssessment.vue'),
      beforeEnter: [authGuard, teacherGuard], // Teachers only - generate paper assessments
    },
    {
      path: '/fluency/score-entry',
      name: 'fluency-score-entry',
      component: () => import('@/components/diagnostics/MathFluencyScoreEntry.vue'),
      beforeEnter: [authGuard, teacherGuard], // Teachers only - enter assessment scores
    },
    {
      path: '/fluency/daily-practice',
      name: 'fluency-daily-practice',
      component: () => import('@/components/diagnostics/MathFluencyDailyPractice.vue'),
      beforeEnter: [authGuard], // Students access for daily practice
    },
    {
      path: '/fluency/student/:studentUid',
      name: 'fluency-student-detail',
      component: MathFluencyStudentProgressView, // NEW comprehensive progress view
      beforeEnter: [authGuard, teacherGuard], // Teachers view individual student
    },
    {
      path: '/fluency/my-progress',
      name: 'fluency-my-progress',
      component: () => import('@/components/diagnostics/MathFluencyStudentProgress.vue'),
      beforeEnter: [authGuard], // Students view their own progress
    },
    {
      path: '/fluency/dashboard',
      name: 'fluency-dashboard',
      component: () => import('@/components/diagnostics/MathFluencyDashboard.vue'),
      beforeEnter: [authGuard, teacherGuard], // Teachers view class overview
    },
    {
      path: '/diagnostic/foundational-fluency',
      name: 'foundational-fluency',
      component: FoundationalFluency,
      beforeEnter: [authGuard], // Teachers practice/assign, students take when assigned
    },
    {
      path: '/diagnostic/foundational-fluency-manage',
      name: 'foundational-fluency-manage',
      component: FoundationalFluencyManagement,
      beforeEnter: [authGuard, teacherGuard], // Teachers only
    },
    {
      path: '/diagnostic/foundational-fluency-results',
      name: 'foundational-fluency-results',
      component: FoundationalFluencyResults,
      beforeEnter: [authGuard, teacherGuard], // Teachers only
    },
    {
      path: '/diagnostic/foundational-fluency-print',
      name: 'foundational-fluency-print',
      component: FoundationalFluencyPrintable,
      beforeEnter: [authGuard, teacherGuard], // Teachers only
    },
    {
      path: '/diagnostic/foundational',
      name: 'foundational-diagnostic',
      component: () => import('@/components/diagnostics/FoundationalDiagnostic.vue'),
      beforeEnter: [authGuard], // Allow students to access when assigned
    },
    {
      path: '/diagnostic/results',
      name: 'diagnostic-results',
      component: () => import('@/components/diagnostics/DiagnosticResults.vue'),
      beforeEnter: [authGuard, teacherGuard],
    },

    // Student routes (can also be accessed by teachers/admins)
    {
      path: '/assessments',
      name: 'student-assessments',
      component: StudentAssessments,
      beforeEnter: authGuard,
    },
    {
      path: '/my-results',
      name: 'student-results',
      component: StudentResults,
      beforeEnter: authGuard,
    },
    {
      path: '/student-summary',
      name: 'student-summary',
      component: StudentSummary,
      beforeEnter: authGuard,
    },
    {
      path: '/student-summary/:studentUid',
      name: 'student-summary-view',
      component: StudentSummary,
      beforeEnter: [authGuard, teacherGuard], // Teachers can view any student's summary
    },

    // Admin-only routes
    {
      path: '/admin',
      name: 'admin',
      redirect: '/admin/users',
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: UserManagement,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/teachers',
      name: 'admin-teachers',
      component: TeacherManagement,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/migration',
      name: 'database-migration',
      component: DatabaseMigration,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/csv-migration',
      name: 'csv-migration',
      component: CSVMigration,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/import-goals',
      name: 'goal-import',
      component: GoalImporter,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/fix-goals',
      name: 'goal-fixer',
      component: GoalFixer,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/fix-student-teachers',
      name: 'student-teacher-fixer',
      component: StudentTeacherFixer,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/fix-fluency-duplicates',
      name: 'fluency-duplicate-fixer',
      component: FluencyDuplicateFixer,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/debug-goal-questions',
      name: 'goal-question-debugger',
      component: GoalQuestionDebugger,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/analyze-goals',
      name: 'goal-template-analyzer',
      component: GoalTemplateAnalyzer,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/templates',
      name: 'goal-template-management',
      component: GoalTemplateManagement,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/rubrics',
      name: 'rubric-management',
      component: RubricManagement,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/standards',
      name: 'standards-manager',
      component: StandardsManager,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/periods',
      name: 'academic-periods',
      component: AcademicPeriodManager,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/aeries-export',
      name: 'aeries-export',
      component: AeriesGradeExport,
      beforeEnter: [authGuard, teacherGuard], // Both teachers and admins can export grades
    },
    {
      path: '/admin/standard-assessment-export',
      name: 'standard-assessment-export',
      component: StandardAssessmentExport,
      beforeEnter: [authGuard, teacherGuard], // Both teachers and admins can export
    },
    {
      path: '/admin/category-migration',
      name: 'category-migration',
      component: CategoryMigration,
      beforeEnter: [authGuard, adminGuard], // Admin only for database migrations
    },
    {
      path: '/admin/system',
      name: 'system-settings',
      component: SystemSettings,
      beforeEnter: [authGuard, adminGuard],
    },
    {
      path: '/admin/backup',
      name: 'backup-export',
      component: BackupExport,
      beforeEnter: [authGuard, adminGuard],
    },

    // Fallback redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
