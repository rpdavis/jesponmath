/**
 * Sub-Level Utility Functions
 * Helpers for working with the progressive sub-level system
 */

import type {
  SubLevel,
  OperationType,
  ProblemProgress,
  ProficiencyLevel,
} from '@/types/mathFluency'
import {
  getSubLevelConfig,
  getFirstSubLevel,
  getNextSubLevel,
  getSubLevelsForOperation,
} from '@/config/fluencySubLevels'

/**
 * Determine starting sub-level based on placement diagnostic results
 * Uses proficiency percentage to decide if student can skip ahead
 * ⭐ ENHANCED: Multi-level skip for 7th grade RSP acceleration
 */
export function determineStartingSubLevel(
  operation: OperationType,
  proficiencyPercentage: number,
): SubLevel {
  const subLevels = getSubLevelsForOperation(operation).sort(
    (a, b) => a.operationOrder - b.operationOrder,
  )
  const firstLevel = subLevels[0]

  if (!firstLevel) {
    throw new Error(`No first sub-level found for ${operation}`)
  }

  // ⭐ ENHANCED ACCELERATION LOGIC for 7th grade RSP:
  // - 95%+ proficient → Start at mixed review (skip all basic levels)
  // - 85-94% proficient → Start at level 2 (skip level 1)
  // - 70-84% proficient → Start at level 1 (no skip)
  // - <70% proficient → Start at level 1 with extra support flag

  // Find mixed review level (last non-mixed level + 1, or last level if all are mixed)
  const mixedReviewLevel = subLevels.find((sl) => sl.isMixedReview)
  const lastNonMixedLevel = subLevels.filter((sl) => !sl.isMixedReview).pop()

  // ⭐ ENHANCED LOGGING for testing
  console.group('🎯 PLACEMENT DECISION')
  console.log('Operation:', operation)
  console.log('Diagnostic Proficiency:', `${(proficiencyPercentage * 100).toFixed(1)}%`)

  if (proficiencyPercentage >= 0.95 && mixedReviewLevel) {
    // Highly fluent: Skip directly to mixed review (e.g., Addition Mixed, Subtraction Mixed)
    const skippedLevels = subLevels.filter(
      (sl) => sl.operationOrder < mixedReviewLevel.operationOrder,
    )
    console.log('✅ Decision: HIGH PERFORMER - Skip to Mixed Review')
    console.log('Starting Level:', mixedReviewLevel.shortName)
    console.log(
      'Levels Skipped:',
      skippedLevels.length,
      skippedLevels.map((sl) => sl.shortName),
    )
    console.log('Estimated Time Saved:', `~${skippedLevels.length * 30} minutes`)
    console.groupEnd()
    return mixedReviewLevel.id
  }

  if (proficiencyPercentage >= 0.85 && subLevels.length > 1) {
    // Moderately fluent: Skip first level, start at second
    const secondLevel = subLevels.find((sl) => sl.operationOrder === 2)
    if (secondLevel) {
      console.log('✅ Decision: MODERATE PERFORMER - Skip Level 1')
      console.log('Starting Level:', secondLevel.shortName)
      console.log('Levels Skipped: 1', [firstLevel.shortName])
      console.log('Estimated Time Saved: ~20-30 minutes')
      console.groupEnd()
      return secondLevel.id
    }
  }

  // Start at beginning (standard or struggling students)
  console.log('✅ Decision: STANDARD - Start at Level 1')
  console.log('Starting Level:', firstLevel.shortName)
  console.log('Levels Skipped: 0')
  console.log(
    'Note:',
    proficiencyPercentage < 0.7 ? 'May need extra support' : 'Standard progression',
  )
  console.groupEnd()
  return firstLevel.id
}

/**
 * Analyze cross-operation placement for acceleration
 * Determines if student can skip entire operations based on diagnostic results
 * ⭐ NEW: For 7th grade RSP students with wide skill ranges
 */
export function analyzeCrossOperationPlacement(
  diagnosticResults: {
    operation: OperationType
    proficiencyPercentage: number
    accuracy: number
    averageResponseTime: number
  }[],
): {
  recommendedStartingOperation: OperationType
  recommendedStartingSubLevel: SubLevel | null
  skippedOperations: OperationType[]
  accelerationReason: string
} {
  const additionResult = diagnosticResults.find((r) => r.operation === 'addition')
  const subtractionResult = diagnosticResults.find((r) => r.operation === 'subtraction')
  const multiplicationResult = diagnosticResults.find((r) => r.operation === 'multiplication')
  const divisionResult = diagnosticResults.find((r) => r.operation === 'division')

  // ⭐ ENHANCED LOGGING for testing
  console.group('🚀 CROSS-OPERATION ANALYSIS')
  console.table({
    Addition: {
      proficiency: additionResult
        ? `${(additionResult.proficiencyPercentage * 100).toFixed(1)}%`
        : 'Not tested',
      accuracy: additionResult ? `${(additionResult.accuracy * 100).toFixed(1)}%` : 'N/A',
    },
    Subtraction: {
      proficiency: subtractionResult
        ? `${(subtractionResult.proficiencyPercentage * 100).toFixed(1)}%`
        : 'Not tested',
      accuracy: subtractionResult ? `${(subtractionResult.accuracy * 100).toFixed(1)}%` : 'N/A',
    },
    Multiplication: {
      proficiency: multiplicationResult
        ? `${(multiplicationResult.proficiencyPercentage * 100).toFixed(1)}%`
        : 'Not tested',
      accuracy: multiplicationResult
        ? `${(multiplicationResult.accuracy * 100).toFixed(1)}%`
        : 'N/A',
    },
    Division: {
      proficiency: divisionResult
        ? `${(divisionResult.proficiencyPercentage * 100).toFixed(1)}%`
        : 'Not tested',
      accuracy: divisionResult ? `${(divisionResult.accuracy * 100).toFixed(1)}%` : 'N/A',
    },
  })

  // Scenario 1: Strong in both Addition AND Subtraction (95%+)
  if (
    additionResult &&
    subtractionResult &&
    additionResult.proficiencyPercentage >= 0.95 &&
    subtractionResult.proficiencyPercentage >= 0.95
  ) {
    // Skip directly to Multiplication
    console.log('✅ SCENARIO 1: Skip to Multiplication')
    console.log('Operations Skipped:', ['addition', 'subtraction'])
    console.log('Estimated Time Saved: ~3 hours (~18 sessions)')
    console.groupEnd()
    return {
      recommendedStartingOperation: 'multiplication',
      recommendedStartingSubLevel: getFirstSubLevel('multiplication'),
      skippedOperations: ['addition', 'subtraction'],
      accelerationReason:
        '95%+ proficiency on both addition and subtraction - ready for multiplication',
    }
  }

  // Scenario 2: Strong Addition, Moderate Subtraction
  if (
    additionResult &&
    subtractionResult &&
    additionResult.proficiencyPercentage >= 0.95 &&
    subtractionResult.proficiencyPercentage >= 0.7 &&
    subtractionResult.proficiencyPercentage < 0.95
  ) {
    // Mark addition as complete, start at subtraction (may skip levels)
    const subLevel = determineStartingSubLevel(
      'subtraction',
      subtractionResult.proficiencyPercentage,
    )
    console.log('✅ SCENARIO 2: Skip Addition, Start at Subtraction')
    console.log('Operations Skipped:', ['addition'])
    console.log('Subtraction Starting Level:', subLevel)
    console.log('Estimated Time Saved: ~1 hour (~6 sessions)')
    console.groupEnd()
    return {
      recommendedStartingOperation: 'subtraction',
      recommendedStartingSubLevel: subLevel,
      skippedOperations: ['addition'],
      accelerationReason: '95%+ proficiency on addition - skip to subtraction',
    }
  }

  // Scenario 3: Strong Subtraction, Weak Addition (unlikely but possible)
  if (
    additionResult &&
    subtractionResult &&
    subtractionResult.proficiencyPercentage >= 0.95 &&
    additionResult.proficiencyPercentage < 0.7
  ) {
    // Start at addition (needs support), but mark subtraction as ready
    const subLevel = determineStartingSubLevel('addition', additionResult.proficiencyPercentage)
    return {
      recommendedStartingOperation: 'addition',
      recommendedStartingSubLevel: subLevel,
      skippedOperations: [],
      accelerationReason: 'Strong subtraction but needs addition support first',
    }
  }

  // Default: Start with addition, use standard placement
  const additionSubLevel = additionResult
    ? determineStartingSubLevel('addition', additionResult.proficiencyPercentage)
    : getFirstSubLevel('addition')

  console.log('✅ SCENARIO: Standard Placement')
  console.log('Starting Operation: addition')
  console.log('Starting Level:', additionSubLevel)
  console.log('No operations skipped')
  console.groupEnd()

  return {
    recommendedStartingOperation: 'addition',
    recommendedStartingSubLevel: additionSubLevel,
    skippedOperations: [],
    accelerationReason: 'Standard placement based on diagnostic results',
  }
}

/**
 * Filter problems by sub-level criteria
 * Returns only problems that belong to the specified sub-level
 */
export function filterProblemsBySubLevel(
  allProblems: ProblemProgress[],
  subLevel: SubLevel,
): ProblemProgress[] {
  const config = getSubLevelConfig(subLevel)
  if (!config) return []

  if (config.isMixedReview) {
    // Mixed review includes all problems from the operation
    return allProblems.filter((p) => p.operation === config.operation)
  }

  // Apply sub-level specific filter
  return allProblems.filter((p) => {
    if (p.operation !== config.operation) return false

    // Calculate result based on operation
    let result: number
    switch (p.operation) {
      case 'addition':
        result = p.num1 + p.num2
        break
      case 'subtraction':
        result = p.num1 - p.num2
        break
      case 'multiplication':
        result = p.num1 * p.num2
        break
      case 'division':
        result = p.num1 / p.num2
        break
    }

    return config.problemFilter(p.num1, p.num2, result)
  })
}

/**
 * Select maintenance problems from previous sub-levels
 * Returns proficient/mastered problems for keeping skills sharp
 */
export function selectMaintenanceProblems(
  allProblems: ProblemProgress[],
  currentSubLevel: SubLevel,
  completedSubLevels: SubLevel[],
  count: number,
): ProblemProgress[] {
  const config = getSubLevelConfig(currentSubLevel)
  if (!config || !config.maintenanceFromPrevious) return []

  // Get problems from completed sub-levels that are proficient or mastered
  const maintenanceCandidates = allProblems.filter((p) => {
    // Must be proficient or mastered
    if (p.proficiencyLevel !== 'proficient' && p.proficiencyLevel !== 'mastered') {
      return false
    }

    // Check if problem belongs to a completed sub-level
    for (const completedSL of completedSubLevels) {
      const completedConfig = getSubLevelConfig(completedSL)
      if (!completedConfig) continue

      let result: number
      switch (p.operation) {
        case 'addition':
          result = p.num1 + p.num2
          break
        case 'subtraction':
          result = p.num1 - p.num2
          break
        case 'multiplication':
          result = p.num1 * p.num2
          break
        case 'division':
          result = p.num1 / p.num2
          break
      }

      if (completedConfig.problemFilter(p.num1, p.num2, result)) {
        return true
      }
    }

    return false
  })

  // Randomly select from maintenance candidates
  return sampleRandom(maintenanceCandidates, Math.min(count, maintenanceCandidates.length))
}

/**
 * Calculate sub-level proficiency from problem banks
 * Returns percentage of problems that are approaching/proficient/mastered
 */
export function calculateSubLevelProficiency(
  allProblems: ProblemProgress[],
  subLevel: SubLevel,
): {
  proficiencyPercentage: number
  masteryPercentage: number
  distribution: {
    doesNotKnow: number
    emerging: number
    approaching: number
    proficient: number
    mastered: number
    total: number
  }
} {
  const subLevelProblems = filterProblemsBySubLevel(allProblems, subLevel)
  const total = subLevelProblems.length

  if (total === 0) {
    return {
      proficiencyPercentage: 0,
      masteryPercentage: 0,
      distribution: {
        doesNotKnow: 0,
        emerging: 0,
        approaching: 0,
        proficient: 0,
        mastered: 0,
        total: 0,
      },
    }
  }

  const distribution = {
    doesNotKnow: subLevelProblems.filter((p) => p.proficiencyLevel === 'doesNotKnow').length,
    emerging: subLevelProblems.filter((p) => p.proficiencyLevel === 'emerging').length,
    approaching: subLevelProblems.filter((p) => p.proficiencyLevel === 'approaching').length,
    proficient: subLevelProblems.filter((p) => p.proficiencyLevel === 'proficient').length,
    mastered: subLevelProblems.filter((p) => p.proficiencyLevel === 'mastered').length,
    total,
  }

  const proficiencyPercentage =
    ((distribution.approaching + distribution.proficient + distribution.mastered) / total) * 100
  const masteryPercentage = ((distribution.proficient + distribution.mastered) / total) * 100

  return {
    proficiencyPercentage,
    masteryPercentage,
    distribution,
  }
}

/**
 * Check if student is ready for sub-level assessment
 * Requires 85% proficiency (approaching + proficient + mastered)
 */
export function isReadyForSubLevelAssessment(
  allProblems: ProblemProgress[],
  subLevel: SubLevel,
): boolean {
  const { proficiencyPercentage } = calculateSubLevelProficiency(allProblems, subLevel)
  const config = getSubLevelConfig(subLevel)

  return proficiencyPercentage >= (config?.readyThreshold || 85)
}

/**
 * Check if student passed sub-level assessment
 * Requires 90% accuracy on 1-minute paper test
 */
export function didPassSubLevelAssessment(
  correctCount: number,
  totalQuestions: number,
  timeSeconds: number = 60,
): boolean {
  const accuracy = (correctCount / totalQuestions) * 100
  return accuracy >= 90
}

/**
 * Calculate CPM (Correct Per Minute) from assessment
 */
export function calculateCPM(correctCount: number, timeSeconds: number): number {
  return Math.round((correctCount / timeSeconds) * 60)
}

/**
 * Get CPM threshold for grade level and sub-level
 */
export function getCPMThreshold(subLevel: SubLevel, gradeLevel: '3-5' | '6-8' | '9-12'): number {
  const config = getSubLevelConfig(subLevel)
  if (!config) return 40

  switch (gradeLevel) {
    case '3-5':
      return config.targetCPM.grade3to5
    case '6-8':
      return config.targetCPM.grade6to8
    case '9-12':
      return config.targetCPM.grade9to12
    default:
      return 40
  }
}

/**
 * Randomly sample from array
 */
function sampleRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get all problems for current practice session
 * ⭐ ENHANCED: Supports fast-track mode for accelerated students
 *
 * Standard Mode:
 * - 60% current sub-level (focus areas)
 * - 20% maintenance from previous sub-levels
 * - 20% preview/interleave (optional)
 *
 * Fast-Track Mode (isFastTrack = true):
 * - 80% current sub-level (more exposure to new problems)
 * - 10% maintenance (reduced)
 * - 10% preview/interleave
 */
export function selectDailyPracticeProblems(
  allProblems: ProblemProgress[],
  currentSubLevel: SubLevel,
  completedSubLevels: SubLevel[],
  totalProblemsNeeded: number = 20,
  isFastTrack: boolean = false,
): {
  currentLevelProblems: ProblemProgress[]
  maintenanceProblems: ProblemProgress[]
  totalSelected: number
} {
  // Adjust distribution based on fast-track mode
  const currentLevelPercent = isFastTrack ? 0.8 : 0.6 // 80% vs 60%
  const maintenancePercent = isFastTrack ? 0.1 : 0.2 // 10% vs 20%

  const currentLevelCount = Math.floor(totalProblemsNeeded * currentLevelPercent)
  const maintenanceCount = Math.floor(totalProblemsNeeded * maintenancePercent)
  // Remaining can be additional current level problems

  // Get current sub-level problems (focus on doesNotKnow, emerging, approaching)
  const currentSubLevelProblems = filterProblemsBySubLevel(allProblems, currentSubLevel)
  const focusProblems = currentSubLevelProblems.filter(
    (p) =>
      p.proficiencyLevel === 'doesNotKnow' ||
      p.proficiencyLevel === 'emerging' ||
      p.proficiencyLevel === 'approaching',
  )

  const currentLevelProblems = sampleRandom(
    focusProblems.length > 0 ? focusProblems : currentSubLevelProblems,
    Math.min(currentLevelCount + maintenanceCount, currentSubLevelProblems.length), // Take extra if not enough maintenance
  )

  // Get maintenance problems from previous sub-levels
  const maintenanceProblems = selectMaintenanceProblems(
    allProblems,
    currentSubLevel,
    completedSubLevels,
    maintenanceCount,
  )

  // ⭐ ENHANCED LOGGING
  if (isFastTrack) {
    console.log('🎲 PRACTICE SELECTION - FAST-TRACK MODE', {
      mode: 'Fast-Track (80/10/10)',
      currentLevel: `${currentLevelProblems.length} problems`,
      maintenance: `${maintenanceProblems.length} problems`,
      total: currentLevelProblems.length + maintenanceProblems.length,
    })
  } else {
    console.log('🎲 PRACTICE SELECTION - STANDARD MODE', {
      mode: 'Standard (60/20/20)',
      currentLevel: `${currentLevelProblems.length} problems`,
      maintenance: `${maintenanceProblems.length} problems`,
      total: currentLevelProblems.length + maintenanceProblems.length,
    })
  }

  return {
    currentLevelProblems,
    maintenanceProblems,
    totalSelected: currentLevelProblems.length + maintenanceProblems.length,
  }
}
