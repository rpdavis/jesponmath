<template>
  <div class="goal-template-management">
    <div class="page-header">
      <h1>📋 Goal Template Management</h1>
      <p>Create and manage goal templates to quickly generate IEP goals</p>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <button @click="showCreateModal = true" class="btn btn-primary">
        <span class="icon">➕</span>
        Create New Template
      </button>
      <div class="filters">
        <select v-model="filterSubject" class="filter-select">
          <option value="">All Subjects</option>
          <option value="math">Math</option>
          <option value="ela">ELA</option>
          <option value="other">Other</option>
        </select>
        <select v-model="filterActive" class="filter-select">
          <option value="">All Templates</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search templates..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading templates...</p>
    </div>

    <!-- Templates List -->
    <div v-else-if="filteredTemplates.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No Templates Found</h3>
      <p>{{ searchQuery || filterSubject ? 'No templates match your filters.' : 'Create your first template to get started.' }}</p>
      <button @click="showCreateModal = true" class="btn btn-primary">Create First Template</button>
    </div>

    <div v-else class="templates-grid">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        :class="{ inactive: !template.isActive }"
      >
        <div class="template-header">
          <div class="template-title-section">
            <h3>{{ template.name }}</h3>
            <div class="template-badges">
              <span class="badge badge-subject" :class="`badge-${template.subject}`">
                {{ template.subject.toUpperCase() }}
              </span>
              <span v-if="template.topic" class="badge badge-topic">
                {{ template.topic }}
              </span>
              <span class="badge" :class="`badge-assessment-${template.assessmentMethod}`">
                {{ template.assessmentMethod === 'app' ? '📱 App' : template.assessmentMethod === 'paper' ? '📄 Paper' : '🔄 Hybrid' }}
              </span>
              <span v-if="!template.isActive" class="badge badge-inactive">
                Inactive
              </span>
            </div>
          </div>
          <div class="template-actions">
            <button @click="editTemplate(template)" class="btn-icon" title="Edit">
              ✏️
            </button>
            <button @click="createFromTemplate(template)" class="btn-icon" title="Save as New Template">
              📄
            </button>
            <button
              @click="toggleTemplateActive(template)"
              class="btn-icon"
              :title="template.isActive ? 'Deactivate' : 'Activate'"
            >
              {{ template.isActive ? '👁️' : '👁️‍🗨️' }}
            </button>
            <button @click="handleDeleteTemplate(template)" class="btn-icon btn-danger" title="Delete">
              🗑️
            </button>
          </div>
        </div>

        <div class="template-content">
          <div class="template-field">
            <strong>Area of Need:</strong>
            <span>{{ template.areaOfNeed }}</span>
          </div>
          <div v-if="template.description" class="template-field description-field">
            <strong>Description:</strong>
            <div class="description-content">{{ template.description }}</div>
          </div>
          <div class="template-field">
            <strong>Goal Title Template:</strong>
            <code class="template-code">{{ template.goalTitleTemplate }}</code>
          </div>
          <div class="template-field">
            <strong>Goal Text Template:</strong>
            <code class="template-code">{{ truncateText(template.goalTextTemplate, 150) }}</code>
          </div>
          <div v-if="template.defaultGradeLevel" class="template-field">
            <strong>Default Grade Level:</strong>
            <span>{{ template.defaultGradeLevel }}</span>
          </div>
          <div v-if="template.defaultStandard" class="template-field">
            <strong>Default Standard:</strong>
            <span>{{ template.defaultStandard }}</span>
          </div>
          <div v-if="template.defaultThreshold" class="template-field">
            <strong>Default Threshold:</strong>
            <span>{{ template.defaultThreshold }}</span>
          </div>
          <div v-if="template.exampleQuestion" class="template-field example-question-preview">
            <strong>⭐ Example Question:</strong>
            <div class="example-question-content">
              <div><strong>Question:</strong> {{ template.exampleQuestion }}</div>
              <div v-if="template.exampleAnswer"><strong>Answer:</strong> {{ template.exampleAnswer }}</div>
              <div v-if="template.exampleAlternativeAnswers"><strong>Alternative Answers:</strong> {{ template.exampleAlternativeAnswers }}</div>
              <div v-if="template.exampleExplanation"><strong>Explanation:</strong> {{ template.exampleExplanation }}</div>
            </div>
          </div>
          <div v-if="template.exampleGoal" class="template-field">
            <strong>Example Goal:</strong>
            <span class="example-text">{{ template.exampleGoal }}</span>
          </div>
        </div>

        <div class="template-footer">
          <div class="template-meta">
            <span v-if="template.usageCount !== undefined">
              Used {{ template.usageCount }} time{{ template.usageCount !== 1 ? 's' : '' }}
            </span>
            <span v-if="template.createdAt">
              Created {{ formatDate(template.createdAt) }}
            </span>
          </div>
          <button @click="previewTemplate(template)" class="btn btn-secondary btn-sm">
            👁️ Preview
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Template' : 'Create New Template' }}</h2>
          <button @click="closeModals" class="btn-close">✕</button>
        </div>

        <form @submit.prevent="saveTemplate" class="template-form">
          <div class="form-group">
            <label>Template Name *</label>
            <input
              v-model="formData.name"
              type="text"
              required
              placeholder="e.g., Two-Step Word Problems - Math"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Subject *</label>
              <select v-model="formData.subject" required>
                <option value="math">Math</option>
                <option value="ela">ELA</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label>Topic (optional)</label>
              <input
                v-model="formData.topic"
                type="text"
                placeholder="e.g., two-step word problem, fraction, reading comprehension"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Area of Need *</label>
            <input
              v-model="formData.areaOfNeed"
              type="text"
              required
              placeholder="e.g., Math Computation, Reading Comprehension"
            />
          </div>

          <div class="form-group">
            <label>Goal Title Template *</label>
            <input
              v-model="formData.goalTitleTemplate"
              type="text"
              required
              placeholder="e.g., {{topic}} - Grade {{gradeLevel}}"
            />
            <small class="form-hint" v-text="'Use {{variableName}} for variables (e.g., {{topic}}, {{gradeLevel}}, {{threshold}})'">
            </small>
          </div>

          <div class="form-group">
            <label>Goal Text Template *</label>
            <textarea
              v-model="formData.goalTextTemplate"
              required
              rows="4"
              placeholder="e.g., Given a {topic}, the student will solve {threshold} correctly {condition}"
            ></textarea>
            <small class="form-hint" v-text="'Use {{variableName}} for variables'">
            </small>
          </div>

          <div class="form-group">
            <label>Baseline Template (optional)</label>
            <textarea
              v-model="formData.baselineTemplate"
              rows="2"
              placeholder="e.g., Student currently solves {topic} with {threshold} accuracy"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Default Grade Level</label>
              <input
                v-model.number="formData.defaultGradeLevel"
                type="number"
                min="1"
                max="12"
                placeholder="7"
              />
            </div>

            <div class="form-group">
              <label>Default Standard</label>
              <input
                v-model="formData.defaultStandard"
                type="text"
                placeholder="e.g., 7.EE.4a"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Default Threshold</label>
              <input
                v-model="formData.defaultThreshold"
                type="text"
                placeholder="e.g., 80% or 4 out of 5"
              />
            </div>

            <div class="form-group">
              <label>Default Condition</label>
              <input
                v-model="formData.defaultCondition"
                type="text"
                placeholder="e.g., in 3 out of 4 trials"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Assessment Method *</label>
            <select v-model="formData.assessmentMethod" required>
              <option value="app">App (Automated/Digital Assessment)</option>
              <option value="paper">Paper (Manual Assessment/Grading)</option>
              <option value="hybrid">Hybrid (Combination of App and Paper)</option>
            </select>
            <small class="form-hint">
              <strong>App:</strong> Can be assessed through automated question generation<br>
              <strong>Paper:</strong> Requires manual assessment, rubrics, or teacher observation<br>
              <strong>Hybrid:</strong> Combines digital questions with paper components
            </small>
          </div>

          <div v-if="formData.assessmentMethod === 'paper' || formData.assessmentMethod === 'hybrid'" class="form-group">
            <label>Rubric (optional)</label>
            <select v-model="formData.rubricId">
              <option value="">No rubric (create one later)</option>
              <option v-for="rubric in availableRubrics" :key="rubric.id" :value="rubric.id">
                {{ rubric.name }} ({{ rubric.totalPoints }} points)
              </option>
            </select>
            <small class="form-hint">
              Select a rubric for scoring paper-based assessments.
              <a href="#" @click.prevent="showRubricModal = true" class="link">Create new rubric</a>
            </small>
          </div>

          <div class="form-group">
            <label>Description (optional)</label>
            <textarea
              v-model="formData.description"
              rows="2"
              placeholder="Template description and usage notes..."
            ></textarea>
          </div>

          <!-- EXAMPLE QUESTION SECTION - MOST IMPORTANT -->
          <div class="example-question-section">
            <h6 class="section-title">⭐ Example Question (Most Important)</h6>
            <p class="section-description">This example question will be used to generate accurate similar questions. This is the most important part of the template!</p>

            <div class="form-group">
              <label>Example Question Text *</label>
              <textarea
                v-model="formData.exampleQuestion"
                required
                rows="4"
                class="form-control example-field"
                placeholder="Enter the example question text..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>Example Correct Answer *</label>
              <input
                v-model="formData.exampleAnswer"
                type="text"
                required
                class="form-control example-field"
                placeholder="Enter the correct answer..."
              />
            </div>

            <div class="form-group">
              <label>Example Alternative Answers (comma-separated)</label>
              <input
                v-model="formData.exampleAlternativeAnswers"
                type="text"
                class="form-control"
                placeholder="e.g., 5, 5 minutes, 5 min"
              />
              <small class="form-text">Other acceptable answer formats</small>
            </div>

            <div class="form-group">
              <label>Example Explanation (Optional)</label>
              <textarea
                v-model="formData.exampleExplanation"
                rows="3"
                class="form-control"
                placeholder="Enter explanation for the example question..."
              ></textarea>
            </div>
          </div>

          <div class="form-group">
            <label>Example Goal (optional)</label>
            <textarea
              v-model="formData.exampleGoal"
              rows="2"
              placeholder="Example of a goal created from this template..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>
              <input
                v-model="formData.isActive"
                type="checkbox"
              />
              Active (available for use)
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : (showEditModal ? 'Update Template' : 'Create Template') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal && previewTemplateData" class="modal-overlay" @click="showPreviewModal = false">
      <div class="modal-content modal-preview" @click.stop>
        <div class="modal-header">
          <h2>Template Preview</h2>
          <button @click="showPreviewModal = false" class="btn-close">✕</button>
        </div>

        <div class="preview-content">
          <div class="preview-section">
            <h3>Template: {{ previewTemplateData.name }}</h3>
            <div class="preview-field">
              <strong>Subject:</strong> {{ previewTemplateData.subject }}
            </div>
            <div v-if="previewTemplateData.topic" class="preview-field">
              <strong>Topic:</strong> {{ previewTemplateData.topic }}
            </div>
            <div v-if="previewTemplateData.exampleQuestion" class="preview-field example-question-preview">
              <strong>⭐ Example Question:</strong>
              <div class="example-question-content">
                <div><strong>Question:</strong> {{ previewTemplateData.exampleQuestion }}</div>
                <div v-if="previewTemplateData.exampleAnswer"><strong>Answer:</strong> {{ previewTemplateData.exampleAnswer }}</div>
                <div v-if="previewTemplateData.exampleAlternativeAnswers"><strong>Alternative Answers:</strong> {{ previewTemplateData.exampleAlternativeAnswers }}</div>
                <div v-if="previewTemplateData.exampleExplanation"><strong>Explanation:</strong> {{ previewTemplateData.exampleExplanation }}</div>
              </div>
            </div>
          </div>

          <div class="preview-section">
            <h3>Generated Goal</h3>
            <div class="preview-field">
              <strong>Area of Need:</strong>
              <span>{{ previewTemplateData.areaOfNeed }}</span>
            </div>
            <div class="preview-field">
              <strong>Goal Title:</strong>
              <span>{{ previewGoal.goalTitle }}</span>
            </div>
            <div class="preview-field">
              <strong>Goal Text:</strong>
              <span>{{ previewGoal.goalText }}</span>
            </div>
            <div v-if="previewGoal.baseline" class="preview-field">
              <strong>Baseline:</strong>
              <span>{{ previewGoal.baseline }}</span>
            </div>
            <div v-if="previewGoal.gradeLevel" class="preview-field">
              <strong>Grade Level:</strong>
              <span>{{ previewGoal.gradeLevel }}</span>
            </div>
            <div v-if="previewGoal.standard" class="preview-field">
              <strong>Standard:</strong>
              <span>{{ previewGoal.standard }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="createFromPreview" class="btn btn-secondary">
            📄 Save as New Template
          </button>
          <button @click="showPreviewModal = false" class="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate as deleteTemplateService,
  activateTemplate,
  deactivateTemplate,
  generateGoalFromTemplate,
} from '@/firebase/templateServices'
import { getActiveRubrics } from '@/firebase/rubricServices'
import type { GoalTemplate, Rubric } from '@/types/iep'

const authStore = useAuthStore()

// State
const loading = ref(false)
const saving = ref(false)
const templates = ref<GoalTemplate[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPreviewModal = ref(false)
const showRubricModal = ref(false)
const editingTemplate = ref<GoalTemplate | null>(null)
const previewTemplateData = ref<GoalTemplate | null>(null)
const availableRubrics = ref<Rubric[]>([])

// Filters
const filterSubject = ref('')
const filterActive = ref('')
const searchQuery = ref('')

// Form data
const formData = ref({
  name: '',
  subject: 'math' as 'math' | 'ela' | 'other',
  topic: '',
  areaOfNeed: '',
  goalTitleTemplate: '',
  goalTextTemplate: '',
  baselineTemplate: '',
  assessmentMethod: 'app' as 'app' | 'paper' | 'hybrid',
  rubricId: '',
  defaultGradeLevel: undefined as number | undefined,
  defaultStandard: '',
  defaultThreshold: '',
  defaultCondition: '',
  description: '',
  exampleGoal: '',
  // Example question fields - MOST IMPORTANT
  exampleQuestion: '',
  exampleAnswer: '',
  exampleAlternativeAnswers: '',
  exampleExplanation: '',
  isActive: true,
})

// Computed
const filteredTemplates = computed(() => {
  let filtered = [...templates.value]

  if (filterSubject.value) {
    filtered = filtered.filter(t => t.subject === filterSubject.value)
  }

  if (filterActive.value !== '') {
    const isActive = filterActive.value === 'true'
    filtered = filtered.filter(t => t.isActive === isActive)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      t =>
        t.name.toLowerCase().includes(query) ||
        t.areaOfNeed.toLowerCase().includes(query) ||
        (t.topic && t.topic.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query))
    )
  }

  return filtered
})

const previewGoal = computed(() => {
  if (!previewTemplateData.value) {
    return {
      goalTitle: '',
      goalText: '',
      areaOfNeed: '',
      baseline: '',
      gradeLevel: undefined,
      standard: '',
    }
  }

  return generateGoalFromTemplate(previewTemplateData.value, {
    topic: previewTemplateData.value.topic || 'word problem',
    threshold: previewTemplateData.value.defaultThreshold || '80%',
    condition: previewTemplateData.value.defaultCondition || 'in 3 out of 4 trials',
    gradeLevel: previewTemplateData.value.defaultGradeLevel || 7,
    standard: previewTemplateData.value.defaultStandard || '',
  })
})

// Methods
const loadTemplates = async () => {
  try {
    loading.value = true
    templates.value = await getAllTemplates()
  } catch (error) {
    console.error('Error loading templates:', error)
    alert('Failed to load templates. Please try again.')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    subject: 'math',
    topic: '',
    areaOfNeed: '',
    goalTitleTemplate: '',
    goalTextTemplate: '',
    baselineTemplate: '',
    assessmentMethod: 'app',
    rubricId: '',
    defaultGradeLevel: undefined,
    defaultStandard: '',
    defaultThreshold: '',
    defaultCondition: '',
    description: '',
    exampleGoal: '',
    exampleQuestion: '',
    exampleAnswer: '',
    exampleAlternativeAnswers: '',
    exampleExplanation: '',
    isActive: true,
  }
  editingTemplate.value = null
}

const loadRubrics = async () => {
  try {
    availableRubrics.value = await getActiveRubrics()
  } catch (error) {
    console.error('Error loading rubrics:', error)
  }
}

const editTemplate = (template: GoalTemplate) => {
  editingTemplate.value = template
  formData.value = {
    name: template.name,
    subject: template.subject,
    topic: template.topic || '',
    areaOfNeed: template.areaOfNeed,
    goalTitleTemplate: template.goalTitleTemplate,
    goalTextTemplate: template.goalTextTemplate,
    assessmentMethod: template.assessmentMethod || 'app',
    rubricId: template.rubricId || '',
    baselineTemplate: template.baselineTemplate || '',
    defaultGradeLevel: template.defaultGradeLevel,
    defaultStandard: template.defaultStandard || '',
    defaultThreshold: template.defaultThreshold || '',
    defaultCondition: template.defaultCondition || '',
    description: template.description || '',
    exampleGoal: template.exampleGoal || '',
    exampleQuestion: template.exampleQuestion || '',
    exampleAnswer: template.exampleAnswer || '',
    exampleAlternativeAnswers: template.exampleAlternativeAnswers || '',
    exampleExplanation: template.exampleExplanation || '',
    isActive: template.isActive,
  }
  showEditModal.value = true
}

const saveTemplate = async () => {
  try {
    saving.value = true

    // Build template data, only including fields that have values (not empty strings for optional fields)
    const templateData: any = {
      name: formData.value.name,
      subject: formData.value.subject,
      areaOfNeed: formData.value.areaOfNeed,
      goalTitleTemplate: formData.value.goalTitleTemplate,
      goalTextTemplate: formData.value.goalTextTemplate,
      assessmentMethod: formData.value.assessmentMethod,
      isActive: formData.value.isActive,
      createdBy: authStore.currentUser?.uid || '',
    }

    // Add optional fields only if they have values
    if (formData.value.topic) templateData.topic = formData.value.topic
    if (formData.value.baselineTemplate) templateData.baselineTemplate = formData.value.baselineTemplate
    if (formData.value.rubricId) templateData.rubricId = formData.value.rubricId
    if (formData.value.defaultGradeLevel !== undefined) templateData.defaultGradeLevel = formData.value.defaultGradeLevel
    if (formData.value.defaultStandard) templateData.defaultStandard = formData.value.defaultStandard
    if (formData.value.defaultThreshold) templateData.defaultThreshold = formData.value.defaultThreshold
    if (formData.value.defaultCondition) templateData.defaultCondition = formData.value.defaultCondition
    if (formData.value.description) templateData.description = formData.value.description
    if (formData.value.exampleGoal) templateData.exampleGoal = formData.value.exampleGoal
    if (formData.value.exampleQuestion) templateData.exampleQuestion = formData.value.exampleQuestion
    if (formData.value.exampleAnswer) templateData.exampleAnswer = formData.value.exampleAnswer
    if (formData.value.exampleAlternativeAnswers) templateData.exampleAlternativeAnswers = formData.value.exampleAlternativeAnswers
    if (formData.value.exampleExplanation) templateData.exampleExplanation = formData.value.exampleExplanation

    if (showEditModal.value && editingTemplate.value) {
      await updateTemplate(editingTemplate.value.id, templateData)
    } else {
      await createTemplate(templateData)
    }

    await loadTemplates()
    closeModals()
  } catch (error) {
    console.error('Error saving template:', error)
    alert('Failed to save template. Please try again.')
  } finally {
    saving.value = false
  }
}

const handleDeleteTemplate = async (template: GoalTemplate) => {
  if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
    return
  }

  try {
    await deleteTemplateService(template.id)
    await loadTemplates()
  } catch (error) {
    console.error('Error deleting template:', error)
    alert('Failed to delete template. Please try again.')
  }
}

const toggleTemplateActive = async (template: GoalTemplate) => {
  try {
    if (template.isActive) {
      await deactivateTemplate(template.id)
    } else {
      await activateTemplate(template.id)
    }
    await loadTemplates()
  } catch (error) {
    console.error('Error toggling template:', error)
    alert('Failed to update template. Please try again.')
  }
}

const previewTemplate = (template: GoalTemplate) => {
  previewTemplateData.value = template
  showPreviewModal.value = true
}

const createFromPreview = () => {
  if (!previewTemplateData.value) return
  const t = previewTemplateData.value
  createFromTemplate(t)
  showPreviewModal.value = false
}

const createFromTemplate = (t: GoalTemplate) => {
  formData.value = {
    name: `Copy of ${t.name}`,
    subject: t.subject,
    topic: t.topic || '',
    areaOfNeed: t.areaOfNeed,
    goalTitleTemplate: t.goalTitleTemplate,
    goalTextTemplate: t.goalTextTemplate,
    baselineTemplate: t.baselineTemplate || '',
    assessmentMethod: t.assessmentMethod,
    rubricId: t.rubricId || '',
    defaultGradeLevel: t.defaultGradeLevel,
    defaultStandard: t.defaultStandard || '',
    defaultThreshold: t.defaultThreshold || '',
    defaultCondition: t.defaultCondition || '',
    description: t.description || '',
    exampleGoal: t.exampleGoal || '',
    exampleQuestion: t.exampleQuestion || '',
    exampleAnswer: t.exampleAnswer || '',
    exampleAlternativeAnswers: t.exampleAlternativeAnswers || '',
    exampleExplanation: t.exampleExplanation || '',
    isActive: true,
  }
  showCreateModal.value = true
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  showPreviewModal.value = false
  resetForm()
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

// Lifecycle
// Watch for modal opening to reload rubrics
watch([showCreateModal, showEditModal], ([createOpen, editOpen]) => {
  if (createOpen || editOpen) {
    loadRubrics()
  }
})

onMounted(() => {
  loadTemplates()
  loadRubrics()
})
</script>

<style scoped>
.goal-template-management {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1rem;
}

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select,
.search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.search-input {
  min-width: 200px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.template-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.template-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.template-card.inactive {
  opacity: 0.7;
  background: #f9f9f9;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.template-title-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.template-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-subject {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-math {
  background: #fff3e0;
  color: #f57c00;
}

.badge-ela {
  background: #e8f5e9;
  color: #388e3c;
}

.badge-other {
  background: #f3e5f5;
  color: #7b1fa2;
}

.badge-topic {
  background: #f5f5f5;
  color: #666;
}

.badge-inactive {
  background: #ffebee;
  color: #c62828;
}

.badge-assessment-app {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-assessment-paper {
  background: #fff3e0;
  color: #e65100;
}

.badge-assessment-hybrid {
  background: #f3e5f5;
  color: #6a1b9a;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-icon.btn-danger:hover {
  opacity: 1;
  color: #c62828;
}

.template-content {
  margin-bottom: 1rem;
}

.template-field {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.template-field strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #555;
}

.template-code {
  display: block;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  word-break: break-word;
}

.example-text {
  font-style: italic;
  color: #666;
}

.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.template-meta {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  gap: 1rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

/* Modal Styles */
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
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-preview {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #000;
}

.template-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

.form-hint .link {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}

.form-hint .link:hover {
  color: #0056b3;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

/* Example Question Section Styles */
.example-question-section {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  color: #856404;
  font-size: 1rem;
}

.section-description {
  margin: 0 0 1rem 0;
  color: #856404;
  font-size: 0.875rem;
  font-style: italic;
}

.example-field {
  border: 2px solid #ffc107;
  background: #fff;
}

.example-field:focus {
  border-color: #ff9800;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.25);
}

.example-question-preview {
  background: #fff3cd !important;
  border: 2px solid #ffc107 !important;
}

.example-question-content {
  margin-top: 0.5rem;
}

.example-question-content > div {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
}

.description-field {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.description-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #495057;
  line-height: 1.5;
}

/* Preview Styles */
.preview-content {
  padding: 1.5rem;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h3 {
  margin-bottom: 1rem;
  color: #333;
}

.preview-field {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.preview-field strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #555;
}

/* Button Styles */
.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon {
  font-size: 1rem;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>









