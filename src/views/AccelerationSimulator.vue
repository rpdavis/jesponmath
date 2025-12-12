<template>
  <div class="acceleration-simulator">
    <div class="header">
      <h1>🧪 Fluency Acceleration Simulator</h1>
      <p class="subtitle">Test placement logic without affecting real students</p>
    </div>

    <div class="simulator-container">
      <!-- Input Section -->
      <div class="input-section card">
        <h2>Diagnostic Results</h2>

        <div class="operation-inputs">
          <div class="operation-group">
            <h3>➕ Addition</h3>
            <div class="slider-group">
              <label>
                Proficiency: <strong>{{ additionProf }}%</strong>
                <input
                  type="range"
                  v-model.number="additionProf"
                  min="0"
                  max="100"
                  step="5"
                  @input="simulate"
                />
              </label>
              <label>
                Problems Tested: <strong>{{ additionProblems }}</strong>
                <input
                  type="range"
                  v-model.number="additionProblems"
                  min="10"
                  max="30"
                  step="5"
                  @input="simulate"
                />
              </label>
              <p class="calc">
                Correct: <strong>{{ Math.round(additionProblems * additionProf / 100) }}</strong> / {{ additionProblems }}
              </p>
            </div>
          </div>

          <div class="operation-group">
            <h3>➖ Subtraction</h3>
            <div class="slider-group">
              <label>
                Proficiency: <strong>{{ subtractionProf }}%</strong>
                <input
                  type="range"
                  v-model.number="subtractionProf"
                  min="0"
                  max="100"
                  step="5"
                  @input="simulate"
                />
              </label>
              <label>
                Problems Tested: <strong>{{ subtractionProblems }}</strong>
                <input
                  type="range"
                  v-model.number="subtractionProblems"
                  min="10"
                  max="30"
                  step="5"
                  @input="simulate"
                />
              </label>
              <p class="calc">
                Correct: <strong>{{ Math.round(subtractionProblems * subtractionProf / 100) }}</strong> / {{ subtractionProblems }}
              </p>
            </div>
          </div>
        </div>

        <div class="button-group">
          <button @click="simulate" class="btn-primary">
            🔄 Simulate Placement
          </button>
          <button @click="setPreset('highPerformer')" class="btn-secondary">
            Preset: High Performer (95%+)
          </button>
          <button @click="setPreset('moderate')" class="btn-secondary">
            Preset: Moderate (85%)
          </button>
          <button @click="setPreset('struggling')" class="btn-secondary">
            Preset: Struggling (60%)
          </button>
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section">
        <!-- Single Operation Placement -->
        <div class="card">
          <h2>📍 Single Operation Placement</h2>

          <div class="placement-result">
            <h3>Addition Placement</h3>
            <div class="result-details" v-if="additionPlacement">
              <div class="result-row">
                <span class="label">Starting Level:</span>
                <span class="value highlight">{{ additionPlacement.shortName }}</span>
              </div>
              <div class="result-row">
                <span class="label">Levels Skipped:</span>
                <span class="value">{{ additionPlacement.levelsSkipped }}</span>
              </div>
              <div class="result-row" v-if="additionPlacement.skippedLevels.length > 0">
                <span class="label">Skipped:</span>
                <span class="value small">{{ additionPlacement.skippedLevels.join(', ') }}</span>
              </div>
              <div class="result-row">
                <span class="label">Time Saved:</span>
                <span class="value success">~{{ additionPlacement.timeSaved }} minutes</span>
              </div>
            </div>
          </div>

          <div class="placement-result">
            <h3>Subtraction Placement</h3>
            <div class="result-details" v-if="subtractionPlacement">
              <div class="result-row">
                <span class="label">Starting Level:</span>
                <span class="value highlight">{{ subtractionPlacement.shortName }}</span>
              </div>
              <div class="result-row">
                <span class="label">Levels Skipped:</span>
                <span class="value">{{ subtractionPlacement.levelsSkipped }}</span>
              </div>
              <div class="result-row" v-if="subtractionPlacement.skippedLevels.length > 0">
                <span class="label">Skipped:</span>
                <span class="value small">{{ subtractionPlacement.skippedLevels.join(', ') }}</span>
              </div>
              <div class="result-row">
                <span class="label">Time Saved:</span>
                <span class="value success">~{{ subtractionPlacement.timeSaved }} minutes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cross-Operation Analysis -->
        <div class="card cross-operation" v-if="crossOperationResult">
          <h2>🚀 Cross-Operation Analysis</h2>

          <div class="result-details">
            <div class="result-row highlight-bg">
              <span class="label">Recommendation:</span>
              <span class="value highlight large">{{ crossOperationResult.recommendedStartingOperation }}</span>
            </div>
            <div class="result-row">
              <span class="label">Starting Level:</span>
              <span class="value">{{ crossOperationResult.recommendedStartingSubLevel || 'N/A' }}</span>
            </div>
            <div class="result-row" v-if="crossOperationResult.skippedOperations.length > 0">
              <span class="label">Operations Skipped:</span>
              <span class="value success large">{{ crossOperationResult.skippedOperations.join(', ') }}</span>
            </div>
            <div class="result-row">
              <span class="label">Estimated Time Saved:</span>
              <span class="value success large">{{ crossOperationResult.estimatedTimeSaved }}</span>
            </div>
            <div class="result-row reason">
              <span class="label">Reason:</span>
              <span class="value">{{ crossOperationResult.accelerationReason }}</span>
            </div>
          </div>
        </div>

        <!-- Expected Progression -->
        <div class="card">
          <h2>📈 Expected Progression</h2>

          <div class="progression-timeline">
            <div class="timeline-item" v-for="(step, index) in expectedProgression" :key="index">
              <div class="timeline-marker" :class="step.type">
                {{ step.icon }}
              </div>
              <div class="timeline-content">
                <h4>{{ step.title }}</h4>
                <p>{{ step.description }}</p>
                <span class="timeline-meta">{{ step.timeframe }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Console Output -->
        <div class="card console-output">
          <h2>💻 Console Output</h2>
          <p class="help-text">Open browser DevTools (F12) to see detailed placement logs</p>
          <button @click="clearLogs" class="btn-secondary">Clear Console</button>
        </div>
      </div>
    </div>

    <!-- Recent Simulations -->
    <div class="recent-simulations card" v-if="recentSimulations.length > 0">
      <h2>📋 Recent Simulations</h2>
      <div class="simulations-list">
        <div v-for="(sim, index) in recentSimulations" :key="index" class="simulation-entry">
          <div class="sim-header">
            <strong>{{ sim.timestamp }}</strong>
            <span class="badge" :class="sim.accelerated ? 'badge-success' : 'badge-neutral'">
              {{ sim.accelerated ? 'Accelerated' : 'Standard' }}
            </span>
          </div>
          <div class="sim-details">
            <span>Add: {{ sim.additionProf }}%</span>
            <span>Sub: {{ sim.subtractionProf }}%</span>
            <span>→ {{ sim.result }}</span>
          </div>
        </div>
      </div>
      <button @click="exportSimulations" class="btn-secondary">Export to CSV</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { determineStartingSubLevel, analyzeCrossOperationPlacement } from '@/utils/subLevelUtils'
import { getSubLevelConfig, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import type { OperationType } from '@/types/mathFluency'

// Input state
const additionProf = ref(75)
const additionProblems = ref(20)
const subtractionProf = ref(70)
const subtractionProblems = ref(20)

// Results
const additionPlacement = ref<any>(null)
const subtractionPlacement = ref<any>(null)
const crossOperationResult = ref<any>(null)

// Recent simulations
const recentSimulations = ref<any[]>([])

// Simulate placement
function simulate() {
  console.clear()
  console.log('%c🧪 ACCELERATION SIMULATOR', 'font-size: 20px; font-weight: bold; color: #8e44ad')

  // Addition placement
  const addLevel = determineStartingSubLevel('addition', additionProf.value / 100)
  const addConfig = getSubLevelConfig(addLevel)
  const addSubLevels = getSubLevelsForOperation('addition')
  const addSkipped = addSubLevels.filter(sl => addConfig && sl.operationOrder < addConfig.operationOrder)

  additionPlacement.value = {
    level: addLevel,
    shortName: addConfig?.shortName || addLevel,
    levelsSkipped: addSkipped.length,
    skippedLevels: addSkipped.map(sl => sl.shortName),
    timeSaved: addSkipped.length * 20
  }

  // Subtraction placement
  const subLevel = determineStartingSubLevel('subtraction', subtractionProf.value / 100)
  const subConfig = getSubLevelConfig(subLevel)
  const subSubLevels = getSubLevelsForOperation('subtraction')
  const subSkipped = subSubLevels.filter(sl => subConfig && sl.operationOrder < subConfig.operationOrder)

  subtractionPlacement.value = {
    level: subLevel,
    shortName: subConfig?.shortName || subLevel,
    levelsSkipped: subSkipped.length,
    skippedLevels: subSkipped.map(sl => sl.shortName),
    timeSaved: subSkipped.length * 20
  }

  // Cross-operation analysis
  const crossResult = analyzeCrossOperationPlacement([
    {
      operation: 'addition',
      proficiencyPercentage: additionProf.value / 100,
      accuracy: additionProf.value / 100,
      averageResponseTime: 2000
    },
    {
      operation: 'subtraction',
      proficiencyPercentage: subtractionProf.value / 100,
      accuracy: subtractionProf.value / 100,
      averageResponseTime: 2000
    }
  ])

  let timeSaved = '0 minutes'
  if (crossResult.skippedOperations.includes('addition') && crossResult.skippedOperations.includes('subtraction')) {
    timeSaved = '~3 hours (~18 sessions)'
  } else if (crossResult.skippedOperations.includes('addition')) {
    timeSaved = '~1 hour (~6 sessions)'
  }

  crossOperationResult.value = {
    ...crossResult,
    estimatedTimeSaved: timeSaved
  }

  // Log simulation
  recentSimulations.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    additionProf: additionProf.value,
    subtractionProf: subtractionProf.value,
    accelerated: addSkipped.length > 0 || subSkipped.length > 0 || crossResult.skippedOperations.length > 0,
    result: crossResult.recommendedStartingOperation + ' → ' + (crossResult.recommendedStartingSubLevel || 'N/A')
  })

  if (recentSimulations.value.length > 10) {
    recentSimulations.value.pop()
  }
}

// Expected progression
const expectedProgression = computed(() => {
  const steps: any[] = []

  // Placement
  steps.push({
    icon: '🎯',
    type: 'placement',
    title: 'Placement Diagnostic',
    description: `Student completes diagnostic: Add ${additionProf.value}%, Sub ${subtractionProf.value}%`,
    timeframe: 'Day 1 • ~10 minutes'
  })

  // Skip notification
  if (crossOperationResult.value?.skippedOperations.length > 0) {
    steps.push({
      icon: '⚡',
      type: 'skip',
      title: 'Operations Skipped',
      description: `Skipping ${crossOperationResult.value.skippedOperations.join(' and ')} - ready for ${crossOperationResult.value.recommendedStartingOperation}`,
      timeframe: `Saves ${crossOperationResult.value.estimatedTimeSaved}`
    })
  }

  // First session
  steps.push({
    icon: '📚',
    type: 'practice',
    title: 'First Practice Session',
    description: `Starting at ${crossOperationResult.value?.recommendedStartingSubLevel || 'initial level'}`,
    timeframe: 'Day 1 • ~10 minutes'
  })

  // Progression
  if (additionProf.value >= 90 || subtractionProf.value >= 90) {
    steps.push({
      icon: '🚀',
      type: 'fast-track',
      title: 'Fast-Track Mode Activated',
      description: '90%+ proficiency detected - compressed practice enabled',
      timeframe: 'Session 2-3'
    })
  }

  // Multiplication
  if (crossOperationResult.value?.recommendedStartingOperation === 'multiplication') {
    steps.push({
      icon: '✖️',
      type: 'milestone',
      title: 'Begin Multiplication',
      description: 'Student starts multiplication without completing addition/subtraction',
      timeframe: 'Week 1'
    })
  } else {
    steps.push({
      icon: '✖️',
      type: 'milestone',
      title: 'Reach Multiplication',
      description: 'Complete addition and subtraction progression',
      timeframe: 'Week 2-3'
    })
  }

  return steps
})

// Preset scenarios
function setPreset(preset: 'highPerformer' | 'moderate' | 'struggling') {
  if (preset === 'highPerformer') {
    additionProf.value = 97
    subtractionProf.value = 96
  } else if (preset === 'moderate') {
    additionProf.value = 87
    subtractionProf.value = 84
  } else if (preset === 'struggling') {
    additionProf.value = 62
    subtractionProf.value = 58
  }
  simulate()
}

// Export simulations
function exportSimulations() {
  const csv = [
    ['Timestamp', 'Addition %', 'Subtraction %', 'Accelerated', 'Result'],
    ...recentSimulations.value.map(s => [
      s.timestamp,
      s.additionProf,
      s.subtractionProf,
      s.accelerated ? 'Yes' : 'No',
      s.result
    ])
  ].map(row => row.join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `acceleration-simulations-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function clearLogs() {
  console.clear()
  console.log('✅ Console cleared')
}

// Run initial simulation
simulate()
</script>

<style scoped>
.acceleration-simulator {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.simulator-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card h2 {
  margin-top: 0;
  color: #34495e;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.operation-inputs {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.operation-group {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.operation-group h3 {
  margin-top: 0;
  font-size: 1.3rem;
  color: #2c3e50;
}

.slider-group label {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.slider-group input[type="range"] {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #dfe6e9;
  outline: none;
  cursor: pointer;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #8e44ad;
  cursor: pointer;
}

.calc {
  color: #7f8c8d;
  font-size: 0.95rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #8e44ad;
  color: white;
  flex: 1;
  min-width: 200px;
}

.btn-primary:hover {
  background: #7d3c98;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #dfe6e9;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.placement-result {
  margin-bottom: 1.5rem;
}

.placement-result h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.result-details {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.result-row:last-child {
  border-bottom: none;
}

.result-row .label {
  color: #7f8c8d;
  font-weight: 500;
}

.result-row .value {
  font-weight: 600;
  color: #2c3e50;
}

.result-row .value.highlight {
  color: #8e44ad;
  font-size: 1.2rem;
}

.result-row .value.success {
  color: #27ae60;
}

.result-row .value.large {
  font-size: 1.15rem;
}

.result-row .value.small {
  font-size: 0.9rem;
}

.result-row.highlight-bg {
  background: #f0e5f5;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.result-row.reason {
  flex-direction: column;
  gap: 0.5rem;
}

.cross-operation {
  border: 2px solid #8e44ad;
}

.progression-timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  align-items: start;
}

.timeline-marker {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.timeline-marker.placement {
  background: #3498db;
}

.timeline-marker.skip {
  background: #f39c12;
}

.timeline-marker.practice {
  background: #27ae60;
}

.timeline-marker.fast-track {
  background: #e74c3c;
}

.timeline-marker.milestone {
  background: #8e44ad;
}

.timeline-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.timeline-content p {
  margin: 0 0 0.5rem 0;
  color: #7f8c8d;
}

.timeline-meta {
  font-size: 0.9rem;
  color: #95a5a6;
  font-style: italic;
}

.console-output {
  text-align: center;
}

.help-text {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.recent-simulations {
  margin-top: 2rem;
}

.simulations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.simulation-entry {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.sim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-success {
  background: #d5f4e6;
  color: #27ae60;
}

.badge-neutral {
  background: #ecf0f1;
  color: #7f8c8d;
}

.sim-details {
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
  color: #7f8c8d;
}

@media (max-width: 1200px) {
  .simulator-container {
    grid-template-columns: 1fr;
  }
}
</style>


