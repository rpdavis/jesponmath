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
        <h4>Today's Summary</h4>
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
    <MathFluencyDiagnosticRound
      v-if="practiceStarted && currentRound === 0.5"
      :problems="diagnosticProblems"
      :time-per-problem="10"
      @answer="handleDiagnosticAnswer"
      @complete="handleDiagnosticComplete"
    />

    <!-- DIAGNOSTIC RESULTS -->
    <MathFluencyDiagnosticResults
      v-if="practiceStarted && currentRound === 0.75"
      :score="diagnosticScore"
      :correct="diagnosticCorrect"
      :total="diagnosticProblems.length"
      :wrong-problems="diagnosticWrongProblems"
      @continue="continueCurrentLevel"
    />

    <!-- ROUND 1: Learning -->
    <MathFluencyRound1Learning
      v-if="practiceStarted && currentRound === 1"
      :problems="round1Problems"
      :current-index="round1CurrentIndex"
      :phase="round1Phase"
      :consolidation-time-remaining="consolidationTimeRemaining"
      :recall-time-remaining="recallTimeRemaining"
      :feedback-time-remaining="feedbackTimeRemaining"
      :answer="round1Answer"
      :last-correct="round1LastCorrect"
      @proceed-to-recall="proceedToRecall"
      @submit-answer="submitRound1Answer"
    />

    <!-- ROUND 2: Practice -->
    <MathFluencyRound2Practice
      v-if="practiceStarted && currentRound === 2"
      :problems="round2Problems"
      :mix-info="round2MixInfo"
      @answer="handleRound2Answer"
      @complete="finishRound2"
    />

    <!-- ROUND 3: Quick Assessment -->
    <MathFluencyRound3Assessment
      v-if="practiceStarted && currentRound === 3"
      :problems="round3Problems"
      :time-per-problem="10"
      @answer="handleRound3Answer"
      @complete="finishSession"
    />


    <!-- Session Complete -->
    <MathFluencySessionComplete
      v-if="sessionComplete"
      :session="session"
      :promotions-earned="promotionsEarned"
      :total-time="totalSessionTime"
      :distribution="distribution"
      @view-progress="viewProgress"
      @finish="finishSession"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
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
import MathFluencyDiagnosticResults from './mathFluency/rounds/MathFluencyDiagnosticResults.vue'
import MathFluencyRound1Learning from './mathFluency/rounds/MathFluencyRound1Learning.vue'
import MathFluencyRound2Practice from './mathFluency/rounds/MathFluencyRound2Practice.vue'
import MathFluencyRound3Assessment from './mathFluency/rounds/MathFluencyRound3Assessment.vue'
import MathFluencySessionComplete from './mathFluency/rounds/MathFluencySessionComplete.vue'
import MathFluencyTimerBar from './mathFluency/visuals/MathFluencyTimerBar.vue'
import MathFluencyTenFrame from './mathFluency/visuals/MathFluencyTenFrame.vue'
import MathFluencyNumberLine from './mathFluency/visuals/MathFluencyNumberLine.vue'
import MathFluencyArrayGrid from './mathFluency/visuals/MathFluencyArrayGrid.vue'
import MathFluencyDivisionGroups from './mathFluency/visuals/MathFluencyDivisionGroups.vue'

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

// Warmup State
const warmupNumbers = ref<number[]>([])
const warmupCurrentIndex = ref(0)
const warmupAnswer = ref('')
const warmupInput = ref<HTMLInputElement | null>(null)

// Diagnostic State
const diagnosticProblems = ref<ProblemProgress[]>([])
const diagnosticCurrentIndex = ref(0)
const diagnosticAnswer = ref('')
const diagnosticResults = ref<{ [problemId: string]: { correct: boolean; responseTime: number } }>(


const diagnosticInput = ref<HTMLInputElement | null>(null)
const diagnosticTimeRemaining = ref(10)
const diagnosticTimerInterval = ref<number | null>(null)
const diagnosticStartTime = ref(0)
const diagnosticSubmitting = ref(false)
const diagnosticShowingQuestion = ref(true)

// Round 1: Learning State
const round1Phase = ref<'encoding' | 'consolidation' | 'recall' | 'feedback'>('encoding')
const round1Problems = ref<ProblemProgress[]>([])
const round1CurrentIndex = ref(0)
const round1Answer = ref('')
const round1RecallAttempt = ref(0) // 1 or 2
const round1LastCorrect = ref(false)
const round1AttemptsLog = ref<{ [problemId: string]: any }>({})
const round1LearnedToday = ref<string[]>([])
const round1Input = ref<HTMLInputElement | null>(null)

// Round 1 Timers
const encodingTimeRemaining = ref(5)
const consolidationTimeRemaining = ref(5) // 5 seconds to think
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

const distribution = computed(
  () =>
    progress.value?.proficiencyDistribution || {
      doesNotKnow: 0,
      emerging: 0,
      approaching: 0,
      proficient: 0,
      mastered: 0,
      total: 100,
    },
)

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
}

// Diagnostic Round Event Handlers
function handleDiagnosticAnswer(
  problemId: string,
  answer: string,
  responseTime: number,
  isCorrect: boolean,
) {
  // Store the result
  diagnosticResults.value[problemId] = {
    correct: isCorrect,
    responseTime,
  }
}

function handleDiagnosticComplete() {
  // Diagnostic complete - show results (USER MUST CLICK)
  currentRound.value = 0.75
  diagnosticShowingQuestion.value = true
  console.log('📊 Diagnostic complete - showing results, waiting for click')
}

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


// Handler for Round 2 component events
async function handleRound2Answer(problemId: string, answer: string, responseTime: number, isCorrect: boolean) {
  // Update problem in progress
  await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
    correct: isCorrect,
    responseTime,
    source: 'digital-practice',
  })

  // Log result
  if (!round2Results.value[problemId]) {
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

  round2Total.value++
  if (isCorrect) {
    round2Correct.value++
  }
}

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
  }

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

// Handler for Round 3 component events
async function handleRound3Answer(problemId: string, answer: string, responseTime: number) {
  const problem = round3Problems.value.find((p) => p.problemId === problemId)
  if (!problem) return

  const isCorrect = String(answer || '').trim() === problem.correctAnswer
  const previousLevel = problem.proficiencyLevel

  round3Results.value[problemId] = {
    correct: isCorrect,
    responseTime,
    previousLevel,
    maintainedLevel: true, // Will be updated after proficiency recalc
  }

  // Update problem in progress
  await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
    correct: isCorrect,
    responseTime,
    source: 'digital-assessment',
  })
}

function finishRound3() {
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

<style scoped src="./mathFluency/styles/dailyPracticeStyles.css"></style>
