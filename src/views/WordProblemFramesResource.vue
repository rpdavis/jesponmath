<template>
  <div class="frames-resource">
    <!-- Concise Problem-Solving Tips Header -->
    <header class="tips-header">
      <div class="tips-content">
        <strong>Problem-Solving Tips:</strong>
        Read 3 times • Identify what you know • Find what you need • Check your answer makes sense
      </div>
    </header>

    <div class="content-grid">
      <!-- Left: CUBES Guide Card -->
      <div class="legend-card cubes-panel">
        <div class="card-body">
          <div class="cubes-steps">
            <!-- C: Circle -->
            <div class="cubes-step-accordion" :class="{ expanded: currentStep === 'circle', active: currentStep === 'circle' }">
              <div class="step-header">
                <div class="step-icon">C</div>
                <div class="step-content">
                  <strong>Circle the Numbers</strong>
                  <p>Find all numbers, units, and number words</p>
                </div>
              </div>
              <div class="step-details" v-if="currentStep === 'circle'">
                <div class="step-detail-content">
                  <strong>Look for:</strong>
                  <ul>
                    <li>Numbers (7, 12, 3.5)</li>
                    <li>Number words (dozen, half, several)</li>
                    <li>Units (apples, dollars, minutes)</li>
                  </ul>
                  <p class="step-tip">💡 Circle each number with its associated word or unit to keep context.</p>
                </div>
              </div>
            </div>

            <!-- U: Underline -->
            <div class="cubes-step-accordion" :class="{ expanded: currentStep === 'underline', active: currentStep === 'underline' }">
              <div class="step-header">
                <div class="step-icon">U</div>
                <div class="step-content">
                  <strong>Underline the Question</strong>
                  <p>What are you trying to find? What does the problem ask?</p>
                </div>
              </div>
              <div class="step-details" v-if="currentStep === 'underline'">
                <div class="step-detail-content">
                  <strong>Common question words:</strong>
                  <ul>
                    <li>How many...?</li>
                    <li>How much...?</li>
                    <li>What is...?</li>
                    <li>Find the...</li>
                  </ul>
                  <p class="step-tip">💡 The question is usually in the last sentence of the problem.</p>
                </div>
              </div>
            </div>

            <!-- B: Box -->
            <div class="cubes-step-accordion" :class="{ expanded: currentStep === 'box', active: currentStep === 'box' }">
              <div class="step-header">
                <div class="step-icon">B</div>
                <div class="step-content">
                  <strong>Box the Key Words</strong>
                  <p>Look for action words that give clues</p>
                </div>
              </div>
              <div class="step-details" v-if="currentStep === 'box'">
                <div class="step-detail-content">
                  <div v-if="keywordExplanations.length > 0">
                    <strong>Key Words in This Problem:</strong>
                    <div v-for="(explanation, idx) in keywordExplanations" :key="idx" class="keyword-explanation-item-compact">
                      <strong>"{{ explanation.keyword }}"</strong> — {{ explanation.meaning }}
                    </div>
                  </div>
                  <strong>Key word examples:</strong>
                  <ul>
                    <li>Addition: total, sum, altogether, in all</li>
                    <li>Subtraction: difference, less, fewer, left</li>
                    <li>Multiplication: times, each, per, groups of</li>
                    <li>Division: divided, split, shared, each</li>
                  </ul>
                  <p class="step-tip">⚠️ Remember: Key words are helpful clues, but always read the whole problem to understand the context!</p>
                </div>
              </div>
            </div>

            <!-- E: Evaluate -->
            <div class="cubes-step-accordion" :class="{ expanded: currentStep === 'evaluate', active: currentStep === 'evaluate' }">
              <div class="step-header">
                <div class="step-icon">E</div>
                <div class="step-content">
                  <strong>Evaluate</strong>
                  <p>Cross out extra info. Does your plan make sense?</p>
                </div>
              </div>
              <div class="step-details" v-if="currentStep === 'evaluate'">
                <div class="step-detail-content">
                  <strong>Ask yourself:</strong>
                  <ul>
                    <li>Does my plan make sense?</li>
                    <li>What information do I need?</li>
                    <li>What information is extra?</li>
                    <li>Have I identified all the important parts?</li>
                  </ul>
                  <p class="step-tip">💡 Cross out or dim information that isn't needed to solve the problem.</p>
                </div>
              </div>
            </div>

            <!-- S: Solve -->
            <div class="cubes-step-accordion" :class="{ expanded: currentStep === 'solve', active: currentStep === 'solve' }">
              <div class="step-header">
                <div class="step-icon">S</div>
                <div class="step-content">
                  <strong>Solve & Check</strong>
                  <p>Show your work and label your answer with units</p>
                </div>
              </div>
              <div class="step-details" v-if="currentStep === 'solve'">
                <div class="step-detail-content">
                  <strong>Steps:</strong>
                  <ul>
                    <li>Write the number sentence</li>
                    <li>Solve step by step</li>
                    <li>Check your answer</li>
                    <li>Include units in your answer</li>
                  </ul>
                  <p class="step-tip">✅ Always check: Does your answer make sense in the context of the problem?</p>
                </div>
              </div>
            </div>
          </div>

          <div class="teacher-tip">
            💡 <strong>Important:</strong> Key words are helpful clues, but <em>always</em> read
            the whole problem to understand the situation. Don't just look for keywords!
          </div>
        </div>
      </div>

      <!-- Main Problem Display -->
      <div class="main-card problem-panel">
        <div class="card-header">
          <select v-model="selectedFrameId" @change="onFrameChange" class="frame-dropdown-inline">
            <option v-for="frame in frames" :key="frame.id" :value="frame.id">
              {{ frame.name }}
            </option>
          </select>
          <div class="controls">
            <button class="control-btn" :disabled="stepIndex === 0" @click="prevStep">
              ← Back
            </button>
            <button
              class="control-btn primary"
              :class="{ 'next-button-animated': showNextButtonAnimation }"
              :disabled="stepIndex === steps.length - 1"
              @click="nextStep"
            >
              <span class="next-button-text">Next →</span>
            </button>
            <button class="control-btn" @click="reset">Reset</button>
          </div>
        </div>

        <div class="card-body">
          <!-- Word Problem Area with embedded equation and answer -->
          <div class="problem-container">
            <div class="section-label-compact">
              <span>Problem</span>
              <span class="frame-name-compact">{{ currentFrame.rule }}</span>
            </div>
            <div class="problem-text" :class="{ 'evaluating': currentStep === 'evaluate' }" v-html="highlightedProblem"></div>

            <!-- Math Sentence and Answer inline -->
            <div class="grid-two">
              <div class="equation-inline" :class="{ 'has-step': currentStep === 'solve' }">
                <div class="section-label-compact">
                  <span>Math Sentence</span>
                </div>
                <div class="equation-text-inline" v-html="highlightedEquation"></div>
              </div>
              <div class="answer-inline" :class="{ 'has-step': currentStep === 'solve' }">
                <div class="section-label-compact">
                  <span>Answer</span>
                  <span>(with units)</span>
                </div>
                <div class="answer-text-inline" v-html="highlightedAnswer"></div>
              </div>
            </div>
          </div>

          <!-- Common Cue Reference Card Inline (Accordion) -->
          <div class="cue-reference-inline">
            <div class="cue-reference-header" @click="toggleCueReference">
              <h4>Common Cue Words Reference</h4>
              <span class="cue-toggle-icon">{{ showCueReference ? '−' : '+' }}</span>
            </div>
            <div v-if="showCueReference" class="cue-reference-content">
              <div class="cue-words-grid-compact">
                <div class="cue-word-category-compact">
                  <strong>➕ Addition:</strong> sum, total, altogether, in all, combined
                </div>
                <div class="cue-word-category-compact">
                  <strong>➖ Subtraction:</strong> difference, less, fewer, left, remain
                </div>
                <div class="cue-word-category-compact">
                  <strong>✖️ Multiplication:</strong> times, product, each, per, groups of
                </div>
                <div class="cue-word-category-compact">
                  <strong>➗ Division:</strong> divided, split, shared, each, per, average
                </div>
              </div>
              <div class="cue-warning-compact">
                ⚠️ <strong>Caution:</strong> These words are helpful hints, but they don't always mean what you think! Always read the full problem.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { WORD_PROBLEM_FRAMES } from '@/utils/wordProblemFrames'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// CUBES keywords from the B (Box) step - these are the keywords shown to students
const CUBES_KEYWORDS = {
  addition: ['total', 'sum', 'altogether', 'in all'],
  subtraction: ['difference', 'less', 'fewer', 'left'],
  multiplication: ['times', 'each', 'per', 'groups of'],
  division: ['divided', 'split', 'shared', 'each'],
}

const steps = [
  { key: 'default', label: 'Start' }, // Step 0 - default, no indicators
  { key: 'circle', label: 'C) Circle' }, // Step 1
  { key: 'underline', label: 'U) Underline' }, // Step 2
  { key: 'box', label: 'B) Box' }, // Step 3
  { key: 'evaluate', label: 'E) Evaluate' }, // Step 4
  { key: 'solve', label: 'S) Solve' }, // Step 5
]

// Color palette for number mapping
const numberColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Extract numbers with their associated words from problem text
function extractNumbersWithContext(text: string): Array<{ number: string; fullText: string; color: string }> {
  const numbers: Array<{ number: string; fullText: string; color: string }> = []
  // Match dollar amounts first (like "$45" or "$45.50")
  const dollarRegex = /\$(\d+\.?\d*)/g
  let match
  let colorIndex = 0
  const processedNumbers = new Set<string>()

  // First, find dollar amounts
  while ((match = dollarRegex.exec(text)) !== null) {
    const number = match[1] // Just the number part
    const fullDollarAmount = match[0] // "$45" or "$45.50"
    if (!processedNumbers.has(fullDollarAmount)) {
      numbers.push({
        number,
        fullText: fullDollarAmount, // Store "$45" as fullText
        color: numberColors[colorIndex % numberColors.length],
      })
      processedNumbers.add(fullDollarAmount)
      colorIndex++
    }
  }

  // Then find numbers with words after them (like "7 red balloons" or "5 apples")
  // This regex captures: number, optional word(s) after it
  // Skip if already processed as dollar amount
  const regex = /(\d+\.?\d*)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/g
  while ((match = regex.exec(text)) !== null) {
    const number = match[1]
    const words = match[2]
    const fullText = `${number} ${words}`
    if (!processedNumbers.has(number) && !processedNumbers.has(fullText)) {
      numbers.push({
        number,
        fullText,
        color: numberColors[colorIndex % numberColors.length],
      })
      processedNumbers.add(number)
      processedNumbers.add(fullText)
      colorIndex++
    }
  }

  // Finally, find standalone numbers (not already captured and not part of dollar amounts)
  // But skip numbers that are immediately after a dollar sign
  const standaloneRegex = /\b(\d+\.?\d*)\b/g
  while ((match = standaloneRegex.exec(text)) !== null) {
    const number = match[1]
    // Check if this number is part of a dollar amount (look before the match)
    const beforeMatch = text.substring(0, match.index)
    const isDollarAmount = beforeMatch.trim().endsWith('$')
    // Also check if this number was already processed as part of a dollar amount
    const wasDollarAmount = Array.from(processedNumbers).some(proc => proc.startsWith('$') && proc.includes(number))
    if (!processedNumbers.has(number) && !isDollarAmount && !wasDollarAmount) {
      numbers.push({
        number,
        fullText: number,
        color: numberColors[colorIndex % numberColors.length],
      })
      processedNumbers.add(number)
      colorIndex++
    }
  }

  return numbers
}

// Define markupExample before using it
function markupExample(
  text: string,
  type: 'problem' | 'equation' | 'answer',
  numbers?: Array<{ number: string; fullText: string; color: string }>,
): string {
  if (type === 'problem') {
    // Find the last sentence (ending with . or ?)
    // Match everything up to the last sentence-ending punctuation
    const lastSentenceMatch = text.match(/([^.!?]*[.!?]?\s*)$/)
    const lastSentence = lastSentenceMatch ? lastSentenceMatch[1].trim() : text
    const otherSentences = text.substring(0, text.length - lastSentence.length).trim()

    // Mark numbers with their associated words as "circle"
    let markedOther = otherSentences
    if (numbers && numbers.length > 0) {
      // Process numbers with words first (longer matches first)
      const sortedNumbers = [...numbers].sort((a, b) => b.fullText.length - a.fullText.length)

      sortedNumbers.forEach((numData) => {
        // Check if this is a dollar amount (fullText starts with $)
        const isDollarAmount = numData.fullText.startsWith('$')

        if (isDollarAmount) {
          // For dollar amounts, match the full "$45" or "$45.50" pattern
          // Use word boundary or punctuation to ensure we don't match beyond the dollar amount
          const escapedDollarAmount = numData.fullText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // Match dollar amount followed by word boundary, punctuation, or end of string
          const regex = new RegExp(`(${escapedDollarAmount})(?=\\s|$|[.,!?;:])`, 'g')
          markedOther = markedOther.replace(regex, (match) => {
            // Only replace if not already wrapped
            if (!match.includes('<span')) {
              return `<span data-role="circle" data-number="${numData.number}" data-color="${numData.color}">${match}</span>`
            }
            return match
          })
        } else if (numData.fullText.includes(' ')) {
          // If fullText includes words, match the full phrase
          const fullPhrase = numData.fullText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`\\b${fullPhrase}\\b`, 'g')
          markedOther = markedOther.replace(regex, (match) => {
            // Only replace if not already wrapped
            if (!match.includes('<span')) {
              return `<span data-role="circle" data-number="${numData.number}" data-color="${numData.color}">${match}</span>`
            }
            return match
          })
        } else {
          // Standalone number - only match if not already part of a wrapped phrase
          const escapedNumber = numData.number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`\\b${escapedNumber}\\b(?!\\s*[a-zA-Z])`, 'g')
          markedOther = markedOther.replace(regex, (match) => {
            // Only replace if not already wrapped
            if (!match.includes('<span')) {
              return `<span data-role="circle" data-number="${numData.number}" data-color="${numData.color}">${match}</span>`
            }
            return match
          })
        }
      })
    } else {
      // Fallback: simple number matching
      markedOther = markedOther.replace(/(\d+\.?\d*\s*[a-zA-Z]+|\d+)/g, (match) => {
        return `<span data-role="circle">${match}</span>`
      })
    }

    // Mark question as "underline" - ensure it includes the question mark or period
    const markedQuestion = `<span data-role="underline">${lastSentence}</span>`

    // Store the text for keyword marking (only during box step)
    // Combine sentences - add space between if other sentences exist
    const result = markedOther ? `${markedOther} ${markedQuestion}` : markedQuestion
    return result
  }

  if (type === 'equation') {
    // Store the raw equation for animation
    return text
  }

  if (type === 'answer') {
    return text
  }

  return text
}

// Convert frames to array with HTML markup
const frames = Object.values(WORD_PROBLEM_FRAMES).map((frame) => {
  const numbers = extractNumbersWithContext(frame.example.problem)
  return {
    ...frame,
    problemHTML: markupExample(frame.example.problem, 'problem', numbers),
    equationHTML: markupExample(frame.example.equation, 'equation', numbers),
    answerHTML: markupExample(frame.example.answer, 'answer', numbers),
    numberMapping: numbers,
  }
})

const currentFrame = ref(frames[0])
const selectedFrameId = ref(frames[0].id)
const stepIndex = ref(0)
const equationAnimationStep = ref(0)
const showNextButtonAnimation = ref(false)
const showCueReference = ref(false)

function onFrameChange() {
  const frame = frames.find(f => f.id === selectedFrameId.value)
  if (frame) {
    selectFrame(frame)
  }
}

function toggleCueReference() {
  showCueReference.value = !showCueReference.value
}

// One-time animation for Next button after load
onMounted(() => {
  setTimeout(() => {
    showNextButtonAnimation.value = true
    // Remove animation class after animation completes
    setTimeout(() => {
      showNextButtonAnimation.value = false
    }, 2000)
  }, 500)
})

const currentStep = computed(() => steps[stepIndex.value]?.key)

// Keyword explanations for the current problem
const keywordExplanations = computed(() => {
  if (!currentFrame.value || currentStep.value !== 'box') return []

  const problem = currentFrame.value.example.problem.toLowerCase()
  const frame = currentFrame.value
  const explanations: Array<{ keyword: string; meaning: string }> = []

  // Check frame-specific keywords
  if (frame.keywords) {
    frame.keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase()
      // Check if keyword appears in problem (handle multi-word keywords)
      if (keywordLower.includes(' ')) {
        // Multi-word keyword like "in all"
        if (problem.includes(keywordLower)) {
          explanations.push({
            keyword,
            meaning: getKeywordMeaning(keyword, frame.id),
          })
        }
      } else {
        // Single word keyword
        const regex = new RegExp(`\\b${keywordLower}\\b`, 'i')
        if (regex.test(problem)) {
          explanations.push({
            keyword,
            meaning: getKeywordMeaning(keyword, frame.id),
          })
        }
      }
    })
  }

  // Also check common keywords
  const commonKeywords = [
    { word: 'in all', meaning: 'This means we are finding the total by adding groups together.' },
    { word: 'total', meaning: 'This means we are finding the sum of all parts.' },
    { word: 'altogether', meaning: 'This means we are combining all the groups.' },
    { word: 'how many', meaning: 'This is asking for a count or number.' },
    { word: 'how much', meaning: 'This is asking for an amount or quantity.' },
  ]

  commonKeywords.forEach(({ word, meaning }) => {
    if (problem.includes(word.toLowerCase()) && !explanations.find(e => e.keyword.toLowerCase() === word.toLowerCase())) {
      explanations.push({ keyword: word, meaning })
    }
  })

  return explanations
})

function getKeywordMeaning(keyword: string, frameId: string): string {
  const keywordLower = keyword.toLowerCase()
  const meanings: Record<string, Record<string, string>> = {
    combine: {
      'in all': 'In this problem, "in all" means we are adding the groups together to find the total.',
      'total': 'In this problem, "total" means we are combining all parts to find the sum.',
      'altogether': 'In this problem, "altogether" means we are putting all groups together.',
    },
    change: {
      'now': 'In this problem, "now" means we are finding the final amount after something changed.',
      'left': 'In this problem, "left" means what remains after something was taken away.',
      'gave away': 'In this problem, "gave away" means we subtract from the starting amount.',
    },
    compare: {
      'more': 'In this problem, "more" means we are finding the difference between two amounts.',
      'less': 'In this problem, "less" means we are finding how much smaller one amount is.',
      'fewer': 'In this problem, "fewer" means we are finding the difference by subtracting.',
    },
  }

  return meanings[frameId]?.[keywordLower] || `"${keyword}" is a clue word that helps us understand what operation to use.`
}

// Watch for step changes to trigger equation animation
watch(
  () => stepIndex.value,
  (newIndex) => {
    if (!currentFrame.value?.numberMapping) return

    if (steps[newIndex]?.key === 'solve') {
      // Start animation when entering solve step
      equationAnimationStep.value = 0
      animateEquation()
    } else {
      equationAnimationStep.value = 0
    }
  },
)

function animateEquation() {
  if (!currentFrame.value?.numberMapping) return

  const totalSteps = currentFrame.value.numberMapping.length + 1 // numbers + answer
  let step = 0

  const interval = setInterval(() => {
    step++
    equationAnimationStep.value = step

    if (step >= totalSteps) {
      clearInterval(interval)
    }
  }, 800) // 800ms per step
}

const highlightedProblem = computed(() => {
  if (!currentFrame.value?.problemHTML) return ''
  try {
    const original = String(currentFrame.value.problemHTML)
    const result = applyHighlight(original)
    // Debug: log to see what's being generated
    if (currentStep.value === 'underline' || currentStep.value === 'box') {
      console.log('Step:', currentStep.value)
      console.log('Original HTML:', original)
      console.log('Result HTML:', result)
    }
    return result || ''
  } catch (e) {
    console.error('Error highlighting problem:', e)
    return String(currentFrame.value.problemHTML || '')
  }
})

const highlightedEquation = computed(() => {
  if (!currentFrame.value?.equationHTML || !currentFrame.value?.numberMapping) {
    const rule = currentFrame.value?.rule || 'Math sentence will appear here...'
    return `<span class="equation-placeholder">${rule}</span>`
  }
  try {
    const result = buildAnimatedEquation(
      String(currentFrame.value.equationHTML),
      currentFrame.value.numberMapping,
      currentStep.value,
    )
    const rule = currentFrame.value?.rule || 'Math sentence will appear here...'
    return result || `<span class="equation-placeholder">${rule}</span>`
  } catch (e) {
    console.error('Error building equation:', e)
    const rule = currentFrame.value?.rule || 'Math sentence will appear here...'
    return `<span class="equation-placeholder">${rule}</span>`
  }
})

const highlightedAnswer = computed(() => {
  if (!currentFrame.value?.answerHTML) return ''
  if (currentStep.value === 'solve') {
    try {
      return `<span class="answer-reveal">${String(currentFrame.value.answerHTML)}</span>`
    } catch (e) {
      console.error('Error highlighting answer:', e)
      return String(currentFrame.value.answerHTML || '')
    }
  }
  return ''
})

function buildAnimatedEquation(
  equation: string,
  numbers: Array<{ number: string; fullText: string; color: string }>,
  step: string,
): string {
  if (!equation || !numbers || numbers.length === 0) {
    const rule = currentFrame.value?.rule || 'Math sentence will appear here...'
    return `<span class="equation-placeholder">${rule}</span>`
  }

  // Only show equation during S (solve) step
  if (step !== 'solve') {
    const rule = currentFrame.value?.rule || 'Math sentence will appear here...'
    return `<span class="equation-placeholder">${rule}</span>`
  }

  // Strip HTML tags and extract plain text equation
  // Handle HTML like: <span data-color="#3b82f6">$20</span> + <span data-color="#10b981">$15</span> = $35
  // Convert to: $20 + $15 = $35
  let plainEquation = equation
  // Remove HTML tags but preserve their text content using regex (works in all contexts)
  plainEquation = plainEquation.replace(/<[^>]+>/g, '') // Remove all HTML tags
  // Clean up any remaining HTML entities or artifacts
  plainEquation = plainEquation.replace(/\s+/g, ' ').trim()

  // Extract all numbers from equation (handle both $5 and 5 formats)
  // Match dollar amounts like $12, $5.50, etc.
  const dollarAmounts = plainEquation.match(/\$\d+(?:\.\d+)?/g) || []
  const plainNumbers = plainEquation.match(/(?<!\$)\b\d+(?:\.\d+)?\b/g) || []
  const allNumbers = [...dollarAmounts.map(a => a.replace('$', '')), ...plainNumbers]

  if (allNumbers.length === 0) {
    return plainEquation
  }

  const answer = allNumbers[allNumbers.length - 1] // Last number is usually the answer
  const operands = allNumbers.slice(0, -1) // Numbers before the answer

  // Map equation numbers to problem numbers by order
  const numberMap: Array<{ num: string; color: string; index: number; hasDollar: boolean }> = []
  operands.forEach((eqNum, idx) => {
    const problemNum = numbers[idx]
    if (problemNum) {
      // Check if this number has a dollar sign in the original equation
      // Match $12, $5, etc. (with optional decimal)
      const dollarPattern = new RegExp(`\\$${eqNum.replace('.', '\\.')}(?:\\s|$|[+\-×÷=])`)
      const hasDollar = dollarPattern.test(plainEquation)
      numberMap.push({
        num: eqNum,
        color: problemNum.color,
        index: idx,
        hasDollar,
      })
    }
  })

  // Check if answer has dollar sign
  const answerDollarPattern = new RegExp(`\\$${answer.replace('.', '\\.')}(?:\\s|$|[+\-×÷=])`)
  const answerHasDollar = answerDollarPattern.test(plainEquation)

  // Build LaTeX equation with color-coded numbers
  const latexParts: string[] = []
  let animationStep = 0

  // Split equation into parts - handle both simple equations and two-step (with "then")
  // For two-step: "$20 + $15 = $35, then $45 − $35 = $10"
  // For simple: "$12 + $5 = $17"
  const hasTwoSteps = plainEquation.includes('then')
  let equationToProcess = plainEquation

  if (hasTwoSteps) {
    // For two-step, we'll only show the second step in the equation display
    // Extract the part after "then"
    const thenMatch = plainEquation.match(/then\s+(.+)/i)
    if (thenMatch) {
      equationToProcess = thenMatch[1].trim()
    }
  }

  // Split on operators, preserving dollar amounts
  // Pattern: split on operators but keep dollar amounts together
  const parts = equationToProcess.split(/([+\-×÷=])/g).filter((p) => p.trim())

  parts.forEach((part) => {
    const trimmed = part.trim()
    if (!trimmed) return

    // Check if this part is a dollar amount (e.g., "$12" or "$5.50")
    const dollarMatch = trimmed.match(/\$(\d+(?:\.\d+)?)/)
    const hasDollar = !!dollarMatch
    const numberOnly = hasDollar ? dollarMatch![1] : trimmed

    // Check if this is an operand number
    const numberInfo = numberMap.find((nm) => nm.num === numberOnly)

    if (numberInfo) {
      animationStep++
      if (equationAnimationStep.value >= animationStep) {
        // Show number with matching color and dollar sign if present
        const hexColor = numberInfo.color.replace('#', '')
        if (numberInfo.hasDollar) {
          // Use \text{\$} to render dollar sign in KaTeX (as per DOLLAR_SIGN_MATH_MODE_FIX.md)
          latexParts.push(`\\textcolor{#${hexColor}}{\\text{\\$}${numberOnly}}`)
        } else {
          latexParts.push(`\\textcolor{#${hexColor}}{${numberOnly}}`)
        }
      } else {
        // Placeholder - show blank
        latexParts.push('\\phantom{0}')
      }
    } else if (numberOnly === answer || (hasDollar && numberOnly === answer)) {
      // Answer appears last
      if (equationAnimationStep.value > numberMap.length) {
        if (answerHasDollar || hasDollar) {
          latexParts.push(`\\textcolor{#10b981}{\\text{\\$}${answer}}`)
        } else {
          latexParts.push(`\\textcolor{#10b981}{${answer}}`)
        }
      } else {
        latexParts.push('\\phantom{0}')
      }
    } else if (trimmed === '+') {
      if (equationAnimationStep.value > 0) {
        latexParts.push('+')
      }
    } else if (trimmed === '-') {
      if (equationAnimationStep.value > 0) {
        latexParts.push('-')
      }
    } else if (trimmed === '×') {
      if (equationAnimationStep.value > 0) {
        latexParts.push('\\times')
      }
    } else if (trimmed === '÷') {
      if (equationAnimationStep.value > 0) {
        latexParts.push('\\div')
      }
    } else if (trimmed === '=') {
      if (equationAnimationStep.value > 0) {
        latexParts.push('=')
      }
    } else {
      // Preserve other parts (like commas, "then", etc.)
      // Skip "then" and commas in the LaTeX output
      if (trimmed !== 'then' && trimmed !== ',') {
        latexParts.push(trimmed)
      }
    }
  })

  // Render with KaTeX
  try {
    const latexString = latexParts.join(' ')
    if (!latexString || latexString.trim() === '') {
      return '<span class="equation-placeholder">Building equation...</span>'
    }
    return katex.renderToString(latexString, {
      throwOnError: false,
      displayMode: false,
    })
  } catch (error) {
    console.error('KaTeX rendering error:', error)
    // Fallback to original method
    return '<span class="equation-placeholder">Math sentence will appear here...</span>'
  }
}

function applyHighlight(html: string): string {
  if (!html) return ''

  try {
    // Ensure html is a string
    let result = String(html)
    const step = currentStep.value
    const frame = currentFrame.value

  // Step 0: Default - show nothing
  // Step 1: C - Circle numbers (color coded) in the story
  // Step 2: U - Underline the question in the story
  // Step 3: B - Box the key words in the story
  // Step 4: E - Evaluate: cross out extra info
  // Step 5: S - Solve: show number sentence and answer

  // If on default step, return plain text with no indicators
  if (step === 'default') {
    // Remove all data-role spans and return plain content
    result = result.replace(/<span data-role="[^"]+"[^>]*>([^<]+)<\/span>/g, '$1')
    return result
  }

  // First, add keyword boxes only during the "box" step
  // Use the CUBES keywords shown to students in the B step
  if (step === 'box') {
    // Get keywords from the current frame (for frame-specific keywords)
    const frameKeywords = frame?.keywords || []
    // Use the CUBES keywords that are displayed to students
    const cubesKeywords = [
      ...CUBES_KEYWORDS.addition,
      ...CUBES_KEYWORDS.subtraction,
      ...CUBES_KEYWORDS.multiplication,
      ...CUBES_KEYWORDS.division,
    ]

    // Combine frame-specific keywords with CUBES keywords
    const allKeywords = [...new Set([...frameKeywords, ...cubesKeywords])]

    // Build regex - handle multi-word keywords and single words
    const keywordPatterns: Array<{ pattern: RegExp; text: string }> = []

    allKeywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase()
      if (keywordLower.includes(' ')) {
        // Multi-word keyword - escape and match as phrase
        const escaped = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        keywordPatterns.push({
          pattern: new RegExp(escaped, 'gi'),
          text: keyword,
        })
      } else {
        // Single word - use word boundary
        keywordPatterns.push({
          pattern: new RegExp(`\\b${keywordLower}\\b`, 'gi'),
          text: keyword,
        })
      }
    })

    // Find all matches and check if they're inside spans
    // We want to box keywords even if they're inside underline spans, but not if they're already boxed or circled
    const matches: Array<{ text: string; index: number; original: string }> = []

    // Replace keywords directly in the HTML, handling nested spans properly
    keywordPatterns.forEach(({ pattern, text: originalText }) => {
      const keywordLower = originalText.toLowerCase()

      // Create regex for this specific keyword
      let keywordRegex: RegExp
      if (keywordLower.includes(' ')) {
        // Multi-word: match as phrase (case insensitive)
        const escaped = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        keywordRegex = new RegExp(escaped, 'gi')
      } else {
        // Single word: use word boundaries
        keywordRegex = new RegExp(`\\b${keywordLower}\\b`, 'gi')
      }

      // Replace keywords in underline spans (allow nested boxing)
      result = result.replace(
        /(<span[^>]*data-role="underline"[^>]*>)(.*?)(<\/span>)/gi,
        (match, openTag, content, closeTag) => {
          // Replace keywords in the content, but skip if already boxed
          const newContent = content.replace(keywordRegex, (kwMatch: string, offset: number) => {
            // Check if this match is already inside a box span
            const beforeKw = content.substring(0, offset)
            const openBoxes = (beforeKw.match(/<span[^>]*data-role="box"[^>]*>/gi) || []).length
            const closeBoxes = (beforeKw.match(/<\/span>/g) || []).length
            const isAlreadyBoxed = openBoxes > closeBoxes

            if (!isAlreadyBoxed) {
              return `<span data-role="box">${kwMatch}</span>`
            }
            return kwMatch
          })
          return openTag + newContent + closeTag
        }
      )

      // Also find keywords in plain text (not inside any span) and add to matches
      const textOnly = result.replace(/<[^>]+>/g, '')
      pattern.lastIndex = 0
      let textMatch

      while ((textMatch = pattern.exec(textOnly)) !== null) {
        const matchText = textMatch[0]
        const textIndex = textMatch.index

        // Map text index back to HTML position
        let htmlIndex = 0
        let textCount = 0
        for (let i = 0; i < result.length && textCount <= textIndex; i++) {
          if (result[i] === '<') {
            while (i < result.length && result[i] !== '>') i++
            continue
          }
          if (textCount === textIndex) {
            htmlIndex = i
            break
          }
          textCount++
        }

        // Check if we're in plain text (not inside any span)
        const beforeMatch = result.substring(0, htmlIndex)
        const openSpans = (beforeMatch.match(/<span[^>]*>/g) || []).length
        const closeSpans = (beforeMatch.match(/<\/span>/g) || []).length

        // Only add if in plain text and not already boxed
        if (openSpans === closeSpans) {
          const existing = matches.find(m => m.index === htmlIndex && m.text.toLowerCase() === matchText.toLowerCase())
          if (!existing) {
            matches.push({ text: matchText, index: htmlIndex, original: originalText })
          }
        }
      }
    })

    // Sort by index descending and apply replacements from end to start
    matches.sort((a, b) => b.index - a.index)

    matches.forEach((m) => {
      result = result.substring(0, m.index) +
               `<span data-role="box">${m.text}</span>` +
               result.substring(m.index + m.text.length)
    })
  }

  // During evaluate step, show that we're keeping important parts and evaluating what's needed

  // Replace data-role spans with visual indicators based on current step
  // Use a more flexible regex that handles content with periods, question marks, etc.
  result = result.replace(
    /<span data-role="([^"]+)"([^>]*)>(.*?)<\/span>/g,
    (match, role, attrs, content) => {
      // Extract color if present
      const colorMatch = attrs.match(/data-color="([^"]+)"/)
      const color = colorMatch ? colorMatch[1] : null

      // Show indicators and keep previous step indicators visible
      // Step 1 (circle): show circles
      // Step 2 (underline): show circles + underline
      // Step 3 (box): show circles + underline + box
      // Step 4 (evaluate): show all previous
      // Step 5 (solve): show all previous

      if (role === 'circle') {
        // Show circles on circle step and all subsequent steps
        if (step === 'circle' || step === 'underline' || step === 'box' || step === 'evaluate' || step === 'solve') {
          return `<span class="circle-indicator" style="border-color: ${color || '#3b82f6'}; color: ${color || '#3b82f6'};">${content}</span>`
        }
      } else if (role === 'underline') {
        // Show underline on underline step and all subsequent steps
        if (step === 'underline' || step === 'box' || step === 'evaluate' || step === 'solve') {
          return `<span class="underline-indicator">${content}</span>`
        }
      } else if (role === 'box') {
        // Show box on box step and all subsequent steps
        if (step === 'box' || step === 'evaluate' || step === 'solve') {
          return `<span class="box-indicator">${content}</span>`
        }
      }

      // Return plain content if not on a step that should show this indicator
      return content
    },
  )

  // During evaluate step, keep important parts visible (circled, underlined, boxed)
  // The evaluate step shows we're focusing on what we need

    return result
  } catch (e) {
    console.error('Error in applyHighlight:', e)
    return String(html)
  }
}

function selectFrame(frame: typeof frames[0]) {
  currentFrame.value = frame
  selectedFrameId.value = frame.id
  stepIndex.value = 0
  equationAnimationStep.value = 0
}

function nextStep() {
  if (stepIndex.value < steps.length - 1) {
    stepIndex.value++
    if (steps[stepIndex.value]?.key === 'solve') {
      animateEquation()
    }
  }
}

function prevStep() {
  if (stepIndex.value > 0) {
    stepIndex.value--
    equationAnimationStep.value = 0
  }
}

function reset() {
  stepIndex.value = 0
  equationAnimationStep.value = 0
}
</script>

<style scoped>
.frames-resource {
  max-width: 1400px;
  margin: 0 auto;

}

/* Concise Tips Header */
.tips-header {
  padding: 10px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tips-content {
  font-size: 13px;
  line-height: 1.5;
}

.tips-content strong {
  font-weight: 700;
  margin-right: 8px;
}

.content-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 5px;
  align-items: start;
}

@media (max-width: 1000px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .cubes-panel {
    order: -1;
  }
}

.main-card,
.legend-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 10px 14px;
  background: linear-gradient(to right, #f9fafb, #f3f4f6);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.card-header h2 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.frame-dropdown-inline {
  flex: 1;
  max-width: 300px;
  padding: 6px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s;
}

.frame-dropdown-inline:hover {
  border-color: #667eea;
}

.frame-dropdown-inline:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.controls {
  display: flex;
  gap: 6px;
}

.control-btn {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
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

/* Next Button Animation */
.next-button-animated .next-button-text {
  animation: pulseAttention 1.5s ease-in-out;
}

@keyframes pulseAttention {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  25% {
    transform: scale(1.1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.85;
  }
  75% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

.next-button-text {
  display: inline-block;
  transition: transform 0.2s ease;
}

.card-body {
  padding: 12px;
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.section-label-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.frame-name-compact {
  color: #667eea;
  font-weight: 700;
  font-size: 11px;
}

.step-hint-compact {
  color: #f59e0b;
  font-style: italic;
  font-size: 11px;
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
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.6;
}

.problem-text {
  /* No background ever - makes it more instructive */
  background: transparent;
  border: none;
  margin-bottom: 0;
  font-size: 25px;
  line-height: 1.75;
  letter-spacing: 0.2px;
  color: #1f2937;
  font-weight: 400;
}

/* Problem Container with embedded equation and answer */
.problem-container {
  margin-bottom: 12px;
}

/* Grid for inline equation and answer */
.grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.equation-inline {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: transparent;
  transition: all 0.3s ease;
}

.equation-inline.has-step {
  background: transparent;
  border-color: #3b82f6;
  border-width: 3px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.equation-text-inline {
  font-size: 24px;
  line-height: 1.8;
  padding: 0;
  text-align: center;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* KaTeX styling for equations */
.equation-text-inline :deep(.katex) {
  font-size: 1.2em;
  font-weight: 600;
}

.equation-text-inline :deep(.katex .mord) {
  font-weight: 600;
}

.answer-inline {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: transparent;
  transition: all 0.3s ease;
}

.answer-inline.has-step {
  background: transparent;
  border-color: #10b981;
  border-width: 3px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.answer-text-inline {
  font-size: 22px;
  line-height: 1.8;
  padding: 0;
  text-align: center;
  font-weight: 600;
  color: #065f46;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.problem-text.evaluating {
  /* During evaluate step, dim non-essential text */
  opacity: 0.7;
}

.problem-text.evaluating .circle-indicator,
.problem-text.evaluating .underline-indicator,
.problem-text.evaluating .box-indicator {
  /* Keep important parts fully visible during evaluate */
  opacity: 1;
}

.equation-text {
  /* No background initially - makes it more instructive */
  background: transparent;
  border: none;
}

.equation-text.has-step {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.answer-text {
  /* No background initially - makes it more instructive */
  background: transparent;
  border: none;
}

.answer-text.has-step {
  background: #d1fae5;
  border: 2px solid #10b981;
}

/* Visual Indicators for CUBES - use :deep() for v-html content */
:deep(.circle-indicator) {
  display: inline-block !important;
  border: 3px solid #3b82f6 !important;
  border-radius: 50%;
  padding: 2px 6px;
  margin: 0 2px;
  font-weight: 600;
  position: relative;
  /* No background - makes text easier to read */
}

:deep(.circle-indicator.subtle) {
  opacity: 0.5;
  border-width: 2px;
}

:deep(.underline-indicator) {
  text-decoration: underline;
  text-decoration-thickness: 3px;
  text-decoration-color: #f59e0b;
}

.underline-indicator.subtle {
  opacity: 0.5;
  border-bottom-width: 2px;
}

:deep(.box-indicator) {
  display: inline-block !important;
  border: 3px solid #ef4444 !important;
  border-radius: 4px;
  padding: 4px 6px;
  margin: 0 2px;
  font-weight: 600;
  /* No background - makes text easier to read */
  position: relative;
}

.box-indicator.subtle {
  opacity: 0.5;
  border-width: 2px;
  background: transparent;
}

/* Crossed out text for evaluate step */
.crossed-out {
  text-decoration: line-through;
  color: #9ca3af;
  opacity: 0.5;
}

/* Equation Animation Styles */
.equation-placeholder {
  color: #9ca3af;
  font-style: italic;
  font-size: 16px;
  text-align: center;
  padding: 20px;
  display: block;
}

.equation-placeholder-number {
  display: inline-block;
  width: 30px;
  height: 30px;
  border-bottom: 3px dashed #9ca3af;
  margin: 0 6px;
  vertical-align: middle;
}

/* Legacy equation-number styles (kept for fallback) */
.equation-number {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  border: 3px solid;
  background: rgba(255, 255, 255, 0.9);
  margin: 0 2px;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s ease;
  animation: numberAppear 0.5s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@keyframes numberAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.equation-operator {
  display: inline-block;
  padding: 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
}

.equation-answer {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.1);
  margin: 0 2px;
  font-size: 18px;
  animation: answerAppear 0.5s ease;
}

@keyframes answerAppear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* equation-placeholder-number moved above */

.answer-reveal {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 8px;
  background: #d1fae5;
  border: 2px solid #10b981;
  font-weight: 600;
  font-size: 16px;
  color: #065f46;
  animation: answerReveal 0.6s ease;
}

@keyframes answerReveal {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* CUBES Steps Accordion */
.cubes-steps {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}

.cubes-step-accordion {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  transition: all 0.3s ease;
  overflow: hidden;
}

.cubes-step-accordion.active {
  border-color: #667eea;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.cubes-step-accordion.expanded {
  border-color: #667eea;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  cursor: default;
}

.step-details {
  padding: 0 10px 10px 10px;
  border-top: 1px solid #e5e7eb;
  animation: slideDown 0.3s ease;
  background: white;
}

.step-detail-content {
  padding-top: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: #4b5563;
}

.step-detail-content strong {
  display: block;
  margin-bottom: 4px;
  color: #1f2937;
  font-weight: 600;
  font-size: 13px;
}

.step-detail-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.step-detail-content li {
  margin-bottom: 4px;
}

.step-tip {
  margin-top: 10px;
  padding: 8px 10px;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.5;
  color: #92400e;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.step-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.cubes-step-accordion.active .step-icon {
  background: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.step-content {
  flex: 1;
  line-height: 1;
}

.step-content strong {
  display: block;
  color: #1f2937;
  margin-bottom: 2px;
  font-size: 14px;
  font-weight: 700;
}

.step-content p {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.1;
}

.teacher-tip {
  padding: 10px;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
  font-size: 12px;
  color: #1e40af;
  line-height: 1.5;
  margin-bottom: 12px;
}

.teacher-tip strong {
  color: #1e3a8a;
}

/* Keyword explanations */
.keyword-explanations {
  margin-top: 20px;
  padding: 16px;
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
}

.keyword-explanations h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1e40af;
  font-weight: 700;
}

.keyword-explanation-item {
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: #1e3a8a;
}

.keyword-explanation-item strong {
  color: #1e40af;
  font-weight: 700;
}

/* Step Info Content Below Problem */
.step-info-content {
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.step-info-content h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  color: #1f2937;
  font-weight: 700;
}

.step-info-content > div > p {
  margin: 0 0 8px 0;
  color: #6b7280;
  line-height: 1.5;
  font-size: 13px;
}

.info-box-compact {
  background: white;
  border-left: 3px solid #667eea;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #4b5563;
}

.info-box-compact strong {
  color: #1f2937;
  font-weight: 600;
  margin-right: 4px;
}

.keyword-explanations-compact {
  margin-top: 8px;
  padding: 8px 10px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
}

.keyword-explanations-compact strong {
  display: block;
  margin-bottom: 6px;
  color: #1e40af;
  font-weight: 700;
}

.keyword-explanation-item-compact {
  margin-bottom: 6px;
  line-height: 1.5;
  color: #1e3a8a;
}

.keyword-explanation-item-compact strong {
  color: #1e40af;
  font-weight: 700;
  display: inline;
  margin-right: 4px;
}

/* Adjust legend card for left panel */
.cubes-panel {
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
}

/* Adjust main card for center */
.problem-panel {
  min-width: 0; /* Allow flex shrinking */
}

/* Cue Reference Inline */
.cue-reference-inline {
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  overflow: hidden;
}

.cue-reference-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.cue-reference-header:hover {
  background: #f3f4f6;
}

.cue-reference-header h4 {
  margin: 0;
  font-size: 14px;
  color: #1f2937;
  font-weight: 700;
}

.cue-toggle-icon {
  font-size: 18px;
  font-weight: 700;
  color: #667eea;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(102, 126, 234, 0.1);
  transition: transform 0.2s ease;
}

.cue-reference-content {
  padding: 0 12px 12px 12px;
  animation: slideDown 0.3s ease;
}

.cue-words-grid-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.cue-word-category-compact {
  font-size: 12px;
  line-height: 1.5;
  color: #4b5563;
}

.cue-word-category-compact strong {
  color: #1f2937;
  font-weight: 600;
  margin-right: 4px;
}

.cue-warning-compact {
  font-size: 11px;
  line-height: 1.5;
  color: #92400e;
  padding: 6px 8px;
  background: #fef3c7;
  border-radius: 4px;
  margin-top: 8px;
}

.cue-warning-compact strong {
  font-weight: 600;
}

/* Cue Words Section */
.cue-words-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.cue-words-section h3 {
  font-size: 16px;
  color: #1f2937;
  margin-bottom: 12px;
}

.cue-words-warning {
  padding: 10px 12px;
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  border-radius: 8px;
  font-size: 12px;
  color: #991b1b;
  margin-bottom: 16px;
}

.cue-words-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .cue-words-grid {
    grid-template-columns: 1fr;
  }
}

.cue-word-category {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.cue-word-category h4 {
  font-size: 13px;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.cue-word-category ul {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.6;
}

.cue-word-category li {
  margin-bottom: 4px;
}

.keyword-examples {
  margin-top: 16px;
  padding: 12px;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fbbf24;
}

.keyword-examples h4 {
  font-size: 13px;
  color: #92400e;
  margin: 0 0 8px 0;
}

.trick-example {
  padding: 8px 0;
  font-size: 12px;
  line-height: 1.6;
  color: #78350f;
}

.trick-example p {
  margin: 0;
}

.trick-example strong {
  color: #92400e;
}

.trick-example em {
  color: #b45309;
  font-style: italic;
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

