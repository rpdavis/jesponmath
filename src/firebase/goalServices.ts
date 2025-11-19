// Goal Services - Database operations for IEP Goals
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
import type { Goal } from '@/types/iep';

// ==================== GOAL CREATION ====================

/**
 * Create a new goal
 */
export async function createGoal(goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    console.log('📝 Creating new goal:', goalData);
    
    const docRef = await addDoc(collection(db, COLLECTIONS.GOALS), {
      ...goalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Goal created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating goal:', error);
    throw error;
  }
}

// ==================== GOAL RETRIEVAL ====================

/**
 * Get a single goal by ID
 */
export async function getGoal(goalId: string): Promise<Goal | null> {
  try {
    const docRef = doc(db, COLLECTIONS.GOALS, goalId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Goal;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting goal:', error);
    throw error;
  }
}

/**
 * Get all goals for a specific student
 */
export async function getGoalsByStudent(studentUid: string): Promise<Goal[]> {
  try {
    console.log('🔍 Getting goals for student:', studentUid);
    
    // Query for goals using the new assignedStudents array field
    const q = query(
      collection(db, COLLECTIONS.GOALS),
      where('assignedStudents', 'array-contains', studentUid)
    );
    
    const querySnapshot = await getDocs(q);
    let goals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    
    // Also check for old goals with studentUid field (for backwards compatibility)
    const qOld = query(
      collection(db, COLLECTIONS.GOALS),
      where('studentUid', '==', studentUid)
    );
    
    const querySnapshotOld = await getDocs(qOld);
    const oldGoals = querySnapshotOld.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    
    // Merge both results and remove duplicates
    const allGoals = [...goals, ...oldGoals];
    const uniqueGoals = allGoals.filter((goal, index, self) => 
      index === self.findIndex(g => g.id === goal.id)
    );
    
    // Sort in memory by createdAt (most recent first)
    uniqueGoals.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });
    
    console.log(`📋 Found ${uniqueGoals.length} goals for student ${studentUid}`);
    return uniqueGoals;
  } catch (error) {
    console.error('❌ Error getting goals by student:', error);
    throw error;
  }
}

/**
 * Get all active goals for a specific student
 */
export async function getActiveGoalsByStudent(studentUid: string): Promise<Goal[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.GOALS),
      where('studentUid', '==', studentUid),
      where('isActive', '==', true),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
  } catch (error) {
    console.error('❌ Error getting active goals:', error);
    throw error;
  }
}

/**
 * Get all goals created by a specific teacher
 */
export async function getGoalsByTeacher(teacherUid: string): Promise<Goal[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.GOALS),
      where('createdBy', '==', teacherUid)
    );
    
    const querySnapshot = await getDocs(q);
    const goals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    
    // Sort by createdAt in memory to avoid needing a composite index
    return goals.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime; // descending order
    });
  } catch (error) {
    console.error('❌ Error getting goals by teacher:', error);
    throw error;
  }
}

/**
 * Get all goals (admin function)
 */
export async function getAllGoals(): Promise<Goal[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.GOALS),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
  } catch (error) {
    console.error('❌ Error getting all goals:', error);
    throw error;
  }
}

// ==================== GOAL UPDATES ====================

/**
 * Update a goal
 */
export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
  try {
    console.log('📝 Updating goal:', goalId, updates);
    
    const docRef = doc(db, COLLECTIONS.GOALS, goalId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Goal updated successfully');
  } catch (error) {
    console.error('❌ Error updating goal:', error);
    throw error;
  }
}

/**
 * Archive a goal
 */
export async function archiveGoal(goalId: string): Promise<void> {
  try {
    await updateGoal(goalId, {
      isArchived: true,
      isActive: false
    });
    console.log('📦 Goal archived successfully');
  } catch (error) {
    console.error('❌ Error archiving goal:', error);
    throw error;
  }
}

/**
 * Mark goal as met
 */
export async function markGoalAsMet(goalId: string): Promise<void> {
  try {
    await updateGoal(goalId, {
      isMet: true,
      isActive: false
    });
    console.log('🎯 Goal marked as met');
  } catch (error) {
    console.error('❌ Error marking goal as met:', error);
    throw error;
  }
}

/**
 * Reactivate a goal
 */
export async function reactivateGoal(goalId: string): Promise<void> {
  try {
    await updateGoal(goalId, {
      isActive: true,
      isArchived: false,
      isMet: false
    });
    console.log('🔄 Goal reactivated successfully');
  } catch (error) {
    console.error('❌ Error reactivating goal:', error);
    throw error;
  }
}

// ==================== ASSESSMENT-GOAL CONNECTIONS ====================

/**
 * Assign an assessment to a goal
 */
export async function assignAssessmentToGoal(goalId: string, assessmentId: string): Promise<void> {
  try {
    console.log('🔗 Assigning assessment to goal:', { goalId, assessmentId });
    
    const docRef = doc(db, COLLECTIONS.GOALS, goalId);
    await updateDoc(docRef, {
      assignedAssessments: arrayUnion(assessmentId),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Assessment assigned to goal successfully');
  } catch (error) {
    console.error('❌ Error assigning assessment to goal:', error);
    throw error;
  }
}

/**
 * Remove an assessment from a goal
 * Also removes student assignments for students assigned to this goal
 */
export async function removeAssessmentFromGoal(goalId: string, assessmentId: string): Promise<void> {
  try {
    console.log('🔗 Removing assessment from goal:', { goalId, assessmentId });
    
    // Step 1: Get the goal to find assigned students
    const goalDoc = await getDoc(doc(db, COLLECTIONS.GOALS, goalId));
    if (!goalDoc.exists()) {
      throw new Error('Goal not found');
    }
    
    const goalData = goalDoc.data();
    const assignedStudents = goalData.assignedStudents || [];
    const studentUid = goalData.studentUid; // For single-student goals
    
    // Collect all student UIDs
    const allStudentUids = [...assignedStudents];
    if (studentUid && !allStudentUids.includes(studentUid)) {
      allStudentUids.push(studentUid);
    }
    
    // Step 2: Remove assessment from goal
    const docRef = doc(db, COLLECTIONS.GOALS, goalId);
    await updateDoc(docRef, {
      assignedAssessments: arrayRemove(assessmentId),
      updatedAt: serverTimestamp()
    });
    
    // Step 3: Remove student assignments for students assigned to this goal
    if (allStudentUids.length > 0) {
      const { unassignAssessmentFromStudent } = await import('./assignmentServices');
      
      // Remove assignments for each student
      const unassignPromises = allStudentUids.map(studentUid => 
        unassignAssessmentFromStudent(assessmentId, studentUid).catch(err => {
          // Log but don't fail if assignment doesn't exist
          console.warn(`Could not unassign assessment ${assessmentId} from student ${studentUid}:`, err);
          return null;
        })
      );
      
      await Promise.all(unassignPromises);
      console.log(`✅ Removed ${allStudentUids.length} student assignments`);
    }
    
    console.log('✅ Assessment removed from goal successfully');
  } catch (error) {
    console.error('❌ Error removing assessment from goal:', error);
    throw error;
  }
}

/**
 * Get goals that have a specific assessment assigned
 */
export async function getGoalsByAssessment(assessmentId: string): Promise<Goal[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.GOALS),
      where('assignedAssessments', 'array-contains', assessmentId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
  } catch (error) {
    console.error('❌ Error getting goals by assessment:', error);
    throw error;
  }
}

// ==================== GOAL DELETION ====================

/**
 * Delete a goal (admin function)
 */
export async function deleteGoal(goalId: string): Promise<void> {
  try {
    console.log('🗑️ Deleting goal:', goalId);
    
    const docRef = doc(db, COLLECTIONS.GOALS, goalId);
    await deleteDoc(docRef);
    
    console.log('✅ Goal deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting goal:', error);
    throw error;
  }
}

// ==================== BATCH OPERATIONS ====================

/**
 * Create multiple goals in a batch
 */
export async function createGoalsBatch(goals: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
  try {
    console.log('📝 Creating goals in batch:', goals.length);
    
    const batch = writeBatch(db);
    const goalIds: string[] = [];
    
    for (const goalData of goals) {
      const docRef = doc(collection(db, COLLECTIONS.GOALS));
      batch.set(docRef, {
        ...goalData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      goalIds.push(docRef.id);
    }
    
    await batch.commit();
    
    console.log('✅ Batch goal creation completed:', goalIds);
    return goalIds;
  } catch (error) {
    console.error('❌ Error creating goals in batch:', error);
    throw error;
  }
}
