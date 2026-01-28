<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content assessment-importer">
      <div class="modal-header">
        <h2>📄 Import Assessment from JSON</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <!-- Instructions -->
        <div v-if="step === 'input'" class="instructions">
          <p>Import a pre-formatted assessment by uploading a JSON file or pasting JSON code.</p>
          <details class="json-format-help">
            <summary>📖 View JSON Format Example</summary>
            <pre class="json-example">{{ exampleJSON }}</pre>
          </details>
        </div>

        <!-- Step 1: Input (Upload or Paste) -->
        <div v-if="step === 'input'" class="input-section">
          <div class="upload-zone" @drop.prevent="handleDrop" @dragover.prevent @dragenter.prevent>
            <input
              type="file"
              ref="fileInput"
              accept=".json"
              @change="handleFileUpload"
              style="display: none"
            />
            <button class="upload-btn" @click="triggerFileInput">
              📁 Choose JSON File
            </button>
            <p class="upload-hint">or drag and drop a .json file here</p>
          </div>

          <div class="divider">
            <span>OR</span>
          </div>

          <div class="paste-zone">
            <label for="jsonInput">Paste JSON Code:</label>
            <textarea
              id="jsonInput"
              v-model="jsonInput"
              placeholder='{ "title": "My Assessment", "description": "...", ... }'
              rows="12"
            ></textarea>
          </div>

          <button class="btn-primary" @click="validateJSON" :disabled="!jsonInput.trim()">
            ✅ Validate & Preview
          </button>
        </div>

        <!-- Step 2: Validation Results -->
        <div v-if="step === 'validation'" class="validation-section">
          <div v-if="validationResult">
            <!-- Errors -->
            <div v-if="validationResult.errors.length > 0" class="validation-errors">
              <h3>❌ Errors Found (Must Fix)</h3>
              <ul>
                <li v-for="(error, idx) in validationResult.errors" :key="idx" class="error-item">
                  <strong>{{ error.field }}:</strong> {{ error.message }}
                </li>
              </ul>
            </div>

            <!-- Warnings -->
            <div v-if="validationResult.warnings.length > 0" class="validation-warnings">
              <h3>⚠️ Warnings (Optional)</h3>
              <ul>
                <li v-for="(warning, idx) in validationResult.warnings" :key="idx" class="warning-item">
                  <strong>{{ warning.field }}:</strong> {{ warning.message }}
                </li>
              </ul>
            </div>

            <!-- Success -->
            <div v-if="validationResult.isValid" class="validation-success">
              <h3>✅ Validation Passed!</h3>
              <p>Your assessment is ready to preview.</p>
            </div>
          </div>

          <div class="validation-actions">
            <button class="btn-secondary" @click="step = 'input'">
              ← Back to Edit
            </button>
            <button
              class="btn-primary"
              @click="step = 'preview'"
              :disabled="!validationResult?.isValid"
            >
              Continue to Preview →
            </button>
          </div>
        </div>

        <!-- Step 3: Preview -->
        <div v-if="step === 'preview' && previewAssessment" class="preview-section">
          <div class="assessment-preview">
            <h3>Assessment Preview</h3>

            <div class="preview-field">
              <strong>Title:</strong> {{ previewAssessment.title }}
            </div>
            <div class="preview-field">
              <strong>Description:</strong> {{ previewAssessment.description }}
            </div>
            <div class="preview-field">
              <strong>Category:</strong> {{ previewAssessment.category }}
            </div>
            <div class="preview-field">
              <strong>Grade Level:</strong> {{ previewAssessment.gradeLevel }}
            </div>
            <div class="preview-field">
              <strong>Academic Period:</strong> {{ previewAssessment.academicPeriod || 'Not specified' }}
            </div>
            <div class="preview-field">
              <strong>Total Points:</strong> {{ previewAssessment.totalPoints }}
            </div>
            <div class="preview-field">
              <strong>Questions:</strong> {{ previewAssessment.questions.length }}
            </div>

            <!-- File Upload Settings -->
            <div v-if="previewAssessment.allowFileUpload" class="preview-section-header">
              📷 File Upload Settings
            </div>
            <div v-if="previewAssessment.allowFileUpload" class="preview-subsection">
              <div class="preview-field">
                <strong>Required:</strong> {{ previewAssessment.requireFileUpload ? 'Yes' : 'No' }}
              </div>
              <div class="preview-field">
                <strong>Max Size:</strong> {{ previewAssessment.maxFileSize }} MB
              </div>
              <div class="preview-field">
                <strong>Allowed Types:</strong> {{ previewAssessment.allowedFileTypes?.join(', ') }}
              </div>
            </div>

            <!-- Questions Preview -->
            <div class="preview-section-header">📝 Questions</div>
            <div class="questions-preview">
              <div
                v-for="(question, idx) in previewAssessment.questions"
                :key="question.id"
                class="question-preview"
              >
                <div class="question-header">
                  <strong>Question {{ idx + 1 }}</strong>
                  <span class="question-points">{{ question.points }} pts</span>
                </div>
                <div class="question-text" v-html="renderKaTeX(question.questionText)"></div>
                <div class="question-type">Type: {{ question.questionType }}</div>
                <div v-if="question.standard" class="question-standard">
                  Standard: {{ question.standard }}
                </div>
                <div v-if="question.explanation" class="question-explanation">
                  <em>{{ question.explanation }}</em>
                </div>
              </div>
            </div>
          </div>

          <div class="preview-actions">
            <button class="btn-secondary" @click="step = 'validation'">
              ← Back to Validation
            </button>
            <button class="btn-primary" @click="createAssessment" :disabled="isCreating">
              {{ isCreating ? 'Creating...' : '✅ Create Assessment' }}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          ❌ {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { parseAndValidateJSON, convertToAssessment } from '@/services/assessmentImporter'
import type { ImportedAssessmentData, ValidationResult } from '@/services/assessmentImporter'
import type { Assessment } from '@/types/iep'
import { useAuthStore } from '@/stores/authStore'
import katex from 'katex'

const authStore = useAuthStore()

const props = defineProps<{
  show: boolean
  goalId?: string // Optional: pre-fill goal ID
}>()

const emit = defineEmits<{
  close: []
  created: [assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>]
}>()

// State
const step = ref<'input' | 'validation' | 'preview'>('input')
const jsonInput = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const validationResult = ref<ValidationResult | null>(null)
const previewAssessment = ref<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> | null>(null)
const errorMessage = ref('')
const isCreating = ref(false)
const parsedData = ref<ImportedAssessmentData | null>(null)

// Example JSON
const exampleJSON = JSON.stringify(
  {
    title: 'Sample Assessment',
    description: 'A sample assessment',
    goalId: 'your-goal-id-here',
    category: 'PA',
    gradeLevel: 7,
    academicPeriod: 'q2',
    instructions: 'Answer all questions.',
    questions: [
      {
        questionText: 'What is $2 + 2$?',
        questionType: 'short-answer',
        correctAnswer: '4',
        points: 10,
        standard: 'CCSS.MATH.1.OA.C.6',
      },
    ],
  },
  null,
  2,
)

// Methods
function closeModal() {
  step.value = 'input'
  jsonInput.value = ''
  validationResult.value = null
  previewAssessment.value = null
  errorMessage.value = ''
  parsedData.value = null
  emit('close')
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    readFile(file)
  }
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type === 'application/json') {
    readFile(file)
  } else {
    errorMessage.value = 'Please drop a valid JSON file'
  }
}

function readFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    jsonInput.value = e.target?.result as string
    errorMessage.value = ''
  }
  reader.onerror = () => {
    errorMessage.value = 'Error reading file'
  }
  reader.readAsText(file)
}

function validateJSON() {
  errorMessage.value = ''

  const result = parseAndValidateJSON(jsonInput.value)

  if (!result.success) {
    errorMessage.value = result.error || 'Validation failed'
    validationResult.value = result.validation || null
    step.value = 'validation'
    return
  }

  // Pre-fill goalId if provided
  if (props.goalId && result.data) {
    result.data.goalId = props.goalId
  }

  parsedData.value = result.data || null
  validationResult.value = result.validation || null
  step.value = 'validation'
}

function createAssessment() {
  if (!parsedData.value) {
    errorMessage.value = 'No data to create assessment'
    return
  }

  // Get current user from auth store
  const currentUser = authStore.currentUser?.uid
  
  if (!currentUser) {
    errorMessage.value = 'You must be logged in to create assessments'
    return
  }

  try {
    const assessment = convertToAssessment(parsedData.value, currentUser)
    previewAssessment.value = assessment
    emit('created', assessment)
    closeModal()
  } catch (error) {
    errorMessage.value = `Error creating assessment: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// Render KaTeX for preview
function renderKaTeX(text: string): string {
  if (!text) return ''

  try {
    // Replace inline math $...$ with rendered KaTeX
    let rendered = text.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { throwOnError: false })
      } catch {
        return match
      }
    })

    // Replace display math $$...$$ with rendered KaTeX
    rendered = rendered.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true, throwOnError: false })
      } catch {
        return match
      }
    })

    return rendered
  } catch {
    return text
  }
}

// Move to preview when validation passes
function moveToPreview() {
  if (!parsedData.value) return

  const currentUser = authStore.currentUser?.uid
  if (!currentUser) {
    errorMessage.value = 'You must be logged in to preview assessments'
    return
  }
  
  previewAssessment.value = convertToAssessment(parsedData.value, currentUser)
  step.value = 'preview'
}

// Watch for validation success and auto-move to preview
watch(
  () => step.value,
  (newStep) => {
    if (newStep === 'preview' && !previewAssessment.value && parsedData.value) {
      moveToPreview()
    }
  },
)
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

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.instructions {
  margin-bottom: 20px;
  padding: 16px;
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  border-radius: 4px;
}

.json-format-help {
  margin-top: 12px;
}

.json-format-help summary {
  cursor: pointer;
  font-weight: 500;
  color: #3b82f6;
}

.json-example {
  margin-top: 8px;
  padding: 12px;
  background: #1f2937;
  color: #f3f4f6;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-zone {
  padding: 40px;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  text-align: center;
  background: #f8fafc;
}

.upload-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: #2563eb;
}

.upload-hint {
  margin-top: 12px;
  color: #64748b;
  font-size: 0.875rem;
}

.divider {
  text-align: center;
  position: relative;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 12px;
  color: #6b7280;
  font-weight: 500;
}

.paste-zone label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.paste-zone textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  resize: vertical;
}

.btn-primary {
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
}

.btn-primary:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #4b5563;
}

.validation-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.validation-errors,
.validation-warnings,
.validation-success {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.validation-errors {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.validation-warnings {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
}

.validation-success {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
}

.validation-errors h3,
.validation-warnings h3,
.validation-success h3 {
  margin: 0 0 12px 0;
  font-size: 1.125rem;
}

.validation-errors ul,
.validation-warnings ul {
  margin: 0;
  padding-left: 20px;
}

.error-item,
.warning-item {
  margin-bottom: 8px;
}

.validation-actions,
.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-top: 20px;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assessment-preview {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #f9fafb;
}

.preview-field {
  margin-bottom: 12px;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.preview-field strong {
  color: #374151;
  margin-right: 8px;
}

.preview-section-header {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 16px 0 8px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.preview-subsection {
  padding-left: 16px;
  margin-bottom: 16px;
}

.questions-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.question-preview {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.question-points {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.question-text {
  margin: 12px 0;
  line-height: 1.6;
}

.question-type,
.question-standard {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 8px;
}

.question-explanation {
  margin-top: 12px;
  padding: 8px;
  background: #f0fdf4;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  font-size: 0.875rem;
}

.error-message {
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  margin-top: 16px;
}
</style>
