// IEP Database Types
export interface Student {
  id: string; // Document ID in Firestore
  email: string; // Required for login
  seisId: string;
  districtId: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  grade: string;
  schoolOfAttendance: string;
  districtOfService: string;
  caseManager: string;
  serviceProviders: string[]; // Array of service provider names
  iepDate: string;
  eligibilityStatus: string;
  goalIds: string[]; // References to goal documents
  createdAt: any;
  updatedAt: any;
}

export interface Goal {
  id: string; // Document ID in Firestore
  studentSeisId: string;
  category: 'HW' | 'Assign' | 'ESA' | 'SA' | 'PA' | 'Other';
  areaOfNeed: string;
  goalNumber: string;
  baseline: string;
  goalText: string;
  standard: string;
  gradeLevel: number; // Extracted from standard (e.g., 7 for 7.EE.4a)
  startDate: string;
  endDate: string;
  personResponsible: string;
  purposeOfGoal?: string;
  objectives: Objective[];
  progressReports: ProgressReport[];
  currentProgress: string;
  isActive: boolean;
  isMet: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Objective {
  id: string;
  objectiveText: string;
  isMet: boolean;
  dateMet?: string;
}

export interface ProgressReport {
  id: string;
  reportDate: string;
  summary: string;
  comments: string;
  progress: 'On Track' | 'Limited Progress' | 'No Progress Made' | 'N/A';
  reportedBy: string;
}

export interface Assessment {
  id: string;
  goalId: string;
  studentSeisId: string;
  studentUid?: string; // New field for efficient queries
  createdBy?: string; // Track who created the assessment
  title: string;
  description: string;
  standard?: string; // Optional - can be set per question instead
  gradeLevel: number;
  category: 'HW' | 'Assign' | 'ESA' | 'SA' | 'PA' | 'Other';
  questions: AssessmentQuestion[];
  totalPoints: number;
  timeLimit?: number; // in minutes
  instructions: string;
  accommodations: string[];
  // File upload options
  allowFileUpload?: boolean; // Whether students can upload files/photos
  requireFileUpload?: boolean; // Whether file upload is mandatory
  fileUploadInstructions?: string; // Instructions for file upload
  maxFileSize?: number; // Max file size in MB
  allowedFileTypes?: string[]; // Allowed file extensions
  
  // Retake options
  allowRetakes?: boolean; // Whether students can retake this assessment
  maxRetakes?: number; // Maximum number of retakes allowed (0 = unlimited)
  retakeMode?: 'separate' | 'combined'; // How to handle multiple attempts
  retakeInstructions?: string; // Instructions for retakes
  
  createdAt: any;
  updatedAt: any;
  assignedAt?: any; // When assessment was assigned to student
}

export interface FractionAnswer {
  numerator: number;
  denominator: number;
}

export interface AssessmentQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple-choice' | 'short-answer' | 'essay' | 'true-false' | 'fill-blank' | 'matching' | 'fraction';
  standard?: string; // Standards for this specific question (can be multiple, separated by ';')
  standards?: string[]; // Array of individual standards (parsed from standard field)
  options?: string[]; // For multiple choice
  correctAnswer: string | string[];
  acceptableAnswers?: string[]; // Alternative acceptable answers for short-answer
  correctFractionAnswers?: (FractionAnswer | string)[]; // Support multiple equivalent fraction answers
  points: number;
  explanation?: string;
  hints?: string[];
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  studentSeisId: string;
  studentUid?: string; // Also store student UID for easier queries
  goalId: string;
  responses: AssessmentResponse[];
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number; // in minutes
  completedAt: any;
  gradedBy: string;
  feedback: string;
  accommodationsUsed: string[];
  
    // Retake tracking
  attemptNumber?: number; // Which attempt this is (1, 2, 3, etc.)
  isRetake?: boolean; // Whether this is a retake
  previousAttempts?: AssessmentAttempt[]; // For combined mode - stores all attempts

  // File uploads
  uploadedFiles?: UploadedFile[];
  
  // Migration tracking
  studentEmail?: string;
  migratedAt?: any;
  migratedBy?: string;
  migrationReason?: string; // Student uploaded files/photos
}

export interface AssessmentAttempt {
  attemptNumber: number;
  responses: AssessmentResponse[];
  score: number;
  percentage: number;
  timeSpent: number;
  completedAt: any;
  uploadedFiles?: UploadedFile[];
}

export interface AssessmentResponse {
  questionId: string;
  studentAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent?: number;
  manuallyAdjusted?: boolean;
  adjustedBy?: string;
  adjustedAt?: Date;
  adjustmentReason?: string;
  regraded?: boolean;
  regradedAt?: Date;
  regradedBy?: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number; // in bytes
  fileType: string; // MIME type
  uploadUrl: string; // Firebase Storage URL
  thumbnailUrl?: string; // For images
  uploadedAt: any; // timestamp
  questionId?: string; // If file is for specific question
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
  FRACTIONS_DECIMALS = 'fractions-decimals'
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
  '7.EE.B.4': 7
};

export function extractGradeFromStandard(standard: string): number {
  // Extract grade level from standard notation
  const match = standard.match(/^(\d+)\./);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Check specific mappings
  if (STANDARD_GRADE_MAPPING[standard]) {
    return STANDARD_GRADE_MAPPING[standard];
  }
  
  // Default to 7th grade if cannot determine
  return 7;
}

export function categorizeMathGoal(areaOfNeed: string, standard: string): MathGoalType {
  const area = areaOfNeed.toLowerCase();
  const std = standard.toLowerCase();
  
  if (area.includes('expression') || std.includes('ee.2') || std.includes('algebraic')) {
    return MathGoalType.ALGEBRAIC_EXPRESSIONS;
  }
  if (area.includes('equation') || std.includes('ee.4') || std.includes('ee.6') || std.includes('ee.7')) {
    return MathGoalType.EQUATIONS_INEQUALITIES;
  }
  if (area.includes('rational') || area.includes('integer') || std.includes('ns.')) {
    return MathGoalType.RATIONAL_NUMBERS;
  }
  if (area.includes('ratio') || area.includes('proportion') || std.includes('rp.')) {
    return MathGoalType.RATIOS_PROPORTIONS;
  }
  if (area.includes('geometry') || area.includes('area') || std.includes('g.')) {
    return MathGoalType.GEOMETRY;
  }
  if (area.includes('fraction') || area.includes('decimal') || std.includes('nf.') || std.includes('nbt.7')) {
    return MathGoalType.FRACTIONS_DECIMALS;
  }
  if (area.includes('word problem') || area.includes('applied problem')) {
    return MathGoalType.WORD_PROBLEMS;
  }
  if (area.includes('multiplication') || area.includes('division') || area.includes('addition') || area.includes('subtraction')) {
    return MathGoalType.NUMBER_OPERATIONS;
  }
  
  return MathGoalType.WORD_PROBLEMS; // Default
}
