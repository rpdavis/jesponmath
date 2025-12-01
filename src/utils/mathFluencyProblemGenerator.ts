// Math Fluency Problem Generator
// Generates all possible problems for each operation type

import type { MathFactProblem, OperationType } from '@/types/mathFluency'

/**
 * Generate all possible addition problems (2-20)
 * Excludes problems with 0 (e.g., 0+7) and 1 (e.g., 1+7) as they are trivial
 * Adding 1 is just counting forward, not true addition fluency
 * Only includes one version of commutative pairs (e.g., 3+12 but not 12+3)
 * Total: ~90 unique problems (combinations where sum <= 20 and num1 <= num2)
 */
export function generateAllAdditionProblems(): MathFactProblem[] {
  const problems: MathFactProblem[] = []
  
  for (let num1 = 2; num1 <= 20; num1++) {  // Start at 2 to exclude 0 and 1
    for (let num2 = num1; num2 <= 20; num2++) {  // Start at num1 to avoid duplicates
      const sum = num1 + num2
      if (sum <= 20) {
        const problemId = `ADD_${num1}_${num2}`
        problems.push({
          id: problemId,
          num1,
          num2,
          operation: 'addition',
          correctAnswer: sum.toString(),
          displayText: `${num1} + ${num2} = ?`,
          category: categorizeAddition(num1, num2, sum),
          factFamily: getAdditionFactFamily(num1, num2, sum)
        })
      }
    }
  }
  
  return problems
}

/**
 * Generate all possible subtraction problems (2-20, no negatives)
 * Excludes problems with 0 (e.g., 0-5, 7-0) and 1 (e.g., 7-1) as they are trivial
 * Subtracting 1 is just counting backward, not true subtraction fluency
 * Focuses on essential facts - skips "subtract 0", "subtract 1", and "subtract self" problems
 * Total: ~150 unique problems (reduced from ~231)
 */
export function generateAllSubtractionProblems(): MathFactProblem[] {
  const problems: MathFactProblem[] = []
  
  for (let minuend = 2; minuend <= 20; minuend++) {  // Start at 2 to exclude 0 and 1
    for (let subtrahend = 2; subtrahend <= minuend; subtrahend++) {  // Start at 2 to exclude 0 and 1
      // Skip trivial problems:
      // - Subtracting from self (e.g., 15-15=0) - too easy
      if (subtrahend === minuend) {
        continue
      }
      
      const difference = minuend - subtrahend
      const problemId = `SUB_${minuend}_${subtrahend}`
      
      problems.push({
        id: problemId,
        num1: minuend,
        num2: subtrahend,
        operation: 'subtraction',
        correctAnswer: difference.toString(),
        displayText: `${minuend} − ${subtrahend} = ?`,
        category: categorizeSubtraction(minuend, subtrahend, difference),
        factFamily: getSubtractionFactFamily(minuend, subtrahend)
      })
    }
  }
  
  return problems
}

/**
 * Generate all possible multiplication problems (0-12)
 * Only includes one version of commutative pairs (e.g., 3×7 but not 7×3)
 * Total: 91 unique problems (13 choose 2 + 13 for squares)
 */
export function generateAllMultiplicationProblems(): MathFactProblem[] {
  const problems: MathFactProblem[] = []
  
  for (let num1 = 0; num1 <= 12; num1++) {
    for (let num2 = num1; num2 <= 12; num2++) {  // Start at num1 to avoid duplicates
      const product = num1 * num2
      const problemId = `MULT_${num1}_${num2}`
      
      problems.push({
        id: problemId,
        num1,
        num2,
        operation: 'multiplication',
        correctAnswer: product.toString(),
        displayText: `${num1} × ${num2} = ?`,
        category: categorizeMultiplication(num1, num2, product),
        factFamily: getMultiplicationFactFamily(num1, num2)
      })
    }
  }
  
  return problems
}

/**
 * Generate all possible division problems (0-12, no remainders)
 * Focuses on essential facts - skips trivial "divide by 1" and "divide by self" problems
 * Total: ~130 unique problems (reduced from 169)
 */
export function generateAllDivisionProblems(): MathFactProblem[] {
  const problems: MathFactProblem[] = []
  
  for (let divisor = 1; divisor <= 12; divisor++) {
    for (let quotient = 0; quotient <= 12; quotient++) {
      const dividend = divisor * quotient
      
      // Skip trivial problems:
      // - Dividing by 1 (e.g., 15÷1=15) - too easy
      // - 0 divided by anything (e.g., 0÷5=0) - too easy
      if (divisor === 1 || dividend === 0) {
        continue
      }
      
      const problemId = `DIV_${dividend}_${divisor}`
      
      problems.push({
        id: problemId,
        num1: dividend,
        num2: divisor,
        operation: 'division',
        correctAnswer: quotient.toString(),
        displayText: `${dividend} ÷ ${divisor} = ?`,
        category: categorizeDivision(dividend, divisor, quotient),
        factFamily: getDivisionFactFamily(divisor)
      })
    }
  }
  
  return problems
}

/**
 * Get all problems for a specific operation
 */
export function getAllProblemsForOperation(operation: OperationType): MathFactProblem[] {
  switch (operation) {
    case 'addition':
      return generateAllAdditionProblems()
    case 'subtraction':
      return generateAllSubtractionProblems()
    case 'multiplication':
      return generateAllMultiplicationProblems()
    case 'division':
      return generateAllDivisionProblems()
  }
}

// ============================================================================
// CATEGORIZATION FUNCTIONS
// ============================================================================

function categorizeAddition(num1: number, num2: number, sum: number): string {
  // Doubles
  if (num1 === num2) return 'Doubles'
  
  // Make 10
  if (sum === 10) return 'Make 10'
  
  // Near doubles
  if (Math.abs(num1 - num2) === 1) return 'Near Doubles'
  
  // By sum range
  if (sum <= 5) return 'Sums to 5'
  if (sum <= 10) return 'Sums 6-10'
  if (sum <= 15) return 'Sums 11-15'
  if (sum <= 20) return 'Sums 16-20'
  
  return 'Other Addition'
}

function getAdditionFactFamily(num1: number, num2: number, sum: number): string {
  if (num1 === num2) return `Doubles (${num1}+${num2})`
  if (sum === 10) return 'Make 10 Strategy'
  if (Math.abs(num1 - num2) === 1) return `Near Doubles`
  if (sum <= 5) return 'Basic Addition'
  if (sum <= 10) return 'Addition Within 10'
  return 'Addition Crossing 10'
}

function categorizeSubtraction(minuend: number, subtrahend: number, difference: number): string {
  // From 10
  if (minuend === 10) return 'From 10'
  
  // Think addition (fact families)
  if (minuend <= 10) return `From ${minuend}`
  
  // By minuend range
  if (minuend <= 10) return 'Subtracting from 0-10'
  if (minuend <= 15) return 'Subtracting from 11-15'
  if (minuend <= 20) return 'Subtracting from 16-20'
  
  return 'Other Subtraction'
}

function getSubtractionFactFamily(minuend: number, subtrahend: number): string {
  if (minuend === 10) return 'From 10 Strategy'
  if (minuend <= 5) return 'Basic Subtraction'
  if (minuend <= 10) return 'Subtraction Within 10'
  return 'Subtraction Crossing 10'
}

function categorizeMultiplication(num1: number, num2: number, product: number): string {
  // Squares
  if (num1 === num2) return 'Squares'
  
  // By smaller factor (commutative property)
  const smallerFactor = Math.min(num1, num2)
  
  if (smallerFactor === 0) return '0s facts'
  if (smallerFactor === 1) return '1s facts'
  if (smallerFactor === 2) return '2s facts (Doubles)'
  if (smallerFactor === 5) return '5s facts'
  if (smallerFactor === 10) return '10s facts'
  
  return `${smallerFactor}s facts`
}

function getMultiplicationFactFamily(num1: number, num2: number): string {
  if (num1 === num2) return `Squares (${num1}×${num1})`
  if (num1 === 0 || num2 === 0) return 'Zero Property'
  if (num1 === 1 || num2 === 1) return 'Identity Property'
  
  const smallerFactor = Math.min(num1, num2)
  return `${smallerFactor}s Multiplication`
}

function categorizeDivision(dividend: number, divisor: number, quotient: number): string {
  if (dividend === 0) return 'Zero Division'
  if (divisor === 1) return 'Dividing by 1'
  if (dividend === quotient) return 'Perfect Divisions'
  
  return `÷${divisor}s facts`
}

function getDivisionFactFamily(divisor: number): string {
  if (divisor === 1) return 'Identity Property'
  return `Dividing by ${divisor}s`
}

// ============================================================================
// PROBLEM SELECTION UTILITIES
// ============================================================================

/**
 * Select random problems from an array
 * ⚠️ WARNING: This does NOT guarantee uniqueness. Use sampleRandomUnique for ProblemProgress arrays.
 */
export function sampleRandom<T>(array: T[], count: number): T[] {
  if (array.length <= count) return [...array]
  
  // Use proper Fisher-Yates shuffle instead of sort(random) which is biased
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled.slice(0, count)
}

/**
 * Select random problems ensuring uniqueness by problemId (for ProblemProgress arrays)
 */
export function sampleRandomUnique(problems: Array<{ problemId: string }>, count: number): Array<{ problemId: string }> {
  if (problems.length <= count) {
    // Deduplicate and return
    const seen = new Set<string>()
    return problems.filter(p => {
      if (seen.has(p.problemId)) return false
      seen.add(p.problemId)
      return true
    })
  }
  
  // Use proper Fisher-Yates shuffle
  const shuffled = [...problems]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  // Take first count, ensuring uniqueness
  const sampled: Array<{ problemId: string }> = []
  const seenIds = new Set<string>()
  
  for (const problem of shuffled) {
    if (sampled.length >= count) break
    if (!seenIds.has(problem.problemId)) {
      seenIds.add(problem.problemId)
      sampled.push(problem)
    }
  }
  
  return sampled
}

/**
 * Shuffle array in place
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate Friday assessment (personalized based on student's problem banks)
 * Accepts either MathFactProblem[] or ProblemProgress[] arrays
 */
export function generateFridayAssessment(
  problemBanks: { 
    mastered: Array<MathFactProblem | any>,
    proficient: Array<MathFactProblem | any>,
    approaching: Array<MathFactProblem | any>,
    emerging: Array<MathFactProblem | any>,
    doesNotKnow: Array<MathFactProblem | any>
  },
  totalProblems: number = 60
): MathFactProblem[] {
  // Convert ProblemProgress to MathFactProblem if needed
  const convertToMathFact = (item: any): MathFactProblem => {
    if ('problemId' in item && !('id' in item)) {
      // This is a ProblemProgress, convert to MathFactProblem
      return {
        id: item.problemId,
        num1: item.num1,
        num2: item.num2,
        operation: item.operation,
        correctAnswer: item.correctAnswer,
        displayText: item.displayText,
        category: item.category,
        factFamily: item.factFamily
      }
    }
    // Already a MathFactProblem
    return item as MathFactProblem
  }
  // Strategic sampling:
  // - 20% from mastered (maintenance check)
  // - 30% from proficient (verification)
  // - 40% from emerging/approaching (primary focus)
  // - 10% from doesNotKnow (challenge)
  
  const mastered = problemBanks.mastered.map(convertToMathFact)
  const proficient = problemBanks.proficient.map(convertToMathFact)
  const approaching = problemBanks.approaching.map(convertToMathFact)
  const emerging = problemBanks.emerging.map(convertToMathFact)
  const doesNotKnow = problemBanks.doesNotKnow.map(convertToMathFact)
  
  const problems: MathFactProblem[] = [
    ...sampleRandom(mastered, Math.floor(totalProblems * 0.20)),
    ...sampleRandom(proficient, Math.floor(totalProblems * 0.30)),
    ...sampleRandom([...approaching, ...emerging], Math.floor(totalProblems * 0.40)),
    ...sampleRandom(doesNotKnow, Math.floor(totalProblems * 0.10))
  ]
  
  // Shuffle to prevent pattern recognition
  return shuffleArray(problems).slice(0, totalProblems)
}

