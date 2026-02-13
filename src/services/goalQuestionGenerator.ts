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

import type { Goal, GoalTemplate } from '@/types/iep'
import { generateQuestionWithAI } from './aiQuestionGenerator'
import { getAIModel } from '@/config/aiModels'

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
  answerPrefix?: string // Prefix like "x=" or "$"
  answerSuffix?: string // Suffix like " hours" or " dollars"
  alternativeAnswers?: string[] // Alternative acceptable answers for short-answer questions
  explanation?: string
  requiresPhoto?: boolean
  source?: 'template' | 'ai' | 'ai-with-template-reference' | 'fallback' // Track generation source
  aiError?: string // AI error message if generation failed
  questionCategory?: 'computation' | 'word-problem' | 'conceptual' | 'application' // NEW: Question type
  questionType?:
    | 'multiple-choice'
    | 'short-answer'
    | 'essay'
    | 'true-false'
    | 'fill-blank'
    | 'matching'
    | 'fraction'
    | 'rank-order'
    | 'checkbox'
    | 'horizontal-ordering'
    | 'algebra-tiles' // Question type
  options?: string[] // For multiple-choice questions
}

export interface GoalDetection {
  subject: 'math' | 'ela' | 'other'
  topic: string // NEW: Detected topic (e.g., "Money", "Elapsed Time", "Fractions")
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
  questionCategory: 'computation' | 'word-problem' | 'conceptual' | 'application' // NEW: Question type
}

export type GenerationMethod = 'template' | 'ai-gemini' | 'ai-openai' | 'hybrid'

export interface GeneratorConfig {
  method: GenerationMethod
  geminiApiKey?: string
  openaiApiKey?: string
  useAIIfTemplateFails?: boolean // For hybrid mode
  difficulty?: 'easy' | 'medium' | 'hard'
  previousQuestions?: QuestionResult[] // Previously generated questions to avoid duplicates
}

/**
 * Detect goal characteristics for better question generation
 * @param goal - The goal to analyze
 * @param allowedOperations - Optional: Restrict operations to specific types (from template)
 */
export function detectGoalCharacteristics(
  goal: Goal,
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[],
): GoalDetection {
  const goalText = goal.goalText.toLowerCase()
  const goalTitle = (goal.goalTitle || '').toLowerCase()
  const areaOfNeed = (goal.areaOfNeed || '').toLowerCase()

  // Subject detection
  const mathKeywords = [
    'math',
    'mathematics',
    'multiplication',
    'division',
    'addition',
    'subtraction',
    'fraction',
    'decimal',
    'equation',
    'algebra',
    'geometry',
    'number',
    'calculation',
    'computation',
  ]
  const elaKeywords = [
    'reading',
    'writing',
    'comprehension',
    'vocabulary',
    'grammar',
    'spelling',
    'decoding',
    'fluency',
    'phonics',
    'essay',
    'paragraph',
    'text',
    'literacy',
    'language',
  ]

  let subject: 'math' | 'ela' | 'other' = 'other'
  if (
    mathKeywords.some(
      (k) => areaOfNeed.includes(k) || goalTitle.includes(k) || goalText.includes(k),
    )
  ) {
    subject = 'math'
  } else if (
    elaKeywords.some((k) => areaOfNeed.includes(k) || goalTitle.includes(k) || goalText.includes(k))
  ) {
    subject = 'ela'
  }

  // Math-specific detection
  // Check for multi-step patterns (including variations)
  const isMultiStep =
    goalText.includes('multi-step') ||
    goalText.includes('two-step') ||
    goalText.includes('two step') ||
    goalText.includes('multistep') ||
    goalText.includes('multi step') ||
    goalText.includes('multi step word')
  const isMultiStepScenario =
    isMultiStep && (goalText.includes('real-world') || goalText.includes('scenario'))
  const needsNumericalExpression =
    goalText.includes('numerical expression') ||
    (goalText.includes('write') &&
      goalText.includes('expression') &&
      !goalText.includes('algebraic'))
  const needsAlgebraicExpression =
    goalText.includes('algebraic expression') ||
    (goalText.includes('write') && goalText.includes('expression') && goalText.includes('algebra'))
  // Word problem detection - check for various forms
  const isWordProblem =
    goalText.includes('word problem') ||
    goalText.includes('word problems') ||
    goalText.includes('story problem') ||
    goalText.includes('story problems') ||
    (goalText.includes('solve') && (goalText.includes('problem') || goalText.includes('problems')))
  const needsEquation =
    goalText.includes('model') ||
    goalText.includes('equation') ||
    goalText.includes('representational') ||
    goalText.includes('write an equation')
  const isDivision =
    goalText.includes('division') ||
    goalText.includes('divide') ||
    goalText.includes('quotient') ||
    goalText.includes('dividend')
  const isMultiplication =
    goalText.includes('multiplication') ||
    goalText.includes('multiply') ||
    goalText.includes('product') ||
    goalText.includes('times')
  const isSubtraction =
    goalText.includes('subtraction') ||
    goalText.includes('subtract') ||
    goalText.includes('regrouping') ||
    goalText.includes('minus')
  const isAddition =
    goalText.includes('addition') ||
    goalText.includes('add') ||
    goalText.includes('sum') ||
    goalText.includes('plus')
  const isEvaluateExpression = goalText.includes('evaluate') && goalText.includes('expression')
  const isFraction = goalText.includes('fraction') || goalText.includes('fractions')
  const isDecimal = goalText.includes('decimal') || goalText.includes('decimals')

  // Determine operation types
  const operationTypes: string[] = []

  // If allowedOperations is specified (from template), use ONLY those operations
  if (allowedOperations && allowedOperations.length > 0) {
    operationTypes.push(...allowedOperations)
    console.log(`✨ Using allowed operations from template: ${allowedOperations.join(', ')}`)
  } else {
    // Otherwise, detect from goal text as usual
    if (isAddition) operationTypes.push('addition')
    if (isSubtraction) operationTypes.push('subtraction')
    if (isMultiplication) operationTypes.push('multiplication')
    if (isDivision) operationTypes.push('division')
  }

  // Topic detection - check for specific math/ELA topics
  let topic = ''
  const topicKeywords = [
    { keywords: ['elapsed time', 'time elapsed', 'time calculation'], topic: 'Elapsed Time' },
    { keywords: ['money', 'dollar', 'cost', 'price', 'purchase', 'buy'], topic: 'Money' },
    { keywords: ['fraction', 'fractions', 'numerator', 'denominator'], topic: 'Fractions' },
    { keywords: ['decimal', 'decimals'], topic: 'Decimals' },
    { keywords: ['percent', 'percentage'], topic: 'Percentages' },
    { keywords: ['area', 'perimeter', 'volume', 'geometry'], topic: 'Geometry' },
    { keywords: ['algebra', 'equation', 'variable', 'expression'], topic: 'Algebra' },
    { keywords: ['ratio', 'proportion'], topic: 'Ratios & Proportions' },
    { keywords: ['measurement', 'measure', 'length', 'weight'], topic: 'Measurement' },
    { keywords: ['graph', 'chart', 'data', 'statistics'], topic: 'Data & Graphs' },
    {
      keywords: ['reading comprehension', 'main idea', 'inference'],
      topic: 'Reading Comprehension',
    },
    { keywords: ['vocabulary', 'word meaning', 'context clue'], topic: 'Vocabulary' },
    { keywords: ['writing', 'essay', 'paragraph'], topic: 'Writing' },
    { keywords: ['grammar', 'punctuation', 'syntax'], topic: 'Grammar' },
  ]

  // Check for topic matches (first match wins)
  for (const { keywords, topic: topicName } of topicKeywords) {
    if (
      keywords.some((k) => goalText.includes(k) || areaOfNeed.includes(k) || goalTitle.includes(k))
    ) {
      topic = topicName
      break
    }
  }

  // Fallback to area of need or generic topic
  if (!topic) {
    if (subject === 'math') {
      topic = 'Math'
    } else if (subject === 'ela') {
      topic = 'Reading/Writing'
    } else {
      topic = 'General'
    }
  }

  // NEW: Detect question category
  let questionCategory: 'computation' | 'word-problem' | 'conceptual' | 'application' =
    'word-problem' // Default to word-problem

  // Prioritize explicit keywords for category
  if (
    goalText.includes('computation') ||
    goalText.includes('calculate') ||
    goalText.includes('solve equation') ||
    goalText.includes('evaluate expression') ||
    goalText.includes('properties of operations')
  ) {
    questionCategory = 'computation'
  } else if (
    goalText.includes('explain') ||
    goalText.includes('demonstrate understanding') ||
    goalText.includes('identify') ||
    goalText.includes('recognize')
  ) {
    questionCategory = 'conceptual'
  } else if (
    goalText.includes('apply') ||
    goalText.includes('use in context') ||
    goalText.includes('practical problem')
  ) {
    questionCategory = 'application'
  } else if (
    goalText.includes('word problem') ||
    goalText.includes('real-world') ||
    goalText.includes('scenario') ||
    goalText.includes('story problem')
  ) {
    questionCategory = 'word-problem'
  }

  // Refine category based on other detections
  if (subject === 'math') {
    if (isWordProblem || isMultiStepScenario) {
      questionCategory = 'word-problem'
    } else if (
      isEvaluateExpression ||
      needsNumericalExpression ||
      needsAlgebraicExpression ||
      operationTypes.length > 0
    ) {
      // If it's clearly about operations/expressions and not a word problem, lean towards computation
      if (questionCategory !== 'conceptual' && questionCategory !== 'application') {
        questionCategory = 'computation'
      }
    }
  }

  return {
    subject,
    topic, // NEW: Include detected topic
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
    operationTypes,
    questionCategory, // NEW: Include detected question category
  }
}

/**
 * Generate question using template-based approach
 */
export function generateWithTemplate(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number,
): QuestionResult | null {
  let result: QuestionResult | null = null

  if (detection.subject === 'math') {
    result = generateMathTemplate(goal, detection, questionNumber)
  } else if (detection.subject === 'ela') {
    result = generateELATemplate(goal, detection, questionNumber)
  } else {
    result = generateOtherTemplate(goal, questionNumber)
  }

  // Adjust requiresPhoto based on assessmentMethod if result exists
  if (result && goal.assessmentMethod) {
    if (goal.assessmentMethod === 'app') {
      // For app-based assessments, prefer no photo requirement
      result.requiresPhoto = false
    } else if (goal.assessmentMethod === 'paper') {
      // For paper-based assessments, prefer photo requirement for showing work
      if (detection.subject === 'math' && (detection.isWordProblem || detection.isMultiStep)) {
        result.requiresPhoto = true
      }
    }
    // For hybrid, keep the default behavior (can have either)
  }

  return result
}

/**
 * Generate math question using templates
 */
function generateMathTemplate(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number,
): QuestionResult | null {
  const goalText = goal.goalText.toLowerCase()
  const areaOfNeed = (goal.areaOfNeed || '').toLowerCase()

  // PRIORITY 1: Elapsed Time (check FIRST before generic word problems)
  if (goalText.includes('elapsed time') || areaOfNeed.includes('elapsed time')) {
    return generateElapsedTimeProblem(questionNumber)
  }

  // PRIORITY 2: Multi-step scenarios with numerical expressions
  if (detection.isMultiStepScenario && detection.needsNumericalExpression) {
    return generateMultiStepNumericalExpression(goal, questionNumber)
  }

  // PRIORITY 3: Evaluate expressions
  if (detection.isEvaluateExpression) {
    return generateEvaluateExpression(questionNumber)
  }

  // PRIORITY 4: Word problems with equations
  if (detection.isWordProblem && detection.needsEquation) {
    return generateWordProblemWithEquation(goal, detection, questionNumber)
  }

  // PRIORITY 5: Word problems with algebraic expressions
  if (detection.isWordProblem && detection.needsAlgebraicExpression) {
    return generateWordProblemWithAlgebraicExpression(goal, questionNumber)
  }

  // PRIORITY 6: Multi-step word problems (without expressions)
  // Check this BEFORE single-step word problems
  if (detection.isMultiStep && detection.isWordProblem) {
    return generateMultiStepWordProblem(goal, detection, questionNumber)
  }

  // PRIORITY 7: Single-step word problems
  if (detection.isWordProblem) {
    return generateSingleStepWordProblem(goal, detection, questionNumber)
  }

  // PRIORITY 8: Fractions
  if (detection.isFraction) {
    return generateFractionProblem(questionNumber)
  }

  // PRIORITY 9: Decimals
  if (detection.isDecimal) {
    return generateDecimalProblem(goal, detection, questionNumber)
  }

  // PRIORITY 10: Division
  if (detection.isDivision) {
    return generateDivisionProblem(goal, questionNumber)
  }

  // PRIORITY 11: Multiplication
  if (detection.isMultiplication) {
    return generateMultiplicationProblem(goal, questionNumber)
  }

  // PRIORITY 12: Subtraction
  if (detection.isSubtraction) {
    return generateSubtractionProblem(goal, questionNumber)
  }

  // PRIORITY 13: Addition
  if (detection.isAddition) {
    return generateAdditionProblem(questionNumber)
  }

  // PRIORITY 14: Solving equations
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
        const name = goal.goalTitle?.includes('Carter')
          ? 'Carter'
          : goal.goalTitle?.includes('Tia')
            ? 'Tia'
            : 'Alex'
        const pronoun = name === 'Carter' ? 'his' : 'her'
        const pronoun2 = name === 'Carter' ? 'He' : 'She'
        return {
          question: `${name} scored ${a} and ${b} points in ${pronoun} first two basketball games. ${pronoun2} scored ${multiplier === 2 ? 'twice' : `${multiplier} times`} as many points in ${pronoun} third game as the first two games combined.\n\n1) Write a numerical expression representing this problem\n2) Calculate the answer\n3) Show your work`,
          answer: `Expression: ${formatMath(`(${a} + ${b}) \\times ${multiplier}`)}  OR  ${formatMath(`(${a} + ${b}) \\cdot ${multiplier}`)}\nAnswer: ${total} points`,
          requiresPhoto: true,
        }
      },
    },
    {
      name: 'shopping',
      template: (a: number, b: number, multiplier: number) => {
        const total = (a + b) * multiplier
        return {
          question: `Maria bought ${a} apples and ${b} oranges. She bought ${multiplier} times as many bananas as the total number of apples and oranges.\n\n1) Write a numerical expression representing this problem\n2) Calculate the answer\n3) Show your work`,
          answer: `Expression: ${formatMath(`(${a} + ${b}) \\times ${multiplier}`)}  OR  ${formatMath(`(${a} + ${b}) \\cdot ${multiplier}`)}\nAnswer: ${total} bananas`,
          requiresPhoto: true,
        }
      },
    },
    {
      name: 'savings',
      template: (a: number, b: number, multiplier: number) => {
        const total = (a + b) * multiplier
        return {
          question: `Jamal saved $${a} in January and $${b} in February. In March, he saved ${multiplier} times as much as he saved in January and February combined.\n\n1) Write a numerical expression representing this problem\n2) Calculate the answer\n3) Show your work`,
          answer: `Expression: ${formatMath(`(${a} + ${b}) \\times ${multiplier}`)}  OR  ${formatMath(`(${a} + ${b}) \\cdot ${multiplier}`)}\nAnswer: $${total}`,
          requiresPhoto: true,
        }
      },
    },
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

  switch (op) {
    case '+':
      return {
        question: `Evaluate the expression ${formatMath(`x + ${a}`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x + a).toString(),
        requiresPhoto: true,
      }
    case '-':
      return {
        question: `Evaluate the expression ${formatMath(`x - ${a}`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x - a).toString(),
        requiresPhoto: true,
      }
    case '×':
      return {
        question: `Evaluate the expression ${formatMath(`${a}x`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x * a).toString(),
        requiresPhoto: true,
      }
    case '÷':
      const dividend = x * a
      return {
        question: `Evaluate the expression ${formatMath(`x \\div ${a}`)} when ${formatMath(`x = ${dividend}`)}. Show your work.`,
        answer: x.toString(),
        requiresPhoto: true,
      }
    default:
      return {
        question: `Evaluate the expression ${formatMath(`x + ${a}`)} when ${formatMath(`x = ${x}`)}. Show your work.`,
        answer: (x + a).toString(),
        requiresPhoto: true,
      }
  }
}

/**
 * Generate word problem with equation modeling
 */
function generateWordProblemWithEquation(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number,
): QuestionResult {
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
          requiresPhoto: true,
        }
      },
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
          requiresPhoto: true,
        }
      },
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
          requiresPhoto: true,
        }
      },
    },
  ]

  const scenario = scenarios[questionNumber % scenarios.length]
  return scenario.template()
}

/**
 * Generate word problem with algebraic expression
 */
function generateWordProblemWithAlgebraicExpression(
  goal: Goal,
  questionNumber: number,
): QuestionResult {
  const scenarios = [
    {
      template: () => {
        const less = Math.floor(Math.random() * 10) + 2
        return {
          question: `Amy has ${less} less pencils than Mary Ann. If Mary Ann has ${formatMath(`x`)} pencils, write an algebraic expression to represent the number of pencils Amy has.`,
          answer: formatMath(`x - ${less}`),
          requiresPhoto: true,
        }
      },
    },
    {
      template: () => {
        const more = Math.floor(Math.random() * 10) + 2
        return {
          question: `Carlos has ${more} more books than Sarah. If Sarah has ${formatMath(`x`)} books, write an algebraic expression to represent the number of books Carlos has.`,
          answer: formatMath(`x + ${more}`),
          requiresPhoto: true,
        }
      },
    },
    {
      template: () => {
        const times = Math.floor(Math.random() * 5) + 2
        return {
          question: `Emma has ${times} times as many stickers as Jake. If Jake has ${formatMath(`x`)} stickers, write an algebraic expression to represent the number of stickers Emma has.`,
          answer: `${formatMath(`${times}x`)}  OR  ${formatMath(`${times} \\cdot x`)}`,
          requiresPhoto: true,
        }
      },
    },
  ]

  const scenario = scenarios[questionNumber % scenarios.length]
  return scenario.template()
}

/**
 * Generate multi-step word problem
 */
function generateMultiStepWordProblem(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number,
): QuestionResult {
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
          requiresPhoto: true,
        }
      },
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
          requiresPhoto: true,
        }
      },
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
          requiresPhoto: true,
        }
      },
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
          requiresPhoto: true,
        }
      },
    },
  ]

  const scenario = scenarios[questionNumber % scenarios.length]
  return scenario.template()
}

/**
 * Generate single-step word problem
 */
function generateSingleStepWordProblem(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number,
): QuestionResult {
  const operations =
    detection.operationTypes.length > 0
      ? detection.operationTypes
      : ['addition', 'subtraction', 'multiplication', 'division']

  const op = operations[questionNumber % operations.length]

  switch (op) {
    case 'addition':
      const a1 = Math.floor(Math.random() * 20) + 10
      const b1 = Math.floor(Math.random() * 15) + 5
      return {
        question: `There are ${a1} red marbles and ${b1} blue marbles. How many marbles are there in total? Show your work.`,
        answer: (a1 + b1).toString(),
        requiresPhoto: true,
      }
    case 'subtraction':
      const initial = Math.floor(Math.random() * 20) + 20
      const spent = Math.floor(Math.random() * 12) + 5
      return {
        question: `Sarah has $${initial}. She buys an item for $${spent}. How much money does she have left? Show your work.`,
        answer: `$${initial - spent}`,
        requiresPhoto: true,
      }
    case 'multiplication':
      const groups = Math.floor(Math.random() * 6) + 3
      const each = Math.floor(Math.random() * 8) + 2
      return {
        question: `There are ${groups} bags with ${each} candies in each bag. How many candies are there in total? Show your work.`,
        answer: (groups * each).toString(),
        requiresPhoto: true,
      }
    case 'division':
      const total = Math.floor(Math.random() * 40) + 20
      const bags = Math.floor(Math.random() * 6) + 2
      const result = Math.floor(total / bags)
      return {
        question: `A store has ${total} apples. They want to put them equally into ${bags} bags. How many apples will be in each bag? Show your work.`,
        answer: result.toString(),
        requiresPhoto: true,
      }
    default:
      return generateDefaultMathProblem(questionNumber)
  }
}

/**
 * Generate elapsed time problem
 */
function generateElapsedTimeProblem(questionNumber: number): QuestionResult {
  const scenarios = [
    {
      startTime: '8:15 AM',
      endTime: '11:30 AM',
      question:
        'A train leaves the station at 8:15 AM and arrives at its destination at 11:30 AM. How much time did the trip take?',
      answer: '3 hours 15 minutes',
      alternativeAnswers: ['3:15', '3 hours and 15 minutes', '195 minutes', '3 hr 15 min'],
    },
    {
      startTime: '2:45 PM',
      endTime: '5:20 PM',
      question:
        'Maria started her homework at 2:45 PM and finished at 5:20 PM. How long did she spend on homework?',
      answer: '2 hours 35 minutes',
      alternativeAnswers: ['2:35', '2 hours and 35 minutes', '155 minutes', '2 hr 35 min'],
    },
    {
      startTime: '9:50 AM',
      endTime: '1:15 PM',
      question: 'A movie started at 9:50 AM and ended at 1:15 PM. How long was the movie?',
      answer: '3 hours 25 minutes',
      alternativeAnswers: ['3:25', '3 hours and 25 minutes', '205 minutes', '3 hr 25 min'],
    },
    {
      startTime: '11:40 AM',
      endTime: '2:10 PM',
      question:
        'A school field trip began at 11:40 AM and returned at 2:10 PM. How long was the trip?',
      answer: '2 hours 30 minutes',
      alternativeAnswers: [
        '2:30',
        '2 hours and 30 minutes',
        '150 minutes',
        '2 hr 30 min',
        '2.5 hours',
      ],
    },
    {
      startTime: '7:25 AM',
      endTime: '10:55 AM',
      question: 'A bus left at 7:25 AM and arrived at 10:55 AM. How long was the bus ride?',
      answer: '3 hours 30 minutes',
      alternativeAnswers: [
        '3:30',
        '3 hours and 30 minutes',
        '210 minutes',
        '3 hr 30 min',
        '3.5 hours',
      ],
    },
  ]

  const scenario = scenarios[questionNumber % scenarios.length]

  return {
    question: scenario.question,
    answer: scenario.answer,
    alternativeAnswers: scenario.alternativeAnswers,
    explanation: `Calculate the time from ${scenario.startTime} to ${scenario.endTime} by finding the difference.`,
    requiresPhoto: true,
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
    const lcd = (d1 * d2) / gcd(d1, d2)
    const num1 = n1 * (lcd / d1)
    const num2 = n2 * (lcd / d2)
    const resultNum = num1 + num2
    const simplifiedGcd = gcd(resultNum, lcd)
    const answer =
      simplifiedGcd === lcd
        ? `${resultNum / simplifiedGcd}`
        : `${resultNum / simplifiedGcd}/${lcd / simplifiedGcd}`
    return {
      question: `Solve: ${formatMath(`\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`)}. Show your work.`,
      answer: answer.includes('/')
        ? formatMath(`\\frac{${answer.split('/')[0]}}{${answer.split('/')[1]}}`)
        : answer,
      requiresPhoto: true,
    }
  } else {
    // Comparison
    return {
      question: `Compare: ${formatMath(`\\frac{${n1}}{${d1}}`)} __ ${formatMath(`\\frac{${n2}}{${d2}}`)}  (Use <, >, or =). Show your work.`,
      answer: n1 / d1 > n2 / d2 ? '>' : n1 / d1 < n2 / d2 ? '<' : '=',
      requiresPhoto: true,
    }
  }
}

/**
 * Generate decimal problem
 */
function generateDecimalProblem(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number,
): QuestionResult {
  if (detection.isMultiplication) {
    const decimal = (Math.random() * 20 + 10).toFixed(2)
    const whole = Math.floor(Math.random() * 10) + 1
    const answer = (parseFloat(decimal) * whole).toFixed(2)
    return {
      question: `Calculate: ${formatMath(`${decimal} \\times ${whole}`)}. Show your work.`,
      answer: answer,
      requiresPhoto: true,
    }
  } else if (detection.isDivision) {
    const decimal = (Math.random() * 20 + 10).toFixed(2)
    const whole = Math.floor(Math.random() * 10) + 1
    const answer = (parseFloat(decimal) / whole).toFixed(2)
    return {
      question: `Calculate: ${formatMath(`${decimal} \\div ${whole}`)}. Show your work.`,
      answer: answer,
      requiresPhoto: true,
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
    requiresPhoto: true,
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
    requiresPhoto: true,
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
    requiresPhoto: true,
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
    requiresPhoto: true,
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
      requiresPhoto: true,
    }
  } else {
    const x = Math.floor(Math.random() * 20) + 1
    const a = Math.floor(Math.random() * 15) + 1
    const result = x + a
    return {
      question: `Solve for ${formatMath(`x`)}: ${formatMath(`x + ${a} = ${result}`)}. Show your work.`,
      answer: x.toString(),
      explanation: `Subtract ${a} from both sides: ${formatMath(`x = ${x}`)}`,
      requiresPhoto: true,
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

  switch (op) {
    case '+':
      return {
        question: `Calculate: ${a} + ${b}. Show your work.`,
        answer: (a + b).toString(),
        requiresPhoto: true,
      }
    case '-':
      return {
        question: `Calculate: ${a} - ${b}. Show your work.`,
        answer: (a - b).toString(),
        requiresPhoto: true,
      }
    case '×':
      return {
        question: `Calculate: ${a} × ${b}. Show your work.`,
        answer: (a * b).toString(),
        requiresPhoto: true,
      }
    case '÷':
      const dividend = a * b
      return {
        question: `Calculate: ${dividend} ÷ ${a}. Show your work.`,
        answer: b.toString(),
        requiresPhoto: true,
      }
    default:
      return {
        question: `Calculate: ${a} + ${b}. Show your work.`,
        answer: (a + b).toString(),
        requiresPhoto: true,
      }
  }
}

/**
 * Generate ELA question using templates
 */
function generateELATemplate(
  goal: Goal,
  detection: GoalDetection,
  questionNumber: number,
): QuestionResult {
  const goalText = goal.goalText.toLowerCase()

  if (goalText.includes('summariz')) {
    return {
      question: `Read the following text and write a summary that includes the central idea and 3 supporting details:\n\n[Text passage will be provided]`,
      answer: 'Teacher will grade based on rubric',
      explanation: 'This is a constructed response question that requires teacher evaluation.',
      requiresPhoto: false,
    }
  } else if (goalText.includes('comprehension') || goalText.includes('text')) {
    return {
      question: `Read the following text and answer the question below. Provide evidence from the text to support your answer:\n\n[Text passage and question will be provided]`,
      answer: 'Teacher will grade based on rubric',
      explanation: 'This is a constructed response question that requires teacher evaluation.',
      requiresPhoto: false,
    }
  } else if (goalText.includes('writing') || goalText.includes('paragraph')) {
    return {
      question: `Respond to prompt ${questionNumber} based on the goal.`,
      answer: 'Teacher will grade based on rubric',
      explanation: 'This is a constructed response question that requires teacher evaluation.',
      requiresPhoto: false,
    }
  }

  return {
    question: `Respond to prompt ${questionNumber} based on the goal.`,
    answer: 'Teacher will grade based on rubric',
    explanation: 'This is a constructed response question that requires teacher evaluation.',
    requiresPhoto: false,
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
    requiresPhoto: false,
  }
}

/**
 * Helper: GCD calculation
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * DEPRECATED: Fuzzy matching disabled in favor of explicit template assignment + AI generation
 * Find best matching saved template for a goal
 * Returns null if no good match found
 *
 * NEW: Checks goal.preferredTemplateIds first for explicit assignments
 */
/*
async function findMatchingTemplate(goal: Goal): Promise<GoalTemplate | null> {
  console.log('🔍 findMatchingTemplate called for goal:', {
    id: goal.id,
    title: goal.goalTitle,
    areaOfNeed: goal.areaOfNeed,
    preferredTemplateIds: goal.preferredTemplateIds,
  })
  try {
    // STEP 1: Check if goal has explicitly assigned templates
    if (goal.preferredTemplateIds && goal.preferredTemplateIds.length > 0) {
      console.log(
        `🎯 Goal has ${goal.preferredTemplateIds.length} preferred template(s). Checking...`,
      )

      // Import template service
      const { getTemplate } = await import('@/firebase/templateServices')

      // Try each preferred template in order
      for (const templateId of goal.preferredTemplateIds) {
        try {
          const template = await getTemplate(templateId)

          if (template && template.isActive) {
            console.log(
              `✅ Using explicitly assigned template: "${template.name}" (ID: ${templateId})`,
            )

            // Increment usage count
            await incrementTemplateUsage(template.id)

            return template
          } else if (template && !template.isActive) {
            console.log(`⏭️  Skipping inactive template: "${template.name}" (ID: ${templateId})`)
          } else {
            console.log(`⚠️  Preferred template not found: ${templateId}`)
          }
        } catch (error) {
          console.warn(`Error loading preferred template ${templateId}:`, error)
        }
      }

      console.log(
        `⚠️  None of the preferred templates are available. Falling back to fuzzy matching...`,
      )
    }

    // STEP 2: Fall back to fuzzy matching (original logic)
    // Get all active templates
    console.log('🔍 STEP 2: Fetching active templates from database...')
    let templates: GoalTemplate[]
    try {
      templates = await getActiveTemplates()
      console.log(`✅ Database query successful: Found ${templates.length} active template(s)`)
      if (templates.length > 0) {
        console.log(
          '📋 Templates found:',
          templates.map((t) => ({
            id: t.id,
            name: t.name,
            topic: t.topic,
            areaOfNeed: t.areaOfNeed,
            isActive: t.isActive,
            hasExampleQuestion: !!t.exampleQuestion,
          })),
        )
      }
    } catch (error) {
      console.error('❌ DATABASE QUERY FAILED:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return null
    }

    if (templates.length === 0) {
      console.log('⚠️ No active templates in database. Falling back to hard-coded templates.')
      return null
    }

    const goalText = goal.goalText.toLowerCase()
    const goalTitle = (goal.goalTitle || '').toLowerCase()
    const areaOfNeed = (goal.areaOfNeed || '').toLowerCase()

    // Score each template based on how well it matches the goal
    const scoredTemplates = templates.map((template) => {
      let score = 0

      // Match on area of need (high weight)
      if (template.areaOfNeed.toLowerCase() === areaOfNeed) {
        score += 10
      } else if (areaOfNeed.includes(template.areaOfNeed.toLowerCase())) {
        score += 5
      }

      // Match on topic (high weight)
      if (template.topic) {
        const topic = template.topic.toLowerCase()
        if (goalText.includes(topic) || goalTitle.includes(topic)) {
          score += 15
        }
      }

      // Match on subject
      const detection = detectGoalCharacteristics(goal)
      if (template.subject === detection.subject) {
        score += 5
      }

      // Match on grade level
      if (template.defaultGradeLevel && goal.gradeLevel) {
        if (template.defaultGradeLevel === goal.gradeLevel) {
          score += 3
        } else if (Math.abs(template.defaultGradeLevel - goal.gradeLevel) <= 1) {
          score += 1 // Close grade level
        }
      }

      // Match on assessment method
      if (template.assessmentMethod === goal.assessmentMethod) {
        score += 2
      }

      // Bonus: Has example question (more useful template)
      if (template.exampleQuestion && template.exampleAnswer) {
        score += 5
      }

      // NEW: Bonus for matching allowed operations (if template specifies them)
      if (
        template.allowedOperations &&
        template.allowedOperations.length > 0 &&
        detection.operationTypes.length > 0
      ) {
        // Check if template's allowed operations overlap with detected operations
        const matchingOps = template.allowedOperations.filter((op) =>
          detection.operationTypes.includes(op),
        )
        // Add 3 points per matching operation (max 12 for all 4)
        score += matchingOps.length * 3

        // Small penalty if template excludes operations that goal seems to need
        const excludedOps = detection.operationTypes.filter(
          (op) =>
            !template.allowedOperations?.includes(
              op as 'addition' | 'subtraction' | 'multiplication' | 'division',
            ),
        )
        if (excludedOps.length > 0) {
          score -= 2 // Slight penalty for mismatch
        }
      }

      return { template, score }
    })

    // Sort by score descending
    scoredTemplates.sort((a, b) => b.score - a.score)

    // Log all scores for debugging
    console.log('📊 Template matching scores:')
    scoredTemplates.slice(0, 5).forEach(({ template, score }, index) => {
      console.log(`  ${index + 1}. "${template.name}" (ID: ${template.id}) - Score: ${score}`)
    })

    // Return best match if score is high enough (threshold: 15)
    const bestMatch = scoredTemplates[0]
    if (bestMatch && bestMatch.score >= 15) {
      console.log(
        `✨ Found matching template via fuzzy matching: "${bestMatch.template.name}" (score: ${bestMatch.score})`,
      )

      // Increment usage count
      await incrementTemplateUsage(bestMatch.template.id)

      return bestMatch.template
    }

    console.log(
      `📋 No matching template found (best score: ${bestMatch?.score || 0}, threshold: 15). Using coded templates.`,
    )
    if (bestMatch) {
      console.log(`   Best match was: "${bestMatch.template.name}" but score too low.`)
    }
    return null
  } catch (error) {
    console.error('❌ CRITICAL ERROR in findMatchingTemplate:', error)
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('❌ Stack trace:', error.stack)
    }
    return null // Fall back to coded templates on error
  }
}
*/

/**
 * Generate question from saved template
 */
function generateQuestionFromTemplate(
  template: GoalTemplate,
  goal: Goal,
  questionNumber: number,
): QuestionResult | null {
  if (!template.exampleQuestion || !template.exampleAnswer) {
    console.warn('Template missing example question/answer, cannot generate')
    return null
  }

  // Use the example question as a base, with slight variations
  const variations = [
    template.exampleQuestion, // Use exact example for first question
    template.exampleQuestion, // Repeat for consistency (AI will add variation later)
    template.exampleQuestion,
    template.exampleQuestion,
    template.exampleQuestion,
  ]

  const question = variations[questionNumber % variations.length]

  // Parse alternative answers
  const alternativeAnswers: string[] = []
  if (template.exampleAlternativeAnswers) {
    alternativeAnswers.push(
      ...template.exampleAlternativeAnswers
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0),
    )
  }

  return {
    question,
    answer: template.exampleAnswer,
    alternativeAnswers,
    explanation: template.exampleExplanation,
    requiresPhoto: template.assessmentMethod === 'paper' || template.assessmentMethod === 'hybrid',
    source: 'template',
  }
}

/**
 * Main function: Generate question for a goal
 * NEW: Checks for saved templates first, falls back to coded templates
 */
export async function generateQuestionForGoal(
  goal: Goal,
  questionNumber: number,
  config: GeneratorConfig = { method: 'hybrid' },
): Promise<QuestionResult> {
  console.log(`🔄 Generating question #${questionNumber} for goal: ${goal.goalTitle}`)
  console.log(`   Previous questions in config: ${config.previousQuestions?.length || 0}`)

  // STEP 1: Check for EXPLICITLY ASSIGNED templates only
  let savedTemplate: GoalTemplate | null = null

  if (goal.preferredTemplateIds && goal.preferredTemplateIds.length > 0) {
    console.log(`🎯 Goal has ${goal.preferredTemplateIds.length} explicitly assigned template(s)`)

    try {
      const { getTemplate, incrementTemplateUsage } = await import('@/firebase/templateServices')

      // Load ALL active templates first
      const activeTemplates: GoalTemplate[] = []
      for (const templateId of goal.preferredTemplateIds) {
        try {
          const template = await getTemplate(templateId)
          if (template && template.isActive) {
            activeTemplates.push(template)
          }
        } catch (error) {
          console.warn(`Error loading assigned template ${templateId}:`, error)
        }
      }

      // Randomly select one from the available templates
      if (activeTemplates.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeTemplates.length)
        savedTemplate = activeTemplates[randomIndex]

        console.log(
          `✅ Randomly selected template "${savedTemplate.name}" (ID: ${savedTemplate.id}) from ${activeTemplates.length} assigned template(s)`,
        )

        // Increment usage count
        await incrementTemplateUsage(savedTemplate.id)
      }
    } catch (error) {
      console.warn('Error accessing template services:', error)
    }
  }

  console.log(
    `🔍 Explicit template check result:`,
    savedTemplate
      ? {
          id: savedTemplate.id,
          name: savedTemplate.name,
          hasExampleQuestion: !!savedTemplate.exampleQuestion,
          hasExampleAnswer: !!savedTemplate.exampleAnswer,
        }
      : 'NULL - No explicitly assigned template. Will use AI to generate from goal text.',
  )

  if (savedTemplate) {
    console.log('📦 Template found:', {
      id: savedTemplate.id,
      name: savedTemplate.name,
      exampleQuestion: savedTemplate.exampleQuestion,
      exampleAnswer: savedTemplate.exampleAnswer,
      allowedOperations: savedTemplate.allowedOperations,
    })

    const templateResult = generateQuestionFromTemplate(savedTemplate, goal, questionNumber)
    if (!templateResult) {
      console.error('❌ generateQuestionFromTemplate returned NULL! Template has:', {
        hasExampleQuestion: !!savedTemplate.exampleQuestion,
        hasExampleAnswer: !!savedTemplate.exampleAnswer,
        exampleQuestion: savedTemplate.exampleQuestion,
        exampleAnswer: savedTemplate.exampleAnswer,
      })
      // DO NOT fall through to hard-coded templates - throw error instead
      throw new Error(
        `Database template "${savedTemplate.name}" (ID: ${savedTemplate.id}) is missing required fields (exampleQuestion or exampleAnswer). Please edit the template to add these fields.`,
      )
    }

    // Template result exists - use it
    if (templateResult) {
      console.log('📝 Template result generated:', {
        question: templateResult.question,
        answer: templateResult.answer,
      })

      // Use AI to add variation to the template question (if hybrid mode)
      if (config.method === 'hybrid') {
        try {
          const aiConfig = {
            provider: 'google' as 'google' | 'openai',
            apiKey: config.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
            model: getAIModel('GOAL_QUESTIONS'),
            difficulty: config.difficulty || 'medium',
          }

          if (aiConfig.apiKey) {
            console.log(
              '📋 Passing to AI - Template question:',
              templateResult.question.substring(0, 100),
            )
            console.log('📋 Template allowed operations:', savedTemplate.allowedOperations)
            console.log(
              '📋 Template custom AI prompt:',
              savedTemplate.customAIPrompt?.substring(0, 100) || 'None',
            )
            console.log('🔑 API Key found, calling AI...')

            // Pass allowedOperations from template to detection
            const detection = detectGoalCharacteristics(goal, savedTemplate.allowedOperations)

            // Use template's explicit questionCategory if provided, otherwise use detected
            const finalQuestionCategory =
              savedTemplate.questionCategory || detection.questionCategory
            console.log(
              `📋 Question category: ${finalQuestionCategory} (${savedTemplate.questionCategory ? 'from template' : 'auto-detected'})`,
            )

            const aiResult = await generateQuestionWithAI(
              goal,
              detection.subject,
              questionNumber,
              aiConfig,
              templateResult, // Use saved template as reference
              savedTemplate.allowedOperations, // Pass allowed operations to AI
              savedTemplate.customAIPrompt, // Pass custom prompt from template
              savedTemplate, // Pass FULL template with problemStructure
              config.previousQuestions, // Pass previous questions to avoid duplicates
              finalQuestionCategory, // Pass question category (template overrides detection)
            )
            console.log('🤖 AI returned question:', aiResult.question)
            console.log('🤖 AI source:', aiResult.source)
            console.log('🔍 CHECKING: Does AI question match database template structure?')
            console.log('   Database template question:', templateResult.question.substring(0, 100))
            console.log('   AI generated question:', aiResult.question.substring(0, 100))
            const finalResult: QuestionResult = {
              ...aiResult,
              source: 'ai-with-template-reference',
            }
            console.log('✅ RETURNING FINAL RESULT:', {
              question: finalResult.question.substring(0, 100),
              source: finalResult.source,
            })
            return finalResult
          } else {
            console.warn('⚠️ NO API KEY FOUND - Returning template question without AI variation')
            console.warn('⚠️ To get varied questions, add VITE_GEMINI_API_KEY to .env file')
            // Return template with question number variation to at least change something
            return {
              ...templateResult,
              question: `${templateResult.question} (Question ${questionNumber})`,
              source: 'template',
            }
          }
        } catch (error) {
          console.warn('AI generation failed for saved template, using template as-is:', error)
          console.log('🔍 RETURN PATH: AI error catch - returning database template')
          console.log('   Question:', templateResult.question.substring(0, 100))
          return templateResult
        }
      }

      // Return template directly if not hybrid mode
      console.log('🔍 RETURN PATH: Non-hybrid mode - returning database template directly')
      console.log('   Question:', templateResult.question.substring(0, 100))
      return templateResult
    }
  }

  // STEP 2: No explicit template - use AI to generate directly from goal text
  console.log('🤖 No explicit template assigned. Generating question from goal text with AI...')
  const detection = detectGoalCharacteristics(goal)

  // Try AI generation directly from goal (no hard-coded templates)
  try {
    const aiConfig = {
      provider: 'google' as 'google' | 'openai',
      apiKey: config.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
      model: getAIModel('GOAL_QUESTIONS'),
      difficulty: config.difficulty || 'medium',
    }

    if (!aiConfig.apiKey) {
      console.warn('⚠️ NO API KEY FOUND')
      console.warn('⚠️ Please either:')
      console.warn('   1. Assign a template to this goal, OR')
      console.warn('   2. Add VITE_GEMINI_API_KEY to .env file')
      throw new Error('No template assigned and no API key available')
    }

    console.log('🔑 Calling AI to generate question from goal...')
    const aiResult = await generateQuestionWithAI(
      goal,
      detection.subject,
      questionNumber,
      aiConfig,
      undefined, // No template - generate from goal text
      undefined, // No allowed operations
      undefined, // No custom instructions
      undefined, // No template structure
      config.previousQuestions, // Pass previous questions to avoid duplicates
    )
    console.log('✅ AI generated question:', aiResult.question.substring(0, 100))
    return {
      ...aiResult,
      source: 'ai',
    }
  } catch (error) {
    console.error('❌ AI generation failed:', error)
    throw new Error(
      `Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
