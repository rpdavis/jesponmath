// Migration Service - Move from array-based assignments to junction table
// Also removes dual identifier complexity (studentSeisId → studentUid only)

import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteField
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/types/users';

interface MigrationResult {
  success: boolean;
  assignmentsMigrated: number;
  resultsMigrated: number;
  goalsMigrated: number;
  studentsUpdated: number;
  errors: string[];
}

/**
 * Clean up any failed migration attempts
 */
export async function cleanupFailedMigration(): Promise<void> {
  try {
    console.log('🧹 Cleaning up failed migration attempts...');
    
    // Delete all records from assessmentAssignments collection
    const assignmentsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS));
    
    if (assignmentsSnapshot.empty) {
      console.log('📝 No assignment records to clean up');
      return;
    }
    
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    assignmentsSnapshot.docs.forEach(doc => {
      currentBatch.delete(doc.ref);
      operationCount++;
      
      if (operationCount >= 450) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });
    
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Cleaned up ${assignmentsSnapshot.docs.length} failed assignment records`);
  } catch (error) {
    console.error('❌ Error cleaning up failed migration:', error);
    throw error;
  }
}

/**
 * Main migration function - runs all migrations
 */
export async function runFullMigration(): Promise<MigrationResult> {
  console.log('🔄 Starting full database migration...');
  
  const result: MigrationResult = {
    success: false,
    assignmentsMigrated: 0,
    resultsMigrated: 0,
    goalsMigrated: 0,
    studentsUpdated: 0,
    errors: []
  };
  
  try {
    // Step 1: Migrate assignments from arrays to junction table
    console.log('📋 Step 1: Migrating assignments...');
    const assignmentResult = await migrateAssignments();
    result.assignmentsMigrated = assignmentResult.migrated;
    result.errors.push(...assignmentResult.errors);
    
    // Step 2: Remove dual identifiers from assessment results
    console.log('📊 Step 2: Migrating assessment results...');
    const resultsResult = await migrateAssessmentResults();
    result.resultsMigrated = resultsResult.migrated;
    result.errors.push(...resultsResult.errors);
    
    // Step 3: Remove dual identifiers from goals
    console.log('🎯 Step 3: Migrating goals...');
    const goalsResult = await migrateGoals();
    result.goalsMigrated = goalsResult.migrated;
    result.errors.push(...goalsResult.errors);
    
    // Step 4: Clean up student documents (remove arrays)
    console.log('🧹 Step 4: Cleaning up student documents...');
    const cleanupResult = await cleanupStudentDocuments();
    result.studentsUpdated = cleanupResult.updated;
    result.errors.push(...cleanupResult.errors);
    
    result.success = result.errors.length === 0;
    
    console.log('✅ Migration completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Migrate assignments from student arrays to junction table
 */
async function migrateAssignments(): Promise<{ migrated: number; errors: string[] }> {
  const result = { migrated: 0, errors: [] as string[] };
  
  try {
    // Get all students with assigned assessments
    const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const assignedAssessments = studentData.assignedAssessments || [];
      const completedAssessments = studentData.completedAssessments || [];
      
      if (assignedAssessments.length === 0) continue;
      
      for (const assessmentId of assignedAssessments) {
        try {
          // Create new assignment record
          const assignmentRef = doc(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS));
          const isCompleted = completedAssessments.includes(assessmentId);
          
          const assignmentData: any = {
            assessmentId,
            studentUid: studentDoc.id,
            assignedBy: studentData.assignedTeacher || 'system-migration',
            assignedAt: studentData.updatedAt || serverTimestamp(),
            status: isCompleted ? 'completed' : 'assigned',
            priority: 'medium',
            accommodations: studentData.accommodations || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          // Only add completedAt if the assignment is actually completed
          if (isCompleted) {
            assignmentData.completedAt = studentData.updatedAt || serverTimestamp();
          }
          
          currentBatch.set(assignmentRef, assignmentData);
          result.migrated++;
          operationCount++;
          
          // Handle batch size limit
          if (operationCount >= 450) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
          
        } catch (error) {
          result.errors.push(`Failed to migrate assignment ${assessmentId} for student ${studentDoc.id}: ${String(error)}`);
        }
      }
    }
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Migrated ${result.migrated} assignments`);
    
  } catch (error) {
    result.errors.push(`Assignment migration failed: ${String(error)}`);
  }
  
  return result;
}

/**
 * Migrate assessment results to use only studentUid (remove studentSeisId)
 */
async function migrateAssessmentResults(): Promise<{ migrated: number; errors: string[] }> {
  const result = { migrated: 0, errors: [] as string[] };
  
  try {
    // Get all assessment results that need migration
    const resultsSnapshot = await getDocs(collection(db, COLLECTIONS.ASSESSMENT_RESULTS));
    
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (const resultDoc of resultsSnapshot.docs) {
      const resultData = resultDoc.data();
      
      // Check if migration is needed
      if (resultData.studentSeisId && !resultData.studentUid) {
        try {
          // Try to find the student by SEIS ID to get their UID
          const studentQuery = query(
            collection(db, COLLECTIONS.STUDENTS),
            where('seisId', '==', resultData.studentSeisId)
          );
          const studentSnapshot = await getDocs(studentQuery);
          
          if (!studentSnapshot.empty) {
            const studentDoc = studentSnapshot.docs[0];
            const studentUid = studentDoc.id;
            
            // Update result to use studentUid and remove studentSeisId
            const updateData = {
              studentUid: studentUid,
              studentSeisId: deleteField(),
              migratedAt: serverTimestamp(),
              migratedBy: 'system-migration',
              migrationReason: 'Removed dual identifier complexity'
            };
            
            currentBatch.update(resultDoc.ref, updateData);
            result.migrated++;
            operationCount++;
            
            // Handle batch size limit
            if (operationCount >= 450) {
              batches.push(currentBatch);
              currentBatch = writeBatch(db);
              operationCount = 0;
            }
          } else {
            result.errors.push(`Could not find student with SEIS ID: ${String(resultData.studentSeisId)}`);
          }
          
        } catch (error) {
          result.errors.push(`Failed to migrate result ${resultDoc.id}: ${error}`);
        }
      } else if (resultData.studentSeisId && resultData.studentUid) {
        // Remove studentSeisId but keep studentUid
        try {
          const updateData = {
            studentSeisId: deleteField(),
            migratedAt: serverTimestamp(),
            migratedBy: 'system-migration',
            migrationReason: 'Removed dual identifier complexity'
          };
          
          currentBatch.update(resultDoc.ref, updateData);
          result.migrated++;
          operationCount++;
          
          // Handle batch size limit
          if (operationCount >= 450) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
          
        } catch (error) {
          result.errors.push(`Failed to clean result ${resultDoc.id}: ${error}`);
        }
      }
    }
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Migrated ${result.migrated} assessment results`);
    
  } catch (error) {
    result.errors.push(`Assessment results migration failed: ${error}`);
  }
  
  return result;
}

/**
 * Migrate goals to use only studentUid (remove studentSeisId)
 */
async function migrateGoals(): Promise<{ migrated: number; errors: string[] }> {
  const result = { migrated: 0, errors: [] as string[] };
  
  try {
    // Get all goals that need migration
    const goalsSnapshot = await getDocs(collection(db, COLLECTIONS.GOALS));
    
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (const goalDoc of goalsSnapshot.docs) {
      const goalData = goalDoc.data();
      
      // Check if migration is needed
      if (goalData.studentSeisId && !goalData.studentUid) {
        try {
          // Try to find the student by SEIS ID to get their UID
          const studentQuery = query(
            collection(db, COLLECTIONS.STUDENTS),
            where('seisId', '==', goalData.studentSeisId)
          );
          const studentSnapshot = await getDocs(studentQuery);
          
          if (!studentSnapshot.empty) {
            const studentDoc = studentSnapshot.docs[0];
            const studentUid = studentDoc.id;
            
            // Update goal to use studentUid and remove studentSeisId
            const updateData = {
              studentUid: studentUid,
              studentSeisId: deleteField(),
              updatedAt: serverTimestamp()
            };
            
            currentBatch.update(goalDoc.ref, updateData);
            result.migrated++;
            operationCount++;
            
            // Handle batch size limit
            if (operationCount >= 450) {
              batches.push(currentBatch);
              currentBatch = writeBatch(db);
              operationCount = 0;
            }
          } else {
            result.errors.push(`Could not find student with SEIS ID: ${goalData.studentSeisId}`);
          }
          
        } catch (error) {
          result.errors.push(`Failed to migrate goal ${goalDoc.id}: ${error}`);
        }
      } else if (goalData.studentSeisId && goalData.studentUid) {
        // Remove studentSeisId but keep studentUid
        try {
          const updateData = {
            studentSeisId: deleteField(),
            updatedAt: serverTimestamp()
          };
          
          currentBatch.update(goalDoc.ref, updateData);
          result.migrated++;
          operationCount++;
          
          // Handle batch size limit
          if (operationCount >= 450) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
          
        } catch (error) {
          result.errors.push(`Failed to clean goal ${goalDoc.id}: ${error}`);
        }
      }
    }
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Migrated ${result.migrated} goals`);
    
  } catch (error) {
    result.errors.push(`Goals migration failed: ${error}`);
  }
  
  return result;
}

/**
 * Clean up student documents - remove assignment arrays
 */
async function cleanupStudentDocuments(): Promise<{ updated: number; errors: string[] }> {
  const result = { updated: 0, errors: [] as string[] };
  
  try {
    // Get all students
    const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      
      // Check if cleanup is needed
      if (studentData.assignedAssessments || studentData.completedAssessments) {
        try {
          // Remove the arrays
          const updateData = {
            assignedAssessments: deleteField(),
            completedAssessments: deleteField(),
            updatedAt: serverTimestamp()
          };
          
          currentBatch.update(studentDoc.ref, updateData);
          result.updated++;
          operationCount++;
          
          // Handle batch size limit
          if (operationCount >= 450) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
          
        } catch (error) {
          result.errors.push(`Failed to clean up student ${studentDoc.id}: ${error}`);
        }
      }
    }
    
    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Execute all batches
    for (const batch of batches) {
      await batch.commit();
    }
    
    console.log(`✅ Cleaned up ${result.updated} student documents`);
    
  } catch (error) {
    result.errors.push(`Student cleanup failed: ${error}`);
  }
  
  return result;
}

/**
 * Rollback migration (for testing/emergency)
 */
export async function rollbackMigration(): Promise<{ success: boolean; errors: string[] }> {
  console.log('🔄 Rolling back migration...');
  
  const result = { success: false, errors: [] as string[] };
  
  try {
    // This would be complex to implement fully
    // For now, just log what would need to be done
    console.log('⚠️ Rollback not fully implemented');
    console.log('Manual steps needed:');
    console.log('1. Delete all documents from assessmentAssignments collection');
    console.log('2. Restore assignedAssessments arrays in student documents');
    console.log('3. Restore studentSeisId fields in results and goals');
    
    result.errors.push('Rollback not implemented - manual intervention required');
    
  } catch (error) {
    result.errors.push(`Rollback failed: ${error}`);
  }
  
  return result;
}

/**
 * Validate migration results
 */
export async function validateMigration(): Promise<{ valid: boolean; issues: string[] }> {
  console.log('🔍 Validating migration...');
  
  const result = { valid: true, issues: [] as string[] };
  
  try {
    // Check 1: No students should have assignment arrays
    const studentsWithArrays = await getDocs(
      query(collection(db, COLLECTIONS.STUDENTS))
    );
    
    let studentsWithOldArrays = 0;
    studentsWithArrays.docs.forEach(doc => {
      const data = doc.data();
      if (data.assignedAssessments || data.completedAssessments) {
        studentsWithOldArrays++;
      }
    });
    
    if (studentsWithOldArrays > 0) {
      result.valid = false;
      result.issues.push(`${studentsWithOldArrays} students still have assignment arrays`);
    }
    
    // Check 2: No results should have studentSeisId
    const resultsWithSeisId = await getDocs(
      query(
        collection(db, COLLECTIONS.ASSESSMENT_RESULTS),
        where('studentSeisId', '!=', null)
      )
    );
    
    if (!resultsWithSeisId.empty) {
      result.valid = false;
      result.issues.push(`${resultsWithSeisId.docs.length} results still have studentSeisId`);
    }
    
    // Check 3: All assignments should be in junction table
    const assignmentsCount = await getDocs(collection(db, COLLECTIONS.ASSESSMENT_ASSIGNMENTS));
    console.log(`📊 Found ${assignmentsCount.docs.length} assignments in junction table`);
    
    if (result.valid) {
      console.log('✅ Migration validation passed');
    } else {
      console.log('❌ Migration validation failed:', result.issues);
    }
    
  } catch (error) {
    result.valid = false;
    result.issues.push(`Validation failed: ${error}`);
  }
  
  return result;
}
