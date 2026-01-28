/**
 * Word Problem Frames - Story structures for solving word problems
 * Based on CGI (Cognitively Guided Instruction) problem types
 */

export interface WordProblemFrame {
  id: string
  name: string
  description: string
  rule: string // Mathematical structure (e.g., "part + part = total")
  keywords: string[] // Words that might indicate this frame (NOT for teaching, for AI detection only)
  example: {
    problem: string
    equation: string
    answer: string
  }
  studentGuide: string // Static text guide for students
}

export const WORD_PROBLEM_FRAMES: Record<string, WordProblemFrame> = {
  combine: {
    id: 'combine',
    name: 'COMBINE (Add)',
    description: 'Two or more groups are put together to find the total',
    rule: 'part + part = total',
    keywords: ['in all', 'total', 'altogether', 'both', 'combined'],
    example: {
      problem: 'There are 7 red balloons and 5 blue balloons. How many balloons are there in all?',
      equation: '7 + 5 = 12',
      answer: 'There are 12 balloons.',
    },
    studentGuide: `
📋 COMBINE Frame (Adding groups together)

🎯 When to use: When the story puts groups together to find a total.

📝 Steps:
1. Find the QUESTION (what are we finding?)
2. Find the GIVENS (numbers + units in the story)
3. Identify the FRAME: Are we putting groups together?
4. Write the MATH SENTENCE: part + part = total
5. Write the ANSWER with units

💡 Example:
Problem: There are 7 red balloons and 5 blue balloons. How many balloons are there in all?
Math: 7 + 5 = 12
Answer: There are 12 balloons.

⚠️ NOTE: The question asks "in all" or "total" — we're COMBINING!
    `.trim(),
  },

  change: {
    id: 'change',
    name: 'CHANGE (Add or Subtract)',
    description: 'Something starts with an amount, then changes (increase or decrease)',
    rule: 'start ± change = final',
    keywords: [
      'gave away',
      'lost',
      'spent',
      'received',
      'got',
      'found',
      'earned',
      'bought',
      'sold',
      'now',
      'left',
    ],
    example: {
      problem: 'Mia had 14 pencils. She gave away 6 pencils. How many pencils does Mia have now?',
      equation: '14 − 6 = 8',
      answer: 'Mia has 8 pencils now.',
    },
    studentGuide: `
📋 CHANGE Frame (Start → Change → End)

🎯 When to use: When the story starts with an amount, something happens, and we find what's left or what's new.

📝 Steps:
1. Find the QUESTION (what are we finding?)
2. Find the GIVENS (starting amount + change amount)
3. Identify the FRAME: Did something change?
4. Write the MATH SENTENCE: start ± change = final
   - Use + if the amount INCREASED (got more)
   - Use − if the amount DECREASED (gave away, lost)
5. Write the ANSWER with units

💡 Example:
Problem: Mia had 14 pencils. She gave away 6 pencils. How many pencils does Mia have now?
Math: 14 − 6 = 8
Answer: Mia has 8 pencils now.

⚠️ NOTE: The word "now" tells us we're finding the FINAL amount after a change!
    `.trim(),
  },

  compare: {
    id: 'compare',
    name: 'COMPARE (Subtract)',
    description: 'Two amounts are compared to find the difference (how many more/less)',
    rule: 'bigger − smaller = difference',
    keywords: [
      'more than',
      'less than',
      'fewer than',
      'difference',
      'how many more',
      'how many fewer',
      'taller',
      'shorter',
      'longer',
    ],
    example: {
      problem:
        'Leo has 12 marbles. Mia has 7 marbles. How many more marbles does Leo have than Mia?',
      equation: '12 − 7 = 5',
      answer: 'Leo has 5 more marbles than Mia.',
    },
    studentGuide: `
📋 COMPARE Frame (Finding the difference)

🎯 When to use: When the story compares two amounts and asks "how many more?" or "how many fewer?"

📝 Steps:
1. Find the QUESTION (what are we finding?)
2. Find the GIVENS (the two amounts being compared)
3. Identify the FRAME: Are we comparing two things?
4. Write the MATH SENTENCE: bigger − smaller = difference
   - ALWAYS subtract the smaller from the bigger
5. Write the ANSWER with units

💡 Example:
Problem: Leo has 12 marbles. Mia has 7 marbles. How many more marbles does Leo have than Mia?
Math: 12 − 7 = 5
Answer: Leo has 5 more marbles than Mia.

⚠️ NOTE: "How many more" means we're COMPARING — not combining or changing!
    `.trim(),
  },

  'missing-part': {
    id: 'missing-part',
    name: 'MISSING PART (Subtract)',
    description: 'We know the total and one part, need to find the other part',
    rule: 'total − known part = missing part',
    keywords: ['some', 'rest', 'other', 'remaining'],
    example: {
      problem: 'There are 15 students in line. 9 students are boys. How many students are girls?',
      equation: '15 − 9 = 6',
      answer: 'There are 6 girls.',
    },
    studentGuide: `
📋 MISSING PART Frame (Part-Part-Whole)

🎯 When to use: When we know the TOTAL and one PART, and need to find the other PART.

📝 Steps:
1. Find the QUESTION (what are we finding?)
2. Find the GIVENS (total + one part)
3. Identify the FRAME: Do we know the total and need to find a missing part?
4. Write the MATH SENTENCE: total − known part = missing part
5. Write the ANSWER with units

💡 Example:
Problem: There are 15 students in line. 9 students are boys. How many students are girls?
Math: 15 − 9 = 6
Answer: There are 6 girls.

⚠️ NOTE: We're not "taking away" — we're finding a MISSING PART of the total!
    `.trim(),
  },

  'equal-groups': {
    id: 'equal-groups',
    name: 'EQUAL GROUPS (Multiply/Divide)',
    description: 'Multiple groups of the same size (multiplication or division)',
    rule: 'groups × size = total  OR  total ÷ groups = size',
    keywords: ['each', 'per', 'every', 'groups of', 'times', 'shared equally', 'split'],
    example: {
      problem: 'There are 4 bags with 6 apples in each bag. How many apples are there in all?',
      equation: '4 × 6 = 24',
      answer: 'There are 24 apples.',
    },
    studentGuide: `
📋 EQUAL GROUPS Frame (Multiply or Divide)

🎯 When to use: When items are in equal groups or shared equally.

📝 Steps:
1. Find the QUESTION (what are we finding?)
2. Find the GIVENS (number of groups + size of each group, OR total)
3. Identify the FRAME: Are there equal groups?
4. Write the MATH SENTENCE:
   - If finding TOTAL: groups × size = total
   - If finding SIZE: total ÷ groups = size
   - If finding NUMBER OF GROUPS: total ÷ size = groups
5. Write the ANSWER with units

💡 Example (Multiplication):
Problem: There are 4 bags with 6 apples in each bag. How many apples are there in all?
Math: 4 × 6 = 24
Answer: There are 24 apples.

💡 Example (Division):
Problem: 24 apples are shared equally among 4 bags. How many apples in each bag?
Math: 24 ÷ 4 = 6
Answer: Each bag has 6 apples.

⚠️ NOTE: Look for "each" or "equally" — that's the EQUAL GROUPS clue!
    `.trim(),
  },

  'money-one-step': {
    id: 'money-one-step',
    name: 'MONEY (One-Step)',
    description: 'Money problems requiring one operation (add, subtract, multiply, or divide)',
    rule: 'Use money amounts with one operation',
    keywords: ['dollar', 'cents', 'cost', 'price', 'spent', 'paid', 'change', 'total cost'],
    example: {
      problem: 'Emma bought a book for $12 and a pen for $5. How much did she spend in all?',
      equation: '$12 + $5 = $17',
      answer: 'Emma spent $17.',
    },
    studentGuide: `
📋 MONEY (One-Step) Frame

🎯 When to use: When the problem involves money and requires one operation.

📝 Steps:
1. Find the QUESTION (what are we finding?)
2. Find the GIVENS (money amounts with dollar signs)
3. Identify the FRAME: What operation do I need? (add, subtract, multiply, or divide)
4. Write the MATH SENTENCE with dollar signs
5. Write the ANSWER with dollar sign and units

💡 Example:
Problem: Emma bought a book for $12 and a pen for $5. How much did she spend in all?
Math: $12 + $5 = $17
Answer: Emma spent $17.

⚠️ NOTE: Always include the dollar sign ($) in your answer!
    `.trim(),
  },

  'money-two-step': {
    id: 'money-two-step',
    name: 'MONEY (Two-Step)',
    description: 'Money problems requiring two operations to solve',
    rule: 'Solve in two steps, using money amounts',
    keywords: ['then', 'after', 'first', 'next', 'saved', 'needs', 'more'],
    example: {
      problem:
        'Jake wants to buy a video game that costs $45. He has $20 saved and earned $15 more. How much more money does he need?',
      equation: '$20 + $15 = $35, then $45 − $35 = $10',
      answer: 'Jake needs $10 more.',
    },
    studentGuide: `
📋 MONEY (Two-Step) Frame

🎯 When to use: When the problem involves money and requires two operations.

📝 Steps:
1. Find the QUESTION (what are we finding at the end?)
2. Find ALL the GIVENS (all money amounts)
3. PLAN: What do I need to find FIRST?
4. Write STEP 1 math sentence (with dollar signs)
5. Write STEP 2 math sentence (with dollar signs)
6. Write the ANSWER with dollar sign

💡 Example:
Problem: Jake wants to buy a video game that costs $45. He has $20 saved and earned $15 more. How much more money does he need?

Step 1 (COMBINE): How much does he have?
  Math: $20 + $15 = $35

Step 2 (COMPARE): How much more does he need?
  Math: $45 − $35 = $10

Answer: Jake needs $10 more.

⚠️ NOTE: Always include dollar signs in each step and the final answer!
    `.trim(),
  },

  'two-step': {
    id: 'two-step',
    name: 'TWO-STEP',
    description: 'Problems requiring two operations to solve (stepping up in complexity)',
    rule: 'Solve in two steps, using frames for each step',
    keywords: ['then', 'after that', 'next', 'first', 'second step'],
    example: {
      problem:
        'A store had 50 apples. They sold 15 apples in the morning and 12 apples in the afternoon. How many apples are left?',
      equation: '15 + 12 = 27, then 50 − 27 = 23',
      answer: 'There are 23 apples left.',
    },
    studentGuide: `
📋 TWO-STEP Frame (Stepping Up)

🎯 When to use: When you need to solve the problem in two steps.

📝 Steps:
1. Find the QUESTION (what are we finding at the end?)
2. Find ALL the GIVENS (all numbers + units)
3. PLAN: What do I need to find FIRST before I can answer the question?
4. Write STEP 1 math sentence (use a frame!)
5. Write STEP 2 math sentence (use another frame!)
6. Write the ANSWER with units

💡 Example:
Problem: A store had 50 apples. They sold 15 apples in the morning and 12 apples in the afternoon. How many apples are left?

Step 1 (COMBINE): How many apples were sold in all?
  Math: 15 + 12 = 27

Step 2 (CHANGE): How many apples are left?
  Math: 50 − 27 = 23

Answer: There are 23 apples left.

⚠️ NOTE: Two-step problems are just TWO smaller problems combined. Solve one step at a time!
    `.trim(),
  },

  'multi-step': {
    id: 'multi-step',
    name: 'MULTI-STEP',
    description: 'Requires two or more operations to solve',
    rule: 'Solve in steps, using frames for each step',
    keywords: ['then', 'after that', 'next', 'finally'],
    example: {
      problem:
        'Rosa wants to buy a tablet that costs $100. She has $30 saved and received $20 for her birthday. How much more money does she need?',
      equation: '$30 + $20 = $50, then $100 − $50 = $50',
      answer: 'Rosa needs $50 more.',
    },
    studentGuide: `
📋 MULTI-STEP Frame (Combine frames)

🎯 When to use: When you need to solve the problem in multiple steps.

📝 Steps:
1. Find the QUESTION (what are we finding at the end?)
2. Find ALL the GIVENS (all numbers + units)
3. PLAN: What do I need to find FIRST before I can answer the question?
4. Write STEP 1 math sentence (use a frame!)
5. Write STEP 2 math sentence (use another frame!)
6. Write the ANSWER with units

💡 Example:
Problem: Rosa wants to buy a tablet that costs $100. She has $30 saved and received $20 for her birthday. How much more money does she need?

Step 1 (COMBINE): How much does she have?
  Math: $30 + $20 = $50

Step 2 (COMPARE): How much more does she need?
  Math: $100 − $50 = $50

Answer: Rosa needs $50 more.

⚠️ NOTE: Multi-step problems are just SMALLER problems combined. Solve one step at a time!
    `.trim(),
  },

  other: {
    id: 'other',
    name: 'OTHER',
    description: 'Problem type does not fit standard frames',
    rule: 'Break down the problem step by step',
    keywords: [],
    example: {
      problem: 'What is 25% of 80?',
      equation: '0.25 × 80 = 20',
      answer: '20',
    },
    studentGuide: `
📋 OTHER (General problem-solving)

🎯 When to use: When the problem doesn't fit a standard story frame.

📝 Steps:
1. Read carefully and identify what you're finding
2. Write down what you know
3. Think: What operation or formula do I need?
4. Show your work step by step
5. Check: Does my answer make sense?
    `.trim(),
  },
}

/**
 * Detect the frame type from a problem description or goal text
 */
export function detectFrameType(text: string): string {
  const lowerText = text.toLowerCase()

  // Check each frame's keywords
  for (const [frameId, frame] of Object.entries(WORD_PROBLEM_FRAMES)) {
    if (frameId === 'other') continue // Skip "other" in detection

    const matchCount = frame.keywords.filter((keyword) => lowerText.includes(keyword)).length

    if (matchCount > 0) {
      return frameId
    }
  }

  // Check for multi-step indicators
  const multiStepIndicators = ['two-step', 'two step', 'multi-step', 'multi step', 'multiple steps']
  if (multiStepIndicators.some((indicator) => lowerText.includes(indicator))) {
    return 'multi-step'
  }

  return 'other'
}

/**
 * Get the student guide for a specific frame type
 */
export function getFrameGuide(frameType: string): string {
  const frame = WORD_PROBLEM_FRAMES[frameType]
  return frame ? frame.studentGuide : WORD_PROBLEM_FRAMES.other.studentGuide
}

/**
 * Get all frame types (for UI dropdowns)
 */
export function getAllFrameTypes(): Array<{ id: string; name: string; description: string }> {
  return Object.values(WORD_PROBLEM_FRAMES).map((frame) => ({
    id: frame.id,
    name: frame.name,
    description: frame.description,
  }))
}
