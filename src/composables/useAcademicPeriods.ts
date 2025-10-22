// Academic Periods Composable
// Manages academic period state and filtering

import { ref, computed, watch } from 'vue';
import type { 
  AcademicYear, 
  AcademicPeriod, 
  PeriodType 
} from '@/types/academicPeriods';
import { 
  getCurrentAcademicYear, 
  generateAcademicYear, 
  getCurrentPeriod, 
  getDefaultPeriod,
  filterAssessmentsByPeriod,
  filterResultsByPeriod
} from '@/types/academicPeriods';
import { loadAcademicPeriodSettings } from '@/firebase/appSettingsService';

// Global state for academic periods
const currentAcademicYear = ref<AcademicYear | null>(null);
const selectedPeriodType = ref<PeriodType>('quarters');
const selectedPeriod = ref<AcademicPeriod | null>(null);
let isInitialized = false;

export function useAcademicPeriods() {
  
  // Initialize academic year and periods
  const initializeAcademicYear = async (periodType: PeriodType = 'quarters') => {
    let academicYear: AcademicYear;
    
    // Try to load saved configuration from Firestore first
    try {
      const savedConfig = await loadAcademicPeriodSettings();
      
      if (savedConfig) {
        academicYear = savedConfig;
        console.log(`📅 Loaded saved configuration from Firestore: ${savedConfig.periodType} for ${savedConfig.year}`);
      } else {
        // No saved configuration, use defaults
        const yearString = getCurrentAcademicYear();
        academicYear = generateAcademicYear(yearString, periodType);
        console.log(`📅 Using default configuration: ${periodType} for ${yearString}`);
      }
    } catch (error) {
      console.warn('Error loading saved configuration from Firestore, using defaults:', error);
      const yearString = getCurrentAcademicYear();
      academicYear = generateAcademicYear(yearString, periodType);
    }
    
    currentAcademicYear.value = academicYear;
    selectedPeriodType.value = academicYear.periodType;
    
    // Set default selected period
    const defaultPeriod = getDefaultPeriod(academicYear);
    selectedPeriod.value = defaultPeriod;
    
    console.log(`🎯 Default period: ${defaultPeriod.name} (${defaultPeriod.isActive ? 'Active' : defaultPeriod.isFuture ? 'Future' : 'Past'})`);
    
    return academicYear;
  };

  // Helper function for date range checking
  const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
    return date >= start && date <= end;
  };
  
  // Change period type (quarters/semesters/trimesters)
  const changePeriodType = (newType: PeriodType) => {
    if (newType === selectedPeriodType.value) return;
    
    console.log(`🔄 Changing from ${selectedPeriodType.value} to ${newType}`);
    initializeAcademicYear(newType);
  };
  
  // Select a specific period
  const selectPeriod = (period: AcademicPeriod) => {
    selectedPeriod.value = period;
    console.log(`📅 Selected period: ${period.name}`);
  };
  
  // Get periods with status
  const periodsWithStatus = computed(() => {
    if (!currentAcademicYear.value) return [];
    
    return currentAcademicYear.value.periods.map(period => ({
      ...period,
      isSelected: selectedPeriod.value?.id === period.id,
      statusText: period.isActive ? 'Current' : period.isFuture ? 'Future' : 'Past',
      statusClass: period.isActive ? 'current' : period.isFuture ? 'future' : 'past'
    }));
  });
  
  // Filter functions
  const filterAssessments = (assessments: any[]) => {
    if (!selectedPeriod.value) return assessments;
    return filterAssessmentsByPeriod(assessments, selectedPeriod.value);
  };
  
  const filterResults = (results: any[]) => {
    if (!selectedPeriod.value) return results;
    return filterResultsByPeriod(results, selectedPeriod.value);
  };
  
  // Get date range string for display
  const selectedPeriodDateRange = computed(() => {
    if (!selectedPeriod.value) return '';
    
    const start = selectedPeriod.value.startDate.toLocaleDateString();
    const end = selectedPeriod.value.endDate.toLocaleDateString();
    return `${start} - ${end}`;
  });
  
  // Check if a date falls within selected period
  const isInSelectedPeriod = (date: Date | any) => {
    if (!selectedPeriod.value) return true;
    
    const checkDate = date?.toDate?.() || new Date(date);
    return checkDate >= selectedPeriod.value.startDate && 
           checkDate <= selectedPeriod.value.endDate;
  };
  
  // Get period for a specific date
  const getPeriodForDate = (date: Date | any): AcademicPeriod | null => {
    if (!currentAcademicYear.value) return null;
    
    const checkDate = date?.toDate?.() || new Date(date);
    return currentAcademicYear.value.periods.find(period => 
      checkDate >= period.startDate && checkDate <= period.endDate
    ) || null;
  };
  
  // Initialize only once per singleton instance
  if (!isInitialized) {
    isInitialized = true;
    initializeAcademicYear().catch(console.error);
  }
  
  return {
    // State
    currentAcademicYear: computed(() => currentAcademicYear.value),
    selectedPeriodType: computed(() => selectedPeriodType.value),
    selectedPeriod: computed(() => selectedPeriod.value),
    periodsWithStatus,
    selectedPeriodDateRange,
    
    // Actions
    initializeAcademicYear,
    changePeriodType,
    selectPeriod,
    
    // Filtering
    filterAssessments,
    filterResults,
    isInSelectedPeriod,
    getPeriodForDate
  };
}

// Singleton instance for global state
let globalAcademicPeriods: ReturnType<typeof useAcademicPeriods> | null = null;

export function useGlobalAcademicPeriods() {
  // Only create instance once and reuse it
  if (!globalAcademicPeriods) {
    globalAcademicPeriods = useAcademicPeriods();
  }
  
  return globalAcademicPeriods;
}
