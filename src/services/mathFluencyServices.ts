// Math Fluency Data Services
// Handles CRUD operations for math fluency system

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type {
  MathFluencyProgress,
  MathFluencyAssessment,
  MathFluencyPracticeSession,
  ProblemProgress,
  ProblemAttempt,
  ProficiencyLevel,
  OperationType,
  ProblemBanks,
  SubLevel,
  SubLevelProgress
} from '@/types/mathFluency'
import {
  calculateProficiencyFromLast5,
  calculateTrend,
  calculateAverage,
  getNextOperation
} from '@/types/mathFluency'
import { 
  determineStartingSubLevel, 
  calculateSubLevelProficiency,
  filterProblemsBySubLevel
} from '@/utils/subLevelUtils'
import { getSubLevelsForOperation, getSubLevelConfig, getNextSubLevel } from '@/config/fluencySubLevels'

// ============================================================================
// MATH FLUENCY PROGRESS OPERATIONS
// ============================================================================

/**
 * Get student's progress for a specific operation
 */
export async function getFluencyProgress(
  studentUid: string,
  operation: OperationType
): Promise<MathFluencyProgress | null> {
  try {
    const docId = `${studentUid}_${operation}`
    const docRef = doc(db, 'mathFluencyProgress', docId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return { id: docSnap.id, ...data } as MathFluencyProgress
    }
    
    return null
  } catch (error: any) {
    console.error('Error fetching fluency progress:', error.message)
    throw error
  }
}

/**
 * Get all operations progress for a student
 * Returns only the operations that exist (doesn't fail if some don't exist)
 */
export async function getAllFluencyProgress(
  studentUid: string
): Promise<MathFluencyProgress[]> {
  const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  const results: MathFluencyProgress[] = []
  
  // Query each operation individually and catch errors
  for (const op of operations) {
    try {
      const progress = await getFluencyProgress(studentUid, op)
      if (progress) {
        results.push(progress)
      }
    } catch (error: any) {
      // Document doesn't exist or permission denied - skip it silently
    }
  }
  
  return results
}

/**
 * Initialize student for fluency program WITHOUT diagnostic
 * Starts at first sub-level with empty problem banks (filled during practice)
 */
export async function addStudentToFluencyProgram(
  studentUid: string,
  studentName: string,
  createdBy: string
): Promise<void> {
  try {
    // Start with Addition only - other operations locked
    const operation: OperationType = 'addition'
    const firstSubLevel = getSubLevelsForOperation(operation)[0]
    
    if (!firstSubLevel) {
      throw new Error('No sub-levels found for addition')
    }
    
    // Initialize with EMPTY problem banks (will populate during practice)
    const emptyBanks: ProblemBanks = {
      doesNotKnow: [],
      emerging: [],
      approaching: [],
      proficient: [],
      mastered: []
    }
    
    // Initialize sub-level progress for all addition sub-levels
    const subLevelProgress: { [key: string]: SubLevelProgress } = {}
    const operationSubLevels = getSubLevelsForOperation(operation)
    
    operationSubLevels.forEach((config, index) => {
      const isFirst = index === 0
      
      subLevelProgress[config.id] = {
        subLevel: config.id,
        operation,
        unlocked: isFirst,  // Only unlock first level
        unlockedDate: isFirst ? Timestamp.now() : null,
        completed: false,
        completedDate: null,
        totalProblems: config.totalProblems,
        proficiencyPercentage: 0,  // Start at 0, will update during practice
        masteryPercentage: 0,
        readyForAssessment: false,
        assessmentAttempts: 0,
        lastAssessmentDate: null,
        lastAssessmentScore: null,
        lastAssessmentCPM: null,
        assessmentHistory: [],
        practiceDays: 0,
        lastPracticeDate: null,
        canAdvance: false,
        advancedDate: null
      }
    })
    
    const progressDoc: MathFluencyProgress = {
      id: `${studentUid}_${operation}`,
      studentUid,
      studentName,
      operation,
      
      currentlyPracticing: true,
      unlocked: true,
      completedOperation: false,
      unlockedDate: Timestamp.now(),
      completedDate: null,
      
      problemBanks: emptyBanks,  // Empty - will fill during practice
      proficiencyDistribution: {
        doesNotKnow: 0,
        emerging: 0,
        approaching: 0,
        proficient: 0,
        mastered: 0,
        total: 0
      },
      
      proficiencyPercentage: 0,  // Will update as they practice
      masteryPercentage: 0,
      canUnlockNext: false,
      
      // ⭐ Start at first sub-level
      currentSubLevel: firstSubLevel.id,
      completedSubLevels: [],
      subLevelProgress,
      
      totalPracticeDays: 0,
      consecutivePracticeDays: 0,
      lastPracticeDate: null,
      practiceDatesLog: [],
      
      lastAssessmentDate: null,
      lastAssessmentScore: null,
      assessmentHistory: [],
      
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy,
      
      // Default to 1 practice per day (teacher can change)
      dailyPracticeLimit: 1
    }
    
    const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
    await setDoc(docRef, progressDoc)
    
    console.log('✅ Added student to fluency program:', progressDoc.id)
  } catch (error) {
    console.error('Error adding student to fluency program:', error)
    throw error
  }
}

/**
 * Initialize student for a specific operation in fluency program
 * Used when unlocking next operation after completing previous one
 */
async function addOperationToFluencyProgram(
  studentUid: string,
  studentName: string,
  operation: OperationType,
  createdBy: string
): Promise<void> {
  try {
    const firstSubLevel = getSubLevelsForOperation(operation)[0]
    
    if (!firstSubLevel) {
      throw new Error(`No sub-levels found for ${operation}`)
    }
    
    // Initialize with EMPTY problem banks (will populate during practice)
    const emptyBanks: ProblemBanks = {
      doesNotKnow: [],
      emerging: [],
      approaching: [],
      proficient: [],
      mastered: []
    }
    
    // Initialize sub-level progress for all operation sub-levels
    const subLevelProgress: { [key: string]: SubLevelProgress } = {}
    const operationSubLevels = getSubLevelsForOperation(operation)
    
    operationSubLevels.forEach((config, index) => {
      const isFirst = index === 0
      
      subLevelProgress[config.id] = {
        subLevel: config.id,
        operation,
        unlocked: isFirst,  // Only unlock first level
        unlockedDate: isFirst ? Timestamp.now() : null,
        completed: false,
        completedDate: null,
        totalProblems: config.totalProblems,
        proficiencyPercentage: 0,  // Start at 0, will update during practice
        masteryPercentage: 0,
        readyForAssessment: false,
        assessmentAttempts: 0,
        lastAssessmentDate: null,
        lastAssessmentScore: null,
        lastAssessmentCPM: null,
        assessmentHistory: [],
        practiceDays: 0,
        lastPracticeDate: null,
        canAdvance: false,
        advancedDate: null
      }
    })
    
    const progressDoc: MathFluencyProgress = {
      id: `${studentUid}_${operation}`,
      studentUid,
      studentName,
      operation,
      
      currentlyPracticing: true,
      unlocked: true,
      completedOperation: false,
      unlockedDate: Timestamp.now(),
      completedDate: null,
      
      problemBanks: emptyBanks,  // Empty - will fill during practice
      proficiencyDistribution: {
        doesNotKnow: 0,
        emerging: 0,
        approaching: 0,
        proficient: 0,
        mastered: 0,
        total: 0
      },
      
      proficiencyPercentage: 0,  // Will update as they practice
      masteryPercentage: 0,
      canUnlockNext: false,
      
      // ⭐ Start at first sub-level
      currentSubLevel: firstSubLevel.id,
      completedSubLevels: [],
      subLevelProgress,
      
      totalPracticeDays: 0,
      consecutivePracticeDays: 0,
      lastPracticeDate: null,
      practiceDatesLog: [],
      
      lastAssessmentDate: null,
      lastAssessmentScore: null,
      assessmentHistory: [],
      
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy,
      
      // Default to 1 practice per day (teacher can change)
      dailyPracticeLimit: 1
    }
    
    const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
    await setDoc(docRef, progressDoc)
    
    console.log(`✅ Unlocked ${operation} operation for student:`, progressDoc.id)
  } catch (error) {
    console.error(`Error unlocking ${operation} operation:`, error)
    throw error
  }
}

/**
 * Check if student is already in fluency program
 */
export async function isStudentInFluencyProgram(studentUid: string): Promise<boolean> {
  try {
    const additionProgress = await getFluencyProgress(studentUid, 'addition')
    return additionProgress !== null
  } catch (error) {
    console.error('Error checking if student in program:', error)
    return false
  }
}

/**
 * Bulk add multiple students to fluency program
 */
export async function bulkAddStudentsToFluencyProgram(
  students: Array<{ uid: string; name: string }>,
  createdBy: string
): Promise<{ success: number; failed: number; alreadyInProgram: number }> {
  let successCount = 0
  let failedCount = 0
  let alreadyInCount = 0
  
  for (const student of students) {
    try {
      // Check if already in program
      const alreadyIn = await isStudentInFluencyProgram(student.uid)
      if (alreadyIn) {
        console.log(`⚠️ Student ${student.name} already in program, skipping`)
        alreadyInCount++
        continue
      }
      
      await addStudentToFluencyProgram(student.uid, student.name, createdBy)
      successCount++
    } catch (error) {
      console.error(`❌ Failed to add ${student.name}:`, error)
      failedCount++
    }
  }
  
  console.log(`✅ Bulk add complete: ${successCount} added, ${alreadyInCount} already in program, ${failedCount} failed`)
  return { success: successCount, failed: failedCount, alreadyInProgram: alreadyInCount }
}

/**
 * Create initial fluency progress document from diagnostic results
 * (Legacy function - kept for backward compatibility with placement diagnostic)
 */
export async function createInitialFluencyProgress(
  studentUid: string,
  studentName: string,
  operation: OperationType,
  problemBanks: ProblemBanks,
  createdBy: string
): Promise<MathFluencyProgress> {
  try {
    const distribution = {
      doesNotKnow: problemBanks.doesNotKnow.length,
      emerging: problemBanks.emerging.length,
      approaching: problemBanks.approaching.length,
      proficient: problemBanks.proficient.length,
      mastered: problemBanks.mastered.length,
      total: problemBanks.doesNotKnow.length +
             problemBanks.emerging.length +
             problemBanks.approaching.length +
             problemBanks.proficient.length +
             problemBanks.mastered.length
    }
    
    const proficiencyPercentage = Math.round(
      ((distribution.approaching + distribution.proficient + distribution.mastered) / distribution.total) * 100
    )
    
    const masteryPercentage = Math.round(
      ((distribution.proficient + distribution.mastered) / distribution.total) * 100
    )
    
    // ⭐ NEW: Determine starting sub-level based on diagnostic performance
    const startingSubLevel = determineStartingSubLevel(operation, proficiencyPercentage / 100)
    
    // Initialize sub-level progress for all sub-levels in this operation
    const allProblems = [
      ...problemBanks.doesNotKnow,
      ...problemBanks.emerging,
      ...problemBanks.approaching,
      ...problemBanks.proficient,
      ...problemBanks.mastered
    ]
    
    const subLevelProgress: { [key: string]: SubLevelProgress } = {}
    const operationSubLevels = getSubLevelsForOperation(operation)
    
    operationSubLevels.forEach(config => {
      const isStartingLevel = config.id === startingSubLevel
      const { proficiencyPercentage: subLevelProf } = calculateSubLevelProficiency(allProblems, config.id)
      
      subLevelProgress[config.id] = {
        subLevel: config.id,
        operation,
        unlocked: isStartingLevel,  // Only unlock starting level
        unlockedDate: isStartingLevel ? Timestamp.now() : null,
        completed: false,
        completedDate: null,
        totalProblems: config.totalProblems,
        proficiencyPercentage: subLevelProf,
        masteryPercentage: 0,
        readyForAssessment: subLevelProf >= 85,
        assessmentAttempts: 0,
        lastAssessmentDate: null,
        lastAssessmentScore: null,
        lastAssessmentCPM: null,
        assessmentHistory: [],
        practiceDays: 0,
        lastPracticeDate: null,
        canAdvance: false,
        advancedDate: null
      }
    })
    
    const progressDoc: MathFluencyProgress = {
      id: `${studentUid}_${operation}`,
      studentUid,
      studentName,
      operation,
      
      currentlyPracticing: true,
      unlocked: true,
      completedOperation: false,
      unlockedDate: Timestamp.now(),
      completedDate: null,
      
      problemBanks,
      proficiencyDistribution: distribution,
      
      proficiencyPercentage,
      masteryPercentage,
      canUnlockNext: proficiencyPercentage >= 95,
      
      // ⭐ NEW: Sub-level tracking
      currentSubLevel: startingSubLevel,
      completedSubLevels: [],
      subLevelProgress,
      
      totalPracticeDays: 0,
      consecutivePracticeDays: 0,
      lastPracticeDate: null,
      practiceDatesLog: [],
      
      lastAssessmentDate: null,
      lastAssessmentScore: null,
      assessmentHistory: [],
      
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy,
      
      // Default to 1 practice per day
      dailyPracticeLimit: 1
    }
    
    const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
    await setDoc(docRef, progressDoc)
    
    console.log('✅ Created initial fluency progress:', progressDoc.id)
    return progressDoc
  } catch (error) {
    console.error('Error creating initial fluency progress:', error)
    throw error
  }
}

/**
 * Update problem in fluency progress (add attempt, recalculate proficiency)
 */
/**
 * Update daily practice limit for a student
 */
export async function updateDailyPracticeLimit(
  studentUid: string,
  operation: OperationType,
  limit: 1 | 2 | 3 | 999  // 999 = unlimited
): Promise<void> {
  try {
    const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
    await updateDoc(docRef, {
      dailyPracticeLimit: limit,
      updatedAt: Timestamp.now()
    })
    console.log(`✅ Updated practice limit for ${studentUid} to ${limit === 999 ? 'unlimited' : limit + ' per day'}`)
  } catch (error) {
    console.error('Error updating practice limit:', error)
    throw error
  }
}

/**
 * Get count of practice sessions completed today
 */
export async function getTodaysPracticeCount(
  studentUid: string,
  operation: OperationType
): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // ⚠️ IMPORTANT: Equality filters must come before range filters
    // Order: studentUid, operation, completed (equality) → sessionDate (range)
    const q = query(
      collection(db, 'mathFluencyPracticeSessions'),
      where('studentUid', '==', studentUid),
      where('operation', '==', operation),
      where('completed', '==', true),
      where('sessionDate', '>=', Timestamp.fromDate(today))
    )
    
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('Error getting today\'s practice count:', error)
    return 0
  }
}

/**
 * Delete a specific practice session
 */
export async function deletePracticeSession(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'mathFluencyPracticeSessions', sessionId))
    console.log('🗑️ Deleted practice session:', sessionId)
  } catch (error) {
    console.error('Error deleting practice session:', error)
    throw error
  }
}

/**
 * Update main progress document after practice session completes
 */
export async function updateProgressAfterSession(
  studentUid: string,
  operation: OperationType,
  sessionResults: {
    diagnosticResults: { [problemId: string]: { correct: boolean; responseTime: number } }
    round2Results: { [problemId: string]: any }
    round3Results: { [problemId: string]: any }
    allProblems: ProblemProgress[]
  }
): Promise<void> {
  try {
    console.log('📊 Updating progress after session...')
    
    const progress = await getFluencyProgress(studentUid, operation)
    if (!progress) {
      console.error('No progress document found')
      return
    }
    
    // Combine all results from all rounds
    const allResults = {
      ...sessionResults.diagnosticResults,
      ...sessionResults.round2Results,
      ...sessionResults.round3Results
    }
    
    // Update each problem's proficiency based on performance
    const updatedProblems = sessionResults.allProblems.map(problem => {
      const result = allResults[problem.problemId]
      if (result) {
        return updateProblemProficiencyLevel(problem, result)
      }
      return problem
    })
    
    // Reorganize into banks by proficiency level
    const updatedBanks: ProblemBanks = {
      doesNotKnow: updatedProblems.filter(p => p.proficiencyLevel === 'doesNotKnow'),
      emerging: updatedProblems.filter(p => p.proficiencyLevel === 'emerging'),
      approaching: updatedProblems.filter(p => p.proficiencyLevel === 'approaching'),
      proficient: updatedProblems.filter(p => p.proficiencyLevel === 'proficient'),
      mastered: updatedProblems.filter(p => p.proficiencyLevel === 'mastered')
    }
    
    // Calculate new distribution
    const distribution = {
      doesNotKnow: updatedBanks.doesNotKnow.length,
      emerging: updatedBanks.emerging.length,
      approaching: updatedBanks.approaching.length,
      proficient: updatedBanks.proficient.length,
      mastered: updatedBanks.mastered.length,
      total: updatedProblems.length
    }
    
    // Calculate proficiency percentage
    const proficiencyPercentage = distribution.total > 0
      ? Math.round(((distribution.approaching + distribution.proficient + distribution.mastered) / distribution.total) * 100)
      : 0
    
    const masteryPercentage = distribution.total > 0
      ? Math.round(((distribution.proficient + distribution.mastered) / distribution.total) * 100)
      : 0
    
    // Update practice dates and streak
    const today = new Date().toISOString().split('T')[0]
    const existingDates = (progress.practiceDatesLog || []).map(d => 
      typeof d === 'string' ? d : d.toDate().toISOString().split('T')[0]
    )
    const practiceDatesLog = [...existingDates, today]
    const consecutiveDays = calculateConsecutiveStreak(practiceDatesLog)
    
    // Update sub-level progress if applicable
    let subLevelProgress = progress.subLevelProgress
    if (progress.currentSubLevel && subLevelProgress) {
      const currentSubLevelData = subLevelProgress[progress.currentSubLevel]
      if (currentSubLevelData) {
        // Filter problems for current sub-level
        const subLevelProblems = updatedProblems.filter(p => {
          // Would need to check if problem belongs to current sub-level
          // For now, use all problems
          return true
        })
        
        const subLevelProficiency = subLevelProblems.length > 0
          ? Math.round((subLevelProblems.filter(p => 
              p.proficiencyLevel === 'approaching' || 
              p.proficiencyLevel === 'proficient' || 
              p.proficiencyLevel === 'mastered'
            ).length / subLevelProblems.length) * 100)
          : 0
        
        subLevelProgress[progress.currentSubLevel] = {
          ...currentSubLevelData,
          proficiencyPercentage: subLevelProficiency,
          readyForAssessment: subLevelProficiency >= 85,
          practiceDays: (currentSubLevelData.practiceDays || 0) + 1,
          lastPracticeDate: Timestamp.now()
        }
        
        // ⭐ AUTO-ADVANCE: If 90%+ proficient, unlock next sub-level
        if (subLevelProficiency >= 90 && !currentSubLevelData.completed) {
          console.log(`🎉 Auto-advancing! ${subLevelProficiency}% on ${progress.currentSubLevel}`)
          
          // Mark current as completed
          subLevelProgress[progress.currentSubLevel] = {
            ...subLevelProgress[progress.currentSubLevel],
            completed: true,
            completedDate: Timestamp.now(),
            canAdvance: true,
            advancedDate: Timestamp.now()
          }
          
          // Find next sub-level
          const currentConfig = getSubLevelConfig(progress.currentSubLevel)
          const nextSubLevel = currentConfig ? getNextSubLevel(currentConfig.id) : null
          
          if (nextSubLevel) {
            console.log(`🚀 Unlocking next level: ${nextSubLevel}`)
            
            // Unlock next sub-level
            if (subLevelProgress[nextSubLevel]) {
              subLevelProgress[nextSubLevel] = {
                ...subLevelProgress[nextSubLevel],
                unlocked: true,
                unlockedDate: Timestamp.now()
              }
            }
            
            // Update completedSubLevels and currentSubLevel
            const completedSubLevels = [...(progress.completedSubLevels || []), progress.currentSubLevel]
            progress.completedSubLevels = completedSubLevels
            progress.currentSubLevel = nextSubLevel
            
            console.log(`✅ Advanced to: ${nextSubLevel}`)
          } else {
            console.log(`🏆 Completed all sub-levels for ${operation}!`)
            progress.completedOperation = true
            progress.completedDate = Timestamp.now()
          }
        }
      }
    }
    
    // Clean the data (remove undefined values)
    const cleanedBanks = {
      doesNotKnow: updatedBanks.doesNotKnow.map(cleanProblemForFirestore),
      emerging: updatedBanks.emerging.map(cleanProblemForFirestore),
      approaching: updatedBanks.approaching.map(cleanProblemForFirestore),
      proficient: updatedBanks.proficient.map(cleanProblemForFirestore),
      mastered: updatedBanks.mastered.map(cleanProblemForFirestore)
    }
    
    // Update main document
    const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
    await updateDoc(docRef, {
      problemBanks: cleanedBanks,
      proficiencyDistribution: distribution,
      proficiencyPercentage,
      masteryPercentage,
      canUnlockNext: proficiencyPercentage >= 95,
      lastPracticeDate: Timestamp.now(),
      consecutivePracticeDays: consecutiveDays,
      totalPracticeDays: (progress.totalPracticeDays || 0) + 1,
      practiceDatesLog,
      subLevelProgress: subLevelProgress || {},
      currentSubLevel: progress.currentSubLevel,  // Updated if advanced
      completedSubLevels: progress.completedSubLevels || [],  // Updated if advanced
      completedOperation: progress.completedOperation || false,
      completedDate: progress.completedDate || null,
      updatedAt: Timestamp.now()
    })
    
    // ⭐ AUTO-UNLOCK NEXT OPERATION: If 95%+ proficient AND all sub-levels complete
    if (progress.completedOperation && proficiencyPercentage >= 95) {
      const nextOperation = getNextOperation(operation)
      
      if (nextOperation) {
        // Check if next operation already exists
        const nextOpDocRef = doc(db, 'mathFluencyProgress', `${studentUid}_${nextOperation}`)
        const nextOpDoc = await getDoc(nextOpDocRef)
        
        if (!nextOpDoc.exists()) {
          console.log(`🚀 Unlocking next operation: ${nextOperation}`)
          
          // Create initial progress for next operation (starts at first sub-level with empty banks)
          await addOperationToFluencyProgram(
            studentUid,
            progress.studentName,
            nextOperation,
            progress.createdBy
          )
          
          console.log(`✅ ${nextOperation} unlocked and ready for practice!`)
        } else {
          console.log(`ℹ️ ${nextOperation} already exists for this student`)
        }
      } else {
        console.log(`🏆 Student has completed all operations!`)
      }
    }
    
    console.log('✅ Progress document updated:', {
      total: distribution.total,
      proficiency: proficiencyPercentage,
      streak: consecutiveDays,
      currentSubLevel: progress.currentSubLevel,
      completedSubLevels: (progress.completedSubLevels || []).length,
      completedOperation: progress.completedOperation
    })
  } catch (error) {
    console.error('Error updating progress:', error)
    throw error
  }
}

/**
 * Update a problem's proficiency level based on performance
 */
function updateProblemProficiencyLevel(
  problem: ProblemProgress,
  result: { correct: boolean; responseTime: number }
): ProblemProgress {
  // Add this attempt to history
  const newAttempt: ProblemAttempt = {
    date: Timestamp.now(),
    correct: result.correct,
    responseTime: result.responseTime,
    source: 'digital-practice'
  }
  
  const last5 = [...(problem.last5Attempts || []), newAttempt].slice(-5)
  problem.last5Attempts = last5
  
  // Calculate proficiency based on last 5 attempts
  const correctCount = last5.filter(a => a.correct).length
  const avgTime = last5.reduce((sum, a) => sum + (a.responseTime || 0), 0) / last5.length
  
  // Determine new proficiency level
  if (correctCount === 5 && avgTime < 3000) {
    problem.proficiencyLevel = 'mastered'
  } else if (correctCount >= 4 && avgTime < 6000) {
    problem.proficiencyLevel = 'proficient'
  } else if (correctCount >= 3) {
    problem.proficiencyLevel = 'approaching'
  } else if (correctCount >= 1) {
    problem.proficiencyLevel = 'emerging'
  } else {
    problem.proficiencyLevel = 'doesNotKnow'
  }
  
  // Update other fields
  problem.totalAttempts = (problem.totalAttempts || 0) + 1
  problem.correctAttempts = (problem.correctAttempts || 0) + (result.correct ? 1 : 0)
  problem.lastAttemptDate = Timestamp.now()
  problem.responseTimes = [...(problem.responseTimes || []), result.responseTime].slice(-10)
  
  if (result.responseTime) {
    problem.averageResponseTime = problem.responseTimes.reduce((sum, t) => sum + t, 0) / problem.responseTimes.length
    problem.fastestResponseTime = Math.min(...problem.responseTimes)
    problem.slowestResponseTime = Math.max(...problem.responseTimes)
  }
  
  return problem
}

/**
 * Helper to get operation symbol
 */
function getOpSymbol(operation: OperationType): string {
  const symbols = { addition: '+', subtraction: '-', multiplication: '×', division: '÷' }
  return symbols[operation] || '+'
}

/**
 * Helper to calculate answer from problem
 */
function calculateAnswer(problem: any, operation: OperationType): number {
  switch (operation) {
    case 'addition': return problem.num1 + problem.num2
    case 'subtraction': return problem.num1 - problem.num2
    case 'multiplication': return problem.num1 * problem.num2
    case 'division': return problem.num1 / problem.num2
  }
}

/**
 * Clean problem object for Firestore (remove undefined values)
 */
function cleanProblemForFirestore(problem: ProblemProgress): any {
  // Only include essential fields for storage
  return {
    problemId: problem.problemId,
    num1: problem.num1,
    num2: problem.num2,
    operation: problem.operation,
    correctAnswer: problem.correctAnswer,
    displayText: problem.displayText,
    category: problem.category || '',
    factFamily: problem.factFamily || '',
    difficulty: problem.difficulty || 1,
    proficiencyLevel: problem.proficiencyLevel,
    last5Attempts: problem.last5Attempts || [],
    proficiencyCalculation: problem.proficiencyCalculation || {
      correctOutOfLast5: 0,
      averageTimeOfLast5: null,
      last5Trend: 'stable',
      confidenceLevel: 'low'
    },
    consecutiveCorrectDays: problem.consecutiveCorrectDays || 0,
    daysInCurrentLevel: problem.daysInCurrentLevel || 0,
    totalAttempts: problem.totalAttempts || 0,
    correctAttempts: problem.correctAttempts || 0,
    responseTimes: problem.responseTimes || [],
    averageResponseTime: problem.averageResponseTime || null,
    fastestResponseTime: problem.fastestResponseTime || null,
    slowestResponseTime: problem.slowestResponseTime || null,
    firstAttemptDate: problem.firstAttemptDate || Timestamp.now(),
    lastAttemptDate: problem.lastAttemptDate || Timestamp.now(),
    dateEnteredEmerging: problem.dateEnteredEmerging || null,
    dateEnteredApproaching: problem.dateEnteredApproaching || null,
    dateEnteredProficient: problem.dateEnteredProficient || null,
    dateEnteredMastered: problem.dateEnteredMastered || null,
    dailyResults: problem.dailyResults || [],
    commonErrors: problem.commonErrors || [],
    errorPattern: problem.errorPattern || null,
    needsStrategyInstruction: problem.needsStrategyInstruction || false,
    flaggedForReview: problem.flaggedForReview || false,
    regressionCount: problem.regressionCount || 0,
    lastRegressionDate: problem.lastRegressionDate || null
  }
}

/**
 * Calculate consecutive practice streak
 */
function calculateConsecutiveStreak(practiceDates: string[]): number {
  if (practiceDates.length === 0) return 0
  
  // Sort dates descending (most recent first)
  const sorted = [...practiceDates].sort().reverse()
  
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let checkDate = new Date(today)
  
  for (const dateStr of sorted) {
    const practiceDate = new Date(dateStr)
    const daysDiff = Math.floor((checkDate.getTime() - practiceDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0 || daysDiff === 1) {
      streak++
      checkDate = practiceDate
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Clean up old incomplete practice sessions (>6 hours old)
 * This prevents clutter from testing sessions and accidental exits
 */
export async function cleanupOldIncompleteSessions(
  studentUid: string,
  operation: OperationType
): Promise<number> {
  try {
    const sixHoursAgo = new Date()
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6)  // 6-hour window
    
    // ⚠️ IMPORTANT: Equality filters must come before range filters
    // Order: studentUid, operation, completed (equality) → createdAt (range)
    const q = query(
      collection(db, 'mathFluencyPracticeSessions'),
      where('studentUid', '==', studentUid),
      where('operation', '==', operation),
      where('completed', '==', false),
      where('createdAt', '<', Timestamp.fromDate(sixHoursAgo))
    )
    
    const snapshot = await getDocs(q)
    
    // Delete each old incomplete session
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    
    if (snapshot.size > 0) {
      console.log(`🧹 Cleaned up ${snapshot.size} old incomplete sessions`)
    }
    
    return snapshot.size
  } catch (error) {
    console.error('Error cleaning up old sessions:', error)
    return 0
  }
}

export async function updateProblemInProgress(
  studentUid: string,
  operation: OperationType,
  problemId: string,
  attempt: {
    correct: boolean
    responseTime: number | null
    source: 'paper-assessment' | 'digital-practice' | 'digital-assessment'
    assessmentId?: string
    sessionId?: string
  }
): Promise<void> {
  try {
    const progress = await getFluencyProgress(studentUid, operation)
    if (!progress) {
      throw new Error('Progress document not found')
    }
    
    // Find problem in all banks
    let problem: ProblemProgress | null = null
    let currentBankName: keyof ProblemBanks | null = null
    
    for (const [bankName, bank] of Object.entries(progress.problemBanks)) {
      const found = bank.find((p: ProblemProgress) => p.problemId === problemId)
      if (found) {
        problem = found
        currentBankName = bankName as keyof ProblemBanks
        break
      }
    }
    
    if (!problem) {
      // Problem doesn't exist yet (adaptive practice - first session)
      // Skip update for now - problems will be added to banks after session completes
      console.log(`ℹ️ Problem ${problemId} not in banks yet (will be added after session)`)
      return
    }
    
    // Add attempt to last5Attempts
    problem.last5Attempts.push({
      date: Timestamp.now(),
      correct: attempt.correct,
      responseTime: attempt.responseTime,
      source: attempt.source,
      assessmentId: attempt.assessmentId,
      sessionId: attempt.sessionId
    })
    
    // Keep only last 5
    problem.last5Attempts = problem.last5Attempts.slice(-5)
    
    // Update response times (last 10)
    if (attempt.responseTime !== null) {
      problem.responseTimes.push(attempt.responseTime)
      problem.responseTimes = problem.responseTimes.slice(-10)
      
      const validTimes = problem.responseTimes.filter((t): t is number => t !== null)
      problem.averageResponseTime = validTimes.length > 0 
        ? Math.round(validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length)
        : null
      problem.fastestResponseTime = validTimes.length > 0 ? Math.min(...validTimes) : null
      problem.slowestResponseTime = validTimes.length > 0 ? Math.max(...validTimes) : null
    }
    
    // Update totals
    problem.totalAttempts++
    if (attempt.correct) {
      problem.correctAttempts++
      problem.consecutiveCorrectDays++  // Will be properly managed daily
    } else {
      problem.consecutiveCorrectDays = 0
    }
    
    problem.lastAttemptDate = Timestamp.now()
    
    // Recalculate proficiency from last 5
    const correctCount = problem.last5Attempts.filter(a => a.correct).length
    const avgTime = calculateAverage(
      problem.last5Attempts.map(a => a.responseTime)
    )
    
    problem.proficiencyCalculation = {
      correctOutOfLast5: correctCount,
      averageTimeOfLast5: avgTime,
      last5Trend: calculateTrend(problem.last5Attempts),
      confidenceLevel: problem.totalAttempts < 5 ? 'low' : 
                       problem.totalAttempts < 10 ? 'medium' : 'high'
    }
    
    // Calculate new proficiency level
    const newProficiencyLevel = calculateProficiencyFromLast5(correctCount, avgTime)
    
    // Check if level changed
    if (newProficiencyLevel !== problem.proficiencyLevel) {
      const oldLevel = problem.proficiencyLevel
      problem.proficiencyLevel = newProficiencyLevel
      
      // Update date entered fields
      const now = Timestamp.now()
      if (newProficiencyLevel === 'emerging' && !problem.dateEnteredEmerging) {
        problem.dateEnteredEmerging = now
      } else if (newProficiencyLevel === 'approaching' && !problem.dateEnteredApproaching) {
        problem.dateEnteredApproaching = now
      } else if (newProficiencyLevel === 'proficient' && !problem.dateEnteredProficient) {
        problem.dateEnteredProficient = now
      } else if (newProficiencyLevel === 'mastered' && !problem.dateEnteredMastered) {
        problem.dateEnteredMastered = now
      }
      
      // Check if this is a regression
      const levelOrder = ['doesNotKnow', 'emerging', 'approaching', 'proficient', 'mastered']
      const oldIndex = levelOrder.indexOf(oldLevel)
      const newIndex = levelOrder.indexOf(newProficiencyLevel)
      
      if (newIndex < oldIndex) {
        // Regression detected
        problem.regressionCount++
        problem.lastRegressionDate = now
      }
      
      problem.daysInCurrentLevel = 0
      
      // Move problem to new bank
      if (currentBankName) {
        progress.problemBanks[currentBankName] = progress.problemBanks[currentBankName]
          .filter(p => p.problemId !== problemId)
        progress.problemBanks[newProficiencyLevel].push(problem)
      }
    } else {
      problem.daysInCurrentLevel++
    }
    
    // Recalculate distribution
    progress.proficiencyDistribution = {
      doesNotKnow: progress.problemBanks.doesNotKnow.length,
      emerging: progress.problemBanks.emerging.length,
      approaching: progress.problemBanks.approaching.length,
      proficient: progress.problemBanks.proficient.length,
      mastered: progress.problemBanks.mastered.length,
      total: progress.proficiencyDistribution.total
    }
    
    progress.proficiencyPercentage = Math.round(
      ((progress.proficiencyDistribution.approaching + 
        progress.proficiencyDistribution.proficient + 
        progress.proficiencyDistribution.mastered) / 
        progress.proficiencyDistribution.total) * 100
    )
    
    progress.masteryPercentage = Math.round(
      ((progress.proficiencyDistribution.proficient + 
        progress.proficiencyDistribution.mastered) / 
        progress.proficiencyDistribution.total) * 100
    )
    
    progress.canUnlockNext = progress.proficiencyPercentage >= 95
    progress.updatedAt = Timestamp.now()
    
    // ⚠️ SKIP individual problem updates during practice
    // We update everything at session end via updateProgressAfterSession()
    // This prevents: undefined errors, slow performance, partial updates
    
    console.log(`✅ Problem ${problemId} updated in memory (will save at session end)`)
  } catch (error) {
    console.error('Error updating problem in progress:', error)
    // Don't throw - this is non-critical during practice
  }
}

// ============================================================================
// MATH FLUENCY ASSESSMENTS OPERATIONS
// ============================================================================

/**
 * Create a paper assessment template (pre-filled for score entry)
 */
export async function createPaperAssessmentTemplate(
  studentUid: string,
  studentName: string,
  operation: OperationType,
  problems: any[],
  weekNumber: number,
  assessmentName: string,
  createdBy: string
): Promise<string> {
  try {
    console.log('🔍 Creating template for:', { studentName, operation, problemCount: problems.length })
    
    const template = {
      studentUid,
      studentName,
      operation,
      weekNumber,
      assessmentName,
      assessmentType: 'paper-weekly-probe',
      assessmentDate: null,  // Will be set when scored
      
      // Pre-fill all problems as CORRECT
      problems: problems.map((problem, index) => {
        // Handle different problem formats
        const problemId = problem.problemId || problem.id || `problem_${index}`
        const displayText = problem.displayText || `${problem.num1} ${getOpSymbol(operation)} ${problem.num2}`
        const correctAnswer = problem.correctAnswer || String(calculateAnswer(problem, operation))
        
        return {
          problemNumber: index + 1,
          problemId,
          displayText,
          correctAnswer,
          studentAnswer: correctAnswer,  // Pre-filled as correct
          isCorrect: true,  // Pre-filled as correct
          proficiencyLevel: problem.proficiencyLevel || 'unknown'
        }
      }),
      
      totalProblems: problems.length,
      
      // Initial scoring (all correct)
      scoring: {
        attempted: problems.length,
        correct: problems.length,
        incorrect: 0,
        accuracy: 1.0,
        correctPerMinute: problems.length  // Assumes all done in 1 minute
      },
      
      status: 'pending-score-entry',  // 'pending-score-entry' | 'scored' | 'cancelled'
      scoredAt: null,
      scoredBy: null,
      
      createdAt: Timestamp.now(),
      createdBy,
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, 'mathFluencyPaperAssessments'), template)
    
    console.log('✅ Created paper assessment template:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating paper assessment template:', error)
    throw error
  }
}

/**
 * Get count of saved assessments for a student (for auto-numbering)
 */
export async function getAssessmentCountForStudent(studentUid: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'mathFluencyPaperAssessments'),
      where('studentUid', '==', studentUid)
    )
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('Error getting assessment count:', error)
    return 0
  }
}

/**
 * Get all saved assessments for a student
 */
export async function getStudentPaperAssessments(studentUid: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'mathFluencyPaperAssessments'),
      where('studentUid', '==', studentUid),
      orderBy('generatedDate', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting student assessments:', error)
    return []
  }
}

/**
 * Get paper assessment template for score entry
 */
export async function getPaperAssessmentTemplate(
  templateId: string
): Promise<any | null> {
  try {
    const docRef = doc(db, 'mathFluencyPaperAssessments', templateId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching paper assessment template:', error)
    throw error
  }
}

/**
 * Get all pending paper assessments for a teacher
 */
export async function getPendingPaperAssessments(
  teacherUid: string
): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'mathFluencyPaperAssessments'),
      where('createdBy', '==', teacherUid),
      where('status', '==', 'pending-score-entry'),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching pending assessments:', error)
    throw error
  }
}

/**
 * Update paper assessment template with actual scores
 */
export async function updatePaperAssessmentScore(
  templateId: string,
  problems: any[],
  attempted: number,
  correct: number,
  scoredBy: string
): Promise<void> {
  try {
    const docRef = doc(db, 'mathFluencyPaperAssessments', templateId)
    
    await updateDoc(docRef, {
      problems,
      'scoring.attempted': attempted,
      'scoring.correct': correct,
      'scoring.incorrect': attempted - correct,
      'scoring.accuracy': attempted > 0 ? correct / attempted : 0,
      'scoring.correctPerMinute': correct,  // CPM
      status: 'scored',
      scoredAt: Timestamp.now(),
      scoredBy,
      assessmentDate: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log('✅ Updated paper assessment score:', templateId)
  } catch (error) {
    console.error('Error updating paper assessment score:', error)
    throw error
  }
}

/**
 * Create a new fluency assessment record
 */
export async function createFluencyAssessment(
  assessment: Omit<MathFluencyAssessment, 'id'>
): Promise<MathFluencyAssessment> {
  try {
    const docRef = await addDoc(collection(db, 'mathFluencyAssessments'), {
      ...assessment,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    const created = {
      id: docRef.id,
      ...assessment
    }
    
    console.log('✅ Created fluency assessment:', created.id)
    return created
  } catch (error) {
    console.error('Error creating fluency assessment:', error)
    throw error
  }
}

/**
 * Get all assessments for a student
 */
export async function getStudentAssessments(
  studentUid: string,
  operation?: OperationType
): Promise<MathFluencyAssessment[]> {
  try {
    let q = query(
      collection(db, 'mathFluencyAssessments'),
      where('studentUid', '==', studentUid),
      orderBy('assessmentDate', 'desc')
    )
    
    if (operation) {
      q = query(
        collection(db, 'mathFluencyAssessments'),
        where('studentUid', '==', studentUid),
        where('assessmentCategory', '==', operation),
        orderBy('assessmentDate', 'desc')
      )
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MathFluencyAssessment))
  } catch (error) {
    console.error('Error fetching student assessments:', error)
    throw error
  }
}

/**
 * Get latest assessment for student/operation
 */
export async function getLatestAssessment(
  studentUid: string,
  operation: OperationType
): Promise<MathFluencyAssessment | null> {
  try {
    const q = query(
      collection(db, 'mathFluencyAssessments'),
      where('studentUid', '==', studentUid),
      where('assessmentCategory', '==', operation),
      orderBy('assessmentDate', 'desc'),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as MathFluencyAssessment
  } catch (error) {
    console.error('Error fetching latest assessment:', error)
    throw error
  }
}

// ============================================================================
// MATH FLUENCY PRACTICE SESSIONS OPERATIONS
// ============================================================================

/**
 * Create a new practice session record
 */
export async function createPracticeSession(
  session: Omit<MathFluencyPracticeSession, 'id'>
): Promise<MathFluencyPracticeSession> {
  try {
    const docRef = await addDoc(collection(db, 'mathFluencyPracticeSessions'), {
      ...session,
      createdAt: Timestamp.now()
    })
    
    const created = {
      id: docRef.id,
      ...session
    }
    
    console.log('✅ Created practice session:', created.id)
    return created
  } catch (error) {
    console.error('Error creating practice session:', error)
    throw error
  }
}

/**
 * Get practice sessions for a student (with optional date range)
 */
export async function getPracticeSessions(
  studentUid: string,
  operation?: OperationType,
  startDate?: Date,
  endDate?: Date
): Promise<MathFluencyPracticeSession[]> {
  try {
    let q = query(
      collection(db, 'mathFluencyPracticeSessions'),
      where('studentUid', '==', studentUid),
      orderBy('sessionDate', 'desc')
    )
    
    if (operation) {
      q = query(
        collection(db, 'mathFluencyPracticeSessions'),
        where('studentUid', '==', studentUid),
        where('operation', '==', operation),
        orderBy('sessionDate', 'desc')
      )
    }
    
    const snapshot = await getDocs(q)
    let sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MathFluencyPracticeSession))
    
    // Filter by date range if provided
    if (startDate || endDate) {
      sessions = sessions.filter(session => {
        const sessionDate = session.sessionDate.toDate()
        if (startDate && sessionDate < startDate) return false
        if (endDate && sessionDate > endDate) return false
        return true
      })
    }
    
    return sessions
  } catch (error) {
    console.error('Error fetching practice sessions:', error)
    throw error
  }
}

/**
 * Get today's practice session (if exists)
 */
export async function getTodaysPracticeSession(
  studentUid: string,
  operation: OperationType
): Promise<MathFluencyPracticeSession | null> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const sessions = await getPracticeSessions(studentUid, operation, today, tomorrow)
    
    return sessions.length > 0 ? sessions[0] : null
  } catch (error) {
    console.error('Error fetching today\'s session:', error)
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find problem in any bucket of problem banks
 */
export function findProblemInBanks(
  problemBanks: ProblemBanks,
  problemId: string
): { problem: ProblemProgress; bankName: keyof ProblemBanks } | null {
  for (const [bankName, bank] of Object.entries(problemBanks) as [keyof ProblemBanks, ProblemProgress[]][]) {
    const problem = bank.find(p => p.problemId === problemId)
    if (problem) {
      return { problem, bankName }
    }
  }
  return null
}

/**
 * Move problem to different proficiency bucket
 */
export function moveProblemToBucket(
  problemBanks: ProblemBanks,
  problemId: string,
  newLevel: ProficiencyLevel
): ProblemBanks {
  const found = findProblemInBanks(problemBanks, problemId)
  if (!found) return problemBanks
  
  const { problem, bankName } = found
  
      // Remove from current bank
      problemBanks[bankName] = problemBanks[bankName].filter((p: ProblemProgress) => p.problemId !== problemId)
  
  // Update proficiency level
  problem.proficiencyLevel = newLevel
  
  // Add to new bank
  problemBanks[newLevel].push(problem)
  
  return problemBanks
}

/**
 * Calculate proficiency percentage
 */
export function calculateProficiencyPercentage(distribution: {
  doesNotKnow: number
  emerging: number
  approaching: number
  proficient: number
  mastered: number
  total: number
}): number {
  if (distribution.total === 0) return 0
  
  return Math.round(
    ((distribution.approaching + distribution.proficient + distribution.mastered) / 
      distribution.total) * 100
  )
}

/**
 * Get class-wide fluency overview
 */
export async function getClassFluencyOverview(
  studentUids: string[],
  operation: OperationType
): Promise<{
  students: Array<{
    studentUid: string
    studentName: string
    proficiency: number
    mastery: number
    canUnlock: boolean
    lastPractice: Timestamp | null
    streak: number
  }>
  classAverage: number
  readyToUnlock: number
  needsIntervention: number
  highPerformers: number
}> {
  try {
    const progressDocs = await Promise.all(
      studentUids.map(uid => getFluencyProgress(uid, operation))
    )
    
    const students = progressDocs
      .filter((doc): doc is MathFluencyProgress => doc !== null)
      .map(doc => ({
        studentUid: doc.studentUid,
        studentName: doc.studentName,
        proficiency: doc.proficiencyPercentage,
        mastery: doc.masteryPercentage,
        canUnlock: doc.canUnlockNext,
        lastPractice: doc.lastPracticeDate,
        streak: doc.consecutivePracticeDays
      }))
    
    const classAverage = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.proficiency, 0) / students.length)
      : 0
    
    return {
      students,
      classAverage,
      readyToUnlock: students.filter(s => s.canUnlock).length,
      needsIntervention: students.filter(s => s.proficiency < 50).length,
      highPerformers: students.filter(s => s.proficiency >= 80).length
    }
  } catch (error) {
    console.error('Error getting class fluency overview:', error)
    throw error
  }
}

