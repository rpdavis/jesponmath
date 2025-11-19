<template>
  <div class="math-fluency-diagnostic-container">
    <!-- Header -->
    <div class="diagnostic-header">
      <h2>🎯 Math Fluency Initial Diagnostic</h2>
      <p class="subtitle">Comprehensive assessment of all math facts to establish baseline proficiency</p>
    </div>

    <!-- Student Selection (Teacher View Only) -->
    <div v-if="!diagnosticStarted && !testComplete && !isStudentTaking" class="setup-section">
      <div class="operation-selection">
        <h3>Select Operation:</h3>
        <div class="operation-buttons">
          <button
            v-for="op in operations"
            :key="op.value"
            @click="selectedOperation = op.value"
            :class="['operation-btn', { active: selectedOperation === op.value }]"
          >
            {{ op.icon }} {{ op.label }}
          </button>
        </div>
      </div>

      <div v-if="selectedOperation" class="student-selection">
        <h3>Select Student:</h3>
        <select v-model="selectedStudentUid" class="student-select">
          <option value="">Choose a student...</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.lastName }}, {{ student.firstName }}
          </option>
        </select>
      </div>

      <div v-if="selectedOperation" class="diagnostic-options">
        <h3>Diagnostic Options:</h3>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="excludeZeroProblems" />
            <span>Exclude problems with zero (0+5, 7-0, 0×8, 20÷0, etc.)</span>
          </label>
          <p class="help-text">
            Zero problems are often trivial. Excluding them focuses on more challenging facts.
          </p>
        </div>
        
        <p class="info-note">
          ℹ️ Note: Commutative problems reduced - only one version tested (e.g., 3+12, not both 3+12 and 12+3)
        </p>
      </div>

      <div v-if="selectedOperation && selectedStudentUid" class="diagnostic-info">
        <h3>Diagnostic Details:</h3>
        
        <div class="info-card">
          <p><strong>Total Problems:</strong> {{ filteredProblemsCount }}</p>
          <p><strong>Commutative Pairs:</strong> Reduced (only one version per pair)</p>
          <p><strong>Zero Problems:</strong> {{ excludeZeroProblems ? 'Excluded' : 'Included' }}</p>
          <p><strong>Time per Problem:</strong> 20 seconds (untimed feel)</p>
          <p><strong>Format:</strong> Chunks of 25 problems each</p>
          <p><strong>Student can:</strong> Stop after each chunk and resume later</p>
          <p><strong>Total Time:</strong> ~{{ Math.ceil(filteredProblemsCount / 25) * 10 }} minutes (split across sessions)</p>
          <p><strong>Purpose:</strong> Establish baseline for each fact individually</p>
        </div>

        <div class="action-buttons">
          <button @click="startDiagnostic" class="start-btn">
            Start Diagnostic Now
          </button>
          <button @click="assignDiagnostic" class="assign-btn">
            Assign to Student
          </button>
        </div>
      </div>

      <!-- Bulk Assignment Option -->
      <div v-if="selectedOperation && !selectedStudentUid" class="bulk-assign-section">
        <h3>Assign to Multiple Students:</h3>
        <div class="student-selection-grid">
          <label 
            v-for="student in students" 
            :key="student.uid"
            class="student-checkbox-label"
          >
            <input 
              type="checkbox" 
              :value="student.uid"
              v-model="selectedStudentUids"
            />
            <span>{{ student.lastName }}, {{ student.firstName }}</span>
          </label>
        </div>
        
        <div class="bulk-actions" v-if="selectedStudentUids.length > 0">
          <button @click="bulkAssignDiagnostic" class="bulk-assign-btn" :disabled="assigning">
            {{ assigning ? 'Assigning...' : `Assign to ${selectedStudentUids.length} Student(s)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Diagnostic In Progress -->
    <div v-if="diagnosticStarted && !testComplete && !chunkComplete" class="diagnostic-active">
      <!-- Chunk Progress -->
      <div class="chunk-header">
        <h3>Part {{ currentChunk }} of 4</h3>
        <p>Problems {{ chunkStartNumber }}-{{ chunkEndNumber }}</p>
        <div class="chunk-progress-bar">
          <div 
            class="chunk-progress-fill" 
            :style="{ width: `${(currentChunkIndex / 25) * 100}%` }"
          ></div>
        </div>
        <p class="progress-text">{{ currentChunkIndex }}/25 in this chunk</p>
      </div>

      <!-- Current Question -->
      <div class="question-display">
        <div class="question-text">
          {{ currentQuestion?.displayText }}
        </div>
        
        <div class="answer-input-section">
          <input
            ref="answerInput"
            v-model="currentAnswer"
            type="number"
            class="answer-input"
            placeholder="Type answer"
            @keyup.enter="submitAnswer"
            autofocus
          />
        </div>

        <div class="question-controls">
          <button @click="submitAnswer" class="submit-btn" :disabled="!currentAnswer">
            Submit Answer →
          </button>
        </div>

        <div class="question-timer">
          <p>{{ timeRemaining }}s</p>
          <p class="timer-hint">Auto-advances in {{ timeRemaining }} seconds</p>
        </div>
      </div>

      <!-- Overall Progress -->
      <div class="overall-progress">
        <p>Overall Progress: {{ answers.length }}/{{ totalProblems }} problems</p>
        <div class="overall-progress-bar">
          <div 
            class="overall-progress-fill" 
            :style="{ width: `${(answers.length / totalProblems) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Chunk Complete Screen -->
    <div v-if="chunkComplete" class="chunk-complete-screen">
      <h2>✅ Section {{ currentChunk - 1 }} Complete!</h2>
      <p class="complete-message">Great job! You've completed 25 problems.</p>
      
      <div class="chunk-stats">
        <div class="stat-box">
          <span class="stat-number">{{ answers.length }}</span>
          <span class="stat-label">Problems Completed</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ allProblems.length - answers.length }}</span>
          <span class="stat-label">Problems Remaining</span>
        </div>
      </div>

      <p class="progress-message">
        Your progress has been saved. You can continue now or come back later to finish.
      </p>

      <div class="chunk-actions">
        <button @click="continueToNextChunk" class="continue-btn" v-if="canContinue">
          Continue to Section {{ currentChunk }} →
        </button>
        <button @click="saveAndExit" class="save-exit-btn">
          💾 Save & Exit (Resume Later)
        </button>
      </div>
    </div>

    <!-- Test Complete Screen -->
    <div v-if="testComplete" class="complete-screen">
      <h2>🎉 Diagnostic Complete!</h2>
      <p class="complete-message">
        All {{ totalProblems }} problems tested. Processing results...
      </p>
      
      <div v-if="resultsProcessed" class="results-summary">
        <h3>Initial Proficiency Distribution:</h3>
        <div class="distribution-stats">
          <div class="stat-row mastered">
            <span class="level-label">🏆 Mastered (< 3s)</span>
            <span class="level-count">{{ initialDistribution.mastered }} facts</span>
          </div>
          <div class="stat-row proficient">
            <span class="level-label">🔵 Proficient (3-6s)</span>
            <span class="level-count">{{ initialDistribution.proficient }} facts</span>
          </div>
          <div class="stat-row approaching">
            <span class="level-label">🟡 Approaching (6-12s)</span>
            <span class="level-count">{{ initialDistribution.approaching }} facts</span>
          </div>
          <div class="stat-row emerging">
            <span class="level-label">🟢 Emerging (>12s)</span>
            <span class="level-count">{{ initialDistribution.emerging }} facts</span>
          </div>
          <div class="stat-row does-not-know">
            <span class="level-label">🔴 Does Not Know</span>
            <span class="level-count">{{ initialDistribution.doesNotKnow }} facts</span>
          </div>
        </div>

        <div class="proficiency-summary">
          <h4>Overall Proficiency: {{ proficiencyPercentage }}%</h4>
          <p>{{ selectedStudentName }} is ready to begin daily practice!</p>
        </div>

        <div class="next-steps">
          <button @click="viewProgress" class="view-progress-btn">
            View Detailed Progress →
          </button>
          <button @click="startAnother" class="start-another-btn">
            Test Another Student
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import type { Student } from '@/types/users'
import type { OperationType, MathFactProblem, ProblemProgress } from '@/types/mathFluency'
import { getAllProblemsForOperation, shuffleArray } from '@/utils/mathFluencyProblemGenerator'
import { createInitialFluencyProgress, createFluencyAssessment } from '@/services/mathFluencyServices'
import { Timestamp } from 'firebase/firestore'
import { assignInitialDiagnostic, bulkAssignInitialDiagnostic, markFluencyAssignmentComplete } from '@/services/mathFluencyAssignmentServices'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const students = ref<Student[]>([])
const selectedOperation = ref<OperationType | ''>('')
const selectedStudentUid = ref('')
const selectedStudentUids = ref<string[]>([])
const excludeZeroProblems = ref(false)
const diagnosticStarted = ref(false)
const testComplete = ref(false)
const resultsProcessed = ref(false)
const assigning = ref(false)
const assignmentId = ref<string | null>(null)
const isStudentTaking = ref(false)
const chunkComplete = ref(false)
const canContinue = ref(false)

// Questions and Progress
const allProblems = ref<MathFactProblem[]>([])
const currentChunk = ref(1)
const currentChunkIndex = ref(0)
const answers = ref<Array<{
  problemId: string
  num1: number
  num2: number
  operation: OperationType
  correctAnswer: string
  studentAnswer: string
  isCorrect: boolean
  responseTime: number
}>>([])

// Timing
const timeRemaining = ref(20)
const questionStartTime = ref<number>(0)
const timerInterval = ref<number | null>(null)

// Input
const answerInput = ref<HTMLInputElement | null>(null)
const currentAnswer = ref('')

// Results
const initialDistribution = ref({
  doesNotKnow: 0,
  emerging: 0,
  approaching: 0,
  proficient: 0,
  mastered: 0
})

// Constants
const operations = [
  { value: 'addition' as OperationType, label: 'Addition (0-20)', icon: '➕' },
  { value: 'subtraction' as OperationType, label: 'Subtraction (0-20)', icon: '➖' },
  { value: 'multiplication' as OperationType, label: 'Multiplication (0-12)', icon: '✖️' },
  { value: 'division' as OperationType, label: 'Division (0-12)', icon: '➗' }
]

const CHUNK_SIZE = 25
const TIME_PER_QUESTION = 20  // seconds

// Computed
const selectedStudentName = computed(() => {
  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  return student ? `${student.firstName} ${student.lastName}` : ''
})

const totalProblems = computed(() => {
  if (!selectedOperation.value) return 0
  return getAllProblemsForOperation(selectedOperation.value as OperationType).length
})

const filteredProblemsCount = computed(() => {
  if (!selectedOperation.value) return 0
  
  const allProbs = getAllProblemsForOperation(selectedOperation.value as OperationType)
  
  if (!excludeZeroProblems.value) return allProbs.length
  
  // Filter out problems with zero
  return allProbs.filter(p => p.num1 !== 0 && p.num2 !== 0).length
})

const currentQuestion = computed(() => {
  const overallIndex = (currentChunk.value - 1) * CHUNK_SIZE + currentChunkIndex.value
  return allProblems.value[overallIndex] || null
})

const chunkStartNumber = computed(() => {
  return (currentChunk.value - 1) * CHUNK_SIZE + 1
})

const chunkEndNumber = computed(() => {
  return Math.min(currentChunk.value * CHUNK_SIZE, totalProblems.value)
})

const proficiencyPercentage = computed(() => {
  const total = initialDistribution.value.doesNotKnow +
                initialDistribution.value.emerging +
                initialDistribution.value.approaching +
                initialDistribution.value.proficient +
                initialDistribution.value.mastered
  
  if (total === 0) return 0
  
  return Math.round(
    ((initialDistribution.value.approaching + 
      initialDistribution.value.proficient + 
      initialDistribution.value.mastered) / total) * 100
  )
})

// Methods
onMounted(async () => {
  // Check if accessed via assignment
  assignmentId.value = (route.query.assignment as string) || null
  
  if (assignmentId.value) {
    // Student is taking assigned diagnostic
    isStudentTaking.value = true
    selectedStudentUid.value = authStore.currentUser?.uid || ''
    selectedOperation.value = (route.query.operation as OperationType) || 'addition'
    
    // Auto-start for students
    await startDiagnostic()
  } else {
    // Teacher is administering
    await loadStudents()
  }
})

onUnmounted(() => {
  stopTimer()
})

async function loadStudents() {
  try {
    if (authStore.isAdmin) {
      students.value = await getAllStudents()
    } else if (authStore.isTeacher) {
      students.value = await getStudentsByTeacher(authStore.currentUser!.uid)
    }
  } catch (error) {
    console.error('Error loading students:', error)
  }
}

async function startDiagnostic() {
  if (!selectedOperation.value || !selectedStudentUid.value) return
  
  // Check for saved progress first
  const savedProgress = await loadSavedProgress()
  
  if (savedProgress) {
    const resume = confirm(
      `Found saved progress: ${savedProgress.answersCompleted}/${savedProgress.totalProblems} problems completed.\n\nWould you like to resume where you left off?`
    )
    
    if (resume) {
      // Restore saved state
      allProblems.value = savedProgress.allProblems
      answers.value = savedProgress.answers
      currentChunk.value = savedProgress.currentChunk
      currentChunkIndex.value = savedProgress.currentChunkIndex
      excludeZeroProblems.value = savedProgress.excludeZero
      
      diagnosticStarted.value = true
      
      // Start from where they left off
      startQuestionTimer()
      await nextTick()
      answerInput.value?.focus()
      return
    } else {
      // Clear saved progress and start fresh
      await clearSavedProgress()
    }
  }
  
  // Generate all problems for this operation
  let problems = getAllProblemsForOperation(selectedOperation.value as OperationType)
  
  // Filter out zero problems if option selected
  if (excludeZeroProblems.value) {
    problems = problems.filter(p => p.num1 !== 0 && p.num2 !== 0)
  }
  
  // Shuffle to prevent pattern recognition
  allProblems.value = shuffleArray(problems)
  
  // Reset state
  diagnosticStarted.value = true
  currentChunk.value = 1
  currentChunkIndex.value = 0
  answers.value = []
  currentAnswer.value = ''
  chunkComplete.value = false
  canContinue.value = false
  
  // Save initial progress
  await saveProgress()
  
  // Start first question timer
  startQuestionTimer()
  
  // Focus input
  await nextTick()
  answerInput.value?.focus()
}

function startQuestionTimer() {
  timeRemaining.value = TIME_PER_QUESTION
  questionStartTime.value = Date.now()
  
  stopTimer()  // Clear any existing timer
  
  timerInterval.value = window.setInterval(() => {
    timeRemaining.value--
    
    if (timeRemaining.value <= 0) {
      // Time's up - auto-advance
      submitAnswer()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

async function submitAnswer() {
  if (!currentQuestion.value) return
  
  stopTimer()
  
  const responseTime = Date.now() - questionStartTime.value
  const studentAnswer = String(currentAnswer.value || '').trim()
  const isCorrect = studentAnswer === currentQuestion.value.correctAnswer
  
  // Record answer
  answers.value.push({
    problemId: currentQuestion.value.id,
    num1: currentQuestion.value.num1,
    num2: currentQuestion.value.num2,
    operation: currentQuestion.value.operation,
    correctAnswer: currentQuestion.value.correctAnswer,
    studentAnswer,
    isCorrect,
    responseTime
  })
  
  // Clear input
  currentAnswer.value = ''
  
  // Save progress after each answer
  await saveProgress()
  
  // Check if chunk is complete
  currentChunkIndex.value++
  
  console.log('📊 Current progress:', {
    chunkIndex: currentChunkIndex.value,
    chunkSize: CHUNK_SIZE,
    totalAnswers: answers.value.length,
    totalProblems: allProblems.value.length
  })
  
  if (currentChunkIndex.value >= CHUNK_SIZE) {
    // Chunk complete - show completion screen
    console.log('✅ Chunk complete! Showing completion screen')
    stopTimer()
    chunkComplete.value = true
    canContinue.value = answers.value.length < allProblems.value.length
    
    // Save progress
    await saveProgress()
  } else if (answers.value.length >= allProblems.value.length) {
    // All problems complete
    console.log('🎉 All problems complete!')
    await finishDiagnostic()
  } else {
    // Continue to next question in chunk
    console.log('➡️ Moving to next question in chunk')
    startQuestionTimer()
    await nextTick()
    answerInput.value?.focus()
  }
}

async function continueToNextChunk() {
  chunkComplete.value = false
  
  // Move to next chunk
  currentChunk.value++
  currentChunkIndex.value = 0
  
  // Save progress
  await saveProgress()
  
  // Start next chunk
  startQuestionTimer()
  await nextTick()
  answerInput.value?.focus()
}

async function saveAndExit() {
  // Save current progress
  await saveProgress()
  
  alert('✅ Your progress has been saved!\n\nYou can resume this diagnostic anytime from your dashboard or by returning to this page.')
  
  // Route back to dashboard
  if (isStudentTaking.value) {
    router.push('/dashboard')
  } else {
    router.push('/fluency/initial-diagnostic')
  }
}

// Progress saving functions
async function saveProgress() {
  if (!selectedStudentUid.value || !selectedOperation.value) {
    console.warn('⚠️ Cannot save progress - missing studentUid or operation')
    return
  }
  
  try {
    const { setDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    const progressId = `${selectedStudentUid.value}_${selectedOperation.value}_initial`
    const progressRef = doc(db, 'mathFluencyDiagnosticProgress', progressId)
    
    const progressData = {
      studentUid: selectedStudentUid.value,
      operation: selectedOperation.value,
      assignmentId: assignmentId.value,
      allProblems: allProblems.value,
      answers: answers.value,
      currentChunk: currentChunk.value,
      currentChunkIndex: currentChunkIndex.value,
      excludeZero: excludeZeroProblems.value,
      answersCompleted: answers.value.length,
      totalProblems: allProblems.value.length,
      inProgress: true,
      lastSaved: Timestamp.now(),
      createdAt: Timestamp.now()
    }
    
    console.log('💾 Saving progress:', {
      progressId,
      answersCompleted: answers.value.length,
      currentChunk: currentChunk.value,
      currentChunkIndex: currentChunkIndex.value
    })
    
    await setDoc(progressRef, progressData, { merge: true })
    
    console.log('✅ Progress saved successfully to Firestore')
  } catch (error) {
    console.error('❌ Error saving progress:', error)
  }
}

async function loadSavedProgress() {
  if (!selectedStudentUid.value || !selectedOperation.value) return null
  
  try {
    const { getDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    const progressId = `${selectedStudentUid.value}_${selectedOperation.value}_initial`
    const progressRef = doc(db, 'mathFluencyDiagnosticProgress', progressId)
    
    const progressDoc = await getDoc(progressRef)
    
    if (progressDoc.exists() && progressDoc.data().inProgress) {
      return progressDoc.data()
    }
    
    return null
  } catch (error) {
    console.error('Error loading progress:', error)
    return null
  }
}

async function clearSavedProgress() {
  if (!selectedStudentUid.value || !selectedOperation.value) return
  
  try {
    const { deleteDoc, doc } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    const progressId = `${selectedStudentUid.value}_${selectedOperation.value}_initial`
    const progressRef = doc(db, 'mathFluencyDiagnosticProgress', progressId)
    
    await deleteDoc(progressRef)
    console.log('🗑️ Saved progress cleared')
  } catch (error) {
    console.error('Error clearing progress:', error)
  }
}

async function finishDiagnostic() {
  stopTimer()
  testComplete.value = true
  
  // Clear saved progress
  await clearSavedProgress()
  
  // Process results
  await processResults()
}

async function processResults() {
  if (!selectedStudentUid.value || !selectedOperation.value) return
  
  try {
    // Categorize problems into proficiency buckets
    const problemBanks = {
      doesNotKnow: [] as ProblemProgress[],
      emerging: [] as ProblemProgress[],
      approaching: [] as ProblemProgress[],
      proficient: [] as ProblemProgress[],
      mastered: [] as ProblemProgress[]
    }
    
    answers.value.forEach(answer => {
      const problem: ProblemProgress = {
        problemId: answer.problemId,
        num1: answer.num1,
        num2: answer.num2,
        operation: answer.operation,
        correctAnswer: answer.correctAnswer,
        displayText: allProblems.value.find(p => p.id === answer.problemId)?.displayText || '',
        category: allProblems.value.find(p => p.id === answer.problemId)?.category || '',
        factFamily: allProblems.value.find(p => p.id === answer.problemId)?.factFamily || '',
        difficulty: 3,
        
        proficiencyLevel: 'doesNotKnow',  // Will be set below
        
        last5Attempts: [{
          date: Timestamp.now(),
          correct: answer.isCorrect,
          responseTime: answer.responseTime,
          source: 'initial-diagnostic'
        }],
        
        proficiencyCalculation: {
          correctOutOfLast5: answer.isCorrect ? 1 : 0,
          averageTimeOfLast5: answer.responseTime,
          last5Trend: 'stable',
          confidenceLevel: 'low'
        },
        
        consecutiveCorrectDays: answer.isCorrect ? 1 : 0,
        daysInCurrentLevel: 0,
        totalAttempts: 1,
        correctAttempts: answer.isCorrect ? 1 : 0,
        
        responseTimes: [answer.responseTime],
        averageResponseTime: answer.responseTime,
        fastestResponseTime: answer.responseTime,
        slowestResponseTime: answer.responseTime,
        
        firstAttemptDate: Timestamp.now(),
        lastAttemptDate: Timestamp.now(),
        dateEnteredEmerging: null,
        dateEnteredApproaching: null,
        dateEnteredProficient: null,
        dateEnteredMastered: null,
        
        dailyResults: [],
        commonErrors: answer.isCorrect ? [] : [answer.studentAnswer],
        errorPattern: null,
        needsStrategyInstruction: false,
        
        flaggedForReview: false,
        regressionCount: 0,
        lastRegressionDate: null
      }
      
      // Categorize based on correctness and speed
      if (!answer.isCorrect) {
        problem.proficiencyLevel = 'doesNotKnow'
        problemBanks.doesNotKnow.push(problem)
      } else if (answer.responseTime < 3000) {
        problem.proficiencyLevel = 'mastered'
        problem.dateEnteredMastered = Timestamp.now()
        problemBanks.mastered.push(problem)
      } else if (answer.responseTime < 6000) {
        problem.proficiencyLevel = 'proficient'
        problem.dateEnteredProficient = Timestamp.now()
        problemBanks.proficient.push(problem)
      } else if (answer.responseTime < 12000) {
        problem.proficiencyLevel = 'approaching'
        problem.dateEnteredApproaching = Timestamp.now()
        problemBanks.approaching.push(problem)
      } else {
        problem.proficiencyLevel = 'emerging'
        problem.dateEnteredEmerging = Timestamp.now()
        problemBanks.emerging.push(problem)
      }
    })
    
    // Update distribution for display
    initialDistribution.value = {
      doesNotKnow: problemBanks.doesNotKnow.length,
      emerging: problemBanks.emerging.length,
      approaching: problemBanks.approaching.length,
      proficient: problemBanks.proficient.length,
      mastered: problemBanks.mastered.length
    }
    
    // Create fluency progress document
    const student = students.value.find(s => s.uid === selectedStudentUid.value)
    if (!student) {
      throw new Error('Student not found')
    }
    
    await createInitialFluencyProgress(
      selectedStudentUid.value,
      `${student.firstName} ${student.lastName}`,
      selectedOperation.value as OperationType,
      problemBanks,
      authStore.currentUser!.uid
    )
    
    // Create baseline assessment record
    await createFluencyAssessment({
      assessmentName: `${selectedOperation.value} Initial Diagnostic`,
      studentUid: selectedStudentUid.value,
      studentName: `${student.firstName} ${student.lastName}`,
      teacherUid: authStore.currentUser!.uid,
      
      assessmentType: 'initial-diagnostic',
      assessmentCategory: selectedOperation.value as OperationType,
      week: 0,
      assessmentDate: Timestamp.now(),
      
      deliveryMethod: 'digital',
      timeLimit: totalProblems.value * TIME_PER_QUESTION,
      
      totalProblemsAttempted: answers.value.length,
      totalProblemsCorrect: answers.value.filter(a => a.isCorrect).length,
      totalProblemsIncorrect: answers.value.filter(a => !a.isCorrect).length,
      totalProblemsOnAssessment: totalProblems.value,
      accuracy: (answers.value.filter(a => a.isCorrect).length / answers.value.length) * 100,
      
      correctPerMinute: 0,  // Not applicable for diagnostic
      incorrectPerMinute: 0,
      fluencyLevel: 'needs-support',  // Will be updated by practice
      
      problemResults: answers.value.map((answer, index) => {
        const problemData = allProblems.value.find(p => p.id === answer.problemId)!
        const problem = Object.values(problemBanks)
          .flat()
          .find(p => p.problemId === answer.problemId)!
        
        return {
          problemId: answer.problemId,
          problemNumber: index + 1,
          num1: answer.num1,
          num2: answer.num2,
          operation: answer.operation,
          correctAnswer: answer.correctAnswer,
          displayText: problemData.displayText,
          wasAttempted: true,
          isCorrect: answer.isCorrect,
          studentAnswer: answer.studentAnswer,
          responseTime: answer.responseTime,
          last5Attempts: problem.last5Attempts,
          currentProficiencyLevel: problem.proficiencyLevel,
          proficiencyCalculation: problem.proficiencyCalculation,
          category: problemData.category,
          factFamily: problemData.factFamily
        }
      }),
      
      growthFromLastWeek: null,
      
      promotions: {
        emergingToApproaching: 0,
        approachingToProficient: 0,
        proficientToMastered: 0,
        totalPromoted: 0
      },
      
      demotions: {
        masteredToProficient: 0,
        proficientToApproaching: 0,
        approachingToEmerging: 0,
        emergingToDoesNotKnow: 0,
        totalDemoted: 0
      },
      
      weakFactFamilies: [],
      errorPatterns: [],
      
      scoredBy: authStore.currentUser!.uid,
      scoredAt: Timestamp.now(),
      entryMethod: 'quick',
      notes: 'Initial comprehensive diagnostic - all problems tested'
    } as any)
    
    resultsProcessed.value = true
    
    // Mark assignment as complete if accessed via assignment
    if (assignmentId.value && isStudentTaking.value) {
      try {
        const proficiencyPct = proficiencyPercentage.value
        await markFluencyAssignmentComplete(assignmentId.value, proficiencyPct)
        console.log('✅ Assignment marked complete')
      } catch (error) {
        console.error('Error marking assignment complete:', error)
      }
    }
    
    console.log('✅ Initial diagnostic results processed and saved')
  } catch (error) {
    console.error('Error processing diagnostic results:', error)
    alert('Error saving results. Please try again.')
  }
}

function viewProgress() {
  router.push(`/fluency/student/${selectedStudentUid.value}`)
}

function startAnother() {
  // Reset everything
  diagnosticStarted.value = false
  testComplete.value = false
  resultsProcessed.value = false
  selectedStudentUid.value = ''
  selectedStudentUids.value = []
  selectedOperation.value = ''
  allProblems.value = []
  answers.value = []
  currentChunk.value = 1
  currentChunkIndex.value = 0
  initialDistribution.value = {
    doesNotKnow: 0,
    emerging: 0,
    approaching: 0,
    proficient: 0,
    mastered: 0
  }
}

async function assignDiagnostic() {
  if (!selectedOperation.value || !selectedStudentUid.value) return
  
  try {
    const student = students.value.find(s => s.uid === selectedStudentUid.value)
    if (!student) return
    
    await assignInitialDiagnostic(
      student.uid,
      `${student.firstName} ${student.lastName}`,
      selectedOperation.value as OperationType,
      authStore.currentUser?.uid || 'system',
      authStore.currentUser?.displayName
    )
    
    alert(`✅ Diagnostic assigned to ${student.firstName} ${student.lastName}!\n\nThey can access it from their dashboard.`)
    
    startAnother()
  } catch (error) {
    console.error('Error assigning diagnostic:', error)
    alert('Error assigning diagnostic. Please try again.')
  }
}

async function bulkAssignDiagnostic() {
  if (!selectedOperation.value || selectedStudentUids.value.length === 0) return
  
  assigning.value = true
  
  try {
    const studentData = selectedStudentUids.value.map(uid => {
      const student = students.value.find(s => s.uid === uid)
      return student ? `${student.firstName} ${student.lastName}` : 'Unknown'
    })
    
    const result = await bulkAssignInitialDiagnostic(
      selectedStudentUids.value,
      studentData,
      selectedOperation.value as OperationType,
      authStore.currentUser?.uid || 'system',
      authStore.currentUser?.displayName
    )
    
    alert(`✅ Diagnostic assigned to ${result.success} of ${selectedStudentUids.value.length} students!\n\nThey can access it from their dashboard.`)
    
    startAnother()
  } catch (error) {
    console.error('Error bulk assigning:', error)
    alert('Error assigning diagnostic. Please try again.')
  } finally {
    assigning.value = false
  }
}

function capitalizeOperation(op: string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}
</script>

<style scoped>
.math-fluency-diagnostic-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.diagnostic-header {
  text-align: center;
  margin-bottom: 2rem;
}

.diagnostic-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

/* Setup Section */
.setup-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.operation-selection,
.student-selection,
.diagnostic-info {
  margin-bottom: 2rem;
}

.operation-selection h3,
.student-selection h3,
.diagnostic-info h3 {
  margin-top: 0;
  color: #333;
}

.operation-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.operation-btn {
  padding: 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.operation-btn:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.operation-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.student-select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.info-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.info-card p {
  margin: 0.5rem 0;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.start-btn,
.assign-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.start-btn {
  background: #28a745;
  color: white;
}

.start-btn:hover {
  background: #218838;
}

.assign-btn {
  background: #007bff;
  color: white;
}

.assign-btn:hover {
  background: #0056b3;
}

.bulk-assign-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.bulk-assign-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.student-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 2px solid #ddd;
}

.student-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.student-checkbox-label:hover {
  background: #f8f9fa;
}

.student-checkbox-label input {
  cursor: pointer;
}

.bulk-actions {
  margin-top: 1rem;
}

.bulk-assign-btn {
  width: 100%;
  padding: 1rem 2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.bulk-assign-btn:hover:not(:disabled) {
  background: #0056b3;
}

.bulk-assign-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Diagnostic Active */
.diagnostic-active {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chunk-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.chunk-header h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.chunk-progress-bar {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  margin: 1rem 0;
  overflow: hidden;
}

.chunk-progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.9rem;
  color: #666;
}

.question-display {
  text-align: center;
  padding: 3rem 0;
}

.question-text {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 2rem;
}

.answer-input-section {
  margin: 2rem 0;
}

.answer-input {
  width: 200px;
  padding: 1rem;
  font-size: 2rem;
  text-align: center;
  border: 3px solid #007bff;
  border-radius: 8px;
}

.answer-input:focus {
  outline: none;
  border-color: #0056b3;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
}

.question-controls {
  margin-top: 1.5rem;
}

.submit-btn {
  padding: 0.75rem 2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.question-timer {
  margin-top: 2rem;
  color: #666;
}

.question-timer p {
  margin: 0.25rem 0;
}

.timer-hint {
  font-size: 0.9rem;
}

.overall-progress {
  margin-top: 2rem;
  text-align: center;
}

.overall-progress-bar {
  width: 100%;
  height: 12px;
  background: #eee;
  border-radius: 6px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.overall-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s;
}

/* Break Screen */
.chunk-complete-screen {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.chunk-complete-screen h2 {
  color: #28a745;
  margin-bottom: 1rem;
}

.complete-message {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 2rem;
}

.chunk-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 2rem 0;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 150px;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
}

.progress-message {
  color: #666;
  font-size: 1.1rem;
  margin: 2rem 0;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 6px;
}

.chunk-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.continue-btn,
.save-exit-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.continue-btn {
  background: #28a745;
  color: white;
}

.continue-btn:hover {
  background: #218838;
}

.save-exit-btn {
  background: #007bff;
  color: white;
}

.save-exit-btn:hover {
  background: #0056b3;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.diagnostic-options {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #fff3cd;
  border-radius: 8px;
  border: 2px solid #ffc107;
}

.diagnostic-options h3 {
  margin-top: 0;
  color: #856404;
}

.diagnostic-options .form-group {
  margin-bottom: 1rem;
}

.info-note {
  margin: 1rem 0 0 0;
  padding: 1rem;
  background: #e7f3ff;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #004085;
}

/* Complete Screen */
.complete-screen {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.complete-screen h2 {
  color: #28a745;
  margin-bottom: 1rem;
}

.complete-message {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.results-summary {
  margin-top: 2rem;
}

.distribution-stats {
  margin: 1.5rem 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  border-radius: 6px;
  font-weight: 500;
}

.stat-row.mastered {
  background: #d4edda;
  color: #155724;
}

.stat-row.proficient {
  background: #d1ecf1;
  color: #0c5460;
}

.stat-row.approaching {
  background: #fff3cd;
  color: #856404;
}

.stat-row.emerging {
  background: #d1ecf1;
  color: #0c5460;
}

.stat-row.does-not-know {
  background: #f8d7da;
  color: #721c24;
}

.proficiency-summary {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.proficiency-summary h4 {
  margin: 0 0 0.5rem 0;
  color: #007bff;
  font-size: 1.5rem;
}

.next-steps {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.view-progress-btn,
.start-another-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.view-progress-btn {
  background: #007bff;
  color: white;
}

.view-progress-btn:hover {
  background: #0056b3;
}

.start-another-btn {
  background: #6c757d;
  color: white;
}

.start-another-btn:hover {
  background: #5a6268;
}
</style>

