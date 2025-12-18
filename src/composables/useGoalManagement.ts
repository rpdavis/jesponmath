// Goal Management Composable
// Handles goal CRUD operations, data loading, and state management

import { ref, computed, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  getAllGoals,
  getGoalsByTeacher,
  createGoal,
  updateGoal,
  deleteGoal as deleteGoalService,
  markGoalAsMet as markGoalAsMetService,
  archiveGoal as archiveGoalService,
  reactivateGoal as reactivateGoalService,
  assignAssessmentToGoal as assignAssessmentService,
  removeAssessmentFromGoal as removeAssessmentService,
} from '@/firebase/goalServices'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import {
  getAllAssessments,
  getAssessmentsByTeacher,
  createAssessment,
} from '@/firebase/iepServices'
import {
  getAssignmentsForStudents,
  assignAssessmentToStudent as assignToStudentService,
} from '@/firebase/assignmentServices'
import type { Goal, Assessment, Student } from '@/types/iep'
import type { Student as UserStudent } from '@/types/users'

export function useGoalManagement() {
  const router = useRouter()
  const authStore = useAuthStore()

  // State
  const loading = ref(true)
  const saving = ref(false)
  const goals = ref<Goal[]>([])
  const students = ref<UserStudent[]>([])
  const assessments = ref<Assessment[]>([])
  const studentAssignments = ref<Record<string, string[]>>({})

  // Computed
  const isTeacher = computed(() => authStore.currentUser?.role === 'teacher')
  const isAdmin = computed(() => authStore.currentUser?.role === 'admin')

  // Data Loading
  const loadData = async () => {
    try {
      loading.value = true

      // Load based on user role
      if (authStore.isAdmin) {
        const [goalsData, studentsData, assessmentsData] = await Promise.all([
          getAllGoals(),
          getAllStudents(),
          getAllAssessments(),
        ])
        goals.value = goalsData
        students.value = studentsData
        assessments.value = assessmentsData
      } else {
        // Teachers see only their goals and students
        const [goalsData, studentsData, assessmentsData] = await Promise.all([
          getGoalsByTeacher(authStore.currentUser!.uid),
          getStudentsByTeacher(authStore.currentUser!.uid),
          getAssessmentsByTeacher(authStore.currentUser!.uid),
        ])
        goals.value = goalsData
        students.value = studentsData
        assessments.value = assessmentsData
      }

      // Load student assignments efficiently (bulk query)
      await loadStudentAssignments()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      loading.value = false
    }
  }

  const loadStudentAssignments = async () => {
    try {
      if (students.value.length === 0) {
        studentAssignments.value = {}
        return
      }

      // Use bulk query instead of N+1 queries
      const studentUids = students.value.map((s) => s.uid)
      const teacherUid = authStore.isAdmin ? undefined : authStore.currentUser!.uid

      const assignmentsByStudent = await getAssignmentsForStudents(studentUids, teacherUid)

      // Convert to the format expected by the component (just assessment IDs)
      const assignments: Record<string, string[]> = {}
      for (const studentUid in assignmentsByStudent) {
        assignments[studentUid] = assignmentsByStudent[studentUid].map((a) => a.assessmentId)
      }

      studentAssignments.value = assignments
    } catch (error) {
      console.error('Error loading student assignments:', error)
      // Fallback to empty assignments if bulk query fails
      studentAssignments.value = {}
    }
  }

  // Goal CRUD Operations
  const saveGoal = async (goalData: Partial<Goal>, goalId?: string) => {
    try {
      saving.value = true

      if (goalId) {
        // Update existing goal
        await updateGoal(goalId, {
          ...goalData,
          updatedBy: authStore.currentUser!.uid,
        } as Goal)
      } else {
        // Create new goal
        await createGoal({
          ...goalData,
          createdBy: authStore.currentUser!.uid,
          isActive: true,
          isMet: false,
          isArchived: false,
        } as Goal)
      }

      // Reload data to get updated goals
      await loadData()
      return true
    } catch (error) {
      console.error('Error saving goal:', error)
      throw error
    } finally {
      saving.value = false
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
        return false
      }

      await deleteGoalService(goalId)
      await loadData()
      return true
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Error deleting goal. Please try again.')
      return false
    }
  }

  const markGoalAsMet = async (goalId: string) => {
    try {
      await markGoalAsMetService(goalId)
      await loadData()
      return true
    } catch (error) {
      console.error('Error marking goal as met:', error)
      alert('Error updating goal. Please try again.')
      return false
    }
  }

  const archiveGoal = async (goalId: string) => {
    try {
      await archiveGoalService(goalId)
      await loadData()
      return true
    } catch (error) {
      console.error('Error archiving goal:', error)
      alert('Error updating goal. Please try again.')
      return false
    }
  }

  const reactivateGoal = async (goalId: string) => {
    try {
      await reactivateGoalService(goalId)
      await loadData()
      return true
    } catch (error) {
      console.error('Error reactivating goal:', error)
      alert('Error updating goal. Please try again.')
      return false
    }
  }

  // Assessment Management
  const assignAssessmentToGoal = async (goalId: string, assessmentId: string) => {
    try {
      await assignAssessmentService(goalId, assessmentId)
      await loadData()
      return true
    } catch (error) {
      console.error('Error assigning assessment to goal:', error)
      alert('Error assigning assessment. Please try again.')
      return false
    }
  }

  const removeAssessmentFromGoal = async (goalId: string, assessmentId: string) => {
    try {
      if (
        !confirm(
          'Are you sure you want to remove this assessment from the goal? This will not delete the assessment.',
        )
      ) {
        return false
      }

      await removeAssessmentService(goalId, assessmentId)
      await loadData()
      return true
    } catch (error) {
      console.error('Error removing assessment from goal:', error)
      alert('Error removing assessment. Please try again.')
      return false
    }
  }

  const createProgressAssessment = async (assessmentData: {
    title: string
    description?: string
    gradeLevel?: number
    goalId?: string
  }) => {
    try {
      saving.value = true

      const data = {
        title: assessmentData.title,
        description: assessmentData.description || '',
        gradeLevel: assessmentData.gradeLevel ?? 7,
        category: 'PA' as const,
        goalId: assessmentData.goalId || '',
        createdBy: authStore.currentUser!.uid,
        questions: [],
        totalPoints: 0,
        instructions: 'Complete all questions to the best of your ability.',
        accommodations: [],
      }

      const assessmentId = await createAssessment(data)

      // If connected to a goal, assign it
      if (assessmentData.goalId) {
        await assignAssessmentService(assessmentData.goalId, assessmentId)
      }

      // Navigate to assessment editor
      router.push(`/assessment/edit/${assessmentId}`)
      return assessmentId
    } catch (error) {
      console.error('Error creating assessment:', error)
      throw error
    } finally {
      saving.value = false
    }
  }

  // Utility Functions
  const getStudentName = (studentUid: string) => {
    const student = students.value.find((s) => s.uid === studentUid)
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'
  }

  const getAssessmentTitle = (assessmentId: string) => {
    const assessment = assessments.value.find((a) => a.id === assessmentId)
    return assessment ? assessment.title : 'Unknown Assessment'
  }

  const isAssessmentAssignedToStudent = (assessmentId: string, studentUid: string): boolean => {
    return studentAssignments.value[studentUid]?.includes(assessmentId) || false
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  // Student Assignment Functions
  const assignAssessmentToStudent = async (
    assessmentId: string,
    studentUid: string,
    goalId: string,
  ) => {
    try {
      await assignToStudentService(assessmentId, studentUid, authStore.currentUser!.uid)

      // Update local state
      if (!studentAssignments.value[studentUid]) {
        studentAssignments.value[studentUid] = []
      }
      if (!studentAssignments.value[studentUid].includes(assessmentId)) {
        studentAssignments.value[studentUid].push(assessmentId)
      }

      alert(`Assessment assigned to ${getStudentName(studentUid)} successfully!`)
      return true
    } catch (error) {
      console.error('Error assigning assessment to student:', error)
      alert('Error assigning assessment. Please try again.')
      return false
    }
  }

  const assignAllAssessmentsToAllStudents = async (goal: Goal) => {
    if (!goal.assignedAssessments?.length) {
      alert('No assessments to assign.')
      return false
    }

    const studentList = goal.assignedStudents?.length
      ? goal.assignedStudents
      : goal.studentUid
        ? [goal.studentUid]
        : []

    if (!studentList.length) {
      alert('No students assigned to this goal.')
      return false
    }

    const assessmentCount = goal.assignedAssessments.length
    const studentCount = studentList.length
    const totalAssignments = assessmentCount * studentCount

    if (
      !confirm(
        `Assign all ${assessmentCount} assessment(s) to all ${studentCount} student(s)?\n\nThis will create ${totalAssignments} total assignment(s).`,
      )
    ) {
      return false
    }

    try {
      saving.value = true
      let successCount = 0
      let skipCount = 0

      for (const assessmentId of goal.assignedAssessments) {
        for (const studentUid of studentList) {
          // Skip if already assigned
          if (studentAssignments.value[studentUid]?.includes(assessmentId)) {
            skipCount++
            continue
          }

          await assignToStudentService(assessmentId, studentUid, authStore.currentUser!.uid)

          // Update local state
          if (!studentAssignments.value[studentUid]) {
            studentAssignments.value[studentUid] = []
          }
          studentAssignments.value[studentUid].push(assessmentId)
          successCount++
        }
      }

      alert(
        `✅ Successfully assigned ${successCount} assessment(s)!\n${skipCount > 0 ? `⏭️ Skipped ${skipCount} (already assigned)` : ''}`,
      )
      return true
    } catch (error) {
      console.error('Error bulk assigning assessments:', error)
      alert('Error assigning assessments. Some may have been assigned successfully.')
      return false
    } finally {
      saving.value = false
    }
  }

  const createAssessmentForGoal = (goalId: string) => {
    const goal = goals.value.find((g) => g.id === goalId)
    if (goal) {
      return {
        goalId: goalId,
        title: `${goal.goalTitle} - Progress Assessment`,
        gradeLevel: goal.gradeLevel ?? undefined,
      }
    }
    return null
  }

  return {
    // State
    loading,
    saving,
    goals,
    students,
    assessments,
    studentAssignments,

    // Computed
    isTeacher,
    isAdmin,

    // Methods
    loadData,
    loadStudentAssignments,
    saveGoal,
    deleteGoal,
    markGoalAsMet,
    archiveGoal,
    reactivateGoal,
    assignAssessmentToGoal,
    removeAssessmentFromGoal,
    createProgressAssessment,

    // Utilities
    getStudentName,
    getAssessmentTitle,
    isAssessmentAssignedToStudent,
    formatDate,

    // Student Assignment
    assignAssessmentToStudent,
    assignAllAssessmentsToAllStudents,
    createAssessmentForGoal,
  }
}







