import type { AssessmentQuestion, Goal } from '@/types/iep'

// Map goal types to question categories
export interface QuestionCategory {
  id: string
  name: string
  keywords: string[] // Keywords to match in goal titles/areas
  questions: AssessmentQuestion[]
}

// Generate math diagnostic questions based on student goals
export function generateMathDiagnostic(studentGoals: Goal[]): {
  questions: AssessmentQuestion[]
  goalMapping: Map<string, string[]> // goalId -> questionIds
} {
  const selectedQuestions: AssessmentQuestion[] = []
  const goalMapping = new Map<string, string[]>()
  
  // Identify which goal types the student has
  const goalTypes = identifyGoalTypes(studentGoals)
  
  // Base questions (everyone gets these)
  const baseQuestions = getBaseQuestions()
  selectedQuestions.push(...baseQuestions)
  
  // Add goal-specific questions
  for (const goal of studentGoals) {
    const goalType = categorizeGoal(goal)
    const goalQuestions = getQuestionsForGoalType(goalType, goal)
    
    // Add 2-3 questions per goal
    const questionsToAdd = goalQuestions.slice(0, 3)
    selectedQuestions.push(...questionsToAdd)
    
    // Track which questions map to which goal
    goalMapping.set(goal.id, questionsToAdd.map(q => q.id))
  }
  
  // Shuffle questions
  return {
    questions: shuffleQuestions(selectedQuestions),
    goalMapping
  }
}

function identifyGoalTypes(goals: Goal[]): Set<string> {
  const types = new Set<string>()
  
  for (const goal of goals) {
    const category = categorizeGoal(goal)
    types.add(category)
  }
  
  return types
}

function categorizeGoal(goal: Goal): string {
  const titleLower = goal.goalTitle.toLowerCase()
  const areaLower = goal.areaOfNeed.toLowerCase()
  const textLower = goal.goalText.toLowerCase()
  
  // Evaluate expressions (check FIRST before equations)
  if (textLower.includes('evaluate') && (textLower.includes('expression') || textLower.includes('input value'))) {
    return 'evaluate-expressions'
  }
  
  // Linear equations (one-step, two-step, multi-step)
  if (titleLower.includes('one-step') && titleLower.includes('equation')) {
    return 'one-step-equations'
  }
  if (titleLower.includes('two-step') && titleLower.includes('equation')) {
    return 'two-step-equations'
  }
  if (titleLower.includes('multi-step') && titleLower.includes('equation')) {
    return 'multi-step-equations'
  }
  if (titleLower.includes('linear equation') || (textLower.includes('equation') && textLower.includes('solve'))) {
    return 'linear-equations'
  }
  
  // Algebraic expressions
  if (titleLower.includes('algebraic expression') || titleLower.includes('writing algebraic')) {
    return 'algebraic-expressions'
  }
  
  // Word problems
  if (titleLower.includes('word problem') || areaLower.includes('applied problem')) {
    return 'word-problems'
  }
  
  // Unit rate/ratios (ONLY include if explicitly in goal)
  if (textLower.includes('unit rate') || textLower.includes('ratio') || (textLower.includes('rate') && textLower.includes('unit'))) {
    return 'unit-rate'
  }
  
  // Fractions
  if (titleLower.includes('fraction') || textLower.includes('fraction')) {
    return 'fractions'
  }
  
  // Decimals
  if (titleLower.includes('decimal') || textLower.includes('decimal')) {
    return 'decimals'
  }
  
  // Multiplication/Division
  if (titleLower.includes('multiplication') || titleLower.includes('division')) {
    return 'multiplication-division'
  }
  
  // Addition/Subtraction with regrouping
  if ((titleLower.includes('addition') || titleLower.includes('subtraction')) && titleLower.includes('regrouping')) {
    return 'addition-subtraction-regrouping'
  }
  
  // Number systems (integers, absolute value)
  if (titleLower.includes('number system') || textLower.includes('integer') || textLower.includes('absolute value')) {
    return 'number-systems'
  }
  
  // Integer operations / rational numbers (Jesus's goal)
  if (textLower.includes('integer') && (textLower.includes('operation') || textLower.includes('rational number'))) {
    return 'integer-operations'
  }
  
  // Multi-digit multiplication (Jayden's goal)
  if (textLower.includes('two and three- digit') || (textLower.includes('multi') && titleLower.includes('multiplication'))) {
    return 'multi-digit-multiplication'
  }
  
  // Addition/Subtraction with decimals (Jayden's goal)
  if ((titleLower.includes('addition') || titleLower.includes('subtraction')) && 
      (textLower.includes('decimal') || textLower.includes('multi digit decimal'))) {
    return 'decimal-operations'
  }
  
  // General math calculation
  if (titleLower.includes('calculation') || titleLower.includes('math goal')) {
    return 'general-math'
  }
  
  return 'general-math'
}

function getBaseQuestions(): AssessmentQuestion[] {
  // 8 foundational questions everyone gets - covering core 7th grade skills
  return [
    {
      id: 'base-1',
      questionText: 'Calculate: 12 × 8',
      questionType: 'short-answer',
      correctAnswer: '96',
      acceptableAnswers: ['96', 'ninety-six'],
      points: 5,
      explanation: 'Basic multiplication fact. Show your work if needed.'
    },
    {
      id: 'base-2',
      questionText: 'Calculate: 144 ÷ 12',
      questionType: 'short-answer',
      correctAnswer: '12',
      acceptableAnswers: ['12', 'twelve'],
      points: 5,
      explanation: 'Basic division. Show your work if needed.'
    },
    {
      id: 'base-3',
      questionText: 'Add: 347 + 285',
      questionType: 'short-answer',
      correctAnswer: '632',
      acceptableAnswers: ['632', 'six hundred thirty-two'],
      points: 5,
      explanation: 'Show your work.'
    },
    {
      id: 'base-4',
      questionText: 'Subtract: 500 - 237',
      questionType: 'short-answer',
      correctAnswer: '263',
      acceptableAnswers: ['263', 'two hundred sixty-three'],
      points: 5,
      explanation: 'Show your work. You may need to regroup.'
    },
    {
      id: 'base-5',
      questionText: 'Simplify: (8 + 4) × 3 - 5',
      questionType: 'short-answer',
      correctAnswer: '31',
      acceptableAnswers: ['31', 'thirty-one'],
      points: 5,
      explanation: 'Remember order of operations (PEMDAS). Parentheses first! Show your work.'
    },
    {
      id: 'base-6',
      questionText: 'Calculate: 2.5 + 3.75',
      questionType: 'short-answer',
      correctAnswer: '6.25',
      acceptableAnswers: ['6.25'],
      points: 5,
      explanation: 'Add decimals. Line up the decimal points.'
    },
    {
      id: 'base-7',
      questionText: 'Maria has $50. She buys 3 books for $8 each. How much money does she have left?',
      questionType: 'short-answer',
      correctAnswer: '26',
      acceptableAnswers: ['26', '$26', '26 dollars', 'twenty-six'],
      points: 5,
      explanation: 'Solve the word problem. Show your work. (This requires multiplication and subtraction)'
    },
    {
      id: 'base-8',
      questionText: 'Calculate: 3.5 - 1.8',
      questionType: 'short-answer',
      correctAnswer: '1.7',
      acceptableAnswers: ['1.7', '1.70'],
      points: 5,
      explanation: 'Subtract decimals. Line up the decimal points and show your work.'
    }
  ]
}

function getQuestionsForGoalType(goalType: string, goal: Goal): AssessmentQuestion[] {
  const questions: AssessmentQuestion[] = []
  
  switch (goalType) {
    case 'evaluate-expressions':
      questions.push(
        {
          id: `${goal.id}-eval-1`,
          questionText: 'Evaluate the expression x + 6 when x = 4. Show your work.',
          questionType: 'short-answer',
          correctAnswer: '10',
          acceptableAnswers: ['10', 'ten'],
          points: 10,
          explanation: 'Substitute the value for x and calculate.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eval-2`,
          questionText: 'Evaluate the expression 3n when n = 5. Show your work.',
          questionType: 'short-answer',
          correctAnswer: '15',
          acceptableAnswers: ['15', 'fifteen'],
          points: 10,
          explanation: 'Substitute the value for n and calculate.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eval-3`,
          questionText: 'Evaluate the expression y - 8 when y = 12. Show your work.',
          questionType: 'short-answer',
          correctAnswer: '4',
          acceptableAnswers: ['4', 'four'],
          points: 10,
          explanation: 'Substitute the value for y and calculate.',
          standard: goal.standard
        }
      )
      break
      
    case 'one-step-equations':
      questions.push(
        {
          id: `${goal.id}-eq1-1`,
          questionText: 'Solve for x: x + 8 = 15',
          questionType: 'short-answer',
          correctAnswer: '7',
          acceptableAnswers: ['7', 'seven', 'x=7', 'x = 7'],
          points: 10,
          explanation: 'Show all steps. Use inverse operations.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eq1-2`,
          questionText: 'Solve for y: 3y = 21',
          questionType: 'short-answer',
          correctAnswer: '7',
          acceptableAnswers: ['7', 'seven', 'y=7', 'y = 7'],
          points: 10,
          explanation: 'Show all steps. Use inverse operations.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eq1-3`,
          questionText: 'Solve for n: n - 12 = 5',
          questionType: 'short-answer',
          correctAnswer: '17',
          acceptableAnswers: ['17', 'seventeen', 'n=17', 'n = 17'],
          points: 10,
          explanation: 'Show all steps.',
          standard: goal.standard
        }
      )
      break
      
    case 'two-step-equations':
      questions.push(
        {
          id: `${goal.id}-eq2-1`,
          questionText: 'Solve for x: 2x + 5 = 13',
          questionType: 'short-answer',
          correctAnswer: '4',
          acceptableAnswers: ['4', 'four', 'x=4', 'x = 4'],
          points: 10,
          explanation: 'Show all steps. Use inverse operations in the correct order.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eq2-2`,
          questionText: 'Solve for y: 3y - 7 = 8',
          questionType: 'short-answer',
          correctAnswer: '5',
          acceptableAnswers: ['5', 'five', 'y=5', 'y = 5'],
          points: 10,
          explanation: 'Show all steps.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eq2-3`,
          questionText: 'Solve for n: (n/4) + 3 = 7',
          questionType: 'short-answer',
          correctAnswer: '16',
          acceptableAnswers: ['16', 'sixteen', 'n=16', 'n = 16'],
          points: 10,
          explanation: 'Show all steps.',
          standard: goal.standard
        }
      )
      break
      
    case 'multi-step-equations':
      questions.push(
        {
          id: `${goal.id}-eq3-1`,
          questionText: 'Solve for x: 3(x + 4) = 24',
          questionType: 'short-answer',
          correctAnswer: '4',
          acceptableAnswers: ['4', 'four', 'x=4', 'x = 4'],
          points: 10,
          explanation: 'Use distributive property, then solve. Show all steps.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eq3-2`,
          questionText: 'Solve for y: 2y + 5 = 3y - 2',
          questionType: 'short-answer',
          correctAnswer: '7',
          acceptableAnswers: ['7', 'seven', 'y=7', 'y = 7'],
          points: 10,
          explanation: 'Combine like terms. Show all steps.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-eq3-3`,
          questionText: 'Solve for x: 4(x - 2) + 3 = 15',
          questionType: 'short-answer',
          correctAnswer: '5',
          acceptableAnswers: ['5', 'five', 'x=5', 'x = 5'],
          points: 10,
          explanation: 'Use distributive property and combine like terms. Show all steps.',
          standard: goal.standard
        }
      )
      break
      
    case 'linear-equations':
      // General linear equations - give a mix
      questions.push(
        {
          id: `${goal.id}-lineq-1`,
          questionText: 'Solve for x: 2x - 3 = 11',
          questionType: 'short-answer',
          correctAnswer: '7',
          acceptableAnswers: ['7', 'seven', 'x=7', 'x = 7'],
          points: 10,
          explanation: 'Show all steps.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-lineq-2`,
          questionText: 'Solve for y: 5y + 2 = 4y + 9',
          questionType: 'short-answer',
          correctAnswer: '7',
          acceptableAnswers: ['7', 'seven', 'y=7', 'y = 7'],
          points: 10,
          explanation: 'Show all steps.',
          standard: goal.standard
        }
      )
      break
      
    case 'algebraic-expressions':
      questions.push(
        {
          id: `${goal.id}-algexp-1`,
          questionText: 'Write an algebraic expression for: "Five more than twice a number x"',
          questionType: 'short-answer',
          correctAnswer: '2x + 5',
          acceptableAnswers: ['2x+5', '2x + 5', '5 + 2x', '5+2x'],
          points: 10,
          explanation: 'Translate the words into an algebraic expression.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-algexp-2`,
          questionText: 'Write an algebraic expression for: "The product of 3 and a number y, decreased by 7"',
          questionType: 'short-answer',
          correctAnswer: '3y - 7',
          acceptableAnswers: ['3y-7', '3y - 7'],
          points: 10,
          explanation: 'Translate the words into an algebraic expression.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-algexp-3`,
          questionText: 'Write an algebraic expression for: "Half of a number n plus 4"',
          questionType: 'short-answer',
          correctAnswer: 'n/2 + 4',
          acceptableAnswers: ['n/2+4', 'n/2 + 4', '4 + n/2', '4+n/2', '(n/2)+4', '0.5n+4', '0.5n + 4'],
          points: 10,
          explanation: 'Translate the words into an algebraic expression.',
          standard: goal.standard
        }
      )
      break
      
    case 'word-problems':
      questions.push(
        {
          id: `${goal.id}-word-1`,
          questionText: 'Sarah has 3 times as many books as Tom. If Tom has 8 books, how many books does Sarah have?',
          questionType: 'short-answer',
          correctAnswer: '24',
          acceptableAnswers: ['24', 'twenty-four', '24 books'],
          points: 10,
          explanation: 'Show your work and explain your reasoning.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-word-2`,
          questionText: 'A rectangle has a length of 12 cm and a width of 5 cm. What is the perimeter?',
          questionType: 'short-answer',
          correctAnswer: '34',
          acceptableAnswers: ['34', 'thirty-four', '34 cm', '34cm'],
          points: 10,
          explanation: 'Remember: Perimeter = 2(length + width). Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-word-3`,
          questionText: 'A store is having a sale. A shirt that normally costs $25 is marked down by $8. What is the sale price?',
          questionType: 'short-answer',
          correctAnswer: '17',
          acceptableAnswers: ['17', '$17', '17 dollars', 'seventeen dollars'],
          points: 10,
          explanation: 'Show your work.',
          standard: goal.standard
        }
      )
      break
      
    case 'fractions':
      questions.push(
        {
          id: `${goal.id}-frac-1`,
          questionText: 'Add: 2/5 + 3/5',
          questionType: 'short-answer',
          correctAnswer: '1',
          acceptableAnswers: ['1', '5/5', 'one', '1.0'],
          points: 10,
          explanation: 'Add fractions with the same denominator. Simplify your answer.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-frac-2`,
          questionText: 'Add: 1/4 + 1/3',
          questionType: 'short-answer',
          correctAnswer: '7/12',
          acceptableAnswers: ['7/12'],
          points: 10,
          explanation: 'Find common denominator first. Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-frac-3`,
          questionText: 'Multiply: 2/3 × 3/4',
          questionType: 'short-answer',
          correctAnswer: '1/2',
          acceptableAnswers: ['1/2', '0.5', '2/4'],
          points: 10,
          explanation: 'Multiply numerators and denominators. Simplify.',
          standard: goal.standard
        }
      )
      break
      
    case 'decimals':
      questions.push(
        {
          id: `${goal.id}-dec-1`,
          questionText: 'Add: 3.45 + 2.8',
          questionType: 'short-answer',
          correctAnswer: '6.25',
          acceptableAnswers: ['6.25'],
          points: 10,
          explanation: 'Line up decimal points. Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-dec-2`,
          questionText: 'Multiply: 2.5 × 3',
          questionType: 'short-answer',
          correctAnswer: '7.5',
          acceptableAnswers: ['7.5', '7.50'],
          points: 10,
          explanation: 'Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-dec-3`,
          questionText: 'Divide: 12.6 ÷ 3',
          questionType: 'short-answer',
          correctAnswer: '4.2',
          acceptableAnswers: ['4.2', '4.20'],
          points: 10,
          explanation: 'Show your work.',
          standard: goal.standard
        }
      )
      break
      
    case 'multiplication-division':
      questions.push(
        {
          id: `${goal.id}-multdiv-1`,
          questionText: 'Calculate: 25 × 12',
          questionType: 'short-answer',
          correctAnswer: '300',
          acceptableAnswers: ['300', 'three hundred'],
          points: 10,
          explanation: 'Show your work using any method.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-multdiv-2`,
          questionText: 'Calculate: 144 ÷ 12',
          questionType: 'short-answer',
          correctAnswer: '12',
          acceptableAnswers: ['12', 'twelve'],
          points: 10,
          explanation: 'Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-multdiv-3`,
          questionText: 'Calculate: 15 × 8',
          questionType: 'short-answer',
          correctAnswer: '120',
          acceptableAnswers: ['120', 'one hundred twenty'],
          points: 10,
          explanation: 'Show your work.',
          standard: goal.standard
        }
      )
      break
      
    case 'addition-subtraction-regrouping':
      questions.push(
        {
          id: `${goal.id}-addsub-1`,
          questionText: 'Add: 347 + 265',
          questionType: 'short-answer',
          correctAnswer: '612',
          acceptableAnswers: ['612', 'six hundred twelve'],
          points: 10,
          explanation: 'Show your work with regrouping.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-addsub-2`,
          questionText: 'Subtract: 504 - 267',
          questionType: 'short-answer',
          correctAnswer: '237',
          acceptableAnswers: ['237', 'two hundred thirty-seven'],
          points: 10,
          explanation: 'Show your work with regrouping.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-addsub-3`,
          questionText: 'Add: 1,456 + 2,789',
          questionType: 'short-answer',
          correctAnswer: '4245',
          acceptableAnswers: ['4245', '4,245', 'four thousand two hundred forty-five'],
          points: 10,
          explanation: 'Show your work with regrouping.',
          standard: goal.standard
        }
      )
      break
      
    case 'number-systems':
      questions.push(
        {
          id: `${goal.id}-numsys-1`,
          questionText: 'What is the absolute value of -8? Write: |-8| = ?',
          questionType: 'short-answer',
          correctAnswer: '8',
          acceptableAnswers: ['8', 'eight'],
          points: 10,
          explanation: 'Absolute value is the distance from zero.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-numsys-2`,
          questionText: 'Compare using <, >, or =:  -5 ___ -3',
          questionType: 'short-answer',
          correctAnswer: '<',
          acceptableAnswers: ['<', 'less than', '-5 < -3', '-5<-3'],
          points: 10,
          explanation: 'Think about the number line.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-numsys-3`,
          questionText: 'Calculate: -4 + (-7)',
          questionType: 'short-answer',
          correctAnswer: '-11',
          acceptableAnswers: ['-11', 'negative eleven'],
          points: 10,
          explanation: 'Adding two negative numbers. Show your work.',
          standard: goal.standard
        }
      )
      break
      
    case 'unit-rate':
      questions.push(
        {
          id: `${goal.id}-rate-1`,
          questionText: 'A car travels 120 miles in 2 hours. What is the unit rate in miles per hour?',
          questionType: 'short-answer',
          correctAnswer: '60',
          acceptableAnswers: ['60', '60 mph', '60 miles per hour', 'sixty'],
          points: 10,
          explanation: 'Find the rate per 1 hour. Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-rate-2`,
          questionText: 'If 5 apples cost $3.50, what is the cost per apple (unit rate)?',
          questionType: 'short-answer',
          correctAnswer: '0.70',
          acceptableAnswers: ['0.70', '$0.70', '70 cents', '.70', '0.7'],
          points: 10,
          explanation: 'Find the cost for 1 apple. Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-rate-3`,
          questionText: 'A recipe uses 3 cups of flour for 2 batches. What is the unit rate (cups per batch)?',
          questionType: 'short-answer',
          correctAnswer: '1.5',
          acceptableAnswers: ['1.5', '3/2', '1 1/2', 'one and a half'],
          points: 10,
          explanation: 'Find the amount for 1 batch. Show your work.',
          standard: goal.standard
        }
      )
      break
      
    case 'integer-operations':
      questions.push(
        {
          id: `${goal.id}-intop-1`,
          questionText: 'Calculate: -6 + 9',
          questionType: 'short-answer',
          correctAnswer: '3',
          acceptableAnswers: ['3', 'three'],
          points: 10,
          explanation: 'Add integers. Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-intop-2`,
          questionText: 'Calculate: -4 - 7',
          questionType: 'short-answer',
          correctAnswer: '-11',
          acceptableAnswers: ['-11', 'negative eleven'],
          points: 10,
          explanation: 'Subtract integers. Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-intop-3`,
          questionText: 'Calculate: -3 × 5',
          questionType: 'short-answer',
          correctAnswer: '-15',
          acceptableAnswers: ['-15', 'negative fifteen'],
          points: 10,
          explanation: 'Multiply integers. Remember: negative × positive = negative.',
          standard: goal.standard
        }
      )
      break
      
    case 'multi-digit-multiplication':
      questions.push(
        {
          id: `${goal.id}-mdmult-1`,
          questionText: 'Calculate: 47 × 23. Show all your work.',
          questionType: 'short-answer',
          correctAnswer: '1081',
          acceptableAnswers: ['1081', 'one thousand eighty-one'],
          points: 10,
          explanation: 'Use the standard multiplication algorithm. Show all steps.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-mdmult-2`,
          questionText: 'Calculate: 156 × 24. Show all your work.',
          questionType: 'short-answer',
          correctAnswer: '3744',
          acceptableAnswers: ['3744', 'three thousand seven hundred forty-four'],
          points: 10,
          explanation: 'Use the standard multiplication algorithm. Show all steps.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-mdmult-3`,
          questionText: 'Calculate: 238 × 15. Show all your work.',
          questionType: 'short-answer',
          correctAnswer: '3570',
          acceptableAnswers: ['3570', 'three thousand five hundred seventy'],
          points: 10,
          explanation: 'Use the standard multiplication algorithm. Show all steps.',
          standard: goal.standard
        }
      )
      break
      
    case 'decimal-operations':
      questions.push(
        {
          id: `${goal.id}-decop-1`,
          questionText: 'Calculate: 456 + 23.8. Show your work.',
          questionType: 'short-answer',
          correctAnswer: '479.8',
          acceptableAnswers: ['479.8', '479.80'],
          points: 10,
          explanation: 'Add a whole number and a decimal. Line up the decimal points.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-decop-2`,
          questionText: 'Calculate: 234.5 - 67.89. Show your work.',
          questionType: 'short-answer',
          correctAnswer: '166.61',
          acceptableAnswers: ['166.61'],
          points: 10,
          explanation: 'Subtract decimals. Line up the decimal points.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-decop-3`,
          questionText: 'Calculate: 125 + 3.75. Show your work.',
          questionType: 'short-answer',
          correctAnswer: '128.75',
          acceptableAnswers: ['128.75'],
          points: 10,
          explanation: 'Add a whole number and a decimal. Line up the decimal points.',
          standard: goal.standard
        }
      )
      break
      
    case 'general-math':
    default:
      questions.push(
        {
          id: `${goal.id}-gen-1`,
          questionText: 'Calculate: 25 × 12. Show your work.',
          questionType: 'short-answer',
          correctAnswer: '300',
          acceptableAnswers: ['300', 'three hundred'],
          points: 10,
          explanation: 'Use any multiplication method. Show your work.',
          standard: goal.standard
        },
        {
          id: `${goal.id}-gen-2`,
          questionText: 'A rectangle has a length of 8 cm and a width of 5 cm. What is the area?',
          questionType: 'short-answer',
          correctAnswer: '40',
          acceptableAnswers: ['40', '40 cm²', '40 square cm', 'forty'],
          points: 10,
          explanation: 'Area = length × width. Show your work.',
          standard: goal.standard
        }
      )
      break
  }
  
  return questions
}

function shuffleQuestions(questions: AssessmentQuestion[]): AssessmentQuestion[] {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

