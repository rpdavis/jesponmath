<template>
  <div class="student-summary">
    <div class="summary-header">
      <div class="header-content">
        <h1>📊 Student Summary</h1>
        <p v-if="!isViewingOtherStudent">Complete overview of all assessment and progress data</p>
        <p v-else class="student-name-display">
          Viewing summary for: <strong>{{ studentDisplayName }}</strong>
        </p>
      </div>
      <div v-if="!loading && !error" class="header-filters">
        <div class="period-filter">
          <label for="period-select" class="filter-label">📅 Filter by Quarter:</label>
          <select
            id="period-select"
            v-model="selectedPeriodId"
            @change="onPeriodChange"
            class="period-select"
          >
            <option value="">All Quarters</option>
            <option
              v-for="period in periodsWithStatus"
              :key="period.id"
              :value="period.id"
            >
              {{ period.name }} {{ period.isActive ? '(Current)' : period.isFuture ? '(Future)' : '(Past)' }}
            </option>
          </select>
          <div v-if="selectedPeriod" class="period-info">
            {{ selectedPeriodDateRange }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading student data...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-if="!loading && !error" class="summary-content">
      <!-- ESA Section -->
      <section class="summary-section">
        <h2>📝 Essential Standards Assessment (ESA)</h2>
        <div class="two-column-layout">
          <!-- By Test View -->
          <div class="column by-test-column">
            <h3>By Test</h3>
            <div v-if="esaByTestData.length === 0 && esaMissingAssessments.length === 0" class="empty-state">
              <p>No ESA assessments assigned yet.</p>
            </div>
            <div v-else>
              <div v-if="esaMissingAssessments.length > 0" class="missing-assessments">
                <strong>Missing ESA:</strong> {{ esaMissingAssessments.join(', ') }}
              </div>
              <div v-if="esaByTestData.length > 0" class="compact-list">
                <div
                  v-for="item in esaByTestData"
                  :key="item.id"
                  class="compact-item"
                >
                  <span class="standard-code">{{ item.title }}</span>
                  <span class="score-info">
                    {{ item.correct }}/{{ item.total }} {{ item.percentage }}% ({{ item.attempts }} {{ item.attempts === 1 ? 'attempt' : 'attempts' }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- By Standard View -->
          <div class="column by-standard-column">
            <h3>By Standard</h3>
            <div v-if="esaStandardsData.length === 0 && esaMissingAssessments.length === 0" class="empty-state">
              <p>No ESA assessments assigned yet.</p>
            </div>
            <div v-else>
              <div v-if="esaMissingAssessments.length > 0" class="missing-assessments">
                <strong>Missing ESA:</strong> {{ esaMissingAssessments.join(', ') }}
              </div>
              <div v-if="esaStandardsData.length > 0" class="compact-list">
                <div
                  v-for="item in esaStandardsData"
                  :key="item.standard"
                  class="compact-item"
                >
                  <span class="standard-code">{{ item.standard }}</span>
                  <span class="score-info">
                    {{ item.correct }}/{{ item.total }} {{ item.percentage }}% ({{ item.attempts }} {{ item.attempts === 1 ? 'attempt' : 'attempts' }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Standard Assessment Section -->
      <section class="summary-section">
        <h2>📋 Standard Assessment (SA)</h2>
        <div class="two-column-layout">
          <!-- By Test View -->
          <div class="column by-test-column">
            <h3>By Test</h3>
            <div v-if="saByTestData.length === 0 && saMissingAssessments.length === 0" class="empty-state">
              <p>No Standard Assessments assigned yet.</p>
            </div>
            <div v-else>
              <div v-if="saMissingAssessments.length > 0" class="missing-assessments">
                <strong>missing:</strong> {{ saMissingAssessments.join(', ') }}
              </div>
              <div v-if="saByTestData.length > 0" class="compact-list">
                <div
                  v-for="item in saByTestData"
                  :key="item.id"
                  class="compact-item"
                >
                  <span class="standard-code">{{ item.title }}</span>
                  <span class="score-info">
                    {{ item.correct }}/{{ item.total }} {{ item.percentage }}% ({{ item.attempts }} {{ item.attempts === 1 ? 'attempt' : 'attempts' }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- By Standard View -->
          <div class="column by-standard-column">
            <h3>By Standard</h3>
            <div v-if="saStandardsData.length === 0 && saMissingAssessments.length === 0" class="empty-state">
              <p>No Standard Assessments assigned yet.</p>
            </div>
            <div v-else>
              <div v-if="saMissingAssessments.length > 0" class="missing-assessments">
                <strong>missing:</strong> {{ saMissingAssessments.join(', ') }}
              </div>
              <div v-if="saStandardsData.length > 0" class="compact-list">
                <div
                  v-for="item in saStandardsData"
                  :key="item.standard"
                  class="compact-item"
                >
                  <span class="standard-code">{{ item.standard }}</span>
                  <span class="score-info">
                    {{ item.correct }}/{{ item.total }} {{ item.percentage }}% ({{ item.attempts }} {{ item.attempts === 1 ? 'attempt' : 'attempts' }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PA (Practice Assessment) by Goal -->
      <section class="summary-section">
        <h2>🎯 Practice Assessment (PA) by Goal</h2>
        <div v-if="paByGoal.length === 0" class="empty-state">
          <p>No Practice Assessments assigned yet.</p>
        </div>
        <div v-else class="goals-grid">
          <div
            v-for="goalItem in paByGoal"
            :key="goalItem.goalId"
            class="goal-card"
          >
            <div class="goal-header">
              <h3 class="goal-title">{{ goalItem.goalTitle }}</h3>
              <span class="goal-area">{{ goalItem.areaOfNeed }}</span>
            </div>

            <div class="pa-summary">
              <div class="summary-stat">
                <span class="stat-label">Total PA Assigned:</span>
                <span class="stat-value">{{ goalItem.totalAssigned }}</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Total PA Completed:</span>
                <span class="stat-value">{{ goalItem.totalCompleted }}</span>
              </div>
              <div class="summary-stat">
                <span class="stat-label">Average Score:</span>
                <span
                  class="stat-value"
                  :class="goalItem.averageScore !== null ? getScoreClass(goalItem.averageScore) : ''"
                >
                  {{ goalItem.averageScore !== null ? `${goalItem.averageScore}%` : 'N/A' }}
                </span>
              </div>
            </div>

            <div class="pa-assessments-list">
              <h4>Practice Assessments:</h4>
              <div
                v-for="pa in goalItem.assessments"
                :key="pa.id"
                class="pa-assessment-item"
              >
                <div class="pa-header">
                  <span class="pa-name">{{ pa.title }}</span>
                  <span
                    v-if="pa.bestScore !== null"
                    class="score-badge"
                    :class="getScoreClass(pa.bestScore)"
                  >
                    {{ pa.bestScore }}%
                  </span>
                  <span v-else class="score-badge incomplete">Not Completed</span>
                </div>

                <div v-if="pa.results.length > 0" class="pa-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span>Best Score:</span>
                      <strong>{{ pa.bestScore }}%</strong>
                    </div>
                    <div class="detail-item">
                      <span>Attempts:</span>
                      <strong>{{ pa.results.length }}</strong>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span>Last Completed:</span>
                      <strong>{{ formatDate(pa.lastCompleted) }}</strong>
                    </div>
                    <div class="detail-item">
                      <span>Total Score:</span>
                      <strong>{{ pa.totalScore }}/{{ pa.totalPoints }}</strong>
                    </div>
                  </div>
                  <div class="all-scores" v-if="pa.results.length > 1">
                    <span class="scores-label">All Scores:</span>
                    <div class="scores-list">
                      <span
                        v-for="(result, idx) in pa.results"
                        :key="idx"
                        class="score-chip"
                        :class="getScoreClass(result.percentage)"
                      >
                        {{ result.percentage }}%
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="pa-status">
                  <span class="status-text">Assigned but not yet completed</span>
                </div>
              </div>
            </div>

            <!-- PA Practice Section (Placeholder for future) -->
            <div class="pa-practice-section">
              <h4>PA Practice</h4>
              <p class="placeholder-text">PA practice tracking will be set up later.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Fluency Data -->
      <section class="summary-section">
        <h2>🔢 Math Fluency Data</h2>
        <div v-if="fluencyData.length === 0" class="empty-state">
          <p>No fluency data available yet.</p>
        </div>
        <div v-else class="fluency-grid">
          <div
            v-for="operation in fluencyData"
            :key="operation.operation"
            class="fluency-card"
          >
            <div class="fluency-header">
              <h3 class="operation-title">{{ capitalizeOperation(operation.operation) }}</h3>
              <span
                class="status-badge"
                :class="{
                  'unlocked': operation.unlocked,
                  'completed': operation.completedOperation
                }"
              >
                {{ operation.completedOperation ? 'Completed' : operation.unlocked ? 'Unlocked' : 'Locked' }}
              </span>
            </div>

            <div class="fluency-stats">
              <div class="stat-row">
                <div class="stat-item">
                  <span class="stat-label">Proficiency:</span>
                  <span class="stat-value">{{ operation.proficiencyPercentage }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Mastery:</span>
                  <span class="stat-value">{{ operation.masteryPercentage }}%</span>
                </div>
              </div>

              <div class="stat-row">
                <div class="stat-item">
                  <span class="stat-label">Total Practice Days:</span>
                  <span class="stat-value">{{ operation.totalPracticeDays }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Consecutive Days:</span>
                  <span class="stat-value">{{ operation.consecutivePracticeDays }}</span>
                </div>
              </div>

              <div class="proficiency-distribution">
                <h4>Proficiency Distribution</h4>
                <div class="distribution-bars">
                  <div class="dist-item">
                    <span class="dist-label">Mastered:</span>
                    <div class="dist-bar">
                      <div
                        class="dist-fill mastered"
                        :style="{ width: `${(operation.proficiencyDistribution.mastered / operation.proficiencyDistribution.total) * 100}%` }"
                      ></div>
                      <span class="dist-count">{{ operation.proficiencyDistribution.mastered }}</span>
                    </div>
                  </div>
                  <div class="dist-item">
                    <span class="dist-label">Proficient:</span>
                    <div class="dist-bar">
                      <div
                        class="dist-fill proficient"
                        :style="{ width: `${(operation.proficiencyDistribution.proficient / operation.proficiencyDistribution.total) * 100}%` }"
                      ></div>
                      <span class="dist-count">{{ operation.proficiencyDistribution.proficient }}</span>
                    </div>
                  </div>
                  <div class="dist-item">
                    <span class="dist-label">Approaching:</span>
                    <div class="dist-bar">
                      <div
                        class="dist-fill approaching"
                        :style="{ width: `${(operation.proficiencyDistribution.approaching / operation.proficiencyDistribution.total) * 100}%` }"
                      ></div>
                      <span class="dist-count">{{ operation.proficiencyDistribution.approaching }}</span>
                    </div>
                  </div>
                  <div class="dist-item">
                    <span class="dist-label">Emerging:</span>
                    <div class="dist-bar">
                      <div
                        class="dist-fill emerging"
                        :style="{ width: `${(operation.proficiencyDistribution.emerging / operation.proficiencyDistribution.total) * 100}%` }"
                      ></div>
                      <span class="dist-count">{{ operation.proficiencyDistribution.emerging }}</span>
                    </div>
                  </div>
                  <div class="dist-item">
                    <span class="dist-label">Does Not Know:</span>
                    <div class="dist-bar">
                      <div
                        class="dist-fill does-not-know"
                        :style="{ width: `${(operation.proficiencyDistribution.doesNotKnow / operation.proficiencyDistribution.total) * 100}%` }"
                      ></div>
                      <span class="dist-count">{{ operation.proficiencyDistribution.doesNotKnow }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="operation.lastAssessmentScore !== null" class="assessment-info">
                <div class="assessment-stat">
                  <span class="stat-label">Last Assessment Score:</span>
                  <span class="stat-value">{{ operation.lastAssessmentScore }} CPM</span>
                </div>
                <div class="assessment-stat" v-if="operation.lastAssessmentDate">
                  <span class="stat-label">Last Assessment Date:</span>
                  <span class="stat-value">{{ formatDate(operation.lastAssessmentDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import { useGlobalAcademicPeriods } from '@/composables/useAcademicPeriods';
import { getAssessmentResultsByStudent, getAssessmentsByStudent } from '@/firebase/iepServices';
import { getGoalsByStudent } from '@/firebase/goalServices';
import { getAllFluencyProgress } from '@/services/mathFluencyServices';
import { getStudent } from '@/firebase/userServices';
import { parseStandards, getAllStandardsFromQuestions } from '@/utils/standardsUtils';
import type { Assessment, AssessmentResult } from '@/types/iep';
import type { Goal } from '@/types/iep';
import type { MathFluencyProgress } from '@/types/mathFluency';
import type { Student } from '@/types/users';

const route = useRoute();
const authStore = useAuthStore();
const permissions = usePermissions();

// Academic period management
const {
  filterAssessments,
  filterResults,
  selectedPeriod,
  periodsWithStatus,
  selectedPeriodDateRange,
  selectPeriod,
  currentAcademicYear
} = useGlobalAcademicPeriods();

// Period selector state
const selectedPeriodId = ref<string>('');

// Watch for period changes and update selectedPeriodId
watch(selectedPeriod, (newPeriod) => {
  if (newPeriod) {
    selectedPeriodId.value = newPeriod.id;
  } else {
    selectedPeriodId.value = '';
  }
}, { immediate: true });

// Handle period selection change
const onPeriodChange = () => {
  if (!selectedPeriodId.value) {
    // "All Quarters" selected - we'll handle this in filtered computed properties
    // by checking selectedPeriodId instead of selectedPeriod
  } else {
    // Find and select the period
    const period = periodsWithStatus.value.find(p => p.id === selectedPeriodId.value);
    if (period) {
      selectPeriod(period);
    }
  }
};

// Get studentUid from route params (for teacher view) or use current user (for student view)
const targetStudentUid = computed(() => {
  const paramUid = route.params.studentUid as string | undefined;
  // If param exists and user is teacher/admin, use it; otherwise use current user
  if (paramUid && (permissions.isTeacher || permissions.isAdmin)) {
    return paramUid;
  }
  return authStore.currentUser?.uid || authStore.currentUser?.googleId || authStore.currentUser?.seisId;
});

// State
const loading = ref(true);
const error = ref('');
const assessments = ref<Assessment[]>([]);
const assessmentResults = ref<AssessmentResult[]>([]);
const goals = ref<Goal[]>([]);
const fluencyData = ref<MathFluencyProgress[]>([]);
const studentInfo = ref<Student | null>(null);

// Computed: Check if viewing another student's summary
const isViewingOtherStudent = computed(() => {
  const paramUid = route.params.studentUid as string | undefined;
  return !!(paramUid && (permissions.isTeacher || permissions.isAdmin));
});

// Computed: Student display name
const studentDisplayName = computed(() => {
  if (studentInfo.value) {
    return `${studentInfo.value.firstName} ${studentInfo.value.lastName}`;
  }
  if (authStore.currentUser) {
    return authStore.currentUser.displayName || 'Student';
  }
  return 'Student';
});

// Helper: Extract standard code from assessment title (e.g., "ESA 2.1" from "ESA C4 2.1" or "ESA 2.1")
const extractStandardCode = (title: string, category: string): string => {
  // Try to extract standard code from title
  // Patterns: "ESA 2.1", "ESA C4 2.1", "CH1.1", "SD 2", "c12", "c13", etc.
  const titleUpper = title.toUpperCase().trim();

  // Remove category prefix if present (e.g., "ESA " or "SA ")
  let cleaned = titleUpper.replace(new RegExp(`^${category}\\s+`, 'i'), '');

  // Try multiple patterns in order of specificity:

  // Pattern 1: Letter(s) followed by number with optional decimal (e.g., "CH1.1", "SD2", "C12")
  const letterNumberPattern = /([A-Z]+\d+(?:\.\d+)?)/;
  let match = cleaned.match(letterNumberPattern);
  if (match) {
    return match[1];
  }

  // Pattern 2: Number dot number (e.g., "2.1", "2.2")
  const numberDotNumberPattern = /(\d+\.\d+)/;
  match = cleaned.match(numberDotNumberPattern);
  if (match) {
    return match[1];
  }

  // Pattern 3: Just a number (e.g., "2")
  const numberPattern = /(\d+)/;
  match = cleaned.match(numberPattern);
  if (match) {
    return match[1];
  }

  // Fallback: try to extract from original title (before removing category)
  match = titleUpper.match(letterNumberPattern);
  if (match) {
    return match[1];
  }

  match = titleUpper.match(numberDotNumberPattern);
  if (match) {
    return match[1];
  }

  // Last resort: return a shortened version of title
  return title.length > 20 ? title.substring(0, 20) + '...' : title;
};

// Computed: ESA Compact Data
const esaCompactData = computed(() => {
  const esaAssessments = assessments.value.filter(a => a.category === 'ESA');
  const esaResults = assessmentResults.value.filter(r => {
    const assessment = esaAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Group by standard code extracted from title
  const standardMap = new Map<string, {
    standardCode: string;
    correct: number;
    total: number;
    percentage: number;
    attempts: number;
  }>();

  esaAssessments.forEach(assessment => {
    const standardCode = extractStandardCode(assessment.title, 'ESA');
    const results = esaResults.filter(r => r.assessmentId === assessment.id);

    if (results.length > 0) {
      // Get best result
      const bestResult = results.reduce((best, r) => r.percentage > best.percentage ? r : best);

      if (!standardMap.has(standardCode)) {
        standardMap.set(standardCode, {
          standardCode,
          correct: bestResult.score,
          total: bestResult.totalPoints,
          percentage: bestResult.percentage,
          attempts: results.length
        });
      } else {
        // Update with best score if better
        const existing = standardMap.get(standardCode)!;
        if (bestResult.percentage > existing.percentage) {
          existing.correct = bestResult.score;
          existing.total = bestResult.totalPoints;
          existing.percentage = bestResult.percentage;
        }
        existing.attempts += results.length;
      }
    }
  });

  return Array.from(standardMap.values()).sort((a, b) => {
    // Sort by standard code (natural sort)
    return a.standardCode.localeCompare(b.standardCode, undefined, { numeric: true, sensitivity: 'base' });
  });
});

// Computed: ESA By Test Data (compact format showing individual assessments)
const esaByTestData = computed(() => {
  const esaAssessments = filteredAssessments.value.filter(a => a.category === 'ESA');
  const esaResults = filteredAssessmentResults.value.filter(r => {
    const assessment = esaAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  return esaAssessments
    .map(assessment => {
      const results = esaResults.filter(r => r.assessmentId === assessment.id);

      if (results.length > 0) {
        // Get best result
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
      return null; // Filter out incomplete assessments
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      // Sort by title (natural sort)
      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });
});

// Computed: ESA Missing Assessments
const esaMissingAssessments = computed(() => {
  const esaAssessments = filteredAssessments.value.filter(a => a.category === 'ESA');
  const esaResults = filteredAssessmentResults.value.filter(r => {
    const assessment = esaAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Find assessments with no results
  const missing = esaAssessments
    .filter(assessment => !esaResults.some(r => r.assessmentId === assessment.id))
    .map(assessment => extractStandardCode(assessment.title, 'ESA'))
    .filter((code, index, arr) => arr.indexOf(code) === index); // Remove duplicates

  return missing.sort();
});

// Computed: ESA Standards Data (using same logic as StudentResults.vue)
const esaStandardsData = computed(() => {
  const esaAssessments = filteredAssessments.value.filter(a => a.category === 'ESA');
  const esaResults = filteredAssessmentResults.value.filter(r => {
    const assessment = esaAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Get all standards from ESA assessments (same logic as StudentResults.vue)
  const allQuestions = esaAssessments.flatMap(assessment => [
    // Include assessment-level standard as a pseudo-question
    ...(assessment.standard ? [{ standard: assessment.standard }] : []),
    // Include all questions
    ...(assessment.questions || [])
  ]);

  const uniqueStandards = getAllStandardsFromQuestions(allQuestions);

  // Calculate score for each standard
  const standardsMap = new Map<string, {
    standard: string;
    correct: number;
    total: number;
    percentage: number;
    attempts: number;
  }>();

  uniqueStandards.forEach(standard => {
    // Collect all question attempts for this standard
    const questionAttempts: { isCorrect: boolean; score: number }[] = [];

    esaAssessments.forEach(assessment => {
      // Check if student has results for this assessment
      const result = esaResults.find(r => r.assessmentId === assessment.id);
      if (!result) return;

      // Check if assessment-level standard matches
      const assessmentStandards = parseStandards(assessment.standard || '');
      const assessmentCoversStandard = assessmentStandards.includes(standard);

      assessment.questions?.forEach((question: any) => {
        // Check if question covers this standard
        const questionStandards = parseStandards(question.standard || '');
        const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;

        if (questionCoversStandard) {
          // Find the response for this specific question
          const response = result.responses?.find((r: any) => r.questionId === question.id);
          if (response) {
            questionAttempts.push({
              isCorrect: response.isCorrect,
              score: response.pointsEarned || (response.isCorrect ? (question.points || 1) : 0)
            });
          }
        }
      });
    });

    if (questionAttempts.length > 0) {
      const correct = questionAttempts.filter(attempt => attempt.isCorrect).length;
      const total = questionAttempts.length;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Count total attempts (number of times this standard was assessed)
      const attempts = esaResults.filter(r => {
        const assessment = esaAssessments.find(a => a.id === r.assessmentId);
        if (!assessment) return false;

        const assessmentStandards = parseStandards(assessment.standard || '');
        if (assessmentStandards.includes(standard)) return true;

        return assessment.questions?.some((q: any) => {
          const questionStandards = parseStandards(q.standard || '');
          return questionStandards.includes(standard);
        });
      }).length;

      standardsMap.set(standard, {
        standard,
        correct,
        total,
        percentage,
        attempts
      });
    }
  });

  return Array.from(standardsMap.values()).sort((a, b) => {
    return a.standard.localeCompare(b.standard, undefined, { numeric: true, sensitivity: 'base' });
  });
});

// Computed: SA Compact Data
const saCompactData = computed(() => {
  const saAssessments = assessments.value.filter(a => a.category === 'SA');
  const saResults = assessmentResults.value.filter(r => {
    const assessment = saAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Group by standard code extracted from title
  const standardMap = new Map<string, {
    standardCode: string;
    correct: number;
    total: number;
    percentage: number;
    attempts: number;
  }>();

  saAssessments.forEach(assessment => {
    const standardCode = extractStandardCode(assessment.title, 'SA');
    const results = saResults.filter(r => r.assessmentId === assessment.id);

    if (results.length > 0) {
      // Get best result
      const bestResult = results.reduce((best, r) => r.percentage > best.percentage ? r : best);

      if (!standardMap.has(standardCode)) {
        standardMap.set(standardCode, {
          standardCode,
          correct: bestResult.score,
          total: bestResult.totalPoints,
          percentage: bestResult.percentage,
          attempts: results.length
        });
      } else {
        // Update with best score if better
        const existing = standardMap.get(standardCode)!;
        if (bestResult.percentage > existing.percentage) {
          existing.correct = bestResult.score;
          existing.total = bestResult.totalPoints;
          existing.percentage = bestResult.percentage;
        }
        existing.attempts += results.length;
      }
    }
  });

  return Array.from(standardMap.values()).sort((a, b) => {
    // Sort by standard code (natural sort)
    return a.standardCode.localeCompare(b.standardCode, undefined, { numeric: true, sensitivity: 'base' });
  });
});

// Computed: SA By Test Data (compact format showing individual assessments)
const saByTestData = computed(() => {
  const saAssessments = filteredAssessments.value.filter(a => a.category === 'SA');
  const saResults = filteredAssessmentResults.value.filter(r => {
    const assessment = saAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  return saAssessments
    .map(assessment => {
      const results = saResults.filter(r => r.assessmentId === assessment.id);

      if (results.length > 0) {
        // Get best result
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
      return null; // Filter out incomplete assessments
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      // Sort by title (natural sort)
      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });
});

// Computed: SA Missing Assessments
const saMissingAssessments = computed(() => {
  const saAssessments = filteredAssessments.value.filter(a => a.category === 'SA');
  const saResults = filteredAssessmentResults.value.filter(r => {
    const assessment = saAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Find assessments with no results
  const missing = saAssessments
    .filter(assessment => !saResults.some(r => r.assessmentId === assessment.id))
    .map(assessment => extractStandardCode(assessment.title, 'SA'))
    .filter((code, index, arr) => arr.indexOf(code) === index); // Remove duplicates

  return missing.sort();
});

// Computed: SA Standards Data (using same logic as StudentResults.vue)
const saStandardsData = computed(() => {
  const saAssessments = filteredAssessments.value.filter(a => a.category === 'SA');
  const saResults = filteredAssessmentResults.value.filter(r => {
    const assessment = saAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Get all standards from SA assessments (same logic as StudentResults.vue)
  const allQuestions = saAssessments.flatMap(assessment => [
    // Include assessment-level standard as a pseudo-question
    ...(assessment.standard ? [{ standard: assessment.standard }] : []),
    // Include all questions
    ...(assessment.questions || [])
  ]);

  const uniqueStandards = getAllStandardsFromQuestions(allQuestions);

  // Calculate score for each standard
  const standardsMap = new Map<string, {
    standard: string;
    correct: number;
    total: number;
    percentage: number;
    attempts: number;
  }>();

  uniqueStandards.forEach(standard => {
    // Collect all question attempts for this standard
    const questionAttempts: { isCorrect: boolean; score: number }[] = [];

    saAssessments.forEach(assessment => {
      // Check if student has results for this assessment
      const result = saResults.find(r => r.assessmentId === assessment.id);
      if (!result) return;

      // Check if assessment-level standard matches
      const assessmentStandards = parseStandards(assessment.standard || '');
      const assessmentCoversStandard = assessmentStandards.includes(standard);

      assessment.questions?.forEach((question: any) => {
        // Check if question covers this standard
        const questionStandards = parseStandards(question.standard || '');
        const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;

        if (questionCoversStandard) {
          // Find the response for this specific question
          const response = result.responses?.find((r: any) => r.questionId === question.id);
          if (response) {
            questionAttempts.push({
              isCorrect: response.isCorrect,
              score: response.pointsEarned || (response.isCorrect ? (question.points || 1) : 0)
            });
          }
        }
      });
    });

    if (questionAttempts.length > 0) {
      const correct = questionAttempts.filter(attempt => attempt.isCorrect).length;
      const total = questionAttempts.length;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Count total attempts (number of times this standard was assessed)
      const attempts = saResults.filter(r => {
        const assessment = saAssessments.find(a => a.id === r.assessmentId);
        if (!assessment) return false;

        const assessmentStandards = parseStandards(assessment.standard || '');
        if (assessmentStandards.includes(standard)) return true;

        return assessment.questions?.some((q: any) => {
          const questionStandards = parseStandards(q.standard || '');
          return questionStandards.includes(standard);
        });
      }).length;

      standardsMap.set(standard, {
        standard,
        correct,
        total,
        percentage,
        attempts
      });
    }
  });

  return Array.from(standardsMap.values()).sort((a, b) => {
    return a.standard.localeCompare(b.standard, undefined, { numeric: true, sensitivity: 'base' });
  });
});

// Filtered assessments and results by period
// If selectedPeriodId is empty, show all; otherwise filter by selected period
const filteredAssessments = computed(() => {
  if (!selectedPeriodId.value) {
    return assessments.value; // Show all if "All Quarters" selected
  }
  return filterAssessments(assessments.value);
});

const filteredAssessmentResults = computed(() => {
  if (!selectedPeriodId.value) {
    return assessmentResults.value; // Show all if "All Quarters" selected
  }
  return filterResults(assessmentResults.value);
});

// Computed: ESA by Standard (kept for backward compatibility if needed)
const esaByStandard = computed(() => {
  const esaAssessments = filteredAssessments.value.filter(a => a.category === 'ESA');
  const esaResults = filteredAssessmentResults.value.filter(r => {
    const assessment = esaAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Group by standard
  const standardMap = new Map<string, {
    standard: string;
    assessments: Array<{
      id: string;
      title: string;
      bestScore: number | null;
      results: AssessmentResult[];
      lastCompleted: any;
    }>;
  }>();

  esaAssessments.forEach(assessment => {
    // Get standards from assessment and questions
    const allStandards = new Set<string>();
    if (assessment.standard) {
      parseStandards(assessment.standard).forEach(std => allStandards.add(std));
    }
      assessment.questions?.forEach((q: any) => {
      if (q.standard) {
        parseStandards(q.standard).forEach(std => allStandards.add(std));
      }
    });

    // If no standards, use "No Standard"
    if (allStandards.size === 0) {
      allStandards.add('No Standard');
    }

    const results = esaResults.filter(r => r.assessmentId === assessment.id);
    const bestScore = results.length > 0
      ? Math.max(...results.map(r => r.percentage))
      : null;
    const lastCompleted = results.length > 0
      ? results.sort((a, b) => {
          const aTime = a.completedAt?.seconds || (a.completedAt ? new Date(a.completedAt).getTime() / 1000 : 0);
          const bTime = b.completedAt?.seconds || (b.completedAt ? new Date(b.completedAt).getTime() / 1000 : 0);
          return bTime - aTime;
        })[0].completedAt
      : null;

    allStandards.forEach(standard => {
      if (!standardMap.has(standard)) {
        standardMap.set(standard, { standard, assessments: [] });
      }
      standardMap.get(standard)!.assessments.push({
        id: assessment.id,
        title: assessment.title,
        bestScore,
        results,
        lastCompleted
      });
    });
  });

  return Array.from(standardMap.values()).sort((a, b) => a.standard.localeCompare(b.standard));
});

// Computed: SA by Standard
const saByStandard = computed(() => {
  const saAssessments = filteredAssessments.value.filter(a => a.category === 'SA');
  const saResults = filteredAssessmentResults.value.filter(r => {
    const assessment = saAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Group by standard (same logic as ESA)
  const standardMap = new Map<string, {
    standard: string;
    assessments: Array<{
      id: string;
      title: string;
      bestScore: number | null;
      results: AssessmentResult[];
      lastCompleted: any;
    }>;
  }>();

  saAssessments.forEach(assessment => {
    const allStandards = new Set<string>();
    if (assessment.standard) {
      parseStandards(assessment.standard).forEach(std => allStandards.add(std));
    }
      assessment.questions?.forEach((q: any) => {
      if (q.standard) {
        parseStandards(q.standard).forEach(std => allStandards.add(std));
      }
    });

    if (allStandards.size === 0) {
      allStandards.add('No Standard');
    }

    const results = saResults.filter(r => r.assessmentId === assessment.id);
    const bestScore = results.length > 0
      ? Math.max(...results.map(r => r.percentage))
      : null;
    const lastCompleted = results.length > 0
      ? results.sort((a, b) => {
          const aTime = a.completedAt?.seconds || (a.completedAt ? new Date(a.completedAt).getTime() / 1000 : 0);
          const bTime = b.completedAt?.seconds || (b.completedAt ? new Date(b.completedAt).getTime() / 1000 : 0);
          return bTime - aTime;
        })[0].completedAt
      : null;

    allStandards.forEach(standard => {
      if (!standardMap.has(standard)) {
        standardMap.set(standard, { standard, assessments: [] });
      }
      standardMap.get(standard)!.assessments.push({
        id: assessment.id,
        title: assessment.title,
        bestScore,
        results,
        lastCompleted
      });
    });
  });

  return Array.from(standardMap.values()).sort((a, b) => a.standard.localeCompare(b.standard));
});

// Computed: PA by Goal
const paByGoal = computed(() => {
  const paAssessments = filteredAssessments.value.filter(a => a.category === 'PA');
  const paResults = filteredAssessmentResults.value.filter(r => {
    const assessment = paAssessments.find(a => a.id === r.assessmentId);
    return assessment !== undefined;
  });

  // Group by goal
  const goalMap = new Map<string, {
    goalId: string;
    goalTitle: string;
    areaOfNeed: string;
    totalAssigned: number;
    totalCompleted: number;
    averageScore: number | null;
    assessments: Array<{
      id: string;
      title: string;
      bestScore: number | null;
      totalScore: number;
      totalPoints: number;
      results: AssessmentResult[];
      lastCompleted: any;
    }>;
  }>();

  // Process each goal
  goals.value.forEach(goal => {
    const goalPAs = paAssessments.filter(a => a.goalId === goal.id);

    if (goalPAs.length === 0) return;

    const goalPAResults: AssessmentResult[] = [];
    goalPAs.forEach(pa => {
      const results = paResults.filter(r => r.assessmentId === pa.id);
      goalPAResults.push(...results);
    });

    const completedPAs = goalPAs.filter(pa => {
      return paResults.some(r => r.assessmentId === pa.id);
    });

    const scores = goalPAResults.map(r => r.percentage);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null;

    const paDetails = goalPAs.map(pa => {
      const results = paResults.filter(r => r.assessmentId === pa.id);
      const bestScore = results.length > 0
        ? Math.max(...results.map(r => r.percentage))
        : null;
      const lastCompleted = results.length > 0
        ? results.sort((a, b) => {
            const aTime = a.completedAt?.seconds || (a.completedAt ? new Date(a.completedAt).getTime() / 1000 : 0);
            const bTime = b.completedAt?.seconds || (b.completedAt ? new Date(b.completedAt).getTime() / 1000 : 0);
            return bTime - aTime;
          })[0].completedAt
        : null;
      const bestResult = results.length > 0
        ? results.reduce((best, r) => r.percentage > best.percentage ? r : best)
        : null;

      return {
        id: pa.id,
        title: pa.title,
        bestScore,
        totalScore: bestResult?.score || 0,
        totalPoints: pa.totalPoints,
        results: results.sort((a, b) => {
          const aTime = a.completedAt?.seconds || (a.completedAt ? new Date(a.completedAt).getTime() / 1000 : 0);
          const bTime = b.completedAt?.seconds || (b.completedAt ? new Date(b.completedAt).getTime() / 1000 : 0);
          return bTime - aTime;
        }),
        lastCompleted
      };
    });

    goalMap.set(goal.id, {
      goalId: goal.id,
      goalTitle: goal.goalTitle,
      areaOfNeed: goal.areaOfNeed,
      totalAssigned: goalPAs.length,
      totalCompleted: completedPAs.length,
      averageScore,
      assessments: paDetails
    });
  });

  return Array.from(goalMap.values());
});

// Methods
const loadData = async () => {
  try {
    loading.value = true;
    error.value = '';

    const studentId = targetStudentUid.value;

    if (!studentId) {
      error.value = 'Student ID not found. Please contact your teacher.';
      return;
    }

    // Load all data in parallel
    const [assessmentsList, resultsList, goalsList, fluencyList, studentData] = await Promise.all([
      getAssessmentsByStudent(studentId),
      getAssessmentResultsByStudent(studentId),
      getGoalsByStudent(studentId),
      getAllFluencyProgress(studentId),
      // Load student info if viewing another student, otherwise resolve to null
      isViewingOtherStudent.value ? getStudent(studentId) : Promise.resolve(null)
    ]);

    // If student info was loaded, store it
    if (isViewingOtherStudent.value && studentData) {
      studentInfo.value = studentData;
    }

    assessments.value = assessmentsList;
    assessmentResults.value = resultsList;
    goals.value = goalsList;
    fluencyData.value = fluencyList;

    console.log(`📊 Loaded ${assessmentsList.length} assessments, ${resultsList.length} results, ${goalsList.length} goals, ${fluencyList.length} fluency operations`);
  } catch (err: any) {
    console.error('Error loading student summary:', err);
    error.value = 'Failed to load student data. Please try again.';
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: any): string => {
  if (!date) return 'N/A';

  try {
    let timestamp: number;
    if (date.seconds) {
      timestamp = date.seconds * 1000;
    } else if (date instanceof Date) {
      timestamp = date.getTime();
    } else {
      timestamp = new Date(date).getTime();
    }

    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

const getScoreClass = (percentage: number): string => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  if (percentage >= 60) return 'needs-improvement';
  return 'poor';
};

const capitalizeOperation = (op: string): string => {
  return op.charAt(0).toUpperCase() + op.slice(1);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.student-summary {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.summary-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.summary-header .header-content {
  flex: 1;
  min-width: 300px;
}

.summary-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.summary-header p {
  color: #666;
  font-size: 1.1rem;
}

.header-filters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 250px;
}

.period-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: #555;
  font-size: 0.95rem;
}

.period-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  color: #333;
  cursor: pointer;
  transition: border-color 0.2s;
}

.period-select:hover {
  border-color: #3b82f6;
}

.period-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.period-info {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .summary-header {
    flex-direction: column;
  }

  .header-filters {
    width: 100%;
  }
}

.student-name-display {
  margin-top: 0.5rem;
  color: #333;
  font-size: 1rem;
}

.student-name-display strong {
  color: #3b82f6;
  font-weight: 600;
}

.loading-container {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.summary-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.compact-section {
  padding: 1.5rem;
}

.compact-section h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.missing-assessments {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 0.95rem;
}

.missing-assessments strong {
  color: #856404;
}

.compact-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.compact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
  font-size: 0.95rem;
}

.standard-code {
  font-weight: 600;
  color: #333;
  min-width: 100px;
}

.score-info {
  color: #666;
  font-family: 'Courier New', monospace;
}

.summary-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.column {
  display: flex;
  flex-direction: column;
}

.column h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #555;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.by-test-column {
  border-right: 2px solid #e0e0e0;
  padding-right: 1.5rem;
}

.by-standard-column {
  padding-left: 1.5rem;
}

@media (max-width: 1024px) {
  .two-column-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .by-test-column {
    border-right: none;
    border-bottom: 2px solid #e0e0e0;
    padding-right: 0;
    padding-bottom: 1.5rem;
  }

  .by-standard-column {
    padding-left: 0;
    padding-top: 1.5rem;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.standards-grid,
.goals-grid,
.fluency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.standard-card,
.goal-card,
.fluency-card {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
}

.standard-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
}

.assessments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assessment-item {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.assessment-name {
  font-weight: 600;
  color: #333;
}

.score-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.score-badge.excellent {
  background-color: #d4edda;
  color: #155724;
}

.score-badge.good {
  background-color: #d1ecf1;
  color: #0c5460;
}

.score-badge.fair {
  background-color: #fff3cd;
  color: #856404;
}

.score-badge.needs-improvement {
  background-color: #f8d7da;
  color: #721c24;
}

.score-badge.poor {
  background-color: #f5c6cb;
  color: #721c24;
}

.score-badge.incomplete {
  background-color: #e9ecef;
  color: #6c757d;
}

.assessment-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.detail-item {
  display: flex;
  justify-content: space-between;
}

.goal-header {
  margin-bottom: 1rem;
}

.goal-title {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.goal-area {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.pa-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.pa-assessments-list h4 {
  margin-bottom: 1rem;
  color: #333;
}

.pa-assessment-item {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
}

.pa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.pa-name {
  font-weight: 600;
  color: #333;
}

.pa-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  gap: 2rem;
}

.all-scores {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

.scores-label {
  font-size: 0.85rem;
  color: #666;
  margin-right: 0.5rem;
}

.scores-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.score-chip {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.pa-status {
  color: #999;
  font-size: 0.9rem;
}

.pa-practice-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.pa-practice-section h4 {
  margin-bottom: 0.5rem;
  color: #333;
}

.placeholder-text {
  color: #999;
  font-style: italic;
}

.fluency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.operation-title {
  font-size: 1.2rem;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.unlocked {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background-color: #d4edda;
  color: #155724;
}

.fluency-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-row {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.proficiency-distribution {
  margin-top: 1rem;
}

.proficiency-distribution h4 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: #333;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dist-label {
  min-width: 120px;
  font-size: 0.9rem;
  color: #666;
}

.dist-bar {
  flex: 1;
  height: 24px;
  background: #e0e0e0;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
}

.dist-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dist-fill.mastered {
  background-color: #28a745;
}

.dist-fill.proficient {
  background-color: #17a2b8;
}

.dist-fill.approaching {
  background-color: #ffc107;
}

.dist-fill.emerging {
  background-color: #fd7e14;
}

.dist-fill.does-not-know {
  background-color: #dc3545;
}

.dist-count {
  position: absolute;
  right: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.assessment-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.assessment-stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .standards-grid,
  .goals-grid,
  .fluency-grid {
    grid-template-columns: 1fr;
  }

  .pa-summary {
    flex-direction: column;
    gap: 1rem;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
