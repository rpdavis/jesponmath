<template>
  <div class="basic-info-compact">
    <!-- Title and Description -->
    <div class="form-group">
      <label for="title">Assessment Title *</label>
      <input
        id="title"
        v-model="assessment.title"
        type="text"
        required
        class="form-input"
        placeholder="e.g., Fractions and Decimals Assessment"
      >
    </div>

    <div class="form-group">
      <label for="description">Description *</label>
      <textarea
        id="description"
        v-model="assessment.description"
        required
        class="form-textarea"
        rows="2"
        placeholder="Brief description of what this assessment covers..."
      ></textarea>
    </div>

    <!-- Compact 4-column grid -->
    <div class="compact-grid-4">
      <div class="form-group">
        <label for="gradeLevel">Grade *</label>
        <select id="gradeLevel" v-model="assessment.gradeLevel" required class="form-select-compact">
          <option value="">Select</option>
          <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
            {{ grade }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="category">Category *</label>
        <select
          id="category"
          v-model="assessment.category"
          required
          class="form-select-compact"
          @change="emit('category-change', assessment.category)"
        >
          <option value="">Select</option>
          <option value="HW">Homework</option>
          <option value="Assign">Assignment</option>
          <option value="ESA">Essential Std</option>
          <option value="SA">Standard</option>
          <option value="PA">Progress</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="timeLimit">Time Limit</label>
        <div class="inline-field">
          <input
            v-if="!noTimeLimit"
            id="timeLimit"
            v-model.number="assessment.timeLimit"
            type="number"
            class="form-input-compact"
            min="1"
            max="180"
            placeholder="30"
          >
          <label v-else class="no-limit-label">
            <input
              type="checkbox"
              :checked="noTimeLimit"
              @change="emit('toggle-time-limit')"
            >
            None
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>Quarter</label>
        <select
          :value="selectedQuarter"
          @change="emit('update:selectedQuarter', ($event.target as HTMLSelectElement).value)"
          class="form-select-compact"
        >
          <option value="auto">Auto</option>
          <option value="all">All Year</option>
          <option value="q1">Q1</option>
          <option value="q2">Q2</option>
          <option value="q3">Q3</option>
          <option value="q4">Q4</option>
        </select>
      </div>
    </div>

    <!-- Assignment Dates in 2-column -->
    <div class="compact-grid-2">
      <div class="form-group">
        <label for="assignDate">Assign Date</label>
        <input
          id="assignDate"
          :value="assignDateInput"
          type="datetime-local"
          class="form-input-compact"
          @change="emit('update:assignDate', $event)"
        >
      </div>

      <div class="form-group">
        <label for="dueDate">Due Date</label>
        <input
          id="dueDate"
          :value="dueDateInput"
          type="datetime-local"
          class="form-input-compact"
          @change="emit('update:dueDate', $event)"
        >
      </div>
    </div>

    <!-- Instructions -->
    <div class="form-group">
      <label for="instructions">Instructions for Students</label>
      <textarea
        id="instructions"
        v-model="assessment.instructions"
        class="form-textarea"
        rows="2"
        placeholder="Instructions that students will see..."
      ></textarea>
    </div>

    <!-- Optional: Overall Standard -->
    <details class="standard-details">
      <summary>📏 Overall Standard (optional)</summary>
      <div class="standard-content">
        <StandardSelector
          :modelValue="selectedStandard as any"
          :grade="assessment.gradeLevel.toString()"
          @update:modelValue="(val: any) => emit('update:standard', typeof val === 'string' ? val : val?.standardId || '')"
        />
        <small class="form-help">You can also set standards per question</small>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StandardSelector from '@/components/StandardSelector.vue'
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm'

interface Props {
  assessment: AssessmentFormData
  selectedStandard: string
  selectedQuarter: string
  noTimeLimit: boolean
  assignDateInput: string
  dueDateInput: string
}

interface Emits {
  (e: 'update:standard', value: string): void
  (e: 'category-change', value: string): void
  (e: 'toggle-time-limit'): void
  (e: 'update:assignDate', event: Event): void
  (e: 'update:dueDate', event: Event): void
  (e: 'update:selectedQuarter', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.basic-info-compact {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.compact-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.compact-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-select-compact,
.form-input-compact,
.form-textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-select-compact:focus,
.form-input-compact:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.inline-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.no-limit-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
}

.standard-details {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem;
  background: #f9fafb;
}

.standard-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  list-style: none;
  user-select: none;
}

.standard-details summary::-webkit-details-marker {
  display: none;
}

.standard-details[open] summary {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.standard-content {
  padding-top: 0.5rem;
}

.form-help {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

@media (max-width: 1024px) {
  .compact-grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .compact-grid-4,
  .compact-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
