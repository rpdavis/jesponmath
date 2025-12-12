// Strategy Lesson Configurations
// Defines all mini-lessons for math fluency strategies

import type { StrategyLesson, LessonProblem } from '@/types/strategyLessons'

// ==================== LESSON 1: MAKING 5 ====================

const making5Lesson: StrategyLesson = {
  id: 'making-5',
  title: 'Making 5: Partners of 5',
  operation: 'addition',
  requiredAfterSession: 1, // Trigger after first practice session
  prerequisites: [],

  overview: {
    what: 'Finding two numbers that add up to exactly 5. These pairs are called "partners of 5" or "friends of 5".',

    why: 'Making 5 helps you add faster and is the foundation for Making 10 (the most important strategy). It also helps you see number patterns.',

    when: 'Use this whenever you see small numbers (0-5) being added together.',

    examples: [
      '4 + 1 = 5 (4 and 1 are partners)',
      '2 + 3 = 5 (2 and 3 are partners)',
      '5 + 0 = 5 (5 and 0 are partners)',
    ],

    memoryTricks: [
      "Think of fingers on one hand: If you're holding up 1 finger, 4 are down",
      'When you see 1, think 4!',
      'When you see 2, think 3!',
      'The partners: 1↔4, 2↔3, 5↔0',
    ],
  },

  video: {
    provider: 'youtube',
    url: 'https://www.youtube.com/watch?v=A-ykhY_IoaU',
    title: 'Making 5 Strategy',
    duration: 180, // 3 minutes
  },

  practice: {
    type: 'missing-number',
    problems: generateMaking5Problems(),
    successCriteria: {
      minCorrect: 8,
      minPercentage: 80,
    },
  },

  completionMessage: 'Great work! You learned the partners of 5: 1↔4, 2↔3, and 5↔0.',
  nextSteps:
    'In your next practice session, try to use the Making 5 strategy when you see problems like 4+1 or 2+3!',
}

// ==================== LESSON 2: MAKING 10 (Partners) ====================

const making10Lesson: StrategyLesson = {
  id: 'making-10',
  title: 'Making 10: Partners of 10',
  operation: 'addition',
  requiredAfterSession: 6, // 2 sessions after Making 5
  prerequisites: ['making-5'],

  overview: {
    what: 'Finding two numbers that add up to exactly 10. Just like partners of 5, but with 10!',

    why: 'Knowing partners of 10 by heart is THE foundation for all harder addition. You need to know these instantly!',

    when: 'Whenever you see numbers that could make 10 (like 9+1, 8+2, 7+3).',

    examples: [
      '9 + 1 = 10 (9 and 1 are partners)',
      '8 + 2 = 10 (8 and 2 are partners)',
      '7 + 3 = 10 (7 and 3 are partners)',
      '6 + 4 = 10 (6 and 4 are partners)',
    ],

    memoryTricks: [
      'Think of your two hands (10 fingers total)',
      '1 and 9 are best friends = 10',
      '2 and 8 go on dates = 10',
      '3 and 7 are lucky = 10',
      '4 and 6 are perfect = 10',
      '5 and 5 are twins = 10',
    ],
  },

  video: {
    provider: 'youtube',
    url: 'https://www.youtube.com/watch?v=9FC0WT186aY',
    title: 'Partners of 10',
    startTime: 5,
    duration: 180, // ~3 minutes (shorter, just partners)
  },

  practice: {
    type: 'missing-number',
    problems: generatePartnersOf10Problems(),
    successCriteria: {
      minCorrect: 8,
      minPercentage: 80,
    },
  },

  completionMessage: 'Excellent! You know your partners of 10! This is a huge milestone!',
  nextSteps: "Next, you'll learn how to use Making 10 to solve harder problems like 8+7 and 9+6!",
}

// ==================== LESSON 3: BRIDGING TO 10 ====================

const bridgingLesson: StrategyLesson = {
  id: 'bridging-to-10',
  title: 'Bridging to 10: Adding Past 10',
  operation: 'addition',
  requiredSubLevel: 'addition_within_20', // ⭐ Show when student reaches Level 2 (>10 problems)
  prerequisites: ['making-10'],

  overview: {
    what: 'Using Making 10 to solve harder problems where the sum is greater than 10 (like 8+7, 9+6).',

    why: 'This is THE most powerful strategy! Once you make 10, adding the rest is easy. 8+7 becomes 10+5!',

    when: 'Use this for bridging problems where the sum goes past 10 (8+7, 9+6, 7+8, etc.).',

    examples: [
      "8 + 7: Make 10 first (8+2=10), then add what's left (10+5=15)",
      "9 + 6: Make 10 first (9+1=10), then add what's left (10+5=15)",
      "7 + 8: Make 10 first (7+3=10), then add what's left (10+5=15)",
    ],

    memoryTricks: [
      'Break apart the second number to complete 10',
      'Ask: "How many more to make 10?" then "What\'s left over?"',
      'Think: Make 10 FIRST, then add the rest',
    ],
  },

  video: {
    provider: 'youtube',
    url: 'https://www.youtube.com/watch?v=9FC0WT186aY',
    title: 'Bridging Strategy',
    startTime: 120, // Start at bridging section
    duration: 240,
  },

  practice: {
    type: 'scaffolded',
    problems: generateBridgingProblems(),
    successCriteria: {
      minCorrect: 5,
      minPercentage: 70, // Lower because this is harder
    },
  },

  completionMessage:
    'Amazing! You can now solve hard problems like 8+7 and 9+6 using the Bridging strategy!',
  nextSteps:
    "Keep practicing bridging problems. Soon you'll do them without thinking about the steps!",
}

// ==================== LESSON 4: DECOMPOSING WITH TEN FRAMES ====================

const decomposingLesson: StrategyLesson = {
  id: 'decomposing-ten-frames',
  title: 'Decomposing with Ten Frames',
  operation: 'addition',
  requiredSubLevel: 'addition_within_20', // ⭐ Also on Level 2 (visual support for bridging)
  requiredAfterSession: 8, // But later in the level (after some practice with bridging)
  prerequisites: ['bridging-to-10'],

  overview: {
    what: 'Using visual ten frames to SEE how we break numbers apart to make 10. This makes the Making 10 strategy clearer and easier to understand.',

    why: "Ten frames help you visualize what's happening when you decompose numbers. Seeing it visually makes it stick in your brain better!",

    when: 'Use ten frames when learning bridging problems (7+8, 8+9, 6+9) or whenever you need to SEE the numbers.',

    examples: [
      '7+8: Move 3 dots to fill the first frame (make 10), leaving 5. So 7+8=10+5=15',
      '6+9: Move 4 dots to fill the first frame (make 10), leaving 5. So 6+9=10+5=15',
    ],

    memoryTricks: [
      'A ten frame has 10 boxes - fill it first!',
      'Move dots from the second frame to complete the first frame',
      "What's left in the second frame? That's what you add to 10!",
    ],
  },

  video: {
    provider: 'youtube',
    url: 'https://www.youtube.com/watch?v=UzQnoXrJg1o',
    title: 'Ten Frames for Addition',
    startTime: 110, // Start at 1:50 (decomposing section)
    duration: 180, // ~3 minutes
  },

  practice: {
    type: 'drag-drop',
    problems: generateDecomposingProblems(),
    successCriteria: {
      minCorrect: 6,
      minPercentage: 75,
    },
  },

  completionMessage: 'Awesome! You can now visualize decomposing numbers using ten frames!',
  nextSteps:
    "You'll practice bridging problems with the ten frame visual available if you need it. Over time, you'll be able to do it without the visual!",
}

// ==================== PROBLEM GENERATORS ====================

function generateMaking5Problems(): LessonProblem[] {
  const problems: LessonProblem[] = []

  // Part 1: Missing number problems (fill in to make 5)
  const pairs = [
    [4, 1],
    [2, 3],
    [1, 4],
    [3, 2],
    [5, 0],
    [0, 5],
    [1, 4],
    [2, 3],
    [4, 1],
    [3, 2],
  ]

  pairs.forEach(([num1, num2], index) => {
    // Right side missing: 4 + _ = 5
    problems.push({
      id: `making5-${index}-right`,
      problemText: `${num1} + _ = 5`,
      problemType: 'missing-number',
      num1,
      num2,
      operation: 'addition',
      correctAnswer: num2.toString(),
      feedbackCorrect: `✅ Correct! ${num1} + ${num2} = 5`,
      feedbackIncorrect: `Not quite. ${num1} needs ${num2} to make 5. Try again!`,
      strategy: `${num1} and ${num2} are partners of 5`,
      hints: [
        `Think: ${num1} + ? = 5`,
        `Use your fingers: Hold up ${num1}, how many more to make 5?`,
        `The answer is ${num2}`,
      ],
    })
  })

  // Part 2: Left side missing (first 5 problems)
  ;[
    [4, 1],
    [3, 2],
    [1, 4],
    [2, 3],
    [5, 0],
  ].forEach(([num1, num2], index) => {
    problems.push({
      id: `making5-${index}-left`,
      problemText: `_ + ${num2} = 5`,
      problemType: 'missing-number',
      num1,
      num2,
      operation: 'addition',
      correctAnswer: num1.toString(),
      feedbackCorrect: `✅ Correct! ${num1} + ${num2} = 5`,
      feedbackIncorrect: `Not quite. ${num1} + ${num2} = 5. Try again!`,
      strategy: `${num1} and ${num2} are partners of 5`,
    })
  })

  return problems.slice(0, 12) // Return 12 problems total
}

// Generator for Partners of 10 (Lesson 2)
function generatePartnersOf10Problems(): LessonProblem[] {
  const problems: LessonProblem[] = []

  // Partners of 10 (missing number format)
  const partners = [
    [9, 1],
    [8, 2],
    [7, 3],
    [6, 4],
    [5, 5],
    [1, 9],
    [2, 8],
    [3, 7],
    [4, 6],
    [6, 4],
  ]

  partners.forEach(([num1, num2], index) => {
    problems.push({
      id: `partners10-${index}`,
      problemText: `${num1} + _ = 10`,
      problemType: 'missing-number',
      num1,
      num2,
      operation: 'addition',
      correctAnswer: num2.toString(),
      feedbackCorrect: `✅ Yes! ${num1} + ${num2} = 10`,
      feedbackIncorrect: `Not quite. ${num1} and ${num2} are partners of 10.`,
      strategy: `${num1} + ${num2} = 10 (partners of 10)`,
    })
  })

  return problems
}

// Generator for Bridging Problems (Lesson 3)
function generateBridgingProblems(): LessonProblem[] {
  const problems: LessonProblem[] = []

  // Scaffolded bridging problems (step-by-step)
  const bridgingPairs = [
    [8, 7, 15], // 8+7=15
    [9, 6, 15], // 9+6=15
    [7, 8, 15], // 7+8=15
    [6, 9, 15], // 6+9=15
    [8, 5, 13], // 8+5=13
    [7, 6, 13], // 7+6=13
    [9, 7, 16], // 9+7=16
    [8, 6, 14], // 8+6=14
  ]

  bridgingPairs.forEach(([num1, num2, sum], index) => {
    const needed = 10 - num1
    const remaining = num2 - needed

    problems.push({
      id: `bridging-${index}`,
      problemText: `${num1} + ${num2} = ?`,
      problemType: 'scaffolded',
      num1,
      num2,
      operation: 'addition',
      correctAnswer: sum.toString(),
      scaffolding: {
        steps: [
          {
            stepNumber: 1,
            question: `How many do we need to make ${num1} into 10?`,
            correctAnswer: needed.toString(),
            hint: `10 - ${num1} = ?`,
            explanation: `Right! ${num1} + ${needed} = 10`,
          },
          {
            stepNumber: 2,
            question: `So break ${num2} into ${needed} and what?`,
            correctAnswer: remaining.toString(),
            hint: `${needed} + ? = ${num2}`,
            explanation: `Yes! ${needed} + ${remaining} = ${num2}`,
          },
          {
            stepNumber: 3,
            question: `Now add: 10 + ${remaining} = ?`,
            correctAnswer: sum.toString(),
            explanation: `Perfect! ${num1} + ${num2} = ${sum} ✅`,
          },
        ],
      },
      feedbackCorrect: `✅ Excellent! You used Bridging to solve ${num1} + ${num2} = ${sum}`,
      feedbackIncorrect: `Let's try the steps again for ${num1} + ${num2}`,
      strategy: `Make 10 first: ${num1}+${needed}=10, then 10+${remaining}=${sum}`,
    })
  })

  return problems
}

function generateDecomposingProblems(): LessonProblem[] {
  const problems: LessonProblem[] = []

  // Bridging problems perfect for ten frame visualization
  const bridgingPairs = [
    [7, 8, 15],
    [6, 9, 15],
    [8, 7, 15],
    [9, 6, 15],
    [8, 5, 13],
    [7, 6, 13],
    [9, 7, 16],
    [8, 9, 17],
  ]

  bridgingPairs.forEach(([num1, num2, sum], index) => {
    const needed = 10 - num1 // How many to complete first frame
    const remaining = num2 - needed // What's left in second frame

    problems.push({
      id: `decompose-${index}`,
      problemText: `${num1} + ${num2} = ?`,
      problemType: 'drag-drop',
      num1,
      num2,
      operation: 'addition',
      correctAnswer: sum.toString(),
      visualAid: {
        type: 'ten-frame',
        interactive: true,
      },
      feedbackCorrect: `✅ Perfect! You decomposed ${num2} into ${needed} and ${remaining} to make 10!`,
      feedbackIncorrect: `Try dragging ${needed} dots from the second frame to fill the first frame.`,
      strategy: `${num1} + ${num2} = ${num1} + (${needed} + ${remaining}) = 10 + ${remaining} = ${sum}`,
      hints: [
        `The first frame has ${num1} dots. How many more to make 10?`,
        `Drag ${needed} dots from the second frame`,
        `Now you have 10 + ${remaining} = ${sum}`,
      ],
    })
  })

  return problems
}

// ==================== LESSON REGISTRY ====================

export const STRATEGY_LESSONS: Record<string, StrategyLesson> = {
  'making-5': making5Lesson,
  'making-10': making10Lesson,
  'bridging-to-10': bridgingLesson,
  'decomposing-ten-frames': decomposingLesson,
}

export function getLessonById(lessonId: string): StrategyLesson | null {
  return STRATEGY_LESSONS[lessonId] || null
}

export function getAllLessons(): StrategyLesson[] {
  return Object.values(STRATEGY_LESSONS)
}

export function getNextRequiredLesson(
  sessionNumber: number,
  completedLessonIds: string[],
  currentSubLevel?: string, // ⭐ NEW: Check sub-level for better timing
): StrategyLesson | null {
  console.log('🔍 LESSON CHECK:', {
    sessionNumber,
    currentSubLevel,
    completedLessonIds,
  })

  const lessons = getAllLessons()

  for (const lesson of lessons) {
    console.log(`  Checking: ${lesson.id}`, {
      requiredAfter: lesson.requiredAfterSession,
      requiredSubLevel: lesson.requiredSubLevel,
      alreadyCompleted: completedLessonIds.includes(lesson.id),
      sessionMeetsReq: lesson.requiredAfterSession
        ? sessionNumber >= lesson.requiredAfterSession
        : 'N/A',
      subLevelMatches: lesson.requiredSubLevel
        ? currentSubLevel === lesson.requiredSubLevel
        : 'N/A',
    })

    // Skip if already completed
    if (completedLessonIds.includes(lesson.id)) {
      console.log(`    → Skipped (already completed)`)
      continue
    }

    // Check if prerequisites are met
    const prereqsMet = lesson.prerequisites.every((prereq) => completedLessonIds.includes(prereq))

    if (!prereqsMet) {
      console.log(`    → Skipped (prerequisites not met:`, lesson.prerequisites, ')')
      continue
    }

    // ⭐ PRIORITY 1: Check sub-level requirement (more specific)
    if (lesson.requiredSubLevel && currentSubLevel) {
      if (currentSubLevel === lesson.requiredSubLevel) {
        console.log(`    → ✅ REQUIRED! (sub-level match: ${currentSubLevel})`)
        return lesson
      }
      // If has sub-level requirement but doesn't match, skip
      console.log(
        `    → Skipped (waiting for sub-level: ${lesson.requiredSubLevel}, current: ${currentSubLevel})`,
      )
      continue
    }

    // ⭐ PRIORITY 2: Check session requirement (fallback)
    if (lesson.requiredAfterSession && sessionNumber >= lesson.requiredAfterSession) {
      console.log(`    → ✅ REQUIRED! (session ${sessionNumber} >= ${lesson.requiredAfterSession})`)
      return lesson
    }
  }

  console.log('  → No required lesson')
  return null
}
