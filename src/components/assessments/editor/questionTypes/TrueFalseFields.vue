<template>
  <div class="true-false-section">
    <label>Correct Answer *</label>
    <div class="radio-group">
      <label class="radio-option">
        <input type="radio" value="true" v-model="question.correctAnswer">
        <span>True</span>
      </label>
      <label class="radio-option">
        <input type="radio" value="false" v-model="question.correctAnswer">
        <span>False</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssessmentQuestion } from '@/types/iep';

interface Props {
  question: AssessmentQuestion;
}

defineProps<Props>();
</script>

<style scoped>
.true-false-section {
  margin-top: 1rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:has(input:checked) {
  background: #eff6ff;
  border-color: #3b82f6;
}

.radio-option span {
  font-weight: 500;
}
</style>
