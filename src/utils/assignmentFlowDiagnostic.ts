// Assignment Flow Diagnostic Tool
// Traces the complete assignment system from creation to student/teacher views

import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit as firestoreLimit,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

interface FlowDiagnosticResult {
  success: boolean;
  message: string;
  importedCount: number;
  data: any;
  errors: string[];
}

export async function runAssignmentFlowDiagnostic(): Promise<FlowDiagnosticResult> {
  const errors: string[] = [];
  let data: any = {};
  
  try {
    console.log('🔍 Running complete assignment flow diagnostic...');
    
    // 1. DATABASE COLLECTIONS ANALYSIS
    console.log('\n📚 STEP 1: Database Collections Analysis');
    
    // Check all collections exist and have data
    const collections = [
      { name: 'users', collection: COLLECTIONS.USERS },
      { name: 'assessments', collection: COLLECTIONS.ASSESSMENTS },
      { name: 'assessmentAssignments', collection: COLLECTIONS.ASSESSMENT_ASSIGNMENTS },
      { name: 'assessmentResults', collection: COLLECTIONS.ASSESSMENT_RESULTS }
    ];
    
    const collectionStats: any = {};
    for (const col of collections) {
      try {
        const snapshot = await getDocs(collection(db, col.collection));
        collectionStats[col.name] = {
          exists: true,
          documentCount: snapshot.size,
          sampleDoc: snapshot.docs[0]?.data() || null
        };
        console.log(`✅ ${col.name}: ${snapshot.size} documents`);
      } catch (error) {
        collectionStats[col.name] = {
          exists: false,
          error: error
        };
        console.error(`❌ ${col.name}: Error - ${error}`);
        errors.push(`Collection ${col.name} error: ${error}`);
      }
    }
    
    // 2. TEACHER PERSPECTIVE ANALYSIS
    console.log('\n👨‍🏫 STEP 2: Teacher Perspective Analysis');
    
    // Get teacher data
    const teacherUid = 'Ey2Po5PBmpg17XmRbXsUtnq521E2'; // Your teacher UID
    
    // Get teacher's created assessments
    const teacherAssessmentsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENTS),
      where('createdBy', '==', teacherUid),
      firestoreLimit(10)
    );
    const teacherAssessments = await getDocs(teacherAssessmentsQuery);
    
    const assessmentsList = teacherAssessments.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      category: doc.data().category,
      questionsCount: doc.data().questions?.length || 0,
      totalPoints: doc.data().totalPoints,
      createdAt: doc.data().createdAt
    })).sort((a, b) => {
      // Sort by creation date (most recent first) in JavaScript
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    
    console.log(`📝 Teacher has created ${assessmentsList.length} assessments:`);
    assessmentsList.forEach(assessment => {
      console.log(`  - ${assessment.title} (${assessment.id}): ${assessment.questionsCount} questions, ${assessment.totalPoints} points`);
    });
    
    // For each assessment, check assignments
    const teacherAssessmentAnalysis: any = {};
    for (const assessment of assessmentsList) {
      const assignmentsQuery = query(
        collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
        where('assessmentId', '==', assessment.id)
      );
      const assignments = await getDocs(assignmentsQuery);
      
      const assignmentsList = assignments.docs.map(doc => ({
        studentUid: doc.data().studentUid,
        assignedBy: doc.data().assignedBy,
        status: doc.data().status,
        assignedAt: doc.data().assignedAt
      }));
      
      teacherAssessmentAnalysis[assessment.id] = {
        ...assessment,
        assignmentCount: assignments.size,
        uniqueStudents: new Set(assignmentsList.map(a => a.studentUid)).size,
        assignments: assignmentsList.slice(0, 3) // Sample
      };
      
      console.log(`  📋 ${assessment.title}: ${assignments.size} assignments to ${new Set(assignmentsList.map(a => a.studentUid)).size} unique students`);
    }
    
    // 3. STUDENT PERSPECTIVE ANALYSIS
    console.log('\n🎓 STEP 3: Student Perspective Analysis');
    
    // Get a sample of students and check their assignments
    // First, get students who actually have assignments (more reliable)
    const assignedStudentUids = new Set();
    Object.values(teacherAssessmentAnalysis).forEach((assessment: any) => {
      assessment.assignments.forEach((assignment: any) => {
        assignedStudentUids.add(assignment.studentUid);
      });
    });
    
    console.log(`🔍 Found ${assignedStudentUids.size} unique students with assignments`);
    
    // Get details for first 5 students with assignments
    const sampleStudentUids = Array.from(assignedStudentUids).slice(0, 5);
    const students = { docs: [] as any[] };
    
    for (const studentUid of sampleStudentUids) {
      try {
        const studentQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('uid', '==', studentUid)
        );
        const studentSnapshot = await getDocs(studentQuery);
        if (!studentSnapshot.empty) {
          students.docs.push(studentSnapshot.docs[0]);
        }
      } catch (error) {
        console.warn(`Could not find student with UID ${studentUid}`);
      }
    }
    
    const studentAnalysis: any = {};
    for (const studentDoc of students.docs) {
      const studentData = studentDoc.data();
      const studentUid = studentData.uid || studentDoc.id;
      
      // Get student's assignments
      const studentAssignmentsQuery = query(
        collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
        where('studentUid', '==', studentUid)
      );
      const studentAssignments = await getDocs(studentAssignmentsQuery);
      
      // Get student's results
      const studentResultsQuery = query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('studentUid', '==', studentUid)
      );
      const studentResults = await getDocs(studentResultsQuery);
      
      const assignmentsList = studentAssignments.docs.map(doc => ({
        assessmentId: doc.data().assessmentId,
        status: doc.data().status,
        assignedAt: doc.data().assignedAt
      }));
      
      const resultsList = studentResults.docs.map(doc => ({
        assessmentId: doc.data().assessmentId,
        score: doc.data().score,
        percentage: doc.data().percentage,
        completedAt: doc.data().completedAt
      }));
      
      studentAnalysis[studentUid] = {
        displayName: studentData.displayName,
        email: studentData.email,
        assignmentCount: studentAssignments.size,
        resultCount: studentResults.size,
        assignments: assignmentsList,
        results: resultsList
      };
      
      console.log(`👤 ${studentData.displayName}: ${studentAssignments.size} assignments, ${studentResults.size} results`);
    }
    
    // 4. ASSIGNMENT FLOW VALIDATION
    console.log('\n🔄 STEP 4: Assignment Flow Validation');
    
    // Check if assignment creation is working
    const flowValidation: any = {
      assessmentCreation: {
        working: assessmentsList.length > 0,
        assessmentCount: assessmentsList.length
      },
      assignmentCreation: {
        working: Object.values(teacherAssessmentAnalysis).some((a: any) => a.assignmentCount > 0),
        totalAssignments: Object.values(teacherAssessmentAnalysis).reduce((sum: number, a: any) => sum + a.assignmentCount, 0)
      },
      studentRetrieval: {
        working: Object.values(studentAnalysis).some((s: any) => s.assignmentCount > 0),
        studentsWithAssignments: Object.values(studentAnalysis).filter((s: any) => s.assignmentCount > 0).length
      },
      resultSubmission: {
        working: Object.values(studentAnalysis).some((s: any) => s.resultCount > 0),
        studentsWithResults: Object.values(studentAnalysis).filter((s: any) => s.resultCount > 0).length
      }
    };
    
    console.log('🔄 Flow Validation:');
    console.log(`  - Assessment Creation: ${flowValidation.assessmentCreation.working ? '✅' : '❌'} (${flowValidation.assessmentCreation.assessmentCount} assessments)`);
    console.log(`  - Assignment Creation: ${flowValidation.assignmentCreation.working ? '✅' : '❌'} (${flowValidation.assignmentCreation.totalAssignments} assignments)`);
    console.log(`  - Student Retrieval: ${flowValidation.studentRetrieval.working ? '✅' : '❌'} (${flowValidation.studentRetrieval.studentsWithAssignments} students)`);
    console.log(`  - Result Submission: ${flowValidation.resultSubmission.working ? '✅' : '❌'} (${flowValidation.resultSubmission.studentsWithResults} students)`);
    
    // 5. IDENTIFY ISSUES
    console.log('\n⚠️ STEP 5: Issue Identification');
    
    const issues: string[] = [];
    
    if (!flowValidation.assessmentCreation.working) {
      issues.push('Assessment creation is not working');
      errors.push('No assessments found for teacher');
    }
    
    if (!flowValidation.assignmentCreation.working) {
      issues.push('Assignment creation is not working');
      errors.push('No assignments found for teacher assessments');
    }
    
    if (!flowValidation.studentRetrieval.working) {
      issues.push('Student assignment retrieval is not working');
      errors.push('Students cannot see their assignments');
    }
    
    if (!flowValidation.resultSubmission.working) {
      issues.push('Result submission is not working');
      errors.push('No assessment results found');
    }
    
    // Check for duplicate assignments
    const duplicateIssues = Object.values(teacherAssessmentAnalysis).filter((a: any) => a.assignmentCount > a.uniqueStudents);
    if (duplicateIssues.length > 0) {
      issues.push(`${duplicateIssues.length} assessments have duplicate assignments`);
      errors.push('Duplicate assignments detected');
    }
    
    console.log('🔍 Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    data = {
      collectionStats,
      teacherAnalysis: {
        teacherUid,
        assessmentCount: assessmentsList.length,
        assessments: teacherAssessmentAnalysis
      },
      studentAnalysis,
      flowValidation,
      issues,
      summary: {
        collectionsWorking: Object.values(collectionStats).every((c: any) => c.exists),
        assessmentCreationWorking: flowValidation.assessmentCreation.working,
        assignmentCreationWorking: flowValidation.assignmentCreation.working,
        studentRetrievalWorking: flowValidation.studentRetrieval.working,
        resultSubmissionWorking: flowValidation.resultSubmission.working,
        issueCount: issues.length
      }
    };
    
    const message = issues.length > 0 
      ? `Assignment flow analysis complete: ${issues.length} issues found`
      : 'Assignment flow is working correctly';
    
    return {
      success: issues.length === 0,
      message,
      importedCount: issues.length,
      data,
      errors
    };
    
  } catch (error) {
    console.error('❌ Flow diagnostic error:', error);
    errors.push(`Flow diagnostic error: ${error}`);
    
    return {
      success: false,
      message: 'Flow diagnostic failed',
      importedCount: 0,
      data,
      errors
    };
  }
}

// Test assignment creation specifically
export async function testAssignmentCreation(testAssessmentId: string): Promise<FlowDiagnosticResult> {
  try {
    console.log(`🧪 Testing assignment creation for assessment: ${testAssessmentId}`);
    
    // Get assessment details
    const assessmentDoc = await getDoc(doc(db, COLLECTIONS.ASSESSMENTS, testAssessmentId));
    if (!assessmentDoc.exists()) {
      throw new Error('Test assessment not found');
    }
    
    const assessmentData = assessmentDoc.data();
    console.log(`📝 Test assessment: ${assessmentData.title} by ${assessmentData.createdBy}`);
    
    // Check assignments for this assessment
    const assignmentsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
      where('assessmentId', '==', testAssessmentId)
    );
    const assignments = await getDocs(assignmentsQuery);
    
    console.log(`📋 Found ${assignments.size} assignments for test assessment`);
    
    const assignmentsList = assignments.docs.map(doc => ({
      id: doc.id,
      studentUid: doc.data().studentUid,
      assignedBy: doc.data().assignedBy,
      assignedAt: doc.data().assignedAt,
      status: doc.data().status
    }));
    
    // Check if students can see this assessment
    const studentUids = [...new Set(assignmentsList.map(a => a.studentUid))];
    console.log(`👥 Assignment covers ${studentUids.length} unique students`);
    
    return {
      success: true,
      message: `Test assessment has ${assignments.size} assignments to ${studentUids.length} students`,
      importedCount: assignments.size,
      data: {
        assessmentId: testAssessmentId,
        assessmentTitle: assessmentData.title,
        assignmentCount: assignments.size,
        uniqueStudents: studentUids.length,
        assignments: assignmentsList.slice(0, 5)
      },
      errors: []
    };
    
  } catch (error) {
    console.error('❌ Assignment creation test error:', error);
    return {
      success: false,
      message: 'Assignment creation test failed',
      importedCount: 0,
      data: {},
      errors: [`Test error: ${error}`]
    };
  }
}
