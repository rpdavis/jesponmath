<template>
  <div class="form-section">
    <h2>🔄 Retake Settings</h2>

    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="assessment.allowRetakes"
        >
        Allow students to retake this assessment
      </label>
    </div>

    <div v-if="assessment.allowRetakes" class="retake-options">
      <div class="form-row">
        <div class="form-group">
          <label for="maxRetakes">Maximum Retakes</label>
          <select id="maxRetakes" v-model="assessment.maxRetakes" class="form-select">
            <option :value="0">Unlimited</option>
            <option :value="1">1 retake</option>
            <option :value="2">2 retakes</option>
            <option :value="3">3 retakes</option>
            <option :value="5">5 retakes</option>
          </select>
        </div>

        <div class="form-group">
          <label for="retakeMode">Retake Mode</label>
          <select id="retakeMode" v-model="assessment.retakeMode" class="form-select">
            <option value="separate">Separate Attempts - Each retake creates new result</option>
            <option value="combined">Combined Attempts - All attempts in one result</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="retakeInstructions">Retake Instructions</label>
        <textarea
          id="retakeInstructions"
          v-model="assessment.retakeInstructions"
          class="form-textarea"
          rows="2"
          placeholder="Instructions for students about retaking this assessment..."
        ></textarea>
      </div>

      <!-- Retake Preview -->
      <div class="retake-preview">
        <h4>🔄 Student Retake Interface Preview</h4>
        <div class="preview-card">
          <div class="preview-header">
            <span class="preview-icon">🔄</span>
            <span>Retake Available</span>
            <span class="retake-badge">{{ assessment.maxRetakes === 0 ? 'Unlimited' : `${assessment.maxRetakes} max` }}</span>
          </div>
          <div class="preview-content">
            <p>{{ assessment.retakeInstructions || 'You may retake this assessment to improve your score.' }}</p>
            <div class="preview-buttons">
              <button type="button" class="preview-btn primary">🔄 Start Retake</button>
              <button type="button" class="preview-btn">📊 View Previous Attempts</button>
            </div>
            <div class="preview-info">
              <small>
                Mode: {{ assessment.retakeMode === 'separate' ? 'Each attempt tracked separately' : 'All attempts combined in one result' }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm';

interface Props {
  assessment: AssessmentFormData;
}

defineProps<Props>();
</script>

<style scoped>
.retake-options {
  margin-top: 1rem;
  padding-left: 1.5rem;
  border-left: 3px solid #3b82f6;
}

.retake-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.preview-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.preview-icon {
  font-size: 1.25rem;
}

.retake-badge {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.preview-content {
  padding: 1rem;
}

.preview-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.preview-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: not-allowed;
  font-size: 0.875rem;
}

.preview-btn.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.preview-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
}
</style>
