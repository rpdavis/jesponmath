th<template>
  <div class="student-assessments">
    <div class="header">
      <h1>📝 My Assessments</h1>
      <p>Complete your assigned assessments and track your progress</p>
    </div>

    <!-- Assessment Status Summary -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-number">{{ assignedAssessments.length }}</div>
          <div class="stat-label">Assigned</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ completedAssessments.length }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-number">{{ pendingAssessments.length }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">{{ averageScore }}%</div>
          <div class="stat-label">Average Score</div>
        </div>
      </div>
    </div>

    <!-- Pending Assessments -->
    <div v-if="pendingAssessments.length > 0" class="section">
      <h2>🔔 Pending Assessments</h2>
      <div class="assessments-grid">
        <div 
          v-for="assessment in pendingAssessments" 
          :key="assessment.id"
          class="assessment-card pending"
        >
          <div class="assessment-header">
            <h3>{{ assessment.title }}</h3>
            <div class="assessment-meta">
              <span class="standard-tag">{{ assessment.standard }}</span>
              <span class="grade-tag">Grade {{ assessment.gradeLevel }}</span>
              <span v-if="assessment.timeLimit" class="time-tag">
                {{ assessment.timeLimit }} min
              </span>
            </div>
          </div>
          
          <div class="assessment-content">
            <p class="description">{{ assessment.description }}</p>
            
            <div class="assessment-details">
              <div class="detail">
                <span class="detail-label">Questions:</span>
                <span class="detail-value">{{ assessment.questions.length }}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Points:</span>
                <span class="detail-value">{{ assessment.totalPoints }}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Subject:</span>
                <span class="detail-value">{{ assessment.category }}</span>
              </div>
            </div>

            <div v-if="assessment.accommodations.length > 0" class="accommodations">
              <strong>Your Accommodations:</strong>
              <div class="accommodation-tags">
                <span 
                  v-for="accommodation in assessment.accommodations" 
                  :key="accommodation"
                  class="accommodation-tag"
                >
                  {{ accommodation }}
                </span>
              </div>
            </div>

            <div class="assessment-actions">
              <button 
                @click="startAssessment(assessment)" 
                class="start-button"
                :disabled="loading"
              >
                <span class="button-icon">🚀</span>
                Start Assessment
              </button>
              <button 
                @click="previewAssessment(assessment)" 
                class="preview-button"
              >
                <span class="button-icon">👁️</span>
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Completed Assessments -->
    <div v-if="completedAssessments.length > 0" class="section">
      <h2>✅ Completed Assessments</h2>
      <div class="assessments-grid">
        <div 
          v-for="result in completedAssessments" 
          :key="result.id"
          class="assessment-card completed"
        >
          <div class="assessment-header">
            <h3>{{ getAssessmentTitle(result.assessmentId) }}</h3>
            <div class="score-badge" :class="getScoreClass(result.percentage)">
              {{ result.percentage }}%
            </div>
          </div>
          
          <div class="assessment-content">
            <div class="result-details">
              <div class="detail">
                <span class="detail-label">Score:</span>
                <span class="detail-value">{{ result.score }}/{{ result.totalPoints }}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Time:</span>
                <span class="detail-value">{{ result.timeSpent }} min</span>
              </div>
              <div class="detail">
                <span class="detail-label">Completed:</span>
                <span class="detail-value">{{ formatDate(result.completedAt) }}</span>
              </div>
            </div>

            <div v-if="result.feedback" class="feedback">
              <strong>Teacher Feedback:</strong>
              <p>{{ result.feedback }}</p>
            </div>

            <div class="assessment-actions">
              <button 
                @click="viewResults(result)" 
                class="view-button"
              >
                <span class="button-icon">📊</span>
                View Results
              </button>
              <button 
                v-if="canRetakeAssessment(result)" 
                @click="retakeAssessment(result)" 
                class="retake-button"
              >
                <span class="button-icon">🔄</span>
                Retake
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Assessments Message -->
    <div v-if="assignedAssessments.length === 0 && !loading" class="no-assessments">
      <div class="no-assessments-icon">📚</div>
      <h3>No Assessments Assigned</h3>
      <p>Your teacher hasn't assigned any assessments yet. Check back later!</p>
      <router-link to="/" class="back-to-home-button">
        <span class="button-icon">🏠</span>
        Back to Home
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading your assessments...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      <h3>⚠️ Error Loading Assessments</h3>
      <p>{{ error }}</p>
      <button @click="loadAssessments" class="retry-button">Try Again</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getAssessmentsByStudent, getAssessmentResultsByStudent } from '@/firebase/iepServices';
import type { Assessment, AssessmentResult } from '@/types/iep';

const router = useRouter();
const authStore = useAuthStore();

const assignedAssessments = ref<Assessment[]>([]);
const assessmentResults = ref<AssessmentResult[]>([]);
const loading = ref(true);
const error = ref('');

// Computed properties
const completedAssessments = computed(() => assessmentResults.value);

const pendingAssessments = computed(() => {
  const completedIds = assessmentResults.value.map(r => r.assessmentId);
  return assignedAssessments.value.filter(a => !completedIds.includes(a.id));
});

const averageScore = computed(() => {
  if (assessmentResults.value.length === 0) return 0;
  const total = assessmentResults.value.reduce((sum, result) => sum + result.percentage, 0);
  return Math.round(total / assessmentResults.value.length);
});

// Methods
const loadAssessments = async () => {
  // Use the student's SSID or SEIS ID for assessment lookup
  const studentId = authStore.currentUser?.googleId || authStore.currentUser?.seisId || authStore.currentUser?.uid;
  
  if (!studentId) {
    error.value = 'Student ID not found. Please contact your teacher.';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    
    // Load assigned assessments and results
    const [assessments, results] = await Promise.all([
      getAssessmentsByStudent(studentId),
      getAssessmentResultsByStudent(studentId)
    ]);
    
    assignedAssessments.value = assessments;
    assessmentResults.value = results;
  } catch (err) {
    console.error('Error loading assessments:', err);
    error.value = 'Failed to load assessments. Please try again.';
  } finally {
    loading.value = false;
  }
};

const startAssessment = (assessment: Assessment) => {
  router.push(`/assessment/${assessment.id}`);
};

const previewAssessment = (assessment: Assessment) => {
  router.push(`/assessment/${assessment.id}/preview`);
};

const viewResults = (result: AssessmentResult) => {
  router.push(`/assessment/${result.assessmentId}/results/${result.id}`);
};

const retakeAssessment = (result: AssessmentResult) => {
  router.push(`/assessment/${result.assessmentId}`);
};

const canRetakeAssessment = (result: AssessmentResult) => {
  // Allow retakes if score is below 70%
  return result.percentage < 70;
};

const getAssessmentTitle = (assessmentId: string) => {
  const assessment = assignedAssessments.value.find(a => a.id === assessmentId);
  return assessment?.title || 'Unknown Assessment';
};

const getScoreClass = (percentage: number) => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  return 'needs-improvement';
};

const formatDate = (timestamp: any) => {
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
};

// Load assessments on component mount
onMounted(() => {
  loadAssessments();
});
</script>

<style scoped>
.student-assessments {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section {
  margin-bottom: 50px;
}

.section h2 {
  color: #1f2937;
  font-size: 1.8rem;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.assessments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
}

.assessment-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.assessment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.assessment-card.pending {
  border-left: 5px solid #f59e0b;
}

.assessment-card.completed {
  border-left: 5px solid #10b981;
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.assessment-header h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin: 0;
  flex: 1;
}

.assessment-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.standard-tag,
.grade-tag,
.time-tag {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.standard-tag {
  background: #dbeafe;
  color: #1e40af;
}

.grade-tag {
  background: #dcfce7;
  color: #166534;
}

.time-tag {
  background: #fef3c7;
  color: #92400e;
}

.score-badge {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 8px;
  min-width: 60px;
  text-align: center;
}

.score-badge.excellent {
  background: #dcfce7;
  color: #166534;
}

.score-badge.good {
  background: #dbeafe;
  color: #1e40af;
}

.score-badge.fair {
  background: #fef3c7;
  color: #92400e;
}

.score-badge.needs-improvement {
  background: #fef2f2;
  color: #dc2626;
}

.description {
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.5;
}

.assessment-details,
.result-details {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-weight: 600;
  color: #1f2937;
}

.accommodations {
  margin-bottom: 20px;
  padding: 15px;
  background: #f0f4ff;
  border-radius: 10px;
}

.accommodations strong {
  color: #1f2937;
  display: block;
  margin-bottom: 10px;
}

.accommodation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.accommodation-tag {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.feedback {
  margin-bottom: 20px;
  padding: 15px;
  background: #f0fdf4;
  border-radius: 10px;
  border-left: 4px solid #10b981;
}

.feedback strong {
  color: #1f2937;
  display: block;
  margin-bottom: 8px;
}

.feedback p {
  color: #374151;
  line-height: 1.5;
  margin: 0;
}

.assessment-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.start-button,
.preview-button,
.view-button,
.retake-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.9rem;
}

.start-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  flex: 1;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.preview-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.preview-button:hover {
  background: #e5e7eb;
}

.view-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex: 1;
}

.view-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.retake-button {
  background: #fef3c7;
  color: #92400e;
  border: 2px solid #f59e0b;
}

.retake-button:hover {
  background: #fde68a;
}

.button-icon {
  font-size: 1rem;
}

.no-assessments {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-assessments-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.no-assessments h3 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.no-assessments p {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.back-to-home-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.back-to-home-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 40px 20px;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 15px;
  margin-top: 20px;
}

.error-message h3 {
  color: #dc2626;
  margin-bottom: 15px;
}

.error-message p {
  color: #991b1b;
  margin-bottom: 20px;
}

.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .student-assessments {
    padding: 15px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .assessments-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .assessment-details,
  .result-details {
    flex-direction: column;
    gap: 10px;
  }
  
  .assessment-actions {
    flex-direction: column;
  }
}
</style>
