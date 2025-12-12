<template>
  <div class="strategy-lesson">
    <!-- Progress Indicator -->
    <div class="lesson-progress-bar">
      <div
        v-for="step in 4"
        :key="step"
        class="progress-step"
        :class="{
          active: currentStep === step,
          complete: currentStep > step
        }"
      >
        <div class="step-number">{{ step }}</div>
        <div class="step-label">{{ getStepLabel(step) }}</div>
      </div>
    </div>

    <!-- Step 1: Overview -->
    <div v-if="currentStep === 1 && lesson" class="lesson-step overview-step">
      <h1>{{ lesson.title }}</h1>

      <div class="overview-content">
        <div class="overview-section">
          <h3>🎯 What is it?</h3>
          <p>{{ lesson.overview.what }}</p>
        </div>

        <div class="overview-section">
          <h3>💡 Why is it important?</h3>
          <p>{{ lesson.overview.why }}</p>
        </div>

        <div class="overview-section">
          <h3>⏰ When to use it?</h3>
          <p>{{ lesson.overview.when }}</p>
        </div>

        <div class="overview-section">
          <h3>📝 Examples</h3>
          <ul class="examples-list">
            <li v-for="(example, index) in lesson.overview.examples" :key="index">
              {{ example }}
            </li>
          </ul>
        </div>

        <div class="overview-section memory-tricks">
          <h3>🧠 Memory Tricks</h3>
          <ul class="tricks-list">
            <li v-for="(trick, index) in lesson.overview.memoryTricks" :key="index">
              💭 {{ trick }}
            </li>
          </ul>
        </div>
      </div>

      <div class="step-actions">
        <button @click="nextStep" class="next-btn">
          Continue to Video →
        </button>
      </div>
    </div>

    <!-- Step 2: Video -->
    <div v-if="currentStep === 2 && lesson" class="lesson-step video-step">
      <h2>📺 Watch and Learn</h2>
      <p class="video-intro">Watch this short video to see the {{ lesson.title }} strategy in action:</p>

      <div class="video-container">
        <!-- YouTube Video -->
        <iframe
          v-if="lesson.video.provider === 'youtube'"
          :src="getYouTubeEmbedUrl()"
          width="100%"
          height="480"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>

        <!-- Khan Academy Video -->
        <iframe
          v-else-if="lesson.video.provider === 'khan'"
          :src="lesson.video.url"
          width="100%"
          height="480"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>

      <div class="video-info">
        <p>📹 <strong>{{ lesson.video.title }}</strong></p>
        <p>⏱️ About {{ Math.ceil(lesson.video.duration / 60) }} minutes</p>
      </div>

      <div class="step-actions">
        <button @click="prevStep" class="back-btn">
          ← Back to Overview
        </button>
        <button @click="nextStep" class="next-btn">
          I'm Ready to Practice →
        </button>
      </div>
    </div>

    <!-- Step 3: Practice -->
    <div v-if="currentStep === 3 && lesson" class="lesson-step practice-step">
      <h2>✏️ Practice Time</h2>
      <p class="practice-intro">
        Let's practice the {{ lesson.title }} strategy!
      </p>

      <div class="practice-progress-info">
        <span>Problem {{ currentProblemIndex + 1 }} of {{ lesson.practice.problems.length }}</span>
        <span class="score-display">
          Score: {{ practiceCorrect }} / {{ practiceAttempted }}
          <span v-if="practiceAttempted > 0">({{ Math.round((practiceCorrect / practiceAttempted) * 100) }}%)</span>
        </span>
      </div>

      <div v-if="currentPracticeProblem" class="practice-problem">
        <!-- Missing Number Practice -->
        <div v-if="lesson.practice.type === 'missing-number' || (lesson.practice.type === 'mixed' && currentPracticeProblem.problemType === 'missing-number')" class="missing-number-practice">
          <div class="problem-display">
            <h3>{{ currentPracticeProblem.problemText }}</h3>
          </div>

          <div class="answer-input-group">
            <input
              ref="practiceInput"
              :value="practiceAnswer"
              @input="(e) => practiceAnswer = (e.target as HTMLInputElement).value"
              type="number"
              min="0"
              class="practice-input"
              @keyup.enter="submitPracticeAnswer"
              :disabled="showingFeedback"
              placeholder="?"
            >
            <button @click="submitPracticeAnswer" class="submit-btn" :disabled="showingFeedback || !practiceAnswer">
              Check
            </button>
          </div>
        </div>

        <!-- Scaffolded Practice -->
        <div v-else-if="lesson.practice.type === 'scaffolded' || (lesson.practice.type === 'mixed' && currentPracticeProblem.problemType === 'scaffolded')" class="scaffolded-practice">
          <div class="problem-display">
            <h3>{{ currentPracticeProblem.problemText }}</h3>
          </div>

          <div v-if="currentPracticeProblem.scaffolding" class="scaffolding-steps">
            <div
              v-for="(step, index) in currentPracticeProblem.scaffolding.steps"
              :key="step.stepNumber"
              class="scaffold-step"
              :class="{ active: currentScaffoldStep === index, complete: currentScaffoldStep > index }"
            >
              <div class="step-header">
                <span class="step-num">Step {{ step.stepNumber }}</span>
                <span v-if="currentScaffoldStep > index" class="step-check">✅</span>
              </div>

              <div v-if="currentScaffoldStep >= index" class="step-content">
                <p class="step-question">{{ step.question }}</p>

                <div v-if="currentScaffoldStep === index" class="step-input">
                  <input
                    ref="scaffoldInput"
                    :value="scaffoldAnswer"
                    @input="(e) => scaffoldAnswer = (e.target as HTMLInputElement).value"
                    type="number"
                    class="practice-input"
                    @keyup.enter="submitScaffoldStep"
                  >
                  <button @click="submitScaffoldStep" class="submit-btn" :disabled="!scaffoldAnswer">
                    Check
                  </button>
                </div>

                <div v-if="currentScaffoldStep > index && step.explanation" class="step-explanation">
                  {{ step.explanation }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Drag-Drop Ten Frames (Placeholder for now) -->
        <div v-else-if="lesson.practice.type === 'drag-drop' || (lesson.practice.type === 'mixed' && currentPracticeProblem.problemType === 'drag-drop')" class="drag-drop-practice">
          <div class="problem-display">
            <h3>{{ currentPracticeProblem.problemText }}</h3>
          </div>

          <div class="ten-frame-placeholder">
            <p>🎨 Interactive ten frame activity coming soon!</p>
            <p>For now, solve using the Making 10 strategy:</p>

            <div class="answer-input-group">
              <input
                ref="practiceInput"
                :value="practiceAnswer"
                @input="(e) => practiceAnswer = (e.target as HTMLInputElement).value"
                type="number"
                class="practice-input"
                @keyup.enter="submitPracticeAnswer"
              >
              <button @click="submitPracticeAnswer" class="submit-btn" :disabled="!practiceAnswer">
                Check
              </button>
            </div>
          </div>
        </div>

        <!-- Feedback Display -->
        <div v-if="showingFeedback" class="feedback" :class="{ correct: lastAnswerCorrect, incorrect: !lastAnswerCorrect }">
          <div class="feedback-icon">{{ lastAnswerCorrect ? '✅' : '❌' }}</div>
          <div class="feedback-message">
            {{ lastAnswerCorrect ? currentPracticeProblem.feedbackCorrect : currentPracticeProblem.feedbackIncorrect }}
          </div>
          <div v-if="!lastAnswerCorrect && currentPracticeProblem.strategy" class="strategy-reminder">
            💡 <strong>Strategy:</strong> {{ currentPracticeProblem.strategy }}
          </div>
          <button @click="nextPracticeProblem" class="continue-btn">
            Continue →
          </button>
        </div>
      </div>

      <!-- Practice complete -->
      <div v-else class="practice-complete">
        <h3>Practice Complete!</h3>
        <p>You got {{ practiceCorrect }} out of {{ lesson.practice.problems.length }} correct
          ({{ Math.round((practiceCorrect / lesson.practice.problems.length) * 100) }}%)</p>

        <div v-if="passedPractice" class="passed-message">
          <p class="success">✅ Great job! You're ready to use this strategy!</p>
          <button @click="completeLesson" class="complete-btn">
            Finish Lesson →
          </button>
        </div>

        <div v-else class="retry-message">
          <p class="needs-work">
            You need {{ lesson.practice.successCriteria.minPercentage }}% to pass.
            Let's review the strategy and try again!
          </p>
          <button @click="retryPractice" class="retry-btn">
            Review & Try Again
          </button>
          <button @click="completeLesson" class="skip-btn">
            Continue Anyway
          </button>
        </div>
      </div>
    </div>

    <!-- Step 4: Complete -->
    <div v-if="currentStep === 4 && lesson" class="lesson-step complete-step">
      <h1>🎉 Lesson Complete!</h1>

      <div class="completion-message">
        <p>{{ lesson.completionMessage }}</p>
      </div>

      <div class="next-steps-card">
        <h3>📚 Next Steps</h3>
        <p>{{ lesson.nextSteps }}</p>
      </div>

      <div class="completion-stats">
        <div class="stat">
          <span class="stat-number">{{ practiceCorrect }}</span>
          <span class="stat-label">Problems Correct</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ Math.round((practiceCorrect / lesson.practice.problems.length) * 100) }}%</span>
          <span class="stat-label">Accuracy</span>
        </div>
      </div>

      <div class="step-actions">
        <button @click="exitLesson" class="exit-btn" :disabled="saving">
          {{ saving ? 'Saving...' : 'Continue to Practice →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getLessonById } from '@/config/strategyLessons';
import { completeLesson as saveLessonCompletion } from '@/services/strategyLessonService';
import type { StrategyLesson, LessonProblem } from '@/types/strategyLessons';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Props
const lessonId = ref(route.params.lessonId as string);
const lesson = ref<StrategyLesson | null>(null);

// State
const currentStep = ref(1);  // 1=Overview, 2=Video, 3=Practice, 4=Complete
const currentProblemIndex = ref(0);
const currentScaffoldStep = ref(0);
const practiceAnswer = ref<string>('');
const scaffoldAnswer = ref<string>('');
const showingFeedback = ref(false);
const lastAnswerCorrect = ref(false);
const practiceAttempted = ref(0);
const practiceCorrect = ref(0);
const scaffoldAnswers = ref<string[]>([]);
const saving = ref(false);  // Prevent navigation during save

// Refs
const practiceInput = ref<HTMLInputElement | null>(null);
const scaffoldInput = ref<HTMLInputElement | null>(null);

// Computed
const currentPracticeProblem = computed(() => {
  if (!lesson.value) return null;
  return lesson.value.practice.problems[currentProblemIndex.value] || null;
});

const passedPractice = computed(() => {
  if (!lesson.value || lesson.value.practice.problems.length === 0) return false;

  const accuracy = (practiceCorrect.value / lesson.value.practice.problems.length) * 100;
  return (
    practiceCorrect.value >= lesson.value.practice.successCriteria.minCorrect &&
    accuracy >= lesson.value.practice.successCriteria.minPercentage
  );
});

// Methods
function getStepLabel(step: number): string {
  switch (step) {
    case 1: return 'Overview';
    case 2: return 'Video';
    case 3: return 'Practice';
    case 4: return 'Complete';
    default: return '';
  }
}

function getYouTubeEmbedUrl(): string {
  if (!lesson.value) return '';

  const url = lesson.value.video.url;
  let videoId = '';

  // Extract video ID from various YouTube URL formats
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }

  let embedUrl = `https://www.youtube.com/embed/${videoId}`;

  // Add start time if specified
  if (lesson.value.video.startTime) {
    embedUrl += `?start=${lesson.value.video.startTime}`;
  }

  return embedUrl;
}

function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value++;

    // Focus input when entering practice
    if (currentStep.value === 3) {
      nextTick(() => {
        practiceInput.value?.focus();
      });
    }
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function submitPracticeAnswer() {
  if (!currentPracticeProblem.value) return;

  // Handle empty string or zero as valid answer (for 5 + 0 = 5 type problems)
  const studentAnswerStr = practiceAnswer.value.trim();

  // Allow submission even if answer is empty/zero
  if (studentAnswerStr === '' && currentPracticeProblem.value.correctAnswer !== '0') {
    return; // Don't submit if no answer (unless answer is 0)
  }

  const isCorrect = studentAnswerStr === currentPracticeProblem.value.correctAnswer;

  lastAnswerCorrect.value = isCorrect;
  showingFeedback.value = true;
  practiceAttempted.value++;

  if (isCorrect) {
    practiceCorrect.value++;
  }
}

function submitScaffoldStep() {
  if (!currentPracticeProblem.value?.scaffolding || !scaffoldAnswer.value) return;

  const currentStepData = currentPracticeProblem.value.scaffolding.steps[currentScaffoldStep.value];
  const studentAnswerStr = scaffoldAnswer.value.trim();
  const isCorrect = studentAnswerStr === currentStepData.correctAnswer;

  if (isCorrect) {
    // Store answer and move to next step
    scaffoldAnswers.value.push(scaffoldAnswer.value);
    scaffoldAnswer.value = '';
    currentScaffoldStep.value++;

    // If all steps complete, mark problem as correct
    if (currentScaffoldStep.value >= currentPracticeProblem.value.scaffolding.steps.length) {
      lastAnswerCorrect.value = true;
      showingFeedback.value = true;
      practiceAttempted.value++;
      practiceCorrect.value++;
    } else {
      // Focus next input
      nextTick(() => {
        scaffoldInput.value?.focus();
      });
    }
  } else {
    // Wrong answer - show hint or feedback
    alert(currentStepData.hint || 'Not quite. Try again!');
  }
}

function nextPracticeProblem() {
  showingFeedback.value = false;
  practiceAnswer.value = '';
  scaffoldAnswer.value = '';
  currentScaffoldStep.value = 0;
  scaffoldAnswers.value = [];
  currentProblemIndex.value++;

  nextTick(() => {
    if (lesson.value?.practice.type === 'scaffolded') {
      scaffoldInput.value?.focus();
    } else {
      practiceInput.value?.focus();
    }
  });
}

function retryPractice() {
  // Reset practice
  currentProblemIndex.value = 0;
  practiceAttempted.value = 0;
  practiceCorrect.value = 0;
  practiceAnswer.value = '';
  scaffoldAnswer.value = '';
  currentScaffoldStep.value = 0;
  scaffoldAnswers.value = [];
  showingFeedback.value = false;

  // Go back to overview
  currentStep.value = 1;
}

async function completeLesson() {
  if (!lesson.value || !authStore.currentUser) return;

  console.log('💾 SAVING LESSON COMPLETION:', {
    lessonId: lesson.value.id,
    studentUid: authStore.currentUser.uid,
    attempted: lesson.value.practice.problems.length,
    correct: practiceCorrect.value,
    passed: passedPractice.value
  });

  try {
    // Save lesson completion to Firestore
    await saveLessonCompletion(
      authStore.currentUser.uid,
      lesson.value.id,
      {
        attempted: lesson.value.practice.problems.length,
        correct: practiceCorrect.value,
        passed: passedPractice.value
      }
    );

    console.log('✅ Lesson completed and saved successfully:', lesson.value.id);

    // Mark as complete
    currentStep.value = 4;
  } catch (error) {
    console.error('❌ ERROR saving lesson completion:', error);
    alert(`Error saving lesson completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Still allow progression even if save fails
    currentStep.value = 4;
  }
}

async function exitLesson() {
  console.log('🔵 exitLesson called');
  console.log('  lesson:', lesson.value?.id);
  console.log('  user:', authStore.currentUser?.uid);
  console.log('  currentStep:', currentStep.value);

  if (!lesson.value || !authStore.currentUser) {
    console.log('❌ Missing lesson or user, navigating anyway');
    router.push('/fluency/daily-practice');
    return;
  }

  try {
    saving.value = true;

    console.log('💾 Attempting to save lesson completion...');

    // Ensure lesson completion is saved before exiting
    if (currentStep.value === 4) {
      const saveData = {
        attempted: lesson.value.practice.problems.length,
        correct: practiceCorrect.value,
        passed: passedPractice.value
      };

      console.log('💾 Save data:', saveData);

      await saveLessonCompletion(
        authStore.currentUser.uid,
        lesson.value.id,
        saveData
      );

      console.log('✅ Lesson saved to Firestore successfully!');
      console.log('✅ Navigating to practice...');
    }

    // Return to practice (with flag to prevent redirect loop)
    router.push({
      path: '/fluency/daily-practice',
      query: { fromLesson: 'true' }
    });
  } catch (error) {
    console.error('❌ ERROR saving lesson on exit:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    // Still navigate even if save fails
    router.push({
      path: '/fluency/daily-practice',
      query: { fromLesson: 'true' }
    });
  } finally {
    saving.value = false;
  }
}

// Initialize
onMounted(() => {
  const loadedLesson = getLessonById(lessonId.value);

  if (!loadedLesson) {
    console.error('Lesson not found:', lessonId.value);
    router.push('/');
    return;
  }

  lesson.value = loadedLesson;
  console.log('📚 Loaded lesson:', lesson.value.title);
});
</script>

<style scoped>
.strategy-lesson {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

/* Progress Bar */
.lesson-progress-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3rem;
  padding: 0 2rem;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
}

.progress-step::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 50%;
  width: 100%;
  height: 3px;
  background: #e0e0e0;
  z-index: -1;
}

.progress-step:last-child::after {
  display: none;
}

.progress-step.complete::after {
  background: #4caf50;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
}

.progress-step.active .step-number {
  background: #2196f3;
  color: white;
  transform: scale(1.2);
}

.progress-step.complete .step-number {
  background: #4caf50;
  color: white;
}

.step-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.progress-step.active .step-label {
  color: #2196f3;
  font-weight: 700;
}

/* Lesson Steps */
.lesson-step {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.lesson-step h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.lesson-step h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 2rem;
}

/* Overview Step */
.overview-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.overview-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #2196f3;
}

.overview-section h3 {
  color: #1976d2;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.overview-section p {
  color: #555;
  line-height: 1.7;
  font-size: 1.05rem;
  margin: 0;
}

.examples-list,
.tricks-list {
  margin: 0;
  padding-left: 1.5rem;
}

.examples-list li,
.tricks-list li {
  color: #555;
  line-height: 1.8;
  font-size: 1.05rem;
  margin: 0.5rem 0;
}

.memory-tricks {
  background: #fff3e0;
  border-left-color: #ff9800;
}

.memory-tricks h3 {
  color: #f57c00;
}

/* Video Step */
.video-intro {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.video-container {
  margin: 2rem 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.video-info {
  text-align: center;
  color: #666;
  margin-top: 1rem;
}

.video-info p {
  margin: 0.25rem 0;
}

/* Practice Step */
.practice-intro {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.practice-progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-weight: 600;
  color: #555;
}

.score-display {
  color: #2196f3;
}

.practice-problem {
  min-height: 300px;
}

.problem-display {
  text-align: center;
  margin-bottom: 2rem;
}

.problem-display h3 {
  font-size: 2.5rem;
  color: #2c3e50;
  font-weight: 700;
}

.answer-input-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.practice-input {
  width: 120px;
  padding: 1rem;
  font-size: 1.8rem;
  text-align: center;
  border: 3px solid #ddd;
  border-radius: 8px;
  font-weight: 700;
}

.practice-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.submit-btn {
  padding: 1rem 2rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Scaffolded Practice */
.scaffolding-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scaffold-step {
  padding: 1.5rem;
  border-radius: 12px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  transition: all 0.3s;
}

.scaffold-step.active {
  background: #e3f2fd;
  border-color: #2196f3;
}

.scaffold-step.complete {
  background: #e8f5e9;
  border-color: #4caf50;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.step-num {
  font-weight: 700;
  color: #2196f3;
  font-size: 1.1rem;
}

.step-check {
  font-size: 1.5rem;
}

.step-question {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 500;
}

.step-input {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.step-explanation {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  color: #4caf50;
  font-weight: 600;
}

/* Feedback */
.feedback {
  margin-top: 2rem;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.feedback.correct {
  background: #e8f5e9;
  border: 2px solid #4caf50;
}

.feedback.incorrect {
  background: #ffebee;
  border: 2px solid #f44336;
}

.feedback-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.feedback-message {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.strategy-reminder {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  color: #1976d2;
  font-size: 1.05rem;
}

.continue-btn {
  margin-top: 1rem;
  padding: 1rem 2rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.continue-btn:hover {
  background: #1976d2;
}

/* Step Actions */
.step-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 3rem;
}

.next-btn,
.complete-btn,
.exit-btn {
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.next-btn:hover,
.complete-btn:hover,
.exit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.3);
}

.back-btn {
  padding: 1rem 2rem;
  background: #f8f9fa;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #999;
}

.retry-btn {
  padding: 1rem 2rem;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.skip-btn {
  padding: 1rem 2rem;
  background: #9e9e9e;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* Complete Step */
.completion-message {
  text-align: center;
  font-size: 1.3rem;
  color: #555;
  margin: 2rem 0;
  line-height: 1.8;
}

.next-steps-card {
  background: #e3f2fd;
  padding: 2rem;
  border-radius: 12px;
  margin: 2rem 0;
}

.next-steps-card h3 {
  color: #1976d2;
  margin: 0 0 1rem 0;
}

.next-steps-card p {
  color: #555;
  line-height: 1.7;
  margin: 0;
}

.completion-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 2rem 0;
}

.stat {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 3rem;
  font-weight: bold;
  color: #4caf50;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.practice-complete {
  text-align: center;
  padding: 2rem;
}

.passed-message {
  background: #e8f5e9;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 2rem;
}

.success {
  color: #2e7d32;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.retry-message {
  background: #fff3e0;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 2rem;
}

.needs-work {
  color: #f57c00;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.ten-frame-placeholder {
  background: #f8f9fa;
  padding: 3rem;
  border-radius: 12px;
  text-align: center;
  color: #666;
}

.ten-frame-placeholder p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}
</style>

