<template>
  <div class="foundational-diagnostic-container">
    <div class="page-header">
      <h1>📊 Foundational Math Diagnostic</h1>
      <p class="subtitle">Comprehensive Assessment (7th grade)</p>
      
      <!-- Real-time monitoring button for teachers -->
      <button 
        v-if="!testStarted && authStore.currentUser?.role !== 'student'" 
        @click="showLiveMonitor = true"
        class="btn btn-outline monitor-btn"
      >
        👁️ Monitor Live Tests
      </button>
    </div>

    <!-- Assigned Diagnostics View -->
    <div v-if="!testStarted && !isStudentTaking && assignedDiagnostics.length > 0" class="assigned-section">
      <h2>📋 Assigned Diagnostics</h2>
      <div class="assigned-list">
        <div v-for="assignment in assignedDiagnostics" :key="assignment.id" class="assignment-card">
          <div class="assignment-header">
            <h3>{{ assignment.studentName }}</h3>
            <span :class="['status-badge', assignment.status]">
              {{ assignment.status === 'assigned' ? '⏳ Assigned' : '✅ Complete' }}
            </span>
          </div>
          <div class="assignment-details">
            <p><strong>Assigned:</strong> {{ new Date(assignment.assignedAt.seconds * 1000).toLocaleDateString() }}</p>
            <p><strong>Questions:</strong> {{ assignment.totalQuestions }}</p>
            <p v-if="assignment.isComplete"><strong>Score:</strong> {{ assignment.score }}%</p>
          </div>
          <button 
            @click="unassignDiagnostic(assignment.id)" 
            class="btn btn-danger btn-sm"
          >
            🗑️ Unassign
          </button>
        </div>
      </div>
    </div>

    <!-- Teacher Setup Mode -->
    <div v-if="!testStarted && !isStudentTaking" class="setup-card">
      <h2>Setup Diagnostic</h2>
      
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
        <h3>📋 Diagnostic Overview</h3>
        <ul>
          <li><strong>Format:</strong> Section A (10 foundational) + Section B (10 pre-algebra) + goal-based questions</li>
          <li><strong>Question Types:</strong> Multiple choice (5 options) + Short answer</li>
          <li><strong>Content Areas:</strong> Number sense, computation, fractions, decimals, ratios, algebra, geometry, integers</li>
          <li><strong>Time:</strong> Self-paced (20-30 min recommended, no hard limit)</li>
          <li><strong>Auto-Save:</strong> Students can pause and resume</li>
          <li><strong>Alignment:</strong> STAR test format + IEP goal integration</li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div v-if="canShowActions" class="action-buttons">
        <button 
          v-if="assignmentMode === 'individual'" 
          @click="startTest" 
          class="btn btn-primary btn-lg"
        >
          🚀 Start Live Diagnostic
        </button>
        <button 
          v-else
          @click="assignToSelectedStudents" 
          class="btn btn-primary btn-lg"
          :disabled="targetStudentCount === 0"
        >
          📤 Assign to {{ targetStudentCount }} Student{{ targetStudentCount !== 1 ? 's' : '' }}
        </button>
        <button @click="previewQuestions" class="btn btn-outline">
          👁️ Preview Questions
        </button>
      </div>
    </div>

    <!-- Active Test (Student View) -->
    <div v-if="testStarted && !testComplete" class="test-container">
      <div class="test-header">
        <div class="progress-info">
          <h3>Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</h3>
          <span class="category-badge">{{ currentQuestion?.category }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>

      <!-- Question Navigator -->
      <div class="question-navigator">
        <div class="nav-buttons">
          <button 
            @click="showQuestionOverview = !showQuestionOverview" 
            class="btn btn-outline"
          >
            📋 View All Questions
          </button>
        </div>

        <!-- Question Overview Grid -->
        <div v-if="showQuestionOverview" class="question-overview-grid">
          <button
            v-for="(q, index) in questions"
            :key="index"
            @click="goToQuestion(index)"
            class="question-nav-btn"
            :class="{
              'current': index === currentQuestionIndex,
              'answered': answers[index],
              'unanswered': !answers[index]
            }"
          >
            {{ index + 1 }}
          </button>
        </div>
      </div>

      <div class="question-card">
        <div class="question-text">
          <p>{{ currentQuestion?.questionText }}</p>
        </div>

        <!-- Multiple Choice -->
        <div v-if="currentQuestion?.questionType === 'multiple-choice'" class="multiple-choice-section">
          <div 
            v-for="(option, index) in currentQuestion.multipleChoiceOptions" 
            :key="index"
            class="choice-option"
            :class="{ selected: currentAnswer === option }"
            @click="selectMultipleChoice(option)"
          >
            <input 
              type="radio" 
              :id="`option-${index}`"
              :value="option"
              v-model="currentAnswer"
            />
            <label :for="`option-${index}`">{{ option }}</label>
          </div>
        </div>

        <!-- Short Answer -->
        <div v-if="currentQuestion?.questionType === 'short-answer'" class="answer-input-section">
          <label>Your Answer:</label>
          <input 
            v-model="currentAnswer"
            type="text"
            class="form-control answer-input"
            placeholder="Enter your answer"
            @keyup.enter="submitAnswer"
            autofocus
          />
          <small class="help-text">Show your work on paper if needed</small>
        </div>

        <div class="question-actions">
          <button 
            @click="handleNext" 
            class="btn btn-primary btn-lg"
          >
            {{ currentQuestionIndex < questions.length - 1 ? '✅ Save & Next Question →' : '✅ Finish Test' }}
          </button>
          <p class="help-text" v-if="!currentAnswer.trim()">
            ⚠️ Click the blue button above to save your answer or skip this question
          </p>
          <p class="help-text success" v-else>
            ✓ Answer entered - Click the blue button to save and continue
          </p>
        </div>

        <div v-if="currentQuestion?.explanation && showHints" class="hint-section">
          <details>
            <summary>💡 Hint</summary>
            <p>{{ currentQuestion.explanation }}</p>
          </details>
        </div>
      </div>

      <div class="test-stats">
        <div class="stat-item">
          <span class="stat-label">Progress:</span>
          <span class="stat-value">{{ currentQuestionIndex + 1 }}/{{ questions.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Type:</span>
          <span class="stat-value">{{ currentQuestion?.questionType === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer' }}</span>
        </div>
      </div>
    </div>

    <!-- Results View - Student sees completion only -->
    <div v-if="testComplete && authStore.currentUser?.role === 'student'" class="results-container student-view">
      <div class="completion-message">
        <div class="completion-icon">✅</div>
        <h2>Diagnostic Complete!</h2>
        <p>Great job completing the assessment!</p>
        <p class="info-text">Your teacher will review your results and provide feedback.</p>
      </div>
    </div>

    <!-- Results View - Teacher sees detailed breakdown -->
    <div v-if="testComplete && authStore.currentUser?.role !== 'student'" class="results-container teacher-view">
      <div class="results-header">
        <h2>📊 Diagnostic Results</h2>
        <p class="student-name">{{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}</p>
      </div>

      <div class="results-summary">
        <div class="summary-card primary">
          <h3>Overall Performance</h3>
          <div class="score-circle" :class="getPerformanceClass(correctCount / questions.length)">
            <span class="score-value">{{ overallScore }}%</span>
          </div>
          <p class="score-detail">{{ correctCount }} / {{ questions.length }} correct</p>
        </div>

        <div class="summary-stats">
          <div class="stat-box">
            <span class="stat-number">{{ multipleChoiceCorrect }}</span>
            <span class="stat-label">Multiple Choice ({{ mcTotal }} total)</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ shortAnswerCorrect }}</span>
            <span class="stat-label">Short Answer ({{ saTotal }} total)</span>
          </div>
        </div>
      </div>

      <!-- Section Breakdown (A & B) -->
      <div class="section-breakdown">
        <h3>📋 Section Performance</h3>
        <div class="section-grid">
          <div class="section-card">
            <h4>Section A: Foundational Gaps</h4>
            <p class="section-description">Number sense + computation fluency</p>
            <div class="section-score">
              <span class="score-big">{{ sectionAScore }}%</span>
              <span class="score-detail">{{ sectionACorrect }} / {{ sectionATotal }} correct</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :class="getPerformanceClass(sectionACorrect / sectionATotal)" 
                   :style="{ width: sectionAScore + '%' }"></div>
            </div>
          </div>
          
          <div class="section-card">
            <h4>Section B: Pre-Algebra Readiness</h4>
            <p class="section-description">Symbolic thinking + ratio reasoning</p>
            <div class="section-score">
              <span class="score-big">{{ sectionBScore }}%</span>
              <span class="score-detail">{{ sectionBCorrect }} / {{ sectionBTotal }} correct</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :class="getPerformanceClass(sectionBCorrect / sectionBTotal)" 
                   :style="{ width: sectionBScore + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Domain/Skill Area Breakdown -->
      <div class="domain-breakdown">
        <h3>🎯 Domain & Skill Area Performance</h3>
        <div v-for="(result, skillArea) in skillAreaResults" :key="skillArea" class="domain-result">
          <div class="domain-header">
            <span class="domain-name">{{ skillArea }}</span>
            <span class="domain-score" :class="getPerformanceClass(result.correct / result.total)">
              {{ result.correct }} / {{ result.total }}
              <span class="percentage">({{ Math.round(result.correct / result.total * 100) }}%)</span>
            </span>
          </div>
          <div class="domain-bar">
            <div 
              class="domain-fill" 
              :style="{ width: (result.correct / result.total * 100) + '%' }"
              :class="getPerformanceClass(result.correct / result.total)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Goal-Based Questions Performance -->
      <div v-if="goalBasedResults.total > 0" class="goal-breakdown">
        <h3>🎯 IEP Goal-Based Questions</h3>
        <div class="goal-summary">
          <p>Performance on questions aligned to student's IEP goals</p>
          <div class="goal-score">
            <span class="score-big">{{ Math.round(goalBasedResults.correct / goalBasedResults.total * 100) }}%</span>
            <span class="score-detail">{{ goalBasedResults.correct }} / {{ goalBasedResults.total }} correct</span>
          </div>
        </div>
      </div>

      <!-- Category Breakdown (original) -->
      <div class="category-breakdown">
        <h3>📊 Category Breakdown</h3>
        <div v-for="(result, category) in categoryResults" :key="category" class="category-result">
          <div class="category-header">
            <span class="category-name">{{ category }}</span>
            <span class="category-score">{{ result.correct }} / {{ result.total }}</span>
          </div>
          <div class="category-bar">
            <div 
              class="category-fill" 
              :style="{ width: (result.correct / result.total * 100) + '%' }"
              :class="getPerformanceClass(result.correct / result.total)"
            ></div>
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button @click="saveResults" class="btn btn-primary" v-if="!resultsSaved">
          💾 Save Results to Gradebook
        </button>
        <button @click="printResults" class="btn btn-secondary">
          🖨️ Print Report
        </button>
        <button @click="startNewTest" class="btn btn-outline">
          🔄 Start New Test
        </button>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" class="modal-overlay" @click="closePreview">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Question Preview</h3>
          <button @click="closePreview" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-for="(q, index) in questions" :key="q.id" class="preview-question">
            <p><strong>{{ index + 1 }}. {{ q.questionText }}</strong></p>
            <p class="preview-meta">
              Type: {{ q.questionType }} | Category: {{ q.category }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Monitor Modal -->
    <div v-if="showLiveMonitor" class="modal-overlay" @click="showLiveMonitor = false">
      <div class="modal-content live-monitor-modal" @click.stop>
        <div class="modal-header">
          <h3>📊 Live Test Monitoring</h3>
          <button @click="showLiveMonitor = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <button @click="loadLiveResults" class="btn btn-primary" style="margin-bottom: 1rem;">
            🔄 Refresh
          </button>
          
          <div v-if="liveResults.length === 0" class="no-tests">
            <p>No active tests at the moment</p>
          </div>
          
          <div v-else class="live-results-grid">
            <div v-for="result in liveResults" :key="result.studentUid" class="live-result-card">
              <div class="student-header">
                <h4>{{ result.studentName }}</h4>
                <span :class="['status-badge', result.isComplete ? 'complete' : 'in-progress']">
                  {{ result.isComplete ? '✅ Complete' : '⏳ In Progress' }}
                </span>
              </div>
              
              <div class="progress-stats">
                <div class="stat">
                  <span class="label">Progress:</span>
                  <span class="value">{{ result.questionsAnswered }}/{{ result.totalQuestions }}</span>
                </div>
                <div class="stat">
                  <span class="label">Score:</span>
                  <span class="value">{{ result.currentScore }}%</span>
                </div>
                <div class="stat">
                  <span class="label">Correct:</span>
                  <span class="value">{{ result.currentCorrect }}/{{ result.currentTotal }}</span>
                </div>
              </div>
              
              <div class="section-breakdown">
                <div class="section-stat">
                  <span class="section-label">🎯 Goal Questions:</span>
                  <span class="section-value">{{ result.sectionStats.goal.correct }}/{{ result.sectionStats.goal.total }}</span>
                </div>
                <div class="section-stat">
                  <span class="section-label">📚 Section A:</span>
                  <span class="section-value">{{ result.sectionStats.sectionA.correct }}/{{ result.sectionStats.sectionA.total }}</span>
                </div>
                <div class="section-stat">
                  <span class="section-label">📐 Section B:</span>
                  <span class="section-value">{{ result.sectionStats.sectionB.correct }}/{{ result.sectionStats.sectionB.total }}</span>
                </div>
              </div>
              
              <div class="last-updated">
                Last updated: {{ new Date(result.lastUpdated.seconds * 1000).toLocaleTimeString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { getGoalsByStudent } from '@/firebase/goalServices'
import { assignAssessmentToStudent, markAssignmentCompleted } from '@/firebase/assignmentServices'
import { generateMixedDiagnostic, type FoundationalQuestion } from '@/utils/foundationalDiagnosticGenerator'
import { db } from '@/firebase/config'
import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore'
import type { Student } from '@/types/users'
import type { Goal } from '@/types/iep'

const router = useRouter()
const authStore = useAuthStore()

// Data
const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const selectedStudentUids = ref<string[]>([])
const selectedClass = ref('')
const assignmentMode = ref<'individual' | 'all' | 'class' | 'multiple'>('individual')
const studentGoals = ref<Goal[]>([])
const questions = ref<FoundationalQuestion[]>([])
const currentQuestionIndex = ref(0)
const currentAnswer = ref('')
const answers = ref<Array<{ questionId: string; answer: string; isCorrect: boolean }>>([])
const testStarted = ref(false)
const testComplete = ref(false)
const isStudentTaking = ref(false)
const showQuestionOverview = ref(false)
const showPreview = ref(false)
const showHints = ref(false)
const resultsSaved = ref(false)
const assigning = ref(false)
const showLiveMonitor = ref(false)
const liveResults = ref<any[]>([])
const assignedDiagnostics = ref<any[]>([])

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

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

const progressPercentage = computed(() => 
  ((currentQuestionIndex.value + 1) / questions.value.length) * 100
)

const correctCount = computed(() => 
  answers.value.filter(a => a.isCorrect).length
)

const answeredCount = computed(() => answers.value.length)

const canFinishTest = computed(() => answeredCount.value >= questions.value.length * 0.8)

const multipleChoiceCorrect = computed(() => 
  answers.value.filter((a, i) => 
    a.isCorrect && questions.value[i].questionType === 'multiple-choice'
  ).length
)

const shortAnswerCorrect = computed(() => 
  answers.value.filter((a, i) => 
    a.isCorrect && questions.value[i].questionType === 'short-answer'
  ).length
)

const overallScore = computed(() => 
  Math.round((correctCount.value / questions.value.length) * 100)
)

const categoryResults = computed(() => {
  const results: Record<string, { correct: number; total: number }> = {}
  
  questions.value.forEach((q, index) => {
    if (!results[q.category]) {
      results[q.category] = { correct: 0, total: 0 }
    }
    results[q.category].total++
    if (answers.value[index]?.isCorrect) {
      results[q.category].correct++
    }
  })
  
  return results
})

// Section A & B breakdown
const sectionACorrect = computed(() => 
  answers.value.filter((a, i) => 
    a.isCorrect && questions.value[i].section === 'A'
  ).length
)

const sectionATotal = computed(() => 
  questions.value.filter(q => q.section === 'A').length
)

const sectionAScore = computed(() => 
  sectionATotal.value > 0 ? Math.round((sectionACorrect.value / sectionATotal.value) * 100) : 0
)

const sectionBCorrect = computed(() => 
  answers.value.filter((a, i) => 
    a.isCorrect && questions.value[i].section === 'B'
  ).length
)

const sectionBTotal = computed(() => 
  questions.value.filter(q => q.section === 'B').length
)

const sectionBScore = computed(() => 
  sectionBTotal.value > 0 ? Math.round((sectionBCorrect.value / sectionBTotal.value) * 100) : 0
)

// Skill area breakdown
const skillAreaResults = computed(() => {
  const results: Record<string, { correct: number; total: number }> = {}
  
  questions.value.forEach((q, index) => {
    const skillArea = q.skillArea || q.category
    if (!results[skillArea]) {
      results[skillArea] = { correct: 0, total: 0 }
    }
    results[skillArea].total++
    if (answers.value[index]?.isCorrect) {
      results[skillArea].correct++
    }
  })
  
  return results
})

// Goal-based questions results
const goalBasedResults = computed(() => {
  let correct = 0
  let total = 0
  
  questions.value.forEach((q, index) => {
    if (q.isGoalBased) {
      total++
      if (answers.value[index]?.isCorrect) {
        correct++
      }
    }
  })
  
  return { correct, total }
})

// MC and SA totals
const mcTotal = computed(() => 
  questions.value.filter(q => q.questionType === 'multiple-choice').length
)

const saTotal = computed(() => 
  questions.value.filter(q => q.questionType === 'short-answer').length
)

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

async function loadStudentGoals() {
  if (!selectedStudentUid.value) return
  
  try {
    studentGoals.value = await getGoalsByStudent(selectedStudentUid.value)
    console.log(`Loaded ${studentGoals.value.length} goals for student`)
  } catch (error) {
    console.error('Error loading student goals:', error)
    studentGoals.value = []
  }
}

async function startTest() {
  await loadStudentGoals()
  
  // Check if there's saved progress
  const savedProgress = await loadSavedProgress()
  
  if (savedProgress) {
    // Resume from saved progress
    questions.value = savedProgress.questions
    answers.value = savedProgress.answers
    currentQuestionIndex.value = savedProgress.currentQuestionIndex
    
    // Inform the student they'll continue where they left off (no cancel option)
    alert(
      `Assessment in progress\n\nYou have completed ${savedProgress.answers.length} of ${savedProgress.questions.length} questions.\n\nYou will continue where you left off.`
    )
  } else {
    // Generate new test
    questions.value = generateMixedDiagnostic(studentGoals.value)
    answers.value = []
    currentQuestionIndex.value = 0
  }
  
  testStarted.value = true
  currentAnswer.value = ''
}

function selectMultipleChoice(option: string) {
  currentAnswer.value = option
}

function checkAnswer(): boolean {
  const question = currentQuestion.value
  if (!question) return false
  
  const normalizedAnswer = currentAnswer.value.trim().toLowerCase()
  
  // Check if answer matches any acceptable answer
  return question.acceptableAnswers.some(acceptable => 
    normalizedAnswer === acceptable.toLowerCase()
  )
}

async function submitAnswer() {
  if (!currentAnswer.value.trim()) return
  
  const isCorrect = checkAnswer()
  
  answers.value.push({
    questionId: currentQuestion.value!.id,
    answer: currentAnswer.value,
    isCorrect
  })
  
  // Auto-save progress AND results after each answer (for real-time teacher viewing)
  await saveProgress()
  await saveProgressToFirestore() // Save individual question results
  
  // Move to next question or complete test
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    currentAnswer.value = ''
  } else {
    testComplete.value = true
    // Save final results
    await saveResults()
    // Clear saved progress when test is complete
    await clearSavedProgress()
  }
}

// Navigation functions
function goToPreviousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    loadAnswerForCurrentQuestion()
  }
}

function goToNextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    loadAnswerForCurrentQuestion()
  }
}

function goToQuestion(index: number) {
  currentQuestionIndex.value = index
  loadAnswerForCurrentQuestion()
  showQuestionOverview.value = false
}

function loadAnswerForCurrentQuestion() {
  // Load the existing answer for this question if it exists
  const existingAnswer = answers.value.find(a => a.questionId === currentQuestion.value?.id)
  currentAnswer.value = existingAnswer?.answer || ''
}

async function handleNext() {
  // If student entered an answer, save it
  if (currentAnswer.value.trim()) {
    const isCorrect = checkAnswer()
    const questionId = currentQuestion.value!.id
    
    // Remove old answer for this question if it exists
    const existingIndex = answers.value.findIndex(a => a.questionId === questionId)
    if (existingIndex !== -1) {
      answers.value[existingIndex] = {
        questionId,
        answer: currentAnswer.value,
        isCorrect
      }
    } else {
      answers.value.push({
        questionId,
        answer: currentAnswer.value,
        isCorrect
      })
    }
    
    // Auto-save progress
    await saveProgress()
    await saveProgressToFirestore()
  }
  
  // Move to next question or finish test
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
    loadAnswerForCurrentQuestion()
  } else {
    // Last question - finish the test
    const unanswered = questions.value.length - answeredCount.value
    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered questions. Are you sure you want to finish the test?`
      )
      if (!confirm) return
    }
    
    testComplete.value = true
    await saveResults()
    await clearSavedProgress()
  }
}

// Removed: Early exit logic (no longer prompting to skip after 3 consecutive misses)

async function saveResults() {
  if (!selectedStudentUid.value) return
  
  try {
    const { addDoc, serverTimestamp, doc: firestoreDoc, getDoc } = await import('firebase/firestore')
    
    // Try to find student in local array first
    let student = students.value.find(s => s.uid === selectedStudentUid.value)
    
    // If not found (e.g., student taking their own test), fetch from Firestore
    if (!student) {
      try {
        const studentDoc = await getDoc(firestoreDoc(db, 'students', selectedStudentUid.value))
        if (studentDoc.exists()) {
          student = { uid: studentDoc.id, ...studentDoc.data() } as any
        }
      } catch (error) {
        console.error('Error fetching student data:', error)
      }
    }
    
    // Helper function to remove undefined values from an object
    const removeUndefined = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeUndefined)
      }
      if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = removeUndefined(value)
          }
          return acc
        }, {} as any)
      }
      return obj
    }
    
    const result = removeUndefined({
      studentUid: selectedStudentUid.value,
      studentName: student ? `${student.firstName} ${student.lastName}` : authStore.currentUser?.displayName || 'Unknown',
      diagnosticType: 'foundational',
      overallScore: overallScore.value || 0,
      totalQuestions: questions.value.length || 0,
      correctAnswers: correctCount.value || 0,
      
      // Section scores
      sectionACorrect: sectionACorrect.value || 0,
      sectionATotal: sectionATotal.value || 0,
      sectionAScore: sectionAScore.value || 0,
      sectionBCorrect: sectionBCorrect.value || 0,
      sectionBTotal: sectionBTotal.value || 0,
      sectionBScore: sectionBScore.value || 0,
      
      // Detailed breakdowns
      skillAreaResults: skillAreaResults.value || [],
      goalBasedResults: goalBasedResults.value || [],
      
      // Raw data
      answers: answers.value || [],
      questions: questions.value.map(q => ({
        id: q.id || '',
        questionText: q.questionText || '',
        section: q.section || '',
        category: q.category || '',
        skillArea: q.skillArea || '',
        isGoalBased: q.isGoalBased || false
      })),
      
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      inProgress: false
    })
    
    await addDoc(collection(db, 'diagnosticResults'), result)
    
    console.log('✅ Diagnostic results saved to Firestore:', result)
    
    resultsSaved.value = true
    alert('Results saved successfully! Score: ' + overallScore.value + '%')
  } catch (error) {
    console.error('Error saving results:', error)
    alert('Error saving results. Please try again.')
  }
}

function printResults() {
  window.print()
}

async function startNewTest() {
  await clearSavedProgress()
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
}

async function assignToSelectedStudents() {
  if (assigning.value) return
  
  try {
    assigning.value = true
    
    // Determine which students to assign to
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
    
    // Create diagnostic assignments directly in Firestore
    let successCount = 0
    const { collection: firestoreCollection, addDoc, Timestamp } = await import('firebase/firestore')
    
    for (const student of targetStudents) {
      try {
        // Load student's goals
        const goals = await getGoalsByStudent(student.uid)
        
        // Generate diagnostic questions for this student
        const diagnosticQuestions = generateMixedDiagnostic(goals)
        
        // Create a diagnostic assignment document
        const assignmentData = {
          type: 'diagnostic',
          diagnosticType: 'foundational',
          title: 'Foundational Math Diagnostic (7th Grade)',
          studentUid: student.uid,
          studentName: `${student.firstName} ${student.lastName}`,
          assignedBy: authStore.currentUser?.uid || 'system',
          assignedByName: authStore.currentUser?.displayName || 'System',
          assignedAt: Timestamp.now(),
          dueDate: null, // No due date for diagnostics
          status: 'assigned',
          isComplete: false,
          totalQuestions: diagnosticQuestions.length,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
        
        await addDoc(firestoreCollection(db, 'diagnosticAssignments'), assignmentData)
        
        successCount++
      } catch (error) {
        console.error(`Error assigning to ${student.firstName} ${student.lastName}:`, error)
      }
    }
    
    alert(`✅ Foundational Diagnostic assigned to ${successCount} of ${targetStudents.length} students!\n\nStudents can access it from their dashboard.`)
    
    // Reset form
    await startNewTest()
    
  } catch (error) {
    console.error('Error assigning diagnostic:', error)
    alert('Error assigning diagnostic. Please try again.')
  } finally {
    assigning.value = false
  }
}

function previewQuestions() {
  if (!questions.value.length) {
    questions.value = generateMixedDiagnostic(studentGoals.value)
  }
  showPreview.value = true
}

function closePreview() {
  showPreview.value = false
}

async function loadAssignedDiagnostics() {
  try {
    const assignmentsCollection = collection(db, 'diagnosticAssignments')
    const q = query(assignmentsCollection, where('diagnosticType', '==', 'foundational'))
    const assignmentsSnapshot = await getDocs(q)
    
    assignedDiagnostics.value = []
    assignmentsSnapshot.forEach(docSnapshot => {
      assignedDiagnostics.value.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      })
    })
    
    // Sort by most recent first
    assignedDiagnostics.value.sort((a, b) => {
      const timeA = a.assignedAt?.seconds || 0
      const timeB = b.assignedAt?.seconds || 0
      return timeB - timeA
    })
    
    console.log(`Found ${assignedDiagnostics.value.length} assigned diagnostics`)
  } catch (error) {
    console.error('Error loading assigned diagnostics:', error)
  }
}

async function unassignDiagnostic(assignmentId: string) {
  if (!confirm('Are you sure you want to unassign this diagnostic?')) return
  
  try {
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'diagnosticAssignments', assignmentId))
    
    // Reload assignments
    await loadAssignedDiagnostics()
    
    alert('✅ Diagnostic unassigned successfully!')
  } catch (error) {
    console.error('Error unassigning diagnostic:', error)
    alert('Error unassigning diagnostic. Please try again.')
  }
}

async function loadLiveResults() {
  try {
    const resultsCollection = collection(db, 'diagnosticResults')
    const resultsSnapshot = await getDocs(resultsCollection)
    
    liveResults.value = []
    resultsSnapshot.forEach(docSnapshot => {
      const data = docSnapshot.data()
      if (data.diagnosticType === 'foundational' && data.inProgress) {
        liveResults.value.push(data)
      }
    })
    
    // Sort by most recent first
    liveResults.value.sort((a, b) => {
      const timeA = a.lastUpdated?.seconds || 0
      const timeB = b.lastUpdated?.seconds || 0
      return timeB - timeA
    })
    
    console.log(`Found ${liveResults.value.length} active tests`)
  } catch (error) {
    console.error('Error loading live results:', error)
    alert('Error loading live results. Please try again.')
  }
}

function getPerformanceClass(ratio: number): string {
  if (ratio >= 0.8) return 'excellent'
  if (ratio >= 0.6) return 'good'
  if (ratio >= 0.4) return 'fair'
  return 'needs-improvement'
}

// Progress persistence functions
async function saveProgress() {
  if (!selectedStudentUid.value) return
  
  try {
    const progressRef = doc(db, 'diagnosticProgress', `${selectedStudentUid.value}_foundational`)
    
    await setDoc(progressRef, {
      studentUid: selectedStudentUid.value,
      diagnosticType: 'foundational',
      questions: questions.value,
      answers: answers.value,
      currentQuestionIndex: currentQuestionIndex.value,
      lastSaved: new Date(),
      testStarted: testStarted.value,
      testComplete: testComplete.value
    })
    
    console.log('✅ Progress saved')
  } catch (error) {
    console.error('Error saving progress:', error)
    // Don't block the test if save fails
  }
}

async function saveProgressToFirestore() {
  if (!selectedStudentUid.value) {
    console.warn('⚠️ saveProgressToFirestore: No student UID, skipping save')
    return
  }
  
  try {
    console.log('💾 saveProgressToFirestore: Starting save for student', selectedStudentUid.value)
    console.log('📊 Current answers count:', answers.value.length)
    console.log('📋 Total questions:', questions.value.length)
    
    // Save real-time results for teacher viewing
    const resultsRef = doc(db, 'diagnosticResults', `${selectedStudentUid.value}_foundational_live`)
    
    // Calculate current stats
    const currentCorrect = answers.value.filter(a => a.isCorrect).length
    const currentTotal = answers.value.length
    const currentScore = currentTotal > 0 ? Math.round((currentCorrect / currentTotal) * 100) : 0
    
    console.log('✅ Current stats - Correct:', currentCorrect, 'Total:', currentTotal, 'Score:', currentScore + '%')
    
    // Goal questions stats (first 5)
    const goalAnswers = answers.value.slice(0, Math.min(5, answers.value.length))
    const goalCorrect = goalAnswers.filter(a => a.isCorrect).length
    const goalTotal = goalAnswers.length
    
    // Section breakdown
    const sectionStats = {
      goal: { correct: goalCorrect, total: goalTotal },
      sectionA: { correct: 0, total: 0 },
      sectionB: { correct: 0, total: 0 }
    }
    
    answers.value.forEach((answer, index) => {
      const question = questions.value[index]
      if (question) {
        if (question.section === 'A') {
          sectionStats.sectionA.total++
          if (answer.isCorrect) sectionStats.sectionA.correct++
        } else if (question.section === 'B' && !question.isGoalBased) {
          sectionStats.sectionB.total++
          if (answer.isCorrect) sectionStats.sectionB.correct++
        }
      }
    })
    
    // Get student info - try selectedStudent first, then fetch from students array
    let studentName = 'Unknown Student'
    if (selectedStudent.value?.firstName && selectedStudent.value?.lastName) {
      studentName = `${selectedStudent.value.firstName} ${selectedStudent.value.lastName}`
    } else {
      // Try to find in students array
      const student = students.value.find(s => s.uid === selectedStudentUid.value)
      if (student) {
        studentName = `${student.firstName} ${student.lastName}`
      } else {
        // Last resort - fetch from Firestore
        try {
          const { doc: firestoreDoc, getDoc } = await import('firebase/firestore')
          const studentDoc = await getDoc(firestoreDoc(db, 'students', selectedStudentUid.value))
          if (studentDoc.exists()) {
            const studentData = studentDoc.data()
            studentName = `${studentData.firstName} ${studentData.lastName}`
          }
        } catch (error) {
          console.error('Error fetching student name:', error)
        }
      }
    }
    
    // Calculate detailed breakdowns for in-progress results
    // Section scores (matching final results structure)
    const sectionAAnswers = answers.value.filter((a, i) => {
      const q = questions.value[i]
      return q && q.section === 'A' && !q.isGoalBased
    })
    const sectionBAnswers = answers.value.filter((a, i) => {
      const q = questions.value[i]
      return q && q.section === 'B' && !q.isGoalBased
    })
    
    const sectionACorrectCount = sectionAAnswers.filter(a => a.isCorrect).length
    const sectionBCorrectCount = sectionBAnswers.filter(a => a.isCorrect).length
    
    const sectionAScoreCalc = sectionAAnswers.length > 0 ? Math.round((sectionACorrectCount / sectionAAnswers.length) * 100) : 0
    const sectionBScoreCalc = sectionBAnswers.length > 0 ? Math.round((sectionBCorrectCount / sectionBAnswers.length) * 100) : 0
    
    // Skill area breakdown
    const skillAreas: { [key: string]: { correct: number; total: number } } = {}
    answers.value.forEach((answer, index) => {
      const question = questions.value[index]
      if (question && question.skillArea && !question.isGoalBased) {
        if (!skillAreas[question.skillArea]) {
          skillAreas[question.skillArea] = { correct: 0, total: 0 }
        }
        skillAreas[question.skillArea].total++
        if (answer.isCorrect) {
          skillAreas[question.skillArea].correct++
        }
      }
    })
    
    const skillAreaResultsArray = Object.entries(skillAreas).map(([area, stats]) => ({
      area,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    }))
    
    // Goal-based breakdown
    const goalBasedAnswers = answers.value.filter((a, i) => {
      const q = questions.value[i]
      return q && q.isGoalBased
    })
    const goalCorrectCount = goalBasedAnswers.filter(a => a.isCorrect).length
    const goalBasedResultsArray = [{
      correct: goalCorrectCount,
      total: goalBasedAnswers.length,
      percentage: goalBasedAnswers.length > 0 ? Math.round((goalCorrectCount / goalBasedAnswers.length) * 100) : 0
    }]
    
    await setDoc(resultsRef, {
      studentUid: selectedStudentUid.value,
      studentName: studentName,
      diagnosticType: 'foundational',
      isComplete: testComplete.value,
      inProgress: !testComplete.value,
      overallScore: currentScore,
      currentScore,
      currentCorrect,
      currentTotal,
      correctAnswers: currentCorrect,
      questionsAnswered: answers.value.length,
      totalQuestions: questions.value.length,
      
      // Section scores (matching final results structure)
      sectionACorrect: sectionACorrectCount,
      sectionATotal: sectionAAnswers.length,
      sectionAScore: sectionAScoreCalc,
      sectionBCorrect: sectionBCorrectCount,
      sectionBTotal: sectionBAnswers.length,
      sectionBScore: sectionBScoreCalc,
      
      // Detailed breakdowns
      skillAreaResults: skillAreaResultsArray,
      goalBasedResults: goalBasedResultsArray,
      
      // Legacy format for backwards compatibility
      sectionStats,
      
      // Include full question and answer data
      answers: answers.value.map((a, i) => ({
        questionId: a.questionId,
        questionText: questions.value[i]?.questionText || '',
        answer: a.answer,
        correctAnswer: questions.value[i]?.correctAnswer || '',
        isCorrect: a.isCorrect,
        section: questions.value[i]?.section || '',
        skillArea: questions.value[i]?.skillArea || '',
        isGoalBased: questions.value[i]?.isGoalBased || false
      })),
      questions: questions.value.map(q => ({
        id: q.id || '',
        questionText: q.questionText || '',
        section: q.section || '',
        category: q.category || '',
        skillArea: q.skillArea || '',
        isGoalBased: q.isGoalBased || false,
        correctAnswer: q.correctAnswer || ''
      })),
      
      lastUpdated: new Date(),
      startedAt: testStarted.value ? new Date() : null,
      createdAt: new Date()
    })
    
    console.log('✅ Real-time results saved successfully to Firestore')
    console.log('📄 Document ID:', `${selectedStudentUid.value}_foundational_live`)
    console.log('📊 Saved data summary:', {
      studentName,
      questionsAnswered: answers.value.length,
      currentScore,
      sectionACorrect: sectionACorrectCount,
      sectionBCorrect: sectionBCorrectCount
    })
  } catch (error) {
    console.error('❌ Error saving real-time results:', error)
    console.error('Error details:', error)
    // Don't block the test if save fails
  }
}

async function loadSavedProgress() {
  if (!selectedStudentUid.value) return null
  
  try {
    const progressRef = doc(db, 'diagnosticProgress', `${selectedStudentUid.value}_foundational`)
    const progressDoc = await getDoc(progressRef)
    
    if (progressDoc.exists()) {
      const data = progressDoc.data()
      
      // Only return progress if test is not complete
      if (!data.testComplete && data.answers && data.answers.length > 0) {
        console.log('📂 Found saved progress:', data.answers.length, 'answers')
        return {
          questions: data.questions,
          answers: data.answers,
          currentQuestionIndex: data.currentQuestionIndex
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error loading saved progress:', error)
    return null
  }
}

async function clearSavedProgress() {
  if (!selectedStudentUid.value) return
  
  try {
    const progressRef = doc(db, 'diagnosticProgress', `${selectedStudentUid.value}_foundational`)
    await setDoc(progressRef, {
      studentUid: selectedStudentUid.value,
      diagnosticType: 'foundational',
      cleared: true,
      clearedAt: new Date()
    })
    
    console.log('🗑️ Progress cleared')
  } catch (error) {
    console.error('Error clearing progress:', error)
  }
}

onMounted(async () => {
  loadStudents()
  loadAssignedDiagnostics()
  
  // Check if this is a student accessing an assigned diagnostic
  const route = useRoute()
  const assignmentId = route.query.assignment as string
  
  if (assignmentId && authStore.currentUser?.role === 'student') {
    // Student is taking an assigned diagnostic
    try {
      // Load the assignment details
      const assignmentDoc = await getDoc(doc(db, 'diagnosticAssignments', assignmentId))
      
      if (assignmentDoc.exists()) {
        const assignmentData = assignmentDoc.data()
        
        // Set student UID
        selectedStudentUid.value = authStore.currentUser.uid
        
        // Load student goals
        studentGoals.value = await getGoalsByStudent(authStore.currentUser.uid)
        
        // Auto-start the test
        await startTest()
      }
    } catch (error) {
      console.error('Error loading assigned diagnostic:', error)
      alert('Error loading your assigned diagnostic. Please try again.')
    }
  }
})
</script>

<style scoped>
.foundational-diagnostic-container {
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

.mode-option input[type="radio"] {
  cursor: pointer;
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

.student-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.info-box {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
}

.info-box h3 {
  margin-top: 0;
  color: #333;
}

.info-box ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-box li {
  margin: 0.5rem 0;
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
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
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

.test-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.test-header {
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-badge {
  background: #e7f3ff;
  color: #0066cc;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #00d4ff);
  transition: width 0.3s;
}

/* Question Navigator */
.question-navigator {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.question-overview-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.question-nav-btn {
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-nav-btn.current {
  background: #007bff;
  color: white;
  border-color: #007bff;
  transform: scale(1.1);
}

.question-nav-btn.answered {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.question-nav-btn.unanswered {
  background: #ffc107;
  color: #000;
  border-color: #ffc107;
}

.question-nav-btn:hover:not(.current) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.question-card {
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.multiple-choice-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.choice-option {
  padding: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.choice-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.choice-option.selected {
  border-color: #007bff;
  background: #e7f3ff;
}

.choice-option input[type="radio"] {
  width: 20px;
  height: 20px;
}

.choice-option label {
  cursor: pointer;
  flex: 1;
  margin: 0;
}

.answer-input-section {
  margin-bottom: 2rem;
}

.answer-input-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1.1rem;
}

.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.95rem;
}

.help-text.success {
  color: #28a745;
  font-weight: 500;
  font-style: italic;
}

.question-actions {
  margin-bottom: 1rem;
}

.hint-section {
  margin-top: 2rem;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
}

.test-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.results-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 3rem;
  font-weight: bold;
  color: white;
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
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.category-breakdown {
  margin-bottom: 2rem;
}

.category-result {
  margin-bottom: 1.5rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.category-bar {
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  transition: width 0.5s;
}

.category-fill.excellent { background: #28a745; }
.category-fill.good { background: #17a2b8; }
.category-fill.fair { background: #ffc107; }
.category-fill.needs-improvement { background: #dc3545; }

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

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
  padding: 2rem;
  border-radius: 12px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

.preview-question {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.preview-meta {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

/* Student completion view */
.completion-message {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

/* Teacher results view enhancements */
.teacher-view .results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.teacher-view .student-name {
  font-size: 1.3rem;
  color: #666;
  font-weight: 500;
}

.teacher-view .summary-card.primary {
  border: 2px solid #007bff;
}

.teacher-view .score-detail {
  margin-top: 0.5rem;
  font-size: 1rem;
}

/* Section breakdown */
.section-breakdown {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.section-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-card h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.section-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.section-score {
  text-align: center;
  margin: 1rem 0;
}

.score-big {
  display: block;
  font-size: 3rem;
  font-weight: bold;
  color: #007bff;
}

.progress-bar {
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s;
}

.progress-fill.excellent { background: #28a745; }
.progress-fill.good { background: #17a2b8; }
.progress-fill.fair { background: #ffc107; }
.progress-fill.needs-improvement { background: #dc3545; }

/* Domain/Skill area breakdown */
.domain-breakdown {
  margin: 2rem 0;
}

.domain-result {
  margin-bottom: 1.5rem;
}

.domain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.domain-name {
  font-weight: 600;
  font-size: 1rem;
}

.domain-score {
  font-weight: 600;
}

.domain-score .percentage {
  font-size: 0.9rem;
  color: #666;
  margin-left: 0.5rem;
}

.domain-score.excellent { color: #28a745; }
.domain-score.good { color: #17a2b8; }
.domain-score.fair { color: #ffc107; }
.domain-score.needs-improvement { color: #dc3545; }

.domain-bar {
  height: 16px;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.domain-fill {
  height: 100%;
  transition: width 0.5s;
}

.domain-fill.excellent { background: #28a745; }
.domain-fill.good { background: #17a2b8; }
.domain-fill.fair { background: #ffc107; }
.domain-fill.needs-improvement { background: #dc3545; }

/* Goal-based questions section */
.goal-breakdown {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 8px;
}

.goal-summary {
  text-align: center;
}

.goal-score {
  margin-top: 1rem;
}

/* Live Monitor */
.monitor-btn {
  margin-top: 1rem;
}

.live-monitor-modal {
  max-width: 1000px;
  max-height: 90vh;
}

.live-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.live-result-card {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
}

.student-header h4 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.in-progress {
  background: #fff3cd;
  color: #856404;
}

.status-badge.complete {
  background: #d4edda;
  color: #155724;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-stats .stat {
  text-align: center;
}

.progress-stats .label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.progress-stats .value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.section-breakdown {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.section-stat {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.section-stat:last-child {
  border-bottom: none;
}

.section-label {
  font-weight: 500;
}

.section-value {
  font-weight: 600;
  color: #007bff;
}

.last-updated {
  font-size: 0.85rem;
  color: #666;
  text-align: center;
  margin-top: 1rem;
}

.no-tests {
  text-align: center;
  padding: 3rem;
  color: #666;
}

/* Assigned Diagnostics Section */
.assigned-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.assigned-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.assigned-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.assignment-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.assignment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
}

.assignment-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.assigned {
  background: #fff3cd;
  color: #856404;
}

.status-badge.complete {
  background: #d4edda;
  color: #155724;
}

.assignment-details {
  margin-bottom: 1rem;
}

.assignment-details p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #c82333;
}

@media print {
  .action-buttons,
  .question-actions,
  .btn {
    display: none !important;
  }
  
  .student-view {
    display: none !important;
  }
  
  .assigned-section {
    display: none !important;
  }
}
</style>

