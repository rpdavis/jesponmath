<template>
  <div class="template-question-editor">
    <div class="editor-header">
      <h3>📝 Template Questions ({{questions.length}}/{{numberOfQuestions}})</h3>
      <p>These {{numberOfQuestions}} questions define your template and will be used to generate assessments.</p>
      
      <div class="header-actions">
        <button 
          v-if="!questions || questions.length === 0" 
          @click="generateQuestions" 
          class="btn btn-primary"
          :disabled="generating"
        >
          {{ generating ? '🤖 Generating...' : `🤖 Generate ${numberOfQuestions} Questions with AI` }}
        </button>
        <button 
          v-else 
          @click="regenerateQuestions" 
          class="btn btn-secondary"
          :disabled="generating"
        >
          {{ generating ? '🤖 Regenerating...' : '🔄 Regenerate All' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="questions && questions.length > 0" class="questions-list">
      <div 
        v-for="(question, index) in questions" 
        :key="question.id" 
        class="question-card"
      >
        <div class="question-header">
          <span class="question-number">Question {{ index + 1 }}</span>
          <select 
            v-model="question.questionType" 
            class="question-type-select"
            @change="onQuestionTypeChange(index)"
          >
            <option value="short-answer">Short Answer</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="fraction">Fraction</option>
            <option value="fill-blank">Fill in the Blank</option>
            <option value="true-false">True/False</option>
          </select>
        </div>

        <div class="question-body">
          <div class="form-group">
            <label>Question Text</label>
            <textarea 
              v-model="question.questionText" 
              rows="3"
              placeholder="Enter the question text (LaTeX supported: use \\frac{1}{2} for fractions)"
              class="form-control"
            ></textarea>
            <small class="form-help">💡 Tip: Use double backslashes for LaTeX (\\frac, \\times). For money: $\$25.50$</small>
            
            <!-- KaTeX Preview -->
            <div v-if="question.questionText" class="katex-preview">
              <div class="preview-label">📐 Preview:</div>
              <div class="preview-content" v-html="renderQuestionPreview(question.questionText)"></div>
            </div>
          </div>

          <!-- Short Answer -->
          <div v-if="question.questionType === 'short-answer'" class="form-row">
            <div class="form-group">
              <label>Correct Answer</label>
              <input 
                v-model="question.correctAnswer" 
                type="text"
                placeholder="e.g., 42"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Alternative Answers (comma-separated, optional)</label>
              <input 
                v-model="question.acceptableAnswersString" 
                type="text"
                placeholder="e.g., 42.0, forty-two"
                class="form-control"
                @input="updateAcceptableAnswers(index)"
              />
            </div>
          </div>

          <!-- Multiple Choice -->
          <div v-if="question.questionType === 'multiple-choice'" class="form-group">
            <label>Options (one per line, mark correct with *)</label>
            <textarea 
              v-model="question.optionsString" 
              rows="4"
              placeholder="*Correct answer&#10;Wrong answer 1&#10;Wrong answer 2&#10;Wrong answer 3"
              class="form-control"
              @input="updateOptions(index)"
            ></textarea>
            <small class="form-help">💡 Mark the correct answer with * at the beginning</small>
          </div>

          <!-- Fraction -->
          <div v-if="question.questionType === 'fraction'" class="form-row">
            <div class="form-group">
              <label>Correct Answer (as fraction)</label>
              <input 
                v-model="question.correctAnswer" 
                type="text"
                placeholder="e.g., 1/2 or 3/4"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>
                <input 
                  v-model="question.acceptEquivalentFractions" 
                  type="checkbox"
                />
                Accept Equivalent Fractions
              </label>
              <small class="form-help">If checked, 1/2 = 2/4 = 3/6, etc.</small>
            </div>
          </div>

          <!-- Fill in the Blank -->
          <div v-if="question.questionType === 'fill-blank'" class="form-row">
            <div class="form-group">
              <label>Correct Answer</label>
              <input 
                v-model="question.correctAnswer" 
                type="text"
                placeholder="e.g., 15"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Blank Format (optional)</label>
              <input 
                v-model="question.blankFormat" 
                type="text"
                placeholder="e.g., ___ apples"
                class="form-control"
              />
            </div>
          </div>

          <!-- True/False -->
          <div v-if="question.questionType === 'true-false'" class="form-group">
            <label>Correct Answer</label>
            <select v-model="question.correctAnswer" class="form-control">
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Points</label>
              <input 
                v-model.number="question.points" 
                type="number"
                min="1"
                max="10"
                class="form-control points-input"
              />
            </div>
            <div class="form-group">
              <label>Standard (optional)</label>
              <input 
                v-model="question.standard" 
                type="text"
                placeholder="e.g., 7.NS.A.1"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Explanation (optional)</label>
            <textarea 
              v-model="question.explanation" 
              rows="2"
              placeholder="Brief explanation of how to solve this problem..."
              class="form-control"
            ></textarea>
          </div>
        </div>

        <div class="question-actions">
          <button 
            @click="duplicateQuestion(index)" 
            class="btn btn-sm btn-secondary"
            title="Duplicate this question"
          >
            📋 Duplicate
          </button>
          <button 
            v-if="questions.length > 1"
            @click="deleteQuestion(index)" 
            class="btn btn-sm btn-danger"
            title="Delete this question"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <button 
        v-if="questions.length < numberOfQuestions" 
        @click="addQuestion" 
        class="btn btn-secondary add-question-btn"
      >
        ➕ Add Question ({{ questions.length }}/{{ numberOfQuestions }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TemplateQuestion } from '@/types/iep'
import { generateTemplateQuestions } from '@/services/templateQuestionGenerator'
import { renderLatexInText } from '@/utils/latexUtils'

const props = defineProps<{
  modelValue: TemplateQuestion[]
  numberOfQuestions: number // Number of questions to generate (1-20)
  goalText: string
  goalTitle: string
  areaOfNeed: string
  gradeLevel?: number
  standard?: string
  questionCategory?: '' | 'computation' | 'word-problem' | 'conceptual' | 'application'
  exampleQuestion?: string
  exampleAnswer?: string
  exampleExplanation?: string
  customAIPrompt?: string
  allowedOperations?: string[]
  problemStructure?: {
    numberOfSteps?: 1 | 2 | 3 | 4
    questionTypesText?: string
    contextTypesText?: string
    numberRanges?: {
      question1: string
      question2: string
      question3: string
      question4: string
      question5: string
    }
    forbiddenPatternsText?: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TemplateQuestion[]): void
}>()

const questions = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value),
})

const generating = ref(false)
const error = ref('')

// Generate initial questions with AI
const generateQuestions = async () => {
  if (!props.goalText || !props.goalTitle) {
    error.value = 'Please fill in Goal Title and Goal Text first.'
    return
  }

  try {
    generating.value = true
    error.value = ''

    // Convert problemStructure from form format to AI format
    const problemStructure = props.problemStructure ? {
      numberOfSteps: props.problemStructure.numberOfSteps,
      questionTypes: props.problemStructure.questionTypesText?.split(',').map(s => s.trim()).filter(Boolean),
      contextTypes: props.problemStructure.contextTypesText?.split(',').map(s => s.trim()).filter(Boolean),
      numberRanges: props.problemStructure.numberRanges ? Object.values(props.problemStructure.numberRanges) : undefined,
      forbiddenPatterns: props.problemStructure.forbiddenPatternsText?.split(',').map(s => s.trim()).filter(Boolean),
    } : undefined

    const generated = await generateTemplateQuestions({
      goalText: props.goalText,
      goalTitle: props.goalTitle,
      areaOfNeed: props.areaOfNeed,
      gradeLevel: props.gradeLevel,
      standard: props.standard,
      numberOfQuestions: props.numberOfQuestions,
      questionCategory: (props.questionCategory && props.questionCategory.length > 0) ? props.questionCategory as 'computation' | 'word-problem' | 'conceptual' | 'application' : undefined,
      exampleQuestion: props.exampleQuestion,
      exampleAnswer: props.exampleAnswer,
      exampleExplanation: props.exampleExplanation,
      customAIPrompt: props.customAIPrompt,
      allowedOperations: props.allowedOperations,
      problemStructure,
    })

    // Add helper fields for editing
    const questionsWithHelpers = generated.map((q: TemplateQuestion) => ({
      ...q,
      acceptableAnswersString: q.acceptableAnswers ? q.acceptableAnswers.join(', ') : '',
      optionsString: formatOptionsString(q),
    }))

    questions.value = questionsWithHelpers
  } catch (err) {
    console.error('Error generating questions:', err)
    error.value = err instanceof Error ? err.message : 'Failed to generate questions'
  } finally {
    generating.value = false
  }
}

// Regenerate all questions
const regenerateQuestions = async () => {
  if (!confirm('This will replace all current questions. Are you sure?')) {
    return
  }
  await generateQuestions()
}

// Format options for display in textarea
const formatOptionsString = (question: TemplateQuestion): string => {
  if (!question.options || question.options.length === 0) return ''
  
  return question.options
    .map((opt, idx) => {
      const isCorrect = question.correctAnswer === opt || question.correctAnswer === String(idx)
      return isCorrect ? `*${opt}` : opt
    })
    .join('\n')
}

// Update acceptable answers from string
const updateAcceptableAnswers = (index: number) => {
  const q = questions.value[index]
  if (q.acceptableAnswersString) {
    q.acceptableAnswers = q.acceptableAnswersString
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s)
  } else {
    q.acceptableAnswers = []
  }
}

// Update options from string
const updateOptions = (index: number) => {
  const q = questions.value[index]
  if (q.optionsString) {
    const lines = q.optionsString.split('\n').filter((l: string) => l.trim())
    q.options = lines.map((l: string) => l.replace(/^\*/, '').trim())
    
    // Set correct answer
    const correctIndex = lines.findIndex((l: string) => l.trim().startsWith('*'))
    if (correctIndex !== -1 && q.options) {
      q.correctAnswer = q.options[correctIndex]
    }
  }
}

// Question type changed
const onQuestionTypeChange = (index: number) => {
  const q = questions.value[index]
  
  // Reset type-specific fields
  q.options = undefined
  q.optionsString = ''
  q.acceptEquivalentFractions = undefined
  q.blankFormat = undefined
  
  // Set defaults based on type
  if (q.questionType === 'multiple-choice') {
    q.options = ['', '', '', '']
    q.optionsString = '*\n\n\n'
  } else if (q.questionType === 'fraction') {
    q.acceptEquivalentFractions = true
  } else if (q.questionType === 'true-false') {
    q.correctAnswer = 'True'
  }
}

// Add a new blank question
const addQuestion = () => {
  if (questions.value.length >= props.numberOfQuestions) return
  
  const newQuestion: TemplateQuestion = {
    id: `q${questions.value.length + 1}`,
    questionText: '',
    questionType: 'short-answer',
    correctAnswer: '',
    acceptableAnswers: [],
    points: 1,
    explanation: '',
    standard: props.standard || '',
    acceptableAnswersString: '',
  }
  
  questions.value = [...questions.value, newQuestion]
}

// Duplicate a question
const duplicateQuestion = (index: number) => {
  if (questions.value.length >= props.numberOfQuestions) {
    alert(`Maximum ${props.numberOfQuestions} questions allowed.`)
    return
  }
  
  const original = questions.value[index]
  const duplicate: TemplateQuestion = {
    ...original,
    id: `q${questions.value.length + 1}`,
  }
  
  questions.value = [...questions.value, duplicate]
}

// Delete a question
const deleteQuestion = (index: number) => {
  if (!confirm('Delete this question?')) return
  
  const newQuestions = questions.value.filter((_, i) => i !== index)
  // Renumber IDs
  questions.value = newQuestions.map((q, i) => ({
    ...q,
    id: `q${i + 1}`,
  }))
}

// Render KaTeX preview
const renderQuestionPreview = (text: string): string => {
  try {
    return renderLatexInText(text)
  } catch (error) {
    console.error('Error rendering LaTeX preview:', error)
    return `<span style="color: red;">⚠️ LaTeX Error: ${error instanceof Error ? error.message : 'Invalid syntax'}</span>`
  }
}
</script>

<style scoped>
.template-question-editor {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.editor-header {
  margin-bottom: 1.5rem;
}

.editor-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
}

.editor-header p {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.error-message {
  padding: 0.75rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.question-number {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.question-type-select {
  padding: 0.4rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.question-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #555;
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #4285f4;
}

textarea.form-control {
  resize: vertical;
  font-family: inherit;
}

.form-help {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.katex-preview {
  margin-top: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.preview-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.preview-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #212529;
}

/* Hide MathML for visual rendering */
.katex-preview .katex-mathml {
  display: none;
}

/* Ensure KaTeX display math is block-level */
.katex-preview .katex-display {
  display: block !important;
  text-align: center;
  margin: 1em 0;
}

.points-input {
  max-width: 100px;
}

.question-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357ae8;
}

.btn-secondary {
  background: #f1f1f1;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #da190b;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-question-btn {
  align-self: center;
  margin-top: 0.5rem;
}
</style>
