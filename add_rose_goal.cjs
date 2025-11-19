// Script to add Rose's goal to the database
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addRoseGoal() {
  try {
    console.log('🔍 Looking for student named Rose...');
    
    // Find Rose in the students collection
    const studentsSnapshot = await db.collection('students')
      .where('firstName', '==', 'Rose')
      .get();
    
    if (studentsSnapshot.empty) {
      console.log('❌ No student named Rose found. Please check the name or add the student first.');
      
      // Show all students for reference
      const allStudents = await db.collection('students').get();
      console.log('\n📋 Available students:');
      allStudents.forEach(doc => {
        const student = doc.data();
        console.log(`  - ${student.firstName} ${student.lastName} (UID: ${doc.id})`);
      });
      
      return;
    }
    
    const roseDoc = studentsSnapshot.docs[0];
    const roseData = roseDoc.data();
    console.log(`✅ Found Rose: ${roseData.firstName} ${roseData.lastName} (${roseDoc.id})`);
    
    // Create the goal
    const goalData = {
      goalTitle: 'Operations with Rational Numbers',
      assignedStudents: [roseDoc.id],
      areaOfNeed: 'Math - Rational Numbers Operations',
      baseline: 'Rose needs support and modeling when reading word problems. But she is able to show her understanding and steps when skip counting, multiplying and dividing when the word problems are read to her and explained.',
      goalText: 'By April 2026 when given student/teacher created notes, Rose will apply properties of operations as strategies to add, subtract, multiply and divide rational numbers (integers, fractions, decimals) with 80% accuracy in 2 out of 3 trials as measured by teacher charted data, student work samples, curriculum based assessments and/or observation.',
      standard: '7.NS.A.2.c',
      gradeLevel: 7,
      startDate: new Date().toISOString().split('T')[0],
      personResponsible: roseData.teacherUid || '',
      purposeOfGoal: 'To develop proficiency in operations with rational numbers including integers, fractions, and decimals',
      assignedAssessments: [],
      isActive: true,
      isMet: false,
      isArchived: false,
      createdBy: roseData.teacherUid || 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('\n📝 Creating goal with the following data:');
    console.log('Title:', goalData.goalTitle);
    console.log('Standard:', goalData.standard);
    console.log('Grade Level:', goalData.gradeLevel);
    console.log('Area of Need:', goalData.areaOfNeed);
    
    // Add the goal to Firestore
    const goalRef = await db.collection('goals').add(goalData);
    
    console.log('\n✅ Goal created successfully!');
    console.log('Goal ID:', goalRef.id);
    console.log('\n📊 Goal Details:');
    console.log('Student: Rose', roseData.lastName);
    console.log('Goal: Operations with Rational Numbers (7.NS.A.2.c)');
    console.log('Target: 80% accuracy in 2 out of 3 trials by April 2026');
    console.log('\n💡 You can now:');
    console.log('1. Go to Goal Management to view this goal');
    console.log('2. Generate Progress Assessments for this goal');
    console.log('3. Assign assessments to Rose');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding goal:', error);
    process.exit(1);
  }
}

// Run the script
addRoseGoal();

