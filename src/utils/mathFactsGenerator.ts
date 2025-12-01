export interface MathFactQuestion {
  id: string
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division'
  num1: number
  num2: number
  questionText: string
  correctAnswer: string
  acceptableAnswers: string[]
  questionType?: 'standard' | 'inverse' | 'doubles' | 'make10' | 'fact-family'
  hint?: string
  // Detailed categorization for reporting
  category?: string // e.g., "Addition 0-10", "Multiplication 7s", etc.
  factFamily?: string // e.g., "3s", "7s", "doubles", etc.
}

interface OperationConfig {
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division'
  min1: number
  max1: number
  min2: number
  max2: number
  count: number
}

export function generateMathFactsTest(
  operations: ('addition' | 'subtraction' | 'multiplication' | 'division')[],
  questionsPerOperation: number = 20
): MathFactQuestion[] {
  const allQuestions: MathFactQuestion[] = []
  
  operations.forEach(operation => {
    const questions = generateQuestionsForOperation(operation, questionsPerOperation)
    allQuestions.push(...questions)
  })
  
  // Shuffle all questions together
  return shuffleArray(allQuestions)
}

function generateQuestionsForOperation(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
  count: number
): MathFactQuestion[] {
  const questions: MathFactQuestion[] = []
  const usedPairs = new Set<string>()
  
  const config = getOperationConfig(operation)
  
  // For mixed operations, include some enhanced question types
  const strategicQuestionsCount = Math.floor(count * 0.3) // 30% strategic questions
  const standardQuestionsCount = count - strategicQuestionsCount
  
  let attempts = 0
  const maxAttempts = count * 10 // Prevent infinite loop
  
  // Generate standard questions
  while (questions.length < standardQuestionsCount && attempts < maxAttempts) {
    attempts++
    
    let num1: number
    let num2: number
    let answer: number
    
    switch (operation) {
      case 'addition':
        num1 = randomInt(config.min1, config.max1)
        num2 = randomInt(config.min2, config.max2)
        answer = num1 + num2
        break
        
      case 'subtraction':
        // Ensure no negative answers
        num1 = randomInt(config.min1, config.max1)
        num2 = randomInt(config.min2, Math.min(num1, config.max2))
        answer = num1 - num2
        break
        
      case 'multiplication':
        num1 = randomInt(config.min1, config.max1)
        num2 = randomInt(config.min2, config.max2)
        answer = num1 * num2
        break
        
      case 'division':
        // Generate division by creating multiplication first, then reversing
        num2 = randomInt(config.min2, config.max2) // divisor (avoid 0)
        const quotient = randomInt(config.min1, config.max1)
        num1 = num2 * quotient // dividend
        answer = quotient
        break
        
      default:
        continue
    }
    
    // Create unique key for this number pair
    const pairKey = `${operation}-${num1}-${num2}`
    
    // Skip if we've already used this pair
    if (usedPairs.has(pairKey)) {
      continue
    }
    
    usedPairs.add(pairKey)
    
    // Categorize for detailed reporting
    const { category, factFamily } = categorizeQuestion(operation, num1, num2, answer)
    
    const question: MathFactQuestion = {
      id: `${operation}-${questions.length + 1}`,
      operation,
      num1,
      num2,
      questionText: formatQuestion(operation, num1, num2),
      correctAnswer: answer.toString(),
      acceptableAnswers: [answer.toString()],
      questionType: 'standard',
      category,
      factFamily
    }
    
    questions.push(question)
  }
  
  // Generate strategic/enhanced questions
  while (questions.length < count && attempts < maxAttempts) {
    attempts++
    
    const strategicQuestion = generateStrategicQuestion(operation, questions.length + 1, usedPairs)
    if (strategicQuestion) {
      questions.push(strategicQuestion)
    }
  }
  
  return questions
}

function generateStrategicQuestion(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
  questionNumber: number,
  usedPairs: Set<string>
): MathFactQuestion | null {
  const config = getOperationConfig(operation)
  
  switch (operation) {
    case 'addition': {
      // Generate make-10 or doubles strategy questions
      const strategyType = Math.random() < 0.5 ? 'make10' : 'doubles'
      
      if (strategyType === 'make10') {
        // Make-10: e.g., 8 + 7 (cross 10 boundary)
        const num1 = randomInt(6, 9) // 6-9
        const num2 = randomInt(10 - num1 + 1, Math.min(20 - num1, 12)) // Cross 10
        const answer = num1 + num2
        const pairKey = `${operation}-make10-${num1}-${num2}`
        
        if (!usedPairs.has(pairKey)) {
          usedPairs.add(pairKey)
          const { category, factFamily } = categorizeQuestion(operation, num1, num2, answer)
          return {
            id: `${operation}-${questionNumber}`,
            operation,
            num1,
            num2,
            questionText: formatQuestion(operation, num1, num2),
            correctAnswer: answer.toString(),
            acceptableAnswers: [answer.toString()],
            questionType: 'make10',
            hint: `Think: ${num1} + ${10 - num1} = 10, then + ${num2 - (10 - num1)}`,
            category,
            factFamily
          }
        }
      } else {
        // Doubles: e.g., 6 + 7 (near doubles)
        const num1 = randomInt(3, 10)
        const num2 = num1 + (Math.random() < 0.5 ? 1 : -1) // Near double
        const answer = num1 + num2
        const pairKey = `${operation}-doubles-${num1}-${num2}`
        
        if (!usedPairs.has(pairKey)) {
          usedPairs.add(pairKey)
          const { category, factFamily } = categorizeQuestion(operation, num1, num2, answer)
          return {
            id: `${operation}-${questionNumber}`,
            operation,
            num1,
            num2,
            questionText: formatQuestion(operation, num1, num2),
            correctAnswer: answer.toString(),
            acceptableAnswers: [answer.toString()],
            questionType: 'doubles',
            hint: `Think: ${Math.min(num1, num2)} + ${Math.min(num1, num2)} = ${Math.min(num1, num2) * 2}, then add ${Math.abs(num1 - num2)}`,
            category,
            factFamily
          }
        }
      }
      break
    }
    
    case 'subtraction': {
      // Generate inverse/fact family: 15 - 7 → think "7 + ? = 15"
      const num1 = randomInt(10, 20) // minuend
      const num2 = randomInt(5, Math.min(num1, 12)) // subtrahend
      const answer = num1 - num2
      const pairKey = `${operation}-inverse-${num1}-${num2}`
      
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey)
        const { category, factFamily } = categorizeQuestion('subtraction', num1, num2, answer)
        return {
          id: `${operation}-${questionNumber}`,
          operation,
          num1,
          num2,
          questionText: formatQuestion(operation, num1, num2),
          correctAnswer: answer.toString(),
          acceptableAnswers: [answer.toString()],
          questionType: 'inverse',
          hint: `Think: ${num2} + ? = ${num1}`,
          category,
          factFamily
        }
      }
      break
    }
    
    case 'multiplication': {
      // Focus on commutative property and fact families
      const num1 = randomInt(2, 12)
      const num2 = randomInt(2, 12)
      const answer = num1 * num2
      const pairKey = `${operation}-fact-family-${num1}-${num2}`
      
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey)
        const { category, factFamily } = categorizeQuestion('multiplication', num1, num2, answer)
        return {
          id: `${operation}-${questionNumber}`,
          operation,
          num1,
          num2,
          questionText: formatQuestion(operation, num1, num2),
          correctAnswer: answer.toString(),
          acceptableAnswers: [answer.toString()],
          questionType: 'fact-family',
          hint: `Remember: ${num1} × ${num2} = ${num2} × ${num1}`,
          category,
          factFamily
        }
      }
      break
    }
    
    case 'division': {
      // Inverse of multiplication: 56 ÷ 7 → think "7 × ? = 56"
      const num2 = randomInt(2, 12) // divisor
      const quotient = randomInt(2, 12) // quotient
      const num1 = num2 * quotient // dividend
      const pairKey = `${operation}-inverse-${num1}-${num2}`
      
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey)
        const { category, factFamily } = categorizeQuestion('division', num1, num2, quotient)
        return {
          id: `${operation}-${questionNumber}`,
          operation,
          num1,
          num2,
          questionText: formatQuestion(operation, num1, num2),
          correctAnswer: quotient.toString(),
          acceptableAnswers: [quotient.toString()],
          questionType: 'inverse',
          hint: `Think: ${num2} × ? = ${num1}`,
          category,
          factFamily
        }
      }
      break
    }
  }
  
  return null
}

function getOperationConfig(operation: 'addition' | 'subtraction' | 'multiplication' | 'division') {
  switch (operation) {
    case 'addition':
      return { min1: 1, max1: 20, min2: 1, max2: 20 } // Exclude 0 from addition
    case 'subtraction':
      return { min1: 1, max1: 20, min2: 1, max2: 20 } // Exclude 0 from subtraction
    case 'multiplication':
      return { min1: 0, max1: 12, min2: 0, max2: 12 }
    case 'division':
      return { min1: 1, max1: 12, min2: 1, max2: 12 } // quotient range 1-12, divisor 1-12
    default:
      return { min1: 0, max1: 20, min2: 0, max2: 20 }
  }
}

function formatQuestion(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
  num1: number,
  num2: number
): string {
  switch (operation) {
    case 'addition':
      return `${num1} + ${num2}`
    case 'subtraction':
      return `${num1} − ${num2}`
    case 'multiplication':
      return `${num1} × ${num2}`
    case 'division':
      return `${num1} ÷ ${num2}`
    default:
      return `${num1} ? ${num2}`
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Categorize a question for detailed reporting
 */
function categorizeQuestion(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
  num1: number,
  num2: number,
  answer: number
): { category: string; factFamily: string } {
  let category = ''
  let factFamily = ''
  
  switch (operation) {
    case 'addition':
      // Categorize by sum range
      if (answer <= 10) {
        category = 'Addition: Sums to 10'
        // Check for special types
        if (num1 === num2) {
          factFamily = `Doubles (${num1}+${num1})`
        } else if (answer === 10) {
          factFamily = `Make 10 (${num1}+${num2})`
        } else if (answer <= 5) {
          factFamily = `Sums to 5`
        } else {
          factFamily = `Sums 6-10`
        }
      } else if (answer <= 15) {
        category = 'Addition: Sums 11-15'
        factFamily = `Sums 11-15`
      } else if (answer <= 20) {
        category = 'Addition: Sums 16-20'
        factFamily = `Sums 16-20`
      } else {
        category = 'Addition: Sums 20+'
        factFamily = `Sums 20+`
      }
      break
      
    case 'subtraction':
      // Categorize by minuend (starting number)
      if (num1 <= 10) {
        category = 'Subtraction: From 0-10'
        factFamily = `From ${num1}`
      } else if (num1 <= 15) {
        category = 'Subtraction: From 11-15'
        factFamily = `From 11-15`
      } else if (num1 <= 20) {
        category = 'Subtraction: From 16-20'
        factFamily = `From 16-20`
      } else {
        category = 'Subtraction: From 20+'
        factFamily = `From 20+`
      }
      break
      
    case 'multiplication':
      // Categorize by the factors (both ways for commutative property)
      const smallerFactor = Math.min(num1, num2)
      const largerFactor = Math.max(num1, num2)
      
      category = `Multiplication: ${smallerFactor}s facts`
      factFamily = `${smallerFactor}s`
      
      // Special categories
      if (num1 === num2) {
        category = `Multiplication: Squares (${num1}×${num1})`
        factFamily = `Squares`
      } else if (smallerFactor === 0) {
        factFamily = `0s (zero property)`
      } else if (smallerFactor === 1) {
        factFamily = `1s (identity)`
      } else if (smallerFactor === 2) {
        factFamily = `2s (doubles)`
      } else if (smallerFactor === 5) {
        factFamily = `5s`
      } else if (smallerFactor === 10) {
        factFamily = `10s`
      }
      break
      
    case 'division':
      // Categorize by divisor (the number we're dividing by)
      category = `Division: Dividing by ${num2}`
      factFamily = `÷${num2}s`
      
      // Special categories
      if (num2 === 1) {
        factFamily = `÷1 (identity)`
      } else if (num2 === num1 / num2) {
        // Perfect square division
        factFamily = `Perfect divisions`
      }
      break
  }
  
  return { category, factFamily }
}

// Predefined test configurations
export const TEST_CONFIGS = {
  // === CORE FLUENCY ASSESSMENTS ===
  coreFluencyAddition: {
    name: 'Core Fluency: Addition (0-20)',
    category: 'Core Fluency',
    description: 'Automatic recall, make-10 & doubles strategies',
    operations: ['addition'] as const,
    questionsPerOperation: 25,
    totalQuestions: 25,
    timeLimit: 2.5 * 60, // 2.5 minutes (6 seconds per question)
    focusAreas: ['Automatic recall', 'Make-10 strategy', 'Doubles strategy']
  },
  coreFluencySubtraction: {
    name: 'Core Fluency: Subtraction (0-20)',
    category: 'Core Fluency',
    description: 'Inverse relationship & mental subtraction',
    operations: ['subtraction'] as const,
    questionsPerOperation: 25,
    totalQuestions: 25,
    timeLimit: 2.5 * 60, // 2.5 minutes
    focusAreas: ['Inverse relationship', 'Mental subtraction', 'Fact families']
  },
  coreFluencyMultiplication: {
    name: 'Core Fluency: Multiplication (0-12)',
    category: 'Core Fluency',
    description: 'Fact recall & grouping understanding',
    operations: ['multiplication'] as const,
    questionsPerOperation: 25,
    totalQuestions: 25,
    timeLimit: 2.5 * 60, // 2.5 minutes
    focusAreas: ['Fact recall', 'Grouping understanding', 'Commutative property']
  },
  coreFluencyDivision: {
    name: 'Core Fluency: Division (0-12)',
    category: 'Core Fluency',
    description: 'Inverse of multiplication & conceptual sense',
    operations: ['division'] as const,
    questionsPerOperation: 25,
    totalQuestions: 25,
    timeLimit: 2.5 * 60, // 2.5 minutes
    focusAreas: ['Inverse of multiplication', 'Fact retrieval', 'Conceptual understanding']
  },
  
  // === COMBINED CORE ASSESSMENTS ===
  coreAddSub: {
    name: 'Core: Addition & Subtraction',
    category: 'Core Fluency',
    description: 'Combined assessment of addition/subtraction fluency',
    operations: ['addition', 'subtraction'] as const,
    questionsPerOperation: 15,
    totalQuestions: 30,
    timeLimit: 3 * 60, // 3 minutes
    focusAreas: ['Fact families', 'Inverse relationships', 'Strategic thinking']
  },
  coreMultDiv: {
    name: 'Core: Multiplication & Division',
    category: 'Core Fluency',
    description: 'Combined assessment of mult/div fluency',
    operations: ['multiplication', 'division'] as const,
    questionsPerOperation: 15,
    totalQuestions: 30,
    timeLimit: 3 * 60, // 3 minutes
    focusAreas: ['Fact families', 'Inverse relationships', 'Grouping concepts']
  },
  coreAllOperations: {
    name: 'Core: All Operations',
    category: 'Core Fluency',
    description: 'Comprehensive fluency across all four operations',
    operations: ['addition', 'subtraction', 'multiplication', 'division'] as const,
    questionsPerOperation: 15,
    totalQuestions: 60,
    timeLimit: 6 * 60, // 6 minutes
    focusAreas: ['Complete fluency', 'All strategies', 'Conceptual understanding']
  },
  
  // === QUICK CHECKS (Speed Tests) ===
  quickAddition: {
    name: 'Quick Check: Addition',
    category: 'Quick Check',
    description: 'Fast 1-minute addition facts check',
    operations: ['addition'] as const,
    questionsPerOperation: 15,
    totalQuestions: 15,
    timeLimit: 1 * 60, // 1 minute (4 seconds each)
    focusAreas: ['Speed', 'Automatic recall']
  },
  quickSubtraction: {
    name: 'Quick Check: Subtraction',
    category: 'Quick Check',
    description: 'Fast 1-minute subtraction facts check',
    operations: ['subtraction'] as const,
    questionsPerOperation: 15,
    totalQuestions: 15,
    timeLimit: 1 * 60, // 1 minute
    focusAreas: ['Speed', 'Automatic recall']
  },
  quickMultiplication: {
    name: 'Quick Check: Multiplication',
    category: 'Quick Check',
    description: 'Fast 1-minute multiplication facts check',
    operations: ['multiplication'] as const,
    questionsPerOperation: 15,
    totalQuestions: 15,
    timeLimit: 1 * 60, // 1 minute
    focusAreas: ['Speed', 'Automatic recall']
  },
  quickDivision: {
    name: 'Quick Check: Division',
    category: 'Quick Check',
    description: 'Fast 1-minute division facts check',
    operations: ['division'] as const,
    questionsPerOperation: 15,
    totalQuestions: 15,
    timeLimit: 1 * 60, // 1 minute
    focusAreas: ['Speed', 'Automatic recall']
  },
  
  // === EXTENDED PRACTICE (Longer Tests) ===
  extendedAddition: {
    name: 'Extended: Addition Practice',
    category: 'Extended Practice',
    description: 'Extended 40-question addition practice',
    operations: ['addition'] as const,
    questionsPerOperation: 40,
    totalQuestions: 40,
    timeLimit: 5 * 60, // 5 minutes
    focusAreas: ['Sustained fluency', 'All strategies']
  },
  extendedMultiplication: {
    name: 'Extended: Multiplication Practice',
    category: 'Extended Practice',
    description: 'Extended 40-question multiplication practice',
    operations: ['multiplication'] as const,
    questionsPerOperation: 40,
    totalQuestions: 40,
    timeLimit: 5 * 60, // 5 minutes
    focusAreas: ['Sustained fluency', 'All fact families']
  }
}

