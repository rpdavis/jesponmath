<template>
  <div class="printable-fluency">
    <div class="setup-screen" v-if="!generated">
      <div class="page-header">
        <h1>📄 Printable Foundational Fluency Worksheet</h1>
        <p>Generate printable worksheets with visual representations and answer keys</p>
      </div>

      <div class="setup-form">
        <div class="form-group">
          <label>Select Module: <span class="required">*</span></label>
          <select v-model="selectedModule" required>
            <option value="">-- Choose a module --</option>
            <option value="subitizing">Subitizing (Recognize quantities instantly)</option>
            <option value="making5">Making 5 (How many more to make 5?)</option>
            <option value="making10">Making 10 (How many more to make 10?)</option>
            <option value="symbolic">Symbolic (Addition/Subtraction problems)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Number of Problems:</label>
          <input 
            type="number" 
            v-model.number="problemCount" 
            min="3" 
            max="20" 
            placeholder="5"
          />
          <small>Default: 5 problems per worksheet</small>
        </div>

        <div class="form-group">
          <label>Student Name (optional):</label>
          <input 
            type="text" 
            v-model="studentName" 
            placeholder="Leave blank for generic worksheet"
          />
        </div>

        <div class="form-actions">
          <button @click="generateWorksheet" class="btn btn-primary" :disabled="!selectedModule">
            📄 Generate Worksheet
          </button>
          <button @click="router.push('/diagnostic/foundational-fluency-manage')" class="btn btn-secondary">
            ← Back to Management
          </button>
        </div>
      </div>
    </div>

    <!-- Printable Worksheet -->
    <div v-if="generated" class="worksheet-container">
      <div class="print-controls no-print">
        <button @click="printWorksheet" class="btn btn-primary">
          🖨️ Print Worksheet
        </button>
        <button @click="reset" class="btn btn-secondary">
          ← Generate New Worksheet
        </button>
      </div>

      <div class="worksheet printable">
        <!-- Header -->
        <div class="worksheet-header">
          <h1>🎯 Foundational Fluency Practice</h1>
          <h2>{{ formatModuleName(selectedModule) }}</h2>
          <div class="worksheet-meta">
            <span v-if="studentName">Name: {{ studentName }}</span>
            <span v-else>Name: _______________________</span>
            <span>Date: _______________________</span>
          </div>
          <p class="instructions">{{ getInstructions() }}</p>
        </div>

        <!-- Problems -->
        <div class="problems-section">
          <div v-for="(problem, index) in problems" :key="problem.id" class="problem-item">
            <div class="problem-number">{{ index + 1 }}.</div>
            <div class="problem-content">
              <!-- Visual representation -->
              <div v-if="problem.visualType !== 'symbolic'" class="visual-display">
                <!-- Five Frame -->
                <svg 
                  v-if="problem.visualType === 'five_frame'" 
                  class="visual-svg five-frame" 
                  viewBox="0 0 100 100"
                >
                  <g v-for="col in 5" :key="`cell-${col}`">
                    <rect
                      :x="10 + (col - 1) * 16"
                      y="40"
                      width="14"
                      height="20"
                      fill="none"
                      stroke="#333"
                      stroke-width="1.5"
                      rx="2"
                    />
                  </g>
                  <circle 
                    v-for="(dot, i) in getVisualData(problem.numberShown, problem.visualType)" 
                    :key="`dot-${i}`"
                    :cx="dot.x"
                    :cy="dot.y"
                    r="5"
                    fill="#2c3e50"
                  />
                </svg>

                <!-- Ten Frame -->
                <svg 
                  v-else-if="problem.visualType === 'ten_frame'" 
                  class="visual-svg ten-frame" 
                  viewBox="0 0 100 100"
                >
                  <g v-for="row in 2" :key="`row-${row}`">
                    <g v-for="col in 5" :key="`cell-${row}-${col}`">
                      <rect
                        :x="1 + (col - 1) * 18"
                        :y="row === 1 ? 20 : 50"
                        width="18"
                        height="30"
                        fill="none"
                        stroke="#333"
                        stroke-width="1.5"
                        rx="2"
                      />
                    </g>
                  </g>
                  <circle 
                    v-for="(dot, i) in getVisualData(problem.numberShown, problem.visualType)" 
                    :key="`dot-${i}`"
                    :cx="dot.x"
                    :cy="dot.y"
                    r="6"
                    fill="#2c3e50"
                  />
                </svg>

                <!-- Dice Pattern -->
                <svg 
                  v-else-if="problem.visualType === 'dice'" 
                  class="visual-svg dice" 
                  viewBox="0 0 100 100"
                >
                  <rect x="10" y="10" width="80" height="80" rx="8" fill="white" stroke="#333" stroke-width="2" />
                  <circle 
                    v-for="(dot, i) in getVisualData(problem.numberShown, problem.visualType)" 
                    :key="`dot-${i}`"
                    :cx="dot.x"
                    :cy="dot.y"
                    r="6"
                    fill="#2c3e50"
                  />
                </svg>

                <!-- Random Dots -->
                <svg 
                  v-else 
                  class="visual-svg dots" 
                  viewBox="0 0 100 100"
                >
                  <circle 
                    v-for="(dot, i) in getVisualData(problem.numberShown, problem.visualType)" 
                    :key="`dot-${i}`"
                    :cx="dot.x"
                    :cy="dot.y"
                    r="6"
                    fill="#2c3e50"
                  />
                </svg>
              </div>

              <!-- Question Text -->
              <div class="question-text">
                <span v-if="problem.visualType === 'symbolic'">
                  {{ problem.problemText }} = ____
                </span>
                <span v-else>
                  {{ problem.questionText }}
                </span>
              </div>

              <!-- Answer Box -->
              <div class="answer-box">
                Answer: ________
              </div>
            </div>
          </div>
        </div>

        <!-- Page Break Before Answer Key -->
        <div class="page-break"></div>

        <!-- Answer Key -->
        <div class="answer-key">
          <h2>📝 Answer Key</h2>
          <div class="answers-grid">
            <div v-for="(problem, index) in problems" :key="`answer-${problem.id}`" class="answer-item">
              <span class="answer-number">{{ index + 1 }}.</span>
              <span class="answer-value">{{ problem.correctAnswer }}</span>
            </div>
          </div>

          <!-- Detailed Solutions -->
          <div class="solutions-section">
            <h3>Detailed Solutions:</h3>
            <div v-for="(problem, index) in problems" :key="`solution-${problem.id}`" class="solution-item">
              <div class="solution-header">
                <strong>Problem {{ index + 1 }}:</strong>
              </div>
              <div class="solution-content">
                <span v-if="problem.visualType === 'symbolic'">
                  {{ problem.problemText }} = <strong>{{ problem.correctAnswer }}</strong>
                </span>
                <span v-else-if="problem.module === 'subitizing'">
                  There are <strong>{{ problem.correctAnswer }}</strong> dots/objects shown.
                </span>
                <span v-else-if="problem.module === 'making5'">
                  {{ problem.numberShown }} + <strong>{{ problem.correctAnswer }}</strong> = 5
                </span>
                <span v-else-if="problem.module === 'making10'">
                  {{ problem.numberShown }} + <strong>{{ problem.correctAnswer }}</strong> = 10
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  generateModuleProblems, 
  shuffleProblems, 
  getVisualData,
  type FluencyProblem 
} from '@/utils/foundationalFluencyGenerator'

const router = useRouter()

// State
const selectedModule = ref('')
const problemCount = ref(5)
const studentName = ref('')
const generated = ref(false)
const problems = ref<FluencyProblem[]>([])

// Methods
function formatModuleName(module: string): string {
  const names: Record<string, string> = {
    'subitizing': 'Subitizing',
    'making5': 'Making 5',
    'making10': 'Making 10',
    'symbolic': 'Symbolic Fluency'
  }
  return names[module] || module
}

function getInstructions(): string {
  const instructions: Record<string, string> = {
    'subitizing': 'Look at each image and write how many dots or objects you see.',
    'making5': 'Look at each image and write how many more you need to make 5.',
    'making10': 'Look at each image and write how many more you need to make 10.',
    'symbolic': 'Solve each problem and write your answer in the blank.'
  }
  return instructions[selectedModule.value] || ''
}

function generateWorksheet() {
  if (!selectedModule.value) return
  
  // Generate problems (use practice=true to get more problems, then limit to desired count)
  const allProblems = generateModuleProblems(selectedModule.value, true)
  problems.value = shuffleProblems(allProblems).slice(0, problemCount.value)
  
  generated.value = true
}

function printWorksheet() {
  window.print()
}

function reset() {
  generated.value = false
  problems.value = []
  selectedModule.value = ''
  problemCount.value = 5
  studentName.value = ''
}
</script>

<style scoped>
.printable-fluency {
  padding: 2rem;
  max-width: 1200px;
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

/* Setup Form */
.setup-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 600px;
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
.form-group input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Print Controls */
.print-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Worksheet */
.worksheet {
  background: white;
  padding: 2cm;
  min-height: 297mm; /* A4 height */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.worksheet-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 3px solid #2c3e50;
}

.worksheet-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.worksheet-header h2 {
  font-size: 1.5rem;
  color: #3498db;
  margin-bottom: 1rem;
}

.worksheet-meta {
  display: flex;
  justify-content: space-around;
  margin: 1rem 0;
  font-size: 1rem;
  color: #555;
}

.instructions {
  font-size: 1.1rem;
  color: #555;
  font-style: italic;
  margin-top: 1rem;
}

/* Problems */
.problems-section {
  margin: 2rem 0;
}

.problem-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  page-break-inside: avoid;
}

.problem-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  min-width: 40px;
}

.problem-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.visual-display {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.visual-svg {
  width: 200px;
  height: 150px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #f8f9fa;
}

.visual-svg.dice {
  background: white;
}

.question-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0.5rem 0;
}

.answer-box {
  font-size: 1.1rem;
  color: #555;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 2px dashed #3498db;
  border-radius: 4px;
}

/* Answer Key */
.page-break {
  page-break-before: always;
  margin: 2rem 0;
  border-top: 3px dashed #ccc;
}

.answer-key {
  margin-top: 2rem;
  page-break-before: always;
}

.answer-key h2 {
  font-size: 1.8rem;
  color: #27ae60;
  margin-bottom: 1.5rem;
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #27ae60;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #d5f4e6;
  border-radius: 8px;
}

.answer-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.answer-number {
  font-weight: bold;
  color: #2c3e50;
}

.answer-value {
  font-weight: bold;
  color: #27ae60;
  font-size: 1.4rem;
}

.solutions-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.solutions-section h3 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.solution-item {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}

.solution-header {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.solution-content {
  color: #555;
  font-size: 1rem;
}

.solution-content strong {
  color: #27ae60;
  font-size: 1.1rem;
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

/* Print Styles */
@media print {
  .no-print {
    display: none !important;
  }
  
  .printable-fluency {
    padding: 0;
    max-width: none;
  }
  
  .worksheet {
    box-shadow: none;
    padding: 1cm;
  }
  
  .page-break {
    page-break-before: always;
    border: none;
    margin: 0;
  }
  
  .answer-key {
    page-break-before: always;
  }
  
  .problem-item {
    page-break-inside: avoid;
  }
}
</style>

