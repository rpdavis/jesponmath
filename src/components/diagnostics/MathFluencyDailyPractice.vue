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
      @continue="handleContinueCurrentLevel"
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
      @complete="() => finishRound2(() => startRound3())"
    />

    <!-- ROUND 3: Quick Assessment -->
    <MathFluencyRound3Assessment
      v-if="practiceStarted && currentRound === 3"
      :problems="round3Problems"
      :time-per-problem="10"
      @answer="handleRound3Answer"
      @complete="finishRound3"
    />


    <!-- Session Complete -->
    <MathFluencySessionComplete
      v-if="sessionComplete"
      :session="session"
      :promotions-earned="promotionsEarned"
      :total-time="totalSessionTime"
      :distribution="distribution"
      @view-progress="viewProgress"
      @finish="finishSessionAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMathFluencyPractice } from '@/composables/useMathFluencyPractice'
import { useMathFluencyDiagnostic } from '@/composables/useMathFluencyDiagnostic'
import { useMathFluencyRounds } from '@/composables/useMathFluencyRounds'
import { getSessionQualityDisplay } from '@/utils/mathFluencyDisplayUtils'
import MathFluencyStartScreen from './mathFluency/rounds/MathFluencyStartScreen.vue'
import MathFluencyWarmupRound from './mathFluency/rounds/MathFluencyWarmupRound.vue'
import MathFluencyDiagnosticRound from './mathFluency/rounds/MathFluencyDiagnosticRound.vue'
import MathFluencyDiagnosticResults from './mathFluency/rounds/MathFluencyDiagnosticResults.vue'
import MathFluencyRound1Learning from './mathFluency/rounds/MathFluencyRound1Learning.vue'
import MathFluencyRound2Practice from './mathFluency/rounds/MathFluencyRound2Practice.vue'
import MathFluencyRound3Assessment from './mathFluency/rounds/MathFluencyRound3Assessment.vue'
import MathFluencySessionComplete from './mathFluency/rounds/MathFluencySessionComplete.vue'

const route = useRoute()

// Use composables
const practice = useMathFluencyPractice()
const diagnostic = useMathFluencyDiagnostic(practice.progress, practice.currentRound)
const rounds = useMathFluencyRounds(
  practice.round1Problems,
  practice.round2Problems,
  practice.round2Stack,
  practice.round3Problems,
  practice.currentRound,
  practice.currentOperation,
  practice.session,
  practice.sessionStartTime,
  practice.finishSession,
)

// Destructure for template
const {
  loading,
  completedToday,
  practiceStarted,
  sessionComplete,
  currentRound,
  progress,
  todaysSession,
  assignmentId,
  warmupNumbers,
  warmupCurrentIndex,
  warmupAnswer,
  warmupInput,
  round1Problems,
  round2Problems,
  round2Stack,
  round3Problems,
  sessionStartTime,
  totalSessionTime,
  promotionsEarned,
  session,
  currentOperation,
  distribution,
  proficiencyPercentage,
  practiceStreak,
  nextOperationName,
  loadProgress,
  preparePracticeSession,
  startPractice,
  finishSession,
  viewProgress,
  finishSessionAction,
} = practice

const {
  diagnosticProblems,
  diagnosticCurrentIndex,
  diagnosticAnswer,
  diagnosticResults,
  diagnosticInput,
  diagnosticTimeRemaining,
  diagnosticSubmitting,
  diagnosticShowingQuestion,
  currentDiagnosticProblem,
  diagnosticCorrect,
  diagnosticScore,
  diagnosticWrongProblems,
  timerColorClass,
  startDiagnosticRound,
  handleDiagnosticAnswer,
  handleDiagnosticComplete,
  continueCurrentLevel,
  getDiagnosticScoreClass,
  clearDiagnosticTimer,
} = diagnostic

const {
  round1Phase,
  round1CurrentIndex,
  round1Answer,
  round1RecallAttempt,
  round1LastCorrect,
  round1AttemptsLog,
  round1LearnedToday,
  round1Input,
  encodingTimeRemaining,
  consolidationTimeRemaining,
  recallTimeRemaining,
  feedbackTimeRemaining,
  round1TimerInterval,
  round2CurrentIndex,
  round2Answer,
  round2ShowingFeedback,
  round2LastCorrect,
  round2LastTime,
  round2Results,
  round2Correct,
  round2Total,
  round2Input,
  round2TimeRemaining,
  round2TimerInterval,
  round2StartTime,
  round3CurrentIndex,
  round3Answer,
  round3Results,
  round3Input,
  round3TimeRemaining,
  round3TimerInterval,
  round3StartTime,
  currentRound1Problem,
  currentRound2Problem,
  currentRound3Problem,
  round2Accuracy,
  round2MixInfo,
  startRound1,
  startEncodingPhase,
  proceedToRecall,
  startRecallPhase,
  submitRound1Answer,
  moveToNextRound1Problem,
  finishRound1,
  startRound2,
  showNextRound2Problem,
  submitRound2Answer,
  handleRound2Answer,
  finishRound2,
  startRound3,
  showNextRound3Problem,
  handleRound3Answer,
  submitRound3Answer,
  finishRound3,
  clearAllTimers,
  clearRound2Timer,
  clearRound3Timer,
} = rounds

// Computed for template
const sessionQualityDisplay = computed(() =>
  getSessionQualityDisplay(session.value.sessionQuality || 'good'),
)

// Event handlers
function handleWarmupComplete() {
  currentRound.value = 0.5
  startDiagnosticRound(
    () => startRound1(() => startRound2(() => startRound3())),
  )
}

function handleContinueCurrentLevel() {
  continueCurrentLevel(
    practice.round1Problems,
    () => startRound1(() => startRound2(() => startRound3())),
    () => startRound2(() => startRound3()),
  )
}

// Initialize
onMounted(async () => {
  assignmentId.value = (route.query.assignment as string) || null
  await loadProgress()
})

onUnmounted(() => {
  clearAllTimers()
  clearDiagnosticTimer()
})
</script>
<!-- Temporarily commented out due to CSS syntax errors - needs fixing -->
<!-- <style scoped src="./mathFluency/styles/dailyPracticeStyles.css"></style> -->
<style scoped>
/* Basic styles - full stylesheet needs CSS syntax fixes */
.daily-practice-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
