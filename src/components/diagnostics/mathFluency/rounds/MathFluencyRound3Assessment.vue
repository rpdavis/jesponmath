<template>
  <div class="round-section round-3">
    <div class="round-header-bar">
      <h3>Round 3: Quick Check</h3>
      <p>{{ currentIndex + 1 }}/{{ problems.length }} problems</p>
    </div>

    <div class="assessment-question">
      <MathFluencyTimerBar
        :time-remaining="timeRemaining"
        :total-time="15"
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
        placeholder="?"
        @keyup.enter="() => handleSubmit(false)"
        autofocus
      />

      <button @click="() => handleSubmit(false)" class="submit-btn" :disabled="!answer">
        Submit
      </button>
    </div>

    <p class="assessment-note">No feedback during assessment - keep going!</p>
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
  answer: [problemId: string, answer: string, responseTime: number]
  complete: []
}>()

const currentIndex = ref(0)
const answer = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const timeRemaining = ref(props.timePerProblem || 15)
const timerInterval = ref<number | null>(null)
const startTime = ref(0)

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
  if (!isComplete.value) {
    startProblem()
  } else {
    emit('complete')
  }
})

function startProblem() {
  answer.value = ''
  timeRemaining.value = props.timePerProblem || 15
  startTime.value = Date.now()

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

function handleSubmit(timeout: boolean = false) {
  if (!currentProblem.value || !answer.value && !timeout) return

  // Clear timer
  if (timerInterval.value !== null) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  const responseTime = timeout ? (props.timePerProblem || 15) * 1000 : Date.now() - startTime.value

  emit('answer', currentProblem.value.problemId, answer.value || '', responseTime)

  // Move to next problem
  currentIndex.value++
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

.assessment-question {
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

.assessment-note {
  text-align: center;
  color: #666;
  font-style: italic;
  margin-top: 1.5rem;
}
</style>

