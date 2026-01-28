<template>
  <div class="assessment-editor">
    <!-- Compact Header -->
    <div class="editor-header">
      <button @click="goBack" class="back-btn" type="button">← Back</button>
      <h1>{{ isEditing ? '✏️ Edit' : '📝 Create' }} Assessment</h1>
    </div>

    <!-- 2-Column Layout -->
    <div class="editor-layout">
      <!-- Main Content -->
      <main class="editor-main">
        <form @submit.prevent="handleSave" class="editor-form">
          <!-- Basic Info (Compact, always visible) -->
          <div class="section primary">
            <AssessmentBasicInfoCompact
              :assessment="assessment"
              :selectedStandard="selectedStandard"
              :selectedQuarter="selectedQuarter"
              :noTimeLimit="noTimeLimit"
              :assignDateInput="assignDateInput"
              :dueDateInput="dueDateInput"
              @update:standard="updateAssessmentStandard"
              @category-change="onCategoryChange"
              @toggle-time-limit="toggleTimeLimit"
              @update:assignDate="updateAssignDate"
              @update:dueDate="updateDueDate"
              @update:selectedQuarter="selectedQuarter = $event"
            />
          </div>

          <!-- Goal Connection (PA only) -->
          <CollapsibleSection
            v-if="assessment.category === 'PA'"
            title="Goal Connection"
            icon="🎯"
            :defaultExpanded="!!assessment.goalId"
          >
            <GoalConnection
              :assessment="assessment"
              :availableGoals="availableGoals"
              @update:goalId="assessment.goalId = $event"
            />
          </CollapsibleSection>

          <!-- Students (prominent) -->
          <div class="section students">
            <AssessmentStudentAssignment
              :assessment="assessment"
              :availableStudents="availableStudents"
              :loadingStudents="loadingStudents"
              :assignmentMode="assignmentMode"
              :selectedStudents="selectedStudents"
              :selectedClasses="selectedClasses"
              :selectedQuarter="selectedQuarter"
              :studentSearchQuery="studentSearchQuery"
              @update:assignmentMode="assignmentMode = $event"
              @update:selectedStudents="selectedStudents = $event"
              @update:selectedClasses="selectedClasses = $event"
              @update:selectedQuarter="selectedQuarter = $event"
              @update:studentSearchQuery="studentSearchQuery = $event"
            />
          </div>

          <!-- Questions (prominent) -->
          <div class="section questions">
            <QuestionsList
              :questions="assessment.questions"
              :gradeLevel="assessment.gradeLevel"
              :expandedQuestionIds="expandedQuestionIds"
              @add-question="addQuestion"
              @move-up="(i) => moveQuestionUp(assessment.questions[i].id)"
              @move-down="(i) => moveQuestionDown(assessment.questions[i].id)"
              @delete="(i) => deleteQuestion(assessment.questions[i].id)"
              @duplicate="(i) => duplicateQuestion(assessment.questions[i].id)"
              @toggle-expand="toggleQuestionExpanded"
              @expand-all="expandAllQuestions"
              @collapse-all="collapseAllQuestions"
            />
          </div>

          <!-- Advanced Settings (collapsed) -->
          <CollapsibleSection title="File Upload" icon="📎" :subtitle="getFileSettingsSummary()">
            <AssessmentFileSettings :assessment="assessment" @file-upload-toggle="onFileUploadToggle" />
          </CollapsibleSection>

          <CollapsibleSection title="Retakes" icon="🔄" :subtitle="getRetakeSettingsSummary()">
            <AssessmentRetakeSettings :assessment="assessment" />
          </CollapsibleSection>

          <!-- Messages -->
          <Transition name="fade">
            <div v-if="saveState.success" class="message success">✅ {{ saveState.success }}</div>
          </Transition>
          <Transition name="fade">
            <div v-if="saveState.error" class="message error">❌ {{ saveState.error }}</div>
          </Transition>
        </form>
      </main>

      <!-- Sticky Sidebar -->
      <EditorSidebar
        :assessment="assessment"
        :questionCount="questionCount"
        :totalPoints="totalPoints"
        :studentsCount="getSelectedStudentsCount()"
        :saving="saveState.saving.value"
        :isValid="isValid"
        @save="handleSave"
        @cancel="goBack"
        @preview="showPreview = true"
        @print="showPrint = true"
      />
    </div>

    <!-- Modals -->
    <AssessmentPreviewModal v-if="showPreview" :assessment="assessment" @close="showPreview = false" />

    <PrintAssessmentModal v-if="showPrint" :assessment="assessment" @close="showPrint = false" />

    <AssessmentUpdateWarning
      v-if="saveState.showUpdateWarning.value"
      :result-count="saveState.existingResultsInfo.value.resultCount"
      :student-emails="saveState.existingResultsInfo.value.studentEmails"
      @proceed="proceedWithUpdate"
      @cancel="saveState.cancelUpdate()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getAssessment, getAllGoals } from '@/firebase/iepServices'
import { getAssessmentAssignments } from '@/firebase/assignmentServices'

// Composables
import { useAssessmentForm } from '@/composables/assessment/useAssessmentForm'
import { useQuestionManagement } from '@/composables/assessment/useQuestionManagement'
import { useStudentAssignment } from '@/composables/assessment/useStudentAssignment'
import { useAssessmentSave } from '@/composables/assessment/useAssessmentSave'
import { useAssessmentHelpers } from '@/composables/assessment/useAssessmentHelpers'

// Components
import AssessmentBasicInfoCompact from './editor/AssessmentBasicInfoCompact.vue'
import AssessmentFileSettings from './editor/AssessmentFileSettings.vue'
import AssessmentRetakeSettings from './editor/AssessmentRetakeSettings.vue'
import AssessmentStudentAssignment from './editor/AssessmentStudentAssignment.vue'
import GoalConnection from './editor/GoalConnection.vue'
import QuestionsList from './editor/QuestionsList.vue'
import EditorSidebar from './editor/EditorSidebar.vue'
import CollapsibleSection from './editor/CollapsibleSection.vue'

// Modals (lazy loaded)
import AssessmentPreviewModal from './modals/AssessmentPreviewModal.vue'
import PrintAssessmentModal from './modals/PrintAssessmentModal.vue'
import AssessmentUpdateWarning from '@/components/AssessmentUpdateWarning.vue'

import type { Goal } from '@/types/iep'

// Router & Auth
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Composables
const {
  assessment,
  noTimeLimit,
  selectedStandard,
  assignDateInput,
  dueDateInput,
  updateTotalPoints,
  toggleTimeLimit,
  updateAssessmentStandard,
  updateAssignDate,
  updateDueDate,
} = useAssessmentForm()

const questionsRef = ref(assessment.value.questions)
watch(questionsRef, (newQuestions) => { assessment.value.questions = newQuestions }, { deep: true })

const questionManagement = useQuestionManagement(questionsRef)
const { expandedQuestionIds, addQuestion, duplicateQuestion, deleteQuestion, moveQuestionUp, moveQuestionDown, toggleQuestionExpanded, expandAllQuestions, collapseAllQuestions } = questionManagement

const studentAssignment = useStudentAssignment()
const { selectedStudents, selectedQuarter, assignmentMode, selectedClasses, studentSearchQuery, loadingStudents, availableStudents, loadStudents, getSelectedStudentsCount } = studentAssignment

const saveState = useAssessmentSave()

// Watch for selectedQuarter changes to debug the issue
watch(selectedQuarter, (newValue, oldValue) => {
  console.log('🔍 DEBUG QUARTER WATCH - selectedQuarter changed!')
  console.log('  - Old value:', oldValue)
  console.log('  - New value:', newValue)
  console.log('  - Type:', typeof newValue)
  console.trace('Quarter change stack trace:')
}, { immediate: false })

// Local state
const availableGoals = ref<Goal[]>([])
const showPreview = ref(false)
const showPrint = ref(false)

// Computed
const isEditing = computed(() => !!route.params.id)
const assessmentId = computed(() => route.params.id as string)
const questionCount = computed(() => questionsRef.value.length)
const totalPoints = computed(() => questionsRef.value.reduce((sum, q) => sum + (q.points || 0), 0))
const isValid = computed(() => Boolean(assessment.value.title && assessment.value.description && assessment.value.gradeLevel && assessment.value.category && questionCount.value > 0))

// Methods
const goBack = () => router.push('/assessments')

const onCategoryChange = () => {
  if (assessment.value.category === 'PA') loadGoals()
}

const onFileUploadToggle = () => {
  if (!assessment.value.allowFileUpload) {
    assessment.value.requireFileUpload = false
    assessment.value.requireMultiplePages = false
  }
}

const getFileSettingsSummary = () => {
  if (!assessment.value.allowFileUpload) return 'Disabled'
  if (assessment.value.requireMultiplePages) return `${assessment.value.requiredPageCount} pages required`
  return assessment.value.requireFileUpload ? 'Required' : 'Optional'
}

const getRetakeSettingsSummary = () => {
  if (!assessment.value.allowRetakes) return 'No retakes'
  return assessment.value.maxRetakes === 0 ? 'Unlimited' : `${assessment.value.maxRetakes} retake(s)`
}

const loadGoals = async () => {
  try {
    availableGoals.value = await getAllGoals()
  } catch (err) {
    console.error('Error loading goals:', err)
  }
}

const loadAssessment = async () => {
  if (!isEditing.value) return

  try {
    const loaded = await getAssessment(assessmentId.value)
    if (!loaded) throw new Error('Assessment not found')

    Object.assign(assessment.value, loaded)
    questionsRef.value = loaded.questions
    noTimeLimit.value = !loaded.timeLimit
    if (loaded.standard) selectedStandard.value = loaded.standard

    // Initialize selectedQuarter from loaded academicPeriod
    if (loaded.academicPeriod) {
      selectedQuarter.value = loaded.academicPeriod
      console.log(`📅 Loaded academicPeriod: ${loaded.academicPeriod}, set selectedQuarter to: ${selectedQuarter.value}`)
    } else {
      selectedQuarter.value = 'auto'
      console.log(`📅 No academicPeriod found, defaulting to auto`)
    }

    // Initialize date inputs from loaded dates (convert Firestore Timestamps to input format)
    if (loaded.assignDate) {
      const assignDateValue = loaded.assignDate?.toDate ? loaded.assignDate.toDate() : new Date(loaded.assignDate.seconds * 1000)
      assignDateInput.value = assignDateValue.toISOString().slice(0, 16)
      assessment.value.assignDate = assignDateValue
      console.log(`📅 Loaded assignDate: ${assignDateInput.value}`)
    } else {
      assignDateInput.value = ''
      assessment.value.assignDate = undefined
    }

    if (loaded.dueDate) {
      const dueDateValue = loaded.dueDate?.toDate ? loaded.dueDate.toDate() : new Date(loaded.dueDate.seconds * 1000)
      dueDateInput.value = dueDateValue.toISOString().slice(0, 16)
      assessment.value.dueDate = dueDateValue
      console.log(`📅 Loaded dueDate: ${dueDateInput.value}`)
    } else {
      dueDateInput.value = ''
      assessment.value.dueDate = undefined
    }

    const assigned = await getAssessmentAssignments(assessmentId.value)
    selectedStudents.value = assigned.map((s) => s.studentUid)

    // Set assignment mode based on loaded students
    if (selectedStudents.value.length === 0) {
      assignmentMode.value = 'template'
    } else if (selectedStudents.value.length === availableStudents.value.length && availableStudents.value.length > 0) {
      assignmentMode.value = 'all'
    } else {
      assignmentMode.value = 'individual'
    }

    console.log(`✅ Loaded assessment with ${selectedStudents.value.length} assigned students, mode: ${assignmentMode.value}`)
  } catch (err: any) {
    console.error('❌ Error loading:', err)
    saveState.error.value = 'Failed to load: ' + err.message
  }
}

const handleSave = async () => {
  // Check for existing results if editing
  if (isEditing.value) {
    const hasResults = await saveState.checkForExistingResults(assessmentId.value)
    if (hasResults) return // Show warning, wait for user confirmation
  }

  await performSave()
}

const proceedWithUpdate = async () => {
  saveState.showUpdateWarning.value = false
  await performSave()
}

const performSave = async () => {
  updateTotalPoints()

  console.log('🔍 DEBUG - performSave called')
  console.log('🔍 DEBUG - selectedQuarter.value:', selectedQuarter.value)
  console.log('🔍 DEBUG - assessment.value.assignDate:', assessment.value.assignDate)
  console.log('🔍 DEBUG - assessment.value.dueDate:', assessment.value.dueDate)
  console.log('🔍 DEBUG - assessment.value.academicPeriod:', assessment.value.academicPeriod)

  const savedId = await saveState.saveAssessment({
    assessmentData: assessment.value,
    selectedStudents: selectedStudents.value,
    selectedQuarter: selectedQuarter.value,
    assignmentMode: assignmentMode.value,
    availableStudents: availableStudents.value,
    isEditing: isEditing.value,
    assessmentId: assessmentId.value,
    currentUserUid: authStore.currentUser?.uid || 'system',
  })

  if (savedId && !isEditing.value) {
    setTimeout(() => router.push(`/assessment/edit/${savedId}`), 1500)
  }
}

// Lifecycle
onMounted(async () => {
  await loadStudents()
  if (isEditing.value) await loadAssessment()
  if (assessment.value.category === 'PA') loadGoals()
})

watch(() => assessment.value.category, (cat) => {
  if (cat === 'PA') loadGoals()
})
</script>

<style scoped>
.assessment-editor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.editor-header h1 {
  font-size: 1.75rem;
  color: #1f2937;
  margin: 0;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
}

.editor-main {
  min-width: 0;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section {
  background: white;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section.primary { border-left: 4px solid #3b82f6; }
.section.students { border-left: 4px solid #8b5cf6; }
.section.questions { border-left: 4px solid #10b981; }

.message {
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
}

.message.success {
  background: #d1fae5;
  color: #065f46;
  border-left: 4px solid #10b981;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
  border-left: 4px solid #ef4444;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
  .assessment-editor {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .editor-header h1 {
    font-size: 1.25rem;
  }
}

/* Global form styles */
:deep(.form-group) {
  margin-bottom: 1rem;
}

:deep(.form-group label) {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
}

:deep(.form-input),
:deep(.form-select),
:deep(.form-textarea) {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

:deep(.form-input:focus),
:deep(.form-select:focus),
:deep(.form-textarea:focus) {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.form-row) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

:deep(.form-help) {
  display: block;
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

:deep(.checkbox-label) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
</style>
