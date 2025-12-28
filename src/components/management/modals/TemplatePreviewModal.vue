<template>
  <div v-if="show && goal" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content template-preview-modal" @click.stop>
      <div class="modal-header">
        <h2>📋 Review Templates for "{{ goal.goalTitle }}"</h2>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <p class="info-text">
          This goal has {{ templateIds.length }} template(s) assigned. Review them below before generating questions.
        </p>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading templates...</p>
        </div>

        <div v-else-if="templates.length === 0" class="empty-state">
          <p>⚠️ No templates could be loaded.</p>
          <button @click="$emit('close')" class="btn btn-secondary">Cancel</button>
        </div>

        <div v-else class="templates-list">
          <div
            v-for="(template, index) in templates"
            :key="template.id"
            class="template-card"
          >
            <div class="template-header">
              <h3>
                <span class="template-badge">{{ index + 1 }}</span>
                {{ template.name }}
              </h3>
              <button
                @click="openTemplateEditor(template.id)"
                class="btn btn-sm btn-secondary"
                title="Edit this template"
              >
                ✏️ Edit
              </button>
            </div>

            <div class="template-details">
              <div class="detail-row">
                <strong>Topic:</strong>
                <span>{{ template.topic || 'Not specified' }}</span>
              </div>

              <div class="detail-row">
                <strong>Example Question:</strong>
                <div class="example-question">{{ template.exampleQuestion }}</div>
              </div>

              <div class="detail-row">
                <strong>Example Answer:</strong>
                <span class="example-answer">{{ template.exampleAnswer }}</span>
              </div>

              <!-- Problem Structure -->
              <div v-if="template.problemStructure" class="problem-structure">
                <h4>📊 Problem Structure:</h4>

                <div v-if="template.problemStructure.numberOfSteps" class="detail-row">
                  <strong>Steps:</strong>
                  <span>{{ template.problemStructure.numberOfSteps }}</span>
                </div>

                <div v-if="template.problemStructure.contextTypes?.length" class="detail-row">
                  <strong>Contexts ({{ template.problemStructure.contextTypes.length }}):</strong>
                  <div class="tag-list">
                    <span
                      v-for="context in template.problemStructure.contextTypes"
                      :key="context"
                      class="tag"
                    >
                      {{ context }}
                    </span>
                  </div>
                </div>

                <div v-if="hasNumberRanges(template.problemStructure)" class="detail-row">
                  <strong>Number Ranges:</strong>
                  <div class="number-ranges">
                    <div v-if="template.problemStructure.numberRanges?.question1">
                      Q1: {{ template.problemStructure.numberRanges.question1 }}
                    </div>
                    <div v-if="template.problemStructure.numberRanges?.question2">
                      Q2: {{ template.problemStructure.numberRanges.question2 }}
                    </div>
                    <div v-if="template.problemStructure.numberRanges?.question3">
                      Q3: {{ template.problemStructure.numberRanges.question3 }}
                    </div>
                    <div v-if="template.problemStructure.numberRanges?.question4">
                      Q4: {{ template.problemStructure.numberRanges.question4 }}
                    </div>
                    <div v-if="template.problemStructure.numberRanges?.question5">
                      Q5: {{ template.problemStructure.numberRanges.question5 }}
                    </div>
                  </div>
                </div>

                <div v-if="template.problemStructure.forbiddenPatterns?.length" class="detail-row">
                  <strong>Forbidden Patterns:</strong>
                  <div class="forbidden-list">
                    <span
                      v-for="pattern in template.problemStructure.forbiddenPatterns"
                      :key="pattern"
                      class="forbidden-tag"
                    >
                      ⛔ {{ pattern }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="template.customAIPrompt" class="detail-row">
                <strong>Custom AI Instructions:</strong>
                <div class="custom-prompt">{{ template.customAIPrompt }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">
          Cancel
        </button>
        <button
          @click="$emit('proceed')"
          class="btn btn-primary"
          :disabled="templates.length === 0"
        >
          ✅ Proceed to Generate Questions
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Goal, GoalTemplate } from '@/types/iep'

const props = defineProps<{
  show: boolean
  goal: Goal | null
  templateIds: string[]
}>()

defineEmits<{
  close: []
  proceed: []
}>()

const loading = ref(false)
const templates = ref<GoalTemplate[]>([])

// Load templates when modal is shown
watch(
  () => props.show,
  async (newShow) => {
    if (newShow && props.templateIds.length > 0) {
      await loadTemplates()
    }
  },
  { immediate: true }
)

const loadTemplates = async () => {
  loading.value = true
  templates.value = []

  try {
    const { getTemplate } = await import('@/firebase/templateServices')

    for (const templateId of props.templateIds) {
      try {
        const template = await getTemplate(templateId)
        if (template) {
          templates.value.push(template)
        }
      } catch (error) {
        console.error(`Error loading template ${templateId}:`, error)
      }
    }

    console.log(`✅ Loaded ${templates.value.length} template(s)`)
  } catch (error) {
    console.error('Error loading templates:', error)
  } finally {
    loading.value = false
  }
}

const hasNumberRanges = (problemStructure: any) => {
  if (!problemStructure?.numberRanges) return false
  const ranges = problemStructure.numberRanges
  return ranges.question1 || ranges.question2 || ranges.question3 || ranges.question4 || ranges.question5
}

const openTemplateEditor = (templateId: string) => {
  // Open template management in new tab
  const url = `/admin/templates?edit=${templateId}`
  window.open(url, '_blank')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.template-preview-modal {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.info-text {
  background: #f0f7ff;
  border-left: 4px solid #2196f3;
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 4px;
  color: #333;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.templates-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.template-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.template-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.template-badge {
  background: #2196f3;
  color: white;
  padding: 4px 10px;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: bold;
  min-width: 32px;
  text-align: center;
}

.template-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row strong {
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.example-question {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #4caf50;
  font-size: 1rem;
  color: #333;
}

.example-answer {
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: bold;
  color: #2196f3;
  display: inline-block;
}

.problem-structure {
  background: white;
  padding: 16px;
  border-radius: 6px;
  margin-top: 8px;
}

.problem-structure h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #333;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.number-ranges {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: monospace;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
}

.forbidden-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.forbidden-tag {
  background: #ffebee;
  color: #c62828;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  border: 1px solid #ef5350;
}

.custom-prompt {
  background: #fff3e0;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #ff9800;
  font-size: 0.9rem;
  color: #333;
  white-space: pre-wrap;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9rem;
}
</style>

