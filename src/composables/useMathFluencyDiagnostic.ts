// Diagnostic round composable
// Handles diagnostic round logic, problem generation, and results

import { ref, computed, nextTick, type Ref } from 'vue'
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
  const diagnosticResults = ref<{ [problemId: string]: { correct: boolean; responseTime: number } }>(
    {},
  )
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
    const sampled = sampleRandomUnique(subLevelProblems, Math.min(20, subLevelProblems.length)) as ProblemProgress[]

    console.log(`🎯 Diagnostic: ${sampled.length} problems`)

    return sampled
  }

  async function startDiagnosticRound(startRound1: () => void) {
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

    startDiagnosticTimer()

    await nextTick()
    diagnosticInput.value?.focus()
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

    diagnosticResults.value[currentDiagnosticProblem.value.problemId] = {
      correct,
      responseTime,
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
        nextTick(() => {
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
    diagnosticResults.value[problemId] = {
      correct: isCorrect,
      responseTime,
    }
  }

  function handleDiagnosticComplete() {
    currentRound.value = 0.75
    diagnosticShowingQuestion.value = true
    console.log('📊 Diagnostic complete - showing results, waiting for click')
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

