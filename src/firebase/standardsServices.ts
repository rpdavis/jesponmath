// Standards Services - Simple implementation that actually works
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/types/users';
import type { CustomStandard } from '@/types/standards';

export const getAllCustomStandards = async (): Promise<CustomStandard[]> => {
  try {
    console.log('📚 Getting all custom standards from Firestore...');
    
    // Simple query - just get all documents
    const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOM_STANDARDS));
    const standards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CustomStandard[];
    
    // Filter active ones client-side
    const activeStandards = standards.filter(s => s.isActive !== false);
    
    console.log('✅ Retrieved', activeStandards.length, 'custom standards');
    return activeStandards;
  } catch (error) {
    console.error('❌ Error getting custom standards:', error);
    throw error;
  }
};

export const getCustomStandardsByGrade = async (grade: string): Promise<CustomStandard[]> => {
  try {
    const allStandards = await getAllCustomStandards();
    return allStandards.filter(s => s.grade === grade);
  } catch (error) {
    console.error('❌ Error getting custom standards by grade:', error);
    throw error;
  }
};

export const searchCustomStandards = async (searchTerm: string): Promise<CustomStandard[]> => {
  try {
    const allStandards = await getAllCustomStandards();
    const searchLower = searchTerm.toLowerCase();
    return allStandards.filter(standard => 
      standard.name?.toLowerCase().includes(searchLower) ||
      standard.code?.toLowerCase().includes(searchLower) ||
      standard.description?.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error('❌ Error searching custom standards:', error);
    throw error;
  }
};

export const createCustomStandard = async (standardData: Omit<CustomStandard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    console.log('📚 Creating new custom standard:', standardData.code);
    console.log('📊 Standard data received:', standardData);
    
    // Filter out undefined values - Firestore doesn't allow them
    const cleanData: any = {
      name: standardData.name,
      code: standardData.code,
      grade: standardData.grade,
      createdBy: standardData.createdBy,
      isActive: true,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Only add optional fields if they have values
    if (standardData.description) {
      cleanData.description = standardData.description;
    }
    if (standardData.category) {
      cleanData.category = standardData.category;
    }
    if (standardData.ccssAlignment) {
      cleanData.ccssAlignment = standardData.ccssAlignment;
    }
    if (standardData.appCategory) {
      cleanData.appCategory = standardData.appCategory;
    }
    if (standardData.maxScore && standardData.maxScore > 0) {
      cleanData.maxScore = standardData.maxScore;
      console.log('📊 Adding maxScore to cleanData:', standardData.maxScore);
    } else {
      console.log('📊 MaxScore not added - value:', standardData.maxScore);
    }
    if (standardData.scoringMethod) {
      cleanData.scoringMethod = standardData.scoringMethod;
    }
    
    console.log('📊 Final cleanData being saved:', cleanData);
    
    const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOM_STANDARDS), cleanData);
    
    console.log('✅ Created custom standard with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating custom standard:', error);
    throw error;
  }
};

export const updateCustomStandard = async (standardId: string, updates: Partial<CustomStandard>): Promise<void> => {
  try {
    console.log('📚 Updating custom standard:', standardId);
    console.log('📊 Updates received:', updates);
    
    const docRef = doc(db, COLLECTIONS.CUSTOM_STANDARDS, standardId);
    
    // Filter out undefined values - Firestore doesn't allow them
    const cleanUpdates: any = {
      updatedAt: serverTimestamp()
    };
    
    // Only add fields that have values
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      // Special handling for maxScore - allow 0 to be excluded but not other numbers
      if (key === 'maxScore') {
        if (typeof value === 'number' && value > 0) {
          cleanUpdates[key] = value;
          console.log(`📊 Adding ${key} to updates:`, value);
        } else {
          console.log(`📊 Skipping ${key} - invalid value:`, value);
        }
      } else if (value !== undefined && value !== null && value !== '') {
        cleanUpdates[key] = value;
      }
    });
    
    console.log('📊 Final cleanUpdates being saved:', cleanUpdates);
    
    await updateDoc(docRef, cleanUpdates);
    
    console.log('✅ Updated custom standard:', standardId);
  } catch (error) {
    console.error('❌ Error updating custom standard:', error);
    throw error;
  }
};

export const deleteCustomStandard = async (standardId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOM_STANDARDS, standardId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Soft deleted custom standard:', standardId);
  } catch (error) {
    console.error('❌ Error deleting custom standard:', error);
    throw error;
  }
};

export const validateCustomStandard = (standardData: any): string[] => {
  const errors: string[] = [];
  
  if (!standardData.name?.trim()) {
    errors.push('Standard name is required');
  }
  if (!standardData.code?.trim()) {
    errors.push('Standard code is required');
  }
  if (!standardData.grade?.trim()) {
    errors.push('Grade level is required');
  }
  
  return errors;
};

export const generateStandardCode = (name: string, grade: string): string => {
  // Simple code generation
  const namePrefix = name.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
  const gradePrefix = grade;
  const timestamp = Date.now().toString().slice(-4);
  return `${gradePrefix}${namePrefix}-${timestamp}`;
};

export const isStandardCodeAvailable = async (code: string, excludeId?: string): Promise<boolean> => {
  try {
    const allStandards = await getAllCustomStandards();
    const existing = allStandards.find(s => s.code === code && s.id !== excludeId);
    return !existing;
  } catch (error) {
    console.error('❌ Error checking standard code availability:', error);
    return false;
  }
};