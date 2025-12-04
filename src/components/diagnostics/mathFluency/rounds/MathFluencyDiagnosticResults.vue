<template>
  <div class="diagnostic-results-screen">
    <div class="results-content">
      <h2>📊 Quick Check Complete!</h2>

      <div class="score-circle" :class="scoreClass">
        <div class="score-number">{{ score }}%</div>
        <div class="score-label">{{ correct }}/{{ total }}</div>
      </div>

      <div v-if="wrongProblems.length === 0" class="perfect-score">
        <h3>🎉 Perfect!</h3>
        <p>Moving to practice...</p>
        <button @click="$emit('continue')" class="continue-btn">Start Practice →</button>
      </div>

      <div v-else class="learning-preview">
        <h3>📚 Let's Learn {{ wrongProblems.length }} Facts</h3>
        <p>You got {{ correct }}/{{ total }} correct</p>
        <button @click="$emit('continue')" class="start-learning-btn">Start Learning →</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProblemProgress } from '@/types/mathFluency'

const props = defineProps<{
  score: number
  correct: number
  total: number
  wrongProblems: ProblemProgress[]
}>()

defineEmits<{
  continue: []
}>()

const scoreClass = computed(() => {
  if (props.score >= 90) return 'excellent'
  if (props.score >= 75) return 'good'
  if (props.score >= 60) return 'fair'
  return 'needs-work'
})
</script>

<style scoped>
.diagnostic-results-screen {
  background: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.results-content {
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.results-content h2 {
  margin: 0 0 2rem 0;
  color: #333;
  font-size: 2rem;
}

.score-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem auto;
  border: 6px solid;
}

.score-circle.excellent {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-color: #28a745;
}

.score-circle.good {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  border-color: #17a2b8;
}

.score-circle.fair {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border-color: #ffc107;
}

.score-circle.needs-work {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-color: #dc3545;
}

.score-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
}

.score-label {
  font-size: 1rem;
  color: #666;
  margin-top: 0.5rem;
}

.perfect-score,
.learning-preview {
  margin-top: 2rem;
}

.perfect-score h3,
.learning-preview h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.perfect-score p,
.learning-preview p {
  margin: 0.5rem 0;
  color: #666;
}

.continue-btn,
.start-learning-btn {
  margin-top: 1.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.continue-btn:hover,
.start-learning-btn:hover {
  transform: translateY(-2px);
}
</style>

