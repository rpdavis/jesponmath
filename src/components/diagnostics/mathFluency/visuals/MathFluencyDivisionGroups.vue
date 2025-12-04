<template>
  <div class="visual-section">
    <h4>Division Groups:</h4>
    <svg
      :width="svgWidth"
      :height="200"
      class="division-visual"
    >
      <g
        v-for="(group, groupIndex) in divisionGroups"
        :key="'group-' + groupIndex"
      >
        <rect
          :x="groupIndex * 80 + 10"
          y="30"
          width="60"
          height="150"
          fill="none"
          stroke="#f59e0b"
          stroke-width="2"
          stroke-dasharray="5,5"
          rx="8"
        />
        <circle
          v-for="(dot, dotIndex) in group.dots"
          :key="'div-dot-' + groupIndex + '-' + dotIndex"
          :cx="groupIndex * 80 + 20 + (dotIndex % 2) * 30"
          :cy="45 + Math.floor(dotIndex / 2) * 30"
          r="10"
          fill="#f59e0b"
          class="animated-dot"
          :style="{
            animationDelay: `${(groupIndex * group.dots.length + dotIndex) * 0.05}s`,
          }"
        />
      </g>
    </svg>
    <p class="visual-explanation">
      {{ dividend }} ÷ {{ divisor }} = {{ answer }} groups
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dividend: number
  divisor: number
  answer: number
}>()

const svgWidth = computed(() => Math.max(400, props.answer * 80 + 40))

const divisionGroups = computed(() => {
  const groups: Array<{ dots: number[] }> = []
  for (let g = 0; g < props.answer; g++) {
    groups.push({
      dots: Array(props.divisor)
        .fill(0)
        .map((_, i) => i),
    })
  }
  return groups
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

.division-visual {
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

