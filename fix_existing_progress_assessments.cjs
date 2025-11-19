// Script to fix existing Progress Assessments by adding missing required fields
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixProgressAssessments() {
  try {
    console.log('🔍 Looking for Progress Assessments that need fixing...');
    
    // Get all Progress Assessments (category = 'PA')
    const assessmentsSnapshot = await db.collection('assessments')
      .where('category', '==', 'PA')
      .get();
    
    if (assessmentsSnapshot.empty) {
      console.log('✅ No Progress Assessments found. Nothing to fix.');
      process.exit(0);
      return;
    }
    
    console.log(`📋 Found ${assessmentsSnapshot.size} Progress Assessments`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    const batch = db.batch();
    
    assessmentsSnapshot.forEach(doc => {
      const assessment = doc.data();
      const needsFix = !assessment.allowFileUpload || 
                       assessment.allowRetakes === undefined;
      
      if (needsFix) {
        console.log(`🔧 Fixing: ${assessment.title} (${doc.id})`);
        
        // Add missing fields
        const updates = {
          allowFileUpload: true,
          requireFileUpload: true,
          fileUploadInstructions: assessment.fileUploadInstructions || 'Upload photos of your work for all questions that require it. Make sure your work is clear and legible.',
          allowRetakes: false,
          maxRetakes: 0,
          retakeMode: 'separate',
          retakeInstructions: '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        batch.update(doc.ref, updates);
        fixedCount++;
      } else {
        console.log(`✅ Already correct: ${assessment.title}`);
        alreadyCorrectCount++;
      }
    });
    
    if (fixedCount > 0) {
      console.log(`\n💾 Committing changes for ${fixedCount} assessments...`);
      await batch.commit();
      console.log('✅ All Progress Assessments have been fixed!');
    } else {
      console.log('\n✅ All Progress Assessments are already correct!');
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total PAs: ${assessmentsSnapshot.size}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Already correct: ${alreadyCorrectCount}`);
    
    console.log('\n🎉 Done! Students should now be able to submit Progress Assessments without errors.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing Progress Assessments:', error);
    process.exit(1);
  }
}

// Run the script
fixProgressAssessments();

