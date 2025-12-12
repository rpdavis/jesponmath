// Template Services - Database operations for Goal Templates
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
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import { COLLECTIONS } from '@/types/users'
import type { GoalTemplate } from '@/types/iep'

// ==================== TEMPLATE CREATION ====================

/**
 * Create a new goal template
 */
export async function createTemplate(
  templateData: Omit<GoalTemplate, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  try {
    console.log('📝 Creating new template:', templateData)

    // Remove undefined values before saving
    const cleanData = removeUndefined(templateData)

    const docRef = await addDoc(collection(db, COLLECTIONS.GOAL_TEMPLATES), {
      ...cleanData,
      usageCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log('✅ Template created successfully:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Error creating template:', error)
    throw error
  }
}

// ==================== TEMPLATE RETRIEVAL ====================

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<GoalTemplate | null> {
  try {
    const docRef = doc(db, COLLECTIONS.GOAL_TEMPLATES, templateId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as GoalTemplate
    }

    return null
  } catch (error) {
    console.error('❌ Error getting template:', error)
    throw error
  }
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<GoalTemplate[]> {
  try {
    const q = query(collection(db, COLLECTIONS.GOAL_TEMPLATES), orderBy('createdAt', 'desc'))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GoalTemplate[]
  } catch (error) {
    console.error('❌ Error getting all templates:', error)
    throw error
  }
}

/**
 * Get active templates only
 */
export async function getActiveTemplates(): Promise<GoalTemplate[]> {
  try {
    // Temporarily fetch without orderBy to avoid index requirement
    // Sort in memory until composite index is built
    const q = query(collection(db, COLLECTIONS.GOAL_TEMPLATES), where('isActive', '==', true))

    const querySnapshot = await getDocs(q)
    const templates = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GoalTemplate[]

    // Sort by createdAt descending in memory
    return templates.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('❌ Error getting active templates:', error)
    throw error
  }
}

/**
 * Get templates by subject
 */
export async function getTemplatesBySubject(
  subject: 'math' | 'ela' | 'other',
): Promise<GoalTemplate[]> {
  try {
    // Temporarily fetch without orderBy to avoid index requirement
    // Sort in memory until composite index is built
    const q = query(
      collection(db, COLLECTIONS.GOAL_TEMPLATES),
      where('subject', '==', subject),
      where('isActive', '==', true),
    )

    const querySnapshot = await getDocs(q)
    const templates = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GoalTemplate[]

    // Sort by createdAt descending in memory
    return templates.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('❌ Error getting templates by subject:', error)
    throw error
  }
}

/**
 * Get templates by topic
 */
export async function getTemplatesByTopic(topic: string): Promise<GoalTemplate[]> {
  try {
    // Temporarily fetch without orderBy to avoid index requirement
    // Sort in memory until composite index is built
    const q = query(
      collection(db, COLLECTIONS.GOAL_TEMPLATES),
      where('topic', '==', topic),
      where('isActive', '==', true),
    )

    const querySnapshot = await getDocs(q)
    const templates = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GoalTemplate[]

    // Sort by createdAt descending in memory
    return templates.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('❌ Error getting templates by topic:', error)
    throw error
  }
}

// ==================== TEMPLATE UPDATES ====================

/**
 * Helper function to remove undefined and empty string values from objects (Firestore doesn't allow undefined)
 * Note: We keep empty strings for some fields like description, but remove undefined
 */
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Only skip undefined values, keep empty strings and null
    if (value !== undefined) {
      if (Array.isArray(value)) {
        // Recursively clean arrays
        cleaned[key] = value.map((item) =>
          typeof item === 'object' && item !== null && !(item instanceof Date)
            ? removeUndefined(item)
            : item,
        )
      } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        // Recursively clean nested objects
        cleaned[key] = removeUndefined(value)
      } else {
        cleaned[key] = value
      }
    }
  }
  return cleaned
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<GoalTemplate>,
): Promise<void> {
  try {
    console.log('📝 Updating template:', templateId, updates)

    // Remove undefined values before saving
    const cleanUpdates = removeUndefined(updates)

    const docRef = doc(db, COLLECTIONS.GOAL_TEMPLATES, templateId)
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    })

    console.log('✅ Template updated successfully')
  } catch (error) {
    console.error('❌ Error updating template:', error)
    throw error
  }
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    const template = await getTemplate(templateId)
    if (template) {
      await updateTemplate(templateId, {
        usageCount: (template.usageCount || 0) + 1,
      })
    }
  } catch (error) {
    console.error('❌ Error incrementing template usage:', error)
    // Don't throw - this is not critical
  }
}

/**
 * Deactivate a template
 */
export async function deactivateTemplate(templateId: string): Promise<void> {
  try {
    await updateTemplate(templateId, {
      isActive: false,
    })
    console.log('📦 Template deactivated successfully')
  } catch (error) {
    console.error('❌ Error deactivating template:', error)
    throw error
  }
}

/**
 * Activate a template
 */
export async function activateTemplate(templateId: string): Promise<void> {
  try {
    await updateTemplate(templateId, {
      isActive: true,
    })
    console.log('🔄 Template activated successfully')
  } catch (error) {
    console.error('❌ Error activating template:', error)
    throw error
  }
}

// ==================== TEMPLATE DELETION ====================

/**
 * Delete a template (admin function)
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    console.log('🗑️ Deleting template:', templateId)

    const docRef = doc(db, COLLECTIONS.GOAL_TEMPLATES, templateId)
    await deleteDoc(docRef)

    console.log('✅ Template deleted successfully')
  } catch (error) {
    console.error('❌ Error deleting template:', error)
    throw error
  }
}

// ==================== TEMPLATE UTILITIES ====================

/**
 * Generate a goal from a template by replacing variables
 */
export function generateGoalFromTemplate(
  template: GoalTemplate,
  variables: {
    topic?: string
    operation?: string
    threshold?: string
    condition?: string
    gradeLevel?: number
    standard?: string
    [key: string]: any // Allow additional variables
  },
): {
  goalTitle: string
  goalText: string
  areaOfNeed: string
  baseline?: string
  gradeLevel?: number
  standard?: string
} {
  // Merge template variables with provided variables
  const allVariables = {
    ...template.variables,
    ...variables,
    // Ensure common variables are available
    topic: variables.topic || template.variables?.topic || template.topic || '',
    operation: variables.operation || template.variables?.operation || '',
    threshold: variables.threshold || template.defaultThreshold || '80%',
    condition: variables.condition || template.defaultCondition || 'in 3 out of 4 trials',
    gradeLevel: variables.gradeLevel || template.defaultGradeLevel || 7,
    standard: variables.standard || template.defaultStandard || '',
  }

  // Replace variables in templates (format: {{variableName}})
  const replaceVariables = (text: string): string => {
    if (!text) return ''
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = (allVariables as Record<string, any>)[varName]
      return value !== undefined ? String(value) : match
    })
  }

  return {
    goalTitle: replaceVariables(template.goalTitleTemplate),
    goalText: replaceVariables(template.goalTextTemplate),
    areaOfNeed: template.areaOfNeed,
    baseline: template.baselineTemplate ? replaceVariables(template.baselineTemplate) : undefined,
    gradeLevel: allVariables.gradeLevel,
    standard: allVariables.standard || undefined,
  }
}



