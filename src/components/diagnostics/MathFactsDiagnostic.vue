<template>
  <div class="math-facts-diagnostic-container">
    <div class="page-header">
      <h1>⚡ Math Facts Fluency Test</h1>
      <p class="subtitle">Timed assessment for addition, subtraction, multiplication, and division</p>
    </div>

    <!-- Teacher Setup Mode -->
    <div v-if="!testStarted && !isStudentTaking" class="setup-card">
      <h2>Setup Math Facts Test</h2>
      
      <!-- Test Type Selection -->
      <div class="form-group">
        <label>Select Assessment Type:</label>
        
        <!-- Core Fluency Assessments -->
        <div v-if="testConfigsByCategory['Core Fluency']" class="category-section">
          <h4 class="category-title">📊 Core Fluency Assessments</h4>
          <p class="category-description">Comprehensive tests measuring automatic recall and strategic thinking</p>
          <div class="test-type-selector">
            <label 
              v-for="item in testConfigsByCategory['Core Fluency']" 
              :key="item.key" 
              class="test-option"
              :class="{ 'recommended': item.key.startsWith('coreFluency') && !item.key.includes('All') }"
            >
              <input type="radio" v-model="selectedTestType" :value="item.key" name="testType">
              <div class="option-content">
                <span class="option-name">{{ item.config.name }}</span>
                <span class="option-details">{{ item.config.description }}</span>
                <span class="option-meta">{{ item.config.totalQuestions }} questions • {{ Math.floor(item.config.timeLimit / 60) }} min</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Quick Checks -->
        <div v-if="testConfigsByCategory['Quick Check']" class="category-section">
          <h4 class="category-title">⚡ Quick Checks (1 Minute)</h4>
          <p class="category-description">Fast fluency checks for progress monitoring</p>
          <div class="test-type-selector">
            <label 
              v-for="item in testConfigsByCategory['Quick Check']" 
              :key="item.key" 
              class="test-option compact"
            >
              <input type="radio" v-model="selectedTestType" :value="item.key" name="testType">
              <div class="option-content">
                <span class="option-name">{{ item.config.name }}</span>
                <span class="option-meta">{{ item.config.totalQuestions }} questions • {{ Math.floor(item.config.timeLimit / 60) }} min</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Extended Practice -->
        <div v-if="testConfigsByCategory['Extended Practice']" class="category-section">
          <h4 class="category-title">📚 Extended Practice</h4>
          <p class="category-description">Longer practice sessions for sustained fluency building</p>
          <div class="test-type-selector">
            <label 
              v-for="item in testConfigsByCategory['Extended Practice']" 
              :key="item.key" 
              class="test-option compact"
            >
              <input type="radio" v-model="selectedTestType" :value="item.key" name="testType">
              <div class="option-content">
                <span class="option-name">{{ item.config.name }}</span>
                <span class="option-meta">{{ item.config.totalQuestions }} questions • {{ Math.floor(item.config.timeLimit / 60) }} min</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Assignment Mode Selection -->
      <div class="form-group">
        <label>Assignment Mode:</label>
        <div class="assignment-mode-selector">
          <label class="mode-option">
            <input type="radio" v-model="assignmentMode" value="individual" name="assignmentMode">
            <span>👤 Single Student (Live Test)</span>
          </label>
          <label class="mode-option">
            <input type="radio" v-model="assignmentMode" value="all" name="assignmentMode">
            <span>👥 Assign to All My Students</span>
          </label>
          <label class="mode-option">
            <input type="radio" v-model="assignmentMode" value="class" name="assignmentMode">
            <span>🏫 Assign by Class/Period</span>
          </label>
          <label class="mode-option">
            <input type="radio" v-model="assignmentMode" value="multiple" name="assignmentMode">
            <span>✅ Select Multiple Students</span>
          </label>
        </div>
      </div>

      <!-- Single Student Selection -->
      <div v-if="assignmentMode === 'individual'" class="form-group">
        <label>Select Student:</label>
        <select v-model="selectedStudentUid" class="form-select">
          <option value="">-- Select a Student --</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>

      <!-- Class Selection -->
      <div v-if="assignmentMode === 'class'" class="form-group">
        <label>Select Class/Period:</label>
        <select v-model="selectedClass" class="form-select">
          <option value="">-- Select a Class --</option>
          <option v-for="cls in availableClasses" :key="cls" :value="cls">
            {{ cls }}
          </option>
        </select>
        <p v-if="selectedClass" class="class-info">
          {{ filteredStudentsByClass.length }} students in this class
        </p>
      </div>

      <!-- Multiple Students Selection -->
      <div v-if="assignmentMode === 'multiple'" class="form-group">
        <label>Select Students:</label>
        <div class="students-checklist">
          <label v-for="student in students" :key="student.uid" class="student-checkbox">
            <input type="checkbox" :value="student.uid" v-model="selectedStudentUids">
            <span>{{ student.firstName }} {{ student.lastName }}</span>
          </label>
        </div>
        <p class="selection-count">{{ selectedStudentUids.length }} students selected</p>
      </div>

      <!-- Test Info -->
      <div v-if="canShowInfo" class="info-box">
        <h3>⏱️ Assessment Details</h3>
        <div class="test-info-grid">
          <div class="info-item">
            <span class="info-label">Test:</span>
            <span class="info-value">{{ currentTestConfig.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Category:</span>
            <span class="info-value">{{ currentTestConfig.category }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Questions:</span>
            <span class="info-value">{{ currentTestConfig.totalQuestions }} problems</span>
          </div>
          <div class="info-item">
            <span class="info-label">Time:</span>
            <span class="info-value">{{ Math.floor(currentTestConfig.timeLimit / 60) }} {{ Math.floor(currentTestConfig.timeLimit / 60) === 1 ? 'minute' : 'minutes' }}</span>
          </div>
        </div>
        <div v-if="currentTestConfig.focusAreas && currentTestConfig.focusAreas.length > 0" class="focus-areas">
          <strong>Focus Areas:</strong>
          <ul>
            <li v-for="area in currentTestConfig.focusAreas" :key="area">{{ area }}</li>
          </ul>
        </div>
        <p class="info-note">
          <strong>Scoring:</strong> Based on accuracy and speed (questions per minute)
        </p>
      </div>

      <!-- Action Buttons -->
      <div v-if="canShowActions" class="action-buttons">
        <button 
          v-if="assignmentMode === 'individual'" 
          @click="startTest" 
          class="btn btn-primary btn-lg"
        >
          🚀 Start Live Test
        </button>
        <button 
          v-else
          @click="assignToSelectedStudents" 
          class="btn btn-primary btn-lg"
          :disabled="targetStudentCount === 0"
        >
          📤 Assign to {{ targetStudentCount }} Student{{ targetStudentCount !== 1 ? 's' : '' }}
        </button>
      </div>
    </div>

    <!-- Active Test (Student View) -->
    <div v-if="testStarted && !testComplete" class="test-container">
      <!-- Timer and Progress Header -->
      <div class="test-header">
        <div class="timer-display" :class="{ 'timer-warning': timeRemaining < 30, 'timer-danger': timeRemaining < 10 }">
          <span class="timer-icon">⏱️</span>
          <span class="timer-text">{{ formatTime(timeRemaining) }}</span>
        </div>
        <div class="progress-info">
          <span class="progress-text">{{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Question Display -->
      <div class="question-card-large">
        <div class="operation-badge" :class="currentQuestion?.operation">
          {{ operationName(currentQuestion?.operation) }}
          <span v-if="currentQuestion?.questionType && currentQuestion.questionType !== 'standard'" class="strategy-tag">
            {{ formatQuestionType(currentQuestion.questionType) }}
          </span>
        </div>
        <div class="question-display">
          <span class="question-number-large">{{ currentQuestion?.questionText }}</span>
          <span class="equals">=</span>
          <input 
            ref="answerInput"
            v-model="currentAnswer"
            type="number"
            inputmode="numeric"
            class="answer-input-large"
            placeholder="?"
            @keyup.enter="submitAnswer"
            autofocus
          />
        </div>
        
        <div v-if="currentQuestion?.hint" class="strategy-hint">
          <details>
            <summary>💡 Strategy Hint</summary>
            <p>{{ currentQuestion.hint }}</p>
          </details>
        </div>
        
        <div class="keyboard-shortcuts">
          <p>Press <kbd>Enter</kbd> to submit</p>
        </div>
      </div>

      <div class="test-actions">
        <button @click="submitAnswer" class="btn btn-primary btn-xl">
          ✅ Submit Answer
        </button>
        <button @click="skipQuestion" class="btn btn-outline">
          ⏭️ Skip
        </button>
      </div>

      <div class="test-stats">
        <div class="stat-item">
          <span class="stat-value">{{ answeredCount }}</span>
          <span class="stat-label">Answered</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ correctCount }}</span>
          <span class="stat-label">Correct</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ accuracy }}%</span>
          <span class="stat-label">Accuracy</span>
        </div>
      </div>
    </div>

    <!-- Results View - Student sees completion only -->
    <div v-if="testComplete && authStore.currentUser?.role === 'student'" class="results-container student-view">
      <div class="completion-message">
        <div class="completion-icon">✅</div>
        <h2>Math Facts Test Complete!</h2>
        <p>Great job! You completed {{ answeredCount }} questions.</p>
        <p class="info-text">Your teacher will review your results and provide feedback.</p>
        <div class="student-summary">
          <div class="summary-stat">
            <span class="stat-label">Questions</span>
            <span class="stat-value">{{ answeredCount }}/{{ questions.length }}</span>
          </div>
          <div class="summary-stat">
            <span class="stat-label">Time</span>
            <span class="stat-value">{{ Math.floor(timeSpent / 60) }}:{{ (timeSpent % 60).toString().padStart(2, '0') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Results View - Teacher sees detailed breakdown -->
    <div v-if="testComplete && authStore.currentUser?.role !== 'student'" class="results-container teacher-view">
      <div class="results-header">
        <h2>📊 Test Results</h2>
        <p v-if="selectedStudent" class="student-name">{{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</p>
      </div>

      <div class="results-summary">
        <div class="summary-card primary">
          <h3>Overall Score</h3>
          <div class="score-circle" :class="getPerformanceClass(correctCount / questions.length)">
            <span class="score-value">{{ overallScore }}%</span>
          </div>
          <p class="score-detail">{{ correctCount }} / {{ questions.length }} correct</p>
        </div>

        <div class="summary-stats">
          <div class="stat-box">
            <span class="stat-number">{{ timeSpent }}</span>
            <span class="stat-label">Seconds</span>
            <span class="stat-sublabel">Total Time</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ averageTime }}</span>
            <span class="stat-label">Seconds</span>
            <span class="stat-sublabel">Avg per Question</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ questionsPerMinute }}</span>
            <span class="stat-label">Problems/Min</span>
            <span class="stat-sublabel">Speed</span>
          </div>
        </div>
      </div>

      <!-- Operation Breakdown -->
      <div class="operation-breakdown">
        <h3>📋 Performance by Operation</h3>
        <div v-for="(result, operation) in operationResults" :key="operation" class="operation-result">
          <div class="operation-header">
            <span class="operation-name">{{ operationName(operation) }}</span>
            <span class="operation-score" :class="getPerformanceClass(result.correct / result.total)">
              {{ result.correct }} / {{ result.total }}
              <span class="percentage">({{ Math.round(result.correct / result.total * 100) }}%)</span>
            </span>
          </div>
          <div class="operation-bar">
            <div 
              class="operation-fill" 
              :style="{ width: (result.correct / result.total * 100) + '%' }"
              :class="getPerformanceClass(result.correct / result.total)"
            ></div>
          </div>
          <div class="operation-stats">
            <span>Avg Time: {{ result.avgTime.toFixed(1) }}s</span>
          </div>
        </div>
      </div>

      <!-- Detailed Breakdown by Fact Type -->
      <div v-if="detailedBreakdown.length > 0" class="detailed-breakdown">
        <h3>🎯 Detailed Performance Analysis</h3>
        <p class="breakdown-subtitle">Identify specific areas that need practice</p>
        
        <!-- Group by Operation -->
        <div v-for="[operation, items] in breakdownByOperation" :key="operation" class="operation-group">
          <h4 class="operation-group-title">{{ operation }}</h4>
          
          <div class="fact-grid">
            <div 
              v-for="item in items" 
              :key="`${item.category}-${item.factFamily}`"
              class="fact-card"
              :class="getDetailedPerformanceClass(item.accuracy)"
            >
              <div class="fact-header">
                <span class="fact-name">{{ item.factFamily }}</span>
                <span class="fact-accuracy" :class="getPerformanceClass(item.accuracy / 100)">
                  {{ item.accuracy }}%
                </span>
              </div>
              <div class="fact-stats">
                <span class="fact-count">{{ item.correct }}/{{ item.total }}</span>
                <span class="fact-time">{{ item.avgTime.toFixed(1) }}s avg</span>
              </div>
              <div class="fact-bar">
                <div 
                  class="fact-fill" 
                  :style="{ width: item.accuracy + '%' }"
                  :class="getPerformanceClass(item.accuracy / 100)"
                ></div>
              </div>
              
              <!-- Show recommendation for struggling areas -->
              <div v-if="item.accuracy < 70" class="fact-recommendation">
                <span class="icon">💡</span>
                <span class="text">Needs Practice</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Priority Areas -->
        <div v-if="priorityAreas.length > 0" class="priority-areas">
          <h4>🎯 Priority Practice Areas</h4>
          <div class="priority-list">
            <div v-for="area in priorityAreas" :key="`priority-${area.factFamily}`" class="priority-item">
              <span class="priority-icon">⚠️</span>
              <span class="priority-fact">{{ area.factFamily }}</span>
              <span class="priority-score">{{ area.accuracy }}% ({{ area.correct }}/{{ area.total }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fluency Rating -->
      <div class="fluency-rating" :class="fluencyLevel.class">
        <h3>{{ fluencyLevel.emoji }} Fluency Rating: {{ fluencyLevel.name }}</h3>
        <p>{{ fluencyLevel.description }}</p>
      </div>

      <div class="results-actions">
        <button @click="saveResults" class="btn btn-primary" v-if="!resultsSaved">
          💾 Save Results
        </button>
        <button @click="printResults" class="btn btn-secondary">
          🖨️ Print Report
        </button>
        <button @click="startNewTest" class="btn btn-outline">
          🔄 Start New Test
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { generateMathFactsTest, TEST_CONFIGS, type MathFactQuestion } from '@/utils/mathFactsGenerator'
import { db } from '@/firebase/config'
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore'
import type { Student } from '@/types/users'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Data
const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const selectedStudentUids = ref<string[]>([])
const selectedClass = ref('')
const selectedTestType = ref<keyof typeof TEST_CONFIGS>('coreFluencyAddition')
const assignmentMode = ref<'individual' | 'all' | 'class' | 'multiple'>('individual')
const questions = ref<MathFactQuestion[]>([])
const currentQuestionIndex = ref(0)
const currentAnswer = ref('')
const answers = ref<Array<{ 
  questionId: string; 
  answer: string; 
  isCorrect: boolean; 
  timeSpent: number;
  category?: string;
  factFamily?: string;
  operation?: string;
}>>([])
const testStarted = ref(false)
const testComplete = ref(false)
const isStudentTaking = ref(false)
const resultsSaved = ref(false)
const answerInput = ref<HTMLInputElement | null>(null)

// Timer
const timeRemaining = ref(0)
const timeSpent = ref(0)
const questionStartTime = ref(0)
const timerInterval = ref<number | null>(null)

// Computed
const selectedStudent = computed(() => 
  students.value.find(s => s.uid === selectedStudentUid.value)
)

const availableClasses = computed(() => {
  const classes = new Set<string>()
  students.value.forEach(student => {
    if (student.courseName) {
      classes.add(student.courseName)
    } else if (student.className) {
      classes.add(student.className)
    } else if (student.period) {
      classes.add(`Period ${student.period}`)
    }
  })
  return Array.from(classes).sort()
})

const filteredStudentsByClass = computed(() => {
  if (!selectedClass.value) return []
  return students.value.filter(student => {
    return student.courseName === selectedClass.value ||
           student.className === selectedClass.value ||
           `Period ${student.period}` === selectedClass.value
  })
})

const targetStudentCount = computed(() => {
  if (assignmentMode.value === 'all') return students.value.length
  if (assignmentMode.value === 'class') return filteredStudentsByClass.value.length
  if (assignmentMode.value === 'multiple') return selectedStudentUids.value.length
  return 0
})

const canShowInfo = computed(() => {
  if (assignmentMode.value === 'individual') return !!selectedStudentUid.value
  if (assignmentMode.value === 'all') return true
  if (assignmentMode.value === 'class') return !!selectedClass.value
  if (assignmentMode.value === 'multiple') return selectedStudentUids.value.length > 0
  return false
})

const canShowActions = computed(() => {
  if (assignmentMode.value === 'individual') return !!selectedStudentUid.value
  return targetStudentCount.value > 0
})

const currentTestConfig = computed(() => TEST_CONFIGS[selectedTestType.value])

const testConfigsByCategory = computed(() => {
  const categorized: Record<string, Array<{ key: string; config: typeof TEST_CONFIGS[keyof typeof TEST_CONFIGS] }>> = {}
  
  Object.entries(TEST_CONFIGS).forEach(([key, config]) => {
    const category = config.category || 'Other'
    if (!categorized[category]) {
      categorized[category] = []
    }
    categorized[category].push({ key, config })
  })
  
  return categorized
})

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

const progressPercentage = computed(() => 
  ((currentQuestionIndex.value + 1) / questions.value.length) * 100
)

const answeredCount = computed(() => answers.value.length)

const correctCount = computed(() => 
  answers.value.filter(a => a.isCorrect).length
)

const accuracy = computed(() => 
  answeredCount.value > 0 ? Math.round((correctCount.value / answeredCount.value) * 100) : 0
)

const overallScore = computed(() => 
  Math.round((correctCount.value / questions.value.length) * 100)
)

const averageTime = computed(() => {
  if (answers.value.length === 0) return "0"
  const totalTime = answers.value.reduce((sum, a) => sum + a.timeSpent, 0)
  return (totalTime / answers.value.length / 1000).toFixed(1)
})

// Detailed breakdown by category and fact family
const detailedBreakdown = computed(() => {
  const breakdown = new Map<string, {
    category: string;
    factFamily: string;
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    avgTime: number;
  }>()
  
  answers.value.forEach(answer => {
    if (!answer.category || !answer.factFamily) return
    
    const key = `${answer.category}|${answer.factFamily}`
    const existing = breakdown.get(key)
    
    if (existing) {
      existing.total++
      if (answer.isCorrect) {
        existing.correct++
      } else {
        existing.incorrect++
      }
      existing.accuracy = Math.round((existing.correct / existing.total) * 100)
    } else {
      breakdown.set(key, {
        category: answer.category,
        factFamily: answer.factFamily,
        total: 1,
        correct: answer.isCorrect ? 1 : 0,
        incorrect: answer.isCorrect ? 0 : 1,
        accuracy: answer.isCorrect ? 100 : 0,
        avgTime: 0
      })
    }
  })
  
  // Calculate average times
  breakdown.forEach((value, key) => {
    const category = value.category
    const factFamily = value.factFamily
    const relevantAnswers = answers.value.filter(a => 
      a.category === category && a.factFamily === factFamily
    )
    const totalTime = relevantAnswers.reduce((sum, a) => sum + a.timeSpent, 0)
    value.avgTime = relevantAnswers.length > 0 ? totalTime / relevantAnswers.length / 1000 : 0
  })
  
  return Array.from(breakdown.values()).sort((a, b) => {
    // Sort by category first, then by accuracy (lowest first to highlight struggles)
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.accuracy - b.accuracy
  })
})

// Group breakdown by operation
const breakdownByOperation = computed(() => {
  const byOperation = new Map<string, typeof detailedBreakdown.value>()
  
  detailedBreakdown.value.forEach(item => {
    const operation = item.category.split(':')[0] // e.g., "Addition" from "Addition: Sums to 10"
    const existing = byOperation.get(operation) || []
    existing.push(item)
    byOperation.set(operation, existing)
  })
  
  return byOperation
})

// Priority areas (low accuracy items that need attention)
const priorityAreas = computed(() => {
  return detailedBreakdown.value
    .filter(item => item.accuracy < 70 && item.total >= 2) // At least 2 attempts
    .sort((a, b) => a.accuracy - b.accuracy) // Lowest accuracy first
    .slice(0, 5) // Top 5 priority areas
})

const questionsPerMinute = computed(() => {
  if (timeSpent.value === 0) return 0
  return Math.round((answers.value.length / timeSpent.value) * 60)
})

const operationResults = computed(() => {
  const results: Record<string, { correct: number; total: number; avgTime: number }> = {}
  
  questions.value.forEach((q, index) => {
    if (!results[q.operation]) {
      results[q.operation] = { correct: 0, total: 0, avgTime: 0 }
    }
    results[q.operation].total++
    const answer = answers.value[index]
    if (answer?.isCorrect) {
      results[q.operation].correct++
    }
  })
  
  // Calculate average times
  Object.keys(results).forEach(operation => {
    const operationAnswers = answers.value.filter((a, i) => 
      questions.value[i]?.operation === operation
    )
    if (operationAnswers.length > 0) {
      const totalTime = operationAnswers.reduce((sum, a) => sum + a.timeSpent, 0)
      results[operation].avgTime = totalTime / operationAnswers.length / 1000
    }
  })
  
  return results
})

const fluencyLevel = computed(() => {
  const score = overallScore.value
  const speed = parseFloat(averageTime.value)
  
  // Excellent: 90%+ accuracy AND <3s average
  if (score >= 90 && speed < 3) {
    return {
      name: 'Excellent',
      emoji: '🏆',
      class: 'excellent',
      description: 'Outstanding fluency! You\'re quick and accurate with math facts.'
    }
  }
  // Good: 80%+ accuracy AND <5s average
  if (score >= 80 && speed < 5) {
    return {
      name: 'Good',
      emoji: '🎯',
      class: 'good',
      description: 'Good fluency! Keep practicing to improve speed.'
    }
  }
  // Developing: 70%+ accuracy OR reasonable speed
  if (score >= 70 || speed < 7) {
    return {
      name: 'Developing',
      emoji: '📈',
      class: 'developing',
      description: 'Making progress! Practice regularly to build fluency.'
    }
  }
  // Needs Practice
  return {
    name: 'Needs Practice',
    emoji: '💪',
    class: 'needs-practice',
    description: 'Keep working on these facts! Regular practice will help.'
  }
})

// Methods
async function loadStudents() {
  try {
    if (authStore.currentUser?.role === 'admin') {
      students.value = await getAllStudents()
    } else if (authStore.currentUser?.role === 'teacher') {
      students.value = await getStudentsByTeacher(authStore.currentUser.uid)
    }
  } catch (error) {
    console.error('Error loading students:', error)
  }
}

async function startTest() {
  const config = currentTestConfig.value
  questions.value = generateMathFactsTest(
    [...config.operations],
    config.questionsPerOperation
  )
  
  answers.value = []
  currentQuestionIndex.value = 0
  currentAnswer.value = ''
  testStarted.value = true
  timeRemaining.value = config.timeLimit
  questionStartTime.value = Date.now()
  
  // Start timer
  startTimer()
  
  // Focus input
  await nextTick()
  answerInput.value?.focus()
}

function startTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  timerInterval.value = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
      timeSpent.value++
    } else {
      // Time's up!
      finishTest()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function operationName(operation: string | undefined): string {
  switch (operation) {
    case 'addition': return 'Addition'
    case 'subtraction': return 'Subtraction'
    case 'multiplication': return 'Multiplication'
    case 'division': return 'Division'
    default: return 'Unknown'
  }
}

function formatQuestionType(type: string | undefined): string {
  switch (type) {
    case 'make10': return 'Make 10'
    case 'doubles': return 'Doubles'
    case 'inverse': return 'Fact Family'
    case 'fact-family': return 'Fact Family'
    default: return ''
  }
}

async function submitAnswer() {
  // Allow "0" as a valid answer - check for empty string specifically
  const answerStr = currentAnswer.value?.toString().trim() || ''
  if (answerStr === '') return
  
  const timeForThisQuestion = Date.now() - questionStartTime.value
  const isCorrect = answerStr === currentQuestion.value?.correctAnswer
  
  answers.value.push({
    questionId: currentQuestion.value!.id,
    answer: currentAnswer.value,
    isCorrect,
    timeSpent: timeForThisQuestion,
    category: currentQuestion.value!.category,
    factFamily: currentQuestion.value!.factFamily,
    operation: currentQuestion.value!.operation
  })
  
  // Move to next question
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    currentAnswer.value = ''
    questionStartTime.value = Date.now()
    
    // Re-focus input
    await nextTick()
    answerInput.value?.focus()
  } else {
    // Test complete!
    finishTest()
  }
}

function skipQuestion() {
  // Record as incorrect with 0 time
  answers.value.push({
    questionId: currentQuestion.value!.id,
    answer: '',
    isCorrect: false,
    timeSpent: 0,
    category: currentQuestion.value!.category,
    factFamily: currentQuestion.value!.factFamily,
    operation: currentQuestion.value!.operation
  })
  
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    currentAnswer.value = ''
    questionStartTime.value = Date.now()
  } else {
    finishTest()
  }
}

async function finishTest() {
  stopTimer()
  testComplete.value = true
  await saveResults()
}

async function saveResults() {
  if (!selectedStudentUid.value) return
  
  try {
    let student = students.value.find(s => s.uid === selectedStudentUid.value)
    
    const result = {
      studentUid: selectedStudentUid.value,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
      diagnosticType: 'math-facts',
      testType: selectedTestType.value,
      testName: currentTestConfig.value.name,
      overallScore: overallScore.value,
      totalQuestions: questions.value.length,
      correctAnswers: correctCount.value,
      timeSpent: timeSpent.value,
      averageTimePerQuestion: parseFloat(averageTime.value),
      questionsPerMinute: questionsPerMinute.value,
      fluencyLevel: fluencyLevel.value.name,
      operationResults: operationResults.value,
      answers: answers.value,
      completedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    }
    
    await addDoc(collection(db, 'diagnosticResults'), result)
    
    // Mark assignment as complete if this was an assigned test
    const assignmentId = route.query.assignment as string
    if (assignmentId && isStudentTaking.value) {
      try {
        await updateDoc(doc(db, 'diagnosticAssignments', assignmentId), {
          status: 'completed',
          isComplete: true,
          score: overallScore.value,
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
        console.log('✅ Assignment marked as complete')
      } catch (error) {
        console.error('Error updating assignment status:', error)
      }
    }
    
    console.log('✅ Math facts results saved:', result)
    resultsSaved.value = true
    
    if (isStudentTaking.value) {
      alert('Test complete! Your teacher will review your results.')
    } else {
      alert('Results saved successfully! Score: ' + overallScore.value + '%')
    }
  } catch (error) {
    console.error('Error saving results:', error)
    alert('Error saving results. Please try again.')
  }
}

function printResults() {
  window.print()
}

async function startNewTest() {
  stopTimer()
  testStarted.value = false
  testComplete.value = false
  selectedStudentUid.value = ''
  selectedStudentUids.value = []
  selectedClass.value = ''
  assignmentMode.value = 'individual'
  questions.value = []
  answers.value = []
  currentQuestionIndex.value = 0
  currentAnswer.value = ''
  resultsSaved.value = false
  timeRemaining.value = 0
  timeSpent.value = 0
}

async function assignToSelectedStudents() {
  try {
    let targetStudents: Student[] = []
    
    if (assignmentMode.value === 'all') {
      targetStudents = students.value
    } else if (assignmentMode.value === 'class') {
      targetStudents = filteredStudentsByClass.value
    } else if (assignmentMode.value === 'multiple') {
      targetStudents = students.value.filter(s => selectedStudentUids.value.includes(s.uid))
    }
    
    if (targetStudents.length === 0) {
      alert('No students selected')
      return
    }
    
    let successCount = 0
    const config = currentTestConfig.value
    
    for (const student of targetStudents) {
      try {
        const assignmentData = {
          type: 'diagnostic',
          diagnosticType: 'math-facts',
          testType: selectedTestType.value,
          title: `Math Facts Test: ${config.name}`,
          studentUid: student.uid,
          studentName: `${student.firstName} ${student.lastName}`,
          assignedBy: authStore.currentUser?.uid || 'system',
          assignedByName: authStore.currentUser?.displayName || 'System',
          assignedAt: Timestamp.now(),
          dueDate: null,
          status: 'assigned',
          isComplete: false,
          totalQuestions: config.totalQuestions,
          timeLimit: config.timeLimit,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
        
        await addDoc(collection(db, 'diagnosticAssignments'), assignmentData)
        successCount++
      } catch (error) {
        console.error(`Error assigning to ${student.firstName} ${student.lastName}:`, error)
      }
    }
    
    alert(`✅ Math Facts Test assigned to ${successCount} of ${targetStudents.length} students!`)
    await startNewTest()
  } catch (error) {
    console.error('Error assigning diagnostic:', error)
    alert('Error assigning diagnostic. Please try again.')
  }
}

function getPerformanceClass(ratio: number): string {
  if (ratio >= 0.9) return 'excellent'
  if (ratio >= 0.8) return 'good'
  if (ratio >= 0.7) return 'fair'
  return 'needs-improvement'
}

function getDetailedPerformanceClass(accuracy: number): string {
  if (accuracy >= 90) return 'excellent'
  if (accuracy >= 80) return 'good'
  if (accuracy >= 70) return 'fair'
  if (accuracy >= 50) return 'needs-improvement'
  return 'critical'
}

onMounted(async () => {
  await loadStudents()
  
  // Check if this is a student accessing an assigned diagnostic
  const assignmentId = route.query.assignment as string
  
  if (assignmentId && authStore.currentUser?.role === 'student') {
    // Student is taking an assigned diagnostic
    isStudentTaking.value = true
    
    try {
      console.log('Loading diagnostic assignment:', assignmentId)
      console.log('Current user:', authStore.currentUser.uid)
      
      // Load the assignment details
      const assignmentDoc = await getDoc(doc(db, 'diagnosticAssignments', assignmentId))
      
      if (assignmentDoc.exists()) {
        const assignmentData = assignmentDoc.data()
        console.log('Assignment data:', assignmentData)
        
        // Verify this assignment belongs to the current student
        if (assignmentData.studentUid !== authStore.currentUser.uid) {
          console.error('Assignment does not belong to this student')
          alert('This assignment is not assigned to you.')
          return
        }
        
        // Set the test type from the assignment
        if (assignmentData.testType) {
          selectedTestType.value = assignmentData.testType as keyof typeof TEST_CONFIGS
        }
        
        // Set student UID
        selectedStudentUid.value = authStore.currentUser.uid
        
        // Auto-start the test
        await startTest()
        
        // Mark assignment as started if not already complete
        if (!assignmentData.isComplete) {
          await updateDoc(doc(db, 'diagnosticAssignments', assignmentId), {
            status: 'in-progress',
            startedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          })
        }
      } else {
        console.error('Assignment not found:', assignmentId)
        alert('Assignment not found. It may have been deleted.')
      }
    } catch (error) {
      console.error('Error loading assigned diagnostic:', error)
      alert('Error loading your assigned diagnostic. Please try again or contact your teacher.')
    }
  } else if (!assignmentId && authStore.currentUser?.role === 'student') {
    // Student accessing directly without assignment - show message
    alert('Math facts tests must be assigned by your teacher. Check your dashboard for assigned tests.')
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.math-facts-diagnostic-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.setup-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

/* Category Sections */
.category-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #007bff;
}

.category-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #333;
}

.category-description {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.95rem;
  font-style: italic;
}

/* Test Type Selector */
.test-type-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.test-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.test-option.compact {
  padding: 1rem;
}

.test-option.recommended {
  border-color: #28a745;
  background: #f0fff4;
  position: relative;
}

.test-option.recommended::before {
  content: "⭐ Recommended";
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #28a745;
  color: white;
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.test-option:hover {
  border-color: #007bff;
  background: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,123,255,0.15);
}

.test-option input[type="radio"] {
  margin-top: 0.25rem;
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.test-option input[type="radio"]:checked ~ .option-content .option-name {
  font-weight: 700;
  color: #007bff;
}

.test-option input[type="radio"]:checked {
  accent-color: #007bff;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.option-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: #333;
}

.option-details {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.option-meta {
  font-size: 0.85rem;
  color: #999;
  font-weight: 500;
}

.assignment-mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.mode-option input[type="radio"]:checked + span {
  font-weight: 600;
  color: #007bff;
}

.class-info,
.selection-count {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.students-checklist {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.student-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.student-checkbox:hover {
  background: #f8f9fa;
}

.info-box {
  background: #e7f3ff;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border-left: 4px solid #007bff;
}

.info-box h3 {
  margin: 0 0 1rem 0;
  color: #0066cc;
}

.test-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.info-value {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

.focus-areas {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
}

.focus-areas strong {
  color: #0066cc;
  display: block;
  margin-bottom: 0.5rem;
}

.focus-areas ul {
  margin: 0;
  padding-left: 1.5rem;
}

.focus-areas li {
  margin: 0.4rem 0;
  color: #333;
}

.info-note {
  margin: 1rem 0 0 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 102, 204, 0.2);
  font-size: 0.95rem;
  color: #666;
}

.info-note strong {
  color: #0066cc;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.3);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-outline {
  background: white;
  border: 2px solid #007bff;
  color: #007bff;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.btn-xl {
  padding: 1.25rem 2.5rem;
  font-size: 1.3rem;
}

/* Test Container */
.test-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 900px;
  margin: 0 auto;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #e7f3ff;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #0066cc;
}

.timer-display.timer-warning {
  background: #fff3cd;
  color: #856404;
}

.timer-display.timer-danger {
  background: #f8d7da;
  color: #721c24;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.progress-info {
  flex: 1;
  margin-left: 2rem;
}

.progress-text {
  display: block;
  text-align: center;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.progress-bar {
  height: 10px;
  background: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #00d4ff);
  transition: width 0.3s;
}

/* Question Display */
.question-card-large {
  background: #f8f9fa;
  padding: 3rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  text-align: center;
}

.operation-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.operation-badge.addition {
  background: #d4edda;
  color: #155724;
}

.operation-badge.subtraction {
  background: #fff3cd;
  color: #856404;
}

.operation-badge.multiplication {
  background: #cce5ff;
  color: #004085;
}

.operation-badge.division {
  background: #f8d7da;
  color: #721c24;
}

.strategy-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255,255,255,0.5);
  border-radius: 10px;
  font-weight: 500;
}

.strategy-hint {
  margin: 1rem 0;
  padding: 0.75rem;
  background: #fff9e6;
  border-left: 3px solid #ffc107;
  border-radius: 4px;
}

.strategy-hint details {
  cursor: pointer;
}

.strategy-hint summary {
  font-weight: 600;
  color: #856404;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.strategy-hint summary::-webkit-details-marker {
  display: none;
}

.strategy-hint details[open] summary {
  margin-bottom: 0.5rem;
}

.strategy-hint p {
  margin: 0;
  padding-left: 1.75rem;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.question-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  font-size: 4rem;
  font-weight: bold;
  margin: 2rem 0;
}

.question-number-large {
  color: #333;
}

.equals {
  color: #666;
}

.answer-input-large {
  width: 200px;
  padding: 1rem;
  border: 3px solid #007bff;
  border-radius: 12px;
  font-size: 3rem;
  font-weight: bold;
  text-align: center;
  color: #007bff;
}

.answer-input-large:focus {
  outline: none;
  border-color: #0056b3;
  box-shadow: 0 0 0 4px rgba(0,123,255,0.1);
}

.keyboard-shortcuts {
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
}

kbd {
  background: #333;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
}

.test-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.test-stats {
  display: flex;
  justify-content: space-around;
  gap: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Results */
.results-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Student completion view */
.completion-message {
  text-align: center;
  padding: 4rem 2rem;
}

.completion-icon {
  font-size: 6rem;
  margin-bottom: 1rem;
}

.completion-message h2 {
  color: #28a745;
  margin-bottom: 1rem;
}

.info-text {
  color: #666;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.student-summary {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 2rem;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.summary-stat .stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-stat .stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.student-name {
  font-size: 1.2rem;
  color: #666;
}

.results-summary {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.summary-card {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.score-circle {
  width: 150px;
  height: 150px;
  margin: 1rem auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-circle.excellent {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.score-circle.good {
  background: linear-gradient(135deg, #17a2b8, #0dcaf0);
}

.score-circle.fair {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
}

.score-circle.needs-improvement {
  background: linear-gradient(135deg, #dc3545, #fd7e14);
}

.score-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

.score-detail {
  margin-top: 0.5rem;
  font-size: 1rem;
  color: #666;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-box {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #007bff;
}

.stat-sublabel {
  font-size: 0.85rem;
  color: #999;
  text-transform: uppercase;
}

/* Operation Breakdown */
.operation-breakdown {
  margin-bottom: 2rem;
}

.operation-result {
  margin-bottom: 1.5rem;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.operation-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.operation-score {
  font-weight: 600;
}

.operation-score .percentage {
  font-size: 0.9rem;
  color: #666;
  margin-left: 0.5rem;
}

.operation-score.excellent { color: #28a745; }
.operation-score.good { color: #17a2b8; }
.operation-score.fair { color: #ffc107; }
.operation-score.needs-improvement { color: #dc3545; }

.operation-bar {
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.operation-fill {
  height: 100%;
  transition: width 0.5s;
}

.operation-fill.excellent { background: #28a745; }
.operation-fill.good { background: #17a2b8; }
.operation-fill.fair { background: #ffc107; }
.operation-fill.needs-improvement { background: #dc3545; }

.operation-stats {
  font-size: 0.9rem;
  color: #666;
}

/* Fluency Rating */
.fluency-rating {
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2rem;
}

.fluency-rating.excellent {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-left: 5px solid #28a745;
}

.fluency-rating.good {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  border-left: 5px solid #17a2b8;
}

.fluency-rating.developing {
  background: linear-gradient(135deg, #fff3cd, #ffeeba);
  border-left: 5px solid #ffc107;
}

.fluency-rating.needs-practice {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-left: 5px solid #dc3545;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

@media print {
  .action-buttons,
  .test-actions,
  .btn {
    display: none !important;
  }
  
  .student-view {
    display: none !important;
  }
  
  .setup-card {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .question-display {
    font-size: 2.5rem;
    gap: 1rem;
  }
  
  .answer-input-large {
    width: 120px;
    font-size: 2rem;
  }
  
  .results-summary {
    grid-template-columns: 1fr;
  }
}

/* Detailed Breakdown Styles */
.detailed-breakdown {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.detailed-breakdown h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.breakdown-subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0 0 2rem 0;
}

.operation-group {
  margin: 2rem 0;
}

.operation-group-title {
  font-size: 1.2rem;
  color: #007bff;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.fact-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid #dee2e6;
  transition: all 0.2s;
}

.fact-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.fact-card.excellent {
  border-color: #28a745;
  background: #f0fff4;
}

.fact-card.good {
  border-color: #17a2b8;
  background: #f0f9ff;
}

.fact-card.fair {
  border-color: #ffc107;
  background: #fffbf0;
}

.fact-card.needs-improvement {
  border-color: #fd7e14;
  background: #fff5f0;
}

.fact-card.critical {
  border-color: #dc3545;
  background: #fff0f0;
}

.fact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.fact-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.fact-accuracy {
  font-weight: 700;
  font-size: 1.1rem;
}

.fact-accuracy.excellent {
  color: #28a745;
}

.fact-accuracy.good {
  color: #17a2b8;
}

.fact-accuracy.fair {
  color: #ffc107;
}

.fact-accuracy.needs-improvement {
  color: #fd7e14;
}

.fact-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.fact-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.fact-fill {
  height: 100%;
  transition: width 0.3s;
}

.fact-fill.excellent {
  background: #28a745;
}

.fact-fill.good {
  background: #17a2b8;
}

.fact-fill.fair {
  background: #ffc107;
}

.fact-fill.needs-improvement {
  background: #fd7e14;
}

.fact-recommendation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fff3cd;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #856404;
  margin-top: 0.5rem;
}

.fact-recommendation .icon {
  font-size: 1rem;
}

.priority-areas {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #fff0f0;
  border-left: 4px solid #dc3545;
  border-radius: 8px;
}

.priority-areas h4 {
  margin: 0 0 1rem 0;
  color: #dc3545;
  font-size: 1.1rem;
}

.priority-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.priority-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #f5c2c7;
}

.priority-icon {
  font-size: 1.2rem;
}

.priority-fact {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.priority-score {
  font-size: 0.9rem;
  color: #dc3545;
  font-weight: 600;
}
</style>

