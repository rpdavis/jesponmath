<template>
  <div class="migration-tool">
    <div class="migration-header">
      <h1>🔄 Database Migration Tool</h1>
      <p>Migrate from array-based assignments to junction table architecture</p>
    </div>

    <div class="migration-status" v-if="migrationStatus">
      <h3>📊 Migration Status</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">Assignments Migrated:</span>
          <span class="value">{{ migrationStatus.assignmentsMigrated }}</span>
        </div>
        <div class="status-item">
          <span class="label">Results Updated:</span>
          <span class="value">{{ migrationStatus.resultsMigrated }}</span>
        </div>
        <div class="status-item">
          <span class="label">Goals Updated:</span>
          <span class="value">{{ migrationStatus.goalsMigrated }}</span>
        </div>
        <div class="status-item">
          <span class="label">Students Cleaned:</span>
          <span class="value">{{ migrationStatus.studentsUpdated }}</span>
        </div>
      </div>
      
      <div v-if="migrationStatus.errors.length > 0" class="errors">
        <h4>❌ Errors:</h4>
        <ul>
          <li v-for="error in migrationStatus.errors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </div>

    <div class="migration-actions">
      <button 
        @click="runMigration" 
        :disabled="isRunning"
        class="migration-button primary"
      >
        {{ isRunning ? '🔄 Running Migration...' : '🚀 Run Full Migration' }}
      </button>
      
      <button 
        @click="validateMigration" 
        :disabled="isRunning"
        class="migration-button secondary"
      >
        🔍 Validate Migration
      </button>
      
      <button 
        @click="cleanupFailed" 
        :disabled="isRunning"
        class="migration-button warning"
      >
        🧹 Cleanup Failed Migration
      </button>
    </div>

    <div v-if="validationResult" class="validation-result">
      <h3>🔍 Validation Result</h3>
      <div class="validation-status" :class="{ success: validationResult.valid, error: !validationResult.valid }">
        {{ validationResult.valid ? '✅ Migration Valid' : '❌ Migration Issues Found' }}
      </div>
      
      <div v-if="validationResult.issues.length > 0" class="issues">
        <h4>Issues Found:</h4>
        <ul>
          <li v-for="issue in validationResult.issues" :key="issue">{{ issue }}</li>
        </ul>
      </div>
    </div>

    <div class="migration-info">
      <h3>📋 What This Migration Does</h3>
      <ul>
        <li><strong>Step 1:</strong> Moves assignment data from student arrays to junction table</li>
        <li><strong>Step 2:</strong> Removes dual identifiers (studentSeisId) from assessment results</li>
        <li><strong>Step 3:</strong> Updates goals to use only studentUid</li>
        <li><strong>Step 4:</strong> Cleans up old arrays from student documents</li>
      </ul>
      
      <div class="warning">
        <h4>⚠️ Important Notes:</h4>
        <ul>
          <li>This migration is <strong>irreversible</strong> - make sure you have backups</li>
          <li>The application will continue working during migration</li>
          <li>Run validation after migration to ensure success</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { runFullMigration, validateMigration as validateMigrationService, cleanupFailedMigration } from '@/firebase/migrationService';

const isRunning = ref(false);
const migrationStatus = ref<any>(null);
const validationResult = ref<any>(null);

const runMigration = async () => {
  if (!confirm('Are you sure you want to run the database migration? This action cannot be undone.')) {
    return;
  }
  
  isRunning.value = true;
  migrationStatus.value = null;
  validationResult.value = null;
  
  try {
    // First clean up any failed attempts
    console.log('🧹 Cleaning up any previous failed migration attempts...');
    await cleanupFailedMigration();
    
    console.log('🔄 Starting database migration...');
    const result = await runFullMigration();
    migrationStatus.value = result;
    
    if (result.success) {
      console.log('✅ Migration completed successfully');
    } else {
      console.error('❌ Migration completed with errors:', result.errors);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    migrationStatus.value = {
      success: false,
      assignmentsMigrated: 0,
      resultsMigrated: 0,
      goalsMigrated: 0,
      studentsUpdated: 0,
      errors: [`Migration failed: ${error}`]
    };
  } finally {
    isRunning.value = false;
  }
};

const validateMigration = async () => {
  isRunning.value = true;
  validationResult.value = null;
  
  try {
    console.log('🔍 Validating migration...');
    const result = await validateMigrationService();
    validationResult.value = result;
    
    if (result.valid) {
      console.log('✅ Migration validation passed');
    } else {
      console.error('❌ Migration validation failed:', result.issues);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    validationResult.value = {
      valid: false,
      issues: [`Validation failed: ${error}`]
    };
  } finally {
    isRunning.value = false;
  }
};

const cleanupFailed = async () => {
  if (!confirm('Are you sure you want to cleanup failed migration data? This will delete any partial migration records.')) {
    return;
  }
  
  isRunning.value = true;
  
  try {
    console.log('🧹 Cleaning up failed migration...');
    await cleanupFailedMigration();
    console.log('✅ Cleanup completed successfully');
    alert('✅ Failed migration data cleaned up successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    alert(`❌ Cleanup failed: ${error}`);
  } finally {
    isRunning.value = false;
  }
};
</script>

<style scoped>
.migration-tool {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.migration-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.migration-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.migration-status {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.label {
  font-weight: 600;
  color: #495057;
}

.value {
  font-weight: bold;
  color: #28a745;
}

.errors {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
}

.errors h4 {
  margin: 0 0 0.5rem 0;
  color: #721c24;
}

.errors ul {
  margin: 0;
  padding-left: 1.5rem;
}

.migration-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.migration-button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.migration-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.migration-button.primary {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.migration-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.migration-button.secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.migration-button.secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.migration-button.warning {
  background: linear-gradient(135deg, #fd7e14 0%, #e55353 100%);
  color: white;
}

.migration-button.warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(253, 126, 20, 0.3);
}

.validation-result {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.validation-status {
  padding: 1rem;
  border-radius: 6px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
}

.validation-status.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.validation-status.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.issues {
  margin-top: 1rem;
}

.issues h4 {
  margin: 0 0 0.5rem 0;
  color: #721c24;
}

.issues ul {
  margin: 0;
  padding-left: 1.5rem;
}

.migration-info {
  background: #e7f3ff;
  border: 1px solid #b8daff;
  border-radius: 8px;
  padding: 1.5rem;
}

.migration-info h3 {
  margin: 0 0 1rem 0;
  color: #004085;
}

.migration-info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.migration-info li {
  margin-bottom: 0.5rem;
}

.warning {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
}

.warning h4 {
  margin: 0 0 0.5rem 0;
  color: #856404;
}

.warning ul {
  margin: 0;
  padding-left: 1.5rem;
}

.warning li {
  margin-bottom: 0.25rem;
}
</style>
