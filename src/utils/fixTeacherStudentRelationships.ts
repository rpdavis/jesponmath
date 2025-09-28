// Fix Teacher-Student Relationships
// Updates students to be properly assigned to their teacher

import { 
  collection, 
  getDocs, 
  query, 
  where,
  updateDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

interface FixResult {
  success: boolean;
  message: string;
  importedCount: number;
  data: any;
  errors: string[];
}

export async function fixTeacherStudentRelationships(): Promise<FixResult> {
  const errors: string[] = [];
  let updatedCount = 0;
  let data: any = {};
  
  try {
    console.log('🔧 Fixing teacher-student relationships...');
    
    const teacherUid = 'Ey2Po5PBmpg17XmRbXsUtnq521E2'; // Your teacher UID
    
    // 1. Get all students who have assignments but no assigned teacher
    console.log('🔍 Finding students with assignments but no assigned teacher...');
    
    const allAssignmentsQuery = query(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS));
    const allAssignments = await getDocs(allAssignmentsQuery);
    
    const studentsWithAssignments = new Set();
    allAssignments.docs.forEach(doc => {
      studentsWithAssignments.add(doc.data().studentUid);
    });
    
    console.log(`📊 Found ${studentsWithAssignments.size} students with assignments`);
    
    // 2. Get student details and check their assignedTeacher field
    const studentsToUpdate = [];
    
    for (const studentUid of studentsWithAssignments) {
      try {
        const studentQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('uid', '==', studentUid)
        );
        const studentSnapshot = await getDocs(studentQuery);
        
        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          const studentData = studentDoc.data();
          
          // Check if student needs teacher assignment
          if (!studentData.assignedTeacher || studentData.assignedTeacher !== teacherUid) {
            studentsToUpdate.push({
              docId: studentDoc.id,
              uid: studentUid,
              displayName: studentData.displayName,
              email: studentData.email,
              currentTeacher: studentData.assignedTeacher || 'None'
            });
          }
        }
      } catch (error) {
        console.error(`Error checking student ${studentUid}:`, error);
        errors.push(`Failed to check student ${studentUid}: ${error}`);
      }
    }
    
    console.log(`🎯 Found ${studentsToUpdate.length} students that need teacher assignment`);
    
    if (studentsToUpdate.length === 0) {
      return {
        success: true,
        message: 'All students are already properly assigned to teacher',
        importedCount: 0,
        data: { studentsToUpdate: [] },
        errors: []
      };
    }
    
    // 3. Update students in batches
    console.log('🔄 Updating student-teacher relationships...');
    
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (const student of studentsToUpdate) {
      const studentRef = doc(db, COLLECTIONS.USERS, student.docId);
      
      currentBatch.update(studentRef, {
        assignedTeacher: teacherUid,
        updatedAt: new Date()
      });
      
      operationCount++;
      
      // Handle batch size limit
      if (operationCount >= 450) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
      
      console.log(`  - Assigning ${student.displayName} to teacher`);
    }
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    console.log(`🔄 Executing ${batches.length} update batches...`);
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit();
        console.log(`✅ Batch ${i + 1}/${batches.length} completed`);
      } catch (batchError) {
        console.error(`❌ Batch ${i + 1}/${batches.length} failed:`, batchError);
        errors.push(`Batch ${i + 1} failed: ${batchError}`);
      }
    }
    
    updatedCount = studentsToUpdate.length;
    
    data = {
      teacherUid,
      studentsUpdated: updatedCount,
      studentsToUpdate: studentsToUpdate.map(s => ({
        displayName: s.displayName,
        email: s.email,
        previousTeacher: s.currentTeacher
      })),
      summary: {
        totalStudentsWithAssignments: studentsWithAssignments.size,
        studentsNeedingUpdate: studentsToUpdate.length,
        studentsUpdated: updatedCount
      }
    };
    
    const message = errors.length > 0 
      ? `Updated ${updatedCount} students with ${errors.length} errors`
      : `Successfully assigned ${updatedCount} students to teacher`;
    
    console.log(`✅ Teacher-student relationship fix complete: ${updatedCount} students updated`);
    
    return {
      success: errors.length === 0,
      message,
      importedCount: updatedCount,
      data,
      errors
    };
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    errors.push(`Fix error: ${error}`);
    
    return {
      success: false,
      message: 'Teacher-student relationship fix failed',
      importedCount: updatedCount,
      data,
      errors
    };
  }
}

// Preview function to show what would be updated
export async function previewTeacherStudentFix(): Promise<FixResult> {
  const errors: string[] = [];
  let data: any = {};
  
  try {
    console.log('👀 Previewing teacher-student relationship fix...');
    
    const teacherUid = 'Ey2Po5PBmpg17XmRbXsUtnq521E2';
    
    // Get students with assignments
    const allAssignmentsQuery = query(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS));
    const allAssignments = await getDocs(allAssignmentsQuery);
    
    const studentsWithAssignments = new Set();
    allAssignments.docs.forEach(doc => {
      studentsWithAssignments.add(doc.data().studentUid);
    });
    
    // Check which students need updates
    const studentsToUpdate = [];
    
    for (const studentUid of studentsWithAssignments) {
      try {
        const studentQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('uid', '==', studentUid)
        );
        const studentSnapshot = await getDocs(studentQuery);
        
        if (!studentSnapshot.empty) {
          const studentData = studentSnapshot.docs[0].data();
          
          if (!studentData.assignedTeacher || studentData.assignedTeacher !== teacherUid) {
            studentsToUpdate.push({
              uid: studentUid,
              displayName: studentData.displayName,
              email: studentData.email,
              currentTeacher: studentData.assignedTeacher || 'None'
            });
          }
        }
      } catch (error) {
        console.warn(`Could not check student ${studentUid}`);
      }
    }
    
    console.log(`👀 Would update ${studentsToUpdate.length} students`);
    studentsToUpdate.slice(0, 5).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.displayName} (${student.email}) - Current: ${student.currentTeacher}`);
    });
    
    data = {
      studentsToUpdate: studentsToUpdate.length,
      sampleStudents: studentsToUpdate.slice(0, 10)
    };
    
    return {
      success: true,
      message: `Would update ${studentsToUpdate.length} students to be assigned to teacher`,
      importedCount: studentsToUpdate.length,
      data,
      errors
    };
    
  } catch (error) {
    console.error('❌ Preview error:', error);
    errors.push(`Preview error: ${error}`);
    
    return {
      success: false,
      message: 'Preview failed',
      importedCount: 0,
      data,
      errors
    };
  }
}

