import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
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

export async function fixAssessmentMapping(): Promise<FixResult> {
  try {
    console.log('🔧 Fixing assessment mapping...');
    
    // Step 1: Get the correct assessment mappings
    const assessmentMapping = {
      'ESA 1': 'ESA C1',
      'ESA 2': 'ESA C2', 
      'ESA 3': 'ESA C3',
      'ESA 4': 'ESA C4'
    };
    
    // Step 2: Get all assessments to find the correct IDs
    const assessmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSESSMENTS));
    const csvAssessmentIds: Record<string, string> = {};
    const correctAssessmentIds: Record<string, string> = {};
    
    assessmentsSnapshot.docs.forEach(doc => {
      const assessment = doc.data() as any;
      const title = assessment.title;
      
      if (title && title.startsWith('ESA ') && !title.startsWith('ESA C')) {
        // This is a CSV-imported assessment (ESA 1, ESA 2, etc.)
        csvAssessmentIds[title] = doc.id;
        console.log(`📝 Found CSV assessment: ${title} -> ${doc.id}`);
      } else if (title && title.startsWith('ESA C')) {
        // This is a correct app-created assessment (ESA C1, ESA C2, etc.)
        correctAssessmentIds[title] = doc.id;
        console.log(`✅ Found correct assessment: ${title} -> ${doc.id}`);
      }
    });
    
    console.log('📊 CSV assessments to delete:', Object.keys(csvAssessmentIds));
    console.log('✅ Correct assessments to keep:', Object.keys(correctAssessmentIds));
    
    // Step 3: Update assessment results to point to correct assessments
    let updatedResults = 0;
    const errors: string[] = [];
    
    for (const [csvTitle, correctTitle] of Object.entries(assessmentMapping)) {
      const csvAssessmentId = csvAssessmentIds[csvTitle];
      const correctAssessmentId = correctAssessmentIds[correctTitle];
      
      if (!csvAssessmentId) {
        console.log(`⚠️ CSV assessment not found: ${csvTitle}`);
        continue;
      }
      
      if (!correctAssessmentId) {
        errors.push(`Correct assessment not found: ${correctTitle}`);
        console.error(`❌ Correct assessment not found: ${correctTitle}`);
        continue;
      }
      
      console.log(`🔄 Mapping ${csvTitle} (${csvAssessmentId}) -> ${correctTitle} (${correctAssessmentId})`);
      
      // Get all results for the CSV assessment
      const resultsQuery = query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('assessmentId', '==', csvAssessmentId)
      );
      
      const resultsSnapshot = await getDocs(resultsQuery);
      console.log(`📊 Found ${resultsSnapshot.docs.length} results for ${csvTitle}`);
      
      // Update each result to point to the correct assessment
      for (const resultDoc of resultsSnapshot.docs) {
        try {
          await updateDoc(doc(db, COLLECTIONS.ASSESSMENT_RESULTS, resultDoc.id), {
            assessmentId: correctAssessmentId,
            migrationReason: `Mapped from ${csvTitle} to ${correctTitle}`,
            migratedAt: new Date()
          });
          updatedResults++;
          console.log(`✅ Updated result ${resultDoc.id}: ${csvTitle} -> ${correctTitle}`);
        } catch (error) {
          const errorMsg = `Failed to update result ${resultDoc.id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }
    
    // Step 4: Delete the CSV assessments (now that results are remapped)
    let deletedAssessments = 0;
    
    for (const [csvTitle, csvId] of Object.entries(csvAssessmentIds)) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ASSESSMENTS, csvId));
        deletedAssessments++;
        console.log(`🗑️ Deleted CSV assessment: ${csvTitle} (${csvId})`);
      } catch (error) {
        const errorMsg = `Failed to delete assessment ${csvTitle}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    return {
      success: true,
      message: `Successfully mapped ${updatedResults} results and deleted ${deletedAssessments} duplicate assessments.`,
      importedCount: updatedResults,
      errors
    };
    
  } catch (error) {
    console.error('❌ Assessment mapping failed:', error);
    return {
      success: false,
      message: `Mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
