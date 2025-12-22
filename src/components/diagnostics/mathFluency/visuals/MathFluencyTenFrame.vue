<template>
  <div class="visual-section">
    <h4>Ten-Frame:</h4>
    <svg :width="230" :height="height" class="ten-frame-visual">
      <!-- First ten-frame grid -->
      <rect
        v-for="i in 10"
        :key="'frame-' + i"
        :x="((i - 1) % 5) * 40 + 10"
        :y="Math.floor((i - 1) / 5) * 40 + 10"
        width="35"
        height="35"
        fill="none"
        stroke="#94a3b8"
        stroke-width="2"
        rx="4"
      />

      <!-- Dots with animation -->
      <g v-if="operation === 'addition'">
        <circle
          v-for="i in Math.min(10, answer)"
          :key="'dot1-' + i"
          :cx="((i - 1) % 5) * 40 + 27.5"
          :cy="Math.floor((i - 1) / 5) * 40 + 27.5"
          r="12"
          :fill="i <= num1 ? '#3b82f6' : '#10b981'"
          class="animated-dot"
          :style="{ animationDelay: `${i * 0.1}s` }"
        />
      </g>

      <!-- Subtraction: Show minuend dots with subtrahend crossed out -->
      <g v-else-if="operation === 'subtraction'">
        <!-- All minuend dots -->
        <circle
          v-for="i in Math.min(10, num1)"
          :key="'dot1-' + i"
          :cx="((i - 1) % 5) * 40 + 27.5"
          :cy="Math.floor((i - 1) / 5) * 40 + 27.5"
          r="12"
          :fill="i <= answer ? '#3b82f6' : '#cbd5e1'"
          class="animated-dot"
          :style="{ animationDelay: `${i * 0.1}s` }"
        />
        <!-- X marks on crossed-out dots (the subtrahend) -->
        <g v-for="i in Math.min(10, num2)" :key="'x1-' + i">
          <line
            :x1="((num1 - i) % 5) * 40 + 22.5"
            :y1="Math.floor((num1 - i) / 5) * 40 + 22.5"
            :x2="((num1 - i) % 5) * 40 + 32.5"
            :y2="Math.floor((num1 - i) / 5) * 40 + 32.5"
            stroke="#ef4444"
            stroke-width="3"
            stroke-linecap="round"
            class="animated-x"
            :style="{ animationDelay: `${(num1 + i) * 0.1}s` }"
          />
          <line
            :x1="((num1 - i) % 5) * 40 + 32.5"
            :y1="Math.floor((num1 - i) / 5) * 40 + 22.5"
            :x2="((num1 - i) % 5) * 40 + 22.5"
            :y2="Math.floor((num1 - i) / 5) * 40 + 32.5"
            stroke="#ef4444"
            stroke-width="3"
            stroke-linecap="round"
            class="animated-x"
            :style="{ animationDelay: `${(num1 + i) * 0.1}s` }"
          />
        </g>
      </g>

      <!-- Second ten-frame if needed -->
      <g v-if="(operation === 'addition' && answer > 10) || (operation === 'subtraction' && num1 > 10)">
        <rect
          v-for="i in 10"
          :key="'frame2-' + i"
          :x="((i - 1) % 5) * 40 + 10"
          :y="Math.floor((i - 1) / 5) * 40 + 110"
          width="35"
          height="35"
          fill="none"
          stroke="#94a3b8"
          stroke-width="2"
          rx="4"
        />

        <!-- Addition: second frame dots -->
        <circle
          v-if="operation === 'addition' && answer > 10"
          v-for="i in answer - 10"
          :key="'dot2-' + i"
          :cx="((i - 1) % 5) * 40 + 27.5"
          :cy="Math.floor((i - 1) / 5) * 40 + 127.5"
          r="12"
          :fill="(10 + i) <= num1 ? '#3b82f6' : '#10b981'"
          class="animated-dot"
          :style="{ animationDelay: `${(10 + i) * 0.1}s` }"
        />

        <!-- Subtraction: second frame dots and X marks -->
        <g v-else-if="operation === 'subtraction' && num1 > 10">
          <!-- Dots for second frame -->
          <circle
            v-for="i in num1 - 10"
            :key="'dot2-' + i"
            :cx="((i - 1) % 5) * 40 + 27.5"
            :cy="Math.floor((i - 1) / 5) * 40 + 127.5"
            r="12"
            :fill="(10 + i) <= answer ? '#3b82f6' : '#cbd5e1'"
            class="animated-dot"
            :style="{ animationDelay: `${(10 + i) * 0.1}s` }"
          />
          <!-- X marks on second frame if needed -->
          <g v-for="i in Math.max(0, num2 - (num1 - (num1 - 10)))" :key="'x2-' + i">
            <line
              :x1="((num1 - 10 - i) % 5) * 40 + 22.5"
              :y1="Math.floor((num1 - 10 - i) / 5) * 40 + 122.5"
              :x2="((num1 - 10 - i) % 5) * 40 + 32.5"
              :y2="Math.floor((num1 - 10 - i) / 5) * 40 + 132.5"
              stroke="#ef4444"
              stroke-width="3"
              stroke-linecap="round"
              class="animated-x"
              :style="{ animationDelay: `${(num1 + i) * 0.1}s` }"
            />
            <line
              :x1="((num1 - 10 - i) % 5) * 40 + 32.5"
              :y1="Math.floor((num1 - 10 - i) / 5) * 40 + 122.5"
              :x2="((num1 - 10 - i) % 5) * 40 + 22.5"
              :y2="Math.floor((num1 - 10 - i) / 5) * 40 + 132.5"
              stroke="#ef4444"
              stroke-width="3"
              stroke-linecap="round"
              class="animated-x"
              :style="{ animationDelay: `${(num1 + i) * 0.1}s` }"
            />
          </g>
        </g>
      </g>
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

const height = computed(() => {
  // For addition, check if answer > 10
  // For subtraction, check if minuend (num1) > 10
  const needsTwoFrames = props.operation === 'addition'
    ? props.answer > 10
    : props.num1 > 10
  return needsTwoFrames ? 200 : 100
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

.ten-frame-visual {
  display: block;
  margin: 0 auto;
}

.animated-dot {
  animation: pop-in 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animated-x {
  animation: draw-x 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes draw-x {
  0% {
    opacity: 0;
    stroke-width: 0;
  }
  100% {
    opacity: 1;
    stroke-width: 3;
  }
}
</style>

