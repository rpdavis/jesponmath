<template>
  <div class="standards-manager">
    <div class="manager-header">
      <h1>📏 Standards Manager</h1>
      <p>Create and manage custom standards for assessments</p>
      <button @click="showCreateModal = true" class="create-button">
        ➕ Create Custom Standard
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Grade Level:</label>
        <select v-model="selectedGrade" @change="loadStandards" class="filter-select">
          <option value="">All Grades</option>
          <option v-for="grade in GRADE_LEVELS" :key="grade.value" :value="grade.value">
            {{ grade.label }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Category:</label>
        <select v-model="selectedCategory" @change="loadStandards" class="filter-select">
          <option value="">All Categories</option>
          <option v-for="category in STANDARD_CATEGORIES" :key="category.value" :value="category.value">
            {{ category.label }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Search:</label>
        <input 
          v-model="searchTerm" 
          @input="loadStandards"
          type="text" 
          placeholder="Search by name, code, or description..."
          class="search-input"
        >
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading standards...</p>
    </div>

    <!-- Standards List -->
    <div v-else class="standards-list">
      <div v-if="customStandards.length === 0" class="no-standards">
        <div class="no-standards-icon">📏</div>
        <h3>No Custom Standards Found</h3>
        <p>Create your first custom standard to get started.</p>
        <button @click="showCreateModal = true" class="create-button">
          ➕ Create Custom Standard
        </button>
      </div>
      
      <div v-else class="standards-grid">
        <div v-for="standard in customStandards" :key="standard.id" class="standard-card">
          <div class="standard-header">
            <div class="standard-title">
              <h3>{{ standard.name }}</h3>
              <span class="standard-code">{{ standard.code }}</span>
            </div>
            <div class="standard-actions">
              <button @click="editStandard(standard)" class="edit-button">✏️</button>
              <button @click="deleteStandard(standard)" class="delete-button">🗑️</button>
            </div>
          </div>
          
          <div class="standard-details">
            <div class="detail-row">
              <span class="label">Grade:</span>
              <span class="value">{{ getGradeLabel(standard.grade) }}</span>
            </div>
            
            <div class="detail-row" v-if="standard.category">
              <span class="label">Category:</span>
              <span class="value">{{ standard.category }}</span>
            </div>
            
            <div class="detail-row" v-if="standard.ccssAlignment">
              <span class="label">CCSS Alignment:</span>
              <span class="value ccss-code">{{ standard.ccssAlignment }}</span>
            </div>
            
            <div class="detail-row" v-if="standard.description">
              <span class="label">Description:</span>
              <span class="value description">{{ standard.description }}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Usage:</span>
              <span class="value">{{ standard.usageCount || 0 }} assessments</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingStandard" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingStandard ? '✏️ Edit Standard' : '➕ Create Custom Standard' }}</h2>
          <button @click="closeModal" class="close-button">✕</button>
        </div>
        
        <form @submit.prevent="saveStandard" class="standard-form">
          <!-- Basic Information -->
          <div class="form-section">
            <h3>📋 Basic Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="standardName">Standard Name *</label>
                <input 
                  id="standardName"
                  v-model="standardForm.name" 
                  type="text" 
                  required 
                  class="form-input"
                  placeholder="e.g., Fraction Operations Mastery"
                >
              </div>
              
              <div class="form-group">
                <label for="standardCode">Standard Code *</label>
                <input 
                  id="standardCode"
                  v-model="standardForm.code" 
                  type="text" 
                  required 
                  class="form-input"
                  placeholder="e.g., FOM-7.1"
                >
                <small class="form-help">
                  Unique identifier for this standard
                  <button type="button" @click="generateCode" class="generate-button">🎲 Generate</button>
                </small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="standardGrade">Grade Level *</label>
                <select 
                  id="standardGrade"
                  v-model="standardForm.grade" 
                  required 
                  class="form-select"
                  @change="loadCCSSForGrade"
                >
                  <option value="">Select Grade</option>
                  <option v-for="grade in GRADE_LEVELS" :key="grade.value" :value="grade.value">
                    {{ grade.label }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="standardCategory">Category</label>
                <select 
                  id="standardCategory"
                  v-model="standardForm.category" 
                  class="form-select"
                >
                  <option value="">Select Category</option>
                  <option v-for="category in STANDARD_CATEGORIES" :key="category.value" :value="category.value">
                    {{ category.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- CCSS Alignment -->
          <div class="form-section">
            <h3>🎯 Common Core Alignment (Optional)</h3>
            
            <div class="form-group">
              <label for="ccssAlignment">CCSS Standard</label>
              <div class="ccss-search">
                <input 
                  v-model="ccssSearchTerm"
                  type="text" 
                  placeholder="Search CCSS standards..."
                  class="form-input"
                  @input="searchCCSSStandards"
                >
                <div v-if="ccssSearchResults.length > 0" class="ccss-results">
                  <div 
                    v-for="ccss in ccssSearchResults" 
                    :key="ccss.code"
                    @click="selectCCSS(ccss)"
                    class="ccss-option"
                    :class="{ selected: standardForm.ccssAlignment === ccss.code }"
                  >
                    <div class="ccss-code">{{ ccss.code }}</div>
                    <div class="ccss-title">{{ ccss.title }}</div>
                    <div class="ccss-description">{{ ccss.description }}</div>
                  </div>
                </div>
              </div>
              
              <div v-if="standardForm.ccssAlignment" class="selected-ccss">
                <strong>Selected CCSS:</strong> {{ standardForm.ccssAlignment }}
                <button type="button" @click="clearCCSS" class="clear-button">✕</button>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="form-section">
            <h3>📝 Description (Optional)</h3>
            
            <div class="form-group">
              <label for="standardDescription">Description</label>
              <textarea 
                id="standardDescription"
                v-model="standardForm.description" 
                class="form-textarea"
                rows="3"
                placeholder="Detailed description of what this standard covers..."
              ></textarea>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-button">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="save-button">
              {{ saving ? 'Saving...' : (editingStandard ? 'Update Standard' : 'Create Standard') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import {
  getAllCustomStandards,
  createCustomStandard,
  updateCustomStandard,
  deleteCustomStandard,
  searchCustomStandards,
  validateCustomStandard,
  generateStandardCode,
  isStandardCodeAvailable
} from '@/firebase/standardsServices';
import { searchCCSS, getCCSSByGrade } from '@/data/ccssStandards';
import { GRADE_LEVELS, STANDARD_CATEGORIES } from '@/types/standards';
import type { CustomStandard, CCSSStandard } from '@/types/standards';

const authStore = useAuthStore();

// State
const loading = ref(true);
const saving = ref(false);
const customStandards = ref<CustomStandard[]>([]);
const showCreateModal = ref(false);
const editingStandard = ref<CustomStandard | null>(null);
const successMessage = ref('');
const errorMessage = ref('');

// Filters
const selectedGrade = ref('');
const selectedCategory = ref('');
const searchTerm = ref('');

// CCSS Search
const ccssSearchTerm = ref('');
const ccssSearchResults = ref<CCSSStandard[]>([]);

// Form
const standardForm = ref({
  name: '',
  code: '',
  grade: '',
  category: '',
  description: '',
  ccssAlignment: '',
  createdBy: authStore.currentUser?.uid || '',
  isActive: true
});

// Methods
const loadStandards = async () => {
  try {
    loading.value = true;
    
    if (searchTerm.value || selectedGrade.value || selectedCategory.value) {
      customStandards.value = await searchCustomStandards(searchTerm.value);
      
      // Client-side filtering for grade and category
      if (selectedGrade.value) {
        customStandards.value = customStandards.value.filter(s => s.grade === selectedGrade.value);
      }
      if (selectedCategory.value) {
        customStandards.value = customStandards.value.filter(s => s.category === selectedCategory.value);
      }
    } else {
      customStandards.value = await getAllCustomStandards();
    }
    
  } catch (error: any) {
    console.error('Error loading standards:', error);
    errorMessage.value = error.message || 'Failed to load standards';
    setTimeout(() => { errorMessage.value = ''; }, 5000);
  } finally {
    loading.value = false;
  }
};

const editStandard = (standard: CustomStandard) => {
  editingStandard.value = standard;
  standardForm.value = {
    name: standard.name,
    code: standard.code,
    grade: standard.grade,
    category: standard.category || '',
    description: standard.description || '',
    ccssAlignment: standard.ccssAlignment || '',
    createdBy: standard.createdBy,
    isActive: standard.isActive
  };
  
  // Load CCSS for this grade
  if (standard.grade) {
    loadCCSSForGrade();
  }
};

const deleteStandard = async (standard: CustomStandard) => {
  if (!confirm(`Are you sure you want to delete "${standard.name}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await deleteCustomStandard(standard.id);
    successMessage.value = 'Standard deleted successfully!';
    setTimeout(() => { successMessage.value = ''; }, 3000);
    await loadStandards();
  } catch (error: any) {
    console.error('Error deleting standard:', error);
    errorMessage.value = error.message || 'Failed to delete standard';
    setTimeout(() => { errorMessage.value = ''; }, 5000);
  }
};

const saveStandard = async () => {
  try {
    saving.value = true;
    
    // Validate form
    const errors = validateCustomStandard(standardForm.value);
    if (errors.length > 0) {
      errorMessage.value = errors.join(', ');
      setTimeout(() => { errorMessage.value = ''; }, 5000);
      return;
    }
    
    // Check code availability
    if (!editingStandard.value) {
      const isAvailable = await isStandardCodeAvailable(standardForm.value.code);
      if (!isAvailable) {
        errorMessage.value = `Standard code "${standardForm.value.code}" already exists`;
        setTimeout(() => { errorMessage.value = ''; }, 5000);
        return;
      }
    } else {
      const isAvailable = await isStandardCodeAvailable(standardForm.value.code, editingStandard.value.id);
      if (!isAvailable) {
        errorMessage.value = `Standard code "${standardForm.value.code}" already exists`;
        setTimeout(() => { errorMessage.value = ''; }, 5000);
        return;
      }
    }
    
    if (editingStandard.value) {
      // Update existing standard
      await updateCustomStandard(editingStandard.value.id, {
        name: standardForm.value.name,
        code: standardForm.value.code,
        grade: standardForm.value.grade,
        category: (standardForm.value.category as any) || undefined,
        description: standardForm.value.description || undefined,
        ccssAlignment: standardForm.value.ccssAlignment || undefined,
        isActive: standardForm.value.isActive
      });
      
      successMessage.value = 'Standard updated successfully!';
    } else {
      // Create new standard
      await createCustomStandard({
        name: standardForm.value.name,
        code: standardForm.value.code,
        grade: standardForm.value.grade,
        category: (standardForm.value.category as any) || undefined,
        description: standardForm.value.description || undefined,
        ccssAlignment: standardForm.value.ccssAlignment || undefined,
        createdBy: authStore.currentUser?.uid || 'system',
        isActive: true
      });
      
      successMessage.value = 'Standard created successfully!';
    }
    
    setTimeout(() => { successMessage.value = ''; }, 3000);
    closeModal();
    await loadStandards();
    
  } catch (error: any) {
    console.error('Error saving standard:', error);
    errorMessage.value = error.message || 'Failed to save standard';
    setTimeout(() => { errorMessage.value = ''; }, 5000);
  } finally {
    saving.value = false;
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingStandard.value = null;
  standardForm.value = {
    name: '',
    code: '',
    grade: '',
    category: '',
    description: '',
    ccssAlignment: '',
    createdBy: authStore.currentUser?.uid || '',
    isActive: true
  };
  ccssSearchTerm.value = '';
  ccssSearchResults.value = [];
};

const generateCode = () => {
  if (standardForm.value.name && standardForm.value.grade) {
    // Simple code generation
    const namePrefix = standardForm.value.name.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
    const gradePrefix = standardForm.value.grade;
    const timestamp = Date.now().toString().slice(-4);
    standardForm.value.code = `${gradePrefix}${namePrefix}-${timestamp}`;
  }
};

const loadCCSSForGrade = () => {
  if (standardForm.value.grade) {
    ccssSearchResults.value = getCCSSByGrade(standardForm.value.grade);
  } else {
    ccssSearchResults.value = [];
  }
};

const searchCCSSStandards = () => {
  if (ccssSearchTerm.value || standardForm.value.grade) {
    ccssSearchResults.value = searchCCSS(ccssSearchTerm.value, standardForm.value.grade);
  } else {
    ccssSearchResults.value = [];
  }
};

const selectCCSS = (ccss: CCSSStandard) => {
  standardForm.value.ccssAlignment = ccss.code;
  ccssSearchTerm.value = '';
  ccssSearchResults.value = [];
};

const clearCCSS = () => {
  standardForm.value.ccssAlignment = '';
};

const getGradeLabel = (grade: string): string => {
  const gradeObj = GRADE_LEVELS.find(g => g.value === grade);
  return gradeObj?.label || grade;
};

// Lifecycle
onMounted(async () => {
  await loadStandards();
});
</script>

<style scoped>
.standards-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.manager-header h1 {
  margin: 0;
  font-size: 2rem;
}

.manager-header p {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
}

.create-button {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #495057;
}

.filter-select,
.search-input {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
}

.filter-select:focus,
.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.standards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.standard-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.standard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.standard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.standard-title h3 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1.1rem;
}

.standard-code {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.standard-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button,
.delete-button {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s ease;
}

.edit-button {
  background: #e3f2fd;
  color: #1976d2;
}

.edit-button:hover {
  background: #bbdefb;
}

.delete-button {
  background: #ffebee;
  color: #d32f2f;
}

.delete-button:hover {
  background: #ffcdd2;
}

.standard-details {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 600;
  color: #6c757d;
  min-width: 80px;
}

.value {
  color: #495057;
  text-align: right;
  flex: 1;
}

.ccss-code {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
}

.description {
  font-style: italic;
  max-width: 250px;
  word-wrap: break-word;
}

.no-standards {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.no-standards-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  color: #495057;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
}

.close-button:hover {
  color: #495057;
}

.standard-form {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #495057;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
}

.form-help {
  font-size: 0.8rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.generate-button {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.generate-button:hover {
  background: #bbdefb;
}

.ccss-search {
  position: relative;
}

.ccss-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.ccss-option {
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background 0.2s ease;
}

.ccss-option:hover {
  background: #f8f9fa;
}

.ccss-option.selected {
  background: #e3f2fd;
  border-color: #1976d2;
}

.ccss-option:last-child {
  border-bottom: none;
}

.ccss-code {
  font-weight: 600;
  color: #1976d2;
  font-size: 0.9rem;
}

.ccss-title {
  font-weight: 500;
  margin: 0.25rem 0;
}

.ccss-description {
  font-size: 0.8rem;
  color: #6c757d;
}

.selected-ccss {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #e8f5e8;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-button {
  background: #ffcdd2;
  color: #d32f2f;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.clear-button:hover {
  background: #ef9a9a;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.cancel-button,
.save-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #ced4da;
}

.cancel-button:hover {
  background: #e9ecef;
}

.save-button {
  background: #667eea;
  color: white;
  border: 1px solid #667eea;
}

.save-button:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #d4edda;
  color: #155724;
  padding: 1rem 1.5rem;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  z-index: 2000;
}

.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #f8d7da;
  color: #721c24;
  padding: 1rem 1.5rem;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  z-index: 2000;
}
</style>
