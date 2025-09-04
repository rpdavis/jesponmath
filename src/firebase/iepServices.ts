import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';
import type { 
  Student, 
  Goal, 
  Assessment, 
  AssessmentResult 
} from '@/types/iep';

// Student Services
export const createStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const getStudentBySeisId = async (seisId: string) => {
  try {
    const q = query(collection(db, 'students'), where('seisId', '==', seisId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Student;
  } catch (error) {
    console.error('Error getting student:', error);
    throw error;
  }
};

export const getStudentsByCaseManager = async (caseManager: string) => {
  try {
    const q = query(
      collection(db, 'students'), 
      where('caseManager', '==', caseManager),
      orderBy('lastName', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];
  } catch (error) {
    console.error('Error getting students by case manager:', error);
    throw error;
  }
};

export const getStudentsByGrade = async (grade: string) => {
  try {
    const q = query(
      collection(db, 'students'), 
      where('grade', '==', grade),
      orderBy('lastName', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];
  } catch (error) {
    console.error('Error getting students by grade:', error);
    throw error;
  }
};

// Goal Services
export const createGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'goals'), {
      ...goalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

export const getGoalsByStudent = async (studentSeisId: string) => {
  try {
    const q = query(
      collection(db, 'goals'), 
      where('studentSeisId', '==', studentSeisId),
      where('isActive', '==', true),
      orderBy('category', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
  } catch (error) {
    console.error('Error getting goals by student:', error);
    throw error;
  }
};

export const getGoalsByCategory = async (category: Goal['category']) => {
  try {
    const q = query(
      collection(db, 'goals'), 
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('gradeLevel', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
  } catch (error) {
    console.error('Error getting goals by category:', error);
    throw error;
  }
};

export const updateGoalProgress = async (goalId: string, progressData: Partial<Goal>) => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    await updateDoc(goalRef, {
      ...progressData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
};

export const getAllGoals = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'goals'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
  } catch (error) {
    console.error('Error getting all goals:', error);
    throw error;
  }
};

// Assessment Services
export const createAssessment = async (assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'assessments'), {
      ...assessmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
};

export const getAssessment = async (assessmentId: string) => {
  try {
    const docRef = doc(db, 'assessments', assessmentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Assessment;
    }
    return null;
  } catch (error) {
    console.error('Error getting assessment:', error);
    throw error;
  }
};

export const getAssessmentByGoalId = async (goalId: string) => {
  try {
    const q = query(
      collection(db, 'assessments'), 
      where('goalId', '==', goalId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Assessment;
    }
    return null;
  } catch (error) {
    console.error('Error getting assessment by goal ID:', error);
    throw error;
  }
};

export const updateAssessment = async (assessmentId: string, assessmentData: Partial<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const docRef = doc(db, 'assessments', assessmentId);
    await updateDoc(docRef, {
      ...assessmentData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    throw error;
  }
};

export const duplicateAssessment = async (originalAssessment: Assessment, newTitle?: string): Promise<string> => {
  try {
    console.log('📋 Duplicating assessment:', originalAssessment.title);
    
    // Simple duplication - just copy the assessment and change the title and IDs
    const duplicatedData = {
      ...originalAssessment,
      title: newTitle || `${originalAssessment.title} (Copy)`,
      studentSeisId: '', // Make it unassigned
      studentUid: '', // Make it unassigned
      questions: originalAssessment.questions.map(question => ({
        ...question,
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Remove the original ID to let Firestore generate a new one
    delete (duplicatedData as any).id;
    
    const docRef = await addDoc(collection(db, 'assessments'), duplicatedData);
    console.log('✅ Assessment duplicated successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error duplicating assessment:', error);
    throw error;
  }
};

export const getAssessmentsByGoal = async (goalId: string) => {
  try {
    const q = query(
      collection(db, 'assessments'), 
      where('goalId', '==', goalId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Assessment[];
  } catch (error) {
    console.error('Error getting assessments by goal:', error);
    throw error;
  }
};

export const getAssessmentsByCategory = async (category: Assessment['category']) => {
  try {
    const q = query(
      collection(db, 'assessments'), 
      where('category', '==', category),
      orderBy('gradeLevel', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Assessment[];
  } catch (error) {
    console.error('Error getting assessments by category:', error);
    throw error;
  }
};

export const getAssessmentsByStudent = async (studentId: string) => {
  try {
    console.log('🔍 Looking for assessments for student:', studentId);
    
    // New approach: Get student document and read their assignedAssessments array
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (!studentDoc.exists()) {
      console.log('Student not found:', studentId);
      return [];
    }
    
    const studentData = studentDoc.data();
    const assignedAssessmentIds = studentData.assignedAssessments || [];
    
    console.log(`📋 Student has ${assignedAssessmentIds.length} assigned assessments:`, assignedAssessmentIds);
    
    if (assignedAssessmentIds.length === 0) {
      console.log('No assessments assigned to student:', studentId);
      return [];
    }
    
    // Fetch the actual assessment documents
    const assessments: Assessment[] = [];
    for (const assessmentId of assignedAssessmentIds) {
      try {
        const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
        if (assessmentDoc.exists()) {
          assessments.push({
            id: assessmentDoc.id,
            ...assessmentDoc.data()
          } as Assessment);
        } else {
          console.warn('Assessment not found:', assessmentId);
        }
      } catch (error) {
        console.error('Error fetching assessment:', assessmentId, error);
      }
    }
    
    // Sort by creation date
    assessments.sort((a, b) => 
      new Date(b.createdAt?.seconds || b.createdAt || 0).getTime() - 
      new Date(a.createdAt?.seconds || a.createdAt || 0).getTime()
    );
    
    console.log(`📝 Found ${assessments.length} assessments for student ${studentId}`);
    return assessments;
  } catch (error) {
    console.error('Error getting assessments by student:', error);
    throw error;
  }
};

// Assessment Result Services
export const saveAssessmentResult = async (resultData: Omit<AssessmentResult, 'id' | 'completedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'assessmentResults'), {
      ...resultData,
      completedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving assessment result:', error);
    throw error;
  }
};

export const getAssessmentResultsByStudent = async (studentSeisId: string) => {
  try {
    const q = query(
      collection(db, 'assessmentResults'), 
      where('studentSeisId', '==', studentSeisId),
      orderBy('completedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssessmentResult[];
  } catch (error) {
    console.error('Error getting assessment results by student:', error);
    throw error;
  }
};

export const getAssessmentResultsByGoal = async (goalId: string) => {
  try {
    const q = query(
      collection(db, 'assessmentResults'), 
      where('goalId', '==', goalId),
      orderBy('completedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AssessmentResult[];
  } catch (error) {
    console.error('Error getting assessment results by goal:', error);
    throw error;
  }
};

// Assessment management functions
export async function getAllAssessments(): Promise<Assessment[]> {
  try {
    const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Assessment[];
  } catch (error) {
    console.error('Error getting all assessments:', error);
    throw error;
  }
}

export async function getAssessmentsByTeacher(teacherUid: string): Promise<Assessment[]> {
  try {
    const q = query(
      collection(db, 'assessments'), 
      where('createdBy', '==', teacherUid)
    );
    const snapshot = await getDocs(q);
    const assessments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Assessment[];
    
    // Sort in JavaScript instead of Firestore to avoid index requirement
    assessments.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt || 0;
      const bTime = b.createdAt?.seconds || b.createdAt || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    
    return assessments;
  } catch (error) {
    console.error('Error getting assessments by teacher:', error);
    throw error;
  }
}

export async function assignAssessmentToStudent(assessmentId: string, studentUid: string): Promise<void> {
  try {
    // Add assessment ID to student's assignedAssessments array
    const studentDoc = doc(db, 'students', studentUid);
    await updateDoc(studentDoc, {
      assignedAssessments: arrayUnion(assessmentId),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Assessment assigned to student:', assessmentId, '→', studentUid);
  } catch (error) {
    console.error('Error assigning assessment to student:', error);
    throw error;
  }
}

export async function unassignAssessmentFromStudent(assessmentId: string, studentUid: string): Promise<void> {
  try {
    // Remove assessment ID from student's assignedAssessments array
    const studentDoc = doc(db, 'students', studentUid);
    await updateDoc(studentDoc, {
      assignedAssessments: arrayRemove(assessmentId),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Assessment unassigned from student:', assessmentId, '→', studentUid);
  } catch (error) {
    console.error('Error unassigning assessment from student:', error);
    throw error;
  }
}

export async function getCurrentlyAssignedStudents(assessmentId: string): Promise<any[]> {
  try {
    // Query students who have this assessment in their assignedAssessments array
    const q = query(
      collection(db, 'students'),
      where('assignedAssessments', 'array-contains', assessmentId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting currently assigned students:', error);
    throw error;
  }
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assessments', assessmentId));
    console.log('✅ Assessment deleted:', assessmentId);
  } catch (error) {
    console.error('Error deleting assessment:', error);
    throw error;
  }
}

export async function getAssessmentResults(assessmentId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'assessmentResults'),      where('assessmentId', '==', assessmentId)
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Sort in JavaScript instead of Firestore to avoid index requirement
    results.sort((a: any, b: any) => {
      const aTime = a.completedAt?.seconds || a.completedAt || 0;
      const bTime = b.completedAt?.seconds || b.completedAt || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    
    return results;
  } catch (error) {
    console.error('Error getting assessment results:', error);
    throw error;
  }
}
