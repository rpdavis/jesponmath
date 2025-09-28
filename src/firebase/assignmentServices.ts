// Assessment Assignment Services - Junction Table Implementation
// Replaces array-based assignment system with proper relational structure

import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc,
  addDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/types/users';
import type { AssessmentAssignment } from '@/types/iep';

// ==================== ASSIGNMENT CREATION ====================

/**
 * Assign an assessment to a single student
 */
export async function assignAssessmentToStudent(
  assessmentId: string, 
  studentUid: string, 
  assignedBy: string,
  options?: {
    dueDate?: Date;
    notes?: string;
    priority?: 'low' | 'medium' | 'high';
    accommodations?: string[];
  }
): Promise<string> {
  try {
    console.log('📋 Assigning assessment to student:', { assessmentId, studentUid, assignedBy });
    
    // Check if already assigned
    const existingQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId),
      where('studentUid', '==', studentUid)
    );
    const existing = await getDocs(existingQuery);
    
    if (!existing.empty) {
      throw new Error('Assessment already assigned to this student');
    }
    
    // Create assignment record - only include fields with values
    const assignmentData: any = {
      assessmentId,
      studentUid,
      assignedBy,
      assignedAt: serverTimestamp(),
      status: 'assigned',
      priority: options?.priority || 'medium',
      accommodations: options?.accommodations || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Only add optional fields if they have values
    if (options?.dueDate) {
      assignmentData.dueDate = Timestamp.fromDate(options.dueDate);
    }
    if (options?.notes) {
      assignmentData.notes = options.notes;
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS), assignmentData);
    
    console.log('✅ Assessment assigned successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error assigning assessment:', error);
    throw error;
  }
}

/**
 * Bulk assign assessment to multiple students
 */
export async function bulkAssignAssessment(
  assessmentId: string,
  studentUids: string[],
  assignedBy: string,
  options?: {
    dueDate?: Date;
    notes?: string;
    priority?: 'low' | 'medium' | 'high';
  }
): Promise<string[]> {
  try {
    console.log('📋 Bulk assigning assessment:', { assessmentId, studentCount: studentUids.length });
    
    // Check for existing assignments - get ALL existing assignments for this assessment
    const existingQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId)
    );
    const existing = await getDocs(existingQuery);
    const alreadyAssigned = existing.docs.map(doc => doc.data().studentUid as string);
    
    console.log(`🔍 Found ${alreadyAssigned.length} existing assignments for assessment ${assessmentId}`);
    
    // Filter out already assigned students
    const studentsToAssign = studentUids.filter(uid => !alreadyAssigned.includes(uid));
    
    if (studentsToAssign.length === 0) {
      throw new Error('All students already have this assessment assigned');
    }
    
    // Create batch assignments (handle Firestore 500 operation limit)
    const assignmentIds: string[] = [];
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    studentsToAssign.forEach(studentUid => {
      const docRef = doc(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS));
      
      // Create assignment record - only include fields with values
      const assignmentData: any = {
        assessmentId,
        studentUid,
        assignedBy,
        assignedAt: serverTimestamp(),
        status: 'assigned',
        priority: options?.priority || 'medium',
        accommodations: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add optional fields if they have values
      if (options?.dueDate) {
        assignmentData.dueDate = Timestamp.fromDate(options.dueDate);
      }
      if (options?.notes) {
        assignmentData.notes = options.notes;
      }
      
      currentBatch.set(docRef, assignmentData);
      assignmentIds.push(docRef.id);
      operationCount++;
      
      // Handle batch size limit
      if (operationCount >= 450) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    console.log(`🔄 Executing ${batches.length} batches...`);
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit();
        console.log(`✅ Batch ${i + 1}/${batches.length} committed successfully`);
      } catch (batchError) {
        console.error(`❌ Batch ${i + 1}/${batches.length} failed:`, batchError);
        throw new Error(`Batch commit failed: ${batchError}`);
      }
    }
    
    console.log(`✅ Assessment assigned to ${studentsToAssign.length} students (${alreadyAssigned.length} were already assigned)`);
    return assignmentIds;
  } catch (error) {
    console.error('❌ Error bulk assigning assessment:', error);
    throw error;
  }
}

// ==================== ASSIGNMENT RETRIEVAL ====================

/**
 * Get all assignments for a student
 */
export async function getStudentAssignments(
  studentUid: string,
  status?: 'assigned' | 'started' | 'completed' | 'overdue'
): Promise<AssessmentAssignment[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('studentUid', '==', studentUid)
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    // Add ordering (sort in JavaScript to avoid index requirements)
    const snapshot = await getDocs(q);
    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssessmentAssignment[];
    
    // Sort by due date, then by assigned date
    assignments.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.seconds - b.dueDate.seconds;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      const aTime = a.assignedAt?.seconds || 0;
      const bTime = b.assignedAt?.seconds || 0;
      return bTime - aTime; // Most recent first
    });
    
    return assignments;
  } catch (error) {
    console.error('❌ Error getting student assignments:', error);
    throw error;
  }
}

/**
 * Get all assignments for an assessment
 */
export async function getAssessmentAssignments(
  assessmentId: string,
  status?: 'assigned' | 'started' | 'completed' | 'overdue'
): Promise<AssessmentAssignment[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId)
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const snapshot = await getDocs(q);
    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssessmentAssignment[];
    
    // Sort by assigned date (most recent first)
    assignments.sort((a, b) => {
      const aTime = a.assignedAt?.seconds || 0;
      const bTime = b.assignedAt?.seconds || 0;
      return bTime - aTime;
    });
    
    return assignments;
  } catch (error) {
    console.error('❌ Error getting assessment assignments:', error);
    throw error;
  }
}

/**
 * Get assignments created by a specific teacher
 */
export async function getTeacherAssignments(
  teacherUid: string,
  limit?: number
): Promise<AssessmentAssignment[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assignedBy', '==', teacherUid)
    );
    
    if (limit) {
      q = query(q, firestoreLimit(limit));
    }
    
    const snapshot = await getDocs(q);
    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssessmentAssignment[];
    
    // Sort by assigned date (most recent first)
    assignments.sort((a, b) => {
      const aTime = a.assignedAt?.seconds || 0;
      const bTime = b.assignedAt?.seconds || 0;
      return bTime - aTime;
    });
    
    return assignments;
  } catch (error) {
    console.error('❌ Error getting teacher assignments:', error);
    throw error;
  }
}

// ==================== ASSIGNMENT UPDATES ====================

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: 'assigned' | 'started' | 'completed' | 'overdue',
  metadata?: {
    startedAt?: Timestamp;
    completedAt?: Timestamp;
  }
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (metadata?.startedAt) updateData.startedAt = metadata.startedAt;
    if (metadata?.completedAt) updateData.completedAt = metadata.completedAt;
    
    await updateDoc(doc(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS, assignmentId), updateData);
    
    console.log('✅ Assignment status updated:', status);
  } catch (error) {
    console.error('❌ Error updating assignment status:', error);
    throw error;
  }
}

/**
 * Update assignment when student starts assessment
 */
export async function markAssignmentStarted(
  assessmentId: string,
  studentUid: string
): Promise<void> {
  try {
    // Find the assignment
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId),
      where('studentUid', '==', studentUid)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.warn('⚠️ Assignment not found for student starting assessment');
      return;
    }
    
    const assignmentDoc = snapshot.docs[0];
    await updateDoc(assignmentDoc.ref, {
      status: 'started',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Assignment marked as started');
  } catch (error) {
    console.error('❌ Error marking assignment as started:', error);
    throw error;
  }
}

/**
 * Update assignment when student completes assessment
 */
export async function markAssignmentCompleted(
  assessmentId: string,
  studentUid: string
): Promise<void> {
  try {
    // Find the assignment
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId),
      where('studentUid', '==', studentUid)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.warn('⚠️ Assignment not found for student completing assessment');
      return;
    }
    
    const assignmentDoc = snapshot.docs[0];
    await updateDoc(assignmentDoc.ref, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Assignment marked as completed');
  } catch (error) {
    console.error('❌ Error marking assignment as completed:', error);
    throw error;
  }
}

// ==================== ASSIGNMENT DELETION ====================

/**
 * Remove assignment (unassign assessment from student)
 */
export async function unassignAssessmentFromStudent(
  assessmentId: string,
  studentUid: string
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId),
      where('studentUid', '==', studentUid)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Assignment not found');
    }
    
    // Delete the assignment record
    await deleteDoc(snapshot.docs[0].ref);
    
    console.log('✅ Assessment unassigned successfully');
  } catch (error) {
    console.error('❌ Error unassigning assessment:', error);
    throw error;
  }
}

/**
 * Delete all assignments for an assessment (when assessment is deleted)
 */
export async function deleteAssessmentAssignments(assessmentId: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('📝 No assignments found for assessment');
      return;
    }
    
    // Delete all assignments in batches
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    snapshot.docs.forEach(assignmentDoc => {
      currentBatch.delete(assignmentDoc.ref);
      operationCount++;
      
      if (operationCount >= 450) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Deleted ${snapshot.docs.length} assignments for assessment`);
  } catch (error) {
    console.error('❌ Error deleting assessment assignments:', error);
    throw error;
  }
}

/**
 * Delete all assignments for a student (when student is deleted)
 */
export async function deleteStudentAssignments(studentUid: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('studentUid', '==', studentUid)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('📝 No assignments found for student');
      return;
    }
    
    // Delete all assignments in batches
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    snapshot.docs.forEach(assignmentDoc => {
      currentBatch.delete(assignmentDoc.ref);
      operationCount++;
      
      if (operationCount >= 450) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Deleted ${snapshot.docs.length} assignments for student`);
  } catch (error) {
    console.error('❌ Error deleting student assignments:', error);
    throw error;
  }
}

// ==================== STATISTICS & REPORTING ====================

/**
 * Get assignment statistics for an assessment
 */
export async function getAssessmentStats(assessmentId: string) {
  try {
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId)
    );
    
    const snapshot = await getDocs(q);
    const assignments = snapshot.docs.map(doc => doc.data());
    
    return {
      total: assignments.length,
      assigned: assignments.filter(a => a.status === 'assigned').length,
      started: assignments.filter(a => a.status === 'started').length,
      completed: assignments.filter(a => a.status === 'completed').length,
      overdue: assignments.filter(a => a.status === 'overdue').length
    };
  } catch (error) {
    console.error('❌ Error getting assessment stats:', error);
    throw error;
  }
}

/**
 * Get student's pending assignments count
 */
export async function getStudentPendingCount(studentUid: string): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('studentUid', '==', studentUid),
      where('status', 'in', ['assigned', 'started'])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  } catch (error) {
    console.error('❌ Error getting student pending count:', error);
    return 0;
  }
}
