// Cloud Functions for Math Fluency System
// Handles automatic progress updates when practice sessions complete

import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { FirestoreEvent, Change } from 'firebase-functions/v2/firestore'
import { DocumentSnapshot, Timestamp, getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()

// Helper types (simplified versions)
type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division'
type ProficiencyLevel = 'doesNotKnow' | 'emerging' | 'approaching' | 'proficient' | 'mastered'

interface ProblemProgress {
  problemId: string
  num1: number
  num2: number
  operation: OperationType
  correctAnswer: number
  displayText: string
  proficiencyLevel: ProficiencyLevel
  last5Attempts: Array<{
    date: Timestamp
    correct: boolean
    responseTime: number
    source: string
  }>
  totalAttempts: number
  correctAttempts: number
  responseTimes: number[]
  averageResponseTime: number | null
  fastestResponseTime: number | null
  slowestResponseTime: number | null
  lastAttemptDate: Timestamp | null
  [key: string]: any
}

interface ProblemBanks {
  doesNotKnow: ProblemProgress[]
  emerging: ProblemProgress[]
  approaching: ProblemProgress[]
  proficient: ProblemProgress[]
  mastered: ProblemProgress[]
}

/**
 * Calculate consecutive practice streak
 */
function calculateConsecutiveStreak(practiceDates: (string | Timestamp)[]): number {
  if (practiceDates.length === 0) return 0

  // Convert Timestamps to strings
  const dateStrings = practiceDates
    .map((d) => {
      if (d instanceof Timestamp) {
        return d.toDate().toISOString().split('T')[0]
      }
      return typeof d === 'string' ? d : ''
    })
    .filter((d) => d)

  // Sort dates descending (most recent first)
  const sorted = [...dateStrings].sort().reverse()

  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let checkDate = new Date(today)

  for (const dateStr of sorted) {
    const practiceDate = new Date(dateStr)
    const daysDiff = Math.floor(
      (checkDate.getTime() - practiceDate.getTime()) / (1000 * 60 * 60 * 24),
    )

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
 * Update a problem's proficiency level based on performance
 */
function updateProblemProficiencyLevel(
  problem: ProblemProgress,
  result: { correct: boolean; responseTime: number },
): ProblemProgress {
  const now = Timestamp.now()

  // Add this attempt to history
  const newAttempt = {
    date: now,
    correct: result.correct,
    responseTime: result.responseTime,
    source: 'digital-practice',
  }

  const last5 = [...(problem.last5Attempts || []), newAttempt].slice(-5)

  // Calculate proficiency based on last 5 attempts
  const correctCount = last5.filter((a) => a.correct).length
  const avgTime = last5.reduce((sum, a) => sum + (a.responseTime || 0), 0) / last5.length

  // Determine new proficiency level
  let newLevel: ProficiencyLevel = 'doesNotKnow'
  if (correctCount === 5 && avgTime < 3000) {
    newLevel = 'mastered'
  } else if (correctCount >= 4 && avgTime < 6000) {
    newLevel = 'proficient'
  } else if (correctCount >= 3) {
    newLevel = 'approaching'
  } else if (correctCount >= 1) {
    newLevel = 'emerging'
  }

  // Update response times
  const responseTimes = [...(problem.responseTimes || []), result.responseTime].slice(-10)
  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : null

  return {
    ...problem,
    proficiencyLevel: newLevel,
    last5Attempts: last5,
    totalAttempts: (problem.totalAttempts || 0) + 1,
    correctAttempts: (problem.correctAttempts || 0) + (result.correct ? 1 : 0),
    responseTimes,
    averageResponseTime,
    fastestResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : null,
    slowestResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : null,
    lastAttemptDate: now,
  }
}

/**
 * Clean problem object for Firestore
 */
function cleanProblemForFirestore(problem: ProblemProgress): any {
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
    totalAttempts: problem.totalAttempts || 0,
    correctAttempts: problem.correctAttempts || 0,
    responseTimes: problem.responseTimes || [],
    averageResponseTime: problem.averageResponseTime,
    fastestResponseTime: problem.fastestResponseTime,
    slowestResponseTime: problem.slowestResponseTime,
    firstAttemptDate: problem.firstAttemptDate || Timestamp.now(),
    lastAttemptDate: problem.lastAttemptDate || Timestamp.now(),
  }
}

/**
 * Cloud Function: Triggered when a practice session is saved
 * Updates the student's progress document based on session results
 */
export const onPracticeSessionComplete = onDocumentWritten(
  {
    document: 'mathFluencyPracticeSessions/{sessionId}',
    region: 'us-west1',
  },
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    const afterData = event.data?.after?.data()

    // Only process completed sessions
    if (!afterData || !afterData.completed) {
      console.log('⏭️  Skipping incomplete session')
      return
    }

    const studentUid = afterData.studentUid
    const operation = afterData.operation as OperationType
    const sessionId = event.params.sessionId

    console.log(
      `📊 Processing completed session ${sessionId} for student ${studentUid}, operation: ${operation}`,
    )

    try {
      // Get progress document
      const progressDocRef = db.collection('mathFluencyProgress').doc(`${studentUid}_${operation}`)
      const progressDoc = await progressDocRef.get()

      if (!progressDoc.exists) {
        console.log(`⚠️  No progress document found for ${studentUid}_${operation}`)
        return
      }

      const progressData = progressDoc.data()!
      const problemBanks = progressData.problemBanks as ProblemBanks

      // Collect all problems from all banks
      const allProblems: ProblemProgress[] = [
        ...(problemBanks.doesNotKnow || []),
        ...(problemBanks.emerging || []),
        ...(problemBanks.approaching || []),
        ...(problemBanks.proficient || []),
        ...(problemBanks.mastered || []),
      ]

      // Extract results from session
      const round2Results = afterData.round2_practice?.results || {}
      const round3Results = afterData.round3_assessment?.results || {}

      // Combine all results
      const allResults: { [problemId: string]: { correct: boolean; responseTime: number } } = {}

      // Process round 2 results
      Object.entries(round2Results).forEach(([problemId, result]: [string, any]) => {
        const lastTime =
          result.responseTimes && result.responseTimes.length > 0
            ? result.responseTimes[result.responseTimes.length - 1]
            : 0
        allResults[problemId] = {
          correct: result.correct || false,
          responseTime: lastTime,
        }
      })

      // Process round 3 results
      Object.entries(round3Results).forEach(([problemId, result]: [string, any]) => {
        allResults[problemId] = {
          correct: result.correct || false,
          responseTime: result.responseTime || 0,
        }
      })

      // Update problems based on results
      const problemMap = new Map<string, ProblemProgress>()
      allProblems.forEach((p) => problemMap.set(p.problemId, p))

      const updatedProblems: ProblemProgress[] = []
      for (const problem of allProblems) {
        const result = allResults[problem.problemId]
        if (result) {
          const updated = updateProblemProficiencyLevel(problem, result)
          updatedProblems.push(updated)
          problemMap.set(problem.problemId, updated)
        } else {
          updatedProblems.push(problem)
        }
      }

      // Reorganize into banks by proficiency level
      const updatedBanks: ProblemBanks = {
        doesNotKnow: updatedProblems.filter((p) => p.proficiencyLevel === 'doesNotKnow'),
        emerging: updatedProblems.filter((p) => p.proficiencyLevel === 'emerging'),
        approaching: updatedProblems.filter((p) => p.proficiencyLevel === 'approaching'),
        proficient: updatedProblems.filter((p) => p.proficiencyLevel === 'proficient'),
        mastered: updatedProblems.filter((p) => p.proficiencyLevel === 'mastered'),
      }

      // Calculate new distribution
      const distribution = {
        doesNotKnow: updatedBanks.doesNotKnow.length,
        emerging: updatedBanks.emerging.length,
        approaching: updatedBanks.approaching.length,
        proficient: updatedBanks.proficient.length,
        mastered: updatedBanks.mastered.length,
        total: updatedProblems.length,
      }

      // Calculate proficiency percentage
      const proficiencyPercentage =
        distribution.total > 0
          ? Math.round(
              ((distribution.approaching + distribution.proficient + distribution.mastered) /
                distribution.total) *
                100,
            )
          : 0

      const masteryPercentage =
        distribution.total > 0
          ? Math.round(
              ((distribution.proficient + distribution.mastered) / distribution.total) * 100,
            )
          : 0

      // Update practice dates and streak
      const today = new Date().toISOString().split('T')[0]
      const existingDates = (progressData.practiceDatesLog || [])
        .map((d: any) => {
          if (d instanceof Timestamp) {
            return d.toDate().toISOString().split('T')[0]
          }
          return typeof d === 'string' ? d : ''
        })
        .filter((d: string) => d)

      const practiceDatesLog = [...existingDates, today]
      const consecutiveDays = calculateConsecutiveStreak(practiceDatesLog)

      // Clean banks for Firestore
      const cleanedBanks = {
        doesNotKnow: updatedBanks.doesNotKnow.map(cleanProblemForFirestore),
        emerging: updatedBanks.emerging.map(cleanProblemForFirestore),
        approaching: updatedBanks.approaching.map(cleanProblemForFirestore),
        proficient: updatedBanks.proficient.map(cleanProblemForFirestore),
        mastered: updatedBanks.mastered.map(cleanProblemForFirestore),
      }

      // Update progress document
      await progressDocRef.update({
        problemBanks: cleanedBanks,
        proficiencyDistribution: distribution,
        proficiencyPercentage,
        masteryPercentage,
        canUnlockNext: proficiencyPercentage >= 95,
        lastPracticeDate: Timestamp.now(),
        consecutivePracticeDays: consecutiveDays,
        totalPracticeDays: (progressData.totalPracticeDays || 0) + 1,
        practiceDatesLog,
        updatedAt: Timestamp.now(),
      })

      console.log(`✅ Progress updated for ${studentUid}_${operation}:`, {
        total: distribution.total,
        proficiency: proficiencyPercentage,
        streak: consecutiveDays,
      })
    } catch (error: any) {
      console.error(`❌ Error updating progress for session ${sessionId}:`, error)
      // Don't throw - we don't want to fail the session save
    }
  },
)












