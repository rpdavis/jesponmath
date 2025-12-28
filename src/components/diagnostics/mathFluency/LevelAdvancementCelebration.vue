<template>
  <div v-if="show" class="celebration-overlay" @click="close">
    <div class="celebration-card" @click.stop>
      <div class="celebration-header">
        <div class="celebration-icon">🎉</div>
        <h2>Level Complete!</h2>
      </div>

      <div class="celebration-content">
        <div class="achievement-badge" :style="{ background: previousLevelColor }">
          <span class="badge-icon">{{ previousLevelIcon }}</span>
          <span class="badge-name">{{ previousLevelName }}</span>
          <div class="badge-complete">✓ MASTERED</div>
        </div>

        <div class="advancement-arrow">→</div>

        <div class="achievement-badge new-level" :style="{ background: newLevelColor }">
          <span class="badge-icon">{{ newLevelIcon }}</span>
          <span class="badge-name">{{ newLevelName }}</span>
          <div class="badge-unlocked">🔓 UNLOCKED</div>
        </div>
      </div>

      <div class="proficiency-display">
        <p class="proficiency-text">You achieved <strong>{{ proficiency }}%</strong> proficiency!</p>
        <p class="congratulations">Amazing work! You're ready for more challenging problems.</p>
      </div>

      <button @click="close" class="continue-btn">
        Continue to Next Level →
      </button>
    </div>

    <div class="confetti-container">
      <div v-for="i in 50" :key="i" class="confetti" :style="getConfettiStyle(i)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SUB_LEVEL_CONFIGS } from '@/config/fluencySubLevels'

const props = defineProps<{
  show: boolean
  previousSubLevel?: string
  newSubLevel?: string
  proficiency?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const previousLevelConfig = computed(() =>
  SUB_LEVEL_CONFIGS.find(c => c.id === props.previousSubLevel)
)

const newLevelConfig = computed(() =>
  SUB_LEVEL_CONFIGS.find(c => c.id === props.newSubLevel)
)

const previousLevelName = computed(() => previousLevelConfig.value?.shortName || 'Previous Level')
const previousLevelIcon = computed(() => previousLevelConfig.value?.icon || '🌱')
const previousLevelColor = computed(() => previousLevelConfig.value?.color || '#28a745')

const newLevelName = computed(() => newLevelConfig.value?.shortName || 'Next Level')
const newLevelIcon = computed(() => newLevelConfig.value?.icon || '🌿')
const newLevelColor = computed(() => newLevelConfig.value?.color || '#229954')

function close() {
  emit('close')
}

function getConfettiStyle(index: number) {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 3
  const duration = 3 + Math.random() * 2

  return {
    left: `${left}%`,
    backgroundColor: color,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}
</script>

<style scoped>
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.celebration-card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s;
  position: relative;
  z-index: 10001;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.celebration-header {
  margin-bottom: 2rem;
}

.celebration-icon {
  font-size: 4rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.celebration-header h2 {
  margin: 1rem 0 0 0;
  color: #333;
  font-size: 2rem;
}

.celebration-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
}

.achievement-badge {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  position: relative;
  transition: transform 0.3s;
}

.achievement-badge.new-level {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
}

.badge-icon {
  font-size: 3rem;
}

.badge-name {
  font-size: 0.9rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.badge-complete,
.badge-unlocked {
  position: absolute;
  bottom: -12px;
  background: white;
  color: #28a745;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.badge-unlocked {
  color: #667eea;
}

.advancement-arrow {
  font-size: 2rem;
  color: #28a745;
  font-weight: bold;
  animation: slideRight 1.5s infinite;
}

@keyframes slideRight {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
}

.proficiency-display {
  margin: 2rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
}

.proficiency-text {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #333;
}

.proficiency-text strong {
  color: #28a745;
  font-size: 1.5rem;
}

.congratulations {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.continue-btn {
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  top: -10px;
  animation: fall linear forwards;
}

@keyframes fall {
  to {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}
</style>












