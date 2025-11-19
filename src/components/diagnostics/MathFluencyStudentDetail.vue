<template>
  <div class="fluency-student-detail-container">
    <!-- Header -->
    <div class="detail-header">
      <button @click="router.back()" class="back-btn">← Back</button>
      <div class="header-content">
        <h2>{{ studentName }} - Math Fluency Progress</h2>
        <p class="subtitle">Current Operation: {{ capitalizeOperation(selectedOperation) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-section">
      <p>Loading student progress...</p>
    </div>

    <!-- No Data -->
    <div v-else-if="!progress" class="no-data-section">
      <h3>No Fluency Data Yet</h3>
      <p>This student hasn't completed the initial diagnostic for {{ capitalizeOperation(selectedOperation) }} yet.</p>
      <button @click="router.push('/fluency/initial-diagnostic')" class="action-btn">
        Assign Initial Diagnostic →
      </button>
    </div>

    <!-- Main Content -->
    <div v-else class="detail-content">
      <!-- Operation Selector -->
      <div class="operation-selector">
        <button
          v-for="op in availableOperations"
          :key="op.value"
          @click="selectedOperation = op.value"
          :class="['op-btn', { active: selectedOperation === op.value }]"
        >
          {{ op.icon }} {{ op.label }}
        </button>
      </div>

      <!-- Proficiency Overview Card -->
      <div class="overview-card">
        <h3>Proficiency Status</h3>
        
        <div class="proficiency-bars">
          <div class="bar-row mastered">
            <span class="bar-label">🏆 Mastered</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${getPercentage(distribution.mastered)}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.mastered }} facts</span>
          </div>
          
          <div class="bar-row proficient">
            <span class="bar-label">🔵 Proficient</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${getPercentage(distribution.proficient)}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.proficient }} facts</span>
          </div>
          
          <div class="bar-row approaching">
            <span class="bar-label">🟡 Approaching</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${getPercentage(distribution.approaching)}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.approaching }} facts</span>
          </div>
          
          <div class="bar-row emerging">
            <span class="bar-label">🟢 Emerging</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${getPercentage(distribution.emerging)}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.emerging }} facts</span>
          </div>
          
          <div class="bar-row does-not-know">
            <span class="bar-label">🔴 Does Not Know</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${getPercentage(distribution.doesNotKnow)}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.doesNotKnow }} facts</span>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-value">{{ progress?.proficiencyPercentage || 0 }}%</span>
            <span class="stat-label">Overall Proficiency</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ distribution.total }}</span>
            <span class="stat-label">Total Facts</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ progress?.consecutivePracticeDays || 0 }}</span>
            <span class="stat-label">Day Streak</span>
          </div>
        </div>

        <div class="unlock-status" :class="{ ready: progress?.canUnlockNext }">
          <h4>{{ progress?.canUnlockNext ? '🎉 Ready to Unlock Next Operation!' : 'Progress to Unlock Next Operation:' }}</h4>
          <div class="unlock-bar">
            <div class="unlock-fill" :style="{ width: `${Math.min(100, progress?.proficiencyPercentage || 0)}%` }"></div>
          </div>
          <p class="unlock-text">{{ progress?.proficiencyPercentage || 0 }}% / 95% needed</p>
        </div>
      </div>

      <!-- Weekly Fluency Checks Chart -->
      <div class="chart-card">
        <h3>Weekly Fluency Checks (CPM)</h3>
        <div v-if="weeklyAssessments.length > 0" class="fluency-chart">
          <div class="chart-bars">
            <div 
              v-for="(assessment, index) in weeklyAssessments.slice(0, 8)" 
              :key="assessment.id"
              class="chart-bar-item"
            >
              <div class="bar-wrapper">
                <div 
                  class="bar-column" 
                  :style="{ height: `${(assessment.correctPerMinute / maxCPM) * 100}%` }"
                  :class="getFluencyLevelClass(assessment.correctPerMinute)"
                >
                  <span class="bar-value">{{ assessment.correctPerMinute }}</span>
                </div>
              </div>
              <div class="bar-label">Week {{ assessment.week }}</div>
              <div class="bar-date">{{ formatShortDate(assessment.assessmentDate) }}</div>
            </div>
          </div>
          
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color mastered"></span>
              <span>Mastered (40+)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color proficient"></span>
              <span>Proficient (30-39)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color developing"></span>
              <span>Developing (20-29)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color emerging"></span>
              <span>Emerging (10-19)</span>
            </div>
          </div>

          <div class="growth-summary" v-if="weeklyAssessments.length >= 2">
            <p><strong>Growth:</strong> 
              {{ weeklyAssessments[0].correctPerMinute - weeklyAssessments[weeklyAssessments.length - 1].correctPerMinute }} CPM 
              over {{ weeklyAssessments.length }} weeks
            </p>
          </div>
        </div>
        <div v-else class="no-chart-data">
          <p>No weekly assessments yet. Friday fluency checks will appear here.</p>
        </div>
      </div>

      <!-- Practice Consistency -->
      <div class="practice-card">
        <h3>Practice Consistency</h3>
        <div v-if="recentPractice.length > 0" class="practice-calendar">
          <div 
            v-for="session in recentPractice.slice(0, 14)" 
            :key="session.id"
            class="practice-day"
            :class="{ completed: session.completed, incomplete: !session.completed }"
            :title="`${formatShortDate(session.sessionDate)}: ${session.sessionQuality}`"
          >
            <div class="day-icon">{{ session.completed ? '✓' : '○' }}</div>
            <div class="day-date">{{ formatDayOfWeek(session.sessionDate) }}</div>
          </div>
        </div>
        <div v-else class="no-practice-data">
          <p>No practice sessions yet.</p>
        </div>

        <div class="practice-stats">
          <div class="practice-stat">
            <span class="stat-label">Total Sessions:</span>
            <span class="stat-value">{{ progress?.totalPracticeDays || 0 }}</span>
          </div>
          <div class="practice-stat">
            <span class="stat-label">Current Streak:</span>
            <span class="stat-value">{{ progress?.consecutivePracticeDays || 0 }} days 🔥</span>
          </div>
          <div class="practice-stat">
            <span class="stat-label">Last Practice:</span>
            <span class="stat-value">{{ formatDate(progress?.lastPracticeDate) }}</span>
          </div>
        </div>
      </div>

      <!-- Problem Areas (Focus) -->
      <div class="focus-card">
        <h3>Focus Areas</h3>
        
        <div class="focus-section">
          <h4>🔴 Does Not Know ({{ distribution.doesNotKnow }} facts)</h4>
          <div class="problem-list">
            <span 
              v-for="problem in progress?.problemBanks.doesNotKnow.slice(0, 10)" 
              :key="problem.problemId"
              class="problem-tag does-not-know"
            >
              {{ problem.displayText.replace(' = ?', '') }}
            </span>
            <span v-if="distribution.doesNotKnow > 10" class="more-tag">
              +{{ distribution.doesNotKnow - 10 }} more
            </span>
          </div>
        </div>

        <div class="focus-section" v-if="distribution.emerging > 0">
          <h4>🟢 Emerging ({{ distribution.emerging }} facts)</h4>
          <div class="problem-list">
            <span 
              v-for="problem in progress?.problemBanks.emerging.slice(0, 10)" 
              :key="problem.problemId"
              class="problem-tag emerging"
            >
              {{ problem.displayText.replace(' = ?', '') }}
              <small>({{ problem.consecutiveCorrectDays }}/3 days)</small>
            </span>
            <span v-if="distribution.emerging > 10" class="more-tag">
              +{{ distribution.emerging - 10 }} more
            </span>
          </div>
        </div>

        <div class="weak-families" v-if="weakFactFamilies.length > 0">
          <h4>⚠️ Weak Fact Families</h4>
          <div class="family-tags">
            <span v-for="family in weakFactFamilies" :key="family" class="family-tag">
              {{ family }}
            </span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-card">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          <div 
            v-for="item in recentActivity" 
            :key="item.id"
            class="activity-item"
          >
            <div class="activity-icon">{{ item.icon }}</div>
            <div class="activity-content">
              <div class="activity-title">{{ item.title }}</div>
              <div class="activity-meta">{{ item.description }}</div>
            </div>
            <div class="activity-date">{{ formatDate(item.date) }}</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-footer">
        <button @click="generateIEPReport" class="action-btn primary">
          📄 Generate IEP Report
        </button>
        <button @click="router.push('/fluency/paper-assessment')" class="action-btn">
          📝 Generate Friday Assessment
        </button>
        <button @click="router.push('/fluency/score-entry')" class="action-btn">
          ✏️ Enter Scores
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFluencyProgress, getStudentAssessments, getPracticeSessions } from '@/services/mathFluencyServices'
import type { MathFluencyProgress, MathFluencyAssessment, MathFluencyPracticeSession, OperationType } from '@/types/mathFluency'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(true)
const studentUid = ref('')
const studentName = ref('')
const selectedOperation = ref<OperationType>('addition')
const progress = ref<MathFluencyProgress | null>(null)
const weeklyAssessments = ref<MathFluencyAssessment[]>([])
const recentPractice = ref<MathFluencyPracticeSession[]>([])

// Constants
const availableOperations = [
  { value: 'addition' as OperationType, label: 'Addition', icon: '➕' },
  { value: 'subtraction' as OperationType, label: 'Subtraction', icon: '➖' },
  { value: 'multiplication' as OperationType, label: 'Multiplication', icon: '✖️' },
  { value: 'division' as OperationType, label: 'Division', icon: '➗' }
]

// Computed
const distribution = computed(() => progress.value?.proficiencyDistribution || {
  doesNotKnow: 0,
  emerging: 0,
  approaching: 0,
  proficient: 0,
  mastered: 0,
  total: 0
})

const maxCPM = computed(() => {
  if (weeklyAssessments.value.length === 0) return 50
  const max = Math.max(...weeklyAssessments.value.map(a => a.correctPerMinute || 0))
  return Math.max(50, Math.ceil(max / 10) * 10)  // Round up to nearest 10
})

const weakFactFamilies = computed(() => {
  // Get weak fact families from recent assessments
  const families = new Set<string>()
  weeklyAssessments.value.slice(0, 3).forEach(assessment => {
    assessment.weakFactFamilies?.forEach(f => families.add(f))
  })
  return Array.from(families)
})

const recentActivity = computed(() => {
  const activities: any[] = []
  
  // Add recent assessments
  weeklyAssessments.value.slice(0, 3).forEach(assessment => {
    activities.push({
      id: assessment.id,
      icon: '📊',
      title: `Week ${assessment.week} Fluency Check`,
      description: `${assessment.correctPerMinute} CPM, ${Math.round(assessment.accuracy)}% accuracy`,
      date: assessment.assessmentDate
    })
  })
  
  // Add recent practice
  recentPractice.value.slice(0, 5).forEach(session => {
    const learned = session.round1_learning?.newlyLearned?.length || 0
    activities.push({
      id: session.id,
      icon: '💪',
      title: 'Daily Practice',
      description: `${learned} facts learned, ${session.sessionQuality} quality`,
      date: session.sessionDate
    })
  })
  
  // Sort by date
  activities.sort((a, b) => {
    const aTime = a.date?.toDate?.().getTime() || 0
    const bTime = b.date?.toDate?.().getTime() || 0
    return bTime - aTime
  })
  
  return activities.slice(0, 10)
})

// Methods
onMounted(async () => {
  studentUid.value = route.params.studentUid as string
  await loadData()
})

watch(selectedOperation, async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  
  try {
    // Load progress
    progress.value = await getFluencyProgress(studentUid.value, selectedOperation.value)
    
    if (progress.value) {
      studentName.value = progress.value.studentName
      
      // Load assessments
      weeklyAssessments.value = await getStudentAssessments(studentUid.value, selectedOperation.value)
      
      // Load practice sessions (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      recentPractice.value = await getPracticeSessions(studentUid.value, selectedOperation.value, thirtyDaysAgo)
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

function getPercentage(count: number): number {
  if (distribution.value.total === 0) return 0
  return Math.round((count / distribution.value.total) * 100)
}

function capitalizeOperation(op: OperationType | string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

function getFluencyLevelClass(cpm: number): string {
  if (cpm >= 40) return 'mastered'
  if (cpm >= 30) return 'proficient'
  if (cpm >= 20) return 'developing'
  if (cpm >= 10) return 'emerging'
  return 'needs-support'
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatShortDate(timestamp: any): string {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

function formatDayOfWeek(timestamp: any): string {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function generateIEPReport() {
  // TODO: Navigate to IEP report generator
  alert('IEP Report generation coming soon! For now, use the data shown here for IEP documentation.')
}
</script>

<style scoped>
.fluency-student-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.back-btn:hover {
  background: #5a6268;
}

.header-content {
  flex: 1;
}

.header-content h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.loading-section,
.no-data-section {
  text-align: center;
  padding: 4rem 2rem;
}

.no-data-section h3 {
  color: #666;
  margin-bottom: 1rem;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

.action-btn:hover {
  background: #0056b3;
}

/* Operation Selector */
.operation-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.op-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.op-btn:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.op-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

/* Cards */
.overview-card,
.chart-card,
.practice-card,
.focus-card,
.activity-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.overview-card h3,
.chart-card h3,
.practice-card h3,
.focus-card h3,
.activity-card h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

/* Proficiency Bars */
.proficiency-bars {
  margin: 1.5rem 0;
}

.bar-row {
  display: grid;
  grid-template-columns: 140px 1fr 100px;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.bar-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.bar-container {
  height: 28px;
  background: #eee;
  border-radius: 14px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.5s;
}

.bar-row.mastered .bar-fill {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.bar-row.proficient .bar-fill {
  background: linear-gradient(90deg, #007bff, #0056b3);
}

.bar-row.approaching .bar-fill {
  background: linear-gradient(90deg, #ffc107, #ff9800);
}

.bar-row.emerging .bar-fill {
  background: linear-gradient(90deg, #17a2b8, #138496);
}

.bar-row.does-not-know .bar-fill {
  background: linear-gradient(90deg, #dc3545, #c82333);
}

.bar-count {
  font-weight: 600;
  text-align: right;
  color: #333;
}

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #666;
}

/* Unlock Status */
.unlock-status {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fff3cd;
  border-radius: 8px;
  border: 2px solid #ffc107;
}

.unlock-status.ready {
  background: #d4edda;
  border-color: #28a745;
}

.unlock-status h4 {
  margin: 0 0 1rem 0;
  color: #856404;
}

.unlock-status.ready h4 {
  color: #155724;
}

.unlock-bar {
  height: 30px;
  background: #fff;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.unlock-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.5s;
}

.unlock-text {
  text-align: center;
  margin: 0.5rem 0 0 0;
  font-weight: 600;
  color: #333;
}

/* Fluency Chart */
.fluency-chart {
  padding: 1rem 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  margin: 2rem 0;
  padding: 0 1rem;
  border-bottom: 2px solid #ddd;
}

.chart-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100px;
}

.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar-column {
  width: 60%;
  min-height: 20px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.5rem;
  transition: all 0.3s;
  cursor: pointer;
}

.bar-column:hover {
  opacity: 0.8;
}

.bar-column.mastered {
  background: linear-gradient(180deg, #28a745, #20c997);
}

.bar-column.proficient {
  background: linear-gradient(180deg, #007bff, #0056b3);
}

.bar-column.developing {
  background: linear-gradient(180deg, #ffc107, #ff9800);
}

.bar-column.emerging {
  background: linear-gradient(180deg, #17a2b8, #138496);
}

.bar-column.needs-support {
  background: linear-gradient(180deg, #dc3545, #c82333);
}

.bar-value {
  font-weight: bold;
  color: white;
  font-size: 0.9rem;
}

.bar-label,
.bar-date {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
  text-align: center;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.legend-color.mastered {
  background: #28a745;
}

.legend-color.proficient {
  background: #007bff;
}

.legend-color.developing {
  background: #ffc107;
}

.legend-color.emerging {
  background: #17a2b8;
}

.growth-summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #e7f3ff;
  border-radius: 6px;
  text-align: center;
}

.no-chart-data,
.no-practice-data {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* Practice Calendar */
.practice-calendar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.practice-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  min-width: 60px;
  border: 2px solid #ddd;
}

.practice-day.completed {
  background: #d4edda;
  border-color: #28a745;
}

.practice-day.incomplete {
  background: #fff3cd;
  border-color: #ffc107;
}

.day-icon {
  font-size: 1.5rem;
  font-weight: bold;
  color: #28a745;
}

.practice-day.incomplete .day-icon {
  color: #ffc107;
}

.day-date {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
}

.practice-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.practice-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.practice-stat .stat-label {
  font-size: 0.875rem;
  color: #666;
}

.practice-stat .stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

/* Focus Areas */
.focus-section {
  margin: 1.5rem 0;
}

.focus-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.problem-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.problem-tag {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.problem-tag small {
  font-size: 0.75rem;
  opacity: 0.8;
}

.problem-tag.does-not-know {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.problem-tag.emerging {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.more-tag {
  padding: 0.5rem 0.75rem;
  background: #e9ecef;
  border-radius: 6px;
  font-style: italic;
  color: #666;
}

.weak-families {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.weak-families h4 {
  margin: 0 0 1rem 0;
  color: #856404;
}

.family-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.family-tag {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #ffc107;
  border-radius: 6px;
  font-weight: 600;
  color: #856404;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.activity-icon {
  font-size: 2rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.activity-meta {
  font-size: 0.875rem;
  color: #666;
}

.activity-date {
  font-size: 0.875rem;
  color: #999;
  white-space: nowrap;
}

/* Actions Footer */
.actions-footer {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.action-btn.primary {
  background: #28a745;
  flex: 1;
}

.action-btn.primary:hover {
  background: #218838;
}

.actions-footer .action-btn {
  flex: 1;
}
</style>




