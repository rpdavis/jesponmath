<template>
  <div class="cpm-report">
    <div class="header">
      <h2>📊 Fluency CPM Report</h2>
      <p class="subtitle">Paper assessment performance by operation (for IEP reporting)</p>
    </div>

    <!-- Student Selection -->
    <div class="controls card">
      <label>
        Select Student:
        <select v-model="selectedStudentUid" @change="loadStudentData">
          <option value="">Choose a student...</option>
          <option v-for="student in students" :key="student.uid" :value="student.uid">
            {{ student.lastName }}, {{ student.firstName }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading fluency data...</p>
    </div>

    <div v-if="!loading && selectedStudentUid && cpmData" class="report-content">
      <!-- CPM Overview -->
      <div class="cpm-overview card">
        <h3>{{ studentName }} - Fluency Rates (CPM)</h3>

        <div class="cpm-grid">
          <div
            v-for="op in operations"
            :key="op.type"
            class="cpm-card"
            :class="getCPMClass(op.cpm, op.target)"
          >
            <div class="op-header">
              <span class="op-icon">{{ op.icon }}</span>
              <h4>{{ op.label }}</h4>
            </div>

            <div class="cpm-value">
              <span class="number">{{ op.cpm }}</span>
              <span class="unit">CPM</span>
            </div>

            <div class="cpm-details">
              <div class="detail-row">
                <span>Target:</span>
                <span class="target">{{ op.target }} CPM</span>
              </div>
              <div class="detail-row">
                <span>Status:</span>
                <span class="status" :class="getStatusClass(op.cpm, op.target)">
                  {{ getStatusText(op.cpm, op.target) }}
                </span>
              </div>
              <div class="detail-row" v-if="op.lastAssessment">
                <span>Last Test:</span>
                <span class="date">{{ formatDate(op.lastAssessment) }}</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="cpm-progress-bar">
              <div
                class="cpm-progress-fill"
                :style="{ width: `${Math.min((op.cpm / op.target) * 100, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- CPM History Graph -->
      <div class="cpm-history card">
        <h3>CPM Growth Over Time</h3>
        <div class="history-chart">
          <!-- Simple text-based chart for now -->
          <div v-for="op in operations.filter(o => o.history.length > 0)" :key="op.type" class="op-history">
            <h4>{{ op.icon }} {{ op.label }}</h4>
            <div class="history-timeline">
              <div v-for="(entry, index) in op.history" :key="index" class="history-entry">
                <span class="week">Week {{ entry.week }}</span>
                <div class="cpm-bar-container">
                  <div
                    class="cpm-bar"
                    :style="{ width: `${(entry.cpm / op.target) * 100}%` }"
                  >
                    <span class="cpm-label">{{ entry.cpm }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottleneck Analysis -->
      <div class="bottleneck-analysis card">
        <h3>🎯 Bottleneck Problems (from Digital Practice)</h3>
        <p class="help-text">
          Problems that are slowing down overall fluency rate.
          These are likely the facts the student gets "stuck" on during paper assessments.
        </p>

        <div v-for="op in operations" :key="'bottleneck-' + op.type" class="op-bottlenecks">
          <h4>{{ op.icon }} {{ op.label }}</h4>

          <div v-if="op.bottlenecks.length > 0" class="bottleneck-list">
            <div v-for="problem in op.bottlenecks" :key="problem.problemId" class="bottleneck-item">
              <div class="problem-display">
                <span class="problem-text">{{ problem.displayText }}</span>
                <span class="proficiency-badge" :class="problem.proficiencyLevel">
                  {{ formatProficiencyLevel(problem.proficiencyLevel) }}
                </span>
              </div>

              <div class="problem-stats">
                <div class="stat">
                  <span class="stat-label">Avg Time:</span>
                  <span class="stat-value warning">{{ (problem.averageResponseTime / 1000).toFixed(1) }}s</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Last 5:</span>
                  <span class="stat-value">{{ problem.correctOutOf5 }}/5 correct</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Attempts:</span>
                  <span class="stat-value">{{ problem.totalAttempts }}</span>
                </div>
              </div>

              <div class="recommendation">
                <span class="rec-icon">💡</span>
                <span>{{ getProblemRecommendation(problem) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="no-bottlenecks">
            <p>✅ No bottleneck problems detected - student is fluent across all facts!</p>
          </div>
        </div>
      </div>

      <!-- IEP Summary -->
      <div class="iep-summary card">
        <h3>📋 IEP Summary</h3>

        <div class="summary-section">
          <h4>Current Performance</h4>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Current CPM</th>
                <th>Target CPM</th>
                <th>Gap</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in operations" :key="'summary-' + op.type">
                <td><strong>{{ op.label }}</strong></td>
                <td>{{ op.cpm }}</td>
                <td>{{ op.target }}</td>
                <td :class="op.cpm >= op.target ? 'positive' : 'negative'">
                  {{ op.cpm >= op.target ? '+' : '' }}{{ op.cpm - op.target }}
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(op.cpm, op.target)">
                    {{ getStatusText(op.cpm, op.target) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="summary-section">
          <h4>Bottleneck Facts (Target for Intervention)</h4>
          <ul class="bottleneck-summary">
            <li v-for="op in operations.filter(o => o.bottlenecks.length > 0)" :key="'summary-bn-' + op.type">
              <strong>{{ op.label }}:</strong>
              {{ op.bottlenecks.map(b => b.displayText.replace(' = ?', '')).join(', ') }}
              ({{ op.bottlenecks.length }} facts)
            </li>
          </ul>
          <p v-if="operations.every(o => o.bottlenecks.length === 0)" class="success-message">
            ✅ No bottleneck facts - student demonstrates fluency across all operations
          </p>
        </div>

        <button @click="exportReport" class="btn-export">
          📥 Export IEP Report (PDF)
        </button>
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
  getStudentPaperAssessments
} from '@/services/mathFluencyServices'
import type { Student } from '@/types/users'
import type { OperationType, MathFluencyProgress, ProblemProgress, ProficiencyLevel } from '@/types/mathFluency'
import { getSubLevelConfig } from '@/config/fluencySubLevels'

const authStore = useAuthStore()

const students = ref<Student[]>([])
const selectedStudentUid = ref('')
const loading = ref(false)
const cpmData = ref<any>(null)

const studentName = computed(() => {
  const student = students.value.find(s => s.uid === selectedStudentUid.value)
  return student ? `${student.firstName} ${student.lastName}` : ''
})

interface OperationData {
  type: OperationType | 'mixed'
  label: string
  icon: string
  cpm: number
  target: number
  lastAssessment: Date | null
  history: { week: number; cpm: number; date: Date }[]
  bottlenecks: {
    problemId: string
    displayText: string
    proficiencyLevel: ProficiencyLevel
    averageResponseTime: number
    correctOutOf5: number
    totalAttempts: number
  }[]
}

const operations = ref<OperationData[]>([
  { type: 'addition', label: 'Addition', icon: '➕', cpm: 0, target: 50, lastAssessment: null, history: [], bottlenecks: [] },
  { type: 'subtraction', label: 'Subtraction', icon: '➖', cpm: 0, target: 50, lastAssessment: null, history: [], bottlenecks: [] },
  { type: 'multiplication', label: 'Multiplication', icon: '✖️', cpm: 0, target: 40, lastAssessment: null, history: [], bottlenecks: [] },
  { type: 'division', label: 'Division', icon: '➗', cpm: 0, target: 35, lastAssessment: null, history: [], bottlenecks: [] },
])

onMounted(async () => {
  if (!authStore.currentUser) return

  try {
    students.value = await getStudentsByTeacher(authStore.currentUser.uid)
  } catch (error) {
    console.error('Error loading students:', error)
  }
})

async function loadStudentData() {
  if (!selectedStudentUid.value) return

  loading.value = true

  try {
    // Load all fluency progress for this student
    const allProgress = await getAllFluencyProgress(selectedStudentUid.value)

    // Load all paper assessments
    const paperAssessments = await getStudentPaperAssessments(selectedStudentUid.value)

    // Process each operation
    for (const op of operations.value) {
      if (op.type === 'mixed') continue // Skip mixed for now

      const progress = allProgress.find(p => p.operation === op.type)

      // Get latest CPM from paper assessments
      const opAssessments = paperAssessments
        .filter((a: any) => a.assessmentCategory === op.type)
        .sort((a: any, b: any) => b.assessmentDate.toMillis() - a.assessmentDate.toMillis())

      if (opAssessments.length > 0) {
        const latest = opAssessments[0]
        op.cpm = latest.scoring?.correctPerMinute || latest.scoring?.correct || 0
        op.lastAssessment = latest.assessmentDate.toDate()

        // Build history
        op.history = opAssessments
          .slice(0, 10) // Last 10 assessments
          .reverse()
          .map((a: any, index: number) => ({
            week: a.week || index + 1,
            cpm: a.scoring?.correctPerMinute || a.scoring?.correct || 0,
            date: a.assessmentDate.toDate()
          }))
      }

      // Identify bottleneck problems from digital practice
      if (progress) {
        const allProblems: ProblemProgress[] = [
          ...progress.problemBanks.doesNotKnow,
          ...progress.problemBanks.emerging,
          ...progress.problemBanks.approaching,
          ...progress.problemBanks.proficient,
        ]

        // Bottleneck = slow response time OR low proficiency
        op.bottlenecks = allProblems
          .filter(p => {
            const avgTime = p.averageResponseTime || 0
            const isProficient = p.proficiencyLevel === 'proficient' || p.proficiencyLevel === 'mastered'

            // Bottleneck if:
            // - Average response > 5 seconds (slow)
            // - OR not yet proficient/mastered
            return avgTime > 5000 || !isProficient
          })
          .sort((a, b) => {
            // Sort by avg response time (slowest first)
            return (b.averageResponseTime || 0) - (a.averageResponseTime || 0)
          })
          .slice(0, 10) // Top 10 bottlenecks
          .map(p => ({
            problemId: p.problemId,
            displayText: p.displayText,
            proficiencyLevel: p.proficiencyLevel,
            averageResponseTime: p.averageResponseTime || 0,
            correctOutOf5: p.last5Attempts.filter(a => a.correct).length,
            totalAttempts: p.totalAttempts
          }))
      }
    }

    cpmData.value = true
  } catch (error) {
    console.error('Error loading CPM data:', error)
    alert('Error loading data. Please try again.')
  } finally {
    loading.value = false
  }
}

function getCPMClass(cpm: number, target: number): string {
  const percentage = (cpm / target) * 100
  if (percentage >= 100) return 'excellent'
  if (percentage >= 80) return 'good'
  if (percentage >= 60) return 'fair'
  return 'needs-work'
}

function getStatusClass(cpm: number, target: number): string {
  const percentage = (cpm / target) * 100
  if (percentage >= 100) return 'status-excellent'
  if (percentage >= 80) return 'status-good'
  if (percentage >= 60) return 'status-fair'
  return 'status-needs-work'
}

function getStatusText(cpm: number, target: number): string {
  const percentage = (cpm / target) * 100
  if (percentage >= 100) return '✅ Meets Goal'
  if (percentage >= 80) return '📈 Approaching'
  if (percentage >= 60) return '⚠️ Developing'
  return '🔴 Needs Support'
}

function formatDate(date: Date | null): string {
  if (!date) return 'Not tested'
  return date.toLocaleDateString()
}

function formatProficiencyLevel(level: ProficiencyLevel): string {
  const map: Record<ProficiencyLevel, string> = {
    doesNotKnow: 'Unknown',
    emerging: 'Emerging',
    approaching: 'Approaching',
    proficient: 'Proficient',
    mastered: 'Mastered'
  }
  return map[level] || level
}

function getProblemRecommendation(problem: any): string {
  if (problem.averageResponseTime > 10000) {
    return 'Extremely slow - likely retrieval issue, needs encoding practice'
  }
  if (problem.averageResponseTime > 5000) {
    return 'Slow response - needs more practice for automaticity'
  }
  if (problem.correctOutOf5 < 3) {
    return 'Inconsistent - needs consolidation practice'
  }
  return 'Approaching fluency - continue practice'
}

function exportReport() {
  // Generate printable IEP report
  window.print()
}
</script>

<style scoped>
.cpm-report {
  max-width: 1400px;
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
  margin-bottom: 1.5rem;
}

.controls label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.controls select {
  padding: 0.75rem;
  border: 2px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
}

.loading {
  text-align: center;
  padding: 4rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #8e44ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* CPM Grid */
.cpm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.cpm-card {
  border: 3px solid #dfe6e9;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.cpm-card.excellent {
  border-color: #27ae60;
  background: #f0fdf4;
}

.cpm-card.good {
  border-color: #3498db;
  background: #eff6ff;
}

.cpm-card.fair {
  border-color: #f39c12;
  background: #fefce8;
}

.cpm-card.needs-work {
  border-color: #e74c3c;
  background: #fef2f2;
}

.op-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.op-icon {
  font-size: 2rem;
}

.op-header h4 {
  margin: 0;
  font-size: 1.3rem;
  color: #2c3e50;
}

.cpm-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.cpm-value .number {
  font-size: 3rem;
  font-weight: bold;
  color: #2c3e50;
}

.cpm-value .unit {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.cpm-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .target {
  color: #7f8c8d;
  font-weight: 600;
}

.detail-row .status {
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.status.status-excellent {
  background: #d5f4e6;
  color: #27ae60;
}

.status.status-good {
  background: #dbeafe;
  color: #3498db;
}

.status.status-fair {
  background: #fef9c3;
  color: #f39c12;
}

.status.status-needs-work {
  background: #fee2e2;
  color: #e74c3c;
}

.cpm-progress-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.cpm-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8e44ad, #3498db);
  transition: width 0.3s;
}

/* History */
.history-chart {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.op-history h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.history-entry .week {
  width: 80px;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.cpm-bar-container {
  flex: 1;
  height: 30px;
  background: #f8f9fa;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.cpm-bar {
  height: 100%;
  background: linear-gradient(90deg, #27ae60, #229954);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  min-width: 40px;
}

.cpm-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Bottlenecks */
.op-bottlenecks {
  margin-bottom: 2rem;
}

.op-bottlenecks h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.bottleneck-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bottleneck-item {
  background: #fef9c3;
  border-left: 4px solid #f39c12;
  padding: 1rem;
  border-radius: 8px;
}

.problem-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.problem-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.proficiency-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.proficiency-badge.doesNotKnow {
  background: #fee2e2;
  color: #e74c3c;
}

.proficiency-badge.emerging {
  background: #fef9c3;
  color: #f39c12;
}

.proficiency-badge.approaching {
  background: #dbeafe;
  color: #3498db;
}

.proficiency-badge.proficient {
  background: #d5f4e6;
  color: #27ae60;
}

.problem-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.stat-value {
  font-weight: 600;
  color: #2c3e50;
}

.stat-value.warning {
  color: #e74c3c;
}

.recommendation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #7f8c8d;
  font-style: italic;
}

.rec-icon {
  font-size: 1.2rem;
}

.no-bottlenecks {
  background: #f0fdf4;
  border: 2px solid #27ae60;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  color: #27ae60;
  font-weight: 600;
}

/* IEP Summary */
.summary-section {
  margin-bottom: 2rem;
}

.summary-section h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table th,
.summary-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.summary-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.summary-table td.positive {
  color: #27ae60;
  font-weight: 600;
}

.summary-table td.negative {
  color: #e74c3c;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.bottleneck-summary {
  line-height: 1.8;
  color: #2c3e50;
}

.success-message {
  color: #27ae60;
  font-weight: 600;
  text-align: center;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 8px;
}

.btn-export {
  width: 100%;
  padding: 1rem;
  background: #8e44ad;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #7d3c98;
  transform: translateY(-2px);
}

/* Print Styles */
@media print {
  .controls, .btn-export {
    display: none;
  }

  .card {
    box-shadow: none;
    page-break-inside: avoid;
  }
}
</style>
