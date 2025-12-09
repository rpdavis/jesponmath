// Diagnostic round composable
// Handles diagnostic round logic, problem generation, and results

import { ref, shallowRef, computed, nextTick, watch, type Ref } from 'vue'
import type { ProblemProgress, MathFluencyProgress } from '@/types/mathFluency'
import { filterProblemsBySubLevel } from '@/utils/subLevelUtils'
import { sampleRandomUnique } from '@/utils/mathFluencyProblemGenerator'
import { deduplicateByProblemIdAndText } from '@/utils/mathFluencyProblemUtils'
import { getDiagnosticScoreClass } from '@/utils/mathFluencyDisplayUtils'

export function useMathFluencyDiagnostic(
  progress: Ref<MathFluencyProgress | null>,
  currentRound: Ref<number>,
) {
  // Diagnostic State
  const diagnosticProblems = ref<ProblemProgress[]>([])
  const diagnosticCurrentIndex = ref(0)
  const diagnosticAnswer = ref('')
  // Use shallowRef to avoid Vue's deep reactivity issues with object counting
  const diagnosticResults = shallowRef<{
    [problemId: string]: { correct: boolean; responseTime: number }
  }>({})

  // Snapshot of problems when diagnostic completes (to prevent reactive changes)
  const diagnosticProblemsSnapshot = ref<ProblemProgress[]>([])
  // Snapshot of results when diagnostic completes (to prevent reactive changes)
  const diagnosticResultsSnapshot = ref<{
    [problemId: string]: { correct: boolean; responseTime: number }
  }>({})
  const diagnosticInput = ref<HTMLInputElement | null>(null)
  const diagnosticTimeRemaining = ref(10)
  const diagnosticTimerInterval = ref<number | null>(null)
  const diagnosticStartTime = ref(0)
  const diagnosticSubmitting = ref(false)
  const diagnosticShowingQuestion = ref(true)

  // Computed
  const currentDiagnosticProblem = computed(
    () => diagnosticProblems.value[diagnosticCurrentIndex.value],
  )
  const diagnosticCorrect = computed(() => {
    // Use snapshot results if available (after diagnostic completes), otherwise current results
    const results =
      Object.keys(diagnosticResultsSnapshot.value).length > 0
        ? diagnosticResultsSnapshot.value
        : diagnosticResults.value

    // SIMPLE FIX: Just count ALL results that are correct
    // Don't try to match problem IDs - just count correct answers
    const allResults = Object.values(results)
    const correctCount = allResults.filter((r) => r.correct === true).length

    return correctCount
  })
  const diagnosticScore = computed(() => {
    // Use snapshot if available (after completion), otherwise use current problems
    const problems =
      diagnosticProblemsSnapshot.value.length > 0
        ? diagnosticProblemsSnapshot.value
        : diagnosticProblems.value
    const total = problems.length
    if (total === 0) return 0
    const correct = diagnosticCorrect.value
    const score = Math.round((correct / total) * 100)

    // Debug logging (only when results screen is showing)
    if (currentRound.value === 0.75) {
      console.log(`🔍 [DIAGNOSTIC] Computed score:`, {
        correct,
        total,
        score: `${score}%`,
        usingProblemsSnapshot: diagnosticProblemsSnapshot.value.length > 0,
        usingResultsSnapshot: Object.keys(diagnosticResultsSnapshot.value).length > 0,
      })
    }

    return score
  })
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

  // Watch for changes to diagnosticProblems (should not change after diagnostic starts)
  watch(
    () => diagnosticProblems.value.length,
    (newLength, oldLength) => {
      if (currentRound.value === 0.5 || currentRound.value === 0.75) {
        console.warn(`⚠️ [DIAGNOSTIC] diagnosticProblems.length changed:`, {
          oldLength,
          newLength,
          currentRound: currentRound.value,
          problemIds: diagnosticProblems.value.map((p) => p.problemId),
        })
      }
    },
  )

  // Watch for changes to diagnosticResults
  watch(
    () => Object.keys(diagnosticResults.value).length,
    (newLength, oldLength) => {
      if (currentRound.value === 0.75 && newLength !== oldLength) {
        console.warn(`⚠️ [DIAGNOSTIC] diagnosticResults changed:`, {
          oldLength,
          newLength,
          resultIds: Object.keys(diagnosticResults.value),
        })
      }
    },
  )

  // Methods
  function generateDiagnosticProblems(): ProblemProgress[] {
    if (!progress.value?.currentSubLevel) return []

    const allProblemsRaw = [
      ...progress.value.problemBanks.doesNotKnow,
      ...progress.value.problemBanks.emerging,
      ...progress.value.problemBanks.approaching,
      ...progress.value.problemBanks.proficient,
      ...progress.value.problemBanks.mastered,
    ]

    const allProblems = deduplicateByProblemIdAndText(allProblemsRaw)

    if (allProblemsRaw.length !== allProblems.length) {
      console.warn(`⚠️ Removed ${allProblemsRaw.length - allProblems.length} duplicates`)
    }

    const subLevelProblems = filterProblemsBySubLevel(allProblems, progress.value.currentSubLevel)
    const sampled = sampleRandomUnique(
      subLevelProblems,
      Math.min(20, subLevelProblems.length),
    ) as ProblemProgress[]

    console.log(`🎯 Diagnostic: ${sampled.length} problems`)

    return sampled
  }

  async function startDiagnosticRound(startRound1: () => void) {
    diagnosticProblems.value = generateDiagnosticProblems()

    // Create snapshot IMMEDIATELY when diagnostic starts to prevent reactive changes
    diagnosticProblemsSnapshot.value = [...diagnosticProblems.value]

    console.log(
      `🔍 [DIAGNOSTIC] Started with ${diagnosticProblemsSnapshot.value.length} problems (snapshot created)`,
    )

    if (diagnosticProblems.value.length === 0) {
      console.warn('⚠️ No diagnostic problems - skipping to Round 1')
      diagnosticProblemsSnapshot.value = []
      currentRound.value = 1
      startRound1()
      return
    }

    diagnosticCurrentIndex.value = 0
    diagnosticAnswer.value = ''
    diagnosticResults.value = {}
    diagnosticResultsSnapshot.value = {}
    diagnosticTimeRemaining.value = 10

    // NOTE: Don't start composable timer here - the MathFluencyDiagnosticRound component
    // has its own timer and handles submission via the @answer event
  }

  async function startDiagnosticTimer() {
    diagnosticTimeRemaining.value = 10
    diagnosticStartTime.value = Date.now()

    if (diagnosticTimerInterval.value) {
      clearInterval(diagnosticTimerInterval.value)
    }

    await nextTick()

    diagnosticTimerInterval.value = setInterval(() => {
      diagnosticTimeRemaining.value--
      if (diagnosticTimeRemaining.value <= 0) {
        submitDiagnosticAnswer(true)
      }
    }, 1000) as unknown as number
  }

  function submitDiagnosticAnswer(timeout: boolean = false) {
    if (!currentDiagnosticProblem.value || diagnosticSubmitting.value) return

    diagnosticSubmitting.value = true
    diagnosticShowingQuestion.value = false

    if (diagnosticTimerInterval.value) {
      clearInterval(diagnosticTimerInterval.value)
      diagnosticTimerInterval.value = null
    }

    const responseTime = Date.now() - diagnosticStartTime.value
    const userAnswer = timeout ? '' : String(diagnosticAnswer.value || '').trim()
    const correct = userAnswer === currentDiagnosticProblem.value.correctAnswer

    // With shallowRef we must create a new object
    diagnosticResults.value = {
      ...diagnosticResults.value,
      [currentDiagnosticProblem.value.problemId]: {
        correct,
        responseTime,
      },
    }

    diagnosticCurrentIndex.value++
    diagnosticAnswer.value = ''

    setTimeout(() => {
      diagnosticSubmitting.value = false

      if (diagnosticCurrentIndex.value >= diagnosticProblems.value.length) {
        currentRound.value = 0.75
        diagnosticShowingQuestion.value = true
        console.log('📊 Diagnostic complete - showing results, waiting for click')
      } else {
        diagnosticShowingQuestion.value = true
        nextTick().then(() => {
          startDiagnosticTimer()
          diagnosticInput.value?.focus()
        })
      }
    }, 600)
  }

  function handleDiagnosticAnswer(
    problemId: string,
    answer: string,
    responseTime: number,
    isCorrect: boolean,
  ) {
    const problem = diagnosticProblems.value.find((p) => p.problemId === problemId)

    // Store the result - with shallowRef we must create a new object
    const correctValue = isCorrect === true
    diagnosticResults.value = {
      ...diagnosticResults.value,
      [problemId]: {
        correct: correctValue,
        responseTime,
      },
    }

    // Log the current count
    const currentCorrectCount = Object.values(diagnosticResults.value).filter(
      (r) => r.correct === true,
    ).length
    const totalAnswered = Object.keys(diagnosticResults.value).length
    console.log(
      `💾 ${problem?.displayText} = ${answer} ${correctValue ? '✓' : '✗'} (${currentCorrectCount}/${totalAnswered})`,
    )
  }

  function handleDiagnosticComplete() {
    // Snapshot the results (deep copy to avoid reactive issues)
    diagnosticResultsSnapshot.value = JSON.parse(JSON.stringify(diagnosticResults.value))

    // Count correct results
    const correctCount = Object.values(diagnosticResultsSnapshot.value).filter(
      (r) => r.correct === true,
    ).length
    const totalProblems = Object.keys(diagnosticResultsSnapshot.value).length

    console.log(
      `📊 [DIAGNOSTIC] Complete: ${correctCount}/${totalProblems} correct (${Math.round((correctCount / totalProblems) * 100)}%)`,
    )

    currentRound.value = 0.75
    diagnosticShowingQuestion.value = true
  }

  function continueCurrentLevel(
    round1Problems: Ref<ProblemProgress[]>,
    startRound1: () => void,
    startRound2: () => void,
  ) {
    round1Problems.value = [...diagnosticWrongProblems.value]

    console.log(`📚 Round 1: Learning ${round1Problems.value.length} facts from diagnostic`)

    if (round1Problems.value.length === 0) {
      currentRound.value = 2
      startRound2()
    } else {
      currentRound.value = 1
      startRound1()
    }
  }

  function clearDiagnosticTimer() {
    if (diagnosticTimerInterval.value) {
      clearInterval(diagnosticTimerInterval.value)
      diagnosticTimerInterval.value = null
    }
  }

  // Computed: Get diagnostic total (always use snapshot)
  const diagnosticTotal = computed(() => {
    return diagnosticProblemsSnapshot.value.length > 0
      ? diagnosticProblemsSnapshot.value.length
      : diagnosticProblems.value.length
  })

  return {
    // State
    diagnosticProblems,
    diagnosticCurrentIndex,
    diagnosticAnswer,
    diagnosticResults,
    diagnosticInput,
    diagnosticTimeRemaining,
    diagnosticTimerInterval,
    diagnosticStartTime,
    diagnosticSubmitting,
    diagnosticShowingQuestion,

    // Computed
    currentDiagnosticProblem,
    diagnosticCorrect,
    diagnosticScore,
    diagnosticTotal,
    diagnosticWrongProblems,
    timerColorClass,

    // Methods
    generateDiagnosticProblems,
    startDiagnosticRound,
    startDiagnosticTimer,
    submitDiagnosticAnswer,
    handleDiagnosticAnswer,
    handleDiagnosticComplete,
    continueCurrentLevel,
    getDiagnosticScoreClass,
    clearDiagnosticTimer,
  }
}
