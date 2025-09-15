// Manual fixes for specific issues
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Manually add Google metadata to a specific student
export const addGoogleMetadataToStudent = async (studentUid: string, googleData: {
  googleId: string;
  courseId: string;
  courseName: string;
  section: string;
}) => {
  try {
    console.log('🔄 Adding Google metadata to student:', studentUid);
    
    const studentRef = doc(db, 'students', studentUid);
    
    await updateDoc(studentRef, {
      googleId: googleData.googleId,
      courseId: googleData.courseId,
      courseName: googleData.courseName,
      section: googleData.section,
      updatedAt: new Date()
    });
    
    console.log('✅ Google metadata added successfully');
    return true;
  } catch (error) {
    console.error('❌ Error adding Google metadata:', error);
    throw error;
  }
};

// Fix the current student with known Google data and teacher assignment
export const fixCurrentStudent = async () => {
  try {
    // Based on your data:
    const studentUid = 'VHCc6NLR6NVTQeWQSrEVb6nRLp22';
    const teacherUid = 'JRaSiIe6h6Y6h168Ex2meHUP7on1'; // Ryan Davis teacher UID
    const googleData = {
      googleId: '107555236801416916873',
      courseId: '10019420452', 
      courseName: 'Mr. Davis',
      section: 'Period 4'
    };
    
    console.log('🩹 Step 1: Adding Google metadata to student...');
    await addGoogleMetadataToStudent(studentUid, googleData);
    
    console.log('🩹 Step 2: Setting assignedTeacher in student record...');
    
    // Set assignedTeacher field in student record (this is what getStudentsByTeacher queries)
    const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
    const { db } = await import('@/firebase/config');
    
    const studentRef = doc(db, 'students', studentUid);
    await updateDoc(studentRef, {
      assignedTeacher: teacherUid,
      updatedAt: new Date()
    });
    
    console.log('🩹 Step 3: Adding student to teacher assignedStudents array...');
    
    // Also add student to teacher's assignedStudents array
    const teacherRef = doc(db, 'teachers', teacherUid);
    await updateDoc(teacherRef, {
      assignedStudents: arrayUnion(studentUid),
      updatedAt: new Date()
    });
    
    console.log('✅ Current student completely fixed');
    return true;
  } catch (error) {
    console.error('❌ Error fixing current student:', error);
    throw error;
  }
};

// Fix admin user role conflict
export const fixAdminUserRoleConflict = async (userUid: string = 'OQXA6hoMeLXGvQmvTff7H1zbieh2') => {
  try {
    console.log('🔄 Fixing admin user role conflict for:', userUid);
    
    // Step 1: Check if user exists in teachers collection and get their data
    const teacherRef = doc(db, 'teachers', userUid);
    const teacherDoc = await getDoc(teacherRef);
    
    if (!teacherDoc.exists()) {
      throw new Error('User not found in teachers collection');
    }
    
    const teacherData = teacherDoc.data();
    console.log('📋 Found teacher data:', teacherData);
    
    // Step 2: Delete from students collection if it exists there
    try {
      const studentRef = doc(db, 'students', userUid);
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        console.log('🗑️ Removing user from students collection...');
        await updateDoc(studentRef, { isActive: false }); // Soft delete first
        console.log('✅ User removed from students collection');
      }
    } catch (error) {
      console.log('ℹ️ User not found in students collection (this is expected)');
    }
    
    // Step 3: Update/Create correct user record in users collection
    const userRef = doc(db, 'users', userUid);
    const correctUserData = {
      uid: userUid,
      email: teacherData.email,
      displayName: teacherData.displayName || 'Admin',
      role: teacherData.role || 'admin', // Use role from teachers collection
      isActive: true,
      createdAt: teacherData.createdAt || new Date(),
      lastLogin: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(userRef, correctUserData);
    console.log('✅ Created/updated correct user record with admin role');
    
    // Step 4: Ensure teachers collection has correct admin role
    await updateDoc(teacherRef, {
      role: 'admin',
      updatedAt: new Date()
    });
    console.log('✅ Confirmed admin role in teachers collection');
    
    console.log('🎉 Admin user role conflict resolved successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error fixing admin user role conflict:', error);
    throw error;
  }
};

// Migrate admin to new admin collection
export const migrateAdminToAdminCollection = async () => {
  try {
    console.log('🔄 Migrating admin to admin collection...');
    
    const adminUid = 'OQXA6hoMeLXGvQmvTff7H1zbieh2';
    
    // Your existing admin data
    const adminData = {
      uid: adminUid,
      email: 'casemanagevue@gmail.com',
      displayName: 'Admin (rd)',
      role: 'admin',
      isActive: true,
      createdAt: new Date('2025-01-01'), // Placeholder date
      updatedAt: new Date(),
      lastLogin: new Date(),
      
      // Admin-specific fields
      firstName: 'Admin',
      lastName: '(rd)',
      permissions: ['MANAGE_SYSTEM', 'MANAGE_USERS', 'VIEW_ALL_DATA'],
      systemAccess: ['all']
    };
    
    // Create admin record
    await setDoc(doc(db, 'admins', adminUid), adminData);
    
    console.log('✅ Admin migrated to admin collection successfully');
    return true;
  } catch (error) {
    console.error('❌ Error migrating admin:', error);
    throw error;
  }
};
