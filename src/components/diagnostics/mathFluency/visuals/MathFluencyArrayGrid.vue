<template>
  <div class="visual-section">
    <h4>Array Visual:</h4>
    <svg
      :width="svgWidth"
      :height="svgHeight"
      class="array-visual"
    >
      <!-- Draw array of dots -->
      <circle
        v-for="(dot, index) in arrayDots"
        :key="'array-' + index"
        :cx="20 + dot.col * 30"
        :cy="20 + dot.row * 30"
        r="10"
        fill="#8b5cf6"
        class="animated-dot"
        :style="{ animationDelay: `${index * 0.05}s` }"
      />
    </svg>
    <p class="visual-explanation">
      {{ num1 }} groups of {{ num2 }} = {{ answer }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  num1: number
  num2: number
  answer: number
}>()

const svgWidth = computed(() => props.num2 * 30 + 40)
const svgHeight = computed(() => props.num1 * 30 + 60)

const arrayDots = computed(() => {
  const dots: Array<{ row: number; col: number }> = []
  for (let r = 0; r < props.num1; r++) {
    for (let c = 0; c < props.num2; c++) {
      dots.push({ row: r, col: c })
    }
  }
  return dots
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

.array-visual {
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

.visual-explanation {
  margin-top: 1rem;
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}
</style>

