<template>
  <div class="debug-mode-manager">
    <div class="header">
      <h2>🔬 Debug Mode Manager</h2>
      <p class="subtitle">Enable detailed session logging for specific students to track module progression</p>
    </div>

    <div class="controls card">
      <h3>Enable Debug Mode</h3>
      <p class="help-text">
        Debug mode tracks every problem, session metric, and advancement decision for selected students.
        Use this to validate the module is working correctly as students progress.
      </p>

      <div class="student-selection">
        <label>
          Select Student:
          <select v-model="selectedStudentUid">
            <option value="">Choose a student...</option>
            <option v-for="student in students" :key="student.uid" :value="student.uid">
              {{ student.lastName }}, {{ student.firstName }}
            </option>
          </select>
        </label>

        <div class="button-group">
          <button
            @click="enableDebug"
            class="btn-primary"
            :disabled="!selectedStudentUid || isEnabled(selectedStudentUid)"
          >
            Enable Debug Mode
          </button>
          <button
            @click="disableDebug"
            class="btn-secondary"
            :disabled="!selectedStudentUid || !isEnabled(selectedStudentUid)"
          >
            Disable Debug Mode
          </button>
        </div>
      </div>
    </div>

    <div class="enabled-students card" v-if="debugEnabledStudents.length > 0">
      <div class="card-header-with-action">
        <h3>Students with Debug Mode Enabled ({{ debugEnabledStudents.length }})</h3>
        <button @click="clearAllLogs" class="btn-danger-small">
          🗑️ Clear All Logs
        </button>
      </div>

      <div class="student-list">
        <div v-for="uid in debugEnabledStudents" :key="uid" class="student-card">
          <div class="student-info">
            <strong>{{ getStudentName(uid) }}</strong>
            <span class="badge badge-debug">🔬 Debugging</span>
            <div class="uid-display">UID: {{ uid }}</div>
          </div>

          <div class="student-actions">
            <button @click="viewLogs(uid)" class="btn-view">
              View Logs
            </button>
            <button @click="checkLogsInFirestore(uid)" class="btn-check">
              Check DB
            </button>
            <button @click="exportStudent(uid)" class="btn-export">
              Export CSV
            </button>
            <button @click="disableForStudent(uid)" class="btn-disable">
              Disable
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="instructions card">
      <h3>📝 Usage Instructions</h3>

      <ol>
        <li><strong>Enable</strong> debug mode for 2-3 students with different skill levels (high, medium, low)</li>
        <li><strong>Have them complete</strong> practice sessions normally</li>
        <li><strong>Open browser console</strong> (F12) during their sessions to see detailed logs</li>
        <li><strong>Review logs</strong> after sessions to verify:
          <ul>
            <li>Problem banks are initialized correctly</li>
            <li>Proficiency calculations are accurate</li>
            <li>Advancement triggers at correct thresholds</li>
            <li>Fast-track mode activates appropriately</li>
          </ul>
        </li>
        <li><strong>Export to CSV</strong> for detailed analysis</li>
      </ol>

      <h4>Console Commands</h4>
      <pre class="code-block">
// Enable debug mode
import { enableDebugMode } from '@/utils/detailedDebugLogger'
enableDebugMode('studentUid')

// View analysis
import { printAnalysis } from '@/utils/detailedDebugLogger'
printAnalysis('studentUid')

// Export data
import { exportDetailedLogsToCSV, downloadDetailedCSV } from '@/utils/detailedDebugLogger'
const csv = exportDetailedLogsToCSV('studentUid')
downloadDetailedCSV(csv, 'student-sessions.csv')
      </pre>
    </div>

    <!-- Log Viewer Modal -->
    <div v-if="showLogViewer" class="modal-overlay" @click="showLogViewer = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🔬 Session Logs: {{ viewingStudentName }}</h3>
          <button @click="showLogViewer = false" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <div class="logs-summary">
            <p><strong>Total Sessions:</strong> {{ viewingLogs.length }}</p>
            <p><strong>Most Recent:</strong> {{ viewingLogs[0]?.timestamp.toLocaleString() }}</p>
          </div>

          <div class="logs-list">
            <div v-for="log in viewingLogs" :key="log.sessionId" class="log-entry">
              <div class="log-header">
                <strong>Session {{ log.sessionNumber }}</strong>
                <span class="log-date">{{ log.timestamp.toLocaleString() }}</span>
              </div>

              <div class="log-details">
                <div class="log-row">
                  <span>Sub-Level:</span>
                  <span>{{ log.currentSubLevel }}</span>
                </div>
                <div class="log-row">
                  <span>Proficiency:</span>
                  <span>{{ log.startState.proficiencyPercentage }}% → {{ log.endState.proficiencyPercentage }}%
                    <span :class="log.endState.proficiencyChange >= 0 ? 'positive' : 'negative'">
                      ({{ log.endState.proficiencyChange >= 0 ? '+' : '' }}{{ log.endState.proficiencyChange }}%)
                    </span>
                  </span>
                </div>
                <div class="log-row">
                  <span>Scores:</span>
                  <span>
                    D: {{ log.diagnostic.score }}/{{ log.diagnostic.total }} |
                    R2: {{ log.round2.score }}/{{ log.round2.total }} |
                    R3: {{ log.round3.score }}/{{ log.round3.total }}
                  </span>
                </div>
                <div class="log-row">
                  <span>Fast-Track:</span>
                  <span>{{ log.round2.fastTrackMode ? '⚡ Yes' : 'No' }}</span>
                </div>
                <div class="log-row" v-if="log.advancement.advanced">
                  <span>Advanced:</span>
                  <span class="success">✅ {{ log.advancement.previousSubLevel }} → {{ log.advancement.newSubLevel }}</span>
                </div>
              <div class="log-row" v-if="log.issues && log.issues.length > 0">
                <span>Issues:</span>
                <span class="warning">⚠️ {{ log.issues.length }} issue(s)</span>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="exportViewingLogs" class="btn-primary">Export to CSV</button>
          <button @click="showLogViewer = false" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { getStudentsByTeacher } from '@/firebase/userServices'
import type { Student } from '@/types/users'
import {
  enableDebugMode,
  disableDebugMode,
  isDebugEnabled,
  getDebugEnabledStudents,
  printAnalysis,
  exportDetailedLogsToCSV,
  exportProblemDetailsToCSV,
  downloadDetailedCSV,
} from '@/utils/detailedDebugLogger'
import { collection, query, where, getDocs, orderBy, limit, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

const authStore = useAuthStore()

const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const debugEnabledStudents = ref<string[]>([])

const showLogViewer = ref(false)
const viewingStudentUid = ref('')
const viewingLogs = ref<any[]>([])

const viewingStudentName = computed(() => {
  const student = students.value.find(s => s.uid === viewingStudentUid.value)
  return student ? `${student.lastName}, ${student.firstName}` : ''
})

onMounted(async () => {
  if (!authStore.currentUser) return

  try {
    students.value = await getStudentsByTeacher(authStore.currentUser.uid)
  } catch (error) {
    console.error('Error loading students:', error)
  }

  refreshDebugList()
})

function refreshDebugList() {
  debugEnabledStudents.value = getDebugEnabledStudents()
}

function isEnabled(uid: string): boolean {
  return isDebugEnabled(uid)
}

function enableDebug() {
  if (!selectedStudentUid.value) return
  enableDebugMode(selectedStudentUid.value)
  refreshDebugList()
  selectedStudentUid.value = ''
}

function disableDebug() {
  if (!selectedStudentUid.value) return
  disableDebugMode(selectedStudentUid.value)
  refreshDebugList()
  selectedStudentUid.value = ''
}

function disableForStudent(uid: string) {
  disableDebugMode(uid)
  refreshDebugList()
}

function getStudentName(uid: string): string {
  const student = students.value.find(s => s.uid === uid)
  return student ? `${student.lastName}, ${student.firstName}` : uid
}

async function checkLogsInFirestore(uid: string) {
  try {
    const q = query(
      collection(db, 'fluencyDebugLogs'),
      where('studentUid', '==', uid)
    )
    const snapshot = await getDocs(q)

    console.group('🔍 FIRESTORE CHECK for', getStudentName(uid))
    console.log('UID:', uid)
    console.log('Total logs in Firestore:', snapshot.size)

    if (snapshot.size > 0) {
      console.log('Sessions:')
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        console.log(`  Session ${data.sessionNumber}: ${data.diagnostic?.score}/${data.diagnostic?.total} diagnostic`)
      })
    } else {
      console.log('❌ No logs found in Firestore for this student')
    }

    console.groupEnd()

    alert(`Found ${snapshot.size} logs in Firestore for ${getStudentName(uid)}.\n\nCheck console for details.`)
  } catch (error) {
    console.error('Error checking Firestore:', error)
    alert(`Error: ${error}`)
  }
}

async function clearAllLogs() {
  if (!confirm('⚠️ Delete ALL debug logs from Firestore?\n\nThis will delete logs for all students.\n\nThis cannot be undone!')) {
    return
  }

  if (!confirm('FINAL CONFIRMATION:\n\nThis will delete potentially 1000+ log documents.\n\nAre you absolutely sure?')) {
    return
  }

  try {
    console.log('🗑️ Deleting all logs...')

    // Get all logs
    const snapshot = await getDocs(collection(db, 'fluencyDebugLogs'))
    console.log(`Found ${snapshot.size} logs to delete`)

    let deleted = 0

    // Delete in small batches to avoid timeout
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref)
      deleted++
      if (deleted % 100 === 0) {
        console.log(`Deleted ${deleted} / ${snapshot.size}...`)
      }
    }

    console.log('✅ All logs deleted!')
    alert(`✅ Deleted ${deleted} debug logs from Firestore`)

  } catch (error) {
    console.error('Error deleting logs:', error)
    alert(`Error: ${error}`)
  }
}

async function getLogCount(uid: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'fluencyDebugLogs'),
      where('studentUid', '==', uid)
    )
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch {
    return 0
  }
}

async function viewLogs(uid: string) {
  viewingStudentUid.value = uid

  // Load logs from Firestore (without orderBy to avoid index requirement)
  try {
    console.group('📂 LOADING LOGS for', getStudentName(uid))
    console.log('Query UID:', uid)

    const q = query(
      collection(db, 'fluencyDebugLogs'),
      where('studentUid', '==', uid)
    )

    console.log('Executing query...')
    const snapshot = await getDocs(q)
    console.log('Query returned:', snapshot.size, 'documents')

    // Log first few docs to see structure
    snapshot.docs.slice(0, 3).forEach((doc, i) => {
      const data = doc.data()
      console.log(`  Doc ${i+1}:`, {
        id: doc.id,
        studentUid: data.studentUid,
        sessionNumber: data.sessionNumber,
        hasTimestamp: !!data.timestamp
      })
    })

    // Sort in JavaScript instead of Firestore
    viewingLogs.value = snapshot.docs
      .map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
      .sort((a: any, b: any) => {
        // Sort by timestamp descending (most recent first)
        const aTime = a.timestamp?.seconds || 0
        const bTime = b.timestamp?.seconds || 0
        return bTime - aTime
      })
      .slice(0, 20) as any[] // Limit to 20 most recent

    console.log(`✅ Loaded ${viewingLogs.value.length} logs, displaying in modal`)
    console.groupEnd()
  } catch (error) {
    console.error('❌ Error loading logs:', error)
    console.groupEnd()
    viewingLogs.value = []
  }

  showLogViewer.value = true
}

function analyzeStudent(uid: string) {
  printAnalysis(uid)
  console.log('📊 Analysis printed to console. Open DevTools (F12) to view.')
}

function exportStudent(uid: string) {
  const studentName = getStudentName(uid).replace(/[^a-zA-Z0-9]/g, '_')

  // Export session summary
  const sessionCSV = exportDetailedLogsToCSV(uid)
  if (sessionCSV) {
    downloadDetailedCSV(sessionCSV, `${studentName}_sessions.csv`)
  }

  // Export problem details
  const problemCSV = exportProblemDetailsToCSV(uid)
  if (problemCSV) {
    downloadDetailedCSV(problemCSV, `${studentName}_problems.csv`)
  }

  console.log('✅ Exported logs for:', getStudentName(uid))
}

function exportViewingLogs() {
  if (viewingStudentUid.value) {
    exportStudent(viewingStudentUid.value)
  }
}
</script>

<style scoped>
.debug-mode-manager {
  max-width: 1200px;
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
  margin-bottom: 1rem;
}

.help-text {
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.student-selection label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.student-selection select {
  padding: 0.75rem;
  border: 2px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary, .btn-view, .btn-analyze, .btn-export, .btn-disable {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #27ae60;
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e74c3c;
  color: white;
  flex: 1;
}

.btn-secondary:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
}

.btn-secondary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-card {
  background: #f8f9fa;
  border-left: 4px solid #8e44ad;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.uid-display {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-family: monospace;
}

.student-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-view, .btn-analyze, .btn-export, .btn-disable, .btn-check {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-check {
  background: #9b59b6;
  color: white;
}

.btn-check:hover {
  background: #8e44ad;
}

.btn-view {
  background: #3498db;
  color: white;
}

.btn-view:hover {
  background: #2980b9;
}

.btn-analyze {
  background: #f39c12;
  color: white;
}

.btn-analyze:hover {
  background: #e67e22;
}

.btn-export {
  background: #27ae60;
  color: white;
}

.btn-export:hover {
  background: #229954;
}

.btn-disable {
  background: #95a5a6;
  color: white;
}

.btn-disable:hover {
  background: #7f8c8d;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-debug {
  background: #f0e5f5;
  color: #8e44ad;
}

.instructions ol {
  line-height: 1.8;
}

.instructions ul {
  margin-top: 0.5rem;
}

.code-block {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #95a5a6;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
}

.close-btn:hover {
  color: #7f8c8d;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.logs-summary {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.log-entry {
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  padding: 1rem;
}

.log-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #ecf0f1;
}

.log-date {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.log-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.log-row span:first-child {
  color: #7f8c8d;
}

.log-row .positive {
  color: #27ae60;
  font-weight: 600;
}

.log-row .negative {
  color: #e74c3c;
  font-weight: 600;
}

.log-row .success {
  color: #27ae60;
  font-weight: 600;
}

.log-row .warning {
  color: #f39c12;
  font-weight: 600;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 2px solid #ecf0f1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>











