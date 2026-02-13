<template>
  <div class="assessment-management">
    <div class="header">
      <h1>📝 Assessment Management</h1>
      <p>{{ permissions.isAdmin ? 'Manage all assessments in the system' : 'Manage your created assessments' }}</p>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-buttons">
        <router-link to="/assessment/create" class="create-button">
          <span class="button-icon">➕</span>
          Create New Assessment
        </router-link>

        <button @click="exportAssessments" class="export-button">
          <span class="button-icon">📊</span>
          Export Assessments
        </button>
      </div>
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search assessments..." 
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- Assessment Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-number">{{ filteredAssessments.length }}</div>
          <div class="stat-label">Total Assessments</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-number">{{ assignedAssessments }}</div>
          <div class="stat-label">Assigned</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-number">{{ templateAssessments }}</div>
          <div class="stat-label">Templates</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ completedAssessments }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="assigned">Assigned to Students</option>
          <option value="template">Templates</option>
          <option value="completed">Completed</option>
        </select>
        <select v-model="gradeFilter" class="filter-select">
          <option value="">All Grades</option>
          <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
            Grade {{ grade }}
          </option>
        </select>
        <select v-model="categoryFilter" class="filter-select">
          <option value="">All Categories</option>
          <option value="HW">Home Work (HW)</option>
          <option value="Assign">Assignment (Assign)</option>
          <option value="ESA">Essential Standard (ESA)</option>
          <option value="SA">Standard Assessment (SA)</option>
          <option value="Other">Other</option>
        </select>
        <select v-model="quarterFilter" class="filter-select">
          <option value="current">Current Quarter ({{ currentQuarterLabel }})</option>
          <option v-for="period in academicYearSettings?.periods || []" :key="period.id" :value="period.id">
            {{ period.shortName }} - {{ period.name }} ({{ formatQuarterDateRange(period) }})
          </option>
          <option value="all">All Quarters</option>
          <option value="unassigned">Unassigned (No Quarter)</option>
        </select>
      </div>
      <p class="filter-note">💡 Progress Assessments (PA) are managed separately in <router-link to="/progress-assessment-management">Progress Assessment Management</router-link></p>
      <div class="bulk-actions">
        <label class="select-all-label">
          <input 
            type="checkbox" 
            :checked="allVisibleSelected"
            @change="toggleSelectAll"
          >
          Select All Visible
        </label>
        <div v-if="selectedAssessments.length > 0" class="bulk-action-buttons">
          <button 
            @click="openBulkAssignModal" 
            class="bulk-assign-btn"
            :disabled="selectedAssessments.length === 0"
          >
            👥 Assign Selected ({{ selectedAssessments.length }})
          </button>
          <button 
            @click="openBulkDeleteModal" 
            class="bulk-delete-btn"
            :disabled="selectedAssessments.length === 0"
          >
            🗑️ Delete Selected ({{ selectedAssessments.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Assessments Grid -->
    <div class="assessments-container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading assessments...</p>
      </div>

      <div v-else-if="filteredAssessments.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No Assessments Found</h3>
        <p v-if="searchQuery || statusFilter || gradeFilter || categoryFilter || quarterFilter !== 'current'">
          No assessments match your current filters.
        </p>
        <p v-else>
          {{ permissions.isAdmin ? 'No assessments in the system yet.' : 'You haven\'t created any assessments yet.' }}
        </p>
        <router-link to="/assessment/create" class="create-first-button">
          <span class="button-icon">➕</span>
          Create Your First Assessment
        </router-link>
      </div>

      <div v-else class="assessments-grid">
        <div 
          v-for="assessment in paginatedAssessments" 
          :key="assessment.id"
          class="assessment-card"
          :class="{ 'selected': selectedAssessments.includes(assessment.id) }"
        >
          <!-- Selection checkbox -->
          <div class="assessment-header">
            <label class="assessment-checkbox">
              <input 
                type="checkbox" 
                :value="assessment.id"
                v-model="selectedAssessments"
              >
            </label>
            <div class="assessment-meta">
              <h3>{{ assessment.title }}</h3>
              <div class="meta-tags">
                <span class="grade-tag">Grade {{ assessment.gradeLevel }}</span>
                <span class="category-tag">{{ assessment.category }}</span>
                <span v-if="assessment.standard" class="standard-tag">{{ assessment.standard }}</span>
              </div>
            </div>
            <div class="assessment-status">
              <span 
                class="status-badge" 
                :class="getAssessmentStatus(assessment).class"
              >
                {{ getAssessmentStatus(assessment).label }}
              </span>
            </div>
          </div>

          <div class="assessment-content">
            <p class="assessment-description">{{ assessment.description }}</p>
            
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
                <span class="detail-label">Time:</span>
                <span class="detail-value">{{ assessment.timeLimit || 'No limit' }} min</span>
              </div>
              <div class="detail">
                <span class="detail-label">Created:</span>
                <span class="detail-value">{{ formatDate(assessment.createdAt) }}</span>
              </div>
            </div>

            <!-- Assigned Students -->
            <div class="assigned-students">
              <div v-if="getAssignedStudents(assessment).length > 0" class="assigned-students-summary">
                <strong>Assigned to {{ getAssignedStudents(assessment).length }} student(s)</strong>
                <div class="period-breakdown">
                  <span 
                    v-for="(periodInfo, index) in getPeriodBreakdown(assessment)" 
                    :key="periodInfo.period"
                    class="period-stat"
                  >
                    <template v-if="index > 0"> | </template>
                    {{ periodInfo.period }}: {{ periodInfo.assigned }}/{{ periodInfo.total }}
                  </span>
                </div>
              </div>
              <div v-else class="no-assignments">
                <span class="no-assignments-text">No students assigned</span>
              </div>
            </div>

            <!-- Accommodations -->
            <div v-if="assessment.accommodations?.length" class="accommodations">
              <strong>Accommodations:</strong>
              <div class="accommodation-tags">
                <span 
                  v-for="accommodation in assessment.accommodations.slice(0, 2)" 
                  :key="accommodation"
                  class="accommodation-tag"
                >
                  {{ accommodation }}
                </span>
                <span v-if="assessment.accommodations.length > 2" class="more-accommodations">
                  +{{ assessment.accommodations.length - 2 }} more
                </span>
              </div>
            </div>
          </div>

          <!-- Assessment Actions -->
          <div class="assessment-actions">
            <button @click="viewAssessment(assessment)" class="view-btn" title="View Details">
              👁️ View
            </button>
            <button @click="editAssessment(assessment)" class="edit-btn" title="Edit Assessment">
              ✏️ Edit
            </button>
            <button @click="assignToStudents(assessment)" class="assign-btn" title="Assign to Students">
              👥 Assign
            </button>
            <button @click="viewResults(assessment)" class="results-btn" title="View Results">
              📊 Results
            </button>
            <button @click="duplicateAssessment(assessment)" class="duplicate-btn" title="Duplicate">
              📋 Copy
            </button>
            <button 
              @click="deleteAssessment(assessment)" 
              class="delete-btn" 
              title="Delete Assessment"
              :disabled="getAssignedStudents(assessment).length > 0"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ← Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredAssessments.length }} total)
        </span>
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Bulk Assignment Modal -->
    <div v-if="showBulkAssignModal" class="modal-overlay" @click="closeBulkAssignModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>📤 Bulk Assign Assessments</h3>
          <button @click="closeBulkAssignModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <p>Assign {{ selectedAssessments.length }} assessment(s) to students:</p>
          
          <div class="student-selection">
            <div class="student-checkboxes">
              <label 
                v-for="student in availableStudents" 
                :key="student.uid"
                class="student-checkbox"
              >
                <input 
                  type="checkbox" 
                  :value="student.uid"
                  v-model="bulkAssignStudents"
                >
                <span>{{ student.firstName }} {{ student.lastName }}</span>
                <small v-if="student.googleId">(Google ID: {{ student.googleId }})</small>
              </label>
            </div>
          </div>
          
          <div class="modal-actions">
            <button @click="closeBulkAssignModal" class="cancel-btn">Cancel</button>
            <button 
              @click="performBulkAssign" 
              class="assign-btn"
              :disabled="bulkAssignStudents.length === 0 || bulkAssigning"
            >
              {{ bulkAssigning ? 'Assigning...' : `Assign to ${bulkAssignStudents.length} Student(s)` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Delete Modal -->
    <div v-if="showBulkDeleteModal" class="modal-overlay" @click="closeBulkDeleteModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>🗑️ Delete Multiple Assessments</h3>
          <button @click="closeBulkDeleteModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-content">
          <div class="warning-section">
            <div class="warning-icon">⚠️</div>
            <p><strong>Warning:</strong> You are about to delete {{ selectedAssessments.length }} assessment(s). This action cannot be undone.</p>
          </div>
          
          <div class="assessments-to-delete">
            <h4>Assessments to be deleted:</h4>
            <div class="assessment-list">
              <div 
                v-for="assessmentId in selectedAssessments" 
                :key="assessmentId"
                class="assessment-item"
              >
                <span class="assessment-name">{{ getAssessmentById(assessmentId)?.title || 'Unknown Assessment' }}</span>
                <span class="assessment-details">
                  Grade {{ getAssessmentById(assessmentId)?.gradeLevel }} - 
                  {{ getAssessmentById(assessmentId)?.category }}
                  <span v-if="getAssessmentById(assessmentId) && getAssignedStudents(getAssessmentById(assessmentId)!).length > 0" class="assigned-warning">
                    (⚠️ Assigned to {{ getAssignedStudents(getAssessmentById(assessmentId)!).length }} student(s))
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="confirmation-section">
            <label class="confirmation-checkbox">
              <input 
                type="checkbox" 
                v-model="deleteConfirmation"
              >
              <span>I understand this will permanently delete these assessments and cannot be undone</span>
            </label>
          </div>
          
          <div class="modal-actions">
            <button @click="closeBulkDeleteModal" class="cancel-btn">Cancel</button>
            <button 
              @click="performBulkDelete" 
              class="delete-btn"
              :disabled="!deleteConfirmation || bulkDeleting"
            >
              {{ bulkDeleting ? 'Deleting...' : `Delete ${selectedAssessments.length} Assessment(s)` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading assessments...</p>
    </div>

    <!-- Messages -->
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import { 
  getAllStudents, 
  getStudentsByTeacher 
} from '@/firebase/userServices';
import { 
  getAssessmentsByTeacher,
  getAllAssessments,
  deleteAssessment as deleteAssessmentService,
  assignAssessmentToStudent,
  getAssessmentResults,
  duplicateAssessment as duplicateAssessmentService
} from '@/firebase/iepServices';
import { 
  getAssessmentAssignments,
  getAutoDetectedAcademicPeriod,
  initializeAcademicPeriodCache
} from '@/firebase/assignmentServices';
import { loadAcademicPeriodSettings as loadSettings } from '@/firebase/appSettingsService';
import { getCurrentAcademicYear, generateAcademicYear, getCurrentPeriod } from '@/types/academicPeriods';
import type { AcademicYear, AcademicPeriod } from '@/types/academicPeriods';
import { getAllTeachers } from '@/firebase/userServices';
import type { Assessment, AssessmentAssignment } from '@/types/iep';
import type { Student as FirebaseStudent, Teacher } from '@/types/users';

const router = useRouter();
const authStore = useAuthStore();
const permissions = usePermissions();

// State
const assessments = ref<Assessment[]>([]);
const availableStudents = ref<FirebaseStudent[]>([]);
const assignmentData = ref<any[]>([]);
const teachers = ref<Teacher[]>([]);
const selectedAssessments = ref<string[]>([]);
const bulkAssignStudents = ref<string[]>([]);

const searchQuery = ref('');
const statusFilter = ref('');
const gradeFilter = ref('');
const categoryFilter = ref('');
const quarterFilter = ref('current'); // Default to current quarter
const currentPage = ref(1);
const pageSize = 12;
const academicYearSettings = ref<AcademicYear | null>(null);
const quarterLabels = ref<Record<string, string>>({});

const loading = ref(true);
const loadingStudents = ref(true);
const bulkAssigning = ref(false);
const bulkDeleting = ref(false);
const deleteConfirmation = ref(false);
const error = ref('');
const success = ref('');

// Modal state
const showBulkAssignModal = ref(false);
const showBulkDeleteModal = ref(false);
const fixing = ref(false);

// Computed properties
const currentQuarterLabel = computed(() => {
  // Use loaded settings if available, otherwise fall back to detection
  let quarter: string;
  
  if (academicYearSettings.value) {
    // Use the loaded settings to determine current quarter
    const currentPeriod = getCurrentPeriod(academicYearSettings.value);
    quarter = currentPeriod?.id || getAutoDetectedAcademicPeriod();
  } else {
    // Fall back to detection (will use defaults until cache loads)
    quarter = getAutoDetectedAcademicPeriod();
  }
  
  if (quarterLabels.value[quarter]) {
    return quarterLabels.value[quarter];
  }
  const labels: Record<string, string> = {
    'q1': 'Q1',
    'q2': 'Q2',
    'q3': 'Q3',
    'q4': 'Q4',
    'all': 'All Year'
  };
  return labels[quarter] || quarter;
});

// Format quarter date range for display
const formatQuarterDateRange = (period: AcademicPeriod): string => {
  const startMonth = period.startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = period.startDate.getDate();
  const endMonth = period.endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = period.endDate.getDate();
  return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
};

const filteredAssessments = computed(() => {
  let filtered = assessments.value;
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(assessment => 
      assessment.title.toLowerCase().includes(query) ||
      assessment.description.toLowerCase().includes(query) ||
      assessment.standard?.toLowerCase().includes(query)
    );
  }
  
  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(assessment => {
      const status = getAssessmentStatus(assessment);
      return status.value === statusFilter.value;
    });
  }
  
  // Grade filter
  if (gradeFilter.value) {
    filtered = filtered.filter(assessment => 
      assessment.gradeLevel === parseInt(gradeFilter.value)
    );
  }
  
  // Category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(assessment => 
      assessment.category === categoryFilter.value
    );
  }
  
  // Quarter filter
  if (quarterFilter.value && quarterFilter.value !== 'all') {
    if (quarterFilter.value === 'current') {
      // Use loaded settings if available
      let currentQuarter: string;
      if (academicYearSettings.value) {
        const currentPeriod = getCurrentPeriod(academicYearSettings.value);
        currentQuarter = currentPeriod?.id || getAutoDetectedAcademicPeriod();
      } else {
        currentQuarter = getAutoDetectedAcademicPeriod();
      }
      filtered = filtered.filter(assessment => 
        assessment.academicPeriod === currentQuarter
      );
    } else if (quarterFilter.value === 'unassigned') {
      filtered = filtered.filter(assessment => 
        !assessment.academicPeriod || assessment.academicPeriod === undefined || assessment.academicPeriod === null
      );
    } else {
      // Filter by specific quarter (q1, q2, q3, q4)
      filtered = filtered.filter(assessment => 
        assessment.academicPeriod === quarterFilter.value
      );
    }
  }
  
  return filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const totalPages = computed(() => Math.ceil(filteredAssessments.value.length / pageSize));

const paginatedAssessments = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredAssessments.value.slice(start, end);
});

const assignedAssessments = computed(() => {
  // Explicitly depend on both assessments and availableStudents for reactivity
  if (!availableStudents.value.length) return 0;
  return assessments.value.filter(a => getAssignedStudents(a).length > 0).length;
});

const templateAssessments = computed(() => {
  // Explicitly depend on both assessments and availableStudents for reactivity  
  if (!availableStudents.value.length) return assessments.value.length;
  return assessments.value.filter(a => getAssignedStudents(a).length === 0).length;
});

const completedAssessments = computed(() => {
  // TODO: Calculate from assessment results
  return Math.floor(assignedAssessments.value * 0.6);
});

const allVisibleSelected = computed(() => 
  paginatedAssessments.value.length > 0 && 
  paginatedAssessments.value.every(a => selectedAssessments.value.includes(a.id))
);

// Methods
const loadAssessments = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    if (permissions.isAdmin) {
      // Admins can see all assessments except Progress Assessments (PA)
      console.log('Loading all assessments for admin...');
      const allAssessments = await getAllAssessments();
      assessments.value = allAssessments.filter(a => a.category !== 'PA');
    } else if (permissions.isTeacher && authStore.currentUser?.uid) {
      // Teachers can only see their created assessments (excluding PA)
      console.log('Loading teacher assessments...');
      const teacherAssessments = await getAssessmentsByTeacher(authStore.currentUser.uid);
      assessments.value = teacherAssessments.filter(a => a.category !== 'PA');
    } else {
      assessments.value = [];
    }
    
    console.log(`Loaded ${assessments.value.length} assessments (Progress Assessments excluded)`);
    
  } catch (err: any) {
    console.error('Error loading assessments:', err);
    error.value = err.message || 'Failed to load assessments. Please try again.';
  } finally {
    loading.value = false;
  }
};

const loadStudents = async () => {
  try {
    loadingStudents.value = true;
    
    if (permissions.isAdmin) {
      availableStudents.value = await getAllStudents();
    } else if (permissions.isTeacher && authStore.currentUser?.uid) {
      availableStudents.value = await getStudentsByTeacher(authStore.currentUser.uid);
    } else {
      availableStudents.value = [];
    }
    
    console.log(`Loaded ${availableStudents.value.length} students for assignment`);
    
  } catch (err: any) {
    console.error('Error loading students:', err);
  } finally {
    loadingStudents.value = false;
  }
};

const loadTeachers = async () => {
  try {
    if (permissions.isAdmin) {
      teachers.value = await getAllTeachers();
      console.log(`Loaded ${teachers.value.length} teachers`);
    }
  } catch (err: any) {
    console.error('Error loading teachers:', err);
  }
};

const loadAssignmentData = async () => {
  try {
    console.log('🔍 Loading assignment data for all assessments...');
    const allAssignments: any[] = [];
    
    // For each assessment, get its assignments
    for (const assessment of assessments.value) {
      try {
        const assessmentAssignments = await getAssessmentAssignments(assessment.id);
        allAssignments.push(...assessmentAssignments);
      } catch (error) {
        console.error(`Error loading assignments for assessment ${assessment.id}:`, error);
      }
    }
    
    assignmentData.value = allAssignments;
    console.log(`📋 Loaded ${allAssignments.length} assignment records across all assessments`);
  } catch (err: any) {
    console.error('Error loading assignment data:', err);
  }
};

const getAssessmentStatus = (assessment: Assessment) => {
  const assignedStudents = getAssignedStudents(assessment);
  if (assignedStudents.length > 0) {
    // Check if completed (would need to check results)
    return { value: 'assigned', label: 'Assigned', class: 'assigned' };
  } else {
    return { value: 'template', label: 'Template', class: 'template' };
  }
};

const getAssignedStudents = (assessment: Assessment): FirebaseStudent[] => {
  // Get students assigned to this assessment from junction table
  return availableStudents.value.filter(student => {
    // Check if this student has an assignment for this assessment
    return assignmentData.value.some(assignment => 
      assignment.assessmentId === assessment.id && 
      assignment.studentUid === student.uid
    );
  });
};

const getPeriodBreakdown = (assessment: Assessment) => {
  const assignedStudents = getAssignedStudents(assessment);
  
  // Group students by period
  const periodMap = new Map<string, { assigned: number; total: number }>();
  
  // First, count all students in each period (from availableStudents)
  availableStudents.value.forEach(student => {
    const period = student.period || 'No Period';
    if (!periodMap.has(period)) {
      periodMap.set(period, { assigned: 0, total: 0 });
    }
    periodMap.get(period)!.total++;
  });
  
  // Then count assigned students in each period
  assignedStudents.forEach(student => {
    const period = student.period || 'No Period';
    if (periodMap.has(period)) {
      periodMap.get(period)!.assigned++;
    }
  });
  
  // Convert to array and sort by period
  const breakdown = Array.from(periodMap.entries())
    .map(([period, counts]) => ({
      period,
      assigned: counts.assigned,
      total: counts.total
    }))
    .filter(item => item.assigned > 0) // Only show periods with assigned students
    .sort((a, b) => {
      // Sort numerically if possible, otherwise alphabetically
      const aNum = parseInt(a.period);
      const bNum = parseInt(b.period);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.period.localeCompare(b.period);
    });
  
  return breakdown;
};

const viewAssessment = (assessment: Assessment) => {
  // TODO: Create assessment preview/view component
  router.push(`/assessment/${assessment.id}/preview`);
};

const editAssessment = (assessment: Assessment) => {
  router.push(`/assessment/edit/${assessment.id}`);
};

const assignToStudents = (assessment: Assessment) => {
  selectedAssessments.value = [assessment.id];
  showBulkAssignModal.value = true;
};

const viewResults = async (assessment: Assessment) => {
  try {
    console.log('📊 Viewing results for assessment:', assessment.title);
    // Navigate to the new results overview page
    router.push(`/assessment/${assessment.id}/results`);
  } catch (error) {
    console.error('Error viewing results:', error);
    alert('Failed to view results. Please try again.');
  }
};

const duplicateAssessment = async (assessment: Assessment) => {
  try {
    // Ask for new title
    const newTitle = prompt(`Enter title for duplicated assessment:`, `${assessment.title} (Copy)`);
    
    if (!newTitle) {
      return; // User cancelled
    }
    
    console.log('📋 Starting duplication of assessment:', assessment.title);
    
    // Call the duplicate service
    const newAssessmentId = await duplicateAssessmentService(assessment, newTitle.trim());
    
    // Refresh the assessments list to show the new copy
    await loadAssessments();
    
    success.value = `Assessment "${newTitle}" created successfully!`;
    
    // Clear success message after a few seconds
    setTimeout(() => {
      success.value = '';
    }, 3000);
    
  } catch (err: any) {
    console.error('Error duplicating assessment:', err);
    error.value = 'Failed to duplicate assessment. Please try again.';
  }
};

const deleteAssessment = async (assessment: Assessment) => {
  const assignedStudents = getAssignedStudents(assessment);
  
  if (assignedStudents.length > 0) {
    error.value = 'Cannot delete assessments that are assigned to students. Unassign first.';
    return;
  }
  
  if (confirm(`Are you sure you want to delete "${assessment.title}"? This action cannot be undone.`)) {
    try {
      await deleteAssessmentService(assessment.id);
      
      // Remove from local list
      const index = assessments.value.findIndex(a => a.id === assessment.id);
      if (index !== -1) {
        assessments.value.splice(index, 1);
      }
      
      // Remove from selection
      const selectionIndex = selectedAssessments.value.indexOf(assessment.id);
      if (selectionIndex !== -1) {
        selectedAssessments.value.splice(selectionIndex, 1);
      }
      
      success.value = 'Assessment deleted successfully!';
      setTimeout(() => { success.value = ''; }, 3000);
      
    } catch (err: any) {
      console.error('Error deleting assessment:', err);
      error.value = err.message || 'Failed to delete assessment.';
    }
  }
};

const openBulkAssignModal = () => {
  if (selectedAssessments.value.length === 0) return;
  showBulkAssignModal.value = true;
};

const performBulkAssign = async () => {
  try {
    bulkAssigning.value = true;
    error.value = '';
    
    let assignedCount = 0;
    
    // Original approach: Use the existing assignAssessmentToStudent function
    for (const assessmentId of selectedAssessments.value) {
      for (const studentUid of bulkAssignStudents.value) {
        try {
          await assignAssessmentToStudent(assessmentId, studentUid, authStore.currentUser?.uid || 'system');
          assignedCount++;
        } catch (err) {
          console.error('Error assigning assessment:', err);
        }
      }
    }
    
    // Reload assessments to show updated assignments
    await loadAssessments();
    
    closeBulkAssignModal();
    success.value = `Successfully assigned ${selectedAssessments.value.length} assessment(s) to ${bulkAssignStudents.value.length} student(s)!`;
    setTimeout(() => { success.value = ''; }, 5000);
    
  } catch (err: any) {
    console.error('Error in bulk assignment:', err);
    error.value = 'Failed to assign assessments. Please try again.';
  } finally {
    bulkAssigning.value = false;
  }
};

const toggleSelectAll = () => {
  if (allVisibleSelected.value) {
    // Deselect all visible
    selectedAssessments.value = selectedAssessments.value.filter(id => 
      !paginatedAssessments.value.some(a => a.id === id)
    );
  } else {
    // Select all visible
    const visibleIds = paginatedAssessments.value.map(a => a.id);
    selectedAssessments.value = [...new Set([...selectedAssessments.value, ...visibleIds])];
  }
};

const closeBulkAssignModal = () => {
  showBulkAssignModal.value = false;
  bulkAssignStudents.value = [];
};

// Bulk delete methods
const openBulkDeleteModal = () => {
  if (selectedAssessments.value.length === 0) return;
  showBulkDeleteModal.value = true;
  deleteConfirmation.value = false;
};

const closeBulkDeleteModal = () => {
  showBulkDeleteModal.value = false;
  deleteConfirmation.value = false;
};

const performBulkDelete = async () => {
  try {
    bulkDeleting.value = true;
    error.value = '';
    
    const assessmentsToDelete = [...selectedAssessments.value];
    let deletedCount = 0;
    const failedDeletions: string[] = [];
    
    for (const assessmentId of assessmentsToDelete) {
      try {
        await deleteAssessmentService(assessmentId);
        deletedCount++;
        
        // Remove from local state
        const index = assessments.value.findIndex(a => a.id === assessmentId);
        if (index !== -1) {
          assessments.value.splice(index, 1);
        }
      } catch (err) {
        console.error('Error deleting assessment:', assessmentId, err);
        const assessment = assessments.value.find(a => a.id === assessmentId);
        failedDeletions.push(assessment?.title || assessmentId);
      }
    }
    
    // Clear selection
    selectedAssessments.value = [];
    closeBulkDeleteModal();
    
    if (deletedCount === assessmentsToDelete.length) {
      success.value = `Successfully deleted ${deletedCount} assessment(s)!`;
    } else {
      success.value = `Deleted ${deletedCount} assessment(s). Failed to delete: ${failedDeletions.join(', ')}`;
    }
    setTimeout(() => { success.value = ''; }, 5000);
    
  } catch (err: any) {
    console.error('Error in bulk deletion:', err);
    error.value = err.message || 'Failed to delete assessments.';
  } finally {
    bulkDeleting.value = false;
  }
};

const getAssessmentById = (assessmentId: string) => {
  return assessments.value.find(a => a.id === assessmentId);
};

const exportAssessments = () => {
  try {
    const csvContent = [
      ['Title', 'Description', 'Grade', 'Category', 'Standard', 'Questions', 'Points', 'Status', 'Created'].join(','),
      ...filteredAssessments.value.map(assessment => [
        assessment.title,
        assessment.description,
        assessment.gradeLevel,
        assessment.category,
        assessment.standard || '',
        assessment.questions?.length || 0,
        assessment.totalPoints,
        getAssessmentStatus(assessment).label,
        formatDate(assessment.createdAt)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'assessments_export.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    success.value = 'Assessments exported successfully!';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    error.value = 'Failed to export assessments.';
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '-';
  
  try {
    return new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp).toLocaleDateString();
  } catch (error) {
    console.warn('Unable to format date:', timestamp);
    return 'Invalid Date';
  }
};

// Teacher assignment fix functions
const getTeacherName = (teacherUid: string): string => {
  const teacher = teachers.value.find(t => t.uid === teacherUid);
  if (!teacher) return '';
  return `${teacher.firstName} ${teacher.lastName}`;
};

// Load academic period settings
const loadAcademicPeriodSettings = async () => {
  try {
    const settings = await loadSettings();
    if (settings) {
      academicYearSettings.value = settings;
      // Build quarter labels map
      const labels: Record<string, string> = {};
      settings.periods.forEach(period => {
        labels[period.id] = period.shortName;
      });
      quarterLabels.value = labels;
      console.log('✅ Loaded academic period settings for quarter filter');
    } else {
      // Use defaults if no settings found
      const yearString = getCurrentAcademicYear();
      const defaultYear = generateAcademicYear(yearString, 'quarters');
      academicYearSettings.value = defaultYear;
      const labels: Record<string, string> = {
        'q1': 'Q1',
        'q2': 'Q2',
        'q3': 'Q3',
        'q4': 'Q4'
      };
      quarterLabels.value = labels;
      console.log('📝 Using default academic period settings');
    }
    
    // Initialize cache for getAutoDetectedAcademicPeriod
    await initializeAcademicPeriodCache();
  } catch (error) {
    console.error('❌ Error loading academic period settings:', error);
  }
};

// Reset page when filters change
watch([searchQuery, statusFilter, gradeFilter, categoryFilter, quarterFilter], () => {
  currentPage.value = 1;
});

// Load data on component mount
onMounted(async () => {
  // Initialize academic period cache and load settings first
  await loadAcademicPeriodSettings();
  
  // Load assessments and students first, then assignments (which depends on assessments)
  await Promise.all([
    loadAssessments(),
    loadStudents(),
    loadTeachers()
  ]);
  
  // Load assignments after assessments are loaded
  await loadAssignmentData();
  
  console.log('✅ Assessments, students, teachers, and assignments loaded - UI should now show correct assignment counts');
});
</script>

<style scoped>
.assessment-management {
  max-width: 1400px;
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

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.create-button,
.assign-button,
.export-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: white;
}

.create-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.assign-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.assign-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.assign-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-button {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.export-button:hover {
  background: #e5e7eb;
}

.search-bar {
  position: relative;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
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
  border-left: 4px solid #10b981;
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

.filters-section {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.filters {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 120px;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
}

.assessments-container {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.assessments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.assessment-card {
  border: 2px solid #e5e7eb;
  border-radius: 15px;
  padding: 25px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.assessment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: #10b981;
}

.assessment-card.selected {
  border-color: #10b981;
  background: #f0fdf4;
}

.assessment-header {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  
}

.assessment-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.assessment-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.assessment-meta {
  flex: 1;
}

.assessment-meta h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin: 0 0 10px 0;
}

.meta-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grade-tag,
.category-tag,
.standard-tag {
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

.standard-tag {
  background: #fef3c7;
  color: #92400e;
}

.status-badge {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.assigned {
  background: #dcfce7;
  color: #166534;
}

.status-badge.template {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.completed {
  background: #dbeafe;
  color: #1e40af;
}

.assessment-description {
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.5;
}

.assessment-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.detail-label {
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
}

.detail-value {
  color: #1f2937;
  font-weight: 600;
}

.assigned-students,
.accommodations {
  margin-bottom: 15px;
  padding: 10px;
  background: #f0f4ff;
  border-radius: 8px;
}

.assigned-students-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assigned-students-summary strong {
  color: #1f2937;
  font-size: 0.9rem;
}

.period-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.85rem;
  color: #4b5563;
  line-height: 1.5;
}

.period-stat {
  white-space: nowrap;
}

.assigned-students strong,
.accommodations strong {
  color: #1f2937;
  font-size: 0.9rem;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.student-assignment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.student-tags,
.accommodation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.student-tag {
  background: #667eea;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.accommodation-tag {
  background: #f59e0b;
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.more-students,
.more-accommodations {
  color: #6b7280;
  font-size: 0.7rem;
}

.no-assignments {
  margin-top: 5px;
}

.no-assignments-text {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.9rem;
}

.assessment-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.view-btn,
.edit-btn,
.assign-btn,
.results-btn,
.duplicate-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 70px;
}

.view-btn {
  background: #f0f4ff;
  color: #3730a3;
}

.view-btn:hover {
  background: #e0e7ff;
}

.edit-btn {
  background: #fef3c7;
  color: #92400e;
}

.edit-btn:hover {
  background: #fde68a;
}

.assign-btn {
  background: #e0e7ff;
  color: #3730a3;
}

.assign-btn:hover {
  background: #c7d2fe;
}

.results-btn {
  background: #f0fdf4;
  color: #166534;
}

.results-btn:hover {
  background: #dcfce7;
}

.duplicate-btn {
  background: #f3f4f6;
  color: #374151;
}

.duplicate-btn:hover {
  background: #e5e7eb;
}

.delete-btn {
  background: #fef2f2;
  color: #dc2626;
}

.delete-btn:hover:not(:disabled) {
  background: #fee2e2;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-state h3 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.empty-state p {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.create-first-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-decoration: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.create-first-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
}

.page-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.9rem;
}

/* Modal styles */
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px 0;
  margin-bottom: 25px;
}

.modal-header h3 {
  color: #1f2937;
  font-size: 1.5rem;
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
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-content {
  padding: 0 30px 30px;
}

.student-selection {
  margin: 20px 0;
}

.student-checkboxes {
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  background: #f9fafb;
}

.student-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  margin-bottom: 8px;
}

.student-checkbox:hover {
  background: #f3f4f6;
}

.student-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.student-checkbox span {
  font-weight: 500;
  color: #1f2937;
}

.student-checkbox small {
  color: #6b7280;
  font-size: 0.8rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.assign-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.assign-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.assign-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fecaca;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  text-align: center;
}

.success-message {
  background: #f0fdf4;
  color: #166534;
  border: 2px solid #bbf7d0;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .assessment-management {
    padding: 15px;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .search-bar {
    min-width: auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    justify-content: center;
  }
  
  .assessments-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .assessment-details {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .assessment-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

/* Bulk action styles */
.bulk-action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.bulk-assign-btn,
.bulk-delete-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.bulk-assign-btn {
  background: #3b82f6;
  color: white;
}

.bulk-assign-btn:hover:not(:disabled) {
  background: #2563eb;
}

.bulk-delete-btn {
  background: #dc2626;
  color: white;
}

.bulk-delete-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.bulk-assign-btn:disabled,
.bulk-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Bulk delete modal styles */
.warning-section {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 1.5rem;
  color: #dc2626;
}

.warning-section p {
  margin: 0;
  color: #7f1d1d;
  line-height: 1.5;
}

.assessments-to-delete {
  margin-bottom: 20px;
}

.assessments-to-delete h4 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 1rem;
}

.assessment-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
  background: #f9fafb;
}

.assessment-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.assessment-item:last-child {
  border-bottom: none;
}

.assessment-name {
  font-weight: 600;
  color: #1f2937;
}

.assessment-details {
  font-size: 0.85rem;
  color: #6b7280;
}

.assigned-warning {
  color: #dc2626;
  font-weight: 500;
}

.confirmation-section {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.confirmation-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.confirmation-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.confirmation-checkbox span {
  color: #374151;
  font-weight: 500;
  line-height: 1.4;
}

.delete-btn {
  background: #dc2626;
  color: white;
  border: 2px solid #dc2626;
}

.delete-btn:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Teacher fix modal styles */
.info-text {
  color: #4a5568;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.info-text strong {
  color: #2d3748;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.current-teacher {
  padding: 0.75rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #2d3748;
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #2d3748;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
</style>
