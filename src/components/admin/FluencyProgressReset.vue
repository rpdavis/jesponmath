<template>
  <div class="fluency-reset-tool">
    <div class="header">
      <h2>🔄 Reset Fluency Progress (Testing Tool)</h2>
      <p class="subtitle">Delete student progress to test module from beginning</p>
      <p class="warning">⚠️ Use only for testing - permanently deletes all fluency data</p>
    </div>

    <div class="reset-section card">
      <h3>Select Student to Reset</h3>

      <div class="form-group">
        <label>
          Student:
          <select v-model="selectedStudentUid">
            <option value="">Choose a student...</option>
            <option v-for="student in students" :key="student.uid" :value="student.uid">
              {{ student.lastName }}, {{ student.firstName }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="selectedStudentUid && studentProgress" class="progress-preview">
        <h4>Current Progress for {{ studentName }}</h4>

        <div class="progress-cards">
          <div v-for="prog in studentProgress" :key="prog.operation" class="progress-card">
            <div class="card-header">
              <span class="op-icon">{{ getOperationIcon(prog.operation) }}</span>
              <strong>{{ capitalizeOperation(prog.operation) }}</strong>
            </div>
            <div class="card-body">
              <p><strong>Current Level:</strong> {{ prog.currentSubLevel }}</p>
              <p><strong>Proficiency:</strong> {{ prog.proficiencyPercentage }}%</p>
              <p><strong>Practice Days:</strong> {{ prog.totalPracticeDays }}</p>
              <p><strong>Completed Levels:</strong> {{ prog.completedSubLevels.length }}</p>
            </div>
          </div>
        </div>

        <div class="reset-actions">
          <button @click="resetProgress" class="btn-reset" :disabled="resetting">
            {{ resetting ? 'Resetting...' : '🔄 Reset All Fluency Progress' }}
          </button>
          <button @click="resetAndRestart" class="btn-reset-restart" :disabled="resetting">
            {{ resetting ? 'Resetting...' : '🔄 Reset & Re-Add to Program' }}
          </button>
        </div>

        <div class="info-box">
          <h5>What Gets Deleted:</h5>
          <ul>
            <li>✅ All fluency progress documents (all 4 operations)</li>
            <li>✅ All practice session records</li>
            <li>✅ All paper assessment records</li>
            <li>✅ Problem proficiency data</li>
            <li>✅ Sub-level completion status</li>
          </ul>

          <h5>What Stays:</h5>
          <ul>
            <li>✅ Student account</li>
            <li>✅ Other assessments (ESA, PA, SA)</li>
            <li>✅ Goals</li>
          </ul>
        </div>
      </div>

      <div v-else-if="selectedStudentUid && !loading" class="no-progress">
        <p>ℹ️ This student has no fluency progress yet.</p>
        <button @click="addToProgram" class="btn-add">
          ➕ Add to Fluency Program
        </button>
      </div>
    </div>

    <!-- Recent Resets Log -->
    <div v-if="resetLog.length > 0" class="reset-log card">
      <h3>Recent Resets</h3>
      <div class="log-entries">
        <div v-for="(entry, index) in resetLog" :key="index" class="log-entry">
          <span class="log-time">{{ entry.time }}</span>
          <span class="log-student">{{ entry.studentName }}</span>
          <span class="log-action">{{ entry.action }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { getStudentsByTeacher } from '@/firebase/userServices'
import {
  getAllFluencyProgress,
  addStudentToFluencyProgram
} from '@/services/mathFluencyServices'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Student } from '@/types/users'
import type { OperationType, MathFluencyProgress } from '@/types/mathFluency'

const authStore = useAuthStore()

const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const studentProgress = ref<MathFluencyProgress[] | null>(null)
const loading = ref(false)
const resetting = ref(false)
const resetLog = ref<any[]>([])

const studentName = computed(() => {
  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  return student ? `${student.firstName} ${student.lastName}` : ''
})

onMounted(async () => {
  if (!authStore.currentUser) return

  try {
    students.value = await getStudentsByTeacher(authStore.currentUser.uid)
  } catch (error) {
    console.error('Error loading students:', error)
  }
})

async function loadStudentProgress() {
  if (!selectedStudentUid.value) return

  loading.value = true
  studentProgress.value = null

  try {
    const progress = await getAllFluencyProgress(selectedStudentUid.value)
    studentProgress.value = progress.length > 0 ? progress : null
  } catch (error) {
    console.error('Error loading progress:', error)
  } finally {
    loading.value = false
  }
}

// Watch for student selection
async function selectStudent() {
  await loadStudentProgress()
}

// Capitalize operation
function capitalizeOperation(op: OperationType): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

function getOperationIcon(op: OperationType): string {
  const icons: Record<OperationType, string> = {
    addition: '➕',
    subtraction: '➖',
    multiplication: '✖️',
    division: '➗'
  }
  return icons[op] || '📊'
}

// Reset progress only (delete everything)
async function resetProgress() {
  if (!selectedStudentUid.value) return

  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  if (!student) return

  const confirm1 = window.confirm(
    `⚠️ RESET FLUENCY PROGRESS\n\n` +
    `Student: ${student.firstName} ${student.lastName}\n\n` +
    `This will DELETE:\n` +
    `- All fluency progress (all operations)\n` +
    `- All practice sessions\n` +
    `- All paper assessments\n\n` +
    `This CANNOT be undone!\n\n` +
    `Are you sure you want to continue?`
  )

  if (!confirm1) return

  const confirm2 = window.confirm(
    `FINAL CONFIRMATION\n\n` +
    `Type the student's LAST NAME to confirm: ${student.lastName}`
  )

  if (!confirm2) return

  resetting.value = true

  try {
    // Delete all fluency progress documents
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
    let deletedCount = 0

    for (const op of operations) {
      const docRef = doc(db, 'mathFluencyProgress', `${selectedStudentUid.value}_${op}`)
      try {
        await deleteDoc(docRef)
        console.log(`✅ Deleted ${op} progress`)
        deletedCount++
      } catch (err) {
        // Document might not exist
        console.log(`ℹ️ No ${op} progress found`)
      }
    }

    // Delete all practice sessions
    const sessionsQuery = query(
      collection(db, 'mathFluencyPracticeSessions'),
      where('studentUid', '==', selectedStudentUid.value)
    )
    const sessionsSnapshot = await getDocs(sessionsQuery)
    for (const sessionDoc of sessionsSnapshot.docs) {
      await deleteDoc(sessionDoc.ref)
    }
    console.log(`✅ Deleted ${sessionsSnapshot.size} practice sessions`)

    // Delete all paper assessments
    const assessmentsQuery = query(
      collection(db, 'mathFluencyPaperAssessments'),
      where('studentUid', '==', selectedStudentUid.value)
    )
    const assessmentsSnapshot = await getDocs(assessmentsQuery)
    for (const assessmentDoc of assessmentsSnapshot.docs) {
      await deleteDoc(assessmentDoc.ref)
    }
    console.log(`✅ Deleted ${assessmentsSnapshot.size} paper assessments`)

    // Log the reset
    resetLog.value.unshift({
      time: new Date().toLocaleTimeString(),
      studentName: `${student.firstName} ${student.lastName}`,
      action: 'Reset (deleted all data)'
    })

    alert(
      `✅ Progress Reset Complete!\n\n` +
      `Deleted:\n` +
      `- ${deletedCount} progress documents\n` +
      `- ${sessionsSnapshot.size} practice sessions\n` +
      `- ${assessmentsSnapshot.size} paper assessments\n\n` +
      `Student can now start fresh from the beginning.`
    )

    // Clear selection
    selectedStudentUid.value = ''
    studentProgress.value = null

  } catch (error) {
    console.error('Error resetting progress:', error)
    alert(`Error resetting progress: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    resetting.value = false
  }
}

// Reset and immediately re-add to program
async function resetAndRestart() {
  if (!selectedStudentUid.value) return

  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  if (!student) return

  const confirm1 = window.confirm(
    `🔄 RESET & RESTART\n\n` +
    `Student: ${student.firstName} ${student.lastName}\n\n` +
    `This will:\n` +
    `1. Delete all existing progress\n` +
    `2. Re-add student to program (fresh start)\n\n` +
    `Continue?`
  )

  if (!confirm1) return

  resetting.value = true

  try {
    // First, delete everything (same as resetProgress)
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']

    for (const op of operations) {
      const docRef = doc(db, 'mathFluencyProgress', `${selectedStudentUid.value}_${op}`)
      try {
        await deleteDoc(docRef)
      } catch (err) {
        // Ignore if doesn't exist
      }
    }

    // Delete sessions
    const sessionsQuery = query(
      collection(db, 'mathFluencyPracticeSessions'),
      where('studentUid', '==', selectedStudentUid.value)
    )
    const sessionsSnapshot = await getDocs(sessionsQuery)
    for (const sessionDoc of sessionsSnapshot.docs) {
      await deleteDoc(sessionDoc.ref)
    }

    // Delete assessments
    const assessmentsQuery = query(
      collection(db, 'mathFluencyPaperAssessments'),
      where('studentUid', '==', selectedStudentUid.value)
    )
    const assessmentsSnapshot = await getDocs(assessmentsQuery)
    for (const assessmentDoc of assessmentsSnapshot.docs) {
      await deleteDoc(assessmentDoc.ref)
    }

    console.log('✅ Deleted all existing data')

    // Then, add back to program
    await addStudentToFluencyProgram(
      selectedStudentUid.value,
      `${student.firstName} ${student.lastName}`,
      authStore.currentUser!.uid
    )

    console.log('✅ Re-added to program')

    // Log the reset
    resetLog.value.unshift({
      time: new Date().toLocaleTimeString(),
      studentName: `${student.firstName} ${student.lastName}`,
      action: 'Reset & restarted (fresh addition level 1)'
    })

    alert(
      `✅ Reset Complete!\n\n` +
      `${student.firstName} can now:\n` +
      `1. Go to /fluency/daily-practice\n` +
      `2. Start fresh at Addition Level 1\n` +
      `3. Complete diagnostic and practice\n\n` +
      `All old data has been deleted.`
    )

    // Clear selection
    selectedStudentUid.value = ''
    studentProgress.value = null

  } catch (error) {
    console.error('Error resetting:', error)
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    resetting.value = false
  }
}

// Add to program (for students not yet started)
async function addToProgram() {
  if (!selectedStudentUid.value) return

  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  if (!student) return

  resetting.value = true

  try {
    await addStudentToFluencyProgram(
      selectedStudentUid.value,
      `${student.firstName} ${student.lastName}`,
      authStore.currentUser!.uid
    )

    alert(`✅ ${student.firstName} added to fluency program!\n\nThey can now start daily practice.`)

    selectedStudentUid.value = ''
    studentProgress.value = null
  } catch (error) {
    console.error('Error adding to program:', error)
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    resetting.value = false
  }
}

// Watch selection changes
import { watch } from 'vue'
watch(selectedStudentUid, loadStudentProgress)
</script>

<style scoped>
.fluency-reset-tool {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.warning {
  color: #e74c3c;
  font-weight: 600;
  font-size: 1rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.card h3 {
  margin-top: 0;
  color: #34495e;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group select {
  padding: 0.75rem;
  border: 2px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
}

.progress-preview {
  margin-top: 2rem;
}

.progress-preview h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.progress-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-card {
  border: 2px solid #dfe6e9;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  background: #f8f9fa;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid #dfe6e9;
}

.op-icon {
  font-size: 1.5rem;
}

.card-body {
  padding: 1rem;
}

.card-body p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.reset-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-reset,
.btn-reset-restart,
.btn-add {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.btn-reset {
  background: #e74c3c;
  color: white;
}

.btn-reset:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
}

.btn-reset-restart {
  background: #f39c12;
  color: white;
}

.btn-reset-restart:hover:not(:disabled) {
  background: #e67e22;
  transform: translateY(-2px);
}

.btn-add {
  background: #27ae60;
  color: white;
}

.btn-add:hover {
  background: #229954;
  transform: translateY(-2px);
}

.btn-reset:disabled,
.btn-reset-restart:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
}

.info-box {
  background: #f8f9fa;
  border-left: 4px solid #3498db;
  padding: 1.5rem;
  border-radius: 8px;
}

.info-box h5 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.info-box ul {
  margin: 0;
  padding-left: 1.5rem;
  line-height: 1.8;
}

.no-progress {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.reset-log h3 {
  color: #2c3e50;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-entry {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
}

.log-time {
  color: #7f8c8d;
  font-weight: 600;
}

.log-student {
  color: #2c3e50;
  font-weight: 600;
}

.log-action {
  color: #e74c3c;
}
</style>








