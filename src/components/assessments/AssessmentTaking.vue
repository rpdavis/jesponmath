<template>
  <div class="assessment-taking">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading assessment...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Assessment Not Available</h3>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="assessment" class="assessment-container">
      <!-- Retake Warning -->
      <div v-if="showRetakeWarning && !started" class="retake-warning">
        <div class="warning-header">
          <span class="warning-icon">🔄</span>
          <h3>Assessment Retake</h3>
        </div>
        <div class="warning-content">
          <p><strong>This is attempt #{{ attemptNumber }}</strong> for this assessment.</p>
          <p v-if="assessment?.retakeInstructions">{{ assessment.retakeInstructions }}</p>
          <div class="previous-attempts">
            <h4>Previous Attempts:</h4>
            <div v-for="(result, index) in existingResults" :key="result.id" class="attempt-summary">
              <span class="attempt-number">Attempt {{ index + 1 }}:</span>
              <span class="attempt-score" :class="getScoreClass(result.percentage)">{{ result.percentage }}%</span>
              <span class="attempt-date">{{ formatDate(result.completedAt) }}</span>
            </div>
          </div>
          <div class="retake-info">
            <p><strong>Retake Mode:</strong> {{ assessment?.retakeMode === 'combined' ? 'Combined (best score kept)' : 'Separate (each attempt tracked)' }}</p>
            <p v-if="assessment?.maxRetakes && assessment.maxRetakes > 0">
              <strong>Remaining Retakes:</strong> {{ Math.max(0, assessment.maxRetakes + 1 - existingResults.length) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Assessment Questions -->
      <div class="questions-section">
        <!-- Assessment Header (moved inside) -->
        <div class="assessment-header">
          <div class="header-content">
            <div class="title-row">
              <h1>📝 {{ assessment.title }}</h1>
              <span class="inline-description">{{ assessment.description }}</span>
            </div>
            <div class="assessment-meta">
              <span class="grade-tag">Grade {{ assessment.gradeLevel }}</span>
              <span class="category-tag">{{ assessment.category }}</span>
              <span v-if="assessment.standard" class="standard-tag">{{ assessment.standard }}</span>
              <span v-if="assessment.timeLimit" class="time-tag">⏱️ {{ assessment.timeLimit }} min</span>
            </div>
          </div>
        </div>


        <div v-if="!started" class="start-prompt">
          <div class="start-card">
            <div class="start-icon">🚀</div>
            <h3>Ready to Start?</h3>
            <p>This assessment has {{ assessment.questions?.length || 0 }} questions worth {{ assessment.totalPoints }} points total.</p>
            <div v-if="assessment.timeLimit" class="time-warning">
              <span class="warning-icon">⏱️</span>
              <strong>Time Limit: {{ assessment.timeLimit }} minutes</strong>
            </div>
            <div class="progress-info">
              <span class="info-icon">💾</span>
              <span>Your progress will be saved automatically as you work</span>
            </div>
            <button @click="startAssessment" class="start-button">
              <span class="button-icon">▶️</span>
              Start Assessment
            </button>
          </div>
        </div>

        <!-- Final Screen -->
        <div v-else-if="onFinalScreen" class="final-screen">
          <div class="final-header">
            <h2>📝 Review & Submit</h2>
            <p>You've completed all questions. Review your work and submit when ready.</p>
          </div>

          <!-- Assessment Summary -->
          <div class="assessment-summary">
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">Questions Answered:</span>
                <span class="stat-value">{{ Object.keys(answers).length }}/{{ assessment.questions?.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Time Spent:</span>
                <span class="stat-value">{{ Math.round((Date.now() - (startTime?.getTime() || Date.now())) / 60000) }} minutes</span>
              </div>
            </div>
          </div>

          <!-- File Upload Section (moved here) -->
          <div v-if="assessment.allowFileUpload" class="file-upload-section">
            <div class="upload-header">
              <span class="upload-icon">📎</span>
              <h4>{{ getUploadTitle() }}</h4>
            </div>
            <p>{{ assessment.fileUploadInstructions }}</p>

            <!-- Multi-page progress -->
            <div v-if="assessment.requireMultiplePages" class="multi-page-progress">
              <div class="page-progress">
                <span class="progress-label">Pages captured:</span>
                <span class="progress-count">{{ uploadedFiles.length }}/{{ assessment.requiredPageCount || 2 }}</span>
              </div>

              <!-- Page labels -->
              <div v-if="assessment.pageLabels?.length" class="page-labels-list">
                <div v-for="(label, index) in assessment.pageLabels" :key="index" class="page-label">
                  <span class="page-number">{{ index + 1 }}.</span>
                  <span class="page-title">{{ label }}</span>
                  <span v-if="uploadedFiles[index]" class="page-status">✅</span>
                  <span v-else class="page-status">📷</span>
                </div>
              </div>
            </div>

            <div class="upload-area">
              <input
                ref="fileInput"
                type="file"
                :accept="getAcceptedFileTypes()"
                multiple
                @change="handleFileUpload"
                class="file-input"
              />

              <div class="upload-buttons">
                <button
                  type="button"
                  @click="fileInput?.click()"
                  class="upload-btn file-btn"
                >
                  📁 Choose Files
                </button>

                <button
                  type="button"
                  @click="showCamera = true"
                  class="upload-btn camera-btn"
                >
                  📷 Take Photo
                </button>
              </div>

              <div v-if="uploadedFiles.length > 0" class="uploaded-files">
                <h5>Uploaded Files:</h5>
                <div v-for="(file, index) in uploadedFiles" :key="index" class="uploaded-file">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ formatFileSize(file.size) }})</span>
                  <button @click="removeFile(file)" class="remove-file-btn">×</button>
                </div>
              </div>

              <div v-if="assessment.requireFileUpload && uploadedFiles.length === 0" class="upload-required">
                ⚠️ File upload is required to submit this assessment
              </div>
            </div>
          </div>

          <!-- Final Actions -->
          <div class="final-actions">
            <button @click="previousQuestion" class="nav-button back-button">
              ← Back to Questions
            </button>
            <button
              @click="submitAssessment"
              class="nav-button submit-button"
              :disabled="assessment.requireFileUpload && uploadedFiles.length === 0"
            >
              🚀 Submit Assessment
            </button>
          </div>
        </div>

        <!-- Questions Container -->
        <div v-else class="questions-container">
          <!-- Timer -->
          <div v-if="assessment.timeLimit" class="timer">
            <span class="timer-icon">⏱️</span>
            <span class="timer-text">Time Remaining: {{ formatTime(timeRemaining) }}</span>
          </div>

          <!-- Current Question -->
          <div v-if="currentQuestion" class="question-card">
            <div class="question-header">
              <h3>Question {{ currentQuestionIndex + 1 }}</h3>

              <!-- Progress Bar (inline center) -->
              <div class="progress-compact-inline">
                <span class="progress-text">{{ currentQuestionIndex + 1 }}/{{ assessment.questions?.length }}</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                </div>
              </div>

              <div class="question-meta">
                <div v-if="currentQuestion.standard" class="question-standards">
                  <span
                    v-for="standard in parseStandards(currentQuestion.standard)"
                    :key="standard"
                    class="question-standard-tag"
                  >{{ standard }}</span>
                </div>
                <div class="question-points">{{ currentQuestion.points }} point{{ currentQuestion.points !== 1 ? 's' : '' }}</div>
              </div>
            </div>

            <div class="question-content">
              <div class="question-text" v-html="renderLatexInText(currentQuestion.questionText)"></div>

              <!-- Composite Question (Sub-Questions) -->
              <div v-if="currentQuestion.subQuestions && currentQuestion.subQuestions.length > 0" class="composite-question">
                <div class="composite-info">
                  <span class="composite-badge">{{ currentQuestion.subQuestionScoringMode === 'all-or-nothing' ? '🔗 All parts must be correct' : '📊 Partial credit available' }}</span>
                </div>

                <div
                  v-for="(subQ, subIndex) in currentQuestion.subQuestions"
                  :key="subQ.id"
                  class="sub-question"
                >
                  <div class="sub-question-header">
                    <span class="sub-question-label">{{ subQ.partLabel }}</span>
                    <span class="sub-question-weight">{{ (subQ.pointWeight * currentQuestion.points).toFixed(1) }} pts</span>
                  </div>

                  <div class="sub-question-content">
                    <div class="sub-question-text" v-html="renderLatexInText(subQ.questionText)"></div>

                    <!-- Sub-question Answer Inputs -->
                    <!-- Multiple Choice -->
                    <div v-if="subQ.questionType === 'multiple-choice' && subQ.options" class="answer-options sub-answer">
                      <label
                        v-for="(option, optIndex) in subQ.options"
                        :key="optIndex"
                        class="option-label"
                      >
                        <input
                          type="radio"
                          :name="`sub-question-${subQ.id}`"
                          :value="optIndex.toString()"
                          v-model="answers[subQ.id]"
                        >
                        <span v-html="renderLatexInText(option)"></span>
                      </label>
                    </div>

                    <!-- True/False -->
                    <div v-else-if="subQ.questionType === 'true-false'" class="true-false-options sub-answer">
                      <label class="option-label">
                        <input
                          type="radio"
                          :name="`sub-question-${subQ.id}`"
                          value="true"
                          v-model="answers[subQ.id]"
                        >
                        <span>True</span>
                      </label>
                      <label class="option-label">
                        <input
                          type="radio"
                          :name="`sub-question-${subQ.id}`"
                          value="false"
                          v-model="answers[subQ.id]"
                        >
                        <span>False</span>
                      </label>
                    </div>

                    <!-- Short Answer -->
                    <div v-else-if="subQ.questionType === 'short-answer'" class="answer-input sub-answer">
                      <RichTextAnswerInput
                        :key="subQ.id"
                        v-model="answers[subQ.id] as string"
                        placeholder="Enter your answer..."
                        :compact="true"
                      />
                    </div>

                    <!-- Fraction -->
                    <div v-else-if="subQ.questionType === 'fraction'" class="fraction-question sub-answer">
                      <FractionInput
                        v-model="answers[subQ.id] as Fraction"
                        class="fraction-answer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Regular Question Types (only show if NOT composite) -->
              <template v-else>
              <!-- Multiple Choice -->
              <div v-if="currentQuestion.questionType === 'multiple-choice'" class="answer-options">
                <label
                  v-for="(option, index) in currentQuestion.options"
                  :key="index"
                  class="option-label"
                >
                  <input
                    type="radio"
                    :name="`question-${currentQuestion.id}`"
                    :value="index.toString()"
                    v-model="answers[currentQuestion.id]"
                  >
                  <span v-html="renderLatexInText(option)"></span>
                </label>
              </div>

              <!-- Fraction Question -->
              <div v-else-if="currentQuestion.questionType === 'fraction'" class="fraction-question">
                <p class="fraction-instruction">Enter your answer as a fraction:</p>
                <FractionInput
                  v-model="answers[currentQuestion.id] as Fraction"
                  class="fraction-answer"
                />
                <p class="fraction-help">
                  💡 Tip: You can enter whole numbers, decimals, or fractions. Click "Simplify" to reduce to lowest terms.
                </p>
              </div>

              <!-- Fill in the Blank -->
              <div v-else-if="currentQuestion.questionType === 'fill-blank'" class="fill-blank-answer">
                <div class="fill-blank-display" v-html="renderFillBlankQuestion(currentQuestion)"></div>
                <input
                  :key="currentQuestion.id"
                  v-model="answers[currentQuestion.id] as string"
                  type="text"
                  class="fill-blank-input"
                  :placeholder="getFillBlankPlaceholder(currentQuestion)"
                  @input="handleFillBlankInput(currentQuestion.id, $event)"
                />
                <small class="fill-blank-hint" v-if="currentQuestion.blankFormat">
                  Enter only the number (the unit is already shown above)
                </small>
              </div>

              <!-- Short Answer -->
              <div v-else-if="currentQuestion.questionType === 'short-answer'" class="answer-input">
                <div class="answer-with-prefix-suffix" :class="{ 'has-prefix-suffix': currentQuestion.answerPrefix || currentQuestion.answerSuffix }">
                  <span v-if="currentQuestion.answerPrefix" class="answer-prefix">{{ currentQuestion.answerPrefix }}</span>
                  <RichTextAnswerInput
                    :key="currentQuestion.id"
                    v-model="answers[currentQuestion.id] as string"
                    :placeholder="currentQuestion.answerSuffix ? `Enter answer` : 'Enter your answer...'"
                    :compact="!!(currentQuestion.answerPrefix || currentQuestion.answerSuffix)"
                  />
                  <span v-if="currentQuestion.answerSuffix" class="answer-suffix">{{ currentQuestion.answerSuffix }}</span>
                </div>
              </div>

              <!-- Algebra Tiles -->
              <div v-else-if="currentQuestion.questionType === 'algebra-tiles'" class="algebra-tiles-question">
                <div class="algebra-instructions">
                  <p>Use the algebra tiles below to build the expression. Click on a tile type to select it, then click on the grid to place it.</p>
                </div>
                <AlgebraTiles
                  :key="currentQuestion.id"
                  v-model="answers[currentQuestion.id] as string"
                  :showEvaluation="true"
                />
              </div>

              <!-- True/False -->
              <div v-else-if="currentQuestion.questionType === 'true-false'" class="true-false-options">
                <label class="option-label">
                  <input
                    type="radio"
                    :name="`question-${currentQuestion.id}`"
                    value="true"
                    v-model="answers[currentQuestion.id]"
                  >
                  <span>True</span>
                </label>
                <label class="option-label">
                  <input
                    type="radio"
                    :name="`question-${currentQuestion.id}`"
                    value="false"
                    v-model="answers[currentQuestion.id]"
                  >
                  <span>False</span>
                </label>
              </div>

              <!-- Matching Questions -->
              <div v-else-if="currentQuestion.questionType === 'matching'" class="matching-question">
                <p class="matching-instruction">Match each item on the left with the correct item on the right:</p>
                <div class="matching-container">
                  <div class="matching-left">
                    <h4>Items to Match:</h4>
                    <div
                      v-for="(leftItem, index) in currentQuestion.leftItems"
                      :key="index"
                      class="matching-item left-item"
                      :class="{ 'matched': getMatchForLeftItem(leftItem) }"
                    >
                      <span class="item-text" v-html="renderLatexInText(leftItem)"></span>
                      <select
                        :value="getMatchForLeftItem(leftItem)"
                        @change="updateMatch(leftItem, ($event.target as HTMLSelectElement)?.value || '')"
                        class="match-select"
                      >
                        <option value="">Select match...</option>
                        <option
                          v-for="rightItem in currentQuestion.rightItems"
                          :key="rightItem"
                          :value="rightItem"
                        v-html="renderLatexInText(rightItem)"></option>
                      </select>
                    </div>
                  </div>
                  <div class="matching-right">
                    <h4>Available Matches:</h4>
                    <div
                      v-for="rightItem in currentQuestion.rightItems"
                      :key="rightItem"
                      class="matching-item right-item"
                      :class="{ 'used': isRightItemUsed(rightItem) }"
                    >
                      <span v-html="renderLatexInText(rightItem)"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Rank Order Questions -->
              <div v-else-if="currentQuestion.questionType === 'rank-order'" class="rank-order-question">
                <p class="rank-instruction">
                  Drag the items below to put them in the correct order
                  ({{ currentQuestion.orderType === 'ascending' ? 'smallest to largest' :
                      currentQuestion.orderType === 'descending' ? 'largest to smallest' :
                      'correct sequence' }}):
                </p>
                <div class="rank-container">
                  <div
                    v-for="(item, index) in getRankOrderItems()"
                    :key="item"
                    class="rank-item"
                    draggable="true"
                    @dragstart="startDrag(index, item)"
                    @dragover.prevent
                    @drop="dropItem(index)"
                    @dragenter.prevent
                  >
                    <div class="rank-number">{{ index + 1 }}</div>
                    <div class="rank-content" v-html="renderLatexInText(item)"></div>
                    <div class="drag-handle">⋮⋮</div>
                  </div>
                </div>
                <p class="rank-help">💡 Tip: Click and drag items to reorder them</p>
              </div>

              <!-- Checkbox Questions -->
              <div v-else-if="currentQuestion.questionType === 'checkbox'" class="checkbox-question">
                <p class="checkbox-instruction">Select all correct answers:</p>
                <div class="checkbox-options">
                  <label
                    v-for="(option, index) in currentQuestion.options"
                    :key="index"
                    class="checkbox-label"
                  >
                    <input
                      type="checkbox"
                      :value="index.toString()"
                      :checked="getCheckboxAnswers(currentQuestion.id).includes(index.toString())"
                      @change="toggleCheckboxAnswer(currentQuestion.id, index.toString())"
                      class="checkbox-input"
                    >
                    <span class="checkbox-text" v-html="renderLatexInText(option)"></span>
                  </label>
                </div>
                <p class="checkbox-help">
                  💡 Tip: You can select multiple answers. Make sure to choose all that are correct.
                </p>
              </div>

              <!-- Horizontal Ordering Questions -->
              <div v-else-if="currentQuestion.questionType === 'horizontal-ordering'" class="horizontal-ordering-question">
                <HorizontalOrderingInput
                  :items="currentQuestion.orderingItems || []"
                  :correct-order="currentQuestion.correctHorizontalOrder || []"
                  :order-direction="currentQuestion.orderDirection || 'ascending'"
                  :max-items="8"
                  :model-value="getHorizontalOrderingAnswer(currentQuestion.id)"
                  @update:modelValue="setHorizontalOrderingAnswer(currentQuestion.id, $event)"
                />
                <p class="horizontal-ordering-help">
                  💡 Tip: Drag items from the bottom to the ordering area above. Items will be numbered in the order you place them.
                </p>
              </div>
              </template>
              <!-- End of regular question types -->
            </div>
          </div>

          <!-- Navigation -->
          <div class="navigation-section">
            <button
              @click="previousQuestion"
              :disabled="currentQuestionIndex === 0"
              class="nav-button prev-button"
            >
              ← Previous
            </button>

            <div class="question-indicator">
              <span
                v-for="(question, index) in assessment.questions"
                :key="question.id"
                class="question-dot"
                :class="{
                  'current': index === currentQuestionIndex,
                  'answered': answers[question.id] !== undefined && answers[question.id] !== ''
                }"
                @click="goToQuestion(index)"
              ></span>
            </div>

            <button
              v-if="!isLastQuestion"
              @click="nextQuestion"
              class="nav-button next-button"
            >
              Next →
            </button>
            <button
              v-else
              @click="nextQuestion"
              class="nav-button review-button"
            >
              Review & Submit →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Camera Capture Modal -->
    <CameraCapture
      v-if="showCamera"
      @close="showCamera = false"
      @photoTaken="handlePhotoTaken"
      :isMultiPage="assessment?.requireMultiplePages"
      :currentPage="currentPageIndex + 1"
      :totalPages="assessment?.requiredPageCount || 1"
      :pageLabel="getCurrentPageLabel()"
      :orientation="assessment?.photoOrientation || 'portrait'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getAssessment, saveAssessmentResult, getAssessmentResultsByStudent } from '@/firebase/iepServices';
import { doc, updateDoc, arrayUnion, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import CameraCapture from '@/components/CameraCapture.vue';
import FractionInput from '@/components/FractionInput.vue';
import HorizontalOrderingInput from '@/components/HorizontalOrderingInput.vue';
import RichTextAnswerInput from '@/components/RichTextAnswerInput.vue';
import AlgebraTiles from '@/components/AlgebraTiles.vue';
import type { Assessment, AssessmentQuestion, FractionAnswer } from '@/types/iep';
import { checkFractionAnswer, type Fraction } from '@/utils/fractionUtils';
import { parseStandards, formatStandardsForDisplay } from '@/utils/standardsUtils';
import { areAnswersEquivalent, areAnswersEquivalentBasic, areFractionsEquivalent, convertHtmlAnswerToText, debugAnswerConversion } from '@/utils/answerUtils';
import { renderLatexInText } from '@/utils/latexUtils';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// State
const assessment = ref<Assessment | null>(null);
const loading = ref(true);
const error = ref('');
const started = ref(false);
const currentQuestionIndex = ref(0);
const answers = ref<Record<string, string | Fraction>>({});
const showingInstructions = ref(true);
const onFinalScreen = ref(false);
const uploadedFiles = ref<File[]>([]);
const startTime = ref<Date | null>(null);
const timeRemaining = ref(0);
const fileInput = ref<HTMLInputElement>();

// Retake tracking
const existingResults = ref<any[]>([]);
const isRetake = ref(false);
const attemptNumber = ref(1);
const showRetakeWarning = ref(false);

// Timer
let timerInterval: number | null = null;

// Computed
const currentQuestion = computed(() => {
  if (!assessment.value?.questions || currentQuestionIndex.value >= assessment.value.questions.length || onFinalScreen.value) {
    return null;
  }
  return assessment.value.questions[currentQuestionIndex.value];
});

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value >= (assessment.value?.questions?.length || 0) - 1;
});

const progressPercentage = computed(() => {
  if (!assessment.value?.questions?.length) return 0;
  return ((currentQuestionIndex.value + 1) / assessment.value.questions.length) * 100;
});

// Methods
const loadAssessment = async () => {
  try {
    const assessmentId = route.params.id as string;
    console.log('📝 Loading assessment for taking:', assessmentId);

    const data = await getAssessment(assessmentId);
    if (data) {
      assessment.value = data;

      // Check if any questions require photo upload
      const hasPhotoRequirement = data.questions?.some(q => q.requiresPhoto)
      if (hasPhotoRequirement && !data.allowFileUpload) {
        // Automatically enable file uploads for assessments with photo requirements
        data.allowFileUpload = true
        data.requireFileUpload = true
        data.fileUploadInstructions = data.fileUploadInstructions || 'Upload photos of your work for all questions that require it. Make sure your work is clear and legible.'
        assessment.value = data
        console.log('📷 Photo upload enabled - questions require showing work')
      }

      // Check for existing results to determine if this is a retake
      if (authStore.currentUser?.uid) {
        const studentId = authStore.currentUser.uid || authStore.currentUser.googleId || authStore.currentUser.seisId;

        if (studentId) {
          try {
            const allStudentResults = await getAssessmentResultsByStudent(studentId);
          existingResults.value = allStudentResults.filter(result => result.assessmentId === assessmentId);

          if (existingResults.value.length > 0) {
            isRetake.value = true;
            attemptNumber.value = existingResults.value.length + 1;

            console.log(`🔄 This is attempt #${attemptNumber.value} for this assessment`);
            console.log('📊 Previous results:', existingResults.value.length);

            // Check if retakes are allowed
            if (!assessment.value.allowRetakes) {
              error.value = 'This assessment does not allow retakes. You have already completed it.';
              return;
            }

            // Check if max retakes exceeded
            if (assessment.value.maxRetakes && assessment.value.maxRetakes > 0) {
              if (existingResults.value.length >= assessment.value.maxRetakes + 1) { // +1 because first attempt isn't a retake
                error.value = `Maximum retakes exceeded. You have already taken this assessment ${existingResults.value.length} times.`;
                return;
              }
            }

            showRetakeWarning.value = true;
          }
        } catch (resultsError) {
          console.warn('Could not check existing results:', resultsError);
        }
        }
      }

      // Initialize timer if time limit exists
      if (assessment.value.timeLimit) {
        timeRemaining.value = assessment.value.timeLimit * 60; // Convert to seconds
      }

      console.log('✅ Assessment loaded:', assessment.value.title);
    } else {
      error.value = 'Assessment not found or not assigned to you.';
    }
  } catch (err: any) {
    console.error('Error loading assessment:', err);
    error.value = 'Failed to load assessment. Please try again.';
  } finally {
    loading.value = false;
  }
};

const startAssessment = async () => {
  // Check for saved progress before starting
  if (assessment.value?.id && authStore.currentUser?.uid) {
    const savedProgress = await loadSavedProgress();
    if (savedProgress) {
      // Inform the student they'll continue where they left off (no cancel option)
      alert(
        `Assessment in progress\n\nYou have answered ${Object.keys(savedProgress.answers).length} of ${assessment.value.questions?.length || 0} questions.\n\nYou will continue where you left off.`
      );

      // Automatically restore saved progress
      answers.value = savedProgress.answers;
      currentQuestionIndex.value = savedProgress.currentQuestionIndex;
      if (savedProgress.startTime) {
        startTime.value = new Date(savedProgress.startTime);
      }
      console.log('✅ Resumed from saved progress');
    }
  }

  started.value = true;
  showingInstructions.value = false;
  if (!startTime.value) {
    startTime.value = new Date();
  }

  // Start timer if time limit exists
  if (assessment.value?.timeLimit) {
    timerInterval = setInterval(() => {
      timeRemaining.value--;
      if (timeRemaining.value <= 0) {
        submitAssessment();
      }
    }, 1000);
  }

  console.log('🚀 Assessment started');
};

// Fill-blank helper methods
const renderFillBlankQuestion = (question: AssessmentQuestion): string => {
  if (!question.blankFormat) {
    return renderLatexInText(question.questionText);
  }
  // Replace ___ with a styled blank indicator
  const blankFormat = question.blankFormat.replace(/___/g, '<span class="fill-blank-indicator">______</span>');
  return renderLatexInText(blankFormat);
};

const getFillBlankPlaceholder = (question: AssessmentQuestion): string => {
  if (!question.blankFormat) return 'Enter your answer...';
  // Extract unit from blank format if present
  const unitMatch = question.blankFormat.match(/(?:___\s*)?(\w+)/);
  if (unitMatch && unitMatch[1] && unitMatch[1] !== '___') {
    return `Enter number only (${unitMatch[1]} shown above)`;
  }
  return 'Enter number only';
};

const handleFillBlankInput = (questionId: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  // Only allow numeric input (with optional decimal point)
  const value = input.value.replace(/[^0-9.-]/g, '');
  answers.value[questionId] = value;
};

// Extract numeric value from a string (handles units, text, etc.)
const extractNumericValue = (value: string): number | null => {
  if (!value) return null;
  // Remove common units and text, extract number
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const hideInstructions = () => {
  showingInstructions.value = false;
};

const nextQuestion = async () => {
  // Auto-save progress before moving to next question
  if (started.value && assessment.value?.id) {
    await saveProgress();
  }

  if (currentQuestionIndex.value < (assessment.value?.questions?.length || 0) - 1) {
    currentQuestionIndex.value++;
  } else {
    // Go to final screen for file upload and submission
    onFinalScreen.value = true;
  }
};

const previousQuestion = async () => {
  // Auto-save progress before moving to previous question
  if (started.value && assessment.value?.id) {
    await saveProgress();
  }

  if (onFinalScreen.value) {
    onFinalScreen.value = false;
    // Go back to last question
    currentQuestionIndex.value = (assessment.value?.questions?.length || 0) - 1;
  } else if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

const goToQuestion = async (index: number) => {
  // Auto-save progress before jumping to a question
  if (started.value && assessment.value?.id) {
    await saveProgress();
  }

  currentQuestionIndex.value = index;
};

const uploadFilesToStorage = async (files: File[], studentUid: string, assessmentId: string): Promise<any[]> => {
  const uploadPromises = files.map(async (file) => {
    try {
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'unknown';
      const filename = `${timestamp}_${file.name}`;

      // Create storage path: assessments/{studentUid}/{assessmentId}/{filename}
      const filePath = `assessments/${studentUid}/${assessmentId}/${filename}`;
      const fileRef = storageRef(storage, filePath);

      console.log('📤 Uploading file:', file.name, 'to', filePath);

      // Upload file
      const snapshot = await uploadBytes(fileRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('✅ File uploaded successfully:', downloadURL);

      // Return file metadata matching UploadedFile interface
      return {
        id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: filename,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadUrl: downloadURL,
        uploadedAt: new Date(), // Use regular Date instead of serverTimestamp() to avoid array issues
        storagePath: filePath
      };
    } catch (error) {
      console.error('❌ Error uploading file:', file.name, error);
      throw new Error(`Failed to upload ${file.name}`);
    }
  });

  return Promise.all(uploadPromises);
};

const submitAssessment = async () => {
  try {
    console.log('📤 Submitting assessment...');

    // Calculate time spent
    const timeSpent = startTime.value ?
      Math.round((new Date().getTime() - startTime.value.getTime()) / 1000 / 60) : 0;

    // Calculate score and create responses
    let correctAnswers = 0;
    const totalQuestions = assessment.value?.questions?.length || 0;
    const responses: any[] = [];

    assessment.value?.questions?.forEach((question, index) => {
      const userAnswer = answers.value[question.id] || ''; // Use question.id instead of index
      let isCorrect = false;

      // Handle different question types for answer comparison
      if (question.questionType === 'multiple-choice') {
        // For multiple choice, userAnswer is the option index, correctAnswer should be index
        // Primary check: compare option indices directly
        isCorrect = userAnswer === question.correctAnswer;

        // Fallback: if correct answer is text instead of index, try text comparison
        if (!isCorrect) {
          const selectedOptionText = question.options?.[parseInt(userAnswer as string)] || '';
          // Use enhanced comparison for text that might contain KaTeX
          if (selectedOptionText && question.correctAnswer && typeof question.correctAnswer === 'string') {
            isCorrect = areAnswersEquivalent(selectedOptionText, question.correctAnswer);
          }
        }

        // Also check acceptable answers for multiple choice
        if (!isCorrect && question.acceptableAnswers && question.acceptableAnswers.length > 0) {
          for (const acceptableAnswer of question.acceptableAnswers) {
            // Check index match first
            if (userAnswer === acceptableAnswer) {
              isCorrect = true;
              console.log(`✅ Multiple choice matched acceptable answer index: ${acceptableAnswer}`);
              break;
            }

            // Then check text match with KaTeX handling
            const selectedOptionText = question.options?.[parseInt(userAnswer as string)] || '';
            if (selectedOptionText && areAnswersEquivalent(selectedOptionText, acceptableAnswer)) {
              isCorrect = true;
              console.log(`✅ Multiple choice matched acceptable answer text: ${acceptableAnswer}`);
              break;
            }
          }
        }

        // Enhanced debug logging for multiple choice
        console.log(`🔍 Multiple Choice Debug for Question ${index + 1}:`, {
          userAnswerIndex: userAnswer,
          selectedOptionText: question.options?.[parseInt(userAnswer as string)] || '',
          correctAnswerValue: question.correctAnswer,
          isCorrect: isCorrect,
          optionsCount: question.options?.length || 0
        });
      } else if (question.questionType === 'fraction') {
        // For fraction questions, check against all acceptable fraction answers
        if (question.correctFractionAnswers && typeof userAnswer === 'object') {
          isCorrect = checkFractionAnswer(userAnswer as Fraction, question.correctFractionAnswers);
        } else if (question.correctFractionAnswers && typeof userAnswer === 'string') {
          isCorrect = checkFractionAnswer(userAnswer, question.correctFractionAnswers);
        }
      } else if (question.questionType === 'matching') {
        // For matching questions, check if all pairs are correctly matched
        if (question.correctMatches && typeof userAnswer === 'object' && !Array.isArray(userAnswer) && userAnswer !== null && !('numerator' in userAnswer)) {
          const userMatches = userAnswer as { [key: string]: string };
          const correctMatches = question.correctMatches;

          // Check if all correct matches are present and accurate
          let allCorrect = true;
          for (const [leftItem, correctRightItem] of Object.entries(correctMatches)) {
            if (userMatches[leftItem] !== correctRightItem) {
              allCorrect = false;
              break;
            }
          }

          // Also check that no extra incorrect matches were made
          if (allCorrect) {
            for (const [leftItem, userRightItem] of Object.entries(userMatches)) {
              if (correctMatches[leftItem] !== userRightItem) {
                allCorrect = false;
                break;
              }
            }
          }

          isCorrect = allCorrect;
        }
      } else if (question.questionType === 'rank-order') {
        // For rank-order questions, check if items are in correct order
        if (question.correctOrder && Array.isArray(userAnswer)) {
          const userOrder = userAnswer as string[];
          const correctOrder = question.correctOrder;

          // Check if arrays are same length and in same order
          isCorrect = userOrder.length === correctOrder.length &&
                     userOrder.every((item, index) => item === correctOrder[index]);
        }
      } else if (question.questionType === 'checkbox') {
        // For checkbox questions, check if selected answers match all correct answers
        if (question.correctAnswers && Array.isArray(userAnswer)) {
          const userAnswers = userAnswer as string[];
          const correctAnswers = question.correctAnswers;

          // Check if arrays have same length and contain same elements
          isCorrect = userAnswers.length === correctAnswers.length &&
                     userAnswers.every(answer => correctAnswers.includes(answer)) &&
                     correctAnswers.every(answer => userAnswers.includes(answer));
        }
      } else if (question.questionType === 'horizontal-ordering') {
        // For horizontal ordering questions, check if items are in correct order
        if (question.correctHorizontalOrder) {
          // Handle both array and comma-separated string formats
          let userOrder: string[] = [];

          if (Array.isArray(userAnswer)) {
            userOrder = userAnswer as string[];
          } else if (typeof userAnswer === 'string') {
            // If it's a comma-separated string, split it into an array
            // Handle cases like "$-17$,-24,$|-45|$,$|53|$"
            userOrder = userAnswer.split(',').map(item => item.trim()).filter(item => item.length > 0);
          } else {
            isCorrect = false;
          }

          const correctOrder = question.correctHorizontalOrder;

          // Check if arrays are same length
          if (userOrder.length !== correctOrder.length) {
            isCorrect = false;
            console.log('📊 Horizontal Ordering: Length mismatch', {
              userLength: userOrder.length,
              correctLength: correctOrder.length,
              userOrder,
              correctOrder
            });
          } else {
            // Compare each item using enhanced matching (handles equivalent values, whitespace, LaTeX, etc.)
            isCorrect = userOrder.every((userItem, index) => {
              const correctItem = correctOrder[index];

              // First try exact match (handles LaTeX strings like "$\\frac{1}{2}$")
              if (userItem === correctItem) {
                return true;
              }

              // Normalize LaTeX formatting first (remove $ wrappers, etc.)
              let normalizedUser = userItem.trim();
              let normalizedCorrect = correctItem.trim();

              // Strip LaTeX formatting if present
              normalizedUser = normalizedUser.replace(/^\$\$?(.*?)\$\$?$/, '$1');
              normalizedCorrect = normalizedCorrect.replace(/^\$\$?(.*?)\$\$?$/, '$1');

              // Try normalized comparison after stripping LaTeX
              if (normalizedUser === normalizedCorrect) {
                return true;
              }

              // Try enhanced comparison (handles fractions, decimals, LaTeX expressions, etc.)
              // This will handle cases like:
              // - "$\\frac{1}{2}$" vs "$\\frac{2}{4}$" (equivalent fractions)
              // - "$0.5$" vs "$\\frac{1}{2}$" (decimal vs fraction)
              // - "$\\frac{1}{2}$" vs "1/2" (LaTeX vs plain text)
              // - "$-17$" vs "-17" (LaTeX vs plain text)
              // - "$|-45|$" vs "|-45|" (LaTeX vs plain text)
              return areAnswersEquivalent(normalizedUser, normalizedCorrect);
            });
          }

          console.log('📊 Horizontal Ordering Check:', {
            userOrder,
            correctOrder,
            isCorrect,
            matchDetails: userOrder.map((item, idx) => ({
              user: item,
              correct: correctOrder[idx],
              matches: item === correctOrder[idx] || areAnswersEquivalent(item.trim(), correctOrder[idx].trim())
            }))
          });
        }
      } else if (question.questionType === 'fill-blank') {
        // Fill-blank questions: extract numeric value and compare
        if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
          const trimmedUserAnswer = userAnswer.trim();
          const trimmedCorrectAnswer = question.correctAnswer.trim();

          // Extract numeric value from user answer (remove any units or text)
          const userNumeric = extractNumericValue(trimmedUserAnswer);
          const correctNumeric = extractNumericValue(trimmedCorrectAnswer);

          // Compare numeric values
          isCorrect = userNumeric !== null && correctNumeric !== null &&
                     Math.abs(userNumeric - correctNumeric) < 0.0001; // Handle floating point precision

          // Also check acceptable answers if available
          if (!isCorrect && question.acceptableAnswers && question.acceptableAnswers.length > 0) {
            for (const acceptableAnswer of question.acceptableAnswers) {
              const acceptableNumeric = extractNumericValue(acceptableAnswer.trim());
              if (acceptableNumeric !== null && userNumeric !== null &&
                  Math.abs(userNumeric - acceptableNumeric) < 0.0001) {
                isCorrect = true;
                console.log(`✅ Matched acceptable answer: "${acceptableAnswer}"`);
                break;
              }
            }
          }

          console.log(`📝 Fill-Blank Answer Comparison for Question ${index + 1}:`, {
            userAnswer: trimmedUserAnswer,
            userNumeric,
            correctAnswer: trimmedCorrectAnswer,
            correctNumeric,
            isCorrect
          });
        }
      } else {
        // For other question types (short-answer, essay, etc.), use enhanced comparison
        if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
          // Trim whitespace from user answer before comparison
          const trimmedUserAnswer = userAnswer.trim();
          const trimmedCorrectAnswer = question.correctAnswer.trim();

          // For short-answer questions, check if equivalent fractions should be accepted
          const shouldCheckFractions = question.questionType === 'short-answer' && question.acceptEquivalentFractions;
          // Check if any variable should be accepted
          const shouldAcceptAnyVariable = question.questionType === 'short-answer' && question.acceptAnyVariable;

          // Use basic comparison (no fraction equivalence) first
          isCorrect = areAnswersEquivalentBasic(trimmedUserAnswer, trimmedCorrectAnswer, shouldAcceptAnyVariable);

          // If basic check failed and equivalent fractions are enabled, check fraction equivalence
          if (!isCorrect && shouldCheckFractions) {
            if (areFractionsEquivalent(trimmedUserAnswer, trimmedCorrectAnswer)) {
              isCorrect = true;
              console.log(`✅ Short answer matched equivalent fraction`);
            }
          }

          // Debug logging for answer comparison
          console.log(`📝 Answer Comparison for Question ${index + 1}:`, {
            questionType: question.questionType,
            originalAnswer: userAnswer,
            trimmedAnswer: trimmedUserAnswer,
            convertedAnswer: convertHtmlAnswerToText(trimmedUserAnswer),
            correctAnswer: trimmedCorrectAnswer,
            acceptEquivalentFractions: shouldCheckFractions,
            acceptAnyVariable: shouldAcceptAnyVariable,
            isCorrect: isCorrect
          });

          // Also check acceptable answers if available
          if (!isCorrect && question.acceptableAnswers && question.acceptableAnswers.length > 0) {
            for (const acceptableAnswer of question.acceptableAnswers) {
              const trimmedAcceptableAnswer = acceptableAnswer.trim();
              // Use basic comparison for acceptable answers too
              if (areAnswersEquivalentBasic(trimmedUserAnswer, trimmedAcceptableAnswer, shouldAcceptAnyVariable)) {
                isCorrect = true;
                console.log(`✅ Matched acceptable answer: "${trimmedAcceptableAnswer}" (original: "${acceptableAnswer}")`);
                break;
              }
              // If equivalent fractions enabled, also check fraction equivalence
              if (!isCorrect && shouldCheckFractions) {
                if (areFractionsEquivalent(trimmedUserAnswer, trimmedAcceptableAnswer)) {
                  isCorrect = true;
                  console.log(`✅ Matched acceptable answer as equivalent fraction: "${trimmedAcceptableAnswer}"`);
                  break;
                }
              }
            }
          }
        } else {
          // Fallback to simple comparison for non-string answers
          isCorrect = userAnswer.toString().trim().toLowerCase() === question.correctAnswer.toString().trim().toLowerCase();
        }
      }

      // Calculate points earned - handle composite questions
      let pointsEarned = 0;

      if (question.subQuestions && question.subQuestions.length > 0) {
        // This is a composite question - score based on sub-questions
        const subQuestionResults = question.subQuestions.map(subQ => {
          const subAnswer = answers.value[subQ.id] || '';
          let subIsCorrect = false;

          // Check sub-question answer based on its type
          if (subQ.questionType === 'multiple-choice') {
            subIsCorrect = subAnswer === subQ.correctAnswer;
          } else if (subQ.questionType === 'true-false') {
            subIsCorrect = subAnswer === subQ.correctAnswer;
          } else if (subQ.questionType === 'fraction') {
            if (subQ.correctAnswer && typeof subAnswer === 'object') {
              const fractionAnswers = Array.isArray(subQ.correctAnswer) ? subQ.correctAnswer : [subQ.correctAnswer];
              subIsCorrect = checkFractionAnswer(subAnswer as Fraction, fractionAnswers);
            }
          } else if (subQ.questionType === 'short-answer') {
            if (typeof subAnswer === 'string' && typeof subQ.correctAnswer === 'string') {
              subIsCorrect = areAnswersEquivalent(subAnswer.trim(), subQ.correctAnswer.trim());

              // Check acceptable answers
              if (!subIsCorrect && subQ.acceptableAnswers && subQ.acceptableAnswers.length > 0) {
                for (const acceptableAnswer of subQ.acceptableAnswers) {
                  if (areAnswersEquivalent(subAnswer.trim(), acceptableAnswer.trim())) {
                    subIsCorrect = true;
                    break;
                  }
                }
              }
            }
          }

          return {
            subQuestionId: subQ.id,
            isCorrect: subIsCorrect,
            pointWeight: subQ.pointWeight
          };
        });

        // Calculate final points based on scoring mode
        if (question.subQuestionScoringMode === 'all-or-nothing') {
          // All parts must be correct to earn ANY points
          const allCorrect = subQuestionResults.every(result => result.isCorrect);
          pointsEarned = allCorrect ? question.points : 0;
          isCorrect = allCorrect;

          console.log(`🔗 Composite question (all-or-nothing):`, {
            questionId: question.id,
            totalParts: subQuestionResults.length,
            correctParts: subQuestionResults.filter(r => r.isCorrect).length,
            allCorrect,
            pointsEarned
          });
        } else {
          // Proportional scoring - earn credit for each correct part
          const earnedWeight = subQuestionResults
            .filter(result => result.isCorrect)
            .reduce((sum, result) => sum + result.pointWeight, 0);

          pointsEarned = earnedWeight * question.points;
          isCorrect = earnedWeight === 1; // Only fully correct if all parts are correct

          console.log(`📊 Composite question (proportional):`, {
            questionId: question.id,
            totalParts: subQuestionResults.length,
            correctParts: subQuestionResults.filter(r => r.isCorrect).length,
            earnedWeight,
            maxPoints: question.points,
            pointsEarned
          });
        }
      } else {
        // Regular single question
        pointsEarned = isCorrect ? question.points : 0;
      }

      console.log(`🔍 Question ${index + 1} (${question.questionType}):`, {
        questionId: question.id,
        questionText: question.questionText.substring(0, 50) + '...',
        userAnswer: typeof userAnswer === 'object' ? JSON.stringify(userAnswer) : userAnswer,
        selectedOptionText: question.questionType === 'multiple-choice' ? question.options?.[parseInt(userAnswer as string)] : 'N/A',
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        points: pointsEarned
      });

      if (isCorrect) {
        correctAnswers++;
      }

      // Build response object, only including standard if it exists
      // For horizontal ordering, ensure answer is saved as array, not comma-separated string
      let answerToSave: string | string[] | Fraction = userAnswer || '';
      if (question.questionType === 'horizontal-ordering') {
        if (typeof answerToSave === 'string' && answerToSave.includes(',')) {
          // Convert comma-separated string back to array
          answerToSave = answerToSave.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else if (!Array.isArray(answerToSave)) {
          // Ensure it's an array for horizontal ordering
          answerToSave = Array.isArray(userAnswer) ? userAnswer : [];
        }
      }

      const response: any = {
        questionId: question.id,
        studentAnswer: answerToSave, // Ensure it's never undefined
        isCorrect: isCorrect,
        pointsEarned: pointsEarned,
        standardSyncedAt: new Date()
      };

      // Only add cachedStandard if it exists (avoid undefined)
      if (question.standard) {
        response.cachedStandard = question.standard;
      }

      responses.push(response);
    });

    const score = responses.reduce((sum, response) => sum + response.pointsEarned, 0);
    const totalPoints = assessment.value?.totalPoints || totalQuestions;
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    // Upload files to Firebase Storage if any
    let uploadedFileData: any[] = [];
    if (uploadedFiles.value.length > 0 && authStore.currentUser?.uid && assessment.value?.id) {
      try {
        console.log('📤 Uploading', uploadedFiles.value.length, 'files to Storage...');
        uploadedFileData = await uploadFilesToStorage(
          uploadedFiles.value,
          authStore.currentUser.uid,
          assessment.value.id
        );
        console.log('✅ All files uploaded successfully');
      } catch (error) {
        console.error('❌ Error uploading files:', error);
        alert('Warning: Some files failed to upload, but assessment will still be saved.');
      }
    }

    // Handle retake logic based on retake mode
    let resultData: any;

    if (isRetake.value && assessment.value?.retakeMode === 'combined') {
      // Combined mode - update existing result with new attempt
      const existingResult = existingResults.value[0]; // Use first (and should be only) result

      const newAttempt = {
        attemptNumber: attemptNumber.value,
        responses: responses,
        score: score,
        percentage: percentage,
        timeSpent: timeSpent,
        completedAt: new Date(),
        uploadedFiles: uploadedFileData
      };

      // Update existing result with new attempt
      resultData = {
        ...existingResult,
        // Update main fields with best/latest attempt
        responses: responses,
        score: Math.max(existingResult.score || 0, score), // Keep best score
        percentage: Math.max(existingResult.percentage || 0, percentage),
        timeSpent: timeSpent, // Latest time
        completedAt: new Date(), // Update completion date
        previousAttempts: [...(existingResult.previousAttempts || []), newAttempt],
        attemptNumber: attemptNumber.value,
        isRetake: true,
        uploadedFiles: uploadedFileData,
        gradedBy: 'auto-graded',
        feedback: existingResult.feedback || '',
        accommodationsUsed: existingResult.accommodationsUsed || []
      };

      console.log('🔄 Combined mode - updating existing result with new attempt');
    } else {
      // Separate mode or first attempt - create new result
      resultData = {
        assessmentId: assessment.value?.id || '',
        studentSeisId: authStore.currentUser?.uid || authStore.currentUser?.googleId || authStore.currentUser?.seisId || '',
        studentUid: authStore.currentUser?.uid || '',
        responses: responses,
        score: score,
        totalPoints: totalPoints,
        percentage: percentage,
        timeSpent: timeSpent,
        completedAt: new Date(),
        gradedBy: 'auto-graded',
        feedback: '',
        accommodationsUsed: [],
        uploadedFiles: uploadedFileData,

        // Cached fields for faster queries and reporting
        assessmentCategory: assessment.value?.category || 'Other',

        // Retake tracking
        attemptNumber: attemptNumber.value,
        isRetake: isRetake.value,
        previousAttempts: []
      };

      // Only add goalId if it exists (avoid undefined)
      if (assessment.value?.goalId) {
        resultData.goalId = assessment.value.goalId;
      }

      // Cache student's course info from their profile (if available) for grouping/reporting
      if (authStore.currentUser?.courseId) {
        resultData.studentCourseId = authStore.currentUser.courseId;
      }
      if (authStore.currentUser?.courseName) {
        resultData.studentCourseName = authStore.currentUser.courseName;
      }
      if (authStore.currentUser?.section) {
        resultData.studentSection = authStore.currentUser.section;
      }
      if (authStore.currentUser?.period) {
        resultData.studentPeriod = authStore.currentUser.period;
      }

      console.log(`📝 ${isRetake.value ? 'Separate mode - creating new result for retake' : 'First attempt - creating new result'}`);
    }

    console.log('💾 Saving assessment result:', resultData);

    // Save assessment result to Firestore
    const resultId = await saveAssessmentResult(resultData);

    console.log('✅ Assessment result saved successfully!', resultId);

    // Clear saved progress after successful submission
    await clearSavedProgress();

    // Update student's completedAssessments array
    if (authStore.currentUser?.uid) {
      try {
        const studentDoc = doc(db, 'students', authStore.currentUser.uid);
        await updateDoc(studentDoc, {
          completedAssessments: arrayUnion(resultId),
          updatedAt: serverTimestamp()
        });
        console.log('✅ Updated student completedAssessments array');
      } catch (error) {
        console.error('⚠️ Error updating student completedAssessments:', error);
      }
    }

    // Show success message and redirect
    const fileMessage = uploadedFileData.length > 0 ? `\n${uploadedFileData.length} files uploaded` : '';
    alert(`Assessment submitted successfully!\nScore: ${score}/${totalQuestions} (${percentage}%)\nTime spent: ${timeSpent} minutes${fileMessage}`);

    router.push('/assessments');

  } catch (err: any) {
    console.error('❌ Error submitting assessment:', err);
    error.value = 'Failed to submit assessment. Please try again.';
  }
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const newFiles = Array.from(target.files);

    // Validate file size and type
    for (const file of newFiles) {
      if (assessment.value?.maxFileSize && file.size > assessment.value.maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${assessment.value.maxFileSize}MB.`);
        continue;
      }

      uploadedFiles.value.push(file);
    }

    // Clear input
    target.value = '';
  }
};

const showCamera = ref(false);
const currentPageIndex = ref(0);
const capturedPages = ref<File[]>([]);

const capturePhoto = () => {
  console.log('📷 Opening camera modal, showCamera was:', showCamera.value);
  showCamera.value = true;
  console.log('📷 Camera modal opened, showCamera is now:', showCamera.value);
};

const selectFile = () => {
  const fileInput = document.querySelector('.file-input') as HTMLInputElement;
  fileInput?.click();
};

const handlePhotoTaken = (file: File) => {
  console.log('📷 Photo received from camera:', file.name, file.size);

  if (assessment.value?.requireMultiplePages) {
    // Multi-page mode: add to specific page
    capturedPages.value[currentPageIndex.value] = file;

    // Check if we need more pages
    const requiredPages = assessment.value.requiredPageCount || 1;
    if (currentPageIndex.value < requiredPages - 1) {
      currentPageIndex.value++;
      console.log(`📄 Moving to page ${currentPageIndex.value + 1}/${requiredPages}`);
      // Keep camera open for next page
      return;
    } else {
      // All required pages captured, add all to uploaded files
      uploadedFiles.value.push(...capturedPages.value.filter(f => f));
    }
  } else {
    // Single page mode: add directly
    uploadedFiles.value.push(file);
  }

  console.log('📷 Closing camera modal');
  showCamera.value = false;
};

const getCurrentPageLabel = () => {
  if (!assessment.value?.requireMultiplePages) return undefined;

  const pageLabels = assessment.value.pageLabels || [];
  return pageLabels[currentPageIndex.value] || `Page ${currentPageIndex.value + 1}`;
};

const getUploadTitle = () => {
  const required = assessment.value?.requireFileUpload ? '(Required)' : '(Optional)';

  if (assessment.value?.requireMultiplePages) {
    const count = assessment.value.requiredPageCount || 1;
    return `Upload Your Work - ${count} Pages ${required}`;
  }

  return `Upload Your Work ${required}`;
};

const getPageLabel = (index: number) => {
  const pageLabels = assessment.value?.pageLabels || [];
  return pageLabels[index] || `Page ${index + 1}`;
};

const removeFile = (fileToRemove: File) => {
  const index = uploadedFiles.value.indexOf(fileToRemove);
  if (index > -1) {
    uploadedFiles.value.splice(index, 1);
  }
};

// Helper methods for retakes
const getScoreClass = (percentage: number): string => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  return 'needs-improvement';
};

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';

  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }

  try {
    return new Date(timestamp).toLocaleDateString();
  } catch (error) {
    console.warn('Unable to format date:', timestamp);
    return 'Invalid Date';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};



const getAcceptedFileTypes = () => {
  if (!assessment.value?.allowedFileTypes?.length) return '*';

  return assessment.value.allowedFileTypes
    .flatMap(type => type.split(','))
    .map(type => type.trim())
    .map(type => type === '*' ? '*' : `.${type}`)
    .join(',');
};



const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Matching question methods
const getMatchForLeftItem = (leftItem: string): string => {
  if (!currentQuestion.value) return '';
  const questionId = currentQuestion.value.id;
  const matchingAnswer = answers.value[questionId] as any;

  if (matchingAnswer && typeof matchingAnswer === 'object') {
    return matchingAnswer[leftItem] || '';
  }
  return '';
};

const updateMatch = (leftItem: string, rightItem: string) => {
  if (!currentQuestion.value) return;
  const questionId = currentQuestion.value.id;

  if (!answers.value[questionId]) {
    answers.value[questionId] = {} as any;
  }

  const matchingAnswer = answers.value[questionId] as any;
  if (rightItem === '') {
    delete matchingAnswer[leftItem];
  } else {
    matchingAnswer[leftItem] = rightItem;
  }
};

const isRightItemUsed = (rightItem: string): boolean => {
  if (!currentQuestion.value) return false;
  const questionId = currentQuestion.value.id;
  const matchingAnswer = answers.value[questionId] as any;

  if (matchingAnswer && typeof matchingAnswer === 'object') {
    return Object.values(matchingAnswer).includes(rightItem);
  }
  return false;
};

// Rank order question methods
const getRankOrderItems = (): string[] => {
  if (!currentQuestion.value) return [];
  const questionId = currentQuestion.value.id;

  // Get current order from answers, or use shuffled original items
  let currentOrder = answers.value[questionId] as any;

  if (!currentOrder || !Array.isArray(currentOrder)) {
    // Initialize with shuffled items if not already set
    const items = [...(currentQuestion.value.itemsToRank || [])].filter(item => item.trim());
    // Shuffle the items for initial display
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    answers.value[questionId] = items as any;
    return items;
  }

  return currentOrder;
};

let draggedItemIndex: number | null = null;

const startDrag = (index: number, item: string) => {
  draggedItemIndex = index;
};

const dropItem = (dropIndex: number) => {
  if (draggedItemIndex === null || !currentQuestion.value) return;

  const questionId = currentQuestion.value.id;
  const currentItems = getRankOrderItems();

  if (draggedItemIndex !== dropIndex) {
    // Remove item from original position and insert at new position
    const draggedItem = currentItems[draggedItemIndex];
    const newOrder = [...currentItems];
    newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    answers.value[questionId] = newOrder as any;
  }

  draggedItemIndex = null;
};

// Checkbox question methods
const getCheckboxAnswers = (questionId: string): string[] => {
  const answer = answers.value[questionId];
  if (Array.isArray(answer)) {
    return answer as string[];
  }
  // Initialize as empty array if not set
  answers.value[questionId] = [] as any;
  return [];
};

const toggleCheckboxAnswer = (questionId: string, value: string) => {
  const currentAnswers = getCheckboxAnswers(questionId);
  const index = currentAnswers.indexOf(value);

  if (index > -1) {
    // Remove if already selected
    currentAnswers.splice(index, 1);
  } else {
    // Add if not selected
    currentAnswers.push(value);
  }

  answers.value[questionId] = currentAnswers as any;
};

// Horizontal ordering question methods
const getHorizontalOrderingAnswer = (questionId: string): string[] => {
  const answer = answers.value[questionId];
  if (Array.isArray(answer)) {
    return answer as string[];
  }
  // Initialize as empty array if not set
  answers.value[questionId] = [] as any;
  return [];
};

const setHorizontalOrderingAnswer = (questionId: string, value: string[]) => {
  answers.value[questionId] = value as any;
};

// Cleanup timer on unmount
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Progress persistence functions
const saveProgress = async () => {
  if (!assessment.value?.id || !authStore.currentUser?.uid || !started.value) return;

  try {
    const progressId = `${authStore.currentUser.uid}_${assessment.value.id}`;
    const progressRef = doc(db, 'assessmentProgress', progressId);

    await setDoc(progressRef, {
      studentUid: authStore.currentUser.uid,
      assessmentId: assessment.value.id,
      answers: answers.value,
      currentQuestionIndex: currentQuestionIndex.value,
      startTime: startTime.value?.getTime() || Date.now(),
      lastSaved: new Date(),
      uploadedFiles: uploadedFiles.value.map(f => ({ name: f.name, size: f.size })), // Store file metadata only
      inProgress: true
    }, { merge: true });

    console.log('💾 Progress auto-saved');
  } catch (error) {
    console.error('Error saving progress:', error);
    // Don't block the assessment if save fails
  }
};

const loadSavedProgress = async () => {
  if (!assessment.value?.id || !authStore.currentUser?.uid) return null;

  try {
    const progressId = `${authStore.currentUser.uid}_${assessment.value.id}`;
    const progressRef = doc(db, 'assessmentProgress', progressId);
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      const data = progressDoc.data();

      // Only return progress if assessment is still in progress
      if (data.inProgress && data.answers && Object.keys(data.answers).length > 0) {
        console.log('📂 Found saved progress:', Object.keys(data.answers).length, 'answers');
        return {
          answers: data.answers,
          currentQuestionIndex: data.currentQuestionIndex || 0,
          startTime: data.startTime
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading saved progress:', error);
    return null;
  }
};

const clearSavedProgress = async () => {
  if (!assessment.value?.id || !authStore.currentUser?.uid) return;

  try {
    const progressId = `${authStore.currentUser.uid}_${assessment.value.id}`;
    const progressRef = doc(db, 'assessmentProgress', progressId);
    await setDoc(progressRef, {
      inProgress: false,
      clearedAt: new Date()
    }, { merge: true });

    console.log('🗑️ Progress cleared');
  } catch (error) {
    console.error('Error clearing progress:', error);
  }
};

// Auto-save progress when answers change (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
watch(answers, () => {
  if (started.value && assessment.value?.id) {
    // Debounce saves to avoid too many writes
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveProgress();
    }, 2000); // Save 2 seconds after last change
  }
}, { deep: true });

// Auto-save when question index changes
watch(currentQuestionIndex, () => {
  if (started.value && assessment.value?.id) {
    saveProgress();
  }
});

// Load assessment on mount
onMounted(() => {
  loadAssessment();
});
</script>

<style scoped>
.assessment-taking {
  min-height: 100vh;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.loading,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state h3 {
  color: #dc2626;
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.error-state p {
  color: #6b7280;
  margin-bottom: 30px;
}

.back-button {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  text-decoration: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.05rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
  border: 2px solid #6b7280;
}

.back-button:hover {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(107, 114, 128, 0.5);
}

.assessment-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.retake-warning {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-header h3 {
  color: #92400e;
  margin: 0;
}

.warning-content p {
  color: #92400e;
  margin-bottom: 10px;
}

.previous-attempts {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.previous-attempts h4 {
  color: #1f2937;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.attempt-summary {
  display: flex;
  gap: 15px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.attempt-summary:last-child {
  border-bottom: none;
}

.attempt-number {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
}

.attempt-score {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 50px;
  text-align: center;
}

.attempt-score.excellent { background: #dcfce7; color: #166534; }
.attempt-score.good { background: #dbeafe; color: #1e40af; }
.attempt-score.fair { background: #fef3c7; color: #92400e; }
.attempt-score.needs-improvement { background: #fef2f2; color: #dc2626; }

.attempt-date {
  color: #6b7280;
  font-size: 0.8rem;
}

.retake-info {
  background: #f0f4ff;
  padding: 12px;
  border-radius: 6px;
  margin-top: 15px;
}

.retake-info p {
  color: #1f2937;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.assessment-header {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 15px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.header-content h1 {
  color: #1f2937;
  font-size: 1.8rem;
  margin: 0;
  white-space: nowrap;
}

.inline-description {
  color: #6b7280;
  font-size: 1.1rem;
  font-style: italic;
}

.assessment-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grade-tag,
.category-tag,
.standard-tag,
.time-tag {
  font-size: 0.8rem;
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

.time-tag {
  background: #fef2f2;
  color: #dc2626;
}

.questions-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.questions-section h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 20px;
}


.accommodations {
  background: #f0f4ff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.accommodations strong {
  color: #1f2937;
  display: block;
  margin-bottom: 10px;
}

.accommodation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.accommodation-tag {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.file-upload-info {
  background: #f0fdf4;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #10b981;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.upload-icon {
  font-size: 1.2rem;
}

.upload-specs small {
  color: #6b7280;
}

.start-prompt {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.start-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  max-width: 400px;
}

.start-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.start-card h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.start-card p {
  margin-bottom: 20px;
  opacity: 0.9;
}

.time-warning {
  background: rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.start-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
}

.start-button:hover {
  background: white;
  color: #667eea;
}

.timer {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 20px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}



.question-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  border: 2px solid #4f46e5;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.question-header h3 {
  color: #ffffff;
  font-size: 2rem;
  margin: 0;
  font-weight: 1000;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.question-points {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  white-space: nowrap;
}

.progress-compact-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.progress-compact-inline .progress-text {
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.progress-compact-inline .progress-bar {
  width: 80px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  height: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px 0;
  padding: 10px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 6px;
  color: #166534;
  font-size: 0.9rem;
}

.info-icon {
  font-size: 1rem;
}

.auto-save-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: #059669;
  margin-left: auto;
}

.save-icon {
  font-size: 0.875rem;
}

.save-text {
  font-weight: 500;
}

.progress-compact-inline .progress-fill {
  background: rgba(255, 255, 255, 0.9);
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.question-text {
  color: #ffffff;
  font-size: 1.3rem;
  line-height: 1.8;
  margin-bottom: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.3px;
}

/* Target KaTeX math within questions for better readability */
.question-text :deep(.katex .mord),
.question-text :deep(.katex .mtight),
.option-label :deep(.katex .mord),
.option-label :deep(.katex .mtight),
.checkbox-text :deep(.katex .mord),
.checkbox-text :deep(.katex .mtight) {
  font-weight: 600 !important;
}

/* Also target other KaTeX elements that might contain math */
.question-text :deep(.katex .base),
.question-text :deep(.katex .sizing),
.option-label :deep(.katex .base),
.option-label :deep(.katex .sizing),
.checkbox-text :deep(.katex .base),
.checkbox-text :deep(.katex .sizing) {
  font-weight: 600 !important;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
  font-weight: 500;
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.option-label:hover {
  background: white;
  border-color: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.option-label input[type="radio"] {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #10b981;
}

.answer-textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
}

.answer-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Fill-Blank Question Styles */
.fill-blank-answer {
  margin-top: 20px;
}

.fill-blank-display {
  font-size: 1.2rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.fill-blank-indicator {
  display: inline-block;
  min-width: 80px;
  height: 40px;
  border-bottom: 3px solid #3b82f6;
  margin: 0 8px;
  vertical-align: middle;
}

.fill-blank-input {
  width: 100%;
  max-width: 200px;
  padding: 12px 16px;
  font-size: 1.1rem;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  color: #1f2937;
  transition: all 0.2s;
}

.fill-blank-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.fill-blank-hint {
  display: block;
  margin-top: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.fraction-question {
  text-align: center;
  padding: 20px;
}

.fraction-instruction {
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 20px;
}

.fraction-answer {
  margin: 20px 0;
}

.fraction-help {
  font-size: 0.9rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 15px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.question-meta {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.question-standards {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.question-standard-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.final-screen {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
}

.final-header {
  text-align: center;
  margin-bottom: 30px;
}

.final-header h2 {
  color: #1f2937;
  margin-bottom: 10px;
}

.final-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.assessment-summary {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #bae6fd;
}

.summary-stats {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
}

.final-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
}

.minimized-instructions {
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.instructions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fef3c7;
  border-bottom: 1px solid #fbbf24;
}

.instructions-header h4 {
  margin: 0;
  color: #92400e;
  font-size: 1rem;
}

.hide-instructions-btn {
  background: none;
  border: none;
  color: #92400e;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.hide-instructions-btn:hover {
  background: #fbbf24;
  color: white;
}


.show-instructions-btn {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #92400e;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.show-instructions-btn:hover {
  background: #fbbf24;
  color: white;
}



.review-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #10b981;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.review-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
}

.upload-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 20px 0;
}

.upload-btn {
  padding: 12px 20px;
  border: 2px solid;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-btn {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.file-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.camera-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.camera-btn:hover {
  background: #059669;
  border-color: #059669;
}

.uploaded-files {
  margin-top: 20px;
}

.uploaded-files h5 {
  color: #374151;
  margin-bottom: 10px;
  font-size: 1rem;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
}

.file-name {
  flex: 1;
  color: #374151;
  font-weight: 500;
}

.file-size {
  color: #6b7280;
  font-size: 0.9rem;
}

.remove-file-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-file-btn:hover {
  background: #fee2e2;
}

.file-upload-section {
  background: #f0fdf4;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  border: 2px dashed #bbf7d0;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.upload-icon {
  font-size: 1.5rem;
}

.upload-header h4 {
  color: #065f46;
  margin: 0;
  font-size: 1.2rem;
}

.upload-area {
  text-align: center;
}

.file-input {
  display: none;
}

.upload-required {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-top: 15px;
  font-weight: 500;
  border: 1px solid #fecaca;
}

.multi-page-progress {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #d1fae5;
}

.page-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-label {
  font-weight: 500;
  color: #065f46;
}

.progress-count {
  font-weight: 600;
  color: #059669;
  font-size: 1.1rem;
}

.page-labels-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.page-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.page-number {
  font-weight: 600;
  color: #065f46;
  min-width: 20px;
}

.page-title {
  flex: 1;
  color: #047857;
  font-weight: 500;
}

.page-status {
  font-size: 1.2rem;
}

.true-false-options {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.file-upload-section {
  background: #f0fdf4;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  border: 2px dashed #bbf7d0;
}

.multi-page-progress {
  margin: 15px 0;
  padding: 15px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
}

.page-progress {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.page-indicator {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
}

.page-indicator.captured {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.page-indicator.current {
  background: #667eea;
  color: white;
  border-color: #667eea;
  animation: pulse 2s infinite;
}

.upload-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.photo-button,
.file-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

.photo-button:hover,
.file-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.uploaded-files h5 {
  color: #1f2937;
  margin-bottom: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-name {
  flex: 1;
  color: #1f2937;
  font-weight: 500;
}

.file-size {
  color: #6b7280;
  font-size: 0.8rem;
}

.remove-file {
  background: #fef2f2;
  color: #dc2626;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
}

.navigation-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.question-indicator {
  display: flex;
  gap: 8px;
}

.question-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-dot.current {
  background: #667eea;
  transform: scale(1.3);
}

.question-dot.answered {
  background: #10b981;
}

.nav-button {
  padding: 16px 32px;
  border: 2px solid transparent;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.prev-button,
.next-button {
  background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
  color: white;
  border-color: #4f46e5;
}

.prev-button:hover,
.next-button:hover {
  background: linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);
}

.submit-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #10b981;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .assessment-container {
    padding: 15px;
  }

  .assessment-header {
    flex-direction: column;
    gap: 20px;
  }

  .upload-buttons {
    flex-direction: column;
  }

  .navigation-section {
    flex-direction: column;
    gap: 20px;
  }
}

/* Matching Question Styles */
.matching-question {
  background: #f8fafc;
  padding: 25px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.matching-instruction {
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 20px;
  text-align: center;
}

.matching-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 20px;
}

.matching-left h4,
.matching-right h4 {
  color: #1f2937;
  font-size: 1rem;
  margin-bottom: 15px;
  text-align: center;
  padding: 10px;
  background: #e0f2fe;
  border-radius: 6px;
}

.matching-item {
  padding: 15px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  background: white;
  transition: all 0.2s;
}

.left-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.left-item.matched {
  border-color: #10b981;
  background: #f0fdf4;
}

.right-item {
  text-align: center;
  font-weight: 500;
  color: #374151;
}

.right-item.used {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #d1d5db;
}

.item-text {
  font-weight: 500;
  color: #1f2937;
}

.match-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  width: 100%;
}

.match-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Rank Order Question Styles */
.rank-order-question {
  background: #f8fafc;
  padding: 25px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.rank-instruction {
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 20px;
  text-align: center;
}

.rank-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.rank-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
}

.rank-item:active {
  cursor: grabbing;
  transform: rotate(2deg);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.rank-number {
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

.rank-content {
  flex: 1;
  font-weight: 500;
  color: #1f2937;
  font-size: 1rem;
}

.drag-handle {
  color: #9ca3af;
  font-size: 1.2rem;
  cursor: grab;
  padding: 5px;
}

.rank-help {
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 15px;
  font-style: italic;
}

@media (max-width: 768px) {
  .matching-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .rank-item {
    padding: 12px;
  }

  .rank-content {
    font-size: 0.9rem;
  }
}

/* Checkbox Question Styles */
.checkbox-question {
  background: #f8fafc;
  padding: 25px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.checkbox-instruction {
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 20px;
  text-align: center;
}

.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.checkbox-label:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
}

.checkbox-label:has(.checkbox-input:checked) {
  border-color: #10b981;
  background: #f0fdf4;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
}

.checkbox-text {
  flex: 1;
  color: #1f2937;
  font-size: 1rem;
  line-height: 1.5;
}

.checkbox-help {
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 15px;
  font-style: italic;
}

@media (max-width: 768px) {
  .checkbox-label {
    padding: 12px;
  }

  .checkbox-text {
    font-size: 0.9rem;
  }
}
.algebra-tiles-question {
  margin-top: 1rem;
}

.algebra-instructions {
  background: #e7f3ff;
  border-left: 4px solid #007bff;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.algebra-instructions p {
  margin: 0;
  color: #004085;
  font-weight: 500;
}

.answer-with-prefix-suffix {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: nowrap;
  max-width: 600px;
}

/* When there's a prefix/suffix, make it more compact and inline */
.answer-with-prefix-suffix.has-prefix-suffix {
  align-items: center;
}

.answer-prefix,
.answer-suffix {
  font-weight: 600;
  color: #1e40af;
  font-size: 1.2rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 2px solid #dbeafe;
  border-radius: 8px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  min-height: 48px;
  line-height: 1;
}

.answer-with-prefix-suffix :deep(.rich-text-answer) {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

/* Ensure the textarea in compact mode aligns with prefix/suffix */
.answer-with-prefix-suffix.has-prefix-suffix :deep(.text-editor) {
  font-size: 1.1rem;
  font-weight: 500;
}

/* Composite Question Styles */
.composite-question {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
}

.composite-info {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
}

.composite-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.sub-question {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.sub-question:last-child {
  margin-bottom: 0;
}

.sub-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.sub-question-label {
  font-weight: 700;
  font-size: 1.0625rem;
  color: #1e293b;
}

.sub-question-weight {
  padding: 0.25rem 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.sub-question-content {
  margin-top: 0.75rem;
}

.sub-question-text {
  margin-bottom: 1rem;
  color: #334155;
  font-size: 1rem;
  line-height: 1.6;
}

.sub-answer {
  margin-top: 0.75rem;
}

.sub-answer.answer-options {
  background: #fafafa;
  padding: 0.75rem;
  border-radius: 6px;
}

.sub-answer.answer-input,
.sub-answer.fraction-question {
  background: white;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
</style>
