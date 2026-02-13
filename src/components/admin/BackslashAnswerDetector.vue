<template>
  <div class="backslash-detector">
    <div class="header">
      <h1>🔍 Backslash Answer Detector</h1>
      <p>Find student answers that may have been marked incorrect due to backslash usage in fractions</p>
    </div>

    <!-- Scan Controls -->
    <div class="scan-section">
      <div class="scan-info">
        <p>This tool scans all assessment results to find answers containing backslashes (\) that may have been intended as fractions (/).</p>
        <p><strong>Note:</strong> Future answers will automatically convert \ to / as students type.</p>
      </div>

      <button
        @click="scanResults"
        :disabled="isScanning"
        class="scan-button"
      >
        <span v-if="isScanning">🔄 Scanning {{ scannedCount }} results...</span>
        <span v-else>🔍 Scan All Assessment Results</span>
      </button>
    </div>

    <!-- Results Display -->
    <div v-if="affectedResults.length > 0" class="results-section">
      <div class="results-header">
        <h2>📊 Found {{ affectedResults.length }} Results with Backslashes</h2>
        <div class="summary-stats">
          <div class="stat">
            <strong>{{ uniqueAssessments.size }}</strong> assessments affected
          </div>
          <div class="stat">
            <strong>{{ uniqueStudents.size }}</strong> students affected
          </div>
          <div class="stat">
            <strong>{{ incorrectCount }}</strong> marked incorrect
          </div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="filter-controls">
        <label>
          <input type="checkbox" v-model="showOnlyIncorrect" />
          Show only incorrectly marked answers
        </label>
        <div v-if="filteredResults.length > 0" class="selection-info">
          <span>{{ selectedCount }} selected</span>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="filteredResults.length > 0" class="bulk-actions">
        <button
          @click="fixSelectedResults"
          :disabled="selectedCount === 0 || isFixing"
          class="fix-button"
        >
          <span v-if="isFixing">🔄 Fixing {{ fixingProgress }}/{{ selectedCount }}...</span>
          <span v-else>🔧 Fix {{ selectedCount }} Selected Result{{ selectedCount !== 1 ? 's' : '' }}</span>
        </button>
        <div class="fix-warning">
          ⚠️ This will replace \ with / and re-grade selected answers. Cannot be undone.
        </div>
      </div>

      <!-- Results Table -->
      <div class="results-table-container">
        <table class="results-table">
          <thead>
            <tr>
              <th class="checkbox-col">
                <input
                  type="checkbox"
                  :checked="allFilteredSelected"
                  :indeterminate="someFilteredSelected"
                  @change="toggleSelectAll"
                  title="Select all"
                />
              </th>
              <th>Assessment</th>
              <th>Student</th>
              <th>Question</th>
              <th>Student Answer</th>
              <th>Corrected Answer</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredResults" :key="item.id" :class="{ 'incorrect': !item.isCorrect, 'selected': selectedResults.has(item.id) }">
              <td class="checkbox-col">
                <input
                  type="checkbox"
                  :checked="selectedResults.has(item.id)"
                  @change="toggleSelectResult(item.id)"
                />
              </td>
              <td>
                <div class="assessment-info">
                  <strong>{{ item.assessmentTitle }}</strong>
                  <small>{{ item.assessmentId.substring(0, 8) }}...</small>
                </div>
              </td>
              <td>
                <div class="student-info">
                  <strong>{{ item.studentName || 'Unknown' }}</strong>
                  <small>{{ item.studentUid.substring(0, 8) }}...</small>
                </div>
              </td>
              <td>
                <div class="question-preview" :title="item.questionText">
                  {{ truncate(item.questionText, 60) }}
                </div>
              </td>
              <td>
                <code class="answer-text backslash-highlight">{{ item.studentAnswer }}</code>
              </td>
              <td>
                <code class="answer-text corrected">{{ item.correctedAnswer }}</code>
              </td>
              <td>
                <span class="status-badge" :class="item.isCorrect ? 'correct' : 'incorrect'">
                  {{ item.isCorrect ? '✅ Correct' : '❌ Incorrect' }}
                </span>
              </td>
              <td>
                <button
                  @click="viewResult(item.resultId)"
                  class="view-button"
                  title="View and edit this result"
                >
                  👁️ View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Export Options -->
      <div class="export-section">
        <button @click="exportToCSV" class="export-button">
          📥 Export to CSV
        </button>
        <button @click="copyToClipboard" class="copy-button">
          📋 Copy Assessment IDs
        </button>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="hasScanned && affectedResults.length === 0" class="no-results">
      <h2>✅ No Issues Found!</h2>
      <p>All {{ scannedCount }} assessment results are free of backslash issues.</p>
    </div>

    <!-- Progress Log -->
    <div v-if="logMessages.length > 0" class="log-section">
      <h3>📋 Scan Log</h3>
      <div class="log-messages">
        <div v-for="(msg, idx) in logMessages" :key="idx" class="log-message">
          {{ msg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, getDocs, query, doc, getDoc, updateDoc } from 'firebase/firestore'
import { areAnswersEquivalent, areAnswersEquivalentBasic, areFractionsEquivalent } from '@/utils/answerUtils'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

interface AffectedResult {
  id: string
  resultId: string
  assessmentId: string
  assessmentTitle: string
  studentUid: string
  studentName: string
  questionId: string
  questionText: string
  studentAnswer: string
  correctedAnswer: string
  isCorrect: boolean
  correctAnswerFromQuestion?: string  // The expected correct answer
  acceptEquivalentFractions?: boolean // Whether to accept equivalent fractions
}

const isScanning = ref(false)
const hasScanned = ref(false)
const scannedCount = ref(0)
const affectedResults = ref<AffectedResult[]>([])
const logMessages = ref<string[]>([])
const showOnlyIncorrect = ref(true)
const isFixing = ref(false)
const fixingProgress = ref(0)
const selectedResults = ref<Set<string>>(new Set())

const uniqueAssessments = computed(() => {
  return new Set(affectedResults.value.map(r => r.assessmentId))
})

const uniqueStudents = computed(() => {
  return new Set(affectedResults.value.map(r => r.studentUid))
})

const incorrectCount = computed(() => {
  return affectedResults.value.filter(r => !r.isCorrect).length
})

const filteredResults = computed(() => {
  if (showOnlyIncorrect.value) {
    return affectedResults.value.filter(r => !r.isCorrect)
  }
  return affectedResults.value
})

const allFilteredSelected = computed(() => {
  return filteredResults.value.length > 0 &&
         filteredResults.value.every(r => selectedResults.value.has(r.id))
})

const someFilteredSelected = computed(() => {
  return filteredResults.value.some(r => selectedResults.value.has(r.id)) &&
         !allFilteredSelected.value
})

const selectedCount = computed(() => {
  return selectedResults.value.size
})

const log = (message: string) => {
  logMessages.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
  console.log(message)
}

const toggleSelectAll = () => {
  if (allFilteredSelected.value) {
    // Deselect all filtered results
    filteredResults.value.forEach(r => selectedResults.value.delete(r.id))
  } else {
    // Select all filtered results
    filteredResults.value.forEach(r => selectedResults.value.add(r.id))
  }
}

const toggleSelectResult = (resultId: string) => {
  if (selectedResults.value.has(resultId)) {
    selectedResults.value.delete(resultId)
  } else {
    selectedResults.value.add(resultId)
  }
}

const truncate = (text: string, length: number): string => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const containsBackslash = (answer: string | string[]): boolean => {
  if (Array.isArray(answer)) {
    return answer.some(a => typeof a === 'string' && a.includes('\\'))
  }
  return typeof answer === 'string' && answer.includes('\\')
}

const correctBackslash = (answer: string | string[]): string => {
  if (Array.isArray(answer)) {
    return answer.map(a => typeof a === 'string' ? a.replace(/\\/g, '/') : a).join(', ')
  }
  return typeof answer === 'string' ? answer.replace(/\\/g, '/') : String(answer)
}

const scanResults = async () => {
  isScanning.value = true
  hasScanned.value = false
  scannedCount.value = 0
  affectedResults.value = []
  logMessages.value = []

  try {
    log('🚀 Starting scan of assessment results...')

    // Get all assessment results
    const resultsSnapshot = await getDocs(collection(db, 'assessmentResults'))
    log(`📦 Found ${resultsSnapshot.size} total assessment results`)

    // Cache for assessments and students
    const assessmentCache = new Map<string, any>()
    const studentCache = new Map<string, any>()

    for (const resultDoc of resultsSnapshot.docs) {
      scannedCount.value++
      const result = resultDoc.data()

      if (!result.responses || !Array.isArray(result.responses)) {
        continue
      }

      // Check each response for backslashes
      for (const response of result.responses) {
        if (containsBackslash(response.studentAnswer)) {
          // Get assessment details
          let assessment = assessmentCache.get(result.assessmentId)
          if (!assessment) {
            const assessmentDoc = await getDoc(doc(db, 'assessments', result.assessmentId))
            if (assessmentDoc.exists()) {
              assessment = assessmentDoc.data()
              assessmentCache.set(result.assessmentId, assessment)
            }
          }

          // Get student details
          let student = studentCache.get(result.studentUid)
          if (!student) {
            const studentDoc = await getDoc(doc(db, 'users', result.studentUid))
            if (studentDoc.exists()) {
              student = studentDoc.data()
              studentCache.set(result.studentUid, student)
            }
          }

          // Format student name with fallbacks
          let studentName = 'Unknown Student'
          if (student) {
            if (student.displayName) {
              studentName = student.displayName
            } else if (student.firstName || student.lastName) {
              studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim()
            } else if (student.email) {
              studentName = student.email.split('@')[0] // Use email username as fallback
            }
          }

          // Find the question text and correct answer
          const question = assessment?.questions?.find((q: any) => q.id === response.questionId)

          affectedResults.value.push({
            id: `${resultDoc.id}_${response.questionId}`,
            resultId: resultDoc.id,
            assessmentId: result.assessmentId,
            assessmentTitle: assessment?.title || 'Unknown Assessment',
            studentUid: result.studentUid,
            studentName: studentName,
            questionId: response.questionId,
            questionText: question?.questionText || 'Question not found',
            studentAnswer: Array.isArray(response.studentAnswer)
              ? response.studentAnswer.join(', ')
              : String(response.studentAnswer),
            correctedAnswer: correctBackslash(response.studentAnswer),
            isCorrect: response.isCorrect,
            correctAnswerFromQuestion: question?.correctAnswer,
            acceptEquivalentFractions: question?.acceptEquivalentFractions ?? true
          })
        }
      }
    }

    log(`✅ Scan complete! Found ${affectedResults.value.length} responses with backslashes`)
    log(`   - ${uniqueAssessments.value.size} unique assessments affected`)
    log(`   - ${uniqueStudents.value.size} unique students affected`)
    log(`   - ${incorrectCount.value} marked incorrect`)

    hasScanned.value = true
  } catch (error) {
    log(`❌ Error during scan: ${error}`)
    console.error(error)
  } finally {
    isScanning.value = false
  }
}

const viewResult = (resultId: string) => {
  router.push(`/assessment-result/${resultId}`)
}

const exportToCSV = () => {
  const headers = ['Assessment ID', 'Assessment Title', 'Student UID', 'Student Name', 'Question ID', 'Question Text', 'Student Answer', 'Corrected Answer', 'Status']
  const rows = filteredResults.value.map(item => [
    item.assessmentId,
    item.assessmentTitle,
    item.studentUid,
    item.studentName,
    item.questionId,
    `"${item.questionText.replace(/"/g, '""')}"`,
    `"${item.studentAnswer}"`,
    `"${item.correctedAnswer}"`,
    item.isCorrect ? 'Correct' : 'Incorrect'
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `backslash-issues-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)

  log('📥 Exported to CSV')
}

const copyToClipboard = () => {
  const assessmentIds = Array.from(uniqueAssessments.value).join('\n')
  navigator.clipboard.writeText(assessmentIds)
  alert(`Copied ${uniqueAssessments.value.size} assessment IDs to clipboard!`)
  log('📋 Copied assessment IDs to clipboard')
}

const fixSelectedResults = async () => {
  if (selectedResults.value.size === 0) {
    alert('Please select at least one result to fix')
    return
  }

  const resultsToFix = affectedResults.value.filter(r => selectedResults.value.has(r.id))
  const confirmMessage = `Fix ${resultsToFix.length} selected results by:\n\n` +
    `1. Replacing \\ with / in student answers\n` +
    `2. Re-grading the answer\n` +
    `3. Updating points if now correct\n\n` +
    `This cannot be undone. Continue?`

  if (!confirm(confirmMessage)) {
    return
  }

  isFixing.value = true
  fixingProgress.value = 0
  let fixedCount = 0
  let errorCount = 0

  try {
    log(`🔧 Starting bulk fix for ${resultsToFix.length} results...`)

    for (let i = 0; i < resultsToFix.length; i++) {
      const item = resultsToFix[i]
      fixingProgress.value = i + 1

      try {
        // Get the full result document
        const resultRef = doc(db, 'assessmentResults', item.resultId)
        const resultDoc = await getDoc(resultRef)

        if (!resultDoc.exists()) {
          log(`❌ Result ${item.resultId} not found`)
          errorCount++
          continue
        }

        const resultData = resultDoc.data()
        const responses = [...resultData.responses]

        // Find the specific response to fix
        const responseIndex = responses.findIndex(r => r.questionId === item.questionId)
        if (responseIndex === -1) {
          log(`❌ Response for question ${item.questionId} not found in result ${item.resultId}`)
          errorCount++
          continue
        }

        const response = responses[responseIndex]

        // Correct the answer
        const correctedAnswer = correctBackslash(response.studentAnswer)

        // Re-grade using the corrected answer
        let isNowCorrect = response.isCorrect // Keep existing if no correct answer to compare
        let newPoints = response.pointsEarned

        if (item.correctAnswerFromQuestion) {
          // Use the same logic as AssessmentTaking to check correctness
          if (item.acceptEquivalentFractions) {
            isNowCorrect = areAnswersEquivalent(correctedAnswer, item.correctAnswerFromQuestion)
          } else {
            isNowCorrect = areAnswersEquivalentBasic(correctedAnswer, item.correctAnswerFromQuestion)
            // If basic check failed but equivalent fractions flag is false, still check fractions
            if (!isNowCorrect && areFractionsEquivalent(correctedAnswer, item.correctAnswerFromQuestion)) {
              isNowCorrect = true
            }
          }

          // Update points based on correctness
          if (isNowCorrect && response.pointsEarned === 0) {
            // Get question to find max points
            const assessmentDoc = await getDoc(doc(db, 'assessments', item.assessmentId))
            if (assessmentDoc.exists()) {
              const assessment = assessmentDoc.data()
              const question = assessment.questions?.find((q: any) => q.id === item.questionId)
              if (question) {
                newPoints = question.points || 1
              }
            }
          }
        }

        // Update the response
        responses[responseIndex] = {
          ...response,
          studentAnswer: correctedAnswer,
          isCorrect: isNowCorrect,
          pointsEarned: newPoints,
          regraded: true,
          regradedAt: new Date(),
          regradedBy: authStore.currentUser?.email || 'admin',
          manuallyAdjusted: true,
          adjustedBy: authStore.currentUser?.email || 'admin',
          adjustedAt: new Date(),
          adjustmentReason: 'Backslash auto-corrected to forward slash'
        }

        // Recalculate total score
        const totalEarned = responses.reduce((sum, r) => sum + (r.pointsEarned || 0), 0)
        const totalPossible = resultData.totalPoints || 0
        const newScore = totalEarned
        const newPercentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0

        // Update in Firestore
        await updateDoc(resultRef, {
          responses: responses,
          score: newScore,
          percentage: newPercentage,
          lastModified: new Date(),
          modifiedBy: authStore.currentUser?.email || 'admin'
        })

        log(`✅ Fixed: ${item.studentName} - ${item.assessmentTitle.substring(0, 30)}... (${response.pointsEarned} → ${newPoints} pts)`)
        fixedCount++

        // Remove from selected set
        selectedResults.value.delete(item.id)

      } catch (error) {
        log(`❌ Error fixing result ${item.resultId}: ${error}`)
        console.error(error)
        errorCount++
      }
    }

    log(`\n✅ Bulk fix complete!`)
    log(`   - ${fixedCount} results fixed successfully`)
    if (errorCount > 0) {
      log(`   - ${errorCount} errors encountered`)
    }

    alert(`Fixed ${fixedCount} results successfully!${errorCount > 0 ? `\n${errorCount} errors occurred (check log).` : ''}`)

    // Re-scan to update the table
    await scanResults()

  } catch (error) {
    log(`❌ Bulk fix failed: ${error}`)
    console.error(error)
    alert('Bulk fix failed. Check the log for details.')
  } finally {
    isFixing.value = false
    fixingProgress.value = 0
  }
}
</script>

<style scoped>
.backslash-detector {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  color: #1e40af;
  margin-bottom: 10px;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.scan-section {
  background: #f8fafc;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  border: 2px solid #e2e8f0;
}

.scan-info {
  margin-bottom: 20px;
}

.scan-info p {
  margin: 10px 0;
  color: #475569;
}

.scan-button {
  width: 100%;
  padding: 18px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.scan-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.scan-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.results-section {
  background: white;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
}

.results-header {
  background: #f1f5f9;
  padding: 25px;
  border-bottom: 2px solid #e2e8f0;
}

.results-header h2 {
  color: #1e293b;
  margin-bottom: 15px;
}

.summary-stats {
  display: flex;
  gap: 30px;
  margin-top: 15px;
}

.stat {
  padding: 10px 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.stat strong {
  color: #3b82f6;
  font-size: 1.3rem;
  margin-right: 5px;
}

.filter-controls {
  padding: 15px 25px;
  background: #fefefe;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-controls label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
}

.selection-info {
  color: #3b82f6;
  font-weight: 600;
  font-size: 0.95rem;
}

.bulk-actions {
  padding: 20px 25px;
  background: #fef3c7;
  border-bottom: 2px solid #fbbf24;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fix-button {
  padding: 14px 28px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.fix-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

.fix-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.fix-warning {
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 6px;
  border: 1px solid #fbbf24;
}

.results-table-container {
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table thead {
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.results-table th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.results-table th.checkbox-col {
  width: 40px;
  text-align: center;
}

.results-table td.checkbox-col {
  text-align: center;
  width: 40px;
}

.results-table td.checkbox-col input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.results-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.results-table tr.incorrect {
  background: #fef2f2;
}

.results-table tr.selected {
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.results-table tr:hover {
  background: #f8fafc;
}

.results-table tr.selected:hover {
  background: #bfdbfe;
}

.assessment-info, .student-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.assessment-info strong, .student-info strong {
  color: #1e293b;
  font-size: 0.95rem;
}

.assessment-info small, .student-info small {
  color: #94a3b8;
  font-size: 0.8rem;
}

.question-preview {
  max-width: 200px;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.4;
}

.answer-text {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.answer-text.backslash-highlight {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #92400e;
}

.answer-text.corrected {
  background: #d1fae5;
  border: 1px solid #10b981;
  color: #065f46;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.correct {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.incorrect {
  background: #fee2e2;
  color: #991b1b;
}

.view-button {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.view-button:hover {
  background: #2563eb;
}

.export-section {
  padding: 20px 25px;
  background: #f8fafc;
  border-top: 2px solid #e2e8f0;
  display: flex;
  gap: 15px;
}

.export-button, .copy-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.export-button {
  background: #10b981;
  color: white;
}

.export-button:hover {
  background: #059669;
}

.copy-button {
  background: #6366f1;
  color: white;
}

.copy-button:hover {
  background: #4f46e5;
}

.no-results {
  text-align: center;
  padding: 60px 30px;
  background: #f0fdf4;
  border-radius: 12px;
  border: 2px solid #bbf7d0;
}

.no-results h2 {
  color: #166534;
  margin-bottom: 10px;
}

.no-results p {
  color: #15803d;
  font-size: 1.1rem;
}

.log-section {
  margin-top: 30px;
  background: #1e293b;
  padding: 20px;
  border-radius: 8px;
  color: #e2e8f0;
}

.log-section h3 {
  color: #cbd5e1;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.log-messages {
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.log-message {
  padding: 4px 0;
  border-bottom: 1px solid #334155;
  color: #cbd5e1;
}

.log-message:last-child {
  border-bottom: none;
}
</style>
