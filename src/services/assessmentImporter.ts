/**
 * Assessment JSON Importer Service
 * Parses and validates JSON files to create assessments quickly
 */

import type { Assessment, AssessmentQuestion } from '@/types/iep'
import { getAutoDetectedAcademicPeriod } from '@/firebase/assignmentServices'

export interface ImportedAssessmentData {
  // Required fields
  title: string
  description: string
  goalId: string
  category: 'HW' | 'Assign' | 'ESA' | 'SA' | 'PA' | 'Other'
  gradeLevel: number
  questions: Partial<AssessmentQuestion>[]

  // Optional fields
  academicPeriod?: string
  instructions?: string
  accommodations?: string[]
  standard?: string
  timeLimit?: number

  // File upload options
  allowFileUpload?: boolean
  requireFileUpload?: boolean
  fileUploadInstructions?: string
  maxFileSize?: number
  allowedFileTypes?: string[]
  photoOrientation?: 'portrait' | 'landscape'

  // Multi-page photo capture options
  requireMultiplePages?: boolean
  requiredPageCount?: number
  pageLabels?: string[]
  allowExtraPages?: boolean

  // Retake options
  allowRetakes?: boolean
  maxRetakes?: number
  retakeMode?: 'separate' | 'combined'
  retakeInstructions?: string
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Validate imported assessment data
 */
export function validateImportedAssessment(data: any): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Required fields
  if (!data.title || typeof data.title !== 'string') {
    errors.push({ field: 'title', message: 'Title is required and must be a string', severity: 'error' })
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description is required and must be a string',
      severity: 'error',
    })
  }

  if (!data.goalId || typeof data.goalId !== 'string') {
    errors.push({ field: 'goalId', message: 'Goal ID is required and must be a string', severity: 'error' })
  }

  if (!data.category || !['HW', 'Assign', 'ESA', 'SA', 'PA', 'Other'].includes(data.category)) {
    errors.push({
      field: 'category',
      message: 'Category is required and must be one of: HW, Assign, ESA, SA, PA, Other',
      severity: 'error',
    })
  }

  if (typeof data.gradeLevel !== 'number' || data.gradeLevel < 1 || data.gradeLevel > 12) {
    errors.push({
      field: 'gradeLevel',
      message: 'Grade level is required and must be a number between 1-12',
      severity: 'error',
    })
  }

  // Questions validation
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push({
      field: 'questions',
      message: 'Questions array is required and must have at least one question',
      severity: 'error',
    })
  } else {
    // Validate each question
    data.questions.forEach((q: any, index: number) => {
      const qNum = index + 1

      if (!q.questionText || typeof q.questionText !== 'string') {
        errors.push({
          field: `questions[${index}].questionText`,
          message: `Question ${qNum}: questionText is required`,
          severity: 'error',
        })
      }

      if (!q.questionType) {
        errors.push({
          field: `questions[${index}].questionType`,
          message: `Question ${qNum}: questionType is required`,
          severity: 'error',
        })
      }

      const validQuestionTypes = [
        'multiple-choice',
        'short-answer',
        'essay',
        'true-false',
        'fill-blank',
        'matching',
        'fraction',
        'rank-order',
        'checkbox',
        'horizontal-ordering',
        'algebra-tiles',
      ]

      if (q.questionType && !validQuestionTypes.includes(q.questionType)) {
        errors.push({
          field: `questions[${index}].questionType`,
          message: `Question ${qNum}: questionType must be one of: ${validQuestionTypes.join(', ')}`,
          severity: 'error',
        })
      }

      if (typeof q.points !== 'number' || q.points <= 0) {
        errors.push({
          field: `questions[${index}].points`,
          message: `Question ${qNum}: points must be a positive number`,
          severity: 'error',
        })
      }

      // Type-specific validation
      if (q.questionType === 'multiple-choice' && (!Array.isArray(q.options) || q.options.length < 2)) {
        errors.push({
          field: `questions[${index}].options`,
          message: `Question ${qNum}: Multiple-choice questions must have at least 2 options`,
          severity: 'error',
        })
      }

      if (q.questionType === 'horizontal-ordering') {
        if (!Array.isArray(q.orderingItems) || q.orderingItems.length < 2) {
          errors.push({
            field: `questions[${index}].orderingItems`,
            message: `Question ${qNum}: Ordering questions must have at least 2 items`,
            severity: 'error',
          })
        }
        if (!Array.isArray(q.correctHorizontalOrder) || q.correctHorizontalOrder.length < 2) {
          errors.push({
            field: `questions[${index}].correctHorizontalOrder`,
            message: `Question ${qNum}: Ordering questions must specify correct order`,
            severity: 'error',
          })
        }
      }

      if (q.questionType === 'checkbox' && (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0)) {
        errors.push({
          field: `questions[${index}].correctAnswers`,
          message: `Question ${qNum}: Checkbox questions must have at least one correct answer`,
          severity: 'error',
        })
      }

      // Warnings
      if (!q.standard && !q.standards) {
        warnings.push({
          field: `questions[${index}].standard`,
          message: `Question ${qNum}: No standard specified (optional but recommended)`,
          severity: 'warning',
        })
      }

      if (!q.explanation) {
        warnings.push({
          field: `questions[${index}].explanation`,
          message: `Question ${qNum}: No explanation provided (optional but recommended)`,
          severity: 'warning',
        })
      }
    })
  }

  // Optional field validation
  if (data.academicPeriod && typeof data.academicPeriod !== 'string') {
    warnings.push({
      field: 'academicPeriod',
      message: 'Academic period should be a string like "q1", "q2", etc.',
      severity: 'warning',
    })
  }

  if (data.timeLimit && (typeof data.timeLimit !== 'number' || data.timeLimit < 0)) {
    warnings.push({
      field: 'timeLimit',
      message: 'Time limit must be a positive number (in minutes)',
      severity: 'warning',
    })
  }

  if (data.maxFileSize && (typeof data.maxFileSize !== 'number' || data.maxFileSize < 1)) {
    warnings.push({
      field: 'maxFileSize',
      message: 'Max file size must be a positive number (in MB)',
      severity: 'warning',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Convert imported data to a full Assessment object
 */
export function convertToAssessment(
  data: ImportedAssessmentData,
  createdBy: string,
): Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> {
  // Generate question IDs if not provided
  const questions: AssessmentQuestion[] = data.questions.map((q, index) => {
    const questionId = q.id || `q_${Date.now()}_${generateRandomId()}`

    return {
      id: questionId,
      questionText: q.questionText || '',
      questionType: q.questionType || 'short-answer',
      correctAnswer: q.correctAnswer || '',
      points: q.points || 10,

      // Optional fields
      standard: q.standard,
      standards: q.standards || (q.standard ? [q.standard] : []),
      options: q.options,
      acceptableAnswers: q.acceptableAnswers,
      acceptEquivalentFractions: q.acceptEquivalentFractions,
      correctFractionAnswers: q.correctFractionAnswers,
      answerPrefix: q.answerPrefix || '',
      answerSuffix: q.answerSuffix || '',
      matchingPairs: q.matchingPairs,
      leftItems: q.leftItems,
      rightItems: q.rightItems,
      correctMatches: q.correctMatches,
      itemsToRank: q.itemsToRank,
      correctOrder: q.correctOrder,
      orderType: q.orderType,
      correctAnswers: q.correctAnswers,
      orderingItems: q.orderingItems,
      correctHorizontalOrder: q.correctHorizontalOrder,
      orderDirection: q.orderDirection,
      explanation: q.explanation,
      hints: q.hints,
      requiresPhoto: q.requiresPhoto,
      blankFormat: q.blankFormat,
      blankPosition: q.blankPosition,
    } as AssessmentQuestion
  })

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  // Auto-detect academic period if not provided
  const academicPeriod = data.academicPeriod || getAutoDetectedAcademicPeriod()

  return {
    goalId: data.goalId,
    createdBy,
    title: data.title,
    description: data.description,
    standard: data.standard || '',
    gradeLevel: data.gradeLevel,
    category: data.category,
    academicPeriod,
    questions,
    totalPoints,
    timeLimit: data.timeLimit || 0,
    instructions: data.instructions || 'Answer each question to the best of your ability.',
    accommodations: data.accommodations || [],

    // File upload options
    allowFileUpload: data.allowFileUpload ?? false,
    requireFileUpload: data.requireFileUpload ?? false,
    fileUploadInstructions:
      data.fileUploadInstructions || 'Take a clear photo of your work showing all calculations.',
    maxFileSize: data.maxFileSize || 10,
    allowedFileTypes: data.allowedFileTypes || ['jpg,jpeg,png', 'pdf'],
    photoOrientation: data.photoOrientation || 'landscape',

    // Multi-page options
    requireMultiplePages: data.requireMultiplePages ?? false,
    requiredPageCount: data.requiredPageCount || 1,
    pageLabels: data.pageLabels || [],
    allowExtraPages: data.allowExtraPages ?? true,

    // Retake options
    allowRetakes: data.allowRetakes ?? false,
    maxRetakes: data.maxRetakes || 0,
    retakeMode: data.retakeMode || 'separate',
    retakeInstructions: data.retakeInstructions || '',
  }
}

/**
 * Parse JSON string and validate
 */
export function parseAndValidateJSON(jsonString: string): {
  success: boolean
  data?: ImportedAssessmentData
  validation?: ValidationResult
  error?: string
} {
  try {
    const data = JSON.parse(jsonString)
    const validation = validateImportedAssessment(data)

    if (!validation.isValid) {
      return {
        success: false,
        validation,
        error: `Validation failed: ${validation.errors.map((e) => e.message).join('; ')}`,
      }
    }

    return {
      success: true,
      data: data as ImportedAssessmentData,
      validation,
    }
  } catch (error) {
    return {
      success: false,
      error: `JSON parse error: ${error instanceof Error ? error.message : 'Invalid JSON format'}`,
    }
  }
}

/**
 * Generate a random ID
 */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11)
}
