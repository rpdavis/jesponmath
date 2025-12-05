<template>
  <div class="daily-practice-container">
    <!-- Header -->
    <div class="practice-header">
      <h2>🎯 Daily Math Facts Practice</h2>
      <p class="subtitle">Build automaticity through structured practice</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <p>Loading your practice session...</p>
    </div>

    <!-- Already Completed Today -->
    <div v-else-if="completedToday && !practiceStarted" class="completed-today-section">
      <h3>✅ Practice Complete for Today!</h3>
      <p>You've already completed today's practice session.</p>
      <p class="completion-time">
        Completed at: {{ todaysSession?.completedAt?.toDate().toLocaleTimeString() }}
      </p>

      <div class="today-summary">
h4>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-label">Facts Learned:</span>
            <span class="stat-value">{{
              todaysSession?.round1_learning?.newlyLearned?.length || 0
            }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Practice Accuracy:</span>
            <span class="stat-value"
              >{{ Math.round(todaysSession?.round2_practice?.accuracy || 0) }}%</span
            >
          </div>
          <div class="stat">
            <span class="stat-label">Total Time:</span>
            <span class="stat-value"
              >{{ Math.round((todaysSession?.totalTimeSpent || 0) / 60) }} min</span
            >
          </div>
        </div>
      </div>

      <button @click="viewProgress" class="view-progress-btn">View My Progress →</button>
    </div>

    <!-- Start Screen -->
    <MathFluencyStartScreen
      v-else-if="!practiceStarted"
      :current-operation="currentOperation"
      :distribution="distribution"
      :proficiency-percentage="proficiencyPercentage"
      :next-operation-name="nextOperationName"
      :practice-streak="practiceStreak"
      :round1-count="round1Problems.length"
      :round2-count="round2Problems.length"
      :round3-count="round3Problems.length"
      @start-practice="startPractice"
    />



    <!-- WARMUP ROUND -->
    <MathFluencyWarmupRound
      v-if="practiceStarted && currentRound === 0"
      :numbers="warmupNumbers"
      @complete="handleWarmupComplete"
    />

    <!-- DIAGNOSTIC ROUND -->
    <div v-if="practiceStarted && currentRound === 0.5" class="round-section diagnostic-round">
      <div class="round-header-bar">
        <h3>🎯 Quick Check</h3>
        <p>{{ diagnosticCurrentIndx + 1 }}/{{ diagnosticProblems.length }}</p>
      </div>

      <div v-if="diagnosticShowingQuestion" class="diagnostic-question">
        <div class="timer-bar-container">

    :key="'timer-' + diagnosticCurrentIndex"
            class="timer-bar-fill"
            :class="timerColorClass"
            :syle="{ width: `${(diagnosticTimeRemaining / 10) * 100}%` }"
          ></div>
        </div>
        <p class="timer-text">{{ diagnosticTimeRemaining }}s</p>

        <div class="question-display-large">
nosticProblem?.displayText }}
</div>

        <input
          ref="diagnosticInput"
          v-model="diagnosticAnswer"
          type="number"
          class="answer-input-large"
          :class="{ submitting: diagnosticSubmitting }"
          placeholder="?"
          @keyup.enter="() => submitDiagnosticAnswer(false)"
          :disabled="diagnosticSubmitting"

/>

        <button
          @click="() => submtDiagnosticAnswer(false)"
          class="submit-btn"
          :disabled="!diagnosticAnswer || diagnosticSubmitting"
        >
          {{ diagnosticSubmitting ? '✓' : 'Submit' }}

</div>

iv v-else class="processing-transition">
        <div clss="processing-spinner"></div>
        <p>Processing...</p>
      </div>
    </div>

    <!-- DIAGNOSTIC RESULTS -->
    <div v-if="practiceStarted && currentRound === 0.75" class="diagnostic-results-screen">
      <div class="results-content">
  <h2>📊 Quick Check Complete!</h2>

        <div class="score-circle" :class="getDiagnosticScoreClass(diagnosticScore)">
          <div class="score-number">{{ diagnosticScore }}%</div>
          <div class="score-label">{{ diagnosticCorrect }}/{{ diagnosticProblems.length }}</div>
        </div>

        <div v-if="diagnosticWrongProblems.length === 0" class="perfect-score">
          <h3>🎉 Perfect!</h3>
          <p>Moving to practice...</p>
          <button @click="continueCurrentLevel" class="continue-btn">Start Practice →</button>
        </div>

        <div v-else class="learning-preview">
          <h3>📚 Let's Learn {{ diagnosticWrongProblems.length }} Facts</h3>
          <p>You got {{ diagnosticCorrect }}/{{ diagnosticProblems.length }} correct</p>
          <button @click="continueCurrentLevel" class="start-learning-btn">Start Learning →</button>
        </div>
      </div>
    </div>

    <!-- ROUND 1: Learning -->
    <div v-if="practiceStarted && currentRound === 1" class="round-section round-1">
      <div class="round-header-bar">
        <h3>Round 1: Learning New Facts</h3>
        <p>{{ round1CurrentIndex + 1 }}/{{ round1Problems.length }} facts</p>
      </div>

      <!-- Encoding Phase -->
      <div v-if="round1Phase === 'encoding'" class="encoding-phase">
        <p class="phase-instruction">Learn this fact:</p>

        <!-- Fact Display with Answer Highlighted -->
        <div class="fact-display-large">
          <span class="fact-problem"
            >{{ currentRound1Problem?.displayText.replace(' = ?', '') }} =
          </span>
          <span class="fact-answer">{{ currentRound1Problem?.correctAnswer }}</span>
        </div>

        <!-- Visual Representations -->
        <div v-if="shouldShowVisuals(currentRound1Problem)" class="visual-representations">
          <!-- Ten-Frame Visual (for addition/subtraction) -->
          <div
            v-if="
              currentRound1Problem?.operation === 'addition' ||
              currentRound1Problem?.operation === 'subtraction'
            "
            class="visual-section"
          >
            <h4>Ten-Frame:</h4>
            <svg :width="230" :height="200" class="ten-frame-visual">
              <!-- Ten-frame grid -->
              <rect
                v-for="i in 10"
                :key="'frame-' + i"
                :x="((i - 1) % 5) * 40 + 10"
                :y="Math.floor((i - 1) / 5) * 40 + 10"
                width="35"
                height="35"
                fill="none"
                stroke="#94a3b8"
                stroke-width="2"
                rx="4"


              <!-- Dots with animation -->
              <circle
                v-for="i in Math.min(10, getAnswerNumber(currentRound1Problem))"
                :key="'dot1-' + i"
 - 1) % 5) * 40 + 27.5"
        :cy="Math.floor((i - 1) / 5) * 40 + 27.5"
                r="12"
                :fill="i <= (currentRound1Problem?.num1 || 0) ? '#3b82f6' : '#10b981'"
                class="animated-dot"
                :style="{ animationDelay: `${i * 0.1}s` }"
      />

frame if answer > 10 -->
    <g v-if="getAnswerNumber(currentRound1Problem) > 10">
                <rect
                  v-for="i in 10"
          :key="'frame2-' + i"
                  :x="((i - 1) % 5) * 40 + 10"
                  :y="Math.floor((i - 1) / 5) * 40 + 110"
                  width="35"
                  height="35"
                  fill="none"
                  stroke="#94a3b8"
                  stroke-width="2"
        rx="4"
                />
                <circle
                  v-for="i in getAnswerNumber(currentRound1Problem) - 10"

    :cx="((i - 1) % 5) * 40 + 27.5"
                  :cy="Math.floor((i - 1) / 5) * 40 + 127.5"
                  r="12"
                  fill="#10b981"
                  class="animated-dot"
                  :style="{ animationDelay: `${(10 + i) * 0.1}s` }"
                />
              </g>
            </svg>


 Multiplication: Array/Matrix Visual -->
          <div v-if="currentRound1Problem?.operation === 'multiplication'" class="visual-section">
            <h4>Array Visual:</h4>
            <svg
              :width="currentRound1Problem.num2 * 30 + 40"
              :height="currentRound1Problem.num1 * 30 + 60"
              class="array-visual"
            >
              <!-- Draw array of dots -->
              <circle
  v-for="(dot, index) in getArrayDots(currentRound1Problem)"
                :key="'array-' + index"
                :cx="20 + dot.col * 30"
                :cy="20 + dot.row * 30"
                r="10"
                fill="#8b5cf6"
                class="animated-dot"
                :style="{ animationDelay: `${index * 0.05}s` }"
              />
            </svg>
            <p class="visual-explanation">
              {{ currentRound1Problem.num1 }} groups of {{ currentRound1Problem.num2 }} =
Problem.correctAnswer }}
  </p>
          </div>

          <!-- Division: Grouped Circles Visual -->
          <div v-if="currentRound1Problem?.operation === 'division'" class="visual-section">
            <h4>Division Groups:</h4>
            <svg
rentRound1Problem)"
:height="200"
              class="division-visual"
            >
    <g
                v-for="(gr, groupIdex) in getDivisionGroups(currentRound1Problem)"
                :key="'grop-' + groupex"
              >
                <rect
                  :x="groupIndex *+ 10"
                  y="30"
                  wid"60"
    height="150"
                  fill="e"
                  stroke"#f59e0b"
                  strke-width="2
                  stroke-dasharry="55"
                  rx="8"
                />
                <circle
                  v-for="(dot, dotndex) in group.dots"
ndex + '-' + dotIndex"
    :cx="groupIndex * 80 + 20 + (dotIndex % 2) * 30"
                  :cy"45 + Math.floor(dotIndex / 2) * 30"
                  r="10"
                  fill="f59e0b"
                  class="animated-dot"
                  :style="{
                    animationDelay: `${(groupIndex * group.dots.length + dotIndex) * 0.05}s`,
                  }"
                />

svg>
 class="visual-explanation">
              {{ currentRound1Problem.num1 }} ÷ {{ currentRound1Problem.num2 }} =
              {{ currentRound1Problem.correctAnswer }} groups
            </p>
          </div>

          <!-- Number Line Visual -->
ection">
  <h4>Number Line:</h4>
            <svg :width="Math.max(650, (getAnswerNumber(currentRound1Problem) + 3) * 25 + 60)" :height="80" class="number-line-visual">
<!-- Number line -->
              <line
                x1="30"
                y1="4
                :x2="20"
                y2="40"
                stroke="#94a3b8"
                stroke-width="3"
                stroke-linecap="round"
    />

              <!-- Tick marks and numbers -->
              <g
etAnswerNumber(currentRound1Problem) + 3)"
  :key="'tick-' + i"
              >
                <line
                  :x1="30 + i * 25"
                  :y1="35"

    :y2="45"
                  stroke="#64748b"
                  stroke-width="2"
                />
                <text :x="30 + i * 25" y="60" text-anchor="middle" font-size="12" fill="#475569">
    {{ i }}
                </text>
              </g>

    <!-- Animated arc showing the addition -->
              <path
  v-if="currentRound1Problem?.operation === 'addition'"
                :d="getAdditionArc(currentRound1Problem)"
                fill="none"
                stroke="#3b82f6"
                stroke-width="3"
                markend="url(#arrowhead)"
                class"animated-arc"
              />

    <!-- Arrow marker -->
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orint="auto"

  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marke
              </defs>
            </svg>
          </div>
        </div>

        <!-- NO TIMER - Student paced! -->
        <button @click="proceedToRecall" class="next-btn">I've Got It! Next →</button>
      </div>

lidation Phase (5 seconds with animation) -->
ation'" class="consolidation-phase">
ss="phaseinstruction">Get ready to recall...</p>
        <div class="consolidation-animation">
          <div class="thinking-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <p class="consolidation-message">Think about it...</p>
        </div>
tdown-display">{{ consolidationTimeRemaining }}</div>
div>

      <!-- Recall Phase -->
      <div v-if="round1Phase === 'recall'" class="recall-phase">
        <p class="phase-instruction">Now you try!</p>
        <div class="question-display-large">
          {{ currentRound1Problem?.displayTex}
        </div>
        <input
          ref="round1Input"
          v-model="round1Answer"
  type="number"
          class="answer-input-large"
          placeholder="?"
          @keyup.enter="submitRound1Answer"
          autofocus
        />
        <p class="recall-timer">{{ recallTimeRemaining }}s remaining</p>
      </div>

      <!-- Feedback Phase -->
      <div v-if="round1Phase === 'feedback'" class="feedback-phase">
        <div v-if="round1LastCorrect" class="feedback-correct">
          <div class="feedback-icon">✅</div>
          <div class="feedback-message">Correct!</div>
          <div class="feedback-fact">
            {{
              currentRound1Problem?.displayText.replace(
                ' = ?',
                ` = ${currentRound1Problem.correctAnswer}`,
              )
            }}
          </div>
          <p class="feedback-next">Great! Moving to next fact...</p>
          <p class="feedback-countdown">{{ feedbackTimeRemaining }}s</p>
        </div>

        <div v-else class="feedback-incorrect">
          <div class="feedback-icon">❌</div>
          <div class="feedback-message">
            The answer is {{ currentRound1Problem?.correctAnswer }}
          </div>
          <div class="feedback-fact">
            {{
              currentRound1Problem?.displayText.replace(
                ' = ?',
                ` = ${currentRound1Problem.correctAnswer}`,
              )
            }}
          </div>
          <p class="feedback-next">Let's see it again...</p>
          <p class="feedback-countdown">{{ feedbackTimeRemaining }}s</p>
        </div>



    <!-- ROUND 2: Practice -->
    <div v-if="practiceStarted && currentRound === 2" class="round-section round-2">
      <div class="round-header-bar">
        <h3>Round 2: Practice</h3>
        <p>{{ round2CurrentIndex + 1 }}/{{ round2Problems.length }} problems</p>
        <p class="mix-info">Mixed: {{ round2MixInfo }}</p>
      </div>

      <div class="practice-question">
iv class="question-display-large">
          {{ currentRound2Problem?.displayText }}
        </div>
        <input
          ref="round2Input"
          v-model="round2Answer"
          type="number"
          class="answer-input-large"
          placeholder="?"
          @keyup.enter="submitRound2Answer"


        <p class="practice-timer">{{ round2TimeRemaining }}s</p>

        <button @click="submitRound2Answer" class="submit-btn" :disabled="!round2Answer">
          Submit
        </button>


      <!-- Immediate Feedback -->
      <div v-if="round2ShowingFeedback" class="round2-feedback">
        <div v-if="round2LastCorrect" class="feedback-correct-inline">
<span class="feedback-icon-inline">✅</span>
          <span v-if="round2LastTime < 6000">Great! Fast and accurate!</span>
          <span v-else>Correct! Try to get faster.</span>
        </div>
        <div v-else class="feedback-incorrect-inline">
          <span class="feedback-icon-inline">❌</span>
          <span>The answer is {{ currentRound2Problem?.correctAnswer }}</span>
  <span class="retry-note">(Will appear again this round)</span>
        </div>
      </div>

      <div class="round2-stats">
        <div class="stat-mini">
          <span>Correct:</span>
          <span class="stat-value-mini">{{ round2Correct }}</span>
        </div>
        <div class="stat-mini">
          <span>Accuracy:</span>
          <span class="stat-value-mini">{{ round2Accuracy }}%</span>
        </div>
      </div>
    </div>

    <!-- ROUND 3: Quick Assessment -->
    <div v-if="practiceStarted && currentRound === 3" class="round-section round-3">
      <div class="round-header-bar">
        <h3>Round 3: Quick Check</h3>
        <p>{{ round3CurrentIndex + 1 }}/{{ round3Problems.length }} problems</p>
      </div>

      <div class="assessment-question">
        <div class="question-display-large">
          {{ curtRound3Problem?.displayText }}
        </div>
        <input
          ref="round3Input"
          v-model="round3Answer"
          type="number"
          class="answer-input-large"
          placeholder="?"
Round3Answer"
autofocus
        />
        <p class="assessment-timer">{{ round3TimeRemaining }}s</p>

        <button @click="submitRound3Answer" class="submit-btn" :disabled="!round3Answer">
          Submit
        </button>
      </div>

e">No feedback during assessment - keep going!</p>


    <!-- Session Complete -->
    <div v-if="sessionComplete" class="complete-section">
      <h2>🎉 Great Practice Session!</h2>

      <div class="session-summary">
        <h3>Today You:</h3>
        <div class="summary-achievements">
          <div
            class="achievement-item"
  v-if="
earning?.newlyLearned &&
    session.round1_learning.newlyLearned.length > 0
            "
          >
            <span class="achievement-icon">📚</span>
d {{ session.round1_learning.newlyLearned.length }} new facts</span>
  </div>
          <div class="achievement-item">
            <span class="achievement-icon">💪</span>
            <span
              >Pticed {{ session.round2_practice?.problemsPresented?.length || 0 }} facts</span
            >
</div>
          <div class="achievement-itm">
            <span class="achievement-icon">✓</span>
            <span>{{ session.round2_practice?.accuracy || 0 }}% accuracy in practice</span>
          </div>
  <div class="achievement-item" v-if="promotionsEarned.length > 0">
vement-icon">⭐</span>
  <span>{{ promotionsEarned.length }} facts promoted!</span>
          </div>
        </div>

        <div v-if="promotionsEarned.length > 0" class="promotions-list">
          <h4>Facts Promoted Today:<h4>
          <div
            v-for="problemId in promotionsEarned.slice(0, 5)"
            :key="problemId"
tem"
>
  <span class="promotion-icon">🎊</span>
            <span>{{ getProblemDisplay(problemId) }} is now {{ getNewLevel(problemId) }}!</span>
          </div>
          <p v-if="promotionsEarned.length > 5">...and {{ promotionsEarned.length - 5 }} more!</p>
        </div>

        <div class="session-quality-display">
          <h4>Session Quality: {{ sessionQualityDisplay }}</h4>
          <p class="session-time">Total Time: {{ Math.round(totalSessionTime / 60) }} minutes</p>
        </div>

review">
<h4>Tomorrow's Goal:</h4>
          <p>Practice {{ Math.min(15, distribution.emerging + distribution.doesNotKnow) }} facts</p>
        </div>
      </div>

complete-actions">
  <button @click="viewProgress" class="progress-btn">See My Progress</button>
        <button @click="finishSession" class="done-btn">Done for Today</button>
      </div>
    </div>
  </div>
>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
 {
  getFluencyProgress,
  getAllFluencyProgress,
  getTodaysPracticeSession,
  createPracticeSession,
  updateProblemInProgress,
} from '@/services/mathFluencyServices'
import {
  sampleRandom,
  shuffleArray,
  getAllProblemsForOperation,
} from '@/utils/mathFluencyProblemGenerator'
import { getNextOperation } from '@/types/mathFluency'
import { getSubLevelConfig, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import { filterProblemsBySubLevel, selectDailyPracticeProblems } from '@/utils/subLevelUtils'
import { selectChallengeProblems } from '@/utils/challengeProblemSelector'
import type {
  MathFluencyProgress,
  ProblemProgress,
  OperationType,
  SubLevel,
  MathFluencyPracticeSession,
  LearningRoundData,
  PracticeRoundData,
  AssessmentRoundData,
} from '@/types/mathFluency'
import { Timestamp } from 'firebase/firestore'
import { markFluencyAssignmentComplete } from '@/services/mathFluencyAssignmentServices'
import { getAnswerNumber, shouldShowVisuals } from '@/utils/mathFluencyVisualUtils'
import MathFluencyStartScreen from './mathFluency/rounds/MathFluencyStartScreen.vue'
import MathFluencyWarmupRound from './mathFluency/rounds/MathFluencyWarmupRound.vue'
import MathFluencyDiagnosticRound from './mathFluency/rounds/MathFluencyDiagnosticRound.vue'
import MathFluncyDiagnosticResults from './mathFluency/rounds/MathFluencyDiagnosticResults.vue'
import MathFluencyRound1Learning from './mathFluency/rounds/MathFluencyRound1Learning.vue'
import MathFluencyRound2Practice fom './mathFluency/rounds/MathFluencyRound2Practice.vue'
import MathFluencyRound3Assessment from './mathFluency/rounds/MathFluencyRound3Assessment.vue'
import MathFluencySessionComplete from './mathFluency/rounds/MathFluencySessionComplete.vue'
import MathFluencyTimerBar from './mathFluency/visuals/MathFluencyTimerBar.vue'
import MathFluencyTenFrame from './mathFluency/visuals/MathFluencyTenFrame.vue'
import MathFluencyNumberLine from './mathFluency/visuals/MathFluencyNumberLine.vue'
athFluencyArrayGrid from './mathFluency/visuals/MathFluencyArrayGrid.vue'
import MathFluencyDivisionGroups from './mathFluency/visuals/MathFluencyDivisionGroups.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const loading = ref(true)
const completedToday = ref(false)
acticeStarted = ref(false)
const sessionComplete = ref(false)
const currentRound = ref(0)
const progress = ref<MathFluencyProgress | null>(null)
const todaysSession = ref<MathFluencyPracticeSession | null>(null)
const assignmentId = ref<string | null>(null)

// Warmup State
const warmupNumbers = ref<number[]>([])
const warmupCurrentIndex = ref(0)
const warmupAnswer = ref('')
const warmupInput = ref<HTMLInputElement | null>(null)

e
agnosticProblems = ref<ProblemProgress[]>([])
const diagnosticCurrentIndex = ref(0)
const diagnosticAnswer = ref('')
const diagnosticResults = ref<{ [problemId: string]: { correct: boolean; responseTime: number } }>(


const diagnosticInput = ref<HTMLInputElement | null>(null)
const diagnosticTimeRemaining = ref(10)
const diagnosticTimerInterval = ref<number | null>(null)
const diagnosticStartTime = ref(0)
const diagnosticSubmitting = ref(false)
agnosticShowingQuestion = ref(true)

// Round 1: Learning State
const round1Phase = ref<'encoding' | 'consolidation' | 'recall' | 'feedback'>('encoding')
const round1Problems = ref<ProblemProgress[]>([])
round1CurrentIndex = ref(0)
 = ref('')
round1RecallAttempt = ref(0) // 1 or 2
const round1LastCorrect = ref(false)
const round1AttemptsLog = ref<{ [problemId: string]: any }>({})
const round1LearnedToday = ref<string[]>([])
const round1Input = ref<HTMLInputElement | null>(null)

// Round 1 Timers
const encodingTimeRemaining = ref(5)
const consolidationTimeRemaining = ref(5) // 5 seconds to think
const recallTimeRemaining = ref(15)
const feedbackTimeRemaining = ref(10)
round1TimerInterval = ref<number | null>(null)

// Round 2: Practice State
const round2Problems = ref<ProblemProgress[]>([])
const round2Stack = ref<ProblemProgress[]>([])
const round2CurrentIndex = ref(0)
const round2Answer = ref('')
const round2ShowingFeedback = ref(false)
const round2LastCorrect = ref(false)
const round2LastTime = ref(0)
const round2Results = ref<{ [problemId: string]: any }>({})
const round2Correct = ref(0)
const round2Total = ref(0)
const round2Input = ref<HTMLInputElement | null>(null)
const round2TimeRemaining = ref(15)
const round2TimerInterval = ref<number | null>(null)
const round2StartTime = ref(0)

// Round 3: Assessment State
const round3Problems = ref<ProblemProgress[]>([])
const round3CurrentIndex = ref(0)
const round3Answer = ref('')
const round3Results = ref<{ [problemId: string]: any }>({})
const round3Input = ref<HTMLInputElement | null>(null)
const round3TimeRemaining = ref(10)
const round3TimerInterval = ref<number | null>(null)
const round3StartTime = ref(0)

// Session Tracking
const sessionStartTime = ref(0)
const totalSessionTime = ref(0)
const promotionsEarned = ref<string[]>([])
const session = ref<Partial<MathFluencyPracticeSession>>({
  round1_learning: {
    problemsTargeted: [],
    problemsCompleted: [],
    problemsStillUnmet: [],
    attemptsPerProblem: {},
    newlyLearned: [],
    timeSpent: 0,
    completed: false,
  },
  round2_practice: {
    problemsPresented: [],
    problemsMixed: true,
    mixComposition: { emerging: 0, proficient: 0, mastered: 0 },
    results: {},
    accuracy: 0,
    averResponseTime: 0,
    timepent: 0,
    completed: false,
  },
  round3_assessment: {
    problemsAssessed: [],
    results: {},
    accuracy: 0,
    averageResponseTime: 0,
    timeSpent: 0,
    completed: false,
  },
})

// Computed
const currentOperation = computed(() => progress.value?.operation || 'addition')

const distribtion = coted(
  () =>
    progress.value.proficiencyDistribution || {
      doesNotKnow: 0,
      emerging: 0,
      approaching: 0,
      proficient: 0,
      mastered: 0,
      total: 100,
    },
)

const proficiencyPercetage = computed(() => progress.value?.proficiencyPercentage || 0)

const practiceStreak = computed(() => progress.value?.consecutivePracticeDays || 0)

const nextOperationName = computed(() => {
  const next = getNextOperation(currentOperation.value)
  return next ? capitalizeOperation(next) : 'All Operations'
})

const currentRound1Problem = computed(() => round1Problems.value[round1CurrentIndex.value] || null)

const currentRound2Problem = computed(() => {
  if (round2Stack.value.length === 0) return null
  return round2Stack.value[0]
})

const currentRound3Problem = computed(() => round3Problems.value[round3CurrentIndex.value] || null)

const round2Accuracy = computed(() => {
  if (round2Total.value === 0) return 0
  return Math.round((round2Correct.value / round2Total.value) * 100)
})

const round2MixInfo = computed(() => {
  if (!session.value.round2_practice) return ''
  const mix = session.value.round2_practice.mixComposition
  if (!mix) return ''
  return `${mix.emerging}E / ${mix.proficient}P / ${mix.mastered}M`
})

const sessionQualityDisplay = computed(() => {
  const qualities = {
    excellent: '🏆 Excellent',
    good: '⭐ Good',
    fair: '👍 Fair',
    incomplete: '⚠️ Incomplete',
  }
  return qualities[session.value.sessionQuality as keyof typeof qualities] || 'Good'
})

// Diagnostic Round Computed
const currentDiagnosticProblem = computed(
  () => diagnosticProblems.value[diagnosticCurrentIndex.value],
)
const diagnosticCorrect = computed(
  () => Object.values(diagnosticResults.value).filter((r) => r.correct).length,
)
const diagnosticScore = computed(() =>
  diagnosticProblems.value.length > 0
    ? Math.round((diagnosticCorrect.value / diagnosticProblems.value.length) * 100)
    : 0,
)
const diagnosticWrongProblems = computed(() =>
  diagnosticProblems.value.filter((p) => {
    const result = diagnosticResults.value[p.problemId]
    return result && !result.correct
  }),
)

const timerColorClass = computed(() => {
  const timePercent = (diagnosticTimeRemaining.value / 10) * 100
  if (timePercent > 60) return 'plenty-time'
  if (timePercent > 30) return 'some-time'
  return 'running-out'
})

// Methods
onMounted(async () => {
  // Check if accessed via assignment
  assignmentId.value = (route.query.assignment as string) || null

  await loadProgress()
})

onUnmounted(() => {
  clearAllTimers()
})

async function loadProgress() {
  if (!authStore.currentUser) return

  loading.value = true

  try {
    // For now, default to addition - later we'll determine current operation
    const operation: OperationType = 'addition'

    // Load student's progress
    progress.value = await getFluencyProgress(authStore.currentUser.uid, operation)

    if (!progress.value) {
      // Student hasn't done initial diagnostic yet
      alert('You need to complete the initial diagnostic first. Please see your teacher.')
      router.push('/dashboard')
      return
    }

    // Check if already practiced today
    const today = await getTodaysPracticeSession(authStore.currentUser.uid, operation)

    if (today && today.completed) {
      completedToday.value = true
      todaysSession.value = today
    } else {
      // Prepare practice problems
      preparePracticeSession()
    }
  } catch (error) {
    console.error('Error loading progress:', error)
    alert('Error loading progress. Please try again.')
  } finally {
    loading.value = false
  }
}

async function preparePracticeSession() {
  if (!progress.value) return

  const banks = progress.value.problemBanks

  // Convert problem banks to flat array for sub-level utilities
  let allProblems = [
    ...banks.doesNotKnow,
    ...banks.emerging,
    ...banks.approaching,
    ...banks.proficient,
    ...banks.mastered,
  ]

  // ⭐ ADAPTIVE LOGIC: Check ALL sub-levels up to current and fill gaps
  if (progress.value.currentSubLevel) {
    const currentConfig = getSubLevelConfig(progress.value.currentSubLevel)
    if (currentConfig) {
      // Get all sub-levels in the operation up to and including current
      const allOperationLevels = getSubLevelsForOperation(currentConfig.operation)
        .filter((sl) => sl.order <= currentConfig.order)
        .sort((a, b) => a.order - b.order)

      console.log(`🔍 Checking ${allOperationLevels.length} sub-levels for gaps...`)

      // Check each sub-level for gaps
      for (const levelConfig of allOperationLevels) {
        const levelProblems = allProblems.filter((p) => problemBelongsToSubLevel(p, levelConfig.id))
        const expectedCount = levelConfig.totalProblems

        if (levelProblems.length < expectedCount) {
          console.log(
            `⚠️ Gap detected in ${levelConfig.name}: ${levelProblems.length}/${expectedCount} problems`,
          )

          // Generate missing problems
          const allLevelProblems = generateProblemsForSubLevel(
            levelConfig.id,
            progress.value.studentUid,
          )
          const existingIds = new Set(levelProblems.map((p) => p.problemId))
          const missingProblems = allLevelProblems.filter((p) => !existingIds.has(p.problemId))

          if (missingProblems.length > 0) {
            console.log(
              `📝 Adding ${missingProblems.length} missing problems from ${levelConfig.name}`,
            )
            allProblems = [...allProblems, ...missingProblems]
          }
        } else {
          console.log(
            `✅ ${levelConfig.name}: ${levelProblems.length}/${expectedCount} problems complete`,
          )
        }
      }
    }
  }

  // Use sub-level aware selection if available
  if (progress.value.currentSubLevel && allProblems.length > 0) {
    const selection = selectDailyPracticeProblems(
      allProblems,
      progress.value.currentSubLevel,
      progress.value.completedSubLevels,
      15,
    )

    // Round 1: Focus on "Does Not Know" from current sub-level
    const currentSubLevelProblems = filterProblemsBySubLevel(
      allProblems,
      progress.value.currentSubLevel,
    )
    const doesNotKnowInLevel = currentSuLevelProblems.filter(
      (p) => p.proficiencyLevel === 'doesNotKnow',
    )
    round1Problems.value = sampleRando(doesNotKnowInLevel, Math.min(3, doesNotKnowInLevel.length))

    // Round 2: Mix current level and maintenance
    const round2Pool = [...selection.currentLevelProblems, ...selection.maintenanceProblems]

    // ⭐ ADD CHALLENGE PROBLEMS
    try {
      const allProgress = await getAllFluencyProgress(authStore.currentUser!.uid)
      const challengeProblems = selectChllengeProblems(
        currentOperation.value,
        progress.value.currentSubLevel,
        allProgress,
        4,
      )

      round2Problems.value = shuffleArray([...round2Pool, ...challengeProblems])

      console.log('🎯 Challenge problems added:', {
        total: challengeProblems.length,
        nextLevel: challengeProblems.filter((p) => p.challengeType === 'next-level').length,
        previousOp: challengeProblems.filter((p) => p.challengeType === 'previous-operation')
          .length,
      })
    } catch (error) {
      console.error('Error selecting challenge problems:', error)
      round2Problems.value = shuffleArray(round2Pool)
    }

    round2Stack.value = [...round2Problems.value]

    // Round 3: Quick assessment from current sub-level
    const emergingInLevel = currentSubLevelProblems.filter(
      (p) => p.proficiencyLevel === 'emerging' || p.proficiencyLevel === 'approaching',
    )
    const proficientInLevel = currentSubLevelProblems.filter(
      (p) => p.proficiencyLevel === 'proficient',
    )
    const masteredInLevel = currentSubLevelProblems.filter((p) => p.proficiencyLevel === 'mastered')

    round3Problems.value = shuffleArray([
...sampleRandom(emergingInLevel, Math.min(5, emergingInLevel.length)),
    ...sampleRandom(proficientInLevel, Math.min(3, proficientInLevel.length)),
      ...sampleRandom(masteredInLevel, Math.min(2, masteredInLevel.length)),


    console.log('📚 Sub-level practice session prepared')
  } else {
    // Fallback: Original logic
    round1Problems.value = sampleRandom(banks.doesNotKnow, 3)

round2Problems.value = shuffleArray([
      ...sampleRandom(banks.emerging, 7),
    ...sampleRandom(banks.approaching, 3),
      ...sampleRandom(banks.proficient, 3),
      ...sampleRandom(banks.mastered, 2),
  ])

und2Problems.value]

    round3Problems.value = shuffleArray([
      ...sampleRandom(banks.emerging, 5),
  ...sampleRandom(banks.proficient, 3),
      ...sampleRandom(banks.mastered, 2),
    ])
  }

ix composition
 (session.value.round2_practice) {
    session.value.round2_practice.mixComposition = {
ging: round2Problems.value.filter(
        (p) => p.proficiencyLevel === 'emerging' || p.proficiencyLevel === 'approaching',
      ).length,
      proficient: round2Problems.value.filter((p) => p.proficiencyLevel === 'proficient').length,
      mastered: round2Problems.value.filter((p) => p.proficiencyLevel === 'mastered').length,
    }
  }
}

tion startPractice() {
  practiceStarted.value = true
  sessionStartTime.value = Date.now()
  currentRound.value = 0 // Start with warmup

  // Generate 3 random warmup numbers
  const availableNumbers = Array.from({ length: 20 }, (_, i) => i + 1)
  const shuffled = availableNumbers.sort(() => Math.random() - 0.5)
  warmupNumbers.value = shuffled.slice(0, 3)
  warmupCurrentIndex.value = 0
  warmupAnswer.value = ''

  console.log('🔢 Warmup numbers:', warmupNumbers.value)

  nextTick(() => {
    warmupInput.value?.focus()
  })
}

// =============================================================================
// WARMUP ROUND
==========================================================================

function handleWarmupComplete() {
  // Warmup complete - start diagnostic
  currentRound.value = 0.5
  startDiagnosticRound()
}

// =============================================================================
// DIAGNOSTIC ROUND
// =============================================================================

on startDiagnosticRound() {
diagnosticProblems.value = generateDiagnosticProblems()

if (diagnosticProblems.value.length === 0) {
    console.warn('⚠️ No diagnostic problems - skipping to Round 1')
    currentRound.value = 1
    startRound1()
    return
  }

  diagnosticCurrentIndex.value = 0
  diagnosticAnswer.value = ''
diagnosticResults.value = {}
  diagnosticTimeRemaining.value = 10

artDiagnosticTimer()

) => {
diagnosticInput.value?.focus()
  })
}

function generateDiagnosticProblems(): ProblemProgress[] {
  if (!progress.value?.currentSubLevel) return []

roblemsRaw = [
rogress.value.problemBanks.doesNotKnow,
    ...progress.value.problemBanks.emerging,
    ...progress.value.problemBanks.approaching,
...progress.value.problemBanks.proficient,
    ...progress.value.problemBanks.mastered,


  const allProblems = deduplicateByProblemIdAndText(allProblemsRaw)

  if (allProblemsRaw.length !== allProblems.length) {
    console.warn(`⚠️ Removed ${allProblemsRaw.length - allProblems.length} duplicates`)


  const subLevelProblems = filterProblemsBySubLevel(allProblems, progress.value.currentSubLevel)
  const sampled = sampleRandomUnique(subLevelProblems, Math.min(20, subLevelProblems.length))

  console.log(`🎯 Diagnostic: ${sampled.length} problems`)

  return sampled


async function startDiagnosticTimer() {
TimeRemaining.value = 10
sticStartTime.value = Date.now()

  if (diagnosticTimerInterval.value) {
    clearInterval(diagnosticTimerInterval.value)


  await nextTick()

agnosticTimerInterval.value = setInterval(() => {
    diagnosticTimeRemaining.value--
    if (diagnosticTimeRemaining.value <= 0) {
  submitDiagnosticAnswer(true)
    }
  }, 1000) as unknown as number
}

ubmitDiagnosticAnswer(timeout: boolean = false) {
if (!currentDiagnosticProblem.value || diagnosticSubmitting.value) return

  diagnosticSubmitting.value = true
  diagnosticShowingQuestion.value = false

  if (diagnosticTimerInterval.value) {
    clearInterval(diagnosticTimerInterval.value)
    diagnosticTimerInterval.value = null
  }

const responseTime = Date.now() - diagnosticStartTime.value
userAnswer = timeout ? '' : String(diagnosticAnswer.value || '').trim()
const correct = userAnswer === currentDiagnosticProblem.value.correctAnswer

  diagnosticResults.value[currentDiagnosticProblem.value.problemId] = {

responseTime,
  }

agnosticCurrentIndex.value++
  diagnosticAnswer.value = ''

  setTimeout(() => {
  diagnosticSubmitting.value = false

nosticCurrentIndex.value >= diagnosticProblems.value.length) {
  // Diagnostic complete - show results (USER MUST CLICK)
  currentRound.value = 0.75
sticShowingQuestion.value = true

  console.log('📊 Diagnostic complete - showing results, waiting for click')
    } else {
      diagnosticShowingQuestion.value = true
      nextTick(() => {
tDiagnosticTimer()
    diagnosticInput.value?.focus()
      })

 600)


function continueCurrentLevel() {
  // Use diagnostic wrong problems for Round 1
  round1Problems.value = [...diagnosticWrongProblems.value]

  console.log(`📚 Round 1: Learning ${round1Problems.value.length} facts from diagnostic`)

  if (round1Problems.value.length === 0) {
    // Perfect score - skip to Round 2
currentRound.value = 2
    startRound2()
else {
    currentRound.value = 1
    startRound1()
  }
}

function skipToNextSubLevel() {
  alert('Skip ahead feature coming soon!')
  continueCurrentLevel()


on getDiagnosticScoreClass(score: number): string {
if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  return 'needs-work'
}

function getOperationSymbol(operation: OperationType | undefined): string {
  if (!operation) return '+'
t symbols = {
addition: '+',
    subtraction: '−',
  multiplication: '×',
vision: '÷',
}
  return symbols[operation] || '+'
}

// =============================================================================
// ROUND 1: LEARNING
// =============================================================================

==========================================================================
NG
==========================================================================

function startRound1() {
  if (round1Problems.value.length === 0) {
 - skip to Round 2
tRound2()
    return


entRound.value = 1

lue = 'encoding'

  // Log this problem as targeted
rning && currentRound1Problem.value) {
n.value.round1_learning.problemsTargeted.push(currentRound1Problem.value.problemId)


ingPhase()



'encoding'
  clearAllTimers()
Got It!" when ready



value = 'consolidation'
ionTimeRemaining.value = 5 // 5 second pause with animation

  clearAllTimers()
  round1TimerInterval.value = window.setInterval(() => {
ationTimeRemaining.value--
    if (consolidationTimeRemaining.value <= 0) {
      startRecallPhase()

  }, 1000) as unknown as number
}

async function startRecallPhase() {
e = 'recall'
d1Answer.value = ''
  recallTimeRemaining.value = 15
  round1RecallAttempt.value = (round1RecallAttempt.value || 0) + 1

  clearAllTimers()
  round1TimerInterval.value = window.setInterval(() => {
callTimeRemaining.value--
  if (recallTimeRemaining.value <= 0) {
      // Timeout - treat as incorrect
      submitRound1Answer()



Tick()
und1Input.value?.focus()
}

on submitRound1Answer() {
!currentRound1Problem.value) return

  clearAllTimers()

responseTime = (15 - recallTimeRemaining.value) * 1000
  const isCorrect =
ound1Answer.value || '').trim() === currentRound1Problem.value.correctAnswer

  round1LastCorrect.value = isCorrect

 Log attempt
d = currentRound1Problem.value.problemId
 (!round1AttemptsLog.value[problemId]) {
    round1AttemptsLog.value[problemId] = {
      encodingCycles: 1,
  recallAttempts: 1,
      timesSpent: [],
    }

  round1AttemptsLog.value[problemId].timesSpent.push(responseTime)

ate problem in progress
  if (isCorrect) {
await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
t: true,
  responseTime,
      source: 'digital-practice',
    })

if (session.value.round1_learning) {
      session.value.round1_learning.newlyLearned.push(problemId)
      session.value.round1_learning.problemsCompleted.push(problemId)
}
  }

 Show feedback immediately (NO AUTO-DELAY - buttons control flow)
und1Phase.value = 'feedback'
}

eToNextRound1Problem() {
CurrentIndex.value++

  if (round1CurrentIndex.value >= round1Problems.value.length) {
    // Round 1 complete
    finishRound1()
  } else {
round1RecallAttempt.value = 0
    if (session.value.round1_learning && currentRound1Problem.value) {
      session.value.round1_learning.problemsTargeted.push(currentRound1Problem.value.problemId)

artEncodingPhase()

}

function finishRound1() {
e.round1_learning) {
ssion.value.round1_learning.attemptsPerProblem = round1AttemptsLog.value
    session.value.round1_learning.timeSpent = Math.round(
      (Date.now() - sessionStartTime.value) / 1000,
    )
    session.value.round1_learning.completed = true


  // Start Round 2
  startRound2()
}

==========================================================================
PRACTICE
============================================================================

c function startRound2() {
  currentRound.value = 2
  round2CurrentIndex.value = 0
  round2Stack.value = [...round2Problems.value]
ect.value = 0
und2Total.value = 0
  round2Results.value = {}

  if (session.value.round2_practice) {
session.value.round2_practice.problemsPresented = round2Problems.value.map((p) => p.problemId)
  }

  if (round2Stack.value.length === 0) {
oblems to practice - skip to Round 3
startRound3()



  showNextRound2Problem()
}

async function showNextRound2Problem() {
  if (round2Stack.value.length === 0) {
    // All problems correct - finish round
    finishRound2()
return
  }

und2Answer.value = ''
  round2ShowingFeedback.value = false
  round2StartTime.value = Date.now()
  round2TimeRemaining.value = 15

  clearRound2Timer()
  round2TimerInterval.value = window.setInterval(() => {
meRemaining.value--
if (round2TimeRemaining.value <= 0) {
      submitRound2Answer()
    }
 1000)

Tick()
und2Input.value?.focus()
}

ync function submitRound2Answer() {
  if (!currentRound2Problem.value) return

  clearRound2Timer()

  const responseTime = Date.now() - round2StartTime.value
  const isCorrect =
    String(round2Answer.value || '').trim() === currentRound2Problem.value.correctAnswer

  round2LastCorrect.value = isCorrect
  round2LastTime.value = responseTime
round2Total.value++

  if (isCorrect) {
und2Correct.value++
}

  // Log result
  const problemId = currentRound2Problem.value.problemId
!round2Results.value[problemId]) {
  round2Results.value[problemId] = {
      attempts: 0,
      correct: false,
      responseTimes: [],
      returnedToStack: false,
    }
}
  round2Results.value[problemId].attempts++
  round2Results.value[problemId].responseTimes.push(responseTime)
  round2Results.value[problemId].correct = isCorrect

// Update problem in progress
  await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
    correct: isCorrect,
    responseTime,
    source: 'digital-practice',
  })

  // Show feedback briefly
  round2ShowingFeedback.value = true

from stack
nst current = round2Stack.value.shift()

  // If incorrect, add back to end of stack
  if (!isCorrect && current) {
    round2Stack.value.push(current)
und2Results.value[problemId].returnedToStack = true
}

  // Continue after brief pause
  await new Promise((resolve) => setTimeout(resolve, 1500))
  showNextRound2Problem()


function finishRound2() {
  if (session.value.round2_practice) {
    session.value.round2_practice.results = round2Results.value
    session.value.round2_practice.accuracy = round2Accuracy.value
  const times = Object.values(round2Results.value).flatMap((r) => r.responseTimes)
    session.value.round2_practice.averageResponseTime =
times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : 0
  session.value.round2_practice.timeSpent =
      Math.round((Date.now() - sessionStartTime.value) / 1000) -
      (session.value.round1_learning?.timeSpent || 0)
    session.value.round2_practice.completed = true


  startRound3()
}

// =============================================================================
// ROUND 3: QUICK ASSESSMENT
 =============================================================================

async function startRound3() {
  currentRound.value = 3
  round3CurrentIndex.value = 0
und3Results.value = {}

  if (session.value.round3_assessment) {
    session.value.round3_assessment.problemsAssessed = round3Problems.value.map((p) => p.problemId)
  }

  if (round3Problems.value.length === 0) {
    // No problems to assess - finish session
    finishSession()
    return
  }

  showNextRound3Problem()
}

async function showNextRound3Problem() {
round3CurrentIndex.value >= round3Problems.value.length) {
  finishRound3()
    return


  round3Answer.value = ''
  round3StartTime.value = Date.now()
  round3TimeRemaining.value = 10

  clearRound3Timer()
  round3TimerInterval.value = window.setInterval(() => {
und3TimeRemaining.value--
if (round3TimeRemaining.value <= 0) {
      submitRound3Answer()
    }
}, 1000)

  await nextTick()
  round3Input.value?.focus()
}

function submitRound3Answer() {
if (!currentRound3Problem.value) return

rRound3Timer()

  const responseTime = Date.now() - round3StartTime.value
  const isCorrect =
ring(round3Answer.value || '').trim() === currentRound3Problem.value.correctAnswer

  const problemId = currentRound3Problem.value.problemId
  const previousLevel = currentRound3Problem.value.proficiencyLevel

d3Results.value[problemId] = {
    correct: isCorrect,
    responseTime,
vel,
maintainedLevel: true, // Will be updated after proficiency recalc
  }

// Update problem in progress
  await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
    correct: isCorrect,
    responseTime,
source: 'digital-assessment',
  })

  // Move to next
und3CurrentIndex.value++

ause before next question
ait new Promise((resolve) => setTimeout(resolve, 500))
  showNextRound3Problem()
}

nction finishRound3() {
  if (session.value.round3_assessment) {
ssion.value.round3_assessment.results = round3Results.value
  const correct = Object.values(round3Results.value).filter((r) => r.correct).length
    session.value.round3_assessment.accuracy = (correct / round3Problems.value.length) * 100
    const times = Object.values(round3Results.value).map((r) => r.responseTime)
    session.value.round3_assessment.averageResponseTime =
  times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : 0
    session.value.round3_assessment.timeSpent =
      Math.round((Date.now() - sessionStartTime.value) / 1000) -
      ((session.value.round1_learning?.timeSpent || 0) +
      (session.value.round2_practice?.timeSpent || 0))
    session.value.round3_assessment.completed = true


  finishSession()
}

 =============================================================================
SION COMPLETION
 =============================================================================

async function finishSession() {
  clearAllTimers()

totalSessionTime.value = Date.now() - sessionStartTime.value

  // Determine session quality
  const completionRate =
  ((session.value.round1_learning?.completed ? 1 : 0) +
      (session.value.round2_practice?.completed ? 1 : 0) +
    (session.value.round3_assessment?.completed ? 1 : 0)) /
    3

let quality: 'excellent' | 'good' | 'fair' | 'incomplete' = 'good'
  if (completionRate === 1 && (session.value.round2_practice?.accuracy || 0) >= 80) {
    quality = 'excellent'
  } else if (completionRate === 1) {
    quality = 'good'
  } else if (completionRate >= 0.66) {
    quality = 'fair'
  } else {
    quality = 'incomplete'
  }

session.value.sessionQuality = quality
  session.value.engagementScore = Math.round(completionRate * 100)

  // Reload progress to see updated proficiencies
  await loadProgressSilently()

  // Determine promotions
  // (This would check which problems moved up levels)
otionsEarned.value = [] // TODO: Calculate from before/after comparison

ave session to Firestore
try {
    await createPracticeSession({
      studentUid: authStore.currentUser!.uid,
      studentName: authStore.currentUser?.displayName || 'Student',
      operation: currentOperation.value,
      sessionDate: Timestamp.now(),
      dayOfWeek: new Date().getDay(),
weekNumber: 1, // TODO: Calculate actual week number
    completed: completionRate === 1,
    completionPercentage: completionRate * 100,
      totalTimeSpent: Math.round(totalSessionTime.value / 1000),
    round1_learning: session.value.round1_learning!,
round2_practice: session.value.round2_practice!,
    round3_assessment: session.value.round3_assessment!,
      promotionsEarned: promotionsEarned.value,
      demotionsOccurred: [],
      consecutiveDaysUpdated: {},
      sessionQuality: quality,
      engagementScore: session.value.engagementScore || 0,
  } as any)

    console.log('✅ Practice session saved')

  // Mark assignment as complete if accessed via assignment
  if (assignmentId.value) {
      try {
        const accuracy = session.value.round2_practice?.accuracy || 0
        await markFluencyAssignmentComplete(assignmentId.value, Math.round(accuracy))
        console.log('✅ Assignment marked complete')
} catch (error) {
      console.error('Error marking assignment complete:', error)
      }
    }
  } catch (error) {
  console.error('Error saving session:', error)
  }

  sessionComplete.value = true
}

async function loadProgressSilently() {
uthStore.currentUser) return

  try {
    progress.value = await getFluencyProgress(authStore.currentUser.uid, currentOperation.value)
rror) {
console.error('Error reloading progress:', error)
  }
}

function viewProgress() {
  router.push('/fluency/my-progress')


function finishSessionAction() {
  router.push('/dashboard')
}

// Helper Functions
function clearAllTimers() {
  if (round1TimerInterval.value) {
    clearInterval(round1TimerInterval.value)
    round1TimerInterval.value = null
  }
clearRound2Timer()
rRound3Timer()


function clearRound2Timer() {
  if (round2TimerInterval.value) {
    clearInterval(round2TimerInterval.value)
    round2TimerInterval.value = null



function clearRound3Timer() {
  if (round3TimerInterval.value) {
rInterval(round3TimerInterval.value)
  round3TimerInterval.value = null
  }
}

function capitalizeOperation(op: OperationType | string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)


function getProblemDisplay(problemId: string): string {
  // Extract from problemId (e.g., "ADD_7_8" -> "7+8")
t parts = problemId.split('_')
 (parts.length === 3) {
    const op = parts[0] === 'ADD' ? '+' : parts[0] === 'SUB' ? '-' : parts[0] === 'MULT' ? '×' : '÷'
    return `${parts[1]}${op}${parts[2]}`
  }
  return problemId
}

on getNewLevel(problemId: string): string {
return 'PROFICIENT'
}

 generateProblemsForSubLevel(subLevel: SubLevel, studentUid: string): ProblemProgress[] {
const config = getSubLevelConfig(subLevel)
  if (!config) return []

const allProblems: ProblemProgress[] = []

  if (config.operation === 'addition') {
    for (let num1 = 2; num1 <= 20; num1++) {
    for (let num2 = 2; num2 <= 20; num2++) {
        const sum = num1 + num2
        if (config.problemFilter(num1, num2, sum)) {
          allProblems.push(createProblemProgress(num1, num2, config.operation, studentUid))
      }
      }



  return allProblems


function problemBelongsToSubLevel(problem: ProblemProgress, subLevel: SubLevel): boolean {
  const config = getSubLevelConfig(subLevel)
  if (!config || problem.operation !== config.operation) return false

result: number
if (problem.operation === 'addition') result = problem.num1 + problem.num2
else if (problem.operation === 'subtraction') result = problem.num1 - problem.num2
  else if (problem.operation === 'multiplication') result = problem.num1 * problem.num2
  else result = problem.num1 / problem.num2

turn config.problemFilter(problem.num1, problem.num2, result)
}

function createProblemProgress(
  num1: number,
  num2: number,
operation: OperationType,
  studentUid: string,
): ProblemProgress {
t problemId = `${num1}_${operation}_${num2}_${studentUid}`
const now = Timestamp.now()

  let correctAnswer = '',
    displayText = ''
  if (operation === 'addition') {
rrectAnswer = (num1 + num2).toString()
  displayText = `${num1} + ${num2}`
  }

rn {
  problemId,
  num1,
    num2,
n,
correctAnswer,
    displayText,
    category: '',
  factFamily: '',

oficiencyLevel: 'doesNotKnow',
    last5Attempts: [],
  proficiencyCalculation: {
      correctOutOfLast5: 0,
      averageTimeOfLast5: null,
'stable',
idenceLevel: 'low',
    },
    consecutiveCorrectDays: 0,
    daysInCurrentLevel: 0,
 0,
ttempts: 0,
    responseTimes: [],
    averageResponseTime: null,
    fastestResponseTime: null,
    slowestResponseTime: null,
    firstAttemptDate: now,
stAttemptDate: now,
rging: null,
teEnteredApproaching: null,
    dateEnteredProficient: null,
    dateEnteredMastered: null,
ilyResults: [],
    commonErrors: [],
null,
edsStrategyInstruction: false,
    flaggedForReview: false,
    regressionCount: 0,
    lastRegressionDate: null,
  }


// Advanced deduplication
function deduplicateByProblemId(problems: ProblemProgress[]): ProblemProgress[] {
  const seen = new Set<string>()
  return problems.filter((p) => {
 (seen.has(p.problemId)) return false
    seen.add(p.problemId)
    return true
  })
}

function deduplicateByProblemIdAndText(problems: ProblemProgress[]): ProblemProgress[] {
  const seenIds = new Set<string>()
  const seenTexts = new Set<string>()
  return problems.filter((p) => {
    const isDup = seenIds.has(p.problemId) || seenTexts.has(p.displayText)
    if (!isDup) {
      seenIds.add(p.problemId)
      seenTexts.add(p.displayText)
    }
    return !isDup
  })
}

function sampleRandomUnique(problems: ProblemProgress[], count: number): ProblemProgress[] {
  if (problems.length <= count) return deduplicateByProblemIdAndText(problems)

  const shuffled = shuffleArray([...problems])
  const sampled: ProblemProgress[] = []
  const seenIds = new Set<string>()
  const seenTexts = new Set<string>()

  for (const problem of shuffled) {
    if (sampled.length >= count) break
    if (!seenIds.has(problem.problemId) && !seenTexts.has(problem.displayText)) {
seenIds.add(problem.problemId)
    seenTexts.add(problem.displayText)
      sampled.push(problem)
    }
  }

  return sampled
}

// Visual helper functions
function shouldShowVisuals(problem: ProblemProgress | undefined): boolean {
  if (!problem) return false

  if (problem.operation === 'addition' || problem.operation === 'subtraction') {
    const answer = getAnswerNumber(problem)
    return answer <= 20 && answer >= 0
  }

  return false
}

function getAnswerNumber(problem: ProblemProgress | undefined): number {
  if (!problem) return 0
  return parseInt(problem.correctAnswer) || 0
}

on getAdditionArc(problem: ProblemProgress | undefined): string {
if (!problem) return ''
t num1 = problem.num1
const num2 = problem.num2
  const startX = 30 + num1 * 25
  const endX = 30 + (num1 + num2) * 25
  const arcHeight = 20

  return `M ${startX} 35 Q ${(startX + endX) / 2} ${35 - arcHeight} ${endX} 35`
}

function proceedToRecall() {
round1Answer.value = ''
  round1Phase.value = 'consolidation'
consolidationTimeRemaining.value = 5

  // Countdown with animation
  const consolidationInterval = setInterval(() => {
    consolidationTimeRemaining.value--
 (consolidationTimeRemaining.value <= 0) {
    clearInterval(consolidationInterval)
      round1Phase.value = 'recall'
      round1Answer.value = ''
      nextTick(() => {
        round1Input.value?.focus()
      })

}, 1000)
}

// Multiplication array helpers
nction getArrayDots(problem: ProblemProgress | undefined): Array<{ row: number; col: number }> {
!problem) return []
const rows = problem.num1
  const cols = problem.num2
  const dots: Array<{ row: number; col: number }> = []

(let r = 0; r < rows; r++) {
for (let c = 0; c < cols; c++) {
      dots.push({ row: r, col: c })
    }
  }

  return dots


// Division groups helpers
function getDivisionGroups(problem: ProblemProgress | undefined): Array<{ dots: number[] }> {
  if (!problem) return []
const total = problem.num1
  const groupSize = problem.num2
  const numGroups = parseInt(problem.correctAnswer)

t groups: Array<{ dots: number[] }> = []
for (let g = 0; g < numGroups; g++) {
    groups.push({
      dots: Array(groupSize)
        .fill(0)
        .map((_, i) => i),
    })
  }

  return groups
}

tion getDivisionWidth(problem: ProblemProgress | undefined): number {
  if (!problem) return 400
  const numGroups = parseInt(problem.correctAnswer)
  return Math.max(400, numGroups * 80 + 40)
}
</script>

<style scoped>
.daily-practice-container {
  max-width: 900px;
  margin: 0 auto;
padding: 2rem;
  min-height: 100vh;
}

 Warmup Round Styles */
.warmup-round {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 3px solid #2196f3;
}

.warmup-content {
  text-align: center;
  padding: 2rem;
}

armup-instruction {
  font-size: 1.2rem;
  color: #1976d2;
  margin-bottom: 1rem;
}

.warmup-number-display {
  font-size: 5rem;
  font-weight: bold;
  color: #1565c0;
  margin: 2rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.warmup-input {
  border: 4px solid #2196f3 !important;
}

.warmup-progress {
  margin-top: 1rem;
  font-size: 1.1rem;
r: #1976d2;
font-weight: 600;
}

/* Diagnostic Round Styles */
.diagnostic-round {
  background: linear-gradient(135deg, #fff3e0, #ffe082);
  border: 3px solid #ffc107;
}

.diagnostic-question {
  text-align: center;
padding: 2rem;
}

ual Timer Bar */
imer-bar-container {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin: 0 auto 0.5rem auto;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
d rgba(0, 0, 0, 0.1);


imer-bar-fill {
  height: 100%;
px;
sition:
    width 1s linear,
    background-color 0.3s ease;
}

.timer-bar-fill.plenty-time {
ground: linear-gradient(90deg, #4caf50, #66bb6a);
}

.timer-bar-fill.some-time {
  background: linear-gradient(90deg, #ff9800, #ffb74d);


.timer-bar-fill.running-out {
  background: linear-gradient(90deg, #f44336, #ef5350);
  animation: pulse-bar 0.5s ease-in-out infinite;
}

@keyframes pulse-bar {
  0%,
 {
  opacity: 1;
    transform: scaleY(1);
  }
{
  opacity: 0.85;
    transform: scaleY(1.1);
  }
}

imer-text {
  font-size: 1.2rem;
color: #666;
  font-weight: 600;
  margin: 0.5rem 0 2rem 0;
}

/* Stacked Question Format (like paper test) */
.question-stacked {
  display: inline-block;
  text-align: center;
margin: 2rem auto;
  min-width: 200px;
}

tack-top-number {
  font-size: 4rem;
  font-weight: bold;
  color: #333;
  text-align: right;
  padding-right: 2rem;
}

.stack-operation-row {
  display: flex;
  justify-content: flex-end;
align-items: center;
  gap: 0.5rem;
  font-size: 3.5rem;
-weight: bold;
padding-right: 2rem;
  margin: 0.5rem 0;
}

.operation-symbol {
  color: #2196f3;
  margin-right: 0.5rem;
}

tack-bottom-number {
  color: #333;


.stack-line {
  border-top: 4px solid #333;
in: 0.5rem 0 1rem 0;


 Processing Transition */
.processing-transition {
lign: center;
padding: 4rem 2rem;


.processing-spinner {
  width: 50px;
  height: 50px;
border: 5px solid #f3f4f6;
  border-top: 5px solid #ffc107;
border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;


es spin {
to {
    transform: rotate(360deg);
  }


/* Diagnostic Results Screen */
.diagnostic-results-screen {
  background: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);


.results-content {
-align: center;
x-width: 600px;
  margin: 0 auto;
}

.score-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
r;
ify-content: center;
  border: 6px solid;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

-circle.excellent {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-color: #28a745;
}

.score-circle.good {
ground: linear-gradient(135deg, #d1ecf1, #bee5eb);
  border-color: #17a2b8;
}

.score-circle.fair {
dient(135deg, #fff3cd, #ffeaa7);
er-color: #ffc107;
}

.score-circle.needs-work {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-color: #dc3545;
}

re-number {
  font-size: 3.5rem;
  font-weight: bold;
r: #2c3e50;
}

.score-label {
  font-size: 1.1rem;
  color: #666;
  margin-top: 0.5rem;
}

.perfect-score,
.skip-ahead-prompt,
.learning-preview {
  margin: 2rem 0;
  padding: 2rem;
  border-radius: 12px;


.perfect-score {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border: 2px solid #28a745;
}

.skip-ahead-prompt {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 2px solid #ffc107;
}

earning-preview {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 2px solid #2196f3;
}

.skip-actions {
  display: flex;
 1rem;
justify-content: center;
  margin-top: 1.5rem;
}

.skip-btn,
.continue-btn,
.start-learning-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

kip-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;


.continue-btn,
.start-learning-btn {
  background: linear-gradient(135deg, #2196f3, #0277bd);
  color: white;


kip-btn:hover,
.continue-btn:hover,
.start-learning-btn:hover {
  transform: translateY(-2px);
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.wrong-facts-preview {
in: 1.5rem 0;
padding: 1rem;
background: white;
  border-radius: 8px;
}

rong-fact {
  padding: 0.5rem;
  font-size: 1.1rem;
  color: #666;
}

ubmitting {
ity: 0.6;
pointer-events: none;
}

ractice-header {
  text-align: center;
  margin-bottom: 2rem;


.practice-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;


.subtitle {
r: #666;
font-size: 0.95rem;
}

ng */
oading-section {
  text-align: center;
  padding: 4rem 2rem;
r: #666;


/* Completed Today */
ompleted-today-section {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

ompleted-today-section h3 {
  color: #28a745;
in-bottom: 1rem;


.completion-time {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.today-summary {
  margin: 2rem 0;
  padding: 1.5rem;
ound: #f8f9fa;
border-radius: 8px;
}

ummary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;


{
splay: flex;
  flex-direction: column;
 0.5rem;


.stat-label {
-size: 0.875rem;
color: #666;
}

.stat-value {
font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;


/* Start Section */
.start-section {
background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);


.progress-overview {
  margin-bottom: 2rem;
}

.progress-overview h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  text-align: center;
}

ency-bars {
margin: 1.5rem 0;
}

tem {
display: grid;
  grid-template-columns: 150px 1fr 60px;
  align-items: center;
  gap: 1rem;
  margin: 0.75rem 0;


ar-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.bar-container {
  height: 24px;
ground: #eee;
border-radius: 12px;
  overflow: hidden;


ar-fill {
  height: 100%;
  transition: width 0.3s;
}

.bar-item.mastered .bar-fill {
  background: linear-gradient(90deg, #28a745, #20c997);


.bar-item.proficient .bar-fill {
  background: linear-gradient(90deg, #007bff, #0056b3);


.bar-item.approaching .bar-fill {
ground: linear-gradient(90deg, #ffc107, #ff9800);


.bar-item.emerging .bar-fill {
  background: linear-gradient(90deg, #17a2b8, #138496);


.bar-item.does-not-know .bar-fill {
ground: linear-gradient(90deg, #dc3545, #c82333);


ount {
nt-weight: bold;
  text-align: right;
  color: #333;
}

nlock-progress {
in: 2rem 0;
padding: 1.5rem;
background: #f8f9fa;
  border-radius: 8px;
}

.unlock-progress h4 {
  margin: 0 0 1rem 0;
  text-align: center;
  color: #333;
}

bar {
height: 40px;
  background: #eee;
  border-radius: 20px;
tion: relative;
overflow: hidden;
}

nlock-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
sition: width 0.5s;


.unlock-text {
  position: absolute;
top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.streak-display {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 1.3rem;
}

treak-icon {
  font-size: 2rem;
  margin-right: 0.5rem;
}

.streak-text {
  font-weight: bold;
  color: #ff6b6b;
}

ession-info {
: 2rem 0;


.session-info h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

ounds-preview {
  display: grid;
grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
margin: 1rem 0;
}

.round-card {
  background: #f8f9fa;
  padding: 1rem;
er-radius: 8px;
rder: 2px solid #ddd;
  text-align: center;


.round-header {
-weight: bold;
color: #007bff;
  margin-bottom: 0.5rem;
}

ound-card p {
margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #666;


.round-time {
font-style: italic;
  color: #999 !important;
}

otal-time {
  text-align: center;
  font-weight: bold;
  color: #333;
  margin-top: 1rem;


.start-practice-btn {
  width: 100%;
  padding: 1.5rem 2rem;
: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
lor: white;
  border: none;
  border-radius: 12px;
m;
-weight: bold;
  cursor: pointer;
sition: transform 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

n:hover {
m: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

nd Sections */
.round-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 500px;
lay: flex;
  flex-direction: column;
  justify-content: center;
}

{
-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.round-header-bar h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

r-bar p {
0;
r: #666;
}

.mix-info {
  font-size: 0.85rem;
  color: #999;


/* Round 1: Learning Phases */
ing-phase,
.consolidation-phase,
l-phase,
.feedback-phase {
  text-align: center;
  padding: 3rem 0;
}

.phase-instruction {
nt-size: 1.2rem;
  color: #666;
in-bottom: 2rem;


.fact-display-large,
.question-display-large {
  font-size: 4rem;
-weight: bold;
color: #333;
  margin: 2rem 0;
  line-height: 1.2;
}

ncoding-timer,
.recall-timer,
.practice-timer,
.assessment-timer {
  font-size: 1.5rem;
  color: #007bff;
margin-top: 2rem;
}

.fact-problem {
  color: #333;
}

.fact-answer {
  color: #28a745;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(40, 167, 69, 0.2);
}

.visual-representations {
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 12px;
er: 2px dashed #cbd5e1;


.visual-section {
  margin: 1.5rem 0;
}

.visual-section h4 {
  margin: 0 0 1rem 0;
  color: #1976d2;
  font-size: 1.1rem;
: center;


.ten-frame-visual,
.number-line-visual {
  display: block;
  margin: 0 auto;
}

.animated-dot {
  opacity: 0;
  animation: popIn 0.3s ease-out forwards;


@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animated-arc {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: drawArc 1s ease-out forwards;
  animation-delay: 0.5s;
}

@keyframes drawArc {
  to {
    stroke-dashoffset: 0;
  }
}

.next-btn {
  margin-top: 1.5rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.3);
}

.countdown-display {
  font-size: 3rem;
  font-weight: bold;
  color: #007bff;
  margin: 1rem 0;
}

.consolidation-animation {
  text-align: center;
  padding: 2rem;
}

.thinking-dots {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 2rem auto;
}

.thinking-dots .dot {
  width: 20px;
  height: 20px;
  background: #2196f3;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.thinking-dots .dot:nth-child(1) {
  animation-delay: 0s;
}
.thinking-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}
.thinking-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.consolidation-message {
  font-size: 1.3rem;
  color: #1976d2;
  font-style: italic;
}

.answer-input-large {
  width: 250px;
  padding: 1.5rem;
  font-size: 3rem;
  text-align: center;
  border: 4px solid #007bff;
  border-radius: 12px;
  font-weight: bold;
}

.answer-input-large:focus {
  outline: none;
  border-color: #0056b3;
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.25);
}

.feedback-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.feedback-message {
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
}

.feedback-correct .feedback-message {
  color: #28a745;
}

.feedback-incorrect .feedback-message {
  color: #dc3545;
}

.feedback-fact {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  margin: 2rem 0;
}

.feedback-next {
  font-size: 1.1rem;
  color: #666;
  margin: 1rem 0;
}

.feedback-countdown {
  font-size: 1.5rem;
  color: #007bff;
  margin-top: 1.5rem;
}

/* Round 2: Practice */
.practice-question {
  text-align: center;
  padding: 2rem 0;
}

.submit-btn {
  margin-top: 2rem;
  padding: 1rem 3rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
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

.round2-feedback {
  text-align: center;
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
}

.feedback-correct-inline {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 6px;
}

.feedback-incorrect-inline {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
}

.feedback-icon-inline {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.retry-note {
  display: block;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-style: italic;
}

.round2-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-value-mini {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

/* Round 3: Assessment */
.assessment-question {
  text-align: center;
  padding: 2rem 0;
}

.assessment-note {
  text-align: center;
  color: #666;
  font-style: italic;
  margin-top: 1.5rem;
}

/* Session Complete */
.complete-section {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.complete-section h2 {
  color: #28a745;
  margin-bottom: 2rem;
}

.session-summary {
  margin: 2rem 0;
}

.summary-achievements {
  margin: 1.5rem 0;
}

.achievement-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  margin: 0.5rem 0;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 1.1rem;
}

.achievement-icon {
  font-size: 2rem;
}

.promotions-list {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #d4edda;
  border-radius: 8px;
}

.promotions-list h4 {
  margin: 0 0 1rem 0;
  color: #155724;
}

.promotion-item {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.promotion-icon {
  font-size: 1.5rem;
}

.session-quality-display {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #e7f3ff;
  border-radius: 8px;
}

.session-quality-display h4 {
  margin: 0 0 0.5rem 0;
  color: #007bff;
  font-size: 1.3rem;
}

.session-time {
  color: #666;
  margin: 0.5rem 0;
}

.tomorrow-preview {
  margin: 2rem 0;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
}

.tomorrow-preview h4 {
  margin: 0 0 0.5rem 0;
  color: #856404;
}

.tomorrow-preview p {
  margin: 0;
  color: #856404;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.progress-btn,
.done-btn,
.view-progress-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.progress-btn,
.view-progress-btn {
  background: #007bff;
  color: white;
}

.progress-btn:hover,
.view-progress-btn:hover {
  background: #0056b3;
}

.done-btn {
  background: #6c757d;
  color: white;
}

.done-btn:hover {
  background: #5a6268;
}
</style>
