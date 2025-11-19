<template>
  <div class="foundational-fluency-results">
    <div class="page-header">
      <h1>🎯 Foundational Fluency Results</h1>
      <p>View student performance on foundational number sense assessments</p>
    </div>

    <!-- Filter Options -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Filter by Module:</label>
        <select v-model="selectedModule">
          <option value="all">All Modules</option>
          <option value="subitizing">Subitizing</option>
          <option value="making5">Making 5</option>
          <option value="making10">Making 10</option>
          <option value="symbolic">Symbolic</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Filter by Student:</label>
        <select v-model="selectedStudentFilter">
          <option value="all">All Students</option>
          <option v-for="student in allStudents" :key="student.uid" :value="student.uid">
            {{ student.firstName }} {{ student.lastName }}
          </option>
        </select>
      </div>

      <button @click="loadResults" class="btn btn-primary">
        🔄 Refresh
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>⏳ Loading results...</p>
    </div>

    <!-- Results List -->
    <div v-if="!loading && filteredResults.length > 0" class="results-section">
      <h2>Results ({{ filteredResults.length }})</h2>

      <div class="results-list">
        <div 
          v-for="result in filteredResults" 
          :key="result.id"
          class="result-card"
          @click="showDetailedResults(result)"
        >
          <div class="result-header">
            <div class="student-info">
              <h3>{{ result.studentName || 'Unknown Student' }}</h3>
              <span class="module-type">{{ formatModuleName(result.module) }}</span>
              <span class="test-mode" :class="result.mode">
                {{ result.mode === 'assessment' ? '📝 Assessment' : '🎮 Practice' }}
              </span>
            </div>
            <div class="result-score" :class="getScoreClass(result.accuracy || 0)">
              {{ result.accuracy || 0 }}%
            </div>
          </div>

          <div class="result-meta">
            <span>📅 {{ formatDate(result.completedAt || result.createdAt) }}</span>
            <span>📝 {{ result.totalProblems || 0 }} problems</span>
            <span>✅ {{ result.correctCount || 0 }}/{{ result.totalProblems || 0 }} correct</span>
            <span>⏱️ Avg: {{ result.averageResponseTime?.toFixed(1) || 'N/A' }}s</span>
          </div>

          <!-- Module-specific breakdown -->
          <div class="result-preview">
            <div v-if="result.responseTimeBreakdown" class="fluency-breakdown">
              <div class="fluency-item fluent">
                <span class="label">🟢 Fluent (&lt;3s):</span>
                <span class="value">{{ result.responseTimeBreakdown.fluent || 0 }}</span>
              </div>
              <div class="fluency-item emerging">
                <span class="label">🟡 Emerging (3-6s):</span>
                <span class="value">{{ result.responseTimeBreakdown.emerging || 0 }}</span>
              </div>
              <div class="fluency-item developing">
                <span class="label">🔴 Developing (&gt;6s):</span>
                <span class="value">{{ result.responseTimeBreakdown.developing || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-if="!loading && filteredResults.length === 0" class="no-results">
      <p>📭 No results found for the selected filters</p>
      <p>Students will see their assigned tests in the Student Dashboard.</p>
    </div>

    <!-- Detailed Results Modal -->
    <div v-if="selectedResult" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>📊 Detailed Results</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="detail-section">
            <h3>Student Information</h3>
            <p><strong>Name:</strong> {{ selectedResult.studentName }}</p>
            <p><strong>Module:</strong> {{ formatModuleName(selectedResult.module) }}</p>
            <p><strong>Mode:</strong> {{ selectedResult.mode === 'assessment' ? 'Assessment' : 'Practice' }}</p>
            <p><strong>Date:</strong> {{ formatDate(selectedResult.completedAt || selectedResult.createdAt) }}</p>
          </div>

          <div class="detail-section">
            <h3>Overall Performance</h3>
            <div class="performance-stats">
              <div class="stat">
                <span class="stat-label">Accuracy:</span>
                <span class="stat-value" :class="getScoreClass(selectedResult.accuracy)">
                  {{ selectedResult.accuracy }}%
                </span>
              </div>
              <div class="stat">
                <span class="stat-label">Correct:</span>
                <span class="stat-value">{{ selectedResult.correctCount }}/{{ selectedResult.totalProblems }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Avg Response Time:</span>
                <span class="stat-value">{{ selectedResult.averageResponseTime?.toFixed(2) }}s</span>
              </div>
            </div>
          </div>

          <div v-if="selectedResult.responseTimeBreakdown" class="detail-section">
            <h3>Response Time Breakdown</h3>
            <div class="time-breakdown">
              <div class="time-item fluent">
                <span class="time-label">🟢 Fluent (&lt;3s)</span>
                <span class="time-count">{{ selectedResult.responseTimeBreakdown.fluent }}</span>
                <span class="time-percent">
                  {{ ((selectedResult.responseTimeBreakdown.fluent / selectedResult.totalProblems) * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="time-item emerging">
                <span class="time-label">🟡 Emerging (3-6s)</span>
                <span class="time-count">{{ selectedResult.responseTimeBreakdown.emerging }}</span>
                <span class="time-percent">
                  {{ ((selectedResult.responseTimeBreakdown.emerging / selectedResult.totalProblems) * 100).toFixed(0) }}%
                </span>
              </div>
              <div class="time-item developing">
                <span class="time-label">🔴 Developing (&gt;6s)</span>
                <span class="time-count">{{ selectedResult.responseTimeBreakdown.developing }}</span>
                <span class="time-percent">
                  {{ ((selectedResult.responseTimeBreakdown.developing / selectedResult.totalProblems) * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedResult.results && selectedResult.results.length > 0" class="detail-section">
            <h3>Problem-by-Problem Results</h3>
            <div class="problem-list">
              <div v-for="(prob, index) in selectedResult.results" :key="index" class="problem-item">
                <div class="problem-header">
                  <span class="problem-num">Q{{ index + 1 }}</span>
                  <span class="problem-status" :class="{ correct: prob.correct, incorrect: !prob.correct }">
                    {{ prob.correct ? '✓' : '✗' }}
                  </span>
                  <span class="problem-time" :class="getResponseTimeClass(prob.responseTime)">
                    ⏱️ {{ prob.responseTime?.toFixed(2) }}s
                  </span>
                </div>
                <div class="problem-details">
                  <p><strong>Question:</strong> {{ prob.questionText }}</p>
                  <p><strong>Answer:</strong> {{ prob.userAnswer }}</p>
                  <p v-if="!prob.correct"><strong>Correct Answer:</strong> {{ prob.correctAnswer }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Close</button>
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
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { getStudentsByTeacher } from '@/firebase/userServices'
import type { Student } from '@/types/users'

const router = useRouter()
const authStore = useAuthStore()

// State
const results = ref<any[]>([])
const allStudents = ref<Student[]>([])
const selectedModule = ref('all')
const selectedStudentFilter = ref('all')
const loading = ref(true)
const selectedResult = ref<any>(null)

// Computed
const filteredResults = computed(() => {
  let filtered = results.value

  if (selectedModule.value !== 'all') {
    filtered = filtered.filter(r => r.module === selectedModule.value)
  }

  if (selectedStudentFilter.value !== 'all') {
    filtered = filtered.filter(r => r.studentUid === selectedStudentFilter.value)
  }

  return filtered.sort((a, b) => {
    const aTime = a.completedAt?.toMillis() || a.createdAt?.toMillis() || 0
    const bTime = b.completedAt?.toMillis() || b.createdAt?.toMillis() || 0
    return bTime - aTime
  })
})

// Methods
async function loadResults() {
  if (!authStore.currentUser) return
  
  loading.value = true
  
  try {
    // Load students first
    if (authStore.userRole === 'teacher') {
      allStudents.value = await getStudentsByTeacher(authStore.currentUser.uid)
    }
    
    // Query foundational fluency results
    const resultsQuery = query(
      collection(db, 'diagnosticResults'),
      where('diagnosticType', '==', 'foundational-fluency'),
      orderBy('completedAt', 'desc')
    )
    
    const snapshot = await getDocs(resultsQuery)
    results.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log('✅ Loaded foundational fluency results:', results.value.length)
  } catch (error) {
    console.error('Error loading results:', error)
    alert('Error loading results. Please try again.')
  } finally {
    loading.value = false
  }
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

function formatDate(timestamp: any): string {
  if (!timestamp) return 'Unknown'
  
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'fair'
  return 'needs-work'
}

function getResponseTimeClass(time: number): string {
  if (time < 3) return 'fluent'
  if (time <= 6) return 'emerging'
  return 'developing'
}

function showDetailedResults(result: any) {
  selectedResult.value = result
}

function closeModal() {
  selectedResult.value = null
}

// Lifecycle
onMounted(() => {
  loadResults()
})
</script>

<style scoped>
.foundational-fluency-results {
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

/* Filters */
.filters-section {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.filter-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.filter-group select {
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.filter-group select:hover {
  border-color: #3498db;
}

/* Loading */
.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #7f8c8d;
}

/* Results List */
.results-section h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.results-list {
  display: grid;
  gap: 1rem;
}

.result-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.student-info h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.module-type {
  padding: 0.25rem 0.75rem;
  background: #3498db;
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.test-mode {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.test-mode.assessment {
  background: #e74c3c;
  color: white;
}

.test-mode.practice {
  background: #95a5a6;
  color: white;
}

.result-score {
  font-size: 2rem;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 12px;
}

.result-score.excellent {
  color: #27ae60;
  background: #d5f4e6;
}

.result-score.good {
  color: #2980b9;
  background: #d6eaf8;
}

.result-score.fair {
  color: #f39c12;
  background: #fef5e7;
}

.result-score.needs-work {
  color: #e74c3c;
  background: #fadbd8;
}

.result-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.95rem;
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.result-preview {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.fluency-breakdown {
  display: flex;
  gap: 1.5rem;
}

.fluency-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.fluency-item.fluent {
  background: #d5f4e6;
  color: #27ae60;
}

.fluency-item.emerging {
  background: #fff3cd;
  color: #856404;
}

.fluency-item.developing {
  background: #fadbd8;
  color: #c0392b;
}

.fluency-item .label {
  font-weight: 600;
}

.fluency-item .value {
  font-weight: bold;
  font-size: 1.1rem;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.no-results p {
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
  max-width: 900px;
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

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.detail-section p {
  margin: 0.5rem 0;
  color: #555;
}

.performance-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.time-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
}

.time-item.fluent {
  background: #d5f4e6;
}

.time-item.emerging {
  background: #fff3cd;
}

.time-item.developing {
  background: #fadbd8;
}

.time-label {
  font-weight: 600;
  flex: 1;
}

.time-count {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 1rem;
}

.time-percent {
  font-size: 1.1rem;
  color: #7f8c8d;
}

.problem-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.problem-item {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.problem-item.correct {
  border-left-color: #27ae60;
}

.problem-item.incorrect {
  border-left-color: #e74c3c;
}

.problem-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.problem-num {
  font-weight: bold;
  color: #2c3e50;
}

.problem-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
}

.problem-status.correct {
  background: #d5f4e6;
  color: #27ae60;
}

.problem-status.incorrect {
  background: #fadbd8;
  color: #e74c3c;
}

.problem-time {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.problem-time.fluent {
  background: #d5f4e6;
  color: #27ae60;
}

.problem-time.emerging {
  background: #fff3cd;
  color: #856404;
}

.problem-time.developing {
  background: #fadbd8;
  color: #c0392b;
}

.problem-details {
  color: #555;
  font-size: 0.95rem;
}

.problem-details p {
  margin: 0.25rem 0;
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

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}
</style>

