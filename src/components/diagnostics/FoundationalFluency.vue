<template>
  <div class="foundational-fluency">
    <!-- Header - only show on selection screens, not during active practice/assessment -->
    <div v-if="currentScreen !== 'active'" class="header">
      <h1>🎯 Foundational Fluency</h1>
      <p class="subtitle">Building Number Sense Through Research-Based Practice</p>
    </div>

    <!-- Module Selection Screen -->
    <div v-if="currentScreen === 'module-select'" class="module-select">
      <h2>Select a Module</h2>
      <p class="instruction">Choose a foundational skill to practice or assess</p>
      
      <div class="modules-grid">
        <div 
          v-for="(config, key) in FLUENCY_MODULES" 
          :key="key"
          class="module-card"
          @click="selectModule(key)"
        >
          <div class="module-icon">
            {{ getModuleIcon(config.type) }}
          </div>
          <h3>{{ config.name }}</h3>
          <p class="module-description">{{ config.description }}</p>
          <div class="module-focus">
            <strong>Focus Areas:</strong>
            <ul>
              <li v-for="area in config.focusAreas" :key="area">{{ area }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode Selection Screen -->
    <div v-if="currentScreen === 'mode-select'" class="mode-select">
      <button class="back-btn" @click="goBack">← Back</button>
      
      <h2>{{ currentConfig?.name }}</h2>
      <p class="instruction">Choose Practice or Assessment mode</p>
      
      <div class="mode-options">
        <div class="mode-card practice">
          <div class="mode-icon">📚</div>
          <h3>Practice Mode</h3>
          <p>Unlimited attempts with instant feedback and hints</p>
          <ul class="mode-features">
            <li>✓ Immediate feedback</li>
            <li>✓ Hints when you need help</li>
            <li>✓ No time pressure</li>
            <li>✓ {{ currentConfig?.practiceProblems }} problems</li>
          </ul>
          
          <!-- Flash Mode Toggle (true subitizing) -->
          <div class="flash-mode-toggle" @click.stop>
            <label class="toggle-label">
              <input type="checkbox" v-model="useFlashMode" class="toggle-checkbox">
              <span class="toggle-text">⚡ Flash Mode (dots appear for 2 seconds)</span>
            </label>
            <p class="toggle-description">Recommended for subitizing practice</p>
          </div>
          
          <button class="mode-btn practice-btn" @click="startMode('practice')">Start Practice</button>
        </div>
        
        <div class="mode-card assessment" @click="startMode('assessment')">
          <div class="mode-icon">📊</div>
          <h3>Assessment Mode</h3>
          <p>Timed assessment to measure fluency and accuracy</p>
          <ul class="mode-features">
            <li>✓ Record accuracy</li>
            <li>✓ Track response time (color-coded)</li>
            <li>✓ Subskill analysis</li>
            <li>⚡ Flash mode (dots appear for 2 seconds)</li>
            <li>✓ {{ currentConfig?.assessmentProblems }} problems</li>
          </ul>
          <button class="mode-btn assessment-btn">Start Assessment</button>
        </div>
      </div>
    </div>

    <!-- Active Problem Screen -->
    <div v-if="currentScreen === 'active'" class="problem-screen">
      <div class="problem-header-minimal">
        <button class="exit-btn" @click="exitToModules">Exit</button>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>

      <!-- Visual Display -->
      <div v-if="currentProblem" class="problem-content">
        <h3 class="question-text">{{ currentProblem.questionText }}</h3>
        
        <!-- Question Visual (centered, larger) - for non-symbolic problems -->
        <div v-if="currentProblem.visualType && currentProblem.visualType !== 'symbolic'" class="visual-container" :class="{ 'visual-active': visualsVisible && (useFlashMode || !useFlashMode) }">
          <!-- Five Frame (1 row x 5 columns) for Making 5 -->
          <svg 
            v-if="currentProblem.visualType === 'five_frame' && visualsVisible" 
            class="five-frame" 
            viewBox="0 0 100 100"
            :class="{ 'show-hint': showingHint }"
          >
            <!-- Five frame grid: 5 columns x 1 row -->
            <rect v-for="col in 5" :key="`cell-${col}`" 
              :x="2 + (col - 1) * 16" 
              :y="35" 
              width="16" 
              height="30" 
              fill="none" 
              stroke="#666" 
              stroke-width="1"
              rx="2"
            />
            
            <!-- Filled dots -->
            <circle 
              v-for="(dot, index) in visualData" 
              :key="`dot-${index}`"
              :cx="dot.x" 
              :cy="dot.y" 
              r="8" 
              fill="#4CAF50"
              class="dot"
            />
            
            <!-- Hint: show missing dots in light gray -->
            <circle 
              v-if="showingHint && currentProblem.module === 'making5'"
              v-for="(dot, index) in hintDots" 
              :key="`hint-${index}`"
              :cx="dot.x" 
              :cy="dot.y" 
              r="8" 
              fill="#ddd"
              stroke="#999"
              stroke-width="1"
              class="hint-dot"
            />
          </svg>

          <!-- Ten Frame (2 rows x 5 columns) for Making 10 -->
          <svg 
            v-else-if="currentProblem.visualType === 'ten_frame' && visualsVisible" 
            class="ten-frame" 
            viewBox="0 0 100 100"
            :class="{ 'show-hint': showingHint }"
          >
            <!-- Ten frame grid: 5 columns x 2 rows with individual cell borders -->
            <!-- Top row cells -->
            <rect v-for="col in 5" :key="`top-${col}`" 
              :x="1 + (col - 1) * 18" 
              :y="20" 
              width="18" 
              height="30" 
              fill="none" 
              stroke="#666" 
              stroke-width="1.5"
              rx="2"
            />
            <!-- Bottom row cells -->
            <rect v-for="col in 5" :key="`bottom-${col}`" 
              :x="1 + (col - 1) * 18" 
              :y="50" 
              width="18" 
              height="30" 
              fill="none" 
              stroke="#666" 
              stroke-width="1.5"
              rx="2"
            />
            
            <!-- Filled dots -->
            <circle 
              v-for="(dot, index) in visualData" 
              :key="`dot-${index}`"
              :cx="dot.x" 
              :cy="dot.y" 
              r="8" 
              fill="#4CAF50"
              class="dot"
            />
            
            <!-- Hint: show missing dots in light gray for Making 5/10 -->
            <circle 
              v-if="showingHint && (currentProblem.module === 'making5' || currentProblem.module === 'making10')"
              v-for="(dot, index) in hintDots" 
              :key="`hint-${index}`"
              :cx="dot.x" 
              :cy="dot.y" 
              r="8" 
              fill="#ddd"
              stroke="#999"
              stroke-width="1"
              class="hint-dot"
            />
          </svg>

          <svg 
            v-else-if="currentProblem.visualType === 'dice' && visualsVisible" 
            class="dice-visual" 
            viewBox="0 0 100 100"
          >
            <!-- First dice (always shown, shows min of 5 or the number) -->
            <rect x="5" y="10" width="40" height="40" rx="6" fill="white" stroke="#333" stroke-width="2"/>
            <!-- First dice dots (up to 5) -->
            <circle 
              v-for="(dot, index) in visualData.slice(0, Math.min(5, visualData.length))" 
              :key="`dot-1-${index}`"
              :cx="dot.x * 0.4 + 5" 
              :cy="dot.y * 0.4 + 10" 
              r="3.5" 
              fill="#333"
              class="dot"
            />
            
            <!-- Second dice (only if number > 5) -->
            <template v-if="visualData.length > 5">
              <rect x="55" y="10" width="40" height="40" rx="6" fill="white" stroke="#333" stroke-width="2"/>
              <!-- Second dice dots (remainder after 5) -->
              <circle 
                v-for="(dot, index) in visualData.slice(5)" 
                :key="`dot-2-${index}`"
                :cx="dot.x * 0.4 + 55" 
                :cy="dot.y * 0.4 + 10" 
                r="3.5" 
                fill="#333"
                class="dot"
              />
            </template>
          </svg>

          <svg 
            v-else-if="visualsVisible" 
            class="dots-visual" 
            viewBox="0 0 100 100"
          >
            <!-- Two-column organized dots (easier to subitize) -->
            <circle 
              v-for="(dot, index) in visualData" 
              :key="`dot-${index}`"
              :cx="dot.x" 
              :cy="dot.y" 
              r="8" 
              fill="#4CAF50"
              class="dot"
            />
            
            <!-- Hint dots for Making 5/10 -->
            <circle 
              v-if="showingHint && (currentProblem.module === 'making5' || currentProblem.module === 'making10')"
              v-for="(dot, index) in hintDots" 
              :key="`hint-${index}`"
              :cx="dot.x" 
              :cy="dot.y" 
              r="8" 
              fill="#ddd"
              stroke="#999"
              stroke-width="1"
              class="hint-dot"
            />
          </svg>
        </div>
        
        <!-- Symbolic Display - for symbolic/text-only problems -->
        <div v-if="currentProblem.visualType === 'symbolic'" class="symbolic-display">
          <div class="problem-text">{{ currentProblem.problemText }}</div>
        </div>

        <!-- Answer Section (revealed after visual disappears or immediately if not flash mode or for symbolic) -->
        <div v-show="(!visualsVisible && useFlashMode) || !useFlashMode || currentProblem.visualType === 'symbolic'" class="answer-reveal">
        <!-- Visual Answer Cards for Making 5 and Making 10 -->
        <div v-if="currentProblem.module === 'making5' || currentProblem.module === 'making10'" class="answer-cards-section">
          <p class="answer-prompt">Select your answer:</p>
          <div class="answer-cards-grid">
            <div 
              v-for="num in (currentProblem.module === 'making5' ? 5 : 10)" 
              :key="`card-${num}`"
              class="answer-card"
              :class="{ 
                'selected': userAnswer === num,
                'correct': feedbackState === 'correct' && userAnswer === num,
                'incorrect': feedbackState === 'incorrect' && userAnswer === num
              }"
              @click="selectAnswer(num)"
            >
              <!-- No number symbol, only visual representation -->
              <svg class="card-visual" viewBox="0 0 100 100">
                <!-- Show appropriate frame type matching the question -->
                <template v-if="currentProblem.visualType === 'five_frame'">
                  <rect v-for="col in 5" :key="`card-cell-${col}`" 
                    :x="10 + (col - 1) * 16" 
                    :y="40" 
                    width="16" 
                    height="20" 
                    fill="none" 
                    stroke="#999" 
                    stroke-width="0.5"
                    rx="1"
                  />
                  <circle 
                    v-for="i in num" 
                    :key="`card-dot-${i}`"
                    :cx="10 + (i - 1) * 16" 
                    :cy="50" 
                    r="6" 
                    fill="#4CAF50"
                  />
                </template>
                <template v-else-if="currentProblem.visualType === 'ten_frame'">
                  <!-- Mini ten frame -->
                  <rect v-for="col in 5" :key="`card-top-${col}`" 
                    :x="10 + (col - 1) * 16" 
                    :y="30" 
                    width="16" 
                    height="15" 
                    fill="none" 
                    stroke="#999" 
                    stroke-width="0.5"
                    rx="1"
                  />
                  <rect v-for="col in 5" :key="`card-bottom-${col}`" 
                    :x="10 + (col - 1) * 16" 
                    :y="45" 
                    width="16" 
                    height="15" 
                    fill="none" 
                    stroke="#999" 
                    stroke-width="0.5"
                    rx="1"
                  />
                  <template v-for="i in num" :key="`card-dot-${i}`">
                    <circle 
                      :cx="10 + ((i - 1) % 5) * 16" 
                      :cy="Math.floor((i - 1) / 5) === 0 ? 37.5 : 52.5" 
                      r="6" 
                      fill="#4CAF50"
                    />
                  </template>
                </template>
                <template v-else-if="currentProblem.visualType === 'dice'">
                  <!-- For 1-5: single dice -->
                  <template v-if="num <= 5">
                    <rect x="30" y="25" width="40" height="40" fill="white" stroke="#333" stroke-width="2" rx="5" />
                    <template v-if="num === 1">
                      <circle cx="50" cy="45" r="4" fill="#333" />
                    </template>
                    <template v-else-if="num === 2">
                      <circle cx="40" cy="35" r="4" fill="#333" />
                      <circle cx="60" cy="55" r="4" fill="#333" />
                    </template>
                    <template v-else-if="num === 3">
                      <circle cx="40" cy="35" r="4" fill="#333" />
                      <circle cx="50" cy="45" r="4" fill="#333" />
                      <circle cx="60" cy="55" r="4" fill="#333" />
                    </template>
                    <template v-else-if="num === 4">
                      <circle cx="40" cy="35" r="4" fill="#333" />
                      <circle cx="60" cy="35" r="4" fill="#333" />
                      <circle cx="40" cy="55" r="4" fill="#333" />
                      <circle cx="60" cy="55" r="4" fill="#333" />
                    </template>
                    <template v-else-if="num === 5">
                      <circle cx="40" cy="35" r="4" fill="#333" />
                      <circle cx="60" cy="35" r="4" fill="#333" />
                      <circle cx="50" cy="45" r="4" fill="#333" />
                      <circle cx="40" cy="55" r="4" fill="#333" />
                      <circle cx="60" cy="55" r="4" fill="#333" />
                    </template>
                  </template>
                  <!-- For 6-10: two dice (first showing 5, second showing remainder) -->
                  <template v-else>
                    <!-- First dice (always 5) -->
                    <rect x="15" y="25" width="35" height="35" fill="white" stroke="#333" stroke-width="2" rx="4" />
                    <circle cx="25" cy="33" r="3" fill="#333" />
                    <circle cx="45" cy="33" r="3" fill="#333" />
                    <circle cx="32.5" cy="42.5" r="3" fill="#333" />
                    <circle cx="25" cy="52" r="3" fill="#333" />
                    <circle cx="45" cy="52" r="3" fill="#333" />
                    <!-- Second dice (shows remainder) -->
                    <rect x="55" y="25" width="35" height="35" fill="white" stroke="#333" stroke-width="2" rx="4" />
                    <template v-if="num === 6">
                      <circle cx="72.5" cy="42.5" r="3" fill="#333" />
                    </template>
                    <template v-else-if="num === 7">
                      <circle cx="65" cy="35" r="3" fill="#333" />
                      <circle cx="80" cy="50" r="3" fill="#333" />
                    </template>
                    <template v-else-if="num === 8">
                      <circle cx="65" cy="35" r="3" fill="#333" />
                      <circle cx="72.5" cy="42.5" r="3" fill="#333" />
                      <circle cx="80" cy="50" r="3" fill="#333" />
                    </template>
                    <template v-else-if="num === 9">
                      <circle cx="65" cy="35" r="3" fill="#333" />
                      <circle cx="80" cy="35" r="3" fill="#333" />
                      <circle cx="65" cy="50" r="3" fill="#333" />
                      <circle cx="80" cy="50" r="3" fill="#333" />
                    </template>
                    <template v-else-if="num === 10">
                      <circle cx="65" cy="35" r="3" fill="#333" />
                      <circle cx="80" cy="35" r="3" fill="#333" />
                      <circle cx="72.5" cy="42.5" r="3" fill="#333" />
                      <circle cx="65" cy="50" r="3" fill="#333" />
                      <circle cx="80" cy="50" r="3" fill="#333" />
                    </template>
                  </template>
                </template>
                <template v-else>
                  <!-- Two-column dots for 'dots' visual type -->
                  <circle 
                    v-for="i in num" 
                    :key="`card-dot-${i}`"
                    :cx="35 + ((i - 1) % 2) * 30" 
                    :cy="20 + Math.floor((i - 1) / 2) * 17" 
                    r="7" 
                    fill="#4CAF50"
                  />
                </template>
              </svg>
            </div>
          </div>
        </div>

        <!-- Traditional Text Input for other modules -->
        <div v-else class="answer-section">
          <input 
            ref="answerInput"
            v-model="userAnswer" 
            type="number" 
            class="answer-input"
            :class="{ 'correct': feedbackState === 'correct', 'incorrect': feedbackState === 'incorrect' }"
            placeholder="Your answer"
            @keyup.enter="submitAnswer"
            :disabled="feedbackState === 'correct' && currentMode === 'practice'"
          />
          <button 
            class="submit-btn" 
            @click="submitAnswer"
            :disabled="userAnswer === ''"
          >
            {{ currentMode === 'practice' && feedbackState === 'correct' ? 'Next →' : 'Submit' }}
          </button>
        </div>
        </div>
        
        <!-- Feedback -->
        <div v-if="feedbackState" class="feedback" :class="feedbackState">
          <div v-if="feedbackState === 'correct'" class="feedback-correct">
            <span class="feedback-icon">✓</span>
            <span class="feedback-text">Correct!</span>
            <span v-if="currentMode === 'assessment' && lastResponseTime" class="response-time">
              {{ (lastResponseTime / 1000).toFixed(1) }}s
            </span>
          </div>
          <div v-else-if="feedbackState === 'incorrect'" class="feedback-incorrect">
            <span class="feedback-icon">✗</span>
            <span class="feedback-text">Try again</span>
            <button 
              v-if="currentMode === 'practice' && currentConfig?.showHints" 
              class="hint-btn"
              @click="toggleHint"
            >
              {{ showingHint ? 'Hide Hint' : 'Show Hint' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-if="currentScreen === 'results'" class="results-screen">
      <div class="results-header">
        <h2>{{ currentMode === 'practice' ? '📚 Practice Complete!' : '📊 Assessment Results' }}</h2>
        <p class="completion-message">Great work on {{ currentConfig?.name }}!</p>
      </div>

      <div class="results-summary">
        <div class="result-card">
          <div class="result-label">Accuracy</div>
          <div class="result-value">{{ accuracyPercentage }}%</div>
          <div class="result-detail">{{ correctCount }} / {{ totalProblems }} correct</div>
        </div>

        <div class="result-card">
          <div class="result-label">Avg Response Time</div>
          <div class="result-value">{{ averageResponseTime }}s</div>
          <div class="result-detail">Per problem</div>
        </div>

        <div class="result-card">
          <div class="result-label">Fluency Score</div>
          <div class="result-value">{{ fluencyScore }}</div>
          <div class="result-detail">Accuracy + Speed</div>
        </div>
      </div>

      <!-- Subskill Breakdown -->
      <div v-if="currentMode === 'assessment' && subskillBreakdown.length > 0" class="subskill-breakdown">
        <h3>Subskill Performance</h3>
        <div class="subskill-grid">
          <div 
            v-for="skill in subskillBreakdown" 
            :key="skill.name"
            class="subskill-card"
          >
            <div class="subskill-name">{{ formatSubskillName(skill.name) }}</div>
            <div class="subskill-accuracy">{{ skill.accuracy }}%</div>
            <div class="subskill-detail">{{ skill.correct }} / {{ skill.total }}</div>
          </div>
        </div>
      </div>

      <!-- Response Time Breakdown (color-coded) -->
      <div v-if="results.length > 0" class="response-time-breakdown">
        <h3>⏱️ Response Time Analysis</h3>
        <p class="breakdown-description">Color-coded by fluency level</p>
        
        <div class="time-legend">
          <span class="legend-item fluent">
            <span class="legend-dot"></span>
            🟢 Fluent (&lt;3s)
          </span>
          <span class="legend-item emerging">
            <span class="legend-dot"></span>
            🟡 Emerging (3-6s)
          </span>
          <span class="legend-item developing">
            <span class="legend-dot"></span>
            🔴 Developing (&gt;6s)
          </span>
        </div>
        
        <div class="time-results-grid">
          <div 
            v-for="(result, index) in results" 
            :key="result.problemId"
            class="time-result-card"
            :class="getResponseTimeCategory(result.responseTime).class"
          >
            <div class="problem-number">#{{ index + 1 }}</div>
            <div class="time-value">{{ (result.responseTime / 1000).toFixed(1) }}s</div>
            <div class="time-category">{{ getResponseTimeCategory(result.responseTime).name }}</div>
            <div class="correct-indicator">{{ result.isCorrect ? '✓' : '✗' }}</div>
          </div>
        </div>
      </div>

      <div class="results-actions">
        <button class="action-btn secondary" @click="retryModule">
          {{ currentMode === 'practice' ? 'Practice Again' : 'Retry Assessment' }}
        </button>
        <button class="action-btn primary" @click="exitToModules">
          Back to Modules
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { 
  FLUENCY_MODULES, 
  generateModuleProblems, 
  shuffleProblems,
  getVisualData,
  type FluencyProblem,
  type ModuleType 
} from '@/utils/foundationalFluencyGenerator'

// Screen management
type Screen = 'module-select' | 'mode-select' | 'active' | 'results'
const currentScreen = ref<Screen>('module-select')

// Module and mode
const selectedModuleKey = ref<string>('')
const currentMode = ref<'practice' | 'assessment'>('practice')

// Problems and progress
const problems = ref<FluencyProblem[]>([])
const currentProblemIndex = ref(0)
const userAnswer = ref<number | ''>('')
const feedbackState = ref<'correct' | 'incorrect' | ''>('')
const showingHint = ref(false)
const answerInput = ref<HTMLInputElement | null>(null)

// Timing
const problemStartTime = ref(0)
const lastResponseTime = ref(0)

// Flash mode for true subitizing (dots appear briefly then disappear)
const useFlashMode = ref(false)  // Toggle for practice mode
const visualsVisible = ref(true)  // Controls if dots are currently visible
const flashDuration = 2000  // 2 seconds to see dots

// Results tracking
interface ProblemResult {
  problemId: string
  userAnswer: number
  correctAnswer: number
  isCorrect: boolean
  responseTime: number
  subskill: string
  attempts: number // for practice mode
}
const results = ref<ProblemResult[]>([])
const attemptCount = ref(0) // current problem attempt count

// Computed
const currentConfig = computed(() => 
  selectedModuleKey.value ? FLUENCY_MODULES[selectedModuleKey.value] : null
)

const currentProblem = computed(() => problems.value[currentProblemIndex.value])

const progressPercentage = computed(() => 
  problems.value.length > 0 ? ((currentProblemIndex.value + 1) / problems.value.length) * 100 : 0
)

const visualData = computed(() => {
  if (!currentProblem.value || currentProblem.value.visualType === 'symbolic') return []
  return getVisualData(currentProblem.value.numberShown, currentProblem.value.visualType)
})

const hintDots = computed(() => {
  if (!currentProblem.value || !showingHint.value) return []
  
  if (currentProblem.value.module === 'making5') {
    const target = 5
    const needed = currentProblem.value.correctAnswer
    return getVisualData(target, currentProblem.value.visualType).slice(currentProblem.value.numberShown)
  } else if (currentProblem.value.module === 'making10') {
    const target = 10
    const needed = currentProblem.value.correctAnswer
    return getVisualData(target, currentProblem.value.visualType).slice(currentProblem.value.numberShown)
  }
  
  return []
})

const totalProblems = computed(() => results.value.length)
const correctCount = computed(() => results.value.filter(r => r.isCorrect).length)
const accuracyPercentage = computed(() => 
  totalProblems.value > 0 ? Math.round((correctCount.value / totalProblems.value) * 100) : 0
)

const averageResponseTime = computed(() => {
  if (results.value.length === 0) return '0.0'
  const total = results.value.reduce((sum, r) => sum + r.responseTime, 0)
  return (total / results.value.length / 1000).toFixed(1)
})

const fluencyScore = computed(() => {
  // Fluency score combines accuracy and speed
  // Formula: (Accuracy% * 0.7) + (Speed Score * 0.3)
  // Speed score: max 100 points, decreases with avg time
  const avgTime = parseFloat(averageResponseTime.value)
  const speedScore = Math.max(0, 100 - (avgTime * 10))
  return Math.round((accuracyPercentage.value * 0.7) + (speedScore * 0.3))
})

const subskillBreakdown = computed(() => {
  const breakdown = new Map<string, { correct: number; total: number }>()
  
  results.value.forEach(result => {
    const current = breakdown.get(result.subskill) || { correct: 0, total: 0 }
    current.total++
    if (result.isCorrect) current.correct++
    breakdown.set(result.subskill, current)
  })
  
  return Array.from(breakdown.entries()).map(([name, data]) => ({
    name,
    correct: data.correct,
    total: data.total,
    accuracy: Math.round((data.correct / data.total) * 100)
  }))
})

// Helper: Get response time category
function getResponseTimeCategory(timeMs: number): { name: string; class: string; color: string } {
  const seconds = timeMs / 1000
  if (seconds < 3) {
    return { name: 'Fluent', class: 'fluent', color: '#28a745' }  // Green
  } else if (seconds <= 6) {
    return { name: 'Emerging', class: 'emerging', color: '#ffc107' }  // Yellow
  } else {
    return { name: 'Developing', class: 'developing', color: '#dc3545' }  // Red
  }
}

// Methods
function getModuleIcon(type: ModuleType): string {
  const icons: Record<ModuleType, string> = {
    subitizing: '👁️',
    making5: '🖐️',
    making10: '🔟',
    symbolic: '🔢'
  }
  return icons[type] || '📝'
}

function selectModule(key: string) {
  selectedModuleKey.value = key
  currentScreen.value = 'mode-select'
}

function goBack() {
  if (currentScreen.value === 'mode-select') {
    currentScreen.value = 'module-select'
    selectedModuleKey.value = ''
  }
}

function startMode(mode: 'practice' | 'assessment') {
  currentMode.value = mode
  const isPractice = mode === 'practice'
  
  // Assessment mode ALWAYS uses flash mode for true subitizing
  // Practice mode uses flash mode based on toggle
  if (mode === 'assessment') {
    useFlashMode.value = true
  }
  // For practice, useFlashMode.value is already set by toggle
  
  // Generate problems
  problems.value = shuffleProblems(generateModuleProblems(selectedModuleKey.value, isPractice))
  currentProblemIndex.value = 0
  results.value = []
  
  // Start first problem
  currentScreen.value = 'active'
  startProblem()
}

function startProblem() {
  userAnswer.value = ''
  feedbackState.value = ''
  showingHint.value = false
  attemptCount.value = 0
  problemStartTime.value = Date.now()
  
  // Flash mode: Show visuals initially, then hide after 2 seconds
  if (useFlashMode.value) {
    visualsVisible.value = true
    setTimeout(() => {
      visualsVisible.value = false
    }, flashDuration)
  } else {
    visualsVisible.value = true  // Always visible in non-flash mode
  }
  
  nextTick(() => {
    answerInput.value?.focus()
  })
}

function selectAnswer(num: number) {
  // For Making 5/10 with visual cards, selecting automatically submits
  userAnswer.value = num
  // Small delay to show selection before submitting
  setTimeout(() => {
    submitAnswer()
  }, 200)
}

function submitAnswer() {
  // Check if answer is empty (but allow 0 as valid)
  if (userAnswer.value === '') return
  
  // If already correct in practice mode, move to next
  if (feedbackState.value === 'correct' && currentMode.value === 'practice') {
    nextProblem()
    return
  }
  
  const responseTime = Date.now() - problemStartTime.value
  lastResponseTime.value = responseTime
  attemptCount.value++
  
  const isCorrect = Number(userAnswer.value) === currentProblem.value!.correctAnswer
  
  if (isCorrect) {
    feedbackState.value = 'correct'
    
    // Record result
    results.value.push({
      problemId: currentProblem.value!.id,
      userAnswer: Number(userAnswer.value),
      correctAnswer: currentProblem.value!.correctAnswer,
      isCorrect: true,
      responseTime,
      subskill: currentProblem.value!.subskill,
      attempts: attemptCount.value
    })
    
    // In assessment mode, auto-advance after short delay
    if (currentMode.value === 'assessment') {
      setTimeout(() => {
        nextProblem()
      }, 800)
    }
  } else {
    feedbackState.value = 'incorrect'
    
    // In assessment mode, record the incorrect answer and move on
    if (currentMode.value === 'assessment') {
      results.value.push({
        problemId: currentProblem.value!.id,
        userAnswer: Number(userAnswer.value),
        correctAnswer: currentProblem.value!.correctAnswer,
        isCorrect: false,
        responseTime,
        subskill: currentProblem.value!.subskill,
        attempts: 1
      })
      
      setTimeout(() => {
        nextProblem()
      }, 1200)
    }
    // In practice mode, let them try again
  }
}

function nextProblem() {
  if (currentProblemIndex.value < problems.value.length - 1) {
    currentProblemIndex.value++
    startProblem()
  } else {
    // Show results
    currentScreen.value = 'results'
  }
}

function toggleHint() {
  showingHint.value = !showingHint.value
}

function formatSubskillName(subskill: string): string {
  const names: Record<string, string> = {
    subitizing: 'Subitizing',
    making5: 'Making 5',
    making10: 'Making 10',
    doubles: 'Doubles',
    near_doubles: 'Near Doubles',
    fact_family: 'Fact Families',
    basic_addition: 'Basic Addition',
    basic_subtraction: 'Basic Subtraction'
  }
  return names[subskill] || subskill
}

function retryModule() {
  startMode(currentMode.value)
}

function exitToModules() {
  currentScreen.value = 'module-select'
  selectedModuleKey.value = ''
  problems.value = []
  results.value = []
  currentProblemIndex.value = 0
}
</script>

<style scoped>
.foundational-fluency {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  font-style: italic;
}

/* Module Selection */
.module-select {
  text-align: center;
}

.module-select h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.instruction {
  color: #666;
  margin-bottom: 2rem;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.module-card {
  background: white;
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,123,255,0.2);
  border-color: #007bff;
}

.module-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.module-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.module-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.module-focus {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.module-focus strong {
  color: #007bff;
  display: block;
  margin-bottom: 0.5rem;
}

.module-focus ul {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.9rem;
  color: #555;
}

.module-focus li {
  margin: 0.3rem 0;
}

/* Mode Selection */
.mode-select {
  text-align: center;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #5a6268;
}

.mode-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.mode-card {
  background: white;
  border: 3px solid #ddd;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-card.practice {
  border-color: #28a745;
}

.mode-card.assessment {
  border-color: #007bff;
}

.mode-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.mode-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.mode-card p {
  color: #666;
  margin-bottom: 1rem;
}

.mode-features {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
}

.mode-features li {
  padding: 0.5rem 0;
  color: #555;
}

.mode-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

.practice-btn {
  background: #28a745;
  color: white;
}

.practice-btn:hover {
  background: #218838;
}

.assessment-btn {
  background: #007bff;
  color: white;
}

.assessment-btn:hover {
  background: #0056b3;
}

/* Problem Screen */
.problem-screen {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.problem-header-minimal {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  padding: 0.25rem 0.5rem;
}

.exit-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
  flex-shrink: 0;
}

.exit-btn:hover {
  background: #c82333;
}

.mode-badge.practice {
  background: #28a745;
}

.mode-badge.assessment {
  background: #007bff;
}

.problem-counter {
  font-weight: 600;
  color: #333;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #00d4ff);
  transition: width 0.3s;
}

.problem-content {
  background: white;
  border-radius: 12px;
  padding: 1rem 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 1200px;
  margin: 0 auto;
}

.question-text {
  font-size: 1.1rem;
  text-align: center;
  color: #333;
  margin-bottom: 0.5rem;
}

.visual-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin: 0.5rem 0;
  padding: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.visual-container.visual-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
  z-index: 10;
  position: relative;
}

.answer-reveal {
  animation: fadeIn 0.3s ease-in;
  margin-top: -1rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.ten-frame,
.dice-visual,
.dots-visual {
  width: 100%;
  max-width: 400px;
  height: 200px;
}

.dot {
  animation: dotAppear 0.3s ease-out;
}

@keyframes dotAppear {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.hint-dot {
  animation: hintPulse 1s infinite;
}

@keyframes hintPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

.symbolic-display {
  text-align: center;
  margin: 3rem 0;
}

.problem-text {
  font-size: 3rem;
  font-weight: 600;
  color: #333;
  font-family: 'Courier New', monospace;
}

.answer-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
}

.answer-input {
  width: 150px;
  padding: 1rem;
  font-size: 2rem;
  text-align: center;
  border: 3px solid #ddd;
  border-radius: 8px;
  transition: all 0.2s;
}

.answer-input:focus {
  outline: none;
  border-color: #007bff;
}

.answer-input.correct {
  border-color: #28a745;
  background: #d4edda;
}

.answer-input.incorrect {
  border-color: #dc3545;
  background: #f8d7da;
}

.submit-btn {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.feedback {
  margin-top: 1.5rem;
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  animation: feedbackSlide 0.3s ease-out;
}

@keyframes feedbackSlide {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.feedback.correct {
  background: #d4edda;
  border: 2px solid #28a745;
}

.feedback.incorrect {
  background: #f8d7da;
  border: 2px solid #dc3545;
}

.feedback-correct,
.feedback-incorrect {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.feedback-icon {
  font-size: 2rem;
}

.feedback-text {
  font-size: 1.3rem;
  font-weight: 600;
}

.response-time {
  color: #666;
  font-size: 1rem;
}

.hint-btn {
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  background: #ffc107;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.hint-btn:hover {
  background: #e0a800;
}

/* Results Screen */
.results-screen {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.results-header h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.completion-message {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.result-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #666;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.result-value {
  font-size: 3rem;
  font-weight: 700;
  color: #007bff;
  margin: 0.5rem 0;
}

.result-detail {
  font-size: 0.9rem;
  color: #666;
}

.subskill-breakdown {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
}

.subskill-breakdown h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.subskill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.subskill-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid #ddd;
}

.subskill-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.subskill-accuracy {
  font-size: 1.8rem;
  font-weight: 700;
  color: #007bff;
}

.subskill-detail {
  font-size: 0.85rem;
  color: #666;
}

.results-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 3rem;
}

.action-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.primary:hover {
  background: #0056b3;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:hover {
  background: #5a6268;
}

/* Flash Mode Toggle */
.flash-mode-toggle {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 600;
}

.toggle-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.toggle-text {
  font-size: 1rem;
  color: #333;
}

.toggle-description {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #856404;
  font-style: italic;
}


/* Response Time Breakdown */
.response-time-breakdown {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.response-time-breakdown h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.breakdown-description {
  color: #666;
  font-size: 0.95rem;
  margin: 0 0 1.5rem 0;
}

.time-legend {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.legend-item.fluent .legend-dot {
  background: #28a745;
}

.legend-item.emerging .legend-dot {
  background: #ffc107;
}

.legend-item.developing .legend-dot {
  background: #dc3545;
}

.time-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.time-result-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 3px solid #dee2e6;
  text-align: center;
  transition: transform 0.2s;
}

.time-result-card:hover {
  transform: translateY(-2px);
}

.time-result-card.fluent {
  border-color: #28a745;
  background: #f0fff4;
}

.time-result-card.emerging {
  border-color: #ffc107;
  background: #fffbf0;
}

.time-result-card.developing {
  border-color: #dc3545;
  background: #fff0f0;
}

.problem-number {
  font-size: 0.75rem;
  color: #666;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.time-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.25rem 0;
}

.time-result-card.fluent .time-value {
  color: #28a745;
}

.time-result-card.emerging .time-value {
  color: #f57c00;
}

.time-result-card.developing .time-value {
  color: #dc3545;
}

.time-category {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0.25rem 0;
}

.correct-indicator {
  font-size: 1.2rem;
  margin-top: 0.25rem;
}

/* Visual Answer Cards */
.answer-cards-section {
  margin: 0.5rem auto;
  max-width: 900px;
}

.answer-prompt {
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.answer-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
}

.answer-card {
  background: white;
  border: 3px solid #dee2e6;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
}

.answer-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: #007bff;
}

.answer-card.selected {
  border-color: #007bff;
  background: #e7f3ff;
  transform: scale(1.05);
}

.answer-card.correct {
  border-color: #28a745;
  background: #d4edda;
  animation: correctPulse 0.5s;
}

.answer-card.incorrect {
  border-color: #dc3545;
  background: #f8d7da;
  animation: shake 0.5s;
}

@keyframes correctPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.card-visual {
  width: 100%;
  height: 80px;
}

/* Five Frame specific styles */
.five-frame {
  width: 100%;
  max-width: 350px;
  height: 150px;
}
</style>

