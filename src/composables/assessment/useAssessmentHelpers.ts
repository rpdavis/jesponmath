import { ref, computed } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { AssessmentQuestion, Goal } from '@/types/iep'
import type { Student } from '@/types/users'

export function useAssessmentHelpers() {
  // State for student/goal lookups (cached)
  const studentCache = ref<Map<string, Student>>(new Map())
  const goalCache = ref<Map<string, Goal>>(new Map())

  /**
   * Format date for display
   */
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A'

    try {
      // Handle Firestore timestamp
      if (dateValue?.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString()
      }
      // Handle regular date
      return new Date(dateValue).toLocaleDateString()
    } catch (error) {
      console.warn('Unable to format date:', dateValue)
      return 'Invalid Date'
    }
  }

  /**
   * Get student name by UID
   */
  const getStudentName = (studentUid: string, availableStudents: Student[]): string => {
    // Check cache first
    if (studentCache.value.has(studentUid)) {
      const student = studentCache.value.get(studentUid)!
      return `${student.firstName} ${student.lastName}`
    }

    // Look up in available students
    const student = availableStudents.find((s) => s.uid === studentUid)
    if (student) {
      studentCache.value.set(studentUid, student)
      return `${student.firstName} ${student.lastName}`
    }

    return 'Unknown Student'
  }

  /**
   * Get goal details by ID
   */
  const getGoalDetails = (goalId: string, availableGoals: Goal[]): Goal | null => {
    // Check cache first
    if (goalCache.value.has(goalId)) {
      return goalCache.value.get(goalId)!
    }

    // Look up in available goals
    const goal = availableGoals.find((g) => g.id === goalId)
    if (goal) {
      goalCache.value.set(goalId, goal)
      return goal
    }

    return null
  }

  /**
   * Format standard code for display
   */
  const getStandardDisplayName = (standardCode: string): string => {
    if (!standardCode) return 'No standard'

    // Handle custom standards
    if (standardCode.startsWith('CUSTOM:')) {
      return standardCode.replace('CUSTOM:', '').trim()
    }

    // Return CCSS standard as-is
    return standardCode
  }

  /**
   * Render fill-in-the-blank preview
   */
  const renderFillBlankPreview = (question: AssessmentQuestion): string => {
    if (!question.blankFormat || !question.correctAnswer) {
      return 'Enter blank format and answer to see preview'
    }

    // Replace ___ with the answer in styled span
    return question.blankFormat.replace(
      /___/g,
      `<span style="background: #dbeafe; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; border-bottom: 2px solid #3b82f6;">${question.correctAnswer}</span>`,
    )
  }

  /**
   * Get file upload placeholder text
   */
  const getFileUploadPlaceholder = (
    requireMultiplePages?: boolean,
    requiredPageCount?: number,
  ): string => {
    if (requireMultiplePages && requiredPageCount) {
      return `Take ${requiredPageCount} photos of your work showing all steps...`
    }
    return 'Take a photo or upload a file showing your work...'
  }

  /**
   * Get category label for display
   */
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      HW: 'Homework',
      Assign: 'Assignment',
      ESA: 'Essential Standard',
      SA: 'Standard Assessment',
      PA: 'Progress Assessment',
      Other: 'Other',
    }
    return labels[category] || category
  }

  /**
   * Get quarter label for display
   */
  const getQuarterLabel = (period: string): string => {
    const labels: Record<string, string> = {
      q1: 'Quarter 1',
      q2: 'Quarter 2',
      q3: 'Quarter 3',
      q4: 'Quarter 4',
      all: 'All Year',
      auto: 'Auto-Detect',
    }
    return labels[period] || period
  }

  /**
   * Get question type display name
   */
  const getQuestionTypeDisplayName = (questionType: string): string => {
    const typeMap: Record<string, string> = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'short-answer': 'Short Answer',
      'fill-blank': 'Fill in the Blank',
      essay: 'Essay',
      fraction: 'Fraction',
      matching: 'Matching',
      'rank-order': 'Rank Order',
      checkbox: 'Multiple Select',
      'horizontal-ordering': 'Horizontal Ordering',
    }
    return typeMap[questionType] || questionType
  }

  /**
   * Clear all caches
   */
  const clearCaches = () => {
    studentCache.value.clear()
    goalCache.value.clear()
  }

  return {
    // Formatting
    formatDate,
    getCategoryLabel,
    getQuarterLabel,
    getQuestionTypeDisplayName,

    // Lookups
    getStudentName,
    getGoalDetails,
    getStandardDisplayName,

    // Question helpers
    renderFillBlankPreview,
    getFileUploadPlaceholder,

    // Cache management
    clearCaches,
  }
}
