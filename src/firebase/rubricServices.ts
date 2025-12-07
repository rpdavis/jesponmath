// Rubric Services - Database operations for Assessment Rubrics
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { COLLECTIONS } from '@/types/users'
import type { Rubric } from '@/types/iep'

// ==================== RUBRIC CREATION ====================

/**
 * Create a new rubric
 */
export async function createRubric(
  rubricData: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  try {
    console.log('📝 Creating new rubric:', rubricData.name)

    const docRef = await addDoc(collection(db, COLLECTIONS.RUBRICS), {
      ...rubricData,
      usageCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log('✅ Rubric created successfully:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Error creating rubric:', error)
    throw error
  }
}

// ==================== RUBRIC RETRIEVAL ====================

/**
 * Get a single rubric by ID
 */
export async function getRubric(rubricId: string): Promise<Rubric | null> {
  try {
    const docRef = doc(db, COLLECTIONS.RUBRICS, rubricId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Rubric
    }

    return null
  } catch (error) {
    console.error('❌ Error getting rubric:', error)
    throw error
  }
}

/**
 * Get all rubrics
 */
export async function getAllRubrics(): Promise<Rubric[]> {
  try {
    const q = query(collection(db, COLLECTIONS.RUBRICS), orderBy('createdAt', 'desc'))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rubric[]
  } catch (error) {
    console.error('❌ Error getting all rubrics:', error)
    throw error
  }
}

/**
 * Get active rubrics only
 */
export async function getActiveRubrics(): Promise<Rubric[]> {
  try {
    const q = query(collection(db, COLLECTIONS.RUBRICS), where('isActive', '==', true))

    const querySnapshot = await getDocs(q)
    const rubrics = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rubric[]

    // Sort by createdAt descending in memory
    return rubrics.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('❌ Error getting active rubrics:', error)
    throw error
  }
}

/**
 * Get rubrics by subject
 */
export async function getRubricsBySubject(subject: 'math' | 'ela' | 'other'): Promise<Rubric[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.RUBRICS),
      where('subject', '==', subject),
      where('isActive', '==', true),
    )

    const querySnapshot = await getDocs(q)
    const rubrics = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rubric[]

    // Sort by createdAt descending in memory
    return rubrics.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('❌ Error getting rubrics by subject:', error)
    throw error
  }
}

/**
 * Get rubrics by topic
 */
export async function getRubricsByTopic(topic: string): Promise<Rubric[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.RUBRICS),
      where('topic', '==', topic),
      where('isActive', '==', true),
    )

    const querySnapshot = await getDocs(q)
    const rubrics = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rubric[]

    // Sort by createdAt descending in memory
    return rubrics.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('❌ Error getting rubrics by topic:', error)
    throw error
  }
}

// ==================== RUBRIC UPDATES ====================

/**
 * Update a rubric
 */
export async function updateRubric(rubricId: string, updates: Partial<Rubric>): Promise<void> {
  try {
    console.log('📝 Updating rubric:', rubricId, updates)

    const docRef = doc(db, COLLECTIONS.RUBRICS, rubricId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    console.log('✅ Rubric updated successfully')
  } catch (error) {
    console.error('❌ Error updating rubric:', error)
    throw error
  }
}

/**
 * Increment rubric usage count
 */
export async function incrementRubricUsage(rubricId: string): Promise<void> {
  try {
    const rubric = await getRubric(rubricId)
    if (rubric) {
      await updateRubric(rubricId, {
        usageCount: (rubric.usageCount || 0) + 1,
      })
    }
  } catch (error) {
    console.error('❌ Error incrementing rubric usage:', error)
    // Don't throw - this is not critical
  }
}

/**
 * Deactivate a rubric
 */
export async function deactivateRubric(rubricId: string): Promise<void> {
  try {
    await updateRubric(rubricId, {
      isActive: false,
    })
    console.log('📦 Rubric deactivated successfully')
  } catch (error) {
    console.error('❌ Error deactivating rubric:', error)
    throw error
  }
}

/**
 * Activate a rubric
 */
export async function activateRubric(rubricId: string): Promise<void> {
  try {
    await updateRubric(rubricId, {
      isActive: true,
    })
    console.log('🔄 Rubric activated successfully')
  } catch (error) {
    console.error('❌ Error activating rubric:', error)
    throw error
  }
}

// ==================== RUBRIC DELETION ====================

/**
 * Delete a rubric (admin function)
 */
export async function deleteRubric(rubricId: string): Promise<void> {
  try {
    console.log('🗑️ Deleting rubric:', rubricId)

    const docRef = doc(db, COLLECTIONS.RUBRICS, rubricId)
    await deleteDoc(docRef)

    console.log('✅ Rubric deleted successfully')
  } catch (error) {
    console.error('❌ Error deleting rubric:', error)
    throw error
  }
}
