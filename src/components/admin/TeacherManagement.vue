<template>
  <div class="teacher-management">
    <div class="header">
      <h1>👨‍🏫 Teacher Management</h1>
      <p>Add, edit, and manage teacher accounts</p>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-buttons">
        <button @click="showAddTeacherModal = true" class="add-button">
          <span class="button-icon">➕</span>
          Add Teacher
        </button>
        <button @click="bulkImport" class="import-button">
          <span class="button-icon">📥</span>
          Bulk Import
        </button>
        <button @click="exportTeachers" class="export-button">
          <span class="button-icon">📤</span>
          Export Teachers
        </button>
      </div>
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search teachers..." 
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- Teacher Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-content">
          <div class="stat-number">{{ filteredTeachers.length }}</div>
          <div class="stat-label">Total Teachers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👑</div>
        <div class="stat-content">
          <div class="stat-number">{{ adminCount }}</div>
          <div class="stat-label">Administrators</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ activeTeachers }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎓</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalStudentsAssigned }}</div>
          <div class="stat-label">Students Assigned</div>
        </div>
      </div>
    </div>

    <!-- Teachers Table -->
    <div class="teachers-table-container">
      <div class="table-header">
        <h2>Teachers ({{ filteredTeachers.length }})</h2>
        <div class="table-actions">
          <select v-model="roleFilter" class="filter-select">
            <option value="">All Roles</option>
            <option value="admin">👑 Administrators</option>
            <option value="teacher">👨‍🏫 Teachers</option>
          </select>
          <select v-model="statusFilter" class="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="teachers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Aeries ID</th>
              <th>Department</th>
              <th>Subjects</th>
              <th>Students</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="teacher in paginatedTeachers" :key="teacher.uid" class="teacher-row">
              <td class="name-cell">
                <div class="teacher-info">
                  <div class="teacher-avatar" :class="teacher.role">
                    {{ teacher.role === 'admin' ? '👑' : '👨‍🏫' }}
                  </div>
                  <div class="teacher-details">
                    <strong>{{ teacher.firstName }} {{ teacher.lastName }}</strong>
                    <small>{{ teacher.email }}</small>
                  </div>
                </div>
              </td>
              <td>{{ teacher.email }}</td>
              <td>
                <span class="role-badge" :class="teacher.role">
                  {{ teacher.role === 'admin' ? '👑 Admin' : '👨‍🏫 Teacher' }}
                </span>
              </td>
              <td>{{ teacher.aeriesId || '-' }}</td>
              <td>{{ teacher.department || '-' }}</td>
              <td>
                <div class="subjects-list">
                  <span 
                    v-for="subject in teacher.subjects?.slice(0, 2)" 
                    :key="subject"
                    class="subject-tag"
                  >
                    {{ subject }}
                  </span>
                  <span v-if="teacher.subjects && teacher.subjects.length > 2" class="more-subjects">
                    +{{ teacher.subjects.length - 2 }}
                  </span>
                </div>
              </td>
              <td>{{ teacher.assignedStudents?.length || 0 }}</td>
              <td>
                <span class="status-badge" :class="teacher.isActive ? 'active' : 'inactive'">
                  {{ teacher.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="action-buttons-cell">
                  <button @click="editTeacher(teacher)" class="edit-btn" title="Edit Teacher">
                    ✏️
                  </button>
                  <button @click="viewStudents(teacher)" class="view-btn" title="View Students">
                    🎓
                  </button>
                  <button 
                    @click="toggleRole(teacher)" 
                    class="role-btn" 
                    :title="teacher.role === 'admin' ? 'Remove Admin' : 'Make Admin'"
                  >
                    {{ teacher.role === 'admin' ? '👨‍🏫' : '👑' }}
                  </button>
                  <button @click="deleteTeacher(teacher)" class="delete-btn" title="Delete Teacher">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="filteredTeachers.length === 0" class="empty-state">
          <div class="empty-icon">👨‍🏫</div>
          <h3>No Teachers Found</h3>
          <p v-if="searchQuery || roleFilter || statusFilter">
            No teachers match your current filters.
          </p>
          <p v-else>Add teachers to get started with the assessment system.</p>
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
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredTeachers.length }} total)
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

    <!-- Add/Edit Teacher Modal -->
    <div v-if="showAddTeacherModal || editingTeacher" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTeacher ? 'Edit Teacher' : 'Add New Teacher' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveTeacher" class="teacher-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input 
                id="firstName"
                v-model="teacherForm.firstName" 
                type="text" 
                required 
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input 
                id="lastName"
                v-model="teacherForm.lastName" 
                type="text" 
                required 
                class="form-input"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email Address *</label>
            <input 
              id="email"
              v-model="teacherForm.email" 
              type="email" 
              required 
              class="form-input"
              placeholder="teacher@school.edu"
              :disabled="!!editingTeacher"
            >
            <small class="form-help">Teachers use this email to log into the system</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="aeriesId">Aeries ID</label>
              <input 
                id="aeriesId"
                v-model="teacherForm.aeriesId" 
                type="text" 
                class="form-input"
                placeholder="Optional Aeries teacher ID"
              >
            </div>
            <div class="form-group">
              <label for="department">Department</label>
              <select id="department" v-model="teacherForm.department" class="form-select">
                <option value="">Select Department</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Special Education">Special Education</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="schoolId">School ID</label>
              <input 
                id="schoolId"
                v-model="teacherForm.schoolId" 
                type="text" 
                class="form-input"
                placeholder="School identifier"
              >
            </div>
            <div class="form-group">
              <label for="phoneNumber">Phone Number</label>
              <input 
                id="phoneNumber"
                v-model="teacherForm.phoneNumber" 
                type="tel" 
                class="form-input"
                placeholder="Contact number"
              >
            </div>
          </div>

          <div class="form-group">
            <label>Subjects Taught</label>
            <div class="subjects-selection">
              <label 
                v-for="subject in availableSubjects" 
                :key="subject"
                class="checkbox-label"
              >
                <input 
                  type="checkbox" 
                  :value="subject"
                  v-model="teacherForm.subjects"
                >
                {{ subject }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Grade Levels Taught</label>
            <div class="grades-selection">
              <label 
                v-for="grade in availableGrades" 
                :key="grade"
                class="checkbox-label grade-checkbox"
              >
                <input 
                  type="checkbox" 
                  :value="grade"
                  v-model="teacherForm.gradesTaught"
                >
                Grade {{ grade }}
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" v-model="teacherForm.role" class="form-select">
                <option value="teacher">👨‍🏫 Teacher</option>
                <option value="admin">👑 Administrator</option>
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="teacherForm.isActive">
                Active Account
              </label>
            </div>
          </div>

          <div v-if="!editingTeacher" class="form-group">
            <label for="password">Temporary Password *</label>
            <input 
              id="password"
              v-model="teacherForm.password" 
              type="password" 
              required 
              class="form-input"
              minlength="6"
              placeholder="Minimum 6 characters"
            >
            <small class="form-help">Teacher can change this after first login</small>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Saving...' : (editingTeacher ? 'Update Teacher' : 'Add Teacher') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading teachers...</p>
    </div>

    <!-- Messages -->
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { createTeacher, getAllTeachers, updateTeacher, deleteTeacher as deleteTeacherService } from '@/firebase/userServices';
import type { Teacher, CreateTeacherData } from '@/types/users';

const router = useRouter();
const authStore = useAuthStore();

// State
const teachers = ref<Teacher[]>([]);
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = 20;
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');

// Modal state
const showAddTeacherModal = ref(false);
const editingTeacher = ref<Teacher | null>(null);

// Form data
const teacherForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  aeriesId: '',
  department: '',
  schoolId: '',
  phoneNumber: '',
  subjects: [] as string[],
  gradesTaught: [] as string[],
  role: 'teacher',
  isActive: true,
  password: ''
});

const availableSubjects = [
  'Mathematics',
  'Algebra',
  'Geometry',
  'Statistics',
  'Pre-Calculus',
  'Calculus',
  'Special Education Math',
  'English',
  'Science',
  'Social Studies',
  'Special Education'
];

const availableGrades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Computed properties
const filteredTeachers = computed(() => {
  let filtered = teachers.value;
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(teacher => 
      teacher.firstName.toLowerCase().includes(query) ||
      teacher.lastName.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query) ||
      teacher.aeriesId?.toLowerCase().includes(query) ||
      teacher.department?.toLowerCase().includes(query)
    );
  }
  
  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter(teacher => teacher.role === roleFilter.value);
  }
  
  // Status filter
  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter(teacher => teacher.isActive === isActive);
  }
  
  return filtered.sort((a, b) => a.lastName.localeCompare(b.lastName));
});

const totalPages = computed(() => Math.ceil(filteredTeachers.value.length / pageSize));

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredTeachers.value.slice(start, end);
});

const adminCount = computed(() => 
  teachers.value.filter(t => t.role === 'admin').length
);

const activeTeachers = computed(() => 
  teachers.value.filter(t => t.isActive).length
);

const totalStudentsAssigned = computed(() => 
  teachers.value.reduce((total, teacher) => total + (teacher.assignedStudents?.length || 0), 0)
);

// Methods
const loadTeachers = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    console.log('Loading teachers from Firestore...');
    const teachersData = await getAllTeachers();
    teachers.value = teachersData;
    console.log(`Loaded ${teachersData.length} teachers`);
    
  } catch (err: any) {
    console.error('Error loading teachers:', err);
    error.value = err.message || 'Failed to load teachers. Please try again.';
  } finally {
    loading.value = false;
  }
};

const saveTeacher = async () => {
  try {
    saving.value = true;
    error.value = '';
    
    const teacherData: CreateTeacherData = {
      email: teacherForm.value.email,
      firstName: teacherForm.value.firstName,
      lastName: teacherForm.value.lastName,
      displayName: `${teacherForm.value.firstName} ${teacherForm.value.lastName}`,
      role: teacherForm.value.role as 'teacher' | 'admin',
      aeriesId: teacherForm.value.aeriesId,
      schoolId: teacherForm.value.schoolId,
      department: teacherForm.value.department,
      subjects: teacherForm.value.subjects,
      gradesTaught: teacherForm.value.gradesTaught,
      phoneNumber: teacherForm.value.phoneNumber
    };
    
    if (editingTeacher.value) {
      // Update existing teacher
      await updateTeacher(editingTeacher.value.uid, teacherData);
      success.value = 'Teacher updated successfully!';
      
      // Update local data
      const index = teachers.value.findIndex(t => t.uid === editingTeacher.value!.uid);
      if (index !== -1) {
        teachers.value[index] = { ...teachers.value[index], ...teacherData };
      }
    } else {
      // Create new teacher
      const newTeacher = await createTeacher(teacherData, teacherForm.value.password);
      teachers.value.push(newTeacher);
      success.value = 'Teacher added successfully!';
    }
    
    closeModal();
    setTimeout(() => { success.value = ''; }, 3000);
    
  } catch (err: any) {
    console.error('Error saving teacher:', err);
    error.value = err.message || 'Failed to save teacher. Please try again.';
  } finally {
    saving.value = false;
  }
};

const editTeacher = (teacher: Teacher) => {
  editingTeacher.value = teacher;
  teacherForm.value = {
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    aeriesId: teacher.aeriesId || '',
    department: teacher.department || '',
    schoolId: teacher.schoolId || '',
    phoneNumber: teacher.phoneNumber || '',
    subjects: teacher.subjects || [],
    gradesTaught: teacher.gradesTaught || [],
    role: teacher.role,
    isActive: teacher.isActive,
    password: ''
  };
};

const deleteTeacher = async (teacher: Teacher) => {
  if (teacher.uid === authStore.currentUser?.uid) {
    error.value = 'You cannot delete your own account.';
    return;
  }
  
  if (confirm(`Are you sure you want to delete ${teacher.firstName} ${teacher.lastName}? This action cannot be undone.`)) {
    try {
      await deleteTeacherService(teacher.uid);
      
      const index = teachers.value.findIndex(t => t.uid === teacher.uid);
      if (index !== -1) {
        teachers.value.splice(index, 1);
        success.value = 'Teacher deleted successfully!';
        setTimeout(() => { success.value = ''; }, 3000);
      }
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      error.value = 'Failed to delete teacher. Please try again.';
    }
  }
};

const toggleRole = async (teacher: Teacher) => {
  if (teacher.uid === authStore.currentUser?.uid) {
    error.value = 'You cannot change your own role.';
    return;
  }
  
  try {
    const newRole = teacher.role === 'admin' ? 'teacher' : 'admin';
    await updateTeacher(teacher.uid, { role: newRole });
    
    // Update local data
    const index = teachers.value.findIndex(t => t.uid === teacher.uid);
    if (index !== -1) {
      teachers.value[index].role = newRole;
    }
    
    success.value = `Teacher role updated to ${newRole}!`;
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err: any) {
    console.error('Error updating teacher role:', err);
    error.value = 'Failed to update teacher role.';
  }
};

const viewStudents = (teacher: Teacher) => {
  router.push(`/students?teacher=${teacher.uid}`);
};

const bulkImport = () => {
  alert('Bulk teacher import functionality will be available soon.');
};

const exportTeachers = () => {
  try {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Aeries ID', 'Department', 'Subjects', 'Role', 'Status'].join(','),
      ...teachers.value.map(teacher => [
        teacher.firstName,
        teacher.lastName,
        teacher.email,
        teacher.aeriesId || '',
        teacher.department || '',
        teacher.subjects?.join('; ') || '',
        teacher.role,
        teacher.isActive ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teachers_export.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    success.value = 'Teacher list exported successfully!';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    error.value = 'Failed to export teacher list.';
  }
};

const closeModal = () => {
  showAddTeacherModal.value = false;
  editingTeacher.value = null;
  teacherForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    aeriesId: '',
    department: '',
    schoolId: '',
    phoneNumber: '',
    subjects: [],
    gradesTaught: [],
    role: 'teacher',
    isActive: true,
    password: ''
  };
};

// Load teachers on component mount
onMounted(() => {
  loadTeachers();
});
</script>

<style scoped>
.teacher-management {
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

.add-button,
.import-button,
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
}

.add-button {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
}

.import-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.import-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
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

.teachers-table-container {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.table-header h2 {
  color: #1f2937;
  font-size: 1.5rem;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
}

.table-wrapper {
  overflow-x: auto;
}

.teachers-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.teachers-table th,
.teachers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.teachers-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.teacher-row:hover {
  background: #f9fafb;
}

.name-cell {
  min-width: 200px;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  font-weight: bold;
}

.teacher-avatar.admin {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.teacher-avatar.teacher {
  background: linear-gradient(135deg, #059669, #047857);
}

.teacher-details strong {
  display: block;
  color: #1f2937;
  font-size: 0.95rem;
}

.teacher-details small {
  color: #6b7280;
  font-size: 0.8rem;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge.admin {
  background: #fef2f2;
  color: #dc2626;
}

.role-badge.teacher {
  background: #f0fdf4;
  color: #166534;
}

.subjects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.subject-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.more-subjects {
  color: #6b7280;
  font-size: 0.7rem;
  font-style: italic;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #dc2626;
}

.action-buttons-cell {
  display: flex;
  gap: 8px;
}

.edit-btn,
.view-btn,
.role-btn,
.delete-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  background: #f0f4ff;
  color: #3730a3;
}

.edit-btn:hover {
  background: #e0e7ff;
}

.view-btn {
  background: #f0fdf4;
  color: #166534;
}

.view-btn:hover {
  background: #dcfce7;
}

.role-btn {
  background: #fef3c7;
  color: #92400e;
}

.role-btn:hover {
  background: #fde68a;
}

.delete-btn {
  background: #fef2f2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fee2e2;
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
  max-width: 700px;
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

.teacher-form {
  padding: 0 30px 30px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  color: #374151;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-help {
  color: #6b7280;
  font-size: 0.8rem;
  font-style: italic;
  margin-top: 4px;
}

.subjects-selection,
.grades-selection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal !important;
  font-size: 0.9rem;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background: #f3f4f6;
}

.grade-checkbox {
  min-width: 80px;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border: none;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
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
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
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

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #059669;
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
  .teacher-management {
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
  
  .table-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .table-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .subjects-selection,
  .grades-selection {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
