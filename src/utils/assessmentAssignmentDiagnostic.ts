// Assessment Assignment Diagnostic Tool
// Checks if new assessments are being assigned correctly

import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

interface DiagnosticResult {
  success: boolean;
  message: string;
  importedCount: number;
  data: any;
  errors: string[];
}

export async function runAssessmentAssignmentDiagnostic(): Promise<DiagnosticResult> {
  const errors: string[] = [];
  let data: any = {};
  
  try {
    console.log('🔍 Running Assessment Assignment Diagnostic...');
    
    // 1. Get recent assessments (last 10)
    const recentAssessmentsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENTS),
      orderBy('createdAt', 'desc'),
      firestoreLimit(10)
    );
    const recentAssessments = await getDocs(recentAssessmentsQuery);
    const assessmentsList = recentAssessments.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      createdBy: doc.data().createdBy,
      createdAt: doc.data().createdAt
    }));
    
    console.log(`📝 Found ${assessmentsList.length} recent assessments:`);
    assessmentsList.forEach(assessment => {
      console.log(`  - ${assessment.title} (ID: ${assessment.id}) by ${assessment.createdBy}`);
    });
    
    // 2. Get recent assessment assignments (last 100 for better coverage)
    const recentAssignmentsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      orderBy('assignedAt', 'desc'),
      firestoreLimit(100)
    );
    const recentAssignments = await getDocs(recentAssignmentsQuery);
    const assignmentsList = recentAssignments.docs.map(doc => ({
      id: doc.id,
      assessmentId: doc.data().assessmentId,
      studentUid: doc.data().studentUid,
      assignedBy: doc.data().assignedBy,
      assignedAt: doc.data().assignedAt,
      status: doc.data().status
    }));
    
    console.log(`📋 Found ${assignmentsList.length} recent assignments:`);
    
    // Show a sample of assignments grouped by assessment
    const assignmentsByAssessmentId = assignmentsList.reduce((acc: any, assignment) => {
      if (!acc[assignment.assessmentId]) {
        acc[assignment.assessmentId] = [];
      }
      acc[assignment.assessmentId].push(assignment);
      return acc;
    }, {});
    
    Object.entries(assignmentsByAssessmentId).forEach(([assessmentId, assignments]: [string, any]) => {
      const assessment = assessmentsList.find(a => a.id === assessmentId);
      const assessmentTitle = assessmentsList.find(a => a.id === assessmentId)?.title || assessmentId;
      console.log(`  - ${assessmentTitle}: ${assignments.length} assignments`);
    });
    
    // 3. Check if recent assessments have assignments
    const assignmentCheck: any = {};
    for (const assessment of assessmentsList) {
      const assignmentsForAssessment = assignmentsList.filter(a => a.assessmentId === assessment.id);
      assignmentCheck[assessment.id] = {
        title: assessment.title,
        assignmentCount: assignmentsForAssessment.length,
        assignments: assignmentsForAssessment
      };
      
      if (assignmentsForAssessment.length === 0) {
        console.warn(`⚠️ Assessment "${assessment.title}" (${assessment.id}) has NO assignments!`);
        errors.push(`Assessment "${assessment.title}" has no assignments`);
      } else {
        console.log(`✅ Assessment "${assessment.title}" has ${assignmentsForAssessment.length} assignments`);
      }
    }
    
    // 4. Get student count for context
    const studentsQuery = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(studentsQuery);
    const studentCount = studentsSnapshot.size;
    
    console.log(`👥 Total students in system: ${studentCount}`);
    
    // 5. Check assignment patterns
    const assignmentsByAssessment = assignmentsList.reduce((acc: any, assignment) => {
      if (!acc[assignment.assessmentId]) {
        acc[assignment.assessmentId] = 0;
      }
      acc[assignment.assessmentId]++;
      return acc;
    }, {});
    
    console.log('📊 Assignment distribution:');
    Object.entries(assignmentsByAssessment).forEach(([assessmentId, count]) => {
      const assessment = assessmentsList.find(a => a.id === assessmentId);
      console.log(`  - ${assessment?.title || assessmentId}: ${count} assignments`);
    });
    
    data = {
      recentAssessments: assessmentsList,
      recentAssignments: assignmentsList,
      assignmentCheck,
      totalStudents: studentCount,
      assignmentsByAssessment,
      summary: {
        assessmentsWithoutAssignments: assessmentsList.filter(a => !assignmentCheck[a.id] || assignmentCheck[a.id].assignmentCount === 0).length,
        assessmentsWithAssignments: assessmentsList.filter(a => assignmentCheck[a.id] && assignmentCheck[a.id].assignmentCount > 0).length,
        totalRecentAssessments: assessmentsList.length,
        totalRecentAssignments: assignmentsList.length
      }
    };
    
    const message = errors.length > 0 
      ? `Found ${errors.length} issues with assessment assignments`
      : 'Assessment assignment system appears to be working correctly';
    
    return {
      success: errors.length === 0,
      message,
      importedCount: data.summary?.totalRecentAssignments || 0,
      data,
      errors
    };
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    errors.push(`Diagnostic error: ${error}`);
    
    return {
      success: false,
      message: 'Diagnostic failed',
      importedCount: 0,
      data,
      errors
    };
  }
}

// Helper function to check a specific assessment
export async function checkSpecificAssessment(assessmentId: string): Promise<DiagnosticResult> {
  try {
    console.log(`🔍 Checking specific assessment: ${assessmentId}`);
    
    // Get assessment assignments
    const assignmentsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', assessmentId)
    );
    const assignments = await getDocs(assignmentsQuery);
    
    const assignmentsList = assignments.docs.map(doc => ({
      id: doc.id,
      studentUid: doc.data().studentUid,
      assignedBy: doc.data().assignedBy,
      assignedAt: doc.data().assignedAt,
      status: doc.data().status
    }));
    
    console.log(`📋 Assessment ${assessmentId} has ${assignmentsList.length} assignments:`);
    assignmentsList.forEach(assignment => {
      console.log(`  - Student: ${assignment.studentUid}, Status: ${assignment.status}, Assigned by: ${assignment.assignedBy}`);
    });
    
    return {
      success: true,
      message: `Assessment has ${assignmentsList.length} assignments`,
      importedCount: assignmentsList.length,
      data: { assessmentId, assignments: assignmentsList },
      errors: []
    };
    
  } catch (error) {
    console.error('❌ Error checking assessment:', error);
    return {
      success: false,
      message: 'Failed to check assessment',
      importedCount: 0,
      data: { assessmentId },
      errors: [`Error: ${error}`]
    };
  }
}
