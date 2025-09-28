import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc,
  query, 
  where 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

interface FixResult {
  success: boolean;
  message: string;
  importedCount: number;
  errors: string[];
}

export async function deleteAllCSVResults(): Promise<FixResult> {
  try {
    console.log('🗑️ Deleting ALL CSV-imported assessment results...');
    
    // Get all assessment results that were imported via any CSV process
    const migrationTypes = [
      'csv-import',
      'csv-reimport', 
      'field-structure-fix',
      'question-id-fix',
      'matrix-csv-import'
    ];
    
    let totalDeleted = 0;
    const errors: string[] = [];
    
    for (const migrationType of migrationTypes) {
      try {
        const resultsQuery = query(
          collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
          where('migratedBy', '==', migrationType)
        );
        
        const resultsSnapshot = await getDocs(resultsQuery);
        console.log(`📊 Found ${resultsSnapshot.docs.length} results with migratedBy: ${migrationType}`);
        
        // Delete each result
        for (const resultDoc of resultsSnapshot.docs) {
          try {
            await deleteDoc(doc(db, COLLECTIONS.ASSESSMENT_RESULTS, resultDoc.id));
            totalDeleted++;
            console.log(`🗑️ Deleted result ${resultDoc.id} (${migrationType})`);
          } catch (error) {
            const errorMsg = `Failed to delete result ${resultDoc.id}: ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
        
      } catch (error) {
        console.warn(`⚠️ Could not query ${migrationType} results:`, error);
        // Continue with other migration types
      }
    }
    
    // Also check for results that might not have migratedBy field but were created by system
    try {
      const systemResultsQuery = query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('gradedBy', '==', 'csv-import')
      );
      
      const systemResultsSnapshot = await getDocs(systemResultsQuery);
      console.log(`📊 Found ${systemResultsSnapshot.docs.length} results with gradedBy: csv-import`);
      
      for (const resultDoc of systemResultsSnapshot.docs) {
        try {
          await deleteDoc(doc(db, COLLECTIONS.ASSESSMENT_RESULTS, resultDoc.id));
          totalDeleted++;
          console.log(`🗑️ Deleted system result ${resultDoc.id}`);
        } catch (error) {
          const errorMsg = `Failed to delete system result ${resultDoc.id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Could not query system results:`, error);
    }
    
    return {
      success: true,
      message: `Successfully deleted ${totalDeleted} CSV-imported assessment results. Database is clean for fresh import.`,
      importedCount: totalDeleted,
      errors
    };
    
  } catch (error) {
    console.error('❌ Error deleting CSV results:', error);
    return {
      success: false,
      message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
