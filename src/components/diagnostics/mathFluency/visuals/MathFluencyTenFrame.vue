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

      <!-- Second ten-frame if answer > 10 -->
      <g v-if="answer > 10">
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
        <circle
          v-for="i in answer - 10"
          :key="'dot2-' + i"
          :cx="((i - 1) % 5) * 40 + 27.5"
          :cy="Math.floor((i - 1) / 5) * 40 + 127.5"
          r="12"
          fill="#10b981"
          class="animated-dot"
          :style="{ animationDelay: `${(10 + i) * 0.1}s` }"
        />
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

const height = computed(() => (props.answer > 10 ? 200 : 100))
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
</style>

