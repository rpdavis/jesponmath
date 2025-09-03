<template>
  <div class="student-management">
    <div class="header">
      <h1>{{ permissions.isAdmin ? '👥 Student Management' : '🎓 My Students' }}</h1>
      <p>{{ permissions.isAdmin ? 'Add, edit, and manage students for IEP assessments' : 'View and manage your assigned students' }}</p>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-buttons">
        <!-- Admin-only actions -->
        <button 
          v-if="permissions.isAdmin" 
          @click="showAddStudentModal = true" 
          class="add-button"
        >
          <span class="button-icon">➕</span>
          Add Student Manually
        </button>
        <button 
          v-if="permissions.canImportClassroom" 
          @click="showClassroomImport = true" 
          class="import-button"
        >
          <span class="button-icon">📚</span>
          Import from Google Classroom
        </button>
        <!-- Available to both admin and teacher -->
        <button @click="exportStudents" class="export-button">
          <span class="button-icon">📤</span>
          Export Student List
        </button>
      </div>
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search students..." 
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- Student Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-content">
          <div class="stat-number">{{ filteredStudents.length }}</div>
          <div class="stat-label">Total Students</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-number">{{ studentsWithAssessments }}</div>
          <div class="stat-label">With Assessments</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <div class="stat-number">{{ studentsWithGoals }}</div>
          <div class="stat-label">With IEP Goals</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">{{ activeStudents }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
    </div>

    <!-- Students Table -->
    <div class="students-table-container">
      <div class="table-header">
        <h2>Student List ({{ filteredStudents.length }})</h2>
        <div class="table-actions">
          <select v-model="sortBy" class="sort-select">
            <option value="lastName">Sort by Last Name</option>
            <option value="firstName">Sort by First Name</option>
            <option value="grade">Sort by Grade</option>
            <option value="seisId">Sort by SEIS ID</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade</th>
              <th>Course Name</th>
              <th>Section</th>
              <th>Google ID</th>
              <th>School</th>
              <th>Case Manager</th>
              <th>IEP Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in paginatedStudents" :key="student.uid" class="student-row">
              <td class="name-cell">
                <div class="student-name">
                  <strong>{{ student.lastName }}, {{ student.firstName }}</strong>
                  <small>{{ student.email }}</small>
                </div>
              </td>
              <td>
                <span class="grade-badge">{{ student.grade }}</span>
              </td>
              <td>{{ student.courseName || student.className || '-' }}</td>
              <td>{{ student.section || student.period || '-' }}</td>
              <td>{{ student.googleId || '-' }}</td>
              <td>{{ student.schoolOfAttendance || '-' }}</td>
              <td>{{ student.caseManager || '-' }}</td>
              <td>{{ formatDate(student.iepDate || '') }}</td>
              <td>
                <span class="status-badge" :class="student.isActive ? 'active' : 'inactive'">
                  {{ student.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="action-buttons-cell">
                  <!-- Admin can edit all students -->
                  <button 
                    v-if="permissions.isAdmin" 
                    @click="editStudent(student)" 
                    class="edit-btn" 
                    title="Edit Student"
                  >
                    ✏️
                  </button>
                  <!-- All roles can view assessments -->
                  <button @click="viewAssessments(student)" class="view-btn" title="View Assessments">
                    📝
                  </button>
                  <!-- Only admin can delete students -->
                  <button 
                    v-if="permissions.isAdmin" 
                    @click="deleteStudent(student)" 
                    class="delete-btn" 
                    title="Delete Student"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="filteredStudents.length === 0" class="empty-state">
          <div class="empty-icon">{{ permissions.isAdmin ? '👥' : '🎓' }}</div>
          <h3>{{ permissions.isAdmin ? 'No Students Found' : 'No Students Assigned' }}</h3>
          <p v-if="searchQuery">No students match your search criteria.</p>
          <p v-else-if="permissions.isAdmin">Add students manually or import from Google Classroom to get started.</p>
          <p v-else>No students have been assigned to you yet. Contact your administrator.</p>
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
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredStudents.length }} total)
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

    <!-- Add/Edit Student Modal -->
    <div v-if="showAddStudentModal || editingStudent" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingStudent ? 'Edit Student' : 'Add New Student' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <form @submit.prevent="saveStudent" class="student-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input 
                id="firstName"
                v-model="studentForm.firstName" 
                type="text" 
                required 
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input 
                id="lastName"
                v-model="studentForm.lastName" 
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
              v-model="studentForm.email" 
              type="email" 
              required 
              class="form-input"
              placeholder="student@school.edu"
              :disabled="!!editingStudent"
            >
            <small class="form-help">Students use this email to log into the assessment system</small>
          </div>

          <div class="form-row">

            <div class="form-group">
              <label for="seisId">SEIS ID</label>
              <input 
                id="seisId"
                v-model="studentForm.seisId" 
                type="text" 
                class="form-input"
                placeholder="Optional SEIS identifier"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="aeriesId">Aeries ID</label>
              <input 
                id="aeriesId"
                v-model="studentForm.aeriesId" 
                type="text" 
                class="form-input"
                placeholder="Optional Aeries identifier"
              >
            </div>
            <div class="form-group">
              <label for="districtId">District ID</label>
              <input 
                id="districtId"
                v-model="studentForm.districtId" 
                type="text" 
                class="form-input"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="grade">Grade *</label>
              <select id="grade" v-model="studentForm.grade" required class="form-select">
                <option value="">Select Grade</option>
                <option v-for="grade in grades" :key="grade" :value="grade">{{ grade }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="birthdate">Birthdate</label>
              <input 
                id="birthdate"
                v-model="studentForm.birthdate" 
                type="date" 
                class="form-input"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="schoolOfAttendance">School of Attendance</label>
            <input 
              id="schoolOfAttendance"
              v-model="studentForm.schoolOfAttendance" 
              type="text" 
              class="form-input"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="className">Class Name</label>
              <input 
                id="className"
                v-model="studentForm.className" 
                type="text" 
                placeholder="e.g., Algebra 1, Pre-Algebra"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="period">Period</label>
              <input 
                id="period"
                v-model="studentForm.period" 
                type="text" 
                placeholder="e.g., 1, 2, A, B"
                class="form-input"
              >
            </div>
          </div>

          <!-- Google Classroom Information -->
          <div class="form-section-header">
            <h4>Google Classroom Information (Optional)</h4>
            <p>Fill these if student was imported from Google Classroom</p>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="googleId">Google ID</label>
              <input 
                id="googleId"
                v-model="studentForm.googleId" 
                type="text" 
                placeholder="Google user ID"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="courseId">Course ID</label>
              <input 
                id="courseId"
                v-model="studentForm.courseId" 
                type="text" 
                placeholder="Google Classroom course ID"
                class="form-input"
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="courseName">Course Name</label>
              <input 
                id="courseName"
                v-model="studentForm.courseName" 
                type="text" 
                placeholder="Google Classroom course name"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="section">Section</label>
              <input 
                id="section"
                v-model="studentForm.section" 
                type="text" 
                placeholder="Google Classroom section"
                class="form-input"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="caseManager">Case Manager</label>
              <input 
                id="caseManager"
                v-model="studentForm.caseManager" 
                type="text" 
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label for="iepDate">IEP Date</label>
              <input 
                id="iepDate"
                v-model="studentForm.iepDate" 
                type="date" 
                class="form-input"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="eligibilityStatus">Eligibility Status</label>
              <select id="eligibilityStatus" v-model="studentForm.eligibilityStatus" class="form-select">
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div class="form-group">
              <label>Special Education Plans</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="studentForm.hasIEP">
                  Has IEP (Individualized Education Program)
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="studentForm.has504">
                  Has 504 Plan
                </label>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? 'Saving...' : (editingStudent ? 'Update Student' : 'Add Student') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Google Classroom Import Modal -->
    <GoogleClassroomImport 
      v-if="showClassroomImport"
      @close="showClassroomImport = false"
      @studentsImported="handleStudentsImported"
    />

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading students...</p>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-if="success" class="success-message">
      {{ success }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import { getAllStudents, getStudentsByTeacher, createStudent, updateStudent, deleteStudent as deleteStudentService, getStudentBySSID } from '@/firebase/userServices';
import GoogleClassroomImport from './GoogleClassroomImport.vue';
import type { Student as FirebaseStudent, CreateStudentData } from '@/types/users';
import type { Student } from '@/types/iep';

const router = useRouter();
const authStore = useAuthStore();
const permissions = usePermissions();

// Reactive state
const students = ref<FirebaseStudent[]>([]);
const searchQuery = ref('');
const sortBy = ref('lastName');
const currentPage = ref(1);
const pageSize = 20;
const loading = ref(true);
const error = ref('');
const success = ref('');
const saving = ref(false);
const importing = ref(false);

// Modal state
const showAddStudentModal = ref(false);
const showClassroomImport = ref(false);
const editingStudent = ref<FirebaseStudent | null>(null);

// Form data
const studentForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  seisId: '', // SEIS ID - Optional
  aeriesId: '', // Aeries ID - Optional
  districtId: '',
  grade: '',
  birthdate: '',
  schoolOfAttendance: '',
  caseManager: '',
  iepDate: '',
  eligibilityStatus: 'Active',
  hasIEP: false,
  has504: false,
  
  // Class and period information for gradebook
  className: '',
  period: '',
  courseId: '',
  
  // Google Classroom specific fields
  googleId: '',
  courseName: '',
  section: ''
});

const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Computed properties
const filteredStudents = computed(() => {
  let filtered = students.value;
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(student => 
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.googleId?.toLowerCase().includes(query) ||
      student.seisId?.toLowerCase().includes(query) ||
      student.aeriesId?.toLowerCase().includes(query) ||
      student.schoolOfAttendance?.toLowerCase().includes(query)
    );
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    const aValue = (a as any)[sortBy.value] || '';
    const bValue = (b as any)[sortBy.value] || '';
    return aValue.toString().localeCompare(bValue.toString());
  });
  
  return filtered;
});

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / pageSize));

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredStudents.value.slice(start, end);
});

const studentsWithAssessments = computed(() => {
  // This would be calculated based on actual assessment data
  return Math.floor(students.value.length * 0.7);
});

const studentsWithGoals = computed(() => {
  return students.value.filter(s => s.currentGoals && s.currentGoals.length > 0).length;
});

const activeStudents = computed(() => {
  return students.value.filter(s => s.isActive).length;
});

// Methods
const loadStudents = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const userRole = authStore.currentUser?.role;
    console.log('Loading students for role:', userRole);
    
    if (userRole === 'admin') {
      // Admins can see all students
      console.log('Loading all students for admin...');
      students.value = await getAllStudents();
    } else if (userRole === 'teacher' && authStore.currentUser?.uid) {
      // Teachers can only see their assigned students
      console.log('Loading assigned students for teacher:', authStore.currentUser.uid);
      students.value = await getStudentsByTeacher(authStore.currentUser.uid);
    } else {
      // Other roles see no students
      console.log('No students loaded for role:', userRole);
      students.value = [];
    }
    
    console.log(`Loaded ${students.value.length} students for ${authStore.currentUser?.role}`);
    
  } catch (err: any) {
    console.error('Error loading students:', err);
    error.value = err.message || 'Failed to load students. Please try again.';
  } finally {
    loading.value = false;
  }
};

const saveStudent = async () => {
  try {
    saving.value = true;
    error.value = '';
    
    if (editingStudent.value) {
      // Update existing student
      await updateStudent(editingStudent.value.uid, {
        firstName: studentForm.value.firstName,
        lastName: studentForm.value.lastName,
        email: studentForm.value.email,

        seisId: studentForm.value.seisId,
        aeriesId: studentForm.value.aeriesId,
        grade: studentForm.value.grade,
        schoolOfAttendance: studentForm.value.schoolOfAttendance,
        caseManager: studentForm.value.caseManager,
        hasIEP: studentForm.value.hasIEP,
        has504: studentForm.value.has504,
        isActive: studentForm.value.eligibilityStatus === 'Active'
      });
      success.value = 'Student updated successfully!';
    } else {
      // Create new student
      const studentData: CreateStudentData = {
        email: studentForm.value.email,
        firstName: studentForm.value.firstName,
        lastName: studentForm.value.lastName,

        seisId: studentForm.value.seisId,
        aeriesId: studentForm.value.aeriesId,
        grade: studentForm.value.grade,
        schoolOfAttendance: studentForm.value.schoolOfAttendance,
        caseManager: studentForm.value.caseManager,
        hasIEP: studentForm.value.hasIEP,
        has504: studentForm.value.has504
      };
      
      await createStudent(studentData);
      success.value = 'Student added successfully!';
    }
    
    // Reload students to get updated data
    await loadStudents();
    closeModal();
    setTimeout(() => { success.value = ''; }, 3000);
    
  } catch (err: any) {
    console.error('Error saving student:', err);
    error.value = err.message || 'Failed to save student. Please try again.';
  } finally {
    saving.value = false;
  }
};

const editStudent = (student: FirebaseStudent) => {
  editingStudent.value = student;
  studentForm.value = {
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    seisId: student.seisId || '',
    aeriesId: student.aeriesId || '',
    districtId: student.districtId || '',
    grade: student.grade,
    birthdate: student.birthdate || '',
    schoolOfAttendance: student.schoolOfAttendance || '',
    caseManager: student.caseManager || '',
    iepDate: student.iepDate || '',
    eligibilityStatus: student.isActive ? 'Active' : 'Inactive',
    hasIEP: student.hasIEP,
    has504: student.has504,
    
    // Class and period information
    className: student.className || '',
    period: student.period || '',
    courseId: student.courseId || '',
    
    // Google Classroom specific fields
    googleId: student.googleId || '',
    courseName: student.courseName || '',
    section: student.section || ''
  };
};

const deleteStudent = async (student: FirebaseStudent) => {
  if (confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}? This action cannot be undone.`)) {
    try {
      await deleteStudentService(student.uid);
      
      // Reload students to get updated data
      await loadStudents();
      success.value = 'Student deleted successfully!';
      setTimeout(() => { success.value = ''; }, 3000);
    } catch (err: any) {
      console.error('Error deleting student:', err);
      error.value = err.message || 'Failed to delete student. Please try again.';
    }
  }
};

const viewAssessments = (student: FirebaseStudent) => {
  router.push(`/assessments?student=${student.uid}`);
};

const handleStudentsImported = async (importedStudents: any[]) => {
  try {
    saving.value = true;
    error.value = '';
    
    console.log('💾 Saving imported students to Firestore...', importedStudents.length);
    
    let savedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    for (const importedStudent of importedStudents) {
      try {
        // Convert imported student data to CreateStudentData format
        const studentData: CreateStudentData = {
          email: importedStudent.classroomInfo?.email || importedStudent.email,
          firstName: importedStudent.firstName,
          lastName: importedStudent.lastName,
          seisId: importedStudent.seisId,
          aeriesId: importedStudent.aeriesId,
          districtId: importedStudent.districtId,
          grade: importedStudent.grade,
          schoolOfAttendance: importedStudent.schoolOfAttendance || importedStudent.classroomInfo?.courseName,
          hasIEP: false, // Default - can be updated later
          has504: false, // Default - can be updated later
          assignedTeacher: authStore.currentUser?.uid, // Assign to current teacher
          
          // Class and period information from Google Classroom
          className: importedStudent.className || importedStudent.classroomInfo?.courseName,
          period: importedStudent.period || importedStudent.classroomInfo?.section || '',
          courseId: importedStudent.courseId || importedStudent.classroomInfo?.courseId,
          
          // Google Classroom specific fields
          googleId: importedStudent.googleId || importedStudent.classroomInfo?.googleId,
          courseName: importedStudent.courseName || importedStudent.classroomInfo?.courseName,
          section: importedStudent.section || importedStudent.classroomInfo?.section || ''
        };
        
        console.log('📝 Converting imported student:', {
          name: `${studentData.firstName} ${studentData.lastName}`,
          email: studentData.email,
          assignedTeacher: studentData.assignedTeacher,
          className: studentData.className,
          period: studentData.period,
          courseId: studentData.courseId,
          googleId: studentData.googleId,
          courseName: studentData.courseName,
          section: studentData.section
        });
        
        console.log('🔍 Full studentData object being passed to createStudent:', studentData);
        
        // Validate required fields (only email required)
        if (!studentData.email) {
          errors.push(`${importedStudent.firstName || 'Unknown'} ${importedStudent.lastName || 'Student'}: Missing email address`);
          skippedCount++;
          continue;
        }
        
        // Check if student already exists by email
        // Note: Duplicate checking now relies on email uniqueness in createStudent function
        
        // Create the student in Firestore
        await createStudent(studentData);
        savedCount++;
        
        console.log(`✅ Saved student: ${studentData.firstName} ${studentData.lastName}`);
        
      } catch (studentError: any) {
        console.error(`❌ Error saving student ${importedStudent.firstName} ${importedStudent.lastName}:`, studentError);
        errors.push(`${importedStudent.firstName} ${importedStudent.lastName}: ${studentError.message}`);
        skippedCount++;
      }
    }
    
    // Reload students to show the newly imported ones
    await loadStudents();
    
    showClassroomImport.value = false;
    
    // Show detailed success message
    let message = `Google Classroom import completed! `;
    if (savedCount > 0) {
      message += `${savedCount} students saved successfully. `;
    }
    if (skippedCount > 0) {
      message += `${skippedCount} students skipped (duplicates or errors). `;
    }
    if (errors.length > 0) {
      message += `Errors: ${errors.slice(0, 3).join(', ')}`;
      if (errors.length > 3) {
        message += ` and ${errors.length - 3} more...`;
      }
    }
    
    if (savedCount > 0) {
      success.value = message;
    } else {
      error.value = message;
    }
    
    setTimeout(() => { 
      success.value = ''; 
      error.value = '';
    }, 8000);
    
  } catch (err: any) {
    console.error('❌ Error in import process:', err);
    error.value = `Import failed: ${err.message}`;
    showClassroomImport.value = false;
  } finally {
    saving.value = false;
  }
};

const exportStudents = () => {
  try {
    const csvContent = [
      ['First Name', 'Last Name', 'SEIS ID', 'District ID', 'Grade', 'School', 'Case Manager', 'IEP Date', 'Status'].join(','),
      ...students.value.map(student => [
        student.firstName,
        student.lastName,
        student.seisId,
        student.districtId,
        student.grade,
        student.schoolOfAttendance,
        student.caseManager,
        student.iepDate,
        student.eligibilityStatus
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students_export.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    success.value = 'Student list exported successfully!';
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err) {
    error.value = 'Failed to export student list.';
  }
};

const closeModal = () => {
  showAddStudentModal.value = false;
  editingStudent.value = null;
  studentForm.value = {
      firstName: '',
  lastName: '',
  email: '',
  seisId: '',
    aeriesId: '',
    districtId: '',
    grade: '',
    birthdate: '',
    schoolOfAttendance: '',
    caseManager: '',
    iepDate: '',
    eligibilityStatus: 'Active',
    hasIEP: false,
    has504: false,
    
    // Class and period information for gradebook
    className: '',
    period: '',
    courseId: '',
    
    // Google Classroom specific fields
    googleId: '',
    courseName: '',
    section: ''
  };
};

// Removed old status functions - now using isActive directly

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.warn('Unable to format date:', dateString);
    return 'Invalid Date';
  }
};

// Load students on component mount
onMounted(() => {
  loadStudents();
});
</script>

<style scoped>
.student-management {
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.import-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.import-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.import-button:disabled {
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

.students-table-container {
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
}

.table-header h2 {
  color: #1f2937;
  font-size: 1.5rem;
}

.sort-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
}

.table-wrapper {
  overflow-x: auto;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.students-table th,
.students-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.students-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.student-row:hover {
  background: #f9fafb;
}

.name-cell {
  min-width: 200px;
}

.student-name strong {
  display: block;
  color: #1f2937;
  font-size: 0.95rem;
}

.student-name small {
  color: #6b7280;
  font-size: 0.8rem;
}

.grade-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
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

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.action-buttons-cell {
  display: flex;
  gap: 8px;
}

.edit-btn,
.view-btn,
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

.delete-btn {
  background: #fef2f2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fee2e2;
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

/* Modal Styles */
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

.student-form {
  padding: 0 30px 30px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-section-header {
  margin: 25px 0 15px 0;
  padding: 15px 0 10px 0;
  border-top: 2px solid #e5e7eb;
}

.form-section-header h4 {
  color: #1f2937;
  font-size: 1.1rem;
  margin: 0 0 5px 0;
}

.form-section-header p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal !important;
  font-size: 0.9rem;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.form-help {
  color: #6b7280;
  font-size: 0.8rem;
  font-style: italic;
  margin-top: 4px;
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.save-btn:disabled {
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
  .student-management {
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
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
