<template>
  <div class="round-section round-1">
    <div class="round-header-bar">
      <h3>Round 1: Learning New Facts</h3>
      <p>{{ currentIndex + 1 }}/{{ problems.length }} facts</p>
    </div>

    <!-- Encoding Phase -->
    <div v-if="phase === 'encoding'" class="encoding-phase">
      <!-- Fact Display with Answer Highlighted -->
      <div class="fact-display-large">
        <span class="fact-problem">{{ currentProblem?.displayText.replace(' = ?', '') }} =</span>
        <span class="fact-answer">{{ currentProblem?.correctAnswer }}</span>
      </div>

      <!-- Visual Representations -->
      <div v-if="shouldShowVisuals(currentProblem)" class="visual-representations">
        <!-- Ten-Frame Visual (for addition/subtraction) -->
        <MathFluencyTenFrame
          v-if="
            currentProblem &&
            (currentProblem.operation === 'addition' || currentProblem.operation === 'subtraction')
          "
          :num1="currentProblem.num1"
          :num2="currentProblem.num2"
          :answer="getAnswerNumber(currentProblem)"
          :operation="currentProblem.operation"
        />

        <!-- Array Visual (for multiplication) -->
        <MathFluencyArrayGrid
          v-if="currentProblem?.operation === 'multiplication'"
          :num1="currentProblem.num1"
          :num2="currentProblem.num2"
          :answer="parseInt(currentProblem.correctAnswer) || 0"
        />

        <!-- Division Groups Visual -->
        <MathFluencyDivisionGroups
          v-if="currentProblem?.operation === 'division'"
          :dividend="currentProblem.num1"
          :divisor="currentProblem.num2"
          :answer="parseInt(currentProblem.correctAnswer) || 0"
        />

        <!-- Number Line Visual -->
        <MathFluencyNumberLine
          v-if="currentProblem"
          :num1="currentProblem.num1"
          :num2="currentProblem.num2"
          :answer="getAnswerNumber(currentProblem)"
          :operation="currentProblem.operation"
        />
      </div>

      <!-- NO TIMER - Student paced! -->
      <button @click="$emit('proceed-to-recall')" class="next-btn">I've Got It! Next →</button>
    </div>

    <!-- Consolidation Phase (5 seconds with animation) -->
    <div v-if="phase === 'consolidation'" class="consolidation-phase">
      <p class="phase-instruction">Get ready to recall...</p>
      <div class="consolidation-animation">
        <div class="thinking-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <p class="consolidation-message">Think about it...</p>
      </div>
      <div class="countdown-display">{{ consolidationTimeRemaining }}</div>
    </div>

    <!-- Recall Phase -->
    <div v-if="phase === 'recall'" class="recall-phase">
      <p class="phase-instruction">Now you try!</p>

      <!-- Timer Bar -->
      <MathFluencyTimerBar
        :time-remaining="recallTimeRemaining"
        :total-time="15"
        :show-text="true"
      />

      <div class="question-display-large">
        {{ currentProblem?.displayText }}
      </div>
      <input
        ref="inputRef"
        :value="answer"
        @input="(e) => answer = (e.target as HTMLInputElement).value"
        type="number"
        class="answer-input-large"
        placeholder="?"
        @keyup.enter="handleSubmit"
        autofocus
      />

      <button @click="handleSubmit" class="submit-btn" :disabled="!answer">
        Submit
      </button>
    </div>

    <!-- Feedback Phase -->
    <div v-if="phase === 'feedback'" class="feedback-phase">
      <div v-if="lastCorrect" class="feedback-correct">
        <div class="feedback-icon">✅</div>
        <div class="feedback-message">Correct!</div>
        <div class="feedback-fact">
          {{ currentProblem?.displayText.replace(' = ?', ` = ${currentProblem?.correctAnswer}`) }}
        </div>
        <p class="feedback-next">Great! Moving to next fact in {{ feedbackTimeRemaining }}s...</p>
      </div>

      <div v-else class="feedback-incorrect">
        <div class="feedback-icon">❌</div>
        <div class="feedback-message">The answer is {{ currentProblem?.correctAnswer }}</div>
        <div class="feedback-fact">
          {{ currentProblem?.displayText.replace(' = ?', ` = ${currentProblem?.correctAnswer}`) }}
        </div>
        <p class="feedback-next">Let's see it again in {{ feedbackTimeRemaining }}s...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ProblemProgress } from '@/types/mathFluency'
import MathFluencyTimerBar from '../visuals/MathFluencyTimerBar.vue'
import MathFluencyTenFrame from '../visuals/MathFluencyTenFrame.vue'
import MathFluencyNumberLine from '../visuals/MathFluencyNumberLine.vue'
import MathFluencyArrayGrid from '../visuals/MathFluencyArrayGrid.vue'
import MathFluencyDivisionGroups from '../visuals/MathFluencyDivisionGroups.vue'
import { getAnswerNumber, shouldShowVisuals } from '@/utils/mathFluencyVisualUtils'

const props = defineProps<{
  problems: ProblemProgress[]
  currentIndex: number
  phase: 'encoding' | 'consolidation' | 'recall' | 'feedback'
  consolidationTimeRemaining: number
  recallTimeRemaining: number
  feedbackTimeRemaining: number
  lastCorrect: boolean
}>()

const emit = defineEmits<{
  'proceed-to-recall': []
  'submit-answer': [answer: string]
  'timeout': []
  'update:answer': [answer: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const answer = ref<string>('')

const currentProblem = computed(() => props.problems[props.currentIndex] || null)

// Watch for phase changes to reset answer
watch(() => props.phase, (newPhase) => {
  if (newPhase === 'recall') {
    answer.value = ''
  }
})

function handleSubmit() {
  if (!answer.value) return
  emit('submit-answer', answer.value)
  emit('update:answer', answer.value)
}
</script>

<style scoped>
.round-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.round-header-bar {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.round-header-bar h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.round-header-bar p {
  margin: 0.25rem 0;
  color: #666;
}

/* Encoding Phase */
.encoding-phase,
.consolidation-phase,
.recall-phase,
.feedback-phase {
  text-align: center;
  padding: 3rem 0;
}

.phase-instruction {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.fact-display-large,
.question-display-large {
  font-size: 4rem;
  font-weight: bold;
  color: #333;
  margin: 2rem 0;
  line-height: 1.2;
}

.fact-problem {
  color: #333;
}

.fact-answer {
  color: #28a745;
  font-weight: bold;
}

.visual-representations {
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.next-btn {
  margin-top: 2rem;
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.next-btn:hover {
  transform: translateY(-2px);
}

/* Consolidation Phase */
.consolidation-animation {
  margin: 2rem 0;
}

.thinking-dots {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007bff;
  animation: bounce 1.4s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.consolidation-message {
  font-size: 1.1rem;
  color: #666;
  margin-top: 1rem;
}

.countdown-display {
  font-size: 6rem;
  font-weight: bold;
  color: #007bff;
  margin: 3rem 0;
}

/* Recall Phase */
.answer-input-large {
  width: 250px;
  padding: 1.5rem;
  font-size: 3rem;
  text-align: center;
  border: 4px solid #007bff;
  border-radius: 12px;
  font-weight: bold;
}

.answer-input-large:focus {
  outline: none;
  border-color: #0056b3;
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.25);
}

.submit-btn {
  margin-top: 2rem;
  padding: 1rem 3rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Feedback Phase */
.feedback-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.feedback-message {
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
}

.feedback-correct .feedback-message {
  color: #28a745;
}

.feedback-incorrect .feedback-message {
  color: #dc3545;
}

.feedback-fact {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  margin: 2rem 0;
}

.feedback-next {
  font-size: 1.1rem;
  color: #666;
  margin: 1rem 0;
}
</style>

