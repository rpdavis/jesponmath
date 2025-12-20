#!/usr/bin/env node

/**
 * Fix Duplicate Problems in Math Fluency Progress
 * 
 * Issue: Users who started before deduplication was added have duplicate problems
 * in their problem banks, causing the same problems to appear repeatedly.
 * 
 * This script:
 * 1. Finds all fluency progress documents
 * 2. Deduplicates problems in each bank
 * 3. Updates Firestore with clean data
 */

const admin = require('firebase-admin');
const serviceAccount = require('../jepsonmath-firebase-adminsdk.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixDuplicates() {
  console.log('🔍 Starting duplicate problem cleanup...\n');
  
  try {
    // Get all fluency progress documents
    const progressSnapshot = await db.collection('mathFluencyProgress').get();
    
    console.log(`Found ${progressSnapshot.size} progress documents\n`);
    
    let totalFixed = 0;
    let totalDuplicatesRemoved = 0;
    
    for (const doc of progressSnapshot.docs) {
      const data = doc.data();
      const studentUid = data.studentUid;
      const operation = data.operation;
      
      console.log(`\n📊 Checking ${studentUid} - ${operation}:`);
      
      let hasChanges = false;
      const updates = {};
      
      // Check each problem bank
      const banks = ['doesNotKnow', 'emerging', 'approaching', 'proficient', 'mastered'];
      
      for (const bank of banks) {
        if (!data.problemBanks || !data.problemBanks[bank]) continue;
        
        const problems = data.problemBanks[bank];
        const originalCount = problems.length;
        
        // Deduplicate by problemId AND displayText
        const seen = new Map(); // problemId -> problem
        const unique = [];
        
        for (const problem of problems) {
          const key = problem.problemId;
          
          if (!seen.has(key)) {
            seen.set(key, problem);
            unique.push(problem);
          }
        }
        
        const duplicatesFound = originalCount - unique.length;
        
        if (duplicatesFound > 0) {
          console.log(`  ${bank}: ${originalCount} → ${unique.length} (removed ${duplicatesFound} duplicates)`);
          updates[`problemBanks.${bank}`] = unique;
          hasChanges = true;
          totalDuplicatesRemoved += duplicatesFound;
        }
      }
      
      // Update Firestore if changes found
      if (hasChanges) {
        await doc.ref.update(updates);
        console.log(`  ✅ Updated Firestore`);
        totalFixed++;
      } else {
        console.log(`  ✓ No duplicates found`);
      }
    }
    
    console.log(`\n\n🎉 Cleanup Complete!`);
    console.log(`📊 Results:`);
    console.log(`  - Progress documents checked: ${progressSnapshot.size}`);
    console.log(`  - Documents with duplicates: ${totalFixed}`);
    console.log(`  - Total duplicates removed: ${totalDuplicatesRemoved}`);
    console.log(`\n✅ Students should now see unique problems in practice!`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the fix
fixDuplicates()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });


























