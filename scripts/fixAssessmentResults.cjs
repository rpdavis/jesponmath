// Fix Assessment Results Script
// Run this script to fix recently uploaded assessment results

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHYWF8rVgqKOgVn6b1H4_wJQvQZQGQGQE",
  authDomain: "jepsonmath.firebaseapp.com",
  projectId: "jepsonmath",
  storageBucket: "jepsonmath.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const COLLECTIONS = {
  ASSESSMENT_RESULTS: 'assessmentResults'
};

// Fix a single assessment result document
async function fixAssessmentResult(docId, data) {
  try {
    const docRef = doc(db, COLLECTIONS.ASSESSMENT_RESULTS, docId);
    
    // Create the corrected data structure
    const fixedData = {
      // Keep existing fields that are correct
      studentUid: data.studentUid,
      assessmentId: data.assessmentId,
      score: data.score,
      totalPoints: data.totalPoints,
      percentage: data.percentage,
      
      // Fix field names and add missing fields
      completedAt: data.submittedAt || new Date(), // Change submittedAt to completedAt
      attemptNumber: data.attempts || 1, // Change attempts to attemptNumber
      timeSpent: data.timeSpent || 0,
      
      // Add missing fields with defaults
      isRetake: false,
      gradedBy: 'csv-import',
      feedback: '',
      goalId: '',
      accommodationsUsed: [],
      previousAttempts: [],
      uploadedFiles: [],
      migratedAt: new Date(),
      migratedBy: 'field-structure-fix',
      migrationReason: 'Fixed field structure to match original format',
      
      // Fix responses structure
      responses: data.responses?.map((response, index) => ({
        questionId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate proper questionId
        studentAnswer: response.answer || (response.isCorrect ? 'correct' : 'incorrect'),
        isCorrect: response.isCorrect || false,
        pointsEarned: response.pointsEarned || 0
      })) || []
    };
    
    // Update the document
    await updateDoc(docRef, fixedData);
    
    console.log(`✅ Fixed assessment result: ${docId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to fix assessment result ${docId}:`, error);
    return false;
  }
}

// Main function to fix all assessment results with incorrect structure
async function fixAllIncorrectAssessmentResults() {
  try {
    console.log('🔄 Starting assessment results fix...');
    
    // Get all assessment results
    const resultsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSESSMENT_RESULTS));
    console.log(`📊 Found ${resultsSnapshot.docs.length} total assessment results`);
    
    // Filter for results with incorrect structure
    const incorrectResults = resultsSnapshot.docs.filter(doc => {
      const data = doc.data();
      const hasSubmittedAt = data.submittedAt;
      const hasAttempts = data.attempts !== undefined;
      const hasIsCompleted = data.isCompleted !== undefined;
      
      return hasSubmittedAt || hasAttempts || hasIsCompleted;
    });
    
    console.log(`📊 Found ${incorrectResults.length} assessment results with incorrect structure`);
    
    if (incorrectResults.length === 0) {
      console.log('🎉 No assessment results need fixing!');
      return;
    }
    
    let fixedCount = 0;
    const errors = [];
    
    for (const docSnapshot of incorrectResults) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      console.log(`🔧 Fixing assessment result: ${docId}`);
      
      const success = await fixAssessmentResult(docId, data);
      if (success) {
        fixedCount++;
      } else {
        errors.push(`Failed to fix document ${docId}`);
      }
    }
    
    console.log(`🎉 Assessment results fix completed!`);
    console.log(`✅ Fixed: ${fixedCount} results`);
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`);
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
  } catch (error) {
    console.error('❌ Assessment results fix failed:', error);
  }
}

// Run the fix
console.log('🚀 Starting Assessment Results Fix Script...');
fixAllIncorrectAssessmentResults()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
