<template>
  <div class="progress-tracking">
    <div class="header">
      <h1>📈 Progress Tracking</h1>
      <p>Monitor student progress on IEP math goals</p>
    </div>

    <!-- Student Selection -->
    <div class="student-selector">
      <label for="student-select">Select Student:</label>
      <select id="student-select" v-model="selectedStudentId" @change="loadStudentProgress" class="form-select">
        <option value="">Choose a student...</option>
        <option v-if="loadingStudents" disabled>Loading students...</option>
        <option v-for="student in students" :key="student.uid" :value="student.uid">
          {{ student.firstName }} {{ student.lastName }}
          <span v-if="student.googleId">(Google ID: {{ student.googleId }})</span>
          <span v-else>({{ student.email }})</span>
        </option>
      </select>
    </div>

    <!-- Progress Overview -->
    <div v-if="selectedStudentId && studentProgress" class="progress-overview">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentProgress.totalAssessments }}</div>
            <div class="stat-label">Total Assessments</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentProgress.completedAssessments }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentProgress.averageScore }}%</div>
            <div class="stat-label">Average Score</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentProgress.goalsOnTrack }}</div>
            <div class="stat-label">Goals On Track</div>
          </div>
        </div>
      </div>

      <!-- Recent Assessment Results -->
      <div class="recent-results">
        <h2>Recent Assessment Results</h2>
        <div class="results-list">
          <div 
            v-for="result in recentResults" 
            :key="result.id"
            class="result-item"
          >
            <div class="result-header">
              <h4>{{ result.assessmentTitle }}</h4>
              <div class="score-badge" :class="getScoreClass(result.percentage)">
                {{ result.percentage }}%
              </div>
            </div>
            <div class="result-details">
              <span class="detail">📅 {{ formatDate(result.completedAt) }}</span>
              <span class="detail">⏱️ {{ result.timeSpent }} min</span>
              <span class="detail">📊 {{ result.score }}/{{ result.totalPoints }} points</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Student Selected -->
    <div v-else-if="!selectedStudentId" class="no-selection">
      <div class="no-selection-icon">👆</div>
      <h3>Select a Student</h3>
      <p>Choose a student from the dropdown above to view their progress</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading progress data...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      <h3>⚠️ Error Loading Progress</h3>
      <p>{{ error }}</p>
      <button @click="loadStudentProgress" class="retry-button">Try Again</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAssessmentResultsByStudent } from '@/firebase/iepServices';
import { getAllStudents, getStudentsByTeacher } from '@/firebase/userServices';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import type { AssessmentResult } from '@/types/iep';
import type { Student as FirebaseStudent } from '@/types/users';

const authStore = useAuthStore();
const permissions = usePermissions();

const selectedStudentId = ref('');
const loading = ref(false);
const loadingStudents = ref(true);
const error = ref('');
const assessmentResults = ref<AssessmentResult[]>([]);

// Load real students from database
const students = ref<FirebaseStudent[]>([]);

// Computed properties
const studentProgress = computed(() => {
  if (!selectedStudentId.value || assessmentResults.value.length === 0) return null;
  
  const results = assessmentResults.value;
  const totalAssessments = results.length;
  const completedAssessments = results.filter(r => r.completedAt).length;
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;
  const goalsOnTrack = results.filter(r => r.percentage >= 70).length;
  
  return {
    totalAssessments,
    completedAssessments,
    averageScore,
    goalsOnTrack
  };
});

const recentResults = computed(() => {
  return assessmentResults.value
    .filter(r => r.completedAt)
    .sort((a, b) => b.completedAt.seconds - a.completedAt.seconds)
    .slice(0, 5)
    .map(result => ({
      ...result,
      assessmentTitle: `Assessment ${result.assessmentId.slice(-6)}` // Simplified title
    }));
});

// Methods
const loadStudentProgress = async () => {
  if (!selectedStudentId.value) return;
  
  try {
    loading.value = true;
    error.value = '';
    
    const results = await getAssessmentResultsByStudent(selectedStudentId.value);
    assessmentResults.value = results;
  } catch (err) {
    console.error('Error loading student progress:', err);
    error.value = 'Failed to load progress data. Please try again.';
  } finally {
    loading.value = false;
  }
};

const getScoreClass = (percentage: number) => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  return 'needs-improvement';
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch (error) {
    console.warn('Unable to format date:', timestamp);
    return 'Invalid Date';
  }
};

// Load students from database
const loadStudents = async () => {
  try {
    loadingStudents.value = true;
    error.value = '';
    
    if (permissions.isAdmin) {
      // Admins can view progress for all students
      console.log('Loading all students for progress tracking...');
      students.value = await getAllStudents();
    } else if (permissions.isTeacher && authStore.currentUser?.uid) {
      // Teachers can only view progress for their assigned students
      console.log('Loading assigned students for progress tracking...');
      students.value = await getStudentsByTeacher(authStore.currentUser.uid);
    } else {
      students.value = [];
    }
    
    console.log(`Loaded ${students.value.length} students for progress tracking`);
    
  } catch (err: any) {
    console.error('Error loading students for progress tracking:', err);
    error.value = 'Failed to load students. Please try again.';
  } finally {
    loadingStudents.value = false;
  }
};

onMounted(() => {
  loadStudents();
});
</script>

<style scoped>
.progress-tracking {
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

.student-selector {
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.student-selector label {
  display: block;
  color: #374151;
  font-weight: 600;
  margin-bottom: 10px;
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.progress-overview {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

.recent-results {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.recent-results h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 25px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-item {
  border: 2px solid #f3f4f6;
  border-radius: 10px;
  padding: 20px;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: #e5e7eb;
  background: #f9fafb;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.result-header h4 {
  color: #1f2937;
  font-size: 1.1rem;
  margin: 0;
}

.score-badge {
  font-size: 1rem;
  font-weight: bold;
  padding: 6px 12px;
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

.result-details {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.detail {
  color: #6b7280;
  font-size: 0.9rem;
}

.no-selection {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-selection-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.no-selection h3 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.no-selection p {
  color: #6b7280;
  font-size: 1.1rem;
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
  .progress-tracking {
    padding: 15px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .result-details {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
