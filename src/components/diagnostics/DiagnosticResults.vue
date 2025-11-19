<template>
  <div class="diagnostic-results-container">
    <div class="page-header">
      <h1>📊 Diagnostic Results</h1>
      <p>View and analyze student diagnostic test results</p>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Student:</label>
        <select v-model="selectedStudentUid" @change="loadResults">
          <option value="">All Students</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Diagnostic Type:</label>
        <select v-model="selectedDiagnosticType" @change="loadResults">
          <option value="">All Types</option>
          <option value="foundational">Foundational (7th Grade)</option>
          <option value="adaptive">Adaptive Math</option>
          <option value="print">Print Math</option>
          <option value="math-facts">Math Facts Fluency</option>
          <option value="math-fluency-assessments">Math Fluency Assessments (Weekly)</option>
          <option value="math-fluency-practice">Math Fluency Practice (Daily)</option>
        </select>
      </div>

      <button @click="loadResults" class="btn btn-secondary">
        🔄 Refresh
      </button>
    </div>

    <!-- Results List -->
    <div v-if="!loading && results.length > 0" class="results-section">
      <h2>Results ({{ results.length }})</h2>

      <div class="results-list">
        <div 
          v-for="result in results" 
          :key="result.id"
          class="result-card"
          @click="handleResultClick(result)"
        >
          <div class="result-header">
            <div class="student-info">
              <h3>{{ result.studentName || 'Unknown Student' }}</h3>
              <span class="diagnostic-type">{{ result.diagnosticType || 'Diagnostic' }}</span>
              <span v-if="result.inProgress" class="status-badge in-progress">⏳ In Progress</span>
              <span v-else class="status-badge complete">✅ Complete</span>
            </div>
            <div class="result-score" :class="getScoreClass(result.overallScore || 0)">
              {{ result.overallScore || 0 }}%
            </div>
          </div>

          <div class="result-meta">
            <span>📅 {{ formatDate(result.completedAt || result.createdAt) }}</span>
            <span>📝 {{ result.totalQuestions || 0 }} questions</span>
            <span>✅ {{ result.correctAnswers || 0 }}/{{ result.totalQuestions || 0 }} correct</span>
          </div>

          <div class="result-preview">
            <div v-if="result.sectionAScore !== undefined" class="section-scores">
              <div class="section-score">
                <span class="label">Section A (Foundational):</span>
                <span class="score">{{ result.sectionAScore }}%</span>
              </div>
              <div class="section-score">
                <span class="label">Section B (Pre-Algebra):</span>
                <span class="score">{{ result.sectionBScore }}%</span>
              </div>
            </div>
            
            <!-- Fluency Assessment Details -->
            <div v-if="result.source === 'mathFluencyAssessments'" class="fluency-details">
              <div class="fluency-metric">
                <span class="label">CPM (Correct/Min):</span>
                <span class="value">{{ result.correctPerMinute || 0 }}</span>
              </div>
              <div class="fluency-metric">
                <span class="label">Fluency Level:</span>
                <span class="value">{{ result.fluencyLevel || 'N/A' }}</span>
              </div>
              <div v-if="result.growthFromLastWeek" class="fluency-metric">
                <span class="label">Growth:</span>
                <span class="value">{{ result.growthFromLastWeek.cpmChange > 0 ? '+' : '' }}{{ result.growthFromLastWeek.cpmChange }} CPM</span>
              </div>
            </div>
            
            <!-- Practice Session Details -->
            <div v-if="result.source === 'mathFluencyPracticeSessions'" class="practice-details">
              <div class="practice-metric">
                <span class="label">Facts Learned:</span>
                <span class="value">{{ result.round1_learning?.newlyLearned?.length || 0 }}</span>
              </div>
              <div class="practice-metric">
                <span class="label">Session Quality:</span>
                <span class="value">{{ result.sessionQuality || 'N/A' }}</span>
              </div>
              <div class="practice-metric">
                <span class="label">Time:</span>
                <span class="value">{{ Math.round((result.totalTimeSpent || 0) / 60) }} min</span>
              </div>
            </div>
            
            <!-- Current Progress Details -->
            <div v-if="result.source === 'mathFluencyProgress'" class="progress-details">
              <div class="progress-metric">
                <span class="label">Mastered:</span>
                <span class="value">{{ result.proficiencyDistribution?.mastered || 0 }}</span>
              </div>
              <div class="progress-metric">
                <span class="label">Proficient:</span>
                <span class="value">{{ result.proficiencyDistribution?.proficient || 0 }}</span>
              </div>
              <div class="progress-metric">
                <span class="label">Last CPM:</span>
                <span class="value">{{ result.lastAssessmentScore || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-if="!loading && results.length === 0" class="no-results">
      <div class="no-results-icon">📊</div>
      <h3>No Results Found</h3>
      <p>No diagnostic results match your filters. Students need to complete assigned diagnostics first.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading results...</p>
    </div>

    <!-- Detailed Result Modal -->
    <div v-if="selectedResult" class="modal-overlay" @click="selectedResult = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Detailed Results: {{ selectedResult.studentName }}</h2>
          <button @click="selectedResult = null" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <!-- Overall Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ selectedResult.overallScore }}%</div>
              <div class="stat-label">Overall Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ selectedResult.correctAnswers }}/{{ selectedResult.totalQuestions }}</div>
              <div class="stat-label">Correct Answers</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatDate(selectedResult.completedAt) }}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>

          <!-- Section Breakdown (if available) -->
          <div v-if="selectedResult.sectionAScore !== undefined" class="section-breakdown">
            <h3>Section Performance</h3>
            <div class="sections-grid">
              <div class="section-card">
                <h4>Section A: Foundational Gaps</h4>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :class="getScoreClass(selectedResult.sectionAScore)"
                    :style="{ width: selectedResult.sectionAScore + '%' }"
                  ></div>
                </div>
                <p class="score">{{ selectedResult.sectionACorrect }}/{{ selectedResult.sectionATotal }} correct ({{ selectedResult.sectionAScore }}%)</p>
              </div>
              <div class="section-card">
                <h4>Section B: Pre-Algebra Readiness</h4>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :class="getScoreClass(selectedResult.sectionBScore)"
                    :style="{ width: selectedResult.sectionBScore + '%' }"
                  ></div>
                </div>
                <p class="score">{{ selectedResult.sectionBCorrect }}/{{ selectedResult.sectionBTotal }} correct ({{ selectedResult.sectionBScore }}%)</p>
              </div>
            </div>
          </div>

          <!-- Skill Area Breakdown -->
          <div v-if="selectedResult.skillAreaResults && selectedResult.skillAreaResults.length > 0" class="skill-breakdown">
            <h3>Skill Area Performance</h3>
            <div class="skills-list">
              <div v-for="skill in selectedResult.skillAreaResults" :key="skill.skillArea" class="skill-item">
                <div class="skill-header">
                  <span class="skill-name">{{ skill.skillArea }}</span>
                  <span class="skill-score" :class="getScoreClass(skill.percentage)">
                    {{ skill.correct }}/{{ skill.total }} ({{ skill.percentage }}%)
                  </span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :class="getScoreClass(skill.percentage)"
                    :style="{ width: skill.percentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Goal-Based Questions -->
          <div v-if="selectedResult.goalBasedResults && selectedResult.goalBasedResults.length > 0" class="goal-breakdown">
            <h3>IEP Goal-Based Questions</h3>
            <div class="goals-list">
              <div v-for="goal in selectedResult.goalBasedResults" :key="goal.category" class="goal-item">
                <div class="goal-header">
                  <span class="goal-name">{{ goal.category }}</span>
                  <span class="goal-score" :class="getScoreClass(goal.percentage)">
                    {{ goal.correct }}/{{ goal.total }} ({{ goal.percentage }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Individual Answers Grouped by Category -->
          <div v-if="selectedResult.questions && selectedResult.questions.length > 0" class="answers-section">
            <h3>Question-by-Question Results</h3>
            
            <!-- Goal-Based Questions -->
            <div v-if="getGoalQuestions(selectedResult).length > 0" class="question-category-group">
              <h4 class="category-header">🎯 Goal-Based Questions (IEP Goals)</h4>
              <div class="answers-list">
                <div 
                  v-for="item in getGoalQuestions(selectedResult)" 
                  :key="item.index"
                  class="answer-item"
                  :class="{ correct: item.answer?.isCorrect, incorrect: !item.answer?.isCorrect }"
                >
                  <div class="answer-header">
                    <span class="question-num">Q{{ item.index + 1 }}</span>
                    <span class="category-badge">{{ item.question.category }}</span>
                    <span class="answer-status">{{ item.answer?.isCorrect ? '✅ Correct' : '❌ Incorrect' }}</span>
                  </div>
                  <div class="answer-details">
                    <p class="question-text"><strong>Question:</strong> {{ item.question.questionText }}</p>
                    <p><strong>Student Answer:</strong> {{ item.answer?.answer || 'Not answered' }}</p>
                    <p v-if="!item.answer?.isCorrect && item.question.correctAnswer" class="correct-answer">
                      <strong>Correct Answer:</strong> {{ item.question.correctAnswer }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section A Questions -->
            <div v-if="getSectionQuestions(selectedResult, 'A').length > 0" class="question-category-group">
              <h4 class="category-header">📘 Section A: Foundational Gaps (4th-6th Grade)</h4>
              <div class="answers-list">
                <div 
                  v-for="item in getSectionQuestions(selectedResult, 'A')" 
                  :key="item.index"
                  class="answer-item"
                  :class="{ correct: item.answer?.isCorrect, incorrect: !item.answer?.isCorrect }"
                >
                  <div class="answer-header">
                    <span class="question-num">Q{{ item.index + 1 }}</span>
                    <span class="category-badge">{{ item.question.skillArea || item.question.category }}</span>
                    <span class="answer-status">{{ item.answer?.isCorrect ? '✅ Correct' : '❌ Incorrect' }}</span>
                  </div>
                  <div class="answer-details">
                    <p class="question-text"><strong>Question:</strong> {{ item.question.questionText }}</p>
                    <p><strong>Student Answer:</strong> {{ item.answer?.answer || 'Not answered' }}</p>
                    <p v-if="!item.answer?.isCorrect && item.question.correctAnswer" class="correct-answer">
                      <strong>Correct Answer:</strong> {{ item.question.correctAnswer }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section B Questions -->
            <div v-if="getSectionQuestions(selectedResult, 'B').length > 0" class="question-category-group">
              <h4 class="category-header">📗 Section B: Pre-Algebra Readiness</h4>
              <div class="answers-list">
                <div 
                  v-for="item in getSectionQuestions(selectedResult, 'B')" 
                  :key="item.index"
                  class="answer-item"
                  :class="{ correct: item.answer?.isCorrect, incorrect: !item.answer?.isCorrect }"
                >
                  <div class="answer-header">
                    <span class="question-num">Q{{ item.index + 1 }}</span>
                    <span class="category-badge">{{ item.question.skillArea || item.question.category }}</span>
                    <span class="answer-status">{{ item.answer?.isCorrect ? '✅ Correct' : '❌ Incorrect' }}</span>
                  </div>
                  <div class="answer-details">
                    <p class="question-text"><strong>Question:</strong> {{ item.question.questionText }}</p>
                    <p><strong>Student Answer:</strong> {{ item.answer?.answer || 'Not answered' }}</p>
                    <p v-if="!item.answer?.isCorrect && item.question.correctAnswer" class="correct-answer">
                      <strong>Correct Answer:</strong> {{ item.question.correctAnswer }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="printResult(selectedResult)" class="btn btn-secondary">
            🖨️ Print Report
          </button>
          <button @click="selectedResult = null" class="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import type { Student } from '@/types/users'

const router = useRouter()
const authStore = useAuthStore()

// Data
const students = ref<Student[]>([])
const results = ref<any[]>([])
const selectedStudentUid = ref('')
const selectedDiagnosticType = ref('')
const selectedResult = ref<any>(null)
const loading = ref(true)

// Methods
async function loadStudents() {
  try {
    if (authStore.isAdmin) {
      students.value = await getAllStudents()
    } else if (authStore.isTeacher) {
      students.value = await getStudentsByTeacher(authStore.currentUser?.uid || '')
    }
    console.log(`Loaded ${students.value.length} students`)
  } catch (error) {
    console.error('Error loading students:', error)
  }
}

async function loadResults() {
  loading.value = true
  try {
    let allResults: any[] = []
    
    // Load from diagnosticResults (existing diagnostics)
    // Only skip if specifically filtering for math-fluency types
    const skipDiagnosticResults = selectedDiagnosticType.value === 'math-fluency-assessments' ||
                                   selectedDiagnosticType.value === 'math-fluency-practice'
    
    if (!skipDiagnosticResults) {
      let q = query(collection(db, 'diagnosticResults'))
      
      if (selectedStudentUid.value) {
        q = query(q, where('studentUid', '==', selectedStudentUid.value))
      }
      if (selectedDiagnosticType.value) {
        q = query(q, where('diagnosticType', '==', selectedDiagnosticType.value))
      }
      
      const snapshot = await getDocs(q)
      snapshot.forEach(doc => {
        allResults.push({
          id: doc.id,
          ...doc.data(),
          source: 'diagnosticResults'
        })
      })
      
      console.log('📊 Loaded', allResults.length, 'from diagnosticResults')
    }
    
    // Load Math Fluency Assessments (weekly Friday checks AND initial diagnostics)
    if (!selectedDiagnosticType.value || selectedDiagnosticType.value === 'math-fluency-assessments') {
      console.log('🔍 Querying mathFluencyAssessments collection...')
      console.log('   Student filter:', selectedStudentUid.value || 'All students')
      
      try {
        let q = query(collection(db, 'mathFluencyAssessments'), orderBy('assessmentDate', 'desc'))
        
        if (selectedStudentUid.value) {
          q = query(collection(db, 'mathFluencyAssessments'), 
            where('studentUid', '==', selectedStudentUid.value),
            orderBy('assessmentDate', 'desc'))
        }
        
        const snapshot = await getDocs(q)
        console.log('✅ mathFluencyAssessments query returned', snapshot.size, 'documents')
        
        snapshot.forEach(doc => {
          const data = doc.data()
          console.log('   📄 Document:', doc.id, {
            studentUid: data.studentUid,
            studentName: data.studentName,
            operation: data.assessmentCategory,
            type: data.assessmentType,
            date: data.assessmentDate
          })
          
          // Determine display name based on assessment type
          let displayType = `Fluency Assessment - ${data.assessmentCategory}`
          if (data.assessmentType === 'initial-diagnostic') {
            displayType = `Initial Diagnostic - ${data.assessmentCategory}`
          }
          
          allResults.push({
            id: doc.id,
            ...data,
            diagnosticType: displayType,
            overallScore: data.accuracy || 0,
            totalQuestions: data.totalProblemsAttempted || data.totalProblemsOnAssessment || 0,
            correctAnswers: data.totalProblemsCorrect || 0,
            completedAt: data.assessmentDate,
            source: 'mathFluencyAssessments'
          })
        })
        
        console.log('📊 Added', snapshot.size, 'results from mathFluencyAssessments to display')
      } catch (error) {
        console.error('❌ Error querying mathFluencyAssessments:', error)
      }
    }
    
    // Load Math Fluency Practice Sessions (daily practice)
    if (!selectedDiagnosticType.value || selectedDiagnosticType.value === 'math-fluency-practice') {
      let q = query(collection(db, 'mathFluencyPracticeSessions'), orderBy('sessionDate', 'desc'), limit(100))
      
      if (selectedStudentUid.value) {
        q = query(collection(db, 'mathFluencyPracticeSessions'),
          where('studentUid', '==', selectedStudentUid.value),
          orderBy('sessionDate', 'desc'))
      }
      
      const snapshot = await getDocs(q)
      snapshot.forEach(doc => {
        const data = doc.data()
        allResults.push({
          id: doc.id,
          ...data,
          diagnosticType: `Daily Practice - ${data.operation}`,
          overallScore: data.round2_practice?.accuracy || 0,
          totalQuestions: (data.round1_learning?.problemsTargeted?.length || 0) + 
                         (data.round2_practice?.problemsPresented?.length || 0) +
                         (data.round3_assessment?.problemsAssessed?.length || 0),
          correctAnswers: Math.round(((data.round2_practice?.accuracy || 0) / 100) * (data.round2_practice?.problemsPresented?.length || 0)),
          completedAt: data.sessionDate,
          source: 'mathFluencyPracticeSessions'
        })
      })
    }
    
    // Sort all results by date (most recent first)
    allResults.sort((a, b) => {
      const aDate = a.completedAt?.toDate?.() || a.completedAt || new Date(0)
      const bDate = b.completedAt?.toDate?.() || b.completedAt || new Date(0)
      const aTime = aDate instanceof Date ? aDate.getTime() : new Date(aDate).getTime()
      const bTime = bDate instanceof Date ? bDate.getTime() : new Date(bDate).getTime()
      return bTime - aTime
    })
    
    results.value = allResults
    
    console.log('✅ Total results loaded:', results.value.length)
    console.log('  - diagnosticResults:', allResults.filter(r => r.source === 'diagnosticResults').length)
    console.log('  - mathFluencyAssessments:', allResults.filter(r => r.source === 'mathFluencyAssessments').length)
    console.log('  - mathFluencyPracticeSessions:', allResults.filter(r => r.source === 'mathFluencyPracticeSessions').length)
    console.log('  - In progress:', results.value.filter(r => r.inProgress).length)
    
    // Fix student names - fetch from students collection for any that are missing, "Unknown", or "undefined undefined"
    const { doc: firestoreDoc, getDoc } = await import('firebase/firestore')
    for (const result of results.value) {
      // Check if student name is missing, invalid, or contains "undefined"
      const needsFixing = !result.studentName || 
                          result.studentName === 'Unknown' || 
                          result.studentName.includes('undefined') ||
                          result.studentName.trim() === ''
      
      if (needsFixing && result.studentUid) {
        try {
          // First try to find in already loaded students array
          const student = students.value.find(s => s.uid === result.studentUid)
          if (student) {
            result.studentName = `${student.firstName} ${student.lastName}`
            console.log(`✅ Fixed student name for ${result.studentUid}: ${result.studentName}`)
          } else {
            // If not in array, fetch from Firestore
            const studentDoc = await getDoc(firestoreDoc(db, 'students', result.studentUid))
            if (studentDoc.exists()) {
              const studentData = studentDoc.data()
              result.studentName = `${studentData.firstName} ${studentData.lastName}`
              console.log(`✅ Fixed student name for ${result.studentUid}: ${result.studentName}`)
            } else {
              console.warn(`⚠️ Could not find student document for ${result.studentUid}`)
              result.studentName = `Unknown Student (${result.studentUid.substring(0, 8)}...)`
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching student data for ${result.studentUid}:`, error)
          result.studentName = `Unknown Student (${result.studentUid.substring(0, 8)}...)`
        }
      }
    }
    
    // Sort by completion date (most recent first)
    results.value.sort((a, b) => {
      const timeA = a.completedAt?.seconds || 0
      const timeB = b.completedAt?.seconds || 0
      return timeB - timeA
    })
    
    console.log(`Final: ${results.value.length} diagnostic results loaded with names`)
  } catch (error) {
    console.error('Error loading results:', error)
    alert('Error loading results. Please try again.')
  } finally {
    loading.value = false
  }
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'Unknown'
  
  try {
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    return 'Unknown'
  }
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'fair'
  if (score >= 60) return 'needs-improvement'
  return 'poor'
}

// Helper functions to group questions by category
function getGoalQuestions(result: any) {
  if (!result.questions || !result.answers) return []
  
  return result.questions
    .map((question: any, index: number) => ({
      question,
      answer: result.answers[index],
      index
    }))
    .filter((item: any) => item.question.isGoalBased)
}

function getSectionQuestions(result: any, section: 'A' | 'B') {
  if (!result.questions || !result.answers) return []
  
  return result.questions
    .map((question: any, index: number) => ({
      question,
      answer: result.answers[index],
      index
    }))
    .filter((item: any) => item.question.section === section && !item.question.isGoalBased)
}

function printResult(result: any) {
  // Store the result to print
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Diagnostic Report - ${result.studentName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #2c3e50; }
        .section { margin: 20px 0; }
        .stat { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .correct { color: green; }
        .incorrect { color: red; }
      </style>
    </head>
    <body>
      <h1>Diagnostic Test Report</h1>
      <div class="section">
        <h2>Student Information</h2>
        <p><strong>Name:</strong> ${result.studentName}</p>
        <p><strong>Test Type:</strong> ${result.diagnosticType || 'Diagnostic'}</p>
        <p><strong>Date:</strong> ${formatDate(result.completedAt)}</p>
      </div>
      
      <div class="section">
        <h2>Overall Performance</h2>
        <p><strong>Score:</strong> ${result.overallScore}%</p>
        <p><strong>Correct Answers:</strong> ${result.correctAnswers} out of ${result.totalQuestions}</p>
      </div>
      
      ${result.sectionAScore !== undefined ? `
      <div class="section">
        <h2>Section Performance</h2>
        <p><strong>Section A (Foundational):</strong> ${result.sectionACorrect}/${result.sectionATotal} (${result.sectionAScore}%)</p>
        <p><strong>Section B (Pre-Algebra):</strong> ${result.sectionBCorrect}/${result.sectionBTotal} (${result.sectionBScore}%)</p>
      </div>
      ` : ''}
      
      ${result.skillAreaResults && result.skillAreaResults.length > 0 ? `
      <div class="section">
        <h2>Skill Area Breakdown</h2>
        <table>
          <tr>
            <th>Skill Area</th>
            <th>Correct</th>
            <th>Total</th>
            <th>Percentage</th>
          </tr>
          ${result.skillAreaResults.map((skill: any) => `
            <tr>
              <td>${skill.skillArea}</td>
              <td>${skill.correct}</td>
              <td>${skill.total}</td>
              <td>${skill.percentage}%</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
    </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.print()
}

function handleResultClick(result: any) {
  // If it's a fluency result, navigate to student detail
  if (result.source === 'mathFluencyProgress' || 
      result.source === 'mathFluencyAssessments' || 
      result.source === 'mathFluencyPracticeSessions') {
    router.push(`/fluency/student/${result.studentUid}`)
  } else {
    // Show modal for other diagnostics
    selectedResult.value = result
  }
}

onMounted(async () => {
  await loadStudents()
  await loadResults()
})
</script>

<style scoped>
.diagnostic-results-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.page-header p {
  margin: 0;
  color: #666;
}

/* Filters */
.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
}

/* Results Section */
.results-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.results-list {
  display: grid;
  gap: 1rem;
}

.result-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.student-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.diagnostic-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  margin-right: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.in-progress {
  background: #fff3cd;
  color: #856404;
}

.status-badge.complete {
  background: #d4edda;
  color: #155724;
}

.result-score {
  font-size: 2rem;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.result-score.excellent {
  background: #d4edda;
  color: #155724;
}

.result-score.good {
  background: #d1ecf1;
  color: #0c5460;
}

.result-score.fair {
  background: #fff3cd;
  color: #856404;
}

.result-score.needs-improvement,
.result-score.poor {
  background: #f8d7da;
  color: #721c24;
}

.result-meta {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.section-scores {
  display: grid;
  gap: 0.5rem;
}

.section-score {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.section-score .label {
  font-weight: 500;
  color: #495057;
}

.section-score .score {
  font-weight: 600;
  color: #2c3e50;
}

.fluency-details,
.practice-details,
.progress-details {
  display: grid;
  gap: 0.5rem;
  margin-top: 10px;
}

.fluency-metric,
.practice-metric,
.progress-metric {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.fluency-metric .label,
.practice-metric .label,
.progress-metric .label {
  font-weight: 500;
  color: #495057;
}

.fluency-metric .value,
.practice-metric .value,
.progress-metric .value {
  font-weight: 600;
  color: #10b981;
}

/* Modal */
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
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  line-height: 1;
}

.close-btn:hover {
  color: #000;
}

.modal-body {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* Section Breakdown */
.section-breakdown,
.skill-breakdown,
.goal-breakdown,
.answers-section {
  margin-bottom: 2rem;
}

.section-breakdown h3,
.skill-breakdown h3,
.goal-breakdown h3,
.answers-section h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.question-category-group {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.category-header {
  margin: 0 0 1rem 0;
  padding: 0.75rem;
  background: white;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  color: #2c3e50;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0 0.5rem;
}

.sections-grid {
  display: grid;
  gap: 1rem;
}

.section-card {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-card h4 {
  margin: 0 0 1rem 0;
  color: #495057;
}

.progress-bar {
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.excellent {
  background: #28a745;
}

.progress-fill.good {
  background: #17a2b8;
}

.progress-fill.fair {
  background: #ffc107;
}

.progress-fill.needs-improvement,
.progress-fill.poor {
  background: #dc3545;
}

.section-card .score {
  margin: 0;
  color: #495057;
  font-size: 0.9rem;
}

/* Skills List */
.skills-list,
.goals-list {
  display: grid;
  gap: 1rem;
}

.skill-item,
.goal-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.skill-header,
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.skill-name,
.goal-name {
  font-weight: 600;
  color: #2c3e50;
}

.skill-score,
.goal-score {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.skill-score.excellent,
.goal-score.excellent {
  background: #d4edda;
  color: #155724;
}

.skill-score.good,
.goal-score.good {
  background: #d1ecf1;
  color: #0c5460;
}

.skill-score.fair,
.goal-score.fair {
  background: #fff3cd;
  color: #856404;
}

.skill-score.needs-improvement,
.skill-score.poor,
.goal-score.needs-improvement,
.goal-score.poor {
  background: #f8d7da;
  color: #721c24;
}

/* Answers List */
.answers-list {
  display: grid;
  gap: 0.75rem;
}

.answer-item {
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.answer-item.correct {
  background: #d4edda;
  border-color: #28a745;
}

.answer-item.incorrect {
  background: #f8d7da;
  border-color: #dc3545;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.question-num {
  font-weight: 600;
  color: #495057;
}

.answer-status {
  font-weight: 600;
}

.answer-details p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.answer-details .question-text {
  color: #2c3e50;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.answer-details .correct-answer {
  color: #28a745;
  font-style: italic;
  margin-top: 0.5rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* No Results */
.no-results {
  background: white;
  border-radius: 8px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-results h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.no-results p {
  margin: 0;
  color: #666;
}

/* Loading */
.loading {
  text-align: center;
  padding: 4rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
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

.btn-secondary:hover {
  background: #545b62;
}
</style>

