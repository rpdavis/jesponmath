<template>
  <aside class="editor-sidebar">
    <!-- Quick Stats -->
    <div class="sidebar-section stats-section">
      <h3>📊 Summary</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <label>Title</label>
          <div class="stat-value" :title="assessment.title">
            {{ assessment.title || 'Untitled Assessment' }}
          </div>
        </div>

        <div class="stat-item">
          <label>Grade Level</label>
          <div class="stat-value">{{ assessment.gradeLevel || '-' }}</div>
        </div>

        <div class="stat-item">
          <label>Category</label>
          <div class="stat-value">{{ getCategoryLabel(assessment.category) }}</div>
        </div>

        <div class="stat-item highlight">
          <label>Questions</label>
          <div class="stat-value">{{ questionCount }}</div>
        </div>

        <div class="stat-item highlight">
          <label>Total Points</label>
          <div class="stat-value">{{ totalPoints }}</div>
        </div>

        <div class="stat-item highlight">
          <label>Students</label>
          <div class="stat-value">{{ studentsCount }}</div>
        </div>

        <div v-if="assessment.timeLimit" class="stat-item">
          <label>Time Limit</label>
          <div class="stat-value">{{ assessment.timeLimit }} min</div>
        </div>

        <div v-if="assessment.academicPeriod && assessment.academicPeriod !== 'all'" class="stat-item">
          <label>Quarter</label>
          <div class="stat-value">{{ getQuarterLabel(assessment.academicPeriod) }}</div>
        </div>
      </div>
    </div>

    <!-- Primary Actions -->
    <div class="sidebar-section actions-section">
      <button
        @click="emit('save')"
        :disabled="saving || !isValid"
        class="save-button-sticky"
        type="button"
      >
        {{ saving ? '💾 Saving...' : '💾 Save Assessment' }}
      </button>

      <button
        @click="emit('cancel')"
        class="cancel-button-sticky"
        type="button"
      >
        ❌ Cancel
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="sidebar-section quick-actions-section">
      <h4>Quick Actions</h4>
      <button
        @click="emit('preview')"
        :disabled="questionCount === 0"
        class="action-btn preview-btn"
        type="button"
      >
        👁️ Preview
      </button>

      <button
        @click="emit('print')"
        :disabled="questionCount === 0"
        class="action-btn print-btn"
        type="button"
      >
        🖨️ Print
      </button>
    </div>

    <!-- Quick Features -->
    <div class="sidebar-section features-section">
      <h4>Features</h4>
      <div class="feature-tags">
        <span v-if="assessment.allowFileUpload" class="feature-tag file">
          📎 File Upload
        </span>
        <span v-if="assessment.requireFileUpload" class="feature-tag required">
          📎 Required Upload
        </span>
        <span v-if="assessment.requireMultiplePages" class="feature-tag multi">
          📷 Multi-Page
        </span>
        <span v-if="assessment.allowRetakes" class="feature-tag retake">
          🔄 Retakes ({{ assessment.maxRetakes || '∞' }})
        </span>
        <span v-if="assessment.goalId" class="feature-tag goal">
          🎯 IEP Goal
        </span>
      </div>
    </div>

    <!-- Validation Messages -->
    <div v-if="!isValid" class="sidebar-section validation-section">
      <h4>⚠️ Required</h4>
      <ul class="validation-list">
        <li v-if="!assessment.title">Assessment title</li>
        <li v-if="!assessment.description">Description</li>
        <li v-if="questionCount === 0">At least 1 question</li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm'

interface Props {
  assessment: AssessmentFormData
  questionCount: number
  totalPoints: number
  studentsCount: number
  saving: boolean
  isValid: boolean
}

interface Emits {
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'preview'): void
  (e: 'print'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'HW': 'Homework',
    'Assign': 'Assignment',
    'ESA': 'Essential Std',
    'SA': 'Standard',
    'PA': 'Progress',
    'Other': 'Other'
  }
  return labels[category] || category
}

const getQuarterLabel = (period: string) => {
  const labels: Record<string, string> = {
    'q1': 'Q1',
    'q2': 'Q2',
    'q3': 'Q3',
    'q4': 'Q4',
    'auto': 'Auto'
  }
  return labels[period] || period
}
</script>

<style scoped>
.editor-sidebar {
  position: sticky;
  top: 1rem;
  height: fit-content;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-section {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.sidebar-section h3,
.sidebar-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.stats-section {
  border-left: 3px solid #3b82f6;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-item {
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
}

.stat-item.highlight {
  background: #eff6ff;
  border: 1px solid #dbeafe;
}

.stat-item label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.save-button-sticky,
.cancel-button-sticky {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button-sticky {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.save-button-sticky:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-button-sticky:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.cancel-button-sticky {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.cancel-button-sticky:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.quick-actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.quick-actions-section h4 {
  margin: 0 0 0.625rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.features-section h4 {
  margin-bottom: 0.75rem;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-tag {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.feature-tag.file {
  background: #dbeafe;
  color: #1e40af;
}

.feature-tag.required {
  background: #fef3c7;
  color: #92400e;
}

.feature-tag.multi {
  background: #e0e7ff;
  color: #4338ca;
}

.feature-tag.retake {
  background: #fce7f3;
  color: #9f1239;
}

.feature-tag.goal {
  background: #d1fae5;
  color: #065f46;
}

.validation-section {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}

.validation-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #991b1b;
  font-size: 0.875rem;
}

.validation-list li {
  margin-bottom: 0.25rem;
}

/* Scrollbar styling */
.editor-sidebar::-webkit-scrollbar {
  width: 6px;
}

.editor-sidebar::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.editor-sidebar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.editor-sidebar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

@media (max-width: 1024px) {
  .editor-sidebar {
    position: static;
    max-height: none;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .actions-section {
    flex-direction: row;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .actions-section {
    position: sticky;
    bottom: 0;
    background: white;
    padding: 1rem;
    border-top: 2px solid #e5e7eb;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }
}
</style>
