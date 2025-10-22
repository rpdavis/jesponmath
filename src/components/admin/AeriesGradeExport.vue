<template>
  <div class="aeries-export-container">
    <div class="export-header">
      <h2>📊 Export Grades to Aeries</h2>
      <p class="subtitle">Export assessment results to Aeries SIS format</p>
    </div>

    <!-- Export Options -->
    <div class="export-options">
      <div class="option-group">
        <label>Export Type:</label>
        <select v-model="exportType" @change="clearPreview" class="format-select">
          <option value="assessments">All Assessments</option>
          <option value="standards">Standards-Based (ESA)</option>
        </select>
        <small class="form-help">
          Standards-based export groups by ESA standards and uses Aeries assignment names
        </small>
      </div>
      
      <div class="option-group">
        <label>Export Format:</label>
        <select v-model="exportOptions.format" class="format-select">
          <option value="csv">CSV (Recommended)</option>
          <option value="xml">XML</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div class="option-group">
        <label>Grade Category:</label>
        <input 
          v-model="exportOptions.gradeCategory" 
          placeholder="e.g., Assessment, Quiz, Test"
          class="category-input"
        />
      </div>

      <div class="option-group">
        <label>
          <input 
            type="checkbox" 
            v-model="exportOptions.includeRetakes"
          />
          Include Retakes
        </label>
      </div>
      
      <div class="option-group" v-if="exportType === 'standards'">
        <label>
          <input 
            type="checkbox" 
            v-model="standardsOnlyMode"
          />
          Standards Only (Skip unmapped assessments)
        </label>
      </div>

      <!-- Date Range Filter -->
      <div class="date-range-group">
        <label>Date Range (Optional):</label>
        <div class="date-inputs">
          <input 
            type="date" 
            v-model="startDate"
            placeholder="Start Date"
          />
          <span>to</span>
          <input 
            type="date" 
            v-model="endDate"
            placeholder="End Date"
          />
        </div>
      </div>
    </div>

    <!-- Period Selection -->
    <div class="period-selection" v-if="availablePeriods.length > 0">
      <h3>Select Class Period:</h3>
      <div class="period-buttons">
        <button 
          v-for="period in availablePeriods"
          :key="period"
          @click="selectedPeriod = period"
          :class="['period-btn', { active: selectedPeriod === period }]"
        >
          Period {{ period }}
        </button>
        <button 
          @click="selectedPeriod = 'all'"
          :class="['period-btn', { active: selectedPeriod === 'all' }]"
        >
          All Periods
        </button>
      </div>
    </div>

    <!-- Preview Section -->
    <div class="preview-section" v-if="currentPreviewData">
      <h3>Export Preview</h3>
      <div class="preview-stats">
        <div class="stat-item">
          <span class="stat-label">Students:</span>
          <span class="stat-value">{{ uniqueStudents }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ exportType === 'standards' ? 'Standards' : 'Assessments' }}:</span>
          <span class="stat-value">{{ uniqueAssessments }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Grades:</span>
          <span class="stat-value">{{ 
            isGradeExportData(currentPreviewData) ? currentPreviewData.totalRecords : 
            isStandardsExportData(currentPreviewData) ? currentPreviewData.length : 0 
          }}</span>
        </div>
      </div>
      
      <!-- Standards Summary (only for standards export) -->
      <div v-if="standardsSummary" class="standards-summary">
        <h4>📊 Standards Summary</h4>
        <div class="summary-stats">
          <div class="summary-item">
            <span class="summary-label">Total Standards:</span>
            <span class="summary-value">{{ standardsSummary.totalStandards }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Standards with Grades:</span>
            <span class="summary-value">{{ standardsSummary.standardsWithGrades }}</span>
          </div>
          <div class="summary-item" v-if="standardsSummary.unmappedAssessments > 0">
            <span class="summary-label">Unmapped Assessments:</span>
            <span class="summary-value warning">{{ standardsSummary.unmappedAssessments }}</span>
          </div>
        </div>
      </div>

      <!-- Sample Data Preview -->
      <div class="sample-preview" v-if="isGradeExportData(currentPreviewData) && currentPreviewData.grades.length > 0">
        <h4>Sample Records:</h4>
        <div class="preview-table">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Assignment</th>
                <th v-if="exportType === 'standards'">Standard</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="grade in currentPreviewData.grades.slice(0, 5)" :key="`${grade.studentId}-${grade.assignmentName}`">
                <td>{{ grade.studentId }}</td>
                <td>{{ grade.assignmentName }}</td>
                <td v-if="exportType === 'standards'">{{ (grade as any).standardCode }}</td>
                <td>{{ grade.score }}/{{ grade.totalPoints }}</td>
                <td>{{ grade.percentage }}%</td>
                <td>{{ grade.dateCompleted }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="currentPreviewData.grades.length > 5" class="more-records">
            ... and {{ currentPreviewData.grades.length - 5 }} more records
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        @click="generatePreview" 
        :disabled="loading"
        class="btn-secondary"
      >
        {{ loading ? 'Generating...' : '👀 Preview Export' }}
      </button>
      
      <button 
        @click="exportGrades" 
        :disabled="!currentPreviewData || loading"
        class="btn-primary"
      >
        {{ loading ? 'Exporting...' : '📁 Download Export' }}
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      <h4>❌ Export Error:</h4>
      <p>{{ error }}</p>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      <h4>✅ Export Successful!</h4>
      <p>{{ successMessage }}</p>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      <h3>📋 How to Import to Aeries:</h3>
      <ol>
        <li>Download the export file using the button above</li>
        <li>Log into your Aeries SIS system</li>
        <li>Navigate to <strong>Gradebook → Import Grades</strong></li>
        <li>Select the downloaded file and follow Aeries import wizard</li>
        <li>Verify the grade mappings before final import</li>
      </ol>
      
      <div class="tip">
        <strong>💡 Tip:</strong> CSV format is recommended as it's the most widely supported by Aeries SIS systems.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { 
  exportTeacherGradesToAeries,
  exportGradesByPeriod,
  downloadAeriesExport,
  validateAeriesExport,
  type ExportOptions,
  type AeriesExportData
} from '@/services/aeriesGradeExport';
import {
  exportStandardsGradesToAeries,
  downloadStandardsExport,
  validateStandardsExport,
  type StandardsExportOptions,
  type AeriesStandardsExportData
} from '@/services/aeriesStandardsExport';
import { getStudentsByTeacher } from '@/firebase/userServices';

const authStore = useAuthStore();

// Reactive data
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const previewData = ref<AeriesExportData | null>(null);
const standardsPreviewData = ref<AeriesStandardsExportData[] | null>(null);
const availablePeriods = ref<string[]>([]);
const selectedPeriod = ref<string>('all');
const exportType = ref<'assessments' | 'standards'>('standards'); // Default to standards
const standardsOnlyMode = ref(true);

// Form data
const startDate = ref('');
const endDate = ref('');
const exportOptions = ref<ExportOptions>({
  format: 'csv',
  includeRetakes: false,
  gradeCategory: 'Assessment'
});

// Computed properties
const currentPreviewData = computed(() => {
  return exportType.value === 'standards' ? standardsPreviewData.value : previewData.value;
});

// Type guards
const isGradeExportData = (data: any): data is AeriesExportData => {
  return data && typeof data === 'object' && 'grades' in data && 'totalRecords' in data;
};

const isStandardsExportData = (data: any): data is AeriesStandardsExportData[] => {
  return Array.isArray(data);
};

const uniqueStudents = computed(() => {
  if (!currentPreviewData.value) return 0;
  if (isGradeExportData(currentPreviewData.value)) {
    const studentIds = new Set(currentPreviewData.value.grades.map((g: any) => g.studentId));
    return studentIds.size;
  }
  if (isStandardsExportData(currentPreviewData.value)) {
    return currentPreviewData.value.length;
  }
  return 0;
});

const uniqueAssessments = computed(() => {
  if (!currentPreviewData.value) return 0;
  if (isGradeExportData(currentPreviewData.value)) {
    const assessmentNames = new Set(currentPreviewData.value.grades.map((g: any) => g.assignmentName));
    return assessmentNames.size;
  }
  if (isStandardsExportData(currentPreviewData.value)) {
    const standardCodes = new Set(currentPreviewData.value.flatMap(student => 
      student.standards.map(s => s.standardCode)
    ));
    return standardCodes.size;
  }
  return 0;
});

const standardsSummary = computed(() => {
  if (exportType.value === 'standards' && standardsPreviewData.value && Array.isArray(standardsPreviewData.value)) {
    // Generate summary from the standards data
    const allStandards = standardsPreviewData.value.flatMap(student => student.standards);
    const standardCounts = allStandards.reduce((acc, standard) => {
      acc[standard.standardCode] = (acc[standard.standardCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return standardCounts;
  }
  return null;
});

// Methods
const loadAvailablePeriods = async () => {
  try {
    if (!authStore.currentUser?.uid) return;
    
    const students = await getStudentsByTeacher(authStore.currentUser.uid);
    const periods = [...new Set(students.map(s => s.period).filter(Boolean))] as string[];
    availablePeriods.value = periods.sort();
    
  } catch (err: any) {
    console.error('Error loading periods:', err);
  }
};

const generatePreview = async () => {
  try {
    loading.value = true;
    error.value = '';
    successMessage.value = '';
    
    if (!authStore.currentUser?.uid) {
      throw new Error('User not authenticated');
    }
    
    if (exportType.value === 'standards') {
      // Standards-based export
      const options: StandardsExportOptions = {
        includeAllStandards: standardsOnlyMode.value,
        exportFormat: exportOptions.value.format as 'csv' | 'json',
        gradeCalculationMethod: 'most_recent'
      };
      
      // Note: Date range filtering would be handled in the export function
      
      const exportData = await exportStandardsGradesToAeries([authStore.currentUser.uid], options);
      
      // Validate export data
      const validation = validateStandardsExport(exportData);
      if (!validation.isValid) {
        throw new Error('Export validation failed:\n' + validation.errors.join('\n'));
      }
      
      standardsPreviewData.value = exportData;
      previewData.value = null; // Clear other preview
      
      successMessage.value = `Preview generated! Found ${exportData.length} students with standards data.`;
      
    } else {
      // Regular assessment export
      const options: ExportOptions = {
        ...exportOptions.value
      };
      
      // Add date range if specified
      if (startDate.value && endDate.value) {
        options.dateRange = {
          start: new Date(startDate.value),
          end: new Date(endDate.value)
        };
      }
      
      // Export based on period selection
      let exportData: AeriesExportData;
      if (selectedPeriod.value === 'all') {
        exportData = await exportTeacherGradesToAeries(authStore.currentUser.uid, options);
      } else {
        exportData = await exportGradesByPeriod(authStore.currentUser.uid, selectedPeriod.value, options);
      }
      
      // Validate export data
      const validationErrors = validateAeriesExport(exportData);
      if (validationErrors.length > 0) {
        throw new Error('Export validation failed:\n' + validationErrors.join('\n'));
      }
      
      previewData.value = exportData;
      standardsPreviewData.value = null; // Clear other preview
      successMessage.value = `Preview generated successfully! Found ${exportData.totalRecords} grade records.`;
    }
    
  } catch (err: any) {
    console.error('Error generating preview:', err);
    error.value = err.message || 'Failed to generate export preview';
    previewData.value = null;
    standardsPreviewData.value = null;
  } finally {
    loading.value = false;
  }
};

const exportGrades = async () => {
  try {
    if (!currentPreviewData.value) {
      throw new Error('Please generate a preview first');
    }
    
    loading.value = true;
    error.value = '';
    
    // Download the appropriate export file
    if (exportType.value === 'standards' && standardsPreviewData.value) {
      const options: StandardsExportOptions = {
        includeAllStandards: standardsOnlyMode.value,
        exportFormat: exportOptions.value.format as 'csv' | 'json',
        gradeCalculationMethod: 'most_recent'
      };
      await downloadStandardsExport(standardsPreviewData.value, options);
      successMessage.value = `Standards export downloaded! ${standardsPreviewData.value.length} students exported in ${exportOptions.value.format.toUpperCase()} format.`;
    } else if (previewData.value) {
      downloadAeriesExport(previewData.value, exportOptions.value.format);
      successMessage.value = `Export downloaded successfully! ${previewData.value.totalRecords} grades exported in ${exportOptions.value.format.toUpperCase()} format.`;
    }
    
  } catch (err: any) {
    console.error('Error exporting grades:', err);
    error.value = err.message || 'Failed to export grades';
  } finally {
    loading.value = false;
  }
};

const clearPreview = () => {
  previewData.value = null;
  standardsPreviewData.value = null;
  successMessage.value = '';
  error.value = '';
};

// Initialize component
onMounted(() => {
  loadAvailablePeriods();
});
</script>

<style scoped>
.aeries-export-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.export-header {
  text-align: center;
  margin-bottom: 30px;
}

.export-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 1.1em;
}

.export-options {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.option-group {
  margin-bottom: 15px;
}

.option-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 5px;
  color: #2c3e50;
}

.format-select,
.category-input {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-range-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-inputs input[type="date"] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.period-selection {
  margin: 20px 0;
}

.period-selection h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.period-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.period-btn {
  padding: 8px 16px;
  border: 2px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.period-btn:hover {
  background: #ecf0f1;
}

.period-btn.active {
  background: #3498db;
  color: white;
}

.preview-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.preview-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  padding: 12px 20px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-label {
  font-weight: 600;
  color: #666;
}

.stat-value {
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
  margin-left: 8px;
}

.standards-summary {
  background: #f0f8ff;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
  border: 1px solid #ddeeff;
}

.standards-summary h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.summary-stats {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.summary-item {
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.summary-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9em;
}

.summary-value {
  font-size: 1.1em;
  font-weight: bold;
  color: #2c3e50;
  margin-left: 6px;
}

.summary-value.warning {
  color: #e67e22;
}

.form-help {
  font-size: 0.85em;
  color: #666;
  margin-top: 4px;
}

.preview-table {
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th {
  background: #34495e;
  color: white;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.preview-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}

.preview-table tr:nth-child(even) {
  background: #f8f9fa;
}

.more-records {
  padding: 10px 12px;
  font-style: italic;
  color: #666;
  background: #f8f9fa;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 160px;
}

.btn-primary {
  background: #27ae60;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #229954;
}

.btn-secondary {
  background: #3498db;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.error-message h4 {
  color: #c0392b;
  margin-bottom: 8px;
}

.error-message p {
  color: #e74c3c;
  margin: 0;
  white-space: pre-line;
}

.success-message {
  background: #dff0d8;
  border: 1px solid #d6e9c6;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

.success-message h4 {
  color: #27ae60;
  margin-bottom: 8px;
}

.success-message p {
  color: #2d5a2d;
  margin: 0;
}

.instructions {
  background: #e8f4fd;
  padding: 20px;
  border-radius: 8px;
  margin-top: 30px;
}

.instructions h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.instructions ol {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.tip {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 12px;
  border-radius: 6px;
  margin-top: 15px;
}

.tip strong {
  color: #856404;
}

@media (max-width: 768px) {
  .aeries-export-container {
    padding: 15px;
  }
  
  .preview-stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .period-buttons {
    justify-content: center;
  }
  
  .preview-table {
    overflow-x: auto;
  }
}
</style>
