// Script to fix admin account by ensuring it exists in teachers collection
// Run this once to fix the casemangervuew@gmail.com account

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBqGpKlBFJJfnBGvqKGvqKGvqKGvqKGvqK",
  authDomain: "jepsonmath.firebaseapp.com", 
  projectId: "jepsonmath",
  storageBucket: "jepsonmath.appspot.com",
  messagingSenderId: "712458807273",
  appId: "1:712458807273:web:abcd1234efgh5678"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  USERS: 'users',
  TEACHERS: 'teachers',
  STUDENTS: 'students'
};

async function fixAdminAccount() {
  try {
    // Find the admin user by email
    console.log('Looking for admin user...');
    
    // You'll need to replace this with the actual UID of casemangervuew@gmail.com
    // You can find this in Firebase Auth console
    const adminUid = 'REPLACE_WITH_ACTUAL_UID'; // Get this from Firebase Auth console
    
    // Get user data from users collection
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, adminUid));
    if (!userDoc.exists()) {
      console.log('❌ User not found in users collection');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ Found user:', userData.email, 'Role:', userData.role);
    
    // Check if user exists in teachers collection
    const teacherDoc = await getDoc(doc(db, COLLECTIONS.TEACHERS, adminUid));
    if (teacherDoc.exists()) {
      console.log('✅ User already exists in teachers collection');
      return;
    }
    
    // Create teacher record for admin
    const teacherData = {
      uid: adminUid,
      email: userData.email,
      displayName: userData.displayName,
      role: 'admin', // Make sure this is admin
      isActive: true,
      createdAt: userData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: userData.lastLogin,
      firstName: userData.firstName || userData.displayName?.split(' ')[0] || 'Admin',
      lastName: userData.lastName || userData.displayName?.split(' ').slice(1).join(' ') || 'User',
      subjects: ['Math'],
      gradesTaught: [],
      assignedStudents: [],
      createdAssessments: []
    };
    
    // Save to teachers collection
    await setDoc(doc(db, COLLECTIONS.TEACHERS, adminUid), teacherData);
    console.log('✅ Created admin record in teachers collection');
    
    // Remove from students collection if it exists there
    const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, adminUid));
    if (studentDoc.exists()) {
      await deleteDoc(doc(db, COLLECTIONS.STUDENTS, adminUid));
      console.log('✅ Removed admin from students collection');
    }
    
    console.log('🎉 Admin account fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing admin account:', error);
  }
}

// Run the fix
fixAdminAccount();
