// Diagnostic round composable
// Handles diagnostic round logic, problem generation, and results

import { ref, computed, nextTick, watch, type Ref } from 'vue'
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
  const diagnosticResults = ref<{
    [problemId: string]: { correct: boolean; responseTime: number }
  }>({})

  // Snapshot of problems when diagnostic completes (to prevent reactive changes)
  const diagnosticProblemsSnapshot = ref<ProblemProgress[]>([])
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
    // ALWAYS use snapshot if available (created when diagnostic starts)
    // This prevents reactive changes from affecting the count
    const problems =
      diagnosticProblemsSnapshot.value.length > 0
        ? diagnosticProblemsSnapshot.value
        : diagnosticProblems.value
    const results = diagnosticResults.value

    const correct = problems.filter((p) => {
      const result = results[p.problemId]
      return result && result.correct === true
    }).length

    // Debug logging (only when results screen is showing or during diagnostic)
    if (currentRound.value === 0.5 || currentRound.value === 0.75) {
      const problemResults = problems.map((p) => {
        const result = results[p.problemId]
        return {
          problemId: p.problemId,
          hasResult: result !== undefined,
          correct: result?.correct,
          correctType: typeof result?.correct,
          isCorrectStrict: result?.correct === true,
        }
      })

      const incorrectResults = problemResults.filter((pr) => !pr.isCorrectStrict)

      console.log(`🔍 [DIAGNOSTIC] Computed correct count:`, {
        correct,
        total: problems.length,
        usingSnapshot: diagnosticProblemsSnapshot.value.length > 0,
        currentRound: currentRound.value,
        resultsCount: Object.keys(results).length,
        problemsWithResults: problemResults.filter((pr) => pr.hasResult).length,
        problemResults: problemResults,
        incorrectResults: incorrectResults,
        allResultsRaw: Object.entries(results).map(([id, r]) => ({
          id,
          correct: r.correct,
          correctType: typeof r.correct,
        })),
      })
    }

    return correct
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
        usingSnapshot: diagnosticProblemsSnapshot.value.length > 0,
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

    console.log(`🔍 [DIAGNOSTIC] Answer received:`, {
      problemId,
      answer,
      correctAnswer: problem?.correctAnswer,
      isCorrect,
      isCorrectType: typeof isCorrect,
      responseTime: `${(responseTime / 1000).toFixed(1)}s`,
      problemExists: !!problem,
    })

    // Check if this problemId already has a result (shouldn't happen, but check for overwrites)
    const existingResult = diagnosticResults.value[problemId]
    if (existingResult) {
      console.warn(`⚠️ [DIAGNOSTIC] Overwriting existing result for ${problemId}:`, {
        old: existingResult,
        new: { correct: isCorrect, responseTime },
      })
    }

    diagnosticResults.value[problemId] = {
      correct: isCorrect,
      responseTime,
    }

    // Verify the stored value
    const storedResult = diagnosticResults.value[problemId]
    if (storedResult.correct !== isCorrect) {
      console.error(`❌ [DIAGNOSTIC] Stored value mismatch!`, {
        expected: isCorrect,
        stored: storedResult.correct,
        problemId,
      })
    }

    const allResults = Object.entries(diagnosticResults.value).map(([id, r]) => ({
      id,
      correct: r.correct,
      correctType: typeof r.correct,
      correctValue: r.correct,
      correctStrict: r.correct === true,
      responseTime: r.responseTime,
      hasProblem: diagnosticProblems.value.some((p) => p.problemId === id),
    }))
    const correctResults = allResults.filter((r) => r.correctStrict && r.hasProblem)
    const incorrectResults = allResults.filter((r) => !r.correctStrict && r.hasProblem)

    console.log(`📊 [DIAGNOSTIC] Results after answer:`, {
      totalProblems: diagnosticProblems.value.length,
      resultsCount: Object.keys(diagnosticResults.value).length,
      correctCount: Object.values(diagnosticResults.value).filter((r) => r.correct).length,
      correctCountStrict: correctResults.length,
      allResults: allResults,
      correctResults: correctResults,
      incorrectResults: incorrectResults,
      problemIdsInResults: Object.keys(diagnosticResults.value),
      problemIdsInProblems: diagnosticProblems.value.map((p) => p.problemId),
    })
  }

  function handleDiagnosticComplete() {
    console.log(`🔍 [DIAGNOSTIC] Complete handler called`)

    // Snapshot should already exist (created when diagnostic started)
    // But ensure it's set if somehow it wasn't
    if (diagnosticProblemsSnapshot.value.length === 0) {
      console.warn(`⚠️ [DIAGNOSTIC] Snapshot was empty, creating now`)
      diagnosticProblemsSnapshot.value = [...diagnosticProblems.value]
    }

    const problemsSnapshot = diagnosticProblemsSnapshot.value
    const problemIdsSnapshot = problemsSnapshot.map((p) => p.problemId)

    console.log(`📋 [DIAGNOSTIC] Problems list:`, {
      total: problemsSnapshot.length,
      problemIds: problemIdsSnapshot,
      snapshotExists: diagnosticProblemsSnapshot.value.length > 0,
      snapshotLength: diagnosticProblemsSnapshot.value.length,
    })

    const allResults = Object.entries(diagnosticResults.value).map(([id, r]) => ({
      id,
      correct: r.correct,
      correctType: typeof r.correct,
      responseTime: r.responseTime,
    }))

    console.log(`📊 [DIAGNOSTIC] Results before fill:`, {
      resultsCount: Object.keys(diagnosticResults.value).length,
      resultIds: Object.keys(diagnosticResults.value),
      correctCount: Object.values(diagnosticResults.value).filter((r) => r.correct).length,
      allResults: allResults,
      correctResults: allResults.filter((r) => r.correct),
    })

    // Ensure all problems have results (fill in any missing with incorrect/timeout)
    const missingProblems: string[] = []
    problemsSnapshot.forEach((problem) => {
      if (!diagnosticResults.value[problem.problemId]) {
        missingProblems.push(problem.problemId)
        diagnosticResults.value[problem.problemId] = {
          correct: false,
          responseTime: 10 * 1000, // Default 10 seconds timeout
        }
      }
    })

    if (missingProblems.length > 0) {
      console.warn(
        `⚠️ [DIAGNOSTIC] Filled ${missingProblems.length} missing results:`,
        missingProblems,
      )
    }

    // Calculate final counts using snapshot
    const finalResults = Object.entries(diagnosticResults.value).map(([id, r]) => ({
      id,
      correct: r.correct,
      correctType: typeof r.correct,
      responseTime: r.responseTime,
      hasProblem: problemIdsSnapshot.includes(id),
    }))

    const correctCountFinal = finalResults.filter((r) => r.correct === true && r.hasProblem).length
    const scoreFinal =
      problemsSnapshot.length > 0
        ? Math.round((correctCountFinal / problemsSnapshot.length) * 100)
        : 0

    console.log(`📊 [DIAGNOSTIC] Results after fill:`, {
      resultsCount: Object.keys(diagnosticResults.value).length,
      correctCount: Object.values(diagnosticResults.value).filter((r) => r.correct).length,
      correctCountFinal,
      totalProblems: problemsSnapshot.length,
      scoreFinal,
      scoreComputed: diagnosticScore.value,
      correctComputed: diagnosticCorrect.value,
      finalResults: finalResults,
      correctResults: finalResults.filter((r) => r.correct && r.hasProblem),
      problemsNotInResults: problemsSnapshot
        .filter((p) => !diagnosticResults.value[p.problemId])
        .map((p) => p.problemId),
    })

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
