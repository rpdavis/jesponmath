<template>
  <div v-if="show" class="modal-backdrop fade show" @click="$emit('close')">
    <div class="modal fade show" @click.self="$emit('close')">
      <div class="modal-dialog modal-xl" @click.stop>
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h5 class="modal-title">✅ Confirm Generated Assessments</h5>
            <button type="button" class="btn-close" @click="$emit('close')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="confirmation-info">
              <p>
                📋 Review the generated assessments below. Click "Create Assessments" to save them, or "Cancel" to go back.
              </p>
            </div>

            <div
              v-for="(assessment, assessmentIndex) in assessments"
              :key="assessmentIndex"
              class="assessment-confirmation-card"
            >
              <div class="assessment-confirmation-header">
                <div class="header-row">
                  <h6>{{ assessment.title }}</h6>
                  <span class="points-badge">{{ assessment.totalPoints }} points</span>
                </div>
                <p><strong>Description:</strong> {{ assessment.description }}</p>
                <p v-if="assessment.instructions" class="instructions-text">
                  <strong>Instructions:</strong> {{ assessment.instructions }}
                </p>
              </div>

              <div class="assessment-confirmation-questions">
                <h6>Questions ({{ assessment.questions.length }})</h6>
                <div
                  v-for="(question, qIndex) in assessment.questions"
                  :key="qIndex"
                  class="question-confirmation-item"
                >
                  <div class="question-header-row">
                    <span class="question-number-badge">Question {{ qIndex + 1 }}</span>
                    <div class="question-meta-confirmation">
                      <span
                        v-if="question._source === 'fallback'"
                        class="source-badge warning"
                      >
                        ⚠️ AI Failed
                      </span>
                      <span
                        v-else-if="question._source?.startsWith('ai')"
                        class="source-badge success"
                      >
                        ✨ AI
                      </span>
                      <span v-else-if="question._source === 'template'" class="source-badge info">
                        📋 Template
                      </span>
                    </div>
                  </div>
                  <div class="question-content">
                    <strong>Q:</strong>
                    <p>{{ question.questionText }}</p>
                  </div>
                  <div class="answer-grid">
                    <div>
                      <strong>Correct Answer:</strong>
                      <p class="correct-answer">{{ question.correctAnswer }}</p>
                    </div>
                    <div v-if="question.acceptableAnswers && question.acceptableAnswers.length > 0">
                      <strong>Alternatives:</strong>
                      <p class="alternatives">{{ question.acceptableAnswers.join(', ') }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="proofread-btn cancel-btn" @click="$emit('close')">
              Cancel
            </button>
            <button
              type="button"
              class="proofread-btn approve-btn"
              @click="$emit('confirm')"
              :disabled="saving"
            >
              <span
                v-if="saving"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
                style="margin-right: 0.5rem"
              ></span>
              ✅ Create Assessments
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PreviewAssessment } from '@/composables/useAssessmentGeneration'

defineProps<{
  show: boolean
  assessments: PreviewAssessment[]
  saving?: boolean
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 1055;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 1.75rem auto;
  max-width: 1400px;
}

.modal-content {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  opacity: 0.6;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  opacity: 1;
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.confirmation-info {
  background: #e7f3ff;
  border-left: 4px solid #007bff;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.confirmation-info p {
  margin: 0;
  color: #004085;
  font-weight: 500;
}

.assessment-confirmation-card {
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.assessment-confirmation-header {
  background: #f8f9fa;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #dee2e6;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.header-row h6 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.points-badge {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.assessment-confirmation-header p {
  margin: 0.5rem 0 0 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.instructions-text {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #dee2e6;
}

.assessment-confirmation-questions {
  padding: 1.25rem;
}

.assessment-confirmation-questions h6 {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
}

.question-confirmation-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.question-header-row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
}

.question-number-badge {
  font-weight: 600;
  color: #007bff;
  font-size: 0.9rem;
}

.question-meta-confirmation {
  display: flex;
  gap: 0.5rem;
}

.source-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.source-badge.warning {
  background: #f8d7da;
  color: #721c24;
}

.source-badge.success {
  background: #d4edda;
  color: #155724;
}

.source-badge.info {
  background: #d1ecf1;
  color: #0c5460;
}

.question-content {
  margin-bottom: 0.5rem;
}

.question-content strong {
  color: #495057;
  font-size: 0.9rem;
}

.question-content p {
  margin: 0.25rem 0 0 0;
  color: #212529;
  line-height: 1.5;
}

.answer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.75rem;
}

.answer-grid strong {
  color: #495057;
  font-size: 0.85rem;
}

.correct-answer {
  margin: 0.25rem 0 0 0;
  color: #28a745;
  font-weight: 500;
}

.alternatives {
  margin: 0.25rem 0 0 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.proofread-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #545b62;
}

.approve-btn {
  background: #28a745;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #218838;
}

.proofread-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 1.5px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>







