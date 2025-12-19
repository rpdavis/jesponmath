<template>
  <div class="checkbox-section">
    <label>Answer Options (Multiple Select)</label>
    <p class="help-text">Select all options that are correct</p>

    <div class="options-list">
      <div
        v-for="(option, optionIndex) in question.options"
        :key="optionIndex"
        class="option-item"
      >
        <LaTeXEditor
          v-model="question.options![optionIndex]"
          :rows="2"
          :show-preview="false"
          placeholder="Enter option... Use $...$ for math (e.g., $\frac{1}{2}$)"
          class="option-editor"
        />
        <label class="correct-checkbox">
          <input
            type="checkbox"
            :value="optionIndex.toString()"
            v-model="question.correctAnswers"
          >
          Correct
        </label>
        <button
          type="button"
          @click="removeOption(optionIndex)"
          class="remove-option-button"
          :disabled="question.options && question.options.length <= 2"
        >
          ×
        </button>
      </div>
    </div>
    <button
      type="button"
      @click="addOption"
      class="add-option-button"
      :disabled="question.options && question.options.length >= 8"
    >
      + Add Option
    </button>
    <small class="form-help">
      Students can select multiple correct answers
    </small>
  </div>
</template>

<script setup lang="ts">
import LaTeXEditor from '@/components/LaTeXEditor.vue';
import type { AssessmentQuestion } from '@/types/iep';

interface Props {
  question: AssessmentQuestion;
}

const props = defineProps<Props>();

// Initialize correctAnswers if not present
if (!props.question.correctAnswers) {
  props.question.correctAnswers = [];
}

const addOption = () => {
  if (!props.question.options) {
    props.question.options = [];
  }
  props.question.options.push('');
};

const removeOption = (index: number) => {
  if (props.question.options && props.question.options.length > 2) {
    props.question.options.splice(index, 1);
    // Remove from correct answers if it was selected
    const indexStr = index.toString();
    const correctIndex = props.question.correctAnswers?.indexOf(indexStr);
    if (correctIndex !== undefined && correctIndex > -1) {
      props.question.correctAnswers?.splice(correctIndex, 1);
    }
  }
};
</script>

<style scoped>
.checkbox-section {
  margin-top: 1rem;
}

.help-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.option-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.option-editor {
  flex: 1;
}

.correct-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
}

.remove-option-button {
  width: 32px;
  height: 32px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: bold;
  transition: all 0.2s;
}

.remove-option-button:hover:not(:disabled) {
  background: #fee2e2;
}

.remove-option-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-option-button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.add-option-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.add-option-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
