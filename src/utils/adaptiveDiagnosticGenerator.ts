import type { AssessmentQuestion } from '@/types/iep'

export interface AdaptiveQuestion {
  id: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionType?: 'multiple-choice' | 'short-answer' // Optional for backward compatibility
  questionText: string
  correctAnswer: string
  acceptableAnswers: string[]
  multipleChoiceOptions?: string[] // For multiple choice questions
  points: number
  explanation: string
}

export interface AdaptiveQuestionBank {
  multiplication: AdaptiveQuestion[]
  division: AdaptiveQuestion[]
  addition: AdaptiveQuestion[]
  subtraction: AdaptiveQuestion[]
  orderOfOperations: AdaptiveQuestion[]
  decimals: AdaptiveQuestion[]
  wordProblems: AdaptiveQuestion[]
}

// Adaptive question bank with difficulty levels
export const adaptiveQuestionBank: AdaptiveQuestionBank = {
  multiplication: [
    // EASY: 1-digit × 1-digit
    {
      id: 'mult-easy-1',
      category: 'multiplication',
      difficulty: 'easy',
      questionText: 'Calculate: 7 × 6',
      correctAnswer: '42',
      acceptableAnswers: ['42', 'forty-two'],
      points: 5,
      explanation: 'Basic multiplication fact.'
    },
    {
      id: 'mult-easy-2',
      category: 'multiplication',
      difficulty: 'easy',
      questionText: 'Calculate: 8 × 9',
      correctAnswer: '72',
      acceptableAnswers: ['72', 'seventy-two'],
      points: 5,
      explanation: 'Basic multiplication fact.'
    },
    // MEDIUM: 1-digit × 2-digit
    {
      id: 'mult-med-1',
      category: 'multiplication',
      difficulty: 'medium',
      questionText: 'Calculate: 7 × 24',
      correctAnswer: '168',
      acceptableAnswers: ['168', 'one hundred sixty-eight'],
      points: 10,
      explanation: 'Multiply 1-digit by 2-digit number.'
    },
    {
      id: 'mult-med-2',
      category: 'multiplication',
      difficulty: 'medium',
      questionText: 'Calculate: 6 × 35',
      correctAnswer: '210',
      acceptableAnswers: ['210', 'two hundred ten'],
      points: 10,
      explanation: 'Multiply 1-digit by 2-digit number.'
    },
    // HARD: 2-digit × 2-digit
    {
      id: 'mult-hard-1',
      category: 'multiplication',
      difficulty: 'hard',
      questionText: 'Calculate: 23 × 47',
      correctAnswer: '1081',
      acceptableAnswers: ['1081', 'one thousand eighty-one'],
      points: 15,
      explanation: 'Multiply 2-digit by 2-digit number using standard algorithm.'
    },
    {
      id: 'mult-hard-2',
      category: 'multiplication',
      difficulty: 'hard',
      questionText: 'Calculate: 38 × 56',
      correctAnswer: '2128',
      acceptableAnswers: ['2128', 'two thousand one hundred twenty-eight'],
      points: 15,
      explanation: 'Multiply 2-digit by 2-digit number using standard algorithm.'
    }
  ],

  division: [
    // EASY: 2-digit ÷ 1-digit (no remainder)
    {
      id: 'div-easy-1',
      category: 'division',
      difficulty: 'easy',
      questionText: 'Calculate: 48 ÷ 6',
      correctAnswer: '8',
      acceptableAnswers: ['8', 'eight'],
      points: 5,
      explanation: 'Basic division.'
    },
    {
      id: 'div-easy-2',
      category: 'division',
      difficulty: 'easy',
      questionText: 'Calculate: 72 ÷ 9',
      correctAnswer: '8',
      acceptableAnswers: ['8', 'eight'],
      points: 5,
      explanation: 'Basic division.'
    },
    // MEDIUM: 3-digit ÷ 1-digit
    {
      id: 'div-med-1',
      category: 'division',
      difficulty: 'medium',
      questionText: 'Calculate: 156 ÷ 12',
      correctAnswer: '13',
      acceptableAnswers: ['13', 'thirteen'],
      points: 10,
      explanation: 'Divide 3-digit by 2-digit number.'
    },
    {
      id: 'div-med-2',
      category: 'division',
      difficulty: 'medium',
      questionText: 'Calculate: 224 ÷ 16',
      correctAnswer: '14',
      acceptableAnswers: ['14', 'fourteen'],
      points: 10,
      explanation: 'Divide 3-digit by 2-digit number.'
    },
    // HARD: 3-digit ÷ 2-digit
    {
      id: 'div-hard-1',
      category: 'division',
      difficulty: 'hard',
      questionText: 'Calculate: 864 ÷ 24',
      correctAnswer: '36',
      acceptableAnswers: ['36', 'thirty-six'],
      points: 15,
      explanation: 'Divide 3-digit by 2-digit number using long division.'
    },
    {
      id: 'div-hard-2',
      category: 'division',
      difficulty: 'hard',
      questionText: 'Calculate: 945 ÷ 27',
      correctAnswer: '35',
      acceptableAnswers: ['35', 'thirty-five'],
      points: 15,
      explanation: 'Divide 3-digit by 2-digit number using long division.'
    }
  ],

  addition: [
    // EASY: 2-digit + 2-digit (no regrouping)
    {
      id: 'add-easy-1',
      category: 'addition',
      difficulty: 'easy',
      questionText: 'Add: 23 + 45',
      correctAnswer: '68',
      acceptableAnswers: ['68', 'sixty-eight'],
      points: 5,
      explanation: 'Add without regrouping.'
    },
    {
      id: 'add-easy-2',
      category: 'addition',
      difficulty: 'easy',
      questionText: 'Add: 31 + 52',
      correctAnswer: '83',
      acceptableAnswers: ['83', 'eighty-three'],
      points: 5,
      explanation: 'Add without regrouping.'
    },
    // MEDIUM: 3-digit + 3-digit (with regrouping)
    {
      id: 'add-med-1',
      category: 'addition',
      difficulty: 'medium',
      questionText: 'Add: 347 + 285',
      correctAnswer: '632',
      acceptableAnswers: ['632', 'six hundred thirty-two'],
      points: 10,
      explanation: 'Add with regrouping.'
    },
    {
      id: 'add-med-2',
      category: 'addition',
      difficulty: 'medium',
      questionText: 'Add: 468 + 379',
      correctAnswer: '847',
      acceptableAnswers: ['847', 'eight hundred forty-seven'],
      points: 10,
      explanation: 'Add with regrouping.'
    },
    // HARD: 4-digit + 4-digit (multiple regrouping)
    {
      id: 'add-hard-1',
      category: 'addition',
      difficulty: 'hard',
      questionText: 'Add: 5,847 + 3,965',
      correctAnswer: '9812',
      acceptableAnswers: ['9812', '9,812', 'nine thousand eight hundred twelve'],
      points: 15,
      explanation: 'Add large numbers with multiple regrouping.'
    },
    {
      id: 'add-hard-2',
      category: 'addition',
      difficulty: 'hard',
      questionText: 'Add: 6,789 + 4,356',
      correctAnswer: '11145',
      acceptableAnswers: ['11145', '11,145', 'eleven thousand one hundred forty-five'],
      points: 15,
      explanation: 'Add large numbers with multiple regrouping.'
    }
  ],

  subtraction: [
    // EASY: 2-digit - 2-digit (no regrouping)
    {
      id: 'sub-easy-1',
      category: 'subtraction',
      difficulty: 'easy',
      questionText: 'Subtract: 78 - 32',
      correctAnswer: '46',
      acceptableAnswers: ['46', 'forty-six'],
      points: 5,
      explanation: 'Subtract without regrouping.'
    },
    {
      id: 'sub-easy-2',
      category: 'subtraction',
      difficulty: 'easy',
      questionText: 'Subtract: 95 - 41',
      correctAnswer: '54',
      acceptableAnswers: ['54', 'fifty-four'],
      points: 5,
      explanation: 'Subtract without regrouping.'
    },
    // MEDIUM: 3-digit - 3-digit (with regrouping)
    {
      id: 'sub-med-1',
      category: 'subtraction',
      difficulty: 'medium',
      questionText: 'Subtract: 500 - 237',
      correctAnswer: '263',
      acceptableAnswers: ['263', 'two hundred sixty-three'],
      points: 10,
      explanation: 'Subtract with regrouping.'
    },
    {
      id: 'sub-med-2',
      category: 'subtraction',
      difficulty: 'medium',
      questionText: 'Subtract: 603 - 458',
      correctAnswer: '145',
      acceptableAnswers: ['145', 'one hundred forty-five'],
      points: 10,
      explanation: 'Subtract with multiple regrouping.'
    },
    // HARD: 4-digit - 4-digit (multiple regrouping)
    {
      id: 'sub-hard-1',
      category: 'subtraction',
      difficulty: 'hard',
      questionText: 'Subtract: 7,004 - 3,856',
      correctAnswer: '3148',
      acceptableAnswers: ['3148', '3,148', 'three thousand one hundred forty-eight'],
      points: 15,
      explanation: 'Subtract large numbers with zeros and regrouping.'
    },
    {
      id: 'sub-hard-2',
      category: 'subtraction',
      difficulty: 'hard',
      questionText: 'Subtract: 8,000 - 4,679',
      correctAnswer: '3321',
      acceptableAnswers: ['3321', '3,321', 'three thousand three hundred twenty-one'],
      points: 15,
      explanation: 'Subtract from zeros with multiple regrouping.'
    }
  ],

  orderOfOperations: [
    // EASY: Simple left-to-right (no parentheses)
    {
      id: 'order-easy-1',
      category: 'orderOfOperations',
      difficulty: 'easy',
      questionText: 'Simplify: 5 + 3 × 2',
      correctAnswer: '11',
      acceptableAnswers: ['11', 'eleven'],
      points: 5,
      explanation: 'Multiply before adding (PEMDAS).'
    },
    {
      id: 'order-easy-2',
      category: 'orderOfOperations',
      difficulty: 'easy',
      questionText: 'Simplify: 12 - 6 ÷ 2',
      correctAnswer: '9',
      acceptableAnswers: ['9', 'nine'],
      points: 5,
      explanation: 'Divide before subtracting (PEMDAS).'
    },
    // MEDIUM: With parentheses
    {
      id: 'order-med-1',
      category: 'orderOfOperations',
      difficulty: 'medium',
      questionText: 'Simplify: (8 + 4) × 3 - 5',
      correctAnswer: '31',
      acceptableAnswers: ['31', 'thirty-one'],
      points: 10,
      explanation: 'Parentheses first, then multiply, then subtract (PEMDAS).'
    },
    {
      id: 'order-med-2',
      category: 'orderOfOperations',
      difficulty: 'medium',
      questionText: 'Simplify: 20 - (6 + 2) × 2',
      correctAnswer: '4',
      acceptableAnswers: ['4', 'four'],
      points: 10,
      explanation: 'Parentheses first, then multiply, then subtract (PEMDAS).'
    },
    // HARD: Multiple operations with nested parentheses
    {
      id: 'order-hard-1',
      category: 'orderOfOperations',
      difficulty: 'hard',
      questionText: 'Simplify: 3 × (12 - 4) + 6 ÷ 2',
      correctAnswer: '27',
      acceptableAnswers: ['27', 'twenty-seven'],
      points: 15,
      explanation: 'Parentheses first, then multiply and divide (left to right), then add.'
    },
    {
      id: 'order-hard-2',
      category: 'orderOfOperations',
      difficulty: 'hard',
      questionText: 'Simplify: (15 + 5) ÷ 4 + 6 × 3',
      correctAnswer: '23',
      acceptableAnswers: ['23', 'twenty-three'],
      points: 15,
      explanation: 'Parentheses first, then divide and multiply (left to right), then add.'
    }
  ],

  decimals: [
    // EASY: Add tenths
    {
      id: 'dec-easy-1',
      category: 'decimals',
      difficulty: 'easy',
      questionText: 'Calculate: 2.4 + 1.5',
      correctAnswer: '3.9',
      acceptableAnswers: ['3.9'],
      points: 5,
      explanation: 'Add decimals by lining up decimal points.'
    },
    {
      id: 'dec-easy-2',
      category: 'decimals',
      difficulty: 'easy',
      questionText: 'Calculate: 5.7 - 2.3',
      correctAnswer: '3.4',
      acceptableAnswers: ['3.4'],
      points: 5,
      explanation: 'Subtract decimals by lining up decimal points.'
    },
    // MEDIUM: Add/subtract hundredths
    {
      id: 'dec-med-1',
      category: 'decimals',
      difficulty: 'medium',
      questionText: 'Calculate: 2.5 + 3.75',
      correctAnswer: '6.25',
      acceptableAnswers: ['6.25'],
      points: 10,
      explanation: 'Add decimals with different place values.'
    },
    {
      id: 'dec-med-2',
      category: 'decimals',
      difficulty: 'medium',
      questionText: 'Calculate: 3.5 - 1.8',
      correctAnswer: '1.7',
      acceptableAnswers: ['1.7', '1.70'],
      points: 10,
      explanation: 'Subtract decimals with regrouping.'
    },
    // HARD: Operations with money/complex decimals
    {
      id: 'dec-hard-1',
      category: 'decimals',
      difficulty: 'hard',
      questionText: 'Calculate: 45.67 + 23.485',
      correctAnswer: '69.155',
      acceptableAnswers: ['69.155', '69.16'],
      points: 15,
      explanation: 'Add decimals with different place values.'
    },
    {
      id: 'dec-hard-2',
      category: 'decimals',
      difficulty: 'hard',
      questionText: 'Calculate: 100.5 - 78.675',
      correctAnswer: '21.825',
      acceptableAnswers: ['21.825', '21.83'],
      points: 15,
      explanation: 'Subtract decimals with zeros.'
    }
  ],

  wordProblems: [
    // EASY: One-step problems
    {
      id: 'word-easy-1',
      category: 'wordProblems',
      difficulty: 'easy',
      questionText: 'Sarah has 45 stickers. She gives 18 to her friend. How many stickers does she have left?',
      correctAnswer: '27',
      acceptableAnswers: ['27', 'twenty-seven', '27 stickers'],
      points: 5,
      explanation: 'One-step subtraction problem.'
    },
    {
      id: 'word-easy-2',
      category: 'wordProblems',
      difficulty: 'easy',
      questionText: 'A box contains 8 rows of cookies with 6 cookies in each row. How many cookies are there in total?',
      correctAnswer: '48',
      acceptableAnswers: ['48', 'forty-eight', '48 cookies'],
      points: 5,
      explanation: 'One-step multiplication problem.'
    },
    // MEDIUM: Two-step problems
    {
      id: 'word-med-1',
      category: 'wordProblems',
      difficulty: 'medium',
      questionText: 'Maria has $50. She buys 3 books for $8 each. How much money does she have left?',
      correctAnswer: '26',
      acceptableAnswers: ['26', '$26', '26 dollars', 'twenty-six'],
      points: 10,
      explanation: 'Two-step problem: multiply then subtract.'
    },
    {
      id: 'word-med-2',
      category: 'wordProblems',
      difficulty: 'medium',
      questionText: 'A store had 120 apples. They sold 45 in the morning and 38 in the afternoon. How many apples are left?',
      correctAnswer: '37',
      acceptableAnswers: ['37', 'thirty-seven', '37 apples'],
      points: 10,
      explanation: 'Two-step problem: add then subtract.'
    },
    // HARD: Multi-step problems
    {
      id: 'word-hard-1',
      category: 'wordProblems',
      difficulty: 'hard',
      questionText: 'A school has 4 classrooms with 25 students each. If 15 students are absent today, how many students are present?',
      correctAnswer: '85',
      acceptableAnswers: ['85', 'eighty-five', '85 students'],
      points: 15,
      explanation: 'Multi-step: multiply to find total, then subtract.'
    },
    {
      id: 'word-hard-2',
      category: 'wordProblems',
      difficulty: 'hard',
      questionText: 'Jake earns $12 per hour. He worked 5 hours on Saturday and 3 hours on Sunday. How much money did he earn in total?',
      correctAnswer: '96',
      acceptableAnswers: ['96', '$96', '96 dollars', 'ninety-six'],
      points: 15,
      explanation: 'Multi-step: add hours, then multiply by rate.'
    }
  ]
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type QuestionCategory = keyof AdaptiveQuestionBank

// Get next question based on previous performance
export function getAdaptiveQuestion(
  category: QuestionCategory,
  currentDifficulty: DifficultyLevel,
  gotPreviousCorrect: boolean | null, // null if first question
  usedQuestionIds: Set<string>
): AdaptiveQuestion | null {
  // Determine next difficulty
  let nextDifficulty: DifficultyLevel = currentDifficulty
  
  if (gotPreviousCorrect === true && currentDifficulty !== 'hard') {
    // Move up
    nextDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard'
  } else if (gotPreviousCorrect === false && currentDifficulty !== 'easy') {
    // Move down
    nextDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy'
  }
  
  // Get available questions at this difficulty level
  const categoryQuestions = adaptiveQuestionBank[category]
  const availableQuestions = categoryQuestions.filter(
    q => q.difficulty === nextDifficulty && !usedQuestionIds.has(q.id)
  )
  
  // If no questions at this level, try any unused question in this category
  if (availableQuestions.length === 0) {
    const anyAvailable = categoryQuestions.filter(q => !usedQuestionIds.has(q.id))
    return anyAvailable.length > 0 ? anyAvailable[0] : null
  }
  
  // Return random question from available
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
}

// Get starting difficulty for a category
export function getStartingDifficulty(category: QuestionCategory): DifficultyLevel {
  // Start most students at medium, adjust as needed
  return 'medium'
}

