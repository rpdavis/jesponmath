<template>
  <div class="start-section">
    <div class="progress-overview">
      <h3>Your Progress - {{ capitalizeOperation(currentOperation) }}</h3>

      <div class="proficiency-bars">
        <div class="bar-item mastered">
          <span class="bar-label">🏆 Mastered</span>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{ width: `${(distribution.mastered / distribution.total) * 100}%` }"
            ></div>
          </div>
          <span class="bar-count">{{ distribution.mastered }}</span>
        </div>

        <div class="bar-item proficient">
          <span class="bar-label">🔵 Proficient</span>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{ width: `${(distribution.proficient / distribution.total) * 100}%` }"
            ></div>
          </div>
          <span class="bar-count">{{ distribution.proficient }}</span>
        </div>

        <div class="bar-item approaching">
          <span class="bar-label">🟡 Approaching</span>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{ width: `${(distribution.approaching / distribution.total) * 100}%` }"
            ></div>
          </div>
          <span class="bar-count">{{ distribution.approaching }}</span>
        </div>

        <div class="bar-item emerging">
          <span class="bar-label">🟢 Emerging</span>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{ width: `${(distribution.emerging / distribution.total) * 100}%` }"
            ></div>
          </div>
          <span class="bar-count">{{ distribution.emerging }}</span>
        </div>

        <div class="bar-item does-not-know">
          <span class="bar-label">🔴 Learning</span>
          <div class="bar-container">
            <div
              class="bar-fill"
              :style="{ width: `${(distribution.doesNotKnow / distribution.total) * 100}%` }"
            ></div>
          </div>
          <span class="bar-count">{{ distribution.doesNotKnow }}</span>
        </div>
      </div>

      <div class="unlock-progress">
        <h4>Progress to Unlock {{ nextOperationName }}:</h4>
        <div class="unlock-bar">
          <div class="unlock-fill" :style="{ width: `${proficiencyPercentage}%` }"></div>
          <span class="unlock-text">{{ proficiencyPercentage }}% / 95%</span>
        </div>
      </div>

      <div class="streak-display">
        <span class="streak-icon">🔥</span>
        <span class="streak-text">{{ practiceStreak }} day streak!</span>
      </div>
    </div>

    <div class="session-info">
      <h3>Today's Practice Plan:</h3>
      <div class="rounds-preview">
        <div class="round-card">
          <div class="round-header">Round 1: Learning</div>
          <p>{{ round1Count }} facts to learn</p>
          <p class="round-time">~4-5 minutes</p>
        </div>
        <div class="round-card">
          <div class="round-header">Round 2: Practice</div>
          <p>{{ round2Count }} facts (mixed)</p>
          <p class="round-time">~4-5 minutes</p>
        </div>
        <div class="round-card">
          <div class="round-header">Round 3: Quick Check</div>
          <p>{{ round3Count }} facts</p>
          <p class="round-time">~2 minutes</p>
        </div>
      </div>
      <p class="total-time">Total: ~10-12 minutes</p>
    </div>

    <button @click="$emit('start-practice')" class="start-practice-btn">
      🚀 Start Today's Practice
    </button>
  </div>
</template>

<script setup lang="ts">
import type { OperationType } from '@/types/mathFluency'

defineProps<{
  currentOperation: OperationType
  distribution: {
    mastered: number
    proficient: number
    approaching: number
    emerging: number
    doesNotKnow: number
    total: number
  }
  proficiencyPercentage: number
  nextOperationName: string
  practiceStreak: number
  round1Count: number
  round2Count: number
  round3Count: number
}>()

defineEmits<{
  'start-practice': []
}>()

function capitalizeOperation(op: OperationType | string): string {
  return op.charAt(0).toUpperCase() + op.slice(1)
}
</script>

<style scoped>
.start-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-overview {
  margin-bottom: 2rem;
}

.progress-overview h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  text-align: center;
}

.proficiency-bars {
  margin: 1.5rem 0;
}

.bar-item {
  display: grid;
  grid-template-columns: 150px 1fr 60px;
  align-items: center;
  gap: 1rem;
  margin: 0.75rem 0;
}

.bar-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.bar-container {
  height: 24px;
  background: #eee;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.bar-item.mastered .bar-fill {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.bar-item.proficient .bar-fill {
  background: linear-gradient(90deg, #007bff, #0056b3);
}

.bar-item.approaching .bar-fill {
  background: linear-gradient(90deg, #ffc107, #ff9800);
}

.bar-item.emerging .bar-fill {
  background: linear-gradient(90deg, #17a2b8, #138496);
}

.bar-item.does-not-know .bar-fill {
  background: linear-gradient(90deg, #dc3545, #c82333);
}

.bar-count {
  font-weight: bold;
  text-align: right;
  color: #333;
}

.unlock-progress {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.unlock-progress h4 {
  margin: 0 0 1rem 0;
  text-align: center;
  color: #333;
}

.unlock-bar {
  height: 40px;
  background: #eee;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.unlock-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.5s;
}

.unlock-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.streak-display {
  text-align: center;
  margin: 1.5rem 0;
  font-size: 1.3rem;
}

.streak-icon {
  font-size: 2rem;
  margin-right: 0.5rem;
}

.streak-text {
  font-weight: bold;
  color: #ff6b00;
}

.session-info {
  margin: 2rem 0;
}

.session-info h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.rounds-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.round-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #ddd;
  text-align: center;
}

.round-header {
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.round-card p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.round-time {
  font-style: italic;
  color: #999 !important;
}

.total-time {
  text-align: center;
  font-weight: bold;
  color: #333;
  margin-top: 1rem;
}

.start-practice-btn {
  width: 100%;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  margin-top: 2rem;
}

.start-practice-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}
</style>

