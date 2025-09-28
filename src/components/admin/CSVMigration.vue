<template>
  <div class="csv-migration">
    <div class="header">
      <h2>📊 CSV Data Migration</h2>
      <p>Import historical grade data from CSV files into the assessment system</p>
    </div>

    <div class="upload-section">
      <div class="upload-area" @click="triggerFileUpload" @dragover.prevent @drop.prevent="handleFileDrop">
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          @change="handleFileSelect"
          style="display: none"
        />
        <div v-if="!selectedFile" class="upload-placeholder">
          <div class="upload-icon">📁</div>
          <p>Click to select CSV file or drag and drop</p>
          <p class="upload-hint">Supports .csv files with student scores</p>
        </div>
        <div v-else class="file-selected">
          <div class="file-icon">📄</div>
          <div class="file-info">
            <p class="file-name">{{ selectedFile.name }}</p>
            <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button @click.stop="clearFile" class="clear-btn">✕</button>
        </div>
      </div>
    </div>

    <div v-if="csvPreview.length > 0" class="preview-section">
      <h3>📋 CSV Preview (First 10 rows)</h3>
      <div class="preview-table">
        <table>
          <thead>
            <tr>
              <th v-for="header in csvHeaders" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in csvPreview" :key="index">
              <td v-for="header in csvHeaders" :key="header">{{ row[header] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="migrationResult" class="result-section">
      <div :class="['result-card', migrationResult.success ? 'success' : 'error']">
        <div class="result-icon">
          {{ migrationResult.success ? '✅' : '❌' }}
        </div>
        <div class="result-content">
          <h4>{{ migrationResult.success ? 'Migration Successful' : 'Migration Failed' }}</h4>
          <p>{{ migrationResult.message }}</p>
          <p v-if="migrationResult.importedCount > 0">
            Imported {{ migrationResult.importedCount }} assessment results
          </p>
          <div v-if="migrationResult.errors.length > 0" class="errors">
            <h5>Errors:</h5>
            <ul>
              <li v-for="error in migrationResult.errors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button
        @click="previewCSV"
        :disabled="!selectedFile || isProcessing"
        class="btn btn-secondary"
      >
        {{ isProcessing ? 'Processing...' : 'Preview CSV' }}
      </button>
      <button
        @click="runMigration"
        :disabled="!selectedFile || csvPreview.length === 0 || isProcessing"
        class="btn btn-primary"
      >
        {{ isProcessing ? 'Importing...' : 'Import Data' }}
      </button>
      <button
        @click="fixAssessmentResults"
        :disabled="isProcessing"
        class="btn btn-warning"
      >
        {{ isProcessing ? 'Fixing...' : '🔧 Fix Assessment Results' }}
      </button>
      <button
        @click="runDiagnostic"
        :disabled="isProcessing"
        class="btn btn-info"
      >
        {{ isProcessing ? 'Checking...' : '🔍 Check Data' }}
      </button>
      
      <button
        @click="deleteAndReimport"
        :disabled="isProcessing"
        class="btn btn-danger"
      >
        {{ isProcessing ? 'Fixing UIDs...' : '🔄 Fix Student UIDs' }}
      </button>
      
      <button
        @click="runGradebookCheck"
        :disabled="isProcessing"
        class="btn btn-success"
      >
        {{ isProcessing ? 'Checking...' : '🎯 Check Gradebook' }}
      </button>
      
      <button
        @click="fixAssessmentNames"
        :disabled="isProcessing"
        class="btn btn-primary"
      >
        {{ isProcessing ? 'Fixing...' : '🔗 Fix Assessment Names' }}
      </button>
      
      <button
        @click="fixQuestionIds"
        :disabled="isProcessing"
        class="btn btn-secondary"
      >
        {{ isProcessing ? 'Fixing...' : '🎯 Fix Question IDs' }}
      </button>
      
      <button
        @click="cleanupAllCSVData"
        :disabled="isProcessing"
        class="btn btn-danger"
      >
        {{ isProcessing ? 'Cleaning...' : '🧹 Delete All CSV Results' }}
      </button>
      
      <button
        @click="assignESAAssessments"
        :disabled="isProcessing"
        class="btn btn-warning"
      >
        {{ isProcessing ? 'Assigning...' : '📋 Assign ESA Assessments' }}
      </button>
      
      <button
        @click="checkAssignments"
        :disabled="isProcessing"
        class="btn btn-info"
      >
        {{ isProcessing ? 'Checking...' : '🔍 Check Assignments' }}
      </button>
      
      <button
        @click="investigateDuplicates"
        :disabled="isProcessing"
        class="btn btn-warning"
      >
        {{ isProcessing ? 'Investigating...' : '🕵️ Investigate Duplicates' }}
      </button>
      
      <button
        @click="inspectDatabase"
        :disabled="isProcessing"
        class="btn btn-secondary"
      >
        {{ isProcessing ? 'Inspecting...' : '🔍 Inspect Database' }}
      </button>
      
      <button
        @click="previewCleanup"
        :disabled="isProcessing"
        class="btn btn-info"
      >
        {{ isProcessing ? 'Previewing...' : '👀 Preview Cleanup' }}
      </button>
      
      <button
        @click="runCleanup"
        :disabled="isProcessing"
        class="btn btn-danger"
      >
        {{ isProcessing ? 'Cleaning...' : '🧹 Clean Duplicates' }}
      </button>
      
      <button
        @click="analyzeAssignmentFlow"
        :disabled="isProcessing"
        class="btn btn-success"
      >
        {{ isProcessing ? 'Analyzing...' : '🔄 Analyze Assignment Flow' }}
      </button>
      
      <button
        @click="diagnoseTeacherStudents"
        :disabled="isProcessing"
        class="btn btn-warning"
      >
        {{ isProcessing ? 'Diagnosing...' : '👨‍🏫 Teacher-Student Link' }}
      </button>
      
      <button @click="clearAll" class="btn btn-outline">Clear All</button>
    </div>

    <div class="help-section">
      <h3>📖 CSV Format Requirements</h3>
      <div class="help-content">
        <p>Your CSV file should include the following columns:</p>
        <ul>
          <li><strong>Student Name</strong> or <strong>Name</strong> - Student's full name</li>
          <li><strong>Student Email</strong> or <strong>Email</strong> - Student's email address</li>
          <li><strong>Assessment</strong> or <strong>Test</strong> or <strong>Quiz</strong> - Assessment name</li>
          <li><strong>Score</strong> or <strong>Points</strong> or <strong>Grade</strong> - Points earned</li>
          <li><strong>Total</strong> or <strong>Max Points</strong> or <strong>Max</strong> - Total possible points</li>
          <li><strong>Grade</strong> (optional) - Student's grade level</li>
        </ul>
        <p class="note">
          <strong>Note:</strong> The system will automatically create student accounts and assessments
          based on the data in your CSV file. Existing students and assessments will be skipped.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { runCSVImport, parseCSV, type MigrationResult } from '@/utils/csvMigration';
import { fixRecentAssessmentResultsByDate } from '@/utils/fixAssessmentResults';
import { runDiagnosticCheck } from '@/utils/diagnosticCheck';
import { runGradebookDiagnostic } from '@/utils/gradebookDiagnostic';
import { deleteIncorrectAssessmentResults, reimportCSVWithCorrectUIDs } from '@/utils/fixStudentUIDs';
import { fixAssessmentMapping } from '@/utils/fixAssessmentMapping';
import { fixQuestionMapping } from '@/utils/fixQuestionMapping';
import { deleteAllCSVResults } from '@/utils/cleanupCSVResults';
import { assignESAAssessmentsToAllStudents } from '@/utils/assignESAAssessments';
import { runAssessmentAssignmentDiagnostic } from '@/utils/assessmentAssignmentDiagnostic';
// import { investigateAssignmentDuplicates } from '@/utils/assignmentInvestigation';
// import { inspectDatabaseContents } from '@/utils/databaseInspector';
// import { cleanupDuplicateAssignments, previewDuplicateCleanup } from '@/utils/assignmentDuplicateCleanup';
import { runAssignmentFlowDiagnostic } from '@/utils/assignmentFlowDiagnostic';
import { runTeacherStudentDiagnostic } from '@/utils/teacherStudentDiagnostic';
import { fixTeacherStudentRelationships, previewTeacherStudentFix } from '@/utils/fixTeacherStudentRelationships';

// State
const selectedFile = ref<File | null>(null);
const csvContent = ref<string>('');
const csvPreview = ref<any[]>([]);
const csvHeaders = ref<string[]>([]);
const migrationResult = ref<MigrationResult | null>(null);
const isProcessing = ref(false);
const fileInput = ref<HTMLInputElement>();

// Computed
const hasFile = computed(() => !!selectedFile.value);
const canPreview = computed(() => hasFile.value && !isProcessing.value);
const canImport = computed(() => csvPreview.value.length > 0 && !isProcessing.value);

// Methods
const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    readFile(file);
  }
};

const handleFileDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      selectedFile.value = file;
      readFile(file);
    }
  }
};

const readFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    csvContent.value = e.target?.result as string;
  };
  reader.readAsText(file);
};

const previewCSV = () => {
  if (!csvContent.value) return;
  
  isProcessing.value = true;
  try {
    const rows = parseCSV(csvContent.value);
    csvHeaders.value = Object.keys(rows[0] || {});
    csvPreview.value = rows.slice(0, 10); // Show first 10 rows
    migrationResult.value = null;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    migrationResult.value = {
      success: false,
      message: `Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const runMigration = async () => {
  if (!csvContent.value) return;
  
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await runCSVImport(csvContent.value);
    migrationResult.value = result;
  } catch (error) {
    console.error('Migration error:', error);
    migrationResult.value = {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const fixAssessmentResults = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await fixRecentAssessmentResultsByDate();
    migrationResult.value = result;
  } catch (error) {
    console.error('Fix assessment results error:', error);
    migrationResult.value = {
      success: false,
      message: `Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const runDiagnostic = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await runDiagnosticCheck();
    migrationResult.value = result;
  } catch (error) {
    console.error('Diagnostic check error:', error);
    migrationResult.value = {
      success: false,
      message: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const deleteAndReimport = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    // Step 1: Delete incorrect results
    console.log('🗑️ Step 1: Deleting incorrect assessment results...');
    const deleteResult = await deleteIncorrectAssessmentResults();
    
    if (!deleteResult.success) {
      migrationResult.value = deleteResult;
      return;
    }
    
    // Step 2: Re-import with correct UIDs
    console.log('🔄 Step 2: Re-importing with correct student UIDs...');
    const reimportResult = await reimportCSVWithCorrectUIDs();
    
    migrationResult.value = {
      success: reimportResult.success,
      message: `${deleteResult.message} ${reimportResult.message}`,
      importedCount: reimportResult.importedCount,
      errors: [...deleteResult.errors, ...reimportResult.errors]
    };
    
  } catch (error) {
    console.error('Delete and re-import error:', error);
    migrationResult.value = {
      success: false,
      message: `Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const runGradebookCheck = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await runGradebookDiagnostic();
    migrationResult.value = result;
  } catch (error) {
    console.error('Gradebook diagnostic error:', error);
    migrationResult.value = {
      success: false,
      message: `Gradebook check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const fixAssessmentNames = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await fixAssessmentMapping();
    migrationResult.value = result;
  } catch (error) {
    console.error('Assessment mapping error:', error);
    migrationResult.value = {
      success: false,
      message: `Assessment mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const fixQuestionIds = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await fixQuestionMapping();
    migrationResult.value = result;
  } catch (error) {
    console.error('Question mapping error:', error);
    migrationResult.value = {
      success: false,
      message: `Question mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const cleanupAllCSVData = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await deleteAllCSVResults();
    migrationResult.value = result;
  } catch (error) {
    console.error('CSV cleanup error:', error);
    migrationResult.value = {
      success: false,
      message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const assignESAAssessments = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await assignESAAssessmentsToAllStudents();
    migrationResult.value = result;
  } catch (error) {
    console.error('ESA assignment error:', error);
    migrationResult.value = {
      success: false,
      message: `ESA assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const checkAssignments = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await runAssessmentAssignmentDiagnostic();
    migrationResult.value = result;
  } catch (error) {
    console.error('Assignment diagnostic error:', error);
    migrationResult.value = {
      success: false,
      message: `Assignment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const investigateDuplicates = async () => {
  console.log('🕵️ Assignment investigation feature temporarily disabled');
  // Investigation tool has been removed - functionality integrated into other diagnostics
  migrationResult.value = {
    success: true,
    message: 'Assignment investigation feature has been integrated into other diagnostic tools',
    importedCount: 0,
    errors: []
  };
};

const inspectDatabase = async () => {
  console.log('🔍 Database inspection feature temporarily disabled');
  // Database inspection tool has been removed - functionality integrated into other diagnostics
  migrationResult.value = {
    success: true,
    message: 'Database inspection feature has been integrated into other diagnostic tools',
    importedCount: 0,
    errors: []
  };
};

const previewCleanup = async () => {
  console.log('👀 Preview cleanup feature temporarily disabled');
  // Cleanup preview tool has been removed - functionality integrated into other diagnostics
  migrationResult.value = {
    success: true,
    message: 'Cleanup preview feature has been integrated into other diagnostic tools',
    importedCount: 0,
    errors: []
  };
};

const runCleanup = async () => {
  console.log('🧹 Cleanup feature temporarily disabled');
  // Cleanup tool has been removed - functionality integrated into other diagnostics
  migrationResult.value = {
    success: true,
    message: 'Cleanup feature has been integrated into other diagnostic tools',
    importedCount: 0,
    errors: []
  };
};

const analyzeAssignmentFlow = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await runAssignmentFlowDiagnostic();
    migrationResult.value = result;
  } catch (error) {
    console.error('Assignment flow analysis error:', error);
    migrationResult.value = {
      success: false,
      message: `Flow analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};

const diagnoseTeacherStudents = async () => {
  isProcessing.value = true;
  migrationResult.value = null;
  
  try {
    const result = await runTeacherStudentDiagnostic();
    migrationResult.value = result;
  } catch (error) {
    console.error('Teacher-student diagnostic error:', error);
    migrationResult.value = {
      success: false,
      message: `Teacher-student diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  } finally {
    isProcessing.value = false;
  }
};


const clearFile = () => {
  selectedFile.value = null;
  csvContent.value = '';
  csvPreview.value = [];
  csvHeaders.value = [];
  migrationResult.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const clearAll = () => {
  clearFile();
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.csv-migration {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.upload-section {
  margin-bottom: 2rem;
}

.upload-area {
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.upload-area:hover {
  border-color: #3498db;
  background: #ecf0f1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
}

.upload-hint {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
}

.file-icon {
  font-size: 2rem;
}

.file-info {
  text-align: left;
}

.file-name {
  font-weight: 600;
  margin: 0;
}

.file-size {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

.clear-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.preview-table {
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.preview-table tr:hover {
  background: #f5f5f5;
}

.result-section {
  margin-bottom: 2rem;
}

.result-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid;
}

.result-card.success {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.result-card.error {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.result-icon {
  font-size: 1.5rem;
}

.result-content h4 {
  margin: 0 0 0.5rem 0;
}

.result-content p {
  margin: 0 0 0.5rem 0;
}

.errors {
  margin-top: 1rem;
}

.errors h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.errors ul {
  margin: 0;
  padding-left: 1.5rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-outline {
  background: transparent;
  color: #7f8c8d;
  border: 1px solid #7f8c8d;
}

.btn-outline:hover:not(:disabled) {
  background: #7f8c8d;
  color: white;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-info {
  background: #3498db;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #2980b9;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.help-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.help-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.help-content ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.help-content li {
  margin-bottom: 0.5rem;
}

.note {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
  margin-top: 1rem;
}
</style>
