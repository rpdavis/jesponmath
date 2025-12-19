<template>
  <div class="fill-blank-section">
    <div class="form-group">
      <label>Blank Format *</label>
      <input
        v-model="question.blankFormat"
        type="text"
        class="form-input"
        placeholder="e.g., '___ minutes' or 'Answer: ___ dollars'"
      >
      <small class="form-help">
        Use <code>___</code> (three underscores) to mark where the blank should appear.
      </small>
    </div>

    <div class="form-group">
      <label>Correct Answer (numeric value only) *</label>
      <input
        v-model="question.correctAnswer"
        type="text"
        class="form-input"
        placeholder="e.g., '5' (without units)"
      >
      <small class="form-help">
        Enter only the numeric value. The unit will be taken from the blank format.
      </small>
    </div>

    <div class="form-group">
      <label>Additional Acceptable Answers (numeric values only)</label>
      <div class="acceptable-answers">
        <div
          v-for="(answer, answerIndex) in question.acceptableAnswers || []"
          :key="answerIndex"
          class="acceptable-answer-item"
        >
          <input
            v-model="question.acceptableAnswers![answerIndex]"
            type="text"
            class="form-input"
            placeholder="e.g., '5' or '5.0'"
          >
          <button
            type="button"
            @click="removeAnswer(answerIndex)"
            class="remove-button"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          @click="addAnswer"
          class="add-answer-button"
        >
          + Add Alternative Answer
        </button>
      </div>
      <small class="form-help">
        Add numeric variations (e.g., "5", "5.0", "5.00").
      </small>
    </div>

    <!-- Preview -->
    <div class="form-group">
      <label>Preview</label>
      <div v-if="question.blankFormat" class="fill-blank-preview">
        <span v-html="getPreview()"></span>
      </div>
      <div v-else class="preview-placeholder">
        Enter a blank format to see preview
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssessmentQuestion } from '@/types/iep'

interface Props {
  question: AssessmentQuestion
}

const props = defineProps<Props>()

// Initialize if needed
if (!props.question.acceptableAnswers) {
  props.question.acceptableAnswers = []
}

const addAnswer = () => {
  if (!props.question.acceptableAnswers) {
    props.question.acceptableAnswers = []
  }
  props.question.acceptableAnswers.push('')
}

const removeAnswer = (index: number) => {
  if (props.question.acceptableAnswers) {
    props.question.acceptableAnswers.splice(index, 1)
  }
}

const getPreview = () => {
  if (!props.question.blankFormat) return ''

  const answer = props.question.correctAnswer || '[answer]'
  return props.question.blankFormat.replace(/___/g, `<span style="background: #dbeafe; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600;">${answer}</span>`)
}
</script>

<style scoped>
.fill-blank-section {
  margin-top: 1rem;
}

.form-help {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.form-help code {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.875em;
}

.acceptable-answers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.acceptable-answer-item {
  display: flex;
  gap: 0.5rem;
}

.remove-button {
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

.remove-button:hover {
  background: #fee2e2;
}

.add-answer-button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.add-answer-button:hover {
  background: #e5e7eb;
}

.fill-blank-preview {
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  line-height: 1.6;
}

.preview-placeholder {
  padding: 1rem;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9375rem;
}
</style>
