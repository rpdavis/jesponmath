<template>
  <div class="placement-diagnostic-container">
    <!-- Header -->
    <!-- <div class="diagnostic-header">
      <h2>🎯 Math Fluency Placement Diagnostic</h2>
      <p class="subtitle">80-problem assessment testing each operation separately to identify starting proficiency level</p>
    </div> -->

    <!-- Setup Section (Teacher View) -->
    <div v-if="!diagnosticStarted && !testComplete && !sectionComplete" class="setup-section">
      <div class="student-selection">
        <h3>Select Student:</h3>
        <select v-model="selectedStudentUid" class="student-select">
          <option value="">Choose a student...</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.lastName }}, {{ student.firstName }}
          </option>
        </select>
      </div>

      <div v-if="selectedStudentUid" class="diagnostic-info">
        <h3>Placement Diagnostic Details:</h3>
        
        <div class="info-card">
          <p><strong>Operations Tested:</strong> ➕ Addition → ➖ Subtraction → ✖️ Multiplication → ➗ Division</p>
          <p><strong>Total Problems:</strong> 80 strategic problems (20 per operation)</p>
          <p><strong>Format:</strong> 4 separate sections - one for each operation</p>
          <p><strong>Section Size:</strong> 20 problems per operation (break after each)</p>
          <p><strong>Sampling:</strong> Stratified across difficulty levels for each operation</p>
          <p><strong>Time per Problem:</strong> 20 seconds</p>
          <p><strong>Total Time:</strong> ~25-30 minutes (split across 4 sections)</p>
          <p><strong>Student can:</strong> Take breaks between operations and resume later</p>
          <p><strong>Purpose:</strong> Quick placement → Daily practice builds full proficiency</p>
          <p><strong>Color-coded:</strong> Each operation has a distinct color to help track progress</p>
        </div>

        <div class="info-box info">
          <h4>ℹ️ Why Test Operations Separately?</h4>
          <p>This diagnostic assesses <strong>understanding of each operation</strong>, not the ability to distinguish between operations.</p>
          <ul>
            <li>20 problems per operation tested in sequence</li>
            <li>Clear labels show which operation is being tested</li>
            <li>Identifies starting proficiency level for each operation</li>
            <li>Daily practice will discover specific weak facts</li>
            <li>Paper assessments measure true fluency speed</li>
          </ul>
        </div>

        <div class="action-buttons">
          <button @click="startDiagnostic" class="start-btn">
            Start Placement Test
          </button>
          <button @click="assignDiagnostic" class="assign-btn">
            Assign to Student
          </button>
        </div>
      </div>
    </div>

    <!-- Section Break (After Each Operation) -->
    <div v-if="diagnosticStarted && sectionComplete && !testComplete" class="section-break">
      <div class="section-title-banner" :class="`operation-${completedOperationColor}`">
        <h2>✅ {{ completedOperationIcon || '🎯' }} {{ completedOperationLabel || 'Section' }} Complete!</h2>
      </div>
      <div class="break-content">
        <p class="section-summary">You've completed {{ answers.length }} of {{ problems.length }} problems (Section {{ currentSection }}/4)</p>
        
        <div class="section-stats">
          <div class="stat-box">
            <div class="stat-number">{{ completedSectionCorrect }}</div>
            <div class="stat-label">Correct in {{ completedOperationLabel }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">{{ Math.round((completedSectionCorrect / 20) * 100) }}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
        </div>

        <div class="break-message">
          <p v-if="currentSection < 4">Take a break! Click continue when ready for the next operation.</p>
          <p v-else>Great work! Click "Finish" to see your results.</p>
        </div>

        <div class="break-actions">
          <button @click="continueToNextSection" class="continue-btn">
            {{ currentSection < 4 ? 'Continue to Next Operation →' : 'Finish Diagnostic →' }}
          </button>
          <button @click="saveProgressAndExit" class="save-exit-btn" v-if="currentSection < 4">
            💾 Save & Exit (Resume Later)
          </button>
        </div>
      </div>
    </div>

    <!-- Section Introduction Dialog -->
    <div v-if="showSectionIntro && !testComplete" class="section-intro-overlay">
      <div class="section-intro-dialog" :class="`operation-${currentOperationColor}`">
        <div class="intro-header">
          <div class="intro-icon">{{ currentOperationIcon }}</div>
          <h2>{{ currentOperationLabel }}</h2>
          <p class="section-info">Section {{ currentSection }} of 4 • 20 Problems</p>
        </div>
        
        <div class="intro-message">
          <p class="intro-text-main">
            This section will test your <strong>{{ currentOperationLabel.toLowerCase() }}</strong> skills.
          </p>
          <p class="intro-text-secondary">
            Remember:
          </p>
          <ul class="intro-tips">
            <li>✓ This is just to see what you already know</li>
            <li>✓ Don't worry about typos or mistakes</li>
            <li>✓ Just do your best</li>
            <li>✓ You have 20 seconds per problem</li>
          </ul>
        </div>
        
        <button @click="startSection" class="start-section-btn">
          Start {{ currentOperationLabel }} Section →
        </button>
      </div>
    </div>

    <!-- Diagnostic In Progress -->
    <div v-if="diagnosticStarted && !testComplete && !sectionComplete && !showSectionIntro" class="test-section">
      <!-- Operation Label (Large and Clear with Color-Coding) -->
      <div class="operation-banner" :class="`operation-${currentOperationColor}`">
        <h2>{{ currentOperationIcon }} {{ currentOperationLabel }}</h2>
      </div>

      <!-- Section Progress (One Operation) -->
      <div class="section-header">
        <h3>Section {{ currentSection }} of 4: {{ currentOperationLabel }}</h3>
        <p>Problems {{ sectionStartNumber }}-{{ sectionEndNumber }}</p>
        <div class="section-progress-bar">
          <div 
            class="section-progress-fill" 
            :style="{ width: `${(currentSectionIndex / 20) * 100}%` }"
          ></div>
        </div>
        <p class="progress-text">{{ currentSectionIndex }}/20 in {{ currentOperationLabel }}</p>
      </div>

      <div class="test-header">
        <div class="progress-info">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(currentIndex / problems.length) * 100}%` }"></div>
          </div>
          <span class="progress-text">Overall: {{ currentIndex + 1 }} / {{ problems.length }}</span>
        </div>
        <div class="timer">⏱️ {{ timeRemaining }}s</div>
      </div>

      <div class="question-section">
        <div class="question-display">
          {{ currentProblem?.displayText }}
        </div>

        <div class="answer-input-section">
          <input
            ref="answerInput"
            v-model="currentAnswer"
            type="text"
            inputmode="numeric"
            class="answer-input"
            placeholder="Your answer"
            @keyup.enter="submitAnswer"
            autofocus
          />
          <button @click="submitAnswer" class="submit-btn">Submit</button>
        </div>
      </div>
    </div>

    <!-- Results/Analysis -->
    <div v-if="testComplete && analysis" class="results-section">
      <div class="results-header">
        <h2>✅ Placement Test Complete!</h2>
        <p class="subtitle">{{ selectedStudentName }}</p>
      </div>

      <div class="analysis-grid">
        <!-- Overall Performance -->
        <div class="analysis-card overall">
          <h3>Overall Performance</h3>
          <div class="metric-large">
            <span class="metric-value">{{ Math.round(analysis.overallAccuracy * 100) }}%</span>
            <span class="metric-label">Accuracy</span>
          </div>
          <div class="metric-large">
            <span class="metric-value">{{ (analysis.averageResponseTime / 1000).toFixed(1) }}s</span>
            <span class="metric-label">Avg Response Time</span>
          </div>
        </div>

        <!-- Proficiency Level -->
        <div class="analysis-card level">
          <h3>Starting Level</h3>
          <div :class="['level-badge', analysis.level]">
            {{ getLevelDisplay(analysis.level) }}
          </div>
          <p class="level-description">{{ getLevelDescription(analysis.level) }}</p>
          <p class="estimate">Estimated to mastery: <strong>{{ analysis.estimatedWeeksToMastery }} weeks</strong></p>
        </div>

        <!-- Category Breakdown -->
        <div class="analysis-card categories">
          <h3>Performance by Category</h3>
          <div class="category-list">
            <div
              v-for="(perf, category) in analysis.categoryPerformance"
              :key="String(category)"
              class="category-item"
            >
              <span class="category-name">{{ formatCategory(String(category)) }}</span>
              <div class="category-bar">
                <div
                  class="category-fill"
                  :style="{ width: `${(perf.correct / perf.total) * 100}%` }"
                  :class="getPerformanceClass(perf.correct / perf.total)"
                ></div>
              </div>
              <span class="category-score">{{ perf.correct }}/{{ perf.total }}</span>
            </div>
          </div>
        </div>

        <!-- Estimated Problem Banks -->
        <div class="analysis-card banks">
          <h3>Estimated Starting Distribution</h3>
          <div class="bank-distribution">
            <div class="bank-item">
              <span class="bank-label">🔴 Learning</span>
              <div class="bank-bar">
                <div class="bank-fill doesNotKnow" :style="{ width: `${getBankPercentage('doesNotKnow')}%` }"></div>
              </div>
              <span class="bank-count">{{ analysis.recommendedStartingBanks.doesNotKnow.length }}</span>
            </div>
            <div class="bank-item">
              <span class="bank-label">🟢 Emerging</span>
              <div class="bank-bar">
                <div class="bank-fill emerging" :style="{ width: `${getBankPercentage('emerging')}%` }"></div>
              </div>
              <span class="bank-count">{{ analysis.recommendedStartingBanks.emerging.length }}</span>
            </div>
            <div class="bank-item">
              <span class="bank-label">🟡 Approaching</span>
              <div class="bank-bar">
                <div class="bank-fill approaching" :style="{ width: `${getBankPercentage('approaching')}%` }"></div>
              </div>
              <span class="bank-count">{{ analysis.recommendedStartingBanks.approaching.length }}</span>
            </div>
            <div class="bank-item">
              <span class="bank-label">🔵 Proficient</span>
              <div class="bank-bar">
                <div class="bank-fill proficient" :style="{ width: `${getBankPercentage('proficient')}%` }"></div>
              </div>
              <span class="bank-count">{{ analysis.recommendedStartingBanks.proficient.length }}</span>
            </div>
            <div class="bank-item">
              <span class="bank-label">🏆 Mastered</span>
              <div class="bank-bar">
                <div class="bank-fill mastered" :style="{ width: `${getBankPercentage('mastered')}%` }"></div>
              </div>
              <span class="bank-count">{{ analysis.recommendedStartingBanks.mastered.length }}</span>
            </div>
          </div>
          <p class="bank-note">
            ℹ️ These are estimates. Daily practice will refine actual proficiency for each fact.
          </p>
        </div>
      </div>

      <!-- Action Buttons (Different for Student vs Teacher) -->
      <div v-if="isStudentTaking" class="action-buttons-results">
        <button @click="goToPractice" class="continue-btn primary-btn">
          🎯 Continue to Practice
        </button>
        <button @click="router.push('/dashboard')" class="dashboard-btn secondary-btn">
          🏠 Return to Dashboard
        </button>
      </div>
      <div v-else class="action-buttons-results">
        <button @click="() => saveAndContinue(false)" class="save-btn" :disabled="saving">
          {{ saving ? 'Saving...' : '💾 Save Results & Initialize Practice' }}
        </button>
        <button @click="resetDiagnostic" class="reset-btn">
          🔄 Test Another Student
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { createInitialFluencyProgress } from '@/services/mathFluencyServices'
import { assignPlacementDiagnostic, markFluencyAssignmentComplete } from '@/services/mathFluencyAssignmentServices'
import type { Student } from '@/types/users'
import type { OperationType, MathFactProblem } from '@/types/mathFluency'
import {
  generateAllOperationsPlacementDiagnostic,
  analyzePlacementResults,
  type PlacementResult,
  type PlacementAnalysis
} from '@/utils/placementDiagnosticGenerator'
import { Timestamp } from 'firebase/firestore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Assignment tracking
const assignmentId = ref<string>('')
const isStudentTaking = ref(false)

// State
const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const diagnosticStarted = ref(false)
const testComplete = ref(false)
const sectionComplete = ref(false)
const showSectionIntro = ref(false)
const completedOperation = ref<OperationType | null>(null)
const saving = ref(false)

// Problems and Progress
const problems = ref<MathFactProblem[]>([])
const currentIndex = ref(0)
const currentSection = ref(1)  // Each section = one operation
const currentSectionIndex = ref(0)
const answers = ref<PlacementResult[]>([])
const analysis = ref<PlacementAnalysis | null>(null)

// Timing
const timeRemaining = ref(20)
const questionStartTime = ref<number>(0)
const timerInterval = ref<number | null>(null)

// Input
const answerInput = ref<HTMLInputElement | null>(null)
const currentAnswer = ref('')

// Constants
const operations = [
  { value: 'addition' as OperationType, label: 'Addition (2-20)', icon: '➕' },
  { value: 'subtraction' as OperationType, label: 'Subtraction (2-20)', icon: '➖' },
  { value: 'multiplication' as OperationType, label: 'Multiplication (0-12)', icon: '✖️' },
  { value: 'division' as OperationType, label: 'Division (0-12)', icon: '➗' }
]

const TIME_PER_QUESTION = 20

// Computed
const selectedStudentName = computed(() => {
  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  return student ? `${student.firstName} ${student.lastName}` : ''
})

const currentProblem = computed(() => problems.value[currentIndex.value] || null)

// Current operation being tested
const currentOperation = computed(() => {
  if (!currentProblem.value) return null
  return currentProblem.value.operation
})

const currentOperationLabel = computed(() => {
  if (!currentOperation.value) return ''
  const labels = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division'
  }
  return labels[currentOperation.value] || ''
})

const currentOperationIcon = computed(() => {
  if (!currentOperation.value) return ''
  const icons = {
    addition: '➕',
    subtraction: '➖',
    multiplication: '✖️',
    division: '➗'
  }
  return icons[currentOperation.value] || ''
})

const currentOperationColor = computed(() => {
  if (!currentOperation.value) return 'default'
  return currentOperation.value
})

const completedOperationLabel = computed(() => {
  console.log('🔍 completedOperationLabel computed:', completedOperation.value)
  if (!completedOperation.value) {
    console.warn('⚠️ completedOperation is null/undefined!')
    return ''
  }
  const labels = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division'
  }
  return labels[completedOperation.value] || ''
})

const completedOperationIcon = computed(() => {
  if (!completedOperation.value) return ''
  const icons = {
    addition: '➕',
    subtraction: '➖',
    multiplication: '✖️',
    division: '➗'
  }
  return icons[completedOperation.value] || ''
})

const completedOperationColor = computed(() => {
  if (!completedOperation.value) return 'default'
  return completedOperation.value
})

const sectionStartNumber = computed(() => (currentSection.value - 1) * 20 + 1)
const sectionEndNumber = computed(() => Math.min(currentSection.value * 20, problems.value.length))

const currentSectionCorrect = computed(() => {
  const sectionStart = (currentSection.value - 1) * 20
  const sectionEnd = currentSection.value * 20
  const sectionAnswers = answers.value.slice(sectionStart, sectionEnd)
  return sectionAnswers.filter(a => a.correct).length
})

const completedSectionCorrect = computed(() => {
  // The completed section is currentSection - 1 when we're at the break
  const completedSectionNum = currentSection.value - 1
  const sectionStart = (completedSectionNum - 1) * 20
  const sectionEnd = completedSectionNum * 20
  const sectionAnswers = answers.value.slice(sectionStart, sectionEnd)
  const correctCount = sectionAnswers.filter(a => a.correct).length
  
  console.log('📊 Calculating completed section score:', {
    completedSectionNum,
    sectionStart,
    sectionEnd,
    totalAnswers: sectionAnswers.length,
    correctAnswers: correctCount,
    incorrectAnswers: sectionAnswers.filter(a => !a.correct).map(a => ({
      problem: `${a.num1} ${a.operation === 'addition' ? '+' : a.operation === 'subtraction' ? '-' : a.operation === 'multiplication' ? '×' : '÷'} ${a.num2}`,
      studentAnswer: a.studentAnswer,
      correctAnswer: a.correctAnswer,
      problemId: a.problemId
    }))
  })
  
  return correctCount
})

const totalBanks = computed(() => {
  if (!analysis.value) return 0
  const banks = analysis.value.recommendedStartingBanks
  return banks.doesNotKnow.length + banks.emerging.length + banks.approaching.length + 
         banks.proficient.length + banks.mastered.length
})

// Methods
onMounted(async () => {
  // Check if this is an assigned diagnostic for a student
  const assignmentParam = route.query.assignment as string
  
  if (assignmentParam) {
    assignmentId.value = assignmentParam
    isStudentTaking.value = true
    selectedStudentUid.value = authStore.currentUser?.uid || ''
    
    // Auto-start for students (will check for saved progress)
    await startDiagnostic()
  } else {
    // Teacher mode - load students for assignment
    await loadStudents()
  }
})

async function loadStudents() {
  try {
    const user = authStore.currentUser
    if (!user) return

    if (user.role === 'admin') {
      students.value = await getAllStudents()
    } else {
      students.value = await getStudentsByTeacher(user.uid)
    }
  } catch (error) {
    console.error('Error loading students:', error)
  }
}

async function startDiagnostic() {
  // Check for saved progress first
  const savedProgress = await loadSavedProgress()
  
  if (savedProgress) {
    // Inform the student they'll continue where they left off (no cancel option)
    alert(
      `Assessment in progress\n\nYou have completed ${savedProgress.answersCompleted} of ${savedProgress.totalProblems} problems.\n\nYou will continue where you left off.`
    )
    
    // Automatically restore saved state
    problems.value = savedProgress.problems
    answers.value = savedProgress.answers
    currentSection.value = savedProgress.currentSection
    currentSectionIndex.value = savedProgress.currentSectionIndex
    currentIndex.value = savedProgress.answers.length
    
    diagnosticStarted.value = true
    
    // Check if we're at a section break
    if (currentSectionIndex.value >= 20 && currentIndex.value < problems.value.length) {
      sectionComplete.value = true
    } else {
      startQuestionTimer()
      await nextTick()
      answerInput.value?.focus()
    }
    
    return
  }
  
  // Generate placement problems for ALL operations (20 per operation = 80 total)
  // Operations tested separately in order: Addition → Subtraction → Multiplication → Division
  problems.value = generateAllOperationsPlacementDiagnostic(20)
  
  // Debug: Log operations for each section
  console.log('🔢 Generated Problems by Section:')
  for (let i = 0; i < 4; i++) {
    const sectionStart = i * 20
    const sectionEnd = (i + 1) * 20
    const sectionProblems = problems.value.slice(sectionStart, sectionEnd)
    const operations = [...new Set(sectionProblems.map(p => p.operation))]
    console.log(`  Section ${i + 1} (problems ${sectionStart + 1}-${sectionEnd}): ${operations.join(', ')}`)
    console.log(`    ${sectionProblems.length} problems`)
  }
  
  diagnosticStarted.value = true
  currentIndex.value = 0
  answers.value = []
  currentAnswer.value = ''
  
  // Show section intro dialog for first section
  showSectionIntro.value = true
}

function startSection() {
  // Hide intro dialog and start the questions
  showSectionIntro.value = false
  
  startQuestionTimer()
  nextTick(() => {
    answerInput.value?.focus()
  })
}

function startQuestionTimer() {
  timeRemaining.value = TIME_PER_QUESTION
  questionStartTime.value = Date.now()
  
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  timerInterval.value = setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      autoAdvance()
    }
  }, 1000) as unknown as number
}

async function submitAnswer() {
  if (!currentProblem.value) return
  
  const responseTime = Date.now() - questionStartTime.value
  const problem = currentProblem.value
  const studentAnswer = currentAnswer.value.trim()
  const isCorrect = studentAnswer === problem.correctAnswer
  
  console.log('✏️ Answer submitted:', {
    problemId: problem.id,
    problem: `${problem.num1} ${problem.operation === 'addition' ? '+' : problem.operation === 'subtraction' ? '-' : problem.operation === 'multiplication' ? '×' : '÷'} ${problem.num2}`,
    correctAnswer: problem.correctAnswer,
    correctAnswerType: typeof problem.correctAnswer,
    studentAnswer: studentAnswer,
    studentAnswerType: typeof studentAnswer,
    isCorrect,
    comparison: `"${studentAnswer}" === "${problem.correctAnswer}" = ${studentAnswer === problem.correctAnswer}`,
    responseTime: Math.round(responseTime / 1000) + 's'
  })
  
  answers.value.push({
    problemId: problem.id,
    num1: problem.num1,
    num2: problem.num2,
    operation: problem.operation,
    correctAnswer: problem.correctAnswer,
    studentAnswer: currentAnswer.value.trim(),
    correct: isCorrect,
    responseTime,
    category: problem.category,
    factFamily: problem.factFamily
  })
  
  // Check if section is complete (every 20 problems = one operation)
  currentSectionIndex.value++
  
  console.log('📊 Section progress:', {
    section: currentSection.value,
    sectionIndex: currentSectionIndex.value,
    totalAnswers: answers.value.length,
    currentIndex: currentIndex.value,
    totalProblems: problems.value.length
  })
  
  if (currentSectionIndex.value >= 20 && currentIndex.value + 1 < problems.value.length) {
    // Section complete (operation complete), show break
    // Store the operation that was just completed (from the problem we just answered)
    completedOperation.value = problem.operation
    
    console.log('🎯 Setting completedOperation to:', problem.operation)
    
    console.log('✅ Section complete:', {
      completedSection: currentSection.value,
      completedOperation: completedOperation.value,
      answersThisSection: currentSectionIndex.value
    })
    
    sectionComplete.value = true
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
    
    // Auto-save progress at section completion (silent)
    await saveProgress(true)
    console.log('💾 Auto-saved progress at section completion')
  } else {
    await nextQuestion()
  }
}

async function autoAdvance() {
  if (!currentProblem.value) return
  
  const problem = currentProblem.value
  
  // Record as incorrect (no answer)
  answers.value.push({
    problemId: problem.id,
    num1: problem.num1,
    num2: problem.num2,
    operation: problem.operation,
    correctAnswer: problem.correctAnswer,
    studentAnswer: '',
    correct: false,
    responseTime: TIME_PER_QUESTION * 1000,
    category: problem.category,
    factFamily: problem.factFamily
  })
  
  // Check if section is complete (every 20 problems = one operation)
  currentSectionIndex.value++
  
  console.log('⏰ Auto-advance - Section progress:', {
    section: currentSection.value,
    sectionIndex: currentSectionIndex.value,
    totalAnswers: answers.value.length,
    currentIndex: currentIndex.value,
    totalProblems: problems.value.length
  })
  
  if (currentSectionIndex.value >= 20 && currentIndex.value + 1 < problems.value.length) {
    // Section complete (operation complete), show break
    // Store the operation that was just completed (from the problem we just answered)
    completedOperation.value = problem.operation
    
    console.log('🎯 Auto-advance: Setting completedOperation to:', problem.operation)
    
    console.log('✅ Section complete (auto-advance):', {
      completedSection: currentSection.value,
      completedOperation: completedOperation.value,
      answersThisSection: currentSectionIndex.value
    })
    
    sectionComplete.value = true
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
    
    // Auto-save progress at section completion (silent)
    await saveProgress(true)
    console.log('💾 Auto-saved progress at section completion (auto-advance)')
  } else {
    await nextQuestion()
  }
}

async function nextQuestion() {
  currentIndex.value++
  currentAnswer.value = ''
  
  if (currentIndex.value >= problems.value.length) {
    await finishTest()
  } else {
    startQuestionTimer()
    nextTick(() => {
      answerInput.value?.focus()
    })
  }
}

async function continueToNextSection() {
  // Increment currentIndex to move to the first problem of the next section
  currentIndex.value++
  
  if (currentIndex.value >= problems.value.length) {
    await finishTest()
    return
  }
  
  console.log('➡️ Continuing to next section:', {
    newCurrentIndex: currentIndex.value,
    newSection: currentSection.value + 1,
    totalProblems: problems.value.length
  })
  
  // Move to next section (next operation)
  currentSection.value++
  currentSectionIndex.value = 0
  sectionComplete.value = false
  
  // Show section intro dialog for the new section
  showSectionIntro.value = true
}

async function saveProgress(silent: boolean = false): Promise<boolean> {
  try {
    const { setDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    const progressId = `${selectedStudentUid.value}_placement`
    const progressRef = doc(db, 'mathFluencyDiagnosticProgress', progressId)
    
    const progressData = {
      studentUid: selectedStudentUid.value,
      diagnosticType: 'placement',
      assignmentId: assignmentId.value,
      problems: problems.value,
      answers: answers.value,
      currentSection: currentSection.value,
      currentSectionIndex: currentSectionIndex.value,
      answersCompleted: answers.value.length,
      totalProblems: problems.value.length,
      inProgress: true,
      lastSaved: Timestamp.now(),
      createdAt: Timestamp.now()
    }
    
    console.log('💾 Saving progress:', {
      progressId,
      answersCompleted: answers.value.length,
      totalProblems: problems.value.length,
      section: currentSection.value,
      silent
    })
    
    await setDoc(progressRef, progressData)
    
    if (!silent) {
      alert('✅ Progress saved! You can resume this diagnostic later from your dashboard.')
    }
    
    return true
  } catch (error) {
    console.error('Error saving progress:', error)
    if (!silent) {
      alert('Error saving progress. Please try again.')
    }
    return false
  }
}

async function saveProgressAndExit() {
  saving.value = true
  
  try {
    const saved = await saveProgress(false)
    
    if (saved) {
      // Navigate back
      if (isStudentTaking.value) {
        router.push('/dashboard')
      } else {
        router.push('/fluency/dashboard')
      }
    }
  } finally {
    saving.value = false
  }
}

async function loadSavedProgress() {
  if (!selectedStudentUid.value) return null
  
  try {
    const { getDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    const progressId = `${selectedStudentUid.value}_placement`
    const progressRef = doc(db, 'mathFluencyDiagnosticProgress', progressId)
    
    const progressDoc = await getDoc(progressRef)
    
    if (progressDoc.exists() && progressDoc.data().inProgress) {
      console.log('📂 Found saved progress:', progressDoc.data())
      return progressDoc.data()
    }
    
    return null
  } catch (error) {
    console.error('Error loading progress:', error)
    return null
  }
}

async function clearSavedProgress() {
  if (!selectedStudentUid.value) return
  
  try {
    const { deleteDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    const progressId = `${selectedStudentUid.value}_placement`
    const progressRef = doc(db, 'mathFluencyDiagnosticProgress', progressId)
    
    await deleteDoc(progressRef)
    console.log('🗑️ Saved progress cleared')
  } catch (error) {
    console.error('Error clearing progress:', error)
  }
}

async function assignDiagnostic() {
  if (!selectedStudentUid.value) return
  
  saving.value = true
  
  try {
    const student = students.value.find(s => s.uid === selectedStudentUid.value)
    if (!student) throw new Error('Student not found')
    
    await assignPlacementDiagnostic(
      selectedStudentUid.value,
      `${student.firstName} ${student.lastName}`,
      authStore.currentUser?.uid || 'system',
      authStore.currentUser?.displayName
    )
    
    alert(`✅ Placement diagnostic assigned to ${selectedStudentName.value}!\n\nThey can access it from their dashboard.`)
    router.push('/fluency/dashboard')
  } catch (error) {
    console.error('Error assigning diagnostic:', error)
    alert('Error assigning diagnostic. Please try again.')
  } finally {
    saving.value = false
  }
}

async function finishTest() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  // Clear saved progress
  await clearSavedProgress()
  
  // Analyze results for each operation separately
  const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  
  // For now, just analyze the first operation (addition) to display results
  // TODO: Update UI to show results for all 4 operations
  const additionAnswers = answers.value.filter(a => a.operation === 'addition')
  
  console.log('📊 Analyzing results:', {
    totalAnswers: answers.value.length,
    additionAnswers: additionAnswers.length,
    operations: operations.map(op => ({
      operation: op,
      count: answers.value.filter(a => a.operation === op).length
    }))
  })
  
  if (additionAnswers.length > 0) {
    analysis.value = analyzePlacementResults(additionAnswers, 'addition')
  } else {
    console.warn('⚠️ No addition answers found, using all answers')
    // Fallback: use all answers with the most common operation
    const mostCommonOp = operations.reduce((prev, curr) => 
      answers.value.filter(a => a.operation === curr).length > 
      answers.value.filter(a => a.operation === prev).length ? curr : prev
    , 'addition')
    analysis.value = analyzePlacementResults(
      answers.value.filter(a => a.operation === mostCommonOp),
      mostCommonOp
    )
  }
  
  testComplete.value = true
  diagnosticStarted.value = false
  
  // If student is taking their own diagnostic, automatically save and initialize practice
  if (isStudentTaking.value) {
    console.log('🎓 Student completed diagnostic, auto-saving and initializing practice...')
    await saveAndContinue(true) // true = autoSaved (no alert, no redirect)
  }
}

async function saveAndContinue(autoSaved: boolean = false) {
  if (!selectedStudentUid.value) return
  
  saving.value = true
  
  try {
    let studentName = selectedStudentName.value
    
    // If student taking assigned diagnostic
    if (isStudentTaking.value && authStore.currentUser) {
      studentName = authStore.currentUser.displayName || 'Student'
    } else {
      // Teacher mode
      const student = students.value.find(s => s.uid === selectedStudentUid.value)
      if (!student) throw new Error('Student not found')
      studentName = `${student.firstName} ${student.lastName}`
    }
    
    // Save results for ALL operations
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
    
    for (const operation of operations) {
      const operationAnswers = answers.value.filter(a => a.operation === operation)
      
      if (operationAnswers.length > 0) {
        console.log(`💾 Saving ${operation} results:`, operationAnswers.length, 'problems')
        
        const operationAnalysis = analyzePlacementResults(operationAnswers, operation)
        
        await createInitialFluencyProgress(
          selectedStudentUid.value,
          studentName,
          operation,
          operationAnalysis.recommendedStartingBanks,
          authStore.currentUser?.uid || 'unknown'
        )
      }
    }
    
    // Mark assignment as complete if this was an assigned diagnostic
    if (assignmentId.value && isStudentTaking.value && analysis.value) {
      const accuracy = Math.round((analysis.value.overallAccuracy) * 100)
      await markFluencyAssignmentComplete(assignmentId.value, accuracy)
    }
    
    // Only show message and redirect if NOT auto-saved
    if (!autoSaved) {
      const message = isStudentTaking.value 
        ? `✅ Placement diagnostic complete! You're ready for daily practice.`
        : `✅ Placement complete! ${studentName} is ready for daily practice.`
      
      alert(message)
      
      // Navigate to appropriate dashboard
      if (isStudentTaking.value) {
        router.push('/dashboard')
      } else {
        router.push('/fluency/dashboard')
      }
    }
  } catch (error) {
    console.error('Error saving placement results:', error)
    alert('Error saving results. Please try again.')
  } finally {
    saving.value = false
  }
}

function goToPractice() {
  // Navigate to daily practice
  router.push('/fluency/daily-practice')
}

function resetDiagnostic() {
  selectedStudentUid.value = ''
  diagnosticStarted.value = false
  testComplete.value = false
  sectionComplete.value = false
  problems.value = []
  answers.value = []
  analysis.value = null
  currentIndex.value = 0
  currentSection.value = 1
  currentSectionIndex.value = 0
}

function getLevelDisplay(level: string): string {
  const displays: { [key: string]: string } = {
    'foundational': '🟥 Foundational',
    'developing': '🟨 Developing',
    'proficient': '🟦 Proficient',
    'advanced': '🟩 Advanced'
  }
  return displays[level] || level
}

function getLevelDescription(level: string): string {
  const descriptions: { [key: string]: string } = {
    'foundational': 'Student is building basic fact knowledge. Focus on learning core facts.',
    'developing': 'Student knows basics but needs practice for fluency and complex facts.',
    'proficient': 'Strong accuracy with good speed. Working toward automatic recall.',
    'advanced': 'Excellent accuracy and speed. Ready for maintenance and next operation.'
  }
  return descriptions[level] || ''
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getPerformanceClass(accuracy: number): string {
  if (accuracy >= 0.8) return 'excellent'
  if (accuracy >= 0.6) return 'good'
  if (accuracy >= 0.4) return 'fair'
  return 'needs-work'
}

function getBankPercentage(bankName: 'doesNotKnow' | 'emerging' | 'approaching' | 'proficient' | 'mastered'): number {
  if (!analysis.value) return 0
  const count = analysis.value.recommendedStartingBanks[bankName].length
  return totalBanks.value > 0 ? (count / totalBanks.value) * 100 : 0
}
</script>

<style scoped>
.placement-diagnostic-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Section Introduction Dialog */
.section-intro-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.section-intro-dialog {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.intro-header {
  color: white;
  padding: 2.5rem 2rem;
  text-align: center;
}

.section-intro-dialog.operation-addition .intro-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.section-intro-dialog.operation-subtraction .intro-header {
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%);
}

.section-intro-dialog.operation-multiplication .intro-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.section-intro-dialog.operation-division .intro-header {
  background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
}

.intro-icon {
  font-size: 4rem;
  margin-bottom: 0.5rem;
}

.intro-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.section-info {
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
  opacity: 0.9;
}

.intro-message {
  padding: 2rem;
}

.intro-text-main {
  font-size: 1.2rem;
  margin: 0 0 1.5rem 0;
  color: #333;
  line-height: 1.6;
}

.intro-text-secondary {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #555;
}

.intro-tips {
  list-style: none;
  padding: 0;
  margin: 0;
}

.intro-tips li {
  padding: 0.75rem 0;
  font-size: 1rem;
  color: #666;
  line-height: 1.5;
  border-bottom: 1px solid #eee;
}

.intro-tips li:last-child {
  border-bottom: none;
}

.start-section-btn {
  width: calc(100% - 4rem);
  margin: 0 2rem 2rem 2rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.start-section-btn:hover {
  background: linear-gradient(135deg, #5568d3 0%, #63418d 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.start-section-btn:active {
  transform: translateY(0);
}

.diagnostic-header {
  text-align: center;
  margin-bottom: 3rem;
}

.diagnostic-header h2 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
}

/* Setup Section */
.setup-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.operation-selection h3,
.student-selection h3,
.diagnostic-info h3 {
  margin-bottom: 1rem;
  color: #34495e;
}

.operation-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.operation-btn {
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.operation-btn:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.operation-btn.active {
  border-color: #3498db;
  background: #3498db;
  color: white;
}

.student-select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.info-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-card p {
  margin: 0.5rem 0;
  color: #555;
}

.info-box {
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #3498db;
}

.info-box.info {
  background: #e3f2fd;
}

.info-box h4 {
  margin-top: 0;
  color: #2980b9;
}

.info-box ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.3rem 0;
  color: #555;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.start-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.start-btn:hover {
  background: #229954;
}

/* Section Break (After Each Operation) */
.section-break {
  background: white;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  text-align: center;
  overflow: hidden;
}

.section-title-banner {
  color: white;
  padding: 2rem 1.5rem;
  margin: 0;
}

.section-title-banner h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  text-transform: uppercase;
 
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Apply same colors as operation banners */
.section-title-banner.operation-addition {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.section-title-banner.operation-subtraction {
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%);
}

.section-title-banner.operation-multiplication {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.section-title-banner.operation-division {
  background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
}

.break-content {
  padding: 2rem 3rem 3rem 3rem;
}

.section-summary {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.section-stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.stat-box {
  background: #f8f9fa;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  min-width: 150px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.break-message {
  background: #e7f3ff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.break-message p {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.break-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.continue-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.continue-btn:hover {
  background: #0056b3;
}

.save-exit-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.save-exit-btn:hover {
  background: #5a6268;
}

.assign-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.assign-btn:hover {
  background: #5568d3;
}

/* Operation Banner - Different colors for each operation */
.operation-banner {
  color: white;
  padding: 2rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.operation-banner h2 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Color-coding by operation */
.operation-banner.operation-addition {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.4);
}

.operation-banner.operation-subtraction {
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
}

.operation-banner.operation-multiplication {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.operation-banner.operation-division {
  background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
  box-shadow: 0 4px 16px rgba(255, 167, 38, 0.4);
}

.operation-banner.operation-default {
  background: linear-gradient(135deg, #78909C 0%, #546E7A 100%);
  box-shadow: 0 4px 16px rgba(120, 144, 156, 0.4);
}

/* Section Header (Operation-Specific) */
.section-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
  border-top: 4px solid #667eea;
}

.section-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.section-header p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.section-progress-bar {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.section-progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

/* Color-code section progress by operation */
.operation-addition + .section-header {
  border-top-color: #4CAF50;
}

.operation-addition + .section-header .section-progress-fill {
  background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
}

.operation-subtraction + .section-header {
  border-top-color: #FF6B6B;
}

.operation-subtraction + .section-header .section-progress-fill {
  background: linear-gradient(90deg, #FF6B6B 0%, #EE5A52 100%);
}

.operation-multiplication + .section-header {
  border-top-color: #667eea;
}

.operation-multiplication + .section-header .section-progress-fill {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.operation-division + .section-header {
  border-top-color: #FFA726;
}

.operation-division + .section-header .section-progress-fill {
  background: linear-gradient(90deg, #FFA726 0%, #FB8C00 100%);
}

/* Test Section */
.test-section {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  min-height: 400px;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.progress-info {
  flex: 1;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s;
}

.progress-text {
  color: #666;
  font-size: 0.9rem;
}

.timer {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e74c3c;
}

.question-section {
  text-align: center;
}

.question-display {
  font-size: 3rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 3rem;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.answer-input-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.answer-input {
  width: 200px;
  padding: 1rem;
  font-size: 1.5rem;
  text-align: center;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.answer-input:focus {
  outline: none;
  border-color: #3498db;
}

.submit-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.submit-btn:hover {
  background: #2980b9;
}

/* Results Section */
.results-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.results-header h2 {
  font-size: 2rem;
  color: #27ae60;
  margin-bottom: 0.5rem;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.analysis-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
}

.analysis-card h3 {
  margin-top: 0;
  color: #34495e;
  margin-bottom: 1rem;
}

.analysis-card.overall {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.metric-large {
  text-align: center;
}

.metric-value {
  display: block;
  font-size: 3rem;
  font-weight: 700;
  color: #3498db;
}

.metric-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.level-badge {
  display: inline-block;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.level-badge.foundational {
  background: #ffebee;
  color: #c62828;
}

.level-badge.developing {
  background: #fff3e0;
  color: #ef6c00;
}

.level-badge.proficient {
  background: #e3f2fd;
  color: #1565c0;
}

.level-badge.advanced {
  background: #e8f5e9;
  color: #2e7d32;
}

.level-description {
  color: #666;
  margin-bottom: 1rem;
}

.estimate {
  color: #666;
  font-size: 0.9rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-name {
  min-width: 120px;
  font-size: 0.9rem;
  color: #555;
}

.category-bar {
  flex: 1;
  height: 24px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  transition: width 0.3s;
}

.category-fill.excellent {
  background: #27ae60;
}

.category-fill.good {
  background: #3498db;
}

.category-fill.fair {
  background: #f39c12;
}

.category-fill.needs-work {
  background: #e74c3c;
}

.category-score {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #555;
}

.bank-distribution {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bank-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bank-label {
  min-width: 120px;
  font-size: 0.9rem;
  font-weight: 600;
}

.bank-bar {
  flex: 1;
  height: 24px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bank-fill {
  height: 100%;
  transition: width 0.3s;
}

.bank-fill.doesNotKnow {
  background: #e74c3c;
}

.bank-fill.emerging {
  background: #f39c12;
}

.bank-fill.approaching {
  background: #f1c40f;
}

.bank-fill.proficient {
  background: #3498db;
}

.bank-fill.mastered {
  background: #27ae60;
}

.bank-count {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #555;
}

.bank-note {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #856404;
}

.action-buttons-results {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.save-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.save-btn:hover {
  background: #229954;
}

.save-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.reset-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.reset-btn:hover {
  background: #7f8c8d;
}

/* Student View Buttons */
.primary-btn {
  padding: 1.2rem 2.5rem;
  font-size: 1.2rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.secondary-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.continue-btn {
  /* Inherits from primary-btn */
}

.dashboard-btn {
  /* Inherits from secondary-btn */
}
</style>

