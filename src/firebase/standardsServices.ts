// Standards Services - Simple implementation that actually works
import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';
import type { CustomStandard } from '@/types/standards';

export const getAllCustomStandards = async (): Promise<CustomStandard[]> => {
  try {
    console.log('📚 Getting all custom standards from Firestore...');
    
    // Simple query - just get all documents
    const snapshot = await getDocs(collection(db, 'customStandards'));
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