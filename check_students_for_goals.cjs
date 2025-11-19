// Check which students from goals CSV exist in Firebase
const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkStudents() {
  console.log('🔍 Checking which students from goals file exist in database...\n');
  
  // Read goals file to get list of students
  const goalsStudents = new Map();
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('Goals_Import_Ready.csv')
      .pipe(csv())
      .on('data', (row) => {
        const firstName = row.student_first_name?.trim().toLowerCase();
        const lastName = row.student_last_name?.trim().toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        
        if (firstName && lastName) {
          if (!goalsStudents.has(fullName)) {
            goalsStudents.set(fullName, {
              firstName: row.student_first_name.trim(),
              lastName: row.student_last_name.trim(),
              goalCount: 0,
              foundInDB: false,
              uid: null
            });
          }
          goalsStudents.get(fullName).goalCount++;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`📊 Found ${goalsStudents.size} unique students in goals file\n`);
  
  // Get all students from Firebase
  const usersSnapshot = await db.collection('users')
    .where('role', '==', 'student')
    .get();
  
  console.log(`📊 Found ${usersSnapshot.size} students in database\n`);
  
  // Create a map of database students
  const dbStudents = new Map();
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const firstName = data.firstName?.trim().toLowerCase() || '';
    const lastName = data.lastName?.trim().toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`;
    
    dbStudents.set(fullName, {
      uid: doc.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    });
  });
  
  // Match students
  const matched = [];
  const notMatched = [];
  
  for (const [fullName, student] of goalsStudents.entries()) {
    if (dbStudents.has(fullName)) {
      const dbStudent = dbStudents.get(fullName);
      student.foundInDB = true;
      student.uid = dbStudent.uid;
      student.email = dbStudent.email;
      matched.push(student);
    } else {
      notMatched.push(student);
    }
  }
  
  // Display results
  console.log('═'.repeat(100));
  console.log('✅ STUDENTS FOUND IN DATABASE (ready for goal assignment)');
  console.log('═'.repeat(100));
  console.log(`Total: ${matched.length} students\n`);
  
  matched.sort((a, b) => a.lastName.localeCompare(b.lastName));
  matched.forEach((student, i) => {
    console.log(`${(i + 1).toString().padStart(3)}. ${student.firstName} ${student.lastName.padEnd(20)} (${student.goalCount} goals) - UID: ${student.uid}`);
  });
  
  console.log('\n' + '═'.repeat(100));
  console.log('❌ STUDENTS NOT FOUND IN DATABASE (need to be added first)');
  console.log('═'.repeat(100));
  console.log(`Total: ${notMatched.length} students\n`);
  
  if (notMatched.length > 0) {
    notMatched.sort((a, b) => a.lastName.localeCompare(b.lastName));
    notMatched.forEach((student, i) => {
      console.log(`${(i + 1).toString().padStart(3)}. ${student.firstName} ${student.lastName.padEnd(20)} (${student.goalCount} goals)`);
    });
  } else {
    console.log('🎉 All students found! Ready to import goals.');
  }
  
  // Save results to file
  const results = {
    matched: matched.map(s => ({
      firstName: s.firstName,
      lastName: s.lastName,
      uid: s.uid,
      email: s.email,
      goalCount: s.goalCount
    })),
    notMatched: notMatched.map(s => ({
      firstName: s.firstName,
      lastName: s.lastName,
      goalCount: s.goalCount
    })),
    summary: {
      totalGoalsStudents: goalsStudents.size,
      matchedCount: matched.length,
      notMatchedCount: notMatched.length,
      matchPercentage: Math.round((matched.length / goalsStudents.size) * 100)
    }
  };
  
  fs.writeFileSync('student_match_results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to: student_match_results.json');
  
  console.log('\n' + '═'.repeat(100));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(100));
  console.log(`Students in goals file:        ${goalsStudents.size}`);
  console.log(`Students matched in database:  ${matched.length} (${results.summary.matchPercentage}%)`);
  console.log(`Students missing from database: ${notMatched.length}`);
  console.log('═'.repeat(100));
  
  if (notMatched.length > 0) {
    console.log('\n⚠️  WARNING: You need to add the missing students to the database before importing their goals.');
    console.log('   Option 1: Add them manually through the app');
    console.log('   Option 2: Create a student import script');
  } else {
    console.log('\n✅ All students exist in database. Ready to proceed with goal import!');
  }
  
  process.exit(0);
}

checkStudents().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

