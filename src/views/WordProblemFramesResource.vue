<template>
  <div class="frames-resource">
    <header class="resource-header">
      <div>
        <h1>📖 Word Problem Frames — How to Solve Math Stories</h1>
        <p class="subtitle">
          Click a frame type below, then use <strong>Next</strong> to see step-by-step highlighting:
          <strong>Question → Numbers → Frame → Math → Answer</strong>
        </p>
      </div>
      <div class="status-pill">
        <span class="dot"></span>
        Step-by-step guide
      </div>
    </header>

    <div class="frame-buttons">
      <button
        v-for="frame in frames"
        :key="frame.id"
        class="frame-btn"
        :class="{ active: currentFrame.id === frame.id }"
        @click="selectFrame(frame)"
      >
        {{ frame.name }}
      </button>
    </div>

    <div class="content-grid">
      <!-- Main Problem Display -->
      <div class="main-card">
        <div class="card-header">
          <h2>{{ currentFrame.name }}</h2>
          <div class="controls">
            <button class="control-btn" :disabled="stepIndex === 0" @click="prevStep">
              ← Back
            </button>
            <button
              class="control-btn primary"
              :disabled="stepIndex === steps.length - 1"
              @click="nextStep"
            >
              Next →
            </button>
            <button class="control-btn" @click="reset">Reset</button>
          </div>
        </div>

        <div class="card-body">
          <div class="section-label">
            <span>Problem</span>
            <span class="frame-name">{{ currentFrame.name }} • {{ currentFrame.rule }}</span>
          </div>
          <div class="problem-text" v-html="highlightedProblem"></div>

          <div class="section-label">
            <span>Math Sentence</span>
            <span class="step-hint">{{ currentStepHint }}</span>
          </div>
          <div class="equation-text" v-html="highlightedEquation"></div>

          <div class="section-label">
            <span>Answer</span>
            <span>(with units)</span>
          </div>
          <div class="answer-text" v-html="highlightedAnswer"></div>

          <div class="step-bar">
            <span
              v-for="(step, i) in steps"
              :key="step.key"
              class="step-chip"
              :class="{ active: i === stepIndex }"
            >
              {{ step.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Legend Card -->
      <div class="legend-card">
        <div class="card-header">
          <h2>What Gets Highlighted</h2>
        </div>
        <div class="card-body">
          <div class="legend-items">
            <div class="legend-item">
              <span class="swatch"></span>
              <div>
                <strong>Question</strong>
                <p>What we're trying to find</p>
              </div>
            </div>
            <div class="legend-item">
              <span class="swatch"></span>
              <div>
                <strong>Numbers (Givens)</strong>
                <p>Numbers + units in the story</p>
              </div>
            </div>
            <div class="legend-item">
              <span class="swatch"></span>
              <div>
                <strong>Frame</strong>
                <p>The story structure (combine/change/compare/etc.)</p>
              </div>
            </div>
            <div class="legend-item">
              <span class="swatch"></span>
              <div>
                <strong>Math Sentence</strong>
                <p>One clean equation to solve</p>
              </div>
            </div>
            <div class="legend-item">
              <span class="swatch"></span>
              <div>
                <strong>Answer</strong>
                <p>Final answer with units</p>
              </div>
            </div>
          </div>

          <div class="teacher-tip">
            💡 <strong>Tip:</strong> After finding the numbers, ask yourself:
            <em>"Which frame fits this story?"</em> (Not "what keyword do I see?")
          </div>

          <div class="full-guide-section">
            <h3>Full Solving Guide</h3>
            <pre class="guide-text">{{ currentFrame.studentGuide }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { WORD_PROBLEM_FRAMES } from '@/utils/wordProblemFrames'

const steps = [
  { key: 'question', label: '1) Question' },
  { key: 'givens', label: '2) Numbers' },
  { key: 'frame', label: '3) Frame' },
  { key: 'equation', label: '4) Math' },
  { key: 'answer', label: '5) Answer' },
]

const stepHints = {
  question: 'Find what you need to solve for',
  givens: 'Find all the numbers and units',
  frame: 'Identify the story structure',
  equation: 'Write one clean math sentence',
  answer: 'State the answer with units',
}

// Convert frames to array with HTML markup
const frames = Object.values(WORD_PROBLEM_FRAMES).map((frame) => ({
  ...frame,
  problemHTML: markupExample(frame.example.problem, 'problem'),
  equationHTML: markupExample(frame.example.equation, 'equation'),
  answerHTML: markupExample(frame.example.answer, 'answer'),
}))

const currentFrame = ref(frames[0])
const stepIndex = ref(0)

const currentStep = computed(() => steps[stepIndex.value]?.key)
const currentStepHint = computed(() => stepHints[currentStep.value as keyof typeof stepHints] || '')

function markupExample(text: string, type: 'problem' | 'equation' | 'answer'): string {
  if (type === 'problem') {
    // Mark numbers as "givens" and last sentence as "question"
    const sentences = text.split(/\.\s+/)
    const lastSentence = sentences[sentences.length - 1]
    const otherSentences = sentences.slice(0, -1).join('. ')

    // Simple number detection (for demo purposes)
    const markedOther = otherSentences.replace(/(\d+\s*[a-zA-Z]+)/g, '<span data-role="given">$1</span>')
    const markedQuestion = `<span data-role="question">${lastSentence}</span>`

    return markedOther ? `${markedOther}. ${markedQuestion}` : markedQuestion
  }

  if (type === 'equation') {
    // Mark numbers as givens, whole equation as equation
    const markedNumbers = text.replace(/(\d+)/g, '<span data-role="given">$1</span>')
    return `<span data-role="equation">${markedNumbers}</span>`
  }

  if (type === 'answer') {
    return `<span data-role="answer">${text}</span>`
  }

  return text
}

const highlightedProblem = computed(() => {
  return applyHighlight(currentFrame.value.problemHTML)
})

const highlightedEquation = computed(() => {
  return applyHighlight(currentFrame.value.equationHTML)
})

const highlightedAnswer = computed(() => {
  return applyHighlight(currentFrame.value.answerHTML)
})

function applyHighlight(html: string): string {
  const step = currentStep.value

  if (step === 'frame') {
    // Don't highlight anything in the text during frame step
    return html
  }

  // Replace data-role spans with highlighted versions
  return html.replace(
    /<span data-role="([^"]+)">([^<]+)<\/span>/g,
    (match, role, content) => {
      if (role === step) {
        return `<span class="highlight strong">${content}</span>`
      }
      return `<span class="highlight">${content}</span>`
    },
  )
}

function selectFrame(frame: any) {
  currentFrame.value = frame
  stepIndex.value = 0
}

function nextStep() {
  if (stepIndex.value < steps.length - 1) {
    stepIndex.value++
  }
}

function prevStep() {
  if (stepIndex.value > 0) {
    stepIndex.value--
  }
}

function reset() {
  stepIndex.value = 0
}
</script>

<style scoped>
.frames-resource {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.resource-header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.5;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  font-size: 13px;
  white-space: nowrap;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.3);
}

.frame-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.frame-btn {
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 999px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.frame-btn:hover {
  border-color: #667eea;
  transform: translateY(-1px);
}

.frame-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.main-card,
.legend-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  background: linear-gradient(to right, #f9fafb, #f3f4f6);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #667eea;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn.primary {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.control-btn.primary:hover:not(:disabled) {
  background: #5568d3;
}

.card-body {
  padding: 20px;
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.frame-name {
  color: #667eea;
  font-weight: 700;
}

.step-hint {
  color: #f59e0b;
  font-style: italic;
}

.problem-text,
.equation-text,
.answer-text {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.6;
}

.problem-text {
  background: #fef3c7;
  border: 2px dashed #fbbf24;
}

.equation-text {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.answer-text {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.highlight {
  background: linear-gradient(transparent 55%, rgba(255, 227, 138, 0.8) 55%);
  padding: 0 4px;
  border-radius: 4px;
}

.highlight.strong {
  background: #fde047;
  color: #1f2937;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(253, 224, 71, 0.3);
}

.step-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.step-chip {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 999px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.step-chip.active {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #92400e;
}

.legend-items {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fde047;
  box-shadow: 0 0 0 4px rgba(253, 224, 71, 0.2);
  flex-shrink: 0;
  margin-top: 4px;
}

.legend-item strong {
  display: block;
  color: #1f2937;
  margin-bottom: 4px;
}

.legend-item p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.teacher-tip {
  padding: 12px;
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.5;
  margin-bottom: 20px;
}

.teacher-tip strong {
  color: #1e3a8a;
}

.full-guide-section {
  margin-top: 20px;
}

.full-guide-section h3 {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 12px;
}

.guide-text {
  background: #f9fafb;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: #374151;
}
</style>

