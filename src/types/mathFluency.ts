// Math Fluency System Type Definitions
// Based on MATH_FLUENCY_DATA_PLAN.md

import type { Timestamp } from 'firebase/firestore'

// ============================================================================
// PROFICIENCY LEVELS
// ============================================================================

export type ProficiencyLevel =
  | 'doesNotKnow' // Incorrect on assessments
  | 'emerging' // Correct 1-2 of last 5 attempts
  | 'approaching' // Correct 3-4 of last 5, or correct but slow (6-12s)
  | 'proficient' // Correct 4-5 of last 5, under 6s avg
  | 'mastered' // Perfect last 5, under 3s avg

export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division'

// ============================================================================
// SUB-LEVEL PROGRESSION (Progressive Mastery System)
// ============================================================================

export type SubLevel =
  // Addition Sub-Levels (3 levels)
  | 'addition_within_10' // 36 problems: sums 2-10
  | 'addition_within_20' // 45 problems: sums 11-20
  | 'addition_mixed' // 30 problems: mixed review

  // Subtraction Sub-Levels (3 levels)
  | 'subtraction_within_10' // 36 problems: from 2-10
  | 'subtraction_within_20' // 90 problems: from 11-20
  | 'subtraction_mixed' // 30 problems: mixed review

  // Multiplication Sub-Levels (4 levels)
  | 'multiplication_easy' // 29 problems: ×0,1,2,5,10 (pattern-based)
  | 'multiplication_medium' // 31 problems: ×3,4,6 + squares
  | 'multiplication_hard' // 36 problems: ×7,8,9,11,12
  | 'multiplication_mixed' // 40 problems: mixed review

  // Division Sub-Levels (4 levels)
  | 'division_easy' // 36 problems: ÷2,5,10
  | 'division_medium' // 36 problems: ÷3,4,6
  | 'division_hard' // 60 problems: ÷7,8,9,11,12
  | 'division_mixed' // 40 problems: mixed review

export type AssessmentType =
  | 'initial-diagnostic' // Week 0: All 100 problems tested
  | 'weekly-fluency-check' // Friday: 1-minute probe
  | 'comprehensive-review' // Periodic full review

export type FluencyLevel =
  | 'mastered' // 40+ CPM
  | 'proficient' // 30-39 CPM
  | 'developing' // 20-29 CPM
  | 'emerging' // 10-19 CPM
  | 'needs-support' // <10 CPM

export type SessionRound =
  | 'learning' // Round 1: Unmet facts
  | 'practice' // Round 2: Interleaved practice
  | 'assessment' // Round 3: Quick check
  | 'weekly-check' // Friday paper assessment

export type AttemptSource =
  | 'initial-diagnostic'
  | 'paper-assessment'
  | 'digital-practice'
  | 'digital-assessment'

// ============================================================================
// PROBLEM-LEVEL TRACKING
// ============================================================================

export interface ProblemAttempt {
  date: Timestamp
  correct: boolean
  responseTime: number | null // milliseconds, null for paper
  source: AttemptSource
  assessmentId?: string
  sessionId?: string
}

export interface ProficiencyCalculation {
  correctOutOfLast5: number // e.g., 3 out of 5
  averageTimeOfLast5: number | null // Average response time (ms)
  last5Trend: 'improving' | 'stable' | 'regressing'
  confidenceLevel: 'low' | 'medium' | 'high' // Low if <5 total attempts
}

export interface DailyResult {
  date: string // YYYY-MM-DD format
  correct: boolean
  responseTime: number | null
  round: SessionRound
  assessmentId?: string
}

export type ChallengeType =
  | 'next-level' // Preview of next sub-level
  | 'previous-operation' // Review from previous operation
  | 'previous-level' // Review from previous sub-level
  | null

export interface ProblemProgress {
  // Problem Identification
  problemId: string // e.g., "ADD_7_8"
  num1: number
  num2: number
  operation: OperationType
  correctAnswer: string
  displayText: string // "7 + 8 = ?"

  // Categorization (for analysis)
  category: string // "Doubles", "Make 10", "7s facts", etc.
  factFamily: string // More specific grouping
  difficulty: number // 1-5 scale

  // Current Proficiency (DERIVED FROM LAST 5 ATTEMPTS)
  proficiencyLevel: ProficiencyLevel

  // ⭐ Challenge Problem Tracking
  isChallenge?: boolean // True if this is a challenge problem
  challengeType?: ChallengeType // Type of challenge
  isOperationChange?: boolean // True if operation differs from current
  challengeMessage?: string // Custom message explaining the challenge

  // ⭐ LAST 5 ATTEMPTS TRACKING (Core of proficiency calculation)
  last5Attempts: ProblemAttempt[]

  // Proficiency Calculation (auto-computed from last5Attempts)
  proficiencyCalculation: ProficiencyCalculation

  // Progression Tracking
  consecutiveCorrectDays: number // Days in a row correct
  daysInCurrentLevel: number // How long in this proficiency level
  totalAttempts: number // All-time attempts
  correctAttempts: number // All-time correct

  // Timing Data (last 10 for broader trend)
  responseTimes: number[] // Last 10 response times (ms), null for paper
  averageResponseTime: number | null
  fastestResponseTime: number | null
  slowestResponseTime: number | null

  // History
  firstAttemptDate: Timestamp
  lastAttemptDate: Timestamp
  dateEnteredEmerging: Timestamp | null
  dateEnteredApproaching: Timestamp | null
  dateEnteredProficient: Timestamp | null
  dateEnteredMastered: Timestamp | null

  // Daily Practice Tracking (for 3-day consecutive rule)
  dailyResults: DailyResult[]

  // Error Analysis
  commonErrors: string[] // Student's common wrong answers
  errorPattern: 'calculation' | 'strategy' | 'careless' | 'unknown' | null
  needsStrategyInstruction: boolean

  // Flags
  flaggedForReview: boolean
  regressionCount: number
  lastRegressionDate: Timestamp | null
}

// ============================================================================
// COLLECTION 1: mathFluencyProgress
// ============================================================================

export interface ProficiencyDistribution {
  doesNotKnow: number
  emerging: number
  approaching: number
  proficient: number
  mastered: number
  total: number
}

export interface AssessmentHistoryEntry {
  date: Timestamp
  correctPerMinute: number
  accuracy: number
  totalAttempted: number
  totalCorrect: number
}

export interface ProblemBanks {
  doesNotKnow: ProblemProgress[]
  emerging: ProblemProgress[]
  approaching: ProblemProgress[]
  proficient: ProblemProgress[]
  mastered: ProblemProgress[]
}

/**
 * Sub-Level Progress Tracking
 * Each sub-level has its own progression and assessment history
 */
export interface SubLevelProgress {
  subLevel: SubLevel
  operation: OperationType

  // Unlock Status
  unlocked: boolean
  unlockedDate: Timestamp | null
  completed: boolean
  completedDate: Timestamp | null

  // Proficiency Tracking (within this sub-level)
  totalProblems: number // Total problems in this sub-level
  proficiencyPercentage: number // (approaching + proficient + mastered) / total
  masteryPercentage: number // (proficient + mastered) / total

  // Assessment Readiness
  readyForAssessment: boolean // True if proficiencyPercentage >= 85%
  assessmentAttempts: number // How many times tested

  // Paper Assessment History
  lastAssessmentDate: Timestamp | null
  lastAssessmentScore: number | null // Percentage
  lastAssessmentCPM: number | null // Correct per minute

  assessmentHistory: {
    date: Timestamp
    correctCount: number
    totalQuestions: number
    timeSeconds: number
    cpm: number
    passed: boolean // True if >= 90% accuracy
    assessmentId: string
  }[]

  // Practice Stats (within this sub-level)
  practiceDays: number
  lastPracticeDate: Timestamp | null

  // Progression
  canAdvance: boolean // True if passed assessment
  advancedDate: Timestamp | null
}

export interface MathFluencyProgress {
  // Identification
  id: string // Firestore doc ID
  studentUid: string
  studentName: string
  operation: OperationType

  // Operation Status
  currentlyPracticing: boolean
  unlocked: boolean
  completedOperation: boolean
  unlockedDate: Timestamp | null
  completedDate: Timestamp | null

  // Problem Banks (5 proficiency levels)
  problemBanks: ProblemBanks

  // Distribution Statistics
  proficiencyDistribution: ProficiencyDistribution

  // Proficiency Metrics
  proficiencyPercentage: number // (approaching + proficient + mastered) / total
  masteryPercentage: number // (proficient + mastered) / total
  canUnlockNext: boolean // True if proficiencyPercentage >= 95%

  // ⭐ NEW: Sub-Level Progression Tracking
  currentSubLevel: SubLevel | null // Current sub-level student is working on
  completedSubLevels: SubLevel[] // Array of completed sub-levels
  subLevelProgress: { [key: string]: SubLevelProgress } // Detailed tracking per sub-level

  // Practice Tracking
  totalPracticeDays: number
  consecutivePracticeDays: number
  lastPracticeDate: Timestamp | null
  practiceDatesLog: Timestamp[]

  // Assessment Tracking
  lastAssessmentDate: Timestamp | null
  lastAssessmentScore: number | null // CPM
  assessmentHistory: AssessmentHistoryEntry[]

  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string // Teacher UID

  // Practice Frequency Control (Teacher Setting)
  dailyPracticeLimit?: 1 | 2 | 3 | 999 // 999 = unlimited (optional for backward compatibility)
}

// ============================================================================
// COLLECTION 2: mathFluencyAssessments
// ============================================================================

export interface ProblemResult {
  problemId: string
  problemNumber: number // Position on sheet (1-60)
  num1: number
  num2: number
  operation: OperationType
  correctAnswer: string
  displayText: string

  // This assessment's result
  wasAttempted: boolean
  isCorrect: boolean
  studentAnswer?: string
  responseTime: number | null // null for paper

  // Historical tracking (last 5 attempts)
  last5Attempts: ProblemAttempt[]

  // Derived proficiency (from last 5)
  currentProficiencyLevel: ProficiencyLevel
  proficiencyCalculation: ProficiencyCalculation

  // Category for analysis
  category: string
  factFamily: string
}

export interface GrowthMetrics {
  cpmChange: number
  accuracyChange: number
  proficiencyLevelChange: string
}

export interface PromotionMetrics {
  emergingToApproaching: number
  approachingToProficient: number
  proficientToMastered: number
  totalPromoted: number
}

export interface DemotionMetrics {
  masteredToProficient: number
  proficientToApproaching: number
  approachingToEmerging: number
  emergingToDoesNotKnow: number
  totalDemoted: number
}

export interface MathFluencyAssessment {
  // Identification
  id: string // Firestore doc ID or teacher-entered
  assessmentName: string
  studentUid: string
  studentName: string
  teacherUid: string

  // Assessment Details
  assessmentType: AssessmentType
  assessmentCategory: OperationType | 'mixed'
  week: number // 0 for initial diagnostic
  assessmentDate: Timestamp

  // Format
  deliveryMethod: 'paper' | 'digital'
  timeLimit: number // seconds

  // Overall Results
  totalProblemsAttempted: number
  totalProblemsCorrect: number
  totalProblemsIncorrect: number
  totalProblemsOnAssessment: number
  accuracy: number // percentage

  // Fluency Metrics
  correctPerMinute: number
  incorrectPerMinute: number
  fluencyLevel: FluencyLevel

  // Problem-Level Data (optional - if detailed entry)
  problemResults: ProblemResult[] | null

  // Growth Tracking
  growthFromLastWeek: GrowthMetrics | null

  // Problem Bank Impact
  promotions: PromotionMetrics
  demotions: DemotionMetrics

  // Focus Areas Identified
  weakFactFamilies: string[]
  errorPatterns: string[]

  // Metadata
  scoredBy: string // Teacher UID
  scoredAt: Timestamp
  entryMethod: 'quick' | 'detailed'
  notes: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// COLLECTION 3: mathFluencyPracticeSessions
// ============================================================================

export interface LearningRoundData {
  problemsTargeted: string[] // Problem IDs
  problemsCompleted: string[]
  problemsStillUnmet: string[]

  attemptsPerProblem: {
    [problemId: string]: {
      encodingCycles: number // Times shown answer
      recallAttempts: number // Times tested
      finalResult: 'learned' | 'retry-later' | 'incomplete'
      timesSpent: number[]
    }
  }

  newlyLearned: string[] // Moved to "emerging"
  timeSpent: number
  completed: boolean
}

export interface PracticeRoundData {
  problemsPresented: string[]
  problemsMixed: boolean

  mixComposition: {
    emerging: number
    proficient: number
    mastered: number
  }

  results: {
    [problemId: string]: {
      attempts: number
      correct: boolean
      responseTimes: number[]
      returnedToStack: boolean
    }
  }

  accuracy: number
  averageResponseTime: number
  timeSpent: number
  completed: boolean
}

export interface AssessmentRoundData {
  problemsAssessed: string[]

  results: {
    [problemId: string]: {
      correct: boolean
      responseTime: number
      previousLevel: ProficiencyLevel
      maintainedLevel: boolean
    }
  }

  accuracy: number
  averageResponseTime: number
  timeSpent: number
  completed: boolean
}

export interface MathFluencyPracticeSession {
  // Identification
  id: string
  studentUid: string
  studentName: string
  operation: OperationType

  // Session Info
  sessionDate: Timestamp
  dayOfWeek: number // 1=Monday, 2=Tuesday, etc.
  weekNumber: number

  // Session Completion
  completed: boolean
  completionPercentage: number
  totalTimeSpent: number

  // Round 1: Learning
  round1_learning: LearningRoundData

  // Round 2: Practice
  round2_practice: PracticeRoundData

  // Round 3: Assessment
  round3_assessment: AssessmentRoundData

  // Diagnostic Results (optional - only present if diagnostic round completed)
  diagnosticResults?: {
    [problemId: string]: { correct: boolean; responseTime: number }
  }

  // Session Outcomes
  promotionsEarned: string[]
  demotionsOccurred: string[]
  consecutiveDaysUpdated: {
    [problemId: string]: number
  }

  // Session Quality
  sessionQuality: 'excellent' | 'good' | 'fair' | 'incomplete'
  engagementScore: number

  // Metadata
  createdAt: Timestamp
  completedAt: Timestamp | null
}

// ============================================================================
// HELPER TYPES & UTILITIES
// ============================================================================

export interface MathFactProblem {
  id: string
  num1: number
  num2: number
  operation: OperationType
  correctAnswer: string
  displayText: string
  category: string
  factFamily: string
}

export interface FluencyMetrics {
  correctPerMinute: number
  accuracy: number
  proficiencyLevel: ProficiencyLevel
  averageResponseTime: number | null
}

export interface OperationUnlockStatus {
  operation: OperationType
  unlocked: boolean
  proficiency: number
  canUnlockNext: boolean
  estimatedWeeksToCompletion: number
}

// ============================================================================
// PROFICIENCY CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate proficiency level based on last 5 attempts
 * Uses both accuracy (correct count) and speed (avg time)
 */
export function calculateProficiencyFromLast5(
  correctCount: number,
  avgTime: number | null,
): ProficiencyLevel {
  // 0-2 correct out of 5 = low proficiency
  if (correctCount === 0) return 'doesNotKnow'
  if (correctCount <= 2) return 'emerging'

  // 3-5 correct - use timing to differentiate
  if (avgTime === null) {
    // Paper only - no timing data available
    if (correctCount === 5) return 'proficient' // Perfect accuracy
    if (correctCount === 4) return 'approaching'
    return 'emerging' // 3 correct
  }

  // Have timing data - use speed + accuracy
  if (correctCount === 5) {
    // Perfect accuracy (5/5) - differentiate by speed
    if (avgTime < 3000) return 'mastered' // <3s = automatic
    if (avgTime < 6000) return 'proficient' // 3-6s = fluent
    return 'approaching' // >6s but accurate
  }

  if (correctCount === 4) {
    // 80% accuracy (4/5)
    if (avgTime < 6000) return 'proficient' // <6s = fluent
    return 'approaching' // Slower but mostly correct
  }

  // 60% accuracy (3/5)
  return 'emerging'
}

/**
 * Determine fluency level from correct per minute (CPM) score
 */
export function calculateFluencyLevel(correctPerMinute: number): FluencyLevel {
  if (correctPerMinute >= 40) return 'mastered'
  if (correctPerMinute >= 30) return 'proficient'
  if (correctPerMinute >= 20) return 'developing'
  if (correctPerMinute >= 10) return 'emerging'
  return 'needs-support'
}

/**
 * Calculate trend from chronological array of attempts
 */
export function calculateTrend(attempts: ProblemAttempt[]): 'improving' | 'stable' | 'regressing' {
  if (attempts.length < 3) return 'stable'

  // Compare first half vs second half
  const midpoint = Math.floor(attempts.length / 2)
  const firstHalf = attempts.slice(0, midpoint)
  const secondHalf = attempts.slice(midpoint)

  const firstHalfCorrect = firstHalf.filter((a) => a.correct).length / firstHalf.length
  const secondHalfCorrect = secondHalf.filter((a) => a.correct).length / secondHalf.length

  if (secondHalfCorrect > firstHalfCorrect + 0.2) return 'improving'
  if (secondHalfCorrect < firstHalfCorrect - 0.2) return 'regressing'
  return 'stable'
}

/**
 * Check if problem should be promoted to next proficiency level
 */
export function shouldPromoteProblem(
  problem: ProblemProgress,
  consecutiveDaysRequired: number = 3,
): boolean {
  // Must have enough correct in last 5
  if (problem.proficiencyCalculation.correctOutOfLast5 < 4) return false

  // Must have consecutive days
  if (problem.consecutiveCorrectDays < consecutiveDaysRequired) return false

  // Must be improving or stable (not regressing)
  if (problem.proficiencyCalculation.last5Trend === 'regressing') return false

  // Check speed requirements for higher levels
  const avgTime = problem.proficiencyCalculation.averageTimeOfLast5

  if (problem.proficiencyLevel === 'proficient' && avgTime !== null) {
    // Proficient → Mastered requires <3s average
    return avgTime < 3000
  }

  if (problem.proficiencyLevel === 'approaching' && avgTime !== null) {
    // Approaching → Proficient requires <6s average
    return avgTime < 6000
  }

  // Emerging → Approaching just needs consecutive correct days
  return true
}

/**
 * Determine next proficiency level
 */
export function getNextProficiencyLevel(current: ProficiencyLevel): ProficiencyLevel | null {
  const levels: ProficiencyLevel[] = [
    'doesNotKnow',
    'emerging',
    'approaching',
    'proficient',
    'mastered',
  ]

  const currentIndex = levels.indexOf(current)
  if (currentIndex < 0 || currentIndex >= levels.length - 1) return null

  return levels[currentIndex + 1]
}

/**
 * Determine previous proficiency level (for demotion)
 */
export function getPreviousProficiencyLevel(current: ProficiencyLevel): ProficiencyLevel | null {
  const levels: ProficiencyLevel[] = [
    'doesNotKnow',
    'emerging',
    'approaching',
    'proficient',
    'mastered',
  ]

  const currentIndex = levels.indexOf(current)
  if (currentIndex <= 0) return null

  return levels[currentIndex - 1]
}

/**
 * Calculate average from array of numbers (excluding nulls)
 */
export function calculateAverage(numbers: (number | null)[]): number | null {
  const validNumbers = numbers.filter((n): n is number => n !== null && !isNaN(n))
  if (validNumbers.length === 0) return null

  const sum = validNumbers.reduce((acc, n) => acc + n, 0)
  return sum / validNumbers.length
}

/**
 * Get next operation in sequence
 */
export function getNextOperation(current: OperationType): OperationType | null {
  const sequence: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  const currentIndex = sequence.indexOf(current)

  if (currentIndex < 0 || currentIndex >= sequence.length - 1) return null
  return sequence[currentIndex + 1]
}

/**
 * Get previous operation in sequence
 */
export function getPreviousOperation(current: OperationType): OperationType | null {
  const sequence: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  const currentIndex = sequence.indexOf(current)

  if (currentIndex <= 0) return null
  return sequence[currentIndex - 1]
}
