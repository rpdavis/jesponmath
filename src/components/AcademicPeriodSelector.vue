<template>
  <div class="academic-period-selector">
    <div class="period-header">
      <h3>📅 Academic Period</h3>
      <div class="period-info">
        <span class="academic-year">{{ currentAcademicYear?.year }}</span>
        <span class="date-range">{{ selectedPeriodDateRange }}</span>
      </div>
    </div>
    
    <!-- Period Type Display (Read-only) -->
    <div class="period-type-display">
      <div class="current-type">
        <span class="type-label">Using:</span>
        <span class="type-badge">
          {{ selectedPeriodType === 'quarters' ? '📊 Quarters' : 
             selectedPeriodType === 'semesters' ? '📚 Semesters' : 
             '📝 Trimesters' }}
        </span>
      </div>
    </div>
    
    <!-- Period Selector -->
    <div class="period-selector">
      <div class="period-buttons">
        <button
          v-for="period in periodsWithStatus"
          :key="period.id"
          @click="selectPeriod(period)"
          :class="[
            'period-btn',
            period.statusClass,
            { 
              active: period.isSelected,
              disabled: period.isFuture && !allowFuturePeriods
            }
          ]"
          :disabled="period.isFuture && !allowFuturePeriods"
          :title="`${period.name}: ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`"
        >
          <div class="period-name">{{ period.shortName }}</div>
          <div class="period-label">{{ period.name }}</div>
          <div class="period-status">{{ period.statusText }}</div>
        </button>
      </div>
    </div>
    
    <!-- Current Selection Info -->
    <div v-if="selectedPeriod" class="current-selection">
      <div class="selection-info">
        <span class="selection-icon">
          {{ selectedPeriod.isActive ? '🎯' : selectedPeriod.isFuture ? '⏳' : '📋' }}
        </span>
        <span class="selection-text">
          Showing {{ selectedPeriod.name }} 
          <span class="selection-status">({{ selectedPeriod.isActive ? 'Current' : selectedPeriod.isFuture ? 'Future' : 'Past' }})</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useGlobalAcademicPeriods } from '@/composables/useAcademicPeriods';
import type { AcademicPeriod, PeriodType } from '@/types/academicPeriods';

// Props
defineProps<{
  allowFuturePeriods?: boolean; // Whether to allow selecting future periods
}>();

// Emits
const emit = defineEmits<{
  periodChanged: [period: AcademicPeriod];
  periodTypeChanged: [type: PeriodType];
}>();

// Use global academic periods
const {
  currentAcademicYear,
  selectedPeriodType,
  selectedPeriod,
  periodsWithStatus,
  selectedPeriodDateRange,
  changePeriodType: changeType,
  selectPeriod: selectP
} = useGlobalAcademicPeriods();

// Remove period type changing - this is now admin-only configuration

const selectPeriod = (period: AcademicPeriod) => {
  selectP(period);
  emit('periodChanged', period);
};
</script>

<style scoped>
.academic-period-selector {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.period-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.period-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
}

.period-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.academic-year {
  font-weight: 600;
  color: #4f46e5;
  font-size: 1rem;
}

.date-range {
  font-size: 0.85rem;
  color: #6b7280;
}

.period-type-display {
  margin-bottom: 20px;
}

.current-type {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-label {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.9rem;
}

.type-badge {
  background: #4f46e5;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.period-selector {
  margin-bottom: 20px;
}

.period-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.period-btn {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.period-btn:hover:not(.disabled) {
  border-color: #d1d5db;
  background: #f9fafb;
  transform: translateY(-1px);
}

.period-btn.active {
  border-color: #4f46e5;
  background: #4f46e5;
  color: white;
}

.period-btn.current {
  border-color: #10b981;
  background: #ecfdf5;
}

.period-btn.current.active {
  background: #10b981;
  color: white;
}

.period-btn.future {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #92400e;
}

.period-btn.future.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f3f4f6;
  color: #9ca3af;
}

.period-btn.past {
  border-color: #6b7280;
  background: #f9fafb;
  color: #4b5563;
}

.period-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.period-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.period-status {
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-selection {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #4f46e5;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selection-icon {
  font-size: 1.2rem;
}

.selection-text {
  font-weight: 500;
  color: #1f2937;
}

.selection-status {
  color: #6b7280;
  font-weight: normal;
}

/* Responsive design */
@media (max-width: 768px) {
  .period-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .period-info {
    align-items: flex-start;
  }
  
  .current-type {
    justify-content: center;
  }
  
  .period-buttons {
    justify-content: center;
  }
  
  .period-btn {
    min-width: 80px;
    padding: 10px 12px;
  }
}
</style>
