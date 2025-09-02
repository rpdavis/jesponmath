import type { Assessment, AssessmentQuestion } from '@/types/iep';
import { MathGoalType, extractGradeFromStandard } from '@/types/iep';

// Assessment Bank for Grade 7 Math Goals
export const MATH_ASSESSMENT_BANK: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    goalId: 'area-surface-volume-composite-shapes',
    studentSeisId: '2209884', // Justice Buckner
    title: 'Composite Shapes Area Calculation',
    description: 'Assessment for calculating area of composite shapes using decomposition strategies',
    standard: '6.G.1',
    gradeLevel: 6,
    category: 'SA',
    totalPoints: 25,
    timeLimit: 45,
    instructions: 'Solve each problem by decomposing the composite shape into basic shapes. Show your work for each step.',
    accommodations: ['Extended time', 'Calculator allowed', 'Visual supports'],
    questions: [
      {
        id: 'comp-area-1',
        questionText: 'Find the area of a composite shape made of a rectangle (8×6) with a triangle (base 4, height 3) attached to one side.',
        questionType: 'short-answer',
        correctAnswer: '54',
        points: 5,
        explanation: 'Rectangle area: 8×6=48, Triangle area: (4×3)÷2=6, Total: 48+6=54 square units',
        hints: ['Break the shape into a rectangle and triangle', 'Calculate each area separately', 'Add the areas together']
      },
      {
        id: 'comp-area-2',
        questionText: 'A composite shape consists of a square (side 10) with a smaller square (side 3) removed from the center. What is the remaining area?',
        questionType: 'short-answer',
        correctAnswer: '91',
        points: 5,
        explanation: 'Large square: 10×10=100, Small square: 3×3=9, Remaining: 100-9=91 square units',
        hints: ['Calculate the area of the large square', 'Calculate the area of the removed square', 'Subtract to find remaining area']
      },
      {
        id: 'comp-area-3',
        questionText: 'Which strategy would you use to find the area of an L-shaped figure?',
        questionType: 'multiple-choice',
        options: [
          'Decompose into rectangles',
          'Use the formula for triangles',
          'Measure each side individually',
          'Count unit squares only'
        ],
        correctAnswer: 'Decompose into rectangles',
        points: 3,
        explanation: 'L-shapes are best solved by breaking them into rectangles'
      },
      {
        id: 'comp-area-4',
        questionText: 'A composite shape is made of two rectangles: Rectangle A (12×5) and Rectangle B (6×8). If they overlap by a 3×4 rectangle, what is the total area?',
        questionType: 'short-answer',
        correctAnswer: '96',
        points: 7,
        explanation: 'Rect A: 60, Rect B: 48, Overlap: 12, Total: 60+48-12=96 square units',
        hints: ['Calculate area of each rectangle', 'Calculate overlap area', 'Use addition/subtraction to avoid double-counting']
      },
      {
        id: 'comp-area-5',
        questionText: 'Explain the steps to find the area of any composite shape.',
        questionType: 'essay',
        correctAnswer: '1. Identify basic shapes within the composite shape, 2. Calculate area of each basic shape, 3. Add or subtract areas as needed, 4. Include proper units in final answer',
        points: 5,
        explanation: 'Students should demonstrate understanding of the decomposition process'
      }
    ]
  },
  {
    goalId: 'one-two-step-equations',
    studentSeisId: '2209884', // Justice Buckner
    title: 'Solving One and Two-Step Equations',
    description: 'Assessment for solving linear equations using inverse operations and algebraic strategies',
    standard: '6.EE.7',
    gradeLevel: 6,
    category: 'SA',
    totalPoints: 25,
    timeLimit: 40,
    instructions: 'Solve each equation. Show your work and check your answers.',
    accommodations: ['Extended time', 'Equation mat with algebra tiles available', 'Step-by-step checklist'],
    questions: [
      {
        id: 'equations-1',
        questionText: 'Solve: 2x = 12',
        questionType: 'short-answer',
        correctAnswer: 'x = 6',
        points: 3,
        explanation: 'Divide both sides by 2: x = 12 ÷ 2 = 6',
        hints: ['Use inverse operation of multiplication', 'Divide both sides by the coefficient']
      },
      {
        id: 'equations-2',
        questionText: 'Solve: 3x - 4 = 11',
        questionType: 'short-answer',
        correctAnswer: 'x = 5',
        points: 5,
        explanation: 'Add 4 to both sides: 3x = 15, then divide by 3: x = 5',
        hints: ['First isolate the term with x', 'Use inverse operations in reverse order']
      },
      {
        id: 'equations-3',
        questionText: 'Solve: x + 7 = 15',
        questionType: 'short-answer',
        correctAnswer: 'x = 8',
        points: 3,
        explanation: 'Subtract 7 from both sides: x = 15 - 7 = 8',
        hints: ['Use inverse operation of addition']
      },
      {
        id: 'equations-4',
        questionText: 'Solve: 4x + 6 = 22',
        questionType: 'short-answer',
        correctAnswer: 'x = 4',
        points: 5,
        explanation: 'Subtract 6: 4x = 16, then divide by 4: x = 4',
        hints: ['First subtract 6 from both sides', 'Then divide by 4']
      },
      {
        id: 'equations-5',
        questionText: 'Which operation should you perform first when solving 5x - 8 = 17?',
        questionType: 'multiple-choice',
        options: [
          'Divide by 5',
          'Add 8 to both sides',
          'Subtract 17',
          'Multiply by 5'
        ],
        correctAnswer: 'Add 8 to both sides',
        points: 3,
        explanation: 'Always isolate the variable term first by undoing addition/subtraction',
        hints: ['Work backwards from the order of operations']
      },
      {
        id: 'equations-6',
        questionText: 'Create and solve an equation for this problem: "A number multiplied by 3, then decreased by 5, equals 10. What is the number?"',
        questionType: 'short-answer',
        correctAnswer: '3x - 5 = 10, x = 5',
        points: 6,
        explanation: 'Equation: 3x - 5 = 10, Add 5: 3x = 15, Divide by 3: x = 5',
        hints: ['Translate words to algebraic expression', 'Set up equation', 'Solve step by step']
      }
    ]
  },
  {
    goalId: 'two-step-linear-equations-rational',
    studentSeisId: '1483650', // Mason Demuth
    title: 'Two-Step Linear Equations with Rational Numbers',
    description: 'Assessment for solving two-step equations involving rational coefficients',
    standard: '7.EE.4a',
    gradeLevel: 7,
    category: 'SA',
    totalPoints: 30,
    timeLimit: 50,
    instructions: 'Solve each equation involving rational numbers. Show all steps clearly.',
    accommodations: ['Extended time', 'Calculator for decimal calculations', 'Visual equation models'],
    questions: [
      {
        id: 'rational-eq-1',
        questionText: 'Solve: 2.5x + 3 = 13',
        questionType: 'short-answer',
        correctAnswer: 'x = 4',
        points: 5,
        explanation: 'Subtract 3: 2.5x = 10, Divide by 2.5: x = 4',
        hints: ['Work with decimals like whole numbers', 'Use inverse operations']
      },
      {
        id: 'rational-eq-2',
        questionText: 'Solve: (1/2)x - 4 = 2',
        questionType: 'short-answer',
        correctAnswer: 'x = 12',
        points: 6,
        explanation: 'Add 4: (1/2)x = 6, Multiply by 2: x = 12',
        hints: ['Add 4 to both sides first', 'Multiply by the reciprocal of 1/2']
      },
      {
        id: 'rational-eq-3',
        questionText: 'Solve: 3x + 1.5 = 10.5',
        questionType: 'short-answer',
        correctAnswer: 'x = 3',
        points: 5,
        explanation: 'Subtract 1.5: 3x = 9, Divide by 3: x = 3',
        hints: ['Handle decimals carefully', 'Check your arithmetic']
      },
      {
        id: 'rational-eq-4',
        questionText: 'Word Problem: Sarah has $15.50. She buys 3 items that cost the same amount and has $3.50 left. Write and solve an equation to find the cost of each item.',
        questionType: 'short-answer',
        correctAnswer: '15.50 - 3x = 3.50, x = 4',
        points: 8,
        explanation: 'Equation: 15.50 - 3x = 3.50, Subtract 15.50: -3x = -12, Divide by -3: x = 4',
        hints: ['Identify what the variable represents', 'Set up equation based on the situation', 'Solve step by step']
      },
      {
        id: 'rational-eq-5',
        questionText: 'Which property is used when solving 4(x + 2) = 20?',
        questionType: 'multiple-choice',
        options: [
          'Distributive Property',
          'Commutative Property',
          'Associative Property',
          'Identity Property'
        ],
        correctAnswer: 'Distributive Property',
        points: 3,
        explanation: 'The distributive property is used to expand 4(x + 2) = 4x + 8',
        hints: ['Think about how to remove parentheses']
      },
      {
        id: 'rational-eq-6',
        questionText: 'Solve and check: 2(x - 3) + 5 = 11',
        questionType: 'short-answer',
        correctAnswer: 'x = 6',
        points: 3,
        explanation: 'Distribute: 2x - 6 + 5 = 11, Simplify: 2x - 1 = 11, Add 1: 2x = 12, Divide: x = 6. Check: 2(6-3)+5 = 2(3)+5 = 11 ✓',
        hints: ['Use distributive property first', 'Combine like terms', 'Check by substituting back']
      }
    ]
  },
  {
    goalId: 'rational-numbers-operations',
    studentSeisId: '2216794', // Lexee Chatfield
    title: 'Operations with Rational Numbers',
    description: 'Assessment for solving word problems involving all four operations with rational numbers',
    standard: '6.NS.A.1',
    gradeLevel: 6,
    category: 'SA',
    totalPoints: 25,
    timeLimit: 45,
    instructions: 'Solve each word problem involving rational numbers. Show your work and include proper units.',
    accommodations: ['Extended time', 'Read aloud available', 'Calculator allowed'],
    questions: [
      {
        id: 'rational-ops-1',
        questionText: 'A recipe calls for 2.5 cups of flour. If you want to make 1.5 times the recipe, how much flour do you need?',
        questionType: 'short-answer',
        correctAnswer: '3.75 cups',
        points: 4,
        explanation: '2.5 × 1.5 = 3.75 cups',
        hints: ['Multiply the original amount by the scale factor']
      },
      {
        id: 'rational-ops-2',
        questionText: 'Tom owes $15.75. He pays back $8.50. How much does he still owe?',
        questionType: 'short-answer',
        correctAnswer: '$7.25',
        points: 3,
        explanation: '$15.75 - $8.50 = $7.25',
        hints: ['This is a subtraction problem', 'Align decimal points when subtracting']
      },
      {
        id: 'rational-ops-3',
        questionText: 'A pizza is cut into 8 equal slices. Sarah eats 3/8 of the pizza and Mike eats 2/8. What fraction of the pizza is left?',
        questionType: 'short-answer',
        correctAnswer: '3/8',
        points: 4,
        explanation: 'Total eaten: 3/8 + 2/8 = 5/8, Remaining: 8/8 - 5/8 = 3/8',
        hints: ['Add the fractions that were eaten', 'Subtract from the whole pizza']
      },
      {
        id: 'rational-ops-4',
        questionText: 'If 4 friends share $18.60 equally, how much money does each friend get?',
        questionType: 'short-answer',
        correctAnswer: '$4.65',
        points: 4,
        explanation: '$18.60 ÷ 4 = $4.65',
        hints: ['This is a division problem', 'Divide the total by the number of friends']
      },
      {
        id: 'rational-ops-5',
        questionText: 'Which operation would you use to solve: "John ran 2.5 miles on Monday and 1.8 miles on Tuesday. How many total miles did he run?"',
        questionType: 'multiple-choice',
        options: ['Addition', 'Subtraction', 'Multiplication', 'Division'],
        correctAnswer: 'Addition',
        points: 3,
        explanation: 'Finding total requires addition: 2.5 + 1.8 = 4.3 miles',
        hints: ['Look for key words like "total" or "altogether"']
      },
      {
        id: 'rational-ops-6',
        questionText: 'Multi-step problem: Lisa buys 3 notebooks for $2.75 each and 2 pens for $1.25 each. She pays with a $20 bill. How much change does she receive?',
        questionType: 'short-answer',
        correctAnswer: '$8.75',
        points: 7,
        explanation: 'Notebooks: 3 × $2.75 = $8.25, Pens: 2 × $1.25 = $2.50, Total spent: $8.25 + $2.50 = $10.75, Change: $20.00 - $10.75 = $9.25',
        hints: ['Calculate cost of notebooks', 'Calculate cost of pens', 'Add total costs', 'Subtract from amount paid']
      }
    ]
  },
  {
    goalId: 'integer-operations-four-operations',
    studentSeisId: '1571594', // Brodee Foster
    title: 'Four Operations with Rational Numbers',
    description: 'Assessment for solving real-world problems using all four operations with integers and rational numbers',
    standard: '7.NS.3',
    gradeLevel: 7,
    category: 'SA',
    totalPoints: 30,
    timeLimit: 50,
    instructions: 'Solve each problem involving integers and rational numbers. Use a multiplication table if needed.',
    accommodations: ['Multiplication table provided', 'Extended time', 'Visual number line'],
    questions: [
      {
        id: 'integer-ops-1',
        questionText: 'Calculate: (-5) + 8',
        questionType: 'short-answer',
        correctAnswer: '3',
        points: 3,
        explanation: 'Moving 8 units right from -5 gives us 3',
        hints: ['Use a number line if helpful', 'Adding a positive moves right']
      },
      {
        id: 'integer-ops-2',
        questionText: 'Calculate: (-3) × (-4)',
        questionType: 'short-answer',
        correctAnswer: '12',
        points: 4,
        explanation: 'Negative times negative equals positive: 12',
        hints: ['Remember the sign rules for multiplication']
      },
      {
        id: 'integer-ops-3',
        questionText: 'The temperature was -8°F in the morning. It rose 15°F by afternoon. What was the afternoon temperature?',
        questionType: 'short-answer',
        correctAnswer: '7°F',
        points: 4,
        explanation: '-8 + 15 = 7°F',
        hints: ['This is an addition problem with integers']
      },
      {
        id: 'integer-ops-4',
        questionText: 'Calculate: 24 ÷ (-6)',
        questionType: 'short-answer',
        correctAnswer: '-4',
        points: 4,
        explanation: 'Positive divided by negative equals negative: -4',
        hints: ['Remember sign rules for division']
      },
      {
        id: 'integer-ops-5',
        questionText: 'A submarine descends 45 feet, then rises 12 feet, then descends another 8 feet. What is its final position relative to sea level?',
        questionType: 'short-answer',
        correctAnswer: '-41 feet',
        points: 6,
        explanation: '-45 + 12 - 8 = -41 feet below sea level',
        hints: ['Down is negative, up is positive', 'Work from left to right']
      },
      {
        id: 'integer-ops-6',
        questionText: 'Which expression represents "5 less than negative 3"?',
        questionType: 'multiple-choice',
        options: ['-3 - 5', '-3 + 5', '5 - (-3)', '(-3) × 5'],
        correctAnswer: '-3 - 5',
        points: 4,
        explanation: '"5 less than -3" means start with -3 and subtract 5',
        hints: ['Pay attention to the order of the words']
      },
      {
        id: 'integer-ops-7',
        questionText: 'Explain why (-2) × (-3) = 6 using a real-world example.',
        questionType: 'essay',
        correctAnswer: 'Sample: If you remove 2 groups of 3 debts, you gain 6 dollars. Negative times negative gives positive.',
        points: 5,
        explanation: 'Students should demonstrate understanding that two negatives make a positive',
        hints: ['Think about removing debts or going backwards in reverse']
      }
    ]
  },
  {
    goalId: 'fractions-unlike-denominators',
    studentSeisId: '2570001', // Dylan Hoffman
    title: 'Adding and Subtracting Fractions with Unlike Denominators',
    description: 'Assessment for operations with fractions having different denominators',
    standard: '5.NF.1',
    gradeLevel: 5,
    category: 'SA',
    totalPoints: 25,
    timeLimit: 45,
    instructions: 'Add or subtract the fractions. Show your work finding equivalent fractions.',
    accommodations: ['Extended time', 'Fraction strips available', 'Visual models allowed'],
    questions: [
      {
        id: 'fractions-1',
        questionText: 'Calculate: 1/2 + 1/4',
        questionType: 'short-answer',
        correctAnswer: '3/4',
        points: 4,
        explanation: '1/2 = 2/4, so 2/4 + 1/4 = 3/4',
        hints: ['Find a common denominator', 'Convert fractions to equivalent forms']
      },
      {
        id: 'fractions-2',
        questionText: 'Calculate: 2/3 - 1/6',
        questionType: 'short-answer',
        correctAnswer: '1/2',
        points: 5,
        explanation: '2/3 = 4/6, so 4/6 - 1/6 = 3/6 = 1/2',
        hints: ['Find common denominator of 6', 'Simplify your answer']
      },
      {
        id: 'fractions-3',
        questionText: 'Calculate: 1 2/4 + 3/5',
        questionType: 'short-answer',
        correctAnswer: '2 1/10',
        points: 6,
        explanation: 'Convert: 1 2/4 = 1 1/2 = 15/10, 3/5 = 6/10, Sum: 21/10 = 2 1/10',
        hints: ['Convert mixed number to improper fraction', 'Find common denominator']
      },
      {
        id: 'fractions-4',
        questionText: 'What is the least common denominator for 1/3 and 1/4?',
        questionType: 'multiple-choice',
        options: ['7', '12', '6', '24'],
        correctAnswer: '12',
        points: 3,
        explanation: 'LCM of 3 and 4 is 12',
        hints: ['Find the smallest number both denominators divide into evenly']
      },
      {
        id: 'fractions-5',
        questionText: 'Word Problem: Maria ate 1/3 of a pizza and her brother ate 1/4 of the same pizza. What fraction of the pizza did they eat together?',
        questionType: 'short-answer',
        correctAnswer: '7/12',
        points: 5,
        explanation: '1/3 = 4/12, 1/4 = 3/12, Total: 4/12 + 3/12 = 7/12',
        hints: ['This is an addition problem', 'Find common denominator of 12']
      },
      {
        id: 'fractions-6',
        questionText: 'Explain the steps to add fractions with unlike denominators.',
        questionType: 'essay',
        correctAnswer: '1. Find the least common denominator, 2. Convert fractions to equivalent fractions with the LCD, 3. Add the numerators, 4. Keep the common denominator, 5. Simplify if possible',
        points: 2,
        explanation: 'Students should demonstrate understanding of the process',
        hints: ['Think about what makes fractions equivalent']
      }
    ]
  },
  {
    goalId: 'division-multi-digit',
    studentSeisId: '2570001', // Dylan Hoffman
    title: 'Multi-Digit Division Strategies',
    description: 'Assessment for division problems with large dividends and multi-digit divisors',
    standard: '5.NBT.6',
    gradeLevel: 5,
    category: 'SA',
    totalPoints: 25,
    timeLimit: 40,
    instructions: 'Solve each division problem using appropriate strategies. Show your work.',
    accommodations: ['Extended time', 'Multiplication chart', 'Step-by-step guide'],
    questions: [
      {
        id: 'division-1',
        questionText: 'Calculate: 144 ÷ 12',
        questionType: 'short-answer',
        correctAnswer: '12',
        points: 3,
        explanation: '144 ÷ 12 = 12 (12 × 12 = 144)',
        hints: ['Use the relationship between multiplication and division']
      },
      {
        id: 'division-2',
        questionText: 'Calculate: 2,468 ÷ 23',
        questionType: 'short-answer',
        correctAnswer: '107 R 7',
        points: 6,
        explanation: '2,468 ÷ 23 = 107 remainder 7 (23 × 107 = 2,461, 2,468 - 2,461 = 7)',
        hints: ['Use long division algorithm', 'Check: quotient × divisor + remainder = dividend']
      },
      {
        id: 'division-3',
        questionText: 'Word Problem: A school has 1,248 students. If they are divided equally into 24 classes, how many students are in each class?',
        questionType: 'short-answer',
        correctAnswer: '52 students',
        points: 5,
        explanation: '1,248 ÷ 24 = 52 students per class',
        hints: ['This is a division problem', 'Total ÷ number of groups = amount per group']
      },
      {
        id: 'division-4',
        questionText: 'Calculate: 5,670 ÷ 45',
        questionType: 'short-answer',
        correctAnswer: '126',
        points: 5,
        explanation: '5,670 ÷ 45 = 126 (45 × 126 = 5,670)',
        hints: ['Use long division or break into smaller parts']
      },
      {
        id: 'division-5',
        questionText: 'Which strategy is most efficient for calculating 800 ÷ 25?',
        questionType: 'multiple-choice',
        options: [
          'Long division',
          'Think: 25 × ? = 800',
          'Repeated subtraction',
          'Guess and check'
        ],
        correctAnswer: 'Think: 25 × ? = 800',
        points: 3,
        explanation: 'Using multiplication relationship: 25 × 32 = 800',
        hints: ['Look for patterns and relationships']
      },
      {
        id: 'division-6',
        questionText: 'Explain how to check if your division answer is correct.',
        questionType: 'essay',
        correctAnswer: 'Multiply the quotient by the divisor and add any remainder. The result should equal the original dividend.',
        points: 3,
        explanation: 'Students should understand the inverse relationship between multiplication and division',
        hints: ['Think about the inverse operation of division']
      }
    ]
  },
  {
    goalId: 'word-problems-estimation',
    studentSeisId: '2107809', // Jazmine Herrera
    title: 'Word Problems with Estimation and Four Operations',
    description: 'Assessment for estimating and solving word problems using all four operations',
    standard: '6.NS.5',
    gradeLevel: 6,
    category: 'SA',
    totalPoints: 28,
    timeLimit: 50,
    instructions: 'For each problem, first estimate the answer, then calculate the exact solution. Show both steps.',
    accommodations: ['Extended time', 'Problems read aloud', 'Calculator for checking'],
    questions: [
      {
        id: 'estimation-1',
        questionText: 'Estimate, then calculate: 47 × 23',
        questionType: 'short-answer',
        correctAnswer: 'Estimate: 1,000; Exact: 1,081',
        points: 5,
        explanation: 'Estimate: 50 × 20 = 1,000; Exact: 47 × 23 = 1,081',
        hints: ['Round to nearest 10 for estimation', 'Use standard multiplication for exact answer']
      },
      {
        id: 'estimation-2',
        questionText: 'Estimate, then calculate: 789 ÷ 38',
        questionType: 'short-answer',
        correctAnswer: 'Estimate: 20; Exact: 20 R 29',
        points: 6,
        explanation: 'Estimate: 800 ÷ 40 = 20; Exact: 789 ÷ 38 = 20 R 29',
        hints: ['Round both numbers for easier estimation']
      },
      {
        id: 'estimation-3',
        questionText: 'Word Problem: A store sells 287 items per day. Estimate how many items they sell in 19 days, then calculate the exact amount.',
        questionType: 'short-answer',
        correctAnswer: 'Estimate: 6,000; Exact: 5,453',
        points: 6,
        explanation: 'Estimate: 300 × 20 = 6,000; Exact: 287 × 19 = 5,453',
        hints: ['Round 287 to 300 and 19 to 20 for estimation']
      },
      {
        id: 'estimation-4',
        questionText: 'Why is estimation useful when solving word problems?',
        questionType: 'multiple-choice',
        options: [
          'To check if your answer is reasonable',
          'To make the problem easier',
          'To avoid using a calculator',
          'To get the exact answer faster'
        ],
        correctAnswer: 'To check if your answer is reasonable',
        points: 3,
        explanation: 'Estimation helps verify that calculated answers make sense',
        hints: ['Think about why we estimate in real life']
      },
      {
        id: 'estimation-5',
        questionText: 'Multi-step: A factory produces 1,247 toys per week. If they package 36 toys per box, estimate how many full boxes they can make in one week, then calculate exactly.',
        questionType: 'short-answer',
        correctAnswer: 'Estimate: 30 boxes; Exact: 34 full boxes',
        points: 8,
        explanation: 'Estimate: 1,200 ÷ 40 = 30; Exact: 1,247 ÷ 36 = 34 R 23 (34 full boxes)',
        hints: ['Round for estimation', 'Use division to find number of groups', 'Consider only full boxes']
      }
    ]
  },
  {
    goalId: 'algebraic-expressions-verbal',
    studentSeisId: '1536466', // Rebecca Morgan
    title: 'Translating Verbal Phrases to Algebraic Expressions',
    description: 'Assessment for writing algebraic expressions from word descriptions',
    standard: '6.EE.2a',
    gradeLevel: 6,
    category: 'SA',
    totalPoints: 25,
    timeLimit: 35,
    instructions: 'Translate each verbal phrase into an algebraic expression using variables.',
    accommodations: ['Extended time', 'Keyword chart provided', 'Examples available'],
    questions: [
      {
        id: 'algebra-verbal-1',
        questionText: 'Write an expression for: "Four more than a number x"',
        questionType: 'short-answer',
        correctAnswer: 'x + 4',
        points: 3,
        explanation: '"More than" indicates addition: x + 4',
        hints: ['More than means addition']
      },
      {
        id: 'algebra-verbal-2',
        questionText: 'Write an expression for: "Three times a number y, decreased by 7"',
        questionType: 'short-answer',
        correctAnswer: '3y - 7',
        points: 4,
        explanation: '"Three times y" is 3y, "decreased by 7" means subtract 7',
        hints: ['Times means multiplication', 'Decreased by means subtraction']
      },
      {
        id: 'algebra-verbal-3',
        questionText: 'Write an expression for: "The quotient of a number n and 5"',
        questionType: 'short-answer',
        correctAnswer: 'n ÷ 5 or n/5',
        points: 4,
        explanation: 'Quotient means division: n ÷ 5',
        hints: ['Quotient is the result of division']
      },
      {
        id: 'algebra-verbal-4',
        questionText: 'Which expression represents "twice the sum of x and 3"?',
        questionType: 'multiple-choice',
        options: ['2x + 3', '2(x + 3)', 'x + 3 × 2', '2x × 3'],
        correctAnswer: '2(x + 3)',
        points: 4,
        explanation: '"Sum of x and 3" is (x + 3), "twice" means multiply by 2',
        hints: ['Find the sum first, then multiply by 2']
      },
      {
        id: 'algebra-verbal-5',
        questionText: 'Write an expression for: "Half of a number m, plus 8"',
        questionType: 'short-answer',
        correctAnswer: 'm/2 + 8 or (1/2)m + 8',
        points: 4,
        explanation: '"Half of m" is m/2, "plus 8" adds 8',
        hints: ['Half means divide by 2 or multiply by 1/2']
      },
      {
        id: 'algebra-verbal-6',
        questionText: 'Create a word phrase for the expression: 5n - 12',
        questionType: 'short-answer',
        correctAnswer: 'Five times a number n, decreased by twelve (or similar)',
        points: 6,
        explanation: '5n means "five times n", -12 means "decreased by twelve"',
        hints: ['Work backwards from expression to words']
      }
    ]
  }
];

// Function to get assessments by student
export function getAssessmentsByStudent(seisId: string): (Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>)[] {
  return MATH_ASSESSMENT_BANK.filter(assessment => assessment.studentSeisId === seisId);
}

// Function to get assessments by standard
export function getAssessmentsByStandard(standard: string): (Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>)[] {
  return MATH_ASSESSMENT_BANK.filter(assessment => assessment.standard === standard);
}

// Function to get all unique standards covered
export function getAllStandardsCovered(): string[] {
  return [...new Set(MATH_ASSESSMENT_BANK.map(assessment => assessment.standard).filter((standard): standard is string => Boolean(standard)))];
}
