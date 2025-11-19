<template>
  <div class="foundational-fluency-management">
    <div class="page-header">
      <h1>🎯 Foundational Fluency Management</h1>
      <p>Assign and manage foundational number sense assessments for students</p>
    </div>

    <!-- Quick Actions -->
    <div class="actions-section">
      <button @click="showAssignModal = true" class="btn btn-primary">
        ➕ Assign New Test
      </button>
      <button @click="router.push('/diagnostic/foundational-fluency-results')" class="btn btn-secondary">
        📊 View Results
      </button>
      <button @click="router.push('/diagnostic/foundational-fluency-print')" class="btn btn-outline">
        📄 Printable Worksheet
      </button>
      <button @click="router.push('/diagnostic/foundational-fluency')" class="btn btn-outline">
        🎮 Practice Mode
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>⏳ Loading assignments...</p>
    </div>

    <!-- Assignments List -->
    <div v-if="!loading && assignments.length > 0" class="assignments-section">
      <h2>Assigned Tests ({{ assignments.length }})</h2>

      <div class="assignments-list">
        <div 
          v-for="assignment in sortedAssignments" 
          :key="assignment.id"
          class="assignment-card"
        >
          <div class="assignment-header">
            <div class="assignment-info">
              <h3>{{ getStudentName(assignment.studentUid) }}</h3>
              <span class="module-badge">{{ formatModuleName(assignment.module) }}</span>
              <span class="status-badge" :class="assignment.status">
                {{ formatStatus(assignment.status) }}
              </span>
            </div>
            <div class="assignment-actions">
              <button 
                v-if="assignment.status !== 'completed'" 
                @click="deleteAssignment(assignment.id)" 
                class="btn-delete"
                title="Delete assignment"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="assignment-meta">
            <span>📅 Assigned: {{ formatDate(assignment.createdAt) }}</span>
            <span v-if="assignment.completedAt">✅ Completed: {{ formatDate(assignment.completedAt) }}</span>
            <span v-if="assignment.score !== undefined">📊 Score: {{ assignment.score }}%</span>
          </div>

          <div v-if="assignment.status === 'completed'" class="assignment-preview">
            <div class="preview-stats">
              <span>✓ {{ assignment.score || 0 }}% accuracy</span>
              <button @click="viewResults(assignment)" class="btn-view-results">
                View Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Assignments -->
    <div v-if="!loading && assignments.length === 0" class="no-assignments">
      <p>📭 No assignments yet</p>
      <p>Click "Assign New Test" to get started!</p>
    </div>

    <!-- Assignment Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>➕ Assign Foundational Fluency Test</h2>
          <button @click="closeAssignModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Select Module: <span class="required">*</span></label>
            <select v-model="newAssignment.module" required>
              <option value="">-- Choose a module --</option>
              <option value="subitizing">Subitizing (Recognize quantities instantly)</option>
              <option value="making5">Making 5 (Mental strategies to complete to 5)</option>
              <option value="making10">Making 10 (Mental strategies to complete to 10)</option>
              <option value="symbolic">Symbolic (Addition/Subtraction fluency)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Select Student(s): <span class="required">*</span></label>
            <div class="student-selection">
              <div class="select-all-option">
                <input 
                  type="checkbox" 
                  id="select-all"
                  v-model="selectAllStudents"
                  @change="toggleSelectAll"
                />
                <label for="select-all"><strong>Select All Students</strong></label>
              </div>
              <div class="students-list">
                <div v-for="student in students" :key="student.uid" class="student-option">
                  <input 
                    type="checkbox" 
                    :id="`student-${student.uid}`"
                    :value="student.uid"
                    v-model="newAssignment.studentUids"
                  />
                  <label :for="`student-${student.uid}`">
                    {{ student.firstName }} {{ student.lastName }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Number of Problems:</label>
            <input 
              type="number" 
              v-model.number="newAssignment.problemCount" 
              min="5" 
              max="30" 
              placeholder="10-20 recommended"
            />
            <small>Recommended: 10-20 problems for assessment</small>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="newAssignment.useFlashMode" />
              Enable Flash Mode (true subitizing - 2 second visual display)
            </label>
            <small>When enabled, visuals appear for 2 seconds then disappear</small>
          </div>

          <div class="form-group">
            <label>Notes (optional):</label>
            <textarea 
              v-model="newAssignment.notes" 
              placeholder="Any special instructions or notes for the student..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAssignModal" class="btn btn-secondary">Cancel</button>
          <button 
            @click="assignTest" 
            class="btn btn-primary"
            :disabled="!canAssign || assigning"
          >
            {{ assigning ? '⏳ Assigning...' : '✓ Assign Test' }}
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
import { db } from '@/firebase/config'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore'
import { getStudentsByTeacher } from '@/firebase/userServices'
import type { Student } from '@/types/users'

const router = useRouter()
const authStore = useAuthStore()

// State
const students = ref<Student[]>([])
const assignments = ref<any[]>([])
const loading = ref(true)
const assigning = ref(false)
const showAssignModal = ref(false)
const selectAllStudents = ref(false)

const newAssignment = ref({
  module: '',
  studentUids: [] as string[],
  problemCount: 15,
  useFlashMode: true,
  notes: ''
})

// Computed
const sortedAssignments = computed(() => {
  return [...assignments.value].sort((a, b) => {
    // Sort by status (pending first), then by date
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1
    }
    const aTime = a.createdAt?.toMillis() || 0
    const bTime = b.createdAt?.toMillis() || 0
    return bTime - aTime
  })
})

const canAssign = computed(() => {
  return newAssignment.value.module && 
         newAssignment.value.studentUids.length > 0 &&
         newAssignment.value.problemCount >= 5 &&
         newAssignment.value.problemCount <= 30
})

// Methods
async function loadData() {
  if (!authStore.currentUser) return
  
  loading.value = true
  
  try {
    // Load students
    if (authStore.userRole === 'teacher') {
      students.value = await getStudentsByTeacher(authStore.currentUser.uid)
    }
    
    // Load assignments
    const assignmentsQuery = query(
      collection(db, 'diagnosticAssignments'),
      where('diagnosticType', '==', 'foundational-fluency'),
      where('teacherUid', '==', authStore.currentUser.uid)
    )
    
    const snapshot = await getDocs(assignmentsQuery)
    assignments.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log('✅ Loaded data:', { students: students.value.length, assignments: assignments.value.length })
  } catch (error) {
    console.error('Error loading data:', error)
    alert('Error loading data. Please try again.')
  } finally {
    loading.value = false
  }
}

function toggleSelectAll() {
  if (selectAllStudents.value) {
    newAssignment.value.studentUids = students.value.map(s => s.uid)
  } else {
    newAssignment.value.studentUids = []
  }
}

async function assignTest() {
  if (!canAssign.value || !authStore.currentUser) return
  
  assigning.value = true
  
  try {
    // Create an assignment for each selected student
    const assignmentPromises = newAssignment.value.studentUids.map(async (studentUid) => {
      const student = students.value.find(s => s.uid === studentUid)
      
      const assignment = {
        diagnosticType: 'foundational-fluency',
        module: newAssignment.value.module,
        studentUid: studentUid,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        teacherUid: authStore.currentUser!.uid,
        teacherName: authStore.currentUser!.displayName || 'Unknown Teacher',
        status: 'pending',
        isComplete: false,
        problemCount: newAssignment.value.problemCount,
        useFlashMode: newAssignment.value.useFlashMode,
        notes: newAssignment.value.notes || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      return addDoc(collection(db, 'diagnosticAssignments'), assignment)
    })
    
    await Promise.all(assignmentPromises)
    
    console.log('✅ Assigned tests to', newAssignment.value.studentUids.length, 'students')
    alert(`Successfully assigned ${formatModuleName(newAssignment.value.module)} test to ${newAssignment.value.studentUids.length} student(s)!`)
    
    // Reset form
    newAssignment.value = {
      module: '',
      studentUids: [],
      problemCount: 15,
      useFlashMode: true,
      notes: ''
    }
    selectAllStudents.value = false
    showAssignModal.value = false
    
    // Reload assignments
    await loadData()
  } catch (error) {
    console.error('Error assigning test:', error)
    alert('Error assigning test. Please try again.')
  } finally {
    assigning.value = false
  }
}

async function deleteAssignment(assignmentId: string) {
  if (!confirm('Are you sure you want to delete this assignment?')) return
  
  try {
    await deleteDoc(doc(db, 'diagnosticAssignments', assignmentId))
    console.log('✅ Deleted assignment:', assignmentId)
    alert('Assignment deleted successfully!')
    await loadData()
  } catch (error) {
    console.error('Error deleting assignment:', error)
    alert('Error deleting assignment. Please try again.')
  }
}

function viewResults(assignment: any) {
  router.push('/diagnostic/foundational-fluency-results')
}

function getStudentName(studentUid: string): string {
  const student = students.value.find(s => s.uid === studentUid)
  return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'
}

function formatModuleName(module: string): string {
  const names: Record<string, string> = {
    'subitizing': 'Subitizing',
    'making5': 'Making 5',
    'making10': 'Making 10',
    'symbolic': 'Symbolic'
  }
  return names[module] || module
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    'pending': '⏳ Pending',
    'in-progress': '📝 In Progress',
    'completed': '✅ Completed'
  }
  return statuses[status] || status
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'Unknown'
  
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function closeAssignModal() {
  showAssignModal.value = false
  newAssignment.value = {
    module: '',
    studentUids: [],
    problemCount: 15,
    useFlashMode: true,
    notes: ''
  }
  selectAllStudents.value = false
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.foundational-fluency-management {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

/* Actions */
.actions-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Loading */
.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #7f8c8d;
}

/* Assignments List */
.assignments-section h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.assignments-list {
  display: grid;
  gap: 1rem;
}

.assignment-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.assignment-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.assignment-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.assignment-info h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.module-badge {
  padding: 0.25rem 0.75rem;
  background: #3498db;
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.in-progress {
  background: #cce5ff;
  color: #004085;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.assignment-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-delete {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #fadbd8;
}

.assignment-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.95rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.assignment-preview {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.preview-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-view-results {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-view-results:hover {
  background: #2980b9;
}

/* No Assignments */
.no-assignments {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.no-assignments p {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0.5rem 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #ecf0f1;
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
  color: #7f8c8d;
  padding: 0.5rem;
  line-height: 1;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.required {
  color: #e74c3c;
}

.form-group select,
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.student-selection {
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.select-all-option {
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid #e1e8ed;
}

.select-all-option input,
.student-option input {
  margin-right: 0.75rem;
}

.select-all-option label,
.student-option label {
  cursor: pointer;
  font-weight: normal;
  margin-bottom: 0;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.student-option {
  padding: 0.5rem;
  border-radius: 4px;
}

.student-option:hover {
  background: #f8f9fa;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 2px solid #ecf0f1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-outline {
  background: white;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}
</style>

