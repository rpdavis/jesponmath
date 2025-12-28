/**
 * Detailed Debug Logger
 * Comprehensive tracking for selected students to debug module progression
 *
 * Enable for specific students to track:
 * - Every problem attempted
 * - Every session metric
 * - Every advancement decision
 * - Problem bank status
 * - Proficiency changes
 * - Errors and issues
 */

import type { OperationType, SubLevel, ProficiencyLevel } from '@/types/mathFluency'

export interface DetailedSessionLog {
  studentUid: string
  studentName: string
  sessionId: string
  sessionNumber: number
  timestamp: Date
  operation: OperationType
  currentSubLevel: SubLevel

  // Session start state
  startState: {
    proficiencyPercentage: number
    masteryPercentage: number
    problemBankDistribution: {
      doesNotKnow: number
      emerging: number
      approaching: number
      proficient: number
      mastered: number
    }
    consecutiveDays: number
    totalSessions: number
  }

  // Diagnostic round
  diagnostic: {
    problems: {
      problemId: string
      display: string
      studentAnswer: string | number
      correctAnswer: string
      correct: boolean
      responseTime: number
      timestamp: Date
    }[]
    score: number
    total: number
    percentage: number
    averageResponseTime: number
  }

  // Round 1 (Learning)
  round1: {
    skipped: boolean
    problemsTargeted: number
    problems: {
      problemId: string
      display: string
      phase: 'encoding' | 'consolidation' | 'recall' | 'feedback'
      studentAnswer?: string | number
      correctAnswer: string
      correct?: boolean
      responseTime?: number
      timestamp: Date
    }[]
    completed: boolean
  }

  // Round 2 (Practice)
  round2: {
    fastTrackMode: boolean
    problemDistribution: {
      currentLevel: number
      maintenance: number
      total: number
    }
    problems: {
      problemId: string
      display: string
      studentAnswer: string | number
      correctAnswer: string
      correct: boolean
      responseTime: number
      proficiencyBefore: ProficiencyLevel
      proficiencyAfter: ProficiencyLevel
      timestamp: Date
    }[]
    score: number
    total: number
    percentage: number
  }

  // Round 3 (Quick Check)
  round3: {
    problems: {
      problemId: string
      display: string
      studentAnswer: string | number
      correctAnswer: string
      correct: boolean
      responseTime: number
      timestamp: Date
    }[]
    score: number
    total: number
    percentage: number
  }

  // Session end state
  endState: {
    proficiencyPercentage: number
    masteryPercentage: number
    problemBankDistribution: {
      doesNotKnow: number
      emerging: number
      approaching: number
      proficient: number
      mastered: number
    }
    proficiencyChange: number // +5% or -2%
    problemsPromoted: number
    problemsDemoted: number
  }

  // Advancement check
  advancement: {
    checked: boolean
    proficiencyAtCheck: number
    thresholdUsed: number
    mode: 'fast-track' | 'high-performer' | 'standard'
    advanced: boolean
    previousSubLevel?: SubLevel
    newSubLevel?: SubLevel
    reason?: string
  }

  // Session summary
  summary: {
    totalDuration: number // seconds
    totalProblems: number
    totalCorrect: number
    overallAccuracy: number
    averageResponseTime: number
    sessionQuality: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement'
  }

  // Errors/Issues
  issues: {
    timestamp: Date
    type: 'error' | 'warning' | 'info'
    message: string
    context?: any
  }[]
}

// ============================================================================
// STORAGE
// ============================================================================

const detailedLogs: Map<string, DetailedSessionLog[]> = new Map()
const debugEnabledStudents: Set<string> = new Set()
const savedSessionIds: Set<string> = new Set() // ⭐ Track already-saved sessions

const STORAGE_KEY = 'fluency_debug_enabled_students'

// Load from Firestore on initialization
async function loadDebugStudentsFromFirestore(): Promise<void> {
  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')

    const snapshot = await getDocs(collection(db, 'fluencyDebugSettings'))
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.debugEnabled) {
        debugEnabledStudents.add(data.studentUid)
      }
    })

    // Also save to localStorage for faster loads
    saveDebugStudentsToStorage()

    console.log(`🔬 Loaded ${debugEnabledStudents.size} debug-enabled students from Firestore`)
  } catch (error) {
    console.error('Error loading from Firestore, trying localStorage:', error)
    // Fallback to localStorage if Firestore fails
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const studentUids = JSON.parse(stored) as string[]
        studentUids.forEach((uid) => debugEnabledStudents.add(uid))
        console.log(
          `🔬 Loaded ${studentUids.length} debug-enabled students from localStorage (fallback)`,
        )
      }
    } catch (localError) {
      console.error('Error loading from localStorage:', localError)
    }
  }
}

// Save to localStorage
function saveDebugStudentsToStorage(): void {
  try {
    const studentUids = Array.from(debugEnabledStudents)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studentUids))
  } catch (error) {
    console.error('Error saving debug students to storage:', error)
  }
}

// Initialize on module load
loadDebugStudentsFromFirestore()

// ============================================================================
// ENABLE/DISABLE DEBUG MODE
// ============================================================================

/**
 * Enable detailed debug logging for a student
 */
export async function enableDebugMode(studentUid: string): Promise<void> {
  debugEnabledStudents.add(studentUid)
  saveDebugStudentsToStorage()

  // ⭐ ALSO SAVE TO FIRESTORE (persists across browsers/cache clears)
  try {
    const { setDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')

    await setDoc(doc(db, 'fluencyDebugSettings', studentUid), {
      studentUid,
      debugEnabled: true,
      enabledAt: new Date().toISOString(),
      enabledBy: 'teacher', // Could track which teacher enabled it
    })

    console.log(`🔬 DEBUG MODE ENABLED for student: ${studentUid}`)
    console.log('  → Saved to Firestore (persists permanently)')
  } catch (error) {
    console.error('Error saving to Firestore:', error)
    // Still works with localStorage
    console.log(`🔬 DEBUG MODE ENABLED for student: ${studentUid}`)
    console.log('  → Saved to localStorage only')
  }
}

/**
 * Disable detailed debug logging for a student
 */
export async function disableDebugMode(studentUid: string): Promise<void> {
  debugEnabledStudents.delete(studentUid)
  saveDebugStudentsToStorage()

  // ⭐ ALSO REMOVE FROM FIRESTORE
  try {
    const { deleteDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')

    await deleteDoc(doc(db, 'fluencyDebugSettings', studentUid))
    console.log(`🔬 DEBUG MODE DISABLED for student: ${studentUid}`)
  } catch (error) {
    console.log(`🔬 DEBUG MODE DISABLED for student: ${studentUid}`)
  }
}

/**
 * Check if debug mode is enabled for a student
 */
export function isDebugEnabled(studentUid: string): boolean {
  return debugEnabledStudents.has(studentUid)
}

/**
 * Get list of students with debug mode enabled
 */
export function getDebugEnabledStudents(): string[] {
  return Array.from(debugEnabledStudents)
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Create a new session log
 */
export function createSessionLog(
  studentUid: string,
  studentName: string,
  sessionId: string,
  sessionNumber: number,
  operation: OperationType,
  currentSubLevel: SubLevel,
  startState: DetailedSessionLog['startState'],
): DetailedSessionLog {
  const log: DetailedSessionLog = {
    studentUid,
    studentName,
    sessionId,
    sessionNumber,
    timestamp: new Date(),
    operation,
    currentSubLevel,
    startState,
    diagnostic: {
      problems: [],
      score: 0,
      total: 0,
      percentage: 0,
      averageResponseTime: 0,
    },
    round1: {
      skipped: false,
      problemsTargeted: 0,
      problems: [],
      completed: false,
    },
    round2: {
      fastTrackMode: false,
      problemDistribution: { currentLevel: 0, maintenance: 0, total: 0 },
      problems: [],
      score: 0,
      total: 0,
      percentage: 0,
    },
    round3: {
      problems: [],
      score: 0,
      total: 0,
      percentage: 0,
    },
    endState: {
      proficiencyPercentage: 0,
      masteryPercentage: 0,
      problemBankDistribution: {
        doesNotKnow: 0,
        emerging: 0,
        approaching: 0,
        proficient: 0,
        mastered: 0,
      },
      proficiencyChange: 0,
      problemsPromoted: 0,
      problemsDemoted: 0,
    },
    advancement: {
      checked: false,
      proficiencyAtCheck: 0,
      thresholdUsed: 85,
      mode: 'standard',
      advanced: false,
    },
    summary: {
      totalDuration: 0,
      totalProblems: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      averageResponseTime: 0,
      sessionQuality: 'Fair',
    },
    issues: [],
  }

  console.group(`🔬 DEBUG SESSION START: ${studentName}`)
  console.log('Session:', sessionNumber)
  console.log('Operation:', operation)
  console.log('Current Level:', currentSubLevel)
  console.log('Starting Proficiency:', `${startState.proficiencyPercentage}%`)
  console.table(startState.problemBankDistribution)
  console.groupEnd()

  return log
}

/**
 * Save a completed session log to Firestore
 */
export async function saveSessionLog(log: DetailedSessionLog): Promise<void> {
  if (!debugEnabledStudents.has(log.studentUid)) {
    return // Debug mode not enabled for this student
  }

  // ⭐ PREVENT DUPLICATES
  if (savedSessionIds.has(log.sessionId)) {
    console.log('⚠️ Session already saved, skipping duplicate:', log.sessionId)
    return
  }

  savedSessionIds.add(log.sessionId)

  // Keep in memory
  const studentLogs = detailedLogs.get(log.studentUid) || []
  studentLogs.push(log)
  detailedLogs.set(log.studentUid, studentLogs)

  // ⭐ SAVE TO FIRESTORE for teacher access
  console.log('💾 Attempting to save to Firestore (ONCE)...', {
    studentUid: log.studentUid,
    sessionId: log.sessionId,
    sessionNumber: log.sessionNumber,
  })

  try {
    const { addDoc, collection, Timestamp } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')

    // ⭐ Create Firestore-safe version (no circular refs, convert Dates)
    const firestoreLog = {
      studentUid: log.studentUid,
      studentName: log.studentName,
      sessionId: log.sessionId,
      sessionNumber: log.sessionNumber,
      operation: log.operation,
      currentSubLevel: log.currentSubLevel,

      // Simplified session data (just scores, not full problem arrays)
      diagnostic: {
        score: log.diagnostic.score,
        total: log.diagnostic.total,
        percentage: log.diagnostic.percentage,
      },
      round1: {
        skipped: log.round1.skipped,
        problemsTargeted: log.round1.problemsTargeted,
      },
      round2: {
        score: log.round2.score,
        total: log.round2.total,
        percentage: log.round2.percentage,
        fastTrackMode: log.round2.fastTrackMode,
      },
      round3: {
        score: log.round3.score,
        total: log.round3.total,
        percentage: log.round3.percentage,
      },

      startState: log.startState,
      endState: log.endState,
      advancement: log.advancement,
      summary: log.summary,
      issues: log.issues || [], // ⭐ Include issues array (empty if none)

      timestamp: Timestamp.now(),
      createdAt: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, 'fluencyDebugLogs'), firestoreLog)

    console.log('✅ Saved log to Firestore successfully!', {
      docId: docRef.id,
      sessionNumber: log.sessionNumber,
    })
  } catch (error) {
    console.error('❌ ERROR saving log to Firestore:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      code: (error as any)?.code,
      log: {
        studentUid: log.studentUid,
        sessionNumber: log.sessionNumber,
      },
    })
    throw error // Re-throw so caller knows it failed
  }

  // Print detailed summary
  console.group(`🔬 DEBUG SESSION COMPLETE: ${log.studentName}`)
  console.log('Session:', log.sessionNumber)
  console.log('Duration:', `${Math.round(log.summary.totalDuration / 60)} minutes`)

  console.group('📊 Performance')
  console.log(
    'Diagnostic:',
    `${log.diagnostic.score}/${log.diagnostic.total} (${log.diagnostic.percentage}%)`,
  )
  console.log('Round 2:', `${log.round2.score}/${log.round2.total} (${log.round2.percentage}%)`)
  console.log('Round 3:', `${log.round3.score}/${log.round3.total} (${log.round3.percentage}%)`)
  console.log('Overall Accuracy:', `${log.summary.overallAccuracy}%`)
  console.log('Avg Response Time:', `${(log.summary.averageResponseTime / 1000).toFixed(1)}s`)
  console.groupEnd()

  console.group('📈 Proficiency Change')
  console.log('Before:', `${log.startState.proficiencyPercentage}%`)
  console.log('After:', `${log.endState.proficiencyPercentage}%`)
  console.log(
    'Change:',
    log.endState.proficiencyChange >= 0
      ? `+${log.endState.proficiencyChange}%`
      : `${log.endState.proficiencyChange}%`,
  )
  console.log('Problems Promoted:', log.endState.problemsPromoted)
  console.log('Problems Demoted:', log.endState.problemsDemoted)
  console.groupEnd()

  console.group('🏆 Bank Distribution Change')
  console.log('Before:', log.startState.problemBankDistribution)
  console.log('After:', log.endState.problemBankDistribution)
  console.groupEnd()

  if (log.advancement.checked) {
    console.group('🚀 Advancement Check')
    console.log('Proficiency:', `${log.advancement.proficiencyAtCheck}%`)
    console.log('Threshold:', `${log.advancement.thresholdUsed}%`)
    console.log('Mode:', log.advancement.mode)
    console.log('Advanced:', log.advancement.advanced ? 'YES ✅' : 'NO')
    if (log.advancement.advanced) {
      console.log('From:', log.advancement.previousSubLevel)
      console.log('To:', log.advancement.newSubLevel)
      console.log('Reason:', log.advancement.reason)
    }
    console.groupEnd()
  }

  if (log.issues.length > 0) {
    console.group('⚠️ Issues Detected')
    log.issues.forEach((issue) => {
      console.log(`[${issue.type.toUpperCase()}]`, issue.message, issue.context)
    })
    console.groupEnd()
  }

  console.log('Session Quality:', log.summary.sessionQuality)
  console.log('Fast-Track Mode:', log.round2.fastTrackMode ? 'YES ⚡' : 'NO')
  console.groupEnd()
}

// ============================================================================
// RETRIEVAL
// ============================================================================

/**
 * Get all detailed logs for a student
 */
export function getDetailedLogs(studentUid: string): DetailedSessionLog[] {
  return detailedLogs.get(studentUid) || []
}

/**
 * Get the most recent session log for a student
 */
export function getLastSessionLog(studentUid: string): DetailedSessionLog | null {
  const logs = detailedLogs.get(studentUid)
  return logs && logs.length > 0 ? logs[logs.length - 1] : null
}

/**
 * Clear logs for a student
 */
export function clearStudentLogs(studentUid: string): void {
  detailedLogs.delete(studentUid)
  console.log(`🗑️ Cleared detailed logs for student: ${studentUid}`)
}

/**
 * Clear all detailed logs
 */
export function clearAllDetailedLogs(): void {
  detailedLogs.clear()
  console.log('🗑️ Cleared all detailed logs')
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Analyze a student's progression
 */
export function analyzeStudentProgression(studentUid: string): {
  totalSessions: number
  averageAccuracy: number
  proficiencyGrowth: number
  advancementCount: number
  fastTrackSessions: number
  issueCount: number
  averageSessionDuration: number
  problemsPromoted: number
  problemsDemoted: number
} {
  const logs = getDetailedLogs(studentUid)

  if (logs.length === 0) {
    return {
      totalSessions: 0,
      averageAccuracy: 0,
      proficiencyGrowth: 0,
      advancementCount: 0,
      fastTrackSessions: 0,
      issueCount: 0,
      averageSessionDuration: 0,
      problemsPromoted: 0,
      problemsDemoted: 0,
    }
  }

  const totalAccuracy = logs.reduce((sum, log) => sum + log.summary.overallAccuracy, 0)
  const advancementCount = logs.filter((log) => log.advancement.advanced).length
  const fastTrackSessions = logs.filter((log) => log.round2.fastTrackMode).length
  const issueCount = logs.reduce((sum, log) => sum + log.issues.length, 0)
  const totalDuration = logs.reduce((sum, log) => sum + log.summary.totalDuration, 0)
  const problemsPromoted = logs.reduce((sum, log) => sum + log.endState.problemsPromoted, 0)
  const problemsDemoted = logs.reduce((sum, log) => sum + log.endState.problemsDemoted, 0)

  const firstLog = logs[0]
  const lastLog = logs[logs.length - 1]
  const proficiencyGrowth =
    lastLog.endState.proficiencyPercentage - firstLog.startState.proficiencyPercentage

  return {
    totalSessions: logs.length,
    averageAccuracy: Math.round(totalAccuracy / logs.length),
    proficiencyGrowth: Math.round(proficiencyGrowth),
    advancementCount,
    fastTrackSessions,
    issueCount,
    averageSessionDuration: Math.round(totalDuration / logs.length / 60), // minutes
    problemsPromoted,
    problemsDemoted,
  }
}

/**
 * Print analysis to console
 */
export function printAnalysis(studentUid: string): void {
  const analysis = analyzeStudentProgression(studentUid)
  const logs = getDetailedLogs(studentUid)

  if (logs.length === 0) {
    console.log('No logs found for student:', studentUid)
    return
  }

  const firstLog = logs[0]
  const lastLog = logs[logs.length - 1]

  console.group(`🔬 DETAILED ANALYSIS: ${firstLog.studentName}`)
  console.log('Total Sessions:', analysis.totalSessions)
  console.log('Average Accuracy:', `${analysis.averageAccuracy}%`)
  console.log(
    'Proficiency Growth:',
    `${analysis.proficiencyGrowth >= 0 ? '+' : ''}${analysis.proficiencyGrowth}%`,
  )
  console.log('  Start:', `${firstLog.startState.proficiencyPercentage}%`)
  console.log('  End:', `${lastLog.endState.proficiencyPercentage}%`)
  console.log('Advancements:', analysis.advancementCount)
  console.log('Fast-Track Sessions:', analysis.fastTrackSessions)
  console.log('Issues Encountered:', analysis.issueCount)
  console.log('Avg Session Duration:', `${analysis.averageSessionDuration} minutes`)
  console.log('Problems Promoted:', analysis.problemsPromoted)
  console.log('Problems Demoted:', analysis.problemsDemoted)
  console.groupEnd()
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export detailed logs to CSV
 */
export function exportDetailedLogsToCSV(studentUid: string): string {
  const logs = getDetailedLogs(studentUid)

  if (logs.length === 0) {
    return ''
  }

  const headers = [
    'Session',
    'Date',
    'Operation',
    'Sub-Level',
    'Proficiency Start',
    'Proficiency End',
    'Change',
    'Diagnostic Score',
    'Round 2 Score',
    'Round 3 Score',
    'Overall Accuracy',
    'Fast-Track',
    'Advanced',
    'New Level',
    'Problems Promoted',
    'Problems Demoted',
    'Issues',
    'Duration (min)',
  ]

  const rows = logs.map((log) => [
    log.sessionNumber,
    log.timestamp.toISOString(),
    log.operation,
    log.currentSubLevel,
    `${log.startState.proficiencyPercentage}%`,
    `${log.endState.proficiencyPercentage}%`,
    `${log.endState.proficiencyChange >= 0 ? '+' : ''}${log.endState.proficiencyChange}%`,
    `${log.diagnostic.score}/${log.diagnostic.total}`,
    `${log.round2.score}/${log.round2.total}`,
    `${log.round3.score}/${log.round3.total}`,
    `${log.summary.overallAccuracy}%`,
    log.round2.fastTrackMode ? 'Yes' : 'No',
    log.advancement.advanced ? 'Yes' : 'No',
    log.advancement.newSubLevel || 'N/A',
    log.endState.problemsPromoted,
    log.endState.problemsDemoted,
    log.issues.length,
    Math.round(log.summary.totalDuration / 60),
  ])

  return [headers, ...rows].map((row) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n')
}

/**
 * Export problem-level details to CSV
 */
export function exportProblemDetailsToCSV(studentUid: string): string {
  const logs = getDetailedLogs(studentUid)

  if (logs.length === 0) {
    return ''
  }

  const headers = [
    'Session',
    'Round',
    'Problem ID',
    'Display',
    'Student Answer',
    'Correct Answer',
    'Correct',
    'Response Time (ms)',
    'Proficiency Before',
    'Proficiency After',
  ]

  const rows: any[] = []

  logs.forEach((log) => {
    // Diagnostic problems
    log.diagnostic.problems.forEach((p) => {
      rows.push([
        log.sessionNumber,
        'Diagnostic',
        p.problemId,
        p.display,
        p.studentAnswer,
        p.correctAnswer,
        p.correct ? 'Yes' : 'No',
        p.responseTime,
        'N/A',
        'N/A',
      ])
    })

    // Round 2 problems
    log.round2.problems.forEach((p) => {
      rows.push([
        log.sessionNumber,
        'Round 2',
        p.problemId,
        p.display,
        p.studentAnswer,
        p.correctAnswer,
        p.correct ? 'Yes' : 'No',
        p.responseTime,
        p.proficiencyBefore,
        p.proficiencyAfter,
      ])
    })

    // Round 3 problems
    log.round3.problems.forEach((p) => {
      rows.push([
        log.sessionNumber,
        'Round 3',
        p.problemId,
        p.display,
        p.studentAnswer,
        p.correctAnswer,
        p.correct ? 'Yes' : 'No',
        p.responseTime,
        'N/A',
        'N/A',
      ])
    })
  })

  return [headers, ...rows].map((row) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n')
}

/**
 * Download CSV
 */
export function downloadDetailedCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================================
// CONSOLE HELPER
// ============================================================================

/**
 * Print available commands
 */
export function printDebugCommands(): void {
  console.group('🔬 DEBUG MODE COMMANDS')
  console.log('Enable debug for a student:')
  console.log('  enableDebugMode("studentUid")')
  console.log('')
  console.log('Disable debug for a student:')
  console.log('  disableDebugMode("studentUid")')
  console.log('')
  console.log('Check who has debug enabled:')
  console.log('  getDebugEnabledStudents()')
  console.log('')
  console.log('View sessions for a student:')
  console.log('  getDetailedLogs("studentUid")')
  console.log('')
  console.log('Analyze student progression:')
  console.log('  printAnalysis("studentUid")')
  console.log('')
  console.log('Export to CSV:')
  console.log('  const csv = exportDetailedLogsToCSV("studentUid")')
  console.log('  downloadDetailedCSV(csv, "student-sessions.csv")')
  console.log('')
  console.log('Export problem details:')
  console.log('  const csv = exportProblemDetailsToCSV("studentUid")')
  console.log('  downloadDetailedCSV(csv, "student-problems.csv")')
  console.groupEnd()
}

// Auto-print commands on import
console.log('🔬 Detailed Debug Logger loaded. Type printDebugCommands() for usage.')



