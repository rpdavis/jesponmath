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

      <!-- Tick marks and numbers -->
      <g
        v-for="i in Math.min(21, answer + 3)"
        :key="'tick-' + i"
      >
        <line
          :x1="30 + i * 25"
          :y1="35"
          :x2="30 + i * 25"
          :y2="45"
          stroke="#64748b"
          stroke-width="2"
        />
        <text :x="30 + i * 25" y="60" text-anchor="middle" font-size="12" fill="#475569">
          {{ i }}
        </text>
      </g>

      <!-- Animated arc showing the addition -->
      <path
        v-if="operation === 'addition'"
        :d="additionArc"
        fill="none"
        stroke="#3b82f6"
        stroke-width="3"
        marker-end="url(#arrowhead)"
        class="animated-arc"
      />

      <!-- Arrow marker -->
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
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

const svgWidth = computed(() => Math.max(650, (props.answer + 3) * 25 + 60))
const lineEndX = computed(() => Math.min(620, 30 + (props.answer + 3) * 25))

const additionArc = computed(() => {
  const startX = 30 + props.num1 * 25
  const endX = 30 + (props.num1 + props.num2) * 25
  const arcHeight = 20
  return `M ${startX} 35 Q ${(startX + endX) / 2} ${35 - arcHeight} ${endX} 35`
})
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
</style>

