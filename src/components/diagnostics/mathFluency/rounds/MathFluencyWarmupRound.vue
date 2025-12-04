<template>
  <div class="round-section warmup-round">
    <div class="round-header-bar">
      <h3>🏃 Warmup</h3>
      <p>Type these numbers</p>
    </div>

    <div class="warmup-content">
      <p class="warmup-instruction">Type this number:</p>
      <div class="warmup-number-display">
        {{ numbers[currentIndex] }}
      </div>
      <input
        ref="inputRef"
        v-model="answer"
        type="number"
        class="answer-input-large warmup-input"
        placeholder="?"
        @keyup.enter="handleSubmit"
        autofocus
      />
      <p class="warmup-progress">{{ currentIndex + 1 }} / {{ numbers.length }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  numbers: number[]
}>()

const emit = defineEmits<{
  complete: []
}>()

const currentIndex = ref(0)
const answer = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.numbers,
  () => {
    currentIndex.value = 0
    answer.value = ''
  },
)

watch(currentIndex, async () => {
  answer.value = ''
  await nextTick()
  inputRef.value?.focus()
})

function handleSubmit() {
  if (!answer.value) return

  const currentNumber = props.numbers[currentIndex.value]
  if (parseInt(answer.value) === currentNumber) {
    if (currentIndex.value < props.numbers.length - 1) {
      currentIndex.value++
    } else {
      emit('complete')
    }
  } else {
    // Wrong answer - clear and let them try again
    answer.value = ''
  }
}
</script>

<style scoped>
.warmup-round {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 3px solid #2196f3;
}

.warmup-content {
  text-align: center;
  padding: 2rem;
}

.warmup-instruction {
  font-size: 1.2rem;
  color: #1976d2;
  margin-bottom: 1rem;
}

.warmup-number-display {
  font-size: 5rem;
  font-weight: bold;
  color: #1565c0;
  margin: 2rem 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.warmup-input {
  border: 4px solid #2196f3 !important;
}

.warmup-progress {
  margin-top: 1rem;
  font-size: 1.1rem;
  color: #1976d2;
  font-weight: 600;
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
</style>

