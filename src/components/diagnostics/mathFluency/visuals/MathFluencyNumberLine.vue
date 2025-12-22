<template>
  <div class="visual-section">
    <h4>Number Line:</h4>
    <svg :width="svgWidth" :height="80" class="number-line-visual">
      <!-- Number line -->
      <line
        x1="30"
        y1="40"
        :x2="lineEndX"
        y2="40"
        stroke="#94a3b8"
        stroke-width="3"
        stroke-linecap="round"
      />

      <!-- Tick marks and numbers (0-20) -->
      <g
        v-for="i in tickCount"
        :key="'tick-' + i"
      >
        <line
          :x1="30 + (i - 1) * 25"
          :y1="35"
          :x2="30 + (i - 1) * 25"
          :y2="45"
          stroke="#64748b"
          stroke-width="2"
        />
        <text :x="30 + (i - 1) * 25" y="60" text-anchor="middle" font-size="12" fill="#475569">
          {{ i - 1 }}
        </text>
      </g>

      <!-- Animated arc showing the addition -->
      <path
        v-if="operation === 'addition'"
        :d="additionArc"
        fill="none"
        stroke="#3b82f6"
        stroke-width="3"
        marker-end="url(#arrowhead-right)"
        class="animated-arc"
      />

      <!-- Subtraction visualization -->
      <g v-if="operation === 'subtraction'">
        <!-- Starting point (minuend) - small filled dot -->
        <circle
          :cx="30 + num1 * 25"
          cy="40"
          r="5"
          fill="#ef4444"
          stroke="white"
          stroke-width="2"
          class="start-point"
        />

        <!-- Animated arc going backwards -->
        <path
          :d="subtractionArc"
          fill="none"
          stroke="#ef4444"
          stroke-width="2"
          marker-end="url(#arrowhead-left)"
          class="animated-arc"
        />

        <!-- End point (answer) - hollow circle around the number -->
        <circle
          :cx="30 + answer * 25"
          cy="55"
          r="12"
          fill="none"
          stroke="#10b981"
          stroke-width="3"
          class="answer-highlight"
        />
      </g>

      <!-- Arrow markers -->
      <defs>
        <marker
          id="arrowhead-right"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-left"
          markerWidth="8"
          markerHeight="8"
          refX="1"
          refY="4"
          orient="auto"
        >
          <polygon points="8 0, 0 4, 8 8" fill="#ef4444" transform="rotate(180, 4, 4)" />
        </marker>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OperationType } from '@/types/mathFluency'

const props = defineProps<{
  num1: number
  num2: number
  answer: number
  operation: OperationType
}>()

// Always show 0-20 for consistency
const tickCount = computed(() => 21) // 0 through 20

const svgWidth = computed(() => 30 + 21 * 25 + 60) // Fixed width for 0-20

const lineEndX = computed(() => 30 + 21 * 25) // Line ends at 20

const additionArc = computed(() => {
  const startX = 30 + props.num1 * 25
  const endX = 30 + (props.num1 + props.num2) * 25
  const arcHeight = 20
  return `M ${startX} 35 Q ${(startX + endX) / 2} ${35 - arcHeight} ${endX} 35`
})

const subtractionArc = computed(() => {
  // Start at minuend (num1), go backwards by subtrahend (num2), end at answer
  const startX = 30 + props.num1 * 25
  const endX = 30 + props.answer * 25 + 5 // Add offset for arrowhead
  const arcHeight = 20
  return `M ${startX} 35 Q ${(startX + endX) / 2} ${35 - arcHeight} ${endX} 35`
})

// Expose num1 for template
const num1 = computed(() => props.num1)
const answer = computed(() => props.answer)
</script>

<style scoped>
.visual-section {
  margin: 2rem 0;
  text-align: center;
}

.visual-section h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.number-line-visual {
  display: block;
  margin: 0 auto;
}

.animated-arc {
  animation: draw-arc 0.8s ease-out forwards;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

@keyframes draw-arc {
  to {
    stroke-dashoffset: 0;
  }
}

.start-point {
  animation: pulse 0.5s ease-out;
}

.answer-highlight {
  animation: highlight 0.6s ease-out 0.8s;
  opacity: 0;
  animation-fill-mode: forwards;
}

@keyframes pulse {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes highlight {
  0% {
    opacity: 0;
    transform: scale(0);
    stroke-width: 0;
  }
  50% {
    transform: scale(1.2);
    stroke-width: 4;
  }
  100% {
    opacity: 1;
    transform: scale(1);
    stroke-width: 3;
  }
}
</style>

