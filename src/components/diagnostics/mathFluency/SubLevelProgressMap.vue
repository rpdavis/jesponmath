<template>
  <div class="sublevel-progress-map">
    <h4>📍 Your Learning Journey</h4>

    <!-- Current Sub-Level Info -->
    <div class="current-level-card">
      <div class="level-badge" :style="{ background: currentConfig?.color }">
        <span class="level-icon">{{ currentConfig?.icon }}</span>
        <span class="level-name">{{ currentConfig?.shortName }}</span>
      </div>
      <div class="level-details">
        <h5>{{ currentConfig?.name }}</h5>
        <p class="level-description">{{ currentConfig?.description }}</p>

        <!-- Next Goal -->
        <div class="next-goal">
          <div v-if="proficiencyPercentage < readyThreshold" class="goal-progress">
            <p class="goal-text">
              <strong>Next Goal:</strong> Reach {{ readyThreshold }}% proficiency to advance
            </p>
            <div class="goal-bar">
              <div class="goal-fill" :style="{ width: `${(proficiencyPercentage / readyThreshold) * 100}%` }"></div>
            </div>
            <p class="goal-status">{{ proficiencyPercentage }}% / {{ readyThreshold }}% ({{ readyThreshold - proficiencyPercentage }}% to go!)</p>
          </div>
          <div v-else class="goal-ready">
            <p class="ready-message">🎉 You're ready to advance to the next level!</p>
            <p class="ready-subtext">Complete today's practice to unlock {{ nextLevelName }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Path -->
    <div class="progress-path">
      <h5>Complete Journey - 16 Levels ({{ completedCount }}/{{ totalLevels }} completed)</h5>
      <div class="levels-grid">
        <div
          v-for="config in allLevels"
          :key="config.id"
          class="level-node"
          :class="{
            completed: isCompleted(config),
            current: isCurrent(config),
            locked: isLocked(config),
            'same-operation': config.operation === currentOperation
          }"
        >
          <div class="node-circle" :style="{ borderColor: config.color }">
            <span v-if="isCompleted(config)" class="node-check">✓</span>
            <span v-else-if="isCurrent(config)" class="node-current">●</span>
            <span v-else-if="isLocked(config)" class="node-lock">🔒</span>
            <span v-else class="node-icon">{{ config.icon }}</span>
          </div>
          <div class="node-label">{{ config.shortName }}</div>
          <div class="node-order">Level {{ config.order }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SUB_LEVEL_CONFIGS } from '@/config/fluencySubLevels'
import type { SubLevel, OperationType } from '@/types/mathFluency'

const props = defineProps<{
  currentSubLevel: SubLevel
  completedSubLevels: SubLevel[]
  currentOperation: OperationType
  proficiencyPercentage: number
}>()

const readyThreshold = 85

const allLevels = computed(() => SUB_LEVEL_CONFIGS)

const currentConfig = computed(() =>
  SUB_LEVEL_CONFIGS.find(c => c.id === props.currentSubLevel)
)

const nextLevelName = computed(() => {
  const currentOrder = currentConfig.value?.order || 0
  const nextLevel = SUB_LEVEL_CONFIGS.find(c => c.order === currentOrder + 1)
  return nextLevel?.shortName || 'Next Operation'
})

const totalLevels = computed(() => SUB_LEVEL_CONFIGS.length)

const completedCount = computed(() => props.completedSubLevels.length)

function isCompleted(config: typeof SUB_LEVEL_CONFIGS[0]): boolean {
  return props.completedSubLevels.includes(config.id as SubLevel)
}

function isCurrent(config: typeof SUB_LEVEL_CONFIGS[0]): boolean {
  return config.id === props.currentSubLevel
}

function isLocked(config: typeof SUB_LEVEL_CONFIGS[0]): boolean {
  const currentOrder = currentConfig.value?.order || 0
  return config.order > currentOrder && !isCompleted(config)
}
</script>

<style scoped>
.sublevel-progress-map {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sublevel-progress-map h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.current-level-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.level-badge {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.level-icon {
  font-size: 2rem;
}

.level-name {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.level-details {
  flex: 1;
}

.level-details h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.level-description {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.95rem;
}

.next-goal {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.goal-text {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 0.95rem;
}

.goal-bar {
  height: 30px;
  background: #eee;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  margin: 0.5rem 0;
}

.goal-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s ease;
}

.goal-status {
  margin: 0.5rem 0 0 0;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.goal-ready {
  text-align: center;
}

.ready-message {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #28a745;
}

.ready-subtext {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.progress-path {
  margin-top: 2rem;
}

.progress-path h5 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.1rem;
  text-align: center;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.level-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
  transition: all 0.3s;
}

.level-node.current {
  opacity: 1;
  transform: scale(1.15);
}

.level-node.completed {
  opacity: 0.8;
}

.level-node.same-operation {
  opacity: 1;
}

.level-node.locked {
  opacity: 0.3;
}

.node-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  font-size: 1.5rem;
  transition: all 0.3s;
}

.level-node.current .node-circle {
  border-width: 4px;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  animation: pulse 2s infinite;
}

.level-node.completed .node-circle {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(102, 126, 234, 0.1);
  }
}

.node-check {
  color: white;
  font-weight: bold;
}

.node-current {
  color: #667eea;
  font-size: 2rem;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.node-lock {
  font-size: 1.2rem;
}

.node-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.node-order {
  font-size: 0.7rem;
  color: #999;
}
</style>









