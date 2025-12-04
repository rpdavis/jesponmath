<template>
  <div class="timer-bar-wrapper">
    <div class="timer-bar-container">
      <div
        class="timer-bar-fill"
        :class="timerClass"
        :style="{ width: `${(timeRemaining / totalTime) * 100}%` }"
      ></div>
    </div>
    <p v-if="showText" class="timer-text">{{ timeRemaining }}s</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  timeRemaining: number
  totalTime: number
  showText?: boolean
}>()

const timerClass = computed(() => {
  const timePercent = (props.timeRemaining / props.totalTime) * 100
  if (timePercent > 60) return 'plenty-time'
  if (timePercent > 30) return 'some-time'
  return 'running-out'
})
</script>

<style scoped>
.timer-bar-wrapper {
  width: 100%;
}

.timer-bar-container {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin: 0 auto 0.5rem auto;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.timer-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition:
    width 1s linear,
    background-color 0.3s ease;
}

.timer-bar-fill.plenty-time {
  background: linear-gradient(90deg, #4caf50, #66bb6a);
}

.timer-bar-fill.some-time {
  background: linear-gradient(90deg, #ff9800, #ffb74d);
}

.timer-bar-fill.running-out {
  background: linear-gradient(90deg, #f44336, #ef5350);
  animation: pulse-bar 0.5s ease-in-out infinite;
}

@keyframes pulse-bar {
  0%,
  100% {
    opacity: 1;
    transform: scaleY(1);
  }
  50% {
    opacity: 0.85;
    transform: scaleY(1.1);
  }
}

.timer-text {
  font-size: 1.2rem;
  color: #666;
  font-weight: 600;
  margin: 0.5rem 0 2rem 0;
  text-align: center;
}
</style>

