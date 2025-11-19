/**
 * Migration Script: Add assessmentCategory and student context to assessmentResults
 * 
 * This script updates all assessmentResults documents to include:
 * - assessmentCategory (from assessment.category)
 * - studentCourseId (from student.courseId)
 * - studentCourseName (from student.courseName)
 * - studentPeriod (from student.section or student.period)
 * - studentGrade (from student.grade)
 * 
 * This creates a historical snapshot of student context at time of assessment.
 * Run this once to migrate existing data.
 */

import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Student } from '@/types/users';

export interface MigrationResult {
  totalResults: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

/**
 * Add assessmentCategory field to all assessmentResults
 * that don't have it by looking up the assessment document
 */
export async function addCategoryToAssessmentResults(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalResults: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    console.log('🔍 Starting migration: Adding assessmentCategory and student context to results...');
    
    // Get all assessment results
    const resultsSnapshot = await getDocs(collection(db, 'assessmentResults'));
    result.totalResults = resultsSnapshot.size;
    
    console.log(`📊 Found ${result.totalResults} assessment results`);
    
    // Create caches to avoid duplicate lookups
    const assessmentCategoryCache = new Map<string, string>();
    const studentDataCache = new Map<string, Student>();
    
    // Preload all students for faster lookups
    console.log('👥 Preloading student data...');
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    studentsSnapshot.docs.forEach(doc => {
      studentDataCache.set(doc.id, { uid: doc.id, ...doc.data() } as Student);
    });
    console.log(`✅ Loaded ${studentDataCache.size} students`);
    
    // Process in batches of 500 (Firestore batch limit)
    let batch = writeBatch(db);
    let batchCount = 0;
    const batches: any[] = [];
    
    for (const resultDoc of resultsSnapshot.docs) {
      const resultData = resultDoc.data();
      const assessmentId = resultData.assessmentId;
      
      // Skip if already has assessmentCategory
      if (resultData.assessmentCategory) {
        result.skipped++;
        console.log(`⏭️ Skipping ${resultDoc.id} - already has category: ${resultData.assessmentCategory}`);
        continue;
      }
      
      // Skip if no assessmentId
      if (!assessmentId) {
        result.skipped++;
        console.log(`⏭️ Skipping ${resultDoc.id} - no assessmentId`);
        continue;
      }
      
      try {
        // Check cache first
        let category = assessmentCategoryCache.get(assessmentId);
        
        // If not in cache, fetch from Firestore
        if (!category) {
          const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
          
          if (!assessmentDoc.exists()) {
            result.errors++;
            const errorMsg = `Assessment not found: ${assessmentId} for result ${resultDoc.id}`;
            result.errorDetails.push(errorMsg);
            console.warn(`⚠️ ${errorMsg}`);
            continue;
          }
          
          const assessmentData = assessmentDoc.data();
          const assessmentCategory = assessmentData.category || 'Other';
          category = assessmentCategory;
          
          // Cache it
          assessmentCategoryCache.set(assessmentId, assessmentCategory);
          console.log(`📝 Cached category for assessment ${assessmentId}: ${assessmentCategory}`);
        }
        
        // Add to batch (ensure category is defined)
        if (!category) {
          result.errors++;
          const errorMsg = `No category found for assessment ${assessmentId}`;
          result.errorDetails.push(errorMsg);
          console.warn(`⚠️ ${errorMsg}`);
          continue;
        }
        
        // Get student data for context fields
        const studentUid = resultData.studentUid;
        const student = studentDataCache.get(studentUid);
        
        // Build update object
        const updateData: any = {
          assessmentCategory: category,
          categorySyncedAt: new Date()
        };
        
        // Add student context fields if student exists
        if (student) {
          if (student.courseId) {
            updateData.studentCourseId = student.courseId;
          }
          if (student.courseName) {
            updateData.studentCourseName = student.courseName;
          }
          // Use section first (Google Classroom), then period
          const period = student.section || student.period;
          if (period) {
            updateData.studentPeriod = period.trim();
          }
          if (student.grade) {
            updateData.studentGrade = student.grade;
          }
        } else {
          console.warn(`⚠️ Student not found for UID: ${studentUid}`);
        }
        
        batch.update(resultDoc.ref, updateData);
        
        batchCount++;
        result.updated++;
        
        console.log(`✅ Queued update for ${resultDoc.id}: category = ${category} (${result.updated}/${result.totalResults})`);
        
        // If batch is full, save it and start a new one
        if (batchCount >= 500) {
          batches.push(batch);
          batch = writeBatch(db);
          batchCount = 0;
          console.log(`📦 Batch full, created batch ${batches.length}`);
        }
        
      } catch (error: any) {
        result.errors++;
        const errorMsg = `Error processing result ${resultDoc.id}: ${error.message}`;
        result.errorDetails.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    // Add final batch if it has items
    if (batchCount > 0) {
      batches.push(batch);
      console.log(`📦 Created final batch ${batches.length} with ${batchCount} items`);
    }
    
    // Commit all batches
    console.log(`💾 Committing ${batches.length} batch(es)...`);
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ Committed batch ${i + 1}/${batches.length}`);
    }
    
    console.log('✅ Migration complete!');
    console.log('📊 Summary:', {
      total: result.totalResults,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors
    });
    
    if (result.errorDetails.length > 0) {
      console.log('❌ Errors:', result.errorDetails);
    }
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Add assessmentCategory only to results for a specific category
 * Useful for testing or incremental migration
 */
export async function addCategoryToResultsByAssessmentCategory(
  targetCategory: 'SA' | 'ESA' | 'PA' | 'HW' | 'Assign' | 'Other'
): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalResults: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    console.log(`🔍 Starting targeted migration for category: ${targetCategory}`);
    
    // Get all assessments of target category
    const assessmentsQuery = query(
      collection(db, 'assessments'),
      where('category', '==', targetCategory)
    );
    const assessmentsSnapshot = await getDocs(assessmentsQuery);
    const assessmentIds = assessmentsSnapshot.docs.map(d => d.id);
    
    console.log(`📊 Found ${assessmentIds.length} assessments with category ${targetCategory}`);
    
    if (assessmentIds.length === 0) {
      console.log('⏭️ No assessments found for this category');
      return result;
    }
    
    // Get all results for these assessments
    // Note: Firestore 'in' queries are limited to 10 items, so we batch
    const chunkSize = 10;
    let allResults: any[] = [];
    
    for (let i = 0; i < assessmentIds.length; i += chunkSize) {
      const chunk = assessmentIds.slice(i, i + chunkSize);
      const resultsQuery = query(
        collection(db, 'assessmentResults'),
        where('assessmentId', 'in', chunk)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      allResults.push(...resultsSnapshot.docs);
      console.log(`📋 Loaded results batch ${Math.floor(i / chunkSize) + 1} (${resultsSnapshot.size} results)`);
    }
    
    result.totalResults = allResults.length;
    console.log(`📊 Found ${result.totalResults} total results for ${targetCategory} assessments`);
    
    // Process results
    let batch = writeBatch(db);
    let batchCount = 0;
    const batches: any[] = [];
    
    for (const resultDoc of allResults) {
      const resultData = resultDoc.data();
      
      // Skip if already has assessmentCategory
      if (resultData.assessmentCategory) {
        result.skipped++;
        continue;
      }
      
      // Add to batch
      batch.update(resultDoc.ref, {
        assessmentCategory: targetCategory,
        categorySyncedAt: new Date()
      });
      
      batchCount++;
      result.updated++;
      
      // If batch is full, save it and start a new one
      if (batchCount >= 500) {
        batches.push(batch);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    
    // Add final batch
    if (batchCount > 0) {
      batches.push(batch);
    }
    
    // Commit all batches
    console.log(`💾 Committing ${batches.length} batch(es)...`);
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ Committed batch ${i + 1}/${batches.length}`);
    }
    
    console.log('✅ Migration complete for category:', targetCategory);
    console.log('📊 Summary:', {
      total: result.totalResults,
      updated: result.updated,
      skipped: result.skipped
    });
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

