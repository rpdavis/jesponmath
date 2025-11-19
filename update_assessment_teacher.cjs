const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateAssessmentTeacher() {
  try {
    // Get assessment ID from command line argument
    const assessmentId = process.argv[2];
    const newTeacherUid = process.argv[3] || 'Ey2Po5PBmpg17XmRbXsUtnq521E2';
    
    if (!assessmentId) {
      console.log('❌ Usage: node update_assessment_teacher.cjs <assessmentId> [newTeacherUid]');
      console.log('   Example: node update_assessment_teacher.cjs abc123 Ey2Po5PBmpg17XmRbXsUtnq521E2');
      process.exit(1);
    }
    
    console.log('🔍 Updating assessment...');
    console.log(`Assessment ID: ${assessmentId}`);
    console.log(`New createdBy: ${newTeacherUid}`);
    
    // Get the assessment first to show current info
    const assessmentRef = db.collection('assessments').doc(assessmentId);
    const assessmentDoc = await assessmentRef.get();
    
    if (!assessmentDoc.exists) {
      console.log('❌ Assessment not found!');
      process.exit(1);
    }
    
    const currentData = assessmentDoc.data();
    console.log(`📝 Current Title: ${currentData.title}`);
    console.log(`👤 Current createdBy: ${currentData.createdBy}`);
    
    // Update the assessment
    await assessmentRef.update({
      createdBy: newTeacherUid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Assessment updated successfully!');
    console.log(`👤 New createdBy: ${newTeacherUid}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the update
updateAssessmentTeacher();

