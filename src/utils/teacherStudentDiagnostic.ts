// Teacher Student Diagnostic Tool
// Investigates why teacher view only shows 9 students instead of 40

import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

interface TeacherStudentDiagnosticResult {
  success: boolean;
  message: string;
  importedCount: number;
  data: any;
  errors: string[];
}

export async function runTeacherStudentDiagnostic(): Promise<TeacherStudentDiagnosticResult> {
  const errors: string[] = [];
  let data: any = {};
  
  try {
    console.log('🔍 Running teacher-student relationship diagnostic...');
    
    const teacherUid = 'Ey2Po5PBmpg17XmRbXsUtnq521E2'; // Your teacher UID
    
    // 1. Get students assigned to teacher (check both users and students collections)
    console.log('\n👨‍🏫 STEP 1: Teacher\'s Student List');
    
    // Check users collection
    const usersStudentsQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'student'),
      where('assignedTeacher', '==', teacherUid)
    );
    const usersStudents = await getDocs(usersStudentsQuery);
    
    // Check students collection  
    const studentsCollectionQuery = query(
      collection(db, 'students'),
      where('assignedTeacher', '==', teacherUid)
    );
    const studentsCollection = await getDocs(studentsCollectionQuery);
    
    console.log(`📊 Users collection: ${usersStudents.size} students assigned to teacher`);
    console.log(`📊 Students collection: ${studentsCollection.size} students assigned to teacher`);
    
    // Combine students from both collections
    const allTeacherStudents = [...usersStudents.docs, ...studentsCollection.docs];
    
    const teacherStudentsList = allTeacherStudents.map(doc => ({
      uid: doc.data().uid || doc.id,
      displayName: doc.data().displayName,
      email: doc.data().email,
      className: doc.data().className,
      assignedTeacher: doc.data().assignedTeacher
    }));
    
    console.log(`👥 Teacher's assigned students: ${teacherStudentsList.length}`);
    teacherStudentsList.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.displayName} (${student.email}) - ${student.className}`);
    });
    
    // 2. Get students who actually have assignments (reality)
    console.log('\n📋 STEP 2: Students with Actual Assignments');
    const allAssignmentsQuery = query(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS));
    const allAssignments = await getDocs(allAssignmentsQuery);
    
    const studentsWithAssignments = new Set();
    allAssignments.docs.forEach(doc => {
      studentsWithAssignments.add(doc.data().studentUid);
    });
    
    console.log(`📊 Students with assignments: ${studentsWithAssignments.size}`);
    
    // Get details for students with assignments
    const studentsWithAssignmentsList = [];
    for (const studentUid of Array.from(studentsWithAssignments).slice(0, 10)) {
      try {
        const studentQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('uid', '==', studentUid)
        );
        const studentSnapshot = await getDocs(studentQuery);
        if (!studentSnapshot.empty) {
          const studentData = studentSnapshot.docs[0].data();
          studentsWithAssignmentsList.push({
            uid: studentUid,
            displayName: studentData.displayName,
            email: studentData.email,
            className: studentData.className,
            assignedTeacher: studentData.assignedTeacher
          });
        }
      } catch (error) {
        console.warn(`Could not find student details for UID: ${studentUid}`);
      }
    }
    
    console.log('📋 Sample students with assignments (first 10):');
    studentsWithAssignmentsList.forEach((student, index) => {
      const isInTeacherList = teacherStudentsList.some(ts => ts.uid === student.uid);
      console.log(`  ${index + 1}. ${student.displayName} (${student.email}) - Teacher: ${student.assignedTeacher} - In Teacher List: ${isInTeacherList ? '✅' : '❌'}`);
    });
    
    // 3. Find the mismatch
    console.log('\n🔍 STEP 3: Mismatch Analysis');
    
    const teacherStudentUids = new Set(teacherStudentsList.map(s => s.uid));
    const assignedStudentUids = new Set(Array.from(studentsWithAssignments));
    
    // Students in teacher list but no assignments
    const teacherStudentsNoAssignments = Array.from(teacherStudentUids).filter(uid => !assignedStudentUids.has(uid));
    
    // Students with assignments but not in teacher list
    const assignedStudentsNotInTeacherList = Array.from(assignedStudentUids).filter(uid => !teacherStudentUids.has(uid));
    
    console.log(`👥 Teacher has ${teacherStudentsList.length} students assigned`);
    console.log(`📋 ${studentsWithAssignments.size} students have assignments`);
    console.log(`🔄 ${teacherStudentsNoAssignments.length} teacher students have no assignments`);
    console.log(`⚠️ ${assignedStudentsNotInTeacherList.length} students with assignments are NOT in teacher's list`);
    
    if (assignedStudentsNotInTeacherList.length > 0) {
      console.log('\n⚠️ Students with assignments but NOT assigned to teacher:');
      for (const studentUid of assignedStudentsNotInTeacherList.slice(0, 5)) {
        const student = studentsWithAssignmentsList.find(s => s.uid === studentUid);
        if (student) {
          console.log(`  - ${student.displayName} (${student.email}) - Assigned to: ${student.assignedTeacher || 'None'}`);
        }
      }
      
      errors.push(`${assignedStudentsNotInTeacherList.length} students with assignments are not in teacher's student list`);
    }
    
    // 4. Check specific ESA assignments
    console.log('\n📝 STEP 4: ESA Assignment Analysis');
    const esaAssessments = ['ESA C1', 'ESA C2', 'ESA C3', 'ESA C4', 'ESA C5', 'ESA C6'];
    const esaAnalysis: any = {};
    
    for (const esaTitle of esaAssessments) {
      const assessmentQuery = query(
        collection(db, COLLECTIONS.ASSESSMENTS),
        where('title', '==', esaTitle)
      );
      const assessmentSnapshot = await getDocs(assessmentQuery);
      
      if (!assessmentSnapshot.empty) {
        const assessmentId = assessmentSnapshot.docs[0].id;
        
        // Get assignments for this ESA
        const esaAssignmentsQuery = query(
          collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS),
          where('assessmentId', '==', assessmentId)
        );
        const esaAssignments = await getDocs(esaAssignmentsQuery);
        
        const assignedStudentUids = esaAssignments.docs.map(doc => doc.data().studentUid);
        const uniqueStudentUids = [...new Set(assignedStudentUids)];
        
        // How many of these students are in teacher's list?
        const studentsInTeacherList = uniqueStudentUids.filter(uid => teacherStudentUids.has(uid));
        
        esaAnalysis[esaTitle] = {
          assessmentId,
          totalAssignments: esaAssignments.size,
          uniqueStudents: uniqueStudentUids.length,
          studentsInTeacherList: studentsInTeacherList.length,
          studentsNotInTeacherList: uniqueStudentUids.length - studentsInTeacherList.length
        };
        
        console.log(`📝 ${esaTitle}: ${esaAssignments.size} assignments, ${uniqueStudentUids.length} unique students, ${studentsInTeacherList.length} in teacher list`);
      }
    }
    
    data = {
      teacherUid,
      teacherStudents: {
        count: teacherStudentsList.length,
        list: teacherStudentsList
      },
      studentsWithAssignments: {
        count: studentsWithAssignments.size,
        list: studentsWithAssignmentsList
      },
      mismatch: {
        teacherStudentsNoAssignments: teacherStudentsNoAssignments.length,
        assignedStudentsNotInTeacherList: assignedStudentsNotInTeacherList.length,
        intersection: teacherStudentUids.size - assignedStudentsNotInTeacherList.length
      },
      esaAnalysis,
      summary: {
        teacherStudentCount: teacherStudentsList.length,
        studentsWithAssignmentsCount: studentsWithAssignments.size,
        mismatchCount: assignedStudentsNotInTeacherList.length,
        hasIssues: errors.length > 0
      }
    };
    
    const message = errors.length > 0 
      ? `Found ${errors.length} teacher-student relationship issues`
      : 'Teacher-student relationships are correct';
    
    return {
      success: errors.length === 0,
      message,
      importedCount: assignedStudentsNotInTeacherList.length,
      data,
      errors
    };
    
  } catch (error) {
    console.error('❌ Teacher-student diagnostic error:', error);
    errors.push(`Diagnostic error: ${error}`);
    
    return {
      success: false,
      message: 'Teacher-student diagnostic failed',
      importedCount: 0,
      data,
      errors
    };
  }
}
