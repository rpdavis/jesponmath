<template>
  <div class="goal-question-debugger">
    <div class="page-header">
      <h1>🔍 Goal Question Generator Debugger</h1>
      <p>Test question generation for each goal to verify it's working correctly</p>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <button @click="testAllGoals" class="btn btn-primary" :disabled="loading">
        {{ loading ? '⏳ Testing...' : '🚀 Test All Goals' }}
      </button>
      <button @click="clearResults" class="btn btn-secondary" :disabled="loading || results.length === 0">
        🗑️ Clear Results
      </button>
    </div>

    <!-- Results -->
    <div v-if="results.length > 0" class="results-section">
      <h2>Test Results ({{ results.length }} goals)</h2>
      
      <div v-for="(result, index) in results" :key="index" class="result-card">
        <div class="goal-header">
          <h3>{{ result.goal.goalTitle }}</h3>
          <div class="goal-meta">
            <span class="badge">{{ result.goal.areaOfNeed }}</span>
            <span class="badge">Grade {{ result.goal.gradeLevel || 'N/A' }}</span>
          </div>
        </div>
        
        <div class="goal-text">
          <strong>Goal Text:</strong>
          <p>{{ result.goal.goalText }}</p>
        </div>
        
        <div class="detection-info">
          <h4>🔍 Detection Results:</h4>
          <ul>
            <li><strong>Subject:</strong> <span class="highlight">{{ result.detection.subject }}</span></li>
            <li><strong>Is Multi-Step:</strong> <span class="highlight">{{ result.detection.isMultiStep ? '✅ Yes' : '❌ No' }}</span></li>
            <li><strong>Is Multi-Step Scenario:</strong> <span class="highlight">{{ result.detection.isMultiStepScenario ? '✅ Yes' : '❌ No' }}</span></li>
            <li><strong>Needs Numerical Expression:</strong> <span class="highlight">{{ result.detection.needsNumericalExpression ? '✅ Yes' : '❌ No' }}</span></li>
            <li><strong>Needs Algebraic Expression:</strong> <span class="highlight">{{ result.detection.needsAlgebraicExpression ? '✅ Yes' : '❌ No' }}</span></li>
            <li><strong>Is Word Problem:</strong> <span class="highlight">{{ result.detection.isWordProblem ? '✅ Yes' : '❌ No' }}</span></li>
            <li><strong>Needs Equation:</strong> <span class="highlight">{{ result.detection.needsEquation ? '✅ Yes' : '❌ No' }}</span></li>
            <li><strong>Is Evaluate Expression:</strong> <span class="highlight">{{ result.detection.isEvaluateExpression ? '✅ Yes' : '❌ No' }}</span></li>
            <li><strong>Operations:</strong> <span class="highlight">{{ result.detection.operationTypes.join(', ') || 'None detected' }}</span></li>
          </ul>
        </div>
        
        <div class="generated-question">
          <h4>📝 Generated Question:</h4>
          <div class="question-display">
            <div class="question-text">
              <strong>Question:</strong>
              <pre>{{ result.question.question }}</pre>
            </div>
            <div class="question-answer">
              <strong>Answer:</strong>
              <pre>{{ result.question.answer }}</pre>
            </div>
            <div v-if="result.question.explanation" class="question-explanation">
              <strong>Explanation:</strong>
              <pre>{{ result.question.explanation }}</pre>
            </div>
            <div class="question-meta">
              <span class="meta-badge">Requires Photo: {{ result.question.requiresPhoto ? '✅' : '❌' }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="result.error" class="error-display">
          <strong>❌ Error:</strong>
          <pre>{{ result.error }}</pre>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Generating test questions for all goals...</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && results.length === 0" class="empty-state">
      <p>Click "Test All Goals" to generate sample questions for each goal.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getAllGoals } from '@/firebase/goalServices'
import type { Goal } from '@/types/iep'
import { 
  generateQuestionForGoal, 
  detectGoalCharacteristics,
  type QuestionResult,
  type GoalDetection 
} from '@/services/goalQuestionGenerator'

interface TestResult {
  goal: Goal
  detection: GoalDetection
  question: QuestionResult
  error?: string
}

const loading = ref(false)
const results = ref<TestResult[]>([])

// Use the new generator service

const testAllGoals = async () => {
  try {
    loading.value = true
    results.value = []
    
    // Get all goals
    const goals = await getAllGoals()
    console.log(`📋 Found ${goals.length} goals to test`)
    
    // Test each goal
    for (const goal of goals) {
      try {
        // Use new detection and generation system
        const detection = detectGoalCharacteristics(goal)
        
        // Generate one question (question #1) using template method
        const question = await generateQuestionForGoal(goal, 1, {
          method: 'template'
        })
        
        results.value.push({
          goal,
          detection,
          question
        })
      } catch (error: any) {
        // Fallback detection if generation fails
        const detection = detectGoalCharacteristics(goal)
        results.value.push({
          goal,
          detection,
          question: {
            question: 'Error generating question',
            answer: 'N/A',
            requiresPhoto: false
          },
          error: error.message || String(error)
        })
      }
    }
    
    console.log(`✅ Tested ${results.value.length} goals`)
  } catch (error) {
    console.error('Error testing goals:', error)
    alert('Error testing goals. Please check the console.')
  } finally {
    loading.value = false
  }
}

const clearResults = () => {
  results.value = []
}
</script>

<style scoped>
.goal-question-debugger {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #718096;
  font-size: 1rem;
}

.controls-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover:not(:disabled) {
  background: #cbd5e0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.results-section {
  margin-top: 2rem;
}

.results-section h2 {
  margin-bottom: 1.5rem;
  color: #2d3748;
}

.result-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.goal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.goal-meta {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  background: #edf2f7;
  color: #4a5568;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.goal-text {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.goal-text strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.goal-text p {
  margin: 0;
  color: #4a5568;
  line-height: 1.6;
}

.detection-info {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f0fff4;
  border-left: 4px solid #48bb78;
  border-radius: 8px;
}

.detection-info h4 {
  margin: 0 0 0.75rem 0;
  color: #22543d;
}

.detection-info ul {
  margin: 0;
  padding-left: 1.5rem;
  list-style: none;
}

.detection-info li {
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.highlight {
  font-weight: 600;
  color: #2b6cb0;
}

.generated-question {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff5f5;
  border-left: 4px solid #fc8181;
  border-radius: 8px;
}

.generated-question h4 {
  margin: 0 0 0.75rem 0;
  color: #742a2a;
}

.question-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-display > div {
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #fed7d7;
}

.question-display strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #742a2a;
}

.question-display pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #4a5568;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
}

.question-meta {
  display: flex;
  gap: 0.5rem;
}

.meta-badge {
  padding: 0.25rem 0.75rem;
  background: #fed7d7;
  color: #742a2a;
  border-radius: 6px;
  font-size: 0.875rem;
}

.error-display {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff5f5;
  border: 2px solid #fc8181;
  border-radius: 8px;
  color: #c53030;
}

.error-display pre {
  margin: 0.5rem 0 0 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #718096;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #718096;
}
</style>

