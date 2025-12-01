<template>
  <div 
    class="challenge-problem-container"
    :class="{
      'operation-change': isOperationChange,
      'next-level': challengeType === 'next-level',
      'previous-operation': challengeType === 'previous-operation',
      'previous-level': challengeType === 'previous-level'
    }"
  >
    <!-- Challenge Label with Animation -->
    <div class="challenge-label" :class="{ 'operation-change-label': isOperationChange }">
      <span class="challenge-text" ref="challengeTextRef">CHALLENGE</span>
      <span v-if="isOperationChange" class="operation-change-text">OPERATION CHANGE</span>
    </div>
    
    <!-- Challenge Message -->
    <div v-if="challengeMessage" class="challenge-message">
      {{ challengeMessage }}
    </div>
    
    <!-- Operation Change Alert (if applicable) -->
    <Transition name="operation-alert">
      <div v-if="isOperationChange && showOperationAlert" class="operation-change-alert">
        <div class="alert-icon">🔄</div>
        <div class="alert-text">
          <strong>Switching Operations!</strong><br>
          This is {{ getOperationName(problem.operation) }} - different from what you've been practicing!
        </div>
      </div>
    </Transition>
    
    <!-- Problem Display (slot for actual problem) -->
    <div class="challenge-problem-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import type { ProblemProgress, ChallengeType, OperationType } from '@/types/mathFluency'

interface Props {
  problem: ProblemProgress
  currentOperation: OperationType
  challengeType?: ChallengeType
  isOperationChange?: boolean
  challengeMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOperationChange: false,
  challengeMessage: ''
})

const challengeTextRef = ref<HTMLElement | null>(null)
const showOperationAlert = ref(true)

onMounted(async () => {
  await nextTick()
  
  // Animate challenge label
  if (challengeTextRef.value) {
    animateChallengeLabel(challengeTextRef.value)
  }
  
  // Hide operation alert after 3 seconds
  if (props.isOperationChange) {
    setTimeout(() => {
      showOperationAlert.value = false
    }, 3000)
  }
})

function animateChallengeLabel(element: HTMLElement) {
  // Slide-in bounce animation
  element.style.animation = 'slideInBounce 0.6s ease-out'
}

function getOperationName(op: OperationType): string {
  const names = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division'
  }
  return names[op]
}
</script>

<style scoped>
/* Challenge Problem Container */
.challenge-problem-container {
  position: relative;
  border: 3px solid #ff6b35;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  animation: challengePulse 2s ease-in-out infinite;
}

/* Operation Change Styling */
.challenge-problem-container.operation-change {
  border-color: #e63946;
  background: linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%);
  animation: operationChangePulse 1.5s ease-in-out infinite;
}

/* Challenge Label */
.challenge-label {
  position: absolute;
  top: -12px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.challenge-text {
  background: #ff6b35;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  animation: challengeLabelBounce 1.5s ease-in-out infinite;
}

.operation-change-label .challenge-text {
  background: #e63946;
  animation: operationChangeLabelBounce 1s ease-in-out infinite;
}

.operation-change-text {
  background: #e63946;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
  animation: operationChangeTextPulse 1s ease-in-out infinite;
}

/* Challenge Message */
.challenge-message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

/* Operation Change Alert */
.operation-change-alert {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(230, 57, 70, 0.95);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 10;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  animation: operationChangeAlert 0.8s ease-out;
}

.alert-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.alert-text {
  line-height: 1.4;
}

/* Challenge Problem Content */
.challenge-problem-content {
  position: relative;
  z-index: 1;
}

/* Animations */
@keyframes challengePulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 10px rgba(255, 107, 53, 0);
  }
}

@keyframes operationChangePulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 0 15px rgba(230, 57, 70, 0);
    transform: scale(1.02);
  }
}

@keyframes challengeLabelBounce {
  0%, 100% { 
    transform: translateY(0);
  }
  50% { 
    transform: translateY(-3px);
  }
}

@keyframes operationChangeLabelBounce {
  0%, 100% { 
    transform: translateY(0) scale(1);
  }
  50% { 
    transform: translateY(-3px) scale(1.1);
  }
}

@keyframes operationChangeTextPulse {
  0%, 100% { 
    opacity: 1;
  }
  50% { 
    opacity: 0.7;
  }
}

@keyframes slideInBounce {
  0% {
    transform: translateX(-100px);
    opacity: 0;
  }
  60% {
    transform: translateX(10px);
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes operationChangeAlert {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* Transition for operation alert */
.operation-alert-enter-active,
.operation-alert-leave-active {
  transition: all 0.5s ease;
}

.operation-alert-enter-from,
.operation-alert-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}
</style>


