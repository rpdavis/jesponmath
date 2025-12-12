/**
 * Utility functions for handling multiple standards per question
 */

import type { CustomStandard } from '@/types/standards'

/**
 * Result of a standard score calculation
 */
export interface StandardScoreResult {
  correct: number
  total: number
  percentage: number
}

/**
 * A single question attempt with correctness and score
 */
export interface QuestionAttempt {
  isCorrect: boolean
  score: number
}

/**
 * Calculate standard score using the appropriate scoring method
 *
 * This is the single source of truth for all standard score calculations.
 * It supports three scoring methods:
 *
 * 1. **keepTop**: Takes the top scoring attempts up to maxScore limit
 *    - Sorts attempts by score (highest first)
 *    - Takes top N attempts where N = maxScore
 *    - Denominator is fixed at maxScore
 *    - Use case: "Best N out of M attempts"
 *
 * 2. **average**: Calculates average percentage across all attempts
 *    - Each attempt is either 100% (correct) or 0% (incorrect)
 *    - Returns average of all attempt percentages
 *    - Denominator is total number of attempts
 *    - Use case: "Overall performance across all attempts"
 *
 * 3. **additive** (default): Counts all attempts, no filtering
 *    - All correct answers count toward numerator
 *    - All attempts count toward denominator
 *    - maxScore is NOT used to filter attempts (unlike keepTop)
 *    - Use case: "Total correct out of total attempted"
 *
 * @param questionAttempts - Array of question attempts with isCorrect and score
 * @param customStandard - Custom standard metadata (contains maxScore and scoringMethod)
 * @returns StandardScoreResult with correct, total, and percentage
 */
export function calculateStandardScore(
  questionAttempts: QuestionAttempt[],
  customStandard: CustomStandard | null,
): StandardScoreResult {
  // If no attempts, return 0/0
  if (questionAttempts.length === 0) {
    return { correct: 0, total: 0, percentage: 0 }
  }

  const scoringMethod = customStandard?.scoringMethod || 'additive'
  const maxScore = customStandard?.maxScore

  let correct = 0
  let total = 0
  let percentage = 0

  if (scoringMethod === 'keepTop') {
    // Keep Top Score: Takes highest scoring attempts up to maxScore limit
    // Sort all question attempts by score (best first)
    const sortedAttempts = [...questionAttempts].sort((a, b) => b.score - a.score)

    if (maxScore && maxScore > 0) {
      // Take top maxScore questions (best performance)
      const topAttempts = sortedAttempts.slice(0, maxScore)
      correct = topAttempts.filter((attempt) => attempt.isCorrect).length
      total = maxScore // Use maxScore as fixed denominator
      percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    } else {
      // No max score set - use all attempts
      correct = sortedAttempts.filter((attempt) => attempt.isCorrect).length
      total = sortedAttempts.length
      percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    }
  } else if (scoringMethod === 'average') {
    // Average Scores: Calculate average percentage across all attempts
    const attemptPercentages = questionAttempts.map((attempt) => (attempt.isCorrect ? 100 : 0))
    percentage = Math.round(
      attemptPercentages.reduce((sum: number, pct: number) => sum + pct, 0) /
        attemptPercentages.length,
    )
    correct = Math.round((percentage / 100) * questionAttempts.length)
    total = questionAttempts.length
  } else {
    // Additive (default): All attempts count, no filtering
    // IMPORTANT: Unlike keepTop, this does NOT sort or slice attempts
    // Every attempt counts - both in numerator (if correct) and denominator
    correct = questionAttempts.filter((attempt) => attempt.isCorrect).length
    total = questionAttempts.length
    percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  }

  return { correct, total, percentage }
}

/**
 * Parse a standards string into an array of individual standards
 * @param standardsString - String with standards separated by ';'
 * @returns Array of individual standards, trimmed and filtered
 */
export const parseStandards = (standardsString?: string): string[] => {
  if (!standardsString || typeof standardsString !== 'string') {
    return []
  }

  return standardsString
    .split(';')
    .map((standard) => standard.trim())
    .filter((standard) => standard.length > 0)
}

/**
 * Format an array of standards into a display string
 * @param standards - Array of standards
 * @returns Formatted string for display
 */
export const formatStandardsForDisplay = (standards: string[]): string => {
  if (!standards || standards.length === 0) {
    return ''
  }

  if (standards.length === 1) {
    return standards[0]
  }

  if (standards.length === 2) {
    return standards.join(' & ')
  }

  return standards.slice(0, -1).join(', ') + ' & ' + standards[standards.length - 1]
}

/**
 * Join standards array back into a string for storage
 * @param standards - Array of standards
 * @returns String with standards joined by ';'
 */
export const joinStandards = (standards: string[]): string => {
  return standards
    .filter((standard) => standard && standard.trim().length > 0)
    .map((standard) => standard.trim())
    .join('; ')
}

/**
 * Check if a question satisfies a specific standard
 * @param question - Assessment question
 * @param targetStandard - Standard to check for
 * @returns True if question covers the target standard
 */
export const questionCoversStandard = (question: any, targetStandard: string): boolean => {
  if (!question || !targetStandard) {
    return false
  }

  const questionStandards = parseStandards(question.standard)
  return questionStandards.some(
    (standard) =>
      standard.toLowerCase().includes(targetStandard.toLowerCase()) ||
      targetStandard.toLowerCase().includes(standard.toLowerCase()),
  )
}

/**
 * Get all unique standards from a list of questions
 * @param questions - Array of assessment questions
 * @returns Array of unique standards
 */
export const getAllStandardsFromQuestions = (questions: any[]): string[] => {
  const allStandards = new Set<string>()

  questions.forEach((question) => {
    const standards = parseStandards(question.standard)
    standards.forEach((standard) => allStandards.add(standard))
  })

  return Array.from(allStandards).sort()
}

/**
 * Group questions by standards (a question can appear in multiple groups)
 * @param questions - Array of assessment questions
 * @returns Object with standards as keys and arrays of questions as values
 */
export const groupQuestionsByStandards = (questions: any[]): Record<string, any[]> => {
  const groups: Record<string, any[]> = {}

  questions.forEach((question) => {
    const standards = parseStandards(question.standard)

    if (standards.length === 0) {
      // Handle questions without standards
      if (!groups['No Standard']) {
        groups['No Standard'] = []
      }
      groups['No Standard'].push(question)
    } else {
      // Add question to each standard group
      standards.forEach((standard) => {
        if (!groups[standard]) {
          groups[standard] = []
        }
        groups[standard].push(question)
      })
    }
  })

  return groups
}
