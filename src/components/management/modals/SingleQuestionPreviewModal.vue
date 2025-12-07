<template>
  <div v-if="show" class="modal-backdrop fade show" @click="$emit('close')">
    <div class="modal fade show" @click.self="$emit('close')">
      <div class="modal-dialog modal-xl" @click.stop>
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h5 class="modal-title">📝 Proofread Question</h5>
            <button type="button" class="btn-close" @click="$emit('close')">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="isGenerating" class="text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p>Generating preview question...</p>
            </div>
            <div v-if="question && !isGenerating">
              <div class="proofread-question-container">
                <div class="proofread-header">
                  <h5>📝 Preview Question</h5>
                  <div class="source-badges">
                    <span
                      v-if="question._source === 'fallback'"
                      class="source-badge warning"
                      title="AI generation failed, fell back to template."
                    >
                      ⚠️ AI Failed
                    </span>
                    <span
                      v-else-if="question._source?.startsWith('ai')"
                      class="source-badge success"
                    >
                      ✨ AI Generated
                    </span>
                    <span v-else-if="question._source === 'template'" class="source-badge info">
                      📋 Template
                    </span>
                  </div>
                </div>

                <div class="proofread-form">
                  <div class="form-field">
                    <label class="form-label">Question Text:</label>
                    <textarea
                      v-if="localQuestion"
                      v-model="localQuestion.questionText"
                      class="form-control"
                      rows="4"
                      placeholder="Enter question text..."
                    ></textarea>
                  </div>

                  <div class="form-field">
                    <label class="form-label">Correct Answer:</label>
                    <input
                      v-if="localQuestion"
                      v-model="localQuestion.correctAnswer"
                      type="text"
                      class="form-control"
                      placeholder="Enter correct answer..."
                    />
                  </div>

                  <div class="form-field">
                    <label class="form-label">Alternative Answers (comma-separated):</label>
                    <input
                      v-if="localQuestion"
                      v-model="localQuestion.acceptableAnswersString"
                      type="text"
                      class="form-control"
                      placeholder="e.g., 6, -6, x=6"
                    />
                    <small class="form-text">Students can answer with any of these formats</small>
                  </div>

                  <div v-if="localQuestion" class="form-field">
                    <label class="form-label">Explanation (Optional):</label>
                    <textarea
                      v-model="localQuestion.explanation"
                      class="form-control"
                      rows="2"
                      placeholder="Enter explanation..."
                    ></textarea>
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
              @click="handleApprove"
              :disabled="!question || isGenerating"
            >
              <span
                v-if="isGenerating"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
                style="margin-right: 0.5rem"
              ></span>
              ✅ Approve & Generate Assessments
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PreviewQuestion } from '@/composables/useAssessmentGeneration'

const props = defineProps<{
  show: boolean
  question: PreviewQuestion | null
  isGenerating?: boolean
}>()

const emit = defineEmits<{
  close: []
  approve: [question: PreviewQuestion]
}>()

const localQuestion = ref<PreviewQuestion | null>(null)

watch(
  () => props.question,
  (newQuestion) => {
    if (newQuestion) {
      localQuestion.value = { ...newQuestion }
    }
  },
  { immediate: true },
)

const handleApprove = () => {
  if (localQuestion.value) {
    // Update alternative answers from string
    if (localQuestion.value.acceptableAnswersString) {
      localQuestion.value.acceptableAnswers = localQuestion.value.acceptableAnswersString
        .split(',')
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0)
    }
    emit('approve', localQuestion.value)
  }
}
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
  max-width: 1200px;
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
}

.text-center {
  text-align: center;
  padding: 2rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e2e8f0;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.proofread-question-container {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
}

.proofread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.proofread-header h5 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.source-badges {
  display: flex;
  gap: 0.5rem;
}

.source-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
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

.proofread-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.75rem;
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
</style>


