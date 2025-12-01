import { db } from '@/firebase/config'
import { collection, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'

/**
 * Assign placement diagnostic to a student
 */
export async function assignPlacementDiagnostic(
  studentUid: string,
  studentName: string,
  teacherUid: string,
  teacherName?: string
): Promise<string> {
  const assignmentData = {
    diagnosticType: 'math-fluency-placement',
    studentUid,
    studentName,
    teacherUid,
    teacherName: teacherName || 'Teacher',
    assignedAt: Timestamp.now(),
    completed: false,
    completedAt: null,
    score: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
  
  const docRef = await addDoc(collection(db, 'diagnosticAssignments'), assignmentData)
  console.log('✅ Placement diagnostic assigned:', docRef.id)
  return docRef.id
}

/**
 * Assign initial diagnostic to a student (legacy function for compatibility)
 */
export async function assignInitialDiagnostic(
  studentUid: string,
  studentName: string,
  operation: string,
  teacherUid: string,
  teacherName?: string
): Promise<string> {
  const assignmentData = {
    diagnosticType: 'math-fluency-initial',
    studentUid,
    studentName,
    operation,
    teacherUid,
    teacherName: teacherName || 'Teacher',
    assignedAt: Timestamp.now(),
    completed: false,
    completedAt: null,
    score: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
  
  const docRef = await addDoc(collection(db, 'diagnosticAssignments'), assignmentData)
  console.log('✅ Initial diagnostic assigned:', docRef.id)
  return docRef.id
}

/**
 * Bulk assign initial diagnostic to multiple students
 */
export async function bulkAssignInitialDiagnostic(
  studentUids: string[],
  studentNames: string[],
  operation: string,
  teacherUid: string,
  teacherName?: string
): Promise<{ success: number; failed: number }> {
  let successCount = 0
  let failedCount = 0
  
  for (let i = 0; i < studentUids.length; i++) {
    try {
      await assignInitialDiagnostic(
        studentUids[i],
        studentNames[i],
        operation,
        teacherUid,
        teacherName
      )
      successCount++
    } catch (error) {
      console.error(`Error assigning to ${studentNames[i]}:`, error)
      failedCount++
    }
  }
  
  console.log(`✅ Bulk assignment complete: ${successCount}/${studentUids.length} students`)
  return { success: successCount, failed: failedCount }
}

/**
 * Mark a fluency assignment as complete
 */
export async function markFluencyAssignmentComplete(
  assignmentId: string,
  score: number
): Promise<void> {
  const assignmentRef = doc(db, 'diagnosticAssignments', assignmentId)
  
  await updateDoc(assignmentRef, {
    completed: true,
    completedAt: Timestamp.now(),
    score,
    updatedAt: Timestamp.now()
  })
  
  console.log('✅ Fluency assignment marked complete:', assignmentId, 'Score:', score)
}

/**
 * Unassign (delete) a diagnostic assignment
 */
export async function unassignPlacementDiagnostic(
  assignmentId: string
): Promise<void> {
  await deleteDoc(doc(db, 'diagnosticAssignments', assignmentId))
  console.log('✅ Diagnostic assignment deleted:', assignmentId)
}
