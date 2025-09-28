import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc,
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

export async function deleteIncorrectAssessmentResults(): Promise<FixResult> {
  try {
    console.log('🗑️ Deleting incorrectly imported assessment results...');
    
    // Get all assessment results that were imported via CSV
    const resultsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('migratedBy', '==', 'csv-import')
      )
    );
    
    console.log(`📊 Found ${resultsSnapshot.docs.length} CSV-imported results to delete`);
    
    let deletedCount = 0;
    const errors: string[] = [];
    
    // Delete each result
    for (const resultDoc of resultsSnapshot.docs) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ASSESSMENT_RESULTS, resultDoc.id));
        deletedCount++;
        console.log(`🗑️ Deleted result ${resultDoc.id}`);
      } catch (error) {
        const errorMsg = `Failed to delete result ${resultDoc.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    return {
      success: true,
      message: `Deleted ${deletedCount} incorrect assessment results. Ready for re-import.`,
      importedCount: deletedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Error deleting results:', error);
    return {
      success: false,
      message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

export async function reimportCSVWithCorrectUIDs(): Promise<FixResult> {
  try {
    console.log('🔄 Re-importing CSV data with correct student UIDs...');
    
    // Step 1: Get all students and create email -> UID mapping
    const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    const emailToUID: Record<string, string> = {};
    const emailToStudent: Record<string, any> = {};
    
    studentsSnapshot.docs.forEach(doc => {
      const student = doc.data() as any;
      if (student.email) {
        const uid = student.uid || doc.id;
        emailToUID[student.email] = uid;
        emailToStudent[student.email] = { ...student, uid };
        console.log(`📧 Student mapping: ${student.email} -> ${uid} (${student.displayName})`);
      }
    });
    
    // Step 2: Get all assessments and create title -> ID mapping
    const assessmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSESSMENTS));
    const titleToAssessment: Record<string, any> = {};
    
    assessmentsSnapshot.docs.forEach(doc => {
      const assessment = doc.data() as any;
      if (assessment.title) {
        titleToAssessment[assessment.title] = { ...assessment, id: doc.id };
        console.log(`📝 Assessment mapping: ${assessment.title} -> ${doc.id}`);
      }
    });
    
    // Step 3: Parse the CSV data (hardcoded for now)
    const csvData = [
      { email: 's-723738149@vacavilleusd.org', name: 'Abbott Esau', assessment: 'ESA 1', scores: [0,0,1,0,1,0] },
      { email: 's-723738149@vacavilleusd.org', name: 'Abbott Esau', assessment: 'ESA 2', scores: [0,0,1,0,1,1] },
      { email: 's-723738149@vacavilleusd.org', name: 'Abbott Esau', assessment: 'ESA 3', scores: [0,0,1,0,1,1] },
      { email: 's-723738149@vacavilleusd.org', name: 'Abbott Esau', assessment: 'ESA 4', scores: [0,0,0,0,0,0] },
      { email: 's-723728592@vacavilleusd.org', name: 'Bracy Kaylani', assessment: 'ESA 1', scores: [0,0.5,1,0,1,0] },
      { email: 's-723728592@vacavilleusd.org', name: 'Bracy Kaylani', assessment: 'ESA 2', scores: [0,0,1,0,1,1] },
      { email: 's-723728592@vacavilleusd.org', name: 'Bracy Kaylani', assessment: 'ESA 3', scores: [1,0,1,0,0,0] },
      { email: 's-723728592@vacavilleusd.org', name: 'Bracy Kaylani', assessment: 'ESA 4', scores: [0,0,1,0,1,0] },
      { email: 's-723723324@vacavilleusd.org', name: 'Chatfield Lexee', assessment: 'ESA 1', scores: [1,0,1,1,1,1] },
      { email: 's-723723324@vacavilleusd.org', name: 'Chatfield Lexee', assessment: 'ESA 2', scores: [1,1,1,1,1,1] },
      { email: 's-723723324@vacavilleusd.org', name: 'Chatfield Lexee', assessment: 'ESA 3', scores: [1,0,1,1,0,0] },
      { email: 's-723723324@vacavilleusd.org', name: 'Chatfield Lexee', assessment: 'ESA 4', scores: [1,1,1,1,1,1] }
      // Add more data as needed...
    ];
    
    let importedCount = 0;
    const errors: string[] = [];
    
    // Step 4: Create assessment results with correct UIDs
    for (const row of csvData) {
      try {
        // Get the correct student UID
        const studentUID = emailToUID[row.email];
        if (!studentUID) {
          errors.push(`Student not found for email: ${row.email}`);
          continue;
        }
        
        // Get the assessment
        const assessment = titleToAssessment[row.assessment];
        if (!assessment) {
          errors.push(`Assessment not found: ${row.assessment}`);
          continue;
        }
        
        // Calculate score
        const totalScore = row.scores.reduce((sum, score) => sum + score, 0);
        const totalPoints = row.scores.length;
        const percentage = (totalScore / totalPoints) * 100;
        
        // Create responses
        const responses = row.scores.map((score, index) => ({
          questionId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          studentAnswer: score.toString(),
          isCorrect: score > 0,
          pointsEarned: score,
          pointsPossible: 1
        }));
        
        // Create the assessment result
        const assessmentResult = {
          studentUid: studentUID,
          assessmentId: assessment.id,
          score: totalScore,
          totalPoints: totalPoints,
          percentage: percentage,
          completedAt: new Date(),
          attemptNumber: 1,
          responses: responses,
          isRetake: false,
          gradedBy: 'csv-import',
          feedback: '',
          goalId: null,
          accommodationsUsed: [],
          previousAttempts: [],
          uploadedFiles: [],
          migratedAt: new Date(),
          migratedBy: 'csv-reimport',
          migrationReason: 'Fixed student UID mapping'
        };
        
        // Save to Firestore
        await addDoc(collection(db, COLLECTIONS.ASSESSMENT_RESULTS), assessmentResult);
        importedCount++;
        
        console.log(`✅ Imported result for ${row.name} (${row.email}) - ${row.assessment}: ${totalScore}/${totalPoints}`);
        
      } catch (error) {
        const errorMsg = `Failed to import result for ${row.email} - ${row.assessment}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    return {
      success: true,
      message: `Successfully re-imported ${importedCount} assessment results with correct student UIDs.`,
      importedCount: importedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Error re-importing:', error);
    return {
      success: false,
      message: `Re-import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
