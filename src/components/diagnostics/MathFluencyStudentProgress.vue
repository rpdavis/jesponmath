<template>
  <div class="student-progress-container">
    <!-- Header -->
    <div class="progress-header">
      <h2>🎯 My Math Facts Progress</h2>
      <p class="subtitle">Track your fluency journey</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-section">
      <p>Loading your progress...</p>
    </div>

    <!-- No Data -->
    <div v-else-if="!hasAnyProgress" class="no-data-section">
      <div class="no-data-icon">🔢</div>
      <h3>No Fluency Data Yet</h3>
      <p>You haven't started math fluency practice yet.</p>
      <p>Ask your teacher to assign the initial diagnostic!</p>
    </div>

    <!-- Main Content -->
    <div v-else class="progress-content">
      <!-- Current Operation Card -->
      <div class="current-operation-card">
        <h3>Current Mission: {{ capitalizeOperation(currentOperation) }}</h3>
        
        <div class="achievement-display">
          <div class="achievement-bars">
            <div class="achievement-row">
              <span class="achievement-label">🏆 Mastered</span>
              <div class="achievement-bar">
                <div class="achievement-fill mastered" :style="{ width: getBarWidth('mastered') }"></div>
              </div>
              <span class="achievement-count">{{ currentDistribution.mastered }}</span>
            </div>
            
            <div class="achievement-row">
              <span class="achievement-label">🔵 Proficient</span>
              <div class="achievement-bar">
                <div class="achievement-fill proficient" :style="{ width: getBarWidth('proficient') }"></div>
              </div>
              <span class="achievement-count">{{ currentDistribution.proficient }}</span>
            </div>
            
            <div class="achievement-row">
              <span class="achievement-label">🟡 Practicing</span>
              <div class="achievement-bar">
                <div class="achievement-fill approaching" :style="{ width: getBarWidth('approaching') }"></div>
              </div>
              <span class="achievement-count">{{ currentDistribution.approaching + currentDistribution.emerging }}</span>
            </div>
          </div>

          <div class="total-stars">
            <div class="stars-number">{{ currentDistribution.mastered + currentDistribution.proficient }}</div>
            <div class="stars-label">⭐ Total Stars Earned</div>
          </div>
        </div>

        <!-- Unlock Progress -->
        <div class="unlock-section" :class="{ ready: currentProgress?.canUnlockNext }">
          <h4>{{ nextOperationMessage }}</h4>
          <div class="unlock-bar-large">
            <div class="unlock-fill-large" :style="{ width: `${Math.min(100, currentProficiency)}%` }"></div>
            <span class="unlock-text-overlay">{{ currentProficiency }}/95%</span>
          </div>
          <p class="unlock-description">
            {{ currentProgress?.canUnlockNext 
              ? '🎉 Amazing! You\'re ready to unlock the next operation!' 
              : `Keep going! You need ${95 - currentProficiency}% more to unlock ${nextOperationName}.` 
            }}
          </p>
        </div>
      </div>

      <!-- Streak Card -->
      <div class="streak-card">
        <div class="streak-icon-large">🔥</div>
        <div class="streak-content">
          <div class="streak-number">{{ currentProgress?.consecutivePracticeDays || 0 }}</div>
          <div class="streak-label">Day Streak!</div>
          <p class="streak-message">
            {{ (currentProgress?.consecutivePracticeDays || 0) > 0 
              ? 'Keep it up! Daily practice builds automaticity.' 
              : 'Start practicing today to begin your streak!' 
            }}
          </p>
        </div>
      </div>

      <!-- This Week Card -->
      <div class="week-card">
        <h3>This Week's Progress</h3>
        <div class="week-days">
          <div v-for="day in weekDays" :key="day.name" class="week-day" :class="{ completed: day.completed }">
            <div class="day-name">{{ day.name }}</div>
            <div class="day-status">{{ day.completed ? '✅' : '○' }}</div>
          </div>
        </div>
        
        <div v-if="thisWeekStats.practiced > 0" class="week-stats">
          <p><strong>This Week:</strong></p>
          <p>✓ {{ thisWeekStats.practiced }} practice sessions</p>
          <p>📚 {{ thisWeekStats.learned }} new facts learned</p>
          <p>⭐ {{ thisWeekStats.promoted }} facts promoted</p>
        </div>
      </div>

      <!-- All Operations Progress -->
      <div class="all-operations-card">
        <h3>All Operations</h3>
        <div class="operations-grid">
          <div 
            v-for="op in allOperationsProgress" 
            :key="op.operation"
            class="operation-progress-item"
            :class="{ locked: !op.unlocked, current: op.operation === currentOperation }"
            @click="selectOperation(op.operation)"
          >
            <div class="op-header">
              <span class="op-icon">{{ getOperationIcon(op.operation) }}</span>
              <span class="op-name">{{ capitalizeOperation(op.operation) }}</span>
              <span v-if="!op.unlocked" class="locked-badge">🔒 Locked</span>
            </div>
            <div v-if="op.unlocked" class="op-stats">
              <div class="op-proficiency">{{ op.proficiency }}% proficient</div>
              <div class="op-mastered">{{ op.mastered }} facts mastered</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="router.push('/fluency/daily-practice')" class="practice-btn">
          🚀 Start Today's Practice
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllFluencyProgress, getPracticeSessions } from '@/services/mathFluencyServices'
import { getNextOperation } from '@/types/mathFluency'
import type { MathFluencyProgress, OperationType, MathFluencyPracticeSession } from '@/types/mathFluency'

const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const allProgress = ref<MathFluencyProgress[]>([])
const recentPractice = ref<MathFluencyPracticeSession[]>([])

// Computed
const hasAnyProgress = computed(() => allProgress.value.length > 0)

const currentOperation = computed(() => {
  // Find first unlocked and currently practicing operation
  const current = allProgress.value.find(p => p.currentlyPracticing && p.unlocked)
  return current?.operation || 'addition'
})

const currentProgress = computed(() => {
  return allProgress.value.find(p => p.operation === currentOperation.value)
})

const currentDistribution = computed(() => currentProgress.value?.proficiencyDistribution || {
  doesNotKnow: 0,
  emerging: 0,
  approaching: 0,
  proficient: 0,
  mastered: 0,
  total: 0
})

const currentProficiency = computed(() => currentProgress.value?.proficiencyPercentage || 0)

const nextOperationName = computed(() => {
  const next = getNextOperation(currentOperation.value)
  return next ? capitalizeOperation(next) : 'All Operations'
})

const nextOperationMessage = computed(() => {
  const next = getNextOperation(currentOperation.value)
  if (!next) return 'All Operations Unlocked!'
  return `Unlock ${capitalizeOperation(next)}`
})

const weekDays = computed(() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const today = new Date().getDay()  // 0=Sunday, 1=Monday, etc.
  
  return days.map((name, index) => {
    const dayOfWeek = index + 1  // Monday = 1
    const practiced = recentPractice.value.some(session => {
      const sessionDay = session.sessionDate.toDate().getDay()
      return sessionDay === dayOfWeek && isThisWeek(session.sessionDate)
    })
    
    return { name, completed: practiced }
  })
})

const thisWeekStats = computed(() => {
  const thisWeekSessions = recentPractice.value.filter(session => isThisWeek(session.sessionDate))
  
  return {
    practiced: thisWeekSessions.length,
    learned: thisWeekSessions.reduce((sum, s) => sum + (s.round1_learning?.newlyLearned?.length || 0), 0),
    promoted: thisWeekSessions.reduce((sum, s) => sum + (s.promotionsEarned?.length || 0), 0)
  }
})

const allOperationsProgress = computed(() => {
  const ops: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  
  return ops.map(op => {
    const prog = allProgress.value.find(p => p.operation === op)
    
    if (!prog) {
      return {
        operation: op,
        unlocked: false,
        proficiency: 0,
        mastered: 0
      }
    }
    
    return {
      operation: op,
      unlocked: prog.unlocked,
      proficiency: prog.proficiencyPercentage,
      mastered: prog.proficiencyDistribution.mastered
    }
  })
})

// Methods
onMounted(async () => {
  await loadData()
})

async function loadData() {
  if (!authStore.currentUser) return
  
  loading.value = true
  
  try {
    // Load all operations progress
    allProgress.value = await getAllFluencyProgress(authStore.currentUser.uid)
    
    // Load recent practice (last 14 days)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    if (currentProgress.value) {
      recentPractice.value = await getPracticeSessions(
        authStore.currentUser.uid,
        currentOperation.value,
        twoWeeksAgo
      )
    }
  } catch (error) {
    console.error('Error loading progress:', error)
  } finally {
    loading.value = false
  }
}

function getBarWidth(level: string): string {
  const total = currentDistribution.value.total
  if (total === 0) return '0%'
  
  let count = 0
  if (level === 'mastered') count = currentDistribution.value.mastered
  else if (level === 'proficient') count = currentDistribution.value.proficient
  else if (level === 'approaching') count = currentDistribution.value.approaching + currentDistribution.value.emerging
  
  return `${(count / total) * 100}%`
}

function capitalizeOperation(op: OperationType | string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

function getOperationIcon(op: OperationType): string {
  const icons = {
    addition: '➕',
    subtraction: '➖',
    multiplication: '✖️',
    division: '➗'
  }
  return icons[op]
}

function isThisWeek(timestamp: any): boolean {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1)  // Monday
  startOfWeek.setHours(0, 0, 0, 0)
  
  return date >= startOfWeek
}

function selectOperation(op: OperationType) {
  const prog = allProgress.value.find(p => p.operation === op)
  if (prog && prog.unlocked) {
    router.push('/fluency/daily-practice')  // Or switch operation
  }
}
</script>

<style scoped>
.student-progress-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.progress-header {
  text-align: center;
  margin-bottom: 2rem;
}

.progress-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
}

.loading-section,
.no-data-section {
  text-align: center;
  padding: 4rem 2rem;
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Cards */
.current-operation-card,
.streak-card,
.week-card,
.all-operations-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.current-operation-card h3,
.week-card h3,
.all-operations-card h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

/* Achievement Display */
.achievement-display {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  align-items: center;
}

.achievement-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.achievement-row {
  display: grid;
  grid-template-columns: 120px 1fr 60px;
  align-items: center;
  gap: 0.75rem;
}

.achievement-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.achievement-bar {
  height: 24px;
  background: #eee;
  border-radius: 12px;
  overflow: hidden;
}

.achievement-fill {
  height: 100%;
  transition: width 0.5s;
}

.achievement-fill.mastered {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.achievement-fill.proficient {
  background: linear-gradient(90deg, #007bff, #0056b3);
}

.achievement-fill.approaching {
  background: linear-gradient(90deg, #17a2b8, #138496);
}

.achievement-count {
  font-weight: bold;
  text-align: right;
  color: #333;
}

.total-stars {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.stars-number {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stars-label {
  font-size: 1.1rem;
}

/* Unlock Section */
.unlock-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fff3cd;
  border-radius: 8px;
  border: 2px solid #ffc107;
}

.unlock-section.ready {
  background: #d4edda;
  border-color: #28a745;
}

.unlock-section h4 {
  margin: 0 0 1rem 0;
  color: #856404;
  text-align: center;
}

.unlock-section.ready h4 {
  color: #155724;
}

.unlock-bar-large {
  height: 40px;
  background: #fff;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  margin: 1rem 0;
}

.unlock-fill-large {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.5s;
}

.unlock-text-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}

.unlock-description {
  text-align: center;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
  color: #333;
}

/* Streak Card */
.streak-card {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  display: flex;
  align-items: center;
  gap: 2rem;
}

.streak-icon-large {
  font-size: 5rem;
}

.streak-content {
  flex: 1;
}

.streak-number {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.streak-label {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.streak-message {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

/* Week Progress */
.week-days {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
  margin: 1rem 0;
}

.week-day {
  flex: 1;
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.week-day.completed {
  background: #d4edda;
  border-color: #28a745;
}

.day-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.day-status {
  font-size: 2rem;
}

.week-stats {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.week-stats p {
  margin: 0.5rem 0;
}

/* All Operations */
.operations-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.operation-progress-item {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.operation-progress-item:hover:not(.locked) {
  border-color: #007bff;
  background: #e7f3ff;
}

.operation-progress-item.current {
  border-color: #28a745;
  background: #d4edda;
}

.operation-progress-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.op-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.op-icon {
  font-size: 1.5rem;
}

.op-name {
  font-weight: 600;
  color: #333;
  flex: 1;
}

.locked-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #6c757d;
  color: white;
  border-radius: 4px;
}

.op-stats {
  font-size: 0.875rem;
  color: #666;
}

.op-proficiency {
  font-weight: 600;
  color: #007bff;
}

.op-mastered {
  margin-top: 0.25rem;
}

/* Action Buttons */
.action-buttons {
  margin-top: 2rem;
}

.practice-btn {
  width: 100%;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s;
}

.practice-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}
</style>

