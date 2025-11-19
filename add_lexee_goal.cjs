// Script to add Lexee's goal to the database
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addLexeeGoal() {
  try {
    console.log('🔍 Looking for student named Lexee...');
    
    // Find Lexee in the students collection
    const studentsSnapshot = await db.collection('students')
      .where('firstName', '==', 'Lexee')
      .get();
    
    if (studentsSnapshot.empty) {
      console.log('❌ No student named Lexee found. Checking for variations...');
      
      // Try alternative spellings
      const alternativeNames = ['Lexi', 'Lexie', 'Lexy'];
      for (const name of alternativeNames) {
        const altSnapshot = await db.collection('students')
          .where('firstName', '==', name)
          .get();
        
        if (!altSnapshot.empty) {
          console.log(`✅ Found student with name: ${name}`);
          await createGoal(altSnapshot.docs[0]);
          return;
        }
      }
      
      // Show all students for reference
      const allStudents = await db.collection('students').get();
      console.log('\n📋 Available students:');
      allStudents.forEach(doc => {
        const student = doc.data();
        console.log(`  - ${student.firstName} ${student.lastName} (UID: ${doc.id})`);
      });
      
      console.log('\n❌ Could not find student named Lexee (or similar). Please check the name.');
      return;
    }
    
    await createGoal(studentsSnapshot.docs[0]);
    
  } catch (error) {
    console.error('❌ Error adding goal:', error);
    process.exit(1);
  }
}

async function createGoal(studentDoc) {
  const studentData = studentDoc.data();
  console.log(`✅ Found student: ${studentData.firstName} ${studentData.lastName} (${studentDoc.id})`);
  
  // Check if this goal already exists
  const existingGoalsSnapshot = await db.collection('goals')
    .where('assignedStudents', 'array-contains', studentDoc.id)
    .get();
  
  let goalExists = false;
  existingGoalsSnapshot.forEach(doc => {
    const goal = doc.data();
    if (goal.goalText.toLowerCase().includes('word problem') && 
        goal.goalText.toLowerCase().includes('all operations') &&
        goal.goalText.toLowerCase().includes('rational numbers')) {
      console.log(`\n⚠️  Goal already exists: ${goal.goalTitle} (${doc.id})`);
      goalExists = true;
    }
  });
  
  if (goalExists) {
    console.log('\n✅ Goal already exists. No need to create a duplicate.');
    process.exit(0);
    return;
  }
  
  // Create the goal
  const goalData = {
    goalTitle: 'Word Problems with All Operations and Rational Numbers',
    assignedStudents: [studentDoc.id],
    areaOfNeed: 'Math - Word Problems and Operations',
    baseline: 'Lexee is working on solving word problems involving all four operations with whole numbers and fractions.',
    goalText: 'Lexee will be able to use all operations to solve math word problems including rational numbers (integers, fractions, decimals) with 80% accuracy in 3 out of 4 trials as measured by teacher charted data, student work samples, and progress monitoring assessments.',
    standard: '7.NS.A.3',
    gradeLevel: 7,
    startDate: new Date().toISOString().split('T')[0],
    personResponsible: studentData.teacherUid || '',
    purposeOfGoal: 'To develop proficiency in solving multi-step word problems using all four operations with rational numbers',
    assignedAssessments: [],
    isActive: true,
    isMet: false,
    isArchived: false,
    createdBy: studentData.teacherUid || 'system',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  console.log('\n📝 Creating goal with the following data:');
  console.log('Title:', goalData.goalTitle);
  console.log('Standard:', goalData.standard);
  console.log('Grade Level:', goalData.gradeLevel);
  console.log('Area of Need:', goalData.areaOfNeed);
  console.log('Target: 80% accuracy in 3 out of 4 trials');
  
  // Add the goal to Firestore
  const goalRef = await db.collection('goals').add(goalData);
  
  console.log('\n✅ Goal created successfully!');
  console.log('Goal ID:', goalRef.id);
  console.log('\n📊 Goal Details:');
  console.log('Student:', studentData.firstName, studentData.lastName);
  console.log('Goal: Word Problems with All Operations and Rational Numbers (7.NS.A.3)');
  console.log('Target: 80% accuracy in 3 out of 4 trials');
  console.log('\n💡 You can now:');
  console.log('1. Go to Goal Management to view this goal');
  console.log('2. Generate Progress Assessments for this goal');
  console.log('3. Assign assessments to Lexee');
  
  process.exit(0);
}

// Run the script
addLexeeGoal();

