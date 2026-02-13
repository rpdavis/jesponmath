<template>
  <div class="options-section">
    <div class="label-row">
      <label>Answer Options</label>
      <button
        type="button"
        @click="generateOptions"
        :disabled="isGenerating || !question.questionText"
        class="ai-generate-button"
        :title="!question.questionText ? 'Enter a question first' : 'AI will generate options and correct answer'"
      >
        <span v-if="isGenerating" class="spinner"></span>
        <span v-else>🤖</span>
        {{ isGenerating ? 'Generating...' : 'AI Generate Options' }}
      </button>
    </div>
    <div v-if="aiError" class="ai-error">
      ⚠️ {{ aiError }}
    </div>
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
          class="option-latex-editor"
        />
        <label class="correct-checkbox">
          <input
            type="radio"
            :name="`correct-${question.id}`"
            :value="optionIndex.toString()"
            v-model="question.correctAnswer"
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
      :disabled="question.options && question.options.length >= 6"
    >
      + Add Option
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LaTeXEditor from '@/components/LaTeXEditor.vue';
import type { AssessmentQuestion } from '@/types/iep';
import { generateMultipleChoiceAnswer } from '@/services/aiAnswerGenerator';

interface Props {
  question: AssessmentQuestion;
}

const props = defineProps<Props>();

const isGenerating = ref(false);
const aiError = ref('');

const addOption = () => {
  if (!props.question.options) {
    props.question.options = [];
  }
  props.question.options.push('');
};

const removeOption = (index: number) => {
  if (props.question.options && props.question.options.length > 2) {
    props.question.options.splice(index, 1);
  }
};

const generateOptions = async () => {
  if (!props.question.questionText) {
    aiError.value = 'Please enter a question first.';
    return;
  }

  isGenerating.value = true;
  aiError.value = '';

  try {
    const result = await generateMultipleChoiceAnswer(props.question.questionText);

    // Apply the generated options
    if (result.options && result.options.length >= 2) {
      props.question.options = result.options;
    }

    // Set the correct answer index
    props.question.correctAnswer = result.correctAnswerIndex.toString();

    // Apply explanation if available
    if (result.explanation && !props.question.explanation) {
      props.question.explanation = result.explanation;
    }

    console.log('✅ AI generated multiple choice:', result);
  } catch (err: any) {
    console.error('❌ AI option generation failed:', err);
    aiError.value = err.message || 'Failed to generate options. Please try again.';
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.options-section {
  margin-top: 1rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
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
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.85rem;
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

.option-latex-editor {
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
}

.add-option-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.add-option-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
