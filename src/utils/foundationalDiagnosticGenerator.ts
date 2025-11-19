import type { Goal } from '@/types/iep'

export interface FoundationalQuestion {
  id: string
  category: string
  section: 'A' | 'B' // Section A = Foundational Gaps, Section B = Pre-Algebra Readiness
  gradeLevel: string // '4th-6th' for foundational, '7th' for goals
  questionType: 'multiple-choice' | 'short-answer'
  questionText: string
  correctAnswer: string
  acceptableAnswers: string[]
  multipleChoiceOptions?: string[] // Always 5 choices for MC (STAR test format)
  points: number
  explanation: string
  isGoalBased?: boolean // True if generated from student goal
  skillArea: string // Specific skill being tested
}

// Section A: Foundational Gaps (10 items) - Number sense + computation fluency
const sectionAQuestions: FoundationalQuestion[] = [
  {
    id: 'a-place-value',
    category: 'Number Sense',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Place Value',
    questionType: 'multiple-choice',
    questionText: 'What is the value of the 4 in 4,382?',
    correctAnswer: '4,000',
    acceptableAnswers: ['4000', '4,000'],
    multipleChoiceOptions: ['4', '40', '400', '4,000', '40,000'],
    points: 5,
    explanation: 'The 4 is in the thousands place, so its value is 4,000.'
  },
  {
    id: 'a-addition',
    category: 'Computation',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Multi-digit Addition',
    questionType: 'multiple-choice',
    questionText: 'Calculate: 483 + 219',
    correctAnswer: '702',
    acceptableAnswers: ['702'],
    multipleChoiceOptions: ['592', '692', '702', '712', '802'],
    points: 5,
    explanation: 'Add each place value: 3+9=12 (carry 1), 8+1+1=10 (carry 1), 4+2+1=7'
  },
  {
    id: 'a-subtraction',
    category: 'Computation',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Subtraction with Regrouping',
    questionType: 'multiple-choice',
    questionText: 'Calculate: 700 - 458',
    correctAnswer: '242',
    acceptableAnswers: ['242'],
    multipleChoiceOptions: ['142', '232', '242', '252', '342'],
    points: 5,
    explanation: 'Regroup from hundreds: 700 = 6 hundreds, 10 tens, 0 ones becomes 6 hundreds, 9 tens, 10 ones. Then subtract.'
  },
  {
    id: 'a-multiplication',
    category: 'Computation',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Multiplication',
    questionType: 'multiple-choice',
    questionText: 'Calculate: 23 × 4',
    correctAnswer: '92',
    acceptableAnswers: ['92'],
    multipleChoiceOptions: ['82', '88', '92', '96', '102'],
    points: 5,
    explanation: '23 × 4 = (20 × 4) + (3 × 4) = 80 + 12 = 92'
  },
  {
    id: 'a-division',
    category: 'Computation',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Division',
    questionType: 'multiple-choice',
    questionText: 'Calculate: 56 ÷ 7',
    correctAnswer: '8',
    acceptableAnswers: ['8'],
    multipleChoiceOptions: ['6', '7', '8', '9', '10'],
    points: 5,
    explanation: '7 × 8 = 56, so 56 ÷ 7 = 8'
  },
  {
    id: 'a-fraction-visual',
    category: 'Fractions',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Fraction Meaning',
    questionType: 'multiple-choice',
    questionText: 'A circle is divided into 4 equal parts. If 3 parts are shaded, what fraction is shaded?',
    correctAnswer: '3/4',
    acceptableAnswers: ['3/4', '0.75', '.75'],
    multipleChoiceOptions: ['1/4', '2/4', '3/4', '4/3', '3/3'],
    points: 5,
    explanation: '3 out of 4 equal parts are shaded, which is 3/4.'
  },
  {
    id: 'a-fraction-ops',
    category: 'Fractions',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Fraction Operations',
    questionType: 'short-answer',
    questionText: 'Calculate: 2/3 + 1/6 (Write your answer as a fraction)',
    correctAnswer: '5/6',
    acceptableAnswers: ['5/6', '0.833', '.833'],
    points: 10,
    explanation: 'Find common denominator: 4/6 + 1/6 = 5/6'
  },
  {
    id: 'a-decimal-compare',
    category: 'Decimals',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Decimal Comparison',
    questionType: 'multiple-choice',
    questionText: 'Which is greater: 0.6 or 0.59?',
    correctAnswer: '0.6',
    acceptableAnswers: ['0.6', '0.60', '.6', '.60'],
    multipleChoiceOptions: ['0.59', '0.6', 'They are equal', 'Cannot be determined', 'Neither'],
    points: 5,
    explanation: '0.6 = 0.60, which is greater than 0.59 (60 hundredths vs 59 hundredths)'
  },
  {
    id: 'a-convert',
    category: 'Decimals',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Fraction to Decimal Conversion',
    questionType: 'multiple-choice',
    questionText: 'Convert to decimal form: 3/10',
    correctAnswer: '0.3',
    acceptableAnswers: ['0.3', '0.30', '.3', '.30'],
    multipleChoiceOptions: ['0.03', '0.13', '0.3', '3.0', '3.10'],
    points: 5,
    explanation: '3/10 means 3 tenths, which is 0.3 in decimal form.'
  },
  {
    id: 'a-integers',
    category: 'Integers',
    section: 'A',
    gradeLevel: '4th-6th',
    skillArea: 'Integer Operations',
    questionType: 'multiple-choice',
    questionText: 'Calculate: -6 + 9',
    correctAnswer: '3',
    acceptableAnswers: ['3', '+3'],
    multipleChoiceOptions: ['-15', '-3', '0', '3', '15'],
    points: 5,
    explanation: 'Start at -6 on the number line, move 9 units to the right to reach 3.'
  }
]

// Section B: Pre-Algebra Readiness (10 items) - Symbolic thinking and ratio reasoning
const sectionBQuestions: FoundationalQuestion[] = [
  {
    id: 'b-evaluate-1',
    category: 'Algebraic Thinking',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Evaluate Expressions',
    questionType: 'multiple-choice',
    questionText: 'If x = 3, what is 2x + 5?',
    correctAnswer: '11',
    acceptableAnswers: ['11'],
    multipleChoiceOptions: ['8', '9', '10', '11', '16'],
    points: 5,
    explanation: 'Substitute x = 3: 2(3) + 5 = 6 + 5 = 11'
  },
  {
    id: 'b-write-expression',
    category: 'Algebraic Thinking',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Write Expressions',
    questionType: 'multiple-choice',
    questionText: 'Which expression represents "7 more than a number"?',
    correctAnswer: 'n + 7',
    acceptableAnswers: ['n + 7', 'x + 7', '7 + n', '7 + x'],
    multipleChoiceOptions: ['n - 7', '7 - n', 'n + 7', '7n', 'n/7'],
    points: 5,
    explanation: '"7 more than" means add 7 to the number: n + 7'
  },
  {
    id: 'b-evaluate-2',
    category: 'Algebraic Thinking',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Evaluate Expressions',
    questionType: 'multiple-choice',
    questionText: 'If y = 5, what is 3y - 4?',
    correctAnswer: '11',
    acceptableAnswers: ['11'],
    multipleChoiceOptions: ['4', '7', '11', '14', '19'],
    points: 5,
    explanation: 'Substitute y = 5: 3(5) - 4 = 15 - 4 = 11'
  },
  {
    id: 'b-ratio-1',
    category: 'Ratios & Proportions',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Ratio Reasoning',
    questionType: 'multiple-choice',
    questionText: 'A recipe uses 2 cups of flour for every 3 cups of sugar. If you use 6 cups of sugar, how many cups of flour do you need?',
    correctAnswer: '4',
    acceptableAnswers: ['4', '4 cups'],
    multipleChoiceOptions: ['2', '3', '4', '6', '9'],
    points: 10,
    explanation: 'The ratio is 2:3. If sugar doubles (3→6), flour also doubles (2→4).'
  },
  {
    id: 'b-percent-1',
    category: 'Ratios & Proportions',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Percent',
    questionType: 'multiple-choice',
    questionText: 'What is 25% of 80?',
    correctAnswer: '20',
    acceptableAnswers: ['20'],
    multipleChoiceOptions: ['15', '18', '20', '25', '30'],
    points: 5,
    explanation: '25% = 1/4, so 1/4 of 80 = 80 ÷ 4 = 20'
  },
  {
    id: 'b-solve-simple',
    category: 'Algebraic Thinking',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Solve Simple Equations',
    questionType: 'short-answer',
    questionText: 'Solve for x: x + 8 = 15',
    correctAnswer: '7',
    acceptableAnswers: ['7', 'x = 7', 'x=7'],
    points: 10,
    explanation: 'Subtract 8 from both sides: x = 15 - 8 = 7'
  },
  {
    id: 'b-order-ops',
    category: 'Algebraic Thinking',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Order of Operations',
    questionType: 'multiple-choice',
    questionText: 'Calculate: 3 + 4 × 2',
    correctAnswer: '11',
    acceptableAnswers: ['11'],
    multipleChoiceOptions: ['10', '11', '14', '17', '20'],
    points: 5,
    explanation: 'Multiply first: 4 × 2 = 8, then add: 3 + 8 = 11'
  },
  {
    id: 'b-inequality',
    category: 'Algebraic Thinking',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Inequalities',
    questionType: 'multiple-choice',
    questionText: 'Which number makes this true: 5 + ___ > 12?',
    correctAnswer: '8',
    acceptableAnswers: ['8', '9', '10', 'any number greater than 7'],
    multipleChoiceOptions: ['6', '7', '8', '5', '4'],
    points: 5,
    explanation: '5 + 8 = 13, which is greater than 12'
  },
  {
    id: 'b-unit-rate',
    category: 'Ratios & Proportions',
    section: 'B',
    gradeLevel: '7th',
    skillArea: 'Unit Rate',
    questionType: 'short-answer',
    questionText: 'A car travels 240 miles in 4 hours. What is the unit rate in miles per hour?',
    correctAnswer: '60',
    acceptableAnswers: ['60', '60 mph', '60 miles per hour'],
    points: 10,
    explanation: 'Unit rate = 240 miles ÷ 4 hours = 60 miles per hour'
  },
  {
    id: 'b-proportion',
    category: 'Ratios & Proportions',
    section: 'B',
    gradeLevel: '6th-7th',
    skillArea: 'Proportional Reasoning',
    questionType: 'multiple-choice',
    questionText: 'If 5 pencils cost $2, how much do 15 pencils cost?',
    correctAnswer: '$6',
    acceptableAnswers: ['6', '$6', '6 dollars'],
    multipleChoiceOptions: ['$4', '$5', '$6', '$7', '$10'],
    points: 10,
    explanation: '15 is 3 times 5, so cost is 3 times $2 = $6'
  }
]

// Generate goal-based questions from student's IEP goals
function generateGoalBasedQuestions(goals: Goal[]): FoundationalQuestion[] {
  const goalQuestions: FoundationalQuestion[] = []
  
  goals.forEach((goal, index) => {
    const goalText = goal.goalText.toLowerCase()
    
    // Solving equations
    if (goalText.includes('solving') && (goalText.includes('equation') || goalText.includes('linear'))) {
      const isOneStep = goalText.includes('one-step') || goalText.includes('one step')
      
      if (isOneStep) {
        goalQuestions.push({
          id: `goal-${index}-eq1`,
          category: 'Goal: Solving Equations',
          section: 'B',
          gradeLevel: '7th',
          skillArea: 'One-Step Equations',
          questionType: 'short-answer',
          questionText: 'Solve for x: x - 12 = 7',
          correctAnswer: '19',
          acceptableAnswers: ['19', 'x = 19', 'x=19'],
          points: 10,
          explanation: 'Add 12 to both sides: x = 7 + 12 = 19',
          isGoalBased: true
        })
      } else {
        goalQuestions.push({
          id: `goal-${index}-eq2`,
          category: 'Goal: Solving Equations',
          section: 'B',
          gradeLevel: '7th',
          skillArea: 'Multi-Step Equations',
          questionType: 'short-answer',
          questionText: 'Solve for x: 2x + 3 = 11',
          correctAnswer: '4',
          acceptableAnswers: ['4', 'x = 4', 'x=4'],
          points: 10,
          explanation: 'Subtract 3: 2x = 8, then divide by 2: x = 4',
          isGoalBased: true
        })
      }
    }
    
    // Evaluate expressions (substitution)
    if (goalText.includes('evaluate') || goalText.includes('substitut') || goalText.includes('plug')) {
      goalQuestions.push({
        id: `goal-${index}-eval`,
        category: 'Goal: Evaluate Expressions',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Substitution',
        questionType: 'short-answer',
        questionText: 'If x = 4, evaluate: 5x - 7',
        correctAnswer: '13',
        acceptableAnswers: ['13'],
        points: 10,
        explanation: 'Replace x with 4: 5(4) - 7 = 20 - 7 = 13',
        isGoalBased: true
      })
    }
    
    // Ratios and proportions
    if (goalText.includes('ratio') || goalText.includes('proportion')) {
      goalQuestions.push({
        id: `goal-${index}-ratio`,
        category: 'Goal: Ratios',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Ratios & Proportions',
        questionType: 'multiple-choice',
        questionText: 'The ratio of boys to girls is 3:5. If there are 15 girls, how many boys are there?',
        correctAnswer: '9',
        acceptableAnswers: ['9'],
        multipleChoiceOptions: ['6', '8', '9', '12', '15'],
        points: 10,
        explanation: 'If 5 parts = 15 girls, then 1 part = 3. So 3 parts = 9 boys.',
        isGoalBased: true
      })
    }
    
    // Percents
    if (goalText.includes('percent')) {
      goalQuestions.push({
        id: `goal-${index}-percent`,
        category: 'Goal: Percents',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Percent Problems',
        questionType: 'multiple-choice',
        questionText: 'What is 15% of 60?',
        correctAnswer: '9',
        acceptableAnswers: ['9'],
        multipleChoiceOptions: ['6', '7.5', '9', '10', '12'],
        points: 10,
        explanation: '15% = 0.15, so 0.15 × 60 = 9',
        isGoalBased: true
      })
    }
    
    // Integer operations
    if (goalText.includes('integer') || goalText.includes('positive and negative')) {
      goalQuestions.push({
        id: `goal-${index}-int`,
        category: 'Goal: Integers',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Integer Operations',
        questionType: 'multiple-choice',
        questionText: 'Calculate: -8 - (-3)',
        correctAnswer: '-5',
        acceptableAnswers: ['-5'],
        multipleChoiceOptions: ['-11', '-8', '-5', '5', '11'],
        points: 10,
        explanation: 'Subtracting a negative is like adding: -8 + 3 = -5',
        isGoalBased: true
      })
    }
    
    // Division (including multi-digit dividends)
    if (goalText.includes('divid') || goalText.includes('quotient')) {
      const isMultiDigit = goalText.includes('multi-digit') || goalText.includes('four digit') || goalText.includes('three digit')
      
      if (isMultiDigit) {
        // Multi-digit division
        goalQuestions.push({
          id: `goal-${index}-div-multi`,
          category: 'Goal: Division',
          section: 'B',
          gradeLevel: '5th-7th',
          skillArea: 'Multi-Digit Division',
          questionType: 'short-answer',
          questionText: 'Divide: 144 ÷ 6',
          correctAnswer: '24',
          acceptableAnswers: ['24'],
          points: 10,
          explanation: 'Use place value or the relationship between multiplication and division: 6 × 24 = 144',
          isGoalBased: true
        })
        
        goalQuestions.push({
          id: `goal-${index}-div-multi-2`,
          category: 'Goal: Division',
          section: 'B',
          gradeLevel: '5th-7th',
          skillArea: 'Multi-Digit Division',
          questionType: 'multiple-choice',
          questionText: 'What is 256 ÷ 8?',
          correctAnswer: '32',
          acceptableAnswers: ['32'],
          multipleChoiceOptions: ['28', '30', '32', '34', '36'],
          points: 10,
          explanation: 'Divide using place value strategies: 8 × 32 = 256',
          isGoalBased: true
        })
      } else {
        // Basic division
        goalQuestions.push({
          id: `goal-${index}-div-basic`,
          category: 'Goal: Division',
          section: 'B',
          gradeLevel: '4th-6th',
          skillArea: 'Division',
          questionType: 'multiple-choice',
          questionText: 'Calculate: 72 ÷ 9',
          correctAnswer: '8',
          acceptableAnswers: ['8'],
          multipleChoiceOptions: ['6', '7', '8', '9', '10'],
          points: 10,
          explanation: '9 × 8 = 72, so 72 ÷ 9 = 8',
          isGoalBased: true
        })
      }
    }
  })
  
  return goalQuestions
}

/**
 * Generate a mixed diagnostic test
 * - 5 Goal-based questions FIRST (personalized to student's IEP goals)
 * - 10 items from Section A (Foundational Gaps: 4th-6th grade skills)
 * - 10 items from Section B (Pre-Algebra Readiness: symbolic thinking & ratios)
 * Total: 25 questions (5 goal-based + 10 section A + 10 section B)
 * 
 * Students complete all questions without early exit.
 */
export function generateMixedDiagnostic(studentGoals: Goal[] = []): FoundationalQuestion[] {
  const diagnostic: FoundationalQuestion[] = []
  
  // FIRST: Add goal-based questions (always try to get 5)
  const goalQuestions = generateGoalBasedQuestions(studentGoals)
  
  // Pad with generic goal questions if student doesn't have 5 specific goals
  while (goalQuestions.length < 5) {
    const index = goalQuestions.length
    
    // Add generic pre-algebra questions as "goal-based" to ensure we have 5
    if (index === 0) {
      goalQuestions.push({
        id: `goal-generic-${index}`,
        category: 'Goal: Algebraic Thinking',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Solve Equations',
        questionType: 'short-answer',
        questionText: 'Solve for x: x + 5 = 12',
        correctAnswer: '7',
        acceptableAnswers: ['7', 'x = 7', 'x=7'],
        points: 10,
        explanation: 'Subtract 5 from both sides: x = 12 - 5 = 7',
        isGoalBased: true
      })
    } else if (index === 1) {
      goalQuestions.push({
        id: `goal-generic-${index}`,
        category: 'Goal: Ratios',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Proportions',
        questionType: 'multiple-choice',
        questionText: 'If 3 apples cost $2, how much do 9 apples cost?',
        correctAnswer: '$6',
        acceptableAnswers: ['6', '$6', '6 dollars'],
        multipleChoiceOptions: ['$4', '$5', '$6', '$7', '$8'],
        points: 10,
        explanation: '9 is 3 times 3, so cost is 3 times $2 = $6',
        isGoalBased: true
      })
    } else if (index === 2) {
      goalQuestions.push({
        id: `goal-generic-${index}`,
        category: 'Goal: Percents',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Percent Problems',
        questionType: 'multiple-choice',
        questionText: 'What is 20% of 50?',
        correctAnswer: '10',
        acceptableAnswers: ['10'],
        multipleChoiceOptions: ['5', '8', '10', '12', '15'],
        points: 10,
        explanation: '20% = 0.20, so 0.20 × 50 = 10',
        isGoalBased: true
      })
    } else if (index === 3) {
      goalQuestions.push({
        id: `goal-generic-${index}`,
        category: 'Goal: Expressions',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Evaluate Expressions',
        questionType: 'short-answer',
        questionText: 'If n = 6, what is 3n - 5?',
        correctAnswer: '13',
        acceptableAnswers: ['13'],
        points: 10,
        explanation: 'Substitute n = 6: 3(6) - 5 = 18 - 5 = 13',
        isGoalBased: true
      })
    } else {
      goalQuestions.push({
        id: `goal-generic-${index}`,
        category: 'Goal: Integers',
        section: 'B',
        gradeLevel: '7th',
        skillArea: 'Integer Operations',
        questionType: 'multiple-choice',
        questionText: 'Calculate: -4 + 7',
        correctAnswer: '3',
        acceptableAnswers: ['3', '+3'],
        multipleChoiceOptions: ['-11', '-3', '0', '3', '11'],
        points: 10,
        explanation: 'Start at -4, move 7 units right to reach 3',
        isGoalBased: true
      })
    }
  }
  
  // Add exactly 5 goal questions first
  diagnostic.push(...goalQuestions.slice(0, 5))
  
  // SECOND: Section A - All 10 foundational questions
  diagnostic.push(...sectionAQuestions)
  
  // THIRD: Section B - All 10 pre-algebra questions
  // But check if student has unit-rate goal - if not, skip that question
  const hasUnitRateGoal = studentGoals.some(g => 
    g.goalText.toLowerCase().includes('unit rate') || 
    g.goalText.toLowerCase().includes('unit-rate')
  )
  
  if (hasUnitRateGoal) {
    diagnostic.push(...sectionBQuestions)
  } else {
    // Skip the unit rate question, include all others
    diagnostic.push(...sectionBQuestions.filter(q => q.id !== 'b-unit-rate'))
  }
  
  return diagnostic
}
