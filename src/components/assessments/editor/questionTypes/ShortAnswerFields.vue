
<template>
  <div class="short-answer-section">
    <div class="form-group">
      <div class="label-row">
        <label>Correct Answer *</label>
        <button
          type="button"
          @click="generateAnswer"
          :disabled="isGenerating || !question.questionText"
          class="ai-generate-button"
          :title="!question.questionText ? 'Enter a question first' : 'AI will generate the answer'"
        >
          <span v-if="isGenerating" class="spinner"></span>
          <span v-else>🤖</span>
          {{ isGenerating ? 'Generating...' : 'AI Generate Answer' }}
        </button>
      </div>
      <input
        v-model="question.correctAnswer"
        type="text"
        class="form-input"
        placeholder="Enter the correct answer..."
        required
      >
      <div v-if="aiError" class="ai-error">
        ⚠️ {{ aiError }}
      </div>
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

    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="question.acceptEquivalentFractions"
        >
        🔢 Accept equivalent fractions (e.g., 1/2 = 2/4 = 3/6)
      </label>
      <small class="form-help">
        When enabled, students get credit for any equivalent fraction, even if not simplified
      </small>
    </div>

    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="question.acceptAnyVariable"
        >
        📐 Accept any variable letter (e.g., 4x+5=6 same as 4c+5=6)
      </label>
      <small class="form-help">
        When enabled, students can use any letter for variables in equations (x, y, a, b, c, n, etc.)
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
import { ref } from 'vue';
import type { AssessmentQuestion } from '@/types/iep';
import { generateShortAnswer } from '@/services/aiAnswerGenerator';

interface Props {
  question: AssessmentQuestion;
}

const props = defineProps<Props>();

const isGenerating = ref(false);
const aiError = ref('');

const addAlternative = () => {
  if (!props.question.acceptableAnswers) {
    props.question.acceptableAnswers = [];
  }
  props.question.acceptableAnswers.push('');
};

const generateAnswer = async () => {
  if (!props.question.questionText) {
    aiError.value = 'Please enter a question first.';
    return;
  }

  isGenerating.value = true;
  aiError.value = '';

  try {
    const result = await generateShortAnswer(props.question.questionText);

    // Apply the generated answer
    props.question.correctAnswer = result.correctAnswer;

    // Apply alternative answers
    if (result.alternativeAnswers && result.alternativeAnswers.length > 0) {
      props.question.acceptableAnswers = result.alternativeAnswers;
    }

    // Apply prefix if detected (e.g. "x=" for single variable answers)
    if (result.answerPrefix) {
      props.question.answerPrefix = result.answerPrefix;
    }

    // Apply suffix if detected (e.g. " apples")
    if (result.answerSuffix) {
      props.question.answerSuffix = result.answerSuffix;
    }

    // Apply explanation if available
    if (result.explanation && !props.question.explanation) {
      props.question.explanation = result.explanation;
    }

    console.log('✅ AI generated short answer:', result);
  } catch (err: any) {
    console.error('❌ AI answer generation failed:', err);
    aiError.value = err.message || 'Failed to generate answer. Please try again.';
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.short-answer-section {
  margin-top: 1rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.ai-generate-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
}

.ai-generate-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.ai-generate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-error {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.85rem;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}
</style>
