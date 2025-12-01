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
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-number">{{ studentStats.pendingAssessments }}</div>
            <div class="stat-label">To Do</div>
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

    <!-- Quick Access - Daily Practice -->
    <div class="quick-access-section">
      <h2>📚 Daily Practice</h2>
      <div class="quick-access-grid">
        <div class="quick-access-card fluency" @click="router.push('/fluency/daily-practice')">
          <div class="quick-icon">🔢</div>
          <div class="quick-content">
            <h3>Math Facts Practice</h3>
            <p>10-12 minutes · Build automaticity with daily practice</p>
          </div>
          <div class="quick-button">Start Practice →</div>
        </div>
        
        <div class="quick-access-card progress" @click="router.push('/fluency/my-progress')">
          <div class="quick-icon">📊</div>
          <div class="quick-content">
            <h3>My Progress</h3>
            <p>View your fluency stats, streak, and unlock status</p>
          </div>
          <div class="quick-button">View Progress →</div>
        </div>
      </div>
    </div>

    <!-- Math Facts Fluency Progression -->
    <div v-if="fluencyProgress.length > 0" class="fluency-progression-section">
      <h2>🎯 Math Facts Fluency Progression</h2>
      <div class="operation-progress-grid">
        <div 
          v-for="op in fluencyProgress" 
          :key="op.operation"
          class="operation-progress-card"
          :class="{ 'unlocked': op.unlocked, 'completed': op.completedOperation, 'current': op.currentlyPracticing }"
        >
          <div class="op-header">
            <span class="op-icon">{{ getOperationIcon(op.operation) }}</span>
            <h3>{{ capitalizeOperation(op.operation) }}</h3>
            <span v-if="op.completedOperation" class="completion-badge">✅</span>
            <span v-else-if="!op.unlocked" class="locked-badge">🔒</span>
          </div>
          
          <div v-if="op.currentSubLevel" class="sublevel-info">
            <div class="sublevel-name">{{ getSubLevelName(op.currentSubLevel) }}</div>
            <div class="proficiency-bar">
              <div 
                class="proficiency-fill" 
                :style="{ width: `${op.subLevelProgress[op.currentSubLevel]?.proficiencyPercentage || 0}%` }"
              ></div>
            </div>
            <div class="proficiency-text">
              {{ op.subLevelProgress[op.currentSubLevel]?.proficiencyPercentage || 0 }}% Proficient
              <span v-if="op.subLevelProgress[op.currentSubLevel]?.readyForAssessment" class="ready-badge">
                ✨ Ready for Test!
              </span>
            </div>
            <div class="completed-sublevels">
              <span class="sublevel-count">{{ op.completedSubLevels.length }} / {{ getTotalSubLevels(op.operation) }} levels complete</span>
            </div>
          </div>
          
          <div v-else class="not-started">
            <p>Complete placement diagnostic to begin</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Assessments - Priority Section -->
    <div v-if="pendingAssessments.length > 0" class="pending-section">
      <div class="section-header">
        <h2>📝 To Do</h2>
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
import { getAllFluencyProgress } from '@/services/mathFluencyServices';
import { getSubLevelConfig } from '@/config/fluencySubLevels';
import type { MathFluencyProgress, OperationType, SubLevel } from '@/types/mathFluency';

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

// ⭐ NEW: Fluency progress tracking
const fluencyProgress = ref<MathFluencyProgress[]>([]);

// Computed properties
const urgentAssessments = computed(() => {
  // Count assessments that might be overdue or high priority
  return pendingAssessments.value.filter(a => a.timeLimit && a.timeLimit < 30).length;
});

// Methods
const startAssessment = (assessment: any) => {
  // Handle placement diagnostic assignments
  if (assessment.isDiagnostic && assessment.diagnosticType === 'math-fluency-placement') {
    router.push(`/fluency/placement-diagnostic?assignment=${assessment.id}`);
    return;
  }
  
  // Handle daily practice assignments
  if (assessment.isDiagnostic && assessment.diagnosticType === 'math-fluency-practice') {
    router.push(`/fluency/daily-practice?assignment=${assessment.id}`);
    return;
  }
  
  // Handle other diagnostic assignments
  if (assessment.isDiagnostic) {
    // Route to the appropriate diagnostic page based on type
    if (assessment.diagnosticType === 'foundational') {
      router.push(`/diagnostic/foundational?assignment=${assessment.id}`);
    } else if (assessment.diagnosticType === 'math-facts') {
      router.push(`/diagnostic/math-facts?assignment=${assessment.id}`);
    } else {
      router.push(`/diagnostic/math`);
    }
    return;
  }
  
  // Regular assessment
  router.push(`/assessment/${assessment.id}`);
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

// ⭐ NEW: Fluency helper functions
const capitalizeOperation = (operation: string) => {
  return operation.charAt(0).toUpperCase() + operation.slice(1);
};

const getOperationIcon = (operation: OperationType) => {
  const icons = {
    addition: '➕',
    subtraction: '➖',
    multiplication: '✖️',
    division: '➗'
  };
  return icons[operation] || '🔢';
};

const getSubLevelName = (subLevel: SubLevel) => {
  const config = getSubLevelConfig(subLevel);
  return config ? config.name : subLevel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getTotalSubLevels = (operation: OperationType) => {
  const counts = {
    addition: 3,
    subtraction: 3,
    multiplication: 4,
    division: 4
  };
  return counts[operation] || 0;
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
  try {
    await loadStudentData();
  } finally {
    loading.value = false;
  }
};

const loadStudentData = async () => {
  try {
    console.log('Loading student data from Firestore...');
    
    if (authStore.currentUser?.uid) {
      const studentId = authStore.currentUser.uid || authStore.currentUser.googleId || authStore.currentUser.seisId;
      
      if (!studentId) {
        console.error('No student ID found');
        return;
      }
      
      console.log('Student UID:', authStore.currentUser.uid);
      console.log('Student ID for queries:', studentId);
      
      // Load assigned assessments, results, diagnostic assignments, and fluency progress
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/firebase/config');
      
      const [assignedAssessments, completedResults, diagnosticAssignmentsSnapshot, fluencyData] = await Promise.all([
        getAssessmentsByStudent(studentId),
        getAssessmentResultsByStudent(studentId),
        getDocs(query(collection(db, 'diagnosticAssignments'), where('studentUid', '==', studentId))),
        getAllFluencyProgress(studentId)
      ]);
      
      // ⭐ Update fluency progress
      fluencyProgress.value = fluencyData;
      console.log('📊 Loaded fluency progress for', fluencyData.length, 'operations');
      
      // Filter results to only include results for assigned assessments (including PA)
      const validResults = completedResults.filter(result => {
        const assessment = assignedAssessments.find(a => a.id === result.assessmentId);
        return assessment !== undefined; // Include if assessment exists (could be PA or regular)
      });
      
      // Convert diagnostic assignments to assessment-like format for display
      // Filter out deprecated 'math-fluency-initial' diagnostics
      const diagnosticAssignments = diagnosticAssignmentsSnapshot.docs
        .filter(doc => doc.data().diagnosticType !== 'math-fluency-initial') // Skip old full diagnostics
        .map(doc => {
          const data = doc.data();
          
          // Customize display based on diagnostic type
          let title = data.title || 'Diagnostic'
          let timeEstimate = null
          
          if (data.diagnosticType === 'math-fluency-placement') {
            title = data.title || 'Math Fluency Placement Diagnostic'
            timeEstimate = 30  // 30 minutes (80 problems with breaks)
          } else if (data.diagnosticType === 'math-fluency-practice') {
            title = data.title || 'Daily Math Facts Practice'
            timeEstimate = 12  // 10-12 minutes
          }
          
          return {
            id: doc.id,
            title,
            standard: 'Fluency' + (data.operation ? ` - ${data.operation}` : ''),
            gradeLevel: '7',
            timeLimit: timeEstimate,
            assignedAt: data.assignedAt,
            status: data.status,
            isComplete: data.isComplete,
            isDiagnostic: true,
            diagnosticType: data.diagnosticType,
            operation: data.operation  // Pass operation for routing
          };
        });
      
      // Merge regular assessments (including PA) and diagnostics
      const allAssignments = [...assignedAssessments, ...diagnosticAssignments];
      
      console.log('📝 Assigned assessments (including PA):', assignedAssessments.length);
      console.log('📊 Diagnostic assignments:', diagnosticAssignments.length);
      console.log('✅ Completed results (including PA):', validResults.length);
      console.log('🔍 Debug - Assigned assessments:', assignedAssessments.map(a => ({ id: a.id, title: a.title, category: a.category })));
      console.log('🔍 Debug - Diagnostic assignments:', diagnosticAssignments.map(a => ({ id: a.id, title: a.title })));
      console.log('🔍 Debug - Completed results:', validResults.map(r => ({ id: r.id, assessmentId: r.assessmentId })));
      
      // Calculate average score (including PA results)
      const averageScore = validResults.length > 0 
        ? Math.round(validResults.reduce((sum, result) => sum + result.percentage, 0) / validResults.length)
        : 0;
      
      // Update stats (including PA)
      studentStats.value = {
        assignedAssessments: allAssignments.length,
        completedAssessments: validResults.length,
        pendingAssessments: allAssignments.length - validResults.length,
        averageScore: averageScore
      };
      
      // Update arrays for display - filter out completed ones (including PA results)
      const pendingFiltered = allAssignments.filter((assessment: any) => {
        // For diagnostics, check the isComplete flag
        if (assessment.isDiagnostic) {
          return !assessment.isComplete;
        }
        // For regular assessments, check results (including PA results)
        return !validResults.some(result => result.assessmentId === assessment.id);
      });
      
      pendingAssessments.value = pendingFiltered;
      recentResults.value = validResults.slice(0, 5); // Show last 5 results (including PA)
      
      console.log('📋 Pending assessments after filter:', pendingFiltered.length);
      console.log('📋 Pending assessments details:', pendingFiltered.map(a => ({ id: a.id, title: a.title })));
      
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

.quick-access-section {
  margin-bottom: 50px;
}

.quick-access-section h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 25px;
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.quick-access-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 2px solid transparent;
}

.quick-access-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}

.quick-access-card.fluency {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.quick-access-card.progress {
  border-color: #007bff;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.quick-access-card.progress .quick-button {
  background: #007bff;
}

.quick-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.quick-content {
  flex: 1;
}

.quick-content h3 {
  margin: 0 0 5px 0;
  color: #1f2937;
  font-size: 1.2rem;
}

.quick-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.quick-button {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
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

/* ============================================================================
   FLUENCY PROGRESSION SECTION
   ============================================================================ */
.fluency-progression-section {
  margin-bottom: 40px;
}

.fluency-progression-section h2 {
  color: #1f2937;
  font-size: 1.75rem;
  margin-bottom: 20px;
}

.operation-progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.operation-progress-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.operation-progress-card.current {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.operation-progress-card.completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #22c55e;
}

.operation-progress-card:not(.unlocked) {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.op-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.op-icon {
  font-size: 1.5rem;
}

.op-header h3 {
  flex: 1;
  color: #1f2937;
  font-size: 1.25rem;
  margin: 0;
}

.completion-badge {
  background: #22c55e;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.locked-badge {
  font-size: 1.25rem;
  opacity: 0.5;
}

.sublevel-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sublevel-name {
  font-weight: 600;
  color: #3b82f6;
  font-size: 1rem;
}

.proficiency-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.proficiency-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  transition: width 0.5s ease;
  border-radius: 4px;
}

.proficiency-text {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.ready-badge {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}

.completed-sublevels {
  margin-top: 5px;
}

.sublevel-count {
  font-size: 0.875rem;
  color: #9ca3af;
  font-style: italic;
}

.not-started {
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.not-started p {
  margin: 0;
}
</style>
