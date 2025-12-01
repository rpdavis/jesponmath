// Cleanup Script: Remove Full Fluency Diagnostic Assignments
// Run this script to remove old 'math-fluency-initial' diagnostic assignments from Firestore
// Usage: node cleanup_full_diagnostics.cjs

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function cleanupFullDiagnostics() {
  console.log('🧹 Starting cleanup of full fluency diagnostic assignments...\n');
  
  try {
    // Query for all 'math-fluency-initial' diagnostic assignments
    const diagnosticAssignmentsRef = db.collection('diagnosticAssignments');
    const snapshot = await diagnosticAssignmentsRef
      .where('diagnosticType', '==', 'math-fluency-initial')
      .get();
    
    if (snapshot.empty) {
      console.log('✅ No full fluency diagnostic assignments found. Database is clean!');
      return;
    }
    
    console.log(`Found ${snapshot.size} full fluency diagnostic assignment(s) to remove:\n`);
    
    // List assignments before deletion
    const assignmentsToDelete = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  📋 ${doc.id}`);
      console.log(`     - Student: ${data.studentName}`);
      console.log(`     - Operation: ${data.operation}`);
      console.log(`     - Assigned: ${data.assignedAt?.toDate().toLocaleDateString()}`);
      console.log(`     - Status: ${data.status}`);
      console.log('');
      assignmentsToDelete.push(doc.id);
    });
    
    // Ask for confirmation
    console.log(`\n⚠️  About to DELETE ${assignmentsToDelete.length} assignment(s).`);
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete assignments in batches
    const batchSize = 500;
    let deletedCount = 0;
    
    for (let i = 0; i < assignmentsToDelete.length; i += batchSize) {
      const batch = db.batch();
      const batchIds = assignmentsToDelete.slice(i, i + batchSize);
      
      batchIds.forEach(id => {
        batch.delete(diagnosticAssignmentsRef.doc(id));
      });
      
      await batch.commit();
      deletedCount += batchIds.length;
      console.log(`   Deleted ${deletedCount}/${assignmentsToDelete.length} assignments...`);
    }
    
    console.log(`\n✅ Cleanup complete! Removed ${deletedCount} full fluency diagnostic assignment(s).`);
    console.log('\n📝 Note: Students who had these assignments will no longer see them.');
    console.log('   The new placement diagnostic is recommended going forward.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup
cleanupFullDiagnostics()
  .then(() => {
    console.log('\n🎉 Cleanup script finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Cleanup script failed:', error);
    process.exit(1);
  });

