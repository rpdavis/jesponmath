/**
 * Acceleration Logger Utility
 * Tracks placement decisions and progression for testing/debugging
 * Phase 1: In-memory logging for development
 */

import type { OperationType, SubLevel } from '@/types/mathFluency'

export interface PlacementDecision {
  studentUid: string
  studentName: string
  timestamp: Date
  diagnosticResults: {
    operation: OperationType
    proficiencyPercentage: number
    accuracy: number
    problemsTested: number
    problemsCorrect: number
    averageResponseTime?: number
  }[]
  placement: {
    operation: OperationType
    startingSubLevel: SubLevel | null
    levelsSkipped: number
    skippedLevels: SubLevel[]
    reason: string
  }
  crossOperationAnalysis?: {
    recommendation: OperationType
    operationsSkipped: OperationType[]
    timeEstimateSaved: string
  }
}

export interface AdvancementEvent {
  studentUid: string
  studentName: string
  timestamp: Date
  operation: OperationType
  previousSubLevel: SubLevel
  newSubLevel: SubLevel
  proficiencyAtAdvancement: number
  thresholdUsed: number
  mode: 'fast-track' | 'high-performer' | 'standard'
  sessionNumber: number
}

export interface SessionMetrics {
  studentUid: string
  studentName: string
  timestamp: Date
  operation: OperationType
  currentSubLevel: SubLevel
  diagnosticScore: number
  diagnosticTotal: number
  round1Skipped: boolean
  round2Problems: number
  round2Correct: number
  round3Problems: number
  round3Correct: number
  fastTrackMode: boolean
  advancementTriggered: boolean
  newSubLevel: SubLevel | null
  sessionDuration: number // seconds
}

// ============================================================================
// IN-MEMORY STORAGE (Development/Testing)
// ============================================================================

const placementLog: PlacementDecision[] = []
const advancementLog: AdvancementEvent[] = []
const sessionLog: SessionMetrics[] = []

const MAX_LOG_SIZE = 50 // Keep last 50 entries

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log a placement decision
 */
export function logPlacementDecision(decision: PlacementDecision): void {
  placementLog.push(decision)
  if (placementLog.length > MAX_LOG_SIZE) {
    placementLog.shift()
  }

  console.group('📝 PLACEMENT DECISION LOGGED')
  console.log('Student:', decision.studentName)
  console.log('Diagnostic Results:', decision.diagnosticResults)
  console.log('Placement:', decision.placement)
  if (decision.crossOperationAnalysis) {
    console.log('Cross-Operation:', decision.crossOperationAnalysis)
  }
  console.groupEnd()
}

/**
 * Log an advancement event
 */
export function logAdvancement(event: AdvancementEvent): void {
  advancementLog.push(event)
  if (advancementLog.length > MAX_LOG_SIZE) {
    advancementLog.shift()
  }

  console.log('📈 ADVANCEMENT LOGGED', {
    student: event.studentName,
    from: event.previousSubLevel,
    to: event.newSubLevel,
    proficiency: `${event.proficiencyAtAdvancement}%`,
    threshold: `${event.thresholdUsed}%`,
    mode: event.mode,
    session: event.sessionNumber,
  })
}

/**
 * Log a session's metrics
 */
export function logSession(metrics: SessionMetrics): void {
  sessionLog.push(metrics)
  if (sessionLog.length > MAX_LOG_SIZE) {
    sessionLog.shift()
  }

  console.group('✅ SESSION COMPLETE')
  console.log('Student:', metrics.studentName)
  console.log('Current Level:', metrics.currentSubLevel)
  console.log('Diagnostic:', `${metrics.diagnosticScore}/${metrics.diagnosticTotal}`)
  console.log('Round 2:', `${metrics.round2Correct}/${metrics.round2Problems}`)
  console.log('Round 3:', `${metrics.round3Correct}/${metrics.round3Problems}`)
  console.log('Fast-Track Mode:', metrics.fastTrackMode ? 'YES' : 'NO')
  if (metrics.advancementTriggered) {
    console.log('🎉 ADVANCED TO:', metrics.newSubLevel)
  }
  console.log('Duration:', `${Math.round(metrics.sessionDuration / 60)} minutes`)
  console.groupEnd()
}

// ============================================================================
// RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get recent placement decisions
 */
export function getRecentPlacements(count: number = 10): PlacementDecision[] {
  return placementLog.slice(-count).reverse()
}

/**
 * Get recent advancements
 */
export function getRecentAdvancements(count: number = 10): AdvancementEvent[] {
  return advancementLog.slice(-count).reverse()
}

/**
 * Get recent sessions
 */
export function getRecentSessions(count: number = 10): SessionMetrics[] {
  return sessionLog.slice(-count).reverse()
}

/**
 * Get all logs for a specific student
 */
export function getStudentLogs(studentUid: string): {
  placements: PlacementDecision[]
  advancements: AdvancementEvent[]
  sessions: SessionMetrics[]
} {
  return {
    placements: placementLog.filter((p) => p.studentUid === studentUid),
    advancements: advancementLog.filter((a) => a.studentUid === studentUid),
    sessions: sessionLog.filter((s) => s.studentUid === studentUid),
  }
}

/**
 * Clear all logs (useful for testing)
 */
export function clearLogs(): void {
  placementLog.length = 0
  advancementLog.length = 0
  sessionLog.length = 0
  console.log('🗑️ All acceleration logs cleared')
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export placements to CSV
 */
export function exportPlacementsToCSV(): string {
  if (placementLog.length === 0) return ''

  const headers = [
    'Student Name',
    'Student UID',
    'Timestamp',
    'Operations Tested',
    'Starting Operation',
    'Starting Level',
    'Levels Skipped',
    'Operations Skipped',
    'Time Saved',
    'Reason',
  ]

  const rows = placementLog.map((p) => [
    p.studentName,
    p.studentUid,
    p.timestamp.toISOString(),
    p.diagnosticResults
      .map((r) => `${r.operation}:${(r.proficiencyPercentage * 100).toFixed(1)}%`)
      .join('; '),
    p.placement.operation,
    p.placement.startingSubLevel || 'N/A',
    p.placement.levelsSkipped,
    p.crossOperationAnalysis?.operationsSkipped.join(', ') || 'None',
    p.crossOperationAnalysis?.timeEstimateSaved || 'N/A',
    p.placement.reason,
  ])

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

/**
 * Export advancements to CSV
 */
export function exportAdvancementsToCSV(): string {
  if (advancementLog.length === 0) return ''

  const headers = [
    'Student Name',
    'Student UID',
    'Timestamp',
    'Operation',
    'From Level',
    'To Level',
    'Proficiency',
    'Threshold',
    'Mode',
    'Session Number',
  ]

  const rows = advancementLog.map((a) => [
    a.studentName,
    a.studentUid,
    a.timestamp.toISOString(),
    a.operation,
    a.previousSubLevel,
    a.newSubLevel,
    `${a.proficiencyAtAdvancement}%`,
    `${a.thresholdUsed}%`,
    a.mode,
    a.sessionNumber,
  ])

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

/**
 * Export sessions to CSV
 */
export function exportSessionsToCSV(): string {
  if (sessionLog.length === 0) return ''

  const headers = [
    'Student Name',
    'Student UID',
    'Timestamp',
    'Operation',
    'Current Level',
    'Diagnostic Score',
    'Round 2 Score',
    'Round 3 Score',
    'Fast-Track',
    'Advanced',
    'Duration (min)',
  ]

  const rows = sessionLog.map((s) => [
    s.studentName,
    s.studentUid,
    s.timestamp.toISOString(),
    s.operation,
    s.currentSubLevel,
    `${s.diagnosticScore}/${s.diagnosticTotal}`,
    `${s.round2Correct}/${s.round2Problems}`,
    `${s.round3Correct}/${s.round3Problems}`,
    s.fastTrackMode ? 'Yes' : 'No',
    s.advancementTriggered ? 'Yes' : 'No',
    Math.round(s.sessionDuration / 60),
  ])

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================

/**
 * Get summary statistics
 */
export function getSummaryStats(): {
  totalPlacements: number
  studentsAccelerated: number
  averageLevelsSkipped: number
  crossOperationSkips: number
  totalAdvancements: number
  fastTrackAdvancements: number
  totalSessions: number
  averageSessionDuration: number
} {
  const studentsAccelerated = placementLog.filter((p) => p.placement.levelsSkipped > 0).length
  const crossOperationSkips = placementLog.filter(
    (p) => p.crossOperationAnalysis && p.crossOperationAnalysis.operationsSkipped.length > 0,
  ).length
  const fastTrackAdvancements = advancementLog.filter((a) => a.mode === 'fast-track').length

  const avgLevelsSkipped =
    studentsAccelerated > 0
      ? placementLog.reduce((sum, p) => sum + p.placement.levelsSkipped, 0) / studentsAccelerated
      : 0

  const avgSessionDuration =
    sessionLog.length > 0
      ? sessionLog.reduce((sum, s) => sum + s.sessionDuration, 0) / sessionLog.length
      : 0

  return {
    totalPlacements: placementLog.length,
    studentsAccelerated,
    averageLevelsSkipped: Math.round(avgLevelsSkipped * 10) / 10,
    crossOperationSkips,
    totalAdvancements: advancementLog.length,
    fastTrackAdvancements,
    totalSessions: sessionLog.length,
    averageSessionDuration: Math.round(avgSessionDuration / 60), // minutes
  }
}

/**
 * Print summary to console
 */
export function printSummary(): void {
  const stats = getSummaryStats()

  console.group('📊 ACCELERATION SUMMARY')
  console.log('Total Placements:', stats.totalPlacements)
  console.log('Students Accelerated:', stats.studentsAccelerated)
  console.log('Average Levels Skipped:', stats.averageLevelsSkipped)
  console.log('Cross-Operation Skips:', stats.crossOperationSkips)
  console.log('Total Advancements:', stats.totalAdvancements)
  console.log('Fast-Track Advancements:', stats.fastTrackAdvancements)
  console.log('Total Sessions:', stats.totalSessions)
  console.log('Average Session Duration:', `${stats.averageSessionDuration} minutes`)
  console.groupEnd()
}
