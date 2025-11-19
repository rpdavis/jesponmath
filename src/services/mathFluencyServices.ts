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
  ProficiencyLevel,
  OperationType,
  ProblemBanks
} from '@/types/mathFluency'
import {
  calculateProficiencyFromLast5,
  calculateTrend,
  calculateAverage
} from '@/types/mathFluency'

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
    const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as MathFluencyProgress
    }
    
    return null
  } catch (error) {
    console.error('Error fetching fluency progress:', error)
    throw error
  }
}

/**
 * Get all operations progress for a student
 */
export async function getAllFluencyProgress(
  studentUid: string
): Promise<MathFluencyProgress[]> {
  try {
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
    const progressPromises = operations.map(op => getFluencyProgress(studentUid, op))
    const results = await Promise.all(progressPromises)
    
    return results.filter((p): p is MathFluencyProgress => p !== null)
  } catch (error) {
    console.error('Error fetching all fluency progress:', error)
    throw error
  }
}

/**
 * Create initial fluency progress document from diagnostic results
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
      
      totalPracticeDays: 0,
      consecutivePracticeDays: 0,
      lastPracticeDate: null,
      practiceDatesLog: [],
      
      lastAssessmentDate: null,
      lastAssessmentScore: null,
      assessmentHistory: [],
      
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy
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
      console.error('Problem not found in any bank:', problemId)
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
    
    // Save updated progress
    const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
    await updateDoc(docRef, progress as any)
    
    console.log(`✅ Updated problem ${problemId} in fluency progress`)
  } catch (error) {
    console.error('Error updating problem in progress:', error)
    throw error
  }
}

// ============================================================================
// MATH FLUENCY ASSESSMENTS OPERATIONS
// ============================================================================

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

