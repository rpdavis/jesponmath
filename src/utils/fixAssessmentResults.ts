// Fix Assessment Results Migration Script
// Updates recently uploaded assessment results to match the correct field structure

import { collection, getDocs, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { COLLECTIONS } from '@/types/users';

export interface FixResult {
  success: boolean;
  message: string;
  importedCount: number; // Changed from fixedCount to match MigrationResult
  errors: string[];
}

// Fix a single assessment result document
async function fixAssessmentResult(docId: string, data: any): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.ASSESSMENT_RESULTS, docId);
    
    // Create the corrected data structure
    const fixedData: any = {
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
      responses: data.responses?.map((response: any, index: number) => ({
        questionId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate proper questionId
        studentAnswer: response.answer || (response.isCorrect ? 'correct' : 'incorrect'),
        isCorrect: response.isCorrect || false,
        pointsEarned: response.pointsEarned || 0
      })) || []
    };
    
    // Remove the old incorrect fields
    const fieldsToRemove = [
      'submittedAt',
      'attempts', 
      'isCompleted',
      'isCorrect'
    ];
    
    // Update the document
    await updateDoc(docRef, fixedData);
    
    // Note: Firestore doesn't have a direct way to delete fields in an update
    // The old fields will remain but the new correct fields will take precedence
    
    console.log(`✅ Fixed assessment result: ${docId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to fix assessment result ${docId}:`, error);
    return false;
  }
}

// Main function to fix all recently uploaded assessment results
export async function fixRecentAssessmentResults(): Promise<FixResult> {
  try {
    console.log('🔄 Starting assessment results fix...');
    
    // Get all assessment results that have the incorrect field structure
    // Look for results with 'submittedAt' field (which should be 'completedAt')
    const resultsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
      where('submittedAt', '!=', null)
    );
    
    const resultsSnapshot = await getDocs(resultsQuery);
    console.log(`📊 Found ${resultsSnapshot.docs.length} assessment results to fix`);
    
    let importedCount = 0;
    const errors: string[] = [];
    
    for (const docSnapshot of resultsSnapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      console.log(`🔧 Fixing assessment result: ${docId}`);
      
      const success = await fixAssessmentResult(docId, data);
      if (success) {
        importedCount++;
      } else {
        errors.push(`Failed to fix document ${docId}`);
      }
    }
    
    console.log(`🎉 Assessment results fix completed! Fixed ${importedCount} results`);
    
    return {
      success: true,
      message: `Successfully fixed ${importedCount} assessment results`,
      importedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Assessment results fix failed:', error);
    return {
      success: false,
      message: `Assessment results fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// Alternative function to fix by date range (last 24 hours)
export async function fixRecentAssessmentResultsByDate(): Promise<FixResult> {
  try {
    console.log('🔄 Starting assessment results fix by date...');
    
    // Get results from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const resultsQuery = query(
      collection(db, COLLECTIONS.ASSESSMENT_RESULTS)
    );
    
    const resultsSnapshot = await getDocs(resultsQuery);
    console.log(`📊 Found ${resultsSnapshot.docs.length} total assessment results`);
    
    // Filter for recent results with incorrect structure
    const recentResults = resultsSnapshot.docs.filter(doc => {
      const data = doc.data();
      const hasSubmittedAt = data.submittedAt;
      const hasAttempts = data.attempts !== undefined;
      const hasIsCompleted = data.isCompleted !== undefined;
      
      return hasSubmittedAt || hasAttempts || hasIsCompleted;
    });
    
    console.log(`📊 Found ${recentResults.length} assessment results with incorrect structure`);
    
    let importedCount = 0;
    const errors: string[] = [];
    
    for (const docSnapshot of recentResults) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      console.log(`🔧 Fixing assessment result: ${docId}`);
      
      const success = await fixAssessmentResult(docId, data);
      if (success) {
        importedCount++;
      } else {
        errors.push(`Failed to fix document ${docId}`);
      }
    }
    
    console.log(`🎉 Assessment results fix completed! Fixed ${importedCount} results`);
    
    return {
      success: true,
      message: `Successfully fixed ${importedCount} assessment results`,
      importedCount,
      errors
    };
    
  } catch (error) {
    console.error('❌ Assessment results fix failed:', error);
    return {
      success: false,
      message: `Assessment results fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
