/**
 * Fluency Sub-Level Configuration
 * Defines the 14-level progressive mastery system for math fluency
 */

import type { SubLevel, OperationType } from '@/types/mathFluency'

export interface SubLevelConfig {
  id: SubLevel
  operation: OperationType
  name: string
  shortName: string
  description: string
  
  // Progression
  order: number  // Global order (1-14)
  operationOrder: number  // Order within operation (1-3 or 1-4)
  isMixedReview: boolean
  
  // Problem Criteria
  totalProblems: number  // Total unique problems in this sub-level
  problemFilter: (num1: number, num2: number, result: number) => boolean
  categories: string[]  // Problem categories included
  
  // Assessment Criteria
  assessmentDuration: number  // seconds (always 60 for 1-minute tests)
  passingAccuracy: number  // percentage (always 90)
  targetCPM: {
    grade3to5: number
    grade6to8: number
    grade9to12: number
  }
  minimumAcceptableCPM: {  // ⭐ NEW: For struggling students (3+ years behind)
    grade3to5: number
    grade6to8: number
    grade9to12: number
  }
  
  // Practice Criteria
  readyThreshold: number  // Proficiency % to be ready for assessment (always 85)
  maintenanceFromPrevious: boolean  // Include problems from previous sub-levels
  
  // Strategy Support
  keyStrategies: string[]  // Teaching strategies for this level
  commonErrors: string[]  // Typical student mistakes
  
  // Motivation
  icon: string
  color: string
  motivationalMessage: string
}

/**
 * Complete Sub-Level Definitions (14 levels)
 */
export const SUB_LEVEL_CONFIGS: SubLevelConfig[] = [
  // =========================================================================
  // ADDITION (Levels 1-3)
  // =========================================================================
  {
    id: 'addition_within_10',
    operation: 'addition',
    name: 'Addition Within 10',
    shortName: 'Add ≤10',
    description: 'Master all addition facts with sums up to 10',
    order: 1,
    operationOrder: 1,
    isMixedReview: false,
    totalProblems: 36,
    problemFilter: (num1, num2, sum) => sum <= 10 && num1 >= 2 && num2 >= 2,
    categories: ['Sums to 5', 'Sums 6-10', 'Doubles', 'Making 10'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 40, grade6to8: 50, grade9to12: 60 },
    minimumAcceptableCPM: { grade3to5: 25, grade6to8: 30, grade9to12: 35 },
    readyThreshold: 85,
    maintenanceFromPrevious: false,
    keyStrategies: ['Count on', 'Doubles', 'Making 10', 'Part-part-whole'],
    commonErrors: ['Counting by 1s instead of known facts', 'Making 10 without recognizing pairs'],
    icon: '🌱',
    color: '#27ae60',
    motivationalMessage: 'Building your addition foundation!'
  },
  
  {
    id: 'addition_within_20',
    operation: 'addition',
    name: 'Addition Within 20',
    shortName: 'Add ≤20',
    description: 'Master bridging 10 and teen number addition',
    order: 2,
    operationOrder: 2,
    isMixedReview: false,
    totalProblems: 45,
    problemFilter: (num1, num2, sum) => sum >= 11 && sum <= 20 && num1 >= 2 && num2 >= 2,
    categories: ['Sums 11-15', 'Sums 16-20', 'Bridging 10', 'Doubles', 'Near Doubles'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 40, grade6to8: 50, grade9to12: 60 },
    minimumAcceptableCPM: { grade3to5: 25, grade6to8: 30, grade9to12: 35 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Make 10 first', 'Near doubles (+1)', 'Decompose to 10'],
    commonErrors: ['Not using make 10 strategy', 'Losing track when bridging', 'Near double confusion'],
    icon: '🌿',
    color: '#229954',
    motivationalMessage: 'Mastering harder addition facts!'
  },
  
  {
    id: 'addition_mixed',
    operation: 'addition',
    name: 'Addition Mixed Review',
    shortName: 'Add Mix',
    description: 'Demonstrate fluency across all addition facts',
    order: 3,
    operationOrder: 3,
    isMixedReview: true,
    totalProblems: 30,
    problemFilter: (num1, num2, sum) => sum <= 20 && num1 >= 2 && num2 >= 2,
    categories: ['All Addition'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 40, grade6to8: 50, grade9to12: 60 },
    minimumAcceptableCPM: { grade3to5: 25, grade6to8: 30, grade9to12: 35 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Quick strategy selection', 'Automatic recall'],
    commonErrors: ['Slower on mixed vs. blocked practice'],
    icon: '🌳',
    color: '#1e8449',
    motivationalMessage: 'Prove your addition mastery!'
  },
  
  // =========================================================================
  // SUBTRACTION (Levels 4-6)
  // =========================================================================
  {
    id: 'subtraction_within_10',
    operation: 'subtraction',
    name: 'Subtraction Within 10',
    shortName: 'Sub ≤10',
    description: 'Master subtraction from numbers 2-10',
    order: 4,
    operationOrder: 1,
    isMixedReview: false,
    totalProblems: 36,
    problemFilter: (minuend, subtrahend, diff) => minuend <= 10 && minuend >= 2 && subtrahend >= 2 && subtrahend < minuend,
    categories: ['From 10', 'From 5-9', 'Think Addition'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 40, grade6to8: 50, grade9to12: 60 },
    minimumAcceptableCPM: { grade3to5: 25, grade6to8: 30, grade9to12: 35 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,  // Include addition maintenance
    keyStrategies: ['Think addition', 'Count back', 'Part-part-whole'],
    commonErrors: ['Not connecting to addition facts', 'Counting instead of recalling'],
    icon: '🔻',
    color: '#c0392b',
    motivationalMessage: 'Building subtraction skills!'
  },
  
  {
    id: 'subtraction_within_20',
    operation: 'subtraction',
    name: 'Subtraction Within 20',
    shortName: 'Sub ≤20',
    description: 'Master subtraction from teen numbers (11-20)',
    order: 5,
    operationOrder: 2,
    isMixedReview: false,
    totalProblems: 90,
    problemFilter: (minuend, subtrahend, diff) => minuend >= 11 && minuend <= 20 && subtrahend >= 2 && subtrahend < minuend,
    categories: ['From 11-15', 'From 16-20', 'Crossing 10'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 35, grade6to8: 45, grade9to12: 55 },  // Slightly lower - harder
    minimumAcceptableCPM: { grade3to5: 20, grade6to8: 25, grade9to12: 30 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Decompose to 10', 'Think addition', 'Subtract in parts'],
    commonErrors: ['Crossing 10 errors', 'Not using addition relationship'],
    icon: '🔺',
    color: '#a93226',
    motivationalMessage: 'Conquering harder subtraction!'
  },
  
  {
    id: 'subtraction_mixed',
    operation: 'subtraction',
    name: 'Subtraction Mixed Review',
    shortName: 'Sub Mix',
    description: 'Demonstrate fluency across all subtraction facts',
    order: 6,
    operationOrder: 3,
    isMixedReview: true,
    totalProblems: 30,
    problemFilter: (minuend, subtrahend, diff) => minuend >= 2 && minuend <= 20 && subtrahend >= 2 && subtrahend < minuend,
    categories: ['All Subtraction'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 40, grade6to8: 50, grade9to12: 60 },
    minimumAcceptableCPM: { grade3to5: 25, grade6to8: 30, grade9to12: 35 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Automatic recall', 'Strategy flexibility'],
    commonErrors: ['Slower on mixed'],
    icon: '📐',
    color: '#922b21',
    motivationalMessage: 'Subtraction mastery unlocked!'
  },
  
  // =========================================================================
  // MULTIPLICATION (Levels 7-10)
  // =========================================================================
  {
    id: 'multiplication_easy',
    operation: 'multiplication',
    name: 'Multiplication - Easy Patterns',
    shortName: '×2,5,10',
    description: 'Master multiplication with 0, 1, 2, 5, and 10 (pattern-based)',
    order: 7,
    operationOrder: 1,
    isMixedReview: false,
    totalProblems: 29,
    problemFilter: (num1, num2, product) => {
      const factors = [num1, num2]
      return factors.includes(0) || factors.includes(1) || factors.includes(2) || 
             factors.includes(5) || factors.includes(10)
    },
    categories: ['×0', '×1', '×2 (doubles)', '×5 (clock)', '×10 (place value)'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 40, grade6to8: 50, grade9to12: 60 },
    minimumAcceptableCPM: { grade3to5: 25, grade6to8: 30, grade9to12: 35 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,  // Include add/subtract maintenance
    keyStrategies: ['Skip counting', 'Repeated addition', 'Pattern recognition'],
    commonErrors: ['Not recognizing patterns', 'Counting by 1s'],
    icon: '✖️',
    color: '#8e44ad',
    motivationalMessage: 'Learning multiplication patterns!'
  },
  
  {
    id: 'multiplication_medium',
    operation: 'multiplication',
    name: 'Multiplication - Medium Facts',
    shortName: '×3,4,6',
    description: 'Master ×3, ×4, ×6 and all square facts',
    order: 8,
    operationOrder: 2,
    isMixedReview: false,
    totalProblems: 31,
    problemFilter: (num1, num2, product) => {
      const factors = [num1, num2]
      const isSquare = num1 === num2
      const hasMediumFactor = factors.includes(3) || factors.includes(4) || factors.includes(6)
      const noEasyFactor = !factors.includes(0) && !factors.includes(1) && 
                          !factors.includes(2) && !factors.includes(5) && !factors.includes(10)
      return (isSquare || hasMediumFactor) && noEasyFactor
    },
    categories: ['×3', '×4 (double ×2)', '×6 (double ×3)', 'Squares'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 35, grade6to8: 45, grade9to12: 55 },
    minimumAcceptableCPM: { grade3to5: 20, grade6to8: 25, grade9to12: 30 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Doubling strategy', 'Commutative property', 'Square patterns'],
    commonErrors: ['Confusing ×3 and ×4', 'Not using doubling'],
    icon: '✖️✖️',
    color: '#7d3c98',
    motivationalMessage: 'Building multiplication strength!'
  },
  
  {
    id: 'multiplication_hard',
    operation: 'multiplication',
    name: 'Multiplication - Hard Facts',
    shortName: '×7,8,9,11,12',
    description: 'Master the challenging multiplication facts',
    order: 9,
    operationOrder: 3,
    isMixedReview: false,
    totalProblems: 36,
    problemFilter: (num1, num2, product) => {
      const factors = [num1, num2]
      const hasHardFactor = factors.includes(7) || factors.includes(8) || 
                           factors.includes(9) || factors.includes(11) || factors.includes(12)
      const noEasyFactor = !factors.includes(0) && !factors.includes(1) && 
                          !factors.includes(2) && !factors.includes(5) && !factors.includes(10)
      const noMediumOnly = !(factors.includes(3) && factors.includes(4)) &&
                          !(factors.includes(3) && factors.includes(6)) &&
                          !(factors.includes(4) && factors.includes(6))
      return hasHardFactor && noEasyFactor
    },
    categories: ['×7', '×8', '×9 (nifty nines)', '×11 (pattern)', '×12'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 25, grade6to8: 35, grade9to12: 45 },  // Adjusted - these are the hardest facts
    minimumAcceptableCPM: { grade3to5: 15, grade6to8: 20, grade9to12: 25 },  // Struggling students can still progress
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['9s finger trick', '11s pattern', 'Break apart', 'Related facts'],
    commonErrors: ['×7 and ×8 confusion', 'Not using 9s trick', 'Calculation errors'],
    icon: '✖️✖️✖️',
    color: '#6c3483',
    motivationalMessage: 'Conquering the hardest facts!'
  },
  
  {
    id: 'multiplication_mixed',
    operation: 'multiplication',
    name: 'Multiplication Mixed Review',
    shortName: '× Mix',
    description: 'Demonstrate automatic recall of all multiplication facts',
    order: 10,
    operationOrder: 4,
    isMixedReview: true,
    totalProblems: 40,
    problemFilter: (num1, num2, product) => num1 >= 0 && num2 >= 0 && num1 <= 12 && num2 <= 12 && num1 <= num2,
    categories: ['All Multiplication'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 35, grade6to8: 45, grade9to12: 55 },
    minimumAcceptableCPM: { grade3to5: 20, grade6to8: 25, grade9to12: 30 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Automatic recall', 'Quick strategy selection'],
    commonErrors: ['Slower on mixed'],
    icon: '🎯',
    color: '#5b2c6f',
    motivationalMessage: 'You\'re a multiplication master!'
  },
  
  // =========================================================================
  // DIVISION (Levels 11-14)
  // =========================================================================
  {
    id: 'division_easy',
    operation: 'division',
    name: 'Division - Easy Facts',
    shortName: '÷2,5,10',
    description: 'Master division by 2, 5, and 10 (pattern-based)',
    order: 11,
    operationOrder: 1,
    isMixedReview: false,
    totalProblems: 36,
    problemFilter: (dividend, divisor, quotient) => [2, 5, 10].includes(divisor) && divisor >= 2,
    categories: ['÷2', '÷5', '÷10'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 35, grade6to8: 45, grade9to12: 55 },
    minimumAcceptableCPM: { grade3to5: 20, grade6to8: 25, grade9to12: 30 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,  // Maintain multiplication
    keyStrategies: ['Think multiplication', 'Pattern recognition', 'Fact families'],
    commonErrors: ['Not using multiplication relationship', 'Pattern confusion'],
    icon: '➗',
    color: '#d68910',
    motivationalMessage: 'Division patterns unlocked!'
  },
  
  {
    id: 'division_medium',
    operation: 'division',
    name: 'Division - Medium Facts',
    shortName: '÷3,4,6',
    description: 'Master division by 3, 4, and 6',
    order: 12,
    operationOrder: 2,
    isMixedReview: false,
    totalProblems: 36,
    problemFilter: (dividend, divisor, quotient) => [3, 4, 6].includes(divisor) && divisor >= 2,
    categories: ['÷3', '÷4', '÷6'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 30, grade6to8: 40, grade9to12: 50 },
    minimumAcceptableCPM: { grade3to5: 18, grade6to8: 23, grade9to12: 28 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Multiplication connection', 'Skip counting backwards', 'Fact families'],
    commonErrors: ['÷3 and ÷6 confusion', 'Calculation errors'],
    icon: '➗➗',
    color: '#b9770e',
    motivationalMessage: 'Division skills growing!'
  },
  
  {
    id: 'division_hard',
    operation: 'division',
    name: 'Division - Hard Facts',
    shortName: '÷7,8,9,11,12',
    description: 'Master the challenging division facts',
    order: 13,
    operationOrder: 3,
    isMixedReview: false,
    totalProblems: 60,
    problemFilter: (dividend, divisor, quotient) => 
      [7, 8, 9, 11, 12].includes(divisor) && divisor >= 2,
    categories: ['÷7', '÷8', '÷9', '÷11', '÷12'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 20, grade6to8: 30, grade9to12: 40 },  // Adjusted - hardest facts
    minimumAcceptableCPM: { grade3to5: 12, grade6to8: 18, grade9to12: 23 },  // Struggling students can still progress
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Strong multiplication foundation', 'Fact families', 'Estimation check'],
    commonErrors: ['÷7 and ÷8 confusion', '÷12 calculation errors', 'Guessing'],
    icon: '➗➗➗',
    color: '#9a7d0a',
    motivationalMessage: 'You\'re almost there!'
  },
  
  {
    id: 'division_mixed',
    operation: 'division',
    name: 'Division Mixed Review',
    shortName: '÷ Mix',
    description: 'Demonstrate automatic division fact recall',
    order: 14,
    operationOrder: 4,
    isMixedReview: true,
    totalProblems: 40,
    problemFilter: (dividend, divisor, quotient) => divisor >= 2 && divisor <= 12,
    categories: ['All Division'],
    assessmentDuration: 60,
    passingAccuracy: 90,
    targetCPM: { grade3to5: 30, grade6to8: 40, grade9to12: 50 },
    minimumAcceptableCPM: { grade3to5: 18, grade6to8: 23, grade9to12: 28 },
    readyThreshold: 85,
    maintenanceFromPrevious: true,
    keyStrategies: ['Automatic recall', 'All four operations mastery'],
    commonErrors: ['Slower on mixed'],
    icon: '🏆',
    color: '#7e5109',
    motivationalMessage: 'You\'ve conquered all four operations!'
  }
]

/**
 * Helper Functions
 */

export function getSubLevelConfig(subLevel: SubLevel): SubLevelConfig | undefined {
  return SUB_LEVEL_CONFIGS.find(config => config.id === subLevel)
}

export function getSubLevelsForOperation(operation: OperationType): SubLevelConfig[] {
  return SUB_LEVEL_CONFIGS.filter(config => config.operation === operation)
}

export function getFirstSubLevel(operation: OperationType): SubLevel | null {
  const configs = getSubLevelsForOperation(operation).sort((a, b) => a.operationOrder - b.operationOrder)
  return configs.length > 0 ? configs[0].id : null
}

export function getNextSubLevel(currentSubLevel: SubLevel): SubLevel | null {
  const currentConfig = getSubLevelConfig(currentSubLevel)
  if (!currentConfig) return null
  
  const nextConfig = SUB_LEVEL_CONFIGS.find(
    config => config.operation === currentConfig.operation && 
              config.operationOrder === currentConfig.operationOrder + 1
  )
  
  return nextConfig ? nextConfig.id : null
}

export function getPreviousSubLevel(currentSubLevel: SubLevel): SubLevel | null {
  const currentConfig = getSubLevelConfig(currentSubLevel)
  if (!currentConfig) return null
  
  const prevConfig = SUB_LEVEL_CONFIGS.find(
    config => config.operation === currentConfig.operation && 
              config.operationOrder === currentConfig.operationOrder - 1
  )
  
  return prevConfig ? prevConfig.id : null
}

export function getAllSubLevelsByOrder(): SubLevelConfig[] {
  return SUB_LEVEL_CONFIGS.sort((a, b) => a.order - b.order)
}

export function isSubLevelComplete(operation: OperationType, completedSubLevels: SubLevel[]): boolean {
  const operationSubLevels = getSubLevelsForOperation(operation)
  return operationSubLevels.every(config => completedSubLevels.includes(config.id))
}

export function getTargetCPM(subLevel: SubLevel, gradeLevel: '3-5' | '6-8' | '9-12'): number {
  const config = getSubLevelConfig(subLevel)
  if (!config) return 40  // Default
  
  switch (gradeLevel) {
    case '3-5': return config.targetCPM.grade3to5
    case '6-8': return config.targetCPM.grade6to8
    case '9-12': return config.targetCPM.grade9to12
    default: return 40
  }
}

/**
 * Format sub-level name for display
 */
export function formatSubLevelName(subLevel: SubLevel): string {
  const config = getSubLevelConfig(subLevel)
  return config ? config.name : subLevel
}

/**
 * Get motivational message for sub-level
 */
export function getSubLevelMotivation(subLevel: SubLevel): string {
  const config = getSubLevelConfig(subLevel)
  return config ? config.motivationalMessage : 'Keep practicing!'
}

