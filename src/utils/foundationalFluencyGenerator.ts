/**
 * Foundational Fluency Generator
 * 
 * Research-backed modules for building math fluency:
 * - Subitizing (Jordan et al., 2006; Clements & Sarama, 2007)
 * - Making 5/10 (Fuson & Briars, 1990; Gersten et al., 2009)
 * - Symbolic Fluency (Fact families, inverse operations)
 * 
 * Follows CRA (Concrete → Representational → Abstract) progression
 */

export type VisualType = 'dice' | 'dots' | 'ten_frame' | 'five_frame' | 'symbolic'
export type ModuleType = 'subitizing' | 'making5' | 'making10' | 'symbolic'
export type OperationType = 'addition' | 'subtraction'
export type SubskillType = 
  | 'subitizing'
  | 'making5'
  | 'making10'
  | 'doubles'
  | 'near_doubles'
  | 'fact_family'
  | 'basic_addition'
  | 'basic_subtraction'

export interface FluencyProblem {
  id: string
  module: ModuleType
  visualType: VisualType
  numberShown: number
  correctAnswer: number
  questionText: string
  subskill: SubskillType
  operation?: OperationType
  // For symbolic problems
  firstNumber?: number
  secondNumber?: number
  problemText?: string
}

export interface ModuleConfig {
  name: string
  description: string
  type: ModuleType
  visualTypes: VisualType[]
  practiceProblems: number
  assessmentProblems: number
  timeLimit?: number // in seconds, optional for assessment
  showHints: boolean // only in practice mode
  focusAreas: string[]
}

/**
 * Module Configurations
 */
export const FLUENCY_MODULES: Record<string, ModuleConfig> = {
  subitizing: {
    name: 'Subitizing',
    description: 'Recognize quantities instantly without counting',
    type: 'subitizing',
    visualTypes: ['dice', 'dots', 'ten_frame'],
    practiceProblems: 20,
    assessmentProblems: 15,
    showHints: true,
    focusAreas: [
      'Instant quantity recognition',
      'Visual patterns',
      'Number sense foundation'
    ]
  },
  making5: {
    name: 'Making 5',
    description: 'Mental strategies to complete to 5',
    type: 'making5',
    visualTypes: ['five_frame', 'dots', 'dice'],
    practiceProblems: 15,
    assessmentProblems: 12,
    showHints: true,
    focusAreas: [
      'Part-whole relationships',
      'Composing numbers to 5',
      'Mental math strategies'
    ]
  },
  making10: {
    name: 'Making 10',
    description: 'Mental strategies to complete to 10',
    type: 'making10',
    visualTypes: ['dots', 'ten_frame', 'dice'],
    practiceProblems: 20,
    assessmentProblems: 15,
    showHints: true,
    focusAreas: [
      'Part-whole relationships',
      'Composing numbers to 10',
      'Foundation for place value'
    ]
  },
  symbolic: {
    name: 'Symbolic Fluency',
    description: 'Addition & subtraction with numbers (includes Make 10)',
    type: 'symbolic',
    visualTypes: ['symbolic'],
    practiceProblems: 30,
    assessmentProblems: 25,
    showHints: true,
    focusAreas: [
      'Basic addition facts',
      'Basic subtraction facts',
      'Make 10 strategies',
      'Fact families',
      'Inverse relationships'
    ]
  }
}

/**
 * Generate a dice pattern (standard 6-sided die patterns, extended for 7-10)
 * Using 3x3 grid positions for dice-like appearance
 */
function generateDicePattern(number: number): Array<{ x: number; y: number }> {
  // Map positions in a 3x3 grid (like standard dice)
  // Grid positions: TL TC TR
  //                ML MC MR  
  //                BL BC BR
  const positions = [
    { x: 25, y: 25 },  // 0: Top-Left
    { x: 50, y: 25 },  // 1: Top-Center
    { x: 75, y: 25 },  // 2: Top-Right
    { x: 25, y: 50 },  // 3: Middle-Left
    { x: 50, y: 50 },  // 4: Middle-Center
    { x: 75, y: 50 },  // 5: Middle-Right
    { x: 25, y: 75 },  // 6: Bottom-Left
    { x: 50, y: 75 },  // 7: Bottom-Center
    { x: 75, y: 75 }   // 8: Bottom-Right
  ]
  
  // Standard dice patterns (indices from positions array)
  const dicePatterns: Record<number, number[]> = {
    1: [4],                    // Center
    2: [0, 8],                 // Diagonal corners
    3: [0, 4, 8],              // Diagonal line
    4: [0, 2, 6, 8],           // Four corners
    5: [0, 2, 4, 6, 8],        // Four corners + center
    6: [0, 2, 3, 5, 6, 8],     // Two columns
    7: [0, 2, 3, 4, 5, 6, 8],  // Two columns + center
    8: [0, 1, 2, 3, 5, 6, 7, 8], // All except center
    9: [0, 1, 2, 3, 4, 5, 6, 7, 8], // All positions
    10: [0, 1, 2, 3, 4, 5, 6, 7, 8] // All (same as 9, we'll show 10 differently)
  }
  
  const pattern = dicePatterns[number] || []
  return pattern.map(idx => positions[idx])
}

/**
 * Generate dots in a two-column pattern (like the HTML example)
 * Flows LEFT-TO-RIGHT, then wraps to next row (like CSS grid)
 * Example: 2 = ● ●
 *          3 = ● ●
 *              ●
 *          4 = ● ●
 *              ● ●
 */
function generateRandomDots(number: number): Array<{ x: number; y: number }> {
  const dots: Array<{ x: number; y: number }> = []
  
  // Two-column layout with 2 columns
  const cols = 2
  const startX = 35       // Start position for left column
  const startY = 15       // Start position for first dot
  const columnGap = 30    // Horizontal gap between columns
  const rowGap = 17       // Vertical gap between rows
  
  for (let i = 0; i < number; i++) {
    const row = Math.floor(i / cols)  // Which row (0, 1, 2, 3, 4)
    const col = i % cols               // Which column (0 or 1)
    
    const x = startX + (col * columnGap)
    const y = startY + (row * rowGap)
    
    dots.push({ x, y })
  }
  
  return dots
}

/**
 * Generate ten frame pattern (2 rows of 5 cells, like the HTML example)
 * Fills left-to-right, top-to-bottom
 */
function generateTenFrame(number: number): Array<{ x: number; y: number }> {
  const dots: Array<{ x: number; y: number }> = []
  
  // Ten frame: 5 columns x 2 rows
  // Cell structure: each cell is 18 units wide, 30 units tall
  // Cells start at x=1, y=20 (top row) and y=50 (bottom row)
  const cols = 5
  const cellWidth = 18
  const cellHeight = 30
  const startX = 1        // First cell starts here
  const topRowY = 20      // Top row starts here
  const bottomRowY = 50   // Bottom row starts here
  
  for (let i = 0; i < number; i++) {
    const row = Math.floor(i / cols)  // 0 for top row, 1 for bottom row
    const col = i % cols               // 0-4 for position in row
    
    // Center of each cell
    dots.push({
      x: startX + (col * cellWidth) + (cellWidth / 2),  // Center X of cell
      y: (row === 0 ? topRowY : bottomRowY) + (cellHeight / 2)  // Center Y of cell
    })
  }
  
  return dots
}

/**
 * Generate five frame pattern (1 row of 5 cells)
 * Used for Making 5 module
 */
function generateFiveFrame(number: number): Array<{ x: number; y: number }> {
  const dots: Array<{ x: number; y: number }> = []
  
  // Five frame: 5 columns x 1 row
  const startX = 10      // Starting X position
  const startY = 50      // Centered vertically
  const cellWidth = 16   // Space between dots horizontally
  
  for (let i = 0; i < number; i++) {
    dots.push({
      x: startX + (i * cellWidth),
      y: startY
    })
  }
  
  return dots
}

/**
 * Get visual data for a number
 */
export function getVisualData(number: number, visualType: VisualType): Array<{ x: number; y: number }> {
  switch (visualType) {
    case 'dice':
      return generateDicePattern(number)
    case 'dots':
      return generateRandomDots(number)
    case 'ten_frame':
      return generateTenFrame(number)
    case 'five_frame':
      return generateFiveFrame(number)
    default:
      return []
  }
}

/**
 * Generate Subitizing problems
 */
function generateSubitizingProblems(count: number): FluencyProblem[] {
  const problems: FluencyProblem[] = []
  const visualTypes: VisualType[] = ['dice', 'dots', 'ten_frame']
  
  for (let i = 0; i < count; i++) {
    const numberShown = Math.floor(Math.random() * 10) + 1 // 1-10
    const visualType = visualTypes[Math.floor(Math.random() * visualTypes.length)]
    
    problems.push({
      id: `subitizing-${i}`,
      module: 'subitizing',
      visualType,
      numberShown,
      correctAnswer: numberShown,
      questionText: 'How many do you see?',
      subskill: 'subitizing'
    })
  }
  
  return problems
}

/**
 * Generate Making 5 problems
 */
function generateMaking5Problems(count: number): FluencyProblem[] {
  const problems: FluencyProblem[] = []
  const visualTypes: VisualType[] = ['dots', 'ten_frame', 'dice']
  
  for (let i = 0; i < count; i++) {
    const numberShown = Math.floor(Math.random() * 4) + 1 // 1-4
    const visualType = visualTypes[Math.floor(Math.random() * visualTypes.length)]
    
    problems.push({
      id: `making5-${i}`,
      module: 'making5',
      visualType,
      numberShown,
      correctAnswer: 5 - numberShown,
      questionText: 'How many more to make 5?',
      subskill: 'making5'
    })
  }
  
  return problems
}

/**
 * Generate Making 10 problems
 */
function generateMaking10Problems(count: number): FluencyProblem[] {
  const problems: FluencyProblem[] = []
  const visualTypes: VisualType[] = ['dots', 'ten_frame', 'dice']
  
  for (let i = 0; i < count; i++) {
    const numberShown = Math.floor(Math.random() * 9) + 1 // 1-9
    const visualType = visualTypes[Math.floor(Math.random() * visualTypes.length)]
    
    problems.push({
      id: `making10-${i}`,
      module: 'making10',
      visualType,
      numberShown,
      correctAnswer: 10 - numberShown,
      questionText: 'How many more to make 10?',
      subskill: 'making10'
    })
  }
  
  return problems
}

/**
 * Generate Symbolic problems (Addition & Subtraction)
 */
function generateSymbolicProblems(count: number): FluencyProblem[] {
  const problems: FluencyProblem[] = []
  
  for (let i = 0; i < count; i++) {
    const operation: OperationType = Math.random() < 0.5 ? 'addition' : 'subtraction'
    
    if (operation === 'addition') {
      // 30% chance of Make 10 problem
      if (Math.random() < 0.3) {
        const firstNumber = Math.floor(Math.random() * 9) + 1 // 1-9
        const correctAnswer = 10 - firstNumber
        
        problems.push({
          id: `symbolic-${i}`,
          module: 'symbolic',
          visualType: 'symbolic',
          numberShown: firstNumber,
          correctAnswer,
          questionText: `${firstNumber} + ___ = 10`,
          problemText: `${firstNumber} + ___ = 10`,
          subskill: 'making10',
          operation: 'addition',
          firstNumber,
          secondNumber: correctAnswer
        })
      } else {
        // Regular addition
        const firstNumber = Math.floor(Math.random() * 11) // 0-10
        const secondNumber = Math.floor(Math.random() * (20 - firstNumber + 1)) // ensure sum ≤ 20
        const correctAnswer = firstNumber + secondNumber
        
        // Determine subskill
        let subskill: SubskillType = 'basic_addition'
        if (firstNumber === secondNumber) {
          subskill = 'doubles'
        } else if (Math.abs(firstNumber - secondNumber) === 1) {
          subskill = 'near_doubles'
        }
        
        problems.push({
          id: `symbolic-${i}`,
          module: 'symbolic',
          visualType: 'symbolic',
          numberShown: 0,
          correctAnswer,
          questionText: `${firstNumber} + ${secondNumber}`,
          problemText: `${firstNumber} + ${secondNumber}`,
          subskill,
          operation: 'addition',
          firstNumber,
          secondNumber
        })
      }
    } else {
      // Subtraction (fact family strategy)
      const total = Math.floor(Math.random() * 16) + 5 // 5-20
      const subtrahend = Math.floor(Math.random() * (total - 1)) + 1 // 1 to (total-1)
      const correctAnswer = total - subtrahend
      
      problems.push({
        id: `symbolic-${i}`,
        module: 'symbolic',
        visualType: 'symbolic',
        numberShown: 0,
        correctAnswer,
        questionText: `${total} - ${subtrahend}`,
        problemText: `${total} - ${subtrahend}`,
        subskill: 'fact_family',
        operation: 'subtraction',
        firstNumber: total,
        secondNumber: subtrahend
      })
    }
  }
  
  return problems
}

/**
 * Generate problems for a specific module
 */
export function generateModuleProblems(moduleKey: string, isPractice: boolean): FluencyProblem[] {
  const config = FLUENCY_MODULES[moduleKey]
  if (!config) return []
  
  const count = isPractice ? config.practiceProblems : config.assessmentProblems
  
  switch (config.type) {
    case 'subitizing':
      return generateSubitizingProblems(count)
    case 'making5':
      return generateMaking5Problems(count)
    case 'making10':
      return generateMaking10Problems(count)
    case 'symbolic':
      return generateSymbolicProblems(count)
    default:
      return []
  }
}

/**
 * Shuffle array
 */
export function shuffleProblems<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

