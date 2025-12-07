<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Goal' : 'Create New Goal' }}</h2>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="$emit('save', formData)" class="goal-form">
        <!-- Template Selection (only when creating, not editing) -->
        <div v-if="!isEditing" class="form-group template-selector">
          <label for="templateSelect">Start from Template (Optional)</label>
          <div class="template-select-wrapper">
            <select
              id="templateSelect"
              v-model="selectedTemplateId"
              class="form-select"
              @change="applyTemplate"
            >
              <option value="">Select a template...</option>
              <option
                v-for="template in activeTemplates"
                :key="template.id"
                :value="template.id"
              >
                {{ template.name }} ({{ template.subject }})
              </option>
            </select>
            <button
              v-if="selectedTemplateId"
              type="button"
              @click="clearTemplate"
              class="btn-clear-template"
              title="Clear template"
            >
              ✕
            </button>
          </div>
          <small v-if="selectedTemplate" class="form-help">
            Template: {{ selectedTemplate.name }} - Fields will be auto-filled. You can edit them.
          </small>
        </div>

        <div class="form-group">
          <label for="goalTitle">Goal Title *</label>
          <input
            id="goalTitle"
            v-model="formData.goalTitle"
            type="text"
            required
            class="form-input"
            placeholder="e.g., Fraction Operations Mastery"
          />
        </div>

        <div class="form-group full-width">
          <label for="studentSearch">Assign Students (Optional)</label>
          <StudentSelector
            :students="students"
            :selected="formData.assignedStudents"
            :get-student-name="getStudentName"
            @update:selected="formData.assignedStudents = $event"
            @remove="removeStudent"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="areaOfNeed">Area of Need *</label>
            <input
              id="areaOfNeed"
              v-model="formData.areaOfNeed"
              type="text"
              required
              class="form-input"
              placeholder="e.g., Math Computation, Reading Comprehension"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="baseline">Baseline *</label>
          <textarea
            id="baseline"
            v-model="formData.baseline"
            required
            class="form-textarea"
            rows="3"
            placeholder="Describe the student's current performance level..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="goalText">Goal Statement *</label>
          <textarea
            id="goalText"
            v-model="formData.goalText"
            required
            class="form-textarea"
            rows="4"
            placeholder="Write the specific, measurable goal statement..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="startDate">Start Date (Optional)</label>
          <input id="startDate" v-model="formData.startDate" type="date" class="form-input" />
          <small class="form-help">IEP dates are tracked individually per student</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="personResponsible">Person Responsible</label>
            <input
              id="personResponsible"
              v-model="formData.personResponsible"
              type="text"
              class="form-input"
              placeholder="e.g., Special Education Teacher"
            />
          </div>

          <div class="form-group">
            <label for="gradeLevel">Grade Level</label>
            <select id="gradeLevel" v-model="formData.gradeLevel" class="form-select">
              <option value="">Select Grade</option>
              <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
                Grade {{ grade }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="standard">Related Standard</label>
          <input
            id="standard"
            v-model="formData.standard"
            type="text"
            class="form-input"
            placeholder="e.g., 7.EE.4a, CCSS.MATH.CONTENT.7.NS.A.1"
          />
        </div>

        <div class="form-group">
          <label for="purposeOfGoal">Purpose of Goal</label>
          <textarea
            id="purposeOfGoal"
            v-model="formData.purposeOfGoal"
            class="form-textarea"
            rows="2"
            placeholder="Explain why this goal is important for the student..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : isEditing ? 'Update Goal' : 'Create Goal' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import StudentSelector from '../shared/StudentSelector.vue'
import { getActiveTemplates, generateGoalFromTemplate } from '@/firebase/templateServices'
import type { Goal } from '@/types/iep'
import type { Student } from '@/types/users'
import type { GoalTemplate } from '@/types/iep'

const props = defineProps<{
  show: boolean
  isEditing: boolean
  goal?: Goal | null
  students: Student[]
  getStudentName: (uid: string) => string
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: Partial<Goal>]
}>()

const formData = reactive({
  goalTitle: '',
  assignedStudents: [] as string[],
  areaOfNeed: '',
  baseline: '',
  goalText: '',
  startDate: '',
  personResponsible: '',
  gradeLevel: undefined as number | undefined,
  standard: '',
  purposeOfGoal: '',
})

// Template selection
const activeTemplates = ref<GoalTemplate[]>([])
const selectedTemplateId = ref('')
const selectedTemplate = ref<GoalTemplate | null>(null)

// Load templates when modal opens
onMounted(async () => {
  try {
    activeTemplates.value = await getActiveTemplates()
  } catch (error) {
    console.error('Error loading templates:', error)
  }
})

watch(
  () => props.show,
  async (isOpen) => {
    if (isOpen && !props.isEditing) {
      try {
        activeTemplates.value = await getActiveTemplates()
      } catch (error) {
        console.error('Error loading templates:', error)
      }
    }
  },
)

const applyTemplate = async () => {
  if (!selectedTemplateId.value) {
    clearTemplate()
    return
  }

  const template = activeTemplates.value.find(t => t.id === selectedTemplateId.value)
  if (!template) return

  selectedTemplate.value = template

  // Generate goal from template with default variables
  const generated = generateGoalFromTemplate(template, {
    topic: template.topic || '',
    threshold: template.defaultThreshold || '80%',
    condition: template.defaultCondition || 'in 3 out of 4 trials',
    gradeLevel: template.defaultGradeLevel || 7,
    standard: template.defaultStandard || '',
  })

  // Apply generated values to form
  formData.goalTitle = generated.goalTitle
  formData.goalText = generated.goalText
  formData.areaOfNeed = generated.areaOfNeed
  if (generated.baseline) {
    formData.baseline = generated.baseline
  }
  if (generated.gradeLevel) {
    formData.gradeLevel = generated.gradeLevel
  }
  if (generated.standard) {
    formData.standard = generated.standard
  }
}

const clearTemplate = () => {
  selectedTemplateId.value = ''
  selectedTemplate.value = null
}

// Watch for goal changes (when editing)
watch(
  () => props.goal,
  (newGoal) => {
    if (newGoal) {
      formData.goalTitle = newGoal.goalTitle
      formData.assignedStudents = newGoal.assignedStudents || (newGoal.studentUid ? [newGoal.studentUid] : [])
      formData.areaOfNeed = newGoal.areaOfNeed
      formData.baseline = newGoal.baseline
      formData.goalText = newGoal.goalText
      formData.startDate = newGoal.startDate || ''
      formData.personResponsible = newGoal.personResponsible || ''
      formData.gradeLevel = newGoal.gradeLevel || undefined
      formData.standard = newGoal.standard || ''
      formData.purposeOfGoal = newGoal.purposeOfGoal || ''
    }
  },
  { immediate: true },
)

// Reset form when modal closes
watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) {
      formData.goalTitle = ''
      formData.assignedStudents = []
      formData.areaOfNeed = ''
      formData.baseline = ''
      formData.goalText = ''
      formData.startDate = ''
      formData.personResponsible = ''
      formData.gradeLevel = undefined
      formData.standard = ''
      formData.purposeOfGoal = ''
      clearTemplate()
    }
  },
)

const removeStudent = (studentUid: string) => {
  const index = formData.assignedStudents.indexOf(studentUid)
  if (index > -1) {
    formData.assignedStudents.splice(index, 1)
  }
}
</script>

<style scoped>
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
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close:hover {
  background: #f8f9fa;
  color: #495057;
}

.goal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group.full-width {
  width: 100%;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #dee2e6;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.template-selector {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.template-select-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.template-select-wrapper .form-select {
  flex: 1;
}

.btn-clear-template {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-clear-template:hover {
  background: #c82333;
}
</style>
