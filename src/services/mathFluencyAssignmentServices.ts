// Math Fluency Assignment Services
// Handles assigning fluency diagnostics and practice to students

import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { OperationType } from '@/types/mathFluency'

/**
 * Assign initial fluency diagnostic to a student
 */
export async function assignInitialDiagnostic(
  studentUid: string,
  studentName: string,
  operation: OperationType,
  assignedBy: string,
  assignedByName?: string
): Promise<string> {
  try {
    const assignmentData = {
      type: 'diagnostic',
      diagnosticType: 'math-fluency-initial',
      operation,
      title: `Math Fluency Diagnostic - ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      studentUid,
      studentName,
      assignedBy,
      assignedByName: assignedByName || 'Teacher',
      assignedAt: Timestamp.now(),
      dueDate: null,
      status: 'assigned',
      isComplete: false,
      totalQuestions: 100,  // All problems for operation
      timeLimit: 2400,  // 40 minutes (60s × 40)
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, 'diagnosticAssignments'), assignmentData)
    console.log('✅ Initial diagnostic assigned:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error assigning initial diagnostic:', error)
    throw error
  }
}

/**
 * Assign daily practice to a student
 */
export async function assignDailyPractice(
  studentUid: string,
  studentName: string,
  operation: OperationType,
  assignedBy: string,
  assignedByName?: string,
  dueDate?: Date
): Promise<string> {
  try {
    const assignmentData = {
      type: 'diagnostic',
      diagnosticType: 'math-fluency-practice',
      operation,
      title: `Daily Math Facts Practice - ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      studentUid,
      studentName,
      assignedBy,
      assignedByName: assignedByName || 'Teacher',
      assignedAt: Timestamp.now(),
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
      status: 'assigned',
      isComplete: false,
      totalQuestions: 28,  // Approx: 3 + 15 + 10
      timeLimit: 12,  // 10-12 minutes
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, 'diagnosticAssignments'), assignmentData)
    console.log('✅ Daily practice assigned:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error assigning daily practice:', error)
    throw error
  }
}

/**
 * Bulk assign initial diagnostic to multiple students
 */
export async function bulkAssignInitialDiagnostic(
  studentUids: string[],
  studentNames: string[],
  operation: OperationType,
  assignedBy: string,
  assignedByName?: string
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (let i = 0; i < studentUids.length; i++) {
    try {
      await assignInitialDiagnostic(
        studentUids[i],
        studentNames[i],
        operation,
        assignedBy,
        assignedByName
      )
      success++
    } catch (error) {
      console.error(`Failed to assign to ${studentNames[i]}:`, error)
      failed++
    }
  }
  
  return { success, failed }
}

/**
 * Bulk assign daily practice to multiple students
 */
export async function bulkAssignDailyPractice(
  studentUids: string[],
  studentNames: string[],
  operation: OperationType,
  assignedBy: string,
  assignedByName?: string,
  dueDate?: Date
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (let i = 0; i < studentUids.length; i++) {
    try {
      await assignDailyPractice(
        studentUids[i],
        studentNames[i],
        operation,
        assignedBy,
        assignedByName,
        dueDate
      )
      success++
    } catch (error) {
      console.error(`Failed to assign to ${studentNames[i]}:`, error)
      failed++
    }
  }
  
  return { success, failed }
}

/**
 * Mark fluency assignment as complete
 */
export async function markFluencyAssignmentComplete(
  assignmentId: string,
  score?: number
): Promise<void> {
  try {
    const assignmentRef = doc(db, 'diagnosticAssignments', assignmentId)
    
    const updateData: any = {
      status: 'completed',
      isComplete: true,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    if (score !== undefined) {
      updateData.score = score
    }
    
    await updateDoc(assignmentRef, updateData)
    console.log('✅ Assignment marked complete:', assignmentId)
  } catch (error) {
    console.error('Error marking assignment complete:', error)
    throw error
  }
}




