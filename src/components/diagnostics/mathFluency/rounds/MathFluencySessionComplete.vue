<template>
  <div class="complete-section">
    <h2>🎉 Great Practice Session!</h2>

    <div class="session-summary">
      <h3>Today You:</h3>
      <div class="summary-achievements">
        <div
          class="achievement-item"
          v-if="session.round1_learning?.newlyLearned && session.round1_learning.newlyLearned.length > 0"
        >
          <span class="achievement-icon">📚</span>
          <span>Learned {{ session.round1_learning.newlyLearned.length }} new facts</span>
        </div>
        <div class="achievement-item">
          <span class="achievement-icon">💪</span>
          <span>Practiced {{ session.round2_practice?.problemsPresented?.length || 0 }} facts</span>
        </div>
        <div class="achievement-item">
          <span class="achievement-icon">✓</span>
          <span>{{ session.round2_practice?.accuracy || 0 }}% accuracy in practice</span>
        </div>
        <div class="achievement-item" v-if="promotionsEarned.length > 0">
          <span class="achievement-icon">⭐</span>
          <span>{{ promotionsEarned.length }} facts promoted!</span>
        </div>
      </div>

      <div v-if="promotionsEarned.length > 0" class="promotions-list">
        <h4>Facts Promoted Today:</h4>
        <div v-for="problemId in promotionsEarned.slice(0, 5)" :key="problemId" class="promotion-item">
          <span class="promotion-icon">🎊</span>
          <span>{{ getProblemDisplay(problemId) }} is now {{ getNewLevel(problemId) }}!</span>
        </div>
        <p v-if="promotionsEarned.length > 5">
          ...and {{ promotionsEarned.length - 5 }} more!
        </p>
      </div>

      <div class="session-quality-display">
        <h4>Session Quality: {{ sessionQualityDisplay }}</h4>
        <p class="session-time">Total Time: {{ Math.round(totalTime / 60) }} minutes</p>
      </div>

      <div class="tomorrow-preview">
        <h4>Tomorrow's Goal:</h4>
        <p>Practice {{ Math.min(15, distribution.emerging + distribution.doesNotKnow) }} facts</p>
      </div>
    </div>

    <div class="complete-actions">
      <button @click="$emit('view-progress')" class="progress-btn">See My Progress</button>
      <button @click="$emit('finish')" class="done-btn">Done for Today</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MathFluencyPracticeSession } from '@/types/mathFluency'
import { getProblemDisplay } from '@/utils/mathFluencyProblemUtils'

const props = defineProps<{
  session: Partial<MathFluencyPracticeSession>
  promotionsEarned: string[]
  totalTime: number
  distribution: {
    emerging: number
    doesNotKnow: number
  }
}>()

defineEmits<{
  'view-progress': []
  finish: []
}>()

const sessionQualityDisplay = computed(() => {
  const qualities = {
    excellent: '🏆 Excellent',
    good: '⭐ Good',
    fair: '👍 Fair',
    incomplete: '⚠️ Incomplete',
  }
  return qualities[props.session.sessionQuality as keyof typeof qualities] || 'Good'
})

function getNewLevel(problemId: string): string {
  // TODO: Get actual new level from updated progress
  return 'PROFICIENT'
}
</script>

<style scoped>
.complete-section {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.complete-section h2 {
  color: #28a745;
  margin-bottom: 2rem;
}

.session-summary {
  margin: 2rem 0;
}

.summary-achievements {
  margin: 1.5rem 0;
}

.achievement-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  margin: 0.5rem 0;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 1.1rem;
}

.achievement-icon {
  font-size: 2rem;
}

.promotions-list {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #d4edda;
  border-radius: 8px;
}

.promotions-list h4 {
  margin: 0 0 1rem 0;
  color: #155724;
}

.promotion-item {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.promotion-icon {
  font-size: 1.5rem;
}

.session-quality-display {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #e7f3ff;
  border-radius: 8px;
}

.session-quality-display h4 {
  margin: 0 0 0.5rem 0;
  color: #007bff;
  font-size: 1.3rem;
}

.session-time {
  color: #666;
  margin: 0.5rem 0;
}

.tomorrow-preview {
  margin: 2rem 0;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
}

.tomorrow-preview h4 {
  margin: 0 0 0.5rem 0;
  color: #856404;
}

.tomorrow-preview p {
  margin: 0;
  color: #856404;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.progress-btn,
.done-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.progress-btn {
  background: #007bff;
  color: white;
}

.progress-btn:hover {
  background: #0056b3;
}

.done-btn {
  background: #6c757d;
  color: white;
}

.done-btn:hover {
  background: #5a6268;
}
</style>

