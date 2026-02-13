<template>
  <div class="teacher-dashboard">
    <div class="dashboard-header">
      <h1>👨‍🏫 Teacher Dashboard</h1>
      <p>Manage assessments and track student progress</p>
    </div>

    <!-- Teacher Overview Stats -->
    <div class="stats-section">
      <h2>Your Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-content">
            <div class="stat-number">{{ teacherStats.students }}</div>
            <div class="stat-label">My Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-number">{{ teacherStats.assessments }}</div>
            <div class="stat-label">My Assessments</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">{{ teacherStats.completedAssessments }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ teacherStats.averageScore }}%</div>
            <div class="stat-label">Avg Score</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="actions-section">
      <h2>Quick Actions</h2>
      <div class="actions-grid">
        <div class="action-card primary" @click="router.push('/assessment/create')">
          <div class="action-icon">➕</div>
          <h3>Create New Assessment</h3>
          <p>Design assessments aligned to math goals</p>
          <div class="action-button">Create Assessment →</div>
        </div>

        <div class="action-card featured" @click="router.push('/assessment/generate')">
          <div class="action-icon">📄</div>
          <h3>Generate Printable Assessment</h3>
          <p>Create math worksheets that can be printed for students</p>
          <div class="action-button">Generate Assessment →</div>
        </div>

        <div class="action-card" @click="router.push('/students')">
          <div class="action-icon">🎓</div>
          <h3>My Students</h3>
          <p>View and track your assigned students</p>
          <div class="action-button">View Students →</div>
        </div>

        <div class="action-card" @click="router.push('/progress')">
          <div class="action-icon">📈</div>
          <h3>Track Progress</h3>
          <p>Monitor student performance and math goal progress</p>
          <div class="action-button">View Progress →</div>
        </div>

        <div class="action-card" @click="router.push('/manage-assessments')">
          <div class="action-icon">📋</div>
          <h3>Manage Assessments</h3>
          <p>View, edit, assign, and manage all your assessments</p>
          <div class="action-button">Manage Assessments →</div>
        </div>

        <div class="action-card" @click="router.push('/gradebook')">
          <div class="action-icon">📊</div>
          <h3>Gradebook</h3>
          <p>View student grades organized by class and period</p>
          <div class="action-button">View Gradebook →</div>
        </div>

        <div class="action-card featured" @click="router.push('/goals')">
          <div class="action-icon">🎯</div>
          <h3>Manage Goals</h3>
          <p>Create and manage IEP goals, assign progress assessments</p>
          <div class="action-button">Manage Goals →</div>
        </div>

        <div class="action-card featured" @click="router.push('/progress-assessment-management')">
          <div class="action-icon">📋</div>
          <h3>Progress Assessment Management</h3>
          <p>Manage PA by class - edit, delete, and assign assessments</p>
          <div class="action-button">Manage PAs →</div>
        </div>

        <div class="action-card featured" @click="router.push('/progress-assessment-gradebook')">
          <div class="action-icon">📊</div>
          <h3>Progress Assessment Gradebook</h3>
          <p>View PA results and track IEP goal progress by student, goal, or assessment</p>
          <div class="action-button">View PA Gradebook →</div>
        </div>

        <div class="action-card" @click="router.push('/diagnostic/math')">
          <div class="action-icon">🧮</div>
          <h3>Math Diagnostic (Print)</h3>
          <p>Generate printable math diagnostics based on student IEP goals</p>
          <div class="action-button">Create Diagnostic →</div>
        </div>

        <div class="action-card featured" @click="router.push('/diagnostic/math/adaptive')">
          <div class="action-icon">⚡</div>
          <h3>Adaptive Math Diagnostic</h3>
          <p>Real-time adaptive test that adjusts difficulty based on performance</p>
          <div class="action-button">Start Adaptive Test →</div>
        </div>

        <div class="action-card featured" @click="router.push('/diagnostic/math-facts')">
          <div class="action-icon">⚡</div>
          <h3>Math Facts Fluency Test</h3>
          <p>Timed assessment for addition, subtraction, multiplication, and division facts</p>
          <div class="action-button">Start Fluency Test →</div>
        </div>

        <div class="action-card featured" @click="router.push('/diagnostic/foundational-fluency-manage')">
          <div class="action-icon">🎯</div>
          <h3>Foundational Fluency Management</h3>
          <p>Assign and manage: Subitizing, Making 5/10, Symbolic fluency assessments</p>
          <div class="action-button">Manage Assessments →</div>
        </div>

        <div class="action-card featured highlighted large" @click="router.push('/fluency/dashboard')">
          <div class="action-icon">📊</div>
          <h3>Math Fluency Dashboard</h3>
          <p>Class overview - monitor student progress, proficiency levels, and practice consistency</p>
          <div class="action-button">View Fluency Dashboard →</div>
        </div>

        <div class="action-card featured highlighted large" @click="router.push('/fluency/teacher-view')">
          <div class="action-icon">🎯</div>
          <h3>Math Facts Breakdown</h3>
          <p>See every student's progress on individual facts (4+6, 8×7, etc.) with color-coded status</p>
          <div class="action-button">View Fact Breakdown →</div>
        </div>

        <div class="action-card featured highlighted" @click="router.push('/fluency/placement-diagnostic')">
          <div class="action-icon">🎯</div>
          <h3>Placement Diagnostic</h3>
          <p><strong>Recommended:</strong> 80-problem test - each operation tested separately (~30 min) - identifies starting level for daily practice</p>
          <div class="action-button">Start Placement →</div>
        </div>

        <div class="action-card highlighted" @click="router.push('/fluency/paper-assessment')">
          <div class="action-icon">📄</div>
          <h3>Generate Friday Probes</h3>
          <p>Create 1-minute paper assessments for weekly fluency checks</p>
          <div class="action-button">Generate PDFs →</div>
        </div>

        <div class="action-card highlighted" @click="router.push('/fluency/score-entry')">
          <div class="action-icon">📝</div>
          <h3>Enter Fluency Scores</h3>
          <p>Input results from paper fluency checks - tracks CPM and proficiency</p>
          <div class="action-button">Enter Scores →</div>
        </div>

    <div class="action-card featured" @click="router.push('/diagnostic/foundational')">
      <div class="action-icon">📊</div>
      <h3>Foundational Diagnostic</h3>
      <p>Comprehensive 4th-6th grade readiness + student goals (20 MC + 5 SA)</p>
      <div class="action-button">Start Diagnostic →</div>
    </div>

    <div class="action-card" @click="router.push('/diagnostic/results')">
      <div class="action-icon">📋</div>
      <h3>Diagnostic Results</h3>
      <p>View and analyze all diagnostic test results</p>
      <div class="action-button">View Results →</div>
    </div>
      </div>
    </div>

    <!-- Recent Assessments -->
    <div class="recent-section">
      <div class="section-header">
        <h2>Recent Assessments</h2>
        <router-link to="/assessments" class="view-all-link">View All →</router-link>
      </div>
      <div class="assessments-grid">
        <div 
          v-for="assessment in recentAssessments" 
          :key="assessment.id"
          class="assessment-card"
          @click="editAssessment(assessment.id)"
        >
          <div class="assessment-header">
            <h4>{{ assessment.title }}</h4>
            <div class="assessment-meta">
              <span class="grade-tag">Grade {{ assessment.gradeLevel }}</span>
              <span class="category-tag">{{ assessment.category }}</span>
            </div>
          </div>
          
          <div class="assessment-content">
            <p class="assessment-description">{{ assessment.description }}</p>
            
            <div class="assessment-stats">
              <div class="stat">
                <span class="stat-label">Questions:</span>
                <span class="stat-value">{{ assessment.questions?.length || 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Points:</span>
                <span class="stat-value">{{ assessment.totalPoints }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Assigned:</span>
                <span class="stat-value">{{ assessment.assignedCount || 0 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Completed:</span>
                <span class="stat-value">{{ assessment.completedCount || 0 }}</span>
              </div>
            </div>
          </div>
          
          <div class="assessment-actions">
            <button @click.stop="editAssessment(assessment.id)" class="edit-btn">
              ✏️ Edit
            </button>
            <button @click.stop="viewResults(assessment.id)" class="results-btn">
              📊 Results
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Tasks -->
    <div class="tasks-section">
      <h2>Pending Tasks</h2>
      <div class="tasks-list">
        <div v-for="task in pendingTasks" :key="task.id" class="task-item">
          <div class="task-icon">{{ task.icon }}</div>
          <div class="task-content">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-description">{{ task.description }}</div>
          </div>
          <div class="task-priority" :class="task.priority">
            {{ task.priority }}
          </div>
          <button @click="completeTask(task.id)" class="task-action">
            Complete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getStudentsByTeacher } from '@/firebase/userServices';
import { getAssessmentsByTeacher, getAllAssessments } from '@/firebase/iepServices';

const router = useRouter();
const authStore = useAuthStore();

// Real teacher stats
const teacherStats = ref({
  students: 0,
  assessments: 0,
  completedAssessments: 0,
  averageScore: 0
});

const recentAssessments = ref<any[]>([]);

const pendingTasks = ref([
  {
    id: 1,
    icon: '📝',
    title: 'Grade Pending Assessments',
    description: '5 assessments need manual grading',
    priority: 'high'
  },
  {
    id: 2,
    icon: '👥',
    title: 'Review Student Progress',
    description: '3 students showing concerning trends',
    priority: 'medium'
  },
  {
    id: 3,
    icon: '📧',
    title: 'Send Progress Reports',
    description: 'Monthly progress reports due this week',
    priority: 'low'
  }
]);

// Methods
const editAssessment = (assessmentId: string) => {
  router.push(`/assessment/edit/${assessmentId}`);
};

const viewResults = (assessmentId: string) => {
  // Navigate to the results overview page
  router.push(`/assessment/${assessmentId}/results`);
};

// Removed viewAllAssessments - now using direct router.push

const completeTask = (taskId: number) => {
  const taskIndex = pendingTasks.value.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    pendingTasks.value.splice(taskIndex, 1);
  }
};

const loadTeacherData = async () => {
  try {
    console.log('Loading teacher data from Firestore...');
    
    if (authStore.currentUser?.uid) {
      // Load teacher's assigned students and assessments
      const [assignedStudents, teacherAssessments] = await Promise.all([
        getStudentsByTeacher(authStore.currentUser.uid),
        getAssessmentsByTeacher(authStore.currentUser.uid)
      ]);
      
      console.log('👥 Assigned students:', assignedStudents.length);
      console.log('📝 Teacher assessments:', teacherAssessments.length);
      
      // Update stats
      teacherStats.value = {
        students: assignedStudents.length,
        assessments: teacherAssessments.length,
        completedAssessments: 0, // TODO: Calculate from assessment results
        averageScore: 0 // TODO: Calculate from results
      };
      
      // Update recent assessments for display
      recentAssessments.value = teacherAssessments.slice(0, 6); // Show up to 6 recent assessments
      
      console.log('📊 Teacher data loaded:', teacherStats.value);
    }
  } catch (error) {
    console.error('Error loading teacher data:', error);
  }
};

onMounted(() => {
  loadTeacherData();
});
</script>

<style scoped>
.teacher-dashboard {
  max-width: 1400px;
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
.actions-section,
.recent-section,
.tasks-section {
  margin-bottom: 50px;
}

.stats-section h2,
.actions-section h2,
.recent-section h2,
.tasks-section h2 {
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

.view-all-link {
  color: #667eea;
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
  border-left: 4px solid #059669;
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

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.action-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.action-card.primary {
  border: 2px solid #059669;
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.action-card h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.action-card p {
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 20px;
}

.action-button {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  display: inline-block;
}

.assessments-grid {
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
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.assessment-header h4 {
  color: #1f2937;
  font-size: 1.2rem;
  margin: 0;
  flex: 1;
}

.assessment-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grade-tag,
.category-tag {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.grade-tag {
  background: #dbeafe;
  color: #1e40af;
}

.category-tag {
  background: #dcfce7;
  color: #166534;
}

.assessment-description {
  color: #6b7280;
  margin-bottom: 15px;
  line-height: 1.5;
}

.assessment-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.stat-label {
  color: #6b7280;
  font-size: 0.8rem;
}

.stat-value {
  color: #1f2937;
  font-weight: 600;
}

.assessment-actions {
  display: flex;
  gap: 10px;
}

.edit-btn,
.results-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.edit-btn {
  background: #f0f4ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.edit-btn:hover {
  background: #e0e7ff;
}

.results-btn {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.results-btn:hover {
  background: #dcfce7;
}

.tasks-list {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.task-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f3f4f6;
}

.task-item:last-child {
  border-bottom: none;
}

.task-icon {
  font-size: 1.5rem;
  width: 40px;
  text-align: center;
}

.task-content {
  flex: 1;
}

.task-title {
  color: #1f2937;
  font-weight: 600;
  margin-bottom: 4px;
}

.task-description {
  color: #6b7280;
  font-size: 0.9rem;
}

.task-priority {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  min-width: 60px;
  text-align: center;
}

.task-priority.high {
  background: #fef2f2;
  color: #dc2626;
}

.task-priority.medium {
  background: #fef3c7;
  color: #92400e;
}

.task-priority.low {
  background: #f0fdf4;
  color: #166534;
}

.task-action {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-action:hover {
  background: #5a67d8;
}

@media (max-width: 768px) {
  .teacher-dashboard {
    padding: 15px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .assessments-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .assessment-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .task-priority,
  .task-action {
    align-self: flex-end;
  }
}
</style>
