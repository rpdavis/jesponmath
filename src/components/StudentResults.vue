<template>
  <div class="student-results">
    <div class="results-header">
      <h1>📊 My Results</h1>
      <p>View your assessment results and progress</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading your results...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- No Results State -->
    <div v-if="!loading && !error && assessmentResults.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No Results Yet</h3>
      <p>You haven't completed any assessments yet. Check your "To Do" list for available assessments.</p>
    </div>

    <!-- Results Grid -->
    <div v-if="!loading && !error && assessmentResults.length > 0" class="results-content">
      <!-- Results Summary -->
      <div class="results-summary">
        <div class="summary-card">
          <div class="summary-icon">📈</div>
          <div class="summary-content">
            <h3>{{ assessmentResults.length }}</h3>
            <p>Completed</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-icon">⭐</div>
          <div class="summary-content">
            <h3>{{ averageScore }}%</h3>
            <p>Average Score</p>
          </div>
        </div>
      </div>

      <!-- Results List -->
      <div class="results-list">
        <div 
          v-for="result in assessmentResults" 
          :key="result.id"
          class="result-card"
          :class="getScoreClass(result.percentage)"
        >
          <div class="result-header">
            <div class="result-title">
              <h3>{{ getAssessmentTitle(result.assessmentId) }}</h3>
              <span class="result-standard">{{ getAssessmentStandards(result.assessmentId) }}</span>
            </div>
            <div class="result-score">
              <span class="score-main">{{ result.score }}/{{ result.totalPoints }}</span>
              <span class="score-percentage">{{ result.percentage }}%</span>
            </div>
          </div>

          <div class="result-details">
            <div class="result-stats">
              <div class="stat">
                <span class="stat-icon">✅</span>
                <span class="stat-text">{{ getCorrectAnswers(result) }} Correct</span>
              </div>
              <div class="stat">
                <span class="stat-icon">❌</span>
                <span class="stat-text">{{ getIncorrectAnswers(result) }} Incorrect</span>
              </div>
              <div class="stat">
                <span class="stat-icon">⏱️</span>
                <span class="stat-text">{{ result.timeSpent }} min</span>
              </div>
            </div>
            
            <div class="result-date">
              <span class="date-icon">📅</span>
              <span class="date-text">{{ formatDate(result.completedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { getAssessmentResultsByStudent, getAssessmentsByStudent } from '@/firebase/iepServices';
import type { AssessmentResult, Assessment } from '@/types/iep';

const authStore = useAuthStore();

// State
const loading = ref(true);
const error = ref('');
const assessmentResults = ref<AssessmentResult[]>([]);
const assessments = ref<Assessment[]>([]);

// Computed properties
const averageScore = computed(() => {
  if (assessmentResults.value.length === 0) return 0;
  const total = assessmentResults.value.reduce((sum, result) => sum + result.percentage, 0);
  return Math.round(total / assessmentResults.value.length);
});

// Methods
const loadResults = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const studentId = authStore.currentUser?.googleId || authStore.currentUser?.seisId || authStore.currentUser?.uid;
    
    if (!studentId) {
      error.value = 'Student ID not found. Please contact your teacher.';
      return;
    }
    
    // Load results and assessments
    const [results, assessmentsList] = await Promise.all([
      getAssessmentResultsByStudent(studentId),
      getAssessmentsByStudent(studentId)
    ]);
    
    assessmentResults.value = results;
    assessments.value = assessmentsList;
  } catch (err) {
    console.error('Error loading results:', err);
    error.value = 'Failed to load results. Please try again.';
  } finally {
    loading.value = false;
  }
};

const getAssessmentTitle = (assessmentId: string) => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  return assessment?.title || 'Unknown Assessment';
};

const getAssessmentStandards = (assessmentId: string) => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  return assessment?.standard || '';
};

const getScoreClass = (percentage: number) => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  return 'needs-improvement';
};

const getCorrectAnswers = (result: AssessmentResult) => {
  if (!result.responses) return 0;
  return result.responses.filter(response => response.isCorrect).length;
};

const getIncorrectAnswers = (result: AssessmentResult) => {
  if (!result.responses) return 0;
  return result.responses.filter(response => !response.isCorrect).length;
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Initialize
onMounted(() => {
  loadResults();
});
</script>

<style scoped>
.student-results {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.results-header {
  text-align: center;
  margin-bottom: 30px;
}

.results-header h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 2rem;
}

.results-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  margin: 20px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #34495e;
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  font-size: 2.5rem;
}

.summary-content h3 {
  margin: 0 0 4px 0;
  font-size: 2rem;
  color: #2c3e50;
}

.summary-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 5px solid #e1e8ed;
}

.result-card.excellent {
  border-left-color: #27ae60;
}

.result-card.good {
  border-left-color: #f39c12;
}

.result-card.fair {
  border-left-color: #e67e22;
}

.result-card.needs-improvement {
  border-left-color: #e74c3c;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.result-title h3 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.result-standard {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.result-score {
  text-align: right;
}

.score-main {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.score-percentage {
  display: block;
  font-size: 1.1rem;
  color: #7f8c8d;
}

.result-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-icon {
  font-size: 1rem;
}

.result-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .result-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .result-stats {
    flex-wrap: wrap;
  }
}
</style>