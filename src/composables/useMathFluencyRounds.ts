// Rounds composable
// Handles Round 1 (Learning), Round 2 (Practice), and Round 3 (Assessment) logic

import { ref, computed, nextTick, type Ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { updateProblemInProgress } from '@/services/mathFluencyServices'
import type {
  ProblemProgress,
  OperationType,
  MathFluencyPracticeSession,
} from '@/types/mathFluency'

export function useMathFluencyRounds(
  round1Problems: Ref<ProblemProgress[]>,
  round2Problems: Ref<ProblemProgress[]>,
  round2Stack: Ref<ProblemProgress[]>,
  round3Problems: Ref<ProblemProgress[]>,
  currentRound: Ref<number>,
  currentOperation: Ref<OperationType>,
  session: Ref<Partial<MathFluencyPracticeSession>>,
  sessionStartTime: Ref<number>,
  finishSession: () => Promise<void>,
) {
  const authStore = useAuthStore()

  // Round 1: Learning State
  const round1Phase = ref<'encoding' | 'consolidation' | 'recall' | 'feedback'>('encoding')
  const round1CurrentIndex = ref(0)
  const round1Answer = ref('')
  const round1RecallAttempt = ref(0)
  const round1LastCorrect = ref(false)
  const round1AttemptsLog = ref<{ [problemId: string]: any }>({})
  const round1LearnedToday = ref<string[]>([])
  const round1Input = ref<HTMLInputElement | null>(null)

  // Round 1 Timers
  const encodingTimeRemaining = ref(5)
  const consolidationTimeRemaining = ref(5)
  const recallTimeRemaining = ref(15)
  const feedbackTimeRemaining = ref(10)
  const round1TimerInterval = ref<number | null>(null)
  const startRound2Callback = ref<(() => void) | null>(null)

  // Round 2: Practice State
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
  const finishRound2Callback = ref<(() => void) | null>(null)

  // Round 3: Assessment State
  const round3CurrentIndex = ref(0)
  const round3Answer = ref('')
  const round3Results = ref<{ [problemId: string]: any }>({})
  const round3Input = ref<HTMLInputElement | null>(null)
  const round3TimeRemaining = ref(10)
  const round3TimerInterval = ref<number | null>(null)
  const round3StartTime = ref(0)

  // Computed
  const currentRound1Problem = computed(
    () => round1Problems.value[round1CurrentIndex.value] || null,
  )

  const currentRound2Problem = computed(() => {
    if (round2Stack.value.length === 0) return null
    return round2Stack.value[0]
  })

  const currentRound3Problem = computed(
    () => round3Problems.value[round3CurrentIndex.value] || null,
  )

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

  // Round 1 Methods
  function startRound1(startRound2: () => void) {
    if (round1Problems.value.length === 0) {
      startRound2()
      return
    }

    startRound2Callback.value = startRound2
    currentRound.value = 1
    round1Phase.value = 'encoding'
    round1CurrentIndex.value = 0

    if (session.value.round1_learning && currentRound1Problem.value) {
      session.value.round1_learning.problemsTargeted.push(currentRound1Problem.value.problemId)
    }

    startEncodingPhase()
  }

  function startEncodingPhase() {
    round1Phase.value = 'encoding'
    clearAllTimers()
  }

  function proceedToRecall() {
    round1Answer.value = ''
    round1Phase.value = 'consolidation'
    consolidationTimeRemaining.value = 5

    clearAllTimers()
    round1TimerInterval.value = window.setInterval(() => {
      consolidationTimeRemaining.value--
      if (consolidationTimeRemaining.value <= 0) {
        startRecallPhase()
      }
    }, 1000) as unknown as number
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
        submitRound1Answer()
      }
    }, 1000) as unknown as number

    await nextTick()
    round1Input.value?.focus()
  }

  async function submitRound1Answer() {
    if (!currentRound1Problem.value) return

    clearAllTimers()

    const responseTime = (15 - recallTimeRemaining.value) * 1000
    const isCorrect =
      String(round1Answer.value || '').trim() === currentRound1Problem.value.correctAnswer

    round1LastCorrect.value = isCorrect

    const problemId = currentRound1Problem.value.problemId
    if (!round1AttemptsLog.value[problemId]) {
      round1AttemptsLog.value[problemId] = {
        encodingCycles: 1,
        recallAttempts: 1,
        timesSpent: [],
      }
    }

    round1AttemptsLog.value[problemId].timesSpent.push(responseTime)

    if (isCorrect) {
      await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
        correct: true,
        responseTime,
        source: 'digital-practice',
      })

      if (session.value.round1_learning) {
        session.value.round1_learning.newlyLearned.push(problemId)
        session.value.round1_learning.problemsCompleted.push(problemId)
      }
    }

    // Start feedback phase with timer
    round1Phase.value = 'feedback'
    feedbackTimeRemaining.value = 3 // 3 seconds for feedback

    // Capture isCorrect for use in timer callback
    const wasCorrect = isCorrect

    clearAllTimers()
    round1TimerInterval.value = window.setInterval(() => {
      feedbackTimeRemaining.value--
      if (feedbackTimeRemaining.value <= 0) {
        clearAllTimers()
        if (wasCorrect) {
          // Correct answer - move to next problem
          if (startRound2Callback.value) {
            moveToNextRound1Problem(startRound2Callback.value)
          }
        } else {
          // Incorrect answer - show the problem again (go back to encoding phase)
          round1RecallAttempt.value = 0
          startEncodingPhase()
        }
      }
    }, 1000) as unknown as number
  }

  function moveToNextRound1Problem(startRound2: () => void) {
    round1CurrentIndex.value++

    if (round1CurrentIndex.value >= round1Problems.value.length) {
      finishRound1(startRound2)
    } else {
      round1RecallAttempt.value = 0
      if (session.value.round1_learning && currentRound1Problem.value) {
        session.value.round1_learning.problemsTargeted.push(currentRound1Problem.value.problemId)
      }
      startEncodingPhase()
    }
  }

  function finishRound1(startRound2: () => void) {
    if (session.value.round1_learning) {
      session.value.round1_learning.attemptsPerProblem = round1AttemptsLog.value
      session.value.round1_learning.timeSpent = Math.round(
        (Date.now() - sessionStartTime.value) / 1000,
      )
      session.value.round1_learning.completed = true
    }

    startRound2()
  }

  // Round 2 Methods
  function startRound2(startRound3: () => void) {
    currentRound.value = 2
    round2CurrentIndex.value = 0
    round2Stack.value = [...round2Problems.value]
    round2Correct.value = 0
    round2Total.value = 0
    round2Results.value = {}
    finishRound2Callback.value = () => finishRound2(startRound3)

    if (session.value.round2_practice) {
      session.value.round2_practice.problemsPresented = round2Problems.value.map((p) => p.problemId)
    }

    if (round2Stack.value.length === 0) {
      startRound3()
      return
    }

    showNextRound2Problem(finishRound2Callback.value)
  }

  async function showNextRound2Problem(finishRound2: () => void) {
    if (round2Stack.value.length === 0) {
      finishRound2()
      return
    }

    round2Answer.value = ''
    round2ShowingFeedback.value = false
    round2StartTime.value = Date.now()
    round2TimeRemaining.value = 15

    clearRound2Timer()
    // NOTE: Timer removed - component handles timing now

    await nextTick()
    round2Input.value?.focus()
  }

  async function submitRound2Answer(finishRound2: () => void) {
    if (!currentRound2Problem.value) return

    // NOTE: Timer clearing removed - component handles timing now

    const responseTime = Date.now() - round2StartTime.value
    const isCorrect =
      String(round2Answer.value || '').trim() === currentRound2Problem.value.correctAnswer

    round2LastCorrect.value = isCorrect
    round2LastTime.value = responseTime
    round2Total.value++

    if (isCorrect) {
      round2Correct.value++
    }

    const problemId = currentRound2Problem.value.problemId

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

    await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
      correct: isCorrect,
      responseTime,
      source: 'digital-practice',
    })

    round2ShowingFeedback.value = true

    const current = round2Stack.value.shift()

    if (!isCorrect && current) {
      round2Stack.value.push(current)
      round2Results.value[problemId].returnedToStack = true
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))
    showNextRound2Problem(finishRound2)
  }

  async function handleRound2Answer(
    problemId: string,
    answer: string,
    responseTime: number,
    isCorrect: boolean,
  ) {
    // ✅ PRIMARY HANDLER: Component emits correct isCorrect value from user input
    await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
      correct: isCorrect,
      responseTime,
      source: 'digital-practice',
    })

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

  function finishRound2(startRound3: () => void) {
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

  // Round 3 Methods
  async function startRound3() {
    currentRound.value = 3
    round3CurrentIndex.value = 0
    round3Results.value = {}

    if (session.value.round3_assessment) {
      session.value.round3_assessment.problemsAssessed = round3Problems.value.map(
        (p) => p.problemId,
      )
    }

    if (round3Problems.value.length === 0) {
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

  async function handleRound3Answer(problemId: string, answer: string, responseTime: number) {
    const problem = round3Problems.value.find((p) => p.problemId === problemId)
    if (!problem) return

    const isCorrect = String(answer || '').trim() === problem.correctAnswer
    const previousLevel = problem.proficiencyLevel

    round3Results.value[problemId] = {
      correct: isCorrect,
      responseTime,
      previousLevel,
      maintainedLevel: true,
    }

    await updateProblemInProgress(authStore.currentUser!.uid, currentOperation.value, problemId, {
      correct: isCorrect,
      responseTime,
      source: 'digital-assessment',
    })
  }

  function submitRound3Answer() {
    // Get current problem before incrementing
    const currentProblem = round3Problems.value[round3CurrentIndex.value]

    // If there's a current problem but no result yet, record it as incorrect (timeout)
    if (currentProblem && !round3Results.value[currentProblem.problemId]) {
      const responseTime = 10 * 1000 // Default 10 seconds timeout
      round3Results.value[currentProblem.problemId] = {
        correct: false,
        responseTime,
        previousLevel: currentProblem.proficiencyLevel,
        maintainedLevel: false,
      }
    }

    round3CurrentIndex.value++

    if (round3CurrentIndex.value >= round3Problems.value.length) {
      finishRound3()
      return
    }

    showNextRound3Problem()
  }

  function finishRound3() {
    if (session.value.round3_assessment) {
      // Ensure all problems have results (fill in any missing with incorrect/timeout)
      round3Problems.value.forEach((problem) => {
        if (!round3Results.value[problem.problemId]) {
          round3Results.value[problem.problemId] = {
            correct: false,
            responseTime: 10 * 1000, // Default 10 seconds timeout
            previousLevel: problem.proficiencyLevel,
            maintainedLevel: false,
          }
        }
      })

      session.value.round3_assessment.results = round3Results.value
      const correct = Object.values(round3Results.value).filter((r) => r.correct).length
      const total = round3Problems.value.length
      session.value.round3_assessment.accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
      const times = Object.values(round3Results.value).map((r) => r.responseTime)
      session.value.round3_assessment.averageResponseTime =
        times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : 0
      session.value.round3_assessment.timeSpent =
        Math.round((Date.now() - sessionStartTime.value) / 1000) -
        ((session.value.round1_learning?.timeSpent || 0) +
          (session.value.round2_practice?.timeSpent || 0))
      session.value.round3_assessment.completed = true
    }

    finishSession()
  }

  // Timer management
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

  return {
    // Round 1 State
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

    // Round 2 State
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

    // Round 3 State
    round3CurrentIndex,
    round3Answer,
    round3Results,
    round3Input,
    round3TimeRemaining,
    round3TimerInterval,
    round3StartTime,

    // Computed
    currentRound1Problem,
    currentRound2Problem,
    currentRound3Problem,
    round2Accuracy,
    round2MixInfo,

    // Round 1 Methods
    startRound1,
    startEncodingPhase,
    proceedToRecall,
    startRecallPhase,
    submitRound1Answer,
    moveToNextRound1Problem,
    finishRound1,

    // Round 2 Methods
    startRound2,
    showNextRound2Problem,
    submitRound2Answer,
    handleRound2Answer,
    finishRound2,

    // Round 3 Methods
    startRound3,
    showNextRound3Problem,
    handleRound3Answer,
    submitRound3Answer,
    finishRound3,

    // Timer Methods
    clearAllTimers,
    clearRound2Timer,
    clearRound3Timer,
  }
}
