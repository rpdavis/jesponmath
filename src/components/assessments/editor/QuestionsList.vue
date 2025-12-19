<template>
  <div class="form-section">
    <div class="section-header">
      <h2>❓ Questions ({{ questions.length }})</h2>
      <div class="header-actions">
        <button type="button" @click="emit('add-question')" class="add-question-button">
          + Add Question
        </button>
        <button v-if="questions.length > 1" type="button" @click="emit('expand-all')" class="expand-button">
          Expand All
        </button>
        <button v-if="questions.length > 1" type="button" @click="emit('collapse-all')" class="collapse-button">
          Collapse All
        </button>
      </div>
    </div>

    <p v-if="questions.length === 0" class="no-questions">
      No questions yet. Click "Add Question" to get started.
    </p>

    <div class="questions-list">
      <QuestionEditor
        v-for="(question, index) in questions"
        :key="question.id"
        :question="question"
        :index="index"
        :totalQuestions="questions.length"
        :gradeLevel="gradeLevel"
        :expanded="isExpanded(question.id)"
        @move-up="emit('move-up', index)"
        @move-down="emit('move-down', index)"
        @delete="emit('delete', index)"
        @duplicate="emit('duplicate', index)"
        @toggle-expand="emit('toggle-expand', question.id)"
      />
    </div>

    <div v-if="questions.length > 0" class="questions-footer">
      <div class="total-points">
        <strong>Total Points:</strong> {{ totalPoints }}
      </div>
      <button type="button" @click="emit('add-question')" class="add-question-button-bottom">
        + Add Another Question
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import QuestionEditor from './QuestionEditor.vue';
import type { AssessmentQuestion } from '@/types/iep';

interface Props {
  questions: AssessmentQuestion[];
  gradeLevel: number;
  expandedQuestionIds: Set<string>;
}

interface Emits {
  (e: 'add-question'): void;
  (e: 'move-up', index: number): void;
  (e: 'move-down', index: number): void;
  (e: 'delete', index: number): void;
  (e: 'duplicate', index: number): void;
  (e: 'toggle-expand', questionId: string): void;
  (e: 'expand-all'): void;
  (e: 'collapse-all'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const totalPoints = computed(() => {
  return props.questions.reduce((sum, q) => sum + (q.points || 0), 0);
});

const isExpanded = (questionId: string) => {
  return props.expandedQuestionIds.has(questionId);
};
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.add-question-button,
.add-question-button-bottom {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-question-button:hover,
.add-question-button-bottom:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

.expand-button,
.collapse-button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-button:hover,
.collapse-button:hover {
  background: #e5e7eb;
}

.no-questions {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-style: italic;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.questions-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e5e7eb;
}

.total-points {
  font-size: 1.125rem;
  color: #1f2937;
}

.total-points strong {
  color: #3b82f6;
}
</style>
