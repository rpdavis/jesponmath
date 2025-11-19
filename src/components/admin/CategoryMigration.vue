<template>
  <div class="category-migration">
    <div class="header">
      <h2>🔄 Add Category to Assessment Results</h2>
      <p>Add cached assessmentCategory field to existing assessment results</p>
    </div>

    <div class="info-box">
      <h3>📋 What This Does:</h3>
      <ul>
        <li>Adds <code>assessmentCategory</code> field to all <code>assessmentResults</code> documents</li>
        <li>Adds <code>studentCourseId</code>, <code>studentCourseName</code>, <code>studentSection</code>, <code>studentPeriod</code></li>
        <li>Category is copied from the parent <code>assessment</code> document</li>
        <li>Course info is copied from the <code>student</code> document</li>
        <li>Enables faster queries by category and better grouping by class</li>
        <li>Safe to run multiple times - skips results that already have these fields</li>
      </ul>
    </div>

    <div class="migration-options">
      <h3>Select Migration Type:</h3>
      
      <div class="option-group">
        <label class="radio-option">
          <input type="radio" v-model="migrationType" value="all">
          <span><strong>All Results</strong> - Add category to all assessment results</span>
        </label>
      </div>
      
      <div class="option-group">
        <label class="radio-option">
          <input type="radio" v-model="migrationType" value="category">
          <span><strong>Specific Category</strong> - Add category to one type only</span>
        </label>
        
        <select 
          v-if="migrationType === 'category'" 
          v-model="selectedCategory"
          class="category-select"
        >
          <option value="SA">Standard Assessment (SA)</option>
          <option value="ESA">Essential Standard (ESA)</option>
          <option value="PA">Progress Assessment (PA)</option>
          <option value="HW">Home Work (HW)</option>
          <option value="Assign">Assignment</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <div class="option-group">
        <label class="radio-option">
          <input type="radio" v-model="migrationType" value="courseInfo">
          <span><strong>Add Course Info</strong> - Add courseId, courseName, section, period from student profiles</span>
        </label>
      </div>
    </div>

    <div class="action-buttons">
      <button 
        @click="runMigration" 
        :disabled="running || (migrationType === 'category' && !selectedCategory)"
        class="btn-primary"
      >
        {{ running ? 'Running Migration...' : '▶️ Run Migration' }}
      </button>
    </div>

    <div v-if="running" class="progress-section">
      <p class="progress-text">{{ progressMessage }}</p>
      <div class="spinner"></div>
    </div>

    <div v-if="migrationResult" class="results-section">
      <h3>✅ Migration Complete!</h3>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Total Results:</span>
          <span class="stat-value">{{ migrationResult.totalResults }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Updated:</span>
          <span class="stat-value success">{{ migrationResult.updated }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Skipped:</span>
          <span class="stat-value">{{ migrationResult.skipped }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Errors:</span>
          <span class="stat-value" :class="migrationResult.errors > 0 ? 'error' : ''">
            {{ migrationResult.errors }}
          </span>
        </div>
      </div>

      <div v-if="migrationResult.errorDetails.length > 0" class="errors">
        <h4>❌ Errors:</h4>
        <ul>
          <li v-for="(error, index) in migrationResult.errorDetails" :key="index">
            {{ error }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <h4>❌ Migration Failed:</h4>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  addCategoryToAssessmentResults,
  addCategoryToResultsByAssessmentCategory,
  type MigrationResult
} from '@/utils/addCategoryToResults';
import { 
  addCourseInfoToAssessmentResults 
} from '@/utils/addCourseInfoToResults';

const running = ref(false);
const migrationResult = ref<MigrationResult | null>(null);
const error = ref('');
const progressMessage = ref('');
const migrationType = ref<'all' | 'category' | 'courseInfo'>('all');
const selectedCategory = ref<'SA' | 'ESA' | 'PA' | 'HW' | 'Assign' | 'Other'>('SA');

const runMigration = async () => {
  if (!confirm('This will update assessment results in your database. Are you sure?')) {
    return;
  }

  try {
    running.value = true;
    error.value = '';
    migrationResult.value = null;
    progressMessage.value = 'Loading assessment results...';

    let result: MigrationResult;

    if (migrationType.value === 'all') {
      progressMessage.value = 'Adding category to all assessment results...';
      result = await addCategoryToAssessmentResults();
    } else if (migrationType.value === 'category') {
      progressMessage.value = `Adding category to ${selectedCategory.value} assessment results...`;
      result = await addCategoryToResultsByAssessmentCategory(selectedCategory.value);
    } else {
      progressMessage.value = 'Adding course info to all assessment results...';
      result = await addCourseInfoToAssessmentResults();
    }

    migrationResult.value = result;
    progressMessage.value = 'Migration complete!';

  } catch (err: any) {
    console.error('Migration error:', err);
    error.value = err.message || 'Migration failed';
  } finally {
    running.value = false;
  }
};
</script>

<style scoped>
.category-migration {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.info-box {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 1rem;
  margin-bottom: 2rem;
}

.info-box h3 {
  margin-top: 0;
  color: #1976d2;
}

.info-box ul {
  margin: 0.5rem 0 0 1.5rem;
}

.info-box code {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
}

.migration-options {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.migration-options h3 {
  margin-top: 0;
  color: #333;
}

.option-group {
  margin-bottom: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.radio-option input[type="radio"] {
  cursor: pointer;
}

.category-select {
  margin-left: 1.75rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.action-buttons {
  margin-bottom: 2rem;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.progress-section {
  text-align: center;
  padding: 2rem;
}

.progress-text {
  margin-bottom: 1rem;
  color: #666;
  font-size: 1.125rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

.results-section h3 {
  margin-top: 0;
  color: #155724;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.stat-value.success {
  color: #28a745;
}

.stat-value.error {
  color: #dc3545;
}

.errors {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.errors h4 {
  margin-top: 0;
  color: #721c24;
}

.errors ul {
  margin: 0.5rem 0 0 1.5rem;
  color: #721c24;
}

.error-message {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.error-message h4 {
  margin-top: 0;
  color: #721c24;
}

.error-message p {
  margin: 0;
  color: #721c24;
}
</style>

