import { ref } from 'vue'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import {
  createAssessment,
  updateAssessment,
  getAllGoals,
  regradeAssessmentResults,
} from '@/firebase/iepServices'
import {
  assignAssessmentToStudent,
  unassignAssessmentFromStudent,
  getAssessmentAssignments,
  getAutoDetectedAcademicPeriod,
} from '@/firebase/assignmentServices'
import { assignAssessmentToGoal } from '@/firebase/goalServices'
import { hasExistingResults } from '@/firebase/assessmentMigrationService'
import type { Assessment } from '@/types/iep'

export interface SaveOptions {
  assessmentData: any
  selectedStudents: string[]
  selectedQuarter: string
  assignmentMode: string
  availableStudents: any[]
  isEditing: boolean
  assessmentId: string
  currentUserUid: string
}

export function useAssessmentSave() {
  const saving = ref(false)
  const success = ref('')
  const error = ref('')
  const showUpdateWarning = ref(false)
  const existingResultsInfo = ref<{ resultCount: number; studentEmails: string[] }>({
    resultCount: 0,
    studentEmails: [],
  })

  /**
   * Check if assessment has existing results before editing
   */
  const checkForExistingResults = async (assessmentId: string): Promise<boolean> => {
    try {
      const resultsInfo = await hasExistingResults(assessmentId)
      if (resultsInfo.hasResults) {
        existingResultsInfo.value = {
          resultCount: resultsInfo.resultCount,
          studentEmails: resultsInfo.studentEmails,
        }
        showUpdateWarning.value = true
        return true // Has results, need warning
      }
      return false // No results, safe to proceed
    } catch (err) {
      console.warn('Could not check existing results:', err)
      return false // Continue with save if check fails
    }
  }

  /**
   * Cancel update (from warning dialog)
   */
  const cancelUpdate = () => {
    showUpdateWarning.value = false
    existingResultsInfo.value = { resultCount: 0, studentEmails: [] }
  }

  /**
   * Main save function
   */
  const saveAssessment = async (options: SaveOptions): Promise<string | null> => {
    saving.value = true
    success.value = ''
    error.value = ''

    try {
      // Determine students to assign
      let studentsToAssign: string[] = []
      if (options.assignmentMode === 'template') {
        studentsToAssign = []
      } else if (options.assignmentMode === 'all') {
        studentsToAssign = options.availableStudents.map((s) => s.uid)
      } else {
        studentsToAssign = options.selectedStudents
      }

      // Prepare assessment data with academic period
      // Determine academicPeriod value
      console.log('🔍 DEBUG QUARTER - Starting quarter processing...')
      console.log('🔍 DEBUG QUARTER - Input selectedQuarter:', options.selectedQuarter)
      console.log('🔍 DEBUG QUARTER - Type of selectedQuarter:', typeof options.selectedQuarter)
      
      let academicPeriodValue: string | undefined
      if (!options.selectedQuarter || options.selectedQuarter === 'auto') {
        academicPeriodValue = getAutoDetectedAcademicPeriod()
        console.log('🔍 DEBUG QUARTER - Using auto-detect, result:', academicPeriodValue)
      } else if (options.selectedQuarter === 'all') {
        academicPeriodValue = 'all'
        console.log('🔍 DEBUG QUARTER - Using "all" year')
      } else if (options.selectedQuarter && ['q1', 'q2', 'q3', 'q4'].includes(options.selectedQuarter)) {
        academicPeriodValue = options.selectedQuarter
        console.log('🔍 DEBUG QUARTER - Using specific quarter:', academicPeriodValue)
      } else {
        // Fallback: use auto-detect for invalid values
        academicPeriodValue = getAutoDetectedAcademicPeriod()
        console.log('🔍 DEBUG QUARTER - Invalid value, falling back to auto-detect:', academicPeriodValue)
      }

      console.log(`📅 Save - selectedQuarter: "${options.selectedQuarter}", academicPeriod: "${academicPeriodValue}"`)

      // Convert Date objects to Firestore Timestamps
      console.log('🔍 DEBUG DATES - Original assignDate:', options.assessmentData.assignDate)
      console.log('🔍 DEBUG DATES - Original dueDate:', options.assessmentData.dueDate)
      console.log('🔍 DEBUG DATES - assignDate type:', typeof options.assessmentData.assignDate)
      console.log('🔍 DEBUG DATES - dueDate type:', typeof options.assessmentData.dueDate)
      
      const assessmentData: any = {
        ...options.assessmentData,
        createdBy: options.currentUserUid,
        updatedAt: serverTimestamp(),
        academicPeriod: academicPeriodValue,
      }

      console.log('🔍 DEBUG QUARTER - Assessment data BEFORE timestamp conversion:')
      console.log('  - academicPeriod:', assessmentData.academicPeriod)
      console.log('  - assignDate:', assessmentData.assignDate)
      console.log('  - dueDate:', assessmentData.dueDate)

      // Convert assignDate to Timestamp if it exists
      if (assessmentData.assignDate instanceof Date) {
        assessmentData.assignDate = Timestamp.fromDate(assessmentData.assignDate)
        console.log(`📅 Converted assignDate to Timestamp: ${assessmentData.assignDate.toDate()}`)
      } else if (assessmentData.assignDate === undefined || assessmentData.assignDate === null) {
        // Explicitly set to undefined to remove it if it was cleared
        console.log('📅 assignDate is undefined/null, removing from data')
        assessmentData.assignDate = undefined
      } else {
        console.log('⚠️ WARNING: assignDate is not a Date object:', assessmentData.assignDate)
      }

      // Convert dueDate to Timestamp if it exists
      if (assessmentData.dueDate instanceof Date) {
        assessmentData.dueDate = Timestamp.fromDate(assessmentData.dueDate)
        console.log(`📅 Converted dueDate to Timestamp: ${assessmentData.dueDate.toDate()}`)
      } else if (assessmentData.dueDate === undefined || assessmentData.dueDate === null) {
        // Explicitly set to undefined to remove it if it was cleared
        console.log('📅 dueDate is undefined/null, removing from data')
        assessmentData.dueDate = undefined
      } else {
        console.log('⚠️ WARNING: dueDate is not a Date object:', assessmentData.dueDate)
      }

      console.log('🔍 DEBUG QUARTER - Assessment data AFTER timestamp conversion:')
      console.log('  - academicPeriod:', assessmentData.academicPeriod)
      console.log('  - assignDate:', assessmentData.assignDate)
      console.log('  - dueDate:', assessmentData.dueDate)

      // Remove student-specific fields from template
      delete assessmentData.studentSeisId
      delete assessmentData.studentUid

      let savedAssessmentId: string

      if (options.isEditing) {
        // EDITING MODE
        console.log('✏️ EDITING MODE: Updating assessment')
        console.log('🔍 DEBUG - Data being sent to updateAssessment:')
        console.log('  - assessmentId:', options.assessmentId)
        console.log('  - academicPeriod:', assessmentData.academicPeriod)
        console.log('  - assignDate:', assessmentData.assignDate)
        console.log('  - dueDate:', assessmentData.dueDate)
        console.log('🔍 DEBUG - Full assessmentData object:', JSON.stringify(assessmentData, null, 2))

        await updateAssessment(options.assessmentId, assessmentData)
        savedAssessmentId = options.assessmentId
        
        console.log('✅ updateAssessment call completed for ID:', savedAssessmentId)

        // Manage student assignments
        const currentlyAssigned = await getAssessmentAssignments(options.assessmentId)
        const currentlyAssignedUids = currentlyAssigned.map((s) => s.studentUid)

        const studentsToAdd = studentsToAssign.filter((uid) => !currentlyAssignedUids.includes(uid))
        const studentsToRemove = currentlyAssignedUids.filter(
          (uid) => !studentsToAssign.includes(uid),
        )

        // Add new assignments
        for (const studentUid of studentsToAdd) {
          await assignAssessmentToStudent(options.assessmentId, studentUid, options.currentUserUid)
        }

        // Remove old assignments
        for (const studentUid of studentsToRemove) {
          await unassignAssessmentFromStudent(options.assessmentId, studentUid)
        }

        console.log(`✅ Updated assignments: +${studentsToAdd.length}, -${studentsToRemove.length}`)

        // Regrade existing results
        try {
          const regradedCount = await regradeAssessmentResults(
            options.assessmentId,
            assessmentData as Assessment,
          )
          if (regradedCount > 0) {
            success.value = `Assessment updated! ${regradedCount} result(s) were re-graded.`
          } else {
            success.value = 'Assessment updated successfully!'
          }
        } catch (regradeError) {
          console.warn('⚠️ Could not regrade results:', regradeError)
          success.value = 'Assessment updated successfully!'
        }
      } else {
        // CREATION MODE
        console.log('➕ CREATION MODE: Creating new assessment')

        const newId = await createAssessment(assessmentData)
        savedAssessmentId = newId
        console.log('✅ Created assessment:', newId)

        // Assign to students
        for (const studentUid of studentsToAssign) {
          await assignAssessmentToStudent(newId, studentUid, options.currentUserUid)
        }

        console.log(`✅ Assigned to ${studentsToAssign.length} students`)

        // Connect to goal if specified
        if (assessmentData.goalId) {
          await assignAssessmentToGoal(assessmentData.goalId, newId)
          console.log('✅ Connected to goal:', assessmentData.goalId)
        }

        success.value = `Assessment created and assigned to ${studentsToAssign.length} students!`
      }

      return savedAssessmentId
    } catch (err: any) {
      console.error('❌ Error saving assessment:', err)
      error.value = err.message || 'Failed to save assessment'
      return null
    } finally {
      saving.value = false
    }
  }

  return {
    // State
    saving,
    success,
    error,
    showUpdateWarning,
    existingResultsInfo,

    // Methods
    saveAssessment,
    checkForExistingResults,
    cancelUpdate,
  }
}
