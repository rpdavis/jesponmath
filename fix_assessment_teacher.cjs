const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixAssessmentTeacher() {
  try {
    const oldTeacherUid = 'JRaSiIe6h6Y6h168Ex2meHUP7on1';
    const newTeacherUid = 'Ey2Po5PBmpg17XmRbXsUtnq521E2';
    const assessmentTitle = 'Chapter 3 TEST A';
    
    console.log('🔍 Searching for assessment...');
    console.log(`Title: "${assessmentTitle}"`);
    console.log(`Current createdBy: ${oldTeacherUid}`);
    console.log(`New createdBy: ${newTeacherUid}`);
    
    // Find assessment by title and createdBy
    const assessmentsRef = db.collection('assessments');
    const snapshot = await assessmentsRef
      .where('title', '==', assessmentTitle)
      .where('createdBy', '==', oldTeacherUid)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No assessment found with that title and createdBy');
      console.log('💡 Trying to find by title only...');
      
      const titleSnapshot = await assessmentsRef
        .where('title', '==', assessmentTitle)
        .get();
      
      if (titleSnapshot.empty) {
        console.log('❌ No assessment found with that title');
        return;
      }
      
      console.log(`📝 Found ${titleSnapshot.size} assessment(s) with that title:`);
      titleSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ID: ${doc.id}`);
        console.log(`    Title: ${data.title}`);
        console.log(`    CreatedBy: ${data.createdBy}`);
        console.log(`    Category: ${data.category}`);
        console.log(`    CreatedAt: ${data.createdAt?.toDate()}`);
        console.log('');
      });
      
      // If only one found, update it
      if (titleSnapshot.size === 1) {
        const doc = titleSnapshot.docs[0];
        const data = doc.data();
        
        if (data.createdBy === oldTeacherUid) {
          console.log(`✅ Found assessment: ${doc.id}`);
          console.log(`🔄 Updating createdBy from ${oldTeacherUid} to ${newTeacherUid}...`);
          
          await doc.ref.update({
            createdBy: newTeacherUid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('✅ Assessment updated successfully!');
          console.log(`📊 Assessment ID: ${doc.id}`);
        } else {
          console.log(`⚠️ Assessment found but createdBy is ${data.createdBy}, not ${oldTeacherUid}`);
          console.log('💡 If you want to update this one anyway, modify the script.');
        }
      } else {
        console.log('⚠️ Multiple assessments found. Please specify the assessment ID.');
      }
      
      return;
    }
    
    // Update the assessment
    snapshot.forEach(async (doc) => {
      console.log(`✅ Found assessment: ${doc.id}`);
      console.log(`🔄 Updating createdBy from ${oldTeacherUid} to ${newTeacherUid}...`);
      
      await doc.ref.update({
        createdBy: newTeacherUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Assessment updated successfully!');
      console.log(`📊 Assessment ID: ${doc.id}`);
      console.log(`📝 Title: ${doc.data().title}`);
      console.log(`👤 New createdBy: ${newTeacherUid}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixAssessmentTeacher();

