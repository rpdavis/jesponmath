<template>
  <div class="standard-assessment-export-container">
    <div class="export-header">
      <h2>📊 Export Assessment</h2>
      <p class="subtitle">Export assessment data in CSV format by period</p>
    </div>

    <div v-if="loading" class="loading-message">
      <p>Loading data...</p>
    </div>

    <div v-else class="export-content">
      <!-- Export Type Selection -->
      <div class="export-type-selection">
        <h3>Select Export Type:</h3>
        <div class="export-type-buttons">
          <button 
            @click="exportType = 'ESA'"
            :class="['export-type-btn', { active: exportType === 'ESA' }]"
          >
            Essential Standards (ESA)
          </button>
          <button 
            @click="exportType = 'SA'"
            :class="['export-type-btn', { active: exportType === 'SA' }]"
          >
            Standard Assessment (SA)
          </button>
          <button 
            @click="exportType = 'BOTH'"
            :class="['export-type-btn', { active: exportType === 'BOTH' }]"
          >
            Both
          </button>
        </div>
      </div>

      <!-- Course Selection -->
      <div class="period-selection" v-if="availableCourses.length > 0">
        <h3>Select Classes to Export:</h3>
        <div class="period-buttons">
          <button 
            v-for="course in availableCourses"
            :key="course.courseId"
            @click="toggleCourse(course.courseId)"
            :class="['period-btn', { active: selectedCourses.includes(course.courseId) }]"
          >
            {{ course.label }}
          </button>
          <button 
            @click="selectAllCourses"
            :class="['period-btn', { active: selectedCourses.length === availableCourses.length }]"
          >
            All Classes
          </button>
        </div>
      </div>

      <!-- Summary -->
      <div class="summary-section" v-if="selectedCourses.length > 0">
        <h3>Export Summary</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Selected Classes:</span>
            <span class="stat-value">{{ selectedCourses.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Assessments:</span>
            <span class="stat-value">{{ filteredAssessments.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Students:</span>
            <span class="stat-value">{{ totalStudents }}</span>
          </div>
        </div>
      </div>

      <!-- Include Totals Option -->
      <div class="include-totals-option" v-if="selectedCourses.length > 0">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="includeTotals"
            class="checkbox-input"
          >
          <span>Include Total Standard Scores</span>
        </label>
        <p class="help-text">
          Calculate and include total scores for each standard across all assessments, respecting maxScore and scoring method (additive, average, or top score)
        </p>
      </div>

      <!-- Export Buttons -->
      <div class="export-actions" v-if="selectedCourses.length > 0">
        <button 
          @click="exportToCSV" 
          class="export-btn"
          :disabled="loading"
        >
          📥 Export CSV (By Assessment)
        </button>
        <button 
          @click="exportByStandard" 
          class="export-btn standard-export-btn"
          :disabled="loading"
        >
          📊 Export by Standard (Gradebook Format)
        </button>
        <button 
          @click="syncToGoogleSheets" 
          class="export-btn sheets-btn"
          :disabled="loading || syncing"
        >
          {{ syncing ? '⏳ Syncing...' : '📊 Sync to Google Sheets' }}
        </button>
      </div>

      <!-- Google Sheets Status -->
      <div v-if="sheetsStatus" class="sheets-status" :class="{ error: sheetsStatus.includes('Error') }">
        <p>{{ sheetsStatus }}</p>
        <a v-if="sheetsUrl" :href="sheetsUrl" target="_blank" class="sheets-link">
          Open in Google Sheets →
        </a>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getAllAssessments } from '@/firebase/iepServices'
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices'
import { getAssessmentResultsByStudent } from '@/firebase/iepServices'
import { parseStandards } from '@/utils/standardsUtils'
import { useAuthStore } from '@/stores/authStore'
import { googleSheetsService, isGoogleSheetsAuthenticated, getGoogleSheetsToken } from '@/services/googleSheets'
import { getAllCustomStandards } from '@/firebase/standardsServices'
import type { Assessment, AssessmentResult, AssessmentQuestion } from '@/types/iep'
import type { Student } from '@/types/users'
import type { CustomStandard } from '@/types/standards'

const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const syncing = ref(false)
const sheetsStatus = ref('')
const sheetsUrl = ref('')
const assessments = ref<Assessment[]>([])
const students = ref<Student[]>([])
const assessmentResults = ref<Map<string, AssessmentResult[]>>(new Map())
const selectedCourses = ref<string[]>([])
const spreadsheetId = ref<string | null>(null) // Store single spreadsheet ID for all classes
const exportType = ref<'ESA' | 'SA' | 'BOTH'>('SA') // Default to SA for backward compatibility
const includeTotals = ref(false) // Option to include total standard scores
const customStandards = ref<CustomStandard[]>([]) // Loaded custom standards for maxScore/scoringMethod

// Filter assessments based on selected export type
const filteredAssessments = computed(() => {
  if (exportType.value === 'ESA') {
    return assessments.value.filter(a => a.category === 'ESA')
  } else if (exportType.value === 'SA') {
    return assessments.value.filter(a => a.category === 'SA')
  } else {
    // BOTH - include both ESA and SA
    return assessments.value.filter(a => a.category === 'ESA' || a.category === 'SA')
  }
})

// Keep standardAssessments for backward compatibility (now uses filteredAssessments)
const standardAssessments = computed(() => filteredAssessments.value)

// Get unique courses from students (more accurate than period alone)
const availableCourses = computed(() => {
  const coursesMap = new Map<string, { courseId: string; label: string }>()
  
  students.value.forEach(student => {
    const courseId = student.courseId
    if (courseId) {
      // Build a label using courseName and section/period
      const courseName = student.courseName || student.className || 'Unknown Course'
      const period = (student.section || student.period || '').trim()
      const label = period ? `${period} - ${courseName}` : courseName
      
      if (!coursesMap.has(courseId)) {
        coursesMap.set(courseId, { courseId, label })
      }
    }
  })
  
  return Array.from(coursesMap.values()).sort((a, b) => a.label.localeCompare(b.label))
})

// Total students in selected courses
const totalStudents = computed(() => {
  if (selectedCourses.value.length === 0) return 0
  return students.value.filter(s => 
    s.courseId && selectedCourses.value.includes(s.courseId)
  ).length
})

// Load data
const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    // Load assessments and students based on role
    if (authStore.isAdmin) {
      [assessments.value, students.value] = await Promise.all([
        getAllAssessments(),
        getAllStudents()
      ])
    } else if (authStore.isTeacher) {
      [assessments.value, students.value] = await Promise.all([
        getAllAssessments(), // Teachers can see all assessments
        getStudentsByTeacher(authStore.currentUser!.uid)
      ])
    } else {
      error.value = 'Only teachers and admins can export assessments'
      return
    }

    // Load assessment results for all students
    await loadAssessmentResults()
    
    // Load custom standards for maxScore and scoringMethod data
    try {
      customStandards.value = await getAllCustomStandards()
      console.log(`✅ Loaded ${customStandards.value.length} custom standards`)
    } catch (err) {
      console.warn('⚠️ Could not load custom standards:', err)
      customStandards.value = []
    }

    // Auto-select all courses
    selectAllCourses()
  } catch (err) {
    console.error('Error loading data:', err)
    error.value = 'Failed to load data. Please try again.'
  } finally {
    loading.value = false
  }
}

// Load assessment results for all students - optimized to query by category
const loadAssessmentResults = async () => {
  const resultsMap = new Map<string, AssessmentResult[]>()
  
  // Determine which categories to load based on export type
  const categoriesToLoad: string[] = []
  if (exportType.value === 'ESA' || exportType.value === 'BOTH') {
    categoriesToLoad.push('ESA')
  }
  if (exportType.value === 'SA' || exportType.value === 'BOTH') {
    categoriesToLoad.push('SA')
  }
  
  // Try to use optimized query by assessmentCategory if available
  try {
    console.log(`📊 Loading ${categoriesToLoad.join(' and ')} assessment results using category field...`)
    
    // Import query functions dynamically
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/firebase/config')
    
    // Build query for selected categories
    let resultsQuery
    if (categoriesToLoad.length === 1) {
      // Single category
      resultsQuery = query(
        collection(db, 'assessmentResults'),
        where('assessmentCategory', '==', categoriesToLoad[0])
      )
    } else {
      // Multiple categories - use 'in' operator (Firestore supports up to 10 values)
      resultsQuery = query(
        collection(db, 'assessmentResults'),
        where('assessmentCategory', 'in', categoriesToLoad)
      )
    }
    
    const resultsSnapshot = await getDocs(resultsQuery)
    console.log(`✅ Found ${resultsSnapshot.size} ${categoriesToLoad.join(' and ')} results using category field`)
    
    // Group results by student
    resultsSnapshot.docs.forEach(doc => {
      const result = { id: doc.id, ...doc.data() } as AssessmentResult
      const studentUid = result.studentUid
      
      if (!resultsMap.has(studentUid)) {
        resultsMap.set(studentUid, [])
      }
      resultsMap.get(studentUid)!.push(result)
    })
    
    // Ensure all students have an entry (even if empty)
    students.value.forEach(student => {
      if (!resultsMap.has(student.uid)) {
        resultsMap.set(student.uid, [])
      }
    })
    
    console.log(`📊 Loaded results for ${resultsMap.size} students`)
    
  } catch (err) {
    // Fallback to old method if category field doesn't exist yet
    console.warn('⚠️ Could not query by category field (may not exist yet), falling back to per-student queries:', err)
    
    for (const student of students.value) {
      try {
        const results = await getAssessmentResultsByStudent(student.uid)
        // Filter to selected categories
        const filteredResults = results.filter(r => {
          const assessment = assessments.value.find(a => a.id === r.assessmentId)
          return assessment && categoriesToLoad.includes(assessment.category)
        })
        resultsMap.set(student.uid, filteredResults)
      } catch (error) {
        console.warn(`Error loading results for student ${student.uid}:`, error)
        resultsMap.set(student.uid, [])
      }
    }
  }
  
  assessmentResults.value = resultsMap
}

// Course selection
const toggleCourse = (courseId: string) => {
  const index = selectedCourses.value.indexOf(courseId)
  if (index > -1) {
    selectedCourses.value.splice(index, 1)
  } else {
    selectedCourses.value.push(courseId)
  }
}

const selectAllCourses = () => {
  selectedCourses.value = availableCourses.value.map(c => c.courseId)
}

// Get all unique standards from assessments
const getAllStandards = (): string[] => {
  const standardsSet = new Set<string>()
  
  standardAssessments.value.forEach(assessment => {
    // Add assessment-level standards
    const assessmentStandards = parseStandards(assessment.standard)
    assessmentStandards.forEach(std => standardsSet.add(std))
    
    // Add question-level standards
    assessment.questions?.forEach(question => {
      const standards = parseStandards(question.standard)
      standards.forEach(std => standardsSet.add(std))
    })
  })
  
  return Array.from(standardsSet).sort()
}

// Get standard score for a student (similar to gradebook logic)
const getStandardScoreForStudent = (
  student: Student,
  standard: string
): { correct: number; total: number; percentage: number } => {
  const customStd = getCustomStandardByCode(standard)
  const maxScore = customStd?.maxScore
  const scoringMethod = customStd?.scoringMethod || 'additive'
  
  // Collect all question attempts for this standard across all assessments
  const questionAttempts: { isCorrect: boolean; score: number }[] = []
  
  const studentResults = assessmentResults.value.get(student.uid) || []
  
  filteredAssessments.value.forEach(assessment => {
    const result = studentResults.find(r => r.assessmentId === assessment.id)
    if (!result || !result.responses) return
    
    // Check if assessment-level standard matches
    const assessmentStandards = parseStandards(assessment.standard)
    const assessmentCoversStandard = assessmentStandards.includes(standard)
    
    assessment.questions?.forEach(question => {
      // Check if question covers this standard
      const questionStandards = parseStandards(question.standard)
      const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard
      
      if (questionCoversStandard) {
        const response = result.responses.find(r => r.questionId === question.id)
        if (response) {
          questionAttempts.push({
            isCorrect: !!(response.isCorrect || (response.pointsEarned && response.pointsEarned > 0)),
            score: response.pointsEarned || (response.isCorrect ? question.points : 0)
          })
        }
      }
    })
  })
  
  if (questionAttempts.length === 0) {
    return { correct: 0, total: 0, percentage: 0 }
  }
  
  let correct = 0
  let total = 0
  let percentage = 0
  
  if (scoringMethod === 'keepTop') {
    // Keep Top Score: Take highest scoring attempts up to maxScore
    questionAttempts.sort((a, b) => b.score - a.score)
    const limitedAttempts = maxScore && maxScore > 0 ? 
      questionAttempts.slice(0, maxScore) : 
      questionAttempts
    
    correct = limitedAttempts.filter(attempt => attempt.isCorrect).length
    total = limitedAttempts.length
    percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    
  } else if (scoringMethod === 'average') {
    // Average Scores: Calculate average percentage across all attempts
    if (questionAttempts.length > 0) {
      const attemptPercentages = questionAttempts.map(attempt => 
        attempt.isCorrect ? 100 : 0
      )
      percentage = Math.round(
        attemptPercentages.reduce((sum: number, pct: number) => sum + pct, 0) / attemptPercentages.length
      )
      correct = Math.round((percentage / 100) * questionAttempts.length)
      total = questionAttempts.length
      
      // If maxScore is set, use it as the denominator
      if (maxScore && maxScore > 0) {
        correct = Math.round((percentage / 100) * maxScore)
        total = maxScore
      }
    }
    
  } else {
    // Additive (default): All attempts count, maxScore caps denominator
    questionAttempts.sort((a, b) => b.score - a.score)
    const limitedAttempts = maxScore && maxScore > 0 ? 
      questionAttempts.slice(0, maxScore) : 
      questionAttempts
    
    correct = limitedAttempts.filter(attempt => attempt.isCorrect).length
    total = limitedAttempts.length
    percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  }
  
  return { correct, total, percentage }
}

// Calculate student's overall standards mastery (average across all standards)
const getStudentStandardsAverage = (student: Student): number => {
  const uniqueStandards = getAllStandards()
  const standardMasteries: number[] = []
  
  uniqueStandards.forEach(standard => {
    const customStd = getCustomStandardByCode(standard)
    const scoreData = getStandardScoreForStudent(student, standard)
    
    if (scoreData.total > 0) {
      let mastery: number
      
      if (customStd?.maxScore && customStd.maxScore > 0) {
        // If maxScore is set, calculate mastery as (correct / maxScore) * 100
        mastery = Math.min(100, Math.round((scoreData.correct / customStd.maxScore) * 100))
      } else {
        // If no maxScore set, use regular percentage
        mastery = scoreData.percentage
      }
      
      standardMasteries.push(mastery)
    }
  })
  
  if (standardMasteries.length === 0) return 0
  
  const total = standardMasteries.reduce((sum, mastery) => sum + mastery, 0)
  return Math.round(total / standardMasteries.length)
}

// Get custom standard metadata by code
const getCustomStandardByCode = (standardCode: string): CustomStandard | null => {
  if (!standardCode) return null
  
  // Remove CUSTOM: prefix if present
  const cleanCode = standardCode.startsWith('CUSTOM:') ? 
    standardCode.replace('CUSTOM:', '') : standardCode
  
  return customStandards.value.find(std => std.code === cleanCode) || null
}

// Get score for a student/assessment/standard combination
// Returns a string in format "correct/total" (e.g., "2/4" or "0/1")
const getScoreForStandard = (
  student: Student,
  assessment: Assessment,
  standard: string
): string | null => {
  const results = assessmentResults.value.get(student.uid) || []
  const result = results.find(r => r.assessmentId === assessment.id)
  
  if (!result || !result.responses) return null
  
  // Check if assessment-level standard matches
  const assessmentStandards = parseStandards(assessment.standard)
  const assessmentCoversStandard = assessmentStandards.includes(standard)
  
  // Find questions that match this standard (either question-level or assessment-level)
  const matchingQuestions = assessment.questions?.filter(q => {
    const questionStandards = parseStandards(q.standard)
    return questionStandards.includes(standard) || assessmentCoversStandard
  }) || []
  
  if (matchingQuestions.length === 0) return null
  
  // Count correct answers and total questions
  let correct = 0
  let total = matchingQuestions.length
  
  matchingQuestions.forEach(question => {
    const response = result.responses.find(r => r.questionId === question.id)
    if (response) {
      // Count as correct if isCorrect is true or if pointsEarned > 0
      if (response.isCorrect || (response.pointsEarned && response.pointsEarned > 0)) {
        correct++
      }
    }
  })
  
  return `${correct}/${total}`
}

// Calculate total standard score for a student across all assessments
// Respects maxScore and scoringMethod (additive, keepTop, average)
const getTotalStandardScore = (
  student: Student,
  standard: string,
  assessments: Assessment[]
): string | null => {
  const customStd = getCustomStandardByCode(standard)
  const maxScore = customStd?.maxScore
  const scoringMethod = customStd?.scoringMethod || 'additive'
  
  // Collect all question attempts for this standard across all assessments
  const questionAttempts: { isCorrect: boolean; score: number }[] = []
  
  const studentResults = assessmentResults.value.get(student.uid) || []
  
  assessments.forEach(assessment => {
    const result = studentResults.find(r => r.assessmentId === assessment.id)
    if (!result || !result.responses) return
    
    // Check if assessment-level standard matches
    const assessmentStandards = parseStandards(assessment.standard)
    const assessmentCoversStandard = assessmentStandards.includes(standard)
    
    assessment.questions?.forEach(question => {
      // Check if question covers this standard
      const questionStandards = parseStandards(question.standard)
      const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard
      
      if (questionCoversStandard) {
        const response = result.responses.find(r => r.questionId === question.id)
        if (response) {
          questionAttempts.push({
            isCorrect: !!(response.isCorrect || (response.pointsEarned && response.pointsEarned > 0)),
            score: response.pointsEarned || (response.isCorrect ? question.points : 0)
          })
        }
      }
    })
  })
  
  if (questionAttempts.length === 0) return null
  
  let correct = 0
  let total = 0
  
  if (scoringMethod === 'keepTop') {
    // Keep Top Score: Show the BEST performance out of maxScore possible
    questionAttempts.sort((a, b) => b.score - a.score)
    
    if (maxScore && maxScore > 0) {
      // Take top maxScore questions (best performance)
      const topAttempts = questionAttempts.slice(0, maxScore)
      correct = topAttempts.filter(attempt => attempt.isCorrect).length
      total = maxScore  // Use maxScore as fixed denominator
    } else {
      // No max score set - use all attempts
      correct = questionAttempts.filter(attempt => attempt.isCorrect).length
      total = questionAttempts.length
    }
    
  } else if (scoringMethod === 'average') {
    // Average Scores: Calculate average percentage across all attempts
    if (questionAttempts.length > 0) {
      const attemptPercentages = questionAttempts.map(attempt => 
        attempt.isCorrect ? 100 : 0
      )
      const percentage = Math.round(
        attemptPercentages.reduce((sum: number, pct: number) => sum + pct, 0) / attemptPercentages.length
      )
      correct = Math.round((percentage / 100) * questionAttempts.length)
      total = questionAttempts.length
      
      // If maxScore is set, use it as the denominator
      if (maxScore && maxScore > 0) {
        correct = Math.round((percentage / 100) * maxScore)
        total = maxScore
      }
    }
    
  } else {
    // Additive (default): All attempts count, maxScore caps denominator
    questionAttempts.sort((a, b) => b.score - a.score)
    const limitedAttempts = maxScore && maxScore > 0 ? 
      questionAttempts.slice(0, maxScore) : 
      questionAttempts
    
    correct = limitedAttempts.filter(attempt => attempt.isCorrect).length
    total = limitedAttempts.length
  }
  
  return total > 0 ? `${correct}/${total}` : null
}

// Watch export type changes and reload results
watch(exportType, async () => {
  if (assessments.value.length > 0) {
    await loadAssessmentResults()
  }
})

// Export by Standard (Gradebook Format)
const exportByStandard = () => {
  try {
    const coursesToExport = selectedCourses.value.length > 0 
      ? selectedCourses.value 
      : availableCourses.value.map(c => c.courseId)
    
    const exportTypeLabel = exportType.value === 'ESA' ? 'Essential_Standards' 
      : exportType.value === 'SA' ? 'Standard_Assessments' 
      : 'Assessments'
    
    coursesToExport.forEach(courseId => {
      const csvContent = generateCSVByStandard(courseId)
      const courseInfo = availableCourses.value.find(c => c.courseId === courseId)
      const courseLabel = courseInfo?.label || courseId
      const filename = `${exportTypeLabel}_By_Standard_${courseLabel.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csvContent, filename)
    })
    
    alert(`Successfully exported ${coursesToExport.length} class(es) by standard!`)
  } catch (err) {
    console.error('Error exporting by standard:', err)
    error.value = 'Failed to export by standard. Please try again.'
  }
}

// Generate CSV by Standard (Gradebook Format)
const generateCSVByStandard = (courseId: string): string => {
  const courseStudents = students.value
    .filter(s => s.courseId === courseId)
    .sort((a, b) => {
      const aLast = (a.lastName || '').toLowerCase()
      const bLast = (b.lastName || '').toLowerCase()
      if (aLast !== bLast) return aLast.localeCompare(bLast)
      const aFirst = (a.firstName || '').toLowerCase()
      const bFirst = (b.firstName || '').toLowerCase()
      return aFirst.localeCompare(bFirst)
    })
  
  const courseInfo = availableCourses.value.find(c => c.courseId === courseId)
  const courseLabel = courseInfo?.label || courseId
  
  const uniqueStandards = getAllStandards()
  
  // Build CSV rows
  const csvRows: string[][] = []
  
  // Header: Course name and student count
  csvRows.push([courseLabel])
  csvRows.push([`${courseStudents.length} students`])
  csvRows.push([]) // Empty row
  
  // Header row 1: Student, then standard codes, then "Standard Mastery"
  const headerRow1: string[] = ['Student']
  uniqueStandards.forEach(std => {
    headerRow1.push(std)
  })
  headerRow1.push('Standard Mastery')
  csvRows.push(headerRow1)
  
  // Header row 2: Empty for Student, then "Correct/Total" for each standard, then empty
  const headerRow2: string[] = ['']
  uniqueStandards.forEach(() => {
    headerRow2.push('Correct/Total')
  })
  headerRow2.push('')
  csvRows.push(headerRow2)
  
  // Data rows: Each student takes 2 rows
  // Row 1: Student name, then correct/total for each standard, then overall mastery %
  // Row 2: Student email, then percentage for each standard, then empty
  courseStudents.forEach(student => {
    // Row 1: Name and correct/total scores
    const nameRow: string[] = []
    nameRow.push(`${student.lastName || ''}, ${student.firstName || ''}`)
    
    // Standard scores (correct/total)
    uniqueStandards.forEach(standard => {
      const scoreData = getStandardScoreForStudent(student, standard)
      if (scoreData.total > 0) {
        nameRow.push(`${scoreData.correct}/${scoreData.total}`)
      } else {
        nameRow.push('0/0')
      }
    })
    
    // Overall Standard Mastery
    const overallMastery = getStudentStandardsAverage(student)
    nameRow.push(`${overallMastery}%`)
    
    csvRows.push(nameRow)
    
    // Row 2: Email and percentages
    const emailRow: string[] = []
    emailRow.push(student.email || '')
    
    // Standard percentages
    uniqueStandards.forEach(standard => {
      const scoreData = getStandardScoreForStudent(student, standard)
      if (scoreData.total > 0) {
        emailRow.push(`${scoreData.percentage}%`)
      } else {
        emailRow.push('0%')
      }
    })
    
    // Empty for mastery column
    emailRow.push('')
    
    csvRows.push(emailRow)
  })
  
  // Empty row
  csvRows.push([])
  
  // Summary statistics row
  const standardsCovered = uniqueStandards.length
  const allMasteries: number[] = []
  courseStudents.forEach(student => {
    const mastery = getStudentStandardsAverage(student)
    if (mastery > 0) {
      allMasteries.push(mastery)
    }
  })
  const avgMastery = allMasteries.length > 0 
    ? Math.round(allMasteries.reduce((sum, m) => sum + m, 0) / allMasteries.length)
    : 0
  const studentsAbove80 = courseStudents.filter(student => 
    getStudentStandardsAverage(student) >= 80
  ).length
  
  csvRows.push(['Standards Covered:', standardsCovered.toString()])
  csvRows.push(['Avg Mastery:', `${avgMastery}%`])
  csvRows.push(['Students Above 80%:', studentsAbove80.toString()])
  
  // Convert to CSV string
  return csvRows.map(row => 
    row.map(cell => {
      // Handle cells with newlines (student name/email, correct/total with percentage)
      const hasNewline = cell.includes('\n')
      const isFraction = /^\d+\/\d+$/.test(cell.split('\n')[0])
      
      if (cell.includes(',') || cell.includes('"') || hasNewline || isFraction) {
        return `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }).join(',')
  ).join('\n')
}

// Export to CSV
const exportToCSV = () => {
  try {
    const allStandards = getAllStandards()
    const coursesToExport = selectedCourses.value.length > 0 
      ? selectedCourses.value 
      : availableCourses.value.map(c => c.courseId)
    
    // Create CSV for each course
    const exportTypeLabel = exportType.value === 'ESA' ? 'Essential_Standards' 
      : exportType.value === 'SA' ? 'Standard_Assessments' 
      : 'Assessments'
    
    coursesToExport.forEach(courseId => {
      const courseInfo = availableCourses.value.find(c => c.courseId === courseId)
      const csv = generateCSVForCourse(courseId, allStandards)
      const courseLabel = courseInfo?.label || courseId
      const filename = `${exportTypeLabel}_${courseLabel.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csv, filename)
    })
    
    alert(`Successfully exported ${coursesToExport.length} class(es)!`)
  } catch (err) {
    console.error('Error exporting CSV:', err)
    error.value = 'Failed to export CSV. Please try again.'
  }
}

// Generate CSV for a specific course (identified by courseId)
const generateCSVForCourse = (courseId: string, allStandards: string[]): string => {
  const courseStudents = students.value
    .filter(s => s.courseId === courseId)
    .sort((a, b) => {
      // Sort by last name, then first name
      const aLast = (a.lastName || '').toLowerCase()
      const bLast = (b.lastName || '').toLowerCase()
      if (aLast !== bLast) return aLast.localeCompare(bLast)
      const aFirst = (a.firstName || '').toLowerCase()
      const bFirst = (b.firstName || '').toLowerCase()
      return aFirst.localeCompare(bFirst)
    })
  
  const periodAssessments = standardAssessments.value
  
  // Get unique standards across all assessments
  const uniqueStandards = getAllStandards()
  
  // Build header row 1: Assessment names with empty cells
  const headerRow1: string[] = ['', ''] // Last Name, First Name columns
  
  periodAssessments.forEach((assessment, index) => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    const testNumber = index + 1
    const totalTests = periodAssessments.length
    
    // Add assessment name for first column of this assessment
    headerRow1.push(`${assessment.title} (${testNumber}/${totalTests})`)
    // Add empty cells for remaining standards
    for (let i = 1; i < assessmentStandards.length; i++) {
      headerRow1.push('')
    }
  })
  
  // Add "Total" columns if includeTotals is enabled
  if (includeTotals.value) {
    uniqueStandards.forEach(() => {
      headerRow1.push('Total')
    })
  }
  
  // Build header row 2: Standard names
  const headerRow2: string[] = ['Last Name', 'First Name']
  
  periodAssessments.forEach(assessment => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    assessmentStandards.forEach(std => {
      headerRow2.push(std)
    })
  })
  
  // Add "Total" standard names if includeTotals is enabled
  if (includeTotals.value) {
    uniqueStandards.forEach(std => {
      headerRow2.push(`${std} Total`)
    })
  }
  
  // Build data rows
  const dataRows: string[][] = []
  
  courseStudents.forEach(student => {
    const row: string[] = [
      student.lastName || '',
      student.firstName || ''
    ]
    
    periodAssessments.forEach(assessment => {
      const assessmentStandards = getStandardsForAssessment(assessment)
      assessmentStandards.forEach(standard => {
        const score = getScoreForStandard(student, assessment, standard)
        row.push(score !== null ? score : '')
      })
    })
    
    dataRows.push(row)
  })
  
  // Build totals row - for each standard, show maximum possible score (e.g., "4/4" if there are 4 questions)
  const totalsRow: string[] = ['Total', ''] // "Total" label in Last Name column
  
  // Create a map to track maximum possible score (total questions) for each standard
  const standardMaxTotals = new Map<string, number>()
  
  periodAssessments.forEach(assessment => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    const assessmentLevelStandards = parseStandards(assessment.standard)
    
    assessmentStandards.forEach(standard => {
      // Check if assessment-level standard matches
      const assessmentCoversStandard = assessmentLevelStandards.includes(standard)
      
      // Find the maximum number of questions for this standard in this assessment
      // Include questions that match either question-level or assessment-level standards
      const matchingQuestions = assessment.questions?.filter(q => {
        const questionStandards = parseStandards(q.standard)
        return questionStandards.includes(standard) || assessmentCoversStandard
      }) || []
      
      const totalQuestions = matchingQuestions.length
      if (totalQuestions > 0) {
        const currentMax = standardMaxTotals.get(standard) || 0
        standardMaxTotals.set(standard, Math.max(currentMax, totalQuestions))
      }
    })
  })
  
  // Build totals row columns in order of appearance (assessment columns)
  periodAssessments.forEach(assessment => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    assessmentStandards.forEach(standard => {
      const maxTotal = standardMaxTotals.get(standard) || 0
      // Show max possible score like "4/4" if there are 4 questions
      totalsRow.push(maxTotal > 0 ? `${maxTotal}/${maxTotal}` : '')
    })
  })
  
  // Add total column max scores if includeTotals is enabled
  if (includeTotals.value) {
    uniqueStandards.forEach(standard => {
      const customStd = getCustomStandardByCode(standard)
      const maxScore = customStd?.maxScore
      
      if (maxScore && maxScore > 0) {
        // Use maxScore from standard configuration
        totalsRow.push(`${maxScore}/${maxScore}`)
      } else {
        // Use calculated max from all assessments
        const maxTotal = standardMaxTotals.get(standard) || 0
        totalsRow.push(maxTotal > 0 ? `${maxTotal}/${maxTotal}` : '')
      }
    })
  }
  
  // Combine all rows including totals row
  const csvRows = [
    headerRow1,
    headerRow2,
    ...dataRows,
    totalsRow
  ]
  
  // Convert to CSV string
  return csvRows.map(row => 
    row.map(cell => {
      // Always wrap fraction strings (like "2/4") in quotes to prevent Excel from interpreting them as dates
      const isFraction = /^\d+\/\d+$/.test(cell)
      
      // Escape commas, quotes, newlines, or fractions
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || isFraction) {
        return `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }).join(',')
  ).join('\n')
}

// Get standards for a specific assessment (includes both assessment-level and question-level standards)
const getStandardsForAssessment = (assessment: Assessment): string[] => {
  const standardsSet = new Set<string>()
  
  // Add assessment-level standards
  const assessmentStandards = parseStandards(assessment.standard)
  assessmentStandards.forEach(std => standardsSet.add(std))
  
  // Add question-level standards
  assessment.questions?.forEach(question => {
    const standards = parseStandards(question.standard)
    standards.forEach(std => standardsSet.add(std))
  })
  
  return Array.from(standardsSet).sort()
}

// Download CSV file
const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Sync to Google Sheets - all classes in one spreadsheet with separate tabs
const syncToGoogleSheets = async () => {
  try {
    syncing.value = true
    sheetsStatus.value = ''
    sheetsUrl.value = ''
    error.value = ''

    // Check if authenticated
    let token = getGoogleSheetsToken()
    if (!token || !isGoogleSheetsAuthenticated()) {
      // Authenticate first
      sheetsStatus.value = 'Authenticating with Google...'
      token = await googleSheetsService.authenticate()
    } else {
      googleSheetsService.setAccessToken(token)
    }

    const coursesToExport = selectedCourses.value.length > 0 
      ? selectedCourses.value 
      : availableCourses.value.map(c => c.courseId)
    
    const allStandards = getAllStandards()
    const results: string[] = []

    // Get or create the main spreadsheet
    let mainSpreadsheetId = spreadsheetId.value
    
    if (!mainSpreadsheetId) {
      // Check localStorage for stored ID
      const storedId = localStorage.getItem('sheets_spreadsheet_id')
      if (storedId) {
        mainSpreadsheetId = storedId
        spreadsheetId.value = storedId
      }
    }

    // Create spreadsheet if it doesn't exist
          const spreadsheetTitle = exportType.value === 'ESA' ? 'Essential Standards'
            : exportType.value === 'SA' ? 'Standard Assessments'
            : 'Assessments'
          
          if (!mainSpreadsheetId) {
            sheetsStatus.value = 'Creating Google Sheet...'
            const sheet = await googleSheetsService.createSpreadsheet(spreadsheetTitle)
            mainSpreadsheetId = sheet.spreadsheetId
            spreadsheetId.value = mainSpreadsheetId
            localStorage.setItem('sheets_spreadsheet_id', mainSpreadsheetId)
            sheetsUrl.value = sheet.url
          } else {
            sheetsStatus.value = 'Updating Google Sheet...'
            sheetsUrl.value = `https://docs.google.com/spreadsheets/d/${mainSpreadsheetId}`
          }

    // Sync each course to its own tab in the same spreadsheet
    for (const courseId of coursesToExport) {
      try {
        const courseInfo = availableCourses.value.find(c => c.courseId === courseId)
        const courseLabel = courseInfo?.label || courseId
        
        // Generate CSV data for this course
        const csvData = generateCSVDataForCourse(courseId, allStandards)
        
        // Use course label as tab name (sanitize for Google Sheets - max 100 chars, no special chars)
        const tabName = courseLabel
          .replace(/[\\\/\?\*\[\]]/g, '_') // Replace invalid chars
          .substring(0, 100) // Max 100 characters
        
        sheetsStatus.value = `Updating tab "${tabName}"...`
        
        // Update the tab with data (will create tab if it doesn't exist)
        await googleSheetsService.updateSpreadsheet(mainSpreadsheetId, tabName, csvData)
        
        results.push(`✅ ${courseLabel}`)
      } catch (courseError: any) {
        console.error(`Error syncing course ${courseId}:`, courseError)
        const errorCourseInfo = availableCourses.value.find(c => c.courseId === courseId)
        results.push(`❌ ${errorCourseInfo?.label || courseId}: ${courseError.message}`)
      }
    }

    if (results.length > 0) {
      const successCount = results.filter(r => r.startsWith('✅')).length
      sheetsStatus.value = `Successfully synced ${successCount} class(es) to Google Sheets!\n\n${results.join('\n')}\n\n📊 Sheet: ${sheetsUrl.value}`
    }
  } catch (err: any) {
    console.error('Error syncing to Google Sheets:', err)
    error.value = `Failed to sync to Google Sheets: ${err.message || 'Unknown error'}`
    sheetsStatus.value = `Error: ${err.message || 'Unknown error'}`
  } finally {
    syncing.value = false
  }
}

// Generate CSV data as 2D array for Google Sheets
const generateCSVDataForCourse = (courseId: string, allStandards: string[]): string[][] => {
  const courseStudents = students.value
    .filter(s => s.courseId === courseId)
    .sort((a, b) => {
      const aLast = (a.lastName || '').toLowerCase()
      const bLast = (b.lastName || '').toLowerCase()
      if (aLast !== bLast) return aLast.localeCompare(bLast)
      const aFirst = (a.firstName || '').toLowerCase()
      const bFirst = (b.firstName || '').toLowerCase()
      return aFirst.localeCompare(bFirst)
    })
  
  const periodAssessments = standardAssessments.value
  
  // Get unique standards across all assessments
  const uniqueStandards = getAllStandards()
  
  // Build header row 1: Assessment names
  const headerRow1: string[] = ['', '']
  
  periodAssessments.forEach((assessment, index) => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    const testNumber = index + 1
    const totalTests = periodAssessments.length
    
    headerRow1.push(`${assessment.title} (${testNumber}/${totalTests})`)
    for (let i = 1; i < assessmentStandards.length; i++) {
      headerRow1.push('')
    }
  })
  
  // Add "Total" columns if includeTotals is enabled
  if (includeTotals.value) {
    uniqueStandards.forEach(() => {
      headerRow1.push('Total')
    })
  }
  
  // Build header row 2: Standard names
  const headerRow2: string[] = ['Last Name', 'First Name']
  
  periodAssessments.forEach(assessment => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    assessmentStandards.forEach(std => {
      headerRow2.push(std)
    })
  })
  
  // Add "Total" standard names if includeTotals is enabled
  if (includeTotals.value) {
    uniqueStandards.forEach((std: string) => {
      headerRow2.push(`${std} Total`)
    })
  }
  
  // Build data rows
  const dataRows: string[][] = []
  
  courseStudents.forEach(student => {
    const row: string[] = [
      student.lastName || '',
      student.firstName || ''
    ]
    
    // Add assessment scores
    periodAssessments.forEach(assessment => {
      const assessmentStandards = getStandardsForAssessment(assessment)
      assessmentStandards.forEach(standard => {
        const score = getScoreForStandard(student, assessment, standard)
        row.push(score !== null ? score : '')
      })
    })
    
    // Add total scores if enabled
    if (includeTotals.value) {
      uniqueStandards.forEach(standard => {
        const totalScore = getTotalStandardScore(student, standard, periodAssessments)
        row.push(totalScore !== null ? totalScore : '')
      })
    }
    
    dataRows.push(row)
  })
  
  // Build totals row
  const totalsRow: string[] = ['Total', '']
  
  const standardMaxTotals = new Map<string, number>()
  
  periodAssessments.forEach(assessment => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    const assessmentLevelStandards = parseStandards(assessment.standard)
    
    assessmentStandards.forEach(standard => {
      const assessmentCoversStandard = assessmentLevelStandards.includes(standard)
      
      const matchingQuestions = assessment.questions?.filter(q => {
        const questionStandards = parseStandards(q.standard)
        return questionStandards.includes(standard) || assessmentCoversStandard
      }) || []
      
      const totalQuestions = matchingQuestions.length
      if (totalQuestions > 0) {
        const currentMax = standardMaxTotals.get(standard) || 0
        standardMaxTotals.set(standard, Math.max(currentMax, totalQuestions))
      }
    })
  })
  
  // Build totals row columns in order of appearance (assessment columns)
  periodAssessments.forEach(assessment => {
    const assessmentStandards = getStandardsForAssessment(assessment)
    assessmentStandards.forEach(standard => {
      const maxTotal = standardMaxTotals.get(standard) || 0
      totalsRow.push(maxTotal > 0 ? `${maxTotal}/${maxTotal}` : '')
    })
  })
  
  // Add total column max scores if includeTotals is enabled
  if (includeTotals.value) {
    uniqueStandards.forEach(standard => {
      const customStd = getCustomStandardByCode(standard)
      const maxScore = customStd?.maxScore
      
      if (maxScore && maxScore > 0) {
        // Use maxScore from standard configuration
        totalsRow.push(`${maxScore}/${maxScore}`)
      } else {
        // Use calculated max from all assessments
        const maxTotal = standardMaxTotals.get(standard) || 0
        totalsRow.push(maxTotal > 0 ? `${maxTotal}/${maxTotal}` : '')
      }
    })
  }
  
  return [headerRow1, headerRow2, ...dataRows, totalsRow]
}

onMounted(async () => {
  await loadData()
  
  // Load stored spreadsheet ID from localStorage
  const storedId = localStorage.getItem('sheets_spreadsheet_id')
  if (storedId) {
    spreadsheetId.value = storedId
    sheetsUrl.value = `https://docs.google.com/spreadsheets/d/${storedId}`
  }
})
</script>

<style scoped>
.standard-assessment-export-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.export-header {
  margin-bottom: 2rem;
}

.export-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  margin: 0;
}

.loading-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.export-content {
  margin-top: 2rem;
}

.period-selection {
  margin-bottom: 2rem;
}

.period-selection h3 {
  margin-bottom: 1rem;
  color: #333;
}

.period-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.period-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.period-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.export-type-selection {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.export-type-selection h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
}

.export-type-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.export-type-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.export-type-btn:hover {
  background: #e7f3ff;
  border-color: #0056b3;
  color: #0056b3;
}

.export-type-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

.include-totals-option {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007bff;
}

.include-totals-option .help-text {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

.summary-section {
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.summary-section h3 {
  margin-top: 0;
  color: #333;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.export-actions {
  margin-top: 2rem;
}

.export-btn {
  padding: 0.75rem 2rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.export-btn:hover:not(:disabled) {
  background: #218838;
}

.export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
}

.standard-export-btn {
  background: #6f42c1;
}

.standard-export-btn:hover:not(:disabled) {
  background: #5a32a3;
}

.sheets-btn {
  background: #1a73e8;
  margin-left: 1rem;
}

.sheets-btn:hover:not(:disabled) {
  background: #1557b0;
}

.sheets-status {
  margin-top: 1rem;
  padding: 1rem;
  background: #d4edda;
  color: #155724;
  border-radius: 4px;
  white-space: pre-line;
}

.sheets-status.error {
  background: #f8d7da;
  color: #721c24;
}

.sheets-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #1a73e8;
  text-decoration: none;
  font-weight: bold;
}

.sheets-link:hover {
  text-decoration: underline;
}
</style>
