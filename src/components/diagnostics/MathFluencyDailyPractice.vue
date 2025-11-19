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
      <p class="completion-time">Completed at: {{ todaysSession?.completedAt?.toDate().toLocaleTimeString() }}</p>
      
      <div class="today-summary">
        <h4>Today's Results:</h4>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-label">Facts Learned:</span>
            <span class="stat-value">{{ todaysSession?.round1_learning?.newlyLearned?.length || 0 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Practice Accuracy:</span>
            <span class="stat-value">{{ Math.round(todaysSession?.round2_practice?.accuracy || 0) }}%</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Time:</span>
            <span class="stat-value">{{ Math.round((todaysSession?.totalTimeSpent || 0) / 60) }} min</span>
          </div>
        </div>
      </div>

      <button @click="viewProgress" class="view-progress-btn">
        View My Progress →
      </button>
    </div>

    <!-- Start Screen -->
    <div v-else-if="!practiceStarted" class="start-section">
      <div class="progress-overview">
        <h3>Your Progress - {{ capitalizeOperation(currentOperation) }}</h3>
        
        <div class="proficiency-bars">
          <div class="bar-item mastered">
            <span class="bar-label">🏆 Mastered</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${(distribution.mastered / distribution.total) * 100}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.mastered }}</span>
          </div>
          
          <div class="bar-item proficient">
            <span class="bar-label">🔵 Proficient</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${(distribution.proficient / distribution.total) * 100}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.proficient }}</span>
          </div>
          
          <div class="bar-item approaching">
            <span class="bar-label">🟡 Approaching</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${(distribution.approaching / distribution.total) * 100}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.approaching }}</span>
          </div>
          
          <div class="bar-item emerging">
            <span class="bar-label">🟢 Emerging</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${(distribution.emerging / distribution.total) * 100}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.emerging }}</span>
          </div>
          
          <div class="bar-item does-not-know">
            <span class="bar-label">🔴 Learning</span>
            <div class="bar-container">
              <div class="bar-fill" :style="{ width: `${(distribution.doesNotKnow / distribution.total) * 100}%` }"></div>
            </div>
            <span class="bar-count">{{ distribution.doesNotKnow }}</span>
          </div>
        </div>

        <div class="unlock-progress">
          <h4>Progress to Unlock {{ nextOperationName }}:</h4>
          <div class="unlock-bar">
            <div class="unlock-fill" :style="{ width: `${proficiencyPercentage}%` }"></div>
            <span class="unlock-text">{{ proficiencyPercentage }}% / 95%</span>
          </div>
        </div>

        <div class="streak-display">
          <span class="streak-icon">🔥</span>
          <span class="streak-text">{{ practiceStreak }} day streak!</span>
        </div>
      </div>

      <div class="session-info">
        <h3>Today's Practice Plan:</h3>
        <div class="rounds-preview">
          <div class="round-card">
            <div class="round-header">Round 1: Learning</div>
            <p>{{ round1Problems.length }} facts to learn</p>
            <p class="round-time">~4-5 minutes</p>
          </div>
          <div class="round-card">
            <div class="round-header">Round 2: Practice</div>
            <p>{{ round2Problems.length }} facts (mixed)</p>
            <p class="round-time">~4-5 minutes</p>
          </div>
          <div class="round-card">
            <div class="round-header">Round 3: Quick Check</div>
            <p>{{ round3Problems.length }} facts</p>
            <p class="round-time">~2 minutes</p>
          </div>
        </div>
        <p class="total-time">Total: ~10-12 minutes</p>
      </div>

      <button @click="startPractice" class="start-practice-btn">
        🚀 Start Today's Practice
      </button>
    </div>

    <!-- ROUND 1: Learning -->
    <div v-if="practiceStarted && currentRound === 1" class="round-section round-1">
      <div class="round-header-bar">
        <h3>Round 1: Learning New Facts</h3>
        <p>{{ round1CurrentIndex + 1 }}/{{ round1Problems.length }} facts</p>
      </div>

      <!-- Encoding Phase -->
      <div v-if="round1Phase === 'encoding'" class="encoding-phase">
        <p class="phase-instruction">Watch carefully!</p>
        <div class="fact-display-large">
          {{ currentRound1Problem?.displayText.replace(' = ?', ` = ${currentRound1Problem.correctAnswer}`) }}
        </div>
        <p class="encoding-timer">{{ encodingTimeRemaining }}s</p>
      </div>

      <!-- Consolidation Phase -->
      <div v-if="round1Phase === 'consolidation'" class="consolidation-phase">
        <p class="phase-instruction">Get ready...</p>
        <div class="countdown-display">{{ consolidationTimeRemaining }}</div>
      </div>

      <!-- Recall Phase -->
      <div v-if="round1Phase === 'recall'" class="recall-phase">
        <p class="phase-instruction">Now you try!</p>
        <div class="question-display-large">
          {{ currentRound1Problem?.displayText }}
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
            {{ currentRound1Problem?.displayText.replace(' = ?', ` = ${currentRound1Problem.correctAnswer}`) }}
          </div>
          <p class="feedback-next">{{ round1RecallAttempt === 1 ? 'Testing again...' : 'Moving to next fact...' }}</p>
          <p class="feedback-countdown">{{ feedbackTimeRemaining }}s</p>
        </div>
        
        <div v-else class="feedback-incorrect">
          <div class="feedback-icon">❌</div>
          <div class="feedback-message">The answer is {{ currentRound1Problem?.correctAnswer }}</div>
          <div class="feedback-fact">
            {{ currentRound1Problem?.displayText.replace(' = ?', ` = ${currentRound1Problem.correctAnswer}`) }}
          </div>
          <p class="feedback-next">Let's see it again...</p>
          <p class="feedback-countdown">{{ feedbackTimeRemaining }}s</p>
        </div>
      </div>
    </div>

    <!-- ROUND 2: Practice -->
    <div v-if="practiceStarted && currentRound === 2" class="round-section round-2">
      <div class="round-header-bar">
        <h3>Round 2: Practice</h3>
        <p>{{ round2CurrentIndex + 1 }}/{{ round2Problems.length }} problems</p>
        <p class="mix-info">Mixed: {{ round2MixInfo }}</p>
      </div>

      <div class="practice-question">
        <div class="question-display-large">
          {{ currentRound2Problem?.displayText }}
        </div>
        <input
          ref="round2Input"
          v-model="round2Answer"
          type="number"
          class="answer-input-large"
          placeholder="?"
          @keyup.enter="submitRound2Answer"
          autofocus
        />
        <p class="practice-timer">{{ round2TimeRemaining }}s</p>
        
        <button @click="submitRound2Answer" class="submit-btn" :disabled="!round2Answer">
          Submit
        </button>
      </div>

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
          {{ currentRound3Problem?.displayText }}
        </div>
        <input
          ref="round3Input"
          v-model="round3Answer"
          type="number"
          class="answer-input-large"
          placeholder="?"
          @keyup.enter="submitRound3Answer"
          autofocus
        />
        <p class="assessment-timer">{{ round3TimeRemaining }}s</p>
        
        <button @click="submitRound3Answer" class="submit-btn" :disabled="!round3Answer">
          Submit
        </button>
      </div>

      <p class="assessment-note">No feedback during assessment - keep going!</p>
    </div>

    <!-- Session Complete -->
    <div v-if="sessionComplete" class="complete-section">
      <h2>🎉 Great Practice Session!</h2>
      
      <div class="session-summary">
        <h3>Today You:</h3>
        <div class="summary-achievements">
          <div class="achievement-item" v-if="session.round1_learning?.newlyLearned && session.round1_learning.newlyLearned.length > 0">
            <span class="achievement-icon">📚</span>
            <span>Learned {{ session.round1_learning.newlyLearned.length }} new facts</span>
          </div>
          <div class="achievement-item">
            <span class="achievement-icon">💪</span>
            <span>Practiced {{ session.round2_practice?.problemsPresented?.length || 0 }} facts</span>
          </div>
          <div class="achievement-item">
            <span class="achievement-icon">✓</span>
            <span>{{ session.round2_practice?.accuracy || 0 }}% accuracy in practice</span>
          </div>
          <div class="achievement-item" v-if="promotionsEarned.length > 0">
            <span class="achievement-icon">⭐</span>
            <span>{{ promotionsEarned.length }} facts promoted!</span>
          </div>
        </div>

        <div v-if="promotionsEarned.length > 0" class="promotions-list">
          <h4>Facts Promoted Today:</h4>
          <div v-for="problemId in promotionsEarned.slice(0, 5)" :key="problemId" class="promotion-item">
            <span class="promotion-icon">🎊</span>
            <span>{{ getProblemDisplay(problemId) }} is now {{ getNewLevel(problemId) }}!</span>
          </div>
          <p v-if="promotionsEarned.length > 5">
            ...and {{ promotionsEarned.length - 5 }} more!
          </p>
        </div>

        <div class="session-quality-display">
          <h4>Session Quality: {{ sessionQualityDisplay }}</h4>
          <p class="session-time">Total Time: {{ Math.round(totalSessionTime / 60) }} minutes</p>
        </div>

        <div class="tomorrow-preview">
          <h4>Tomorrow's Goal:</h4>
          <p>Practice {{ Math.min(15, distribution.emerging + distribution.doesNotKnow) }} facts</p>
        </div>
      </div>

      <div class="complete-actions">
        <button @click="viewProgress" class="progress-btn">
          See My Progress
        </button>
        <button @click="finishSession" class="done-btn">
          Done for Today
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { 
  getFluencyProgress, 
  getTodaysPracticeSession,
  createPracticeSession,
  updateProblemInProgress
} from '@/services/mathFluencyServices'
import { sampleRandom, shuffleArray } from '@/utils/mathFluencyProblemGenerator'
import { getNextOperation } from '@/types/mathFluency'
import type { 
  MathFluencyProgress, 
  ProblemProgress, 
  OperationType,
  MathFluencyPracticeSession,
  LearningRoundData,
  PracticeRoundData,
  AssessmentRoundData
} from '@/types/mathFluency'
import { Timestamp } from 'firebase/firestore'
import { markFluencyAssignmentComplete } from '@/services/mathFluencyAssignmentServices'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const loading = ref(true)
const completedToday = ref(false)
const practiceStarted = ref(false)
const sessionComplete = ref(false)
const currentRound = ref(0)
const progress = ref<MathFluencyProgress | null>(null)
const todaysSession = ref<MathFluencyPracticeSession | null>(null)
const assignmentId = ref<string | null>(null)

// Round 1: Learning State
const round1Phase = ref<'encoding' | 'consolidation' | 'recall' | 'feedback'>('encoding')
const round1Problems = ref<ProblemProgress[]>([])
const round1CurrentIndex = ref(0)
const round1Answer = ref('')
const round1RecallAttempt = ref(0)  // 1 or 2
const round1LastCorrect = ref(false)
const round1AttemptsLog = ref<{[problemId: string]: any}>({})
const round1LearnedToday = ref<string[]>([])
const round1Input = ref<HTMLInputElement | null>(null)

// Round 1 Timers
const encodingTimeRemaining = ref(5)
const consolidationTimeRemaining = ref(2)
const recallTimeRemaining = ref(15)
const feedbackTimeRemaining = ref(10)
const round1TimerInterval = ref<number | null>(null)

// Round 2: Practice State
const round2Problems = ref<ProblemProgress[]>([])
const round2Stack = ref<ProblemProgress[]>([])
const round2CurrentIndex = ref(0)
const round2Answer = ref('')
const round2ShowingFeedback = ref(false)
const round2LastCorrect = ref(false)
const round2LastTime = ref(0)
const round2Results = ref<{[problemId: string]: any}>({})
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
const round3Results = ref<{[problemId: string]: any}>({})
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
    completed: false
  },
  round2_practice: {
    problemsPresented: [],
    problemsMixed: true,
    mixComposition: { emerging: 0, proficient: 0, mastered: 0 },
    results: {},
    accuracy: 0,
    averageResponseTime: 0,
    timeSpent: 0,
    completed: false
  },
  round3_assessment: {
    problemsAssessed: [],
    results: {},
    accuracy: 0,
    averageResponseTime: 0,
    timeSpent: 0,
    completed: false
  }
})

// Computed
const currentOperation = computed(() => progress.value?.operation || 'addition')

const distribution = computed(() => progress.value?.proficiencyDistribution || {
  doesNotKnow: 0,
  emerging: 0,
  approaching: 0,
  proficient: 0,
  mastered: 0,
  total: 100
})

const proficiencyPercentage = computed(() => progress.value?.proficiencyPercentage || 0)

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
    'excellent': '🏆 Excellent',
    'good': '⭐ Good',
    'fair': '👍 Fair',
    'incomplete': '⚠️ Incomplete'
  }
  return qualities[session.value.sessionQuality as keyof typeof qualities] || 'Good'
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

function preparePracticeSession() {
  if (!progress.value) return
  
  const banks = progress.value.problemBanks
  
  // Round 1: Select 3 problems from "Does Not Know" (can expand to 5 if student doing well)
  round1Problems.value = sampleRandom(banks.doesNotKnow, 3)
  
  // Round 2: Interleaved practice (80/20 split)
  // Check if student has unlocked multiple operations
  const hasPreviousOperation = false  // TODO: Check for previous operations
  
  if (hasPreviousOperation) {
    // 80% current, 20% maintenance
    const currentOpProblems = [
      ...sampleRandom(banks.emerging, 7),
      ...sampleRandom(banks.approaching, 5)
    ]
    // const maintenanceProblems = [get 3 from previous operation]
    round2Problems.value = shuffleArray(currentOpProblems)
  } else {
    // 100% current operation (70% emerging, 20% proficient, 10% mastered)
    round2Problems.value = shuffleArray([
      ...sampleRandom(banks.emerging, 7),
      ...sampleRandom(banks.approaching, 3),
      ...sampleRandom(banks.proficient, 3),
      ...sampleRandom(banks.mastered, 2)
    ])
  }
  
  round2Stack.value = [...round2Problems.value]
  
  // Track mix composition
  if (session.value.round2_practice) {
    session.value.round2_practice.mixComposition = {
      emerging: round2Problems.value.filter(p => p.proficiencyLevel === 'emerging' || p.proficiencyLevel === 'approaching').length,
      proficient: round2Problems.value.filter(p => p.proficiencyLevel === 'proficient').length,
      mastered: round2Problems.value.filter(p => p.proficiencyLevel === 'mastered').length
    }
  }
  
  // Round 3: Quick assessment (sample from all levels)
  round3Problems.value = shuffleArray([
    ...sampleRandom(banks.emerging, 5),
    ...sampleRandom(banks.proficient, 3),
    ...sampleRandom(banks.mastered, 2)
  ])
}

function startPractice() {
  practiceStarted.value = true
  sessionStartTime.value = Date.now()
  currentRound.value = 1
  
  // Start Round 1
  startRound1()
}

// =============================================================================
// ROUND 1: LEARNING
// =============================================================================

function startRound1() {
  if (round1Problems.value.length === 0) {
    // No unmet problems - skip to Round 2
    startRound2()
    return
  }
  
  currentRound.value = 1
  round1CurrentIndex.value = 0
  round1Phase.value = 'encoding'
  
  // Log this problem as targeted
  if (session.value.round1_learning && currentRound1Problem.value) {
    session.value.round1_learning.problemsTargeted.push(currentRound1Problem.value.problemId)
  }
  
  startEncodingPhase()
}

function startEncodingPhase() {
  round1Phase.value = 'encoding'
  encodingTimeRemaining.value = 5
  
  clearAllTimers()
  round1TimerInterval.value = window.setInterval(() => {
    encodingTimeRemaining.value--
    if (encodingTimeRemaining.value <= 0) {
      startConsolidationPhase()
    }
  }, 1000)
}

function startConsolidationPhase() {
  round1Phase.value = 'consolidation'
  consolidationTimeRemaining.value = 2
  
  clearAllTimers()
  round1TimerInterval.value = window.setInterval(() => {
    consolidationTimeRemaining.value--
    if (consolidationTimeRemaining.value <= 0) {
      startRecallPhase()
    }
  }, 1000)
}

async function startRecallPhase() {
  round1Phase.value = 'recall'
  round1Answer.value = ''
  recallTimeRemaining.value = 15
  round1RecallAttempt.value = (round1RecallAttempt.value || 0) + 1
  
  clearAllTimers()
  round1TimerInterval.value = window.setInterval(() => {
    recallTimeRemaining.value--
    if (recallTimeRemaining.value <= 0) {
      // Timeout - treat as incorrect
      submitRound1Answer()
    }
  }, 1000)
  
  await nextTick()
  round1Input.value?.focus()
}

async function submitRound1Answer() {
  if (!currentRound1Problem.value) return
  
  clearAllTimers()
  
  const responseTime = (15 - recallTimeRemaining.value) * 1000
  const isCorrect = String(round1Answer.value || '').trim() === currentRound1Problem.value.correctAnswer
  
  round1LastCorrect.value = isCorrect
  
  // Log attempt
  const problemId = currentRound1Problem.value.problemId
  if (!round1AttemptsLog.value[problemId]) {
    round1AttemptsLog.value[problemId] = {
      encodingCycles: 1,
      recallAttempts: 0,
      timesSpent: []
    }
  }
  round1AttemptsLog.value[problemId].recallAttempts++
  round1AttemptsLog.value[problemId].timesSpent.push(responseTime)
  
  // Show feedback
  round1Phase.value = 'feedback'
  feedbackTimeRemaining.value = 10
  
  round1TimerInterval.value = window.setInterval(() => {
    feedbackTimeRemaining.value--
    if (feedbackTimeRemaining.value <= 0) {
      handleRound1Feedback()
    }
  }, 1000)
}

async function handleRound1Feedback() {
  clearAllTimers()
  
  if (round1LastCorrect.value) {
    if (round1RecallAttempt.value === 1) {
      // First recall successful - test again after delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      round1RecallAttempt.value = 2
      startRecallPhase()
    } else {
      // Second recall successful - fact learned!
      const problemId = currentRound1Problem.value!.problemId
      round1LearnedToday.value.push(problemId)
      round1AttemptsLog.value[problemId].finalResult = 'learned'
      
      if (session.value.round1_learning) {
        session.value.round1_learning.newlyLearned.push(problemId)
        session.value.round1_learning.problemsCompleted.push(problemId)
      }
      
      // Update problem in progress
      await updateProblemInProgress(
        authStore.currentUser!.uid,
        currentOperation.value,
        problemId,
        {
          correct: true,
          responseTime: round1AttemptsLog.value[problemId].timesSpent[round1AttemptsLog.value[problemId].timesSpent.length - 1],
          source: 'digital-practice'
        }
      )
      
      // Move to next problem
      moveToNextRound1Problem()
    }
  } else {
    // Incorrect - show again (encoding phase)
    round1AttemptsLog.value[currentRound1Problem.value!.problemId].encodingCycles++
    round1RecallAttempt.value = 0
    
    // Maximum 3 encoding cycles, then skip
    if (round1AttemptsLog.value[currentRound1Problem.value!.problemId].encodingCycles >= 3) {
      round1AttemptsLog.value[currentRound1Problem.value!.problemId].finalResult = 'retry-later'
      if (session.value.round1_learning) {
        session.value.round1_learning.problemsStillUnmet.push(currentRound1Problem.value!.problemId)
      }
      moveToNextRound1Problem()
    } else {
      // Try encoding again
      await new Promise(resolve => setTimeout(resolve, 1000))
      startEncodingPhase()
    }
  }
}

function moveToNextRound1Problem() {
  round1CurrentIndex.value++
  
  if (round1CurrentIndex.value >= round1Problems.value.length) {
    // Round 1 complete
    finishRound1()
  } else {
    round1RecallAttempt.value = 0
    if (session.value.round1_learning && currentRound1Problem.value) {
      session.value.round1_learning.problemsTargeted.push(currentRound1Problem.value.problemId)
    }
    startEncodingPhase()
  }
}

function finishRound1() {
  if (session.value.round1_learning) {
    session.value.round1_learning.attemptsPerProblem = round1AttemptsLog.value
    session.value.round1_learning.timeSpent = Math.round((Date.now() - sessionStartTime.value) / 1000)
    session.value.round1_learning.completed = true
  }
  
  // Start Round 2
  startRound2()
}

// =============================================================================
// ROUND 2: PRACTICE
// =============================================================================

async function startRound2() {
  currentRound.value = 2
  round2CurrentIndex.value = 0
  round2Stack.value = [...round2Problems.value]
  round2Correct.value = 0
  round2Total.value = 0
  round2Results.value = {}
  
  if (session.value.round2_practice) {
    session.value.round2_practice.problemsPresented = round2Problems.value.map(p => p.problemId)
  }
  
  if (round2Stack.value.length === 0) {
    // No problems to practice - skip to Round 3
    startRound3()
    return
  }
  
  showNextRound2Problem()
}

async function showNextRound2Problem() {
  if (round2Stack.value.length === 0) {
    // All problems correct - finish round
    finishRound2()
    return
  }
  
  round2Answer.value = ''
  round2ShowingFeedback.value = false
  round2StartTime.value = Date.now()
  round2TimeRemaining.value = 15
  
  clearRound2Timer()
  round2TimerInterval.value = window.setInterval(() => {
    round2TimeRemaining.value--
    if (round2TimeRemaining.value <= 0) {
      submitRound2Answer()
    }
  }, 1000)
  
  await nextTick()
  round2Input.value?.focus()
}

async function submitRound2Answer() {
  if (!currentRound2Problem.value) return
  
  clearRound2Timer()
  
  const responseTime = Date.now() - round2StartTime.value
  const isCorrect = String(round2Answer.value || '').trim() === currentRound2Problem.value.correctAnswer
  
  round2LastCorrect.value = isCorrect
  round2LastTime.value = responseTime
  round2Total.value++
  
  if (isCorrect) {
    round2Correct.value++
  }
  
  // Log result
  const problemId = currentRound2Problem.value.problemId
  if (!round2Results.value[problemId]) {
    round2Results.value[problemId] = {
      attempts: 0,
      correct: false,
      responseTimes: [],
      returnedToStack: false
    }
  }
  round2Results.value[problemId].attempts++
  round2Results.value[problemId].responseTimes.push(responseTime)
  round2Results.value[problemId].correct = isCorrect
  
  // Update problem in progress
  await updateProblemInProgress(
    authStore.currentUser!.uid,
    currentOperation.value,
    problemId,
    {
      correct: isCorrect,
      responseTime,
      source: 'digital-practice'
    }
  )
  
  // Show feedback briefly
  round2ShowingFeedback.value = true
  
  // Remove from stack
  const current = round2Stack.value.shift()
  
  // If incorrect, add back to end of stack
  if (!isCorrect && current) {
    round2Stack.value.push(current)
    round2Results.value[problemId].returnedToStack = true
  }
  
  // Continue after brief pause
  await new Promise(resolve => setTimeout(resolve, 1500))
  showNextRound2Problem()
}

function finishRound2() {
  if (session.value.round2_practice) {
    session.value.round2_practice.results = round2Results.value
    session.value.round2_practice.accuracy = round2Accuracy.value
    const times = Object.values(round2Results.value).flatMap(r => r.responseTimes)
    session.value.round2_practice.averageResponseTime = times.length > 0 
      ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
      : 0
    session.value.round2_practice.timeSpent = Math.round((Date.now() - sessionStartTime.value) / 1000) - (session.value.round1_learning?.timeSpent || 0)
    session.value.round2_practice.completed = true
  }
  
  startRound3()
}

// =============================================================================
// ROUND 3: QUICK ASSESSMENT
// =============================================================================

async function startRound3() {
  currentRound.value = 3
  round3CurrentIndex.value = 0
  round3Results.value = {}
  
  if (session.value.round3_assessment) {
    session.value.round3_assessment.problemsAssessed = round3Problems.value.map(p => p.problemId)
  }
  
  if (round3Problems.value.length === 0) {
    // No problems to assess - finish session
    finishSession()
    return
  }
  
  showNextRound3Problem()
}

async function showNextRound3Problem() {
  if (round3CurrentIndex.value >= round3Problems.value.length) {
    finishRound3()
    return
  }
  
  round3Answer.value = ''
  round3StartTime.value = Date.now()
  round3TimeRemaining.value = 10
  
  clearRound3Timer()
  round3TimerInterval.value = window.setInterval(() => {
    round3TimeRemaining.value--
    if (round3TimeRemaining.value <= 0) {
      submitRound3Answer()
    }
  }, 1000)
  
  await nextTick()
  round3Input.value?.focus()
}

async function submitRound3Answer() {
  if (!currentRound3Problem.value) return
  
  clearRound3Timer()
  
  const responseTime = Date.now() - round3StartTime.value
  const isCorrect = String(round3Answer.value || '').trim() === currentRound3Problem.value.correctAnswer
  
  const problemId = currentRound3Problem.value.problemId
  const previousLevel = currentRound3Problem.value.proficiencyLevel
  
  round3Results.value[problemId] = {
    correct: isCorrect,
    responseTime,
    previousLevel,
    maintainedLevel: true  // Will be updated after proficiency recalc
  }
  
  // Update problem in progress
  await updateProblemInProgress(
    authStore.currentUser!.uid,
    currentOperation.value,
    problemId,
    {
      correct: isCorrect,
      responseTime,
      source: 'digital-assessment'
    }
  )
  
  // Move to next
  round3CurrentIndex.value++
  
  // Brief pause before next question
  await new Promise(resolve => setTimeout(resolve, 500))
  showNextRound3Problem()
}

function finishRound3() {
  if (session.value.round3_assessment) {
    session.value.round3_assessment.results = round3Results.value
    const correct = Object.values(round3Results.value).filter(r => r.correct).length
    session.value.round3_assessment.accuracy = (correct / round3Problems.value.length) * 100
    const times = Object.values(round3Results.value).map(r => r.responseTime)
    session.value.round3_assessment.averageResponseTime = times.length > 0 
      ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
      : 0
    session.value.round3_assessment.timeSpent = Math.round((Date.now() - sessionStartTime.value) / 1000) - 
      ((session.value.round1_learning?.timeSpent || 0) + (session.value.round2_practice?.timeSpent || 0))
    session.value.round3_assessment.completed = true
  }
  
  finishSession()
}

// =============================================================================
// SESSION COMPLETION
// =============================================================================

async function finishSession() {
  clearAllTimers()
  
  totalSessionTime.value = Date.now() - sessionStartTime.value
  
  // Determine session quality
  const completionRate = (
    (session.value.round1_learning?.completed ? 1 : 0) +
    (session.value.round2_practice?.completed ? 1 : 0) +
    (session.value.round3_assessment?.completed ? 1 : 0)
  ) / 3
  
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
  promotionsEarned.value = []  // TODO: Calculate from before/after comparison
  
  // Save session to Firestore
  try {
    await createPracticeSession({
      studentUid: authStore.currentUser!.uid,
      studentName: authStore.currentUser?.displayName || 'Student',
      operation: currentOperation.value,
      sessionDate: Timestamp.now(),
      dayOfWeek: new Date().getDay(),
      weekNumber: 1,  // TODO: Calculate actual week number
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
      engagementScore: session.value.engagementScore || 0
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
  if (!authStore.currentUser) return
  
  try {
    progress.value = await getFluencyProgress(authStore.currentUser.uid, currentOperation.value)
  } catch (error) {
    console.error('Error reloading progress:', error)
  }
}

function viewProgress() {
  router.push('/fluency/my-progress')
}

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
  clearRound3Timer()
}

function clearRound2Timer() {
  if (round2TimerInterval.value) {
    clearInterval(round2TimerInterval.value)
    round2TimerInterval.value = null
  }
}

function clearRound3Timer() {
  if (round3TimerInterval.value) {
    clearInterval(round3TimerInterval.value)
    round3TimerInterval.value = null
  }
}

function capitalizeOperation(op: OperationType | string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}

function getProblemDisplay(problemId: string): string {
  // Extract from problemId (e.g., "ADD_7_8" -> "7+8")
  const parts = problemId.split('_')
  if (parts.length === 3) {
    const op = parts[0] === 'ADD' ? '+' : parts[0] === 'SUB' ? '-' : parts[0] === 'MULT' ? '×' : '÷'
    return `${parts[1]}${op}${parts[2]}`
  }
  return problemId
}

function getNewLevel(problemId: string): string {
  // TODO: Get actual new level from updated progress
  return 'PROFICIENT'
}
</script>

<style scoped>
.daily-practice-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.practice-header {
  text-align: center;
  margin-bottom: 2rem;
}

.practice-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

/* Loading */
.loading-section {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

/* Completed Today */
.completed-today-section {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.completed-today-section h3 {
  color: #28a745;
  margin-bottom: 1rem;
}

.completion-time {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.today-summary {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

/* Start Section */
.start-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.progress-overview {
  margin-bottom: 2rem;
}

.progress-overview h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  text-align: center;
}

.proficiency-bars {
  margin: 1.5rem 0;
}

.bar-item {
  display: grid;
  grid-template-columns: 150px 1fr 60px;
  align-items: center;
  gap: 1rem;
  margin: 0.75rem 0;
}

.bar-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.bar-container {
  height: 24px;
  background: #eee;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.bar-item.mastered .bar-fill {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.bar-item.proficient .bar-fill {
  background: linear-gradient(90deg, #007bff, #0056b3);
}

.bar-item.approaching .bar-fill {
  background: linear-gradient(90deg, #ffc107, #ff9800);
}

.bar-item.emerging .bar-fill {
  background: linear-gradient(90deg, #17a2b8, #138496);
}

.bar-item.does-not-know .bar-fill {
  background: linear-gradient(90deg, #dc3545, #c82333);
}

.bar-count {
  font-weight: bold;
  text-align: right;
  color: #333;
}

.unlock-progress {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.unlock-progress h4 {
  margin: 0 0 1rem 0;
  text-align: center;
  color: #333;
}

.unlock-bar {
  height: 40px;
  background: #eee;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.unlock-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.5s;
}

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

.streak-icon {
  font-size: 2rem;
  margin-right: 0.5rem;
}

.streak-text {
  font-weight: bold;
  color: #ff6b6b;
}

.session-info {
  margin: 2rem 0;
}

.session-info h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.rounds-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.round-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #ddd;
  text-align: center;
}

.round-header {
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.round-card p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.round-time {
  font-style: italic;
  color: #999 !important;
}

.total-time {
  text-align: center;
  font-weight: bold;
  color: #333;
  margin-top: 1rem;
}

.start-practice-btn {
  width: 100%;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.start-practice-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

/* Round Sections */
.round-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.round-header-bar {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.round-header-bar h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.round-header-bar p {
  margin: 0.25rem 0;
  color: #666;
}

.mix-info {
  font-size: 0.85rem;
  color: #999;
}

/* Round 1: Learning Phases */
.encoding-phase,
.consolidation-phase,
.recall-phase,
.feedback-phase {
  text-align: center;
  padding: 3rem 0;
}

.phase-instruction {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.fact-display-large,
.question-display-large {
  font-size: 4rem;
  font-weight: bold;
  color: #333;
  margin: 2rem 0;
  line-height: 1.2;
}

.encoding-timer,
.recall-timer,
.practice-timer,
.assessment-timer {
  font-size: 1.5rem;
  color: #007bff;
  margin-top: 2rem;
}

.countdown-display {
  font-size: 6rem;
  font-weight: bold;
  color: #007bff;
  margin: 3rem 0;
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
  box-shadow: 0 0 0 4px rgba(0,123,255,0.25);
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

