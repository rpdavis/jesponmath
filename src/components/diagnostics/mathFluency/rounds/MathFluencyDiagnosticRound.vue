<template>
  <div class="round-section diagnostic-round">
    <div class="round-header-bar">
      <h3>🎯 Quick Check</h3>
      <p>{{ currentIndex + 1 }}/{{ problems.length }}</p>
    </div>

    <div v-if="showingQuestion" class="diagnostic-question">
      <MathFluencyTimerBar
        :time-remaining="timeRemaining"
        :total-time="10"
        :show-text="true"
      />

      <div class="question-display-large">
        {{ currentProblem?.displayText }}
      </div>

      <input
        ref="inputRef"
        v-model="answer"
        type="number"
        class="answer-input-large"
        :class="{ submitting: submitting }"
        placeholder="?"
        @keyup.enter="() => handleSubmit(false)"
        :disabled="submitting"
        autofocus
      />

      <button @click="() => handleSubmit(false)" class="submit-btn" :disabled="!answer || submitting">
        {{ submitting ? '✓' : 'Submit' }}
      </button>
    </div>

    <div v-else class="processing-transition">
      <div class="processing-spinner"></div>
      <p>Processing...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import type { ProblemProgress } from '@/types/mathFluency'
import MathFluencyTimerBar from '../visuals/MathFluencyTimerBar.vue'

const props = defineProps<{
  problems: ProblemProgress[]
  timePerProblem?: number
}>()

const emit = defineEmits<{
  answer: [problemId: string, answer: string, responseTime: number, isCorrect: boolean]
  complete: []
}>()

const currentIndex = ref(0)
const answer = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const timeRemaining = ref(props.timePerProblem || 10)
const timerInterval = ref<number | null>(null)
const startTime = ref(0)
const submitting = ref(false)
const showingQuestion = ref(true)

const currentProblem = computed(() => props.problems[currentIndex.value] || null)
const isComplete = computed(() => currentIndex.value >= props.problems.length)

watch(
  () => props.problems,
  () => {
    if (props.problems.length > 0) {
      startProblem()
    }
  },
  { immediate: true },
)

watch(currentIndex, async () => {
  console.log(`🔍 [DIAGNOSTIC ROUND] currentIndex changed:`, {
    currentIndex: currentIndex.value,
    totalProblems: props.problems.length,
    isComplete: isComplete.value,
  })

  if (!isComplete.value) {
    // Show processing transition
    showingQuestion.value = false
    await new Promise((resolve) => setTimeout(resolve, 300))
    startProblem()
  } else {
    console.log(`🔍 [DIAGNOSTIC ROUND] All problems completed, emitting complete event`)
    console.log(`📊 [DIAGNOSTIC ROUND] Final state:`, {
      totalProblems: props.problems.length,
      currentIndex: currentIndex.value,
      problemsAnswered: currentIndex.value,
    })
    emit('complete')
  }
})

function startProblem() {
  answer.value = ''
  timeRemaining.value = props.timePerProblem || 10
  startTime.value = Date.now()
  submitting.value = false
  showingQuestion.value = true

  // Clear existing timer
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value)
  }

  // Start timer
  timerInterval.value = window.setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      handleSubmit(true) // Timeout
    }
  }, 1000) as unknown as number

  nextTick(() => {
    inputRef.value?.focus()
  })
}

async function handleSubmit(timeout: boolean = false) {
  if (!currentProblem.value || (!answer.value && !timeout) || submitting.value) return

  submitting.value = true

  // Clear timer
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  const responseTime = timeout
    ? (props.timePerProblem || 10) * 1000
    : Date.now() - startTime.value
  const userAnswer = String(answer.value || '').trim()
  const isCorrect = userAnswer === currentProblem.value.correctAnswer

  console.log(`🔍 [DIAGNOSTIC ROUND] Submitting answer:`, {
    problemIndex: currentIndex.value,
    problemId: currentProblem.value.problemId,
    displayText: currentProblem.value.displayText,
    userAnswer,
    correctAnswer: currentProblem.value.correctAnswer,
    isCorrect,
    timeout,
    responseTime: `${(responseTime / 1000).toFixed(1)}s`,
  })

  emit('answer', currentProblem.value.problemId, answer.value || '', responseTime, isCorrect)

  // Brief pause before next question
  await new Promise((resolve) => setTimeout(resolve, 600))

  // Move to next problem
  const nextIndex = currentIndex.value + 1
  console.log(`🔍 [DIAGNOSTIC ROUND] Moving to next problem:`, {
    currentIndex: currentIndex.value,
    nextIndex,
    totalProblems: props.problems.length,
    willComplete: nextIndex >= props.problems.length,
  })

  currentIndex.value = nextIndex
}

onUnmounted(() => {
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value)
  }
})
</script>

<style scoped>
.diagnostic-round {
  background: linear-gradient(135deg, #fff3e0, #ffe082);
  border: 3px solid #ffc107;
}

.diagnostic-question {
  text-align: center;
  padding: 2rem;
}

.question-display-large {
  font-size: 4rem;
  font-weight: bold;
  color: #333;
  margin: 2rem 0;
  line-height: 1.2;
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

.answer-input-large.submitting {
  background: #f5f5f5;
  cursor: not-allowed;
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

.processing-transition {
  text-align: center;
  padding: 4rem 2rem;
}

.processing-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f4f6;
  border-top: 5px solid #ffc107;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

