<template>
  <div class="assessment-results-overview">
    <div class="header">
      <button @click="goBack" class="btn-back">← Back</button>
      <div class="header-info">
        <h1>📊 {{ assessment?.title || 'Assessment Results' }}</h1>
        <p v-if="assessment" class="assessment-meta">
          Grade {{ assessment.gradeLevel }} • {{ assessment.category }} • {{ totalResults }} results
        </p>
      </div>
      <div class="header-actions">
        <button @click="exportToCSV" class="btn btn-secondary">
          📥 Export to CSV
        </button>
        <button @click="printView" class="btn btn-secondary">
          🖨️ Print
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading results...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="loadData" class="btn btn-primary">Try Again</button>
    </div>

    <div v-else-if="classTabs.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No Results Yet</h3>
      <p>No students have completed this assessment yet.</p>
    </div>

    <div v-else class="results-container">
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-value">{{ averageScore }}%</div>
          <div class="stat-label">Average Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalResults }}</div>
          <div class="stat-label">Total Results</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ assessment?.questions.length || 0 }}</div>
          <div class="stat-label">Questions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ hardestQuestionNumber }}</div>
          <div class="stat-label">Hardest Question</div>
        </div>
      </div>

      <!-- Class Tabs -->
      <div class="tabs">
        <button
          v-for="tab in classTabs"
          :key="tab.classId"
          :class="['tab', { active: selectedTab === tab.classId }]"
          @click="selectedTab = tab.classId"
        >
          {{ tab.className }} ({{ tab.studentCount }})
        </button>
      </div>

      <!-- Results Table -->
      <div class="table-container">
        <table class="results-table">
          <thead>
            <tr>
              <th class="student-column">Student</th>
              <th class="score-column">Score</th>
              <th
                v-for="(question, index) in assessment?.questions"
                :key="question.id"
                class="question-column"
                :title="truncateText(question.questionText, 50)"
              >
                Q{{ index + 1 }}
                <div class="question-stats">
                  {{ getQuestionCorrectCount(index) }}/{{ currentTabResults.length }}
                </div>
              </th>
              <th class="action-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in currentTabResults" :key="result.id">
              <td class="student-name">
                <div class="student-info">
                  <span class="name">{{ result.studentName }}</span>
                  <span class="date">{{ formatDate(result.completedAt) }}</span>
                </div>
              </td>
              <td class="score-cell" :class="getScoreClass(result.percentage)">
                <strong>{{ result.percentage }}%</strong>
                <div class="score-fraction">{{ result.score }}/{{ result.totalPoints }}</div>
              </td>
              <td
                v-for="(question, index) in assessment?.questions"
                :key="question.id"
                class="answer-cell"
                :class="getAnswerClass(result, index)"
                @click="showAnswerDetail(result, index)"
              >
                <span class="answer-indicator">
                  {{ getAnswerIndicator(result, index) }}
                </span>
                <div class="points">{{ getPointsEarned(result, index) }}/{{ question.points }}</div>
              </td>
              <td class="action-cell">
                <button
                  @click="viewDetailedResult(result)"
                  class="btn-view"
                  title="View detailed result"
                >
                  👁️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Question Analysis -->
      <div class="question-analysis">
        <h3>📈 Question Analysis</h3>
        <div class="analysis-grid">
          <div
            v-for="(question, index) in assessment?.questions"
            :key="question.id"
            class="analysis-card"
          >
            <div class="question-header">
              <strong>Question {{ index + 1 }}</strong>
              <span class="difficulty-badge" :class="getDifficultyClass(index)">
                {{ getQuestionDifficulty(index) }}
              </span>
            </div>
            <div class="question-text">{{ truncateText(question.questionText, 100) }}</div>
            <div class="question-stats-detail">
              <div class="stat-bar">
                <div
                  class="stat-bar-fill correct"
                  :style="{ width: getQuestionCorrectPercent(index) + '%' }"
                ></div>
              </div>
              <div class="stat-numbers">
                <span class="correct">✓ {{ getQuestionCorrectCount(index) }} correct</span>
                <span class="incorrect">✗ {{ getQuestionIncorrectCount(index) }} incorrect</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Students Section -->
      <div v-if="pendingStudents.length > 0" class="pending-students-section">
        <h3>⏳ Students Assigned But Not Yet Completed ({{ pendingStudents.length }})</h3>

        <div v-if="selectedTab === 'all'" class="pending-by-class">
          <div v-for="group in pendingByClass" :key="group.label" class="pending-class-group">
            <h4 class="pending-class-header">{{ group.label }} <span class="pending-class-count">({{ group.students.length }})</span></h4>
            <div class="pending-students-grid">
              <div v-for="student in group.students" :key="student.uid" class="pending-student-card">
                <div class="student-icon">👤</div>
                <div class="student-details">
                  <div class="student-name-pending">{{ student.name }}</div>
                </div>
                <div class="status-badge pending">Not Started</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="pending-students-grid">
          <div v-for="student in pendingStudents" :key="student.uid" class="pending-student-card">
            <div class="student-icon">👤</div>
            <div class="student-details">
              <div class="student-name-pending">{{ student.name }}</div>
            </div>
            <div class="status-badge pending">Not Started</div>
          </div>
        </div>

        <div class="pending-info">
          <p>💡 <strong>Tip:</strong> These students have been assigned the assessment but haven't submitted their work yet.</p>
        </div>
      </div>

      <div v-else-if="totalResults > 0" class="all-complete-message">
        <div class="success-icon">✅</div>
        <h3>All Students Have Completed!</h3>
        <p>{{ totalResults }} out of {{ totalAssigned }} assigned students have submitted their work.</p>
      </div>
    </div>

    <!-- Answer Detail Modal -->
    <div v-if="showAnswerModal" class="modal-overlay" @click="showAnswerModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Answer Details</h3>
          <button @click="showAnswerModal = false" class="btn-close">✕</button>
        </div>
        <div v-if="selectedAnswer" class="modal-body">
          <div class="detail-row">
            <strong>Student:</strong> {{ selectedAnswer.studentName }}
          </div>
          <div class="detail-row">
            <strong>Question:</strong> {{ selectedAnswer.question }}
          </div>
          <div class="detail-row">
            <strong>Student Answer:</strong>
            <span class="student-answer">{{ selectedAnswer.studentAnswer || '(No answer)' }}</span>
          </div>
          <div class="detail-row">
            <strong>Correct Answer:</strong>
            <span class="correct-answer">{{ selectedAnswer.correctAnswer }}</span>
          </div>
          <div class="detail-row">
            <strong>Points:</strong>
            {{ selectedAnswer.pointsEarned }}/{{ selectedAnswer.pointsPossible }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAssessment, getAssessmentResults } from '@/firebase/iepServices'
import { getAllStudents } from '@/firebase/userServices'
import { getAssessmentAssignments } from '@/firebase/assignmentServices'
import type { Assessment, AssessmentResult } from '@/types/iep'

const route = useRoute()
const router = useRouter()

const assessmentId = route.params.assessmentId as string
const assessment = ref<Assessment | null>(null)
const results = ref<(AssessmentResult & { studentName: string; className: string; period: string })[]>([])
const students = ref<any[]>([])
const assignedStudents = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const selectedTab = ref('all')
const showAnswerModal = ref(false)
const selectedAnswer = ref<any>(null)

// Computed
const totalResults = computed(() => results.value.length)

const totalAssigned = computed(() => assignedStudents.value.length)

const pendingStudents = computed(() => {
  const completedUids = new Set(results.value.map(r => r.studentUid))
  let pending = assignedStudents.value
    .filter(student => !completedUids.has(student.uid))
    .map(student => ({
      uid: student.uid,
      name: student.displayName || (student.lastName ? `${student.lastName}, ${student.firstName}` : 'Unknown Student'),
      email: student.email || '',
      className: student.courseName || student.className || 'Unknown',
      period: student.section || student.period || '?'
    }))

  if (selectedTab.value !== 'all') {
    const [tabClass, tabPeriod] = selectedTab.value.split('||')
    pending = pending.filter(s => s.className === tabClass && s.period === tabPeriod)
  }

  return pending
})

const pendingByClass = computed(() => {
  const groups = new Map<string, typeof pendingStudents.value>()
  pendingStudents.value.forEach(s => {
    const key = `${s.className} - P${s.period}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  })
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, students]) => ({ label, students }))
})

const averageScore = computed(() => {
  if (results.value.length === 0) return 0
  const sum = results.value.reduce((acc, r) => acc + (r.percentage || 0), 0)
  return Math.round(sum / results.value.length)
})

const classTabs = computed(() => {
  const tabs: Array<{ classId: string; className: string; studentCount: number }> = []

  tabs.push({
    classId: 'all',
    className: 'All Students',
    studentCount: results.value.length
  })

  const groupMap = new Map<string, { className: string; period: string; count: number }>()
  results.value.forEach(r => {
    const key = `${r.className}||${r.period}`
    if (!groupMap.has(key)) {
      groupMap.set(key, { className: r.className, period: r.period, count: 0 })
    }
    groupMap.get(key)!.count++
  })

  // Also count assigned students not in results
  assignedStudents.value.forEach(s => {
    const className = s.courseName || s.className || 'Unknown'
    const period = s.section || s.period || '?'
    const key = `${className}||${period}`
    if (!groupMap.has(key)) {
      groupMap.set(key, { className, period, count: 0 })
    }
  })

  Array.from(groupMap.entries())
    .sort(([, a], [, b]) => a.className.localeCompare(b.className) || a.period.localeCompare(b.period))
    .forEach(([key, info]) => {
      tabs.push({
        classId: key,
        className: `${info.className} - P${info.period}`,
        studentCount: info.count
      })
    })

  return tabs
})

const currentTabResults = computed(() => {
  if (selectedTab.value === 'all') {
    return results.value
  }
  return results.value.filter(r => `${r.className}||${r.period}` === selectedTab.value)
})

const hardestQuestionNumber = computed(() => {
  if (!assessment.value || results.value.length === 0) return '-'
  
  let worstIndex = 0
  let worstPercent = 100
  
  assessment.value.questions.forEach((_, index) => {
    const percent = getQuestionCorrectPercent(index)
    if (percent < worstPercent) {
      worstPercent = percent
      worstIndex = index
    }
  })
  
  return worstIndex + 1
})

// Methods
const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    // Load assessment
    const loadedAssessment = await getAssessment(assessmentId)
    if (!loadedAssessment) {
      throw new Error('Assessment not found')
    }
    assessment.value = loadedAssessment

    // Load all results for this assessment
    const allResults = await getAssessmentResults(assessmentId)
    results.value = allResults.filter((r: AssessmentResult) => r.assessmentId === assessmentId)

    // Load student info
    const allStudents = await getAllStudents()
    students.value = allStudents

    // Load assigned students
    const assignments = await getAssessmentAssignments(assessmentId)
    const assignedUids = assignments.map((a: any) => a.studentUid)
    assignedStudents.value = allStudents.filter((s: any) => assignedUids.includes(s.uid))

    // Enrich results with student names and class info
    results.value = results.value.map((result: AssessmentResult) => {
      const student = students.value.find((s: any) => s.uid === result.studentUid)
      return {
        ...result,
        studentName: student?.displayName || student?.lastName ? `${student.lastName}, ${student.firstName}` : 'Unknown Student',
        className: student?.courseName || student?.className || 'Unknown',
        period: student?.section || student?.period || '?'
      }
    })

    console.log('✅ Loaded assessment results:', results.value.length)
    console.log('📋 Total assigned:', assignedStudents.value.length)
    console.log('⏳ Pending:', assignedStudents.value.length - results.value.length)
  } catch (err: any) {
    console.error('❌ Error loading data:', err)
    error.value = err.message || 'Failed to load results'
  } finally {
    loading.value = false
  }
}

const getAnswerIndicator = (result: AssessmentResult & { studentName: string; className: string; period: string }, questionIndex: number): string => {
  const response = result.responses?.[questionIndex]
  if (!response) return '—'
  return response.isCorrect ? '✓' : '✗'
}

const getAnswerClass = (result: AssessmentResult & { studentName: string; className: string; period: string }, questionIndex: number): string => {
  const response = result.responses?.[questionIndex]
  if (!response) return 'no-answer'
  return response.isCorrect ? 'correct' : 'incorrect'
}

const getPointsEarned = (result: AssessmentResult & { studentName: string; className: string; period: string }, questionIndex: number): number => {
  const response = result.responses?.[questionIndex]
  return response?.pointsEarned || 0
}

const getQuestionCorrectCount = (questionIndex: number): number => {
  return currentTabResults.value.filter(result => {
    const response = result.responses?.[questionIndex]
    return response?.isCorrect === true
  }).length
}

const getQuestionIncorrectCount = (questionIndex: number): number => {
  return currentTabResults.value.length - getQuestionCorrectCount(questionIndex)
}

const getQuestionCorrectPercent = (questionIndex: number): number => {
  if (currentTabResults.value.length === 0) return 0
  return Math.round((getQuestionCorrectCount(questionIndex) / currentTabResults.value.length) * 100)
}

const getQuestionDifficulty = (questionIndex: number): string => {
  const percent = getQuestionCorrectPercent(questionIndex)
  if (percent >= 80) return 'Easy'
  if (percent >= 60) return 'Medium'
  return 'Hard'
}

const getDifficultyClass = (questionIndex: number): string => {
  const difficulty = getQuestionDifficulty(questionIndex)
  return difficulty.toLowerCase()
}

const getScoreClass = (percentage: number): string => {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 80) return 'good'
  if (percentage >= 70) return 'fair'
  if (percentage >= 60) return 'poor'
  return 'failing'
}

const showAnswerDetail = (result: AssessmentResult & { studentName: string; className: string; period: string }, questionIndex: number) => {
  const question = assessment.value?.questions[questionIndex]
  const response = result.responses?.[questionIndex]
  
  if (!question || !response) return

  selectedAnswer.value = {
    studentName: result.studentName,
    question: question.questionText,
    studentAnswer: response.studentAnswer,
    correctAnswer: question.correctAnswer,
    pointsEarned: response.pointsEarned || 0,
    pointsPossible: question.points
  }
  
  showAnswerModal.value = true
}

const viewDetailedResult = (result: AssessmentResult & { studentName: string; className: string; period: string }) => {
  router.push(`/assessment/${assessmentId}/results/${result.id}`)
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

const goBack = () => {
  router.push('/manage-assessments')
}

const exportToCSV = () => {
  // TODO: Implement CSV export
  alert('CSV export coming soon!')
}

const printView = () => {
  window.print()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.assessment-results-overview {
  padding: 2rem;
  max-width: 100%;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 2rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-back:hover {
  background: #e0e0e0;
}

.header-info {
  flex: 1;
}

.header-info h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
}

.assessment-meta {
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #ddd;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  transition: all 0.2s;
}

.tab:hover {
  color: #1976d2;
  background: #f5f5f5;
}

.tab.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
  font-weight: 600;
}

/* Results Table */
.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.results-table th {
  background: #f5f5f5;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}

.results-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}

.student-column {
  min-width: 200px;
  position: sticky;
  left: 0;
  background: #f5f5f5;
  z-index: 11;
}

.score-column {
  min-width: 100px;
  text-align: center;
}

.question-column {
  min-width: 80px;
  text-align: center;
  cursor: help;
}

.question-stats {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
}

.action-column {
  min-width: 80px;
  text-align: center;
}

.student-name {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-info .name {
  font-weight: 500;
}

.student-info .date {
  font-size: 0.85rem;
  color: #666;
}

.score-cell {
  text-align: center;
}

.score-fraction {
  font-size: 0.85rem;
  color: #666;
}

.score-cell.excellent { background: #e8f5e9; color: #2e7d32; }
.score-cell.good { background: #fff3e0; color: #f57c00; }
.score-cell.fair { background: #fff9c4; color: #f9a825; }
.score-cell.poor { background: #ffe0b2; color: #e65100; }
.score-cell.failing { background: #ffebee; color: #c62828; }

.answer-cell {
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
}

.answer-cell:hover {
  background: #f5f5f5;
}

.answer-cell.correct {
  background: #e8f5e9;
  color: #2e7d32;
}

.answer-cell.incorrect {
  background: #ffebee;
  color: #c62828;
}

.answer-cell.no-answer {
  background: #f5f5f5;
  color: #999;
}

.answer-indicator {
  font-size: 1.25rem;
  display: block;
}

.points {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
}

.btn-view {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-view:hover {
  opacity: 1;
}

/* Question Analysis */
.question-analysis {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.question-analysis h3 {
  margin: 0 0 1.5rem 0;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.analysis-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.difficulty-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.difficulty-badge.easy { background: #e8f5e9; color: #2e7d32; }
.difficulty-badge.medium { background: #fff3e0; color: #f57c00; }
.difficulty-badge.hard { background: #ffebee; color: #c62828; }

.question-text {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
  min-height: 3em;
}

.stat-bar {
  height: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.stat-bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.stat-bar-fill.correct {
  background: #4caf50;
}

.stat-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.stat-numbers .correct {
  color: #2e7d32;
}

.stat-numbers .incorrect {
  color: #c62828;
}

/* Pending Students Section */
.pending-students-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.pending-students-section h3 {
  margin: 0 0 1.5rem 0;
  color: #f57c00;
}

.pending-by-class {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.pending-class-group {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  background: #fffbf0;
}

.pending-class-header {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #374151;
}

.pending-class-count {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.9rem;
}

.pending-students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0;
}

.pending-student-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff9e6;
  transition: transform 0.2s;
}

.pending-student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.student-icon {
  font-size: 2rem;
  background: #fff;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid #f57c00;
}

.student-details {
  flex: 1;
}

.student-name-pending {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.student-email {
  font-size: 0.85rem;
  color: #666;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #f57c00;
}

.pending-info {
  background: #fff3e0;
  border-left: 4px solid #f57c00;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.pending-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.all-complete-message {
  background: #e8f5e9;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  margin-top: 2rem;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.all-complete-message h3 {
  color: #2e7d32;
  margin: 0 0 0.5rem 0;
}

.all-complete-message p {
  color: #666;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.btn-close:hover {
  color: #000;
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

.student-answer {
  display: block;
  padding: 0.75rem;
  background: #ffebee;
  border-radius: 4px;
  color: #c62828;
}

.correct-answer {
  display: block;
  padding: 0.75rem;
  background: #e8f5e9;
  border-radius: 4px;
  color: #2e7d32;
}

/* Buttons */
.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* Print styles */
@media print {
  .header-actions,
  .btn-back,
  .action-column,
  .action-cell,
  .tabs {
    display: none;
  }
  
  .table-container {
    box-shadow: none;
  }
}
</style>
