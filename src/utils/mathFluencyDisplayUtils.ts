/**
 * Math Fluency Display Utilities
 * 
 * Utility functions for formatting and displaying math fluency data
 */

import type { OperationType, MathFluencyPracticeSession } from '@/types/mathFluency'

/**
 * Capitalize the first letter of an operation name
 */
export function capitalizeOperation(op: OperationType | string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

/**
 * Get the symbol for a math operation
 */
export function getOperationSymbol(operation: OperationType | undefined): string {
  if (!operation) return '+'
  const symbols = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷',
  }
  return symbols[operation] || '+'
}

/**
 * Get display text for session quality
 */
export function getSessionQualityDisplay(
  sessionQuality: MathFluencyPracticeSession['sessionQuality'],
): string {
  const qualities = {
    excellent: '🏆 Excellent',
    good: '⭐ Good',
    fair: '👍 Fair',
    incomplete: '⚠️ Incomplete',
  }
  return qualities[sessionQuality as keyof typeof qualities] || 'Good'
}

/**
 * Get CSS class for diagnostic score
 */
export function getDiagnosticScoreClass(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  return 'needs-work'
}

