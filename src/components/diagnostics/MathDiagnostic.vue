<template>
  <div class="math-diagnostic">
    <div class="header-section">
      <h1>🧮 Math Diagnostic Assessment</h1>
      <p class="subtitle">Adaptive diagnostic that adjusts based on student IEP goals</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading students and goals...</p>
    </div>

    <div v-else class="content">
      <!-- Student Selection -->
      <div class="selection-section">
        <h2>📝 Generate Diagnostic</h2>
        
        <div class="form-group">
          <label for="studentSelect">Select Student:</label>
          <select 
            id="studentSelect" 
            v-model="selectedStudentUid" 
            @change="onStudentChange"
            class="form-select"
          >
            <option value="">-- Select a Student --</option>
            <option v-for="student in students" :key="student.uid" :value="student.uid">
              {{ student.firstName }} {{ student.lastName }}
            </option>
          </select>
        </div>

        <div v-if="selectedStudentUid && studentGoals.length > 0" class="goals-preview">
          <h3>Student's Math Goals ({{ studentGoals.length }}):</h3>
          <ul class="goal-list">
            <li v-for="goal in studentGoals" :key="goal.id">
              <strong>{{ goal.goalTitle }}</strong>
              <span class="goal-area">{{ goal.areaOfNeed }}</span>
            </li>
          </ul>
        </div>

        <div v-if="selectedStudentUid && studentGoals.length === 0" class="no-goals-notice">
          <p>⚠️ This student has no math goals assigned. The diagnostic will use base questions only.</p>
        </div>

        <div v-if="diagnosticPreview" class="diagnostic-preview">
          <h3>📊 Diagnostic Preview:</h3>
          <div class="preview-stats">
            <div class="stat">
              <span class="stat-label">Total Questions:</span>
              <span class="stat-value">{{ diagnosticPreview.questions.length }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Base Questions:</span>
              <span class="stat-value">8</span>
            </div>
            <div class="stat">
              <span class="stat-label">Goal-Specific Questions:</span>
              <span class="stat-value">{{ diagnosticPreview.questions.length - 8 }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Total Points:</span>
              <span class="stat-value">{{ totalPoints }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Estimated Time:</span>
              <span class="stat-value">{{ estimatedTime }} min</span>
            </div>
          </div>
        </div>

        <div class="action-buttons" v-if="selectedStudentUid">
          <button 
            @click="generatePreview" 
            class="btn btn-secondary"
            :disabled="generating"
          >
            {{ generating ? '⚙️ Generating...' : '👁️ Preview Diagnostic' }}
          </button>
          
          <button 
            @click="createDiagnostic" 
            class="btn btn-primary"
            :disabled="!diagnosticPreview || saving"
          >
            {{ saving ? '💾 Creating...' : '✅ Create & Assign Diagnostic' }}
          </button>
        </div>
      </div>

      <!-- Instructions -->
      <div class="info-section">
        <h2>ℹ️ How It Works</h2>
        <div class="info-content">
          <h3>Adaptive Math Diagnostic Features:</h3>
          <ul>
            <li><strong>Dynamic Question Selection:</strong> Questions adapt based on student's learning objectives</li>
            <li><strong>Base Assessment:</strong> 10 foundational questions for all students (multiplication, division, addition, subtraction, fractions, decimals, order of operations, integers, word problems, basic algebra)</li>
            <li><strong>Targeted Questions:</strong> 2-3 additional questions per focus area</li>
            <li><strong>Flexible Format:</strong> Can be printed on up to 4 pages; students take pictures of their work</li>
            <li><strong>No Time Limit:</strong> Students work at their own pace (typically 20-30 minutes)</li>
            <li><strong>Comprehensive Coverage:</strong> Tests word problems, fractions, decimals, expressions, and more</li>
          </ul>

          <h3>Focus Areas Covered:</h3>
          <div class="category-grid">
            <div class="category-tag">Evaluating Expressions</div>
            <div class="category-tag">One-Step Equations</div>
            <div class="category-tag">Two-Step Equations</div>
            <div class="category-tag">Multi-Step Equations</div>
            <div class="category-tag">Writing Expressions</div>
            <div class="category-tag">Word Problems</div>
            <div class="category-tag">Fractions</div>
            <div class="category-tag">Decimals</div>
            <div class="category-tag">Multiplication/Division</div>
            <div class="category-tag">Addition/Subtraction</div>
            <div class="category-tag">Number Systems</div>
            <div class="category-tag">Unit Rate (if applicable)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
      <button @click="successMessage = ''" class="close-btn">✕</button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
      <button @click="errorMessage = ''" class="close-btn">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { getGoalsByStudent } from '@/firebase/goalServices'
import { createAssessment } from '@/firebase/iepServices'
import { assignAssessmentToStudent } from '@/firebase/assignmentServices'
import { generateMathDiagnostic } from '@/utils/diagnosticGenerator'
import type { Student } from '@/types/users'
import type { Goal, AssessmentQuestion } from '@/types/iep'

const router = useRouter()
const authStore = useAuthStore()

// Data
const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const studentGoals = ref<Goal[]>([])
const diagnosticPreview = ref<{ questions: AssessmentQuestion[], goalMapping: Map<string, string[]> } | null>(null)
const loading = ref(true)
const generating = ref(false)
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Computed
const totalPoints = computed(() => {
  if (!diagnosticPreview.value) return 0
  return diagnosticPreview.value.questions.reduce((sum, q) => sum + q.points, 0)
})

const estimatedTime = computed(() => {
  if (!diagnosticPreview.value) return '20-30'
  // Target 20-30 minutes for the diagnostic
  const questionCount = diagnosticPreview.value.questions.length
  if (questionCount <= 15) return '15-20'
  if (questionCount <= 20) return '20-25'
  return '25-30'
})

// Methods
const loadData = async () => {
  try {
    loading.value = true
    
    if (authStore.isAdmin) {
      students.value = await getAllStudents()
    } else if (authStore.isTeacher && authStore.currentUser?.uid) {
      students.value = await getStudentsByTeacher(authStore.currentUser.uid)
    }
    
    // Sort students by name
    students.value.sort((a, b) => 
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    )
  } catch (error) {
    console.error('Error loading data:', error)
    errorMessage.value = 'Failed to load students. Please try again.'
  } finally {
    loading.value = false
  }
}

const onStudentChange = async () => {
  if (!selectedStudentUid.value) {
    studentGoals.value = []
    diagnosticPreview.value = null
    return
  }
  
  try {
    // Load student's goals
    const allGoals = await getGoalsByStudent(selectedStudentUid.value)
    
    // Filter for math goals only
    studentGoals.value = allGoals.filter(goal => {
      const areaLower = goal.areaOfNeed.toLowerCase()
      return areaLower.includes('math') || 
             areaLower.includes('calculation') || 
             areaLower.includes('equation') ||
             areaLower.includes('multiplication') ||
             areaLower.includes('division') ||
             areaLower.includes('fraction') ||
             areaLower.includes('decimal') ||
             areaLower.includes('number')
    }).filter(goal => goal.isActive && !goal.isMet && !goal.isArchived)
    
    // Auto-generate preview
    if (studentGoals.value.length > 0) {
      await generatePreview()
    }
  } catch (error) {
    console.error('Error loading student goals:', error)
    errorMessage.value = 'Failed to load student goals. Please try again.'
  }
}

const generatePreview = async () => {
  if (!selectedStudentUid.value) return
  
  try {
    generating.value = true
    diagnosticPreview.value = generateMathDiagnostic(studentGoals.value)
  } catch (error) {
    console.error('Error generating preview:', error)
    errorMessage.value = 'Failed to generate diagnostic preview. Please try again.'
  } finally {
    generating.value = false
  }
}

const createDiagnostic = async () => {
  if (!selectedStudentUid.value || !diagnosticPreview.value) return
  
  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  if (!student) return
  
  try {
    saving.value = true
    
    const assessmentData = {
      title: `Math Diagnostic - ${student.firstName} ${student.lastName}`,
      description: `This comprehensive math assessment measures foundational skills and targeted learning objectives. Includes ${diagnosticPreview.value.questions.length} questions covering ${studentGoals.value.length} focus areas. Take your time and show all your work.`,
      gradeLevel: (typeof student.grade === 'number' ? student.grade : parseInt(student.grade || '7')) || 7,
      category: 'SA' as const, // Standard Assessment
      goalId: '', // Not tied to a single goal - covers multiple goals
      createdBy: authStore.currentUser!.uid,
      questions: diagnosticPreview.value.questions,
      totalPoints: totalPoints.value,
      instructions: 'Answer each question to the best of your ability. Show ALL your work. Take a picture of your work for EACH page. This assessment can be printed on multiple pages (up to 4 pages). Work at your own pace - there is no time limit.',
      timeLimit: 0, // No time limit
      accommodations: ['Extended time', 'Multiple pages allowed', 'Photo evidence required']
    }
    
    // Create the assessment
    const assessmentId = await createAssessment(assessmentData)
    
    // Assign to student
    await assignAssessmentToStudent(assessmentId, selectedStudentUid.value, authStore.currentUser!.uid)
    
    successMessage.value = `✅ Diagnostic created and assigned to ${student.firstName} ${student.lastName}!`
    
    // Reset form
    setTimeout(() => {
      selectedStudentUid.value = ''
      studentGoals.value = []
      diagnosticPreview.value = null
      successMessage.value = ''
    }, 3000)
    
  } catch (error) {
    console.error('Error creating diagnostic:', error)
    errorMessage.value = 'Failed to create diagnostic. Please try again.'
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.math-diagnostic {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.selection-section,
.info-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.selection-section h2,
.info-section h2 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.goals-preview {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.goals-preview h3 {
  margin-top: 0;
  color: #495057;
  font-size: 1rem;
}

.goal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.goal-list li {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.goal-list strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.goal-area {
  font-size: 0.875rem;
  color: #6c757d;
}

.no-goals-notice {
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  color: #856404;
  margin: 1rem 0;
}

.diagnostic-preview {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: #e7f3ff;
  border: 2px solid #007bff;
  border-radius: 8px;
}

.diagnostic-preview h3 {
  margin-top: 0;
  color: #004085;
}

.preview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.info-content h3 {
  color: #495057;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.info-content ul {
  list-style-position: inside;
  padding-left: 0;
  line-height: 1.8;
}

.info-content li {
  margin-bottom: 0.5rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}

.category-tag {
  padding: 0.5rem;
  background: #e7f3ff;
  border: 1px solid #007bff;
  border-radius: 4px;
  text-align: center;
  font-size: 0.875rem;
  color: #004085;
  font-weight: 500;
}

.success-message,
.error-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
  z-index: 1000;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(0,0,0,0.1);
}

@media (max-width: 968px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-stats {
    grid-template-columns: 1fr;
  }
}
</style>

