import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { Student, Goal, Assessment, AssessmentResult } from '@/types/iep'

// Student Services
export const createStudent = async (
  studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>,
) => {
  try {
    const docRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating student:', error)
    throw error
  }
}

export const getStudentBySeisId = async (seisId: string) => {
  try {
    const q = query(collection(db, 'students'), where('seisId', '==', seisId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Student
  } catch (error) {
    console.error('Error getting student:', error)
    throw error
  }
}

export const getStudentsByCaseManager = async (caseManager: string) => {
  try {
    const q = query(
      collection(db, 'students'),
      where('caseManager', '==', caseManager),
      orderBy('lastName', 'asc'),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[]
  } catch (error) {
    console.error('Error getting students by case manager:', error)
    throw error
  }
}

export const getStudentsByGrade = async (grade: string) => {
  try {
    const q = query(
      collection(db, 'students'),
      where('grade', '==', grade),
      orderBy('lastName', 'asc'),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[]
  } catch (error) {
    console.error('Error getting students by grade:', error)
    throw error
  }
}

// Goal Services
export const createGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'goals'), {
      ...goalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating goal:', error)
    throw error
  }
}

export const getGoalsByStudent = async (studentSeisId: string) => {
  try {
    const q = query(
      collection(db, 'goals'),
      where('studentSeisId', '==', studentSeisId),
      where('isActive', '==', true),
      orderBy('category', 'asc'),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[]
  } catch (error) {
    console.error('Error getting goals by student:', error)
    throw error
  }
}

// Note: Goals no longer have a 'category' field. Use assessments' category field instead.
// This function has been deprecated. Use goalServices.ts for goal-related operations.
/*
export const getGoalsByCategory = async (category: string) => {
  try {
    const q = query(
      collection(db, 'goals'),
      where('isActive', '==', true),
      orderBy('gradeLevel', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
};
*/

export const updateGoalProgress = async (goalId: string, progressData: Partial<Goal>) => {
  try {
    const goalRef = doc(db, 'goals', goalId)
    await updateDoc(goalRef, {
      ...progressData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating goal progress:', error)
    throw error
  }
}

export const getAllGoals = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'goals'))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[]
  } catch (error) {
    console.error('Error getting all goals:', error)
    throw error
  }
}

// Assessment Services
export const createAssessment = async (
  assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>,
) => {
  try {
    const docRef = await addDoc(collection(db, 'assessments'), {
      ...assessmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating assessment:', error)
    throw error
  }
}

export const getAssessment = async (assessmentId: string) => {
  try {
    const docRef = doc(db, 'assessments', assessmentId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Assessment
    }
    return null
  } catch (error) {
    console.error('Error getting assessment:', error)
    throw error
  }
}

export const getAssessmentByGoalId = async (goalId: string) => {
  try {
    const q = query(collection(db, 'assessments'), where('goalId', '==', goalId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Assessment
    }
    return null
  } catch (error) {
    console.error('Error getting assessment by goal ID:', error)
    throw error
  }
}

export const updateAssessment = async (
  assessmentId: string,
  assessmentData: Partial<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>>,
) => {
  try {
    const docRef = doc(db, 'assessments', assessmentId)
    await updateDoc(docRef, {
      ...assessmentData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating assessment:', error)
    throw error
  }
}

export const duplicateAssessment = async (
  originalAssessment: Assessment,
  newTitle?: string,
): Promise<string> => {
  try {
    console.log('📋 Duplicating assessment:', originalAssessment.title)

    // Simple duplication - just copy the assessment and change the title and IDs
    const duplicatedData = {
      ...originalAssessment,
      title: newTitle || `${originalAssessment.title} (Copy)`,
      studentSeisId: '', // Make it unassigned
      studentUid: '', // Make it unassigned
      questions: originalAssessment.questions.map((question) => ({
        ...question,
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Remove the original ID to let Firestore generate a new one
    delete (duplicatedData as any).id

    const docRef = await addDoc(collection(db, 'assessments'), duplicatedData)
    console.log('✅ Assessment duplicated successfully with ID:', docRef.id)

    return docRef.id
  } catch (error) {
    console.error('❌ Error duplicating assessment:', error)
    throw error
  }
}

export const getAssessmentsByGoal = async (goalId: string) => {
  try {
    const q = query(
      collection(db, 'assessments'),
      where('goalId', '==', goalId),
      orderBy('createdAt', 'desc'),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Assessment[]
  } catch (error) {
    console.error('Error getting assessments by goal:', error)
    throw error
  }
}

export const getAssessmentsByCategory = async (category: Assessment['category']) => {
  try {
    const q = query(
      collection(db, 'assessments'),
      where('category', '==', category),
      orderBy('gradeLevel', 'asc'),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Assessment[]
  } catch (error) {
    console.error('Error getting assessments by category:', error)
    throw error
  }
}

export const getAssessmentsByStudent = async (
  studentUid: string,
  filterByCurrentPeriod: boolean = true,
) => {
  try {
    console.log('🔍 Looking for assessments for student:', studentUid)

    // Get current academic period for filtering
    let currentPeriodId: string | null = null
    if (filterByCurrentPeriod) {
      try {
        const { getCurrentAcademicYear, generateAcademicYear, getCurrentPeriod } = await import(
          '@/types/academicPeriods'
        )
        const yearString = getCurrentAcademicYear()
        const academicYear = generateAcademicYear(yearString, 'quarters')
        const currentPeriod = getCurrentPeriod(academicYear)
        currentPeriodId = currentPeriod?.id || null

        if (currentPeriodId) {
          console.log(`📅 Filtering assessments by current period: ${currentPeriodId}`)
        }
      } catch (err) {
        console.warn('⚠️ Could not detect current period, showing all assessments:', err)
      }
    }

    // NEW: Get student's assignments from junction table
    const assignmentsQuery = query(
      collection(db, 'assessmentAssignments'),
      where('studentUid', '==', studentUid),
    )

    const assignmentsSnapshot = await getDocs(assignmentsQuery)

    if (assignmentsSnapshot.empty) {
      console.log('No assessments assigned to student:', studentUid)
      return []
    }

    // Get all assignment IDs (don't filter by period yet - we'll check the assessment's period)
    const assignedAssessmentIds = assignmentsSnapshot.docs.map((doc) => doc.data().assessmentId)

    if (assignedAssessmentIds.length === 0) {
      console.log('No assessments assigned to student')
      return []
    }

    console.log(`📋 Student has ${assignedAssessmentIds.length} total assignments`)

    // Fetch assessments in parallel using Promise.all for better performance
    const assessmentPromises = assignedAssessmentIds.map(async (assessmentId) => {
      try {
        const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId))
        if (assessmentDoc.exists()) {
          return {
            id: assessmentDoc.id,
            ...assessmentDoc.data(),
          } as Assessment
        } else {
          console.warn('Assessment not found:', assessmentId)
          return null
        }
      } catch (error) {
        console.error('Error fetching assessment:', assessmentId, error)
        return null
      }
    })

    // Wait for all assessments to load in parallel
    const assessmentResults = await Promise.all(assessmentPromises)
    let assessments = assessmentResults.filter((a): a is Assessment => a !== null)

    // Filter by current period based on assessment's academicPeriod field
    if (currentPeriodId) {
      const beforeFilter = assessments.length
      assessments = assessments.filter((assessment) => {
        // Show if:
        // 1. Assessment has no academicPeriod (old/unset) → show in all quarters
        // 2. Assessment academicPeriod is "all" → show in all quarters
        // 3. Assessment academicPeriod matches current period → show in this quarter
        const assessmentPeriod = assessment.academicPeriod

        if (!assessmentPeriod) {
          // No period set - show in all quarters (backwards compatible)
          return true
        }

        if (assessmentPeriod === 'all') {
          // Explicitly marked as "all year" - show in all quarters
          return true
        }

        // Check if matches current period
        return assessmentPeriod === currentPeriodId
      })

      console.log(
        `📅 Filtered to ${assessments.length} assessments for ${currentPeriodId} (${beforeFilter - assessments.length} filtered out)`,
      )
    } else {
      console.log(`📋 Showing all ${assessments.length} assessments (no period filtering)`)
    }

    // Sort by creation date
    assessments.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0)
      const bTime =
        b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0)
      return bTime - aTime
    })

    console.log(
      `📝 Found ${assessments.length} assessments for student ${studentUid} (including PA assessments)`,
    )
    return assessments
  } catch (error) {
    console.error('Error getting assessments by student:', error)
    throw error
  }
}

// Helper function to remove undefined values from objects (Firestore doesn't allow undefined)
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        // Recursively clean arrays
        cleaned[key] = value.map((item) =>
          typeof item === 'object' && item !== null && !(item instanceof Date)
            ? removeUndefined(item)
            : item,
        )
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !(value instanceof Date) &&
        !(value instanceof Timestamp)
      ) {
        // Recursively clean nested objects
        cleaned[key] = removeUndefined(value)
      } else {
        cleaned[key] = value
      }
    }
  }
  return cleaned as T
}

// Assessment Result Services
export const saveAssessmentResult = async (
  resultData: Omit<AssessmentResult, 'id' | 'completedAt'>,
) => {
  try {
    // Remove undefined values before saving (Firestore doesn't allow undefined)
    const cleanedData = removeUndefined({
      ...resultData,
      completedAt: serverTimestamp(),
    })

    const docRef = await addDoc(collection(db, 'assessmentResults'), cleanedData)
    return docRef.id
  } catch (error) {
    console.error('Error saving assessment result:', error)
    throw error
  }
}

// Create manual assessment result for teacher-entered scores
export const createManualAssessmentResult = async (
  resultData: Omit<AssessmentResult, 'id' | 'completedAt'>,
) => {
  try {
    console.log('📝 Creating manual assessment result:', {
      assessmentId: resultData.assessmentId,
      studentUid: resultData.studentUid,
    })

    const docRef = await addDoc(collection(db, 'assessmentResults'), {
      ...resultData,
      completedAt: serverTimestamp(),
      // Mark as manually entered
      manuallyEntered: true,
      enteredBy: resultData.gradedBy,
    })

    console.log('✅ Manual assessment result created:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Error creating manual assessment result:', error)
    throw error
  }
}

export const getAssessmentResultsByStudent = async (
  studentUid: string,
  options?: {
    limit?: number
    startAfter?: any // For pagination
  },
) => {
  try {
    // Use indexed query with orderBy for better performance
    // Limit results to prevent timeout (default to 100 most recent)
    const limitCount = options?.limit || 100

    let q = query(
      collection(db, 'assessmentResults'),
      where('studentUid', '==', studentUid),
      orderBy('completedAt', 'desc'),
      limit(limitCount),
    )

    // Add pagination cursor if provided
    if (options?.startAfter) {
      q = query(q, startAfter(options.startAfter))
    }

    const snapshot = await getDocs(q)
    const assessmentResults = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AssessmentResult[]

    return assessmentResults
  } catch (error: any) {
    // If index error, fall back to simpler query without orderBy
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('Index not found, using fallback query without orderBy')
      const q = query(
        collection(db, 'assessmentResults'),
        where('studentUid', '==', studentUid),
        limit(options?.limit || 100),
      )

      const snapshot = await getDocs(q)
      const assessmentResults = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AssessmentResult[]

      // Sort in JavaScript as fallback
      assessmentResults.sort((a, b) => {
        const aTime =
          a.completedAt?.seconds || (a.completedAt ? new Date(a.completedAt).getTime() / 1000 : 0)
        const bTime =
          b.completedAt?.seconds || (b.completedAt ? new Date(b.completedAt).getTime() / 1000 : 0)
        return bTime - aTime
      })

      return assessmentResults
    }

    console.error('Error getting assessment results by student:', error)
    throw error
  }
}

export const getAssessmentResultsByGoal = async (goalId: string) => {
  try {
    const q = query(
      collection(db, 'assessmentResults'),
      where('goalId', '==', goalId),
      orderBy('completedAt', 'desc'),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AssessmentResult[]
  } catch (error) {
    console.error('Error getting assessment results by goal:', error)
    throw error
  }
}

// Assessment management functions
export async function getAllAssessments(): Promise<Assessment[]> {
  try {
    const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Assessment[]
  } catch (error) {
    console.error('Error getting all assessments:', error)
    throw error
  }
}

export async function getAssessmentsByTeacher(teacherUid: string): Promise<Assessment[]> {
  try {
    const q = query(collection(db, 'assessments'), where('createdBy', '==', teacherUid))
    const snapshot = await getDocs(q)
    const assessments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Assessment[]

    // Sort in JavaScript instead of Firestore to avoid index requirement
    assessments.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt || 0
      const bTime = b.createdAt?.seconds || b.createdAt || 0
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return assessments
  } catch (error) {
    console.error('Error getting assessments by teacher:', error)
    throw error
  }
}

// Assignment functions moved to assignmentServices.ts
// Import and re-export for backward compatibility
export {
  assignAssessmentToStudent,
  unassignAssessmentFromStudent,
  getAssessmentAssignments as getCurrentlyAssignedStudents,
  bulkAssignAssessment,
  markAssignmentStarted,
  markAssignmentCompleted,
  getAssessmentStats,
} from './assignmentServices'

export async function deleteAssessment(assessmentId: string): Promise<void> {
  try {
    console.log('🗑️ Starting cascading delete for assessment:', assessmentId)

    // Step 1: Delete all assignments (from junction table)
    const { deleteAssessmentAssignments } = await import('./assignmentServices')
    await deleteAssessmentAssignments(assessmentId)

    // Step 2: Get all results for this assessment
    const resultsQuery = query(
      collection(db, 'assessmentResults'),
      where('assessmentId', '==', assessmentId),
    )
    const resultsSnapshot = await getDocs(resultsQuery)

    console.log(`📊 Found ${resultsSnapshot.docs.length} results to delete`)

    // Step 3: Delete all results using batch
    const batch = writeBatch(db)

    resultsSnapshot.docs.forEach((resultDoc) => {
      batch.delete(resultDoc.ref)
    })

    // Step 4: Delete the assessment itself
    batch.delete(doc(db, 'assessments', assessmentId))

    // Step 5: Commit all deletions
    await batch.commit()

    console.log(
      `✅ Assessment, assignments, and ${resultsSnapshot.docs.length} results deleted successfully`,
    )
  } catch (error) {
    console.error('Error deleting assessment and results:', error)
    throw error
  }
}

export async function getAssessmentResults(assessmentId: string): Promise<any[]> {
  try {
    const q = query(collection(db, 'assessmentResults'), where('assessmentId', '==', assessmentId))
    const snapshot = await getDocs(q)
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[]

    // Sort in JavaScript instead of Firestore to avoid index requirement
    results.sort((a: any, b: any) => {
      const aTime = a.completedAt?.seconds || a.completedAt || 0
      const bTime = b.completedAt?.seconds || b.completedAt || 0
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return results
  } catch (error) {
    console.error('Error getting assessment results:', error)
    throw error
  }
}

/**
 * Get all assessment results for multiple assessments in batched queries
 * PERFORMANCE OPTIMIZED: Uses Firestore 'in' queries (max 10 items per query)
 * to reduce N+1 query problem. For 50 assessments, this makes 5 queries instead of 50.
 *
 * @param assessmentIds Array of assessment IDs to fetch results for
 * @returns All assessment results for the given assessments
 */
export async function getAssessmentResultsBulk(
  assessmentIds: string[],
): Promise<AssessmentResult[]> {
  if (assessmentIds.length === 0) {
    return []
  }

  try {
    // Firestore 'in' queries support up to 10 items per query
    const BATCH_SIZE = 10
    const batches: string[][] = []

    // Split assessmentIds into batches of 10
    for (let i = 0; i < assessmentIds.length; i += BATCH_SIZE) {
      batches.push(assessmentIds.slice(i, i + BATCH_SIZE))
    }

    console.log(
      `📊 Fetching results for ${assessmentIds.length} assessments in ${batches.length} batched queries`,
    )

    // Execute all batches in parallel for maximum performance
    const batchPromises = batches.map(async (batch) => {
      const q = query(collection(db, 'assessmentResults'), where('assessmentId', 'in', batch))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AssessmentResult[]
    })

    // Wait for all batches to complete
    const batchResults = await Promise.all(batchPromises)
    const allResults = batchResults.flat()

    // Sort in JavaScript instead of Firestore to avoid index requirement
    // Handle invalid/missing dates gracefully
    allResults.sort((a: any, b: any) => {
      // Safely extract timestamps, defaulting to 0 for invalid dates
      let aTime = 0
      let bTime = 0

      try {
        if (a.completedAt?.seconds) {
          aTime = a.completedAt.seconds * 1000
        } else if (a.completedAt && typeof a.completedAt === 'number') {
          aTime = a.completedAt
        } else if (a.completedAt instanceof Date) {
          aTime = a.completedAt.getTime()
        }
      } catch (e) {
        // Invalid date, leave as 0
      }

      try {
        if (b.completedAt?.seconds) {
          bTime = b.completedAt.seconds * 1000
        } else if (b.completedAt && typeof b.completedAt === 'number') {
          bTime = b.completedAt
        } else if (b.completedAt instanceof Date) {
          bTime = b.completedAt.getTime()
        }
      } catch (e) {
        // Invalid date, leave as 0
      }

      return bTime - aTime // Most recent first
    })

    console.log(
      `✅ Fetched ${allResults.length} results in ${batches.length} queries (${Math.round(allResults.length / batches.length)} avg per query)`,
    )

    return allResults
  } catch (error) {
    console.error('Error getting assessment results in bulk:', error)
    throw error
  }
}

/**
 * Regrade all assessment results when an assessment is updated
 * This re-checks answers against updated questions (including new acceptable answers)
 */
export async function regradeAssessmentResults(
  assessmentId: string,
  updatedAssessment: Assessment,
): Promise<number> {
  try {
    console.log(`🔄 Regrading assessment results for assessment: ${assessmentId}`)

    // Get all results for this assessment
    const results = await getAssessmentResults(assessmentId)

    if (results.length === 0) {
      console.log('📝 No results found to regrade')
      return 0
    }

    console.log(`📊 Found ${results.length} results to regrade`)

    // Import answer comparison utilities
    const { areAnswersEquivalent } = await import('@/utils/answerUtils')

    let regradedCount = 0
    const batch = writeBatch(db)
    let operationCount = 0
    const batches: ReturnType<typeof writeBatch>[] = [batch]

    // Process each result
    for (const result of results) {
      let scoreChanged = false
      const updatedResponses =
        result.responses?.map((response: any) => {
          // Find the question in the updated assessment
          const question = updatedAssessment.questions?.find((q) => q.id === response.questionId)

          if (!question) {
            // Question not found - keep original response
            return response
          }

          // Re-check the answer
          let isCorrect = false
          const userAnswer = response.studentAnswer || ''

          // Use the same grading logic as AssessmentTaking.vue
          if (question.questionType === 'multiple-choice') {
            isCorrect = userAnswer === question.correctAnswer

            // Check acceptable answers
            if (!isCorrect && question.acceptableAnswers && question.acceptableAnswers.length > 0) {
              for (const acceptableAnswer of question.acceptableAnswers) {
                if (
                  userAnswer === acceptableAnswer ||
                  userAnswer.toString() === acceptableAnswer.toString()
                ) {
                  isCorrect = true
                  break
                }
              }
            }
          } else if (
            question.questionType === 'short-answer' ||
            question.questionType === 'essay'
          ) {
            // Use enhanced answer comparison
            if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
              const trimmedUserAnswer = userAnswer.trim()
              const trimmedCorrectAnswer = question.correctAnswer.trim()

              isCorrect = areAnswersEquivalent(trimmedUserAnswer, trimmedCorrectAnswer)

              // Check acceptable answers if available
              if (
                !isCorrect &&
                question.acceptableAnswers &&
                question.acceptableAnswers.length > 0
              ) {
                for (const acceptableAnswer of question.acceptableAnswers) {
                  const trimmedAcceptableAnswer = acceptableAnswer.trim()
                  if (areAnswersEquivalent(trimmedUserAnswer, trimmedAcceptableAnswer)) {
                    isCorrect = true
                    break
                  }
                }
              }
            }
          } else if (question.questionType === 'rank-order' && Array.isArray(userAnswer)) {
            // Check if items are in correct order
            if (question.correctOrder && Array.isArray(question.correctOrder)) {
              isCorrect =
                userAnswer.length === question.correctOrder.length &&
                userAnswer.every((item, index) => item === question.correctOrder![index])
            }
          } else if (question.questionType === 'checkbox' && Array.isArray(userAnswer)) {
            // Check if selected answers match all correct answers
            if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
              isCorrect =
                userAnswer.length === question.correctAnswers.length &&
                userAnswer.every((answer) => question.correctAnswers!.includes(answer)) &&
                question.correctAnswers.every((answer) => userAnswer.includes(answer))
            }
          } else if (question.questionType === 'horizontal-ordering') {
            // For horizontal ordering questions, check if items are in correct order
            // Use correctAnswer as primary (space-separated string), fallback to correctHorizontalOrder
            let correctOrder: string[] = []

            // Try to get correct order from correctAnswer first (primary field)
            if (question.correctAnswer && typeof question.correctAnswer === 'string') {
              // Parse space-separated string to array
              correctOrder = question.correctAnswer.split(/\s+/).filter((item) => item.length > 0)
              console.log('📋 Regrade: Using correctAnswer (primary):', {
                correctAnswer: question.correctAnswer,
                parsed: correctOrder,
              })
            } else if (Array.isArray(question.correctHorizontalOrder)) {
              // Fallback to correctHorizontalOrder for backward compatibility
              correctOrder = question.correctHorizontalOrder
              console.log('📋 Regrade: Using correctHorizontalOrder (fallback):', correctOrder)
            } else if (question.correctHorizontalOrder) {
              // Handle case where correctHorizontalOrder might be serialized as a string
              const correctHorizontalOrderValue = question.correctHorizontalOrder as unknown
              if (typeof correctHorizontalOrderValue === 'string') {
                if (correctHorizontalOrderValue.includes(',')) {
                  correctOrder = correctHorizontalOrderValue
                    .split(',')
                    .map((item: string) => item.trim())
                    .filter((item: string) => item.length > 0)
                } else {
                  correctOrder = correctHorizontalOrderValue
                    .split(/\s+/)
                    .filter((item: string) => item.length > 0)
                }
              }
            }

            if (correctOrder.length === 0) {
              console.error(
                '❌ Regrade: No correct order found for horizontal ordering question:',
                question.id,
              )
              isCorrect = false
            } else {
              // Normalize user answer - handle both array, comma-separated, and space-separated formats
              let userOrder: string[] = []

              if (Array.isArray(userAnswer)) {
                userOrder = userAnswer as string[]
              } else if (typeof userAnswer === 'string') {
                // Normalize user answer - handle both comma-separated and space-separated formats
                // Check if it's comma-separated or space-separated
                if (userAnswer.includes(',')) {
                  // Comma-separated: "-6,-|-5|,17,|-20|"
                  userOrder = userAnswer
                    .split(',')
                    .map((item) => item.trim())
                    .filter((item) => item.length > 0)
                } else {
                  // Space-separated: "-6 -|-5| 17 |-20|"
                  userOrder = userAnswer.split(/\s+/).filter((item) => item.length > 0)
                }
                console.log('📋 Regrade: Normalized user answer:', {
                  original: userAnswer,
                  normalized: userOrder,
                })
              } else {
                isCorrect = false
              }

              // Check if arrays are same length
              if (userOrder.length !== correctOrder.length) {
                isCorrect = false
                console.log('📊 Regrade: Horizontal Ordering length mismatch', {
                  questionId: question.id,
                  userLength: userOrder.length,
                  correctLength: correctOrder.length,
                  userOrder,
                  correctOrder,
                })
              } else {
                // Compare each item using enhanced matching (handles equivalent values, whitespace, LaTeX, etc.)
                isCorrect = userOrder.every((userItem, index) => {
                  const correctItem = correctOrder[index]

                  // First try exact match (handles LaTeX strings like "$\\frac{1}{2}$")
                  if (userItem === correctItem) {
                    return true
                  }

                  // Normalize LaTeX formatting first (remove $ wrappers, etc.)
                  let normalizedUser = userItem.trim()
                  let normalizedCorrect = correctItem.trim()

                  // Strip LaTeX formatting if present
                  normalizedUser = normalizedUser.replace(/^\$\$?(.*?)\$\$?$/, '$1')
                  normalizedCorrect = normalizedCorrect.replace(/^\$\$?(.*?)\$\$?$/, '$1')

                  // Try normalized comparison after stripping LaTeX
                  if (normalizedUser === normalizedCorrect) {
                    return true
                  }

                  // Try enhanced comparison (handles fractions, decimals, LaTeX expressions, etc.)
                  return areAnswersEquivalent(normalizedUser, normalizedCorrect)
                })
              }

              console.log('📊 Regrade: Horizontal Ordering Final Check:', {
                questionId: question.id,
                userOrder,
                correctOrder,
                isCorrect,
              })
            }
          }

          // Update points earned
          const pointsEarned = isCorrect ? question.points : 0
          const wasCorrect = response.isCorrect
          const oldPoints = response.pointsEarned || 0

          // Check if this response changed
          if (isCorrect !== wasCorrect || pointsEarned !== oldPoints) {
            scoreChanged = true
            console.log(
              `📝 Question ${response.questionId}: ${wasCorrect ? '✅' : '❌'} → ${isCorrect ? '✅' : '❌'} (${oldPoints} → ${pointsEarned} points)`,
            )
          }

          // Build updated response, filtering out undefined values (Firestore doesn't allow undefined)
          const updatedResponse: any = {
            ...response,
            isCorrect,
            pointsEarned,
          }

          // Remove any undefined values before returning
          Object.keys(updatedResponse).forEach((key) => {
            if (updatedResponse[key] === undefined) {
              delete updatedResponse[key]
            }
          })

          return updatedResponse
        }) || []

      // Recalculate total score if any response changed
      if (scoreChanged) {
        const totalEarned = updatedResponses.reduce(
          (sum: number, r: any) => sum + (r.pointsEarned || 0),
          0,
        )
        const totalPossible = updatedAssessment.totalPoints || 0
        const percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0

        const resultRef = doc(db, 'assessmentResults', result.id)

        // Check if we need a new batch (Firestore limit is 500 operations)
        if (operationCount >= 450) {
          batches.push(writeBatch(db))
          operationCount = 0
        }

        batches[batches.length - 1].update(resultRef, {
          responses: updatedResponses,
          score: totalEarned,
          percentage: percentage,
          regradedAt: serverTimestamp(),
          regradedBy: 'system',
        })

        operationCount++
        regradedCount++

        console.log(
          `✅ Regraded result ${result.id}: ${result.score}/${result.totalPoints} (${result.percentage}%) → ${totalEarned}/${totalPossible} (${percentage}%)`,
        )
      }
    }

    // Commit all batches
    console.log(
      `💾 Committing ${batches.length} batch(es) with ${regradedCount} updated results...`,
    )
    for (const batchToCommit of batches) {
      await batchToCommit.commit()
    }

    console.log(`✅ Successfully regraded ${regradedCount} assessment result(s)`)
    return regradedCount
  } catch (error) {
    console.error('❌ Error regrading assessment results:', error)
    throw error
  }
}
