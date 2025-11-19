// Import goals from CSV to Firebase
// Only imports goals for students that exist in the database

const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// Check if service account key exists
if (!fs.existsSync('./serviceAccountKey.json')) {
  console.error('❌ Error: serviceAccountKey.json not found');
  console.error('   Please add your Firebase service account key to this directory');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importGoals() {
  console.log('🚀 Starting goal import process...\n');
  
  // Step 1: Load all students from database
  console.log('📥 Step 1: Loading students from database...');
  const usersSnapshot = await db.collection('users')
    .where('role', '==', 'student')
    .get();
  
  const studentMap = new Map();
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const firstName = (data.firstName || '').trim().toLowerCase();
    const lastName = (data.lastName || '').trim().toLowerCase();
    const key = `${firstName}|${lastName}`;
    
    studentMap.set(key, {
      uid: doc.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    });
  });
  
  console.log(`   ✅ Found ${studentMap.size} students in database\n`);
  
  // Step 2: Read goals from CSV
  console.log('📥 Step 2: Reading goals from CSV...');
  const goalsData = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('Goals_Import_Ready.csv')
      .pipe(csv())
      .on('data', (row) => {
        goalsData.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`   ✅ Found ${goalsData.length} goals in CSV\n`);
  
  // Step 3: Read consolidated goals summary
  console.log('📥 Step 3: Reading consolidated goals summary...');
  const consolidatedGoals = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('Goals_Consolidated_Summary.csv')
      .pipe(csv())
      .on('data', (row) => {
        consolidatedGoals.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`   ✅ Found ${consolidatedGoals.length} consolidated goals\n`);
  
  // Step 4: Create consolidated goals first
  console.log('═'.repeat(100));
  console.log('📝 Step 4: Creating consolidated goals...');
  console.log('═'.repeat(100));
  
  const consolidatedGoalIds = new Map();
  
  for (const consol of consolidatedGoals) {
    const studentNames = consol.student_names.split(';').map(s => s.trim());
    const studentUids = [];
    const matchedStudents = [];
    const missedStudents = [];
    
    // Find UIDs for all students
    for (const studentName of studentNames) {
      const parts = studentName.toLowerCase().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      const key = `${firstName}|${lastName}`;
      
      if (studentMap.has(key)) {
        const student = studentMap.get(key);
        studentUids.push(student.uid);
        matchedStudents.push(studentName);
      } else {
        missedStudents.push(studentName);
      }
    }
    
    if (studentUids.length === 0) {
      console.log(`\n⚠️  Skipping: ${consol.goal_title}`);
      console.log(`   Reason: No students found in database`);
      console.log(`   Missing: ${missedStudents.join(', ')}`);
      continue;
    }
    
    // Create the consolidated goal
    const goalData = {
      goalTitle: consol.goal_title,
      assignedStudents: studentUids,
      areaOfNeed: consol.area_of_need,
      baseline: consol.representative_baseline,
      goalText: consol.representative_goal_text,
      assignedAssessments: [],
      isActive: true,
      isMet: false,
      isArchived: false,
      createdBy: 'CSV_IMPORT',  // You may want to change this to actual teacher UID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const goalRef = await db.collection('goals').add(goalData);
    consolidatedGoalIds.set(consol.consolidation_group_id, goalRef.id);
    
    console.log(`\n✅ Created: ${consol.goal_title}`);
    console.log(`   Goal ID: ${goalRef.id}`);
    console.log(`   Students assigned: ${studentUids.length}/${studentNames.length}`);
    console.log(`   Matched: ${matchedStudents.join(', ')}`);
    if (missedStudents.length > 0) {
      console.log(`   ⚠️  Skipped: ${missedStudents.join(', ')} (not in database)`);
    }
  }
  
  // Step 5: Create individual goals
  console.log('\n' + '═'.repeat(100));
  console.log('📝 Step 5: Creating individual goals...');
  console.log('═'.repeat(100));
  
  const stats = {
    totalGoals: 0,
    createdGoals: 0,
    skippedNoStudent: 0,
    skippedConsolidated: 0,
    studentsMissing: new Set()
  };
  
  for (const row of goalsData) {
    stats.totalGoals++;
    
    // Skip if part of consolidated group (already created)
    if (row.is_consolidated === 'Yes') {
      stats.skippedConsolidated++;
      continue;
    }
    
    // Find student UID
    const firstName = row.student_first_name.trim().toLowerCase();
    const lastName = row.student_last_name.trim().toLowerCase();
    const key = `${firstName}|${lastName}`;
    
    if (!studentMap.has(key)) {
      stats.skippedNoStudent++;
      stats.studentsMissing.add(`${row.student_first_name} ${row.student_last_name}`);
      continue;
    }
    
    const student = studentMap.get(key);
    
    // Create individual goal
    const goalData = {
      goalTitle: row.goal_title,
      assignedStudents: [student.uid],
      areaOfNeed: row.area_of_need,
      baseline: row.baseline,
      goalText: row.goal_text,
      assignedAssessments: [],
      isActive: true,
      isMet: false,
      isArchived: false,
      createdBy: 'CSV_IMPORT',  // You may want to change this to actual teacher UID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('goals').add(goalData);
    stats.createdGoals++;
    
    // Show progress every 10 goals
    if (stats.createdGoals % 10 === 0) {
      console.log(`   📊 Progress: ${stats.createdGoals} goals created...`);
    }
  }
  
  // Final Report
  console.log('\n' + '═'.repeat(100));
  console.log('📊 IMPORT COMPLETE - FINAL REPORT');
  console.log('═'.repeat(100));
  console.log(`\n✅ Consolidated Goals:`);
  console.log(`   Created: ${consolidatedGoalIds.size} goals`);
  console.log(`   Students assigned: Multiple students per goal`);
  
  console.log(`\n✅ Individual Goals:`);
  console.log(`   Created: ${stats.createdGoals} goals`);
  console.log(`   Skipped (consolidated): ${stats.skippedConsolidated} goals`);
  console.log(`   Skipped (student not found): ${stats.skippedNoStudent} goals`);
  
  console.log(`\n📊 Total Summary:`);
  console.log(`   Goals in CSV file: ${stats.totalGoals}`);
  console.log(`   Goals created in database: ${consolidatedGoalIds.size + stats.createdGoals}`);
  console.log(`   Goals skipped: ${stats.skippedConsolidated + stats.skippedNoStudent}`);
  
  if (stats.studentsMissing.size > 0) {
    console.log(`\n⚠️  Students not found in database (${stats.studentsMissing.size}):`);
    Array.from(stats.studentsMissing).sort().forEach((name, i) => {
      console.log(`   ${(i + 1).toString().padStart(2)}. ${name}`);
    });
    console.log(`\n   ℹ️  Goals for these students were skipped (as requested)`);
  }
  
  console.log('\n' + '═'.repeat(100));
  console.log('✅ Import process completed successfully!');
  console.log('═'.repeat(100));
  
  process.exit(0);
}

importGoals().catch(error => {
  console.error('\n❌ Import failed:', error);
  process.exit(1);
});

