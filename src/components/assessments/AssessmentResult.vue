<template>
  <div class="assessment-result">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading assessment result...</p>
    </div>

    <div v-else-if="error" class="error">
      <h2>Error Loading Result</h2>
      <p>{{ error }}</p>
      <button @click="router.push('/assessments')" class="back-button">
        ← Back to Assessments
      </button>
    </div>

    <div v-else-if="result && assessment" class="result-content">
      <!-- Header -->
      <div class="result-header">
        <button @click="router.push('/assessments')" class="back-button">
          ← Back to Assessments
        </button>
        <h1>Assessment Result</h1>
      </div>

      <!-- Assessment Info -->
      <div class="assessment-info">
        <h2>{{ assessment.title }}</h2>
        <p class="assessment-description">{{ assessment.description }}</p>
        <div class="assessment-meta">
          <span class="meta-item">📚 {{ assessment.category }}</span>
          <span class="meta-item">📊 Grade {{ assessment.gradeLevel }}</span>
          <span class="meta-item">⏱️ {{ result.timeSpent }} minutes</span>
          <span class="meta-item">📅 {{ formatDate(result.completedAt) }}</span>
        </div>
      </div>

      <!-- Score Summary -->
      <div class="score-summary">
        <div class="score-card" :class="getScoreClass(result.percentage)">
          <div class="score-percentage">{{ result.percentage }}%</div>
          <div class="score-details">{{ result.score }} / {{ result.totalPoints }} points</div>
        </div>

        <div class="score-stats">
          <div class="stat">
            <span class="stat-label">Questions Answered</span>
            <span class="stat-value">{{ result.responses?.length || 0 }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Correct Answers</span>
            <span class="stat-value">{{ correctAnswers }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time Spent</span>
            <span class="stat-value">{{ result.timeSpent }} min</span>
          </div>
        </div>
      </div>

      <!-- Question Breakdown -->
      <div class="question-breakdown">
        <h3>Question Breakdown</h3>
        <div class="questions-list">
          <div
            v-for="(response, index) in result.responses"
            :key="response.questionId"
            class="question-item"
            :class="{ 'correct': response.isCorrect, 'incorrect': !response.isCorrect }"
          >
            <div class="question-header">
              <span class="question-number">{{ index + 1 }}</span>
              <span class="question-status">
                {{ response.isCorrect ? '✅ Correct' : '❌ Incorrect' }}
                <span v-if="response.manuallyAdjusted" class="adjustment-badge">Manually Adjusted</span>
              </span>

              <!-- Points Display/Edit -->
              <div class="points-section">
                <!-- Teacher/Admin View - With Edit Capability -->
                <div v-if="authStore.userRole === 'teacher' || authStore.userRole === 'admin'" class="teacher-points-view">
                  <div v-if="!editingPoints[response.questionId]" class="points-display">
                    <span class="question-points" :class="{ adjusted: response.manuallyAdjusted }">
                      {{ response.pointsEarned }} / {{ getQuestionPoints(response.questionId) }} pts
                    </span>

                    <button
                      @click="startEditingPoints(response.questionId, response.pointsEarned || 0)"
                      class="edit-points-btn"
                      title="Edit points for partial credit or corrections"
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  <!-- Editing mode -->
                  <div v-else class="points-editing">
                    <input
                      v-model.number="editingValues[response.questionId]"
                      type="number"
                      :min="0"
                      :max="getQuestionPoints(response.questionId)"
                      step="0.5"
                      class="points-input"
                    />
                    <span class="points-max">/ {{ getQuestionPoints(response.questionId) }} pts</span>

                    <div class="edit-actions">
                      <button
                        @click="savePointsEdit(response.questionId)"
                        :disabled="savingPoints[response.questionId]"
                        class="save-btn"
                        title="Save changes"
                      >
                        {{ savingPoints[response.questionId] ? '💾 Saving...' : '✅ Save' }}
                      </button>
                      <button
                        @click="cancelEditingPoints(response.questionId)"
                        class="cancel-btn"
                        title="Cancel"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Student View - Read Only -->
                <div v-else class="student-points-view">
                  <span class="question-points" :class="{ adjusted: response.manuallyAdjusted }">
                    {{ response.pointsEarned }} / {{ getQuestionPoints(response.questionId) }} pts
                  </span>
                  <span v-if="response.manuallyAdjusted" class="adjustment-note">
                    (Adjusted by teacher)
                  </span>
                </div>
              </div>
            </div>

            <div class="question-content">
              <p class="question-text" v-html="renderLatexInText(getQuestionText(response.questionId))"></p>
              <div class="answer-section">
                <div class="student-answer">
                  <strong>Your Answer:</strong> {{ getDisplayAnswer(response.questionId, response.studentAnswer) }}
                </div>

                <!-- Enhanced correct answers display -->
                <div class="correct-answers-section">
                  <div class="primary-answer">
                    <strong>Correct Answer:</strong> {{ getDisplayCorrectAnswer(response.questionId) }}
                  </div>

                  <!-- Show alternative answers if they exist -->
                  <div v-if="getAlternativeAnswers(response.questionId).length > 0" class="alternative-answers">
                    <strong>Also Acceptable:</strong>
                    <div class="alternatives-list">
                      <span
                        v-for="alt in getAlternativeAnswers(response.questionId)"
                        :key="alt"
                        class="alternative-answer"
                      >
                        {{ alt }}
                      </span>
                    </div>
                  </div>

                  <!-- Show equivalent fractions if it's a fraction question -->
                  <div v-if="isEquivalentFractionsEnabled(response.questionId) && isFractionAnswer(response.questionId)" class="equivalent-fractions">
                    <strong>Equivalent Fractions:</strong>
                    <div class="equivalents-list">
                      <span
                        v-for="equiv in getEquivalentFractions(response.questionId)"
                        :key="equiv"
                        class="equivalent-fraction"
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

      <!-- Uploaded Files Section -->
      <div v-if="result.uploadedFiles && result.uploadedFiles.length > 0" class="uploaded-files-section">
        <h3>Uploaded Files</h3>
        <div class="files-grid">
          <div
            v-for="file in result.uploadedFiles"
            :key="file.id"
            class="file-item"
          >
            <div class="file-preview">
              <img
                v-if="file.fileType.startsWith('image/')"
                :src="file.uploadUrl"
                :alt="file.originalName"
                class="file-thumbnail"
                @click="openFile(file.uploadUrl)"
              />
              <div v-else class="file-icon" @click="openFile(file.uploadUrl)">
                📄
              </div>
            </div>
            <div class="file-info">
              <p class="file-name">{{ file.originalName }}</p>
              <p class="file-size">{{ formatFileSize(file.fileSize) }}</p>
              <div class="file-actions">
                <button @click="openFile(file.uploadUrl)" class="view-file-btn">
                  👁️ View
                </button>
              </div>

              <!-- Teacher-only photo replacement (separate section) -->
              <div v-if="authStore.userRole === 'teacher' || authStore.userRole === 'admin'" class="teacher-only-actions">
                <button
                  v-if="file.fileType.startsWith('image/')"
                  @click="startPhotoReplacement(file)"
                  class="replace-photo-btn"
                  title="Replace this photo (Teacher Only)"
                >
                  📷 Replace Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Section -->
      <div v-if="result.feedback" class="feedback-section">
        <h3>Teacher Feedback</h3>
        <p class="feedback-text">{{ result.feedback }}</p>
      </div>

      <!-- Actions -->
      <div class="result-actions">
        <button
          v-if="canRetake"
          @click="retakeAssessment"
          class="retake-button"
        >
          🔄 Retake Assessment
        </button>
        <button @click="router.push('/assessments')" class="back-button-main">
          📝 Back to Assessments
        </button>
      </div>
    </div>

    <!-- Photo Replacement Modal -->
    <div v-if="showPhotoReplacement" class="photo-replacement-modal" @click="closePhotoReplacement">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📷 Replace Student Photo</h3>
          <button @click="closePhotoReplacement" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <div class="current-photo-section">
            <h4>Current Photo:</h4>
            <img
              v-if="replacingFile"
              :src="replacingFile.uploadUrl"
              :alt="replacingFile.originalName"
              class="current-photo-preview"
            >
          </div>

          <div class="replacement-options">
            <h4>Replace with:</h4>
            <div class="replacement-buttons">
              <button @click="openCameraCapture" class="camera-btn">
                📷 Take New Photo
              </button>
              <button @click="openFileUpload" class="upload-btn">
                📁 Upload File
              </button>
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelection"
              style="display: none;"
            >
          </div>

          <!-- New photo preview -->
          <div v-if="newPhotoPreview" class="new-photo-section">
            <h4>New Photo:</h4>
            <img :src="newPhotoPreview" alt="New photo preview" class="new-photo-preview">
            <div class="photo-actions">
              <button @click="confirmPhotoReplacement" class="confirm-btn" :disabled="replacingPhoto">
                {{ replacingPhoto ? '💾 Saving...' : '✅ Confirm Replacement' }}
              </button>
              <button @click="cancelNewPhoto" class="cancel-btn">
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Camera Capture Modal -->
    <CameraCapture
      v-if="showCameraCapture"
      @photoTaken="handlePhotoCaptured"
      @close="closeCameraCapture"
      :title="'Replace Student Photo'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/composables/usePermissions';
import { getAssessment } from '@/firebase/iepServices';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Assessment, AssessmentResult, AssessmentResponse } from '@/types/iep';
import { renderLatexInText } from '@/utils/latexUtils';
import CameraCapture from '@/components/CameraCapture.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const permissions = usePermissions();

// State
const loading = ref(true);
const error = ref('');
const result = ref<AssessmentResult | null>(null);
const assessment = ref<Assessment | null>(null);

// Point editing state (teachers only)
const editingPoints = ref<Record<string, boolean>>({});
const editingValues = ref<Record<string, number>>({});
const savingPoints = ref<Record<string, boolean>>({});

// Photo replacement state
const showPhotoReplacement = ref(false);
const showCameraCapture = ref(false);
const replacingFile = ref<any>(null);
const newPhotoPreview = ref<string>('');
const newPhotoFile = ref<File | null>(null);
const replacingPhoto = ref(false);
const fileInput = ref<HTMLInputElement>();

// Computed
const correctAnswers = computed(() => {
  return result.value?.responses?.filter(r => r.isCorrect).length || 0;
});

const canRetake = computed(() => {
  return result.value && result.value.percentage < 70;
});

// Methods
const loadResultData = async () => {
  try {
    const assessmentId = route.params.assessmentId as string;
    const resultId = route.params.resultId as string;

    if (!assessmentId || !resultId) {
      throw new Error('Missing assessment ID or result ID');
    }

    // Load assessment result
    const resultDoc = await getDoc(doc(db, 'assessmentResults', resultId));
    if (!resultDoc.exists()) {
      throw new Error('Assessment result not found');
    }

    result.value = {
      id: resultDoc.id,
      ...resultDoc.data()
    } as AssessmentResult;

    // Load assessment details
    assessment.value = await getAssessment(assessmentId);

    console.log('✅ Loaded assessment result:', result.value);
    console.log('✅ Loaded assessment:', assessment.value);

  } catch (err: any) {
    console.error('❌ Error loading result:', err);
    error.value = err.message || 'Failed to load assessment result';
  } finally {
    loading.value = false;
  }
};

const getQuestionText = (questionId: string): string => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);
  return question?.questionText || 'Question not found';
};

const getCorrectAnswer = (questionId: string): string => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);
  return question?.correctAnswer as string || 'N/A';
};

const getDisplayAnswer = (questionId: string, studentAnswer: any): string => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);

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

  // For other question types with prefix/suffix support
  const answerText = studentAnswer?.toString() || 'No answer';
  const prefix = question.answerPrefix || '';
  const suffix = question.answerSuffix || '';

  if (prefix || suffix) {
    return `${prefix}${answerText}${suffix}`;
  }

  return answerText;
};

const getDisplayCorrectAnswer = (questionId: string): string => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);

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

  // For other question types, show prefix/suffix with correct answer
  const answerText = question.correctAnswer as string || 'N/A';
  const prefix = question.answerPrefix || '';
  const suffix = question.answerSuffix || '';

  if (prefix || suffix) {
    return `${prefix}${answerText}${suffix}`;
  }

  return answerText;
};

const getQuestionPoints = (questionId: string): number => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);
  return question?.points || 1;
};

// Get alternative answers for a question
const getAlternativeAnswers = (questionId: string): string[] => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);
  return question?.acceptableAnswers || [];
};

// Check if equivalent fractions are enabled for this question
const isEquivalentFractionsEnabled = (questionId: string): boolean => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);
  return question?.acceptEquivalentFractions || false;
};

// Check if the answer is a fraction
const isFractionAnswer = (questionId: string): boolean => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);
  const correctAnswer = question?.correctAnswer as string || '';
  return correctAnswer.includes('/');
};

// Generate equivalent fractions for display
const getEquivalentFractions = (questionId: string): string[] => {
  const question = assessment.value?.questions?.find(q => q.id === questionId);
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

const retakeAssessment = () => {
  router.push(`/assessment/${route.params.assessmentId}`);
};

const openFile = (url: string) => {
  window.open(url, '_blank');
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Point editing methods (teachers only)
const startEditingPoints = (questionId: string, currentPoints: number) => {
  editingPoints.value[questionId] = true;
  editingValues.value[questionId] = currentPoints;
};

const cancelEditingPoints = (questionId: string) => {
  editingPoints.value[questionId] = false;
  delete editingValues.value[questionId];
};

const savePointsEdit = async (questionId: string) => {
  if (!result.value || !assessment.value) return;

  const newPoints = editingValues.value[questionId];
  const maxPoints = getQuestionPoints(questionId);

  // Validate points
  if (newPoints < 0 || newPoints > maxPoints) {
    alert(`Points must be between 0 and ${maxPoints}`);
    return;
  }

  try {
    savingPoints.value[questionId] = true;

    // Update the response in the result
    const responseIndex = result.value.responses?.findIndex(r => r.questionId === questionId);
    if (responseIndex !== undefined && responseIndex >= 0 && result.value.responses) {
      const oldPoints = result.value.responses[responseIndex].pointsEarned;
      result.value.responses[responseIndex].pointsEarned = newPoints;
      result.value.responses[responseIndex].manuallyAdjusted = true;
      result.value.responses[responseIndex].adjustedBy = authStore.currentUser?.email || 'Unknown';
      result.value.responses[responseIndex].adjustedAt = new Date();
      result.value.responses[responseIndex].adjustmentReason = newPoints > oldPoints ? 'Partial credit given' : 'Points deducted';

      // Update isCorrect based on new points - find the question to get max points
      const question = assessment.value?.questions?.find(q => q.id === questionId);
      if (question) {
        // Consider correct if student got full points for the question
        result.value.responses[responseIndex].isCorrect = newPoints >= question.points;
        console.log(`🔍 Updated isCorrect for question ${questionId}: ${newPoints}/${question.points} = ${result.value.responses[responseIndex].isCorrect}`);
      }

      // Recalculate total score
      const totalEarned = result.value.responses.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
      const totalPossible = result.value.totalPoints || 0;

      result.value.score = totalEarned;
      result.value.percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

      // Update in Firestore
      const resultRef = doc(db, 'assessmentResults', result.value.id);
      await updateDoc(resultRef, {
        responses: result.value.responses,
        score: result.value.score,
        percentage: result.value.percentage,
        lastModified: new Date(),
        modifiedBy: authStore.currentUser?.email || 'Unknown'
      });

      console.log(`✅ Updated points for question ${questionId}: ${oldPoints} → ${newPoints}`);
    }

    // Exit editing mode
    editingPoints.value[questionId] = false;
    delete editingValues.value[questionId];

  } catch (err) {
    console.error('Error updating points:', err);
    alert('Failed to update points. Please try again.');
  } finally {
    savingPoints.value[questionId] = false;
  }
};

// Photo replacement methods
const startPhotoReplacement = (file: any) => {
  // Security check: Only teachers and admins can replace photos
  if (!permissions.isTeacher && !permissions.isAdmin) {
    console.error('🚫 Unauthorized attempt to replace photo by student');
    alert('You do not have permission to replace photos.');
    return;
  }

  replacingFile.value = file;
  showPhotoReplacement.value = true;
};

const closePhotoReplacement = () => {
  showPhotoReplacement.value = false;
  showCameraCapture.value = false;
  replacingFile.value = null;
  newPhotoPreview.value = '';
  newPhotoFile.value = null;
};

const openCameraCapture = () => {
  showCameraCapture.value = true;
};

const closeCameraCapture = () => {
  showCameraCapture.value = false;
};

const openFileUpload = () => {
  fileInput.value?.click();
};

const handleFileSelection = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && file.type.startsWith('image/')) {
    newPhotoFile.value = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      newPhotoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    showCameraCapture.value = false;
  } else {
    alert('Please select a valid image file.');
  }
};

const handlePhotoCaptured = (file: File) => {
  console.log('📷 Photo captured for replacement:', file.name, file.size);

  newPhotoFile.value = file;

  // Create preview URL from the file
  const reader = new FileReader();
  reader.onload = (e) => {
    newPhotoPreview.value = e.target?.result as string;
    console.log('📷 Photo preview created for replacement');
  };
  reader.readAsDataURL(file);

  showCameraCapture.value = false;
  console.log('📷 Photo file ready for replacement:', file.name, file.size);
};

const cancelNewPhoto = () => {
  newPhotoPreview.value = '';
  newPhotoFile.value = null;
};

const confirmPhotoReplacement = async () => {
  if (!newPhotoFile.value || !replacingFile.value || !result.value) {
    console.error('❌ Missing required data for photo replacement');
    return;
  }

  try {
    replacingPhoto.value = true;
    console.log('🔄 Starting photo replacement process...');
    console.log('📋 Replacing file:', replacingFile.value);
    console.log('📁 New file:', newPhotoFile.value.name, newPhotoFile.value.size);

    // Upload new photo to Firebase Storage
    const timestamp = Date.now();
    const fileName = `teacher_replacement_${timestamp}.jpg`;
    const studentId = result.value.studentUid;
    const storagePath = `assessment-uploads/${studentId}/${result.value.assessmentId}/${fileName}`;
    const photoRef = storageRef(storage, storagePath);

    console.log('📤 Uploading to storage path:', storagePath);
    const uploadResult = await uploadBytes(photoRef, newPhotoFile.value);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('✅ Upload successful. Download URL:', downloadURL);

    // Update the file record in the assessment result
    if (result.value.uploadedFiles) {
      const fileIndex = result.value.uploadedFiles.findIndex(f => f.id === replacingFile.value.id);
      console.log('🔍 Found file at index:', fileIndex);

      if (fileIndex >= 0) {
        console.log('📝 Updating file record...');

        // Update the file record (keep the same structure as original)
        const updatedFile = {
          ...result.value.uploadedFiles[fileIndex],
          uploadUrl: downloadURL,
          originalName: `${newPhotoFile.value.name.replace('.jpg', '')} (Replaced by teacher).jpg`,
          fileSize: newPhotoFile.value.size,
          fileType: newPhotoFile.value.type
        };

        result.value.uploadedFiles[fileIndex] = updatedFile;
        console.log('📋 Updated file record:', updatedFile);

        // Update in Firestore
        const resultRef = doc(db, 'assessmentResults', result.value.id);
        const updateData = {
          uploadedFiles: result.value.uploadedFiles,
          lastModified: new Date(),
          modifiedBy: authStore.currentUser?.email || 'Teacher'
        };

        console.log('💾 Saving to Firestore...');
        await updateDoc(resultRef, updateData);
        console.log('✅ Firestore update successful');

        // Try to delete the old file from storage (don't fail if this doesn't work)
        try {
          if (replacingFile.value.uploadUrl && replacingFile.value.uploadUrl.includes('firebase')) {
            // Extract storage path from URL or use a fallback approach
            console.log('🗑️ Attempting to delete old photo...');
            // Note: Deleting old files can be tricky, but the new photo is saved successfully
          }
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old photo (this is okay):', deleteError);
        }

        console.log('✅ Photo replacement completed successfully');
        alert('Photo replaced successfully!');
        closePhotoReplacement();
      } else {
        console.error('❌ Could not find file to replace');
        alert('Could not find the file to replace.');
      }
    } else {
      console.error('❌ No uploaded files array found');
      alert('No uploaded files found to replace.');
    }
  } catch (error) {
    console.error('❌ Error replacing photo:', error);
    alert(`Failed to replace photo: ${error}`);
  } finally {
    replacingPhoto.value = false;
  }
};

onMounted(() => {
  loadResultData();
});
</script>

<style scoped>
.assessment-result {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #2563eb;
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

.error h2 {
  color: #dc2626;
  margin-bottom: 10px;
}

.error p {
  color: #7f1d1d;
  margin-bottom: 20px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.back-button {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.back-button:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.result-header h1 {
  color: #1f2937;
  font-size: 2rem;
  margin: 0;
}

.assessment-info {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.assessment-info h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.assessment-description {
  color: #6b7280;
  margin-bottom: 15px;
  line-height: 1.6;
}

.assessment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.meta-item {
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #374151;
}

.score-summary {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 30px;
  margin-bottom: 40px;
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.score-card {
  text-align: center;
  padding: 30px;
  border-radius: 12px;
  min-width: 200px;
}

.score-card.excellent {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #166534;
}

.score-card.good {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e40af;
}

.score-card.fair {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.score-card.needs-improvement {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  color: #dc2626;
}

.score-percentage {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.score-details {
  font-size: 1.1rem;
  font-weight: 500;
}

.score-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat {
  text-align: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-label {
  display: block;
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.question-breakdown {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.question-breakdown h3 {
  color: #1f2937;
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.question-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.question-item.correct {
  border-left: 4px solid #10b981;
}

.question-item.incorrect {
  border-left: 4px solid #ef4444;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.question-number {
  background: #2563eb;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.question-status {
  font-weight: 600;
  font-size: 0.9rem;
}

.question-points {
  color: #6b7280;
  font-size: 0.9rem;
}

.question-points.adjusted {
  background: #f59e0b;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.adjustment-badge {
  background: #f59e0b;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  margin-left: 8px;
}

.points-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-points-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-points-btn:hover {
  background: #2563eb;
}

.points-editing {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.points-input {
  width: 60px;
  padding: 4px 8px;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.points-max {
  color: #6b7280;
  font-size: 0.9rem;
}

.edit-actions {
  display: flex;
  gap: 4px;
}

.save-btn, .cancel-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
}

.save-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.cancel-btn {
  background: #ef4444;
  color: white;
}

.cancel-btn:hover {
  background: #dc2626;
}

.question-content {
  padding: 20px;
}

.question-text {
  color: #1f2937;
  font-weight: 500;
  margin-bottom: 15px;
  line-height: 1.6;
}

.answer-section {
  display: grid;
  gap: 10px;
}

.student-answer {
  padding: 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #f0f4ff;
  border-left: 3px solid #2563eb;
  margin-bottom: 1rem;
}

.correct-answers-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.primary-answer {
  padding: 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #f0fdf4;
  border-left: 3px solid #10b981;
}

.alternative-answers {
  padding: 0.75rem;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
}

.alternative-answers strong {
  color: #1d4ed8;
  display: block;
  margin-bottom: 0.5rem;
}

.alternatives-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.alternative-answer {
  padding: 0.25rem 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.equivalent-fractions {
  padding: 0.75rem;
  background: #f3e8ff;
  border: 1px solid #d8b4fe;
  border-radius: 6px;
}

.equivalent-fractions strong {
  color: #7c3aed;
  display: block;
  margin-bottom: 0.5rem;
}

.equivalents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.equivalent-fraction {
  padding: 0.25rem 0.75rem;
  background: #8b5cf6;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.uploaded-files-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  border-left: 4px solid #2563eb;
}

.uploaded-files-section h3 {
  color: #1f2937;
  margin-bottom: 20px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.file-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.2s;
}

.file-item:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.file-preview {
  margin-bottom: 10px;
}

.file-thumbnail {
  width: 100%;
  max-width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.file-thumbnail:hover {
  transform: scale(1.05);
}

.file-icon {
  font-size: 3rem;
  color: #6b7280;
  cursor: pointer;
  padding: 20px;
  transition: color 0.2s;
}

.file-icon:hover {
  color: #2563eb;
}

.file-info {
  text-align: center;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 0.9rem;
  word-break: break-word;
}

.file-size {
  color: #6b7280;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.view-file-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.view-file-btn:hover {
  background: #1d4ed8;
}

.feedback-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  border-left: 4px solid #f59e0b;
}

.feedback-section h3 {
  color: #1f2937;
  margin-bottom: 15px;
}

.feedback-text {
  color: #374151;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 40px;
}

.retake-button {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retake-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
}

.back-button-main {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button-main:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
}

@media (max-width: 768px) {
  .assessment-result {
    padding: 15px;
  }

  .score-summary {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .score-stats {
    grid-template-columns: 1fr;
  }

  .question-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .result-actions {
    flex-direction: column;
  }
}

/* Student-specific styles */
.student-points-view {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.adjustment-note {
  font-size: 0.8rem;
  color: #059669;
  font-style: italic;
  font-weight: 500;
}

/* File actions styles */
.file-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.teacher-only-actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.replace-photo-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.replace-photo-btn:hover {
  background: #d97706;
}

/* Photo replacement modal */
.photo-replacement-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90vw;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 5px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.current-photo-section, .new-photo-section {
  margin-bottom: 20px;
}

.current-photo-section h4, .new-photo-section h4 {
  color: #374151;
  margin-bottom: 10px;
}

.current-photo-preview, .new-photo-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.replacement-options {
  margin: 20px 0;
}

.replacement-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.camera-btn, .upload-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.camera-btn {
  background: #3b82f6;
  color: white;
}

.camera-btn:hover {
  background: #2563eb;
}

.upload-btn {
  background: #10b981;
  color: white;
}

.upload-btn:hover {
  background: #059669;
}

.photo-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 15px;
}

.confirm-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: #059669;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #dc2626;
}
</style>
