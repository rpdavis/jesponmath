<template>
  <div class="form-section">
    <h2>📋 Basic Information</h2>

    <div class="form-row">
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

      <div class="form-group full-width">
        <label>Overall Standard (optional)</label>
        <StandardSelector
          :modelValue="selectedStandard as any"
          :grade="assessment.gradeLevel.toString()"
          @update:modelValue="(val: any) => emit('update:standard', typeof val === 'string' ? val : val?.standardId || '')"
        />
        <small class="form-help">You can set different standards for individual questions instead</small>
      </div>
    </div>

    <div class="form-group">
      <label for="description">Description *</label>
      <textarea
        id="description"
        v-model="assessment.description"
        required
        class="form-textarea"
        rows="3"
        placeholder="Brief description of what this assessment covers..."
      ></textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="gradeLevel">Grade Level *</label>
        <select id="gradeLevel" v-model="assessment.gradeLevel" required class="form-select">
          <option value="">Select Grade</option>
          <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
            Grade {{ grade }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="category">Category *</label>
        <select
          id="category"
          v-model="assessment.category"
          required
          class="form-select"
          @change="emit('category-change', assessment.category)"
        >
          <option value="">Select Category</option>
          <option value="HW">Home Work (HW)</option>
          <option value="Assign">Assignment (Assign)</option>
          <option value="ESA">Essential Standard (ESA)</option>
          <option value="SA">Standard Assessment (SA)</option>
          <option value="PA">Progress Assessment (PA)</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="timeLimit">Time Limit</label>
        <div class="time-limit-controls">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="noTimeLimit"
              @change="emit('toggle-time-limit')"
            >
            No time limit
          </label>
          <input
            v-if="!noTimeLimit"
            id="timeLimit"
            v-model.number="assessment.timeLimit"
            type="number"
            class="form-input"
            min="1"
            max="180"
            placeholder="30"
          >
          <span v-if="!noTimeLimit" class="time-unit">minutes</span>
        </div>
      </div>
    </div>

    <!-- Assignment Dates -->
    <div class="form-row">
      <div class="form-group">
        <label for="assignDate">Assign Date</label>
        <input
          id="assignDate"
          :value="assignDateInput"
          type="datetime-local"
          class="form-input"
          @change="emit('update:assignDate', $event)"
        >
        <small class="form-help">When this assessment will be assigned to students</small>
      </div>

      <div class="form-group">
        <label for="dueDate">Due Date</label>
        <input
          id="dueDate"
          :value="dueDateInput"
          type="datetime-local"
          class="form-input"
          @change="emit('update:dueDate', $event)"
        >
        <small class="form-help">When students should complete this assessment</small>
      </div>
    </div>

    <div class="form-group">
      <label for="instructions">Instructions for Students</label>
      <textarea
        id="instructions"
        v-model="assessment.instructions"
        class="form-textarea"
        rows="4"
        placeholder="Instructions that students will see before starting the assessment..."
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import StandardSelector from '@/components/StandardSelector.vue';
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm';

interface Props {
  assessment: AssessmentFormData;
  selectedStandard: string;
  noTimeLimit: boolean;
  assignDateInput: string;
  dueDateInput: string;
}

interface Emits {
  (e: 'update:standard', value: string): void;
  (e: 'category-change', value: string): void;
  (e: 'toggle-time-limit'): void;
  (e: 'update:assignDate', event: Event): void;
  (e: 'update:dueDate', event: Event): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<style scoped>
/* Component-specific styles can go here if needed */
/* Most styles will be inherited from parent */
</style>
