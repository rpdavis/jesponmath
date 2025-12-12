<template>
  <div class="fluency-dashboard-container">
    <!-- Header -->
    <div class="dashboard-header">
      <h2>📊 Math Fluency Dashboard</h2>
      <p class="subtitle">Class-wide fluency monitoring and management</p>

      <!-- Debug/Admin Tools (Small links at top) -->
      <div class="debug-links">
        <router-link to="/fluency/cpm-report" class="debug-link">
          📊 CPM Report
        </router-link>
        <span class="link-separator">|</span>
        <router-link to="/fluency/acceleration-simulator" class="debug-link">
          🧪 Simulator
        </router-link>
        <span class="link-separator">|</span>
        <router-link to="/fluency/debug-manager" class="debug-link">
          🔬 Debug Mode
        </router-link>
        <span class="link-separator">|</span>
        <router-link to="/fluency/reset-progress" class="debug-link warning-link">
          🔄 Reset Progress
        </router-link>
      </div>
    </div>

    <!-- Quick Actions - MOVED TO TOP -->
    <div class="quick-actions-card">
      <h3>Quick Actions</h3>
      <div class="actions-grid">
        <button @click="router.push('/fluency/paper-assessment')" class="action-card featured">
          <div class="action-icon">📄</div>
          <div class="action-text">Generate Probes</div>
          <div class="action-subtitle">Create weekly 1-min PDFs</div>
        </button>
        <button @click="router.push('/fluency/score-entry')" class="action-card featured">
          <div class="action-icon">✍️</div>
          <div class="action-text">Enter Scores</div>
          <div class="action-subtitle">Score paper assessments</div>
        </button>
      </div>
    </div>

    <!-- Operation Selector -->
    <div class="operation-selector">
      <button
        v-for="op in operations"
        :key="op.value"
        @click="selectedOperation = op.value"
        :class="['op-btn', { active: selectedOperation === op.value }]"
      >
        {{ op.icon }} {{ op.label }}
        <span v-if="getOperationCounts(op.value).total > 0" class="op-count-badge">
          {{ getOperationCounts(op.value).started }}/{{ getOperationCounts(op.value).total }}
        </span>
      </button>
    </div>

    <!-- Class Overview Card -->
    <div class="overview-card">
      <h3>Class Overview - {{ capitalizeOperation(selectedOperation) }}</h3>

      <div class="class-stats-grid">
        <div class="class-stat">
          <div class="stat-icon">🎓</div>
          <div class="stat-content">
            <div class="stat-value">{{ classOverview.students.length }}</div>
            <div class="stat-label">Total Students</div>
          </div>
        </div>

        <div class="class-stat">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ classOverview.classAverage }}%</div>
            <div class="stat-label">Avg Proficiency</div>
          </div>
        </div>

        <div class="class-stat">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ classOverview.readyToUnlock }}</div>
            <div class="stat-label">Ready for Next Op</div>
          </div>
        </div>

        <div class="class-stat alert" v-if="classOverview.needsIntervention > 0">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ classOverview.needsIntervention }}</div>
            <div class="stat-label">Need Support (<50%)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Student List -->
    <div class="students-card">
      <div class="card-header">
        <h3>Student Progress</h3>
        <div class="header-actions">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search students..."
            class="search-input"
          />
          <select v-model="sortBy" class="sort-select">
            <option value="name">Sort by Name</option>
            <option value="proficiency">Sort by Proficiency</option>
            <option value="streak">Sort by Streak</option>
            <option value="lastPractice">Sort by Last Practice</option>
          </select>
        </div>
      </div>

      <div class="students-table">
        <div class="table-header">
          <div class="col-name">Student</div>
          <div class="col-level">Current Level</div>
          <div class="col-proficiency">Level Progress</div>
          <div class="col-streak">Streak</div>
          <div class="col-practice">Last Practice</div>
          <div class="col-actions">Actions</div>
        </div>

        <div
          v-for="student in filteredStudents"
          :key="student.studentUid"
          class="table-row"
          :class="{
            alert: student.hasData && student.proficiency < 50,
            success: student.readyForTest,
            'no-data': !student.hasData
          }"
        >
          <div class="col-name">
            <router-link
              v-if="student.hasData"
              :to="`/fluency/student/${student.studentUid}`"
              class="student-link"
            >
              <strong>{{ student.studentName }}</strong>
            </router-link>
            <strong v-else>{{ student.studentName }}</strong>
            <span v-if="student.inProgress" class="in-progress-badge">⏳ {{ student.progressInfo }}</span>
            <span v-else-if="student.hasAssignment && !student.hasData" class="assigned-badge">📋 Assigned</span>
            <span v-else-if="!student.hasData && !student.hasAssignment" class="no-data-badge">⚠️ Not started</span>
          </div>
          <div class="col-level">
            <div v-if="student.hasData && student.currentSubLevel" class="sublevel-display">
              <div class="sublevel-name">{{ getSubLevelShortName(student.currentSubLevel) }}</div>
              <div class="sublevel-progress-mini">
                {{ student.completedSubLevels || 0 }}/{{ getTotalSubLevels(selectedOperation) }}
              </div>
            </div>
            <span v-else class="no-data-text">—</span>
          </div>
          <div class="col-proficiency">
            <div v-if="student.hasData && student.currentSubLevel" class="proficiency-container">
              <div class="proficiency-bar-mini">
                <div
                  class="proficiency-fill-mini"
                  :style="{ width: `${student.subLevelProficiency}%` }"
                  :class="getProficiencyClass(student.subLevelProficiency)"
                ></div>
              </div>
              <span class="proficiency-text">{{ student.subLevelProficiency }}%</span>
              <span v-if="student.readyForTest" class="ready-badge-mini">✨ Ready!</span>
            </div>
            <span v-else-if="student.hasData" class="proficiency-text">{{ student.proficiency }}%</span>
            <span v-else class="no-data-text">—</span>
          </div>
          <div class="col-streak">
            <span v-if="student.hasData && student.streak > 0" class="streak-badge">
              🔥 {{ student.streak }}
            </span>
            <span v-else class="no-streak">—</span>
          </div>
          <div class="col-practice">
            <span v-if="student.hasData" class="practice-date">{{ formatDate(student.lastPractice) }}</span>
            <span v-else class="no-data-text">—</span>
          </div>
          <div class="col-actions">
            <button v-if="student.hasData" @click="viewStudent(student.studentUid)" class="view-btn">
              View Facts →
            </button>
            <button v-else @click="addToProgram(student.studentUid)" class="add-btn">
              ➕ Add to Program
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getStudentsByTeacher } from '@/firebase/userServices'
import {
  getClassFluencyOverview,
  addStudentToFluencyProgram,
  bulkAddStudentsToFluencyProgram,
  isStudentInFluencyProgram
} from '@/services/mathFluencyServices'
import { getSubLevelConfig, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import type { Student } from '@/types/users'
import type { OperationType, SubLevel } from '@/types/mathFluency'
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(true)
const selectedOperation = ref<OperationType>('addition')
const students = ref<Student[]>([])
const classOverview = ref<any>({
  students: [],
  classAverage: 0,
  readyToUnlock: 0,
  needsIntervention: 0,
  highPerformers: 0
})
const allOperationsData = ref<Map<OperationType, any>>(new Map())
const searchQuery = ref('')
const sortBy = ref('name')
const placementAssignments = ref<Map<string, any>>(new Map()) // studentUid -> assignment data

// Constants
const operations = [
  { value: 'addition' as OperationType, label: 'Addition', icon: '➕' },
  { value: 'subtraction' as OperationType, label: 'Subtraction', icon: '➖' },
  { value: 'multiplication' as OperationType, label: 'Multiplication', icon: '✖️' },
  { value: 'division' as OperationType, label: 'Division', icon: '➗' }
]

// Computed
const filteredStudents = computed(() => {
  let filtered = [...classOverview.value.students]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(s =>
      s.studentName.toLowerCase().includes(query)
    )
  }

  // Sort
  if (sortBy.value === 'name') {
    filtered.sort((a, b) => a.studentName.localeCompare(b.studentName))
  } else if (sortBy.value === 'proficiency') {
    filtered.sort((a, b) => b.proficiency - a.proficiency)
  } else if (sortBy.value === 'streak') {
    filtered.sort((a, b) => b.streak - a.streak)
  } else if (sortBy.value === 'lastPractice') {
    filtered.sort((a, b) => {
      const aTime = a.lastPractice?.toDate?.().getTime() || 0
      const bTime = b.lastPractice?.toDate?.().getTime() || 0
      return bTime - aTime
    })
  }

  return filtered
})

// Methods
function scrollToStudents() {
  // Scroll to student list section
  const studentsCard = document.querySelector('.students-card')
  if (studentsCard) {
    studentsCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(async () => {
  await loadData()
})

watch(selectedOperation, async () => {
  await loadData()
})

async function loadData() {
  loading.value = true

  try {
    // Load teacher's students
    if (authStore.currentUser?.uid) {
      students.value = await getStudentsByTeacher(authStore.currentUser.uid)

      const studentUids = students.value.map(s => s.uid)

      if (studentUids.length > 0) {
        // Load placement diagnostic assignments (batch if > 30 students due to Firestore 'in' limit)
        placementAssignments.value.clear()

        // Batch studentUids into chunks of 30
        const batchSize = 30
        for (let i = 0; i < studentUids.length; i += batchSize) {
          const batch = studentUids.slice(i, i + batchSize)

          const assignmentsQuery = query(
            collection(db, 'diagnosticAssignments'),
            where('diagnosticType', '==', 'math-fluency-placement'),
            where('studentUid', 'in', batch)
          )

          const assignmentsSnapshot = await getDocs(assignmentsQuery)

          assignmentsSnapshot.docs.forEach(doc => {
            const data = doc.data()
            placementAssignments.value.set(data.studentUid, {
              id: doc.id,
              assignedDate: data.assignedDate,
              completed: data.completed || false
            })
          })
        }

        console.log('📋 Loaded placement assignments:', placementAssignments.value.size)

        // Query all in-progress diagnostics for all operations
        const allInProgressQuery = query(
          collection(db, 'mathFluencyDiagnosticProgress'),
          where('inProgress', '==', true)
        )

        const allInProgressSnapshot = await getDocs(allInProgressQuery)

        // Group by operation
        const inProgressByOperation = new Map<OperationType, Map<string, any>>()
        operations.forEach(op => {
          inProgressByOperation.set(op.value, new Map())
        })

        allInProgressSnapshot.docs.forEach(doc => {
          const data = doc.data()
          const op = data.operation as OperationType
          const studentUid = data.studentUid

          if (inProgressByOperation.has(op)) {
            inProgressByOperation.get(op)!.set(studentUid, {
              answersCompleted: data.answersCompleted || 0,
              totalProblems: data.totalProblems || 0,
              lastSaved: data.lastSaved
            })
          }
        })

        // Load overview for ALL operations
        for (const op of operations) {
          try {
            const overview = await getClassFluencyOverview(studentUids, op.value)
            allOperationsData.value.set(op.value, {
              overview,
              inProgress: inProgressByOperation.get(op.value)!
            })
          } catch (error) {
            console.error(`Error loading ${op.value} data:`, error)
          }
        }

        console.log('📊 Loaded data for all operations:', {
          addition: allOperationsData.value.get('addition'),
          subtraction: allOperationsData.value.get('subtraction'),
          multiplication: allOperationsData.value.get('multiplication'),
          division: allOperationsData.value.get('division')
        })

        // Get data for currently selected operation
        const operationData = allOperationsData.value.get(selectedOperation.value)
        if (!operationData) {
          classOverview.value = { students: [], classAverage: 0, readyToUnlock: 0, needsIntervention: 0, highPerformers: 0 }
          loading.value = false
          return
        }

        const overview = operationData.overview
        const inProgressMap = operationData.inProgress
        // Create a student list that includes ALL students
        const allStudentData = students.value.map(student => {
          // Check if student has completed fluency data
          const fluencyData = overview.students.find((s: any) => s.studentUid === student.uid)

          // Check if student has in-progress diagnostic
          const inProgress = inProgressMap.get(student.uid)

          // Check if student has been assigned placement diagnostic
          const assignment = placementAssignments.value.get(student.uid)

          if (fluencyData) {
            // Student has fluency data - extract sub-level info
            const currentSubLevel = fluencyData.currentSubLevel || null
            const subLevelProficiency = currentSubLevel && fluencyData.subLevelProgress?.[currentSubLevel]
              ? fluencyData.subLevelProgress[currentSubLevel].proficiencyPercentage
              : fluencyData.proficiency
            const readyForTest = currentSubLevel && fluencyData.subLevelProgress?.[currentSubLevel]
              ? fluencyData.subLevelProgress[currentSubLevel].readyForAssessment
              : false

            return {
              studentUid: student.uid,
              studentName: `${student.lastName}, ${student.firstName}`,
              proficiency: fluencyData.proficiency,
              mastery: fluencyData.mastery,
              canUnlock: fluencyData.canUnlock,
              lastPractice: fluencyData.lastPractice,
              streak: fluencyData.streak,
              lastCPM: null,
              hasData: true,
              inProgress: false,
              hasAssignment: !!assignment,
              assignmentId: assignment?.id,
              // ⭐ NEW: Sub-level information
              currentSubLevel,
              completedSubLevels: fluencyData.completedSubLevels?.length || 0,
              subLevelProficiency,
              readyForTest
            }
          } else if (inProgress) {
            // Student has started but not finished diagnostic
            return {
              studentUid: student.uid,
              studentName: `${student.lastName}, ${student.firstName}`,
              proficiency: Math.round((inProgress.answersCompleted / inProgress.totalProblems) * 100),
              mastery: 0,
              canUnlock: false,
              lastPractice: inProgress.lastSaved,
              streak: 0,
              lastCPM: null,
              hasData: false,
              inProgress: true,
              progressInfo: `${inProgress.answersCompleted}/${inProgress.totalProblems} completed`,
              hasAssignment: !!assignment,
              assignmentId: assignment?.id
            }
          } else {
            // Student hasn't started
            return {
              studentUid: student.uid,
              studentName: `${student.lastName}, ${student.firstName}`,
              proficiency: 0,
              mastery: 0,
              canUnlock: false,
              lastPractice: null,
              streak: 0,
              lastCPM: null,
              hasData: false,
              inProgress: false,
              hasAssignment: !!assignment,
              assignmentId: assignment?.id,
              assignmentDate: assignment?.assignedDate
            }
          }
        })

        // Update overview with all students
        classOverview.value = {
          students: allStudentData,
          classAverage: overview.classAverage,
          readyToUnlock: overview.readyToUnlock,
          needsIntervention: overview.needsIntervention,
          highPerformers: overview.highPerformers
        }

        const completedCount = allStudentData.filter(s => s.hasData).length
        const inProgressCount = allStudentData.filter(s => s.inProgress).length
        const notStartedCount = allStudentData.filter(s => !s.hasData && !s.inProgress).length
        const assignedCount = allStudentData.filter(s => s.hasAssignment).length

        console.log('📊 Fluency Status:',
          completedCount, 'completed,',
          inProgressCount, 'in progress,',
          notStartedCount, 'not started,',
          assignedCount, 'assigned'
        )

        // Debug: Log students with assignments
        const studentsWithAssignments = allStudentData.filter(s => s.hasAssignment)
        if (studentsWithAssignments.length > 0) {
          console.log('👥 Students with assignments:', studentsWithAssignments.map(s => ({
            name: s.studentName,
            uid: s.studentUid,
            assignmentId: s.assignmentId
          })))
        }
      }
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

function capitalizeOperation(op: OperationType | string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

function getProficiencyClass(proficiency: number): string {
  if (proficiency >= 95) return 'excellent'
  if (proficiency >= 80) return 'good'
  if (proficiency >= 60) return 'fair'
  return 'needs-work'
}

function getCPMClass(cpm: number | null): string {
  if (!cpm) return ''
  if (cpm >= 40) return 'mastered'
  if (cpm >= 30) return 'proficient'
  if (cpm >= 20) return 'developing'
  return 'emerging'
}

function getSubLevelShortName(subLevel: SubLevel): string {
  const config = getSubLevelConfig(subLevel)
  return config ? config.shortName : subLevel.replace(/_/g, ' ')
}

function getTotalSubLevels(operation: OperationType): number {
  return getSubLevelsForOperation(operation).length
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'Never'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function viewStudent(studentUid: string) {
  router.push(`/fluency/student/${studentUid}`)
}

async function addToProgram(studentUid: string) {
  try {
    const student = students.value.find(s => s.uid === studentUid)
    if (!student) return

    // Check if already in program
    const alreadyIn = await isStudentInFluencyProgram(studentUid)
    if (alreadyIn) {
      alert(`${student.firstName} ${student.lastName} is already in the fluency program!`)
      return
    }

    // Add to fluency program (starts at Addition Within 10)
    await addStudentToFluencyProgram(
      studentUid,
      `${student.firstName} ${student.lastName}`,
      authStore.currentUser?.uid || 'system'
    )

    alert(`✅ ${student.firstName} ${student.lastName} added to fluency program!\n\nThey can now start daily practice.`)

    // Reload data
    await loadData()
  } catch (error) {
    console.error('Error adding to program:', error)
    alert('Error adding to program. Please try again.')
  }
}

async function removeFromProgram(studentUid: string) {
  console.log('🔍 Remove from program called:', { studentUid })

  try {
    const student = students.value.find(s => s.uid === studentUid)
    if (!student) {
      console.error('❌ Student not found:', studentUid)
      return
    }

    const confirmRemove = confirm(
      `Remove ${student.firstName} ${student.lastName} from fluency program?\n\n⚠️ This will delete all their progress data. This cannot be undone!`
    )

    if (!confirmRemove) {
      return
    }

    // Delete all fluency progress documents for this student
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
    for (const op of operations) {
      const docRef = doc(db, 'mathFluencyProgress', `${studentUid}_${op}`)
      try {
        await deleteDoc(docRef)
        console.log(`✅ Deleted ${op} progress for ${student.firstName}`)
      } catch (err) {
        // Document might not exist, that's okay
        console.log(`ℹ️ No ${op} progress found (expected)`)
      }
    }

    alert(`✅ ${student.firstName} ${student.lastName} removed from fluency program`)

    // Reload data
    await loadData()
  } catch (error) {
    console.error('❌ Error unassigning diagnostic:', error)
    alert(`Error unassigning diagnostic: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
  }
}

function getOperationCounts(operation: OperationType) {
  const opData = allOperationsData.value.get(operation)
  if (!opData) {
    return { total: students.value.length, started: 0, inProgress: 0 }
  }

  const completed = opData.overview.students.length
  const inProgress = opData.inProgress.size
  const started = completed + inProgress

  return {
    total: students.value.length,
    started,
    completed,
    inProgress
  }
}
</script>

<style scoped>
.fluency-dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

/* Debug Links */
.debug-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  justify-content: center;
}

.debug-link {
  font-size: 0.85rem;
  color: #8e44ad;
  text-decoration: none;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.debug-link:hover {
  background: #f3e5f5;
  color: #6c3483;
  text-decoration: none;
}

.link-separator {
  color: #ddd;
  font-size: 0.75rem;
}

.debug-link.warning-link {
  color: #e74c3c;
}

.debug-link.warning-link:hover {
  background: #fee2e2;
  color: #c0392b;
}

/* Operation Selector */
.operation-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.op-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.op-btn:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.op-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.op-count-badge {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0,0,0,0.1);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.op-btn.active .op-count-badge {
  background: rgba(255,255,255,0.3);
}

/* Overview Card */
.overview-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.overview-card h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.class-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.class-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.class-stat.alert {
  background: #fff3cd;
  border-left-color: #ffc107;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

/* Students Card */
.students-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.search-input,
.sort-select {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.search-input:focus,
.sort-select:focus {
  outline: none;
  border-color: #007bff;
}

/* Table */
.students-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.8fr 0.8fr 1fr 1.2fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.table-header {
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
  text-transform: uppercase;
  background: #f8f9fa;
  border-radius: 6px 6px 0 0;
}

.table-row {
  transition: background 0.2s;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-row.alert {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.table-row.success {
  background: #d4edda;
  border-left: 4px solid #28a745;
}

.table-row.no-data {
  background: #f8f9fa;
  border-left: 4px solid #6c757d;
}

.no-data-badge,
.in-progress-badge,
.assigned-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.no-data-badge {
  background: #f8d7da;
  color: #721c24;
}

.in-progress-badge {
  background: #d1ecf1;
  color: #0c5460;
}

.assigned-badge {
  background: #fff3cd;
  color: #856404;
}

.no-data-text {
  color: #999;
}

.add-btn {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #218838;
}

/* Sub-level Display */
.sublevel-display {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sublevel-name {
  font-weight: 600;
  color: #007bff;
  font-size: 0.875rem;
}

.sublevel-progress-mini {
  font-size: 0.75rem;
  color: #666;
}

.proficiency-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.proficiency-bar-mini {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.proficiency-fill-mini {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.proficiency-fill-mini.excellent {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.proficiency-fill-mini.good {
  background: linear-gradient(90deg, #17a2b8, #007bff);
}

.proficiency-fill-mini.fair {
  background: linear-gradient(90deg, #ffc107, #fd7e14);
}

.proficiency-fill-mini.needs-work {
  background: linear-gradient(90deg, #dc3545, #c82333);
}

.ready-badge-mini {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}

.unassign-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.unassign-btn:hover {
  background: #c82333;
}

.col-name strong {
  color: #333;
}

.proficiency-bar-mini {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.proficiency-fill-mini {
  height: 100%;
  transition: width 0.3s;
}

.proficiency-fill-mini.excellent {
  background: #28a745;
}

.proficiency-fill-mini.good {
  background: #007bff;
}

.proficiency-fill-mini.fair {
  background: #ffc107;
}

.proficiency-fill-mini.needs-work {
  background: #dc3545;
}

.proficiency-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
}

.cpm-value {
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.cpm-value.mastered {
  background: #d4edda;
  color: #155724;
}

.cpm-value.proficient {
  background: #d1ecf1;
  color: #0c5460;
}

.cpm-value.developing {
  background: #fff3cd;
  color: #856404;
}

.cpm-value.emerging {
  background: #f8d7da;
  color: #721c24;
}

.streak-badge {
  font-weight: 600;
  color: #ff6b6b;
}

.no-streak {
  color: #999;
}

.practice-date {
  font-size: 0.875rem;
  color: #666;
}

.view-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.view-btn:hover {
  background: #0056b3;
}

/* Quick Actions */
.quick-actions-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.quick-actions-card h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  background: #e7f3ff;
  border-color: #007bff;
  transform: translateY(-2px);
}

.action-icon {
  font-size: 2.5rem;
}

.action-text {
  font-weight: 600;
  color: #333;
  text-align: center;
}

.action-subtitle {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  margin-top: -0.5rem;
}

.action-card.featured {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.action-card.featured .action-text,
.action-card.featured .action-subtitle {
  color: white;
}

.action-card.featured:hover {
  background: linear-gradient(135deg, #5568d3 0%, #63418d 100%);
  border-color: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>

