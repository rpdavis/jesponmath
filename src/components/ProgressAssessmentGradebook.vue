<template>
  <div class="pa-gradebook">
    <div class="page-header">
      <h1>📊 Progress Assessment Gradebook</h1>
      <p>Track IEP goal progress through Progress Assessments (PA) only</p>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Student:</label>
        <select v-model="selectedStudentUid" @change="loadData">
          <option value="">All Students</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Goal:</label>
        <select v-model="selectedGoalId" @change="filterData">
          <option value="">All Goals</option>
          <option v-for="goal in availableGoals" :key="goal.id" :value="goal.id">
            {{ goal.goalTitle }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>View Mode:</label>
        <select v-model="viewMode">
          <option value="by-student">By Student</option>
          <option value="by-goal">By Goal</option>
          <option value="by-assessment">By Assessment</option>
        </select>
      </div>

      <div class="action-buttons">
        <button @click="exportToCSV" class="btn btn-primary">
          📤 Export CSV
        </button>
        <button @click="router.push('/progress-assessment')" class="btn btn-secondary">
          📋 Manage Goals & Assessments
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <p>⏳ Loading progress data...</p>
    </div>

    <!-- View: By Student -->
    <div v-else-if="viewMode === 'by-student'" class="gradebook-view">
      <div v-for="student in filteredStudents" :key="student.uid" class="student-section">
        <div class="student-header">
          <h2>{{ student.firstName }} {{ student.lastName }}</h2>
          <div class="student-stats">
            <span class="stat">
              {{ getStudentGoalsCount(student.uid) }} Goals
            </span>
            <span class="stat">
              {{ getStudentAssessmentsCount(student.uid) }} Assessments
            </span>
            <span class="stat avg">
              Avg: {{ getStudentAverageScore(student.uid) }}%
            </span>
          </div>
        </div>

        <div v-for="goal in getStudentGoals(student.uid)" :key="goal.id" class="goal-section">
          <div class="goal-header">
            <h3>🎯 {{ goal.goalTitle }}</h3>
            <span class="goal-meta">{{ goal.areaOfNeed }}</span>
          </div>

          <div class="assessments-table">
            <table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Attempts</th>
                  <th>Latest Score</th>
                  <th>Best Score</th>
                  <th>Progress Trend</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assessment in getGoalAssessments(goal.id)" :key="assessment.id">
                  <td>
                    <div class="assessment-info">
                      <strong>{{ assessment.title }}</strong>
                      <small>{{ assessment.totalPoints }} pts</small>
                    </div>
                  </td>
                  <td>{{ getAttemptCount(assessment.id, student.uid) }}</td>
                  <td>
                    <span class="score-badge" :class="getScoreClass(getLatestScore(assessment.id, student.uid))">
                      {{ getLatestScore(assessment.id, student.uid) }}%
                    </span>
                  </td>
                  <td>
                    <span class="score-badge" :class="getScoreClass(getBestScore(assessment.id, student.uid))">
                      {{ getBestScore(assessment.id, student.uid) }}%
                    </span>
                  </td>
                  <td>
                    <div class="progress-trend">
                      {{ getProgressTrend(assessment.id, student.uid) }}
                    </div>
                  </td>
                  <td>
                    <button @click="viewAssessmentHistory(assessment.id, student.uid)" class="btn-small">
                      View History
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- View: By Goal -->
    <div v-else-if="viewMode === 'by-goal'" class="gradebook-view">
      <div v-for="goal in filteredGoals" :key="goal.id" class="goal-section-large">
        <div class="goal-header-large">
          <h2>🎯 {{ goal.goalTitle }}</h2>
          <div class="goal-meta-info">
            <span>{{ goal.areaOfNeed }}</span>
            <span>{{ getGoalStudentsCount(goal.id) }} Students</span>
          </div>
        </div>

        <div class="assessments-table">
          <table>
            <thead>
              <tr>
                <th>Assessment</th>
                <th v-for="student in getGoalStudents(goal.id)" :key="student.uid">
                  {{ student.firstName }} {{ student.lastName }}
                </th>
                <th>Class Avg</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assessment in getGoalAssessments(goal.id)" :key="assessment.id">
                <td>
                  <div class="assessment-info">
                    <strong>{{ assessment.title }}</strong>
                    <small>{{ assessment.totalPoints }} pts</small>
                  </div>
                </td>
                <td v-for="student in getGoalStudents(goal.id)" :key="student.uid">
                  <div class="score-cell">
                    <span class="score-badge" :class="getScoreClass(getLatestScore(assessment.id, student.uid))">
                      {{ getLatestScore(assessment.id, student.uid) }}%
                    </span>
                    <small class="attempt-count">
                      ({{ getAttemptCount(assessment.id, student.uid) }} attempts)
                    </small>
                  </div>
                </td>
                <td>
                  <span class="score-badge avg" :class="getScoreClass(getAssessmentAverageScore(assessment.id))">
                    {{ getAssessmentAverageScore(assessment.id) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- View: By Assessment -->
    <div v-else-if="viewMode === 'by-assessment'" class="gradebook-view">
      <div v-for="assessment in filteredAssessments" :key="assessment.id" class="assessment-section-large">
        <div class="assessment-header-large">
          <h2>📝 {{ assessment.title }}</h2>
          <div class="assessment-meta-info">
            <span>{{ assessment.totalPoints }} points</span>
            <span>Avg: {{ getAssessmentAverageScore(assessment.id) }}%</span>
          </div>
        </div>

        <div class="students-table">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Goal</th>
                <th>Attempts</th>
                <th>Latest Score</th>
                <th>Best Score</th>
                <th>Last Attempt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in getAssessmentStudents(assessment.id)" :key="student.uid">
                <td>{{ student.firstName }} {{ student.lastName }}</td>
                <td>{{ getStudentGoalForAssessment(student.uid, assessment.id)?.goalTitle || 'N/A' }}</td>
                <td>{{ getAttemptCount(assessment.id, student.uid) }}</td>
                <td>
                  <span class="score-badge" :class="getScoreClass(getLatestScore(assessment.id, student.uid))">
                    {{ getLatestScore(assessment.id, student.uid) }}%
                  </span>
                </td>
                <td>
                  <span class="score-badge" :class="getScoreClass(getBestScore(assessment.id, student.uid))">
                    {{ getBestScore(assessment.id, student.uid) }}%
                  </span>
                </td>
                <td>{{ formatDate(getLatestAttemptDate(assessment.id, student.uid)) }}</td>
                <td>
                  <button @click="viewAssessmentHistory(assessment.id, student.uid)" class="btn-small">
                    View History
                    </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Assessment History Modal -->
    <div v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>📊 Assessment History</h2>
          <button @click="closeHistoryModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="selectedHistoryData" class="history-details">
            <h3>{{ selectedHistoryData.student }}</h3>
            <h4>{{ selectedHistoryData.assessment }}</h4>

            <div class="history-timeline">
              <div v-for="(result, index) in selectedHistoryData.results" :key="result.id" class="history-item">
                <div class="history-badge">{{ index + 1 }}</div>
                <div class="history-info">
                  <div class="history-date">{{ formatDate(result.completedAt) }}</div>
                  <div class="history-score">
                    <span class="score-badge" :class="getScoreClass(result.percentage)">
                      {{ result.score }}/{{ result.totalPoints }} ({{ result.percentage }}%)
                    </span>
                  </div>
                  <div class="history-details-text">
                    <span>Time: {{ result.timeSpent }}min</span>
                    <router-link 
                      :to="`/assessment/${selectedHistoryData.assessmentId}/results/${result.id}`"
                      class="view-link"
                    >
                      View Details →
                    </router-link>
                  </div>
                </div>
              </div>
            </div>

            <div class="history-stats">
              <div class="stat-card">
                <span class="stat-label">Total Attempts</span>
                <span class="stat-value">{{ selectedHistoryData.results.length }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Best Score</span>
                <span class="stat-value">{{ Math.max(...selectedHistoryData.results.map((r: any) => r.percentage)) }}%</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Average Score</span>
                <span class="stat-value">
                  {{ Math.round(selectedHistoryData.results.reduce((sum: number, r: any) => sum + r.percentage, 0) / selectedHistoryData.results.length) }}%
                </span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Improvement</span>
                <span class="stat-value" :class="getImprovementClass(selectedHistoryData.results)">
                  {{ getImprovement(selectedHistoryData.results) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeHistoryModal" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { getAllGoals, getGoalsByTeacher, getGoalsByStudent } from '@/firebase/goalServices'
import { getAllAssessments, getAssessmentResultsByStudent } from '@/firebase/iepServices'
import type { Student } from '@/types/users'
import type { Goal, Assessment, AssessmentResult } from '@/types/iep'

const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const students = ref<Student[]>([])
const goals = ref<Goal[]>([])
const assessments = ref<Assessment[]>([])
const assessmentResults = ref<AssessmentResult[]>([])

const selectedStudentUid = ref('')
const selectedGoalId = ref('')
const viewMode = ref<'by-student' | 'by-goal' | 'by-assessment'>('by-student')

const showHistoryModal = ref(false)
const selectedHistoryData = ref<any>(null)

// Computed
const availableGoals = computed(() => {
  if (selectedStudentUid.value) {
    return goals.value.filter(g => 
      g.assignedStudents?.includes(selectedStudentUid.value) || 
      g.studentUid === selectedStudentUid.value
    )
  }
  return goals.value
})

const filteredStudents = computed(() => {
  if (selectedStudentUid.value) {
    return students.value.filter(s => s.uid === selectedStudentUid.value)
  }
  return students.value
})

const filteredGoals = computed(() => {
  if (selectedGoalId.value) {
    return goals.value.filter(g => g.id === selectedGoalId.value)
  }
  return goals.value
})

const filteredAssessments = computed(() => {
  let filtered = assessments.value
  
  if (selectedGoalId.value) {
    const goal = goals.value.find(g => g.id === selectedGoalId.value)
    if (goal?.assignedAssessments) {
      filtered = filtered.filter(a => goal.assignedAssessments!.includes(a.id))
    }
  }
  
  return filtered
})

// Methods
async function loadData() {
  loading.value = true
  
  try {
    // Load students
    if (authStore.userRole === 'admin') {
      students.value = await getAllStudents()
    } else if (authStore.userRole === 'teacher') {
      students.value = await getStudentsByTeacher(authStore.currentUser!.uid)
    }
    
    // Load goals
    if (selectedStudentUid.value) {
      goals.value = await getGoalsByStudent(selectedStudentUid.value)
    } else if (authStore.userRole === 'admin') {
      goals.value = await getAllGoals()
    } else if (authStore.userRole === 'teacher') {
      goals.value = await getGoalsByTeacher(authStore.currentUser!.uid)
    }
    
    // Load PA assessments only
    const allAssessments = await getAllAssessments()
    assessments.value = allAssessments.filter(a => a.category === 'PA')
    
    // Load all assessment results
    await loadAllResults()
    
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

async function loadAllResults() {
  // PERFORMANCE OPTIMIZED: Load results for all students in parallel instead of sequentially
  // This reduces total query time from N seconds to ~1 second for N students
  const startTime = performance.now();
  
  const resultPromises = students.value.map(async (student) => {
    try {
      const studentResults = await getAssessmentResultsByStudent(student.uid)
      // Filter to only PA assessments
      const paResults = studentResults.filter(r => {
        const assessment = assessments.value.find(a => a.id === r.assessmentId)
        return assessment?.category === 'PA'
      })
      return paResults
    } catch (error) {
      console.error(`Error loading results for student ${student.uid}:`, error)
      return []
    }
  });
  
  // Wait for all student queries to complete in parallel
  const allStudentResults = await Promise.all(resultPromises);
  const results = allStudentResults.flat();
  
  const queryTime = Math.round(performance.now() - startTime);
  console.log(`⚡ Parallel query completed in ${queryTime}ms for ${students.value.length} students (${results.length} total results)`);
  
  assessmentResults.value = results
}

function filterData() {
  // Trigger recomputation of filtered data
}

function getStudentGoals(studentUid: string): Goal[] {
  return goals.value.filter(g => 
    g.assignedStudents?.includes(studentUid) || 
    g.studentUid === studentUid
  )
}

function getGoalAssessments(goalId: string): Assessment[] {
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal?.assignedAssessments) return []
  
  return assessments.value.filter(a => goal.assignedAssessments!.includes(a.id))
}

function getGoalStudents(goalId: string): Student[] {
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal) return []
  
  const studentUids = goal.assignedStudents || (goal.studentUid ? [goal.studentUid] : [])
  return students.value.filter(s => studentUids.includes(s.uid))
}

function getAssessmentStudents(assessmentId: string): Student[] {
  const studentUids = new Set(
    assessmentResults.value
      .filter(r => r.assessmentId === assessmentId)
      .map(r => r.studentUid)
  )
  return students.value.filter(s => studentUids.has(s.uid))
}

function getStudentGoalForAssessment(studentUid: string, assessmentId: string): Goal | undefined {
  return goals.value.find(g => 
    g.assignedAssessments?.includes(assessmentId) &&
    (g.assignedStudents?.includes(studentUid) || g.studentUid === studentUid)
  )
}

function getStudentGoalsCount(studentUid: string): number {
  return getStudentGoals(studentUid).length
}

function getStudentAssessmentsCount(studentUid: string): number {
  return new Set(assessmentResults.value.filter(r => r.studentUid === studentUid).map(r => r.assessmentId)).size
}

function getStudentAverageScore(studentUid: string): number {
  const results = assessmentResults.value.filter(r => r.studentUid === studentUid)
  if (results.length === 0) return 0
  
  // Get latest score for each assessment
  const latestScores = new Map<string, number>()
  results.forEach(r => {
    const existing = latestScores.get(r.assessmentId)
    if (!existing || (r.completedAt && r.completedAt.seconds > (existing as any))) {
      latestScores.set(r.assessmentId, r.percentage)
    }
  })
  
  const scores = Array.from(latestScores.values())
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
}

function getGoalStudentsCount(goalId: string): number {
  return getGoalStudents(goalId).length
}

function getAttemptCount(assessmentId: string, studentUid: string): number {
  return assessmentResults.value.filter(r => 
    r.assessmentId === assessmentId && r.studentUid === studentUid
  ).length
}

function getLatestScore(assessmentId: string, studentUid: string): number {
  const results = assessmentResults.value
    .filter(r => r.assessmentId === assessmentId && r.studentUid === studentUid)
    .sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0))
  
  return results[0]?.percentage || 0
}

function getBestScore(assessmentId: string, studentUid: string): number {
  const results = assessmentResults.value.filter(r => 
    r.assessmentId === assessmentId && r.studentUid === studentUid
  )
  
  if (results.length === 0) return 0
  return Math.max(...results.map(r => r.percentage))
}

function getLatestAttemptDate(assessmentId: string, studentUid: string): any {
  const results = assessmentResults.value
    .filter(r => r.assessmentId === assessmentId && r.studentUid === studentUid)
    .sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0))
  
  return results[0]?.completedAt
}

function getProgressTrend(assessmentId: string, studentUid: string): string {
  const results = assessmentResults.value
    .filter(r => r.assessmentId === assessmentId && r.studentUid === studentUid)
    .sort((a, b) => (a.completedAt?.seconds || 0) - (b.completedAt?.seconds || 0))
  
  if (results.length < 2) return '—'
  
  const firstScore = results[0].percentage
  const lastScore = results[results.length - 1].percentage
  const improvement = lastScore - firstScore
  
  if (improvement > 10) return '📈 Strong Growth'
  if (improvement > 0) return '↗️ Improving'
  if (improvement === 0) return '→ Stable'
  return '↘️ Declining'
}

function getAssessmentAverageScore(assessmentId: string): number {
  const studentScores = new Map<string, number>()
  
  // Get latest score for each student
  assessmentResults.value
    .filter(r => r.assessmentId === assessmentId)
    .forEach(r => {
      const existing = studentScores.get(r.studentUid)
      if (!existing || (r.completedAt && r.completedAt.seconds > (existing as any))) {
        studentScores.set(r.studentUid, r.percentage)
      }
    })
  
  const scores = Array.from(studentScores.values())
  if (scores.length === 0) return 0
  
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 60) return 'fair'
  return 'needs-improvement'
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function viewAssessmentHistory(assessmentId: string, studentUid: string) {
  const assessment = assessments.value.find(a => a.id === assessmentId)
  const student = students.value.find(s => s.uid === studentUid)
  const results = assessmentResults.value
    .filter(r => r.assessmentId === assessmentId && r.studentUid === studentUid)
    .sort((a, b) => (a.completedAt?.seconds || 0) - (b.completedAt?.seconds || 0))
  
  selectedHistoryData.value = {
    assessmentId,
    assessment: assessment?.title || 'Unknown',
    student: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
    results
  }
  
  showHistoryModal.value = true
}

function closeHistoryModal() {
  showHistoryModal.value = false
  selectedHistoryData.value = null
}

function getImprovement(results: any[]): string {
  if (results.length < 2) return 'N/A'
  const improvement = results[results.length - 1].percentage - results[0].percentage
  return improvement > 0 ? `+${improvement}%` : `${improvement}%`
}

function getImprovementClass(results: any[]): string {
  if (results.length < 2) return ''
  const improvement = results[results.length - 1].percentage - results[0].percentage
  if (improvement > 0) return 'positive'
  if (improvement < 0) return 'negative'
  return ''
}

function exportToCSV() {
  // TODO: Implement CSV export
  alert('CSV export will be implemented')
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.pa-gradebook {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

/* Filters */
.filters-section {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.filter-group select {
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

/* Loading */
.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #7f8c8d;
}

/* Student Section */
.student-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.student-header h2 {
  color: #2c3e50;
  margin: 0;
}

.student-stats {
  display: flex;
  gap: 1.5rem;
}

.student-stats .stat {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-weight: 600;
  color: #555;
}

.student-stats .stat.avg {
  background: #3498db;
  color: white;
}

/* Goal Section */
.goal-section {
  margin-bottom: 2rem;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.goal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.goal-meta {
  color: #7f8c8d;
  font-weight: 600;
}

/* Tables */
.assessments-table table,
.students-table table {
  width: 100%;
  border-collapse: collapse;
}

.assessments-table th,
.assessments-table td,
.students-table th,
.students-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.assessments-table th,
.students-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.assessment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.assessment-info small {
  color: #7f8c8d;
  font-size: 0.85rem;
}

.score-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
}

.score-badge.excellent {
  background: #d5f4e6;
  color: #27ae60;
}

.score-badge.good {
  background: #d6eaf8;
  color: #2980b9;
}

.score-badge.fair {
  background: #fef5e7;
  color: #f39c12;
}

.score-badge.needs-improvement {
  background: #fadbd8;
  color: #e74c3c;
}

.score-badge.avg {
  background: #e8e8e8;
  color: #555;
}

.score-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.attempt-count {
  color: #7f8c8d;
  font-size: 0.8rem;
}

.progress-trend {
  font-size: 0.9rem;
  font-weight: 600;
}

/* Large Sections */
.goal-section-large,
.assessment-section-large {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.goal-header-large,
.assessment-header-large {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.goal-header-large h2,
.assessment-header-large h2 {
  color: #2c3e50;
  margin: 0;
}

.goal-meta-info,
.assessment-meta-info {
  display: flex;
  gap: 1rem;
  color: #7f8c8d;
  font-weight: 600;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-small {
  padding: 0.5rem 1rem;
  border: none;
  background: #3498db;
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-small:hover {
  background: #2980b9;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #ecf0f1;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.5rem;
  line-height: 1;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 2rem;
}

.history-details h3,
.history-details h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.history-timeline {
  margin: 2rem 0;
}

.history-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.history-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
}

.history-date {
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
}

.history-score {
  margin-bottom: 0.5rem;
}

.history-details-text {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.view-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
}

.view-link:hover {
  text-decoration: underline;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-value.positive {
  color: #27ae60;
}

.stat-value.negative {
  color: #e74c3c;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 2px solid #ecf0f1;
  display: flex;
  justify-content: flex-end;
}
</style>

