/**
 * Improved Goal Question Generator
 * 
 * This service provides multiple strategies for generating questions:
 * 1. Hard-coded templates (fast, free, reliable for common patterns)
 * 2. AI generation (Gemini or OpenAI) for complex/unique goals
 * 3. Hybrid approach with intelligent fallback
 * 
 * Features:
 * - Better pattern detection
 * - Comprehensive template library
 * - AI integration with fallback
 * - Configurable generation method
 * - KaTeX math rendering support
 */

import type { Goal } from '@/types/iep'
import { generateQuestionWithAI } from './aiQuestionGenerator'

/**
 * Helper function to format math expressions for KaTeX
 * Wraps expressions in $...$ for inline math or $$...$$ for display math
 */
function formatMath(expression: string, displayMode: boolean = false): string {
  if (displayMode) {
    return `$$${expression}$$`
  }
  return `$${expression}$`
}

export interface QuestionResult {
  question: string
  answer: string
  alternativeAnswers?: string[] // Alternative acceptable answers for short-answer questions
  explanation?: string
  requiresPhoto?: boolean
  source?: 'template' | 'ai' | 'ai-with-template-reference' | 'fallback' // Track generation source
  aiError?: string // AI error message if generation failed
}

export interface GoalDetection {
  subject: 'math' | 'ela' | 'other'
  isMultiStep: boolean
  isMultiStepScenario: boolean
  needsNumericalExpression: boolean
  needsAlgebraicExpression: boolean
  isWordProblem: boolean
  needsEquation: boolean
  isDivision: boolean
  isMultiplication: boolean
  isSubtraction: boolean
  isAddition: boolean
  isEvaluateExpression: boolean
  isFraction: boolean
  isDecimal: boolean
  operationTypes: string[]
}

export type GenerationMethod = 'template' | 'ai-gemini' | 'ai-openai' | 'hybrid'

export interface GeneratorConfig {
  method: GenerationMethod
  geminiApiKey?: string
  openaiApiKey?: string
  useAIIfTemplateFails?: boolean // For hybrid mode
}

/**
 * Detect goal characteristics for better question generation
 */
export function detectGoalCharacteristics(goal: Goal): GoalDetection {
  const goalText = goal.goalText.toLowerCase()
  const goalTitle = (goal.goalTitle || '').toLowerCase()
  const areaOfNeed = (goal.areaOfNeed || '').toLowerCase()
  
  // Subject detection
  const mathKeywords = ['math', 'mathematics', 'multiplication', 'division', 'addition', 'subtraction', 
    'fraction', 'decimal', 'equation', 'algebra', 'geometry', 'number', 'calculation', 'computation']
  const elaKeywords = ['reading', 'writing', 'comprehension', 'vocabulary', 'grammar', 'spelling', 
    'decoding', 'fluency', 'phonics', 'essay', 'paragraph', 'text', 'literacy', 'language']
  
  let subject: 'math' | 'ela' | 'other' = 'other'
  if (mathKeywords.some(k => areaOfNeed.includes(k) || goalTitle.includes(k) || goalText.includes(k))) {
    subject = 'math'
  } else if (elaKeywords.some(k => areaOfNeed.includes(k) || goalTitle.includes(k) || goalText.includes(k))) {
    subject = 'ela'
  }
  
  // Math-specific detection
  // Check for multi-step patterns (including variations)
  const isMultiStep = goalText.includes('multi-step') || goalText.includes('two-step') || 
                      goalText.includes('two step') || goalText.includes('multistep') ||
                      goalText.includes('multi step') || goalText.includes('multi step word')
  const isMultiStepScenario = isMultiStep && (goalText.includes('real-world') || goalText.includes('scenario'))
  const needsNumericalExpression = goalText.includes('numerical expression') || 
                                   (goalText.includes('write') && goalText.includes('expression') && !goalText.includes('algebraic'))
  const needsAlgebraicExpression = goalText.includes('algebraic expression') || 
                                    (goalText.includes('write') && goalText.includes('expression') && goalText.includes('algebra'))
  // Word problem detection - check for various forms
  const isWordProblem = goalText.includes('word problem') || goalText.includes('word problems') ||
                        goalText.includes('story problem') || goalText.includes('story problems') ||
                        (goalText.includes('solve') && (goalText.includes('problem') || goalText.includes('problems')))
  const needsEquation = goalText.includes('model') || goalText.includes('equation') || 
                        goalText.includes('representational') || goalText.includes('write an equation')
  const isDivision = goalText.includes('division') || goalText.includes('divide') || 
                     goalText.includes('quotient') || goalText.includes('dividend')
  const isMultiplication = goalText.includes('multiplication') || goalText.includes('multiply') || 
                          goalText.includes('product') || goalText.includes('times')
  const isSubtraction = goalText.includes('subtraction') || goalText.includes('subtract') || 
                       goalText.includes('regrouping') || goalText.includes('minus')
  const isAddition = goalText.includes('addition') || goalText.includes('add') || 
                     goalText.includes('sum') || goalText.includes('plus')
  const isEvaluateExpression = goalText.includes('evaluate') && goalText.includes('expression')
  const isFraction = goalText.includes('fraction') || goalText.includes('fractions')
  const isDecimal = goalText.includes('decimal') || goalText.includes('decimals')
  
  // Determine operation types
  const operationTypes: string[] = []
  if (isAddition) operationTypes.push('addition')
  if (isSubtraction) operationTypes.push('subtraction')
  if (isMultiplication) operationTypes.push('multiplication')
  if (isDivision) operationTypes.push('division')
  
  return {
    subject,
    isMultiStep,
    isMultiStepScenario,
    needsNumericalExpression,
    needsAlgebraicExpression,
    isWordProblem,
    needsEquation,
    isDivision,
    isMultiplication,
    isSubtraction,
    isAddition,
    isEvaluateExpression,
    isFraction,
    isDecimal,
    operationTypes
  }
}

/**
 * Generate question using template-based approach
 */
export function generateWithTemplate(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number
): QuestionResult | null {
  if (detection.subject === 'math') {
    return generateMathTemplate(goal, detection, questionNumber)
  } else if (detection.subject === 'ela') {
    return generateELATemplate(goal, detection, questionNumber)
  }
  
  return generateOtherTemplate(goal, questionNumber)
}

/**
 * Generate math question using templates
 */
function generateMathTemplate(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number
): QuestionResult | null {
  const goalText = goal.goalText.toLowerCase()
  
  // PRIORITY 1: Multi-step scenarios with numerical expressions
  if (detection.isMultiStepScenario && detection.needsNumericalExpression) {
    return generateMultiStepNumericalExpression(goal, questionNumber)
  }
  
  // PRIORITY 2: Evaluate expressions
  if (detection.isEvaluateExpression) {
    return generateEvaluateExpression(questionNumber)
  }
  
  // PRIORITY 3: Word problems with equations
  if (detection.isWordProblem && detection.needsEquation) {
    return generateWordProblemWithEquation(goal, detection, questionNumber)
  }
  
  // PRIORITY 4: Word problems with algebraic expressions
  if (detection.isWordProblem && detection.needsAlgebraicExpression) {
    return generateWordProblemWithAlgebraicExpression(goal, questionNumber)
  }
  
  // PRIORITY 5: Multi-step word problems (without expressions)
  // Check this BEFORE single-step word problems
  if (detection.isMultiStep && detection.isWordProblem) {
    return generateMultiStepWordProblem(goal, detection, questionNumber)
  }
  
  // PRIORITY 6: Single-step word problems
  if (detection.isWordProblem) {
    return generateSingleStepWordProblem(goal, detection, questionNumber)
  }
  
  // PRIORITY 7: Fractions
  if (detection.isFraction) {
    return generateFractionProblem(questionNumber)
  }
  
  // PRIORITY 8: Decimals
  if (detection.isDecimal) {
    return generateDecimalProblem(goal, detection, questionNumber)
  }
  
  // PRIORITY 9: Division
  if (detection.isDivision) {
    return generateDivisionProblem(goal, questionNumber)
  }
  
  // PRIORITY 10: Multiplication
  if (detection.isMultiplication) {
    return generateMultiplicationProblem(goal, questionNumber)
  }
  
  // PRIORITY 11: Subtraction
  if (detection.isSubtraction) {
    return generateSubtractionProblem(goal, questionNumber)
  }
  
  // PRIORITY 12: Addition
  if (detection.isAddition) {
    return generateAdditionProblem(questionNumber)
  }
  
  // PRIORITY 13: Solving equations
  if (goalText.includes('solve') && goalText.includes('equation')) {
    return generateEquationProblem(goal, questionNumber)
  }
  
  // Default: simple arithmetic
  return generateDefaultMathProblem(questionNumber)
}

/**
 * Generate multi-step scenario with numerical expression
 */
function generateMultiStepNumericalExpression(goal: Goal, questionNumber: number): QuestionResult {
  const scenarios = [
    {
      name: 'basketball',
      template: (a: number, b: number, multiplier: number) => {
        const total = (a + b) * multiplier
        const name = goal.goalTitle?.includes('Carter') ? 'Carter' : 
                     goal.goalTitle?.includes('Tia') ? 'Tia' : 'Alex'
        const pronoun = name === 'Carter' ? 'his' : 'her'
        const pronoun2 = name === 'Carter' ? 'He' : 'She'
        return {
          question: `${name} scored ${a} and ${b} points in ${pronoun} first two basketball games. ${pronoun2} scored ${multiplier === 2 ? 'twice' : `${multiplier} times`} as many points in ${pronoun} third game as the first two games combined.\n\n1) Write a numerical expression representing this problem\n2) Calculate the answer\n3) Show your work`,
          answer: `Expression: ${formatMath(`(${a} + ${b}) \\times ${multiplier}`)}  OR  ${formatMath(`(${a} + ${b}) \\cdot ${multiplier}`)}\nAnswer: ${total} points`,
          requiresPhoto: true
        }
      }
    },
    {
      name: 'shopping',
      template: (a: number, b: number, multiplier: number) => {
        const total = (a + b) * multiplier
        return {
          question: `Maria bought ${a} apples and ${b} oranges. She bought ${multiplier} times as many bananas as the total number of apples and oranges.\n\n1) Write a numerical expression representing this problem\n2) Calculate the answer\n3) Show your work`,
          answer: `Expression: ${formatMath(`(${a} + ${b}) \\times ${multiplier}`)}  OR  ${formatMath(`(${a} + ${b}) \\cdot ${multiplier}`)}\nAnswer: ${total} bananas`,
          requiresPhoto: true
        }
      }
    },
    {
      name: 'savings',
      template: (a: number, b: number, multiplier: number) => {
        const total = (a + b) * multiplier
        return {
          question: `Jamal saved $${a} in January and $${b} in February. In March, he saved ${multiplier} times as much as he saved in January and February combined.\n\n1) Write a numerical expression representing this problem\n2) Calculate the answer\n3) Show your work`,
          answer: `Expression: ${formatMath(`(${a} + ${b}) \\times ${multiplier}`)}  OR  ${formatMath(`(${a} + ${b}) \\cdot ${multiplier}`)}\nAnswer: $${total}`,
          requiresPhoto: true
        }
      }
    }
  ]
  
  const scenario = scenarios[questionNumber % scenarios.length]
  const a = Math.floor(Math.random() * 15) + 10
  const b = Math.floor(Math.random() * 15) + 10
  const multiplier = Math.floor(Math.random() * 3) + 2 // 2, 3, or 4
  
  return scenario.template(a, b, multiplier)
}

/**
 * Generate evaluate expression problem
 */
function generateEvaluateExpression(questionNumber: number): QuestionResult {
  const operations = ['+', '-', '×', '÷']
  const op = operations[questionNumber % operations.length]
  const x = Math.floor(Math.random() * 20) + 1
  const a = Math.floor(Math.random() * 15) + 1
  
  switch(op) {
    case '+':
      return {
        question: `Evaluate the expression ${formatMath(`x + ${a}`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x + a).toString(),
        requiresPhoto: true
      }
    case '-':
      return {
        question: `Evaluate the expression ${formatMath(`x - ${a}`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x - a).toString(),
        requiresPhoto: true
      }
    case '×':
      return {
        question: `Evaluate the expression ${formatMath(`${a}x`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x * a).toString(),
        requiresPhoto: true
      }
    case '÷':
      const dividend = x * a
      return {
        question: `Evaluate the expression ${formatMath(`x \\div ${a}`)} when ${formatMath(`x = ${dividend}`)}. Show your work.`,
        answer: x.toString(),
        requiresPhoto: true
      }
    default:
      return {
        question: `Evaluate the expression ${formatMath(`x + ${a}`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x + a).toString(),
        requiresPhoto: true
      }
  }
}

/**
 * Generate word problem with equation modeling
 */
function generateWordProblemWithEquation(goal: Goal, detection: GoalDetection, questionNumber: number): QuestionResult {
  const scenarios = [
    {
      name: 'shopping',
      template: () => {
        const initial = Math.floor(Math.random() * 30) + 20
        const spent = Math.floor(Math.random() * 15) + 5
        const remaining = initial - spent
        return {
          question: `Maria had $${initial}. She bought a game for $${spent}. How much money does she have left?\n\n1) Write an equation to model this problem\n2) Solve the equation\n3) Show your work with a drawing or model`,
          answer: `Equation: ${formatMath(`${initial} - ${spent} = x`)}  OR  ${formatMath(`x = ${initial} - ${spent}`)}\nAnswer: $${remaining}`,
          requiresPhoto: true
        }
      }
    },
    {
      name: 'grouping',
      template: () => {
        const total = Math.floor(Math.random() * 30) + 20
        const groups = Math.floor(Math.random() * 5) + 2
        const each = Math.floor(total / groups)
        const actualTotal = each * groups
        return {
          question: `There are ${actualTotal} students going on a field trip. They need to split into ${groups} equal groups. How many students will be in each group?\n\n1) Write an equation to model this problem\n2) Solve the equation\n3) Show your work with a drawing or model`,
          answer: `Equation: ${formatMath(`${actualTotal} \\div ${groups} = x`)}  OR  ${formatMath(`${groups} \\times x = ${actualTotal}`)}\nAnswer: ${each} students`,
          requiresPhoto: true
        }
      }
    },
    {
      name: 'total',
      template: () => {
        const part1 = Math.floor(Math.random() * 20) + 10
        const part2 = Math.floor(Math.random() * 20) + 10
        const total = part1 + part2
        return {
          question: `Jamal scored ${part1} points in the first half of the game and ${part2} points in the second half. How many total points did he score?\n\n1) Write an equation to model this problem\n2) Solve the equation\n3) Show your work with a drawing or model`,
          answer: `Equation: ${formatMath(`${part1} + ${part2} = x`)}  OR  ${formatMath(`x = ${part1} + ${part2}`)}\nAnswer: ${total} points`,
          requiresPhoto: true
        }
      }
    }
  ]
  
  const scenario = scenarios[questionNumber % scenarios.length]
  return scenario.template()
}

/**
 * Generate word problem with algebraic expression
 */
function generateWordProblemWithAlgebraicExpression(goal: Goal, questionNumber: number): QuestionResult {
  const scenarios = [
    {
      template: () => {
        const less = Math.floor(Math.random() * 10) + 2
        return {
          question: `Amy has ${less} less pencils than Mary Ann. If Mary Ann has ${formatMath(`x`)} pencils, write an algebraic expression to represent the number of pencils Amy has.`,
          answer: formatMath(`x - ${less}`),
          requiresPhoto: true
        }
      }
    },
    {
      template: () => {
        const more = Math.floor(Math.random() * 10) + 2
        return {
          question: `Carlos has ${more} more books than Sarah. If Sarah has ${formatMath(`x`)} books, write an algebraic expression to represent the number of books Carlos has.`,
          answer: formatMath(`x + ${more}`),
          requiresPhoto: true
        }
      }
    },
    {
      template: () => {
        const times = Math.floor(Math.random() * 5) + 2
        return {
          question: `Emma has ${times} times as many stickers as Jake. If Jake has ${formatMath(`x`)} stickers, write an algebraic expression to represent the number of stickers Emma has.`,
          answer: `${formatMath(`${times}x`)}  OR  ${formatMath(`${times} \\cdot x`)}`,
          requiresPhoto: true
        }
      }
    }
  ]
  
  const scenario = scenarios[questionNumber % scenarios.length]
  return scenario.template()
}

/**
 * Generate multi-step word problem
 */
function generateMultiStepWordProblem(goal: Goal, detection: GoalDetection, questionNumber: number): QuestionResult {
  const goalText = goal.goalText.toLowerCase()
  const hasFractions = goalText.includes('fraction') || goalText.includes('fractions')
  const hasDecimals = goalText.includes('decimal') || goalText.includes('decimals')
  
  const scenarios = [
    {
      template: () => {
        const initial = Math.floor(Math.random() * 50) + 20
        const item1 = Math.floor(Math.random() * 15) + 5
        const item2 = Math.floor(Math.random() * 15) + 5
        const total = initial - item1 - item2
        return {
          question: `Maya had $${initial}. She bought a book for $${item1} and a notebook for $${item2}. How much money does she have left?\n\nShow your work step by step.`,
          answer: `Step 1: ${initial} - ${item1} = ${initial - item1}\nStep 2: ${initial - item1} - ${item2} = ${total}\nAnswer: $${total}`,
          requiresPhoto: true
        }
      }
    },
    {
      template: () => {
        const bags = Math.floor(Math.random() * 6) + 2
        const perBag = Math.floor(Math.random() * 8) + 3
        const total = bags * perBag
        const shared = Math.floor(Math.random() * 3) + 2
        const each = Math.floor(total / shared)
        return {
          question: `There are ${bags} bags with ${perBag} candies in each bag. If ${shared} friends share all the candies equally, how many candies will each friend get?\n\nShow your work step by step.`,
          answer: `Step 1: ${bags} × ${perBag} = ${total} candies total\nStep 2: ${total} ÷ ${shared} = ${each} candies per friend\nAnswer: ${each} candies`,
          requiresPhoto: true
        }
      }
    },
    {
      template: () => {
        const part1 = Math.floor(Math.random() * 30) + 10
        const part2 = Math.floor(Math.random() * 30) + 10
        const part3 = Math.floor(Math.random() * 20) + 5
        const total = part1 + part2 + part3
        return {
          question: `A store sold ${part1} items on Monday, ${part2} items on Tuesday, and ${part3} items on Wednesday. How many items did they sell in all three days?\n\nShow your work step by step.`,
          answer: `Step 1: ${part1} + ${part2} = ${part1 + part2}\nStep 2: ${part1 + part2} + ${part3} = ${total}\nAnswer: ${total} items`,
          requiresPhoto: true
        }
      }
    },
    {
      template: () => {
        const total = Math.floor(Math.random() * 60) + 30
        const used1 = Math.floor(Math.random() * 20) + 10
        const used2 = Math.floor(Math.random() * 15) + 5
        const remaining = total - used1 - used2
        return {
          question: `A factory had ${total} boxes. They shipped ${used1} boxes on Monday and ${used2} boxes on Tuesday. How many boxes are left?\n\nShow your work step by step.`,
          answer: `Step 1: ${total} - ${used1} = ${total - used1}\nStep 2: ${total - used1} - ${used2} = ${remaining}\nAnswer: ${remaining} boxes`,
          requiresPhoto: true
        }
      }
    }
  ]
  
  const scenario = scenarios[questionNumber % scenarios.length]
  return scenario.template()
}

/**
 * Generate single-step word problem
 */
function generateSingleStepWordProblem(goal: Goal, detection: GoalDetection, questionNumber: number): QuestionResult {
  const operations = detection.operationTypes.length > 0 
    ? detection.operationTypes 
    : ['addition', 'subtraction', 'multiplication', 'division']
  
  const op = operations[questionNumber % operations.length]
  
  switch(op) {
    case 'addition':
      const a1 = Math.floor(Math.random() * 20) + 10
      const b1 = Math.floor(Math.random() * 15) + 5
      return {
        question: `There are ${a1} red marbles and ${b1} blue marbles. How many marbles are there in total? Show your work.`,
        answer: (a1 + b1).toString(),
        requiresPhoto: true
      }
    case 'subtraction':
      const initial = Math.floor(Math.random() * 20) + 20
      const spent = Math.floor(Math.random() * 12) + 5
      return {
        question: `Sarah has $${initial}. She buys an item for $${spent}. How much money does she have left? Show your work.`,
        answer: `$${initial - spent}`,
        requiresPhoto: true
      }
    case 'multiplication':
      const groups = Math.floor(Math.random() * 6) + 3
      const each = Math.floor(Math.random() * 8) + 2
      return {
        question: `There are ${groups} bags with ${each} candies in each bag. How many candies are there in total? Show your work.`,
        answer: (groups * each).toString(),
        requiresPhoto: true
      }
    case 'division':
      const total = Math.floor(Math.random() * 40) + 20
      const bags = Math.floor(Math.random() * 6) + 2
      const result = Math.floor(total / bags)
      return {
        question: `A store has ${total} apples. They want to put them equally into ${bags} bags. How many apples will be in each bag? Show your work.`,
        answer: result.toString(),
        requiresPhoto: true
      }
    default:
      return generateDefaultMathProblem(questionNumber)
  }
}

/**
 * Generate fraction problem
 */
function generateFractionProblem(questionNumber: number): QuestionResult {
  const numerators = [1, 2, 3, 1, 2]
  const denominators = [2, 3, 4, 3, 5]
  const idx1 = questionNumber % numerators.length
  const idx2 = (questionNumber + 1) % numerators.length
  const n1 = numerators[idx1]
  const d1 = denominators[idx1]
  const n2 = numerators[idx2]
  const d2 = denominators[idx2]
  
  if (questionNumber % 2 === 0) {
    // Addition
    const lcd = d1 * d2 / gcd(d1, d2)
    const num1 = n1 * (lcd / d1)
    const num2 = n2 * (lcd / d2)
    const resultNum = num1 + num2
    const simplifiedGcd = gcd(resultNum, lcd)
    const answer = simplifiedGcd === lcd 
      ? `${resultNum / simplifiedGcd}` 
      : `${resultNum / simplifiedGcd}/${lcd / simplifiedGcd}`
    return {
      question: `Solve: ${formatMath(`\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`)}. Show your work.`,
      answer: answer.includes('/') ? formatMath(`\\frac{${answer.split('/')[0]}}{${answer.split('/')[1]}}`) : answer,
      requiresPhoto: true
    }
  } else {
    // Comparison
    return {
      question: `Compare: ${formatMath(`\\frac{${n1}}{${d1}}`)} __ ${formatMath(`\\frac{${n2}}{${d2}}`)}  (Use <, >, or =). Show your work.`,
      answer: (n1 / d1 > n2 / d2) ? '>' : (n1 / d1 < n2 / d2) ? '<' : '=',
      requiresPhoto: true
    }
  }
}

/**
 * Generate decimal problem
 */
function generateDecimalProblem(goal: Goal, detection: GoalDetection, questionNumber: number): QuestionResult {
  if (detection.isMultiplication) {
    const decimal = (Math.random() * 20 + 10).toFixed(2)
    const whole = Math.floor(Math.random() * 10) + 1
    const answer = (parseFloat(decimal) * whole).toFixed(2)
    return {
      question: `Calculate: ${formatMath(`${decimal} \\times ${whole}`)}. Show your work.`,
      answer: answer,
      requiresPhoto: true
    }
  } else if (detection.isDivision) {
    const decimal = (Math.random() * 20 + 10).toFixed(2)
    const whole = Math.floor(Math.random() * 10) + 1
    const answer = (parseFloat(decimal) / whole).toFixed(2)
    return {
      question: `Calculate: ${formatMath(`${decimal} \\div ${whole}`)}. Show your work.`,
      answer: answer,
      requiresPhoto: true
    }
  }
  
  return generateDefaultMathProblem(questionNumber)
}

/**
 * Generate division problem
 */
function generateDivisionProblem(goal: Goal, questionNumber: number): QuestionResult {
  const b = Math.floor(Math.random() * 12) + 2
  const result = Math.floor(Math.random() * 12) + 2
  const a = b * result
  return {
    question: `Calculate: ${formatMath(`${a} \\div ${b}`)}. Show your work.`,
    answer: result.toString(),
    requiresPhoto: true
  }
}

/**
 * Generate multiplication problem
 */
function generateMultiplicationProblem(goal: Goal, questionNumber: number): QuestionResult {
  const a = Math.floor(Math.random() * 12) + 2
  const b = Math.floor(Math.random() * 12) + 2
  return {
    question: `Calculate: ${formatMath(`${a} \\times ${b}`)}. Show your work.`,
    answer: (a * b).toString(),
    requiresPhoto: true
  }
}

/**
 * Generate subtraction problem
 */
function generateSubtractionProblem(goal: Goal, questionNumber: number): QuestionResult {
  const a = Math.floor(Math.random() * 20) + 10
  const b = Math.floor(Math.random() * 15) + 3
  return {
    question: `Calculate: ${formatMath(`${a} - ${b}`)}. Show your work.`,
    answer: (a - b).toString(),
    requiresPhoto: true
  }
}

/**
 * Generate addition problem
 */
function generateAdditionProblem(questionNumber: number): QuestionResult {
  const a = Math.floor(Math.random() * 20) + 5
  const b = Math.floor(Math.random() * 15) + 3
  return {
    question: `Calculate: ${formatMath(`${a} + ${b}`)}. Show your work.`,
    answer: (a + b).toString(),
    requiresPhoto: true
  }
}

/**
 * Generate equation solving problem
 */
function generateEquationProblem(goal: Goal, questionNumber: number): QuestionResult {
  const goalText = goal.goalText.toLowerCase()
  const isMultiStep = goalText.includes('multi-step') || goalText.includes('two-step')
  
  if (isMultiStep) {
    const x = Math.floor(Math.random() * 10) + 1
    const a = Math.floor(Math.random() * 10) + 1
    const b = Math.floor(Math.random() * 15) + 1
    const result = a * x + b
    return {
      question: `Solve for x: ${a}x + ${b} = ${result}. Show all steps.`,
      answer: x.toString(),
      explanation: `Subtract ${b} from both sides: ${a}x = ${result - b}, then divide by ${a}: x = ${x}`,
      requiresPhoto: true
    }
  } else {
    const x = Math.floor(Math.random() * 20) + 1
    const a = Math.floor(Math.random() * 15) + 1
    const result = x + a
    return {
      question: `Solve for ${formatMath(`x`)}: ${formatMath(`x + ${a} = ${result}`)}. Show your work.`,
      answer: x.toString(),
      explanation: `Subtract ${a} from both sides: ${formatMath(`x = ${x}`)}`,
      requiresPhoto: true
    }
  }
}

/**
 * Generate default math problem
 */
function generateDefaultMathProblem(questionNumber: number): QuestionResult {
  const operations = ['+', '-', '×', '÷']
  const op = operations[questionNumber % operations.length]
  const a = Math.floor(Math.random() * 20) + 5
  const b = Math.floor(Math.random() * 15) + 3
  
  switch(op) {
    case '+':
      return {
        question: `Calculate: ${a} + ${b}. Show your work.`,
        answer: (a + b).toString(),
        requiresPhoto: true
      }
    case '-':
      return {
        question: `Calculate: ${a} - ${b}. Show your work.`,
        answer: (a - b).toString(),
        requiresPhoto: true
      }
    case '×':
      return {
        question: `Calculate: ${a} × ${b}. Show your work.`,
        answer: (a * b).toString(),
        requiresPhoto: true
      }
    case '÷':
      const dividend = a * b
      return {
        question: `Calculate: ${dividend} ÷ ${a}. Show your work.`,
        answer: b.toString(),
        requiresPhoto: true
      }
    default:
      return {
        question: `Calculate: ${a} + ${b}. Show your work.`,
        answer: (a + b).toString(),
        requiresPhoto: true
      }
  }
}

/**
 * Generate ELA question using templates
 */
function generateELATemplate(goal: Goal, detection: GoalDetection, questionNumber: number): QuestionResult {
  const goalText = goal.goalText.toLowerCase()
  
  if (goalText.includes('summariz')) {
    return {
      question: `Read the following text and write a summary that includes the central idea and 3 supporting details:\n\n[Text passage will be provided]`,
      answer: 'Teacher will grade based on rubric',
      explanation: 'This is a constructed response question that requires teacher evaluation.',
      requiresPhoto: false
    }
  } else if (goalText.includes('comprehension') || goalText.includes('text')) {
    return {
      question: `Read the following text and answer the question below. Provide evidence from the text to support your answer:\n\n[Text passage and question will be provided]`,
      answer: 'Teacher will grade based on rubric',
      explanation: 'This is a constructed response question that requires teacher evaluation.',
      requiresPhoto: false
    }
  } else if (goalText.includes('writing') || goalText.includes('paragraph')) {
    return {
      question: `Respond to prompt ${questionNumber} based on the goal.`,
      answer: 'Teacher will grade based on rubric',
      explanation: 'This is a constructed response question that requires teacher evaluation.',
      requiresPhoto: false
    }
  }
  
  return {
    question: `Respond to prompt ${questionNumber} based on the goal.`,
    answer: 'Teacher will grade based on rubric',
    explanation: 'This is a constructed response question that requires teacher evaluation.',
    requiresPhoto: false
  }
}

/**
 * Generate other subject question
 */
function generateOtherTemplate(goal: Goal, questionNumber: number): QuestionResult {
  return {
    question: `Respond to prompt ${questionNumber}.`,
    answer: 'Teacher will grade',
    explanation: 'Open-ended response requiring teacher evaluation.',
    requiresPhoto: false
  }
}

/**
 * Helper: GCD calculation
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * Main function: Generate question for a goal
 */
export async function generateQuestionForGoal(
  goal: Goal,
  questionNumber: number,
  config: GeneratorConfig = { method: 'hybrid' }
): Promise<QuestionResult> {
  const detection = detectGoalCharacteristics(goal)
  
  // Always generate template first for hybrid mode (to use as reference)
  let templateResult: QuestionResult | null = null
  if (config.method === 'template' || config.method === 'hybrid') {
    templateResult = generateWithTemplate(goal, detection, questionNumber)
    if (templateResult) {
      templateResult.source = 'template'
      if (config.method === 'template') {
        return templateResult
      }
    }
  }
  
  // For hybrid mode: use AI with template as reference, or use template directly
  if (config.method === 'hybrid') {
    // If we have a template and want to use AI with it as reference
    if (templateResult) {
      try {
        const aiConfig = {
          provider: 'google' as 'google' | 'openai',
          apiKey: config.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
          model: 'gemini-flash-latest'
        }
        
        if (aiConfig.apiKey) {
          // Use AI with template as reference for variation
          const aiResult = await generateQuestionWithAI(
            goal,
            detection.subject,
            questionNumber,
            aiConfig,
            templateResult // Pass template as reference
          )
          return {
            ...aiResult,
            source: 'ai-with-template-reference'
          }
        }
      } catch (error) {
        console.warn('AI generation failed, using template:', error)
        // Fallback to template if AI fails
        if (templateResult) {
          return {
            ...templateResult,
            source: 'fallback',
            aiError: error instanceof Error ? error.message : 'AI generation failed'
          }
        }
      }
    }
    
    // If no template or AI failed, try AI without reference
    if (!templateResult) {
      try {
        const aiConfig = {
          provider: 'google' as 'google' | 'openai',
          apiKey: config.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
          model: 'gemini-flash-latest'
        }
        
        if (aiConfig.apiKey) {
          const aiResult = await generateQuestionWithAI(
            goal,
            detection.subject,
            questionNumber,
            aiConfig
          )
          return {
            ...aiResult,
            source: 'ai'
          }
        }
      } catch (error) {
        console.warn('AI generation failed:', error)
      }
    }
    
    // Final fallback: use template if available
    if (templateResult) {
      return templateResult
    }
  }
  
  // Use AI generation (non-hybrid)
  if (config.method === 'ai-gemini' || config.method === 'ai-openai') {
    try {
      const aiConfig = {
        provider: config.method === 'ai-gemini' ? 'google' : 'openai' as 'google' | 'openai',
        apiKey: config.method === 'ai-gemini' 
          ? (config.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '')
          : (config.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY || ''),
        model: config.method === 'ai-gemini' ? 'gemini-flash-latest' : 'gpt-3.5-turbo'
      }
      
      if (!aiConfig.apiKey) {
        throw new Error(`API key not configured for ${config.method}`)
      }
      
      const aiResult = await generateQuestionWithAI(
        goal,
        detection.subject,
        questionNumber,
        aiConfig,
        templateResult || undefined // Pass template as reference if available
      )
      return {
        ...aiResult,
        source: templateResult ? 'ai-with-template-reference' : 'ai'
      }
    } catch (error) {
      console.warn('AI generation failed, falling back to template:', error)
      // Fallback to template
      if (templateResult) {
        return {
          ...templateResult,
          source: 'fallback',
          aiError: error instanceof Error ? error.message : 'AI generation failed'
        }
      }
    }
  }
  
  // Final fallback
  const finalTemplateResult = generateWithTemplate(goal, detection, questionNumber)
  if (finalTemplateResult) {
    return {
      ...finalTemplateResult,
      source: 'template'
    }
  }
  
  // Ultimate fallback
  return {
    question: `Respond to prompt ${questionNumber} based on the goal: ${goal.goalTitle}`,
    answer: 'Teacher will grade',
    explanation: 'Open-ended response requiring teacher evaluation.',
    requiresPhoto: false
  }
}

