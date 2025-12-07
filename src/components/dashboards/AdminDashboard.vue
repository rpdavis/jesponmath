<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>👑 Admin Dashboard</h1>
      <p>System administration and user management</p>
    </div>

    <!-- System Overview Stats -->
    <div class="stats-section">
      <h2>System Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-number">{{ systemStats.totalUsers }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👨‍🏫</div>
          <div class="stat-content">
            <div class="stat-number">{{ systemStats.teachers }}</div>
            <div class="stat-label">Teachers</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-content">
            <div class="stat-number">{{ systemStats.students }}</div>
            <div class="stat-label">Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-number">{{ systemStats.assessments }}</div>
            <div class="stat-label">Assessments</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="actions-section">
      <h2>Quick Actions</h2>

      <!-- User Management Section -->
      <div class="action-category">
        <h3 class="category-header">
          <span class="category-icon">👥</span>
          User Management
        </h3>
        <div class="actions-grid">
        <div class="action-card" @click="router.push('/admin/users')">
          <div class="action-icon">👥</div>
          <h3>Manage Users</h3>
          <p>System user accounts and permissions</p>
          <div class="action-button">Manage Users →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/teachers')">
          <div class="action-icon">👨‍🏫</div>
          <h3>Manage Teachers</h3>
          <p>Add and manage teacher accounts with Aeries ID</p>
          <div class="action-button">Manage Teachers →</div>
        </div>

        <div class="action-card" @click="router.push('/students')">
          <div class="action-icon">🎓</div>
          <h3>Manage Students</h3>
          <p>Student enrollment with SSID, SEIS, and Aeries ID</p>
          <div class="action-button">Manage Students →</div>
        </div>
        </div>
      </div>

      <!-- Content Management Section -->
      <div class="action-category">
        <h3 class="category-header">
          <span class="category-icon">📚</span>
          Content Management
        </h3>
        <div class="actions-grid">
        <div class="action-card" @click="router.push('/assessment/create')">
          <div class="action-icon">➕</div>
          <h3>Create Assessment</h3>
          <p>Design new assessments for math goals</p>
          <div class="action-button">Create Assessment →</div>
        </div>

        <div class="action-card" @click="router.push('/manage-assessments')">
          <div class="action-icon">📋</div>
          <h3>Manage Assessments</h3>
          <p>View, assign, edit, and delete all assessments</p>
          <div class="action-button">Manage Assessments →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/standards')">
          <div class="action-icon">📏</div>
          <h3>Manage Standards</h3>
          <p>Create and manage custom assessment standards</p>
          <div class="action-button">Manage Standards →</div>
        </div>

        <div class="action-card" @click="router.push('/goals')">
          <div class="action-icon">🎯</div>
          <h3>Manage Goals</h3>
          <p>Create and manage IEP goals, assign progress assessments</p>
          <div class="action-button">Manage Goals →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/import-goals')">
          <div class="action-icon">📥</div>
          <h3>Import Goals from CSV</h3>
          <p>Bulk import IEP goals from CSV files (32 students, 176 goals)</p>
          <div class="action-button">Import Goals →</div>
        </div>
        </div>
      </div>

      <!-- Diagnostics & Assessments Section -->
      <div class="action-category">
        <h3 class="category-header">
          <span class="category-icon">🧮</span>
          Diagnostics & Assessments
        </h3>
        <div class="actions-grid">
        <div class="action-card" @click="router.push('/progress-assessment')">
          <div class="action-icon">📈</div>
          <h3>Progress Assessment Tracking</h3>
          <p>Track student progress on IEP goals through assessments</p>
          <div class="action-button">View Progress →</div>
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

        <div class="action-card featured" @click="router.push('/diagnostic/foundational-fluency')">
          <div class="action-icon">🎯</div>
          <h3>Foundational Fluency</h3>
          <p>Research-based practice and assessment: Subitizing, Making 5/10, Symbolic fluency</p>
          <div class="action-button">Start Foundational Skills →</div>
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

      <!-- Data Management Section -->
      <div class="action-category">
        <h3 class="category-header">
          <span class="category-icon">💾</span>
          Data Management
        </h3>
        <div class="actions-grid">
        <div class="action-card" @click="router.push('/admin/migration')">
          <div class="action-icon">🔄</div>
          <h3>Database Migration</h3>
          <p>Migrate and transform database data</p>
          <div class="action-button">Database Migration →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/csv-migration')">
          <div class="action-icon">📊</div>
          <h3>CSV Import</h3>
          <p>Import historical assessment data from CSV files</p>
          <div class="action-button">CSV Import →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/aeries-export')">
          <div class="action-icon">📤</div>
          <h3>Export to Aeries</h3>
          <p>Export grades and assessment data to Aeries SIS</p>
          <div class="action-button">Export to Aeries →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/periods')">
          <div class="action-icon">📅</div>
          <h3>Academic Periods</h3>
          <p>Configure quarters, semesters, or trimesters</p>
          <div class="action-button">Manage Periods →</div>
        </div>
        </div>
      </div>

      <!-- System Tools Section -->
      <div class="action-category">
        <h3 class="category-header">
          <span class="category-icon">⚙️</span>
          System Tools
        </h3>
        <div class="actions-grid">
        <div class="action-card" @click="router.push('/progress')">
          <div class="action-icon">📈</div>
          <h3>Analytics & Reports</h3>
          <p>View system-wide analytics and reports</p>
          <div class="action-button">View Analytics →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/system')">
          <div class="action-icon">⚙️</div>
          <h3>System Settings</h3>
          <p>Configure system-wide settings and preferences</p>
          <div class="action-button">System Settings →</div>
        </div>

        <div class="action-card" @click="router.push('/progress')">
          <div class="action-icon">📈</div>
          <h3>Analytics</h3>
          <p>View system-wide analytics and reports</p>
          <div class="action-button">View Analytics →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/backup')">
          <div class="action-icon">💾</div>
          <h3>Backup & Export</h3>
          <p>System backup and data export tools</p>
          <div class="action-button">Backup Tools →</div>
        </div>
        </div>
      </div>

      <!-- Data Fixes & Maintenance Section -->
      <div class="action-category">
        <h3 class="category-header">
          <span class="category-icon">🔧</span>
          Data Fixes & Maintenance
        </h3>
        <div class="actions-grid">
        <div class="action-card" @click="router.push('/admin/fix-student-teachers')">
          <div class="action-icon">👥</div>
          <h3>Fix Student-Teacher Links</h3>
          <p>Ensure all students are assigned to their teacher</p>
          <div class="action-button">Fix Links →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/fix-goals')">
          <div class="action-icon">🔧</div>
          <h3>Fix Imported Goals</h3>
          <p>Fix teacher assignments and remove duplicate goals</p>
          <div class="action-button">Fix Goals →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/debug-goal-questions')">
          <div class="action-icon">🔍</div>
          <h3>Debug Goal Questions</h3>
          <p>Debug and fix issues with goal questions</p>
          <div class="action-button">Debug Questions →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/analyze-goals')">
          <div class="action-icon">📊</div>
          <h3>Analyze Goals for Templates</h3>
          <p>Analyze existing goals to identify patterns for template system</p>
          <div class="action-button">Analyze Goals →</div>
        </div>

        <div class="action-card" @click="router.push('/admin/templates')">
          <div class="action-icon">📋</div>
          <h3>Goal Template Management</h3>
          <p>Create and manage goal templates for quick IEP goal creation</p>
          <div class="action-button">Manage Templates →</div>
        </div>
        </div>
      </div>

      <!-- Debug Tools Section (Collapsible) -->
      <div class="action-category">
        <h3 class="category-header category-toggle" @click="showDebugTools = !showDebugTools">
          <span class="category-icon">🐛</span>
          Debug Tools
          <span class="toggle-icon">{{ showDebugTools ? '▼' : '▶' }}</span>
        </h3>
        <div v-show="showDebugTools" class="actions-grid">
        <div class="action-card debug-card" @click="showRoleFixer = true">
          <div class="action-icon">🔧</div>
          <h3>Role Fixer (Debug)</h3>
          <p>Fix users with incorrect roles</p>
          <div class="action-button">Fix Roles →</div>
        </div>

        <div class="action-card debug-card" @click="cleanupDuplicates">
          <div class="action-icon">🧹</div>
          <h3>Cleanup Duplicates</h3>
          <p>Remove duplicate student records from OAuth issues</p>
          <div class="action-button">Clean Up →</div>
        </div>

        <div class="action-card debug-card" @click="restoreGoogleData">
          <div class="action-icon">🔄</div>
          <h3>Restore Google Data</h3>
          <p>Restore missing Google Classroom metadata</p>
          <div class="action-button">Restore →</div>
        </div>

        <div class="action-card debug-card" @click="fixCurrentStudent">
          <div class="action-icon">🩹</div>
          <h3>Fix Current Student</h3>
          <p>Add Google metadata to Ryan Davis student record</p>
          <div class="action-button">Fix Now →</div>
        </div>

        <div class="action-card debug-card" @click="migrateAdmin">
          <div class="action-icon">👑</div>
          <h3>Migrate Admin</h3>
          <p>Move admin record to new admin collection</p>
          <div class="action-button">Migrate →</div>
        </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <h2>Recent Activity</h2>
      <div class="activity-list">
        <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-description">{{ activity.description }}</div>
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
          <div class="activity-user">{{ activity.user }}</div>
        </div>
      </div>
    </div>

    <!-- System Health -->
    <div class="health-section">
      <h2>System Health</h2>
      <div class="health-indicators">
        <div class="health-item">
          <div class="health-icon good">✅</div>
          <div class="health-content">
            <div class="health-title">Firebase Connection</div>
            <div class="health-status">Connected</div>
          </div>
        </div>
        <div class="health-item">
          <div class="health-icon good">✅</div>
          <div class="health-content">
            <div class="health-title">Authentication</div>
            <div class="health-status">Active</div>
          </div>
        </div>
        <div class="health-item">
          <div class="health-icon good">✅</div>
          <div class="health-content">
            <div class="health-title">Database</div>
            <div class="health-status">Operational</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Role Fixer Modal -->
    <div v-if="showRoleFixer" class="modal-overlay" @click="showRoleFixer = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>🔧 Role Fixer</h3>
          <button @click="showRoleFixer = false" class="close-btn">×</button>
        </div>
        <RoleFixer />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import { getAllTeachers, getAllStudents } from '@/firebase/userServices';
import { cleanupDuplicateUsers, findDuplicateStudents, restoreGoogleMetadata } from '@/firebase/cleanupServices';
import { fixCurrentStudent as fixCurrentStudentData, migrateAdminToAdminCollection } from '@/firebase/manualFixes';
import RoleFixer from '@/components/admin/RoleFixer.vue';

const router = useRouter();
const authStore = useAuthStore();
const permissions = usePermissions();

// Real system stats
const systemStats = ref({
  totalUsers: 0,
  teachers: 0,
  students: 0,
  assessments: 0
});

const showRoleFixer = ref(false);
const showDebugTools = ref(false);

const recentActivity = ref([
  {
    id: 1,
    icon: '👨‍🏫',
    title: 'New Teacher Account Created',
    description: 'Sarah Johnson joined as a teacher',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    user: 'System'
  },
  {
    id: 2,
    icon: '📝',
    title: 'Assessment Created',
    description: 'Fractions Assessment for Grade 6',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    user: 'John Smith'
  },
  {
    id: 3,
    icon: '🎓',
    title: 'Students Imported',
    description: '15 students imported from Google Classroom',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    user: 'Mike Davis'
  },
  {
    id: 4,
    icon: '📊',
    title: 'Assessment Completed',
    description: 'Student completed Algebra Assessment',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    user: 'Emma Wilson'
  }
]);

// Methods
const formatTime = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

const loadSystemStats = async () => {
  try {
    console.log('Loading system stats from Firestore...');

    const [teachers, students] = await Promise.all([
      getAllTeachers(),
      getAllStudents()
    ]);

    systemStats.value = {
      totalUsers: teachers.length + students.length,
      teachers: teachers.length,
      students: students.length,
      assessments: 0 // TODO: Load from assessments collection
    };

    console.log('System stats loaded:', systemStats.value);
  } catch (error) {
    console.error('Error loading system stats:', error);
  }
};

const cleanupDuplicates = async () => {
  try {
    console.log('🧹 Starting duplicate cleanup...');

    // First, find duplicates to show user what will be cleaned
    const duplicates = await findDuplicateStudents();

    if (duplicates.length === 0) {
      alert('✅ No duplicate students found!');
      return;
    }

    const duplicateList = duplicates.map(d => `${d.email} (${d.count} records)`).join('\n');
    const confirmed = confirm(`Found ${duplicates.length} duplicate email addresses:\n\n${duplicateList}\n\nProceed with cleanup?`);

    if (!confirmed) return;

    // Call Cloud Function to cleanup
    const result = await cleanupDuplicateUsers() as any;

    alert(`✅ Cleanup completed!\n\nDuplicates found: ${result.duplicatesFound}\nRecords cleaned: ${result.duplicates.length}`);

    // Reload stats
    await loadSystemStats();

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error);
    alert(`❌ Cleanup failed: ${error.message}`);
  }
};

const restoreGoogleData = async () => {
  try {
    console.log('🔄 Starting Google metadata restore...');

    const result = await restoreGoogleMetadata();

    if (result.studentsRestored === 0) {
      alert('✅ No students needed Google metadata restoration!');
      return;
    }

    const restoredList = result.restored.map((r: any) => `${r.email}: ${r.updates.courseName || 'N/A'}`).join('\n');
    alert(`✅ Google metadata restored!\n\nStudents found: ${result.studentsFound}\nStudents restored: ${result.studentsRestored}\n\nRestored:\n${restoredList}`);

    // Reload stats
    await loadSystemStats();

  } catch (error: any) {
    console.error('❌ Error during restore:', error);
    alert(`❌ Restore failed: ${error.message}`);
  }
};

const fixCurrentStudent = async () => {
  try {
    console.log('🩹 Fixing current student with Google metadata...');

    const confirmed = confirm('This will add Google Classroom metadata to Ryan Davis student record.\n\nProceed?');
    if (!confirmed) return;

    await fixCurrentStudentData();

    alert('✅ Current student completely fixed!\n\nFixed:\n- Google ID: 107555236801416916873\n- Course ID: 10019420452\n- Course Name: Mr. Davis\n- Section: Period 4\n- Set assignedTeacher field\n- Added to teacher assignedStudents array\n\nStudent should now appear in Student Management!');

    // Reload stats
    await loadSystemStats();

  } catch (error: any) {
    console.error('❌ Error fixing current student:', error);
    alert(`❌ Fix failed: ${error.message}`);
  }
};

const migrateAdmin = async () => {
  try {
    console.log('👑 Migrating admin to admin collection...');

    const confirmed = confirm('This will migrate the admin record to the new admin collection.\n\nProceed?');
    if (!confirmed) return;

    await migrateAdminToAdminCollection();

    alert('✅ Admin migrated successfully!\n\nThe admin record is now in the admin collection with proper role-based architecture.');

    // Reload stats
    await loadSystemStats();

  } catch (error: any) {
    console.error('❌ Error migrating admin:', error);
    alert(`❌ Migration failed: ${error.message}`);
  }
};

onMounted(() => {
  loadSystemStats();
});
</script>

<style scoped>
.admin-dashboard {
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
.activity-section,
.health-section {
  margin-bottom: 50px;
}

.stats-section h2,
.actions-section h2,
.activity-section h2,
.health-section h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
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
  border-left: 4px solid #dc2626;
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

.action-category {
  margin-bottom: 40px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}

.category-icon {
  font-size: 1.5rem;
}

.category-toggle {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.category-toggle:hover {
  color: #dc2626;
}

.toggle-icon {
  margin-left: auto;
  font-size: 0.9rem;
  color: #6b7280;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  display: inline-block;
}

.activity-list {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  width: 40px;
  text-align: center;
}

.activity-content {
  flex: 1;
}

.activity-title {
  color: #1f2937;
  font-weight: 600;
  margin-bottom: 4px;
}

.activity-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.activity-time {
  color: #9ca3af;
  font-size: 0.8rem;
}

.activity-user {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 100px;
  text-align: right;
}

.health-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.health-item {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.health-icon {
  font-size: 1.5rem;
  width: 40px;
  text-align: center;
}

.health-icon.good {
  color: #059669;
}

.health-icon.warning {
  color: #f59e0b;
}

.health-icon.error {
  color: #dc2626;
}

.health-title {
  color: #1f2937;
  font-weight: 600;
  margin-bottom: 4px;
}

.health-status {
  color: #6b7280;
  font-size: 0.9rem;
}

.debug-card {
  border: 2px solid #fecaca !important;
  background: #fef2f2 !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 15px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6b7280;
}

.close-btn:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .admin-dashboard {
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

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .activity-user {
    text-align: left;
    min-width: auto;
  }
}
</style>
