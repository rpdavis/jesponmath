<template>
  <div class="fraction-config">
    <div class="form-group">
      <label>Correct Fraction Answers *</label>
      <p class="help-text">Add all acceptable equivalent answers (e.g., 1/2, 2/4, 0.5)</p>

      <div class="fraction-answers-list">
        <div
          v-for="(answer, answerIndex) in question.correctFractionAnswers || []"
          :key="answerIndex"
          class="fraction-answer-item"
        >
          <input
            v-model="question.correctFractionAnswers![answerIndex]"
            type="text"
            placeholder="e.g., 3/4 or 0.75 or 3"
            class="form-input"
          />
          <button
            type="button"
            @click="removeFractionAnswer(answerIndex)"
            class="remove-btn"
          >×</button>
        </div>
      </div>

      <button
        type="button"
        @click="addFractionAnswer"
        class="add-btn"
      >+ Add Equivalent Answer</button>
    </div>

    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="question.acceptEquivalentFractions"
        >
        Automatically accept all equivalent fractions
      </label>
      <small class="form-help">
        If checked, students can enter any equivalent fraction (e.g., 1/2 = 2/4 = 3/6)
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssessmentQuestion } from '@/types/iep';

interface Props {
  question: AssessmentQuestion;
}

const props = defineProps<Props>();

const addFractionAnswer = () => {
  if (!props.question.correctFractionAnswers) {
    props.question.correctFractionAnswers = [];
  }
  props.question.correctFractionAnswers.push('');
};

const removeFractionAnswer = (index: number) => {
  if (props.question.correctFractionAnswers) {
    props.question.correctFractionAnswers.splice(index, 1);
  }
};
</script>

<style scoped>
.fraction-config {
  margin-top: 1rem;
}

.help-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.fraction-answers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.fraction-answer-item {
  display: flex;
  gap: 0.5rem;
}

.remove-btn,
.add-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.remove-btn {
  background: #fef2f2;
  color: #dc2626;
  width: 36px;
}

.add-btn {
  background: #f3f4f6;
}

.remove-btn:hover {
  background: #fee2e2;
}

.add-btn:hover {
  background: #e5e7eb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
