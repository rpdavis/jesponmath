<template>
  <div class="student-detail-page">
    <div class="header">
      <button @click="router.back()" class="back-btn">← Back to All Students</button>
      <div class="student-info">
        <h1>{{ studentName }}</h1>
        <p class="current-operation">
          Currently practicing: <strong>{{ currentOperation }}</strong>
        </p>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend-compact">
      <span class="legend-item"><span class="box blank"></span> Not Practiced</span>
      <span class="legend-item"><span class="box learning">!</span> Learning (&lt;40%)</span>
      <span class="legend-item"><span class="box emerging">○</span> Emerging (40-59%)</span>
      <span class="legend-item"><span class="box approaching">◐</span> Approaching (60-79%)</span>
      <span class="legend-item"><span class="box proficient">●</span> Proficient (80-89%)</span>
      <span class="legend-item"><span class="box mastered">✓</span> Mastered (90%+)</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading student progress...</p>
    </div>

    <!-- All Operations Facts Grid -->
    <div v-else class="operations-grid">
      <!-- Addition -->
      <div class="operation-section">
        <div class="operation-header" :class="{ current: currentOperation === 'Addition' }">
          <h2>➕ Addition (0-20)</h2>
          <div class="operation-stats">
            <span class="stat mastered">{{ getOperationStats('addition').mastered }} mastered</span>
            <span class="stat total">{{ getOperationStats('addition').total }} practiced</span>
          </div>
        </div>
        <div v-if="additionFacts.length === 0" class="no-data-message">
          Student hasn't started addition yet
        </div>
        <div class="facts-grid">
          <div
            v-for="fact in additionFacts"
            :key="fact.problemId"
            class="fact-cell"
            :class="fact.statusClass"
            :title="fact.tooltip"
          >
            <div class="fact-text">{{ fact.displayText }}</div>
            <div class="fact-icon">{{ fact.icon }}</div>
            <div v-if="fact.accuracy !== null" class="fact-accuracy">{{ fact.accuracy }}%</div>
          </div>
        </div>
      </div>

      <!-- Subtraction -->
      <div class="operation-section">
        <div class="operation-header" :class="{ current: currentOperation === 'Subtraction' }">
          <h2>➖ Subtraction (0-20)</h2>
          <div class="operation-stats">
            <span class="stat mastered"
              >{{ getOperationStats('subtraction').mastered }} mastered</span
            >
            <span class="stat total">{{ getOperationStats('subtraction').total }} practiced</span>
          </div>
        </div>
        <div v-if="subtractionFacts.length === 0" class="no-data-message">
          Student hasn't started subtraction yet
        </div>
        <div class="facts-grid">
          <div
            v-for="fact in subtractionFacts"
            :key="fact.problemId"
            class="fact-cell"
            :class="fact.statusClass"
            :title="fact.tooltip"
          >
            <div class="fact-text">{{ fact.displayText }}</div>
            <div class="fact-icon">{{ fact.icon }}</div>
            <div v-if="fact.accuracy !== null" class="fact-accuracy">{{ fact.accuracy }}%</div>
          </div>
        </div>
      </div>

      <!-- Multiplication -->
      <div class="operation-section">
        <div class="operation-header" :class="{ current: currentOperation === 'Multiplication' }">
          <h2>✖️ Multiplication (0-12)</h2>
          <div class="operation-stats">
            <span class="stat mastered"
              >{{ getOperationStats('multiplication').mastered }} mastered</span
            >
            <span class="stat total"
              >{{ getOperationStats('multiplication').total }} practiced</span
            >
          </div>
        </div>
        <div v-if="multiplicationFacts.length === 0" class="no-data-message">
          Student hasn't started multiplication yet
        </div>
        <div class="facts-grid">
          <div
            v-for="fact in multiplicationFacts"
            :key="fact.problemId"
            class="fact-cell"
            :class="fact.statusClass"
            :title="fact.tooltip"
          >
            <div class="fact-text">{{ fact.displayText }}</div>
            <div class="fact-icon">{{ fact.icon }}</div>
            <div v-if="fact.accuracy !== null" class="fact-accuracy">{{ fact.accuracy }}%</div>
          </div>
        </div>
      </div>

      <!-- Division -->
      <div class="operation-section">
        <div class="operation-header" :class="{ current: currentOperation === 'Division' }">
          <h2>➗ Division (0-12)</h2>
          <div class="operation-stats">
            <span class="stat mastered">{{ getOperationStats('division').mastered }} mastered</span>
            <span class="stat total">{{ getOperationStats('division').total }} practiced</span>
          </div>
        </div>
        <div v-if="divisionFacts.length === 0" class="no-data-message">
          Student hasn't started division yet
        </div>
        <div class="facts-grid">
          <div
            v-for="fact in divisionFacts"
            :key="fact.problemId"
            class="fact-cell"
            :class="fact.statusClass"
            :title="fact.tooltip"
          >
            <div class="fact-text">{{ fact.displayText }}</div>
            <div class="fact-icon">{{ fact.icon }}</div>
            <div v-if="fact.accuracy !== null" class="fact-accuracy">{{ fact.accuracy }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getUserProfile } from '@/firebase/userServices'
import { getFluencyProgress } from '@/services/mathFluencyServices'
import type { OperationType, ProblemProgress } from '@/types/mathFluency'
import { getAllProblemsForOperation } from '@/utils/mathFluencyProblemGenerator'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const studentUid = ref(route.params.studentUid as string)
const studentName = ref('')
const currentOperation = ref('')
const loading = ref(true)

// Progress for all operations
const additionProgress = ref<any>(null)
const subtractionProgress = ref<any>(null)
const multiplicationProgress = ref<any>(null)
const divisionProgress = ref<any>(null)

// Build fact lists with status - shows EXACTLY what's in database
function buildFactList(operation: OperationType, progressData: any) {
  if (!progressData) {
    return [] // No data - return empty (will show message)
  }

  // Show EXACTLY what's in the database - no matching, no filtering
  // If student practiced both 4+5 and 5+4, show both!
  const allProblems: ProblemProgress[] = [
    ...(progressData.problemBanks?.doesNotKnow || []),
    ...(progressData.problemBanks?.emerging || []),
    ...(progressData.problemBanks?.approaching || []),
    ...(progressData.problemBanks?.proficient || []),
    ...(progressData.problemBanks?.mastered || []),
  ]

  console.log(`📊 ${operation} - Showing ${allProblems.length} problems directly from database`)

  // Convert each problem to display format using its actual proficiency level
  return allProblems.map((problem: ProblemProgress) => {
    const accuracy =
      problem.totalAttempts > 0
        ? Math.round((problem.correctAttempts / problem.totalAttempts) * 100)
        : 0

    // Use the proficiencyLevel from the database (what the system calculated)
    let statusClass = 'learning'
    let icon = '!'

    if (problem.proficiencyLevel === 'mastered') {
      statusClass = 'mastered'
      icon = '✓'
    } else if (problem.proficiencyLevel === 'proficient') {
      statusClass = 'proficient'
      icon = '●'
    } else if (problem.proficiencyLevel === 'approaching') {
      statusClass = 'approaching'
      icon = '◐'
    } else if (problem.proficiencyLevel === 'emerging') {
      statusClass = 'emerging'
      icon = '○'
    } else if (problem.proficiencyLevel === 'doesNotKnow') {
      statusClass = 'learning'
      icon = '!'
    }

    return {
      problemId: problem.problemId,
      displayText: problem.displayText || `${problem.num1} + ${problem.num2}`,
      statusClass,
      icon,
      accuracy,
      attempts: problem.totalAttempts,
      tooltip: `${problem.displayText}\n${accuracy}% accuracy\n${problem.totalAttempts} attempts`,
    }
  })
}

const additionFacts = computed(() => buildFactList('addition', additionProgress.value))
const subtractionFacts = computed(() => buildFactList('subtraction', subtractionProgress.value))
const multiplicationFacts = computed(() =>
  buildFactList('multiplication', multiplicationProgress.value),
)
const divisionFacts = computed(() => buildFactList('division', divisionProgress.value))

function getOperationStats(operation: OperationType) {
  let facts: Array<{ statusClass: string }> = []
  if (operation === 'addition') facts = additionFacts.value
  else if (operation === 'subtraction') facts = subtractionFacts.value
  else if (operation === 'multiplication') facts = multiplicationFacts.value
  else if (operation === 'division') facts = divisionFacts.value

  return {
    mastered: facts.filter((f) => f.statusClass === 'mastered').length,
    total: facts.length,
  }
}

async function loadData() {
  loading.value = true

  try {
    // Load student info
    const student = await getUserProfile(studentUid.value)
    if (student) {
      studentName.value = `${student.firstName} ${student.lastName}`
    }

    // Load progress for ALL operations
    const [add, sub, mult, div] = await Promise.all([
      getFluencyProgress(studentUid.value, 'addition'),
      getFluencyProgress(studentUid.value, 'subtraction'),
      getFluencyProgress(studentUid.value, 'multiplication'),
      getFluencyProgress(studentUid.value, 'division'),
    ])

    additionProgress.value = add
    subtractionProgress.value = sub
    multiplicationProgress.value = mult
    divisionProgress.value = div

    // Determine which operation they're currently on
    if (add && !add.completedOperation) currentOperation.value = 'Addition'
    else if (sub && !sub.completedOperation) currentOperation.value = 'Subtraction'
    else if (mult && !mult.completedOperation) currentOperation.value = 'Multiplication'
    else if (div && !div.completedOperation) currentOperation.value = 'Division'
    else currentOperation.value = 'All Complete'

    console.log('📊 Loaded progress:', {
      addition: add ? 'data loaded' : 'none',
      subtraction: sub ? 'data loaded' : 'none',
      multiplication: mult ? 'data loaded' : 'none',
      division: div ? 'data loaded' : 'none',
      currentOp: currentOperation.value,
    })

    // Log some sample data for debugging
    if (add) {
      const sampleProblems = [
        ...(add.problemBanks?.mastered || []).slice(0, 2),
        ...(add.problemBanks?.doesNotKnow || []).slice(0, 2),
      ]
      console.log(
        'Sample problems from addition progress:',
        sampleProblems.map((p) => ({
          id: p.problemId,
          text: p.displayText,
          accuracy:
            p.totalAttempts > 0 ? Math.round((p.correctAttempts / p.totalAttempts) * 100) : 0,
        })),
      )
    }
  } catch (error) {
    console.error('Error loading student data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.student-detail-page {
  max-width: 1800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.back-btn {
  background: #f8f9fa;
  border: 2px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #555;
  margin-bottom: 1rem;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.student-info h1 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.current-operation {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.current-operation strong {
  color: #2196f3;
  font-size: 1.2rem;
}

/* Legend */
.legend-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-item .box {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
  border: 2px solid;
}

.box.blank {
  background: white;
  border-color: #ccc;
  border-style: dashed;
}

.box.learning {
  background: #ffcdd2;
  color: #c62828;
  border-color: #ef5350;
}

.box.emerging {
  background: #c8e6c9;
  color: #2e7d32;
  border-color: #66bb6a;
}

.box.approaching {
  background: #fff9c4;
  color: #f57f17;
  border-color: #ffeb3b;
}

.box.proficient {
  background: #bbdefb;
  color: #1565c0;
  border-color: #42a5f5;
}

.box.mastered {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #f57f17;
  border-color: #ffc107;
}

/* Operations Grid */
.operations-grid {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.operation-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.operation-header.current {
  border-bottom-color: #2196f3;
  border-bottom-width: 4px;
}

.operation-header.current h2 {
  color: #2196f3;
}

.operation-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.operation-stats {
  display: flex;
  gap: 1.5rem;
  font-size: 0.95rem;
}

.operation-stats .stat {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
}

.operation-stats .stat.mastered {
  background: #fff9c4;
  color: #f57f17;
}

.operation-stats .stat.total {
  background: #f8f9fa;
  color: #666;
}

.no-data-message {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 1rem;
}

/* Facts Grid */
.facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
  gap: 6px;
}

.fact-cell {
  aspect-ratio: 1;
  padding: 0.4rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid;
  font-size: 0.8rem;
}

.fact-cell:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.fact-cell.notStarted {
  background: white;
  border-color: #ddd;
  border-style: dashed;
}

.fact-cell.learning {
  background: #ffcdd2;
  border-color: #ef5350;
  color: #c62828;
}

.fact-cell.emerging {
  background: #c8e6c9;
  border-color: #66bb6a;
  color: #2e7d32;
}

.fact-cell.approaching {
  background: #fff9c4;
  border-color: #ffeb3b;
  color: #f57f17;
}

.fact-cell.proficient {
  background: #bbdefb;
  border-color: #42a5f5;
  color: #1565c0;
}

.fact-cell.mastered {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border-color: #ffc107;
  color: #f57f17;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
  font-weight: bold;
}

.fact-text {
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

.fact-icon {
  font-size: 1.1rem;
  margin-top: 0.2rem;
}

.fact-accuracy {
  font-size: 0.65rem;
  margin-top: 0.2rem;
  opacity: 0.8;
}

.loading {
  text-align: center;
  padding: 4rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
