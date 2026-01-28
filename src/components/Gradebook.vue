<template>
  <div class="gradebook">
    <div class="gradebook-header">
      <div class="header-content">
        <h1>📊 Gradebook</h1>
        <p>Track student progress across all assessment categories</p>
        <p class="info-note">💡 Note: Progress Assessments (PA) and Diagnostic assessments are managed separately and not shown in this gradebook. Use <router-link to="/progress-assessment-gradebook">Progress Assessment Gradebook</router-link> for PA assessments.</p>
      </div>
      <div class="header-actions">
        <button @click="openBulkPrintDialog" class="bulk-print-button" title="Print Bulk Student Summaries">
          🖨️ Print Bulk Summaries
        </button>
      </div>
    </div>

    <!-- Academic Period Selector -->
    <AcademicPeriodSelector
      :allowFuturePeriods="true"
      @periodChanged="onPeriodChanged"
      @periodTypeChanged="onPeriodTypeChanged"
    />

    <!-- View Mode and Filters -->
    <div class="filters-section">
      <!-- View Mode Radio Buttons -->
      <div class="view-mode-group">
        <label class="view-mode-label">View Mode:</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" v-model="viewMode" value="assignments" name="viewMode">
            <span class="radio-label">📝 Show by Assignments</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="viewMode" value="standards" name="viewMode">
            <span class="radio-label">📊 Show by Standards</span>
          </label>
        </div>

        <!-- Assessment Category Filter (only show in standards view) -->
        <div v-if="viewMode === 'standards'" class="assessment-category-filters">
          <label class="filter-label">Assessment Type:</label>
          <div class="category-buttons">
            <button
              @click="selectedAssessmentCategory = ''"
              class="category-filter-btn assessment-cat-btn"
              :class="{ active: selectedAssessmentCategory === '' }"
            >
              All Types
            </button>
            <button
              v-for="category in uniqueAssessmentCategories"
              :key="category"
              @click="selectedAssessmentCategory = category"
              class="category-filter-btn assessment-cat-btn"
              :class="{
                active: selectedAssessmentCategory === category,
                [`cat-${category.toLowerCase()}`]: true
              }"
            >
              {{ category === 'ESA' ? 'Essential Standards (ESA)' :
                 category === 'SA' ? 'Standard Assessments (SA)' :
                 category === 'HW' ? 'Homework (HW)' :
                 category === 'Assign' ? 'Assignments' :
                 category }}
            </button>
          </div>
        </div>

        <!-- App Category Filter Buttons (only show in standards view) -->
        <div v-if="viewMode === 'standards' && uniqueAppCategories.length > 0" class="app-category-filters">
          <label class="filter-label">App Categories:</label>
          <div class="category-buttons">
            <button
              @click="selectedAppCategory = ''"
              class="category-filter-btn"
              :class="{ active: selectedAppCategory === '' }"
            >
              All
            </button>
            <button
              v-for="category in uniqueAppCategories"
              :key="category"
              @click="selectedAppCategory = category"
              class="category-filter-btn"
              :class="{ active: selectedAppCategory === category }"
            >
              {{ category }}
            </button>
          </div>
        </div>
      </div>

      <div class="filter-group">
        <label for="classFilter">Class:</label>
        <select id="classFilter" v-model="selectedClass" class="filter-select">
          <option value="">All Classes</option>
          <option v-for="className in uniqueClasses" :key="className" :value="className">
            {{ className }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="periodFilter">Period:</label>
        <select id="periodFilter" v-model="selectedPeriod" class="filter-select">
          <option value="">All Periods</option>
          <option v-for="period in uniquePeriods" :key="period" :value="period">
            Period {{ period }}
          </option>
        </select>
      </div>

      <div v-if="viewMode === 'assignments'" class="filter-group">
        <label for="categoryFilter">Category:</label>
        <select id="categoryFilter" v-model="selectedCategory" class="filter-select">
          <option value="">All Categories</option>
          <option value="HW">Home Work (HW)</option>
          <option value="Assign">Assignment (Assign)</option>
          <option value="ESA">Essential Standard (ESA)</option>
          <option value="SA">Standard Assessment (SA)</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div v-if="viewMode === 'assignments'" class="filter-group">
        <label for="sortFilter">Sort By:</label>
        <select id="sortFilter" v-model="selectedSort" class="filter-select">
          <option value="created-desc">Created Date (Newest)</option>
          <option value="created-asc">Created Date (Oldest)</option>
          <option value="assign-desc">Assign Date (Newest)</option>
          <option value="assign-asc">Assign Date (Oldest)</option>
          <option value="due-desc">Due Date (Newest)</option>
          <option value="due-asc">Due Date (Oldest)</option>
          <option value="title-asc">Title (A-Z)</option>
          <option value="title-desc">Title (Z-A)</option>
        </select>
      </div>

      <div class="export-buttons">
        <button @click="exportGradebook" class="export-btn">
          📤 Export CSV
        </button>
        <button @click="showAeriesExport = true" class="export-btn aeries-btn">
          📊 Export to Aeries
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading gradebook data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <h3>Error Loading Gradebook</h3>
      <p>{{ error }}</p>
      <button @click="loadGradebookData" class="retry-btn">🔄 Retry</button>
    </div>

    <!-- Gradebook Table -->
    <div v-else class="gradebook-content">
      <!-- Assignment View -->
      <div v-if="viewMode === 'assignments'">
        <!-- Class/Period Groups -->
        <div v-for="group in filteredGroups" :key="group.key" class="class-group">
        <div class="class-header">
          <h2>{{ group.className }} - Period {{ group.period }}</h2>
          <span class="student-count">{{ group.students.length }} students</span>
        </div>

        <div class="gradebook-table-wrapper">
          <table class="gradebook-table">
            <thead class="sticky-header">
              <tr>
                <th class="student-name-col">Student</th>
                <th v-for="assessment in group.assessments" :key="assessment.id" class="assessment-col" :title="assessment.title">
                  <div class="assessment-header">
                    <span class="assessment-title">{{ assessment.title }}</span>
                    <span class="assessment-category" :class="assessment.category.toLowerCase()">
                      {{ assessment.category }}
                    </span>
                    <span class="assessment-points">{{ assessment.totalPoints }}pts</span>
                  </div>
                </th>
                <th class="average-col">Avg</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in group.students" :key="student.uid" class="student-row">
                <td class="student-name-cell">
                  <div class="student-info">
                    <router-link
                      :to="`/student-summary/${student.uid}`"
                      class="student-name-link"
                    >
                      <strong>{{ student.lastName }}, {{ student.firstName }}</strong>
                    </router-link>
                    <small>{{ student.email }}</small>
                  </div>
                </td>

                <!-- Assessment scores -->
                <td v-for="assessment in group.assessments" :key="assessment.id" class="score-cell">
                  <div class="score-container">
                    <span
                      v-if="getStudentScore(student.uid, assessment.id)"
                      class="score"
                      :class="getScoreClass(getStudentScore(student.uid, assessment.id)?.percentage || 0)"
                      @click="viewAssessmentResult(student.uid, assessment.id)"
                    >
                      <div class="score-fraction">
                        {{ getStudentScore(student.uid, assessment.id)?.score || 0 }}/{{ getStudentScore(student.uid, assessment.id)?.totalPoints || assessment.totalPoints }}
                      </div>
                      <div class="score-percentage">
                        {{ Math.round(getStudentScore(student.uid, assessment.id)?.percentage || 0) }}%
                      </div>
                    </span>
                    <span v-else class="no-score clickable" @click="openManualScoreDialog(student.uid, assessment.id, assessment)">-</span>
                  </div>
                </td>

                <!-- Student average -->
                <td class="average-cell">
                  <span class="average-score" :class="getScoreClass(getStudentAverage(student.uid))">
                    {{ getStudentAverage(student.uid) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Class Statistics -->
        <div class="class-stats">
          <div class="stat-item">
            <span class="stat-label">Class Average:</span>
            <span class="stat-value" :class="getScoreClass(getClassAverage(group))">
              {{ getClassAverage(group) }}%
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completed Assessments:</span>
            <span class="stat-value">{{ getCompletedCount(group) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pending Assessments:</span>
            <span class="stat-value">{{ getPendingCount(group) }}</span>
          </div>
        </div>
        </div>
      </div>

      <!-- Standards View -->
      <div v-else-if="viewMode === 'standards'">
        <!-- Standards-based Groups -->
        <div v-for="group in filteredGroups" :key="group.key" class="class-group">
          <div class="class-header">
            <h2>{{ group.className }} - Period {{ group.period }}</h2>
            <span class="student-count">{{ group.students.length }} students</span>
          </div>

          <div class="gradebook-table-wrapper">
            <table class="gradebook-table standards-table">
              <thead class="sticky-header">
                <tr>
                  <th class="student-name-col">Student</th>
                  <th v-for="standard in group.standards" :key="standard" class="standard-col" :title="standard">
                    <div class="standard-header">
                      <span
                        class="standard-title"
                        :class="{
                          'custom-standard': getStandardDisplayInfo(standard).isCustom,
                          'ccss-standard': !getStandardDisplayInfo(standard).isCustom
                        }"
                      >
                        {{ getCleanStandardName(standard) }}
                      </span>
                      <span class="standard-info">Correct/Total</span>
                    </div>
                  </th>
                  <th class="mastery-col">Standard Mastery</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in group.students" :key="student.uid" class="student-row">
                  <td class="student-name-cell">
                    <div class="student-info">
                      <router-link
                        :to="`/student-summary/${student.uid}`"
                        class="student-name-link"
                      >
                        <strong>{{ student.lastName }}, {{ student.firstName }}</strong>
                      </router-link>
                      <small>{{ student.email }}</small>
                    </div>
                  </td>

                  <!-- Standard mastery scores -->
                  <td v-for="standard in group.standards" :key="standard" class="standard-cell">
                    <div class="standard-score">
                      <span
                        class="mastery-score"
                        :class="getStandardMasteryClass(getStandardScore(student.uid, standard))"
                      >
                        {{ getStandardScore(student.uid, standard).correct }}/{{ getStandardScore(student.uid, standard).total }}
                      </span>
                      <div class="mastery-percentage">
                        {{ Math.round(getStandardScore(student.uid, standard).percentage) }}%
                      </div>
                    </div>
                  </td>

                  <!-- Overall mastery -->
                  <td class="mastery-cell">
                    <span class="overall-mastery" :class="getScoreClass(getStudentStandardsAverage(student.uid))">
                      {{ getStudentStandardsAverage(student.uid) }}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Standards Statistics -->
          <div class="class-stats">
            <div class="stat-item">
              <span class="stat-label">Standards Covered:</span>
              <span class="stat-value">{{ group.standards.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Avg Mastery:</span>
              <span class="stat-value" :class="getScoreClass(getClassStandardsAverage(group))">
                {{ getClassStandardsAverage(group) }}%
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Students Above 80%:</span>
              <span class="stat-value">{{ getStudentsAboveThreshold(group, 80) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="filteredGroups.length === 0" class="no-data">
        <div class="no-data-icon">📚</div>
        <h3>No Gradebook Data</h3>
        <p>No students or assessments found for the selected filters.</p>
        <button @click="clearFilters" class="clear-filters-btn">Clear Filters</button>
      </div>
    </div>

    <!-- Manual Score Input Dialog -->
    <div v-if="showScoreDialog" class="score-dialog-overlay" @click="cancelScoreDialog">
      <div class="score-dialog" @click.stop>
        <h3>Enter Manual Scores</h3>
        <div class="dialog-content">
          <div class="dialog-header">
            <p><strong>Student:</strong> {{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}</p>
            <p><strong>Assessment:</strong> {{ selectedAssessment?.title }}</p>
            <div class="score-summary">
              <span class="current-total">Total: {{ totalManualScore }} / {{ maxPossibleScore }}</span>
              <span class="percentage">({{ maxPossibleScore > 0 ? Math.round((totalManualScore / maxPossibleScore) * 100) : 0 }}%)</span>
            </div>
          </div>

          <div class="questions-container">
            <div
              v-for="(question, index) in selectedAssessment?.questions"
              :key="question.id"
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">Q{{ index + 1 }}</span>
                <span class="question-points">{{ question.points }} pts</span>
                <span v-if="question.standard" class="question-standard">{{ question.standard }}</span>
              </div>

              <div class="question-text">
                {{ question.questionText }}
              </div>

              <div class="score-input">
                <label :for="`score-${question.id}`">Score:</label>
                <input
                  :id="`score-${question.id}`"
                  v-model="questionScores[question.id]"
                  type="number"
                  :max="question.points"
                  min="0"
                  step="0.5"
                  class="question-score-input"
                  @input="validateQuestionScore(question.id, question.points)"
                >
                <span class="max-points">/ {{ question.points }}</span>
              </div>
            </div>
          </div>

          <div class="dialog-buttons">
            <button @click="cancelScoreDialog" class="cancel-btn">Cancel</button>
            <button @click="saveManualScore" class="save-btn" :disabled="!isValidScore">
              Save Scores ({{ totalManualScore }}/{{ maxPossibleScore }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Aeries Export Modal -->
    <div v-if="showAeriesExport" class="modal-overlay" @click="showAeriesExport = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>📊 Export Grades to Aeries</h2>
          <button @click="showAeriesExport = false" class="close-button">✕</button>
        </div>
        <div class="modal-body">
          <AeriesGradeExport />
        </div>
      </div>
    </div>

    <!-- Bulk Print Summary Dialog -->
    <BulkPrintSummaryDialog
      :show="showBulkPrintDialog"
      :students="students"
      :periodsWithStatus="periodsWithStatus"
      @close="showBulkPrintDialog = false"
      @print="handleBulkPrint"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import AcademicPeriodSelector from '@/components/AcademicPeriodSelector.vue';
import AeriesGradeExport from '@/components/admin/AeriesGradeExport.vue';
import BulkPrintSummaryDialog from '@/components/BulkPrintSummaryDialog.vue';
import { useGlobalAcademicPeriods } from '@/composables/useAcademicPeriods';
import type { AcademicPeriod, PeriodType } from '@/types/academicPeriods';
import { filterAssessmentsByPeriod, filterResultsByPeriod } from '@/types/academicPeriods';
import { useAuthStore } from '@/stores/authStore';
import { getStudentsByTeacher } from '@/firebase/userServices';
import { getAssessmentsByTeacher, getAssessmentResults, getAssessmentResultsBulk, createManualAssessmentResult, getAssessmentsByStudent, getAssessmentResultsByStudent } from '@/firebase/iepServices';
import { getAllCustomStandards } from '@/firebase/standardsServices';
import { getGoalsByStudent } from '@/firebase/goalServices';
import { getAllFluencyProgress } from '@/services/mathFluencyServices';
import { parseStandards, groupQuestionsByStandards, getAllStandardsFromQuestions, calculateStandardScore } from '@/utils/standardsUtils';
import { groupStudentsByClassAndPeriod } from '@/utils/studentGroupingUtils';
import type { Student } from '@/types/users';
import type { Assessment, AssessmentResult } from '@/types/iep';
import type { CustomStandard } from '@/types/standards';

const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(true);
const error = ref('');
const students = ref<Student[]>([]);
const assessments = ref<Assessment[]>([]);
const assessmentResults = ref<AssessmentResult[]>([]);
const customStandards = ref<CustomStandard[]>([]);

// View mode and filters
const viewMode = ref('assignments'); // 'assignments' or 'standards'
const selectedClass = ref('');
const selectedPeriod = ref('');
const selectedCategory = ref('');
const selectedAppCategory = ref('');
const selectedAssessmentCategory = ref(''); // NEW: Filter standards by assessment type (ESA, SA, etc.)
const selectedSort = ref('created-desc'); // Default to newest first

// Manual score dialog state
const showScoreDialog = ref(false);
const selectedStudent = ref<Student | null>(null);
const selectedAssessment = ref<Assessment | null>(null);
const questionScores = ref<{ [questionId: string]: string }>({});

// Aeries export modal state
const showAeriesExport = ref(false);

// Bulk print dialog state
const showBulkPrintDialog = ref(false);
const printingSummaries = ref(false);

// Academic period management
const { filterAssessments, filterResults, selectedPeriod: currentAcademicPeriod, periodsWithStatus } = useGlobalAcademicPeriods();

// Academic period event handlers
const onPeriodChanged = (period: AcademicPeriod) => {
  console.log(`📅 Period changed to: ${period.name}`);
  // Filtered data will automatically update via computed properties
};

const onPeriodTypeChanged = (type: PeriodType) => {
  console.log(`🔄 Period type changed to: ${type}`);
  // Filtered data will automatically update via computed properties
};

// Computed properties for manual scoring
const totalManualScore = computed(() => {
  return Object.values(questionScores.value)
    .reduce((sum, score) => sum + (parseFloat(score) || 0), 0);
});

const maxPossibleScore = computed(() => {
  return selectedAssessment.value?.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
});

const isValidScore = computed(() => {
  return selectedAssessment.value?.questions?.every(q => {
    const score = parseFloat(questionScores.value[q.id] || '0');
    return !isNaN(score) && score >= 0 && score <= q.points;
  }) || false;
});

// Existing computed properties
const uniqueClasses = computed(() => {
  const classes = [...new Set(students.value.map(s => s.courseName || s.className).filter(Boolean))];
  return classes.sort();
});

const uniquePeriods = computed(() => {
  const periods = [...new Set(students.value.map(s => s.section || s.period).filter(Boolean))];
  return periods.sort();
});

const filteredStudents = computed(() => {
  return students.value.filter(student => {
    const studentClass = student.courseName || student.className;
    const studentPeriod = student.section || student.period;

    if (selectedClass.value && studentClass !== selectedClass.value) return false;
    if (selectedPeriod.value && studentPeriod !== selectedPeriod.value) return false;
    return true;
  });
});

const filteredAssessments = computed(() => {
  // First apply academic period filtering
  let filtered = filterAssessments(assessments.value);

  // Then apply category filtering
  filtered = filtered.filter(assessment => {
    if (selectedCategory.value && assessment.category !== selectedCategory.value) return false;
    return true;
  });

  // Apply sorting
  filtered.sort((a, b) => {
    const [sortField, sortDirection] = selectedSort.value.split('-');
    let comparison = 0;

    switch (sortField) {
      case 'created':
        const aCreated = a.createdAt?.seconds || a.createdAt || 0;
        const bCreated = b.createdAt?.seconds || b.createdAt || 0;
        comparison = new Date(bCreated * 1000).getTime() - new Date(aCreated * 1000).getTime();
        break;
      case 'assign':
        const aAssign = a.assignDate?.seconds || a.assignDate || 0;
        const bAssign = b.assignDate?.seconds || b.assignDate || 0;
        comparison = new Date(bAssign * 1000).getTime() - new Date(aAssign * 1000).getTime();
        break;
      case 'due':
        const aDue = a.dueDate?.seconds || a.dueDate || 0;
        const bDue = b.dueDate?.seconds || b.dueDate || 0;
        comparison = new Date(bDue * 1000).getTime() - new Date(aDue * 1000).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return sortDirection === 'desc' ? comparison : -comparison;
  });

  return filtered;
});

// Get unique standards from all assessments with filtering
const uniqueStandards = computed(() => {
  const startTime = performance.now();

  // Filter assessments by category first if selected
  let assessmentsToInclude = filteredAssessments.value;

  if (selectedAssessmentCategory.value) {
    assessmentsToInclude = assessmentsToInclude.filter(
      assessment => assessment.category === selectedAssessmentCategory.value
    );
  }

  const allQuestions = assessmentsToInclude.flatMap(assessment => [
    // Include assessment-level standard as a pseudo-question
    ...(assessment.standard ? [{ standard: assessment.standard }] : []),
    // Include all questions
    ...(assessment.questions || [])
  ]);

  let standards = getAllStandardsFromQuestions(allQuestions);

  // Apply app category filter if selected (for custom standards)
  if (selectedAppCategory.value) {
    const beforeFilter = standards.length;
    standards = standards.filter(standardCode => {
      const customStd = getCustomStandardByCode(standardCode);
      return customStd?.appCategory === selectedAppCategory.value;
    });

    console.log(`🔍 App category filter: ${beforeFilter} standards → ${standards.length} standards`);
  }

  const calcTime = Math.round(performance.now() - startTime);
  if (calcTime > 10) {
    console.log(`📊 Calculated ${standards.length} unique standards in ${calcTime}ms`);
  }

  return standards;
});

// Get unique app categories from custom standards
const uniqueAppCategories = computed(() => {
  const categories = customStandards.value
    .map(std => std.appCategory)
    .filter((category): category is string => Boolean(category))
    .filter((category, index, arr) => arr.indexOf(category) === index);

  return categories.sort();
});

// Get unique assessment categories (ESA, SA, HW, etc.)
const uniqueAssessmentCategories = computed(() => {
  const categories = new Set<string>();

  filteredAssessments.value.forEach(assessment => {
    if (assessment.category) {
      categories.add(assessment.category);
    }
  });

  return Array.from(categories).sort();
});

// PERFORMANCE OPTIMIZATION: Pre-filter results once instead of filtering on every lookup
const periodFilteredResults = computed(() => {
  const startTime = performance.now();
  const filtered = filterResults(assessmentResults.value);
  const time = Math.round(performance.now() - startTime);

  if (time > 10) {
    console.log(`📅 Pre-filtered ${filtered.length}/${assessmentResults.value.length} results in ${time}ms`);
  }

  return filtered;
});

// PERFORMANCE OPTIMIZATION: Index results for O(1) lookup instead of O(n) linear search
const resultsIndex = computed(() => {
  const startTime = performance.now();
  const index = new Map<string, any>();

  periodFilteredResults.value.forEach(result => {
    const key = `${result.studentUid}-${result.assessmentId}`;
    index.set(key, result);
  });

  const time = Math.round(performance.now() - startTime);
  console.log(`🗂️ Indexed ${index.size} results for O(1) lookup in ${time}ms`);

  return index;
});

// Group students by class and period using utility function
const filteredGroups = computed(() => {
  // Use the utility function to group students
  const baseGroups = groupStudentsByClassAndPeriod(filteredStudents.value);

  // Add gradebook-specific data (assessments and standards) to each group
  return baseGroups.map(group => ({
    ...group,
    assessments: filteredAssessments.value,
    standards: uniqueStandards.value
  }));
});

// Methods
const loadGradebookData = async () => {
  const overallStartTime = performance.now();

  try {
    loading.value = true;
    error.value = '';

    if (!authStore.currentUser?.uid) {
      throw new Error('User not authenticated');
    }

    console.log('📊 Loading gradebook data...');

    // Load teacher's students, assessments, and custom standards
    const [teacherStudents, teacherAssessments, allCustomStandards] = await Promise.all([
      getStudentsByTeacher(authStore.currentUser.uid),
      getAssessmentsByTeacher(authStore.currentUser.uid),
      getAllCustomStandards()
    ]);

    students.value = teacherStudents;

    // Filter out Progress Assessments (PA) and Diagnostic assessments
    // PA assessments are managed separately in Progress Assessment Management
    // Diagnostic assessments are managed separately in Diagnostic views
    // PERFORMANCE: Removed individual logging (was causing 50+ console logs)
    const filteredAssessments = teacherAssessments.filter(assessment => {
      const category = assessment.category?.toUpperCase() || '';
      const title = assessment.title?.toUpperCase() || '';
      const isPA = category === 'PA';
      const isDiagnostic = title.includes('DIAGNOSTIC') || (assessment as any).diagnosticType !== undefined;

      return !isPA && !isDiagnostic;
    });

    assessments.value = filteredAssessments;
    customStandards.value = allCustomStandards;

    const excludedPACount = teacherAssessments.filter(a => (a.category?.toUpperCase() || '') === 'PA').length;
    const excludedDiagnosticCount = teacherAssessments.filter(a => {
      const title = a.title?.toUpperCase() || '';
      return title.includes('DIAGNOSTIC') || (a as any).diagnosticType !== undefined;
    }).length;
    const totalExcluded = teacherAssessments.length - filteredAssessments.length;

    console.log(`👥 Loaded ${students.value.length} students, ${filteredAssessments.length} assessments (${totalExcluded} excluded: ${excludedPACount} PA + ${excludedDiagnosticCount} Diagnostic)`);

    // PERFORMANCE OPTIMIZED: Load all assessment results using bulk query
    // This reduces N+1 queries (e.g., 50 assessments = 50 queries) to batched queries (50 assessments = 5 queries)
    const assessmentIds = filteredAssessments.map(a => a.id);
    const startTime = performance.now();
    const allResults = await getAssessmentResultsBulk(assessmentIds);
    const queryTime = Math.round(performance.now() - startTime);
    console.log(`⚡ Bulk query completed in ${queryTime}ms for ${assessmentIds.length} assessments`);

    // Filter results to only include results for filtered assessments (safety check)
    const filteredResults = allResults.filter(result => {
      const assessment = filteredAssessments.find(a => a.id === result.assessmentId);
      if (!assessment) {
        // Result for PA/Diagnostic assessment or deleted assessment - exclude it
        return false;
      }
      // Double-check: ensure assessment is not PA or Diagnostic (safety check)
      const category = assessment.category?.toUpperCase() || '';
      const title = assessment.title?.toUpperCase() || '';
      const isPA = category === 'PA';
      const isDiagnostic = title.includes('DIAGNOSTIC') || (assessment as any).diagnosticType !== undefined;
      return !isPA && !isDiagnostic;
    });

    assessmentResults.value = filteredResults;

    console.log(`📊 Loaded assessment results: ${filteredResults.length} (filtered to non-PA, non-Diagnostic only)`);

    // Clear standard score cache when new data is loaded
    clearStandardScoreCache();

    const totalTime = Math.round(performance.now() - overallStartTime);
    console.log(`✅ Gradebook data loaded in ${totalTime}ms (${students.value.length} students, ${filteredAssessments.length} assessments, ${filteredResults.length} results)`);

  } catch (err: any) {
    console.error('❌ Error loading gradebook:', err);
    error.value = err.message || 'Failed to load gradebook data';
  } finally {
    loading.value = false;
  }
};

const getStudentScore = (studentUid: string, assessmentId: string) => {
  // PERFORMANCE OPTIMIZED: Use indexed results for O(1) lookup
  // Before: Filtered 500+ results then searched (O(n)) = 750,000 operations total
  // After: Direct Map lookup (O(1)) = instant retrieval
  const key = `${studentUid}-${assessmentId}`;
  return resultsIndex.value.get(key) || null;
};

const getStudentAverage = (studentUid: string): number => {
  // PERFORMANCE OPTIMIZED: Use pre-filtered results instead of filtering again
  const studentResults = periodFilteredResults.value.filter(result =>
    result.studentUid === studentUid
  );
  if (studentResults.length === 0) return 0;

  const total = studentResults.reduce((sum, result) => sum + result.percentage, 0);
  return Math.round(total / studentResults.length);
};

const getClassAverage = (group: any): number => {
  const allScores: number[] = [];

  group.students.forEach((student: Student) => {
    group.assessments.forEach((assessment: Assessment) => {
      const score = getStudentScore(student.uid, assessment.id);
      if (score) {
        allScores.push(score.percentage);
      }
    });
  });

  if (allScores.length === 0) return 0;

  const total = allScores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / allScores.length);
};

const getCompletedCount = (group: any): number => {
  let completed = 0;
  group.students.forEach((student: Student) => {
    group.assessments.forEach((assessment: Assessment) => {
      if (getStudentScore(student.uid, assessment.id)) {
        completed++;
      }
    });
  });
  return completed;
};

const getPendingCount = (group: any): number => {
  const total = group.students.length * group.assessments.length;
  return total - getCompletedCount(group);
};

const getScoreClass = (percentage: number): string => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  if (percentage >= 60) return 'poor';
  return 'failing';
};

const viewAssessmentResult = (studentUid: string, assessmentId: string) => {
  const result = getStudentScore(studentUid, assessmentId);
  if (result) {
    router.push(`/assessment/${assessmentId}/results/${result.id}`);
  }
};

const clearFilters = () => {
  selectedClass.value = '';
  selectedPeriod.value = '';
  selectedCategory.value = '';
  selectedAppCategory.value = '';
  selectedAssessmentCategory.value = '';
  selectedSort.value = 'created-desc';
};

// PERFORMANCE OPTIMIZATION: Memoized standard scores to avoid expensive recalculations
const standardScoreCache = ref<Map<string, { correct: number; total: number; percentage: number }>>(new Map());

// Clear cache when data changes
const clearStandardScoreCache = () => {
  const previousSize = standardScoreCache.value.size;
  standardScoreCache.value.clear();

  if (previousSize > 0) {
    console.log(`🔄 Cleared ${previousSize} cached standard scores (will recalculate on next render)`);
  }
};

// Standards-based methods with caching
const getStandardScore = (studentUid: string, standard: string) => {
  const cacheKey = `${studentUid}-${standard}`;

  // Check cache first - this prevents 99% of expensive recalculations!
  if (standardScoreCache.value.has(cacheKey)) {
    return standardScoreCache.value.get(cacheKey)!;
  }

  // Cache miss - need to calculate (this is the expensive part)
  const calcStartTime = performance.now();

  // Get custom standard metadata for maxScore limit
  const customStd = getCustomStandardByCode(standard);
  const maxScore = customStd?.maxScore;

  // Collect all question attempts for this standard
  const questionAttempts: { isCorrect: boolean; score: number; maxPoints: number }[] = [];

  // Only count questions from assessments the student actually took
  assessments.value.forEach(assessment => {
    // First check if student took this assessment
    const result = getStudentScore(studentUid, assessment.id);
    if (!result) {
      // Skip this assessment if student didn't take it
      return;
    }

    // Check if assessment-level standard matches
    const assessmentStandards = parseStandards(assessment.standard);
    const assessmentCoversStandard = assessmentStandards.includes(standard);

    assessment.questions?.forEach(question => {
      // Check if question covers this standard (either through question-level or assessment-level standard)
      const questionStandards = parseStandards(question.standard);
      const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;

      if (questionCoversStandard) {
        // Find the response for this specific question
        const response = result.responses?.find((r: any) => r.questionId === question.id);
        if (response) {
          const isCorrect = response.isCorrect
          const score = response.pointsEarned || (response.isCorrect ? question.points : 0)

          questionAttempts.push({
            isCorrect,
            score,
            maxPoints: question.points
          });
        }
      }
    });
  });

  // Use centralized scoring calculation
  const result = calculateStandardScore(questionAttempts, customStd);

  // Cache the result for future lookups
  standardScoreCache.value.set(cacheKey, result);

  // Log slow calculations (>10ms) to identify bottlenecks
  const calcTime = Math.round(performance.now() - calcStartTime);
  if (calcTime > 10) {
    console.log(`⏱️ Calculated ${standard} for student in ${calcTime}ms (now cached)`);
  }

  return result;
};

const getStandardMasteryClass = (scoreData: { correct: number; total: number; percentage: number }): string => {
  if (scoreData.correct >= 5) return 'mastered'; // Green if 5+ correct
  if (scoreData.percentage >= 80) return 'proficient';
  if (scoreData.percentage >= 60) return 'developing';
  return 'beginning';
};

// Calculate student's overall standards mastery using maxScore-based calculation
const getStudentStandardsAverage = (studentUid: string): number => {
  const standardMasteries: number[] = [];

  uniqueStandards.value.forEach(standard => {
    const customStd = getCustomStandardByCode(standard);
    const scoreData = getStandardScore(studentUid, standard);

    if (scoreData.total > 0) {
      let mastery: number;

      if (customStd?.maxScore && customStd.maxScore > 0) {
        // If maxScore is set, calculate mastery as (correct / maxScore) * 100
        // Cap at 100% if they exceed maxScore
        mastery = Math.min(100, Math.round((scoreData.correct / customStd.maxScore) * 100));
      } else {
        // If no maxScore set, use regular percentage
        mastery = scoreData.percentage;
      }

      standardMasteries.push(mastery);
    }
  });

  if (standardMasteries.length === 0) return 0;

  const total = standardMasteries.reduce((sum, mastery) => sum + mastery, 0);
  return Math.round(total / standardMasteries.length);
};

// (Replaced with maxScore-based version above)

const getClassStandardsAverage = (group: any): number => {
  const allScores: number[] = [];

  group.students.forEach((student: Student) => {
    const studentAvg = getStudentStandardsAverage(student.uid);
    if (studentAvg > 0) {
      allScores.push(studentAvg);
    }
  });

  if (allScores.length === 0) return 0;

  const total = allScores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / allScores.length);
};

const getStudentsAboveThreshold = (group: any, threshold: number): number => {
  return group.students.filter((student: Student) =>
    getStudentStandardsAverage(student.uid) >= threshold
  ).length;
};

const getCleanStandardName = (standardCode: string): string => {
  if (!standardCode) return 'No standard';

  if (standardCode.startsWith('CUSTOM:')) {
    return standardCode.replace('CUSTOM:', ''); // Remove CUSTOM: prefix
  } else {
    return standardCode; // Return CCSS code as-is
  }
};

// Get custom standard metadata by code
const getCustomStandardByCode = (standardCode: string): CustomStandard | null => {
  if (!standardCode) return null;

  // Remove CUSTOM: prefix if present
  const cleanCode = standardCode.startsWith('CUSTOM:') ?
    standardCode.replace('CUSTOM:', '') : standardCode;

  return customStandards.value.find(std => std.code === cleanCode) || null;
};

// Get enhanced standard display info
const getStandardDisplayInfo = (standardCode: string) => {
  const customStd = getCustomStandardByCode(standardCode);

  if (customStd) {
    return {
      name: customStd.name,
      code: customStd.code,
      appCategory: customStd.appCategory,
      maxScore: customStd.maxScore,
      isCustom: true
    };
  }

  return {
    name: getCleanStandardName(standardCode),
    code: standardCode,
    appCategory: null,
    maxScore: null,
    isCustom: false
  };
};

const exportGradebook = () => {
  try {
    const csvData: string[] = [];

    // CSV Header
    const headers = ['Class', 'Period', 'Student Name', 'Email'];
    filteredAssessments.value.forEach(assessment => {
      headers.push(`${assessment.title} (${assessment.category})`);
    });
    headers.push('Average');
    csvData.push(headers.join(','));

    // CSV Data
    filteredGroups.value.forEach(group => {
      group.students.forEach(student => {
        const row = [
          group.className,
          group.period,
          `"${student.lastName}, ${student.firstName}"`,
          student.email
        ];

        // Add scores for each assessment
        group.assessments.forEach(assessment => {
          const score = getStudentScore(student.uid, assessment.id);
          row.push(score ? score.percentage.toString() : '');
        });

        // Add average
        row.push(getStudentAverage(student.uid).toString());

        csvData.push(row.join(','));
      });
    });

    // Download CSV
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gradebook_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('📤 Gradebook exported to CSV');
  } catch (err) {
    console.error('❌ Error exporting gradebook:', err);
    alert('Failed to export gradebook. Please try again.');
  }
};

// Manual score dialog methods
const openManualScoreDialog = (studentUid: string, assessmentId: string, assessment: Assessment) => {
  const student = students.value.find(s => s.uid === studentUid);
  if (!student) {
    console.error('Student not found:', studentUid);
    return;
  }

  selectedStudent.value = student;
  selectedAssessment.value = assessment;

  // Initialize question scores
  questionScores.value = {};
  assessment.questions?.forEach(question => {
    questionScores.value[question.id] = '0';
  });

  showScoreDialog.value = true;
};

const saveManualScore = async () => {
  try {
    if (!selectedStudent.value || !selectedAssessment.value || !authStore.currentUser?.uid) {
      throw new Error('Missing required data');
    }

    if (!isValidScore.value) {
      alert('Please enter valid scores for all questions (0 to max points for each question)');
      return;
    }

    const totalScore = totalManualScore.value;
    const totalPoints = maxPossibleScore.value;
    const percentage = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

    // Create individual responses for each question
    const responses = selectedAssessment.value.questions?.map(question => ({
      questionId: question.id,
      studentAnswer: 'Manual entry', // Placeholder since this is manual scoring
      isCorrect: parseFloat(questionScores.value[question.id] || '0') === question.points,
      pointsEarned: parseFloat(questionScores.value[question.id] || '0'),
      timeSpent: 0,
      manuallyAdjusted: true,
      adjustedBy: authStore.currentUser!.uid,
      adjustedAt: new Date(),
      adjustmentReason: 'Manual score entry'
    })) || [];

    // Create assessment result with individual question responses
    await createManualAssessmentResult({
      assessmentId: selectedAssessment.value.id,
      studentUid: selectedStudent.value.uid,
      goalId: selectedAssessment.value.goalId,
      score: totalScore,
      totalPoints: totalPoints,
      percentage: percentage,
      gradedBy: authStore.currentUser.uid,
      feedback: 'Manually entered scores for individual questions',
      responses: responses,
      timeSpent: 0,
      accommodationsUsed: []
    });

    console.log('✅ Manual scores saved successfully');
    showScoreDialog.value = false;

    // Refresh the gradebook data
    await loadGradebookData();
  } catch (error: any) {
    console.error('❌ Error saving manual scores:', error);
    alert(`Failed to save scores: ${error.message}`);
  }
};

const validateQuestionScore = (questionId: string, maxPoints: number) => {
  const score = parseFloat(questionScores.value[questionId] || '0');
  if (score > maxPoints) {
    questionScores.value[questionId] = maxPoints.toString();
  } else if (score < 0) {
    questionScores.value[questionId] = '0';
  }
};

const cancelScoreDialog = () => {
  showScoreDialog.value = false;
  selectedStudent.value = null;
  selectedAssessment.value = null;
  questionScores.value = {};
};

// Watch for filter changes and clear cache (fixing freeze issue)
// PERFORMANCE FIX: Clear cache in watcher, not in computed property
watch([selectedAppCategory, selectedAssessmentCategory], () => {
  clearStandardScoreCache();
  console.log('🔄 Cache cleared due to filter change');
});

const openBulkPrintDialog = () => {
  console.log('Opening bulk print dialog, students count:', students.value.length);
  showBulkPrintDialog.value = true;
};

// Helper function to fetch student summary data directly and render HTML (much faster than iframes)
const fetchAndRenderStudentSummary = async (studentUid: string, studentName: string, periodId: string | null): Promise<string> => {
  try {
    console.log(`📥 Fetching data directly for ${studentName}...`);

    // Fetch all data in parallel (no Vue, no router, just direct Firestore queries)
    const [assessmentsList, resultsList, goalsList, fluencyList, allCustomStandards] = await Promise.all([
      getAssessmentsByStudent(studentUid),
      getAssessmentResultsByStudent(studentUid),
      getGoalsByStudent(studentUid),
      getAllFluencyProgress(studentUid),
      getAllCustomStandards() // Cache this across all students
    ]);

    console.log(`✅ Data fetched for ${studentName}: ${assessmentsList.length} assessments, ${resultsList.length} results, ${goalsList.length} goals, ${fluencyList.length} fluency ops`);

    // Filter by period - use current academic period if periodId is null
    let filteredAssessments = assessmentsList;
    let filteredResults = resultsList;

    // Determine which period to use: provided periodId, or current academic period, or null (all periods)
    const periodToUse = periodId
      ? periodsWithStatus.value.find(p => p.id === periodId)
      : currentAcademicPeriod.value;

    if (periodToUse) {
      filteredAssessments = filterAssessmentsByPeriod(assessmentsList, periodToUse);
      filteredResults = filterResultsByPeriod(resultsList, periodToUse);
      console.log(`📅 Filtering ${studentName} data for period: ${periodToUse.name} (${filteredAssessments.length}/${assessmentsList.length} assessments, ${filteredResults.length}/${resultsList.length} results)`);
    } else {
      console.log(`📅 No period filter for ${studentName} - showing all periods (${assessmentsList.length} assessments, ${resultsList.length} results)`);
    }

    // Helper functions (EXACT same as StudentSummary.vue)
    const getCustomStandardByCode = (standardCode: string): CustomStandard | null => {
      if (!standardCode) return null;
      const cleanCode = standardCode.startsWith('CUSTOM:') ?
        standardCode.replace('CUSTOM:', '') : standardCode;
      return allCustomStandards.find(std => std.code === cleanCode) || null;
    };

    const getCleanStandardName = (standardCode: string): string => {
      if (!standardCode) return 'No standard';
      if (standardCode.startsWith('CUSTOM:')) {
        return standardCode.replace('CUSTOM:', '');
      } else {
        return standardCode;
      }
    };

    const truncateText = (text: string, maxLength: number): string => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const getStandardDisplayInfo = (standardCode: string) => {
      const customStd = getCustomStandardByCode(standardCode);
      if (customStd) {
        const description = customStd.description ? truncateText(customStd.description, 40) : '';
        return {
          name: customStd.name,
          code: customStd.code,
          description: description,
          isCustom: true
        };
      }
      return {
        name: getCleanStandardName(standardCode),
        code: standardCode,
        description: '',
        isCustom: false
      };
    };

    // Helper to get score class
    const getScoreClass = (percentage: number): string => {
      if (percentage >= 90) return 'excellent';
      if (percentage >= 80) return 'good';
      if (percentage >= 70) return 'fair';
      if (percentage >= 60) return 'needs-improvement';
      return 'poor';
    };

    // Calculate ESA Standards Data (EXACT same logic as StudentSummary.vue)
    const esaAssessments = filteredAssessments.filter(a => a.category === 'ESA');
    const esaResults = filteredResults.filter(r => {
      const assessment = esaAssessments.find(a => a.id === r.assessmentId);
      return assessment !== undefined;
    });

    const allESAQuestions = esaAssessments.flatMap(assessment => [
      ...(assessment.standard ? [{ standard: assessment.standard }] : []),
      ...(assessment.questions || [])
    ]);

    const uniqueESAStandards = getAllStandardsFromQuestions(allESAQuestions);

    const esaStandardsMap = new Map<string, {
      standard: string;
      correct: number;
      total: number;
      percentage: number;
    }>();

    uniqueESAStandards.forEach(standard => {
      const customStd = getCustomStandardByCode(standard);
      const maxScore = customStd?.maxScore;
      const scoringMethod = customStd?.scoringMethod || 'additive';

      const questionAttempts: { isCorrect: boolean; score: number; maxPoints: number }[] = [];

      esaAssessments.forEach(assessment => {
        const result = esaResults.find(r => r.assessmentId === assessment.id);
        if (!result) return;

        const assessmentStandards = parseStandards(assessment.standard || '');
        const assessmentCoversStandard = assessmentStandards.includes(standard);

        assessment.questions?.forEach((question: any) => {
          const questionStandards = parseStandards(question.standard || '');
          const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;

          if (questionCoversStandard) {
            const response = result.responses?.find((r: any) => r.questionId === question.id);
            if (response) {
              const isCorrect = response.isCorrect;
              const score = response.pointsEarned || (response.isCorrect ? (question.points || 1) : 0);
              questionAttempts.push({ 
                isCorrect, 
                score,
                maxPoints: question.points || 1
              });
            }
          }
        });
      });

      if (questionAttempts.length > 0) {
        // Use centralized scoring calculation
        const { correct, total, percentage } = calculateStandardScore(questionAttempts, customStd);
        esaStandardsMap.set(standard, { standard, correct, total, percentage });
      }
    });

    const esaStandardsData = Array.from(esaStandardsMap.values()).sort((a, b) => {
      return a.standard.localeCompare(b.standard, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Calculate missing ESA assessments
    const esaMissingAssessments = esaAssessments
      .filter(assessment => !esaResults.some(r => r.assessmentId === assessment.id))
      .map(assessment => assessment.title)
      .filter((title, index, arr) => arr.indexOf(title) === index)
      .sort();

    // Calculate SA Standards Data (EXACT same logic as StudentSummary.vue)
    const saAssessments = filteredAssessments.filter(a => a.category === 'SA');
    const saResults = filteredResults.filter(r => {
      const assessment = saAssessments.find(a => a.id === r.assessmentId);
      return assessment !== undefined;
    });

    const allSAQuestions = saAssessments.flatMap(assessment => [
      ...(assessment.standard ? [{ standard: assessment.standard }] : []),
      ...(assessment.questions || [])
    ]);

    const uniqueSAStandards = getAllStandardsFromQuestions(allSAQuestions);

    const saStandardsMap = new Map<string, {
      standard: string;
      correct: number;
      total: number;
      percentage: number;
    }>();

    uniqueSAStandards.forEach(standard => {
      const customStd = getCustomStandardByCode(standard);
      const maxScore = customStd?.maxScore;
      const scoringMethod = customStd?.scoringMethod || 'additive';

      const questionAttempts: { isCorrect: boolean; score: number; maxPoints: number }[] = [];

      saAssessments.forEach(assessment => {
        const result = saResults.find(r => r.assessmentId === assessment.id);
        if (!result) return;

        const assessmentStandards = parseStandards(assessment.standard || '');
        const assessmentCoversStandard = assessmentStandards.includes(standard);

        assessment.questions?.forEach((question: any) => {
          const questionStandards = parseStandards(question.standard || '');
          const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;

          if (questionCoversStandard) {
            const response = result.responses?.find((r: any) => r.questionId === question.id);
            if (response) {
              const isCorrect = response.isCorrect;
              const score = response.pointsEarned || (response.isCorrect ? (question.points || 1) : 0);
              questionAttempts.push({ 
                isCorrect, 
                score,
                maxPoints: question.points || 1
              });
            }
          }
        });
      });

      if (questionAttempts.length > 0) {
        // Use centralized scoring calculation
        const { correct, total, percentage } = calculateStandardScore(questionAttempts, customStd);
        saStandardsMap.set(standard, { standard, correct, total, percentage });
      }
    });

    const saStandardsData = Array.from(saStandardsMap.values()).sort((a, b) => {
      return a.standard.localeCompare(b.standard, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Calculate missing SA assessments
    const saMissingAssessments = saAssessments
      .filter(assessment => !saResults.some(r => r.assessmentId === assessment.id))
      .map(assessment => assessment.title)
      .filter((title, index, arr) => arr.indexOf(title) === index)
      .sort();

    // PA Compact Data (by assessment title)
    const paAssessments = filteredAssessments.filter(a => a.category === 'PA');
    const paResults = filteredResults.filter(r => {
      const assessment = paAssessments.find(a => a.id === r.assessmentId);
      return assessment !== undefined;
    });

    const paCompactData = paAssessments
      .map(assessment => {
        const results = paResults.filter(r => r.assessmentId === assessment.id);
        if (results.length > 0) {
          const bestResult = results.reduce((best, r) => r.percentage > best.percentage ? r : best);
          return {
            id: assessment.id,
            title: assessment.title,
            correct: bestResult.score,
            total: bestResult.totalPoints,
            percentage: bestResult.percentage,
            attempts: results.length
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
      });

    const paMissingAssessments = paAssessments
      .filter(assessment => !paResults.some(r => r.assessmentId === assessment.id))
      .map(assessment => assessment.title)
      .filter((title, index, arr) => arr.indexOf(title) === index)
      .sort();

    // Generate HTML summary (EXACTLY matching individual summary format)
    const summaryHTML = `
      <div class="summary-section summary-overview" id="summary-section">
        <div class="summary-header-row">
          <h2>📊 Summary of Scores</h2>
        </div>
        <div class="summary-grid">
          <div class="summary-group">
            <h3 class="summary-group-title">📝 ESA Standards</h3>
            ${esaStandardsData.length === 0 && esaMissingAssessments.length === 0 ? `
            <div class="empty-state-small">
              <p>No ESA data</p>
            </div>
            ` : `
            <div>
              ${esaMissingAssessments.length > 0 ? `
              <div class="missing-assessments">
                <strong>Missing:</strong> ${esaMissingAssessments.join(', ')}
              </div>
              ` : ''}
              ${esaStandardsData.length > 0 ? `
              <div class="compact-list">
                ${esaStandardsData.map(item => {
                  const displayInfo = getStandardDisplayInfo(item.standard);
                  const scoreClass = getScoreClass(item.percentage);
                  return `
                    <div class="compact-item summary-item ${scoreClass}">
                      <div class="standard-info">
                        <span class="standard-name">${displayInfo.name}</span>
                        <span class="standard-code-small">
                          ${displayInfo.code}${displayInfo.description ? ' - ' + displayInfo.description : ''}
                        </span>
                      </div>
                      <span class="score-info">
                        ${item.correct}/${item.total} <strong>${item.percentage}%</strong>
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
              ` : ''}
            </div>
            `}
          </div>
          <div class="summary-group">
            <h3 class="summary-group-title">📋 Standard Assessment Standards</h3>
            ${saStandardsData.length === 0 && saMissingAssessments.length === 0 ? `
            <div class="empty-state-small">
              <p>No Standard Assessment data</p>
            </div>
            ` : `
            <div>
              ${saMissingAssessments.length > 0 ? `
              <div class="missing-assessments">
                <strong>Missing:</strong> ${saMissingAssessments.join(', ')}
              </div>
              ` : ''}
              ${saStandardsData.length > 0 ? `
              <div class="compact-list">
                ${saStandardsData.map(item => {
                  const displayInfo = getStandardDisplayInfo(item.standard);
                  const scoreClass = getScoreClass(item.percentage);
                  return `
                    <div class="compact-item summary-item ${scoreClass}">
                      <div class="standard-info">
                        <span class="standard-name">${displayInfo.name}</span>
                        <span class="standard-code-small">
                          ${displayInfo.code}${displayInfo.description ? ' - ' + displayInfo.description : ''}
                        </span>
                      </div>
                      <span class="score-info">
                        ${item.correct}/${item.total} <strong>${item.percentage}%</strong>
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
              ` : ''}
            </div>
            `}
          </div>
          <div class="summary-group">
            <h3 class="summary-group-title">🎯 Progress Assessment</h3>
            ${paCompactData.length === 0 && paMissingAssessments.length === 0 ? `
            <div class="empty-state-small">
              <p>No Progress Assessment data</p>
            </div>
            ` : `
            <div>
              ${paMissingAssessments.length > 0 ? `
              <div class="missing-assessments">
                <strong>Missing:</strong> ${paMissingAssessments.join(', ')}
              </div>
              ` : ''}
              ${paCompactData.length > 0 ? `
              <div class="compact-list">
                ${paCompactData.map(item => {
                  const scoreClass = getScoreClass(item.percentage);
                  return `
                    <div class="compact-item summary-item ${scoreClass}">
                      <span class="standard-code">${item.title}</span>
                      <span class="score-info">
                        ${item.correct}/${item.total} <strong>${item.percentage}%</strong>
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
              ` : ''}
            </div>
            `}
          </div>
          ${fluencyList.length > 0 ? `
          <div class="summary-group">
            <h3 class="summary-group-title">🔢 Fluency</h3>
            <div class="compact-list">
              ${fluencyList.map(fluency => {
                const proficiency = fluency.proficiencyPercentage || 0;
                const scoreClass = getScoreClass(proficiency);
                return `
                <div class="compact-item summary-item ${scoreClass}">
                  <div class="standard-info">
                    <span class="standard-name">${fluency.operation.charAt(0).toUpperCase() + fluency.operation.slice(1)}</span>
                  </div>
                  <span class="score-info">${proficiency}% proficiency</span>
                </div>
              `;
              }).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    return summaryHTML;
  } catch (error: any) {
    console.error(`Error fetching summary for ${studentName}:`, error);
    return `<div class="summary-section"><p>Error loading summary: ${error.message}</p></div>`;
  }
};

const handleBulkPrint = async (studentUids: string[], periodId: string | null) => {
  if (studentUids.length === 0) return;

  // Prevent multiple simultaneous executions
  if (printingSummaries.value) {
    console.warn('Bulk print already in progress, ignoring duplicate call');
    return;
  }

  printingSummaries.value = true;
  showBulkPrintDialog.value = false;

  console.log(`📋 Starting bulk print for ${studentUids.length} students`);
  console.log(`⚡ Fetching data directly (no Vue/iframes) - MUCH faster!`);

  // Get period info for header - use current academic period if periodId is null
  const periodToUseForHeader = periodId
    ? periodsWithStatus.value.find(p => p.id === periodId)
    : currentAcademicPeriod.value;
  const periodInfo = periodToUseForHeader
    ? `${periodToUseForHeader.name}`
    : 'All Quarters';

  // Load all student summaries by fetching data directly (no iframes!)
  const summaryHTMLs: Array<{ studentName: string; html: string }> = [];

  // Process all students in parallel (much faster than iframes!)
  const summaryPromises = studentUids.map(async (studentUid, index) => {
    const student = students.value.find(s => s.uid === studentUid);

    if (!student) {
      console.warn(`Student ${studentUid} not found`);
      return { studentName: 'Unknown', html: '<p>Student not found</p>' };
    }

    const studentName = `${student.lastName}, ${student.firstName}`;
    console.log(`📥 Loading summary ${index + 1}/${studentUids.length}: ${studentName}`);

    // Use current academic period ID if periodId is null
    const effectivePeriodId = periodId || currentAcademicPeriod.value?.id || null;
    const html = await fetchAndRenderStudentSummary(studentUid, studentName, effectivePeriodId);

    console.log(`✅ Collected summary ${index + 1}/${studentUids.length} for ${studentName} (HTML length: ${html.length})`);

    return { studentName, html };
  });

  // Wait for all summaries to load in parallel
  const results = await Promise.all(summaryPromises);

  // Add all results
  results.forEach(result => {
    summaryHTMLs.push(result);
  });


  console.log(`✅ Finished collecting ${summaryHTMLs.length}/${studentUids.length} summaries - opening print window...`);

  if (summaryHTMLs.length === 0) {
    alert('No summaries were loaded. Please try again.');
    printingSummaries.value = false;
    return;
  }

  // Combine all summaries into one document with page breaks
  const studentName = summaryHTMLs.length === 1
    ? summaryHTMLs[0].studentName
    : `${summaryHTMLs.length} Students`;

  const combinedHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bulk Student Summaries - ${studentName}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 1in;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: white;
          }
          .student-summary-page {
            page-break-after: always;
            page-break-inside: avoid;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
          }
          .student-summary-page:last-child {
            page-break-after: auto;
          }
          .print-header {
            margin-bottom: 0.75rem;
            padding-bottom: 0.35rem;
            border-bottom: 2px solid #333;
            page-break-after: avoid;
          }
          .print-header h1 {
            margin: 0 0 0.25rem 0;
            font-size: 14pt;
            color: #333;
          }
          .print-header .student-info {
            font-size: 9pt;
            color: #666;
            line-height: 1.4;
          }
          .summary-overview {
            background: white;
            padding: 0;
          }
          .summary-overview h2 {
            font-size: 18pt;
            margin-bottom: 0.75rem;
            color: #333;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 0.25rem;
            page-break-after: avoid;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            column-gap: 1.5rem;
          }
          .summary-group {
            page-break-inside: avoid;
            margin-bottom: 0.75rem;
          }
          .summary-group-title {
            font-size: 13pt;
            margin-bottom: 0.5rem;
            color: #555;
            font-weight: 600;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 0.15rem;
          }
          .compact-list {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.45rem 0.65rem;
            background: #f9f9f9;
            border-radius: 3px;
            border-left: 2px solid #3b82f6;
            font-size: 11.5pt;
            page-break-inside: avoid;
            line-height: 1.4;
          }
          .summary-item.excellent {
            border-left-color: #10b981;
            background: #f0fdf4;
          }
          .summary-item.good {
            border-left-color: #3b82f6;
            background: #eff6ff;
          }
          .summary-item.fair {
            border-left-color: #f59e0b;
            background: #fffbeb;
          }
          .summary-item.needs-improvement {
            border-left-color: #f97316;
            background: #fff7ed;
          }
          .summary-item.poor {
            border-left-color: #ef4444;
            background: #fef2f2;
          }
          .standard-info {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
            min-width: 120px;
            flex: 1;
          }
          .standard-name {
            font-weight: 600;
            color: #333;
            font-size: 12pt;
            line-height: 1.4;
          }
          .standard-code-small {
            font-size: 10.5pt;
            color: #666;
            font-weight: 500;
            font-family: 'Courier New', monospace;
            line-height: 1.3;
          }
          .standard-code {
            font-size: 12pt;
            color: #333;
            font-weight: 600;
            line-height: 1.4;
          }
          .score-info {
            color: #666;
            font-family: 'Courier New', monospace;
            font-size: 11.5pt;
            white-space: nowrap;
            margin-left: 0.5rem;
          }
          .score-info strong {
            font-weight: 700;
            color: #333;
          }
          .missing-assessments {
            margin-bottom: 0.5rem;
            padding: 0.45rem 0.65rem;
            background: #fff3cd;
            border-left: 3px solid #ffc107;
            border-radius: 3px;
            color: #856404;
            font-size: 11pt;
            page-break-inside: avoid;
            line-height: 1.5;
          }
          .missing-assessments strong {
            color: #856404;
          }
          .empty-state-small {
            text-align: left;
            padding: 0.25rem 0;
            color: #999;
            font-size: 8.5pt;
            font-style: italic;
          }
          .print-button {
            display: none !important;
          }
          @media print {
            .print-button {
              display: none !important;
            }
            .summary-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            @page {
              margin: 0.5in;
            }
            .student-summary-page {
              page-break-after: always !important;
              page-break-inside: avoid !important;
            }
            .student-summary-page:last-child {
              page-break-after: auto !important;
            }
          }
          @media print and (orientation: landscape) {
            .summary-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        </style>
      </head>
      <body>
        ${summaryHTMLs.map((summary, index) => `
          <div class="student-summary-page">
            <div class="print-header">
              <h1>Student Summary - ${summary.studentName}</h1>
              <div class="student-info">
                Period: ${periodInfo}<br>
                Generated: ${new Date().toLocaleString()}
              </div>
            </div>
            <div class="summary-overview">
              ${summary.html}
            </div>
          </div>
        `).join('')}
      </body>
    </html>
  `;

  // Open single print window with all summaries - use unique name to prevent multiple windows
  const printWindowName = `bulk_print_${Date.now()}`;
  const printWindow = window.open('', printWindowName);
  if (!printWindow) {
    alert('Please allow popups to print summaries');
    printingSummaries.value = false;
    return;
  }

  printWindow.document.write(combinedHTML);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printingSummaries.value = false;
      console.log(`🎉 Bulk print complete! Print dialog should now be open with all ${summaryHTMLs.length} student summaries.`);
    }, 1000); // Increased delay to ensure content is fully rendered
  };
};

onMounted(() => {
  loadGradebookData();
});
</script>

<style scoped>
.gradebook {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.gradebook-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.gradebook-header .header-content {
  flex: 1;
  min-width: 300px;
  text-align: left;
}

.gradebook-header .header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.gradebook-header h1 {
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.gradebook-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.bulk-print-button {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.bulk-print-button:hover {
  background: #2563eb;
}

.info-note {
  margin: 0.5rem 0;
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
}

.info-note a {
  color: #2563eb;
  text-decoration: underline;
}

.info-note a:hover {
  color: #1d4ed8;
}

.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: end;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.view-mode-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 250px;
}

.view-mode-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.2s;
}

.radio-option:hover {
  background: #f3f4f6;
}

.radio-option input[type="radio"] {
  margin: 0;
}

.radio-label {
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.filter-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.export-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.export-btn {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  height: fit-content;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3);
}

.export-btn.aeries-btn {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.export-btn.aeries-btn:hover {
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
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

.error {
  text-align: center;
  padding: 40px 20px;
  background: #fef2f2;
  border-radius: 12px;
  border: 1px solid #fecaca;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 15px;
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 1000px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #495057;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
}

.close-button:hover {
  color: #495057;
}

.modal-body {
  padding: 0;
}

.class-group {
  margin-bottom: 50px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
}

.class-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.student-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.gradebook-table-wrapper {
  overflow-x: auto;
  padding: 0;
}

.gradebook-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.gradebook-table th,
.gradebook-table td {
  padding: 12px 8px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.student-name-col {
  min-width: 200px;
  text-align: left !important;
  position: sticky;
  left: 0;
  background: #f9fafb;
  z-index: 10;
}

.assessment-col {
  min-width: 140px;
  max-width: 170px;
}

.average-col {
  min-width: 80px;
  background: #f9fafb;
  font-weight: 600;
}

.assessment-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.assessment-title {
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.2;
  max-width: 120px;
  word-wrap: break-word;
}

.assessment-category {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
}

.assessment-category.hw { background: #dbeafe; color: #1e40af; }
.assessment-category.assign { background: #dcfce7; color: #166534; }
.assessment-category.esa { background: #fef3c7; color: #92400e; }
.assessment-category.sa { background: #fde2e8; color: #be185d; }
.assessment-category.pa { background: #e0e7ff; color: #3730a3; }
.assessment-category.other { background: #f3f4f6; color: #374151; }

.assessment-points {
  font-size: 0.7rem;
  color: #6b7280;
}

.student-row:hover {
  background: #f9fafb;
}

.student-name-cell {
  text-align: left !important;
  position: sticky;
  left: 0;
  background: inherit;
  z-index: 5;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name-link {
  text-decoration: none;
  color: #1f2937;
  transition: color 0.2s ease;
}

.student-name-link:hover {
  color: #3b82f6;
  text-decoration: underline;
}

.student-name-link strong {
  color: inherit;
  font-size: 0.9rem;
}

.student-info strong {
  color: #1f2937;
  font-size: 0.9rem;
}

.student-info small {
  color: #6b7280;
  font-size: 0.75rem;
}

.score-cell {
  padding: 8px 4px;
}

.score-container {
  display: flex;
  justify-content: center;
}

.score {
  padding: 6px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.1;
}

.score-fraction {
  font-size: 0.75rem;
  opacity: 0.9;
}

.score-percentage {
  font-size: 0.8rem;
  font-weight: 700;
}

.score:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.score.excellent { background: #dcfce7; color: #166534; }
.score.good { background: #dbeafe; color: #1e40af; }
.score.fair { background: #fef3c7; color: #92400e; }
.score.poor { background: #fed7d7; color: #c53030; }
.score.failing { background: #fef2f2; color: #dc2626; }

.no-score {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.8rem;
}

.average-cell {
  background: #f9fafb;
}

.average-score {
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9rem;
}

/* Standards View Styles */
.standards-table .standard-col {
  min-width: 100px;
  max-width: 120px;
}

.standard-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.standard-title {
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.2;
  text-align: center;
}

.standard-title.custom-standard {
  color: #667eea; /* Blue for custom standards */
}

.standard-title.ccss-standard {
  color: #28a745; /* Green for CCSS standards */
}

.standard-info {
  font-size: 0.7rem;
  color: #6b7280;
  font-style: italic;
}

.standard-cell {
  padding: 8px 4px;
}

.standard-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.mastery-score {
  padding: 4px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 40px;
  text-align: center;
}

.mastery-score.mastered {
  background: #dcfce7;
  color: #166534;
  border: 2px solid #10b981;
}

.mastery-score.proficient {
  background: #dbeafe;
  color: #1e40af;
}

.mastery-score.developing {
  background: #fef3c7;
  color: #92400e;
}

.mastery-score.beginning {
  background: #fef2f2;
  color: #dc2626;
}

.mastery-percentage {
  font-size: 0.7rem;
  color: #6b7280;
}

.mastery-col {
  min-width: 80px;
  background: #f9fafb;
  font-weight: 600;
}

.overall-mastery {
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9rem;
}

.class-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 25px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #6b7280;
  font-size: 0.8rem;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-weight: bold;
  font-size: 1.1rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.7;
}

.no-data h3 {
  color: #1f2937;
  margin-bottom: 10px;
}

.no-data p {
  color: #6b7280;
  margin-bottom: 20px;
}

.clear-filters-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.clear-filters-btn:hover {
  background: #4b5563;
}

@media (max-width: 1024px) {
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: auto;
  }

  .gradebook-table {
    font-size: 0.8rem;
  }

  .gradebook-table th,
  .gradebook-table td {
    padding: 8px 4px;
  }

  .student-name-col {
    min-width: 150px;
  }

  .assessment-col {
    min-width: 80px;
  }

  .class-stats {
    flex-direction: column;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .gradebook {
    padding: 15px;
  }

  .gradebook-table {
    font-size: 0.75rem;
  }

  .assessment-title {
    font-size: 0.7rem;
  }

  .student-info strong {
    font-size: 0.8rem;
  }

  .student-info small {
    font-size: 0.7rem;
  }
}

/* Manual Score Dialog Styles */
.no-score.clickable {
  cursor: pointer;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  border: 1px dashed #d1d5db;
  font-weight: 500;
}

.no-score.clickable:hover {
  background: #f3f4f6;
  color: #374151;
  border-color: #9ca3af;
  transform: scale(1.05);
}

.score-dialog-overlay {
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
}

.score-dialog {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  min-width: 600px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.score-dialog h3 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 1.5rem;
  text-align: center;
}

.dialog-content p {
  margin: 8px 0;
  color: #374151;
  font-size: 1rem;
}

.dialog-content p strong {
  color: #1f2937;
  font-weight: 600;
}

.score-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.score-input-group label {
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
}

.score-input-group input {
  padding: 12px 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  width: 100px;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  transition: border-color 0.2s;
}

.score-input-group input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.total-points {
  font-size: 1.1rem;
  font-weight: 600;
  color: #6b7280;
}

/* Enhanced Dialog Styles */
.dialog-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.score-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.current-total {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1f2937;
}

.percentage {
  font-weight: 600;
  color: #059669;
  font-size: 1rem;
}

.questions-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.question-item {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  margin: 0;
}

.question-item:last-child {
  border-bottom: none;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-number {
  background: #059669;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 32px;
  text-align: center;
}

.question-points {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
}

.question-standard {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.75rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-text {
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.score-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input label {
  font-weight: 600;
  color: #374151;
  min-width: 50px;
}

.question-score-input {
  padding: 8px 12px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  width: 80px;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  transition: border-color 0.2s;
}

.question-score-input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.max-points {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.9rem;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn, .save-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.save-btn {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  border: none;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3);
}

.save-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Standard metadata badges */
.standard-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 4px 0;
}

.app-category-badge {
  background: #e3f2fd;
  color: #1565c0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  text-align: center;
}

.max-score-badge {
  background: #fff3cd;
  color: #856404;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
}

/* App Category Filter Styles */
.app-category-filters {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: block;
}

.category-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.category-filter-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.category-filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Assessment Category Filter Styles */
.assessment-category-filters {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

/* Color code assessment category buttons to match their badge colors */
.assessment-cat-btn.cat-esa {
  border-color: #fbbf24;
}

.assessment-cat-btn.cat-esa:hover {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.assessment-cat-btn.cat-esa.active {
  background: #fbbf24;
  border-color: #f59e0b;
  color: #78350f;
}

.assessment-cat-btn.cat-sa {
  border-color: #f472b6;
}

.assessment-cat-btn.cat-sa:hover {
  background: #fce7f3;
  border-color: #ec4899;
  color: #be185d;
}

.assessment-cat-btn.cat-sa.active {
  background: #f472b6;
  border-color: #ec4899;
  color: #831843;
}

.assessment-cat-btn.cat-hw {
  border-color: #60a5fa;
}

.assessment-cat-btn.cat-hw:hover {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.assessment-cat-btn.cat-hw.active {
  background: #60a5fa;
  border-color: #3b82f6;
  color: #1e3a8a;
}

.assessment-cat-btn.cat-assign {
  border-color: #34d399;
}

.assessment-cat-btn.cat-assign:hover {
  background: #d1fae5;
  border-color: #10b981;
  color: #065f46;
}

.assessment-cat-btn.cat-assign.active {
  background: #34d399;
  border-color: #10b981;
  color: #064e3b;
}

/* Sticky Header Styles */
.gradebook-table-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  margin-bottom: 2rem;
  max-height: 70vh; /* Limit height to enable sticky behavior */
  overflow-y: auto;
  position: relative;
}

.gradebook-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sticky-header th {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
  vertical-align: top;
}

.student-name-col {
  min-width: 200px;
  text-align: left !important;
  position: sticky;
  left: 0;
  background: #f8f9fa;
  z-index: 11;
}

.assessment-col,
.standard-col {
  min-width: 120px;
  max-width: 150px;
}

.average-col,
.mastery-col {
  min-width: 80px;
  background: #f8f9fa;
  position: sticky;
  right: 0;
  z-index: 11;
}

/* Student row styles for sticky columns */
.student-row td.student-name-cell {
  position: sticky;
  left: 0;
  background: white;
  z-index: 9;
  border-right: 1px solid #dee2e6;
}

.student-row td.average-cell,
.student-row td.mastery-cell {
  position: sticky;
  right: 0;
  background: white;
  z-index: 9;
  border-left: 1px solid #dee2e6;
}

.student-row {
  border-bottom: 1px solid #dee2e6;
}

.student-row td {
  padding: 0.75rem 0.5rem;
  text-align: center;
  vertical-align: middle;
}

.student-info {
  text-align: left;
  line-height: 1.4;
}

.student-info strong {
  display: block;
  color: #495057;
}

.student-info small {
  color: #6c757d;
  font-size: 0.8rem;
}
</style>
