<template>
  <div class="student-progress-view">
    <!-- Header -->
    <div class="page-header">
      <button @click="router.push('/fluency/dashboard')" class="back-btn">
        ← Back to Dashboard
      </button>
      
      <div class="student-header">
        <h1>{{ studentName }}</h1>
        <p class="current-operation">{{ currentOperationDisplay }}</p>
      </div>

      <button @click="viewFactBreakdown" class="view-facts-btn">
        🎯 View Individual Facts Breakdown →
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading student progress...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="progress-content">
      
      <!-- Overall Progress Card -->
      <div class="progress-card">
        <h2>📊 Overall Progress</h2>
        <div class="overall-stats">
          <div class="stat-box">
            <div class="stat-label">Current Sub-Level</div>
            <div class="stat-value">{{ currentSubLevelName }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Sub-Levels Completed</div>
            <div class="stat-value">{{ completedSubLevels }} / {{ totalSubLevels }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Facts Mastered</div>
            <div class="stat-value mastered">{{ masteredCount }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Overall Proficiency</div>
            <div class="stat-value" :class="getProficiencyClass(overallProficiency)">
              {{ overallProficiency }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Problem Type Breakdown -->
      <div class="progress-card">
        <h2>📈 Breakdown by Problem Type</h2>
        <p class="section-subtitle">How student performs on different types of {{ currentOperation }} problems</p>
        
        <div class="problem-types-grid">
          <div 
            v-for="category in problemTypeBreakdown" 
            :key="category.name"
            class="type-card"
            :class="category.statusClass"
          >
            <div class="type-header">
              <h3>{{ category.name }}</h3>
              <span class="type-icon">{{ category.icon }}</span>
            </div>
            <div class="type-stats">
              <div class="type-progress-bar">
                <div 
                  class="type-progress-fill" 
                  :style="{ width: `${category.percentage}%` }"
                  :class="category.statusClass"
                ></div>
              </div>
              <div class="type-numbers">
                <span class="mastered">{{ category.mastered }} mastered</span>
                <span class="total">{{ category.practiced }}/{{ category.total }} practiced</span>
                <span class="percentage">{{ category.percentage }}%</span>
              </div>
            </div>
            <div v-if="category.examples.length > 0" class="type-examples">
              <small>Examples: {{ category.examples.join(', ') }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Strategy Lessons -->
      <div class="progress-card">
        <h2>📚 Strategy Lessons</h2>
        <p class="section-subtitle">Mini-lessons teaching problem-solving strategies</p>
        
        <div class="lessons-grid">
          <div 
            v-for="lesson in lessonsStatus" 
            :key="lesson.id"
            class="lesson-card"
            :class="lesson.statusClass"
          >
            <div class="lesson-icon">{{ lesson.icon }}</div>
            <div class="lesson-info">
              <h3>{{ lesson.title }}</h3>
              <p class="lesson-status">{{ lesson.statusText }}</p>
              <p v-if="lesson.completedDate" class="lesson-date">
                Completed: {{ formatDate(lesson.completedDate) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Paper Assessments -->
      <div class="progress-card">
        <h2>📄 Weekly Paper Assessments</h2>
        <p class="section-subtitle">Friday 1-minute fluency probes</p>
        
        <div v-if="paperAssessments.length > 0" class="assessments-list">
          <div 
            v-for="assessment in paperAssessments" 
            :key="assessment.id"
            class="assessment-row"
          >
            <div class="assessment-week">Week {{ assessment.weekNumber }}</div>
            <div class="assessment-score" :class="getScoreClass(assessment.percentage)">
              {{ assessment.score }}/{{ assessment.totalProblems }} ({{ assessment.percentage }}%)
            </div>
            <div class="assessment-date">{{ formatDate(assessment.assessmentDate) }}</div>
            <div class="assessment-cpm" v-if="assessment.cpm">
              {{ assessment.cpm }} CPM
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          No paper assessments recorded yet
        </div>
      </div>

      <!-- Practice History -->
      <div class="progress-card">
        <h2>🎯 Recent Practice Sessions</h2>
        <p class="section-subtitle">Last 10 daily practice sessions</p>
        
        <div v-if="practiceSessions.length > 0" class="sessions-list">
          <div 
            v-for="session in practiceSessions" 
            :key="session.id"
            class="session-row"
          >
            <div class="session-date">{{ formatDateTime(session.sessionDate) }}</div>
            <div class="session-rounds">
              <span class="round-stat">R1: {{ session.round1Correct }}/{{ session.round1Total }}</span>
              <span class="round-stat">R2: {{ session.round2Correct }}/{{ session.round2Total }}</span>
              <span class="round-stat">R3: {{ session.round3Correct }}/{{ session.round3Total }}</span>
            </div>
            <div class="session-accuracy" :class="getScoreClass(session.overallAccuracy)">
              {{ session.overallAccuracy }}%
            </div>
            <div class="session-time">{{ session.timeSpent }} min</div>
          </div>
        </div>
        <div v-else class="no-data">
          No practice sessions yet
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getUserProfile } from '@/firebase/userServices'
import { getFluencyProgress, getStudentPaperAssessments } from '@/services/mathFluencyServices'
import { getCompletedLessonIds, getLessonProgress } from '@/services/strategyLessonService'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getSubLevelConfig, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import type { OperationType, ProblemProgress, SubLevel } from '@/types/mathFluency'
import type { LessonId } from '@/types/strategyLessons'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const studentUid = ref(route.params.studentUid as string)
const studentName = ref('')
const loading = ref(true)
const progress = ref<any>(null)
const currentOperation = ref<OperationType>('addition')
const paperAssessments = ref<any[]>([])
const practiceSessions = ref<any[]>([])
const completedLessons = ref<LessonId[]>([])

// Computed
const currentOperationDisplay = computed(() => {
  if (!progress.value) return 'Not Started'
  return `Currently Practicing: ${capitalizeOperation(currentOperation.value)}`
})

const currentSubLevelName = computed(() => {
  if (!progress.value?.currentSubLevel) return 'Not Started'
  const config = getSubLevelConfig(progress.value.currentSubLevel)
  return config?.name || progress.value.currentSubLevel
})

const completedSubLevels = computed(() => {
  if (!progress.value?.completedSubLevels) return 0
  // completedSubLevels is an array of sub-level IDs
  if (Array.isArray(progress.value.completedSubLevels)) {
    return progress.value.completedSubLevels.length
  }
  return progress.value.completedSubLevels || 0
})

const totalSubLevels = computed(() => {
  const subLevels = getSubLevelsForOperation(currentOperation.value)
  return subLevels.length
})

const masteredCount = computed(() => {
  return progress.value?.problemBanks?.mastered?.length || 0
})

const overallProficiency = computed(() => {
  if (!progress.value) return 0
  const total = getTotalProblemsCount()
  if (total === 0) return 0
  return Math.round((masteredCount.value / total) * 100)
})

// Problem Type Breakdown
const problemTypeBreakdown = computed(() => {
  if (!progress.value) return []
  
  const allProblems: ProblemProgress[] = [
    ...(progress.value.problemBanks?.doesNotKnow || []),
    ...(progress.value.problemBanks?.emerging || []),
    ...(progress.value.problemBanks?.approaching || []),
    ...(progress.value.problemBanks?.proficient || []),
    ...(progress.value.problemBanks?.mastered || [])
  ]
  
  return categorizeProblems(allProblems, currentOperation.value)
})

// Lessons Status
const lessonsStatus = computed(() => {
  const allLessons = [
    { id: 'making-5' as LessonId, title: 'Making 5', icon: '5️⃣', order: 1 },
    { id: 'making-10' as LessonId, title: 'Making 10', icon: '🔟', order: 2 },
    { id: 'decomposing-ten-frames' as LessonId, title: 'Decomposing with Ten Frames', icon: '🎯', order: 3 }
  ]
  
  console.log('📚 Completed lessons check:', completedLessons.value)
  
  return allLessons.map(lesson => {
    const isCompleted = completedLessons.value.includes(lesson.id)
    
    console.log(`  ${lesson.id}: ${isCompleted ? 'COMPLETED' : 'not started'}`)
    
    return {
      ...lesson,
      statusClass: isCompleted ? 'completed' : 'not-started',
      statusText: isCompleted ? 'Completed ✅' : 'Not Started',
      icon: isCompleted ? '✅' : lesson.icon,
      completedDate: null // Will load actual date if needed
    }
  })
})

// Methods
function getTotalProblemsCount() {
  if (!progress.value) return 0
  return (progress.value.problemBanks?.doesNotKnow?.length || 0) +
         (progress.value.problemBanks?.emerging?.length || 0) +
         (progress.value.problemBanks?.approaching?.length || 0) +
         (progress.value.problemBanks?.proficient?.length || 0) +
         (progress.value.problemBanks?.mastered?.length || 0)
}

function categorizeProblems(problems: ProblemProgress[], operation: OperationType) {
  if (operation !== 'addition') {
    // Simplified for other operations - just show overall
    return []
  }
  
  // Addition categories based on sub-level structure
  const categories = {
    basic_2to5: {
      name: 'Basic Facts (2-5)',
      filter: (p: ProblemProgress) => p.num1 <= 5 && p.num2 <= 5,
      icon: '🟢'
    },
    sums_6to10: {
      name: 'Sums 6-10',
      filter: (p: ProblemProgress) => {
        const sum = p.num1 + p.num2
        return sum >= 6 && sum <= 10
      },
      icon: '🔵'
    },
    make_10: {
      name: 'Make 10 (Partners)',
      filter: (p: ProblemProgress) => p.num1 + p.num2 === 10,
      icon: '🔟'
    },
    doubles: {
      name: 'Doubles',
      filter: (p: ProblemProgress) => p.num1 === p.num2 && p.num1 >= 2,
      icon: '👯'
    },
    near_doubles: {
      name: 'Near Doubles',
      filter: (p: ProblemProgress) => Math.abs(p.num1 - p.num2) === 1 && p.num1 >= 5,
      icon: '↔️'
    },
    crossing_10: {
      name: 'Crossing 10 (Bridging)',
      filter: (p: ProblemProgress) => {
        const sum = p.num1 + p.num2
        return sum > 10 && sum <= 20
      },
      icon: '🌉'
    }
  }
  
  return Object.entries(categories).map(([key, cat]) => {
    const categoryProblems = problems.filter(cat.filter)
    const mastered = categoryProblems.filter(p => p.proficiencyLevel === 'mastered')
    const total = categoryProblems.length
    const percentage = total > 0 ? Math.round((mastered.length / total) * 100) : 0
    
    // Get status class based on percentage
    let statusClass = 'needs-work'
    if (percentage >= 80) statusClass = 'proficient'
    else if (percentage >= 60) statusClass = 'approaching'
    else if (percentage >= 40) statusClass = 'emerging'
    
    // Get example problems (first 3)
    const examples = categoryProblems.slice(0, 3).map(p => p.displayText || `${p.num1}+${p.num2}`)
    
    return {
      name: cat.name,
      icon: cat.icon,
      mastered: mastered.length,
      practiced: total,
      total: total, // In this view, total = what they've practiced
      percentage,
      statusClass,
      examples
    }
  }).filter(c => c.total > 0) // Only show categories they've practiced
}

function capitalizeOperation(op: string) {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

function getProficiencyClass(percentage: number) {
  if (percentage >= 80) return 'proficient'
  if (percentage >= 60) return 'approaching'
  if (percentage >= 40) return 'emerging'
  return 'needs-work'
}

function getScoreClass(percentage: number) {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 80) return 'good'
  if (percentage >= 70) return 'fair'
  return 'needs-improvement'
}

function formatDate(timestamp: any) {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(timestamp: any) {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function viewFactBreakdown() {
  router.push(`/fluency/teacher-view/${studentUid.value}`)
}

async function loadData() {
  loading.value = true
  
  try {
    // Load student info
    const student = await getUserProfile(studentUid.value)
    if (student) {
      studentName.value = `${student.firstName} ${student.lastName}`
    }
    
    // Determine current operation
    // Try all operations to find which one they're on
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
    
    for (const op of operations) {
      const prog = await getFluencyProgress(studentUid.value, op)
      if (prog && !prog.completedOperation) {
        currentOperation.value = op
        progress.value = prog
        break
      } else if (prog) {
        // They completed this one, might be on next
        currentOperation.value = op
        progress.value = prog
      }
    }
    
    if (!progress.value) {
      console.log('No fluency progress found for student')
      loading.value = false
      return
    }
    
    // Load completed lessons
    completedLessons.value = await getCompletedLessonIds(studentUid.value)
    
    // Load paper assessments
    const paperData = await getStudentPaperAssessments(studentUid.value)
    paperAssessments.value = paperData.sort((a, b) => (b.weekNumber || 0) - (a.weekNumber || 0))
    
    // Load recent practice sessions
    // Simplified query to avoid index requirement - filter in JS
    const sessionsQuery = query(
      collection(db, 'mathFluencyPracticeSessions'),
      where('studentUid', '==', studentUid.value),
      where('operation', '==', currentOperation.value)
    )
    
    const sessionsSnapshot = await getDocs(sessionsQuery)
    
    // Filter completed and sort in JavaScript (avoids complex index)
    const allSessions = sessionsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((s: any) => s.completed === true)
      .sort((a: any, b: any) => {
        const aTime = a.sessionDate?.toMillis?.() || 0
        const bTime = b.sessionDate?.toMillis?.() || 0
        return bTime - aTime
      })
      .slice(0, 10)
    practiceSessions.value = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      round1Correct: doc.data().round1_learning?.newlyLearned?.length || 0,
      round1Total: doc.data().round1_learning?.problemsTargeted?.length || 0,
      round2Correct: Object.values(doc.data().round2_practice?.results || {}).filter((r: any) => r.correct).length,
      round2Total: Object.keys(doc.data().round2_practice?.results || {}).length,
      round3Correct: Object.values(doc.data().round3_assessment?.results || {}).filter((r: any) => r.correct).length,
      round3Total: Object.keys(doc.data().round3_assessment?.results || {}).length,
      overallAccuracy: doc.data().overallAccuracy || 0,
      timeSpent: Math.round((doc.data().totalSessionTime || 0) / 60) // Convert to minutes
    }))
    
  } catch (error) {
    console.error('Error loading student progress:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.student-progress-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.back-btn {
  background: #f8f9fa;
  border: 2px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #555;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.student-header {
  flex: 1;
}

.student-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2rem;
}

.current-operation {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 1.1rem;
}

.view-facts-btn {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.view-facts-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.3);
}

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
  to { transform: rotate(360deg); }
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-card h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.section-subtitle {
  margin: 0 0 1.5rem 0;
  color: #666;
  font-size: 0.95rem;
}

/* Overall Stats */
.overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-box {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-value.mastered {
  color: #ffc107;
}

.stat-value.proficient {
  color: #2196f3;
}

.stat-value.approaching {
  color: #ff9800;
}

.stat-value.emerging {
  color: #4caf50;
}

.stat-value.needs-work {
  color: #f44336;
}

/* Problem Types Grid */
.problem-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.type-card {
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid;
  transition: all 0.2s;
}

.type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.type-card.proficient {
  background: #e3f2fd;
  border-color: #2196f3;
}

.type-card.approaching {
  background: #fff3e0;
  border-color: #ff9800;
}

.type-card.emerging {
  background: #e8f5e9;
  border-color: #4caf50;
}

.type-card.needs-work {
  background: #ffebee;
  border-color: #f44336;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.type-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.type-icon {
  font-size: 1.5rem;
}

.type-stats {
  margin-bottom: 0.5rem;
}

.type-progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.type-progress-fill {
  height: 100%;
  transition: width 0.3s;
}

.type-progress-fill.proficient {
  background: #2196f3;
}

.type-progress-fill.approaching {
  background: #ff9800;
}

.type-progress-fill.emerging {
  background: #4caf50;
}

.type-progress-fill.needs-work {
  background: #f44336;
}

.type-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
}

.type-numbers .mastered {
  font-weight: 600;
  color: #ffc107;
}

.type-examples {
  margin-top: 0.5rem;
  color: #999;
  font-size: 0.85rem;
}

/* Lessons Grid */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.lesson-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid;
}

.lesson-card.completed {
  background: #e8f5e9;
  border-color: #4caf50;
}

.lesson-card.not-started {
  background: #f8f9fa;
  border-color: #ddd;
}

.lesson-icon {
  font-size: 2rem;
}

.lesson-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.lesson-status {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.lesson-date {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #999;
}

/* Assessments List */
.assessments-list,
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.assessment-row,
.session-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  align-items: center;
}

.assessment-week,
.session-date {
  font-weight: 600;
  color: #2c3e50;
}

.assessment-score,
.session-accuracy {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.excellent {
  background: #c8e6c9;
  color: #2e7d32;
}

.good {
  background: #bbdefb;
  color: #1565c0;
}

.fair {
  background: #fff9c4;
  color: #f57f17;
}

.needs-improvement {
  background: #ffcdd2;
  color: #c62828;
}

.session-rounds {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.round-stat {
  color: #666;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}
</style>

