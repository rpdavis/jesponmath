// Cleanup services for duplicate user management
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/config';

// Call the Cloud Function to cleanup duplicate users
export const cleanupDuplicateUsers = async () => {
  try {
    console.log('🧹 Calling Cloud Function to cleanup duplicate users...');
    
    const cleanupFunction = httpsCallable(functions, 'cleanupDuplicateUsers');
    const result = await cleanupFunction();
    
    console.log('✅ Cleanup completed:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error calling cleanup function:', error);
    throw error;
  }
};

// Restore missing Google metadata to merged students
export const restoreGoogleMetadata = async () => {
  try {
    const { collection, query, where, getDocs, doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('@/firebase/config');
    
    console.log('🔍 Looking for students missing Google metadata...');
    
    // Find students that have email but missing googleId (likely merged students)
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const studentsNeedingRestore: any[] = [];
    
    studentsSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data.email && !data.googleId && data.email.includes('gmail.com')) {
        studentsNeedingRestore.push({ id: docSnap.id, data });
      }
    });
    
    console.log(`🔍 Found ${studentsNeedingRestore.length} students needing Google metadata restore`);
    
    // For each student, try to find their Google data in the classroomInfo or other sources
    const restored = [];
    for (const student of studentsNeedingRestore) {
      // Check if there's classroomInfo data we can restore from
      if (student.data.classroomInfo) {
        const updates = {
          googleId: student.data.classroomInfo.googleId,
          courseId: student.data.classroomInfo.courseId,
          courseName: student.data.classroomInfo.courseName,
          section: student.data.classroomInfo.section || student.data.classroomInfo.period
        };
        
        await updateDoc(doc(db, 'students', student.id), updates);
        restored.push({ email: student.data.email, updates });
        console.log(`✅ Restored Google metadata for: ${student.data.email}`);
      }
    }
    
    return {
      studentsFound: studentsNeedingRestore.length,
      studentsRestored: restored.length,
      restored: restored
    };
  } catch (error) {
    console.error('❌ Error restoring Google metadata:', error);
    throw error;
  }
};

// Check for duplicate students by email
export const findDuplicateStudents = async () => {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('@/firebase/config');
    
    console.log('🔍 Checking for duplicate students...');
    
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const studentsByEmail = new Map<string, any[]>();
    
    studentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        if (!studentsByEmail.has(data.email)) {
          studentsByEmail.set(data.email, []);
        }
        studentsByEmail.get(data.email)!.push({ id: doc.id, data });
      }
    });
    
    const duplicates = [];
    for (const [email, records] of studentsByEmail.entries()) {
      if (records.length > 1) {
        duplicates.push({
          email,
          count: records.length,
          records: records.map(r => ({
            id: r.id,
            name: `${r.data.firstName} ${r.data.lastName}`,
            hasGoogleId: !!r.data.googleId,
            uid: r.data.uid
          }))
        });
      }
    }
    
    console.log(`🔍 Found ${duplicates.length} duplicate email addresses`);
    return duplicates;
  } catch (error) {
    console.error('❌ Error finding duplicates:', error);
    throw error;
  }
};
