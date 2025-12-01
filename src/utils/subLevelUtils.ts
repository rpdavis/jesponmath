/**
 * Sub-Level Utility Functions
 * Helpers for working with the progressive sub-level system
 */

import type { SubLevel, OperationType, ProblemProgress, ProficiencyLevel } from '@/types/mathFluency'
import { 
  getSubLevelConfig, 
  getFirstSubLevel, 
  getNextSubLevel,
  getSubLevelsForOperation 
} from '@/config/fluencySubLevels'

/**
 * Determine starting sub-level based on placement diagnostic results
 * Uses proficiency percentage to decide if student can skip ahead
 */
export function determineStartingSubLevel(
  operation: OperationType,
  proficiencyPercentage: number
): SubLevel {
  const subLevels = getSubLevelsForOperation(operation)
  const firstLevel = subLevels.find(sl => sl.operationOrder === 1)
  
  if (!firstLevel) {
    throw new Error(`No first sub-level found for ${operation}`)
  }
  
  // Self-pacing logic:
  // - If 90%+ proficient on diagnostic → Start at level 2 (skip basics)
  // - If 70-89% proficient → Start at level 1
  // - If <70% proficient → Start at level 1 with extra support flag
  
  if (proficiencyPercentage >= 0.90 && subLevels.length > 1) {
    // Skip first level, start at second
    const secondLevel = subLevels.find(sl => sl.operationOrder === 2)
    return secondLevel ? secondLevel.id : firstLevel.id
  }
  
  // Start at beginning
  return firstLevel.id
}

/**
 * Filter problems by sub-level criteria
 * Returns only problems that belong to the specified sub-level
 */
export function filterProblemsBySubLevel(
  allProblems: ProblemProgress[],
  subLevel: SubLevel
): ProblemProgress[] {
  const config = getSubLevelConfig(subLevel)
  if (!config) return []
  
  if (config.isMixedReview) {
    // Mixed review includes all problems from the operation
    return allProblems.filter(p => p.operation === config.operation)
  }
  
  // Apply sub-level specific filter
  return allProblems.filter(p => {
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
  count: number
): ProblemProgress[] {
  const config = getSubLevelConfig(currentSubLevel)
  if (!config || !config.maintenanceFromPrevious) return []
  
  // Get problems from completed sub-levels that are proficient or mastered
  const maintenanceCandidates = allProblems.filter(p => {
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
  subLevel: SubLevel
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
      distribution: { doesNotKnow: 0, emerging: 0, approaching: 0, proficient: 0, mastered: 0, total: 0 }
    }
  }
  
  const distribution = {
    doesNotKnow: subLevelProblems.filter(p => p.proficiencyLevel === 'doesNotKnow').length,
    emerging: subLevelProblems.filter(p => p.proficiencyLevel === 'emerging').length,
    approaching: subLevelProblems.filter(p => p.proficiencyLevel === 'approaching').length,
    proficient: subLevelProblems.filter(p => p.proficiencyLevel === 'proficient').length,
    mastered: subLevelProblems.filter(p => p.proficiencyLevel === 'mastered').length,
    total
  }
  
  const proficiencyPercentage = ((distribution.approaching + distribution.proficient + distribution.mastered) / total) * 100
  const masteryPercentage = ((distribution.proficient + distribution.mastered) / total) * 100
  
  return {
    proficiencyPercentage,
    masteryPercentage,
    distribution
  }
}

/**
 * Check if student is ready for sub-level assessment
 * Requires 85% proficiency (approaching + proficient + mastered)
 */
export function isReadyForSubLevelAssessment(
  allProblems: ProblemProgress[],
  subLevel: SubLevel
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
  timeSeconds: number = 60
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
export function getCPMThreshold(
  subLevel: SubLevel,
  gradeLevel: '3-5' | '6-8' | '9-12'
): number {
  const config = getSubLevelConfig(subLevel)
  if (!config) return 40
  
  switch (gradeLevel) {
    case '3-5': return config.targetCPM.grade3to5
    case '6-8': return config.targetCPM.grade6to8
    case '9-12': return config.targetCPM.grade9to12
    default: return 40
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
 * 60% current sub-level (focus areas)
 * 20% maintenance from previous sub-levels
 * 20% preview/interleave (optional)
 */
export function selectDailyPracticeProblems(
  allProblems: ProblemProgress[],
  currentSubLevel: SubLevel,
  completedSubLevels: SubLevel[],
  totalProblemsNeeded: number = 20
): {
  currentLevelProblems: ProblemProgress[]
  maintenanceProblems: ProblemProgress[]
  totalSelected: number
} {
  const currentLevelCount = Math.floor(totalProblemsNeeded * 0.6)  // 60%
  const maintenanceCount = Math.floor(totalProblemsNeeded * 0.2)  // 20%
  // Remaining 20% can be additional current level problems
  
  // Get current sub-level problems (focus on doesNotKnow, emerging, approaching)
  const currentSubLevelProblems = filterProblemsBySubLevel(allProblems, currentSubLevel)
  const focusProblems = currentSubLevelProblems.filter(p => 
    p.proficiencyLevel === 'doesNotKnow' || 
    p.proficiencyLevel === 'emerging' || 
    p.proficiencyLevel === 'approaching'
  )
  
  const currentLevelProblems = sampleRandom(
    focusProblems.length > 0 ? focusProblems : currentSubLevelProblems,
    Math.min(currentLevelCount + maintenanceCount, currentSubLevelProblems.length)  // Take extra if not enough maintenance
  )
  
  // Get maintenance problems from previous sub-levels
  const maintenanceProblems = selectMaintenanceProblems(
    allProblems,
    currentSubLevel,
    completedSubLevels,
    maintenanceCount
  )
  
  return {
    currentLevelProblems,
    maintenanceProblems,
    totalSelected: currentLevelProblems.length + maintenanceProblems.length
  }
}

