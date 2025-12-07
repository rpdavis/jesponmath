<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Create Progress Assessment</h2>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="$emit('create', formData)" class="assessment-form">
        <div class="form-group">
          <label for="assessmentTitle">Assessment Title *</label>
          <input
            id="assessmentTitle"
            v-model="formData.title"
            type="text"
            required
            class="form-input"
            placeholder="e.g., Fraction Operations Progress Check"
          />
        </div>

        <div class="form-group">
          <label for="assessmentDescription">Description</label>
          <textarea
            id="assessmentDescription"
            v-model="formData.description"
            class="form-textarea"
            rows="3"
            placeholder="Describe what this assessment measures..."
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="assessmentGrade">Grade Level (Optional)</label>
            <select id="assessmentGrade" v-model="formData.gradeLevel" class="form-select">
              <option value="">Select Grade</option>
              <option v-for="grade in [6, 7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
                Grade {{ grade }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="connectToGoal">Connect to Goal</label>
            <select id="connectToGoal" v-model="formData.goalId" class="form-select">
              <option value="">Select Goal (Optional)</option>
              <option v-for="goal in activeGoals" :key="goal.id" :value="goal.id">
                {{ goal.goalTitle }} -
                {{
                  goal.assignedStudents?.length > 0
                    ? goal.assignedStudents.map((uid) => getStudentName(uid)).join(', ')
                    : goal.studentUid
                      ? getStudentName(goal.studentUid)
                      : 'No students'
                }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Creating...' : 'Create & Edit Assessment' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Goal } from '@/types/iep'
import type { Student } from '@/types/users'

const props = defineProps<{
  show: boolean
  activeGoals: Goal[]
  students: Student[]
  getStudentName: (uid: string) => string
  saving?: boolean
  initialData?: {
    goalId?: string
    title?: string
    gradeLevel?: number
  }
}>()

const emit = defineEmits<{
  close: []
  create: [data: { title: string; description?: string; gradeLevel?: number; goalId?: string }]
}>()

const formData = reactive({
  title: '',
  description: '',
  gradeLevel: undefined as number | undefined,
  goalId: '',
})

// Watch for initial data changes
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.goalId = newData.goalId || ''
      formData.title = newData.title || ''
      formData.gradeLevel = newData.gradeLevel
    }
  },
  { immediate: true },
)

// Reset form when modal closes
watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) {
      formData.title = ''
      formData.description = ''
      formData.gradeLevel = undefined
      formData.goalId = ''
    }
  },
)
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
  max-width: 600px;
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

.assessment-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
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
</style>
