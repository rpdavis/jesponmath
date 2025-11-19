/**
 * Migration Script: Add Course Info to Assessment Results
 * 
 * This script updates all assessmentResults documents to include cached
 * course information (courseId, courseName, section, period) from the student's profile.
 * 
 * This enables better grouping and filtering by class/period.
 */

import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface MigrationResult {
  totalResults: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

/**
 * Add course info fields to all assessmentResults
 * by looking up the student document
 */
export async function addCourseInfoToAssessmentResults(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalResults: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    console.log('🔍 Starting migration: Adding course info to results...');
    
    // Get all assessment results
    const resultsSnapshot = await getDocs(collection(db, 'assessmentResults'));
    result.totalResults = resultsSnapshot.size;
    
    console.log(`📊 Found ${result.totalResults} assessment results`);
    
    // Create a cache of student course info to avoid duplicate lookups
    const studentCourseCache = new Map<string, {
      courseId?: string;
      courseName?: string;
      section?: string;
      period?: string;
    }>();
    
    // Process in batches of 500 (Firestore batch limit)
    let batch = writeBatch(db);
    let batchCount = 0;
    const batches: any[] = [];
    
    for (const resultDoc of resultsSnapshot.docs) {
      const resultData = resultDoc.data();
      const studentUid = resultData.studentUid;
      
      // Skip if already has course info
      if (resultData.studentCourseId) {
        result.skipped++;
        console.log(`⏭️ Skipping ${resultDoc.id} - already has course info`);
        continue;
      }
      
      // Skip if no studentUid
      if (!studentUid) {
        result.skipped++;
        console.log(`⏭️ Skipping ${resultDoc.id} - no studentUid`);
        continue;
      }
      
      try {
        // Check cache first
        let studentInfo = studentCourseCache.get(studentUid);
        
        // If not in cache, fetch from Firestore
        if (!studentInfo) {
          const studentDoc = await getDoc(doc(db, 'students', studentUid));
          
          if (!studentDoc.exists()) {
            result.errors++;
            const errorMsg = `Student not found: ${studentUid} for result ${resultDoc.id}`;
            result.errorDetails.push(errorMsg);
            console.warn(`⚠️ ${errorMsg}`);
            continue;
          }
          
          const studentData = studentDoc.data();
          studentInfo = {
            courseId: studentData.courseId,
            courseName: studentData.courseName || studentData.className,
            section: studentData.section,
            period: studentData.period
          };
          
          // Cache it
          studentCourseCache.set(studentUid, studentInfo);
          console.log(`📝 Cached course info for student ${studentUid}:`, studentInfo);
        }
        
        // Build update object with only defined fields
        const updateData: any = {};
        
        if (studentInfo.courseId) {
          updateData.studentCourseId = studentInfo.courseId;
        }
        if (studentInfo.courseName) {
          updateData.studentCourseName = studentInfo.courseName;
        }
        if (studentInfo.section) {
          updateData.studentSection = studentInfo.section;
        }
        if (studentInfo.period) {
          updateData.studentPeriod = studentInfo.period;
        }
        
        // Skip if no course info to add
        if (Object.keys(updateData).length === 0) {
          result.skipped++;
          console.log(`⏭️ Skipping ${resultDoc.id} - student has no course info`);
          continue;
        }
        
        updateData.courseInfoSyncedAt = new Date();
        
        // Add to batch
        batch.update(resultDoc.ref, updateData);
        
        batchCount++;
        result.updated++;
        
        console.log(`✅ Queued update for ${resultDoc.id} (${result.updated}/${result.totalResults})`);
        
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

