<template>
  <div class="progress-assessment">
    <div class="header-section">
      <h1>📊 Progress Assessment Tracking</h1>
      <p class="subtitle">Track student progress on IEP goals through assessment results</p>
    </div>

    <!-- Filters and Controls -->
    <div class="filters-section">
      <div class="filter-group">
        <label for="studentFilter">Student:</label>
        <select id="studentFilter" v-model="selectedStudentUid" @change="loadData" class="form-select">
          <option value="">All Students</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="goalFilter">Goal:</label>
        <select id="goalFilter" v-model="selectedGoalId" @change="filterResults" class="form-select">
          <option value="">All Goals</option>
          <option v-for="goal in filteredGoals" :key="goal.id" :value="goal.id">
            {{ goal.goalTitle }} - {{ goal.assignedStudents?.length > 0 ? goal.assignedStudents.map(uid => getStudentName(uid)).join(', ') : (goal.studentUid ? getStudentName(goal.studentUid) : 'No students') }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="statusFilter">Goal Status:</label>
        <select id="statusFilter" v-model="selectedStatus" @change="filterResults" class="form-select">
          <option value="">All Statuses</option>
          <option value="active">Active Goals</option>
          <option value="met">Goals Met</option>
          <option value="needs-attention">Needs Attention</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="subjectFilter">Subject Area:</label>
        <select id="subjectFilter" v-model="selectedSubject" @change="filterResults" class="form-select">
          <option value="">All Subjects</option>
          <option value="math">Math</option>
          <option value="ela">ELA</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="dateRange">Date Range:</label>
        <select id="dateRange" v-model="selectedDateRange" @change="filterResults" class="form-select">
          <option value="all">All Time</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
        </select>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-section">
      <div class="summary-card">
        <div class="summary-icon">🎯</div>
        <div class="summary-content">
          <h3>{{ totalGoals }}</h3>
          <p>Total Goals</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon">✅</div>
        <div class="summary-content">
          <h3>{{ goalsWithProgress }}</h3>
          <p>Goals with Progress</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon">📈</div>
        <div class="summary-content">
          <h3>{{ totalAssessments }}</h3>
          <p>Progress Assessments</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-icon">⚠️</div>
        <div class="summary-content">
          <h3>{{ goalsNeedingAttention }}</h3>
          <p>Need Attention</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading progress data...</p>
      </div>
      
      <div v-else-if="displayedGoals.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No Progress Data Found</h3>
        <p>{{ selectedStudentUid ? 'This student has no goals with progress assessments.' : 'No goals match your current filters.' }}</p>
        <router-link to="/goals" class="btn btn-primary">
          Manage Goals
        </router-link>
      </div>
      
      <div v-else class="progress-grid">
        <!-- Goal Progress Cards -->
        <div v-for="goal in displayedGoals" :key="goal.id" class="goal-progress-card">
          <div class="goal-header">
          <div class="goal-info">
            <h3>{{ goal.goalTitle }}</h3>
            <p class="student-name" v-if="goal.assignedStudents?.length === 1">
              {{ getStudentName(goal.assignedStudents[0]) }}
            </p>
            <p class="student-name" v-else-if="goal.assignedStudents?.length > 1">
              {{ goal.assignedStudents.length }} students assigned
            </p>
            <p class="student-name" v-else-if="goal.studentUid">
              {{ getStudentName(goal.studentUid) }}
            </p>
            <p class="student-name" v-else>
              No students assigned
            </p>
            <p class="area-of-need">{{ goal.areaOfNeed }}</p>
          </div>
            <div class="goal-status">
              <span v-if="goal.isMet" class="status-badge met">✅ Met</span>
              <span v-else-if="goal.isArchived" class="status-badge archived">📦 Archived</span>
              <span v-else-if="goal.isActive" class="status-badge active">🟢 Active</span>
              <span v-else class="status-badge inactive">⏸️ Inactive</span>
            </div>
          </div>
          
          <div class="goal-details">
            <div class="detail-item" v-if="goal.assignedStudents?.length">
              <strong>Students:</strong> {{ goal.assignedStudents.map(uid => getStudentName(uid)).join(', ') }}
            </div>
            <div class="detail-item">
              <strong>IEP Date:</strong> {{ formatDate(goal.iepDate) }}
            </div>
            <div class="detail-item">
              <strong>Baseline:</strong> {{ goal.baseline }}
            </div>
            <div class="detail-item">
              <strong>Goal:</strong> {{ goal.goalText }}
            </div>
          </div>
          
          <!-- Assessment Progress -->
          <div class="assessment-progress">
            <h4>📊 Assessment Progress</h4>
            
            <div v-if="getGoalAssessments(goal.id).length === 0" class="no-assessments">
              <p>No progress assessments assigned to this goal</p>
              <router-link :to="`/goals`" class="btn btn-sm btn-primary">
                Assign Assessments
              </router-link>
            </div>
            
            <div v-else class="assessments-list">
              <div v-for="assessment in getGoalAssessments(goal.id)" :key="assessment.id" class="assessment-item">
                <div class="assessment-header">
                  <h5>{{ assessment.title }}</h5>
                  <span class="assessment-type">{{ assessment.category }}</span>
                </div>
                
                <!-- Assessment Results -->
                <div class="results-section">
                  <!-- Show results for each assigned student -->
                  <div v-if="goal.assignedStudents?.length > 1" class="multiple-students-notice">
                    <p>📌 This goal is assigned to multiple students. Track individual progress in the gradebook.</p>
                  </div>
                  
                  <template v-else>
                    <div v-if="getGoalStudent(goal) && getAssessmentResults(assessment.id, getGoalStudent(goal)!).length === 0" class="no-results">
                      <p>No attempts yet</p>
                      <button 
                        v-if="getGoalStudent(goal)"
                        @click="assignAssessmentToStudent(assessment.id, getGoalStudent(goal)!)"
                        class="btn btn-sm btn-secondary"
                      >
                        Assign to Student
                      </button>
                    </div>
                    
                    <div v-else-if="getGoalStudent(goal)" class="results-list">
                      <div class="results-header">
                        <span>Attempts: {{ getAssessmentResults(assessment.id, getGoalStudent(goal)!).length }}</span>
                        <span>Best Score: {{ getBestScore(assessment.id, getGoalStudent(goal)!) }}%</span>
                        <span>Latest: {{ getLatestScore(assessment.id, getGoalStudent(goal)!) }}%</span>
                      </div>
                      
                      <!-- Progress Chart -->
                      <div class="progress-chart">
                        <div class="chart-container">
                          <div 
                            v-for="(result, index) in getAssessmentResults(assessment.id, getGoalStudent(goal)!).slice(-5)" 
                            :key="result.id"
                            class="chart-bar"
                            :style="{ height: `${result.percentage}%` }"
                            :title="`Attempt ${index + 1}: ${result.percentage}% (${formatDate(result.completedAt)})`"
                          >
                            <span class="bar-label">{{ result.percentage }}%</span>
                          </div>
                        </div>
                        <div class="chart-labels">
                          <span v-for="(result, index) in getAssessmentResults(assessment.id, getGoalStudent(goal)!).slice(-5)" :key="index">
                            {{ index + 1 }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- Detailed Results -->
                      <div class="detailed-results">
                        <button 
                          @click="toggleResultsDetails(assessment.id)"
                          class="btn btn-sm btn-outline"
                        >
                          {{ showDetailedResults[assessment.id] ? 'Hide' : 'Show' }} Details
                        </button>
                        
                        <div v-if="showDetailedResults[assessment.id]" class="results-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Attempt</th>
                                <th>Date</th>
                                <th>Score</th>
                                <th>Time</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(result, index) in getAssessmentResults(assessment.id, getGoalStudent(goal)!)" :key="result.id">
                                <td>{{ index + 1 }}</td>
                                <td>{{ formatDate(result.completedAt) }}</td>
                                <td>
                                  <span class="score-badge" :class="getScoreClass(result.percentage)">
                                    {{ result.score }}/{{ result.totalPoints }} ({{ result.percentage }}%)
                                  </span>
                                </td>
                                <td>{{ result.timeSpent }}min</td>
                                <td>
                                  <router-link 
                                    :to="`/assessment/${assessment.id}/results/${result.id}`"
                                    class="btn btn-xs btn-primary"
                                  >
                                    View
                                  </router-link>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Goal Actions -->
          <div class="goal-actions">
            <router-link :to="`/goals`" class="btn btn-sm btn-primary">
              Edit Goal
            </router-link>
            
            <button 
              v-if="goal.isActive && !goal.isMet && hasGoodProgress(goal.id)"
              @click="markGoalAsMet(goal.id)"
              class="btn btn-sm btn-success"
            >
              Mark as Met
            </button>
            
            <button 
              v-if="goal.isActive && needsAttention(goal.id)"
              @click="flagForAttention(goal.id)"
              class="btn btn-sm btn-warning"
            >
              Flag for Review
            </button>
            
            <button 
              v-if="goal.isActive"
              @click="archiveGoal(goal.id)"
              class="btn btn-sm btn-secondary"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Export and Reporting -->
    <div class="export-section">
      <h3>📄 Reports & Export</h3>
      <div class="export-buttons">
        <button @click="exportProgressReport" class="btn btn-secondary">
          📊 Export Progress Report
        </button>
        <button @click="exportGoalSummary" class="btn btn-secondary">
          📋 Export Goal Summary
        </button>
        <button @click="printProgressReport" class="btn btn-secondary">
          🖨️ Print Report
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { 
  getAllGoals,
  getGoalsByStudent,
  getGoalsByTeacher,
  markGoalAsMet as markGoalAsMetService,
  archiveGoal as archiveGoalService
} from '@/firebase/goalServices'
import { getAllStudents } from '@/firebase/userServices'
import { getAllAssessments, getAssessmentResultsByGoal, getAssessmentResultsByStudent } from '@/firebase/iepServices'
import { assignAssessmentToStudent as assignAssessment } from '@/firebase/assignmentServices'
import type { Goal, Assessment, AssessmentResult } from '@/types/iep'
import type { Student } from '@/types/users'

const router = useRouter()
const authStore = useAuthStore()

// Data
const goals = ref<Goal[]>([])
const students = ref<Student[]>([])
const assessments = ref<Assessment[]>([])
const assessmentResults = ref<AssessmentResult[]>([])
const loading = ref(true)

// Filters
const selectedStudentUid = ref('')
const selectedGoalId = ref('')
const selectedStatus = ref('')
const selectedSubject = ref('')
const selectedDateRange = ref('all')

// UI State
const showDetailedResults = reactive<Record<string, boolean>>({})

// Helper function to determine subject area from goal
const getSubjectArea = (goal: Goal): 'math' | 'ela' | 'other' => {
  const areaLower = goal.areaOfNeed.toLowerCase()
  const titleLower = goal.goalTitle.toLowerCase()
  const textLower = goal.goalText.toLowerCase()
  
  // Math keywords
  const mathKeywords = ['math', 'multiplication', 'division', 'addition', 'subtraction', 'fraction', 'decimal', 'equation', 'algebra', 'geometry', 'number', 'calculation', 'computation']
  if (mathKeywords.some(keyword => areaLower.includes(keyword) || titleLower.includes(keyword) || textLower.includes(keyword))) {
    return 'math'
  }
  
  // ELA keywords
  const elaKeywords = ['reading', 'writing', 'comprehension', 'vocabulary', 'grammar', 'spelling', 'decoding', 'fluency', 'phonics', 'essay', 'paragraph', 'text', 'literacy', 'language']
  if (elaKeywords.some(keyword => areaLower.includes(keyword) || titleLower.includes(keyword) || textLower.includes(keyword))) {
    return 'ela'
  }
  
  return 'other'
}

// Computed
const filteredGoals = computed(() => {
  let filtered = goals.value

  if (selectedStudentUid.value) {
    filtered = filtered.filter(goal => goal.studentUid === selectedStudentUid.value)
  }

  return filtered
})

const displayedGoals = computed(() => {
  let filtered = filteredGoals.value

  if (selectedGoalId.value) {
    filtered = filtered.filter(goal => goal.id === selectedGoalId.value)
  }

  if (selectedStatus.value) {
    switch (selectedStatus.value) {
      case 'active':
        filtered = filtered.filter(goal => goal.isActive && !goal.isMet && !goal.isArchived)
        break
      case 'met':
        filtered = filtered.filter(goal => goal.isMet)
        break
      case 'needs-attention':
        filtered = filtered.filter(goal => needsAttention(goal.id))
        break
    }
  }

  // Filter by subject area
  if (selectedSubject.value) {
    filtered = filtered.filter(goal => getSubjectArea(goal) === selectedSubject.value)
  }

  return filtered.sort((a, b) => {
    // Sort by status priority: active > needs attention > met > archived
    const getPriority = (goal: Goal) => {
      if (goal.isActive && !goal.isMet && !goal.isArchived) {
        return needsAttention(goal.id) ? 1 : 2
      }
      if (goal.isMet) return 3
      if (goal.isArchived) return 4
      return 5
    }
    
    return getPriority(a) - getPriority(b)
  })
})

// Summary Statistics
const totalGoals = computed(() => filteredGoals.value.length)

const goalsWithProgress = computed(() => 
  filteredGoals.value.filter(goal => 
    goal.assignedAssessments?.some(assessmentId => 
      assessmentResults.value.some(result => 
        result.assessmentId === assessmentId && result.studentUid === goal.studentUid
      )
    )
  ).length
)

const totalAssessments = computed(() => 
  assessments.value.filter(assessment => assessment.category === 'PA').length
)

const goalsNeedingAttention = computed(() => 
  filteredGoals.value.filter(goal => needsAttention(goal.id)).length
)

// Methods
const loadData = async () => {
  try {
    loading.value = true
    
    // Load based on user role and filters
    let goalsPromise
    if (selectedStudentUid.value) {
      goalsPromise = getGoalsByStudent(selectedStudentUid.value)
    } else if (authStore.isAdmin) {
      goalsPromise = getAllGoals()
    } else {
      goalsPromise = getGoalsByTeacher(authStore.currentUser!.uid)
    }
    
    const [goalsData, studentsData, assessmentsData] = await Promise.all([
      goalsPromise,
      getAllStudents(),
      getAllAssessments()
    ])
    
    goals.value = goalsData
    students.value = studentsData
    assessments.value = assessmentsData.filter(a => a.category === 'PA')
    
    // Load assessment results for all relevant assessments
    await loadAssessmentResults()
  } catch (error) {
    console.error('Error loading progress data:', error)
  } finally {
    loading.value = false
  }
}

const loadAssessmentResults = async () => {
  try {
    const results: AssessmentResult[] = []
    
    // Get results for each goal's assessments
    for (const goal of goals.value) {
      if (goal.assignedAssessments?.length) {
        for (const assessmentId of goal.assignedAssessments) {
          try {
            const goalResults = await getAssessmentResultsByGoal(goal.id)
            results.push(...goalResults.filter(r => r.assessmentId === assessmentId))
          } catch (error) {
            console.error(`Error loading results for assessment ${assessmentId}:`, error)
          }
        }
      }
    }
    
    assessmentResults.value = results
  } catch (error) {
    console.error('Error loading assessment results:', error)
  }
}

const filterResults = () => {
  // Triggers computed property updates
}

const getStudentName = (studentUid: string) => {
  const student = students.value.find(s => s.uid === studentUid)
  return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'
}

const getGoalStudent = (goal: Goal): string | null => {
  // Return the student UID for single-student goals
  if (goal.assignedStudents?.length === 1) {
    return goal.assignedStudents[0]
  }
  // Fallback to deprecated studentUid field
  if (goal.studentUid) {
    return goal.studentUid
  }
  return null
}

const getGoalAssessments = (goalId: string) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal?.assignedAssessments) return []
  
  return assessments.value.filter(assessment => 
    goal.assignedAssessments!.includes(assessment.id)
  )
}

const getAssessmentResults = (assessmentId: string, studentUid: string) => {
  return assessmentResults.value
    .filter(result => result.assessmentId === assessmentId && result.studentUid === studentUid)
    .sort((a, b) => new Date(a.completedAt?.seconds * 1000 || 0).getTime() - new Date(b.completedAt?.seconds * 1000 || 0).getTime())
}

const getBestScore = (assessmentId: string, studentUid: string) => {
  const results = getAssessmentResults(assessmentId, studentUid)
  if (results.length === 0) return 0
  return Math.max(...results.map(r => r.percentage))
}

const getLatestScore = (assessmentId: string, studentUid: string) => {
  const results = getAssessmentResults(assessmentId, studentUid)
  if (results.length === 0) return 0
  return results[results.length - 1].percentage
}

const getScoreClass = (percentage: number) => {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 70) return 'good'
  if (percentage >= 60) return 'fair'
  return 'needs-improvement'
}

const hasGoodProgress = (goalId: string) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal?.assignedAssessments) return false
  
  const studentUid = getGoalStudent(goal)
  if (!studentUid) return false
  
  // Check if student has consistent improvement or high scores
  for (const assessmentId of goal.assignedAssessments) {
    const results = getAssessmentResults(assessmentId, studentUid)
    if (results.length >= 2) {
      const latest = results[results.length - 1]
      const previous = results[results.length - 2]
      if (latest.percentage >= 80 || latest.percentage > previous.percentage) {
        return true
      }
    }
  }
  
  return false
}

const needsAttention = (goalId: string) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal?.isActive || goal.isMet || goal.isArchived) return false
  
  const studentUid = getGoalStudent(goal)
  if (!studentUid) return false // Can't check progress without a student
  
  // Check if goal needs attention based on various criteria
  const now = new Date()
  
  // Check IEP date if available
  if (goal.iepDate) {
    const iepDate = new Date(goal.iepDate)
    const daysUntilIep = Math.ceil((iepDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Flag if IEP date is approaching (within 30 days) and no recent progress
    if (daysUntilIep <= 30 && daysUntilIep > 0) {
    if (!goal.assignedAssessments?.length) return true
    
    // Check for recent assessment results
    const hasRecentResults = goal.assignedAssessments.some(assessmentId => {
      const results = getAssessmentResults(assessmentId, studentUid)
      return results.some(result => {
        const resultDate = new Date(result.completedAt?.seconds * 1000 || 0)
        const daysSinceResult = Math.ceil((now.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceResult <= 14 // Within 2 weeks
      })
    })
    
    if (!hasRecentResults) return true
    }
  }
  
  // Flag if consistently low scores
  if (goal.assignedAssessments?.length) {
    const allScores: number[] = []
    goal.assignedAssessments.forEach(assessmentId => {
      const results = getAssessmentResults(assessmentId, studentUid)
      allScores.push(...results.map(r => r.percentage))
    })
    
    if (allScores.length >= 3) {
      const recentScores = allScores.slice(-3)
      const averageRecent = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
      if (averageRecent < 60) return true
    }
  }
  
  return false
}

const formatDate = (date: any) => {
  if (!date) return 'Not set'
  
  let dateObj: Date
  if (date.seconds) {
    dateObj = new Date(date.seconds * 1000)
  } else if (typeof date === 'string') {
    dateObj = new Date(date)
  } else {
    dateObj = date
  }
  
  return dateObj.toLocaleDateString()
}

const toggleResultsDetails = (assessmentId: string) => {
  showDetailedResults[assessmentId] = !showDetailedResults[assessmentId]
}

// Actions
const assignAssessmentToStudent = async (assessmentId: string, studentUid: string) => {
  try {
    await assignAssessment(assessmentId, studentUid, authStore.currentUser!.uid)
    await loadAssessmentResults()
  } catch (error) {
    console.error('Error assigning assessment:', error)
    alert('Error assigning assessment. Please try again.')
  }
}

const markGoalAsMet = async (goalId: string) => {
  if (confirm('Mark this goal as met? This will deactivate the goal.')) {
    try {
      await markGoalAsMetService(goalId)
      await loadData()
    } catch (error) {
      console.error('Error marking goal as met:', error)
      alert('Error updating goal. Please try again.')
    }
  }
}

const archiveGoal = async (goalId: string) => {
  if (confirm('Archive this goal? This will deactivate the goal but keep it for records.')) {
    try {
      await archiveGoalService(goalId)
      await loadData()
    } catch (error) {
      console.error('Error archiving goal:', error)
      alert('Error archiving goal. Please try again.')
    }
  }
}

const flagForAttention = (goalId: string) => {
  // TODO: Implement flagging system (could add to goal notes or create alerts)
  alert('Goal flagged for review. Consider updating the goal or providing additional support.')
}

// Export functions
const exportProgressReport = () => {
  // TODO: Implement CSV/PDF export
  alert('Export functionality coming soon!')
}

const exportGoalSummary = () => {
  // TODO: Implement goal summary export
  alert('Export functionality coming soon!')
}

const printProgressReport = () => {
  window.print()
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.progress-assessment {
  max-width: 1400px;
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
  margin-bottom: 1.5rem;
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 180px;
}

.filter-group label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-icon {
  font-size: 2rem;
}

.summary-content h3 {
  margin: 0;
  font-size: 2rem;
  color: #2c3e50;
}

.summary-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.875rem;
}

.main-content {
  min-height: 400px;
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

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 2rem;
}

.goal-progress-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.goal-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.student-name {
  margin: 0 0 0.25rem 0;
  color: #007bff;
  font-weight: 600;
}

.area-of-need {
  margin: 0;
  color: #6c757d;
  font-size: 0.875rem;
}

.goal-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.met {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.archived {
  background: #fff3cd;
  color: #856404;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.goal-details {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-item {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.detail-item strong {
  color: #495057;
}

.assessment-progress {
  margin-bottom: 1.5rem;
}

.assessment-progress h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
}

.no-assessments {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
}

.assessments-list {
  space-y: 1rem;
}

.assessment-item {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.assessment-header h5 {
  margin: 0;
  color: #2c3e50;
}

.assessment-type {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.results-section {
  margin-top: 1rem;
}

.no-results {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 4px;
}

.multiple-students-notice {
  text-align: center;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 0.875rem;
}

.multiple-students-notice p {
  margin: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #495057;
}

.progress-chart {
  margin-bottom: 1rem;
}

.chart-container {
  display: flex;
  align-items: end;
  height: 100px;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #007bff, #0056b3);
  border-radius: 2px;
  min-height: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-bar:hover {
  transform: scaleY(1.1);
}

.bar-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #495057;
  font-weight: 600;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  font-size: 0.75rem;
  color: #6c757d;
}

.detailed-results {
  margin-top: 1rem;
}

.results-table {
  margin-top: 1rem;
  overflow-x: auto;
}

.results-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.results-table th,
.results-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.results-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.score-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
}

.score-badge.excellent {
  background: #d4edda;
  color: #155724;
}

.score-badge.good {
  background: #d1ecf1;
  color: #0c5460;
}

.score-badge.fair {
  background: #fff3cd;
  color: #856404;
}

.score-badge.needs-improvement {
  background: #f8d7da;
  color: #721c24;
}

.goal-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.export-section {
  margin-top: 3rem;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.export-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.export-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Responsive Design */
@media (max-width: 768px) {
  .progress-assessment {
    padding: 1rem;
  }
  
  .progress-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .summary-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .goal-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .results-header {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .export-buttons {
    flex-direction: column;
    align-items: center;
  }
}

@media print {
  .filters-section,
  .export-section,
  .goal-actions,
  .btn {
    display: none !important;
  }
  
  .progress-assessment {
    padding: 0;
  }
  
  .progress-grid {
    grid-template-columns: 1fr;
  }
  
  .goal-progress-card {
    break-inside: avoid;
    margin-bottom: 2rem;
  }
}
</style>
