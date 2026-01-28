<template>
  <div class="student-results">
    <div class="results-header">
      <div class="header-top">
        <div class="header-content">
          <h1>📊 My Results</h1>
          <p>View your assessment results and progress</p>
          <p class="info-note">💡 Note: Progress Assessments (PA) are managed separately and not shown here.</p>
          <div v-if="currentPeriodInfo" class="period-indicator">
            📅 Showing {{ currentPeriodInfo.name }} ({{ currentPeriodInfo.dateRange }})
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/student-summary" class="summary-link">
            <span class="link-icon">📋</span>
            <span class="link-text">View Complete Summary</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading your results...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- No Results State -->
    <div v-if="!loading && !error && assessmentResults.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No Results Yet</h3>
      <p>You haven't completed any assessments yet. Check your "To Do" list for available assessments.</p>
    </div>

    <!-- View Mode and Filters -->
    <div v-if="!loading && !error && assessmentResults.length > 0" class="filters-section">
      <!-- View Mode Radio Buttons -->
      <div class="view-mode-group">
        <label class="view-mode-label">View Mode:</label>
        <div class="radio-group">
          <label class="radio-option">
            <input type="radio" v-model="viewMode" value="assessments" name="viewMode">
            <span class="radio-label">📝 Show by Assessments</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="viewMode" value="standards" name="viewMode">
            <span class="radio-label">📊 Show by Standards</span>
          </label>
        </div>

        <!-- Assessment Category Filter Buttons (only show in standards view) -->
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
    </div>

    <!-- Results Content -->
    <div v-if="!loading && !error && assessmentResults.length > 0" class="results-content">
      <!-- Results Summary -->
      <div class="results-summary">
        <div class="summary-card">
          <div class="summary-icon">📈</div>
          <div class="summary-content">
            <h3>{{ filteredAssessmentResults.length }}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">⭐</div>
          <div class="summary-content">
            <h3>{{ averageScore }}%</h3>
            <p>{{ viewMode === 'standards' ? 'Standard Mastery' : 'Average Score' }}</p>
          </div>
        </div>
      </div>

      <!-- Assessment View -->
      <div v-if="viewMode === 'assessments'" class="results-list">
        <div
          v-for="result in filteredAssessmentResults"
          :key="result.id"
          class="result-card"
          :class="getScoreClass(result.percentage)"
        >
          <div class="result-header">
            <div class="result-title">
              <h3>{{ getAssessmentTitle(result.assessmentId) }}</h3>
              <span class="result-standard">{{ getAssessmentStandards(result.assessmentId) }}</span>
            </div>
            <div class="result-score">
              <span class="score-main">{{ result.score }}/{{ result.totalPoints }}</span>
              <span class="score-percentage">{{ result.percentage }}%</span>
            </div>
          </div>

          <div class="result-details">
            <div class="result-stats">
              <div class="stat">
                <span class="stat-icon">✅</span>
                <span class="stat-text">{{ getCorrectAnswers(result) }} Correct</span>
              </div>
              <div class="stat">
                <span class="stat-icon">❌</span>
                <span class="stat-text">{{ getIncorrectAnswers(result) }} Incorrect</span>
              </div>
              <div class="stat">
                <span class="stat-icon">⏱️</span>
                <span class="stat-text">{{ result.timeSpent }} min</span>
              </div>
            </div>

            <div class="result-date">
              <span class="date-icon">📅</span>
              <span class="date-text">{{ formatDate(result.completedAt) }}</span>
            </div>
          </div>

          <!-- Question Breakdown Toggle -->
          <div class="question-breakdown-toggle">
            <button
              @click="toggleQuestionBreakdown(result.id)"
              class="breakdown-toggle-btn"
              :class="{ 'expanded': expandedResults[result.id] }"
            >
              <span class="toggle-icon">{{ expandedResults[result.id] ? '🔽' : '▶️' }}</span>
              <span class="toggle-text">
                {{ expandedResults[result.id] ? 'Hide' : 'Show' }} Question Details
              </span>
            </button>
          </div>

          <!-- Detailed Question Breakdown (Expandable) -->
          <div v-if="expandedResults[result.id]" class="question-breakdown-details">
            <div class="questions-header">
              <h4>📝 Question-by-Question Results</h4>
              <p class="questions-subtitle">See what you got right and wrong, plus the correct answers</p>
            </div>

            <div class="questions-list">
              <div
                v-for="(response, index) in result.responses"
                :key="response.questionId"
                class="question-detail-item"
                :class="{ 'correct': response.isCorrect, 'incorrect': !response.isCorrect }"
              >
                <div class="question-detail-header">
                  <span class="question-number">{{ index + 1 }}</span>
                  <span class="question-status">
                    {{ response.isCorrect ? '✅ Correct' : '❌ Incorrect' }}
                  </span>
                  <span class="question-points">
                    {{ response.pointsEarned || 0 }}/{{ getQuestionPoints(result.assessmentId, response.questionId) }} pts
                  </span>
                </div>

                <div class="question-detail-content">
                  <div class="question-text-display">
                    <strong>Question:</strong>
                    <span v-html="renderLatexInText(getQuestionText(result.assessmentId, response.questionId))"></span>
                  </div>

                  <div class="answer-comparison">
                    <div class="student-answer-display">
                      <strong>Your Answer:</strong>
                      <span class="answer-text" :class="{ 'incorrect-answer': !response.isCorrect }">
                        {{ getDisplayAnswer(result.assessmentId, response.questionId, response.studentAnswer) }}
                      </span>
                    </div>

                    <div class="correct-answer-display">
                      <strong>Correct Answer:</strong>
                      <span class="answer-text correct-answer">
                        {{ getDisplayCorrectAnswer(result.assessmentId, response.questionId) }}
                      </span>
                    </div>

                    <!-- Show alternative answers if they exist -->
                    <div v-if="getAlternativeAnswers(result.assessmentId, response.questionId).length > 0" class="alternative-answers-display">
                      <strong>Also Acceptable:</strong>
                      <div class="alternatives-list">
                        <span
                          v-for="alt in getAlternativeAnswers(result.assessmentId, response.questionId)"
                          :key="alt"
                          class="alternative-answer-tag"
                        >
                          {{ alt }}
                        </span>
                      </div>
                    </div>

                    <!-- Show equivalent fractions if applicable -->
                    <div v-if="isEquivalentFractionsEnabled(result.assessmentId, response.questionId) && isFractionAnswer(result.assessmentId, response.questionId)" class="equivalent-fractions-display">
                      <strong>Equivalent Fractions:</strong>
                      <div class="equivalents-list">
                        <span
                          v-for="equiv in getEquivalentFractions(result.assessmentId, response.questionId)"
                          :key="equiv"
                          class="equivalent-fraction-tag"
                        >
                          {{ equiv }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Standards View -->
      <div v-if="viewMode === 'standards'" class="standards-view">
        <div class="standards-table-wrapper">
          <table class="standards-table">
            <thead class="sticky-header">
              <tr>
                <th class="standard-name-col">Standard</th>
                <th class="standard-score-col">Score</th>
                <th class="standard-mastery-col">Mastery</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="standard in filteredStandards" :key="standard" class="standard-row">
                <td class="standard-name-cell">
                  <div class="standard-info">
                    <strong>{{ getCleanStandardName(standard) }}</strong>
                    <div v-if="getStandardDisplayInfo(standard).appCategory" class="app-category-label">
                      {{ getStandardDisplayInfo(standard).appCategory }}
                    </div>
                    <div v-if="getCustomStandardByCode(standard)?.description" class="standard-description">
                      {{ getCustomStandardByCode(standard)?.description }}
                    </div>
                  </div>
                </td>
                <td class="standard-score-cell">
                  <span class="score-fraction">
                    {{ getStudentStandardScore(standard).correct }}/{{ getStudentStandardScore(standard).total }}
                  </span>
                </td>
                <td class="standard-mastery-cell">
                  <span
                    class="mastery-badge"
                    :class="getStandardMasteryClass(getStudentStandardScore(standard))"
                  >
                    {{ getStudentStandardMastery(standard) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { getAssessmentResultsByStudent, getAssessmentsByStudent } from '@/firebase/iepServices';
import { getAllCustomStandards } from '@/firebase/standardsServices';
import { parseStandards, getAllStandardsFromQuestions, calculateStandardScore } from '@/utils/standardsUtils';
import { useGlobalAcademicPeriods } from '@/composables/useAcademicPeriods';
import { renderLatexInText } from '@/utils/latexUtils';
import type { AssessmentResult, Assessment } from '@/types/iep';
import type { CustomStandard } from '@/types/standards';

const authStore = useAuthStore();

// State
const loading = ref(true);
const error = ref('');
const assessmentResults = ref<AssessmentResult[]>([]);
const assessments = ref<Assessment[]>([]);
const customStandards = ref<CustomStandard[]>([]);

// View mode and filters - default to assessments view to show question breakdown
const viewMode = ref('assessments');
const selectedAppCategory = ref('');
const selectedAssessmentCategory = ref(''); // NEW: Filter by assessment category (ESA, SA, etc.)

// Question breakdown state
const expandedResults = ref<Record<string, boolean>>({});

// PERFORMANCE: Cache for standard scores to avoid expensive recalculations
const standardScoreCache = ref<Map<string, { correct: number; total: number; percentage: number }>>(new Map());

// Clear cache when data changes
const clearStandardScoreCache = () => {
  standardScoreCache.value.clear();
};

// Academic period management
const { filterAssessments, filterResults, selectedPeriod } = useGlobalAcademicPeriods();

// Current period display info
const currentPeriodInfo = computed(() => {
  if (!selectedPeriod.value) return null;

  const start = selectedPeriod.value.startDate.toLocaleDateString();
  const end = selectedPeriod.value.endDate.toLocaleDateString();

  return {
    name: selectedPeriod.value.name,
    dateRange: `${start} - ${end}`
  };
});

// Filter data by current academic period
const filteredAssessmentResults = computed(() => {
  return filterResults(assessmentResults.value);
});

const filteredAssessments = computed(() => {
  return filterAssessments(assessments.value);
});

// Computed properties
const averageScore = computed(() => {
  if (filteredAssessmentResults.value.length === 0) return 0;
  const total = filteredAssessmentResults.value.reduce((sum, result) => sum + result.percentage, 0);
  return Math.round(total / filteredAssessmentResults.value.length);
});

// Get unique standards from student's assessments (filtered by current period)
// PERFORMANCE: Memoized to avoid recalculating on every render
const uniqueStandards = computed(() => {
  const startTime = performance.now();

  const allQuestions = filteredAssessments.value.flatMap(assessment => [
    // Include assessment-level standard as a pseudo-question
    ...(assessment.standard ? [{ standard: assessment.standard }] : []),
    // Include all questions
    ...(assessment.questions || [])
  ]);

  const standards = getAllStandardsFromQuestions(allQuestions);

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

// Get unique assessment categories from student's assessments
const uniqueAssessmentCategories = computed(() => {
  const categories = new Set<string>();

  filteredAssessments.value.forEach(assessment => {
    if (assessment.category) {
      categories.add(assessment.category);
    }
  });

  return Array.from(categories).sort();
});

// Filter standards by app category and/or assessment category
// PERFORMANCE FIX: Don't clear cache in computed - it causes freezing
const filteredStandards = computed(() => {
  const startTime = performance.now();
  let standards = uniqueStandards.value;

  // Apply app category filter if selected (for custom standards)
  if (selectedAppCategory.value) {
    standards = standards.filter(standardCode => {
      const customStd = getCustomStandardByCode(standardCode);
      return customStd?.appCategory === selectedAppCategory.value;
    });
  }

  // Apply assessment category filter if selected (ESA, SA, HW, etc.)
  if (selectedAssessmentCategory.value) {
    // Get all standards from assessments of this category
    const categoryStandards = new Set<string>();

    filteredAssessments.value
      .filter(assessment => assessment.category === selectedAssessmentCategory.value)
      .forEach(assessment => {
        // Add assessment-level standard
        if (assessment.standard) {
          const assessmentStandards = parseStandards(assessment.standard);
          assessmentStandards.forEach(std => categoryStandards.add(std));
        }
        // Add question-level standards
        assessment.questions?.forEach((question: any) => {
          if (question.standard) {
            const questionStandards = parseStandards(question.standard);
            questionStandards.forEach(std => categoryStandards.add(std));
          }
        });
      });

    // Filter to only standards from this assessment category
    standards = standards.filter(std => categoryStandards.has(std));
  }

  const filterTime = Math.round(performance.now() - startTime);
  if (filterTime > 10) {
    console.log(`🔍 Filtered to ${standards.length} standards in ${filterTime}ms`);
  }

  return standards;
});

// Methods
const loadResults = async () => {
  try {
    loading.value = true;
    error.value = '';

    const studentId = authStore.currentUser?.uid || authStore.currentUser?.googleId || authStore.currentUser?.seisId;

    if (!studentId) {
      error.value = 'Student ID not found. Please contact your teacher.';
      return;
    }

    // Load results, assessments, and custom standards (including PA assessments)
    const [results, assessmentsList, allCustomStandards] = await Promise.all([
      getAssessmentResultsByStudent(studentId),
      getAssessmentsByStudent(studentId),
      getAllCustomStandards()
    ]);

    assessments.value = assessmentsList;

    // Filter results to only include results for assigned assessments (including PA)
    const validResults = results.filter(result => {
      const assessment = assessmentsList.find(a => a.id === result.assessmentId);
      return assessment !== undefined; // Include if assessment exists (could be PA or regular)
    });
    assessmentResults.value = validResults;

    console.log(`📊 Loaded ${results.length} results, ${validResults.length} valid (including PA)`);

    customStandards.value = allCustomStandards;

    // Clear cache when new data is loaded
    clearStandardScoreCache();
    console.log('🔄 Standard score cache cleared for fresh calculations');
  } catch (err) {
    console.error('Error loading results:', err);
    error.value = 'Failed to load results. Please try again.';
  } finally {
    loading.value = false;
  }
};

const getAssessmentTitle = (assessmentId: string) => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  return assessment?.title || 'Unknown Assessment';
};

const getAssessmentStandards = (assessmentId: string) => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  return assessment?.standard || '';
};

const getScoreClass = (percentage: number) => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  return 'needs-improvement';
};

const getCorrectAnswers = (result: AssessmentResult) => {
  if (!result.responses) return 0;
  return result.responses.filter(response => response.isCorrect).length;
};

const getIncorrectAnswers = (result: AssessmentResult) => {
  if (!result.responses) return 0;
  return result.responses.filter(response => !response.isCorrect).length;
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Standards-based methods (adapted from gradebook)
const getCustomStandardByCode = (standardCode: string): CustomStandard | null => {
  if (!standardCode) return null;

  // Remove CUSTOM: prefix if present
  const cleanCode = standardCode.startsWith('CUSTOM:') ?
    standardCode.replace('CUSTOM:', '') : standardCode;

  return customStandards.value.find(std => std.code === cleanCode) || null;
};

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

const getCleanStandardName = (standardCode: string): string => {
  if (!standardCode) return 'No standard';

  if (standardCode.startsWith('CUSTOM:')) {
    return standardCode.replace('CUSTOM:', ''); // Remove CUSTOM: prefix
  } else {
    return standardCode; // Return CCSS code as-is
  }
};

// Calculate student's score for a specific standard (WITH CACHING)
const getStudentStandardScore = (standard: string) => {
  const studentUid = authStore.currentUser?.uid;
  if (!studentUid) return { correct: 0, total: 0, percentage: 0 };

  // Check cache first - HUGE performance boost!
  const cacheKey = `${studentUid}-${standard}`;
  if (standardScoreCache.value.has(cacheKey)) {
    return standardScoreCache.value.get(cacheKey)!;
  }

  const customStd = getCustomStandardByCode(standard);
  const maxScore = customStd?.maxScore;

  // Collect all question attempts for this standard
  const questionAttempts: { isCorrect: boolean; score: number; maxPoints: number }[] = [];

  filteredAssessments.value.forEach(assessment => {
    // Check if student has results for this assessment
    const result = filteredAssessmentResults.value.find(r => r.assessmentId === assessment.id);
    if (!result) return;

    // Check if assessment-level standard matches
    const assessmentStandards = parseStandards(assessment.standard);
    const assessmentCoversStandard = assessmentStandards.includes(standard);

    assessment.questions?.forEach((question: any) => {
      // Check if question covers this standard
      const questionStandards = parseStandards(question.standard);
      const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;

      if (questionCoversStandard) {
        // Find the response for this specific question
        const response = result.responses?.find((r: any) => r.questionId === question.id);
        if (response) {
          questionAttempts.push({
            isCorrect: response.isCorrect,
            score: response.pointsEarned || (response.isCorrect ? question.points : 0),
            maxPoints: question.points
          });
        }
      }
    });
  });

  // Use centralized scoring calculation
  const result = calculateStandardScore(questionAttempts, customStd);

  // Cache the result for performance (avoids recalculating 30,000+ times)
  standardScoreCache.value.set(cacheKey, result);

  return result;
};

// Calculate mastery using maxScore as factor
const getStudentStandardMastery = (standard: string): number => {
  const customStd = getCustomStandardByCode(standard);
  const scoreData = getStudentStandardScore(standard);

  if (scoreData.total === 0) return 0;

  if (customStd?.maxScore && customStd.maxScore > 0) {
    // If maxScore is set, calculate mastery as (correct / maxScore) * 100
    // Cap at 100% if they exceed maxScore
    return Math.min(100, Math.round((scoreData.correct / customStd.maxScore) * 100));
  } else {
    // If no maxScore set, use regular percentage
    return scoreData.percentage;
  }
};

const getStandardMasteryClass = (scoreData: { correct: number; total: number; percentage: number }): string => {
  if (scoreData.percentage >= 80) return 'proficient';
  if (scoreData.percentage >= 60) return 'developing';
  return 'beginning';
};

// Question breakdown methods
const toggleQuestionBreakdown = (resultId: string) => {
  expandedResults.value[resultId] = !expandedResults.value[resultId];
};

const getQuestionText = (assessmentId: string, questionId: string): string => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);
  return question?.questionText || 'Question not found';
};

const getQuestionPoints = (assessmentId: string, questionId: string): number => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);
  return question?.points || 1;
};

const getDisplayAnswer = (assessmentId: string, questionId: string, studentAnswer: any): string => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);

  if (!question) return 'N/A';

  // Handle different question types for display
  if (question.questionType === 'multiple-choice') {
    const answerIndex = parseInt(studentAnswer as string);
    const optionText = question.options?.[answerIndex] || '';
    if (optionText) {
      // Convert LaTeX to plain text for display
      const plainText = convertLatexToPlainText(optionText);
      return `${String.fromCharCode(65 + answerIndex)}) ${plainText}`;
    }
    return 'N/A';
  } else if (question.questionType === 'checkbox') {
    if (Array.isArray(studentAnswer)) {
      const selectedOptions = (studentAnswer as string[]).map(index => {
        const optionIndex = parseInt(index);
        const optionText = question.options?.[optionIndex] || '';
        if (optionText) {
          const plainText = convertLatexToPlainText(optionText);
          return `${String.fromCharCode(65 + optionIndex)}) ${plainText}`;
        }
        return index;
      });
      return selectedOptions.join(', ');
    }
  } else if (question.questionType === 'matching') {
    if (typeof studentAnswer === 'object' && studentAnswer !== null) {
      const matches = Object.entries(studentAnswer as Record<string, string>)
        .map(([left, right]) => `${left} → ${right}`)
        .join(', ');
      return matches || 'No matches made';
    }
  } else if (question.questionType === 'rank-order') {
    if (Array.isArray(studentAnswer)) {
      return (studentAnswer as string[]).join(', ');
    }
  }

  // For other question types, return as-is
  return studentAnswer?.toString() || 'No answer';
};

const getDisplayCorrectAnswer = (assessmentId: string, questionId: string): string => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);

  if (!question) return 'N/A';

  // Handle different question types for display
  if (question.questionType === 'multiple-choice') {
    const answerIndex = parseInt(question.correctAnswer as string);
    const optionText = question.options?.[answerIndex] || '';
    if (optionText) {
      // Convert LaTeX to plain text for display
      const plainText = convertLatexToPlainText(optionText);
      return `${String.fromCharCode(65 + answerIndex)}) ${plainText}`;
    }
    return 'N/A';
  } else if (question.questionType === 'checkbox') {
    if (Array.isArray(question.correctAnswers)) {
      const correctOptions = (question.correctAnswers as string[]).map(index => {
        const optionIndex = parseInt(index);
        const optionText = question.options?.[optionIndex] || '';
        if (optionText) {
          const plainText = convertLatexToPlainText(optionText);
          return `${String.fromCharCode(65 + optionIndex)}) ${plainText}`;
        }
        return index;
      });
      return correctOptions.join(', ');
    }
  } else if (question.questionType === 'matching') {
    if (question.correctMatches) {
      const matches = Object.entries(question.correctMatches)
        .map(([left, right]) => `${left} → ${right}`)
        .join(', ');
      return matches || 'N/A';
    }
  } else if (question.questionType === 'rank-order') {
    if (Array.isArray(question.correctOrder)) {
      return question.correctOrder.join(', ');
    }
  }

  // For other question types, return the correct answer as-is
  return question.correctAnswer as string || 'N/A';
};

// Get alternative answers for a question
const getAlternativeAnswers = (assessmentId: string, questionId: string): string[] => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);
  return question?.acceptableAnswers || [];
};

// Check if equivalent fractions are enabled for this question
const isEquivalentFractionsEnabled = (assessmentId: string, questionId: string): boolean => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);
  return question?.acceptEquivalentFractions || false;
};

// Check if the answer is a fraction
const isFractionAnswer = (assessmentId: string, questionId: string): boolean => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);
  const correctAnswer = question?.correctAnswer as string || '';
  return correctAnswer.includes('/');
};

// Generate equivalent fractions for display
const getEquivalentFractions = (assessmentId: string, questionId: string): string[] => {
  const assessment = assessments.value.find(a => a.id === assessmentId);
  const question = assessment?.questions?.find(q => q.id === questionId);
  const correctAnswer = question?.correctAnswer as string;

  if (!correctAnswer || !correctAnswer.includes('/')) return [];

  try {
    // Parse the fraction
    const [numStr, denStr] = correctAnswer.split('/');
    const num = parseInt(numStr.trim());
    const den = parseInt(denStr.trim());

    if (isNaN(num) || isNaN(den) || den === 0) return [];

    // Generate equivalent fractions
    const equivalents: string[] = [];

    // Generate 4 equivalent fractions
    for (let i = 2; i <= 5; i++) {
      equivalents.push(`${num * i}/${den * i}`);
    }

    // Also add simplified version if current isn't simplified
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const commonDivisor = gcd(Math.abs(num), Math.abs(den));

    if (commonDivisor > 1) {
      const simplified = `${num / commonDivisor}/${den / commonDivisor}`;
      if (simplified !== correctAnswer) {
        equivalents.unshift(simplified); // Add simplified version first
      }
    }

    return equivalents;
  } catch (error) {
    console.error('Error generating equivalent fractions:', error);
    return [];
  }
};

// Convert LaTeX markup to plain text for display
const convertLatexToPlainText = (text: string): string => {
  if (!text) return '';

  // Convert common LaTeX fractions to plain text
  let plainText = text
    .replace(/\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g, '$1/$2') // \frac{a}{b} -> a/b
    .replace(/\$([^$]+)\$/g, '$1') // Remove $ delimiters
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2') // \frac{a}{b} -> a/b (without $)
    .replace(/\\cdot/g, '×') // \cdot -> ×
    .replace(/\\times/g, '×') // \times -> ×
    .replace(/\\div/g, '÷') // \div -> ÷
    .replace(/\\pm/g, '±') // \pm -> ±
    .replace(/\\approx/g, '≈') // \approx -> ≈
    .replace(/\\leq/g, '≤') // \leq -> ≤
    .replace(/\\geq/g, '≥') // \geq -> ≥
    .replace(/\\neq/g, '≠') // \neq -> ≠
    .replace(/\\infty/g, '∞') // \infty -> ∞
    .replace(/\\\\/g, '') // Remove line breaks
    .replace(/[{}]/g, '') // Remove remaining braces
    .trim();

  return plainText;
};

// Watch for filter changes and clear cache (fixing freeze issue)
// PERFORMANCE FIX: Clear cache in watcher, not in computed property
watch([selectedAppCategory, selectedAssessmentCategory], () => {
  // Clear cache when filters change so scores recalculate correctly
  clearStandardScoreCache();
  console.log('🔄 Cache cleared due to filter change');
});

// Initialize
onMounted(() => {
  loadResults();
});
</script>

<style scoped>
.student-results {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.results-header {
  margin-bottom: 30px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.header-content {
  flex: 1;
  text-align: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.summary-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.summary-link:hover {
  background: #2563eb;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.summary-link:active {
  transform: translateY(0);
}

.link-icon {
  font-size: 1.1rem;
}

.link-text {
  white-space: nowrap;
}

.results-header h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 2rem;
}

.results-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.info-note {
  margin: 0.5rem 0;
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
}

.period-indicator {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 1rem;
  display: inline-block;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  margin: 20px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #34495e;
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  font-size: 2.5rem;
}

.summary-content h3 {
  margin: 0 0 4px 0;
  font-size: 2rem;
  color: #2c3e50;
}

.summary-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 5px solid #e1e8ed;
}

.result-card.excellent {
  border-left-color: #27ae60;
}

.result-card.good {
  border-left-color: #f39c12;
}

.result-card.fair {
  border-left-color: #e67e22;
}

.result-card.needs-improvement {
  border-left-color: #e74c3c;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.result-title h3 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.result-standard {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.result-score {
  text-align: right;
}

.score-main {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.score-percentage {
  display: block;
  font-size: 1.1rem;
  color: #7f8c8d;
}

.result-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-icon {
  font-size: 1rem;
}

.result-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .result-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .result-stats {
    flex-wrap: wrap;
  }
}

/* View Mode and Standards Styles */
.filters-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.view-mode-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.view-mode-label {
  font-weight: 600;
  color: #495057;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-option input {
  margin: 0;
}

.radio-label {
  font-weight: 500;
  color: #495057;
}

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

/* Standards Table Styles */
.standards-table-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  max-height: 70vh;
  overflow-y: auto;
  position: relative;
}

.standards-table {
  width: 100%;
  border-collapse: collapse;
}

.standards-table .sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.standards-table th {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
}

.standard-name-col {
  min-width: 250px;
}

.standard-score-col {
  min-width: 100px;
  text-align: center;
}

.standard-mastery-col {
  min-width: 120px;
  text-align: center;
}

.standard-row {
  border-bottom: 1px solid #dee2e6;
}

.standard-row td {
  padding: 1rem;
  vertical-align: middle;
}

.standard-info strong {
  display: block;
  color: #495057;
  margin-bottom: 0.25rem;
}

.app-category-label {
  color: #1565c0;
  background: #e3f2fd;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.25rem;
  display: inline-block;
}

.standard-description {
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
  margin-top: 0.5rem;
  line-height: 1.4;
  max-width: 300px;
}

.score-fraction {
  font-weight: 600;
  font-size: 1.1rem;
  color: #495057;
}

.mastery-badge {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.mastery-badge.proficient {
  background: #dcfce7;
  color: #166534;
}

.mastery-badge.developing {
  background: #fef3c7;
  color: #92400e;
}

.mastery-badge.beginning {
  background: #fef2f2;
  color: #dc2626;
}

/* Question Breakdown Styles */
.question-breakdown-toggle {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.breakdown-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  width: 100%;
  justify-content: center;
}

.breakdown-toggle-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.breakdown-toggle-btn.expanded {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.toggle-icon {
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.breakdown-toggle-btn.expanded .toggle-icon {
  transform: rotate(90deg);
}

.question-breakdown-details {
  margin-top: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.questions-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.questions-header h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.2rem;
}

.questions-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-detail-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.question-detail-item.correct {
  border-left: 4px solid #10b981;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
}

.question-detail-item.incorrect {
  border-left: 4px solid #ef4444;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
}

.question-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.question-number {
  background: #3b82f6;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.question-status {
  font-weight: 600;
  font-size: 0.95rem;
  flex-grow: 1;
  text-align: center;
}

.question-points {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  flex-shrink: 0;
}

.question-detail-content {
  padding: 1.25rem;
}

.question-text-display {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #64748b;
}

.question-text-display strong {
  color: #475569;
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.answer-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-answer-display, .correct-answer-display {
  padding: 1rem;
  border-radius: 6px;
  border-left: 3px solid;
}

.student-answer-display {
  background: #f0f4ff;
  border-left-color: #3b82f6;
}

.correct-answer-display {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.student-answer-display strong, .correct-answer-display strong {
  color: #374151;
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.answer-text {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}

.answer-text.incorrect-answer {
  color: #dc2626;
}

.answer-text.correct-answer {
  color: #059669;
}

.alternative-answers-display, .equivalent-fractions-display {
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid;
}

.alternative-answers-display {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.equivalent-fractions-display {
  background: #f3e8ff;
  border-color: #d8b4fe;
}

.alternative-answers-display strong, .equivalent-fractions-display strong {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.alternative-answers-display strong {
  color: #1e40af;
}

.equivalent-fractions-display strong {
  color: #7c3aed;
}

.alternatives-list, .equivalents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.alternative-answer-tag, .equivalent-fraction-tag {
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.alternative-answer-tag {
  background: #3b82f6;
  color: white;
}

.equivalent-fraction-tag {
  background: #8b5cf6;
  color: white;
}

/* Mobile responsiveness for question breakdown */
@media (max-width: 768px) {
  .question-detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .question-status {
    text-align: left;
  }

  .question-detail-content {
    padding: 1rem;
  }

  .answer-comparison {
    gap: 0.75rem;
  }

  .alternatives-list, .equivalents-list {
    gap: 0.375rem;
  }

  .alternative-answer-tag, .equivalent-fraction-tag {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
