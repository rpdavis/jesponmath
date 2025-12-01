<template>
  <div class="paper-assessment-container">
    <!-- Header -->
    <div class="assessment-header">
      <h2>📄 Generate Paper Fluency Assessment</h2>
      <p class="subtitle">Create 1-minute fluency probes for Friday assessments</p>
    </div>

    <!-- Generation Options -->
    <div class="generation-section">
      <div class="form-group">
        <label>Operation:</label>
        <select v-model="selectedOperation" class="form-select">
          <option value="">Select operation...</option>
          <option value="addition">Addition (0-20)</option>
          <option value="subtraction">Subtraction (0-20)</option>
          <option value="multiplication">Multiplication (0-12)</option>
          <option value="division">Division (0-12)</option>
          <option value="mixed">Mixed Operations</option>
        </select>
      </div>

      <div v-if="selectedOperation" class="form-group">
        <label>Generate For:</label>
        <div class="generation-mode">
          <label class="radio-option">
            <input type="radio" v-model="generationMode" value="single" />
            <span>Single Student</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="generationMode" value="class" />
            <span>Entire Class</span>
          </label>
        </div>
      </div>

      <!-- Single Student Selection -->
      <div v-if="generationMode === 'single'" class="form-group">
        <label>Select Student:</label>
        <select v-model="selectedStudentUid" class="form-select">
          <option value="">Choose student...</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.lastName }}, {{ student.firstName }}
          </option>
        </select>
      </div>

      <!-- Class Selection -->
      <div v-if="generationMode === 'class'" class="form-group">
        <label>Select Class:</label>
        <select v-model="selectedClass" class="form-select">
          <option value="">All my students</option>
          <option v-for="cls in uniqueClasses" :key="cls" :value="cls">
            {{ cls }}
          </option>
        </select>
      </div>

      <!-- Assessment Options -->
      <div v-if="selectedOperation && (selectedStudentUid || generationMode === 'class')" class="options-section">
        <h3>Assessment Options:</h3>
        
        <div class="form-group">
          <label>Assessment Name:</label>
          <input 
            v-model="assessmentName" 
            type="text" 
            class="form-input"
            :placeholder="`Week ${weekNumber} ${capitalizeOperation(selectedOperation)} Fluency Check`"
          />
        </div>

        <div class="form-group">
          <label>Week Number:</label>
          <input 
            v-model.number="weekNumber" 
            type="number" 
            min="1" 
            max="52"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" v-model="usePersonalization" />
            Personalize based on student progress (recommended)
          </label>
          <p class="help-text">
            If checked, problems will be selected from each student's problem banks.
            If unchecked, all students get the same random problems.
          </p>
        </div>

        <div class="form-group">
          <label>Total Problems on Sheet:</label>
          <select v-model.number="totalProblems" class="form-select">
            <option :value="40">40 problems</option>
            <option :value="50">50 problems</option>
            <option :value="60">60 problems (recommended)</option>
            <option :value="80">80 problems</option>
          </select>
          <p class="help-text">
            Students will attempt as many as possible in 1 minute (usually 15-40).
            More problems ensures ceiling isn't hit for fast students.
          </p>
        </div>

        <div class="info-box">
          <h4>Assessment Details:</h4>
          <p><strong>Time Limit:</strong> 1 minute</p>
          <p><strong>Format:</strong> Paper worksheet</p>
          <p><strong>Students:</strong> {{ selectedStudentsCount }}</p>
          <p><strong>Personalized:</strong> {{ usePersonalization ? 'Yes' : 'No' }}</p>
        </div>

        <button 
          @click="generateAssessments" 
          class="generate-btn"
          :disabled="loading"
        >
          {{ loading ? 'Generating...' : `📄 Generate PDF${generationMode === 'class' ? 's' : ''}` }}
        </button>
      </div>
    </div>

    <!-- Generated Assessments List -->
    <div v-if="generatedAssessments.length > 0" class="generated-section">
      <h3>Generated Assessments:</h3>
      <div class="assessment-list">
        <div v-for="assessment in generatedAssessments" :key="assessment.studentUid" class="assessment-item">
          <div class="assessment-info">
            <span class="student-name">{{ assessment.studentName }}</span>
            <span class="sub-level-tag">{{ assessment.subLevelName || 'Mixed' }}</span>
            <span class="problem-count">{{ assessment.problems.length }} problems</span>
          </div>
          <div class="assessment-actions">
            <button @click="downloadPDF(assessment)" class="download-btn">
              📥 Download PDF
            </button>
            <button @click="printAssessment(assessment)" class="print-btn">
              🖨️ Print
            </button>
          </div>
        </div>
      </div>
      
      <button v-if="generationMode === 'class'" @click="downloadAllPDFs" class="download-all-btn">
        📥 Download All as ZIP
      </button>
      
      <!-- Save Assessment Button -->
      <div class="save-section">
        <button @click="saveAssessments" class="save-btn" :disabled="assessmentsSaved">
          {{ assessmentsSaved ? '✅ Assessments Saved' : '💾 Save Assessments to Database' }}
        </button>
        <p v-if="assessmentsSaved" class="save-note">
          ✅ Saved! Go to Score Entry to enter results.
        </p>
        <p v-else class="save-help">
          Click to save these assessments for score entry later. Each will get a unique ID.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { 
  getFluencyProgress, 
  createPaperAssessmentTemplate,
  getAssessmentCountForStudent 
} from '@/services/mathFluencyServices'
import { generateFridayAssessment, getAllProblemsForOperation, shuffleArray } from '@/utils/mathFluencyProblemGenerator'
import { generatePersonalizedAssessment } from '@/utils/paperAssessmentStrategies'
import { getSubLevelConfig } from '@/config/fluencySubLevels'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Student } from '@/types/users'
import type { OperationType, MathFactProblem } from '@/types/mathFluency'

const authStore = useAuthStore()

// State
const students = ref<Student[]>([])
const selectedOperation = ref<OperationType | ''>('')
const generationMode = ref<'single' | 'class'>('single')
const selectedStudentUid = ref('')
const selectedClass = ref('')
const assessmentName = ref('')
const weekNumber = ref(1)
const usePersonalization = ref(true)
const totalProblems = ref(60)
const loading = ref(false)

const generatedAssessments = ref<Array<{
  studentUid: string
  studentName: string
  operation: OperationType
  problems: MathFactProblem[]
  assessmentName: string
  weekNumber: number
  templateId?: string
  savedAssessmentId?: string
  subLevelName?: string
}>>([])

const assessmentsSaved = ref(false)

// Computed
const uniqueClasses = computed(() => {
  const classes = new Set<string>()
  students.value.forEach(s => {
    if (s.className) classes.add(s.className)
    if (s.courseName) classes.add(s.courseName)
    const period = s.period || s.section
    if (period && s.courseName) {
      classes.add(`Period ${period} - ${s.courseName}`)
    }
  })
  return Array.from(classes).sort()
})

const selectedStudents = computed(() => {
  if (generationMode.value === 'single' && selectedStudentUid.value) {
    return students.value.filter(s => s.uid === selectedStudentUid.value)
  }
  
  if (generationMode.value === 'class') {
    if (selectedClass.value) {
      return students.value.filter(s => 
        s.className === selectedClass.value ||
        s.courseName === selectedClass.value ||
        `Period ${s.period} - ${s.courseName}` === selectedClass.value ||
        `Period ${s.section} - ${s.courseName}` === selectedClass.value
      )
    }
    return students.value  // All students
  }
  
  return []
})

const selectedStudentsCount = computed(() => selectedStudents.value.length)

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
    
    // Sort by last name
    students.value.sort((a, b) => {
      const aLast = a.lastName || ''
      const bLast = b.lastName || ''
      return aLast.localeCompare(bLast)
    })
  } catch (error) {
    console.error('Error loading students:', error)
  }
}

async function generateAssessments() {
  if (!selectedOperation.value) return
  
  loading.value = true
  generatedAssessments.value = []
  
  try {
    for (const student of selectedStudents.value) {
      let problems: MathFactProblem[] = []
      let distribution = null
      let metrics = null
      
      // Get sub-level name for this student
      let subLevelName = 'Unknown Level'
      
      if (usePersonalization.value) {
        // Try to get student's problem banks
        const progress = await getFluencyProgress(student.uid, selectedOperation.value as OperationType)
        
        if (progress && progress.problemBanks) {
          // Get sub-level name
          if (progress.currentSubLevel) {
            const config = getSubLevelConfig(progress.currentSubLevel)
            subLevelName = config ? config.shortName || config.name : progress.currentSubLevel
          }
          
          // ✨ NEW: Use intelligent distribution based on week and proficiency
          const assessment = generatePersonalizedAssessment(progress, weekNumber.value, totalProblems.value)
          problems = assessment.problems
          distribution = assessment.distribution
          metrics = assessment.metrics
          
          // If not enough problems, repeat to reach target
          if (problems.length < totalProblems.value) {
            console.log(`⚠️ Only ${problems.length} unique problems available, repeating to reach ${totalProblems.value}`)
            while (problems.length < totalProblems.value) {
              const remaining = totalProblems.value - problems.length
              const toAdd = assessment.problems.slice(0, remaining)
              problems = [...problems, ...toAdd]
            }
            console.log(`✅ Repeated problems to reach ${problems.length} total`)
          }
          
          console.log(`📊 Generated personalized assessment for ${student.firstName}:`, {
            distribution,
            expectedCPM: metrics.expectedCPM,
            targetCPM: metrics.targetCPM,
            purpose: metrics.assessmentPurpose,
            subLevel: subLevelName
          })
        } else {
          // Student hasn't done diagnostic yet - use all problems
          const allProblems = getAllProblemsForOperation(selectedOperation.value as OperationType)
          const shuffled = shuffleArray(allProblems)
          
          // If not enough unique problems, repeat to reach target
          if (shuffled.length < totalProblems.value) {
            problems = []
            while (problems.length < totalProblems.value) {
              const remaining = totalProblems.value - problems.length
              const toAdd = shuffled.slice(0, Math.min(remaining, shuffled.length))
              problems = [...problems, ...toAdd]
            }
          } else {
            problems = shuffled.slice(0, totalProblems.value)
          }
          
          console.log(`⚠️ No progress data for ${student.firstName}, using ${problems.length} problems`)
        }
      } else {
        // Non-personalized - same problems for everyone
        const allProblems = getAllProblemsForOperation(selectedOperation.value as OperationType)
        const shuffled = shuffleArray(allProblems)
        
        // If not enough unique problems, repeat to reach target
        if (shuffled.length < totalProblems.value) {
          problems = []
          while (problems.length < totalProblems.value) {
            const remaining = totalProblems.value - problems.length
            const toAdd = shuffled.slice(0, Math.min(remaining, shuffled.length))
            problems = [...problems, ...toAdd]
          }
        } else {
          problems = shuffled.slice(0, totalProblems.value)
        }
      }
      
      const finalAssessmentName = assessmentName.value || 
        `Week ${weekNumber.value} ${capitalizeOperation(selectedOperation.value)} Fluency Check`
      
      // ✨ CREATE PRE-FILLED SCORE ENTRY TEMPLATE
      const templateId = await createPaperAssessmentTemplate(
        student.uid,
        `${student.firstName} ${student.lastName}`,
        selectedOperation.value as OperationType,
        problems,
        weekNumber.value,
        finalAssessmentName,
        authStore.currentUser?.uid || 'unknown'
      )
      
      generatedAssessments.value.push({
        studentUid: student.uid,
        studentName: `${student.firstName} ${student.lastName}`,
        operation: selectedOperation.value as OperationType,
        problems,
        assessmentName: finalAssessmentName,
        weekNumber: weekNumber.value,
        templateId,  // Link to score entry template
        subLevelName  // NEW: For display and tracking
      } as any)
    }
    
    console.log(`✅ Generated ${generatedAssessments.value.length} personalized assessments with score templates`)
  } catch (error) {
    console.error('Error generating assessments:', error)
    alert('Error generating assessments. Please try again.')
  } finally {
    loading.value = false
  }
}

function capitalizeOperation(op: string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

async function saveAssessments() {
  if (assessmentsSaved.value) return
  
  loading.value = true
  
  try {
    for (const assessment of generatedAssessments.value) {
      // Get assessment count for this student (for numbering)
      const count = await getAssessmentCountForStudent(assessment.studentUid)
      const assessmentNumber = count + 1
      
      // Generate unique name
      const date = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      })
      const uniqueName = `${assessment.studentName}_Assessment${assessmentNumber}_${date.replace(/\//g, '/')}`
      
      // Update the existing template with final name and metadata
      if (assessment.templateId) {
        await updateDoc(doc(db, 'mathFluencyPaperAssessments', assessment.templateId), {
          assessmentName: uniqueName,
          assessmentNumber,
          generatedDate: Timestamp.now(),
          subLevelContext: assessment.subLevelName || 'Unknown',
          currentSubLevel: null,  // Would need to get from progress
          status: 'ready-for-scoring',
          updatedAt: Timestamp.now()
        })
        
        console.log(`✅ Saved: ${uniqueName}`)
      }
    }
    
    assessmentsSaved.value = true
    alert(`✅ Successfully saved ${generatedAssessments.value.length} assessments!\n\nGo to Score Entry to enter results.`)
  } catch (error) {
    console.error('Error saving assessments:', error)
    alert('Error saving assessments. Please try again.')
  } finally {
    loading.value = false
  }
}

function downloadPDF(assessment: any) {
  // Generate HTML for PDF
  const html = generateAssessmentHTML(assessment)
  
  // Create printable window
  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) return
  
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  
  // Trigger print dialog
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

function printAssessment(assessment: any) {
  downloadPDF(assessment)
}

function downloadAllPDFs() {
  // Generate combined PDF with all students
  generatedAssessments.value.forEach(assessment => {
    setTimeout(() => downloadPDF(assessment), 500)
  })
}

function generateAssessmentHTML(assessment: any): string {
  const { studentName, operation, problems, assessmentName, weekNumber } = assessment
  
  // Generate answer key
  const answers = problems.map((p: MathFactProblem, i: number) => 
    `${i + 1}=${p.correctAnswer}`
  ).join('  ')
  
  // Split answers into rows of 10 for readability
  const answerRows: string[] = []
  for (let i = 0; i < problems.length; i += 10) {
    const chunk = problems.slice(i, i + 10)
    answerRows.push(
      chunk.map((p: MathFactProblem, j: number) => 
        `${i + j + 1}=${p.correctAnswer}`
      ).join('  ')
    )
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${assessmentName} - ${studentName}</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    
    .assessment-page {
      page-break-after: always;
    }
    
    .header {
      border-bottom: 3px solid #333;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 24px;
      text-transform: uppercase;
    }
    
    .header .subtitle {
      margin: 5px 0 0 0;
      font-size: 14px;
      color: #666;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 15px 0;
      font-size: 14px;
    }
    
    .info-row strong {
      margin-right: 10px;
    }
    
    .instructions {
      background: #f8f9fa;
      border: 2px solid #333;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    
    .instructions h2 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    
    .instructions ul {
      margin: 5px 0;
      padding-left: 25px;
    }
    
    .instructions li {
      margin: 5px 0;
    }
    
    .problems-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px 10px;
      margin: 20px 0;
    }
    
    .problem-item {
      font-size: 16px;
      display: flex;
      align-items: baseline;
      gap: 5px;
    }
    
    .problem-number {
      font-weight: bold;
      min-width: 25px;
    }
    
    .problem-text {
      flex: 1;
    }
    
    .answer-blank {
      border-bottom: 2px solid #333;
      min-width: 40px;
      display: inline-block;
    }
    
    .scoring-section {
      margin-top: 30px;
      padding: 15px;
      border: 2px solid #333;
      border-radius: 5px;
      background: #f8f9fa;
    }
    
    .scoring-section h2 {
      margin: 0 0 15px 0;
      font-size: 18px;
    }
    
    .scoring-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .scoring-field {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .scoring-field label {
      font-weight: bold;
      min-width: 120px;
    }
    
    .scoring-field input {
      border: none;
      border-bottom: 2px solid #333;
      width: 60px;
      font-size: 16px;
      text-align: center;
    }
    
    .answer-key-page {
      page-break-before: always;
    }
    
    .answer-key {
      margin-top: 20px;
    }
    
    .answer-key h2 {
      font-size: 20px;
      margin-bottom: 15px;
    }
    
    .answer-rows {
      line-height: 2;
      font-family: 'Courier New', monospace;
    }
    
    .rubric-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .rubric-table th,
    .rubric-table td {
      border: 1px solid #333;
      padding: 10px;
      text-align: left;
    }
    
    .rubric-table th {
      background: #333;
      color: white;
      font-weight: bold;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Student Copy -->
  <div class="assessment-page">
    <div class="header">
      <h1>Math Fluency Check - ${capitalizeOperation(operation)}</h1>
      <div class="subtitle">${assessmentName}</div>
    </div>
    
    <div class="info-row">
      <div><strong>Name:</strong> ${studentName}</div>
      <div><strong>Date:</strong> Friday, ___________</div>
    </div>
    
    <div class="instructions">
      <h2>INSTRUCTIONS:</h2>
      <ul>
        <li>Work from left to right, top to bottom</li>
        <li>You have <strong>1 MINUTE</strong></li>
        <li>Skip problems you don't know</li>
        <li>Do as many as you can</li>
        <li>Write answers clearly in the blanks</li>
      </ul>
    </div>
    
    <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
      START HERE ↓
    </div>
    
    <div class="problems-grid">
      ${problems.map((p: MathFactProblem, i: number) => `
        <div class="problem-item">
          <span class="problem-number">${i + 1}.</span>
          <span class="problem-text">${p.displayText.replace(' = ?', ' = ')}<span class="answer-blank">____</span></span>
        </div>
      `).join('')}
    </div>
    
    <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
      ← STOP HERE (after 1 minute)
    </div>
    
    <div class="scoring-section">
      <h2>TEACHER SCORING:</h2>
      <div class="scoring-grid">
        <div class="scoring-field">
          <label>Last problem attempted:</label>
          <input type="text" /> / ${totalProblems}
        </div>
        <div class="scoring-field">
          <label>Total correct:</label>
          <input type="text" />
        </div>
        <div class="scoring-field">
          <label>Total incorrect:</label>
          <input type="text" />
        </div>
        <div class="scoring-field">
          <label>Problems/Minute:</label>
          <input type="text" />
        </div>
      </div>
      <p style="margin-top: 15px; font-size: 12px; color: #666;">
        Circle incorrect problem numbers on student sheet. Enter data in app: /fluency/score-entry
      </p>
    </div>
  </div>
  
  <!-- Answer Key (Separate Page) -->
  <div class="answer-key-page">
    <div class="header">
      <h1>Answer Key</h1>
      <div class="subtitle">${assessmentName} - ${studentName}</div>
    </div>
    
    <div class="info-row">
      <div><strong>Operation:</strong> ${capitalizeOperation(operation)}</div>
      <div><strong>Week:</strong> ${weekNumber}</div>
    </div>
    
    <div class="answer-key">
      <h2>Answers:</h2>
      <div class="answer-rows">
        ${answerRows.map(row => `<div>${row}</div>`).join('')}
      </div>
    </div>
    
    <div class="rubric-table">
      <table>
        <thead>
          <tr>
            <th>Correct/Min</th>
            <th>Proficiency Level</th>
            <th>Next Steps</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>40+</td>
            <td>🏆 Mastered</td>
            <td>Unlock next operation</td>
          </tr>
          <tr>
            <td>30-39</td>
            <td>🔵 Proficient</td>
            <td>Continue practice</td>
          </tr>
          <tr>
            <td>20-29</td>
            <td>🟡 Developing</td>
            <td>Focus practice on weak areas</td>
          </tr>
          <tr>
            <td>10-19</td>
            <td>🟢 Emerging</td>
            <td>Daily focused drill</td>
          </tr>
          <tr>
            <td>&lt;10</td>
            <td>🔴 Needs Support</td>
            <td>Intervention required</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div style="margin-top: 30px; padding: 15px; background: #fffacd; border-radius: 5px;">
      <strong>Quick Scoring Instructions:</strong>
      <ol style="margin: 10px 0;">
        <li>Mark last problem student reached with → arrow</li>
        <li>Circle any incorrect answers</li>
        <li>Count total correct</li>
        <li>Enter in app at: <strong>/fluency/score-entry</strong></li>
      </ol>
    </div>
  </div>
</body>
</html>
  `
}
</script>

<style scoped>
.paper-assessment-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.assessment-header {
  text-align: center;
  margin-bottom: 2rem;
}

.assessment-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

.generation-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
.form-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.generation-mode {
  display: flex;
  gap: 2rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-option input {
  cursor: pointer;
}

.help-text {
  font-size: 0.875rem;
  color: #666;
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

.options-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #eee;
}

.options-section h3 {
  margin-top: 0;
  color: #333;
}

.info-box {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
}

.info-box h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.info-box p {
  margin: 0.5rem 0;
}

.generate-btn {
  width: 100%;
  padding: 1rem 2rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.generate-btn:hover:not(:disabled) {
  background: #218838;
}

.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.generated-section {
  margin-top: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.generated-section h3 {
  margin-top: 0;
  color: #333;
}

.assessment-list {
  margin: 1rem 0;
}

.assessment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.student-name {
  flex: 1;
  font-weight: 500;
}

.download-btn,
.print-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn {
  background: #007bff;
  color: white;
}

.download-btn:hover {
  background: #0056b3;
}

.print-btn {
  background: #6c757d;
  color: white;
}

.print-btn:hover {
  background: #5a6268;
}

.download-all-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
}

.download-all-btn:hover {
  background: #0056b3;
}
</style>




