/**
 * Math Fluency Problem Utilities
 * 
 * Utility functions for working with ProblemProgress objects
 * These are specific to ProblemProgress and complement the general
 * utilities in mathFluencyProblemGenerator.ts
 */

import { Timestamp } from 'firebase/firestore'
import type { ProblemProgress, OperationType, SubLevel } from '@/types/mathFluency'
import { getSubLevelConfig } from '@/config/fluencySubLevels'

/**
 * Deduplicate problems by problemId only
 */
export function deduplicateByProblemId(problems: ProblemProgress[]): ProblemProgress[] {
  const seen = new Set<string>()
  return problems.filter((p) => {
    if (seen.has(p.problemId)) return false
    seen.add(p.problemId)
    return true
  })
}

/**
 * Deduplicate problems by both problemId AND displayText
 * This is more aggressive and catches duplicates even if problemId differs
 */
export function deduplicateByProblemIdAndText(problems: ProblemProgress[]): ProblemProgress[] {
  const seenIds = new Set<string>()
  const seenTexts = new Set<string>()
  return problems.filter((p) => {
    const isDup = seenIds.has(p.problemId) || seenTexts.has(p.displayText)
    if (!isDup) {
      seenIds.add(p.problemId)
      seenTexts.add(p.displayText)
    }
    return !isDup
  })
}

/**
 * Sample random unique problems, ensuring no duplicates by problemId OR displayText
 * This is more strict than the version in mathFluencyProblemGenerator.ts
 * which only checks problemId
 */
export function sampleRandomUniqueStrict(
  problems: ProblemProgress[],
  count: number,
): ProblemProgress[] {
  if (problems.length <= count) return deduplicateByProblemIdAndText(problems)

  // Shuffle first
  const shuffled = [...problems]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Sample ensuring uniqueness by both ID and text
  const sampled: ProblemProgress[] = []
  const seenIds = new Set<string>()
  const seenTexts = new Set<string>()

  for (const problem of shuffled) {
    if (sampled.length >= count) break
    if (!seenIds.has(problem.problemId) && !seenTexts.has(problem.displayText)) {
      seenIds.add(problem.problemId)
      seenTexts.add(problem.displayText)
      sampled.push(problem)
    }
  }

  return sampled
}

/**
 * Create a ProblemProgress object from problem parameters
 */
export function createProblemProgress(
  num1: number,
  num2: number,
  operation: OperationType,
  studentUid: string,
): ProblemProgress {
  const problemId = `${num1}_${operation}_${num2}_${studentUid}`
  const now = Timestamp.now()

  let correctAnswer = '',
    displayText = ''
  if (operation === 'addition') {
    correctAnswer = (num1 + num2).toString()
    displayText = `${num1} + ${num2}`
  } else if (operation === 'subtraction') {
    correctAnswer = (num1 - num2).toString()
    displayText = `${num1} - ${num2}`
  } else if (operation === 'multiplication') {
    correctAnswer = (num1 * num2).toString()
    displayText = `${num1} × ${num2}`
  } else if (operation === 'division') {
    correctAnswer = (num1 / num2).toString()
    displayText = `${num1} ÷ ${num2}`
  }

  return {
    problemId,
    num1,
    num2,
    operation,
    correctAnswer,
    displayText,
    category: '',
    factFamily: '',
    difficulty: 1,
    proficiencyLevel: 'doesNotKnow',
    last5Attempts: [],
    proficiencyCalculation: {
      correctOutOfLast5: 0,
      averageTimeOfLast5: null,
      last5Trend: 'stable',
      confidenceLevel: 'low',
    },
    consecutiveCorrectDays: 0,
    daysInCurrentLevel: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    responseTimes: [],
    averageResponseTime: null,
    fastestResponseTime: null,
    slowestResponseTime: null,
    firstAttemptDate: now,
    lastAttemptDate: now,
    dateEnteredEmerging: null,
    dateEnteredApproaching: null,
    dateEnteredProficient: null,
    dateEnteredMastered: null,
    dailyResults: [],
    commonErrors: [],
    errorPattern: null,
    needsStrategyInstruction: false,
    flaggedForReview: false,
    regressionCount: 0,
    lastRegressionDate: null,
  }
}

/**
 * Generate all problems for a given sub-level
 */
export function generateProblemsForSubLevel(
  subLevel: SubLevel,
  studentUid: string,
): ProblemProgress[] {
  const config = getSubLevelConfig(subLevel)
  if (!config) return []

  const allProblems: ProblemProgress[] = []

  if (config.operation === 'addition') {
    for (let num1 = 2; num1 <= 20; num1++) {
      for (let num2 = 2; num2 <= 20; num2++) {
        const sum = num1 + num2
        if (config.problemFilter(num1, num2, sum)) {
          allProblems.push(createProblemProgress(num1, num2, config.operation, studentUid))
        }
      }
    }
  } else if (config.operation === 'subtraction') {
    for (let num1 = 2; num1 <= 20; num1++) {
      for (let num2 = 2; num2 <= num1; num2++) {
        const difference = num1 - num2
        if (config.problemFilter(num1, num2, difference)) {
          allProblems.push(createProblemProgress(num1, num2, config.operation, studentUid))
        }
      }
    }
  } else if (config.operation === 'multiplication') {
    for (let num1 = 2; num1 <= 12; num1++) {
      for (let num2 = 2; num2 <= 12; num2++) {
        const product = num1 * num2
        if (config.problemFilter(num1, num2, product)) {
          allProblems.push(createProblemProgress(num1, num2, config.operation, studentUid))
        }
      }
    }
  } else if (config.operation === 'division') {
    for (let num1 = 4; num1 <= 144; num1++) {
      for (let num2 = 2; num2 <= 12; num2++) {
        if (num1 % num2 === 0) {
          const quotient = num1 / num2
          if (config.problemFilter(num1, num2, quotient)) {
            allProblems.push(createProblemProgress(num1, num2, config.operation, studentUid))
          }
        }
      }
    }
  }

  return allProblems
}

/**
 * Check if a problem belongs to a specific sub-level
 */
export function problemBelongsToSubLevel(problem: ProblemProgress, subLevel: SubLevel): boolean {
  const config = getSubLevelConfig(subLevel)
  if (!config || problem.operation !== config.operation) return false

  let result: number
  if (problem.operation === 'addition') result = problem.num1 + problem.num2
  else if (problem.operation === 'subtraction') result = problem.num1 - problem.num2
  else if (problem.operation === 'multiplication') result = problem.num1 * problem.num2
  else result = problem.num1 / problem.num2

  return config.problemFilter(problem.num1, problem.num2, result)
}

/**
 * Get display string for a problem ID
 * Extracts readable format from problemId (e.g., "7_addition_8_studentId" -> "7+8")
 */
export function getProblemDisplay(problemId: string): string {
  const parts = problemId.split('_')
  if (parts.length >= 3) {
    const num1 = parts[0]
    const operation = parts[1]
    const num2 = parts[2]
    const opSymbol =
      operation === 'addition'
        ? '+'
        : operation === 'subtraction'
          ? '-'
          : operation === 'multiplication'
            ? '×'
            : '÷'
    return `${num1}${opSymbol}${num2}`
  }
  return problemId
}

