
<template>
  <div class="short-answer-section">
    <div class="form-group">
      <label>Correct Answer *</label>
      <input
        v-model="question.correctAnswer"
        type="text"
        class="form-input"
        placeholder="Enter the correct answer..."
        required
      >
    </div>

    <div class="form-group">
      <label>Alternative Acceptable Answers</label>
      <div class="alternatives-list">
        <input
          v-for="(answer, idx) in question.acceptableAnswers || []"
          :key="idx"
          v-model="question.acceptableAnswers![idx]"
          type="text"
          class="form-input"
          placeholder="Alternative answer..."
        >
      </div>
      <button type="button" @click="addAlternative" class="add-button">
        + Add Alternative Answer
      </button>
      <small class="form-help">
        Students can provide any of these answers to get full credit
      </small>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Answer Prefix (optional)</label>
        <input
          v-model="question.answerPrefix"
          type="text"
          class="form-input"
          placeholder="e.g., x = "
        >
        <small class="form-help">Text shown before the answer (e.g., "x = " for "x = 10")</small>
      </div>

      <div class="form-group">
        <label>Answer Suffix (optional)</label>
        <input
          v-model="question.answerSuffix"
          type="text"
          class="form-input"
          placeholder="e.g., apples"
        >
        <small class="form-help">Text shown after the answer (e.g., "apples" for "5 apples")</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssessmentQuestion } from '@/types/iep';

interface Props {
  question: AssessmentQuestion;
}

const props = defineProps<Props>();

const addAlternative = () => {
  if (!props.question.acceptableAnswers) {
    props.question.acceptableAnswers = [];
  }
  props.question.acceptableAnswers.push('');
};
</script>

<style scoped>
.short-answer-section {
  margin-top: 1rem;
}

.alternatives-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.add-button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.add-button:hover {
  background: #e5e7eb;
}
</style>
