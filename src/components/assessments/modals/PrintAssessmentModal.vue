<template>
  <div class="print-modal-overlay" @click="emit('close')">
    <div class="print-modal" @click.stop>
      <div class="modal-header">
        <h2>🖨️ Print Assessment</h2>
        <button @click="emit('close')" class="close-btn" type="button">×</button>
      </div>

      <div class="modal-body">
        <div class="print-options">
          <h3>Print Options</h3>

          <div class="layout-option">
            <label><strong>Layout:</strong></label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="columnLayout" value="1">
                <span>1 Column (3 problems per page)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="columnLayout" value="2">
                <span>2 Columns (6 problems per page)</span>
              </label>
            </div>
          </div>

          <label class="option-checkbox">
            <input type="checkbox" v-model="includeExplanations">
            <span>Include question explanations on printed version</span>
          </label>

          <label class="option-checkbox">
            <input type="checkbox" v-model="includeStandards">
            <span>Show standards on each question</span>
          </label>

          <label class="option-checkbox">
            <input type="checkbox" v-model="includeAnswerKey">
            <span>Include answer key (teacher copy)</span>
          </label>
        </div>

        <div class="print-preview">
          <h3>Preview</h3>
          <div class="preview-info">
            <p><strong>{{ assessment.title }}</strong></p>
            <p>{{ assessment.questions.length }} questions • {{ totalPoints }} points</p>
            <p v-if="assessment.timeLimit">Time Limit: {{ assessment.timeLimit }} minutes</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="emit('close')" class="cancel-btn" type="button">Cancel</button>
        <button @click="handlePrint" class="print-btn" type="button">🖨️ Print Now</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm'
import { renderLatexInText } from '@/utils/latexUtils'

interface Props {
  assessment: AssessmentFormData
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const includeExplanations = ref(false)
const includeStandards = ref(true)
const includeAnswerKey = ref(false)
const columnLayout = ref<'1' | '2'>('1') // Default to 1 column

const totalPoints = computed(() => {
  return props.assessment.questions.reduce((sum, q) => sum + (q.points || 0), 0)
})

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print the assessment.')
    return
  }

  const printContent = generatePrintHTML()
  printWindow.document.write(printContent)
  printWindow.document.close()

  // Wait for CSS to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 300)
  }
}

const generatePrintHTML = (): string => {
  const questions = props.assessment.questions
  const questionsPerPage = columnLayout.value === '1' ? 3 : 6

  // Split questions into pages
  const pages: any[][] = []
  for (let i = 0; i < questions.length; i += questionsPerPage) {
    pages.push(questions.slice(i, i + questionsPerPage))
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.assessment.title} - Print</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css" crossorigin="anonymous">
  <style>
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      body { margin: 0; padding: 0; }
      .page { page-break-after: always; page-break-inside: avoid; }
      .page:last-child { page-break-after: auto; }
      .question { page-break-inside: avoid; }
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
    }

    .page {
      width: 100%;
      min-height: 10in;
      box-sizing: border-box;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .header h1 {
      margin: 0 0 5px 0;
      font-size: 18pt;
      font-weight: bold;
    }

    .header .info {
      font-size: 10pt;
      margin: 5px 0;
    }

    .student-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 11pt;
    }

    .student-info .field {
      flex: 1;
      border-bottom: 1px solid #000;
      margin-right: 20px;
    }

    .student-info .field:last-child {
      margin-right: 0;
    }

    ${columnLayout.value === '2' ? `
    .questions-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      column-gap: 30px;
    }
    ` : ''}

    .question {
      margin-bottom: 20px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f9f9f9;
      ${columnLayout.value === '2' ? 'break-inside: avoid;' : ''}
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: bold;
    }

    .question-number {
      font-size: 13pt;
    }

    .question-points {
      font-size: 10pt;
      color: #666;
    }

    .question-text {
      margin-bottom: 12px;
      font-size: 11pt;
      line-height: 1.6;
    }

    .question-description {
      font-size: 9pt;
      color: #666;
      font-style: italic;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: #f5f5f5;
      border-left: 3px solid #3b82f6;
      border-radius: 3px;
    }

    .answer-space {
      border: 1px solid #000;
      min-height: ${columnLayout.value === '1' ? '80px' : '50px'};
      padding: 10px;
      background: white;
      margin-top: 10px;
    }

    .answer-space.large {
      min-height: ${columnLayout.value === '1' ? '120px' : '80px'};
    }

    .options {
      margin: 10px 0;
    }

    .option {
      margin: 8px 0;
      padding: 5px 0;
      font-size: 11pt;
    }

    .option-label {
      display: inline-block;
      width: 30px;
      font-weight: bold;
    }

    .standard-tag {
      display: inline-block;
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9pt;
      margin-top: 5px;
    }

    .answer-key {
      background: #fffbeb;
      border: 2px solid #fbbf24;
      padding: 8px;
      margin-top: 8px;
      border-radius: 4px;
    }

    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }

    /* Hide KaTeX MathML (accessibility content) */
    .katex-mathml {
      position: absolute;
      clip: rect(1px, 1px, 1px, 1px);
      padding: 0;
      border: 0;
      height: 1px;
      width: 1px;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${pages.map((pageQuestions, pageIndex) => {
    const isFirstPage = pageIndex === 0
    const isLastPage = pageIndex === pages.length - 1
    const startIndex = pageIndex * questionsPerPage

    return `
  <div class="page">
    <div class="header">
      <h1>${props.assessment.title}${!isFirstPage ? ' (continued)' : ''}</h1>
      ${isFirstPage ? `<div class="info">Grade ${props.assessment.gradeLevel} • ${props.assessment.category || 'Assessment'}</div>` : ''}
      ${isFirstPage && props.assessment.timeLimit ? `<div class="info">Time Limit: ${props.assessment.timeLimit} minutes</div>` : ''}
    </div>

    ${isFirstPage ? `
    <div class="student-info">
      <div class="field">Name: _______________________</div>
      <div class="field">Date: _______________________</div>
      <div class="field">Score: ______ / ${totalPoints.value}</div>
    </div>

    ${props.assessment.instructions ? `
    <div class="instructions">
      <strong>Instructions:</strong> ${renderLatexInText(props.assessment.instructions)}
    </div>
    ` : ''}
    ` : ''}

    <div class="${columnLayout.value === '2' ? 'questions-container' : ''}">
      ${pageQuestions.map((q, idx) => renderQuestion(q, startIndex + idx)).join('')}
    </div>

    ${isLastPage ? `<div class="footer">Total: ${questions.length} Questions • ${totalPoints.value} Points</div>` : ''}
  </div>
    `
  }).join('')}
</body>
</html>
  `.trim()
}

const renderQuestion = (q: any, index: number): string => {
  let html = `
    <div class="question">
      <div class="question-header">
        <span class="question-number">${index + 1}.</span>
        <span class="question-points">(${q.points} ${q.points === 1 ? 'point' : 'points'})</span>
      </div>
      <div class="question-text">${renderLatexInText(q.questionText || '')}</div>
      ${includeStandards.value && q.standard ? `<div class="standard-tag">Standard: ${q.standard}</div>` : ''}
  `

  // Render based on question type
  if (q.questionType === 'multiple-choice' && q.options) {
    html += `<div class="options">`
    q.options.forEach((opt: string, i: number) => {
      html += `
        <div class="option">
          <span class="option-label">${String.fromCharCode(65 + i)})</span> ${renderLatexInText(opt || '')}
        </div>
      `
    })
    html += `</div>`
  } else if (q.questionType === 'true-false') {
    html += `
      <div class="options">
        <div class="option"><span class="option-label">○</span> True</div>
        <div class="option"><span class="option-label">○</span> False</div>
      </div>
    `
  } else if (q.questionType === 'short-answer' || q.questionType === 'essay') {
    html += `<div class="answer-space ${q.questionType === 'essay' ? 'large' : ''}"></div>`
  } else if (q.questionType === 'fill-blank') {
    html += `<div class="answer-space"></div>`
  }

  // Include explanation if option is checked
  if (includeExplanations.value && q.explanation) {
    html += `<div class="question-description">📝 ${renderLatexInText(q.explanation)}</div>`
  }

  // Include answer key if option is checked (teacher copy)
  if (includeAnswerKey.value) {
    let answer = 'See answer key'
    if (q.questionType === 'multiple-choice') {
      const answerIndex = parseInt(q.correctAnswer as string)
      answer = String.fromCharCode(65 + answerIndex)
    } else if (q.questionType === 'true-false') {
      answer = q.correctAnswer as string
    } else {
      answer = q.correctAnswer as string
    }
    html += `<div class="answer-key"><strong>Answer:</strong> ${renderLatexInText(answer)}</div>`
  }

  html += `</div>`
  return html
}
</script>

<style scoped>
.print-modal-overlay {
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

.print-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.print-options h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #374151;
}

.layout-option {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.layout-option label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.9375rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.radio-label:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.radio-label span {
  font-size: 0.9375rem;
  color: #374151;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 0.5rem;
}

.option-checkbox:hover {
  background: #f9fafb;
}

.option-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.option-checkbox span {
  font-size: 0.9375rem;
  color: #374151;
}

.print-preview {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.print-preview h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #374151;
}

.preview-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
}

.cancel-btn,
.print-btn {
  flex: 1;
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.print-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.print-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

@media (max-width: 640px) {
  .print-modal-overlay {
    padding: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>
