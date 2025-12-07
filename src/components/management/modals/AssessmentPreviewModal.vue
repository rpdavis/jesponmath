<template>
  <div v-if="show" class="modal fade show" style="display: block" @click.self="$emit('close')">
    <div class="modal-dialog modal-xl modal-dialog-scrollable" @click.stop>
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5 class="modal-title">Preview Generated Assessments</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div v-if="assessments.length > 0">
            <div
              v-for="(assessment, assessmentIndex) in assessments"
              :key="assessmentIndex"
              class="assessment-preview-card"
            >
              <div class="preview-card-header">
                <div class="header-content">
                  <div class="title-section">
                    <label class="field-label">Assessment Title:</label>
                    <input
                      v-model="assessment.title"
                      type="text"
                      class="editable-input title-input"
                      placeholder="Enter assessment title..."
                    />
                  </div>
                  <span class="points-badge">{{ assessment.totalPoints }} points</span>
                </div>
              </div>

              <div class="preview-description">
                <label class="field-label">Description:</label>
                <textarea
                  v-model="assessment.description"
                  class="editable-textarea"
                  rows="2"
                  placeholder="Enter assessment description..."
                ></textarea>
              </div>

              <div class="preview-instructions">
                <label class="field-label">Instructions:</label>
                <textarea
                  v-model="assessment.instructions"
                  class="editable-textarea"
                  rows="2"
                  placeholder="Enter instructions for students..."
                ></textarea>
              </div>

              <div class="questions-preview">
                <h6>Questions ({{ assessment.questions.length }})</h6>
                <div
                  v-for="(question, qIndex) in assessment.questions"
                  :key="question.id"
                  class="question-preview-item"
                >
                  <div class="question-number">Q{{ qIndex + 1 }}</div>
                  <div class="question-content-preview">
                    <div class="question-text-preview">
                      <strong>Question:</strong>
                      <textarea
                        v-model="question.questionText"
                        class="editable-textarea"
                        rows="3"
                        placeholder="Enter question text..."
                      ></textarea>
                    </div>
                    <div class="answer-preview">
                      <strong>Correct Answer:</strong>
                      <input
                        v-model="question.correctAnswer"
                        type="text"
                        class="editable-input"
                        placeholder="Enter correct answer..."
                      />
                    </div>
                    <div class="alternative-answers-preview">
                      <strong>Alternative Answers (comma-separated):</strong>
                      <input
                        v-model="question.acceptableAnswersString"
                        type="text"
                        class="editable-input"
                        placeholder="e.g., 6, -6, x=6"
                        @blur="$emit('update-alternatives', assessmentIndex, qIndex)"
                      />
                      <small class="help-text">Students can answer with any of these formats</small>
                    </div>
                    <div v-if="question.explanation" class="explanation-preview">
                      <strong>Explanation:</strong>
                      <textarea
                        v-model="question.explanation"
                        class="editable-textarea"
                        rows="2"
                        placeholder="Enter explanation..."
                      ></textarea>
                    </div>
                    <div class="question-meta-preview">
                      <span class="meta-tag">Points: {{ question.points }}</span>
                      <span class="meta-tag" :class="{ 'requires-photo': question.requiresPhoto }">
                        {{ question.requiresPhoto ? '📷 Requires Photo' : '✏️ Text Answer' }}
                      </span>
                      <span
                        v-if="question._source === 'fallback'"
                        class="meta-tag warning"
                        title="AI generation failed, template used"
                      >
                        ⚠️ AI Failed
                      </span>
                      <span
                        v-else-if="question._source === 'ai' || question._source === 'ai-with-template-reference'"
                        class="meta-tag success"
                      >
                        ✨ AI Generated
                      </span>
                      <span v-else-if="question._source === 'template'" class="meta-tag info">
                        📋 Template
                      </span>
                      <button
                        @click.stop="$emit('regenerate', assessmentIndex, qIndex)"
                        class="btn btn-sm btn-secondary regenerate-btn"
                        title="Regenerate remaining questions based on this edited question"
                        :disabled="saving"
                      >
                        🔄 Regenerate Others
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
          <button
            type="button"
            class="btn btn-primary"
            @click="$emit('approve')"
            :disabled="!goal || saving"
          >
            Approve & Create Assessments
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { Goal } from '@/types/iep'
import type { PreviewAssessment } from '@/composables/useAssessmentGeneration'

const props = defineProps<{
  show: boolean
  assessments: PreviewAssessment[]
  goal: Goal | null
  saving?: boolean
}>()

defineEmits<{
  close: []
  approve: []
  'update-alternatives': [assessmentIndex: number, qIndex: number]
  regenerate: [assessmentIndex: number, qIndex: number]
}>()

// Clean question text when modal opens or assessments change
// Note: This modifies the assessments array directly, which works because it's a reactive ref from the parent
watch(
  () => [props.show, props.assessments.length],
  () => {
    if (props.show && props.assessments && props.assessments.length > 0) {
      props.assessments.forEach((assessment) => {
        if (assessment.questions) {
          assessment.questions.forEach((question) => {
            if (typeof question.questionText === 'string') {
              let cleaned = question.questionText
                .trim()
                .replace(/^\n+/, '')
                .replace(/\n+$/, '')
                .replace(/\\n/g, '\n') // Convert escaped newlines
                .replace(/^\*\s+/, '') // Remove leading markdown bullets
                .replace(/\n\*\s+/g, '\n• ') // Convert markdown bullets to bullet points
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
              if (cleaned !== question.questionText) {
                question.questionText = cleaned
              }
            }
            if (typeof question.correctAnswer === 'string') {
              const cleaned = question.correctAnswer.trim()
              if (cleaned !== question.correctAnswer) {
                question.correctAnswer = cleaned
              }
            }
          })
        }
      })
    }
  },
  { immediate: true, deep: true },
)
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 1055;
  background: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 1.75rem auto;
  max-width: 1200px;
}

.modal-dialog-scrollable {
  max-height: calc(100% - 3.5rem);
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

.assessment-preview-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.preview-card-header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.title-section {
  flex: 1;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.title-input {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
}

.points-badge {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 1.75rem;
}

.preview-description {
  margin-bottom: 1.5rem;
}

.preview-instructions {
  margin-bottom: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.questions-preview h6 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #495057;
  font-weight: 600;
}

.question-preview-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.question-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #007bff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
}

.question-content-preview {
  flex: 1;
}

.question-text-preview,
.answer-preview,
.alternative-answers-preview,
.explanation-preview {
  margin-bottom: 1rem;
}

.question-text-preview strong,
.answer-preview strong,
.alternative-answers-preview strong,
.explanation-preview strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #495057;
  font-size: 0.9rem;
}

.editable-textarea,
.editable-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
}

.editable-textarea {
  resize: vertical;
}

.editable-input:focus,
.editable-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.75rem;
}

.question-meta-preview {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.meta-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.meta-tag.requires-photo {
  background: #fff3cd;
  color: #856404;
}

.meta-tag.warning {
  background: #f8d7da;
  color: #721c24;
}

.meta-tag.success {
  background: #d4edda;
  color: #155724;
}

.meta-tag.info {
  background: #d1ecf1;
  color: #0c5460;
}

.regenerate-btn {
  margin-left: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>


