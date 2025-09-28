import { 
  collection, 
  getDocs, 
  doc, 
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

export async function fixQuestionMapping(): Promise<FixResult> {
  try {
    console.log('🔧 Fixing question ID mapping...');
    
    // Step 1: Get the real question IDs from assessments
    const assessmentQuestionMap: Record<string, string[]> = {};
    
    const assessmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSESSMENTS));
    
    assessmentsSnapshot.docs.forEach(doc => {
      const assessment = doc.data() as any;
      if (assessment.title && assessment.title.startsWith('ESA C')) {
        const questionIds = assessment.questions?.map((q: any) => q.id) || [];
        assessmentQuestionMap[doc.id] = questionIds;
        console.log(`📝 ${assessment.title} (${doc.id}): ${questionIds.length} questions`);
        questionIds.forEach((qId: string, index: number) => {
          console.log(`   Q${index + 1}: ${qId}`);
        });
      }
    });
    
    // Step 2: Get CSV-imported assessment results that need fixing
    const resultsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
      where('migratedBy', 'in', ['csv-reimport', 'field-structure-fix'])
    );
    
    const resultsSnapshot = await getDocs(resultsQuery);
    console.log(`📊 Found ${resultsSnapshot.docs.length} CSV results to fix`);
    
    let fixedResults = 0;
    const errors: string[] = [];
    
    // Step 3: Fix each result
    for (const resultDoc of resultsSnapshot.docs) {
      try {
        const result = resultDoc.data() as any;
        const assessmentId = result.assessmentId;
        const correctQuestionIds = assessmentQuestionMap[assessmentId];
        
        if (!correctQuestionIds || correctQuestionIds.length === 0) {
          errors.push(`No question IDs found for assessment ${assessmentId}`);
          continue;
        }
        
        console.log(`🔄 Fixing result ${resultDoc.id} for assessment ${assessmentId}`);
        
        // Map the responses to correct question IDs (positional mapping)
        const updatedResponses = result.responses?.map((response: any, index: number) => {
          const correctQuestionId = correctQuestionIds[index];
          if (!correctQuestionId) {
            console.warn(`⚠️ No question ID for position ${index} in assessment ${assessmentId}`);
            return response;
          }
          
          console.log(`   Q${index + 1}: ${response.questionId} → ${correctQuestionId}`);
          
          return {
            ...response,
            questionId: correctQuestionId
          };
        }) || [];
        
        // Update the result with correct question IDs
        await updateDoc(doc(db, COLLECTIONS.ASSESSMENT_RESULTS, resultDoc.id), {
          responses: updatedResponses,
          migrationReason: 'Fixed question ID mapping to real assessment questions',
          migratedAt: new Date(),
          migratedBy: 'question-id-fix'
        });
        
        fixedResults++;
        console.log(`✅ Fixed result ${resultDoc.id}: mapped ${updatedResponses.length} responses`);
        
      } catch (error) {
        const errorMsg = `Failed to fix result ${resultDoc.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    return {
      success: true,
      message: `Successfully fixed question IDs for ${fixedResults} assessment results. Standards should now work correctly!`,
      importedCount: fixedResults,
      errors
    };
    
  } catch (error) {
    console.error('❌ Question mapping failed:', error);
    return {
      success: false,
      message: `Question mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
