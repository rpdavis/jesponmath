/**
 * Math Fluency Visual Utilities
 * 
 * Utility functions for determining when and how to display visual representations
 * of math problems (ten-frames, number lines, arrays, etc.)
 */

import type { ProblemProgress } from '@/types/mathFluency'

/**
 * Get the numeric answer from a problem
 */
export function getAnswerNumber(problem: ProblemProgress | undefined): number {
  if (!problem) return 0
  return parseInt(problem.correctAnswer) || 0
}

/**
 * Determine if visual representations should be shown for a problem
 * Currently only shows visuals for addition/subtraction with answers <= 20
 */
export function shouldShowVisuals(problem: ProblemProgress | undefined): boolean {
  if (!problem) return false

  if (problem.operation === 'addition' || problem.operation === 'subtraction') {
    const answer = getAnswerNumber(problem)
    return answer <= 20 && answer >= 0
  }

  return false
}

