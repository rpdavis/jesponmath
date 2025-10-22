// App Categories Service - Manage custom categories for standards
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import type { AppCategory } from '@/types/standards';

const COLLECTION_NAME = 'appCategories';

/**
 * Get all active app categories
 */
export const getAllAppCategories = async (): Promise<AppCategory[]> => {
  try {
    console.log('📂 Getting all app categories from Firestore...');
    
    // Simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, COLLECTION_NAME),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppCategory[];
    
    // Sort client-side
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ Retrieved ${categories.length} app categories`);
    return categories;
  } catch (error) {
    console.error('❌ Error getting app categories:', error);
    throw error;
  }
};

/**
 * Create a new app category
 */
export const createAppCategory = async (categoryData: Omit<AppCategory, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<string> => {
  try {
    console.log('📂 Creating new app category:', categoryData.name);
    
    const cleanData = {
      name: categoryData.name,
      createdBy: categoryData.createdBy,
      isActive: true,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } as any;
    
    // Only add optional fields if they have values
    if (categoryData.description) {
      cleanData.description = categoryData.description;
    }
    if (categoryData.color) {
      cleanData.color = categoryData.color;
    }
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
    
    console.log('✅ Created app category with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating app category:', error);
    throw error;
  }
};

/**
 * Update an app category
 */
export const updateAppCategory = async (categoryId: string, updates: Partial<AppCategory>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, categoryId);
    
    const cleanUpdates: any = {
      updatedAt: serverTimestamp()
    };
    
    // Only add fields that have values
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanUpdates[key] = value;
      }
    });
    
    await updateDoc(docRef, cleanUpdates);
    
    console.log('✅ Updated app category:', categoryId);
  } catch (error) {
    console.error('❌ Error updating app category:', error);
    throw error;
  }
};

/**
 * Soft delete an app category
 */
export const deleteAppCategory = async (categoryId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, categoryId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Soft deleted app category:', categoryId);
  } catch (error) {
    console.error('❌ Error deleting app category:', error);
    throw error;
  }
};

/**
 * Check if a category name is already in use
 */
export const isCategoryNameAvailable = async (name: string, excludeId?: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('name', '==', name),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(doc => doc.id !== excludeId);
    
    return !existing;
  } catch (error) {
    console.error('❌ Error checking category name availability:', error);
    return false;
  }
};

/**
 * Validate app category data
 */
export const validateAppCategory = (categoryData: any): string[] => {
  const errors: string[] = [];
  
  if (!categoryData.name?.trim()) {
    errors.push('Category name is required');
  }
  
  if (categoryData.name && categoryData.name.trim().length < 2) {
    errors.push('Category name must be at least 2 characters long');
  }
  
  if (categoryData.name && categoryData.name.trim().length > 50) {
    errors.push('Category name must be less than 50 characters');
  }
  
  if (categoryData.description && categoryData.description.length > 200) {
    errors.push('Description must be less than 200 characters');
  }
  
  if (categoryData.color && !/^#[0-9A-F]{6}$/i.test(categoryData.color)) {
    errors.push('Color must be a valid hex color code (e.g., #FF5733)');
  }
  
  return errors;
};

/**
 * Get categories that are being used by standards
 */
export const getUsedAppCategories = async (): Promise<string[]> => {
  try {
    // This would require querying the customStandards collection
    // For now, we'll return an empty array and implement this later if needed
    return [];
  } catch (error) {
    console.error('❌ Error getting used app categories:', error);
    return [];
  }
};
