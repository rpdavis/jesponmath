// Main practice session composable
// Handles state management, session preparation, and round transitions

import { ref, computed, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  getFluencyProgress,
  getAllFluencyProgress,
  getTodaysPracticeSession,
  createPracticeSession,
  updateProgressAfterSession,
} from '@/services/mathFluencyServices'
import { sampleRandom, shuffleArray } from '@/utils/mathFluencyProblemGenerator'
import { getNextOperation } from '@/types/mathFluency'
import { getSubLevelConfig, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import { filterProblemsBySubLevel, selectDailyPracticeProblems } from '@/utils/subLevelUtils'
import { selectChallengeProblems } from '@/utils/challengeProblemSelector'
import {
  generateProblemsForSubLevel,
  problemBelongsToSubLevel,
  createProblemProgress,
} from '@/utils/mathFluencyProblemUtils'
import { capitalizeOperation } from '@/utils/mathFluencyDisplayUtils'
import type {
  MathFluencyProgress,
  ProblemProgress,
  OperationType,
  SubLevel,
  MathFluencyPracticeSession,
} from '@/types/mathFluency'
import { Timestamp } from 'firebase/firestore'
import { markFluencyAssignmentComplete } from '@/services/mathFluencyAssignmentServices'

export function useMathFluencyPractice() {
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

  // Problem sets
  const round1Problems = ref<ProblemProgress[]>([])
  const round2Problems = ref<ProblemProgress[]>([])
  const round2Stack = ref<ProblemProgress[]>([])
  const round3Problems = ref<ProblemProgress[]>([])

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
      averageResponseTime: 0,
      timeSpent: 0,
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

  // Methods
  async function loadProgress() {
    if (!authStore.currentUser) return

    loading.value = true

    try {
      const operation: OperationType = 'addition'

      progress.value = await getFluencyProgress(authStore.currentUser.uid, operation)

      if (!progress.value) {
        alert('You need to complete the initial diagnostic first. Please see your teacher.')
        router.push('/dashboard')
        return
      }

      const today = await getTodaysPracticeSession(authStore.currentUser.uid, operation)

      if (today && today.completed) {
        completedToday.value = true
        todaysSession.value = today
      } else {
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

    let allProblems = [
      ...banks.doesNotKnow,
      ...banks.emerging,
      ...banks.approaching,
      ...banks.proficient,
      ...banks.mastered,
    ]

    // ADAPTIVE LOGIC: Check ALL sub-levels up to current and fill gaps
    if (progress.value.currentSubLevel) {
      const currentConfig = getSubLevelConfig(progress.value.currentSubLevel)
      if (currentConfig) {
        const allOperationLevels = getSubLevelsForOperation(currentConfig.operation)
          .filter((sl) => sl.order <= currentConfig.order)
          .sort((a, b) => a.order - b.order)

        console.log(`🔍 Checking ${allOperationLevels.length} sub-levels for gaps...`)

        for (const levelConfig of allOperationLevels) {
          const levelProblems = allProblems.filter((p) =>
            problemBelongsToSubLevel(p, levelConfig.id),
          )
          const expectedCount = levelConfig.totalProblems

          if (levelProblems.length < expectedCount) {
            console.log(
              `⚠️ Gap detected in ${levelConfig.name}: ${levelProblems.length}/${expectedCount} problems`,
            )

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

      const currentSubLevelProblems = filterProblemsBySubLevel(
        allProblems,
        progress.value.currentSubLevel,
      )
      const doesNotKnowInLevel = currentSubLevelProblems.filter(
        (p) => p.proficiencyLevel === 'doesNotKnow',
      )
      round1Problems.value = sampleRandom(
        doesNotKnowInLevel,
        Math.min(3, doesNotKnowInLevel.length),
      )

      const round2Pool = [...selection.currentLevelProblems, ...selection.maintenanceProblems]

      // ADD CHALLENGE PROBLEMS
      try {
        const allProgress = await getAllFluencyProgress(authStore.currentUser!.uid)
        const challengeProblems = selectChallengeProblems(
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

      const emergingInLevel = currentSubLevelProblems.filter(
        (p) => p.proficiencyLevel === 'emerging' || p.proficiencyLevel === 'approaching',
      )
      const proficientInLevel = currentSubLevelProblems.filter(
        (p) => p.proficiencyLevel === 'proficient',
      )
      const masteredInLevel = currentSubLevelProblems.filter(
        (p) => p.proficiencyLevel === 'mastered',
      )

      round3Problems.value = shuffleArray([
        ...sampleRandom(emergingInLevel, Math.min(5, emergingInLevel.length)),
        ...sampleRandom(proficientInLevel, Math.min(3, proficientInLevel.length)),
        ...sampleRandom(masteredInLevel, Math.min(2, masteredInLevel.length)),
      ])

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

      round2Stack.value = [...round2Problems.value]

      round3Problems.value = shuffleArray([
        ...sampleRandom(banks.emerging, 5),
        ...sampleRandom(banks.proficient, 3),
        ...sampleRandom(banks.mastered, 2),
      ])
    }

    // Mix composition
    if (session.value.round2_practice) {
      session.value.round2_practice.mixComposition = {
        emerging: round2Problems.value.filter(
          (p) => p.proficiencyLevel === 'emerging' || p.proficiencyLevel === 'approaching',
        ).length,
        proficient: round2Problems.value.filter((p) => p.proficiencyLevel === 'proficient').length,
        mastered: round2Problems.value.filter((p) => p.proficiencyLevel === 'mastered').length,
      }
    }
  }

  function startPractice() {
    practiceStarted.value = true
    sessionStartTime.value = Date.now()
    currentRound.value = 0

    const availableNumbers = Array.from({ length: 20 }, (_, i) => i + 1)
    const shuffled = availableNumbers.sort(() => Math.random() - 0.5)
    warmupNumbers.value = shuffled.slice(0, 3)
    warmupCurrentIndex.value = 0
    warmupAnswer.value = ''

    console.log('🔢 Warmup numbers:', warmupNumbers.value)
  }

  async function finishSession() {
    totalSessionTime.value = Date.now() - sessionStartTime.value

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

    await loadProgressSilently()

    promotionsEarned.value = []

    try {
      await createPracticeSession({
        studentUid: authStore.currentUser!.uid,
        studentName: authStore.currentUser?.displayName || 'Student',
        operation: currentOperation.value,
        sessionDate: Timestamp.now(),
        dayOfWeek: new Date().getDay(),
        weekNumber: 1,
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

      // ⭐ CRITICAL: Update progress document after session
      try {
        // Collect all problems from all rounds
        const allProblems: ProblemProgress[] = [
          ...round1Problems.value,
          ...round2Problems.value,
          ...round3Problems.value,
        ]

        // Extract results from session
        // Diagnostic results should be stored in session when diagnostic completes
        const diagnosticResults = session.value.diagnosticResults || {}
        const round2Results = session.value.round2_practice?.results || {}
        const round3Results = session.value.round3_assessment?.results || {}

        // Convert round2/round3 results to the format expected by updateProgressAfterSession
        const formattedRound2Results: {
          [problemId: string]: { correct: boolean; responseTime: number }
        } = {}
        const formattedRound3Results: {
          [problemId: string]: { correct: boolean; responseTime: number }
        } = {}

        // Format round 2 results (use last response time)
        Object.entries(round2Results).forEach(([problemId, result]: [string, any]) => {
          const lastTime =
            result.responseTimes && result.responseTimes.length > 0
              ? result.responseTimes[result.responseTimes.length - 1]
              : 0
          formattedRound2Results[problemId] = {
            correct: result.correct || false,
            responseTime: lastTime,
          }
        })

        // Format round 3 results
        Object.entries(round3Results).forEach(([problemId, result]: [string, any]) => {
          formattedRound3Results[problemId] = {
            correct: result.correct || false,
            responseTime: result.responseTime || 0,
          }
        })

        // Update progress
        await updateProgressAfterSession(authStore.currentUser!.uid, currentOperation.value, {
          diagnosticResults,
          round2Results: formattedRound2Results,
          round3Results: formattedRound3Results,
          allProblems,
        })

        console.log('✅ Progress document updated')
      } catch (error) {
        console.error('Error updating progress:', error)
        // Don't fail the session save if progress update fails
      }

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

  return {
    // State
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

    // Computed
    currentOperation,
    distribution,
    proficiencyPercentage,
    practiceStreak,
    nextOperationName,

    // Methods
    loadProgress,
    preparePracticeSession,
    startPractice,
    finishSession,
    loadProgressSilently,
    viewProgress,
    finishSessionAction,
  }
}
