<template>
  <div class="round-section round-2">
    <div class="round-header-bar">
      <h3>Round 2: Practice</h3>
      <p>{{ currentIndex + 1 }}/{{ problems.length }} problems</p>
      <p class="mix-info">Mixed: {{ mixInfo }}</p>
    </div>

    <div class="practice-question">
      <MathFluencyTimerBar :time-remaining="timeRemaining" :total-time="15" :show-text="true" />

      <div class="question-display-large">
        {{ currentProblem?.displayText }}
      </div>
      <input
        ref="inputRef"
        v-model="answer"
        type="number"
        class="answer-input-large"
        placeholder="?"
        @keyup.enter="() => handleSubmit(false)"
        :disabled="submitting"
        autofocus
      />

      <button
        @click="() => handleSubmit(false)"
        class="submit-btn"
        :disabled="!answer || submitting"
      >
        {{ submitting ? '✓' : 'Submit' }}
      </button>
    </div>

    <!-- Immediate Feedback -->
    <div v-if="showingFeedback" class="round2-feedback">
      <div v-if="lastCorrect" class="feedback-correct-inline">
        <span class="feedback-icon-inline">✅</span>
        <span v-if="lastTime < 6000">Great! Fast and accurate!</span>
        <span v-else>Correct! Try to get faster.</span>
      </div>
      <div v-else class="feedback-incorrect-inline">
        <span class="feedback-icon-inline">❌</span>
        <span>The answer is {{ currentProblem?.correctAnswer }}</span>
        <span class="retry-note">(Will appear again this round)</span>
      </div>
    </div>

    <div class="round2-stats">
      <div class="stat-mini">
        <span>Correct:</span>
        <span class="stat-value-mini">{{ correct }}</span>
      </div>
      <div class="stat-mini">
        <span>Accuracy:</span>
        <span class="stat-value-mini">{{ accuracy }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import type { ProblemProgress } from '@/types/mathFluency'
import MathFluencyTimerBar from '../visuals/MathFluencyTimerBar.vue'

const props = defineProps<{
  problems: ProblemProgress[]
  mixInfo?: string
}>()

const emit = defineEmits<{
  answer: [problemId: string, answer: string, responseTime: number, isCorrect: boolean]
  complete: []
}>()

const currentIndex = ref(0)
const answer = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const timeRemaining = ref(15)
const timerInterval = ref<number | null>(null)
const startTime = ref(0)
const submitting = ref(false)
const showingFeedback = ref(false)
const lastCorrect = ref(false)
const lastTime = ref(0)
const correct = ref(0)
const total = ref(0)

const currentProblem = computed(() => {
  if (props.problems.length === 0) return null
  return props.problems[currentIndex.value % props.problems.length]
})

const accuracy = computed(() => {
  if (total.value === 0) return 0
  return Math.round((correct.value / total.value) * 100)
})

watch(
  () => props.problems,
  () => {
    if (props.problems.length > 0) {
      startProblem()
    }
  },
  { immediate: true },
)

function startProblem() {
  answer.value = ''
  timeRemaining.value = 15
  startTime.value = Date.now()
  submitting.value = false
  showingFeedback.value = false

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

  const responseTime = timeout ? 15000 : Date.now() - startTime.value
  const isCorrect = String(answer.value || '').trim() === currentProblem.value.correctAnswer

  lastCorrect.value = isCorrect
  lastTime.value = responseTime
  total.value++

  if (isCorrect) {
    correct.value++
  }

  emit('answer', currentProblem.value.problemId, answer.value || '', responseTime, isCorrect)

  // Show feedback
  showingFeedback.value = true

  // Wait for feedback display, then continue
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Reset for next problem
  showingFeedback.value = false
  submitting.value = false

  // Advance to next problem
  currentIndex.value++

  // Check if we've completed all problems
  if (currentIndex.value >= props.problems.length) {
    emit('complete')
  } else {
    // Start next problem
    startProblem()
  }
}

onUnmounted(() => {
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value)
  }
})
</script>

<style scoped>
.round-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.practice-question {
  text-align: center;
  padding: 2rem 0;
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

.answer-input-large:disabled {
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
</style>
