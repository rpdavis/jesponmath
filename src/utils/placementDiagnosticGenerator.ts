// Placement Diagnostic Generator
// Creates quick 20-30 problem placement tests with stratified sampling

import type { MathFactProblem, OperationType, ProblemBanks, ProficiencyLevel, ProblemProgress } from '@/types/mathFluency'
import { getAllProblemsForOperation, sampleRandom, shuffleArray } from './mathFluencyProblemGenerator'
import { Timestamp } from 'firebase/firestore'

export interface PlacementResult {
  problemId: string
  num1: number
  num2: number
  operation: OperationType
  correctAnswer: string
  studentAnswer: string
  correct: boolean
  responseTime: number
  category: string
  factFamily: string
}

export interface PlacementAnalysis {
  level: 'foundational' | 'developing' | 'proficient' | 'advanced'
  overallAccuracy: number
  averageResponseTime: number
  categoryPerformance: {
    [category: string]: {
      correct: number
      total: number
      avgTime: number
    }
  }
  recommendedStartingBanks: ProblemBanks
  estimatedWeeksToMastery: number
}

/**
 * Generate ALL OPERATIONS placement diagnostic (SEPARATED by operation)
 * Tests each operation separately: Addition → Subtraction → Multiplication → Division
 * Uses 20 questions per chunk (can be less, never more)
 */
export function generateAllOperationsPlacementDiagnostic(
  problemsPerOperation: number = 20
): MathFactProblem[] {
  const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  
  const allSelectedProblems: MathFactProblem[] = []
  
  // Test each operation separately (in order, not mixed)
  operations.forEach(operation => {
    const operationProblems = generatePlacementDiagnostic(operation, problemsPerOperation)
    
    // Verify all problems are the correct operation
    const wrongOperation = operationProblems.find(p => p.operation !== operation)
    if (wrongOperation) {
      console.error(`❌ ERROR: Found ${wrongOperation.operation} problem in ${operation} section!`)
    }
    
    console.log(`✅ Generated ${operationProblems.length} ${operation} problems`)
    
    // Don't shuffle - keep them in order by operation
    allSelectedProblems.push(...operationProblems)
  })
  
  console.log(`📊 Total problems generated: ${allSelectedProblems.length} (should be ${problemsPerOperation * 4})`)
  
  // Return problems in operation order (not shuffled)
  return allSelectedProblems
}

/**
 * Generate stratified placement diagnostic for single operation
 * Samples problems across difficulty/category levels for quick assessment
 */
export function generatePlacementDiagnostic(
  operation: OperationType,
  totalProblems: number = 25
): MathFactProblem[] {
  const allProblems = getAllProblemsForOperation(operation)
  
  // Categorize problems by difficulty/type
  const categorized = categorizeProblemsByDifficulty(allProblems, operation)
  
  // Calculate problems per category (roughly equal distribution)
  const problemsPerCategory = Math.floor(totalProblems / Object.keys(categorized).length)
  const remainder = totalProblems % Object.keys(categorized).length
  
  const selectedProblems: MathFactProblem[] = []
  const categories = Object.keys(categorized)
  
  categories.forEach((category, index) => {
    const categoryProblems = categorized[category]
    const count = problemsPerCategory + (index < remainder ? 1 : 0)
    selectedProblems.push(...sampleRandom(categoryProblems, Math.min(count, categoryProblems.length)))
  })
  
  // Deduplicate problems (same problem might be in multiple categories)
  const uniqueProblems = Array.from(
    new Map(selectedProblems.map(p => [p.id, p])).values()
  )
  
  console.log(`🔍 ${operation} - Before dedup: ${selectedProblems.length}, After dedup: ${uniqueProblems.length}`)
  
  // If we lost problems due to deduplication, add more to reach target
  if (uniqueProblems.length < totalProblems) {
    const usedIds = new Set(uniqueProblems.map(p => p.id))
    const remainingProblems = allProblems.filter(p => !usedIds.has(p.id))
    const needMore = totalProblems - uniqueProblems.length
    
    if (remainingProblems.length > 0) {
      const additional = sampleRandom(remainingProblems, Math.min(needMore, remainingProblems.length))
      uniqueProblems.push(...additional)
      console.log(`➕ Added ${additional.length} more problems to reach ${totalProblems}`)
    }
  }
  
  return shuffleArray(uniqueProblems)
}

/**
 * Categorize problems by difficulty for stratified sampling
 */
function categorizeProblemsByDifficulty(
  problems: MathFactProblem[],
  operation: OperationType
): { [category: string]: MathFactProblem[] } {
  
  switch (operation) {
    case 'addition':
      return {
        'basic_2to5': problems.filter(p => {
          const sum = p.num1 + p.num2
          return sum >= 4 && sum <= 10 && p.num1 <= 5 && p.num2 <= 5
        }),
        'sums_6to10': problems.filter(p => {
          const sum = p.num1 + p.num2
          return sum >= 6 && sum <= 10 && (p.num1 > 5 || p.num2 > 5)
        }),
        'make_10': problems.filter(p => p.num1 + p.num2 === 10),
        'doubles': problems.filter(p => p.num1 === p.num2 && p.num1 >= 2),
        'near_doubles': problems.filter(p => Math.abs(p.num1 - p.num2) === 1 && p.num1 >= 5),
        'crossing_10': problems.filter(p => {
          const sum = p.num1 + p.num2
          return sum > 10 && sum <= 20
        })
      }
      
    case 'subtraction':
      return {
        'from_5to10': problems.filter(p => p.num1 >= 5 && p.num1 <= 10),
        'from_10': problems.filter(p => p.num1 === 10),
        'from_11to15': problems.filter(p => p.num1 > 10 && p.num1 <= 15),
        'from_16to20': problems.filter(p => p.num1 > 15 && p.num1 <= 20),
        'subtract_near': problems.filter(p => p.num2 >= p.num1 - 3)
      }
      
    case 'multiplication':
      return {
        '2s_5s_10s': problems.filter(p => {
          const factors = [p.num1, p.num2]
          return factors.includes(2) || factors.includes(5) || factors.includes(10)
        }),
        'squares': problems.filter(p => p.num1 === p.num2),
        '3s_4s_6s': problems.filter(p => {
          const smallerFactor = Math.min(p.num1, p.num2)
          return [3, 4, 6].includes(smallerFactor)
        }),
        '7s_8s_9s': problems.filter(p => {
          const smallerFactor = Math.min(p.num1, p.num2)
          return [7, 8, 9].includes(smallerFactor)
        }),
        '11s_12s': problems.filter(p => {
          const factors = [p.num1, p.num2]
          return factors.includes(11) || factors.includes(12)
        })
      }
      
    case 'division':
      return {
        'by_2_5_10': problems.filter(p => [2, 5, 10].includes(p.num2)),
        'by_3_4_6': problems.filter(p => [3, 4, 6].includes(p.num2)),
        'by_7_8_9': problems.filter(p => [7, 8, 9].includes(p.num2)),
        'by_11_12': problems.filter(p => [11, 12].includes(p.num2))
      }
  }
}

/**
 * Analyze placement results and recommend starting banks
 */
export function analyzePlacementResults(
  results: PlacementResult[],
  operation: OperationType
): PlacementAnalysis {
  
  const correctResults = results.filter(r => r.correct)
  const overallAccuracy = correctResults.length / results.length
  const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  
  // Calculate category performance
  const categoryPerformance: { [category: string]: { correct: number; total: number; avgTime: number } } = {}
  
  results.forEach(result => {
    if (!categoryPerformance[result.category]) {
      categoryPerformance[result.category] = { correct: 0, total: 0, avgTime: 0 }
    }
    categoryPerformance[result.category].total++
    if (result.correct) {
      categoryPerformance[result.category].correct++
    }
    categoryPerformance[result.category].avgTime += result.responseTime
  })
  
  // Calculate average times
  Object.keys(categoryPerformance).forEach(category => {
    const perf = categoryPerformance[category]
    perf.avgTime = perf.avgTime / perf.total
  })
  
  // Determine proficiency level
  const level = determineProficiencyLevel(overallAccuracy, averageResponseTime, categoryPerformance)
  
  // Generate starting banks based on placement
  const recommendedStartingBanks = generateStartingBanks(results, operation, level)
  
  // Estimate weeks to mastery
  const estimatedWeeksToMastery = estimateWeeksToMastery(level, overallAccuracy)
  
  return {
    level,
    overallAccuracy,
    averageResponseTime,
    categoryPerformance,
    recommendedStartingBanks,
    estimatedWeeksToMastery
  }
}

/**
 * Determine overall proficiency level from placement results
 */
function determineProficiencyLevel(
  accuracy: number,
  avgTime: number,
  categoryPerf: { [category: string]: { correct: number; total: number; avgTime: number } }
): 'foundational' | 'developing' | 'proficient' | 'advanced' {
  
  // Check basic category performance
  const basicCategories = Object.keys(categoryPerf).filter(c => 
    c.includes('basic') || c.includes('2to5') || c.includes('from_5to10') || c.includes('2s_5s')
  )
  
  const basicAccuracy = basicCategories.length > 0
    ? basicCategories.reduce((sum, cat) => sum + (categoryPerf[cat].correct / categoryPerf[cat].total), 0) / basicCategories.length
    : accuracy
  
  // Foundational: Struggles with basics
  if (basicAccuracy < 0.6 || (accuracy < 0.5 && avgTime > 10000)) {
    return 'foundational'
  }
  
  // Developing: Good on basics, developing on complex
  if (accuracy < 0.75 || avgTime > 6000) {
    return 'developing'
  }
  
  // Proficient: Strong accuracy, reasonable speed
  if (accuracy >= 0.75 && accuracy < 0.90 || avgTime > 4000) {
    return 'proficient'
  }
  
  // Advanced: Excellent accuracy and speed
  return 'advanced'
}

/**
 * Generate starting problem banks based on placement results
 */
function generateStartingBanks(
  results: PlacementResult[],
  operation: OperationType,
  level: 'foundational' | 'developing' | 'proficient' | 'advanced'
): ProblemBanks {
  
  const allProblems = getAllProblemsForOperation(operation)
  const testedProblemIds = new Set(results.map(r => r.problemId))
  const untestedProblems = allProblems.filter(p => !testedProblemIds.has(p.id))
  
  // Categorize tested problems by actual performance
  const tested_incorrect = results.filter(r => !r.correct).map(r => {
    const problem = findProblem(allProblems, r.problemId)!
    return convertToProblemProgress(problem, 'doesNotKnow', { correct: false, responseTime: r.responseTime })
  })
  const tested_correct_slow = results.filter(r => r.correct && r.responseTime >= 6000).map(r => {
    const problem = findProblem(allProblems, r.problemId)!
    return convertToProblemProgress(problem, 'emerging', { correct: true, responseTime: r.responseTime })
  })
  const tested_correct_medium = results.filter(r => r.correct && r.responseTime >= 3000 && r.responseTime < 6000).map(r => {
    const problem = findProblem(allProblems, r.problemId)!
    return convertToProblemProgress(problem, 'approaching', { correct: true, responseTime: r.responseTime })
  })
  const tested_correct_fast = results.filter(r => r.correct && r.responseTime < 3000).map(r => {
    const problem = findProblem(allProblems, r.problemId)!
    return convertToProblemProgress(problem, 'proficient', { correct: true, responseTime: r.responseTime })
  })
  
  // Estimate similar untested problems
  const estimated_doesNotKnow = estimateSimilarProblems(tested_incorrect, untestedProblems, 0.4)
    .map(p => convertToProblemProgress(p, 'doesNotKnow'))
  const estimated_emerging = estimateSimilarProblems(tested_correct_slow, untestedProblems, 0.3)
    .map(p => convertToProblemProgress(p, 'emerging'))
  const estimated_approaching = estimateSimilarProblems(tested_correct_medium, untestedProblems, 0.3)
    .map(p => convertToProblemProgress(p, 'approaching'))
  const estimated_proficient = estimateSimilarProblems(tested_correct_fast, untestedProblems, 0.4)
    .map(p => convertToProblemProgress(p, 'proficient'))
  
  // Collect all estimated IDs
  const estimatedIds = new Set([
    ...estimated_doesNotKnow,
    ...estimated_emerging,
    ...estimated_approaching,
    ...estimated_proficient
  ].map(p => p.problemId))
  
  // Remaining untested problems - distribute based on level
  const remaining = untestedProblems.filter(p => !estimatedIds.has(p.id))
  
  let remainingDistribution: { doesNotKnow: number; emerging: number; approaching: number; proficient: number }
  
  switch (level) {
    case 'foundational':
      remainingDistribution = { doesNotKnow: 0.6, emerging: 0.3, approaching: 0.1, proficient: 0 }
      break
    case 'developing':
      remainingDistribution = { doesNotKnow: 0.2, emerging: 0.4, approaching: 0.3, proficient: 0.1 }
      break
    case 'proficient':
      remainingDistribution = { doesNotKnow: 0.1, emerging: 0.2, approaching: 0.4, proficient: 0.3 }
      break
    case 'advanced':
      remainingDistribution = { doesNotKnow: 0, emerging: 0.1, approaching: 0.3, proficient: 0.6 }
      break
  }
  
  const shuffledRemaining = shuffleArray(remaining)
  const remaining_doesNotKnow = shuffledRemaining.slice(0, Math.floor(remaining.length * remainingDistribution.doesNotKnow))
    .map(p => convertToProblemProgress(p, 'doesNotKnow'))
  const remaining_emerging = shuffledRemaining.slice(
    Math.floor(remaining.length * remainingDistribution.doesNotKnow),
    Math.floor(remaining.length * remainingDistribution.doesNotKnow) + Math.floor(remaining.length * remainingDistribution.emerging)
  ).map(p => convertToProblemProgress(p, 'emerging'))
  const remaining_approaching = shuffledRemaining.slice(
    Math.floor(remaining.length * remainingDistribution.doesNotKnow) + Math.floor(remaining.length * remainingDistribution.emerging),
    Math.floor(remaining.length * remainingDistribution.doesNotKnow) + Math.floor(remaining.length * remainingDistribution.emerging) + Math.floor(remaining.length * remainingDistribution.approaching)
  ).map(p => convertToProblemProgress(p, 'approaching'))
  const remaining_proficient = shuffledRemaining.slice(
    Math.floor(remaining.length * remainingDistribution.doesNotKnow) + Math.floor(remaining.length * remainingDistribution.emerging) + Math.floor(remaining.length * remainingDistribution.approaching)
  ).map(p => convertToProblemProgress(p, 'proficient'))
  
  return {
    doesNotKnow: [...tested_incorrect, ...estimated_doesNotKnow, ...remaining_doesNotKnow],
    emerging: [...tested_correct_slow, ...estimated_emerging, ...remaining_emerging],
    approaching: [...tested_correct_medium, ...estimated_approaching, ...remaining_approaching],
    proficient: [...tested_correct_fast, ...estimated_proficient, ...remaining_proficient],
    mastered: []
  }
}

/**
 * Estimate similar problems based on category and complexity
 */
function estimateSimilarProblems(
  testedProblems: ProblemProgress[],
  untestedPool: MathFactProblem[],
  proportion: number
): MathFactProblem[] {
  
  if (testedProblems.length === 0) return []
  
  // Get categories from tested problems
  const categories = new Set(testedProblems.map(p => p.category))
  const factFamilies = new Set(testedProblems.map(p => p.factFamily))
  
  // Find similar untested problems
  const similar = untestedPool.filter(p => 
    categories.has(p.category) || factFamilies.has(p.factFamily)
  )
  
  return sampleRandom(similar, Math.floor(similar.length * proportion))
}

/**
 * Find problem by ID in problem array
 */
function findProblem(problems: MathFactProblem[], problemId: string): MathFactProblem | undefined {
  return problems.find(p => p.id === problemId)
}

/**
 * Convert MathFactProblem to ProblemProgress with initial proficiency data
 */
function convertToProblemProgress(
  problem: MathFactProblem,
  proficiencyLevel: ProficiencyLevel,
  initialAttempt?: { correct: boolean; responseTime: number }
): ProblemProgress {
  const now = Timestamp.now()
  const attempt = initialAttempt || { correct: proficiencyLevel !== 'doesNotKnow', responseTime: 5000 }
  
  return {
    problemId: problem.id,
    num1: problem.num1,
    num2: problem.num2,
    operation: problem.operation,
    correctAnswer: problem.correctAnswer,
    displayText: problem.displayText,
    category: problem.category,
    factFamily: problem.factFamily,
    difficulty: 3,  // Default medium difficulty
    
    proficiencyLevel,
    
    last5Attempts: [{
      date: now,
      correct: attempt.correct,
      responseTime: attempt.responseTime,
      source: 'initial-diagnostic'
    }],
    
    proficiencyCalculation: {
      correctOutOfLast5: attempt.correct ? 1 : 0,
      averageTimeOfLast5: attempt.responseTime,
      last5Trend: 'stable',
      confidenceLevel: 'low'
    },
    
    consecutiveCorrectDays: 0,
    daysInCurrentLevel: 0,
    totalAttempts: 1,
    correctAttempts: attempt.correct ? 1 : 0,
    
    responseTimes: [attempt.responseTime],
    averageResponseTime: attempt.responseTime,
    fastestResponseTime: attempt.responseTime,
    slowestResponseTime: attempt.responseTime,
    
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
    lastRegressionDate: null
  }
}

/**
 * Estimate weeks to mastery based on starting level
 */
function estimateWeeksToMastery(
  level: 'foundational' | 'developing' | 'proficient' | 'advanced',
  accuracy: number
): number {
  
  const baseWeeks = {
    foundational: 12,
    developing: 8,
    proficient: 5,
    advanced: 2
  }
  
  // Adjust based on accuracy
  const accuracyFactor = 1 + (0.75 - accuracy) * 2  // Lower accuracy = more weeks
  
  return Math.round(baseWeeks[level] * accuracyFactor)
}

