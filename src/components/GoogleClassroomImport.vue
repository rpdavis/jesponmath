<template>
  <div class="classroom-import">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>📚 Import from Google Classroom</h3>
          <button @click="$emit('close')" class="close-btn">×</button>
        </div>
        
        <!-- Authentication Step -->
        <div v-if="!isAuthenticated" class="auth-section">
          <div class="auth-info">
            <div class="auth-icon">🔐</div>
            <h4>Connect to Google Classroom</h4>
            <p>Sign in with your Google account to access your Classroom courses and import students.</p>
            <ul class="permissions-list">
              <li>✓ View your courses</li>
              <li>✓ View student rosters</li>
              <li>✓ Access student profile information</li>
            </ul>
          </div>
          <div class="auth-actions">
            <button @click="authenticateWithGoogle" class="auth-button" :disabled="authenticating">
              <span class="button-icon">🔑</span>
              {{ authenticating ? 'Connecting...' : 'Sign in with Google' }}
            </button>
          </div>
        </div>

        <!-- Course Selection Step -->
        <div v-else-if="!selectedCourses.length && courses.length > 0" class="course-selection">
          <div class="section-header">
            <h4>Select Courses</h4>
            <p>Choose which courses to import students from:</p>
          </div>
          
          <div class="courses-list">
            <div 
              v-for="course in courses" 
              :key="course.id"
              class="course-item"
              :class="{ 'selected': tempSelectedCourses.includes(course.id) }"
              @click="toggleCourseSelection(course.id)"
            >
              <div class="course-info">
                <h5>{{ course.name }}</h5>
                <p v-if="course.section">Section: {{ course.section }}</p>
                <p v-if="course.room">Room: {{ course.room }}</p>
                <small>{{ course.enrollmentCode ? 'Code: ' + course.enrollmentCode : 'No enrollment code' }}</small>
              </div>
              <div class="course-checkbox">
                <input 
                  type="checkbox" 
                  :checked="tempSelectedCourses.includes(course.id)"
                  @click.stop
                  @change="toggleCourseSelection(course.id)"
                >
              </div>
            </div>
          </div>

          <div class="course-actions">
            <button @click="$emit('close')" class="cancel-btn">Cancel</button>
            <button 
              @click="proceedWithSelectedCourses" 
              class="continue-btn"
              :disabled="tempSelectedCourses.length === 0"
            >
              Continue with {{ tempSelectedCourses.length }} course{{ tempSelectedCourses.length !== 1 ? 's' : '' }}
            </button>
          </div>
        </div>

        <!-- Grade Assignment Step -->
        <div v-else-if="selectedCourses.length > 0 && !studentsImported" class="grade-assignment">
          <div class="section-header">
            <h4>Assign Grade Levels</h4>
            <p>Assign a grade level to each course:</p>
          </div>

          <div class="grade-assignments">
            <div v-for="courseId in selectedCourses" :key="courseId" class="grade-assignment-item">
              <div class="course-name">
                <strong>{{ getCourse(courseId)?.name }}</strong>
                <small v-if="getCourse(courseId)?.section">{{ getCourse(courseId)?.section }}</small>
              </div>
              <select v-model="gradeMapping[courseId]" class="grade-select">
                <option value="">Select Grade</option>
                <option v-for="grade in grades" :key="grade" :value="grade">Grade {{ grade }}</option>
              </select>
            </div>
          </div>

          <div class="import-actions">
            <button @click="goBackToCourses" class="back-btn">← Back to Courses</button>
            <button @click="importStudents" class="import-btn" :disabled="importing || !allGradesAssigned">
              <span class="button-icon">📥</span>
              {{ importing ? 'Importing...' : 'Import Students' }}
            </button>
          </div>
        </div>

        <!-- Import Results -->
        <div v-else-if="studentsImported" class="import-results">
          <div class="results-header">
            <div class="success-icon">✅</div>
            <h4>Import Complete!</h4>
            <p>Successfully imported {{ importedStudents.length }} students</p>
          </div>

          <div class="results-summary">
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-number">{{ importedStudents.length }}</span>
                <span class="stat-label">Students Imported</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ selectedCourses.length }}</span>
                <span class="stat-label">Courses</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ uniqueGrades.length }}</span>
                <span class="stat-label">Grade Levels</span>
              </div>
            </div>

            <div class="students-preview">
              <h5>Imported Students:</h5>
              <div class="students-list">
                <div v-for="student in importedStudents.slice(0, 5)" :key="student.seisId" class="student-preview">
                  <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
                  <span class="student-grade">Grade {{ student.grade }}</span>
                  <span class="student-course">{{ student.classroomInfo?.courseName }}</span>
                </div>
                <div v-if="importedStudents.length > 5" class="more-students">
                  + {{ importedStudents.length - 5 }} more students
                </div>
              </div>
            </div>
          </div>

          <div class="results-actions">
            <button @click="$emit('close')" class="close-btn-final">Done</button>
            <button @click="importMore" class="import-more-btn">Import More</button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-section">
          <div class="loading-spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-section">
          <div class="error-icon">⚠️</div>
          <h4>Import Error</h4>
          <p>{{ error }}</p>
          <button @click="resetImport" class="retry-btn">Try Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  googleClassroomService, 
  saveGoogleClassroomToken, 
  getGoogleClassroomToken,
  clearGoogleClassroomToken,
  type ClassroomCourse 
} from '@/services/googleClassroom';

// Emits
const emit = defineEmits<{
  close: [];
  studentsImported: [students: any[]];
}>();

// Reactive state
const isAuthenticated = ref(false);
const authenticating = ref(false);
const loading = ref(false);
const loadingMessage = ref('');
const error = ref('');

const courses = ref<ClassroomCourse[]>([]);
const tempSelectedCourses = ref<string[]>([]);
const selectedCourses = ref<string[]>([]);
const gradeMapping = ref<Record<string, string>>({});
const importing = ref(false);
const studentsImported = ref(false);
const importedStudents = ref<any[]>([]);

const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Computed properties
const allGradesAssigned = computed(() => {
  return selectedCourses.value.every(courseId => gradeMapping.value[courseId]);
});

const uniqueGrades = computed(() => {
  return [...new Set(Object.values(gradeMapping.value))];
});

// Methods
const checkAuthentication = () => {
  const token = getGoogleClassroomToken();
  if (token) {
    isAuthenticated.value = true;
    googleClassroomService.setAccessToken(token);
    loadCourses();
  }
};

const authenticateWithGoogle = async () => {
  try {
    authenticating.value = true;
    error.value = '';
    
    const token = await googleClassroomService.authenticate();
    saveGoogleClassroomToken(token);
    isAuthenticated.value = true;
    
    await loadCourses();
  } catch (err: any) {
    console.error('Authentication error:', err);
    error.value = 'Failed to authenticate with Google. Please try again.';
  } finally {
    authenticating.value = false;
  }
};

const loadCourses = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Loading your courses...';
    error.value = '';
    
    const coursesData = await googleClassroomService.getCourses();
    courses.value = coursesData.filter(course => course.courseState === 'ACTIVE');
    
    if (courses.value.length === 0) {
      error.value = 'No active courses found. Make sure you have access to Google Classroom courses.';
    }
  } catch (err: any) {
    console.error('Error loading courses:', err);
    error.value = 'Failed to load courses. Please check your permissions and try again.';
    
    // Clear authentication if unauthorized
    if (err.message.includes('401') || err.message.includes('403')) {
      clearGoogleClassroomToken();
      isAuthenticated.value = false;
    }
  } finally {
    loading.value = false;
    loadingMessage.value = '';
  }
};

const toggleCourseSelection = (courseId: string) => {
  const index = tempSelectedCourses.value.indexOf(courseId);
  if (index > -1) {
    tempSelectedCourses.value.splice(index, 1);
  } else {
    tempSelectedCourses.value.push(courseId);
  }
};

const proceedWithSelectedCourses = () => {
  selectedCourses.value = [...tempSelectedCourses.value];
  
  // Initialize grade mapping
  selectedCourses.value.forEach(courseId => {
    if (!gradeMapping.value[courseId]) {
      gradeMapping.value[courseId] = '';
    }
  });
};

const goBackToCourses = () => {
  selectedCourses.value = [];
  gradeMapping.value = {};
};

const getCourse = (courseId: string) => {
  return courses.value.find(course => course.id === courseId);
};

const importStudents = async () => {
  try {
    importing.value = true;
    error.value = '';
    loadingMessage.value = 'Importing students from Google Classroom...';
    loading.value = true;
    
    const students = await googleClassroomService.importStudentsFromCourses(
      selectedCourses.value,
      gradeMapping.value
    );
    
    // Debug imported student data structure
    console.log('🔍 Google Classroom import data:');
    students.forEach((student, index) => {
      if (index < 3) { // Log first 3 students for debugging
        console.log(`👤 Student ${index + 1}:`, {
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          className: student.className,
          period: student.period,
          courseId: student.courseId,
          classroomInfo: student.classroomInfo
        });
      }
    });
    
    importedStudents.value = students;
    studentsImported.value = true;
    
    // Emit the imported students to parent component
    emit('studentsImported', students);
    
  } catch (err: any) {
    console.error('Error importing students:', err);
    error.value = 'Failed to import students. Please try again.';
  } finally {
    importing.value = false;
    loading.value = false;
    loadingMessage.value = '';
  }
};

const importMore = () => {
  // Reset to course selection
  selectedCourses.value = [];
  tempSelectedCourses.value = [];
  gradeMapping.value = {};
  studentsImported.value = false;
  importedStudents.value = [];
};

const resetImport = () => {
  error.value = '';
  loading.value = false;
  loadingMessage.value = '';
  
  // Clear authentication and start over
  clearGoogleClassroomToken();
  isAuthenticated.value = false;
  courses.value = [];
  selectedCourses.value = [];
  tempSelectedCourses.value = [];
  gradeMapping.value = {};
  studentsImported.value = false;
  importedStudents.value = [];
};

// Initialize on mount
onMounted(() => {
  checkAuthentication();
});
</script>

<style scoped>
.classroom-import {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.modal-overlay {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 25px 30px;
  border-bottom: 1px solid #e5e7eb;
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

/* Authentication Section */
.auth-section {
  padding: 40px 30px;
  text-align: center;
}

.auth-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.auth-info h4 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.auth-info p {
  color: #6b7280;
  margin-bottom: 25px;
  line-height: 1.6;
}

.permissions-list {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
  text-align: left;
  display: inline-block;
}

.permissions-list li {
  color: #059669;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.auth-button {
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 133, 244, 0.3);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Course Selection */
.course-selection,
.grade-assignment {
  padding: 30px;
}

.section-header {
  margin-bottom: 25px;
  text-align: center;
}

.section-header h4 {
  color: #1f2937;
  font-size: 1.3rem;
  margin-bottom: 10px;
}

.section-header p {
  color: #6b7280;
  line-height: 1.6;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
  max-height: 400px;
  overflow-y: auto;
}

.course-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.course-item:hover {
  border-color: #667eea;
  background: #f8faff;
}

.course-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.course-info h5 {
  color: #1f2937;
  font-size: 1.1rem;
  margin: 0 0 5px 0;
}

.course-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 3px 0;
}

.course-info small {
  color: #9ca3af;
  font-size: 0.8rem;
}

.course-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.course-actions,
.import-actions,
.results-actions {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.back-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover,
.back-btn:hover {
  background: #e5e7eb;
}

.continue-btn,
.import-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.continue-btn:hover:not(:disabled),
.import-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.continue-btn:disabled,
.import-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Grade Assignment */
.grade-assignments {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.grade-assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9fafb;
  border-radius: 10px;
}

.course-name strong {
  color: #1f2937;
  font-size: 1rem;
}

.course-name small {
  color: #6b7280;
  font-size: 0.8rem;
  display: block;
  margin-top: 2px;
}

.grade-select {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 120px;
}

.grade-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Import Results */
.import-results {
  padding: 30px;
  text-align: center;
}

.results-header {
  margin-bottom: 30px;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 15px;
}

.results-header h4 {
  color: #059669;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.results-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.results-summary {
  margin-bottom: 30px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f0fdf4;
  border-radius: 10px;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #059669;
  margin-bottom: 5px;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.students-preview {
  text-align: left;
  background: #f9fafb;
  border-radius: 10px;
  padding: 20px;
}

.students-preview h5 {
  color: #1f2937;
  margin-bottom: 15px;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.student-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.student-preview:last-child {
  border-bottom: none;
}

.student-name {
  font-weight: 600;
  color: #1f2937;
}

.student-grade {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.student-course {
  color: #6b7280;
  font-size: 0.8rem;
}

.more-students {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 10px 0;
}

.close-btn-final {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn-final:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.import-more-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-more-btn:hover {
  background: #e5e7eb;
}

/* Loading and Error States */
.loading-section,
.error-section {
  padding: 40px 30px;
  text-align: center;
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

.loading-section p,
.error-section p {
  color: #6b7280;
  font-size: 1.1rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 15px;
}

.error-section h4 {
  color: #dc2626;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
}

.retry-btn:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .modal {
    margin: 10px;
    max-width: none;
  }
  
  .modal-header,
  .auth-section,
  .course-selection,
  .grade-assignment,
  .import-results {
    padding: 20px;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .course-actions,
  .import-actions,
  .results-actions {
    flex-direction: column;
  }
  
  .grade-assignment-item {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>
