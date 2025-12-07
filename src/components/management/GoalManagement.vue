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
      @close="showSingleQuestionPreview = false"
      @approve="handleApproval"
    />

    <ConfirmationPreviewModal
      :show="showConfirmationPreview"
      :assessments="generatedAssessmentsForPreview"
      :saving="isGeneratingRemaining"
      @close="cancelConfirmationPreview"
      @confirm="confirmAndCreateAssessments"
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
    />

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
import type { Goal } from '@/types/iep'

// Router
const router = useRouter()

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
const editingGoal = ref<Goal | null>(null)
const selectedAssessmentForGoal = ref<Record<string, string>>({})
const createAssessmentInitialData = ref<{
  goalId?: string
  title?: string
  gradeLevel?: number
} | null>(null)

// Computed
const availableAssessments = computed(() =>
  assessments.value.filter((assessment) => assessment.category === 'PA'),
)

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
  await generateAssessmentsForGoalService(goalId, goals.value)
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

const confirmAndCreateAssessments = async () => {
  await confirmAndCreateAssessmentsService()
}

const closeModals = () => {
  showCreateGoalModal.value = false
  showEditGoalModal.value = false
  showCreateAssessmentModal.value = false
  editingGoal.value = null
  createAssessmentInitialData.value = null
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
</style>
