import { 
    collection, 
    getDocs, 
    query, 
    where 
  } from 'firebase/firestore';
  import { db } from '@/firebase/config';
  import { COLLECTIONS } from '@/types/users';
  import { bulkAssignAssessment } from '@/firebase/assignmentServices';
  
  interface FixResult {
    success: boolean;
    message: string;
    importedCount: number;
    errors: string[];
  }
  
  export async function assignESAAssessmentsToAllStudents(): Promise<FixResult> {
    try {
      console.log('📋 Assigning ESA assessments to all students...');
      
      // Step 1: Get all ESA C1-C4 assessments
      const assessmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSESSMENTS));
      const esaAssessments: { id: string; title: string }[] = [];
      
      assessmentsSnapshot.docs.forEach(doc => {
        const assessment = doc.data() as any;
        if (assessment.title && assessment.title.startsWith('ESA C')) {
          esaAssessments.push({
            id: doc.id,
            title: assessment.title
          });
        }
      });
      
      console.log(`📝 Found ${esaAssessments.length} ESA assessments:`, esaAssessments.map(a => a.title));
      
      // Step 2: Get all active students
      const studentsSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.STUDENTS), where('isActive', '==', true))
      );
      
      const studentUids = studentsSnapshot.docs.map(doc => {
        const student = doc.data();
        return student.uid || doc.id;
      });
      
      console.log(`👥 Found ${studentUids.length} active students`);
      
      // Step 3: Assign each ESA assessment to all students
      let assignmentsCreated = 0;
      const errors: string[] = [];
      
      for (const assessment of esaAssessments) {
        try {
          console.log(`📋 Assigning ${assessment.title} to ${studentUids.length} students...`);
          
          const assignmentIds = await bulkAssignAssessment(
            assessment.id,
            studentUids,
            'system-assignment-fix',
            {
              notes: 'Auto-assigned ESA assessment to restore functionality'
            }
          );
          
          assignmentsCreated += assignmentIds.length;
          console.log(`✅ Assigned ${assessment.title} to ${assignmentIds.length} students`);
          
        } catch (error) {
          const errorMsg = `Failed to assign ${assessment.title}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      return {
        success: true,
        message: `Successfully assigned ${esaAssessments.length} ESA assessments to students. Created ${assignmentsCreated} assignment records.`,
        importedCount: assignmentsCreated,
        errors
      };
      
    } catch (error) {
      console.error('❌ Error assigning ESA assessments:', error);
      return {
        success: false,
        message: `Assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        importedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  