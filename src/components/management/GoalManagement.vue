<template>
  <div class="goal-management">
    <div class="header-section">
      <h1>🎯 Goal Management</h1>
      <p class="subtitle">Manage IEP goals and connect assessments for progress tracking</p>

      <div class="action-buttons">
        <button @click="showCreateGoalModal = true" class="btn btn-primary">
          <span class="icon">➕</span>
          Create New Goal
        </button>
        <button @click="handleCreateAssessment" class="btn btn-secondary">
          <span class="icon">📝</span>
          Create Progress Assessment
        </button>
        <button @click="showImportModal = true" class="btn btn-secondary">
          <span class="icon">📄</span>
          Import JSON Assessment
        </button>
      </div>
    </div>

    <!-- Filters -->
    <GoalFilters
      :students="students"
      :selected-student-uid="selectedStudentUid"
      :selected-status="selectedStatus"
      :selected-subject="selectedSubject"
      :search-query="searchQuery"
      @update:selectedStudentUid="selectedStudentUid = $event"
      @update:selectedStatus="selectedStatus = $event"
      @update:selectedSubject="selectedSubject = $event"
      @update:searchQuery="searchQuery = $event"
    />

    <!-- Goals List -->
    <div class="goals-section">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading goals...</p>
      </div>

      <div v-else-if="filteredGoals.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>No Goals Found</h3>
        <p>
          {{ selectedStudentUid ? 'This student has no goals yet.' : 'No goals match your current filters.' }}
        </p>
        <button @click="showCreateGoalModal = true" class="btn btn-primary">Create First Goal</button>
      </div>

      <div v-else class="goals-grid">
        <GoalCard
          v-for="goal in filteredGoals"
          :key="goal.id"
          :goal="goal"
          :students="students"
          :assessments="assessments"
          :available-assessments="availableAssessments"
          :selected-assessment-id="selectedAssessmentForGoal[goal.id] || ''"
          :difficulty-level="difficultyLevel"
          :get-student-name="getStudentName"
          :get-assessment-title="getAssessmentTitle"
          :is-assessment-assigned-to-student="isAssessmentAssignedToStudent"
          @edit="handleEditGoal"
          @mark-met="handleMarkGoalAsMet"
          @archive="handleArchiveGoal"
          @reactivate="handleReactivateGoal"
          @delete="handleDeleteGoal"
          @assign-assessment="handleAssignAssessmentToGoal"
          @remove-assessment="handleRemoveAssessmentFromGoal"
          @create-assessment="handleCreateAssessmentForGoal"
          @generate-assessments="handleGenerateAssessments"
          @assign-to-student="handleAssignToStudent"
          @assign-all="handleAssignAll"
          @view-edit="handleViewEditAssessment"
          @update-difficulty="difficultyLevel = $event as 'easy' | 'medium' | 'hard'"
          @generate-template="handleGenerateTemplate"
          @assign-template="handleAssignTemplate"
          @remove-template="handleRemoveTemplate"
        />
      </div>
    </div>

    <!-- Modals -->
    <GoalFormModal
      :show="showCreateGoalModal || showEditGoalModal"
      :is-editing="showEditGoalModal"
      :goal="editingGoal"
      :students="students"
      :get-student-name="getStudentName"
      :saving="saving"
      @close="closeModals"
      @save="handleSaveGoal"
    />

    <CreateAssessmentModal
      :show="showCreateAssessmentModal"
      :active-goals="activeGoals"
      :students="students"
      :get-student-name="getStudentName"
      :saving="saving"
      :initial-data="createAssessmentInitialData || undefined"
      @close="closeModals"
      @create="handleCreateProgressAssessment"
    />

    <SingleQuestionPreviewModal
      :show="showSingleQuestionPreview"
      :question="singlePreviewQuestion"
      :is-generating="isGenerating"
      :goal="currentGoalForGeneration"
      @close="showSingleQuestionPreview = false"
      @approve="handleApproval"
      @save-template="(templateData: any) => handleSaveAsTemplate(templateData)"
    />

    <ConfirmationPreviewModal
      :show="showConfirmationPreview"
      :assessments="generatedAssessmentsForPreview"
      :saving="isGeneratingRemaining"
      @close="cancelConfirmationPreview"
      @confirm="confirmAndCreateAssessments"
    />

    <TemplatePreviewModal
      :show="showTemplatePreviewBeforeGeneration"
      :goal="goalForTemplatePreview"
      :template-ids="goalForTemplatePreview?.preferredTemplateIds || []"
      @close="showTemplatePreviewBeforeGeneration = false"
      @proceed="confirmGenerateWithTemplates"
    />

    <!-- Assessment Import Modal -->
    <AssessmentImporter
      :show="showImportModal"
      :goal-id="selectedGoalForImport?.id"
      @close="closeImportModal"
      @created="handleImportedAssessment"
    />

    <AssessmentPreviewModal
      :show="showAssessmentPreview"
      :assessments="previewAssessments"
      :goal="previewGoal"
      :saving="saving"
      @close="cancelPreview"
      @approve="handleApproval"
      @update-alternatives="(assessmentIndex: number, qIndex: number) => updateAlternativeAnswers(previewAssessments[assessmentIndex], qIndex)"
      @regenerate="regenerateRemainingQuestions"
      @save-template="handleSaveAsTemplate"
    />

    <!-- Template Assignment Modal -->
    <div v-if="showTemplateAssignmentModal" class="modal-backdrop" @click.self="showTemplateAssignmentModal = false">
      <div class="modal" @click.stop>
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h3>🎯 Assign Template to Goal</h3>
              <button @click="showTemplateAssignmentModal = false" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <p class="modal-help-text">
                Select a question template to use for this goal. When generating assessments,
                the system will use this template first instead of fuzzy matching.
              </p>

              <div v-if="loadingTemplates" class="loading-templates">
                <div class="spinner"></div>
                <p>Loading templates...</p>
              </div>

              <div v-else-if="availableTemplates.length === 0" class="no-templates-available">
                <p>⚠️ No active templates available. Create templates in the Template Management page.</p>
              </div>

              <div v-else>
                <!-- Search Input -->
                <div class="template-search-box">
                  <input
                    v-model="templateSearchQuery"
                    type="text"
                    placeholder="🔍 Search templates by name, subject, topic, or area..."
                    class="template-search-input"
                  />
                  <button
                    v-if="templateSearchQuery"
                    @click="templateSearchQuery = ''"
                    class="clear-search-btn"
                    title="Clear search"
                  >
                    ✕
                  </button>
                </div>

                <!-- Results Count -->
                <div v-if="templateSearchQuery" class="search-results-info">
                  {{ filteredTemplates.length }} of {{ availableTemplates.length }} templates
                </div>

                <!-- Templates List -->
                <div class="templates-list">
                  <div v-if="filteredTemplates.length === 0" class="no-search-results">
                    <p>No templates match "{{ templateSearchQuery }}"</p>
                  </div>
                  <div
                    v-for="template in filteredTemplates"
                    :key="template.id"
                    class="template-option"
                    :class="{ selected: selectedTemplateIds.includes(template.id) }"
                    @click="toggleTemplateSelection(template.id)"
                  >
                    <div class="template-checkbox">
                      <input
                        type="checkbox"
                        :checked="selectedTemplateIds.includes(template.id)"
                        @click.stop="toggleTemplateSelection(template.id)"
                      />
                    </div>
                    <div class="template-info">
                      <div class="template-name">{{ template.name }}</div>
                      <div class="template-details">
                        <span class="template-meta">{{ template.subject }}</span>
                        <span v-if="template.topic" class="template-meta">{{ template.topic }}</span>
                        <span class="template-meta">{{ template.areaOfNeed }}</span>
                      </div>
                      <div v-if="template.exampleQuestion" class="template-example">
                        {{ template.exampleQuestion.substring(0, 100) }}{{ template.exampleQuestion.length > 100 ? '...' : '' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="showTemplateAssignmentModal = false" class="btn btn-secondary">Cancel</button>
              <button
                @click="confirmTemplateAssignment"
                class="btn btn-primary"
                :disabled="selectedTemplateIds.length === 0"
              >
                Assign {{ selectedTemplateIds.length }} Template(s)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading || isGeneratingRemaining" class="loading-overlay">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-light">
        {{ isGeneratingRemaining ? 'Generating assessments...' : 'Loading...' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGoalManagement } from '@/composables/useGoalManagement'
import { useGoalFilters } from '@/composables/useGoalFilters'
import { useAssessmentGeneration } from '@/composables/useAssessmentGeneration'
import GoalCard from './GoalCard.vue'
import GoalFilters from './GoalFilters.vue'
import GoalFormModal from './modals/GoalFormModal.vue'
import CreateAssessmentModal from './modals/CreateAssessmentModal.vue'
import AssessmentPreviewModal from './modals/AssessmentPreviewModal.vue'
import SingleQuestionPreviewModal from './modals/SingleQuestionPreviewModal.vue'
import ConfirmationPreviewModal from './modals/ConfirmationPreviewModal.vue'
import TemplatePreviewModal from './modals/TemplatePreviewModal.vue'
import AssessmentImporter from './modals/AssessmentImporter.vue'
import type { Goal, GoalTemplate } from '@/types/iep'

// Router and Auth
const router = useRouter()
const authStore = useAuthStore()

// Use composables
const goalManagement = useGoalManagement()
const {
  loading,
  saving,
  goals,
  students,
  assessments,
  studentAssignments,
  loadData,
  saveGoal: saveGoalService,
  deleteGoal: deleteGoalService,
  markGoalAsMet: markGoalAsMetService,
  archiveGoal: archiveGoalService,
  reactivateGoal: reactivateGoalService,
  assignAssessmentToGoal: assignAssessmentToGoalService,
  removeAssessmentFromGoal: removeAssessmentFromGoalService,
  createProgressAssessment: createProgressAssessmentService,
  getStudentName,
  getAssessmentTitle,
  isAssessmentAssignedToStudent,
  assignAssessmentToStudent: assignAssessmentToStudentService,
  assignAllAssessmentsToAllStudents: assignAllAssessmentsToAllStudentsService,
  createAssessmentForGoal: createAssessmentForGoalService,
} = goalManagement

const filters = useGoalFilters(goals)
const {
  selectedStudentUid,
  selectedStatus,
  selectedSubject,
  searchQuery,
  filteredGoals,
  activeGoals,
  getSubjectArea,
} = filters

const assessmentGeneration = useAssessmentGeneration(getSubjectArea, loadData)
const {
  showAssessmentPreview,
  previewAssessments,
  showSingleQuestionPreview,
  singlePreviewQuestion,
  isGeneratingRemaining,
  isGenerating,
  currentGoalForGeneration,
  previewGoal,
  generationMethod,
  geminiApiKey,
  difficultyLevel,
  showConfirmationPreview,
  generatedAssessmentsForPreview,
  generateAssessmentsForGoal: generateAssessmentsForGoalService,
  proceedWithGeneration,
  generateProofreadQuestion,
  handleApproval: handleApprovalService,
  updateAlternativeAnswers,
  regenerateRemainingQuestions,
  confirmCreateAssessments,
  confirmAndCreateAssessments: confirmAndCreateAssessmentsService,
  cancelPreview,
  cancelConfirmationPreview,
} = assessmentGeneration

// Modal state
const showCreateGoalModal = ref(false)
const showEditGoalModal = ref(false)
const showCreateAssessmentModal = ref(false)
const showTemplateAssignmentModal = ref(false)
const showTemplatePreviewBeforeGeneration = ref(false)
const templatePreviewsForGeneration = ref<GoalTemplate[]>([])
const goalForTemplatePreview = ref<Goal | null>(null)
const editingGoal = ref<Goal | null>(null)
const selectedAssessmentForGoal = ref<Record<string, string>>({})

// Import modal state
const showImportModal = ref(false)
const selectedGoalForImport = ref<Goal | null>(null)

const createAssessmentInitialData = ref<{
  goalId?: string
  title?: string
  gradeLevel?: number
} | null>(null)

// Template assignment state
const currentGoalForTemplateAssignment = ref<string | null>(null)
const availableTemplates = ref<any[]>([])
const selectedTemplateIds = ref<string[]>([])
const loadingTemplates = ref(false)
const templateSearchQuery = ref('')

// Computed
const availableAssessments = computed(() =>
  assessments.value.filter((assessment) => assessment.category === 'PA'),
)

// Filtered templates based on search query
const filteredTemplates = computed(() => {
  if (!templateSearchQuery.value.trim()) {
    return availableTemplates.value
  }

  const query = templateSearchQuery.value.toLowerCase().trim()
  return availableTemplates.value.filter((template) => {
    const searchableText = [
      template.name || '',
      template.subject || '',
      template.topic || '',
      template.areaOfNeed || '',
      template.description || '',
      template.exampleQuestion || '',
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(query)
  })
})

// Event Handlers
const handleEditGoal = (goal: Goal) => {
  editingGoal.value = goal
  showEditGoalModal.value = true
}

const handleSaveGoal = async (goalData: Partial<Goal>) => {
  try {
    await saveGoalService(goalData, editingGoal.value?.id)
    closeModals()
  } catch (error) {
    console.error('Error saving goal:', error)
  }
}

const handleDeleteGoal = async (goalId: string) => {
  await deleteGoalService(goalId)
}

const handleMarkGoalAsMet = async (goalId: string) => {
  await markGoalAsMetService(goalId)
}

const handleArchiveGoal = async (goalId: string) => {
  await archiveGoalService(goalId)
}

const handleReactivateGoal = async (goalId: string) => {
  await reactivateGoalService(goalId)
}

const handleAssignAssessmentToGoal = async (goalId: string, assessmentId: string) => {
  if (!assessmentId) return
  await assignAssessmentToGoalService(goalId, assessmentId)
  selectedAssessmentForGoal.value[goalId] = ''
}

const handleRemoveAssessmentFromGoal = async (goalId: string, assessmentId: string) => {
  await removeAssessmentFromGoalService(goalId, assessmentId)
}

const handleCreateAssessment = () => {
  createAssessmentInitialData.value = null
  showCreateAssessmentModal.value = true
}

const handleCreateAssessmentForGoal = (goalId: string) => {
  const initialData = createAssessmentForGoalService(goalId)
  if (initialData) {
    createAssessmentInitialData.value = initialData
    showCreateAssessmentModal.value = true
  }
}

const handleCreateProgressAssessment = async (data: {
  title: string
  description?: string
  gradeLevel?: number
  goalId?: string
}) => {
  try {
    await createProgressAssessmentService(data)
    closeModals()
  } catch (error) {
    console.error('Error creating assessment:', error)
  }
}

const handleGenerateAssessments = async (goalId: string) => {
  // First, show template preview if templates are assigned
  const goal = goals.value.find(g => g.id === goalId)
  if (!goal) return

  if (goal.preferredTemplateIds && goal.preferredTemplateIds.length > 0) {
    // Load templates to show preview
    try {
      const { getTemplate } = await import('@/firebase/templateServices')
      const templatePreviews = []

      for (const templateId of goal.preferredTemplateIds) {
        const template = await getTemplate(templateId)
        if (template && template.isActive) {
          templatePreviews.push(template)
        }
      }

      if (templatePreviews.length > 0) {
        // Show template preview modal
        templatePreviewsForGeneration.value = templatePreviews
        goalForTemplatePreview.value = goal
        showTemplatePreviewBeforeGeneration.value = true
        return // Wait for user to confirm
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  // If no templates or error, proceed directly
  await generateAssessmentsForGoalService(goalId, goals.value)
}

const confirmGenerateWithTemplates = async () => {
  if (!goalForTemplatePreview.value) return

  try {
    console.log('🎯 Proceeding with assessment generation for goal:', goalForTemplatePreview.value.id)

    // Set the goal in the composable so proceedWithGeneration can use it
    currentGoalForGeneration.value = goalForTemplatePreview.value

    // Close modal first
    showTemplatePreviewBeforeGeneration.value = false

    // Call proceedWithGeneration from the composable (bypasses template check)
    await proceedWithGeneration()

    console.log('✅ Assessment generation completed')
  } catch (error) {
    console.error('❌ Error generating assessments:', error)
    alert(`Failed to generate assessments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    // Clear state
    templatePreviewsForGeneration.value = []
    goalForTemplatePreview.value = null
  }
}

const editTemplateFromPreview = (templateId: string) => {
  showTemplatePreviewBeforeGeneration.value = false
  router.push(`/admin/templates?edit=${templateId}`)
}

const handleAssignToStudent = async (assessmentId: string, studentUid: string, goalId: string) => {
  await assignAssessmentToStudentService(assessmentId, studentUid, goalId)
}

const handleAssignAll = async (goal: Goal) => {
  await assignAllAssessmentsToAllStudentsService(goal)
}

const handleViewEditAssessment = (assessmentId: string) => {
  router.push(`/assessment/edit/${assessmentId}`)
}

const handleApproval = async () => {
  await handleApprovalService()
}

const handleSaveAsTemplate = async (templateData?: any) => {
  // If no templateData provided (from AssessmentPreviewModal), navigate to template management
  if (!templateData) {
    router.push('/admin/templates')
    return
  }

  try {
    // Add createdBy field
    templateData.createdBy = authStore.currentUser?.uid || ''

    // Import and use createTemplate function
    const { createTemplate } = await import('@/firebase/templateServices')
    const templateId = await createTemplate(templateData)

    console.log('✅ Template saved with ID:', templateId)

    alert(`✅ Template saved successfully!\n\nTemplate Name: ${templateData.name}\n\nYou can find it in Goal Template Management (/admin/templates) and use it to generate future assessments.`)

    // DON'T navigate away - stay on current page
    // User can continue working with the current goal
    // router.push('/admin/templates')  // REMOVED - keeps modal open
  } catch (error) {
    console.error('Error saving template:', error)
    alert(`❌ Failed to save template.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support.`)
  }
}

const confirmAndCreateAssessments = async () => {
  await confirmAndCreateAssessmentsService()
}

// Template Generation Handler
const handleGenerateTemplate = async (goal: Goal) => {
  if (!confirm(`Generate template draft(s) from this goal?\n\n"${goal.goalTitle}"\n\nThis will use AI to analyze the goal. If the goal requires multiple question types (e.g., "whole numbers, fractions, OR decimals"), multiple templates will be created.`)) {
    return
  }

  try {
    console.log('🤖 Generating template draft(s) from goal:', goal.goalTitle)

    const { generateTemplateDrafts } = await import('@/services/templateDraftGenerator')
    const { createTemplate } = await import('@/firebase/templateServices')

    // Show loading indicator
    alert('🤖 AI is analyzing your goal and generating template draft(s). This may take 15-30 seconds...')

    // Generate the draft(s)
    const drafts = await generateTemplateDrafts(
      goal.goalText,
      goal.goalTitle,
      goal.areaOfNeed
    )

    console.log(`✅ ${drafts.length} draft(s) generated successfully:`, drafts.map(d => d.name))

    // Save each template
    const newTemplateIds: string[] = []

    for (const draft of drafts) {
      // Build template data from draft
      const templateData: any = {
        name: draft.name,
        subject: draft.subject,
        topic: draft.topic,
        areaOfNeed: goal.areaOfNeed,
        goalTitleTemplate: '{{topic}} - Grade {{gradeLevel}}',
        goalTextTemplate: goal.goalText,
        assessmentMethod: 'app',
        exampleQuestion: draft.exampleQuestion,
        exampleAnswer: draft.exampleAnswer,
        createdBy: authStore.currentUser?.uid || '',
        isActive: true,
      }

      // Add optional fields
      if (draft.description) templateData.description = draft.description
      if (draft.exampleExplanation) templateData.exampleExplanation = draft.exampleExplanation
      if (draft.questionCategory) templateData.questionCategory = draft.questionCategory // NEW: Add question category
      if (draft.directions) templateData.directions = draft.directions // NEW: Add student directions
      if (draft.problemFrameType) templateData.problemFrameType = draft.problemFrameType // NEW: Add problem frame type
      if (draft.allowedOperations && draft.allowedOperations.length > 0) {
        templateData.allowedOperations = draft.allowedOperations
      }

      // Add problem structure if provided
      if (draft.problemStructure) {
        const ps = draft.problemStructure
        templateData.problemStructure = {
          ...(ps.numberOfSteps && { numberOfSteps: ps.numberOfSteps }),
          ...(ps.questionTypes && ps.questionTypes.length > 0 && { questionTypes: ps.questionTypes }),
          ...(ps.contextTypes && ps.contextTypes.length > 0 && { contextTypes: ps.contextTypes }),
          ...(ps.numberRanges && {
            numberRanges: ps.numberRanges
          }),
          ...(ps.forbiddenPatterns && ps.forbiddenPatterns.length > 0 && { forbiddenPatterns: ps.forbiddenPatterns }),
        }
      }

      // Add custom AI prompt
      if (draft.customAIPrompt) templateData.customAIPrompt = draft.customAIPrompt

      // Save the template
      const newTemplateId = await createTemplate(templateData)
      console.log(`✅ Template "${draft.name}" saved with ID:`, newTemplateId)
      newTemplateIds.push(newTemplateId)
    }

    // Auto-assign ALL new templates to this goal
    const { updateGoal } = await import('@/firebase/goalServices')
    const existingTemplateIds = goal.preferredTemplateIds || []
    const allTemplateIds = [...existingTemplateIds, ...newTemplateIds]
    await updateGoal(goal.id, { preferredTemplateIds: allTemplateIds })

    // Reload data
    await loadData()

    if (drafts.length === 1) {
      alert(`✅ Template "${drafts[0].name}" created and assigned to goal!\n\nYou can edit it in Admin → Goal Template Management if needed.`)
    } else {
      const names = drafts.map(d => `  • ${d.name}`).join('\n')
      alert(`✅ ${drafts.length} templates created and assigned to goal:\n\n${names}\n\nWhen you generate assessments, questions will be randomly selected from all ${drafts.length} templates to create variety!`)
    }
  } catch (error) {
    console.error('❌ Template generation failed:', error)
    alert(`Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Template Assignment Handlers
const handleAssignTemplate = async (goalId: string) => {
  currentGoalForTemplateAssignment.value = goalId
  selectedTemplateIds.value = []
  templateSearchQuery.value = '' // Clear search when opening modal

  // Load available templates
  loadingTemplates.value = true
  try {
    const { getActiveTemplates } = await import('@/firebase/templateServices')
    availableTemplates.value = await getActiveTemplates()
    showTemplateAssignmentModal.value = true
  } catch (error) {
    console.error('Error loading templates:', error)
    alert('Failed to load templates. Please try again.')
  } finally {
    loadingTemplates.value = false
  }
}

const handleRemoveTemplate = async (goalId: string, templateId: string) => {
  if (!confirm('Remove this template from the goal?')) return

  try {
    const { updateGoal } = await import('@/firebase/goalServices')
    const goal = goals.value.find(g => g.id === goalId)
    if (!goal) return

    const updatedTemplateIds = (goal.preferredTemplateIds || []).filter(id => id !== templateId)
    await updateGoal(goalId, { preferredTemplateIds: updatedTemplateIds })

    // Reload data
    await loadData()
    alert('✅ Template removed from goal!')
  } catch (error) {
    console.error('Error removing template:', error)
    alert('Failed to remove template. Please try again.')
  }
}

const toggleTemplateSelection = (templateId: string) => {
  const index = selectedTemplateIds.value.indexOf(templateId)
  if (index >= 0) {
    selectedTemplateIds.value.splice(index, 1)
  } else {
    selectedTemplateIds.value.push(templateId)
  }
}

const confirmTemplateAssignment = async () => {
  if (!currentGoalForTemplateAssignment.value || selectedTemplateIds.value.length === 0) return

  try {
    const { updateGoal } = await import('@/firebase/goalServices')
    const goalId = currentGoalForTemplateAssignment.value
    const goal = goals.value.find(g => g.id === goalId)
    if (!goal) return

    // Merge with existing template IDs (if any)
    const existingIds = goal.preferredTemplateIds || []
    const newIds = [...new Set([...existingIds, ...selectedTemplateIds.value])]

    await updateGoal(goalId, { preferredTemplateIds: newIds })

    const assignedCount = selectedTemplateIds.value.length // Store before clearing

    // Close modal and reload
    showTemplateAssignmentModal.value = false
    currentGoalForTemplateAssignment.value = null
    selectedTemplateIds.value = []
    await loadData()

    alert(`✅ ${assignedCount} template(s) assigned to goal!`)
  } catch (error) {
    console.error('Error assigning templates:', error)
    alert('Failed to assign templates. Please try again.')
  }
}

// JSON Import Handlers
const closeImportModal = () => {
  showImportModal.value = false
  selectedGoalForImport.value = null
}

const handleImportedAssessment = async (assessmentData: any) => {
  try {
    const { createAssessment } = await import('@/firebase/iepServices')

    // Set createdBy to current user
    assessmentData.createdBy = authStore.currentUser?.uid || ''

    // Create the assessment
    const newAssessmentId = await createAssessment(assessmentData)

    console.log('✅ Assessment imported successfully:', newAssessmentId)

    // Reload data
    await loadData()

    alert(`✅ Assessment "${assessmentData.title}" imported successfully!`)

    // Close modal
    closeImportModal()
  } catch (error) {
    console.error('❌ Error importing assessment:', error)
    alert(`Failed to import assessment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const closeModals = () => {
  showCreateGoalModal.value = false
  showEditGoalModal.value = false
  showCreateAssessmentModal.value = false
  showTemplateAssignmentModal.value = false
  editingGoal.value = null
  createAssessmentInitialData.value = null
  currentGoalForTemplateAssignment.value = null
  selectedTemplateIds.value = []
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.goal-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.goals-section {
  min-height: 400px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 1.5rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.text-light {
  color: white;
}

.mt-2 {
  margin-top: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

/* Template Assignment Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content {
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #000;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-help-text {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.loading-templates,
.no-templates-available {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.template-search-box {
  position: relative;
  margin-bottom: 1rem;
}

.template-search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.template-search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  transition: color 0.2s;
}

.clear-search-btn:hover {
  color: #495057;
}

.search-results-info {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
  padding-left: 0.25rem;
}

.no-search-results {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.no-search-results p {
  margin: 0;
  font-style: italic;
}

.templates-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.template-option {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.template-option.selected {
  border-color: #007bff;
  background: #e7f3ff;
}

.template-checkbox {
  flex-shrink: 0;
}

.template-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.template-info {
  flex: 1;
}

.template-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.template-details {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.template-meta {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: #e9ecef;
  border-radius: 12px;
  color: #495057;
}

.template-example {
  font-size: 0.75rem;
  color: #6c757d;
  font-style: italic;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.modal-footer .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
