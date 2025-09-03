<template>
  <div class="student-dashboard">
    <div class="dashboard-header">
      <h1>🎓 Student Dashboard</h1>
      <p>Welcome {{ authStore.displayName }}! Complete your assessments and track your progress.</p>
    </div>

    <!-- Student Overview Stats -->
    <div class="stats-section">
      <h2>Your Progress</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentStats.assignedAssessments }}</div>
            <div class="stat-label">Assigned</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentStats.completedAssessments }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentStats.pendingAssessments }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentStats.averageScore }}%</div>
            <div class="stat-label">Average Score</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Assessments - Priority Section -->
    <div v-if="pendingAssessments.length > 0" class="pending-section">
      <div class="section-header">
        <h2>🔔 Assessments to Complete</h2>
        <span class="urgency-badge" v-if="urgentAssessments > 0">
          {{ urgentAssessments }} urgent
        </span>
      </div>
      
      <div class="assessments-grid">
        <div 
          v-for="assessment in pendingAssessments" 
          :key="assessment.id"
          class="assessment-card pending"
          @click="startAssessment(assessment)"
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
                <span class="detail-value">{{ assessment.questions?.length || 0 }}</span>
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

            <div v-if="assessment.accommodations?.length" class="accommodations">
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
          </div>

          <div class="assessment-actions">
            <button @click.stop="startAssessment(assessment)" class="start-button">
              <span class="button-icon">🚀</span>
              Start Assessment
            </button>
            <button @click.stop="previewAssessment(assessment)" class="preview-button">
              <span class="button-icon">👁️</span>
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Results -->
    <div v-if="recentResults.length > 0" class="results-section">
      <div class="section-header">
        <h2>📊 Recent Results</h2>
        <router-link to="/my-results" class="view-all-link">View All →</router-link>
      </div>
      
      <div class="results-grid">
        <div 
          v-for="result in recentResults" 
          :key="result.id"
          class="result-card"
          @click="viewDetailedResult(result)"
        >
          <div class="result-header">
            <h4>{{ result.assessmentTitle }}</h4>
            <div class="score-badge" :class="getScoreClass(result.percentage)">
              {{ result.percentage }}%
            </div>
          </div>
          
          <div class="result-content">
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

            <div v-if="result.feedback" class="feedback-preview">
              <strong>Teacher Feedback:</strong>
              <p>{{ result.feedback.substring(0, 100) }}{{ result.feedback.length > 100 ? '...' : '' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- No Assessments State -->
    <div v-if="pendingAssessments.length === 0 && recentResults.length === 0" class="no-assessments">
      <div class="no-assessments-icon">📚</div>
      <h3>No Assessments Yet</h3>
      <p>Your teacher hasn't assigned any assessments yet. Check back later!</p>
      <button @click="refreshData" class="refresh-button">
        <span class="button-icon">🔄</span>
        Refresh
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getAssessmentsByStudent, getAssessmentResultsByStudent } from '@/firebase/iepServices';

const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(false);

// Real student data
const studentStats = ref({
  assignedAssessments: 0,
  completedAssessments: 0,
  pendingAssessments: 0,
  averageScore: 0
});

const pendingAssessments = ref<any[]>([]);
const recentResults = ref<any[]>([]);

// Computed properties
const urgentAssessments = computed(() => {
  // Count assessments that might be overdue or high priority
  return pendingAssessments.value.filter(a => a.timeLimit && a.timeLimit < 30).length;
});

// Methods
const startAssessment = (assessment: any) => {
  router.push(`/assessment/${assessment.id}/take`);
};

const previewAssessment = (assessment: any) => {
  router.push(`/assessment/${assessment.id}/preview`);
};

const viewDetailedResult = (result: any) => {
  router.push(`/assessment/${result.assessmentId}/result/${result.id}`);
};

const getScoreClass = (percentage: number) => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  return 'needs-improvement';
};



const formatDate = (date: any) => {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamp
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }
  
  // Handle regular Date object or string
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  
  // Try to parse as date string
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    console.warn('Unable to format date:', date);
    return 'Invalid Date';
  }
};

const refreshData = async () => {
  loading.value = true;
  // TODO: Refresh data from Firestore
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const loadStudentData = async () => {
  try {
    console.log('Loading student data from Firestore...');
    
    if (authStore.currentUser?.uid) {
      const studentId = authStore.currentUser?.googleId || authStore.currentUser?.seisId || authStore.currentUser?.uid;
      
      console.log('Student UID:', authStore.currentUser.uid);
      console.log('Student ID for queries:', studentId);
      
      // Load assigned assessments and results
      const [assignedAssessments, completedResults] = await Promise.all([
        getAssessmentsByStudent(studentId),
        getAssessmentResultsByStudent(studentId)
      ]);
      
      console.log('📝 Assigned assessments:', assignedAssessments.length);
      console.log('✅ Completed results:', completedResults.length);
      
      // Calculate average score
      const averageScore = completedResults.length > 0 
        ? Math.round(completedResults.reduce((sum, result) => sum + result.percentage, 0) / completedResults.length)
        : 0;
      
      // Update stats
      studentStats.value = {
        assignedAssessments: assignedAssessments.length,
        completedAssessments: completedResults.length,
        pendingAssessments: assignedAssessments.length - completedResults.length,
        averageScore: averageScore
      };
      
      // Update arrays for display
      pendingAssessments.value = assignedAssessments.filter(assessment => {
        return !completedResults.some(result => result.assessmentId === assessment.id);
      });
      
      recentResults.value = completedResults.slice(0, 5); // Show last 5 results
      
      console.log('📊 Updated student stats:', studentStats.value);
    }
  } catch (error) {
    console.error('Error loading student data:', error);
  }
};

onMounted(() => {
  loadStudentData();
});
</script>

<style scoped>
.student-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}

.dashboard-header h1 {
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.stats-section,
.pending-section,
.results-section,
.progress-section {
  margin-bottom: 50px;
}

.stats-section h2,
.pending-section h2,
.results-section h2,
.progress-section h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.urgency-badge {
  background: #fef2f2;
  color: #dc2626;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.view-all-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.view-all-link:hover {
  text-decoration: underline;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  border-left: 4px solid #2563eb;
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

.assessments-grid,
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
}

.assessment-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.assessment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.assessment-card.pending {
  border-left: 5px solid #f59e0b;
}

.result-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 5px solid #10b981;
}

.result-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.assessment-header,
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.assessment-header h3,
.result-header h4 {
  color: #1f2937;
  font-size: 1.3rem;
  margin: 0;
  flex: 1;
}

.assessment-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
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
  margin-bottom: 15px;
  line-height: 1.5;
}

.assessment-details,
.result-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
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
  margin-bottom: 15px;
  padding: 10px;
  background: #f0f4ff;
  border-radius: 8px;
}

.accommodations strong {
  color: #1f2937;
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.accommodation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.accommodation-tag {
  background: #667eea;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.feedback-preview {
  margin-bottom: 15px;
  padding: 10px;
  background: #f0fdf4;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.feedback-preview strong {
  color: #1f2937;
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.feedback-preview p {
  color: #374151;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.assessment-actions {
  display: flex;
  gap: 10px;
}

.start-button,
.preview-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.start-button {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  flex: 1;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
}

.preview-button {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.preview-button:hover {
  background: #e5e7eb;
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

.refresh-button {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
}

.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .student-dashboard {
    padding: 15px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .assessments-grid,
  .results-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .assessment-details,
  .result-details {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .assessment-actions {
    flex-direction: column;
  }
  

}
</style>
