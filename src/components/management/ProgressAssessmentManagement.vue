<template>
  <div class="pa-management">
    <div class="page-header">
      <h1>📋 Progress Assessment Management</h1>
      <p>Manage Progress Assessments (PA) for IEP Goals</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Class/Period:</label>
        <select v-model="selectedPeriod" @change="filterData">
          <option value="">All Classes</option>
          <option v-for="period in periods" :key="period" :value="period">
            Period {{ period }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Student:</label>
        <select v-model="selectedStudentUid" @change="filterData">
          <option value="">All Students</option>
          <option v-for="student in availableStudents" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Subject:</label>
        <select v-model="selectedSubject" @change="filterData">
          <option value="">All Subjects</option>
          <option value="math">Math</option>
          <option value="ela">ELA/Reading</option>
          <option value="writing">Writing</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="filter-group search-group">
        <label>Search:</label>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search goals or assessments..."
          @input="filterData"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading assessments...</p>
    </div>

    <!-- Condensed List View -->
    <div v-else class="assessment-list">
      <div v-if="filteredData.length === 0" class="no-results">
        <p>No progress assessments found matching your filters.</p>
      </div>

      <div v-for="item in filteredData" :key="`${item.student.uid}-${item.goal.id}`" class="student-row">
        <div class="student-info">
          <div class="student-header">
            <h3>{{ item.student.firstName }} {{ item.student.lastName }}</h3>
            <span v-if="item.student.period" class="period-badge">Period {{ item.student.period }}</span>
          </div>
        </div>

        <div class="goal-section">
          <div class="goal-header">
            <span class="goal-icon">🎯</span>
            <div class="goal-content">
              <strong>{{ item.goal.goalTitle }}</strong>
              <span class="goal-subject">{{ item.goal.areaOfNeed }}</span>
            </div>
          </div>

          <!-- Active Assessments for this Goal -->
          <div class="goal-actions">
            <button
              @click="generateAssessmentsForGoal(item.goal.id, item.goal.goalTitle)"
              class="btn btn-sm btn-generate"
              title="Generate 3 assessments with 5 questions each"
            >
              ⚡ Generate Assessments
            </button>
          </div>

          <div v-if="item.assessments.length > 0" class="assessments-list">
            <table class="compact-table">
              <thead>
                <tr>
                  <th>Assessment Title</th>
                  <th>Questions</th>
                  <th>Points</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assessment in item.assessments" :key="assessment.id">
                  <td class="assessment-title">
                    <strong>{{ assessment.title }}</strong>
                    <small v-if="assessment.description">{{ assessment.description }}</small>
                  </td>
                  <td class="text-center">{{ assessment.questions?.length || 0 }}</td>
                  <td class="text-center">{{ assessment.totalPoints }}</td>
                  <td>
                    <span class="status-badge" :class="getAssignmentStatus(assessment.id, item.student.uid)">
                      {{ getAssignmentStatusText(assessment.id, item.student.uid) }}
                    </span>
                    <small v-if="getAttemptCount(assessment.id, item.student.uid) > 0" class="attempt-count">
                      {{ getAttemptCount(assessment.id, item.student.uid) }} attempt(s)
                    </small>
                  </td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button
                        @click="editAssessment(assessment)"
                        class="btn-icon btn-edit"
                        title="Edit Assessment"
                      >
                        ✏️
                      </button>
                      <button
                        @click="viewResults(assessment.id, item.student.uid)"
                        class="btn-icon btn-view"
                        title="View Results"
                        :disabled="!hasResults(assessment.id, item.student.uid)"
                      >
                        📊
                      </button>
                      <button
                        v-if="!isAssigned(assessment.id, item.student.uid)"
                        @click="assignToStudent(assessment.id, item.student.uid)"
                        class="btn-icon btn-assign"
                        title="Assign to Student"
                      >
                        ➕
                      </button>
                      <button
                        v-else
                        @click="unassignFromStudent(assessment.id, item.student.uid)"
                        class="btn-icon btn-unassign"
                        title="Unassign from Student"
                      >
                        ➖
                      </button>
                      <button
                        v-if="authStore.isAdmin && isAssigned(assessment.id, item.student.uid)"
                        @click="openTeacherFixModal(assessment.id, item.student.uid)"
                        class="btn-icon btn-fix"
                        title="Fix Teacher Assignment"
                      >
                        🔧
                      </button>
                      <button
                        @click="deleteAssessment(assessment.id)"
                        class="btn-icon btn-delete"
                        title="Delete Assessment"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-assessments">
            <p>No assessments created for this goal</p>
            <button @click="createAssessmentForGoal(item.goal.id)" class="btn btn-sm btn-primary">
              ➕ Create Assessment
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div v-if="!loading && filteredData.length > 0" class="stats-bar">
      <div class="stat">
        <strong>{{ totalStudents }}</strong> Students
      </div>
      <div class="stat">
        <strong>{{ totalGoals }}</strong> Goals
      </div>
      <div class="stat">
        <strong>{{ totalAssessments }}</strong> Assessments
      </div>
      <div class="stat">
        <strong>{{ totalAssigned }}</strong> Assigned
      </div>
    </div>

    <!-- Teacher Assignment Fix Modal -->
    <div v-if="showTeacherFixModal && fixingAssignment" class="modal-overlay" @click.self="closeTeacherFixModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Fix Teacher Assignment</h2>
          <button @click="closeTeacherFixModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p class="info-text">
            This assessment was assigned by the wrong teacher. Select the correct teacher below.
            <strong>Note:</strong> This will update the assignment record but will not affect any completed assessment results.
          </p>

          <div class="form-group">
            <label>Current Teacher:</label>
            <div class="current-teacher">
              {{ getTeacherName(fixingAssignment.currentTeacherUid) || 'Unknown' }}
            </div>
          </div>

          <div class="form-group">
            <label>Select Correct Teacher:</label>
            <select v-model="selectedTeacherUid" class="form-select">
              <option value="">-- Select Teacher --</option>
              <option v-for="teacher in teachers" :key="teacher.uid" :value="teacher.uid">
                {{ teacher.firstName }} {{ teacher.lastName }} ({{ teacher.email }})
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeTeacherFixModal" class="btn btn-secondary" :disabled="fixing">
            Cancel
          </button>
          <button
            @click="fixTeacherAssignment"
            class="btn btn-primary"
            :disabled="!selectedTeacherUid || fixing || selectedTeacherUid === fixingAssignment.currentTeacherUid"
          >
            {{ fixing ? 'Updating...' : 'Update Teacher' }}
          </button>
        </div>
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
  getAllGoals,
  getGoalsByTeacher,
  assignAssessmentToGoal as assignAssessmentService
} from '@/firebase/goalServices'
import {
  getAllAssessments,
  deleteAssessment as deleteAssessmentService,
  getAssessmentResultsByStudent,
  createAssessment
} from '@/firebase/iepServices'
import {
  getStudentAssignments,
  assignAssessmentToStudent,
  unassignAssessmentFromStudent,
  updateAssignmentTeacher,
  getAssignment
} from '@/firebase/assignmentServices'
import { getAllTeachers } from '@/firebase/userServices'
import { generateQuestionForGoal } from '@/services/goalQuestionGenerator'
import type { QuestionResult } from '@/services/aiQuestionGenerator'
import type { Student, Teacher } from '@/types/users'
import type { Goal, Assessment, AssessmentResult, AssessmentQuestion, AssessmentAssignment } from '@/types/iep'

const router = useRouter()
const authStore = useAuthStore()

// Data
const students = ref<Student[]>([])
const goals = ref<Goal[]>([])
const assessments = ref<Assessment[]>([])
const assignments = ref<Record<string, string[]>>({}) // studentUid -> assessmentIds[]
const assignmentDetails = ref<Record<string, AssessmentAssignment>>({}) // `${assessmentId}-${studentUid}` -> assignment
const teachers = ref<Teacher[]>([])
const results = ref<Record<string, AssessmentResult[]>>({}) // studentUid -> results[]
const loading = ref(true)
const generating = ref(false)

// Teacher assignment fix modal
const showTeacherFixModal = ref(false)
const fixingAssignment = ref<{ assessmentId: string; studentUid: string; currentTeacherUid: string } | null>(null)
const selectedTeacherUid = ref('')
const fixing = ref(false)

// Filters
const selectedPeriod = ref('')
const selectedStudentUid = ref('')
const selectedSubject = ref('')
const searchQuery = ref('')

// Load data
const loadData = async () => {
  try {
    loading.value = true

    if (!authStore.currentUser) return

    // Load based on role
    if (authStore.isAdmin) {
      students.value = await getAllStudents()
      goals.value = await getAllGoals()
    } else {
      students.value = await getStudentsByTeacher(authStore.currentUser.uid)
      goals.value = await getGoalsByTeacher(authStore.currentUser.uid)
    }

    // Load all assessments and filter for PA category
    const allAssessments = await getAllAssessments()
    assessments.value = allAssessments.filter(a => a.category === 'PA')

    // Load teachers if admin
    if (authStore.isAdmin) {
      teachers.value = await getAllTeachers()
    }

    // Load assignments and results for each student
    for (const student of students.value) {
      const studentAssessments = await getStudentAssignments(student.uid)
      assignments.value[student.uid] = studentAssessments.map(a => a.assessmentId)

      // Store assignment details (including assignedBy)
      for (const assignment of studentAssessments) {
        const key = `${assignment.assessmentId}-${student.uid}`
        assignmentDetails.value[key] = assignment
      }

      // Load results for this student
      try {
        const studentResults = await getAssessmentResultsByStudent(student.uid)
        results.value[student.uid] = studentResults
      } catch (err) {
        console.warn(`Could not load results for student ${student.uid}:`, err)
        results.value[student.uid] = []
      }
    }

  } catch (error) {
    console.error('Error loading data:', error)
    alert('Error loading data. Please try again.')
  } finally {
    loading.value = false
  }
}

// Computed
const periods = computed(() => {
  const uniquePeriods = new Set(
    students.value
      .map(s => s.period)
      .filter(p => p !== undefined && p !== null)
  )
  return Array.from(uniquePeriods).sort()
})

const availableStudents = computed(() => {
  if (!selectedPeriod.value) return students.value
  return students.value.filter(s => s.period?.toString() === selectedPeriod.value)
})

interface FilteredItem {
  student: Student
  goal: Goal
  assessments: Assessment[]
}

const filteredData = computed(() => {
  const items: FilteredItem[] = []

  // Filter students
  let filteredStudents = students.value
  if (selectedPeriod.value) {
    filteredStudents = filteredStudents.filter(s => s.period?.toString() === selectedPeriod.value)
  }
  if (selectedStudentUid.value) {
    filteredStudents = filteredStudents.filter(s => s.uid === selectedStudentUid.value)
  }

  // For each student, find their goals
  for (const student of filteredStudents) {
    const studentGoals = goals.value.filter(g =>
      g.assignedStudents?.includes(student.uid) || g.studentUid === student.uid
    )

    for (const goal of studentGoals) {
      // Filter by subject
      if (selectedSubject.value) {
        const goalSubject = getGoalSubject(goal)
        if (goalSubject !== selectedSubject.value) continue
      }

      // Get assessments for this goal
      const goalAssessments = assessments.value.filter(a => a.goalId === goal.id)

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        const matchesGoal = goal.goalTitle.toLowerCase().includes(query) ||
                           goal.areaOfNeed.toLowerCase().includes(query)
        const matchesAssessment = goalAssessments.some(a =>
          a.title.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query)
        )
        if (!matchesGoal && !matchesAssessment) continue
      }

      items.push({
        student,
        goal,
        assessments: goalAssessments
      })
    }
  }

  return items
})

const totalStudents = computed(() => {
  const uniqueStudents = new Set(filteredData.value.map(item => item.student.uid))
  return uniqueStudents.size
})

const totalGoals = computed(() => {
  const uniqueGoals = new Set(filteredData.value.map(item => item.goal.id))
  return uniqueGoals.size
})

const totalAssessments = computed(() => {
  const uniqueAssessments = new Set(
    filteredData.value.flatMap(item => item.assessments.map(a => a.id))
  )
  return uniqueAssessments.size
})

const totalAssigned = computed(() => {
  let count = 0
  for (const item of filteredData.value) {
    for (const assessment of item.assessments) {
      if (isAssigned(assessment.id, item.student.uid)) {
        count++
      }
    }
  }
  return count
})

// Methods
const filterData = () => {
  // Filters are reactive, just trigger recompute
}

const getGoalSubject = (goal: Goal): string => {
  const area = goal.areaOfNeed.toLowerCase()
  if (area.includes('math') || area.includes('calculation')) return 'math'
  if (area.includes('reading') || area.includes('comprehension') || area.includes('ela')) return 'ela'
  if (area.includes('writing')) return 'writing'
  return 'other'
}

const isAssigned = (assessmentId: string, studentUid: string): boolean => {
  return assignments.value[studentUid]?.includes(assessmentId) || false
}

const hasResults = (assessmentId: string, studentUid: string): boolean => {
  // Check if student has any results for this assessment
  const studentResults = results.value[studentUid] || []
  return studentResults.some(r => r.assessmentId === assessmentId)
}

const getAttemptCount = (assessmentId: string, studentUid: string): number => {
  // Count how many times student has taken this assessment
  const studentResults = results.value[studentUid] || []
  return studentResults.filter(r => r.assessmentId === assessmentId).length
}

const getAssignmentStatus = (assessmentId: string, studentUid: string): string => {
  if (!isAssigned(assessmentId, studentUid)) return 'not-assigned'

  // Check if student has completed this assessment
  const studentResults = results.value[studentUid] || []
  const hasCompleted = studentResults.some(r => r.assessmentId === assessmentId)

  return hasCompleted ? 'completed' : 'assigned'
}

const getAssignmentStatusText = (assessmentId: string, studentUid: string): string => {
  const status = getAssignmentStatus(assessmentId, studentUid)
  if (status === 'not-assigned') return 'Not Assigned'
  if (status === 'completed') return 'Completed'
  return 'Assigned'
}

const assignToStudent = async (assessmentId: string, studentUid: string) => {
  if (!authStore.currentUser) return

  try {
    await assignAssessmentToStudent(assessmentId, studentUid, authStore.currentUser.uid)

    // Update local state
    if (!assignments.value[studentUid]) {
      assignments.value[studentUid] = []
    }
    assignments.value[studentUid].push(assessmentId)

  } catch (error) {
    console.error('Error assigning assessment:', error)
    alert('Error assigning assessment. Please try again.')
  }
}

const unassignFromStudent = async (assessmentId: string, studentUid: string) => {
  if (!confirm('Are you sure you want to unassign this assessment from the student?')) return

  try {
    await unassignAssessmentFromStudent(studentUid, assessmentId)

    // Update local state
    if (assignments.value[studentUid]) {
      assignments.value[studentUid] = assignments.value[studentUid].filter(id => id !== assessmentId)
    }

  } catch (error) {
    console.error('Error unassigning assessment:', error)
    alert('Error unassigning assessment. Please try again.')
  }
}

const editAssessment = (assessment: Assessment) => {
  router.push(`/assessment/edit/${assessment.id}`)
}

const viewResults = (assessmentId: string, studentUid: string) => {
  // Find the latest result for this assessment and student
  const studentResults = results.value[studentUid] || []
  const assessmentResults = studentResults.filter(r => r.assessmentId === assessmentId)

  if (assessmentResults.length === 0) {
    alert('No results found for this assessment.')
    return
  }

  // Get the most recent result
  const latestResult = assessmentResults.sort((a, b) => {
    const aTime = a.completedAt?.seconds || 0
    const bTime = b.completedAt?.seconds || 0
    return bTime - aTime
  })[0]

  // Navigate to result detail page
  router.push(`/assessment/${assessmentId}/results/${latestResult.id}`)
}

const deleteAssessment = async (assessmentId: string) => {
  if (!confirm('Are you sure you want to delete this assessment? This will also remove all assignments and results. This action cannot be undone.')) return

  try {
    await deleteAssessmentService(assessmentId)

    // Update local state - remove from assessments array
    assessments.value = assessments.value.filter(a => a.id !== assessmentId)

    // Remove from all student assignments
    for (const studentUid in assignments.value) {
      assignments.value[studentUid] = assignments.value[studentUid].filter(id => id !== assessmentId)
    }

    alert('✅ Assessment deleted successfully')
  } catch (error) {
    console.error('Error deleting assessment:', error)
    alert('Error deleting assessment. Please try again.')
  }
}

const createAssessmentForGoal = (goalId: string) => {
  router.push(`/assessment/create?goalId=${goalId}`)
}

// Teacher assignment fix functions
const getTeacherName = (teacherUid: string): string => {
  const teacher = teachers.value.find(t => t.uid === teacherUid)
  if (!teacher) return ''
  return `${teacher.firstName} ${teacher.lastName}`
}

const getAssignmentTeacher = (assessmentId: string, studentUid: string): string | null => {
  const key = `${assessmentId}-${studentUid}`
  return assignmentDetails.value[key]?.assignedBy || null
}

const openTeacherFixModal = async (assessmentId: string, studentUid: string) => {
  try {
    // Get the current assignment to find the assignedBy teacher
    const assignment = await getAssignment(assessmentId, studentUid)

    if (!assignment) {
      alert('Assignment not found. This assessment may not be assigned to this student.')
      return
    }

    fixingAssignment.value = {
      assessmentId,
      studentUid,
      currentTeacherUid: assignment.assignedBy
    }
    selectedTeacherUid.value = assignment.assignedBy
    showTeacherFixModal.value = true
  } catch (error) {
    console.error('Error opening teacher fix modal:', error)
    alert('Error loading assignment details. Please try again.')
  }
}

const closeTeacherFixModal = () => {
  showTeacherFixModal.value = false
  fixingAssignment.value = null
  selectedTeacherUid.value = ''
}

const fixTeacherAssignment = async () => {
  if (!fixingAssignment.value || !selectedTeacherUid.value) return

  if (selectedTeacherUid.value === fixingAssignment.value.currentTeacherUid) {
    alert('Please select a different teacher.')
    return
  }

  if (!confirm(`Are you sure you want to change the assigned teacher from "${getTeacherName(fixingAssignment.value.currentTeacherUid)}" to "${getTeacherName(selectedTeacherUid.value)}"?\n\nThis will update the assignment record.`)) {
    return
  }

  try {
    fixing.value = true

    await updateAssignmentTeacher(
      fixingAssignment.value.assessmentId,
      fixingAssignment.value.studentUid,
      selectedTeacherUid.value
    )

    // Update local state
    const key = `${fixingAssignment.value.assessmentId}-${fixingAssignment.value.studentUid}`
    if (assignmentDetails.value[key]) {
      assignmentDetails.value[key].assignedBy = selectedTeacherUid.value
    }

    alert('✅ Teacher assignment updated successfully!')
    closeTeacherFixModal()
  } catch (error) {
    console.error('Error fixing teacher assignment:', error)
    alert('Error updating teacher assignment. Please try again.')
  } finally {
    fixing.value = false
  }
}

// Generate Assessments for Goal (copied from GoalManagement)
const generateAssessmentsForGoal = async (goalId: string, goalTitle: string) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal) return

  // Prompt for difficulty level
  const difficultyInput = prompt(
    `Generate 3 Progress Assessments (5 questions each) for "${goalTitle}"?\n\n` +
    `Select difficulty level:\n` +
    `1 = Easy\n` +
    `2 = Medium (default)\n` +
    `3 = Hard\n\n` +
    `Enter 1, 2, or 3 (or press Cancel):`,
    '2'
  )
  
  if (difficultyInput === null) return // User cancelled
  
  const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
    '1': 'easy',
    '2': 'medium',
    '3': 'hard'
  }
  
  const difficulty = difficultyMap[difficultyInput.trim()] || 'medium'
  
  if (!confirm(`Generate 3 Progress Assessments with ${difficulty} difficulty?\n\nEach assessment will have 5 questions worth 1 point each (5 points total).`)) {
    return
  }

  try {
    generating.value = true

    // Determine subject area
    const subject = getSubjectArea(goal)

    // Generate 3 assessments with variations
    const assessmentTitles = [
      `${goalTitle} - Check #1`,
      `${goalTitle} - Check #2`,
      `${goalTitle} - Check #3`
    ]

    const createdAssessments: string[] = []

    for (let i = 0; i < 3; i++) {
      // Generate questions based on goal with selected difficulty
      const questions = await generateQuestionsForGoal(goal, i + 1, difficulty)

      const assessmentData = {
        title: assessmentTitles[i],
        description: generateAssessmentDescription(goal, subject),
        gradeLevel: goal.gradeLevel ?? 7,
        category: 'PA' as const,
        goalId: goalId,
        createdBy: authStore.currentUser!.uid,
        questions: questions,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        instructions: 'Answer each question to the best of your ability. Show your work for all math problems.',
        accommodations: [],
        allowFileUpload: true,
        requireFileUpload: true,
        fileUploadInstructions: 'Upload photos of your work for all questions that require it. Make sure your work is clear and legible.',
        allowRetakes: false,
        maxRetakes: 0,
        retakeMode: 'separate' as const,
        retakeInstructions: ''
      }

      const assessmentId = await createAssessment(assessmentData)
      await assignAssessmentService(goalId, assessmentId)
      createdAssessments.push(assessmentId)
    }

    alert(`✅ Successfully created ${createdAssessments.length} assessments with 5 questions each!\n\nEach assessment has:\n• 5 questions with answers\n• 5 points total (1 point per question)\n\nYou can now assign them to students or edit the questions.`)
    await loadData()
  } catch (error) {
    console.error('Error generating assessments:', error)
    alert('Error generating assessments. Please try again.')
  } finally {
    generating.value = false
  }
}

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

// Generate assessment description based on goal
const generateAssessmentDescription = (goal: Goal, subject: 'math' | 'ela' | 'other'): string => {
  const goalText = goal.goalText.toLowerCase()
  const areaOfNeed = goal.areaOfNeed

  if (subject === 'math') {
    if (goalText.includes('multiplication') || goalText.includes('division')) {
      return 'This assessment measures multiplication and division fluency with multi-digit numbers.'
    } else if (goalText.includes('fraction')) {
      return 'This assessment measures understanding of fraction operations and comparisons.'
    } else if (goalText.includes('equation')) {
      return 'This assessment measures ability to solve equations using algebraic strategies.'
    }
    return `This assessment measures skills in ${areaOfNeed}.`
  } else if (subject === 'ela') {
    if (goalText.includes('reading comprehension') || goalText.includes('main idea')) {
      return 'This assessment measures reading comprehension and the ability to identify main ideas and supporting details.'
    } else if (goalText.includes('summariz')) {
      return 'This assessment measures the ability to summarize text including central idea and supporting details.'
    } else if (goalText.includes('writing') || goalText.includes('paragraph')) {
      return 'This assessment measures writing skills, including paragraph structure and organization.'
    }
    return `This assessment measures skills in ${areaOfNeed}.`
  }

  return `This assessment measures progress toward the IEP goal in ${areaOfNeed}.`
}

// Helper: Generate short description for question based on goal
const generateQuestionDescription = (goal: Goal, questionData: any): string | undefined => {
  const goalText = goal.goalText.toLowerCase()

  // For math problems, include what skill is being assessed
  if (goalText.includes('add') || goalText.includes('addition')) {
    return 'Addition problem'
  } else if (goalText.includes('subtract') || goalText.includes('subtraction')) {
    return 'Subtraction problem'
  } else if (goalText.includes('multiply') || goalText.includes('multiplication')) {
    return 'Multiplication problem'
  } else if (goalText.includes('divide') || goalText.includes('division')) {
    return 'Division problem'
  } else if (goalText.includes('fraction')) {
    return 'Fraction problem'
  } else if (goalText.includes('decimal')) {
    return 'Decimal problem'
  } else if (goalText.includes('word problem')) {
    return 'Word problem - show your work'
  } else if (goalText.includes('expression')) {
    return 'Expression problem'
  } else if (goalText.includes('equation')) {
    return 'Equation problem'
  }

  return questionData.explanation
}

// Helper: Detect answer prefix from answer (e.g., "x=" from "x=10")
const detectAnswerPrefix = (answer: string): string | undefined => {
  if (!answer) return undefined

  const answerStr = answer.toString()

  // Check for common prefixes
  if (/^[a-z]\s*=/i.test(answerStr)) {
    // Extract "x=" from "x=10"
    const match = answerStr.match(/^([a-z]\s*=)/i)
    return match ? match[1] : undefined
  } else if (answerStr.startsWith('$') && answerStr.length > 1) {
    // Money prefix
    return '$'
  }

  return undefined
}

// Helper: Detect answer suffix from answer and question
const detectAnswerSuffix = (answer: string, question: string): string | undefined => {
  if (!answer || !question) return undefined

  const answerStr = answer.toString().toLowerCase()
  const questionLower = question.toLowerCase()

  // Check for units in the answer
  const units = ['apples', 'oranges', 'feet', 'inches', 'cm', 'meters', 'miles', 'pounds', 'kg', 'hours', 'minutes', 'seconds', 'dollars', 'cents', 'students', 'books', 'pages']

  for (const unit of units) {
    if (answerStr.includes(unit)) {
      // Extract unit from answer
      const match = answerStr.match(new RegExp(`\\d+\\s*(${unit})`))
      return match ? match[1] : undefined
    }
  }

  // Check if question mentions units
  for (const unit of units) {
    if (questionLower.includes(unit)) {
      return unit
    }
  }

  return undefined
}

// Generate questions for goal using the new service
const generateQuestionsForGoal = async (goal: Goal, assessmentNumber: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<AssessmentQuestion[]> => {
  const questions: AssessmentQuestion[] = []
  const questionCount = 5
  const previousQuestions: QuestionResult[] = [] // Track previously generated questions

  for (let i = 0; i < questionCount; i++) {
    const questionData = await generateQuestionForGoal(goal, i + 1, { 
      method: 'hybrid',
      difficulty: difficulty,
      previousQuestions: previousQuestions.length > 0 ? [...previousQuestions] : undefined
    })

    // Add this question to previousQuestions so next questions can avoid duplicates
    previousQuestions.push({
      question: questionData.question,
      answer: questionData.answer,
      answerPrefix: questionData.answerPrefix,
      answerSuffix: questionData.answerSuffix,
      alternativeAnswers: questionData.alternativeAnswers,
      explanation: questionData.explanation,
      requiresPhoto: questionData.requiresPhoto,
      source: questionData.source,
    })

    // Generate short description based on goal and question
    const shortDescription = generateQuestionDescription(goal, questionData)

    questions.push({
      id: `q${i + 1}`,
      questionType: 'short-answer',
      questionText: questionData.question,
      points: 1,
      correctAnswer: questionData.answer,
      explanation: shortDescription || questionData.explanation || 'Show your work and explain your reasoning.',
      answerPrefix: detectAnswerPrefix(questionData.answer),
      answerSuffix: detectAnswerSuffix(questionData.answer, questionData.question),
      requiresPhoto: questionData.requiresPhoto !== false
    })
  }

  return questions
}

// Old generateQuestionWithAnswer function removed - now using generateQuestionForGoal from service

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.pa-management {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #718096;
  font-size: 1rem;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.search-group {
  flex: 1;
  min-width: 250px;
}

.filter-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #4a5568;
}

.filter-group select,
.filter-group input {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #718096;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.assessment-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.student-row {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.student-row:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.student-info {
  background: #f7fafc;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.student-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.student-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #2d3748;
}

.period-badge {
  padding: 0.25rem 0.75rem;
  background: #4299e1;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.goal-section {
  padding: 1rem 1.5rem;
}

.goal-actions {
  margin-bottom: 1rem;
}

.btn-generate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-generate:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.goal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.goal-icon {
  font-size: 1.5rem;
}

.goal-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.goal-content strong {
  color: #2d3748;
  font-size: 1rem;
}

.goal-subject {
  font-size: 0.75rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.assessments-list {
  margin-top: 1rem;
}

.compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.compact-table thead {
  background: #f7fafc;
}

.compact-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

.compact-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.compact-table tbody tr:hover {
  background: #f7fafc;
}

.assessment-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.assessment-title strong {
  color: #2d3748;
}

.assessment-title small {
  color: #718096;
  font-size: 0.75rem;
}

.text-center {
  text-align: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.not-assigned {
  background: #edf2f7;
  color: #718096;
}

.status-badge.assigned {
  background: #bee3f8;
  color: #2c5282;
}

.status-badge.completed {
  background: #c6f6d5;
  color: #22543d;
}

.attempt-count {
  display: block;
  margin-top: 0.25rem;
  color: #718096;
  font-size: 0.7rem;
}

.actions-cell {
  width: 200px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #edf2f7;
  transform: scale(1.1);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-edit:hover:not(:disabled) {
  background: #bee3f8;
}

.btn-delete:hover:not(:disabled) {
  background: #fed7d7;
}

.btn-view:hover:not(:disabled) {
  background: #c6f6d5;
}

.btn-assign:hover:not(:disabled) {
  background: #faf089;
}

.btn-unassign:hover:not(:disabled) {
  background: #fbd38d;
}

.btn-fix:hover:not(:disabled) {
  background: #f6e05e;
}

.no-assessments {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.no-assessments p {
  margin-bottom: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 153, 225, 0.3);
}

.stats-bar {
  display: flex;
  gap: 2rem;
  justify-content: center;
  padding: 1.5rem;
  margin-top: 2rem;
  background: #f7fafc;
  border-radius: 12px;
}

.stat {
  text-align: center;
  color: #4a5568;
}

.stat strong {
  display: block;
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
  }

  .compact-table {
    font-size: 0.75rem;
  }

  .compact-table th,
  .compact-table td {
    padding: 0.5rem;
  }
}

/* Modal Styles */
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2d3748;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #718096;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #edf2f7;
  color: #2d3748;
}

.modal-body {
  padding: 1.5rem;
}

.info-text {
  color: #4a5568;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.info-text strong {
  color: #2d3748;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.current-teacher {
  padding: 0.75rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #2d3748;
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #2d3748;
}

.form-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

