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

              <!-- Template Form Section -->
              <div class="template-section">
                <div class="alert alert-info" style="margin-bottom: 1rem; padding: 0.75rem; border-radius: 6px; background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460;">
                  ℹ️ <strong>Optional:</strong> Save this question pattern as a reusable template for future assessments. 
                  If you just want to use this question now, click "Approve & Generate" below.
                </div>
                <div class="template-section-header" @click="showTemplateFields = !showTemplateFields">
                  <h6>📄 Template Information (Optional)</h6>
                  <span class="toggle-icon">{{ showTemplateFields ? '▼' : '▶' }}</span>
                </div>
                <div v-if="showTemplateFields" class="template-form">
                  <!-- EXAMPLE QUESTION SECTION - MOST IMPORTANT -->
                  <div class="example-question-section">
                    <h6 class="section-title">⭐ Example Question (Most Important)</h6>
                    <p class="section-description">This example question will be used to generate accurate similar questions. This is the most important part of the template!</p>

                    <div class="form-group">
                      <label>Example Question Text *</label>
                      <textarea
                        v-model="templateFormData.exampleQuestion"
                        required
                        rows="4"
                        class="form-control example-field"
                        placeholder="Enter the example question text..."
                      ></textarea>
                    </div>

                    <div class="form-group">
                      <label>Example Correct Answer *</label>
                      <input
                        v-model="templateFormData.exampleAnswer"
                        type="text"
                        required
                        class="form-control example-field"
                        placeholder="Enter the correct answer..."
                      />
                    </div>

                    <div class="form-group">
                      <label>Example Alternative Answers (comma-separated)</label>
                      <input
                        v-model="templateFormData.exampleAlternativeAnswers"
                        type="text"
                        class="form-control"
                        placeholder="e.g., 5, 5 minutes, 5 min"
                      />
                      <small class="form-text">Other acceptable answer formats</small>
                    </div>

                    <div class="form-group">
                      <label>Example Explanation (Optional)</label>
                      <textarea
                        v-model="templateFormData.exampleExplanation"
                        rows="3"
                        class="form-control"
                        placeholder="Enter explanation for the example question..."
                      ></textarea>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Template Name *</label>
                    <input
                      v-model="templateFormData.name"
                      type="text"
                      required
                      class="form-control"
                      placeholder="e.g., Elapsed Time Word Problems"
                    />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Subject *</label>
                      <select v-model="templateFormData.subject" required class="form-control">
                        <option value="math">Math</option>
                        <option value="ela">ELA</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Topic (optional)</label>
                      <input
                        v-model="templateFormData.topic"
                        type="text"
                        class="form-control"
                        placeholder="e.g., elapsed time, fractions"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Area of Need *</label>
                    <input
                      v-model="templateFormData.areaOfNeed"
                      type="text"
                      required
                      class="form-control"
                      placeholder="e.g., Math Computation"
                    />
                  </div>

                  <div class="form-group">
                    <label>Goal Title Template *</label>
                    <input
                      v-model="templateFormData.goalTitleTemplate"
                      type="text"
                      required
                      class="form-control"
                      placeholder="e.g., {{topic}} - Grade {{gradeLevel}}"
                    />
                  </div>

                  <div class="form-group">
                    <label>Goal Text Template *</label>
                    <textarea
                      v-model="templateFormData.goalTextTemplate"
                      required
                      rows="3"
                      class="form-control"
                      placeholder="e.g., Given {{topic}}, the student will solve problems correctly"
                    ></textarea>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Default Grade Level</label>
                      <input
                        v-model.number="templateFormData.defaultGradeLevel"
                        type="number"
                        min="1"
                        max="12"
                        class="form-control"
                        placeholder="7"
                      />
                    </div>
                    <div class="form-group">
                      <label>Default Standard</label>
                      <input
                        v-model="templateFormData.defaultStandard"
                        type="text"
                        class="form-control"
                        placeholder="e.g., 7.EE.4a"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Assessment Method *</label>
                    <select v-model="templateFormData.assessmentMethod" required class="form-control">
                      <option value="app">App (Automated/Digital Assessment)</option>
                      <option value="paper">Paper (Manual Assessment/Grading)</option>
                      <option value="hybrid">Hybrid (Combination of App and Paper)</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Description (optional)</label>
                    <textarea
                      v-model="templateFormData.description"
                      rows="4"
                      class="form-control"
                      placeholder="Template description..."
                    ></textarea>
                  </div>

                  <div class="form-group">
                    <label>
                      <input
                        v-model="templateFormData.isActive"
                        type="checkbox"
                      />
                      Active (available for use)
                    </label>
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
              v-if="showTemplateFields"
              type="button"
              class="proofread-btn save-template-btn"
              @click="handleSaveTemplate"
              :disabled="!question || isGenerating"
              title="Save this question pattern as a reusable template (does not close dialog)"
            >
              💾 Save as Template
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
import type { GoalTemplate } from '@/types/iep'
import { detectGoalCharacteristics } from '@/services/goalQuestionGenerator'

const props = defineProps<{
  show: boolean
  question: PreviewQuestion | null
  isGenerating?: boolean
  goal?: any // Goal data for template creation
}>()

const emit = defineEmits<{
  close: []
  approve: [question: PreviewQuestion]
  'save-template': [templateData: any]
}>()

// Type for template data
type TemplateFormData = {
  name: string
  subject: 'math' | 'ela' | 'other'
  topic?: string
  areaOfNeed: string
  goalTitleTemplate: string
  goalTextTemplate: string
  baselineTemplate?: string
  assessmentMethod: 'app' | 'paper' | 'hybrid'
  defaultGradeLevel?: number
  defaultStandard?: string
  defaultThreshold: string
  defaultCondition: string
  description: string
  exampleGoal?: string
  isActive: boolean
}

const localQuestion = ref<PreviewQuestion | null>(null)
const showTemplateFields = ref(false)

watch(
  () => props.question,
  (newQuestion) => {
    if (newQuestion) {
      localQuestion.value = { ...newQuestion }
      // Pre-fill template form when question changes
      prefillTemplateForm()
    }
  },
  { immediate: true },
)

watch(
  () => props.goal,
  () => {
    // Re-prefill when goal changes
    if (localQuestion.value) {
      prefillTemplateForm()
    }
  },
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

const templateFormData = ref({
  name: '',
  subject: 'math' as 'math' | 'ela' | 'other',
  topic: '',
  areaOfNeed: '',
  goalTitleTemplate: '',
  goalTextTemplate: '',
  baselineTemplate: '',
  assessmentMethod: 'app' as 'app' | 'paper' | 'hybrid',
  defaultGradeLevel: undefined as number | undefined,
  defaultStandard: '',
  defaultThreshold: '80%',
  defaultCondition: 'in 3 out of 4 trials',
  description: '',
  exampleGoal: '',
  // Example question fields - MOST IMPORTANT
  exampleQuestion: '',
  exampleAnswer: '',
  exampleAlternativeAnswers: '',
  exampleExplanation: '',
  isActive: true,
})

const prefillTemplateForm = () => {
  if (!localQuestion.value) return

  const question = localQuestion.value
  const goal = props.goal

  // Extract alternative answers
  let acceptableAnswers: string[] = []
  if (question.acceptableAnswersString) {
    acceptableAnswers = question.acceptableAnswersString
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)
  } else if (question.acceptableAnswers) {
    acceptableAnswers = question.acceptableAnswers
  }

  // Create template name from question text (truncated)
  const questionPreview = question.questionText.substring(0, 50).replace(/\n/g, ' ').trim()

  // Determine subject from goal
  const subject = goal?.subject || 'math'

  // CRITICAL FIX: Auto-detect topic from QUESTION CONTENT (not just goal text)
  // The question is the actual content, goal text might be generic
  let detectedTopic = ''
  
  // PRIORITY 1: Detect from the actual question content
  const questionText = (question.questionText || '').toLowerCase()
  
  const topicKeywords = [
    { keywords: ['elapsed time', 'time elapsed', 'what time', 'start time', 'end time', 'finish', 'began at', 'started at'], topic: 'Elapsed Time' },
    { keywords: ['money', 'dollar', 'cost', 'price', 'purchase', 'buy', 'spend', 'save', 'pay'], topic: 'Money' },
    { keywords: ['fraction', 'fractions', 'numerator', 'denominator', '1/2', '1/4', '3/4'], topic: 'Fractions' },
    { keywords: ['decimal', 'decimals', '.', 'point'], topic: 'Decimals' },
    { keywords: ['percent', 'percentage', '%'], topic: 'Percentages' },
    { keywords: ['area', 'perimeter', 'volume', 'length', 'width', 'height'], topic: 'Geometry' },
    { keywords: ['equation', 'solve for', 'variable', 'x =', 'y ='], topic: 'Algebra' },
    { keywords: ['ratio', 'proportion', 'per', 'rate'], topic: 'Ratios & Proportions' },
  ]
  
  // Check question text for topic keywords
  for (const { keywords, topic: topicName } of topicKeywords) {
    if (keywords.some(k => questionText.includes(k))) {
      detectedTopic = topicName
      console.log(`✨ Auto-detected topic from QUESTION: "${detectedTopic}" (found keyword: "${keywords.find(k => questionText.includes(k))}")`)
      break
    }
  }
  
  // PRIORITY 2: Fall back to goal text if question doesn't reveal topic
  if (!detectedTopic && goal) {
    const detection = detectGoalCharacteristics(goal)
    detectedTopic = detection.topic
    console.log(`✨ Auto-detected topic from GOAL: "${detectedTopic}"`)
  }
  
  // PRIORITY 3: Generic fallback
  if (!detectedTopic) {
    detectedTopic = subject === 'math' ? 'Math' : subject === 'ela' ? 'Reading/Writing' : 'General'
    console.log(`⚠️  Using generic topic: "${detectedTopic}"`)
  }

  // Pre-fill form - EXAMPLE QUESTION IS MOST IMPORTANT
  templateFormData.value = {
    name: `Question Template: ${questionPreview}${questionPreview.length >= 50 ? '...' : ''}`,
    subject: subject as 'math' | 'ela' | 'other',
    topic: detectedTopic, // NOW PROPERLY DETECTED FROM GOAL
    areaOfNeed: goal?.areaOfNeed || 'Assessment',
    goalTitleTemplate: `{{topic}} - Grade {{gradeLevel}}`,
    goalTextTemplate: goal?.goalText || `Given {{topic}}, the student will solve problems correctly`,
    baselineTemplate: '',
    assessmentMethod: goal?.assessmentMethod || 'app',
    defaultGradeLevel: goal?.gradeLevel,
    defaultStandard: goal?.standard || '',
    defaultThreshold: '80%',
    defaultCondition: 'in 3 out of 4 trials',
    description: `Question template created from preview`,
    exampleGoal: goal?.goalText || '',
    // Example question fields - PRE-FILLED FROM PREVIEW QUESTION
    exampleQuestion: question.questionText || '',
    exampleAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : (question.correctAnswer || ''),
    exampleAlternativeAnswers: acceptableAnswers.join(', '),
    exampleExplanation: question.explanation || '',
    isActive: true,
  }

  // DON'T auto-expand template fields - let user decide if they want to save as template
  // showTemplateFields.value = true  // REMOVED - keeps template section collapsed by default
}

const handleSaveTemplate = () => {
  if (!localQuestion.value) return

  // Validate required fields
  if (!templateFormData.value.name?.trim()) {
    alert('⚠️ Please enter a Template Name.')
    return
  }

  if (!templateFormData.value.exampleQuestion?.trim() || !templateFormData.value.exampleAnswer?.trim()) {
    alert('⚠️ Please fill in the Example Question Text and Example Correct Answer fields. These are the most important parts of the template!')
    return
  }

  if (!templateFormData.value.goalTitleTemplate?.trim() || !templateFormData.value.goalTextTemplate?.trim()) {
    alert('⚠️ Please fill in the Goal Title Template and Goal Text Template fields.')
    return
  }

  // Remove undefined values before emitting
  const cleanData: any = { ...templateFormData.value }
  if (!cleanData.topic) delete cleanData.topic
  if (!cleanData.defaultGradeLevel) delete cleanData.defaultGradeLevel
  if (!cleanData.defaultStandard) delete cleanData.defaultStandard
  if (!cleanData.exampleGoal) delete cleanData.exampleGoal
  if (!cleanData.baselineTemplate) delete cleanData.baselineTemplate
  if (!cleanData.exampleAlternativeAnswers) delete cleanData.exampleAlternativeAnswers
  if (!cleanData.exampleExplanation) delete cleanData.exampleExplanation

  emit('save-template', cleanData)
  
  // DON'T close modal - let parent handle success/error feedback
  // User can continue editing or close manually
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

.save-template-btn {
  background: #17a2b8;
  color: white;
}

.save-template-btn:hover:not(:disabled) {
  background: #138496;
}

.proofread-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.template-section {
  margin-top: 2rem;
  border-top: 2px solid #dee2e6;
  padding-top: 1.5rem;
}

.template-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 1rem;
  transition: background 0.2s;
}

.template-section-header:hover {
  background: #e9ecef;
}

.template-section-header h6 {
  margin: 0;
  font-weight: 600;
  color: #495057;
  font-size: 0.9375rem;
}

.toggle-icon {
  font-size: 0.875rem;
  color: #6c757d;
}

.template-form {
  padding: 0.5rem 0;
  animation: slideDown 0.3s ease-out;
}

.example-question-section {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  color: #856404;
  font-size: 1rem;
}

.section-description {
  margin: 0 0 1rem 0;
  color: #856404;
  font-size: 0.875rem;
  font-style: italic;
}

.example-field {
  border: 2px solid #ffc107;
  background: #fff;
}

.example-field:focus {
  border-color: #ff9800;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.25);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.example-question-section {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  color: #856404;
  font-size: 1rem;
}

.section-description {
  margin: 0 0 1rem 0;
  color: #856404;
  font-size: 0.875rem;
  font-style: italic;
}

.example-field {
  border: 2px solid #ffc107;
  background: #fff;
}

.example-field:focus {
  border-color: #ff9800;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.25);
}
</style>











