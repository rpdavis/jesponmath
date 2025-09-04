<template>
  <div class="gradebook">
    <div class="gradebook-header">
      <h1>📊 Gradebook</h1>
      <p>Track student progress across all assessment categories</p>
    </div>

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
          <option value="PA">Progress Assessment (PA)</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <button @click="exportGradebook" class="export-btn">
        📤 Export CSV
      </button>
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
            <thead>
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
                    <strong>{{ student.lastName }}, {{ student.firstName }}</strong>
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
                        {{ getStudentScore(student.uid, assessment.id)?.percentage || 0 }}%
                      </div>
                    </span>
                    <span v-else class="no-score">-</span>
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
              <thead>
                <tr>
                  <th class="student-name-col">Student</th>
                  <th v-for="standard in group.standards" :key="standard" class="standard-col" :title="standard">
                    <div class="standard-header">
                      <span class="standard-title">{{ standard }}</span>
                      <span class="standard-info">Correct/Total</span>
                    </div>
                  </th>
                  <th class="mastery-col">Mastery</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in group.students" :key="student.uid" class="student-row">
                  <td class="student-name-cell">
                    <div class="student-info">
                      <strong>{{ student.lastName }}, {{ student.firstName }}</strong>
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
                        {{ getStandardScore(student.uid, standard).percentage }}%
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getStudentsByTeacher } from '@/firebase/userServices';
import { getAssessmentsByTeacher, getAssessmentResults } from '@/firebase/iepServices';
import { parseStandards, groupQuestionsByStandards, getAllStandardsFromQuestions } from '@/utils/standardsUtils';
import type { Student } from '@/types/users';
import type { Assessment, AssessmentResult } from '@/types/iep';

const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(true);
const error = ref('');
const students = ref<Student[]>([]);
const assessments = ref<Assessment[]>([]);
const assessmentResults = ref<AssessmentResult[]>([]);

// View mode and filters
const viewMode = ref('assignments'); // 'assignments' or 'standards'
const selectedClass = ref('');
const selectedPeriod = ref('');
const selectedCategory = ref('');

// Computed properties
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
  return assessments.value.filter(assessment => {
    if (selectedCategory.value && assessment.category !== selectedCategory.value) return false;
    return true;
  });
});

// Get unique standards from all assessments
const uniqueStandards = computed(() => {
  const allQuestions = filteredAssessments.value.flatMap(assessment => [
    // Include assessment-level standard as a pseudo-question
    ...(assessment.standard ? [{ standard: assessment.standard }] : []),
    // Include all questions
    ...(assessment.questions || [])
  ]);
  
  return getAllStandardsFromQuestions(allQuestions);
});

// Group students by class and period
const filteredGroups = computed(() => {
  const groups = new Map<string, {
    key: string;
    className: string;
    period: string;
    students: Student[];
    assessments: Assessment[];
    standards: string[];
  }>();

  // Group students by Google Classroom course (prioritize Google Classroom fields)
  filteredStudents.value.forEach(student => {
    const className = student.courseName || student.className || 'No Class';
    const period = student.section || student.period || 'No Period';
    const courseId = student.courseId || 'no-course';
    const key = `${courseId}-${className}-${period}`; // Use courseId for better grouping
    
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        className,
        period,
        students: [],
        assessments: filteredAssessments.value,
        standards: uniqueStandards.value
      });
    }
    
    groups.get(key)!.students.push(student);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.className !== b.className) {
      return a.className.localeCompare(b.className);
    }
    return a.period.localeCompare(b.period);
  });
});

// Methods
const loadGradebookData = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    if (!authStore.currentUser?.uid) {
      throw new Error('User not authenticated');
    }
    
    console.log('📊 Loading gradebook data...');
    
    // Load teacher's students and assessments
    const [teacherStudents, teacherAssessments] = await Promise.all([
      getStudentsByTeacher(authStore.currentUser.uid),
      getAssessmentsByTeacher(authStore.currentUser.uid)
    ]);
    
    students.value = teacherStudents;
    assessments.value = teacherAssessments;
    
    console.log('👥 Loaded students:', students.value.length);
    console.log('📝 Loaded assessments:', assessments.value.length);
    
    // Debug student UIDs
    students.value.forEach(student => {
      console.log(`👤 Student: ${student.firstName} ${student.lastName}, UID: ${student.uid}, Google ID: ${student.googleId}, Course: ${student.courseName}`);
    });
    
    // Debug assessment IDs
    teacherAssessments.forEach(assessment => {
      console.log(`📝 Assessment: ${assessment.title}, ID: ${assessment.id}, CreatedBy: ${assessment.createdBy}`);
    });
    
    // Load all assessment results for these assessments
    const resultsPromises = teacherAssessments.map(assessment => 
      getAssessmentResults(assessment.id)
    );
    
    const allResults = await Promise.all(resultsPromises);
    assessmentResults.value = allResults.flat();
    
    console.log('📊 Loaded assessment results:', assessmentResults.value.length);
    
    // Debug assessment results
    assessmentResults.value.forEach(result => {
      console.log(`📊 Result: AssessmentID: ${result.assessmentId}, StudentSeisId: ${result.studentSeisId}, StudentUid: ${result.studentUid || 'N/A'}, Score: ${result.percentage}%`);
    });
    
  } catch (err: any) {
    console.error('❌ Error loading gradebook:', err);
    error.value = err.message || 'Failed to load gradebook data';
  } finally {
    loading.value = false;
  }
};

const getStudentScore = (studentUid: string, assessmentId: string) => {
  // Try to find by both studentSeisId and studentUid for compatibility
  const result = assessmentResults.value.find(result => 
    (result.studentSeisId === studentUid || result.studentUid === studentUid) && 
    result.assessmentId === assessmentId
  );
  
  console.log(`🔍 Looking for score - StudentUID: ${studentUid}, AssessmentID: ${assessmentId}, Found:`, result ? 'YES' : 'NO');
  if (result) {
    console.log('📊 Score details:', { percentage: result.percentage, score: result.score, totalPoints: result.totalPoints });
  }
  
  return result;
};

const getStudentAverage = (studentUid: string): number => {
  const studentResults = assessmentResults.value.filter(result => 
    result.studentSeisId === studentUid || result.studentUid === studentUid
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
};

// Standards-based methods
const getStandardScore = (studentUid: string, standard: string) => {
  let correct = 0;
  let total = 0;
  
  // Find all questions for this standard across all assessments
  assessments.value.forEach(assessment => {
    // Check if assessment-level standard matches
    const assessmentStandards = parseStandards(assessment.standard);
    const assessmentCoversStandard = assessmentStandards.includes(standard);
    
    assessment.questions?.forEach(question => {
      // Check if question covers this standard (either through question-level or assessment-level standard)
      const questionStandards = parseStandards(question.standard);
      const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;
      
      if (questionCoversStandard) {
        total++;
        
        // Find student's result for this assessment
        const result = getStudentScore(studentUid, assessment.id);
        if (result) {
          // Find the response for this specific question
          const response = result.responses?.find(r => r.questionId === question.id);
          if (response && response.isCorrect) {
            correct++;
          }
        }
      }
    });
  });
  
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, percentage };
};

const getStandardMasteryClass = (scoreData: { correct: number; total: number; percentage: number }): string => {
  if (scoreData.correct >= 5) return 'mastered'; // Green if 5+ correct
  if (scoreData.percentage >= 80) return 'proficient';
  if (scoreData.percentage >= 60) return 'developing';
  return 'beginning';
};

const getStudentStandardsAverage = (studentUid: string): number => {
  const standardScores = uniqueStandards.value.map(standard => 
    getStandardScore(studentUid, standard).percentage
  ).filter(score => score > 0);
  
  if (standardScores.length === 0) return 0;
  
  const total = standardScores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / standardScores.length);
};

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
  text-align: center;
  margin-bottom: 40px;
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
</style>
