import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

interface GradebookDiagnostic {
  success: boolean;
  message: string;
  importedCount: number;
  errors: string[];
}

export async function runGradebookDiagnostic(): Promise<GradebookDiagnostic> {
  try {
    console.log('🎯 === GRADEBOOK DIAGNOSTIC (FOCUSED) ===');
    
    const teacherUID = 'Ey2Po5PBmpg17XmRbXsUtnq521E2';
    console.log(`👨‍🏫 Checking data for teacher: ${teacherUID}`);
    
    // 1. Check students assigned to teacher
    const studentsQuery = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('assignedTeacher', '==', teacherUID)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    const studentCount = studentsSnapshot.docs.length;
    console.log(`👥 Students assigned to teacher: ${studentCount}`);
    
    // Get first few student UIDs
    const studentUIDs = studentsSnapshot.docs.slice(0, 3).map(doc => {
      const data = doc.data();
      return data.uid || doc.id;
    });
    console.log(`👥 Sample student UIDs:`, studentUIDs);
    
    // 2. Check assessments created by teacher
    const assessmentsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENTS),
      where('createdBy', '==', teacherUID)
    );
    const assessmentsSnapshot = await getDocs(assessmentsQuery);
    const assessmentCount = assessmentsSnapshot.docs.length;
    console.log(`📝 Assessments created by teacher: ${assessmentCount}`);
    
    // Get assessment IDs
    const assessmentIDs = assessmentsSnapshot.docs.slice(0, 3).map(doc => doc.id);
    console.log(`📝 Sample assessment IDs:`, assessmentIDs);
    
    // 3. Check assessment results for these assessments
    let totalResults = 0;
    let matchingResults = 0;
    
    for (const assessmentId of assessmentIDs) {
      const resultsQuery = query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('assessmentId', '==', assessmentId)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsCount = resultsSnapshot.docs.length;
      totalResults += resultsCount;
      
      console.log(`📊 Results for assessment ${assessmentId}: ${resultsCount}`);
      
      // Check if any results match our student UIDs
      resultsSnapshot.docs.forEach(doc => {
        const result = doc.data();
        if (studentUIDs.includes(result.studentUid)) {
          matchingResults++;
          console.log(`✅ MATCH: Student ${result.studentUid} has result for assessment ${assessmentId} - Score: ${result.score}/${result.totalPoints}`);
        } else {
          console.log(`❌ NO MATCH: Result has studentUid ${result.studentUid} but teacher's students are:`, studentUIDs);
        }
      });
    }
    
    // 4. Summary
    console.log('🎯 === SUMMARY ===');
    console.log(`👥 Teacher has ${studentCount} students`);
    console.log(`📝 Teacher has ${assessmentCount} assessments`);
    console.log(`📊 Total assessment results: ${totalResults}`);
    console.log(`✅ Matching results (student UID matches): ${matchingResults}`);
    
    const diagnosis = matchingResults > 0 
      ? '✅ GOOD: Found matching results - gradebook should work!'
      : '❌ PROBLEM: No matching results found - student UIDs don\'t match!';
    
    console.log(`🔍 DIAGNOSIS: ${diagnosis}`);
    
    return {
      success: true,
      message: `Gradebook diagnostic: ${studentCount} students, ${assessmentCount} assessments, ${matchingResults}/${totalResults} matching results`,
      importedCount: matchingResults,
      errors: []
    };
    
  } catch (error) {
    console.error('❌ Gradebook diagnostic failed:', error);
    return {
      success: false,
      message: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
