<template>
  <div class="score-entry-container">
    <!-- Header -->
    <div class="entry-header">
      <h2>📝 Enter Fluency Assessment Scores</h2>
      <p class="subtitle">Input results from paper fluency checks</p>
    </div>

    <!-- Assessment Setup -->
    <div v-if="!entryStarted" class="setup-section">
      <div class="form-row">
        <div class="form-group">
          <label>Assessment ID:</label>
          <input 
            v-model="assessmentId" 
            type="text" 
            class="form-input"
            placeholder="Auto-generated or custom (e.g., FLU_ADD_W3_2025-11-17)"
          />
          <p class="help-text">Leave blank for auto-generated ID</p>
        </div>

        <div class="form-group">
          <label>Assessment Name: *</label>
          <input 
            v-model="assessmentName" 
            type="text" 
            class="form-input"
            placeholder="Week 3 Addition Fluency Check"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Category (Operation): *</label>
          <select v-model="assessmentCategory" class="form-select" required>
            <option value="">Select operation...</option>
            <option value="addition">Addition</option>
            <option value="subtraction">Subtraction</option>
            <option value="multiplication">Multiplication</option>
            <option value="division">Division</option>
            <option value="mixed">Mixed Operations</option>
          </select>
        </div>

        <div class="form-group">
          <label>Week Number:</label>
          <input 
            v-model.number="weekNumber" 
            type="number" 
            min="1" 
            class="form-input"
            placeholder="1"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Select Students to Score:</label>
        <div class="student-filter">
          <input 
            v-model="studentSearch" 
            type="text" 
            class="search-input"
            placeholder="Search by name..."
          />
        </div>
        <div class="student-selection-list">
          <label 
            v-for="student in filteredStudents" 
            :key="student.uid"
            class="student-checkbox"
          >
            <input 
              type="checkbox" 
              :value="student.uid"
              v-model="selectedStudentUids"
            />
            <span>{{ student.lastName }}, {{ student.firstName }}</span>
          </label>
        </div>
        <div class="selection-actions">
          <button @click="selectAll" class="action-btn">Select All</button>
          <button @click="clearAll" class="action-btn">Clear All</button>
        </div>
      </div>

      <button 
        @click="startEntry" 
        class="start-entry-btn"
        :disabled="!canStartEntry"
      >
        Begin Score Entry ({{ selectedStudentUids.length }} students)
      </button>
    </div>

    <!-- Score Entry Grid -->
    <div v-if="entryStarted && !allComplete" class="entry-section">
      <!-- Progress -->
      <div class="entry-progress">
        <h3>Scoring Progress: {{ currentStudentIndex + 1 }}/{{ selectedStudentUids.length }}</h3>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${((currentStudentIndex + 1) / selectedStudentUids.length) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Current Student Entry -->
      <div class="student-entry-card">
        <h3>{{ currentStudentName }}</h3>

        <!-- Quick Entry Mode -->
        <div class="entry-mode-selector">
          <label class="radio-option">
            <input type="radio" v-model="entryMode" value="quick" />
            <span><strong>Quick Entry</strong> - Total attempted/correct only (faster)</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="entryMode" value="detailed" />
            <span><strong>Detailed Entry</strong> - Mark specific incorrect problems</span>
          </label>
        </div>

        <!-- Overall Results (Both Modes) -->
        <div class="overall-results">
          <h4>Overall Results:</h4>
          <div class="result-inputs">
            <div class="input-group">
              <label>Total Attempted: *</label>
              <input 
                v-model.number="currentEntry.attempted" 
                type="number" 
                min="0" 
                :max="totalProblems"
                class="number-input"
                required
              />
            </div>
            <div class="input-group">
              <label>Total Correct: *</label>
              <input 
                v-model.number="currentEntry.correct" 
                type="number" 
                min="0" 
                :max="currentEntry.attempted"
                class="number-input"
                required
              />
            </div>
            <div class="input-group">
              <label>Total Incorrect:</label>
              <input 
                :value="currentEntry.attempted - currentEntry.correct" 
                type="number" 
                class="number-input"
                disabled
              />
            </div>
          </div>

          <!-- Auto-Calculated Metrics -->
          <div class="calculated-metrics">
            <div class="metric-item">
              <span class="metric-label">Problems/Minute:</span>
              <span class="metric-value">{{ currentEntry.correct }} CPM</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Accuracy:</span>
              <span class="metric-value">
                {{ currentEntry.attempted > 0 ? Math.round((currentEntry.correct / currentEntry.attempted) * 100) : 0 }}%
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Fluency Level:</span>
              <span :class="['metric-value', 'level-' + currentFluencyLevel]">
                {{ currentFluencyLevelDisplay }}
              </span>
            </div>
          </div>
        </div>

        <!-- Detailed Entry: Problem Grid -->
        <div v-if="entryMode === 'detailed'" class="detailed-entry">
          <h4>Mark Incorrect Problems:</h4>
          <p class="detail-instructions">
            Click problem numbers that were incorrect. System will update history for each.
          </p>
          
          <div class="problem-grid">
            <button
              v-for="n in currentEntry.attempted"
              :key="n"
              @click="toggleProblemIncorrect(n)"
              :class="['problem-btn', { incorrect: currentEntry.incorrectProblems.includes(n) }]"
            >
              {{ n }}
            </button>
          </div>

          <div class="error-summary">
            <p><strong>Selected Errors:</strong> {{ currentEntry.incorrectProblems.length }}</p>
            <p v-if="currentEntry.incorrectProblems.length !== (currentEntry.attempted - currentEntry.correct)" class="warning">
              ⚠️ Error count ({{ currentEntry.incorrectProblems.length }}) doesn't match Total Incorrect ({{ currentEntry.attempted - currentEntry.correct }})
            </p>
          </div>

          <!-- Show problem details for errors -->
          <div v-if="currentEntry.incorrectProblems.length > 0 && currentAssessmentProblems.length > 0" class="error-details">
            <h4>Problem History (Last 5 Attempts):</h4>
            <div 
              v-for="problemNum in currentEntry.incorrectProblems.slice(0, 5)" 
              :key="problemNum"
              class="problem-history-card"
            >
              <div class="problem-header">
                <strong>Problem #{{ problemNum }}:</strong> 
                {{ currentAssessmentProblems[problemNum - 1]?.displayText || 'N/A' }}
              </div>
              <div class="history-list">
                <div class="history-note">
                  (History will be updated after saving)
                </div>
              </div>
            </div>
            <p v-if="currentEntry.incorrectProblems.length > 5" class="more-errors">
              ...and {{ currentEntry.incorrectProblems.length - 5 }} more errors
            </p>
          </div>
        </div>

        <!-- Teacher Notes -->
        <div class="form-group">
          <label>Teacher Notes (Optional):</label>
          <textarea 
            v-model="currentEntry.notes" 
            class="notes-textarea"
            rows="3"
            placeholder="Observations about student performance, strategies used, etc."
          ></textarea>
        </div>

        <!-- Navigation Buttons -->
        <div class="entry-actions">
          <button 
            @click="saveCurrent" 
            class="save-btn"
            :disabled="!canSaveCurrent"
          >
            {{ currentStudentIndex < selectedStudentUids.length - 1 ? 'Save & Next Student →' : 'Save & Finish' }}
          </button>
          <button @click="skipCurrent" class="skip-btn">
            Skip Student
          </button>
        </div>
      </div>
    </div>

    <!-- All Complete -->
    <div v-if="allComplete" class="complete-section">
      <h2>✅ Score Entry Complete!</h2>
      <div class="summary-stats">
        <p><strong>Assessments Scored:</strong> {{ savedCount }}/{{ selectedStudentUids.length }}</p>
        <p><strong>Assessment:</strong> {{ assessmentName }}</p>
        <p><strong>Category:</strong> {{ assessmentCategory }}</p>
      </div>

      <div class="complete-actions">
        <button @click="viewDashboard" class="dashboard-btn">
          View Fluency Dashboard →
        </button>
        <button @click="startAnother" class="another-btn">
          Enter Another Assessment
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { 
  getFluencyProgress, 
  createFluencyAssessment,
  updateProblemInProgress,
  getLatestAssessment
} from '@/services/mathFluencyServices'
import { getAllProblemsForOperation } from '@/utils/mathFluencyProblemGenerator'
import { calculateFluencyLevel } from '@/types/mathFluency'
import type { Student } from '@/types/users'
import type { OperationType, MathFactProblem, FluencyLevel } from '@/types/mathFluency'
import { Timestamp } from 'firebase/firestore'

const router = useRouter()
const authStore = useAuthStore()

// State
const students = ref<Student[]>([])
const assessmentId = ref('')
const assessmentName = ref('')
const assessmentCategory = ref<OperationType | 'mixed' | ''>('')
const weekNumber = ref(1)
const studentSearch = ref('')
const selectedStudentUids = ref<string[]>([])
const entryStarted = ref(false)
const currentStudentIndex = ref(0)
const entryMode = ref<'quick' | 'detailed'>('quick')
const savedCount = ref(0)
const allComplete = ref(false)

interface StudentEntry {
  attempted: number
  correct: number
  incorrectProblems: number[]
  notes: string
}

const currentEntry = ref<StudentEntry>({
  attempted: 0,
  correct: 0,
  incorrectProblems: [],
  notes: ''
})

const currentAssessmentProblems = ref<MathFactProblem[]>([])
const totalProblems = ref(60)

// Computed
const filteredStudents = computed(() => {
  if (!studentSearch.value) return students.value
  
  const search = studentSearch.value.toLowerCase()
  return students.value.filter(s => 
    s.firstName?.toLowerCase().includes(search) ||
    s.lastName?.toLowerCase().includes(search)
  )
})

const canStartEntry = computed(() => {
  return assessmentName.value && 
         assessmentCategory.value && 
         selectedStudentUids.value.length > 0
})

const currentStudent = computed(() => {
  if (currentStudentIndex.value >= selectedStudentUids.value.length) return null
  const uid = selectedStudentUids.value[currentStudentIndex.value]
  return students.value.find(s => s.uid === uid) || null
})

const currentStudentName = computed(() => {
  if (!currentStudent.value) return ''
  return `${currentStudent.value.lastName}, ${currentStudent.value.firstName}`
})

const canSaveCurrent = computed(() => {
  return currentEntry.value.attempted > 0 && currentEntry.value.correct >= 0
})

const currentFluencyLevel = computed((): FluencyLevel => {
  return calculateFluencyLevel(currentEntry.value.correct)
})

const currentFluencyLevelDisplay = computed(() => {
  const level = currentFluencyLevel.value
  const labels = {
    'mastered': '🏆 Mastered',
    'proficient': '🔵 Proficient',
    'developing': '🟡 Developing',
    'emerging': '🟢 Emerging',
    'needs-support': '🔴 Needs Support'
  }
  return labels[level]
})

// Methods
onMounted(async () => {
  await loadStudents()
})

async function loadStudents() {
  try {
    if (authStore.isAdmin) {
      students.value = await getAllStudents()
    } else if (authStore.isTeacher) {
      students.value = await getStudentsByTeacher(authStore.currentUser!.uid)
    }
    
    students.value.sort((a, b) => {
      const aLast = a.lastName || ''
      const bLast = b.lastName || ''
      return aLast.localeCompare(bLast)
    })
  } catch (error) {
    console.error('Error loading students:', error)
  }
}

function selectAll() {
  selectedStudentUids.value = filteredStudents.value.map(s => s.uid)
}

function clearAll() {
  selectedStudentUids.value = []
}

async function startEntry() {
  if (!canStartEntry.value) return
  
  // Load assessment problems for this operation
  if (assessmentCategory.value && assessmentCategory.value !== 'mixed') {
    currentAssessmentProblems.value = getAllProblemsForOperation(assessmentCategory.value as OperationType)
  }
  
  entryStarted.value = true
  currentStudentIndex.value = 0
  resetCurrentEntry()
}

function resetCurrentEntry() {
  currentEntry.value = {
    attempted: 0,
    correct: 0,
    incorrectProblems: [],
    notes: ''
  }
}

function toggleProblemIncorrect(problemNumber: number) {
  const index = currentEntry.value.incorrectProblems.indexOf(problemNumber)
  if (index > -1) {
    currentEntry.value.incorrectProblems.splice(index, 1)
  } else {
    currentEntry.value.incorrectProblems.push(problemNumber)
  }
  
  // Sort for display
  currentEntry.value.incorrectProblems.sort((a, b) => a - b)
}

async function saveCurrent() {
  if (!canSaveCurrent.value || !currentStudent.value) return
  
  try {
    const student = currentStudent.value
    const finalAssessmentId = assessmentId.value || 
      `FLU_${assessmentCategory.value.toUpperCase()}_W${weekNumber.value}_${new Date().toISOString().split('T')[0]}`
    
    // Get student's progress to update problem histories
    let progress = null
    if (assessmentCategory.value !== 'mixed') {
      progress = await getFluencyProgress(student.uid, assessmentCategory.value as OperationType)
    }
    
    // Build problem results if detailed entry
    let problemResults = null
    
    if (entryMode.value === 'detailed' && currentEntry.value.incorrectProblems.length > 0 && progress) {
      problemResults = []
      
      // Process each problem attempted
      for (let i = 1; i <= currentEntry.value.attempted; i++) {
        const isIncorrect = currentEntry.value.incorrectProblems.includes(i)
        const isCorrect = !isIncorrect
        const problemData = currentAssessmentProblems.value[i - 1]
        
        if (!problemData || !progress) continue
        
        // Find this problem in progress document
        const problemInProgress = Object.values(progress.problemBanks)
          .flat()
          .find(p => p.problemId === problemData.id)
        
        if (problemInProgress) {
          // Add this attempt to the problem's history
          await updateProblemInProgress(
            student.uid,
            assessmentCategory.value as OperationType,
            problemData.id,
            {
              correct: isCorrect,
              responseTime: null,  // Paper assessment - no timing
              source: 'paper-assessment',
              assessmentId: finalAssessmentId
            }
          )
          
          // Reload progress to get updated last5Attempts
          progress = await getFluencyProgress(student.uid, assessmentCategory.value as OperationType)
          const updatedProblem = progress ? Object.values(progress.problemBanks)
            .flat()
            .find(p => p.problemId === problemData.id) : null
          
          if (updatedProblem) {
            problemResults.push({
              problemId: problemData.id,
              problemNumber: i,
              num1: problemData.num1,
              num2: problemData.num2,
              operation: problemData.operation,
              correctAnswer: problemData.correctAnswer,
              displayText: problemData.displayText,
              wasAttempted: true,
              isCorrect,
              responseTime: null,
              last5Attempts: updatedProblem.last5Attempts,
              currentProficiencyLevel: updatedProblem.proficiencyLevel,
              proficiencyCalculation: updatedProblem.proficiencyCalculation,
              category: problemData.category,
              factFamily: problemData.factFamily
            })
          }
        }
      }
    }
    
    // Get last week's assessment for growth calculation
    let growthFromLastWeek = null
    if (assessmentCategory.value !== 'mixed') {
      const lastWeek = await getLatestAssessment(student.uid, assessmentCategory.value as OperationType)
      if (lastWeek && lastWeek.week < weekNumber.value) {
        growthFromLastWeek = {
          cpmChange: currentEntry.value.correct - (lastWeek.correctPerMinute || 0),
          accuracyChange: (currentEntry.value.correct / currentEntry.value.attempted * 100) - (lastWeek.accuracy || 0),
          proficiencyLevelChange: `${lastWeek.fluencyLevel} → ${currentFluencyLevel.value}`
        }
      }
    }
    
    // Identify weak fact families from errors
    const weakFactFamilies: string[] = []
    if (problemResults && problemResults.length > 0) {
      const families = new Map<string, number>()
      problemResults.filter(p => !p.isCorrect).forEach(p => {
        families.set(p.factFamily, (families.get(p.factFamily) || 0) + 1)
      })
      
      // Families with 2+ errors
      families.forEach((count, family) => {
        if (count >= 2) {
          weakFactFamilies.push(family)
        }
      })
    }
    
    // Create assessment record
    await createFluencyAssessment({
      id: finalAssessmentId,
      assessmentName: assessmentName.value,
      studentUid: student.uid,
      studentName: `${student.firstName} ${student.lastName}`,
      teacherUid: authStore.currentUser!.uid,
      
      assessmentType: 'weekly-fluency-check',
      assessmentCategory: assessmentCategory.value as any,
      week: weekNumber.value,
      assessmentDate: Timestamp.now(),
      
      deliveryMethod: 'paper',
      timeLimit: 60,
      
      totalProblemsAttempted: currentEntry.value.attempted,
      totalProblemsCorrect: currentEntry.value.correct,
      totalProblemsIncorrect: currentEntry.value.attempted - currentEntry.value.correct,
      totalProblemsOnAssessment: totalProblems.value,
      accuracy: (currentEntry.value.correct / currentEntry.value.attempted) * 100,
      
      correctPerMinute: currentEntry.value.correct,
      incorrectPerMinute: currentEntry.value.attempted - currentEntry.value.correct,
      fluencyLevel: currentFluencyLevel.value,
      
      problemResults,
      growthFromLastWeek,
      
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
      
      weakFactFamilies,
      errorPatterns: [],
      
      scoredBy: authStore.currentUser!.uid,
      scoredAt: Timestamp.now(),
      entryMethod: entryMode.value,
      notes: currentEntry.value.notes
    } as any)
    
    savedCount.value++
    
    // Move to next student or finish
    if (currentStudentIndex.value < selectedStudentUids.value.length - 1) {
      currentStudentIndex.value++
      resetCurrentEntry()
    } else {
      allComplete.value = true
    }
  } catch (error) {
    console.error('Error saving assessment:', error)
    alert('Error saving assessment. Please try again.')
  }
}

function skipCurrent() {
  if (currentStudentIndex.value < selectedStudentUids.value.length - 1) {
    currentStudentIndex.value++
    resetCurrentEntry()
  } else {
    allComplete.value = true
  }
}

function viewDashboard() {
  router.push('/fluency/dashboard')
}

function startAnother() {
  // Reset everything
  entryStarted.value = false
  allComplete.value = false
  currentStudentIndex.value = 0
  savedCount.value = 0
  selectedStudentUids.value = []
  assessmentId.value = ''
  assessmentName.value = ''
  assessmentCategory.value = ''
  weekNumber.value++  // Increment for next week
  resetCurrentEntry()
}
</script>

<style scoped>
.score-entry-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.entry-header {
  text-align: center;
  margin-bottom: 2rem;
}

.entry-header h2 {
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

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-select,
.form-input,
.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
}

.form-select:focus,
.form-input:focus,
.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.help-text {
  font-size: 0.875rem;
  color: #666;
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

.student-selection-list {
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.student-checkbox {
  display: block;
  padding: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.student-checkbox:hover {
  background: #f8f9fa;
}

.student-checkbox input {
  margin-right: 0.5rem;
  cursor: pointer;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: #5a6268;
}

.start-entry-btn {
  width: 100%;
  padding: 1rem 2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
}

.start-entry-btn:hover:not(:disabled) {
  background: #0056b3;
}

.start-entry-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Entry Section */
.entry-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.entry-progress {
  margin-bottom: 2rem;
}

.entry-progress h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s;
}

.student-entry-card {
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 2rem;
  background: #f8f9fa;
}

.student-entry-card h3 {
  margin: 0 0 1.5rem 0;
  color: #007bff;
  font-size: 1.5rem;
}

.entry-mode-selector {
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
}

.radio-option {
  display: block;
  padding: 0.75rem;
  margin: 0.5rem 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.radio-option:hover {
  background: #f8f9fa;
}

.radio-option input {
  margin-right: 0.5rem;
  cursor: pointer;
}

.overall-results {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.overall-results h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.result-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #333;
}

.number-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.2rem;
  text-align: center;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-weight: bold;
}

.number-input:focus {
  outline: none;
  border-color: #007bff;
}

.number-input:disabled {
  background: #f8f9fa;
  color: #666;
}

.calculated-metrics {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #e7f3ff;
  border-radius: 6px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.metric-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #007bff;
}

.metric-value.level-mastered {
  color: #28a745;
}

.metric-value.level-proficient {
  color: #007bff;
}

.metric-value.level-developing {
  color: #ffc107;
}

.metric-value.level-emerging {
  color: #17a2b8;
}

.metric-value.level-needs-support {
  color: #dc3545;
}

/* Detailed Entry */
.detailed-entry {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.detailed-entry h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.detail-instructions {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
}

.problem-btn {
  padding: 0.75rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.problem-btn:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.problem-btn.incorrect {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.error-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.error-summary p {
  margin: 0.5rem 0;
}

.error-summary .warning {
  color: #856404;
  background: #fff3cd;
  padding: 0.5rem;
  border-radius: 4px;
}

.error-details {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.error-details h4 {
  margin: 0 0 1rem 0;
}

.problem-history-card {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  border-left: 4px solid #dc3545;
}

.problem-header {
  margin-bottom: 0.5rem;
  color: #333;
}

.history-list {
  font-size: 0.875rem;
  color: #666;
}

.history-note {
  font-style: italic;
}

.more-errors {
  text-align: center;
  color: #666;
  font-style: italic;
  margin-top: 1rem;
}

.notes-textarea {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  resize: vertical;
}

.notes-textarea:focus {
  outline: none;
  border-color: #007bff;
}

/* Entry Actions */
.entry-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.save-btn {
  flex: 1;
  padding: 1rem 2rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #218838;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.skip-btn {
  padding: 1rem 1.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.skip-btn:hover {
  background: #5a6268;
}

/* Complete Section */
.complete-section {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.complete-section h2 {
  color: #28a745;
  margin-bottom: 1.5rem;
}

.summary-stats {
  margin: 2rem 0;
  font-size: 1.1rem;
}

.summary-stats p {
  margin: 0.75rem 0;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.dashboard-btn,
.another-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard-btn {
  background: #007bff;
  color: white;
}

.dashboard-btn:hover {
  background: #0056b3;
}

.another-btn {
  background: #6c757d;
  color: white;
}

.another-btn:hover {
  background: #5a6268;
}
</style>

