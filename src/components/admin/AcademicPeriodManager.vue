<template>
  <div class="academic-period-manager">
    <div class="header">
      <h1>📅 Academic Period Management</h1>
      <p>Configure quarters, semesters, or trimesters with custom dates</p>
    </div>

    <!-- Current Configuration Display -->
    <div class="current-config-section">
      <h2>📊 Current Configuration</h2>
      <div v-if="currentConfig" class="config-display">
        <div class="config-header">
          <span class="config-year">{{ currentConfig.year }}</span>
          <span class="config-type">{{ currentConfig.periodType.toUpperCase() }}</span>
          <span class="config-status" :class="hasActivePeriod(currentConfig) ? 'active' : 'inactive'">
            {{ hasActivePeriod(currentConfig) ? 'Active' : 'Inactive' }}
          </span>
        </div>
        
        <div class="periods-grid">
          <div 
            v-for="period in currentConfig.periods" 
            :key="period.id"
            class="period-card"
            :class="{ 
              current: period.isActive,
              future: period.isFuture,
              past: period.isPast
            }"
          >
            <div class="period-name">{{ period.name }}</div>
            <div class="period-dates">
              {{ formatDate(period.startDate) }} - {{ formatDate(period.endDate) }}
            </div>
            <div class="period-status">
              {{ period.isActive ? 'Current' : period.isFuture ? 'Future' : 'Past' }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-config">
        <p>No academic period configuration found. Create one below.</p>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="config-form-section">
      <h2>⚙️ Configure Academic Periods</h2>
      
      <form @submit.prevent="saveConfiguration" class="config-form">
        <!-- Academic Year -->
        <div class="form-group">
          <label for="academicYear">Academic Year</label>
          <select id="academicYear" v-model="formData.academicYear" required>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>

        <!-- Period Type -->
        <div class="form-group">
          <label>Period Type</label>
          <div class="period-type-options">
            <label class="radio-option">
              <input type="radio" v-model="formData.periodType" value="quarters">
              <span>📊 Quarters (4 periods)</span>
            </label>
            <label class="radio-option">
              <input type="radio" v-model="formData.periodType" value="semesters">
              <span>📚 Semesters (2 periods)</span>
            </label>
            <label class="radio-option">
              <input type="radio" v-model="formData.periodType" value="trimesters">
              <span>📝 Trimesters (3 periods)</span>
            </label>
          </div>
        </div>

        <!-- Period Dates Configuration -->
        <div class="periods-config">
          <h3>📅 Period Dates</h3>
          <div class="periods-form">
            <div 
              v-for="(period, index) in formData.periods" 
              :key="index"
              class="period-form-group"
            >
              <div class="period-form-header">
                <h4>{{ period.name }}</h4>
                <span class="period-short-name">{{ period.shortName }}</span>
              </div>
              
              <div class="date-inputs">
                <div class="date-input-group">
                  <label :for="`start-${index}`">Start Date</label>
                  <input 
                    :id="`start-${index}`"
                    type="date" 
                    v-model="period.startDateString"
                    @change="updatePeriodDate(index, 'start', period.startDateString)"
                    required
                  >
                </div>
                <div class="date-input-group">
                  <label :for="`end-${index}`">End Date</label>
                  <input 
                    :id="`end-${index}`"
                    type="date" 
                    v-model="period.endDateString"
                    @change="updatePeriodDate(index, 'end', period.endDateString)"
                    required
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" @click="loadDefaults" class="btn btn-secondary">
            🔄 Load Defaults
          </button>
          <button type="button" @click="previewConfiguration" class="btn btn-info">
            👀 Preview
          </button>
          <button type="submit" :disabled="saving" class="btn btn-primary">
            {{ saving ? 'Saving...' : '💾 Save Configuration' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Preview Section -->
    <div v-if="previewData" class="preview-section">
      <h2>👀 Configuration Preview</h2>
      <div class="preview-content">
        <div class="preview-header">
          <span class="preview-year">{{ previewData.year }}</span>
          <span class="preview-type">{{ previewData.periodType.toUpperCase() }}</span>
        </div>
        
        <div class="preview-periods">
          <div 
            v-for="period in previewData.periods" 
            :key="period.id"
            class="preview-period"
            :class="{ 
              current: period.isActive,
              future: period.isFuture,
              past: period.isPast
            }"
          >
            <div class="preview-period-name">{{ period.name }}</div>
            <div class="preview-period-dates">
              {{ formatDate(period.startDate) }} - {{ formatDate(period.endDate) }}
            </div>
            <div class="preview-period-status">
              {{ period.isActive ? 'Current' : period.isFuture ? 'Future' : 'Past' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="success" class="success-message">{{ success }}</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { AcademicYear, PeriodType } from '@/types/academicPeriods';
import { 
  getCurrentAcademicYear, 
  generateAcademicYear,
  ACADEMIC_YEAR_TEMPLATES 
} from '@/types/academicPeriods';
import { 
  saveAcademicPeriodSettings, 
  loadAcademicPeriodSettings 
} from '@/firebase/appSettingsService';
import { useAuthStore } from '@/stores/authStore';

// State
const currentConfig = ref<AcademicYear | null>(null);
const previewData = ref<AcademicYear | null>(null);
const saving = ref(false);
const loading = ref(true);
const error = ref('');
const success = ref('');

// Form data
const formData = ref({
  academicYear: getCurrentAcademicYear(),
  periodType: 'quarters' as PeriodType,
  periods: [] as any[]
});

// Initialize form periods based on selected type
const initializeFormPeriods = (periodType: PeriodType) => {
  const template = ACADEMIC_YEAR_TEMPLATES[periodType];
  const [startYear, endYear] = formData.value.academicYear.split('-').map(y => parseInt(y));
  
  formData.value.periods = template.periods.map((periodTemplate, index) => {
    // Calculate default dates
    const startMonth = periodTemplate.months[0];
    const endMonth = periodTemplate.months[periodTemplate.months.length - 1];
    
    const startCalendarYear = startMonth >= 8 ? startYear : endYear;
    const endCalendarYear = endMonth >= 8 ? startYear : endYear;
    
    const startDate = new Date(startCalendarYear, startMonth - 1, 1);
    const endDate = new Date(endCalendarYear, endMonth, 0);
    
    return {
      name: periodTemplate.name,
      shortName: periodTemplate.shortName,
      startDate,
      endDate,
      startDateString: startDate.toISOString().split('T')[0],
      endDateString: endDate.toISOString().split('T')[0]
    };
  });
};

// Watch for period type changes
watch(() => formData.value.periodType, (newType) => {
  initializeFormPeriods(newType);
});

// Methods
const loadConfiguration = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    // Try to load existing configuration from Firestore
    const savedConfig = await loadAcademicPeriodSettings();
    
    if (savedConfig) {
      currentConfig.value = savedConfig;
      
      // Update form data to match current config
      formData.value.academicYear = savedConfig.year;
      formData.value.periodType = savedConfig.periodType;
      
      // Update form periods with saved dates
      formData.value.periods = savedConfig.periods.map(period => ({
        name: period.name,
        shortName: period.shortName,
        startDate: period.startDate,
        endDate: period.endDate,
        startDateString: period.startDate.toISOString().split('T')[0],
        endDateString: period.endDate.toISOString().split('T')[0]
      }));
      
      console.log('✅ Loaded saved academic period configuration from Firestore');
    } else {
      // No configuration exists, initialize with defaults
      initializeFormPeriods(formData.value.periodType);
      console.log('📝 No saved configuration found, using defaults');
    }
    
  } catch (err: any) {
    console.error('Error loading configuration:', err);
    error.value = 'Failed to load configuration';
    // Fallback to defaults on error
    initializeFormPeriods(formData.value.periodType);
  } finally {
    loading.value = false;
  }
};

const saveConfiguration = async () => {
  const authStore = useAuthStore();
  
  try {
    saving.value = true;
    error.value = '';
    success.value = '';
    
    if (!authStore.currentUser?.uid) {
      throw new Error('User not authenticated');
    }
    
    // Create configuration object
    const config: AcademicYear = {
      year: formData.value.academicYear,
      startDate: new Date(formData.value.periods[0].startDateString),
      endDate: new Date(formData.value.periods[formData.value.periods.length - 1].endDateString),
      periodType: formData.value.periodType,
      periods: formData.value.periods.map((period) => {
        const startDate = new Date(period.startDateString);
        const endDate = new Date(period.endDateString);
        const now = new Date();
        
        return {
          id: period.shortName.toLowerCase(),
          name: period.name,
          shortName: period.shortName,
          startDate,
          endDate,
          isActive: isDateInRange(now, startDate, endDate),
          isFuture: now < startDate,
          isPast: now > endDate
        };
      })
    };
    
    // Save to Firestore appSettings collection
    await saveAcademicPeriodSettings(config, authStore.currentUser.uid);
    
    // Update current config
    currentConfig.value = config;
    
    success.value = `Academic period configuration saved to database! Using ${config.periodType} for ${config.year}.`;
    
    console.log('✅ Academic period configuration saved to Firestore:', config);
    
  } catch (err: any) {
    console.error('Error saving configuration:', err);
    error.value = 'Failed to save configuration: ' + (err.message || err);
  } finally {
    saving.value = false;
  }
};

const loadDefaults = () => {
  initializeFormPeriods(formData.value.periodType);
  success.value = `Loaded default ${formData.value.periodType} configuration`;
};

const previewConfiguration = () => {
  // Generate preview
  const config: AcademicYear = {
    year: formData.value.academicYear,
    startDate: new Date(formData.value.periods[0].startDateString),
    endDate: new Date(formData.value.periods[formData.value.periods.length - 1].endDateString),
    periodType: formData.value.periodType,
    periods: formData.value.periods.map((period) => {
      const startDate = new Date(period.startDateString);
      const endDate = new Date(period.endDateString);
      const now = new Date();
      
      return {
        id: period.shortName.toLowerCase(),
        name: period.name,
        shortName: period.shortName,
        startDate,
        endDate,
        isActive: isDateInRange(now, startDate, endDate),
        isFuture: now < startDate,
        isPast: now > endDate
      };
    })
  };
  
  previewData.value = config;
};

const updatePeriodDate = (index: number, type: 'start' | 'end', dateString: string) => {
  const date = new Date(dateString);
  if (type === 'start') {
    formData.value.periods[index].startDate = date;
  } else {
    formData.value.periods[index].endDate = date;
  }
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

const hasActivePeriod = (config: AcademicYear): boolean => {
  return config.periods.some(period => period.isActive);
};

// Initialize on mount
onMounted(() => {
  loadConfiguration();
});
</script>

<style scoped>
.academic-period-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.current-config-section,
.config-form-section,
.preview-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.current-config-section h2,
.config-form-section h2,
.preview-section h2 {
  color: #1f2937;
  font-size: 1.5rem;
  margin-bottom: 20px;
}

/* Current Configuration Display */
.config-display {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.config-year {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.config-type {
  background: #4f46e5;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.config-status {
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.config-status.active {
  background: #10b981;
  color: white;
}

.config-status.inactive {
  background: #6b7280;
  color: white;
}

.periods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.period-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.period-card.current {
  border-color: #10b981;
  background: #ecfdf5;
}

.period-card.future {
  border-color: #f59e0b;
  background: #fffbeb;
}

.period-card.past {
  border-color: #6b7280;
  background: #f9fafb;
}

.period-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1f2937;
  margin-bottom: 8px;
}

.period-dates {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.period-status {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-config {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 40px;
}

/* Form Styles */
.config-form {
  max-width: 800px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.form-group select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.period-type-options {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  margin: 0;
}

.radio-option span {
  font-weight: 500;
}

/* Period Configuration */
.periods-config {
  margin-top: 30px;
}

.periods-config h3 {
  color: #1f2937;
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.periods-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.period-form-group {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.period-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.period-form-header h4 {
  margin: 0;
  color: #1f2937;
}

.period-short-name {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.date-input-group label {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.date-input-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-info {
  background: #0ea5e9;
  color: white;
}

.btn-info:hover {
  background: #0284c7;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Preview Styles */
.preview-content {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.preview-year {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.preview-type {
  background: #0ea5e9;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.preview-periods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.preview-period {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.preview-period.current {
  border-color: #10b981;
  background: #ecfdf5;
}

.preview-period.future {
  border-color: #f59e0b;
  background: #fffbeb;
}

.preview-period.past {
  border-color: #6b7280;
  background: #f9fafb;
}

.preview-period-name {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.preview-period-dates {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.preview-period-status {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Messages */
.success-message {
  background: #d1fae5;
  color: #065f46;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border-left: 4px solid #10b981;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border-left: 4px solid #ef4444;
}

/* Responsive */
@media (max-width: 768px) {
  .periods-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-periods {
    grid-template-columns: 1fr;
  }
  
  .date-inputs {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .config-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
