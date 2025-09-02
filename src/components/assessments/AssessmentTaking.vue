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
      <router-link to="/assessments" class="back-button">← Back to Assessments</router-link>
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

      <!-- Assessment Header -->
      <div class="assessment-header">
        <div class="header-content">
          <h1>📝 {{ assessment.title }}</h1>
          <p>{{ assessment.description }}</p>
          <div class="assessment-meta">
            <span class="grade-tag">Grade {{ assessment.gradeLevel }}</span>
            <span class="category-tag">{{ assessment.category }}</span>
            <span v-if="assessment.standard" class="standard-tag">{{ assessment.standard }}</span>
            <span v-if="assessment.timeLimit" class="time-tag">⏱️ {{ assessment.timeLimit }} min</span>
          </div>
        </div>
        <div class="header-actions">
          <router-link to="/assessments" class="back-button">← Back</router-link>
        </div>
      </div>

      <!-- Instructions -->
      <div class="instructions-section">
        <h2>📋 Instructions</h2>
        <div class="instructions-content">
          <p>{{ assessment.instructions }}</p>
          
          <!-- Accommodations -->
          <div v-if="assessment.accommodations?.length" class="accommodations">
            <strong>Your Accommodations:</strong>
            <div class="accommodation-tags">
              <span 
                v-for="accommodation in assessment.accommodations" 
                :key="accommodation"
                class="accommodation-tag"
              >
                {{ accommodation }}
              </span>
            </div>
          </div>

          <!-- File Upload Instructions -->
          <div v-if="assessment.allowFileUpload" class="file-upload-info">
            <div class="upload-header">
              <span class="upload-icon">📎</span>
              <strong>File Upload {{ assessment.requireFileUpload ? '(Required)' : '(Optional)' }}</strong>
            </div>
            <p>{{ assessment.fileUploadInstructions || 'You can upload photos of your work or other files.' }}</p>
            <div class="upload-specs">
              <small>
                Max size: {{ assessment.maxFileSize || 10 }}MB | 
                Allowed types: {{ (assessment.allowedFileTypes || []).join(', ') || 'All types' }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Assessment Questions -->
      <div class="questions-section">
        <h2>❓ Questions ({{ assessment.questions?.length || 0 }})</h2>
        
        <div v-if="!started" class="start-prompt">
          <div class="start-card">
            <div class="start-icon">🚀</div>
            <h3>Ready to Start?</h3>
            <p>This assessment has {{ assessment.questions?.length || 0 }} questions worth {{ assessment.totalPoints }} points total.</p>
            <div v-if="assessment.timeLimit" class="time-warning">
              <span class="warning-icon">⏱️</span>
              <strong>Time Limit: {{ assessment.timeLimit }} minutes</strong>
            </div>
            <button @click="startAssessment" class="start-button">
              <span class="button-icon">▶️</span>
              Start Assessment
            </button>
          </div>
        </div>

        <div v-else class="questions-container">
          <!-- Timer -->
          <div v-if="assessment.timeLimit" class="timer">
            <span class="timer-icon">⏱️</span>
            <span class="timer-text">Time Remaining: {{ formatTime(timeRemaining) }}</span>
          </div>

          <!-- Progress -->
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            <span class="progress-text">Question {{ currentQuestionIndex + 1 }} of {{ assessment.questions?.length }}</span>
          </div>

          <!-- Current Question -->
          <div v-if="currentQuestion" class="question-card">
            <div class="question-header">
              <h3>Question {{ currentQuestionIndex + 1 }}</h3>
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
              <div class="question-text">{{ currentQuestion.questionText }}</div>
              
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
                  <span>{{ option }}</span>
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

              <!-- Short Answer -->
              <div v-else-if="currentQuestion.questionType === 'short-answer'" class="answer-input">
                <RichTextAnswerInput
                  v-model="answers[currentQuestion.id] as string"
                  placeholder="Enter your answer... Use 'Insert Fraction' button for vertical fractions like 2x/4 or complex expressions."
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
            </div>
          </div>

          <!-- File Upload Section -->
          <div v-if="assessment.allowFileUpload" class="file-upload-section">
            <div class="upload-header">
              <span class="upload-icon">📎</span>
              <h4>Upload Your Work {{ assessment.requireFileUpload ? '(Required)' : '(Optional)' }}</h4>
            </div>
            <p>{{ assessment.fileUploadInstructions }}</p>
            
            <div class="upload-area">
              <input 
                ref="fileInput"
                type="file" 
                multiple
                :accept="getAcceptedFileTypes()"
                @change="handleFileUpload"
                class="file-input"
                style="display: none;"
              >
              
              <div class="upload-buttons">
                <button @click="capturePhoto" class="photo-button">
                  <span class="button-icon">📷</span>
                  Take Photo
                </button>
                <button @click="selectFile" class="file-button">
                  <span class="button-icon">📁</span>
                  Choose File
                </button>
              </div>
              
              <!-- Uploaded Files -->
              <div v-if="uploadedFiles.length > 0" class="uploaded-files">
                <h5>Uploaded Files:</h5>
                <div 
                  v-for="file in uploadedFiles" 
                  :key="file.name"
                  class="file-item"
                >
                  <span class="file-icon">📄</span>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">({{ formatFileSize(file.size) }})</span>
                  <button @click="removeFile(file)" class="remove-file">×</button>
                </div>
              </div>
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
              v-if="currentQuestionIndex < (assessment.questions?.length || 0) - 1"
              @click="nextQuestion" 
              class="nav-button next-button"
            >
              Next →
            </button>
            <button 
              v-else
              @click="submitAssessment" 
              class="nav-button submit-button"
              :disabled="assessment.requireFileUpload && uploadedFiles.length === 0"
            >
              Submit Assessment
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
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getAssessment, saveAssessmentResult, getAssessmentResultsByStudent } from '@/firebase/iepServices';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import CameraCapture from '@/components/CameraCapture.vue';
import FractionInput from '@/components/FractionInput.vue';
import RichTextAnswerInput from '@/components/RichTextAnswerInput.vue';
import type { Assessment, AssessmentQuestion, FractionAnswer } from '@/types/iep';
import { checkFractionAnswer, type Fraction } from '@/utils/fractionUtils';
import { parseStandards, formatStandardsForDisplay } from '@/utils/standardsUtils';
import { areAnswersEquivalent, convertHtmlAnswerToText, debugAnswerConversion } from '@/utils/answerUtils';

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
const uploadedFiles = ref<File[]>([]);
const startTime = ref<Date | null>(null);
const timeRemaining = ref(0);

// Retake tracking
const existingResults = ref<any[]>([]);
const isRetake = ref(false);
const attemptNumber = ref(1);
const showRetakeWarning = ref(false);

// Timer
let timerInterval: number | null = null;

// Computed
const currentQuestion = computed(() => {
  if (!assessment.value?.questions || currentQuestionIndex.value >= assessment.value.questions.length) {
    return null;
  }
  return assessment.value.questions[currentQuestionIndex.value];
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
      
      // Check for existing results to determine if this is a retake
      if (authStore.currentUser?.uid) {
        const studentId = authStore.currentUser?.googleId || authStore.currentUser?.seisId || authStore.currentUser?.uid;
        
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

const startAssessment = () => {
  started.value = true;
  startTime.value = new Date();
  
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

const nextQuestion = () => {
  if (currentQuestionIndex.value < (assessment.value?.questions?.length || 0) - 1) {
    currentQuestionIndex.value++;
  }
};

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

const goToQuestion = (index: number) => {
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
        // For multiple choice, userAnswer is the option index, correctAnswer might be index or text
        const selectedOptionText = question.options?.[parseInt(userAnswer as string)] || '';
        isCorrect = userAnswer === question.correctAnswer || selectedOptionText === question.correctAnswer;
      } else if (question.questionType === 'fraction') {
        // For fraction questions, check against all acceptable fraction answers
        if (question.correctFractionAnswers && typeof userAnswer === 'object') {
          isCorrect = checkFractionAnswer(userAnswer as Fraction, question.correctFractionAnswers);
        } else if (question.correctFractionAnswers && typeof userAnswer === 'string') {
          isCorrect = checkFractionAnswer(userAnswer, question.correctFractionAnswers);
        }
      } else {
        // For other question types (short-answer, essay, etc.), use enhanced comparison
        if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
          // Use the enhanced answer comparison that handles HTML fractions
          isCorrect = areAnswersEquivalent(userAnswer, question.correctAnswer);
          
          // Debug logging for answer comparison
          console.log(`📝 Answer Comparison for Question ${index + 1}:`, {
            questionType: question.questionType,
            studentAnswer: userAnswer,
            convertedAnswer: convertHtmlAnswerToText(userAnswer),
            correctAnswer: question.correctAnswer,
            isCorrect: isCorrect
          });
          
          // Also check acceptable answers if available
          if (!isCorrect && question.acceptableAnswers && question.acceptableAnswers.length > 0) {
            for (const acceptableAnswer of question.acceptableAnswers) {
              if (areAnswersEquivalent(userAnswer, acceptableAnswer)) {
                isCorrect = true;
                console.log(`✅ Matched acceptable answer: ${acceptableAnswer}`);
                break;
              }
            }
          }
        } else {
          // Fallback to simple comparison for non-string answers
          isCorrect = userAnswer.toString().trim().toLowerCase() === question.correctAnswer.toString().trim().toLowerCase();
        }
      }
      
      const pointsEarned = isCorrect ? question.points : 0;
      
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
      
      responses.push({
        questionId: question.id,
        studentAnswer: userAnswer,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned
      });
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
        studentSeisId: authStore.currentUser?.googleId || authStore.currentUser?.seisId || authStore.currentUser?.uid || '',
        studentUid: authStore.currentUser?.uid || '',
        goalId: assessment.value?.goalId || '',
        responses: responses,
        score: score,
        totalPoints: totalPoints,
        percentage: percentage,
        timeSpent: timeSpent,
        gradedBy: 'auto-graded',
        feedback: '',
        accommodationsUsed: [],
        uploadedFiles: uploadedFileData,
        
        // Retake tracking
        attemptNumber: attemptNumber.value,
        isRetake: isRetake.value,
        previousAttempts: []
      };
      
      console.log(`📝 ${isRetake.value ? 'Separate mode - creating new result for retake' : 'First attempt - creating new result'}`);
    }
    
    console.log('💾 Saving assessment result:', resultData);
    
    // Save assessment result to Firestore
    const resultId = await saveAssessmentResult(resultData);
    
    console.log('✅ Assessment result saved successfully!', resultId);
    
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

const capturePhoto = () => {
  showCamera.value = true;
};

const selectFile = () => {
  const fileInput = document.querySelector('.file-input') as HTMLInputElement;
  fileInput?.click();
};

const handlePhotoTaken = (file: File) => {
  console.log('📷 Photo received from camera:', file.name, file.size);
  uploadedFiles.value.push(file);
  showCamera.value = false;
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
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  return new Date(timestamp).toLocaleDateString();
};

const getAcceptedFileTypes = () => {
  if (!assessment.value?.allowedFileTypes?.length) return '*';
  
  return assessment.value.allowedFileTypes
    .flatMap(type => type.split(','))
    .map(type => type.trim())
    .map(type => type === '*' ? '*' : `.${type}`)
    .join(',');
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes / 1024 / 1024) + ' MB';
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Cleanup timer on unmount
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
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
  background: #f8fafc;
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
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e5e7eb;
}

.assessment-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
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
  background: white;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content h1 {
  color: #1f2937;
  font-size: 2rem;
  margin-bottom: 10px;
}

.header-content p {
  color: #6b7280;
  margin-bottom: 15px;
  line-height: 1.6;
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

.instructions-section,
.questions-section {
  background: white;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.instructions-section h2,
.questions-section h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 20px;
}

.instructions-content p {
  color: #374151;
  line-height: 1.6;
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

.progress-bar {
  background: #f3f4f6;
  border-radius: 10px;
  height: 8px;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #10b981, #059669);
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: -25px;
  right: 0;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.question-card {
  background: #f9fafb;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  border: 2px solid #e5e7eb;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
}

.question-header h3 {
  color: #1f2937;
  font-size: 1.3rem;
  margin: 0;
}

.question-points {
  background: #f0f4ff;
  color: #3730a3;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.question-text {
  color: #1f2937;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 25px;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-label:hover {
  border-color: #667eea;
  background: #f8faff;
}

.option-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prev-button,
.next-button {
  background: #f3f4f6;
  color: #374151;
}

.prev-button:hover,
.next-button:hover {
  background: #e5e7eb;
}

.submit-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
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
</style>
