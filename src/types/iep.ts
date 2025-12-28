// IEP Database Types
export interface Student {
  id: string // Document ID in Firestore
  email: string // Required for login
  seisId: string
  districtId: string
  firstName: string
  lastName: string
  birthdate: string
  grade: string
  schoolOfAttendance: string
  districtOfService: string
  caseManager: string
  serviceProviders: string[] // Array of service provider names
  iepDate: string
  eligibilityStatus: string
  goalIds: string[] // References to goal documents
  createdAt: any
  updatedAt: any
}

export interface Goal {
  id: string // Document ID in Firestore
  studentUid?: string // DEPRECATED: Use assignedStudents instead (kept for backward compatibility)
  assignedStudents: string[] // Array of student UIDs assigned to this goal
  goalTitle: string // Title/name of the goal
  areaOfNeed: string // Area of need (e.g., "Math Computation", "Reading Comprehension")
  baseline: string // Baseline performance description
  goalText: string // The actual goal statement
  iepDate?: string // DEPRECATED: IEP dates are now tracked per student individually
  assignedAssessments: string[] // Array of assessment IDs connected to this goal
  assessmentMethod?: 'app' | 'paper' | 'hybrid' // How this goal should be assessed (optional)

  // Optional fields for enhanced functionality
  standard?: string // Related academic standard
  gradeLevel?: number // Grade level for the goal
  startDate?: string // Goal start date
  personResponsible?: string // Person responsible for the goal
  purposeOfGoal?: string // Purpose or rationale
  objectives?: Objective[] // Sub-objectives
  progressReports?: ProgressReport[] // Progress tracking
  currentProgress?: string // Current progress status

  // Template connections - NEW: Explicit template assignment
  preferredTemplateIds?: string[] // Array of template IDs to use for this goal (checked first before fuzzy matching)

  // Status tracking
  isActive: boolean // Whether goal is currently active
  isMet: boolean // Whether goal has been met
  isArchived: boolean // Whether goal has been archived

  // Metadata
  createdBy: string // Teacher/admin UID who created the goal
  createdAt: any // Timestamp
  updatedAt: any // Timestamp
}

export interface Objective {
  id: string
  objectiveText: string
  isMet: boolean
  dateMet?: string
}

export interface ProgressReport {
  id: string
  reportDate: string
  summary: string
  comments: string
  progress: 'On Track' | 'Limited Progress' | 'No Progress Made' | 'N/A'
  reportedBy: string
}

export interface Assessment {
  id: string
  goalId: string
  createdBy: string // Teacher UID who created the assessment (now required)
  title: string
  description: string
  standard?: string // Optional - can be set per question instead
  gradeLevel: number
  category: 'HW' | 'Assign' | 'ESA' | 'SA' | 'PA' | 'Other'
  academicPeriod?: string // Quarter restriction: "q1", "q2", "q3", "q4", "all" (year-long), or undefined (no restriction)
  questions: AssessmentQuestion[]
  totalPoints: number
  timeLimit?: number // in minutes
  instructions: string
  accommodations: string[]
  // File upload options
  allowFileUpload?: boolean // Whether students can upload files/photos
  requireFileUpload?: boolean // Whether file upload is mandatory
  fileUploadInstructions?: string // Instructions for file upload
  maxFileSize?: number // Max file size in MB
  allowedFileTypes?: string[] // Allowed file extensions
  photoOrientation?: 'portrait' | 'landscape' // Default photo orientation

  // Multi-page photo capture options
  requireMultiplePages?: boolean // Whether multiple pages are required
  requiredPageCount?: number // Number of pages required (1-10)
  pageLabels?: string[] // Custom labels for each page (e.g., ["Problem 1", "Problem 2"])
  allowExtraPages?: boolean // Whether students can add extra pages beyond required

  // Retake options
  allowRetakes?: boolean // Whether students can retake this assessment
  maxRetakes?: number // Maximum number of retakes allowed (0 = unlimited)
  retakeMode?: 'separate' | 'combined' // How to handle multiple attempts
  retakeInstructions?: string // Instructions for retakes

  // Assignment dates
  assignDate?: any // When the assessment is assigned to students (Timestamp)
  dueDate?: any // When the assessment is due (Timestamp)

  createdAt: any
  updatedAt: any
}

export interface FractionAnswer {
  numerator: number
  denominator: number
}

export interface AssessmentQuestion {
  id: string
  questionText: string
  questionType:
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
    | 'algebra-tiles'
  standard?: string // Standards for this specific question (can be multiple, separated by ';')
  standards?: string[] // Array of individual standards (parsed from standard field)
  options?: string[] // For multiple choice
  correctAnswer: string | string[]
  acceptableAnswers?: string[] // Alternative acceptable answers for short-answer
  acceptEquivalentFractions?: boolean // Accept all equivalent fractions (e.g., 1/2 = 2/4 = 3/6)
  correctFractionAnswers?: (FractionAnswer | string)[] // Support multiple equivalent fraction answers
  // Answer prefix/suffix (for standardizing answers)
  answerPrefix?: string // Text to show before answer (e.g., "x=" for "x=10")
  answerSuffix?: string // Text to show after answer (e.g., "apples" for "4 apples")
  // For matching questions
  matchingPairs?: { left: string; right: string }[]
  leftItems?: string[] // Items to match from
  rightItems?: string[] // Items to match to
  correctMatches?: { [key: string]: string } // Maps left item to right item
  // For rank-order questions
  itemsToRank?: string[] // Items that need to be put in order
  correctOrder?: string[] // The correct order of items
  orderType?: 'ascending' | 'descending' | 'custom' // Type of ordering
  // For checkbox questions (multiple correct answers)
  correctAnswers?: string[] // Array of correct option indices or values
  // For horizontal ordering questions
  orderingItems?: string[] // Items to be ordered horizontally (2-8 items)
  correctHorizontalOrder?: string[] // The correct left-to-right order
  orderDirection?: 'ascending' | 'descending' | 'manual' // Whether to order from least to greatest, greatest to least, or manually set
  points: number
  explanation?: string
  hints?: string[]
  requiresPhoto?: boolean // Whether student must upload a photo of their work
  // For fill-blank questions
  blankFormat?: string // Format string with ___ as placeholder (e.g., "___ minutes" or "Answer: ___ dollars")
  blankPosition?: 'before' | 'after' | 'inline' // Position of blank relative to unit/text
}

export interface AssessmentResult {
  id: string
  assessmentId: string
  studentUid: string // Single identifier - Firebase Auth UID only
  goalId: string
  responses: AssessmentResponse[]
  score: number
  totalPoints: number
  percentage: number
  timeSpent: number // in minutes
  completedAt: any
  gradedBy: string
  feedback: string
  accommodationsUsed: string[]

  // Retake tracking
  attemptNumber?: number // Which attempt this is (1, 2, 3, etc.)
  isRetake?: boolean // Whether this is a retake
  previousAttempts?: AssessmentAttempt[] // For combined mode - stores all attempts

  // File uploads
  uploadedFiles?: UploadedFile[]

  // Migration tracking
  migratedAt?: any
  migratedBy?: string
  migrationReason?: string
}

export interface AssessmentAttempt {
  attemptNumber: number
  responses: AssessmentResponse[]
  score: number
  percentage: number
  timeSpent: number
  completedAt: any
  uploadedFiles?: UploadedFile[]
}

export interface AssessmentResponse {
  questionId: string
  studentAnswer: string | string[]
  isCorrect: boolean
  pointsEarned: number
  timeSpent?: number
  manuallyAdjusted?: boolean
  adjustedBy?: string
  adjustedAt?: Date
  adjustmentReason?: string
  regraded?: boolean
  regradedAt?: Date
  regradedBy?: string

  // Cached standard for performance (synced from question)
  cachedStandard?: string // The standard this question covers (e.g., "CUSTOM:7Q1.ESA-4")
  standardSyncedAt?: any // Timestamp when this was last synced from question
}

export interface UploadedFile {
  id: string
  fileName: string
  originalName: string
  fileSize: number // in bytes
  fileType: string // MIME type
  uploadUrl: string // Firebase Storage URL
  thumbnailUrl?: string // For images
  uploadedAt: any // timestamp
  questionId?: string // If file is for specific question
}

// NEW: Junction table for assessment assignments
export interface AssessmentAssignment {
  id: string // Auto-generated document ID
  assessmentId: string // Reference to assessment
  studentUid: string // Reference to student (Firebase Auth UID)
  assignedBy: string // Teacher UID who assigned
  assignedAt: any // When assigned (Timestamp)
  dueDate?: any // Optional due date (Timestamp)
  status: 'assigned' | 'started' | 'completed' | 'overdue'
  priority?: 'low' | 'medium' | 'high'
  notes?: string // Assignment-specific notes
  academicPeriod?: string // Quarter/period (e.g., "q1", "q2") - auto-detected or manually set

  // Completion tracking
  startedAt?: any // When student started (Timestamp)
  completedAt?: any // When completed (Timestamp)

  // Settings overrides for this specific assignment
  allowRetakes?: boolean // Override assessment setting
  maxRetakes?: number // Override assessment setting
  timeLimit?: number // Override time limit for this student
  accommodations?: string[] // Student-specific accommodations

  // Metadata
  createdAt: any // Timestamp
  updatedAt: any // Timestamp
}

// Math-specific goal categories based on standards
export enum MathGoalType {
  ALGEBRAIC_EXPRESSIONS = 'algebraic-expressions',
  EQUATIONS_INEQUALITIES = 'equations-inequalities',
  RATIONAL_NUMBERS = 'rational-numbers',
  RATIOS_PROPORTIONS = 'ratios-proportions',
  GEOMETRY = 'geometry',
  STATISTICS_PROBABILITY = 'statistics-probability',
  WORD_PROBLEMS = 'word-problems',
  NUMBER_OPERATIONS = 'number-operations',
  FRACTIONS_DECIMALS = 'fractions-decimals',
}

// Standard grade level mappings
export const STANDARD_GRADE_MAPPING: Record<string, number> = {
  '5.NF.1': 5,
  '5.NBT.6': 5,
  '5.NBT.7': 5,
  '6.NS.1': 6,
  '6.NS.3': 6,
  '6.NS.5': 6,
  '6.NS.7': 6,
  '6.EE.2a': 6,
  '6.EE.6': 6,
  '6.EE.7': 6,
  '6.G.1': 6,
  '7.NS.A.1': 7,
  '7.NS.3': 7,
  '7.EE.4a': 7,
  '7.EE.B.4': 7,
}

export function extractGradeFromStandard(standard: string): number {
  // Extract grade level from standard notation
  const match = standard.match(/^(\d+)\./)
  if (match) {
    return parseInt(match[1])
  }

  // Check specific mappings
  if (STANDARD_GRADE_MAPPING[standard]) {
    return STANDARD_GRADE_MAPPING[standard]
  }

  // Default to 7th grade if cannot determine
  return 7
}

export function categorizeMathGoal(areaOfNeed: string, standard: string): MathGoalType {
  const area = areaOfNeed.toLowerCase()
  const std = standard.toLowerCase()

  if (area.includes('expression') || std.includes('ee.2') || std.includes('algebraic')) {
    return MathGoalType.ALGEBRAIC_EXPRESSIONS
  }
  if (
    area.includes('equation') ||
    std.includes('ee.4') ||
    std.includes('ee.6') ||
    std.includes('ee.7')
  ) {
    return MathGoalType.EQUATIONS_INEQUALITIES
  }
  if (area.includes('rational') || area.includes('integer') || std.includes('ns.')) {
    return MathGoalType.RATIONAL_NUMBERS
  }
  if (area.includes('ratio') || area.includes('proportion') || std.includes('rp.')) {
    return MathGoalType.RATIOS_PROPORTIONS
  }
  if (area.includes('geometry') || area.includes('area') || std.includes('g.')) {
    return MathGoalType.GEOMETRY
  }
  if (
    area.includes('fraction') ||
    area.includes('decimal') ||
    std.includes('nf.') ||
    std.includes('nbt.7')
  ) {
    return MathGoalType.FRACTIONS_DECIMALS
  }
  if (area.includes('word problem') || area.includes('applied problem')) {
    return MathGoalType.WORD_PROBLEMS
  }
  if (
    area.includes('multiplication') ||
    area.includes('division') ||
    area.includes('addition') ||
    area.includes('subtraction')
  ) {
    return MathGoalType.NUMBER_OPERATIONS
  }

  return MathGoalType.WORD_PROBLEMS // Default
}

// Goal Template System
export interface GoalTemplate {
  id: string // Document ID in Firestore
  name: string // Template name/description
  subject: 'math' | 'ela' | 'other' // Subject category
  topic?: string // Specific topic (e.g., "two-step word problem", "fraction", "reading comprehension")
  areaOfNeed: string // Default area of need
  goalTitleTemplate: string // Template for goal title (supports variables like {{topic}}, {{gradeLevel}})
  goalTextTemplate: string // Template for goal text (supports variables)
  baselineTemplate?: string // Template for baseline description

  // Assessment method
  assessmentMethod: 'app' | 'paper' | 'hybrid' // How this goal should be assessed
  rubricId?: string // Reference to rubric for paper/hybrid assessments (optional)

  // Default values
  defaultGradeLevel?: number // Default grade level
  defaultStandard?: string // Default academic standard
  defaultThreshold?: string // Default threshold (e.g., "80%", "4 out of 5")
  defaultCondition?: string // Default condition (e.g., "in 3 out of 4 trials")

  // Variable placeholders that can be replaced
  variables?: {
    topic?: string // Specific topic name
    operation?: string // Math operation (addition, subtraction, etc.)
    threshold?: string // Performance threshold
    condition?: string // Condition for meeting goal
    gradeLevel?: number // Grade level
    standard?: string // Academic standard
  }

  // Operation constraints for math goals
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[] // Restrict which operations can be used in questions

  // Goal connections - NEW: Track which goals use this template
  linkedGoalIds?: string[] // Array of goal IDs that have this template assigned (for reference/cleanup)

  // Metadata
  description?: string // Template description/notes
  exampleGoal?: string // Example of a goal created from this template

  // Example question fields - MOST IMPORTANT for accurate question generation
  exampleQuestion?: string // Example question text
  exampleAnswer?: string // Example correct answer
  exampleAlternativeAnswers?: string // Comma-separated alternative answers
  exampleExplanation?: string // Example explanation
  
  // NEW: Student-facing directions on how to solve this type of problem
  directions?: string // Step-by-step directions for students (e.g., "1. Read the problem carefully. 2. Identify what you need to find...")

  // NEW: Structured problem characteristics for AI generation
  problemStructure?: {
    numberOfSteps?: 1 | 2 | 3 | 4 // For word problems: how many steps to solve
    questionTypes?: string[] // e.g., ["find-part", "find-whole", "find-percent"], ["increase", "decrease"], ["compare"], ["missing-addend"]
    contextTypes?: string[] // e.g., ["shopping", "sports", "school", "food"], ["test-scores", "free-throws", "pizza-slices"]
    numberRanges?: {
      // For structured number variation
      question1?: string // e.g., "15/20", "$45-$55"
      question2?: string
      question3?: string
      question4?: string
      question5?: string
    }
    forbiddenPatterns?: string[] // e.g., ["8/10", "9/10"], ["$25 saved", "$65 cost"]
  }

  // NEW: Custom AI prompt for variation instructions
  customAIPrompt?: string // Custom instructions for AI on how to vary this template

  usageCount?: number // How many times this template has been used
  isActive: boolean // Whether template is active/available
  createdBy: string // Admin/teacher UID who created the template
  createdAt: any // Timestamp
  updatedAt: any // Timestamp
}

// Rubric System for Paper-Based Assessments
export interface Rubric {
  id: string // Document ID in Firestore
  name: string // Rubric name
  description?: string // Description of what this rubric is used for
  subject: 'math' | 'ela' | 'other' // Subject category
  topic?: string // Specific topic this rubric applies to

  // Rubric criteria (customizable)
  criteria: RubricCriterion[]

  // Scoring
  totalPoints: number // Total possible points
  passingScore?: number // Minimum score to pass (optional)

  // Usage tracking
  usageCount?: number // How many templates/goals use this rubric
  isActive: boolean // Whether rubric is active/available
  createdBy: string // Admin/teacher UID who created the rubric
  createdAt: any // Timestamp
  updatedAt: any // Timestamp
}

export interface RubricCriterion {
  id: string // Unique ID for this criterion
  name: string // Criterion name (e.g., "Ideas", "Organization", "Language/Mechanics")
  description?: string // Description of what this criterion measures
  maxPoints: number // Maximum points for this criterion
  levels: RubricLevel[] // Performance levels (e.g., Proficient, Developing, etc.)
}

export interface RubricLevel {
  id: string // Unique ID for this level
  name: string // Level name (e.g., "Proficient", "Developing", "Emerging")
  points: number // Points awarded for this level
  description: string // Description of performance at this level
  order: number // Order/rank of this level (0 = lowest, higher = better)
}
