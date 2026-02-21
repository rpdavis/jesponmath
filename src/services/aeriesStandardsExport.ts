/**
 * Aeries Standards Export Service
 * Exports standards-based grades from the Gradebook to Aeries-compatible format.
 *
 * Produces tab-delimited data that can be pasted directly into the Aeries gradebook
 * via the companion Chrome extension, or downloaded as CSV.
 */

import type { Assessment, AssessmentResult } from '@/types/iep'
import type { CustomStandard } from '@/types/standards'
import type { Student } from '@/types/users'
import { parseStandards } from '@/utils/standardsUtils'
import { calculateStandardScore } from '@/utils/standardsUtils'

export interface StandardsExportOptions {
  includeAllStandards: boolean
  exportFormat: 'csv' | 'json' | 'clipboard'
  gradeCalculationMethod: 'average' | 'most_recent' | 'highest'
  assessmentCategory?: string // Filter by ESA, SA, etc.
}

export interface AeriesStandardsExportData {
  studentId: string
  studentName: string
  standards: {
    standardCode: string
    standardName: string
    aeriesAssignmentName: string
    score: number
    total: number
    percentage: number
    attempts: number
    lastAttemptDate: string
  }[]
}

export interface AeriesStandardsClipboardData {
  headers: string[]        // Column headers: ["Student ID", "Student Name", "ESA1", "ESA2", ...]
  rows: string[][]         // Row data for each student
  standardCodes: string[]  // Standard codes in order
  metadata: {
    exportDate: string
    totalStudents: number
    totalStandards: number
    assessmentCategory: string
  }
}

/**
 * Build standards export data from gradebook data.
 * This reuses the same scoring logic as the Gradebook component.
 */
export function buildStandardsExportData(
  students: Student[],
  assessments: Assessment[],
  results: AssessmentResult[],
  customStandards: CustomStandard[],
  options: StandardsExportOptions
): AeriesStandardsExportData[] {
  // Filter assessments by category if specified
  let filteredAssessments = assessments
  if (options.assessmentCategory) {
    filteredAssessments = assessments.filter(a => a.category === options.assessmentCategory)
  }

  // Build a results index for fast lookup: studentUid -> assessmentId -> result
  const resultsIndex = new Map<string, Map<string, AssessmentResult>>()
  for (const result of results) {
    if (!resultsIndex.has(result.studentUid)) {
      resultsIndex.set(result.studentUid, new Map())
    }
    const studentResults = resultsIndex.get(result.studentUid)!
    // Keep the best attempt
    const existing = studentResults.get(result.assessmentId)
    if (!existing || result.percentage > existing.percentage) {
      studentResults.set(result.assessmentId, result)
    }
  }

  // Collect unique standards from filtered assessments
  const standardSet = new Set<string>()
  filteredAssessments.forEach(assessment => {
    if (assessment.standard) {
      parseStandards(assessment.standard).forEach(s => standardSet.add(s))
    }
    assessment.questions?.forEach((q: any) => {
      if (q.standard) {
        parseStandards(q.standard).forEach(s => standardSet.add(s))
      }
    })
  })

  const uniqueStandards = Array.from(standardSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  )

  // Helper: get custom standard by code
  const getCustomStd = (code: string): CustomStandard | null => {
    const cleanCode = code.startsWith('CUSTOM:') ? code.replace('CUSTOM:', '') : code
    return customStandards.find(std => std.code === cleanCode) || null
  }

  // Build export data for each student
  const exportData: AeriesStandardsExportData[] = []

  for (const student of students) {
    const studentResults = resultsIndex.get(student.uid)
    const studentStandards: AeriesStandardsExportData['standards'] = []

    for (const standard of uniqueStandards) {
      const customStd = getCustomStd(standard)

      // Collect question attempts for this standard (same logic as Gradebook)
      const questionAttempts: { isCorrect: boolean; score: number; maxPoints: number }[] = []
      let lastAttemptDate = ''

      filteredAssessments.forEach(assessment => {
        // Check if student took this assessment
        const result = studentResults?.get(assessment.id)
        if (!result) return

        // Track latest attempt date
        const completedAt = result.completedAt
        if (completedAt) {
          const dateStr = completedAt?.toDate
            ? completedAt.toDate().toISOString().split('T')[0]
            : completedAt?.seconds
              ? new Date(completedAt.seconds * 1000).toISOString().split('T')[0]
              : ''
          if (dateStr > lastAttemptDate) lastAttemptDate = dateStr
        }

        // Check if assessment-level standard matches
        const assessmentStandards = parseStandards(assessment.standard || '')
        const assessmentCoversStandard = assessmentStandards.includes(standard)

        assessment.questions?.forEach((question: any) => {
          const questionStandards = parseStandards(question.standard || '')
          const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard

          if (questionCoversStandard) {
            const response = result.responses?.find((r: any) => r.questionId === question.id)
            if (response) {
              questionAttempts.push({
                isCorrect: response.isCorrect,
                score: response.pointsEarned || (response.isCorrect ? (question.points || 1) : 0),
                maxPoints: question.points || 1,
              })
            }
          }
        })
      })

      if (questionAttempts.length > 0 || options.includeAllStandards) {
        const scoreResult = questionAttempts.length > 0
          ? calculateStandardScore(questionAttempts, customStd)
          : { correct: 0, total: 0, percentage: 0 }

        studentStandards.push({
          standardCode: standard,
          standardName: customStd?.name || standard,
          aeriesAssignmentName: customStd?.aeriesAssignmentName || standard,
          score: scoreResult.correct,
          total: scoreResult.total,
          percentage: Math.round(scoreResult.percentage),
          attempts: questionAttempts.length,
          lastAttemptDate,
        })
      }
    }

    exportData.push({
      studentId: student.aeriesId || student.email || `${student.firstName}_${student.lastName}`,
      studentName: `${student.lastName}, ${student.firstName}`,
      standards: studentStandards,
    })
  }

  return exportData
}

/**
 * Build clipboard-friendly data (tab-delimited) for pasting into Aeries.
 * Format: rows of [StudentID, StudentName, Score1, Score2, ...] with tab separators.
 */
export function buildClipboardData(
  exportData: AeriesStandardsExportData[],
  options: StandardsExportOptions
): AeriesStandardsClipboardData {
  // Collect all unique standard codes in order
  const standardCodesSet = new Set<string>()
  exportData.forEach(student => {
    student.standards.forEach(std => standardCodesSet.add(std.standardCode))
  })
  const standardCodes = Array.from(standardCodesSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  )

  // Build header names using aeriesAssignmentName when available
  const standardHeaders = standardCodes.map(code => {
    const firstMatch = exportData
      .flatMap(s => s.standards)
      .find(s => s.standardCode === code)
    return firstMatch?.aeriesAssignmentName || code
  })

  const headers = ['Student ID', 'Student Name', ...standardHeaders]

  // Build rows
  const rows = exportData.map(student => {
    const row = [student.studentId, student.studentName]

    standardCodes.forEach(code => {
      const std = student.standards.find(s => s.standardCode === code)
      if (std) {
        // Aeries only needs the numerator — the denominator (max points)
        // is set on the assignment object in Aeries itself
        row.push(`${std.score}`)
      } else {
        row.push('')
      }
    })

    return row
  })

  return {
    headers,
    rows,
    standardCodes,
    metadata: {
      exportDate: new Date().toISOString().split('T')[0],
      totalStudents: exportData.length,
      totalStandards: standardCodes.length,
      assessmentCategory: options.assessmentCategory || 'All',
    },
  }
}

/**
 * Copy standards data to clipboard in tab-delimited format (for Aeries paste).
 */
export async function copyStandardsToClipboard(
  clipboardData: AeriesStandardsClipboardData
): Promise<void> {
  const lines: string[] = []

  // Header row
  lines.push(clipboardData.headers.join('\t'))

  // Data rows
  clipboardData.rows.forEach(row => {
    lines.push(row.join('\t'))
  })

  const text = lines.join('\n')

  try {
    await navigator.clipboard.writeText(text)
    console.log(`📋 Copied ${clipboardData.metadata.totalStudents} students × ${clipboardData.metadata.totalStandards} standards to clipboard`)
  } catch (err) {
    // Fallback for browsers that don't support clipboard API
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    console.log('📋 Copied to clipboard (fallback method)')
  }
}

/**
 * Download standards export as CSV file.
 */
export function downloadStandardsCSV(
  clipboardData: AeriesStandardsClipboardData,
  filename?: string
): void {
  const lines: string[] = []

  // Header row
  lines.push(clipboardData.headers.map(h => `"${h}"`).join(','))

  // Data rows
  clipboardData.rows.forEach(row => {
    lines.push(row.map(cell => `"${cell}"`).join(','))
  })

  const csvContent = lines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `aeries_standards_${clipboardData.metadata.exportDate}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  console.log(`📁 Downloaded: ${link.download}`)
}

/**
 * Build JSON data for the Chrome extension to consume.
 * This is stored in localStorage so the extension can read it.
 */
export function storeForChromeExtension(
  clipboardData: AeriesStandardsClipboardData,
  exportData: AeriesStandardsExportData[]
): void {
  const extensionData = {
    version: 1,
    timestamp: Date.now(),
    headers: clipboardData.headers,
    rows: clipboardData.rows,
    standardCodes: clipboardData.standardCodes,
    metadata: clipboardData.metadata,
    // Detailed data for smart matching
    students: exportData.map(s => ({
      id: s.studentId,
      name: s.studentName,
      standards: s.standards.map(std => ({
        code: std.standardCode,
        name: std.standardName,
        aeriesName: std.aeriesAssignmentName,
        score: std.score,
        total: std.total,
        percentage: std.percentage,
      })),
    })),
  }

  // Store in localStorage for the Chrome extension to read
  localStorage.setItem('jepsonmath_aeries_export', JSON.stringify(extensionData))
  console.log('💾 Stored export data for Chrome extension')
}

// ─── Legacy compatibility exports (used by AeriesGradeExport.vue) ───────────

/**
 * Legacy stub: export standards grades to Aeries by student IDs.
 * The AeriesGradeExport.vue component calls this for the "Standards" export type.
 */
export async function exportStandardsGradesToAeries(
  _studentIds: string[],
  _options: StandardsExportOptions
): Promise<AeriesStandardsExportData[]> {
  console.warn('exportStandardsGradesToAeries: Use the Gradebook "Copy Standards for Aeries" button for full functionality.')
  return []
}

/**
 * Legacy stub: download standards export file.
 */
export async function downloadStandardsExport(
  data: AeriesStandardsExportData[],
  options: StandardsExportOptions
): Promise<void> {
  if (data.length === 0) {
    console.warn('downloadStandardsExport: No data to export.')
    return
  }

  const clipboardData = buildClipboardData(data, options)
  downloadStandardsCSV(clipboardData)
}

/**
 * Legacy stub: validate standards export data.
 */
export function validateStandardsExport(
  data: AeriesStandardsExportData[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!data || data.length === 0) {
    errors.push('No students in export data')
  }
  return { isValid: errors.length === 0, errors }
}
