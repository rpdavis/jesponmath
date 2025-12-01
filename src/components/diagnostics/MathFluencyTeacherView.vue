<template>
  <div class="fluency-teacher-view">
    <div class="header">
      <h1>📊 Math Fluency Teacher Dashboard</h1>
      <p>Monitor student progress on individual math facts</p>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Operation:</label>
        <select v-model="selectedOperation">
          <option value="addition">Addition</option>
          <option value="subtraction">Subtraction</option>
          <option value="multiplication">Multiplication</option>
          <option value="division">Division</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Student:</label>
        <select v-model="selectedStudentUid">
          <option value="">All Students</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Class/Period:</label>
        <select v-model="selectedPeriod">
          <option value="">All Periods</option>
          <option v-for="period in uniquePeriods" :key="period" :value="period">
            Period {{ period }}
          </option>
        </select>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <h3>Legend:</h3>
      <div class="legend-items">
        <div class="legend-item">
          <div class="status-box blank"></div>
          <span>Not Yet Practiced</span>
        </div>
        <div class="legend-item">
          <div class="status-box learning"></div>
          <span>Learning (&lt; 40%)</span>
        </div>
        <div class="legend-item">
          <div class="status-box emerging"></div>
          <span>Emerging (40-59%)</span>
        </div>
        <div class="legend-item">
          <div class="status-box approaching"></div>
          <span>Approaching (60-79%)</span>
        </div>
        <div class="legend-item">
          <div class="status-box proficient"></div>
          <span>Proficient (80-89%)</span>
        </div>
        <div class="legend-item">
          <div class="status-box mastered">✓</div>
          <span>Mastered (90%+)</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading student progress...</p>
    </div>

    <!-- Student Grid View (One Student) -->
    <div v-else-if="selectedStudentUid && studentProgress" class="student-detail-view">
      <div class="student-header">
        <h2>{{ getStudentName(selectedStudentUid) }}</h2>
        <div class="overall-stats">
          <div class="stat">
            <span class="stat-label">Mastered:</span>
            <span class="stat-value mastered">{{ studentProgress.summary.mastered }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Proficient:</span>
            <span class="stat-value proficient">{{ studentProgress.summary.proficient }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Needs Work:</span>
            <span class="stat-value needs-work">{{ studentProgress.summary.needsWork }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Not Started:</span>
            <span class="stat-value blank">{{ studentProgress.summary.notStarted }}</span>
          </div>
        </div>
      </div>

      <!-- Fact Grid -->
      <div class="facts-grid">
        <div
          v-for="fact in studentProgress.facts"
          :key="fact.problemId"
          class="fact-cell"
          :class="getStatusClass(fact.status)"
          :title="getFactTooltip(fact)"
        >
          <div class="fact-problem">{{ fact.displayText }}</div>
          <div class="fact-status-icon">{{ getStatusIcon(fact.status) }}</div>
          <div v-if="fact.accuracy !== null" class="fact-accuracy">{{ fact.accuracy }}%</div>
        </div>
      </div>
    </div>

    <!-- All Students Summary View -->
    <div v-else-if="!selectedStudentUid" class="all-students-view">
      <h2>All Students Progress Summary</h2>

      <div class="students-table-wrapper">
        <table class="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Period</th>
              <th class="mastered-col">Mastered</th>
              <th class="proficient-col">Proficient</th>
              <th class="approaching-col">Approaching</th>
              <th class="emerging-col">Emerging</th>
              <th class="learning-col">Learning</th>
              <th class="blank-col">Not Started</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="student in filteredStudents"
              :key="student.uid"
              class="student-row"
              @click="viewStudent(student.uid)"
            >
              <td class="student-name">
                <router-link :to="`/fluency/teacher-view/${student.uid}`" class="student-link">
                  {{ student.firstName }} {{ student.lastName }}
                </router-link>
              </td>
              <td>{{ student.section || student.period || '-' }}</td>
              <td class="mastered-col">{{ getStudentSummary(student.uid).mastered }}</td>
              <td class="proficient-col">{{ getStudentSummary(student.uid).proficient }}</td>
              <td class="approaching-col">{{ getStudentSummary(student.uid).approaching }}</td>
              <td class="emerging-col">{{ getStudentSummary(student.uid).emerging }}</td>
              <td class="learning-col">{{ getStudentSummary(student.uid).learning }}</td>
              <td class="blank-col">{{ getStudentSummary(student.uid).notStarted }}</td>
              <td class="overall-col">
                <span class="overall-percentage" :class="getOverallClass(student.uid)">
                  {{ getStudentSummary(student.uid).masteredPercent }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getStudentsByTeacher, getAllStudents } from '@/firebase/userServices'
import { getFluencyProgress } from '@/services/mathFluencyServices'
import type { Student } from '@/types/users'
import type { OperationType, ProblemProgress } from '@/types/mathFluency'
import { getAllProblemsForOperation } from '@/utils/mathFluencyProblemGenerator'

const router = useRouter()

const authStore = useAuthStore()

// State
const loading = ref(true)
const students = ref<Student[]>([])
const selectedOperation = ref<OperationType>('addition')
const selectedStudentUid = ref('')
const selectedPeriod = ref('')
interface ProgressData {
  studentUid: string
  operation: OperationType
  problemBanks: {
    doesNotKnow?: ProblemProgress[]
    emerging?: ProblemProgress[]
    approaching?: ProblemProgress[]
    proficient?: ProblemProgress[]
    mastered?: ProblemProgress[]
  }
}

const allProgress = ref<ProgressData[]>([])

// Computed
const uniquePeriods = computed(() => {
  const periods = students.value
    .map((s) => s.section || s.period)
    .filter(Boolean)
    .filter((p, i, arr) => arr.indexOf(p) === i)
  return periods.sort()
})

const filteredStudents = computed(() => {
  if (!selectedPeriod.value) return students.value
  return students.value.filter((s) => (s.section || s.period) === selectedPeriod.value)
})

const studentProgress = computed(() => {
  if (!selectedStudentUid.value) return null

  const progress = allProgress.value.find(
    (p) => p.studentUid === selectedStudentUid.value && p.operation === selectedOperation.value,
  )

  if (!progress) {
    return {
      summary: {
        mastered: 0,
        proficient: 0,
        approaching: 0,
        emerging: 0,
        learning: 0,
        needsWork: 0,
        notStarted: 0,
      },
      facts: [],
    }
  }

  // Get all possible facts for this operation
  const allFacts = getAllProblemsForOperation(selectedOperation.value)

  // Combine all problem banks
  const allProblems = [
    ...(progress.problemBanks?.doesNotKnow || []),
    ...(progress.problemBanks?.emerging || []),
    ...(progress.problemBanks?.approaching || []),
    ...(progress.problemBanks?.proficient || []),
    ...(progress.problemBanks?.mastered || []),
  ]

  // Create lookup for student's progress
  const progressMap = new Map()
  allProblems.forEach((p: ProblemProgress) => {
    progressMap.set(p.problemId, p)
  })

  // Build fact status for each problem
  const facts = allFacts.map((fact) => {
    const studentProblem = progressMap.get(fact.id)

    if (!studentProblem) {
      return {
        problemId: fact.id,
        displayText: fact.displayText,
        status: 'notStarted',
        accuracy: null,
        attempts: 0,
      }
    }

    // Calculate accuracy
    const accuracy =
      studentProblem.totalAttempts > 0
        ? Math.round((studentProblem.correctAttempts / studentProblem.totalAttempts) * 100)
        : 0

    // Determine status
    let status = 'learning'
    if (accuracy >= 90) status = 'mastered'
    else if (accuracy >= 80) status = 'proficient'
    else if (accuracy >= 60) status = 'approaching'
    else if (accuracy >= 40) status = 'emerging'

    return {
      problemId: fact.id,
      displayText: fact.displayText,
      status,
      accuracy,
      attempts: studentProblem.totalAttempts,
      proficiencyLevel: studentProblem.proficiencyLevel,
    }
  })

  // Calculate summary
  const summary = {
    mastered: facts.filter((f) => f.status === 'mastered').length,
    proficient: facts.filter((f) => f.status === 'proficient').length,
    approaching: facts.filter((f) => f.status === 'approaching').length,
    emerging: facts.filter((f) => f.status === 'emerging').length,
    learning: facts.filter((f) => f.status === 'learning').length,
    needsWork: facts.filter((f) => f.accuracy !== null && f.accuracy < 60).length,
    notStarted: facts.filter((f) => f.status === 'notStarted').length,
  }

  return { summary, facts }
})

// Methods
async function loadData() {
  loading.value = true

  try {
    // Load students
    if (authStore.isAdmin) {
      students.value = await getAllStudents()
    } else if (authStore.isTeacher) {
      students.value = await getStudentsByTeacher(authStore.currentUser!.uid)
    }

    // Load all fluency progress for all students
    const progressPromises = students.value.map((student) =>
      getFluencyProgress(student.uid, selectedOperation.value),
    )

    const progressResults = await Promise.all(progressPromises)
    allProgress.value = progressResults.filter((p) => p !== null)

    console.log(`📊 Loaded progress for ${allProgress.value.length} students`)
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

function getStudentName(uid: string): string {
  const student = students.value.find((s) => s.uid === uid)
  return student ? `${student.firstName} ${student.lastName}` : 'Unknown'
}

function getStudentSummary(studentUid: string) {
  const progress = allProgress.value.find(
    (p) => p.studentUid === studentUid && p.operation === selectedOperation.value,
  )

  if (!progress) {
    const totalFacts = getAllProblemsForOperation(selectedOperation.value).length
    return {
      mastered: 0,
      proficient: 0,
      approaching: 0,
      emerging: 0,
      learning: 0,
      notStarted: totalFacts,
      masteredPercent: 0,
    }
  }

  const mastered = progress.problemBanks?.mastered?.length || 0
  const proficient = progress.problemBanks?.proficient?.length || 0
  const approaching = progress.problemBanks?.approaching?.length || 0
  const emerging = progress.problemBanks?.emerging?.length || 0
  const learning = progress.problemBanks?.doesNotKnow?.length || 0
  const practiced = mastered + proficient + approaching + emerging + learning
  const total = getAllProblemsForOperation(selectedOperation.value).length
  const notStarted = total - practiced
  const masteredPercent = total > 0 ? Math.round((mastered / total) * 100) : 0

  return {
    mastered,
    proficient,
    approaching,
    emerging,
    learning,
    notStarted,
    masteredPercent,
  }
}

function getOverallClass(studentUid: string): string {
  const percent = getStudentSummary(studentUid).masteredPercent
  if (percent >= 80) return 'excellent'
  if (percent >= 60) return 'good'
  if (percent >= 40) return 'fair'
  return 'needs-work'
}

function getStatusClass(status: string): string {
  return status
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'mastered':
      return '✓'
    case 'proficient':
      return '●'
    case 'approaching':
      return '◐'
    case 'emerging':
      return '○'
    case 'learning':
      return '!'
    case 'notStarted':
      return ''
    default:
      return ''
  }
}

function getFactTooltip(fact: {
  status: string
  displayText?: string
  accuracy: number | null
  attempts: number
}): string {
  if (fact.status === 'notStarted') {
    return 'Not yet practiced'
  }
  return `${fact.displayText}\n${fact.accuracy}% accuracy (${fact.attempts} attempts)\nStatus: ${fact.status}`
}

function viewStudent(studentUid: string) {
  router.push(`/fluency/teacher-view/${studentUid}`)
}

// Lifecycle
onMounted(async () => {
  await loadData()
})

// Watch for operation changes
watch([selectedOperation], async () => {
  await loadData()
})
</script>

<style scoped>
.fluency-teacher-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

/* Filters */
.filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

/* Legend */
.legend {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.legend h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-box {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  border: 2px solid #ddd;
}

.status-box.blank {
  background: white;
  border: 2px dashed #ccc;
}

.status-box.learning {
  background: #ffcdd2;
  color: #c62828;
  border-color: #ef5350;
}

.status-box.emerging {
  background: #c8e6c9;
  color: #2e7d32;
  border-color: #66bb6a;
}

.status-box.approaching {
  background: #fff9c4;
  color: #f57f17;
  border-color: #ffeb3b;
}

.status-box.proficient {
  background: #bbdefb;
  color: #1565c0;
  border-color: #42a5f5;
}

.status-box.mastered {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #f57f17;
  border-color: #ffc107;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

/* Student Detail View */
.student-detail-view {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.student-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.student-header h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.overall-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
}

.stat-value.mastered {
  color: #ffc107;
}

.stat-value.proficient {
  color: #2196f3;
}

.stat-value.needs-work {
  color: #f44336;
}

.stat-value.blank {
  color: #9e9e9e;
}

/* Facts Grid */
.facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  padding: 1rem 0;
}

.fact-cell {
  aspect-ratio: 1;
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid;
  position: relative;
}

.fact-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.fact-cell.notStarted {
  background: white;
  border-color: #ddd;
  border-style: dashed;
}

.fact-cell.learning {
  background: #ffcdd2;
  border-color: #ef5350;
}

.fact-cell.emerging {
  background: #c8e6c9;
  border-color: #66bb6a;
}

.fact-cell.approaching {
  background: #fff9c4;
  border-color: #ffeb3b;
}

.fact-cell.proficient {
  background: #bbdefb;
  border-color: #42a5f5;
}

.fact-cell.mastered {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border-color: #ffc107;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.fact-problem {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.fact-status-icon {
  font-size: 1.2rem;
  margin-top: 0.25rem;
}

.fact-accuracy {
  font-size: 0.7rem;
  color: #666;
  margin-top: 0.25rem;
  font-weight: 600;
}

/* All Students Table */
.all-students-view {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.all-students-view h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.students-table-wrapper {
  overflow-x: auto;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th,
.students-table td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.students-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
}

.student-name {
  text-align: left !important;
  font-weight: 600;
  color: #2c3e50;
}

.mastered-col {
  background: #fffbf0;
}

.proficient-col {
  background: #f0f7ff;
}

.approaching-col {
  background: #fffef0;
}

.emerging-col {
  background: #f0fff0;
}

.learning-col {
  background: #fff0f0;
}

.blank-col {
  background: #fafafa;
}

.overall-percentage {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
}

.overall-percentage.excellent {
  background: #c8e6c9;
  color: #2e7d32;
}

.overall-percentage.good {
  background: #bbdefb;
  color: #1565c0;
}

.overall-percentage.fair {
  background: #fff9c4;
  color: #f57f17;
}

.overall-percentage.needs-work {
  background: #ffcdd2;
  color: #c62828;
}

.student-row:hover {
  background: #f8f9fa;
}

/* Loading */
.loading {
  text-align: center;
  padding: 4rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
