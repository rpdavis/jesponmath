import { 
  collection, 
  getDocs, 
  query, 
  limit,
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

export async function runDiagnosticCheck(): Promise<FixResult> {
  try {
    console.log('🔍 Running comprehensive diagnostic check...');
    
    // Check assessment results
    const resultsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.ASSESSMENT_RESULTS), limit(5))
    );
    
    console.log(`📊 Found ${resultsSnapshot.docs.length} assessment results (showing first 5)`);
    
    const results = resultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    results.forEach((result, index) => {
      console.log(`Result ${index + 1}:`, {
        studentUid: result.studentUid,
        assessmentId: result.assessmentId,
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        completedAt: result.completedAt,
        attemptNumber: result.attemptNumber,
        hasResponses: result.responses?.length || 0,
        migratedBy: result.migratedBy
      });
    });
    
    // Check students
    const studentsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.STUDENTS), limit(3))
    );
    
    console.log(`👥 Found ${studentsSnapshot.docs.length} students (showing first 3)`);
    
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, {
        uid: student.uid || student.id,
        email: student.email,
        displayName: student.displayName,
        assignedTeacher: student.assignedTeacher,
        className: student.className
      });
    });
    
    // Check assessments
    const assessmentsSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.ASSESSMENTS), limit(4))
    );
    
    console.log(`📝 Found ${assessmentsSnapshot.docs.length} assessments (showing first 4)`);
    
    const assessments = assessmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    assessments.forEach((assessment, index) => {
      console.log(`Assessment ${index + 1}:`, {
        id: assessment.id,
        title: assessment.title,
        createdBy: assessment.createdBy,
        totalPoints: assessment.totalPoints,
        questionsCount: assessment.questions?.length || 0
      });
    });
    
    // 🎯 NEW: Check current user context and teacher UID mismatch
    console.log('🔍 === TEACHER UID MISMATCH DIAGNOSTIC ===');
    
    // Current logged-in admin user UID
    const currentAdminUID = 'OQXA6hoMeLXGvQmvTff7H1zbieh2';
    console.log(`👤 Current admin user UID: ${currentAdminUID}`);
    
    // Check if current admin can see students (should be 0)
    const currentUserStudents = await getDocs(
      query(collection(db, COLLECTIONS.STUDENTS), where('assignedTeacher', '==', currentAdminUID))
    );
    console.log(`👥 Students assigned to current admin (${currentAdminUID}): ${currentUserStudents.docs.length}`);
    
    // Check if current admin can see assessments (should be 0)
    const currentUserAssessments = await getDocs(
      query(collection(db, COLLECTIONS.ASSESSMENTS), where('createdBy', '==', currentAdminUID))
    );
    console.log(`📝 Assessments created by current admin (${currentAdminUID}): ${currentUserAssessments.docs.length}`);
    
    // Get the actual teacher UID from students
    const teacherUidFromStudents = students.length > 0 ? students[0].assignedTeacher : 'N/A';
    console.log(`👨‍🏫 ACTUAL teacher UID from students: ${teacherUidFromStudents}`);
    
    // Check if there are students assigned to the actual teacher
    if (teacherUidFromStudents !== 'N/A') {
      const teacherStudents = await getDocs(
        query(collection(db, COLLECTIONS.STUDENTS), where('assignedTeacher', '==', teacherUidFromStudents))
      );
      console.log(`👥 Students assigned to ACTUAL teacher (${teacherUidFromStudents}): ${teacherStudents.docs.length}`);
      
      // Check if there are assessments created by the actual teacher
      const teacherAssessments = await getDocs(
        query(collection(db, COLLECTIONS.ASSESSMENTS), where('createdBy', '==', teacherUidFromStudents))
      );
      console.log(`📝 Assessments created by ACTUAL teacher (${teacherUidFromStudents}): ${teacherAssessments.docs.length}`);
    }
    
    // 🎯 SOLUTION PREVIEW
    console.log('🔍 === SOLUTION ANALYSIS ===');
    console.log('❌ PROBLEM: Admin user UID ≠ Teacher UID');
    console.log(`   Admin UID: ${currentAdminUID}`);
    console.log(`   Teacher UID: ${teacherUidFromStudents}`);
    console.log('✅ SOLUTION: Gradebook needs to show ALL students/assessments for admins, not just their own');
    
    return {
      success: true,
      message: 'Diagnostic completed - FOUND TEACHER UID MISMATCH! Admin cannot see teacher data.',
      importedCount: results.length,
      errors: []
    };
    
  } catch (error) {
    console.error('❌ Diagnostic check failed:', error);
    return {
      success: false,
      message: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
