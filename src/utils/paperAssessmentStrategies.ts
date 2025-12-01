// Paper Assessment Strategies
// Intelligent problem distribution for Friday paper assessments

import type { MathFactProblem, OperationType, ProblemBanks, MathFluencyProgress } from '@/types/mathFluency'
import { sampleRandom, shuffleArray } from './mathFluencyProblemGenerator'

export interface ProblemDistribution {
  doesNotKnow: number
  emerging: number
  approaching: number
  proficient: number
  mastered: number
  total: number
}

export interface AssessmentMetrics {
  expectedCPM: number
  targetCPM: number
  assessmentPurpose: 'initial-baseline' | 'progress-monitoring' | 'mastery-check' | 'maintenance'
  focusArea: 'learning' | 'practice' | 'mastery' | 'mixed'
}

/**
 * Calculate optimal problem distribution for paper assessment
 * Based on week number and current proficiency
 */
export function calculateOptimalDistribution(
  banks: ProblemBanks,
  weekNumber: number,
  totalProblems: number = 60
): ProblemDistribution {
  
  const bankSizes = {
    doesNotKnow: banks.doesNotKnow.length,
    emerging: banks.emerging.length,
    approaching: banks.approaching.length,
    proficient: banks.proficient.length,
    mastered: banks.mastered.length
  }
  
  // Calculate total available
  const totalAvailable = Object.values(bankSizes).reduce((sum, count) => sum + count, 0)
  
  // Week 1-2: Focus on emerging facts (learning phase)
  if (weekNumber <= 2) {
    return distributeProblems({
      doesNotKnow: 0.35,    // 35% - High focus on learning
      emerging: 0.40,        // 40% - Primary practice target
      approaching: 0.15,     // 15% - Building confidence
      proficient: 0.07,      // 7% - Light maintenance
      mastered: 0.03         // 3% - Spot check
    }, bankSizes, totalProblems)
  }
  
  // Week 3-4: Balanced growth phase
  if (weekNumber <= 4) {
    return distributeProblems({
      doesNotKnow: 0.20,    // 20% - Continued learning
      emerging: 0.35,        // 35% - Primary focus
      approaching: 0.25,     // 25% - Solidifying
      proficient: 0.13,      // 13% - Maintenance
      mastered: 0.07         // 7% - Maintenance
    }, bankSizes, totalProblems)
  }
  
  // Week 5-6: Solidification phase
  if (weekNumber <= 6) {
    return distributeProblems({
      doesNotKnow: 0.12,    // 12% - Targeted work
      emerging: 0.25,        // 25% - Ongoing practice
      approaching: 0.30,     // 30% - Primary focus
      proficient: 0.20,      // 20% - Verification
      mastered: 0.13         // 13% - Maintenance
    }, bankSizes, totalProblems)
  }
  
  // Week 7-8: Mastery phase
  if (weekNumber <= 8) {
    return distributeProblems({
      doesNotKnow: 0.08,    // 8% - Final push
      emerging: 0.15,        // 15% - Refinement
      approaching: 0.25,     // 25% - Building fluency
      proficient: 0.30,      // 30% - Primary focus
      mastered: 0.22         // 22% - Maintenance
    }, bankSizes, totalProblems)
  }
  
  // Week 9+: Maintenance phase
  return distributeProblems({
    doesNotKnow: 0.05,    // 5% - Stragglers
    emerging: 0.10,        // 10% - Final refinement
    approaching: 0.15,     // 15% - Verification
    proficient: 0.35,      // 35% - Primary focus
    mastered: 0.35         // 35% - Full maintenance
  }, bankSizes, totalProblems)
}

/**
 * Distribute problems based on percentages, respecting bank availability
 */
function distributeProblems(
  targetPercentages: { [key: string]: number },
  bankSizes: { [key: string]: number },
  totalProblems: number
): ProblemDistribution {
  
  const distribution: any = {
    doesNotKnow: 0,
    emerging: 0,
    approaching: 0,
    proficient: 0,
    mastered: 0,
    total: totalProblems
  }
  
  const banks = Object.keys(targetPercentages)
  let assigned = 0
  
  // First pass: Assign based on percentages, capped by availability
  banks.forEach(bank => {
    const target = Math.floor(totalProblems * targetPercentages[bank])
    const available = bankSizes[bank]
    distribution[bank] = Math.min(target, available)
    assigned += distribution[bank]
  })
  
  // Second pass: Distribute remaining problems to banks with capacity
  let remaining = totalProblems - assigned
  
  while (remaining > 0) {
    let distributed = false
    
    // Try to distribute to banks in priority order
    const priorityOrder = ['approaching', 'proficient', 'emerging', 'mastered', 'doesNotKnow']
    
    for (const bank of priorityOrder) {
      if (distribution[bank] < bankSizes[bank] && remaining > 0) {
        distribution[bank]++
        remaining--
        distributed = true
      }
    }
    
    // If no banks have capacity, break
    if (!distributed) break
  }
  
  return distribution
}

/**
 * Generate assessment metrics for tracking and analysis
 */
export function calculateAssessmentMetrics(
  progress: MathFluencyProgress,
  weekNumber: number
): AssessmentMetrics {
  
  const proficiencyPct = progress.proficiencyPercentage
  const masteryPct = progress.masteryPercentage
  
  // Determine assessment purpose
  let assessmentPurpose: AssessmentMetrics['assessmentPurpose']
  if (weekNumber <= 2) {
    assessmentPurpose = 'initial-baseline'
  } else if (proficiencyPct < 80) {
    assessmentPurpose = 'progress-monitoring'
  } else if (proficiencyPct >= 95) {
    assessmentPurpose = 'maintenance'
  } else {
    assessmentPurpose = 'mastery-check'
  }
  
  // Determine focus area
  let focusArea: AssessmentMetrics['focusArea']
  if (weekNumber <= 2) {
    focusArea = 'learning'
  } else if (proficiencyPct < 60) {
    focusArea = 'learning'
  } else if (proficiencyPct < 85) {
    focusArea = 'practice'
  } else if (proficiencyPct < 95) {
    focusArea = 'mastery'
  } else {
    focusArea = 'mixed'
  }
  
  // Estimate expected CPM based on current proficiency
  const expectedCPM = estimateCPM(progress)
  
  // Set target CPM based on operation and week
  const targetCPM = getTargetCPM(progress.operation, weekNumber)
  
  return {
    expectedCPM,
    targetCPM,
    assessmentPurpose,
    focusArea
  }
}

/**
 * Estimate expected CPM (Correct Per Minute) based on proficiency distribution
 */
function estimateCPM(progress: MathFluencyProgress): number {
  const dist = progress.proficiencyDistribution
  const total = dist.total
  
  if (total === 0) return 0
  
  // Weighted average based on expected speeds
  // Mastered: 3-4s per problem (~15-20 in 60s)
  // Proficient: 4-6s per problem (~10-15 in 60s)
  // Approaching: 6-12s per problem (~5-10 in 60s)
  // Emerging: 12-20s per problem (~3-5 in 60s)
  // Does Not Know: Often incorrect or skip
  
  const expectedSpeed = (
    (dist.mastered / total) * 18 +
    (dist.proficient / total) * 12 +
    (dist.approaching / total) * 7 +
    (dist.emerging / total) * 4 +
    (dist.doesNotKnow / total) * 2
  )
  
  return Math.round(expectedSpeed)
}

/**
 * Get target CPM based on operation and week number
 */
function getTargetCPM(operation: OperationType, weekNumber: number): number {
  // Base targets for operations (end of program)
  const finalTargets = {
    addition: 25,        // 25 addition facts/min
    subtraction: 25,     // 25 subtraction facts/min
    multiplication: 30,  // 30 multiplication facts/min
    division: 25         // 25 division facts/min
  }
  
  // Progressive targets by week (percentage of final target)
  const weeklyProgression = {
    1: 0.20,   // 20% by week 1
    2: 0.30,   // 30% by week 2
    3: 0.40,   // 40% by week 3
    4: 0.50,   // 50% by week 4
    5: 0.60,   // 60% by week 5
    6: 0.70,   // 70% by week 6
    7: 0.80,   // 80% by week 7
    8: 0.90,   // 90% by week 8
    9: 0.95,   // 95% by week 9
    10: 1.00   // 100% by week 10
  }
  
  const finalTarget = finalTargets[operation]
  const progressionFactor = weeklyProgression[Math.min(weekNumber, 10) as keyof typeof weeklyProgression] || 1.0
  
  return Math.round(finalTarget * progressionFactor)
}

/**
 * Generate personalized paper assessment
 */
export function generatePersonalizedAssessment(
  progress: MathFluencyProgress,
  weekNumber: number,
  totalProblems: number = 60
): {
  problems: any[]  // ProblemProgress with MathFactProblem properties
  distribution: ProblemDistribution
  metrics: AssessmentMetrics
} {
  
  const distribution = calculateOptimalDistribution(progress.problemBanks, weekNumber, totalProblems)
  const metrics = calculateAssessmentMetrics(progress, weekNumber)
  
  // Sample problems from each bank according to distribution
  const selectedProblems: any[] = [
    ...sampleRandom(progress.problemBanks.doesNotKnow, distribution.doesNotKnow),
    ...sampleRandom(progress.problemBanks.emerging, distribution.emerging),
    ...sampleRandom(progress.problemBanks.approaching, distribution.approaching),
    ...sampleRandom(progress.problemBanks.proficient, distribution.proficient),
    ...sampleRandom(progress.problemBanks.mastered, distribution.mastered)
  ]
  
  // Shuffle to prevent pattern recognition
  const problems = shuffleArray(selectedProblems)
  
  return {
    problems,
    distribution,
    metrics
  }
}

/**
 * Calculate estimated results for quick entry mode
 * When teacher only provides attempted/correct totals
 */
export function estimateProblemResults(
  problemsOnTest: MathFactProblem[],
  attempted: number,
  correct: number
): Array<{ problemId: string; correct: boolean; estimated: boolean }> {
  
  const attemptedProblems = problemsOnTest.slice(0, attempted)
  const incorrect = attempted - correct
  
  // Sort by difficulty (prioritize marking harder problems as incorrect)
  const difficultyRank: { [key: string]: number } = {
    'doesNotKnow': 5,
    'emerging': 4,
    'approaching': 3,
    'proficient': 2,
    'mastered': 1
  }
  
  const sortedByDifficulty = [...attemptedProblems].sort((a, b) => {
    const aRank = difficultyRank[(a as any).proficiencyLevel] || 3
    const bRank = difficultyRank[(b as any).proficiencyLevel] || 3
    return bRank - aRank
  })
  
  // Mark first N as incorrect (most difficult ones)
  const incorrectSet = new Set(sortedByDifficulty.slice(0, incorrect).map(p => p.id))
  
  return attemptedProblems.map(problem => ({
    problemId: problem.id,
    correct: !incorrectSet.has(problem.id),
    estimated: true
  }))
}

