<template>
  <div class="standard-selector">
    <div class="selector-header">
      <h3>📏 Standard Selection</h3>
      <p>Choose either a custom standard OR a Common Core standard</p>
    </div>
    
    <!-- Standard Type Toggle -->
    <div class="standard-type-toggle">
      <button 
        @click="selectStandardType('custom')" 
        :class="{ active: standardType === 'custom' }"
        class="type-button custom"
      >
        🎯 Custom Standards
      </button>
      <button 
        @click="selectStandardType('ccss')" 
        :class="{ active: standardType === 'ccss' }"
        class="type-button ccss"
      >
        📚 Common Core (CCSS)
      </button>
    </div>

    <!-- Grade Filter (for both types) -->
    <div class="grade-filter">
      <label for="gradeSelect">Grade Level:</label>
      <select 
        id="gradeSelect"
        v-model="selectedGrade" 
        @change="loadStandardsForGrade"
        class="grade-select"
      >
        <option value="">All Grades</option>
        <option v-for="grade in GRADE_LEVELS" :key="grade.value" :value="grade.value">
          {{ grade.label }}
        </option>
      </select>
    </div>

    <!-- Custom Standards Section -->
    <div v-if="standardType === 'custom'" class="standards-section">
      <div class="section-header">
        <h4>🎯 Custom Standards</h4>
        <div class="search-box">
          <input 
            v-model="customSearchTerm"
            @input="searchCustomStandardsLocal"
            type="text" 
            placeholder="Search custom standards..."
            class="search-input"
          >
        </div>
      </div>
      
      <div v-if="loadingCustom" class="loading">Loading custom standards...</div>
      
      <div v-else-if="filteredCustomStandards.length === 0" class="no-results">
        <p>No custom standards found for the selected criteria.</p>
        <router-link to="/admin/standards" class="create-link">
          ➕ Create Custom Standards
        </router-link>
      </div>
      
      <div v-else class="standards-list">
        <div 
          v-for="standard in filteredCustomStandards" 
          :key="standard.id"
          @click="selectCustomStandard(standard)"
          class="standard-option"
          :class="{ selected: selectedCustom?.id === standard.id }"
        >
          <div class="standard-info">
            <div class="standard-name">{{ standard.name }}</div>
            <div class="standard-code">{{ standard.code }}</div>
            <div v-if="standard.description" class="standard-description">
              {{ standard.description }}
            </div>
            <div class="standard-meta">
              <span class="grade-badge">{{ getGradeLabel(standard.grade) }}</span>
              <span v-if="standard.category" class="category-badge">{{ standard.category }}</span>
              <span v-if="standard.ccssAlignment" class="ccss-badge">CCSS: {{ standard.ccssAlignment }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CCSS Section -->
    <div v-if="standardType === 'ccss'" class="standards-section">
      <div class="section-header">
        <h4>📚 Common Core State Standards</h4>
        <div class="search-box">
          <input 
            v-model="ccssSearchTerm"
            @input="searchCCSSStandards"
            type="text" 
            placeholder="Search CCSS standards..."
            class="search-input"
          >
        </div>
      </div>
      
      <div v-if="filteredCCSSStandards.length === 0" class="no-results">
        <p>No CCSS standards found for the selected criteria.</p>
      </div>
      
      <div v-else class="standards-list">
        <div 
          v-for="standard in filteredCCSSStandards" 
          :key="standard.code"
          @click="selectCCSSStandard(standard)"
          class="standard-option"
          :class="{ selected: selectedCCSS?.code === standard.code }"
        >
          <div class="standard-info">
            <div class="standard-name">{{ standard.title }}</div>
            <div class="standard-code">{{ standard.code }}</div>
            <div class="standard-description">{{ standard.description }}</div>
            <div class="standard-meta">
              <span class="grade-badge">{{ getGradeLabel(standard.grade) }}</span>
              <span class="domain-badge">{{ standard.domain }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Standard Display -->
    <div v-if="selectedCustom || selectedCCSS" class="selected-standard">
      <h4>✅ Selected Standard</h4>
      <div class="selected-info">
        <div class="selected-name">
          {{ selectedCustom?.name || selectedCCSS?.title }}
        </div>
        <div class="selected-code">
          {{ selectedCustom?.code || selectedCCSS?.code }}
        </div>
        <div class="selected-type">
          Type: {{ standardType === 'custom' ? 'Custom Standard' : 'Common Core Standard' }}
        </div>
        <button @click="clearSelection" class="clear-selection">
          ✕ Clear Selection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  getAllCustomStandards, 
  getCustomStandardsByGrade, 
  searchCustomStandards 
} from '@/firebase/standardsServices';
import { getCCSSByGrade, searchCCSS } from '@/data/ccssStandards';
import { GRADE_LEVELS } from '@/types/standards';
import type { CustomStandard, CCSSStandard } from '@/types/standards';

// Props
interface Props {
  modelValue?: {
    type: 'custom' | 'ccss';
    standardId: string;
    standard: CustomStandard | CCSSStandard;
  } | null;
  grade?: string; // Auto-filter by grade if provided
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: {
    type: 'custom' | 'ccss';
    standardId: string; 
    standard: CustomStandard | CCSSStandard;
  } | null];
}>();

// State
const standardType = ref<'custom' | 'ccss'>('custom');
const selectedGrade = ref(props.grade || '');
const customSearchTerm = ref('');
const ccssSearchTerm = ref('');
const loadingCustom = ref(false);

// Standards data
const customStandards = ref<CustomStandard[]>([]);
const ccssStandards = ref<CCSSStandard[]>([]);

// Selected standards
const selectedCustom = ref<CustomStandard | null>(null);
const selectedCCSS = ref<CCSSStandard | null>(null);

// Computed
const filteredCustomStandards = computed(() => {
  let filtered = customStandards.value;
  
  if (selectedGrade.value) {
    filtered = filtered.filter(s => s.grade === selectedGrade.value);
  }
  
  if (customSearchTerm.value) {
    const term = customSearchTerm.value.toLowerCase();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term)
    );
  }
  
  return filtered;
});

const filteredCCSSStandards = computed(() => {
  let filtered = ccssStandards.value;
  
  if (selectedGrade.value) {
    filtered = filtered.filter(s => s.grade === selectedGrade.value);
  }
  
  if (ccssSearchTerm.value) {
    const term = ccssSearchTerm.value.toLowerCase();
    filtered = filtered.filter(s => 
      s.code.toLowerCase().includes(term) ||
      s.title.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term) ||
      s.domain.toLowerCase().includes(term)
    );
  }
  
  return filtered;
});

// Methods
const selectStandardType = (type: 'custom' | 'ccss') => {
  standardType.value = type;
  clearSelection();
  loadStandardsForGrade();
};

const loadStandardsForGrade = async () => {
  try {
    if (standardType.value === 'custom') {
      loadingCustom.value = true;
      if (selectedGrade.value) {
        customStandards.value = await getCustomStandardsByGrade(selectedGrade.value);
      } else {
        customStandards.value = await getAllCustomStandards();
      }
      loadingCustom.value = false;
    } else {
      if (selectedGrade.value) {
        ccssStandards.value = getCCSSByGrade(selectedGrade.value);
      } else {
        // Load all CCSS standards (you might want to limit this)
        ccssStandards.value = [];
      }
    }
  } catch (error) {
    console.error('Error loading standards:', error);
    loadingCustom.value = false;
  }
};

const searchCustomStandardsLocal = async () => {
  if (!customSearchTerm.value && !selectedGrade.value) {
    customStandards.value = await getAllCustomStandards();
  }
  // Filtering happens in computed property
};

const searchCCSSStandards = () => {
  if (ccssSearchTerm.value || selectedGrade.value) {
    ccssStandards.value = searchCCSS(ccssSearchTerm.value, selectedGrade.value);
  } else {
    ccssStandards.value = [];
  }
};

const selectCustomStandard = (standard: CustomStandard) => {
  selectedCustom.value = standard;
  selectedCCSS.value = null;
  
  emit('update:modelValue', {
    type: 'custom',
    standardId: standard.id,
    standard: standard
  });
};

const selectCCSSStandard = (standard: CCSSStandard) => {
  selectedCCSS.value = standard;
  selectedCustom.value = null;
  
  emit('update:modelValue', {
    type: 'ccss',
    standardId: standard.code,
    standard: standard
  });
};

const clearSelection = () => {
  selectedCustom.value = null;
  selectedCCSS.value = null;
  emit('update:modelValue', null);
};

const getGradeLabel = (grade: string): string => {
  const gradeObj = GRADE_LEVELS.find(g => g.value === grade);
  return gradeObj?.label || grade;
};

// Initialize from props
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    standardType.value = newValue.type;
    if (newValue.type === 'custom') {
      selectedCustom.value = newValue.standard as CustomStandard;
      selectedCCSS.value = null;
    } else {
      selectedCCSS.value = newValue.standard as CCSSStandard;
      selectedCustom.value = null;
    }
  } else {
    clearSelection();
  }
}, { immediate: true });

// Load initial data
onMounted(async () => {
  await loadStandardsForGrade();
});
</script>

<style scoped>
.standard-selector {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
}

.selector-header {
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.selector-header h3 {
  margin: 0 0 0.25rem 0;
  color: #495057;
}

.selector-header p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.standard-type-toggle {
  display: flex;
  margin: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.25rem;
}

.type-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.type-button.active {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.type-button.custom.active {
  color: #667eea;
}

.type-button.ccss.active {
  color: #28a745;
}

.grade-filter {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.grade-filter label {
  font-weight: 600;
  color: #495057;
  min-width: 100px;
}

.grade-select {
  flex: 1;
  max-width: 200px;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.standards-section {
  padding: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: #495057;
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.create-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
}

.create-link:hover {
  background: #5a6fd8;
}

.standards-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.standard-option {
  padding: 1rem;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.standard-option:hover {
  background: #f8f9fa;
}

.standard-option.selected {
  background: #e3f2fd;
  border-left: 4px solid #667eea;
}

.standard-option:last-child {
  border-bottom: none;
}

.standard-info {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  width: 100%;
}

.standard-name {
  font-weight: 600;
  color: #495057;
  min-width: 8rem;
  flex-shrink: 0;
}

.standard-code {
  display: none; /* Hidden - not needed */
}

.standard-description {
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.4;
  flex: 1; /* Takes up remaining space */
}

.standard-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 8rem;
  flex-shrink: 0;
}

.grade-badge,
.category-badge,
.ccss-badge,
.domain-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.grade-badge {
  background: #e9ecef;
  color: #495057;
}

.category-badge {
  background: #d4edda;
  color: #155724;
}

.ccss-badge {
  background: #cce5ff;
  color: #0056b3;
}

.domain-badge {
  background: #fff3cd;
  color: #856404;
}

.selected-standard {
  margin-top: 1rem;
  padding: 1rem;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
}

.selected-standard h4 {
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.selected-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.selected-name {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.25rem;
}

.selected-code {
  font-family: monospace;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.selected-type {
  font-size: 0.9rem;
  color: #6c757d;
}

.clear-selection {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.clear-selection:hover {
  background: #c82333;
}
</style>
