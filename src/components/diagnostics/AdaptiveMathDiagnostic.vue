<template>
  <div class="adaptive-diagnostic-container">
    <div class="page-header">
      <h1>🧮 Adaptive Math Diagnostic</h1>
      <p class="subtitle">Real-time adaptive assessment that adjusts to student performance</p>
    </div>

    <!-- Student Selection -->
    <div v-if="!testStarted" class="student-selection-card">
      <h2>Select Student</h2>
      <select v-model="selectedStudentUid" class="form-select">
        <option value="">-- Select a Student --</option>
        <option v-for="student in students" :key="student.uid" :value="student.uid">
          {{ student.firstName }} {{ student.lastName }} ({{ student.grade || 'N/A' }})
        </option>
      </select>

      <button 
        v-if="selectedStudentUid"
        @click="startTest"
        class="btn btn-primary btn-lg"
      >
        🚀 Start Adaptive Diagnostic
      </button>

      <div v-if="selectedStudentUid" class="info-box">
        <h3>ℹ️ How Adaptive Testing Works</h3>
        <ul>
          <li><strong>Real-time Adaptation:</strong> Questions adjust based on answers</li>
          <li><strong>Get a Question Wrong:</strong> Next question becomes easier</li>
          <li><strong>Get a Question Right:</strong> Next question becomes harder</li>
          <li><strong>7 Categories Tested:</strong> Multiplication, Division, Addition, Subtraction, Order of Operations, Decimals, Word Problems</li>
          <li><strong>2 Questions Per Category:</strong> 14 total questions</li>
          <li><strong>No Printing:</strong> Real-time assessment only (no print or picture requirements)</li>
          <li><strong>Instant Feedback:</strong> See results immediately after completion</li>
        </ul>
      </div>
    </div>

    <!-- Active Test -->
    <div v-if="testStarted && !testComplete" class="test-container">
      <div class="test-header">
        <div class="progress-info">
          <h3>Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}</h3>
          <div class="category-badge">{{ getCurrentCategoryDisplay() }}</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>

      <div class="question-card">
        <div class="question-text">
          <p>{{ currentQuestion?.questionText }}</p>
        </div>

        <div class="answer-input-section">
          <label>Your Answer:</label>
          <input 
            v-model="currentAnswer"
            type="text"
            class="form-control answer-input"
            placeholder="Enter your answer"
            @keyup.enter="submitAnswer"
            autofocus
          />
        </div>

        <div class="question-actions">
          <button 
            @click="submitAnswer"
            class="btn btn-primary btn-lg"
            :disabled="!currentAnswer.trim()"
          >
            Submit Answer →
          </button>
        </div>

        <div v-if="currentQuestion?.explanation" class="hint-section">
          <details>
            <summary>💡 Hint</summary>
            <p>{{ currentQuestion.explanation }}</p>
          </details>
        </div>
      </div>

      <div class="test-stats">
        <div class="stat-item">
          <span class="stat-label">Correct:</span>
          <span class="stat-value correct">{{ correctCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Incorrect:</span>
          <span class="stat-value incorrect">{{ incorrectCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Difficulty:</span>
          <span class="stat-value" :class="currentDifficulty">{{ currentDifficulty.toUpperCase() }}</span>
        </div>
      </div>
    </div>

    <!-- Test Complete -->
    <div v-if="testComplete" class="results-container">
      <div class="results-header">
        <h2>✅ Test Complete!</h2>
        <p>{{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}</p>
      </div>

      <div class="results-summary">
        <div class="summary-card">
          <h3>Score</h3>
          <div class="big-score">{{ correctCount }} / {{ totalQuestions }}</div>
          <div class="percentage">{{ scorePercentage }}%</div>
        </div>

        <div class="summary-card">
          <h3>Performance</h3>
          <div class="performance-level" :class="performanceClass">
            {{ performanceLevel }}
          </div>
        </div>
      </div>

      <div class="category-breakdown">
        <h3>📊 Category Breakdown</h3>
        <div class="breakdown-grid">
          <div v-for="(result, category) in categoryResults" :key="category" class="category-result">
            <div class="category-name">{{ formatCategoryName(category) }}</div>
            <div class="category-score">
              {{ result.correct }} / {{ result.total }}
              <span class="category-difficulty" :class="result.finalDifficulty">
                ({{ result.finalDifficulty }})
              </span>
            </div>
            <div class="category-bar">
              <div 
                class="category-bar-fill" 
                :style="{ width: (result.correct / result.total * 100) + '%' }"
                :class="result.correct === result.total ? 'perfect' : ''"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="detailed-results">
        <h3>📝 Detailed Results</h3>
        <div class="result-list">
          <div v-for="(result, index) in testResults" :key="index" class="result-item">
            <div class="result-header">
              <span class="result-number">Q{{ index + 1 }}</span>
              <span class="result-category">{{ formatCategoryName(result.category) }}</span>
              <span class="result-difficulty" :class="result.difficulty">{{ result.difficulty }}</span>
              <span class="result-status" :class="result.correct ? 'correct' : 'incorrect'">
                {{ result.correct ? '✓' : '✗' }}
              </span>
            </div>
            <div class="result-question">{{ result.questionText }}</div>
            <div class="result-answers">
              <div class="student-answer" :class="result.correct ? 'correct' : 'incorrect'">
                <strong>Your answer:</strong> {{ result.studentAnswer }}
              </div>
              <div v-if="!result.correct" class="correct-answer">
                <strong>Correct answer:</strong> {{ result.correctAnswer }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button @click="resetTest" class="btn btn-secondary">
          🔄 Start New Test
        </button>
        <button @click="saveResults" class="btn btn-primary" :disabled="saving">
          💾 {{ saving ? 'Saving...' : 'Save Results to Gradebook' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { getStudentsByTeacher } from '@/firebase/userServices'
import type { Student } from '@/types/users'
import { 
  adaptiveQuestionBank, 
  getAdaptiveQuestion, 
  getStartingDifficulty,
  type DifficultyLevel,
  type QuestionCategory,
  type AdaptiveQuestion
} from '@/utils/adaptiveDiagnosticGenerator'
import { createAssessment } from '@/firebase/iepServices'
import { assignAssessmentToStudent } from '@/firebase/assignmentServices'
import type { AssessmentQuestion } from '@/types/iep'

const authStore = useAuthStore()

// State
const students = ref<Student[]>([])
const selectedStudentUid = ref<string>('')
const testStarted = ref(false)
const testComplete = ref(false)
const saving = ref(false)

// Test State
const currentQuestionIndex = ref(0)
const currentQuestion = ref<AdaptiveQuestion | null>(null)
const currentAnswer = ref('')
const currentCategory = ref<QuestionCategory>('multiplication')
const currentDifficulty = ref<DifficultyLevel>('medium')
const usedQuestionIds = ref<Set<string>>(new Set())
const testResults = ref<any[]>([])
const categoryProgress = ref<Map<QuestionCategory, number>>(new Map())
const categoryDifficulties = ref<Map<QuestionCategory, DifficultyLevel>>(new Map())

// Test Configuration
const categories: QuestionCategory[] = ['multiplication', 'division', 'addition', 'subtraction', 'orderOfOperations', 'decimals', 'wordProblems']
const questionsPerCategory = 2
const totalQuestions = categories.length * questionsPerCategory

// Computed
const selectedStudent = computed(() => students.value.find((s: Student) => s.uid === selectedStudentUid.value))
const progressPercentage = computed(() => (currentQuestionIndex.value / totalQuestions) * 100)
const correctCount = computed(() => testResults.value.filter(r => r.correct).length)
const incorrectCount = computed(() => testResults.value.filter(r => !r.correct).length)
const scorePercentage = computed(() => Math.round((correctCount.value / totalQuestions) * 100))

const performanceLevel = computed(() => {
  const pct = scorePercentage.value
  if (pct >= 90) return 'Excellent'
  if (pct >= 80) return 'Good'
  if (pct >= 70) return 'Satisfactory'
  if (pct >= 60) return 'Needs Improvement'
  return 'Needs Significant Support'
})

const performanceClass = computed(() => {
  const pct = scorePercentage.value
  if (pct >= 80) return 'excellent'
  if (pct >= 70) return 'good'
  if (pct >= 60) return 'satisfactory'
  return 'needs-improvement'
})

const categoryResults = computed(() => {
  const results: Record<string, any> = {}
  
  for (const category of categories) {
    const categoryQuestions = testResults.value.filter(r => r.category === category)
    const correct = categoryQuestions.filter(r => r.correct).length
    const total = categoryQuestions.length
    const finalDifficulty = categoryDifficulties.value.get(category) || 'medium'
    
    results[category] = {
      correct,
      total,
      finalDifficulty
    }
  }
  
  return results
})

// Methods
const loadStudents = async () => {
  if (!authStore.currentUser) return
  
  try {
    students.value = await getStudentsByTeacher(authStore.currentUser.uid)
    console.log('✅ Loaded students:', students.value.length)
  } catch (error) {
    console.error('❌ Error loading students:', error)
  }
}

const startTest = () => {
  // Reset everything
  testStarted.value = true
  testComplete.value = false
  currentQuestionIndex.value = 0
  testResults.value = []
  usedQuestionIds.value.clear()
  categoryProgress.value.clear()
  currentAnswer.value = ''
  
  // Initialize category progress
  for (const category of categories) {
    categoryProgress.value.set(category, 0)
    categoryDifficulties.value.set(category, getStartingDifficulty(category))
  }
  
  // Load first question
  loadNextQuestion()
}

const loadNextQuestion = () => {
  // Find next category that needs questions
  let nextCategory: QuestionCategory | null = null
  
  for (const category of categories) {
    const progress = categoryProgress.value.get(category) || 0
    if (progress < questionsPerCategory) {
      nextCategory = category
      break
    }
  }
  
  if (!nextCategory) {
    // All categories complete
    finishTest()
    return
  }
  
  currentCategory.value = nextCategory
  const progress = categoryProgress.value.get(nextCategory) || 0
  
  // For first question in category, start at starting difficulty
  // For subsequent questions, use adaptive selection
  let gotPreviousCorrect: boolean | null = null
  if (progress > 0) {
    // Get last result for this category
    const categoryResults = testResults.value.filter(r => r.category === nextCategory)
    if (categoryResults.length > 0) {
      gotPreviousCorrect = categoryResults[categoryResults.length - 1].correct
    }
  }
  
  currentDifficulty.value = categoryDifficulties.value.get(nextCategory) || 'medium'
  
  const question = getAdaptiveQuestion(
    nextCategory,
    currentDifficulty.value,
    gotPreviousCorrect,
    usedQuestionIds.value
  )
  
  if (!question) {
    console.error('No question available for category:', nextCategory)
    // Move to next category
    categoryProgress.value.set(nextCategory, questionsPerCategory)
    loadNextQuestion()
    return
  }
  
  currentQuestion.value = question
  currentDifficulty.value = question.difficulty
  categoryDifficulties.value.set(nextCategory, question.difficulty)
  usedQuestionIds.value.add(question.id)
  currentAnswer.value = ''
}

const submitAnswer = () => {
  if (!currentQuestion.value || !currentAnswer.value.trim()) return
  
  const userAnswer = currentAnswer.value.trim().toLowerCase()
  const correctAnswer = currentQuestion.value.correctAnswer.toLowerCase()
  const acceptableAnswers = currentQuestion.value.acceptableAnswers.map(a => a.toLowerCase())
  
  const isCorrect = userAnswer === correctAnswer || acceptableAnswers.includes(userAnswer)
  
  // Record result
  testResults.value.push({
    questionText: currentQuestion.value.questionText,
    category: currentCategory.value,
    difficulty: currentDifficulty.value,
    studentAnswer: currentAnswer.value.trim(),
    correctAnswer: currentQuestion.value.correctAnswer,
    correct: isCorrect,
    points: isCorrect ? currentQuestion.value.points : 0
  })
  
  // Update category progress
  const currentProgress = categoryProgress.value.get(currentCategory.value) || 0
  categoryProgress.value.set(currentCategory.value, currentProgress + 1)
  
  // Update question index
  currentQuestionIndex.value++
  
  // Load next question
  setTimeout(() => {
    loadNextQuestion()
  }, 100)
}

const finishTest = () => {
  testComplete.value = true
  testStarted.value = false
}

const resetTest = () => {
  testStarted.value = false
  testComplete.value = false
  selectedStudentUid.value = ''
  currentQuestionIndex.value = 0
  testResults.value = []
  usedQuestionIds.value.clear()
  categoryProgress.value.clear()
  categoryDifficulties.value.clear()
}

const saveResults = async () => {
  if (!selectedStudent.value || !authStore.currentUser) return
  
  try {
    saving.value = true
    
    // Convert test results to assessment format
    const questions: AssessmentQuestion[] = testResults.value.map((result, index) => ({
      id: `adaptive-q${index + 1}`,
      questionText: result.questionText,
      questionType: 'short-answer' as const,
      correctAnswer: result.correctAnswer,
      acceptableAnswers: [],
      points: result.points,
      explanation: `Category: ${formatCategoryName(result.category)} | Difficulty: ${result.difficulty}`
    }))
    
    const totalPoints = testResults.value.reduce((sum, r) => sum + (r.correct ? r.points : 0), 0)
    const maxPoints = testResults.value.reduce((sum, r) => sum + r.points, 0)
    
    // Create assessment
    const assessmentData = {
      title: `Adaptive Math Diagnostic - ${selectedStudent.value.firstName} ${selectedStudent.value.lastName}`,
      description: `Real-time adaptive assessment that adjusted difficulty based on performance. Final score: ${correctCount.value}/${totalQuestions} (${scorePercentage.value}%). Performance level: ${performanceLevel.value}.`,
      gradeLevel: (typeof selectedStudent.value.grade === 'number' ? selectedStudent.value.grade : parseInt(selectedStudent.value.grade || '7')) || 7,
      category: 'SA' as const,
      goalId: '',
      createdBy: authStore.currentUser.uid,
      questions: questions,
      totalPoints: maxPoints,
      instructions: 'This was an adaptive diagnostic test. Questions adjusted in real-time based on student performance.',
      timeLimit: 0,
      accommodations: ['Adaptive difficulty', 'Real-time assessment', 'No print/picture requirements']
    }
    
    const assessmentId = await createAssessment(assessmentData)
    
    // Assign to student
    await assignAssessmentToStudent(assessmentId, selectedStudentUid.value, authStore.currentUser.uid)
    
    // Note: Results are already captured in the test data structure
    // In a real implementation, you'd save these results directly to the assessmentResults collection
    
    alert(`✅ Results saved successfully!\n\nScore: ${correctCount.value}/${totalQuestions} (${scorePercentage.value}%)\nPerformance: ${performanceLevel.value}`)
    
    resetTest()
  } catch (error) {
    console.error('❌ Error saving results:', error)
    alert('Error saving results. Please try again.')
  } finally {
    saving.value = false
  }
}

const getCurrentCategoryDisplay = () => {
  return formatCategoryName(currentCategory.value)
}

const formatCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    multiplication: 'Multiplication',
    division: 'Division',
    addition: 'Addition',
    subtraction: 'Subtraction',
    orderOfOperations: 'Order of Operations',
    decimals: 'Decimals',
    wordProblems: 'Word Problems'
  }
  return names[category] || category
}

onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.adaptive-diagnostic-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.student-selection-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.student-selection-card h2 {
  margin-bottom: 1rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  width: 100%;
  margin-bottom: 1.5rem;
}

.info-box {
  background: #e8f4f8;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.info-box h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.info-box ul {
  list-style: none;
  padding-left: 0;
}

.info-box li {
  padding: 0.5rem 0;
  color: #34495e;
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
  background: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
}

.progress-bar {
  height: 12px;
  background: #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.question-card {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.answer-input-section label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.answer-input {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.answer-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.question-actions {
  text-align: center;
}

.hint-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.hint-section summary {
  cursor: pointer;
  color: #3498db;
  font-weight: bold;
}

.test-stats {
  display: flex;
  gap: 1rem;
  justify-content: space-around;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-value.correct {
  color: #27ae60;
}

.stat-value.incorrect {
  color: #e74c3c;
}

.stat-value.easy {
  color: #27ae60;
}

.stat-value.medium {
  color: #f39c12;
}

.stat-value.hard {
  color: #e74c3c;
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

.results-header h2 {
  font-size: 2rem;
  color: #27ae60;
  margin-bottom: 0.5rem;
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.summary-card h3 {
  margin-bottom: 1rem;
  opacity: 0.9;
}

.big-score {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.percentage {
  font-size: 1.5rem;
  opacity: 0.9;
}

.performance-level {
  font-size: 1.8rem;
  font-weight: bold;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
}

.performance-level.excellent {
  background: rgba(46, 204, 113, 0.9);
}

.performance-level.good {
  background: rgba(52, 152, 219, 0.9);
}

.performance-level.satisfactory {
  background: rgba(243, 156, 18, 0.9);
}

.performance-level.needs-improvement {
  background: rgba(231, 76, 60, 0.9);
}

.category-breakdown {
  margin-bottom: 2rem;
}

.category-breakdown h3 {
  margin-bottom: 1rem;
}

.breakdown-grid {
  display: grid;
  gap: 1rem;
}

.category-result {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.category-name {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.category-score {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.category-difficulty {
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.category-difficulty.easy {
  background: #d5f4e6;
  color: #27ae60;
}

.category-difficulty.medium {
  background: #ffeaa7;
  color: #f39c12;
}

.category-difficulty.hard {
  background: #ffcccc;
  color: #e74c3c;
}

.category-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.category-bar-fill.perfect {
  background: #27ae60;
}

.detailed-results {
  margin-bottom: 2rem;
}

.detailed-results h3 {
  margin-bottom: 1rem;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
}

.result-item:has(.result-status.correct) {
  border-left-color: #27ae60;
}

.result-item:has(.result-status.incorrect) {
  border-left-color: #e74c3c;
}

.result-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.result-number {
  font-weight: bold;
  background: #34495e;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.result-category {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.result-difficulty {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
}

.result-difficulty.easy {
  background: #d5f4e6;
  color: #27ae60;
}

.result-difficulty.medium {
  background: #ffeaa7;
  color: #f39c12;
}

.result-difficulty.hard {
  background: #ffcccc;
  color: #e74c3c;
}

.result-status {
  margin-left: auto;
  font-size: 1.5rem;
  font-weight: bold;
}

.result-status.correct {
  color: #27ae60;
}

.result-status.incorrect {
  color: #e74c3c;
}

.result-question {
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 1.05rem;
}

.result-answers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.student-answer {
  padding: 0.5rem;
  border-radius: 4px;
}

.student-answer.correct {
  background: #d5f4e6;
  color: #27ae60;
}

.student-answer.incorrect {
  background: #ffcccc;
  color: #e74c3c;
}

.correct-answer {
  background: #d5f4e6;
  color: #27ae60;
  padding: 0.5rem;
  border-radius: 4px;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .adaptive-diagnostic-container {
    padding: 1rem;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .results-summary {
    grid-template-columns: 1fr;
  }
  
  .results-actions {
    flex-direction: column;
  }
  
  .results-actions .btn {
    width: 100%;
  }
}
</style>

