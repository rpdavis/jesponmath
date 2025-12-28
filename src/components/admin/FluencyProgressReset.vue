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

        <div class="manual-level-control" v-if="studentProgress">
          <h4>Manual Sub-Level Control</h4>
          <p class="help-text">Set student's current sub-level for each operation</p>

          <div class="level-selectors">
            <div class="level-selector-global">
              <label>
                <strong>Current Sub-Level (All 16 Levels):</strong>
                <select v-model="selectedSubLevel" @change="saveGlobalSubLevel">
                  <optgroup label="Addition (Levels 1-3)">
                    <option v-for="level in getAllSubLevels().filter(l => l.operation === 'addition' && l.order <= 7)"
                            :key="level.id"
                            :value="level.id">
                      Level {{ level.order }}: {{ level.shortName }} - {{ level.name }}
                    </option>
                  </optgroup>
                  <optgroup label="Subtraction (Levels 4-6)">
                    <option v-for="level in getAllSubLevels().filter(l => l.operation === 'subtraction')"
                            :key="level.id"
                            :value="level.id">
                      Level {{ level.order }}: {{ level.shortName }} - {{ level.name }}
                    </option>
                  </optgroup>
                  <optgroup label="Addition+Subtraction Mixed (Level 7)">
                    <option v-for="level in getAllSubLevels().filter(l => l.id === 'addition_subtraction_mixed')"
                            :key="level.id"
                            :value="level.id">
                      Level {{ level.order }}: {{ level.shortName }} - {{ level.name }}
                    </option>
                  </optgroup>
                  <optgroup label="Multiplication (Levels 8-11)">
                    <option v-for="level in getAllSubLevels().filter(l => l.operation === 'multiplication')"
                            :key="level.id"
                            :value="level.id">
                      Level {{ level.order }}: {{ level.shortName }} - {{ level.name }}
                    </option>
                  </optgroup>
                  <optgroup label="Division (Levels 12-15)">
                    <option v-for="level in getAllSubLevels().filter(l => l.operation === 'division')"
                            :key="level.id"
                            :value="level.id">
                      Level {{ level.order }}: {{ level.shortName }} - {{ level.name }}
                    </option>
                  </optgroup>
                  <optgroup label="All Operations (Level 16)">
                    <option v-for="level in getAllSubLevels().filter(l => l.id === 'all_operations_mixed')"
                            :key="level.id"
                            :value="level.id">
                      Level {{ level.order }}: {{ level.shortName }} - {{ level.name }}
                    </option>
                  </optgroup>
                </select>
              </label>
              <p class="current-level-info" v-if="studentProgress && studentProgress.length > 0">
                Currently on: <strong>{{ studentProgress[0]?.currentSubLevel || 'Unknown' }}</strong>
              </p>
            </div>
          </div>
        </div>

        <div class="reset-actions">
          <button @click="softReset" class="btn-soft-reset" :disabled="resetting">
            {{ resetting ? 'Resetting...' : '🔄 Soft Reset (Fresh Data, Keep Level)' }}
          </button>
          <button @click="resetProgress" class="btn-reset" :disabled="resetting">
            {{ resetting ? 'Resetting...' : '🗑️ Full Reset (Delete Everything)' }}
          </button>
          <button @click="resetAndRestart" class="btn-reset-restart" :disabled="resetting">
            {{ resetting ? 'Resetting...' : '♻️ Reset & Restart (Level 1)' }}
          </button>
        </div>

        <div class="info-box">
          <h5>🔄 Soft Reset (Recommended for Bug Fix):</h5>
          <ul>
            <li>✅ <strong>KEEPS</strong> proficiency levels (mastered, proficient, etc.)</li>
            <li>✅ <strong>CLEARS</strong> corrupt counters (last5Attempts, totalAttempts)</li>
            <li>✅ Keeps current sub-level, streak, and practice days</li>
            <li>✅ Counters rebuild from next practice (1-2 sessions)</li>
            <li>✅ Student maintains their hard-earned proficiency</li>
            <li>✅ <strong>SAFE</strong> - doesn't delete session records</li>
          </ul>

          <h5>🔄 Reset Progress (Destructive):</h5>
          <ul>
            <li>❌ Deletes all fluency progress documents (all 4 operations)</li>
            <li>❌ Deletes all practice session records</li>
            <li>❌ Deletes all paper assessment records</li>
            <li>❌ Deletes problem proficiency data</li>
            <li>❌ Deletes sub-level completion status</li>
          </ul>

          <h5>What Always Stays:</h5>
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
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { SUB_LEVEL_CONFIGS, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import type { Student } from '@/types/users'
import type { OperationType, MathFluencyProgress, SubLevel } from '@/types/mathFluency'

const authStore = useAuthStore()

const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const studentProgress = ref<MathFluencyProgress[] | null>(null)
const selectedSubLevel = ref<SubLevel | ''>('')
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
  selectedSubLevel.value = ''

  try {
    const progress = await getAllFluencyProgress(selectedStudentUid.value)
    studentProgress.value = progress.length > 0 ? progress : null

    // Set selected sub-level to current level
    if (progress.length > 0 && progress[0].currentSubLevel) {
      selectedSubLevel.value = progress[0].currentSubLevel
    }
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

// Soft Reset: Clear corrupted problem data but keep current level/streak
async function softReset() {
  if (!selectedStudentUid.value) return

  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  if (!student) return

  const confirm1 = window.confirm(
    `🔄 SOFT RESET (RECOMMENDED)\n\n` +
    `Student: ${student.firstName} ${student.lastName}\n\n` +
    `This will:\n` +
    `• Clear ALL problem proficiency data (fresh start)\n` +
    `• Keep current sub-level (${studentProgress.value?.[0]?.currentSubLevel || 'unknown'})\n` +
    `• Keep practice streak and session count\n` +
    `• Rebuild proficiency from next practice session\n\n` +
    `This fixes the bug by starting fresh with clean data.\n` +
    `Student will need 1-2 sessions to rebuild proficiency tracking.\n\n` +
    `Continue?`
  )

  if (!confirm1) return

  resetting.value = true
  let fixedOperations = 0
  const details: string[] = []

  try {
    // Process each operation
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']

    for (const op of operations) {
      const docId = `${selectedStudentUid.value}_${op}`
      const docRef = doc(db, 'mathFluencyProgress', docId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) continue

      const data = docSnap.data()

      // Keep these important fields (filter out undefined values)
      const preservedFields: Record<string, any> = {}
      if (data.currentSubLevel !== undefined) preservedFields.currentSubLevel = data.currentSubLevel
      if (data.completedSubLevels !== undefined) preservedFields.completedSubLevels = data.completedSubLevels
      if (data.totalPracticeDays !== undefined) preservedFields.totalPracticeDays = data.totalPracticeDays
      if (data.practiceStreak !== undefined) preservedFields.practiceStreak = data.practiceStreak
      if (data.dateStarted !== undefined) preservedFields.dateStarted = data.dateStarted
      if (data.lastPracticeDate !== undefined) preservedFields.lastPracticeDate = data.lastPracticeDate

      // Keep problems in their current banks, just reset the corrupt counters
      const now = Timestamp.fromDate(new Date())
      const cleanedBanks: any = {}

      for (const bankName of ['doesNotKnow', 'emerging', 'approaching', 'proficient', 'mastered']) {
        const problems = data.problemBanks[bankName] || []

        // Reset counters but KEEP proficiency level
        cleanedBanks[bankName] = problems.map((p: any) => ({
          problemId: p.problemId,
          num1: p.num1,
          num2: p.num2,
          operation: p.operation,
          correctAnswer: p.correctAnswer,
          displayText: p.displayText,
          proficiencyLevel: bankName, // Keep current level
          totalAttempts: 0, // Reset counter
          correctAttempts: 0, // Reset counter
          last5Attempts: [], // Clear corrupt data
          responseTimes: [], // Clear
          dateAdded: p.dateAdded || now,
          proficiencyCalculation: {
            correctOutOfLast5: 0,
            averageTimeOfLast5: 0,
            last5Trend: 'stable',
            confidenceLevel: 'low'
          }
        }))
      }

      const distribution = {
        doesNotKnow: cleanedBanks.doesNotKnow?.length || 0,
        emerging: cleanedBanks.emerging?.length || 0,
        approaching: cleanedBanks.approaching?.length || 0,
        proficient: cleanedBanks.proficient?.length || 0,
        mastered: cleanedBanks.mastered?.length || 0,
        total: (cleanedBanks.doesNotKnow?.length || 0) + (cleanedBanks.emerging?.length || 0) +
               (cleanedBanks.approaching?.length || 0) + (cleanedBanks.proficient?.length || 0) +
               (cleanedBanks.mastered?.length || 0)
      }

      // Keep proficiency percentage (based on distribution)
      const profPercentage = distribution.total > 0
        ? Math.round(((distribution.approaching + distribution.proficient + distribution.mastered) / distribution.total) * 100)
        : 0

      // Save with cleaned data
      await updateDoc(docRef, {
        problemBanks: cleanedBanks,
        proficiencyDistribution: distribution,
        proficiencyPercentage: profPercentage, // Keep current proficiency
        ...preservedFields,
        lastModified: serverTimestamp()
      })

      fixedOperations++
      details.push(
        `${op.toUpperCase()}:\n` +
        `  Cleaned ${distribution.total} problems (kept in current banks)\n` +
        `  Proficiency: ${profPercentage}%\n` +
        `  Mastered: ${distribution.mastered}, Proficient: ${distribution.proficient}\n` +
        `  Level: ${preservedFields.currentSubLevel || 'N/A'}, Streak: ${preservedFields.practiceStreak || 0} days`
      )

      console.log(`✅ Soft reset ${op}: ${distribution.total} problems cleaned, proficiency levels preserved at ${profPercentage}%`)
    }

    // Log the reset
    resetLog.value.unshift({
      time: new Date().toLocaleTimeString(),
      studentName: `${student.firstName} ${student.lastName}`,
      action: `Soft reset (cleared corrupted data, kept level/streak)`
    })

    const detailText = details.join('\n\n')

    alert(
      `✅ Soft Reset Complete!\n\n` +
      `Operations cleaned: ${fixedOperations}\n\n` +
      `${detailText}\n\n` +
      `What happened:\n` +
      `• Proficiency levels PRESERVED (mastered, proficient, etc.)\n` +
      `• Corrupt counters CLEARED (last5Attempts, totalAttempts)\n` +
      `• Current sub-level and streak preserved\n` +
      `• Counters will rebuild from next practice session\n\n` +
      `Student can continue practicing immediately!`
    )

    // Reload progress to show changes
    await loadStudentProgress()

  } catch (error) {
    console.error('Error cleaning data:', error)
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
    alert(
      `❌ Error cleaning data:\n\n${errorMsg}\n\n` +
      `Check browser console for details.`
    )
  } finally {
    resetting.value = false
  }
}

// Get all sub-levels sorted by order
function getAllSubLevels() {
  return SUB_LEVEL_CONFIGS.sort((a, b) => a.order - b.order)
}

// Save manually selected sub-level (applies to ADDITION progress document)
async function saveGlobalSubLevel() {
  if (!selectedSubLevel.value) return

  try {
    // ALWAYS update the addition document (primary progress tracking)
    const docId = `${selectedStudentUid.value}_addition`
    const docRef = doc(db, 'mathFluencyProgress', docId)

    await updateDoc(docRef, {
      currentSubLevel: selectedSubLevel.value
    })

    console.log(`✅ Updated current sub-level to ${selectedSubLevel.value}`)
    alert(`✅ Sub-level updated to ${selectedSubLevel.value}!\n\nStudent will continue from this level on next practice.`)

    // Reload to show changes
    await loadStudentProgress()
  } catch (error) {
    console.error('Error updating sub-level:', error)
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
.btn-soft-reset,
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

.btn-soft-reset {
  background: #27ae60;
  color: white;
}

.btn-soft-reset:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
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
.btn-reset-restart:disabled,
.btn-soft-reset:disabled {
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

.manual-level-control {
  background: #e8f5e9;
  border: 2px solid #27ae60;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.manual-level-control h4 {
  margin-top: 0;
  color: #27ae60;
  margin-bottom: 0.5rem;
}

.help-text {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.level-selectors {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.level-selector-global label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.level-selector-global select {
  padding: 0.75rem;
  border: 2px solid #27ae60;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.level-selector-global select:focus {
  outline: none;
  border-color: #229954;
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.2);
}

.current-level-info {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fff9c4;
  border-left: 4px solid #f57f17;
  border-radius: 4px;
  font-size: 0.95rem;
}
</style>











