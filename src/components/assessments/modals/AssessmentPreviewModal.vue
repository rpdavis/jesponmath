<template>
  <div class="preview-modal-overlay" @click="emit('close')">
    <div class="preview-modal" @click.stop>
      <div class="preview-header">
        <h2>👁️ Assessment Preview</h2>
        <button @click="emit('close')" class="close-btn" type="button">×</button>
      </div>

      <div class="preview-content">
        <!-- Assessment Info -->
        <div class="preview-info">
          <h1>{{ assessment.title }}</h1>
          <p class="description">{{ assessment.description }}</p>

          <div class="meta-info">
            <span>📚 Grade {{ assessment.gradeLevel }}</span>
            <span>📊 {{ assessment.category }}</span>
            <span v-if="assessment.timeLimit">⏱️ {{ assessment.timeLimit }} minutes</span>
            <span>📝 {{ assessment.questions.length }} questions</span>
            <span>🎯 {{ totalPoints }} points</span>
          </div>

          <div v-if="assessment.instructions" class="instructions">
            <strong>Instructions:</strong>
            <p>{{ assessment.instructions }}</p>
          </div>

          <div v-if="assessment.accommodations && assessment.accommodations.length > 0" class="accommodations">
            <strong>Accommodations:</strong>
            <ul>
              <li v-for="acc in assessment.accommodations" :key="acc">{{ acc }}</li>
            </ul>
          </div>
        </div>

        <!-- Questions Preview -->
        <div class="questions-preview">
          <div v-for="(question, index) in assessment.questions" :key="question.id" class="question-preview">
            <div class="question-header">
              <span class="question-number">{{ index + 1 }}</span>
              <span class="question-points">{{ question.points }} pts</span>
            </div>

            <div class="question-text" v-html="question.questionText"></div>

            <!-- Show question type specific preview -->
            <div class="question-input-preview">
              <template v-if="question.questionType === 'multiple-choice'">
                <div v-for="(option, idx) in question.options" :key="idx" class="option-preview">
                  <input type="radio" disabled> {{ String.fromCharCode(65 + idx) }}) {{ option }}
                </div>
              </template>

              <template v-else-if="question.questionType === 'true-false'">
                <div class="option-preview">
                  <input type="radio" disabled> True
                </div>
                <div class="option-preview">
                  <input type="radio" disabled> False
                </div>
              </template>

              <template v-else-if="question.questionType === 'checkbox'">
                <div v-for="(option, idx) in question.options" :key="idx" class="option-preview">
                  <input type="checkbox" disabled> {{ String.fromCharCode(65 + idx) }}) {{ option }}
                </div>
              </template>

              <template v-else-if="question.questionType === 'short-answer' || question.questionType === 'essay'">
                <textarea :rows="question.questionType === 'essay' ? 6 : 2" disabled placeholder="Student will type answer here..."></textarea>
              </template>

              <template v-else-if="question.questionType === 'fill-blank'">
                <div class="fill-blank-input">
                  <span v-if="question.blankFormat">
                    {{ question.blankFormat.replace(/___/g, '_______') }}
                  </span>
                </div>
              </template>

              <template v-else>
                <div class="generic-input">
                  <em>{{ question.questionType }} input</em>
                </div>
              </template>
            </div>

            <div v-if="question.hints && question.hints.length > 0" class="hints-preview">
              <strong>💡 Hints available:</strong> {{ question.hints.length }}
            </div>
          </div>
        </div>
      </div>

      <div class="preview-footer">
        <button @click="emit('close')" class="close-button" type="button">Close Preview</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm'

interface Props {
  assessment: AssessmentFormData
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const totalPoints = computed(() => {
  return props.assessment.questions.reduce((sum, q) => sum + (q.points || 0), 0)
})
</script>

<style scoped>
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.preview-modal {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
}

.preview-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.preview-info h1 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.75rem;
}

.description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.meta-info span {
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
}

.instructions,
.accommodations {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
}

.instructions strong,
.accommodations strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #1e40af;
}

.accommodations ul {
  margin: 0;
  padding-left: 1.5rem;
}

.questions-preview {
  margin-top: 2rem;
}

.question-preview {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  background: #3b82f6;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.question-points {
  background: #d1fae5;
  color: #065f46;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.question-text {
  font-size: 1.05rem;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.question-input-preview {
  margin-top: 1rem;
}

.option-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
}

.option-preview input {
  margin: 0;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  resize: vertical;
}

.fill-blank-input,
.generic-input {
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  color: #6b7280;
}

.hints-preview {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #92400e;
}

.preview-footer {
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: center;
}

.close-button {
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.close-button:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .preview-modal-overlay {
    padding: 1rem;
  }

  .preview-content {
    padding: 1rem;
  }
}
</style>
