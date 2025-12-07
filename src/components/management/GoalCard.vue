<template>
  <div class="goal-card">
    <div class="goal-header">
      <h3>{{ goal.goalTitle }}</h3>
      <div class="goal-status">
        <span v-if="goal.isMet" class="status-badge met">✅ Met</span>
        <span v-else-if="goal.isArchived" class="status-badge archived">📦 Archived</span>
        <span v-else-if="goal.isActive" class="status-badge active">🟢 Active</span>
        <span v-else class="status-badge inactive">⏸️ Inactive</span>
      </div>
    </div>

    <div class="goal-details">
      <div class="detail-row">
        <strong>Students:</strong>
        <span v-if="goal.assignedStudents?.length">
          {{ goal.assignedStudents.map((uid) => getStudentName(uid)).join(', ') }}
        </span>
        <span v-else-if="goal.studentUid">
          {{ getStudentName(goal.studentUid) }}
        </span>
        <span v-else class="no-students-assigned"> No students assigned </span>
      </div>
      <div class="detail-row">
        <strong>Area of Need:</strong>
        <span>{{ goal.areaOfNeed }}</span>
      </div>
      <div class="detail-row">
        <strong>Baseline:</strong>
        <span>{{ goal.baseline }}</span>
      </div>
      <div class="detail-row">
        <strong>Goal:</strong>
        <span>{{ goal.goalText }}</span>
      </div>
    </div>

    <!-- Assigned Assessments -->
    <div class="assessments-section">
      <h4>📊 Assigned Assessments ({{ goal.assignedAssessments?.length || 0 }})</h4>
      <div v-if="goal.assignedAssessments?.length" class="assessment-list">
        <div
          v-for="assessmentId in goal.assignedAssessments"
          :key="assessmentId"
          class="assessment-item-expanded"
        >
          <div class="assessment-header-row">
            <span class="assessment-title">{{ getAssessmentTitle(assessmentId) }}</span>
            <div class="assessment-actions-row">
              <button
                @click="$emit('view-edit', assessmentId)"
                class="btn btn-xs btn-primary"
                title="View and edit this assessment"
              >
                ✏️ Edit
              </button>
              <button
                @click="$emit('remove-assessment', goal.id, assessmentId)"
                class="btn btn-xs btn-danger"
                title="Remove assessment from goal"
              >
                ❌
              </button>
            </div>
          </div>

          <!-- Student Assignment Status -->
          <div v-if="goal.assignedStudents?.length" class="student-assignment-status">
            <div
              v-for="studentUid in goal.assignedStudents"
              :key="studentUid"
              class="student-assignment-row"
            >
              <span class="student-name-small">{{ getStudentName(studentUid) }}</span>
              <span
                v-if="isAssessmentAssignedToStudent(assessmentId, studentUid)"
                class="status-assigned"
              >
                ✅ Assigned
              </span>
              <button
                v-else
                @click="$emit('assign-to-student', assessmentId, studentUid, goal.id)"
                class="btn btn-xs btn-primary"
                title="Assign to student"
              >
                📝 Assign to Student
              </button>
            </div>
          </div>
          <div v-else-if="goal.studentUid" class="student-assignment-status">
            <div class="student-assignment-row">
              <span class="student-name-small">{{ getStudentName(goal.studentUid) }}</span>
              <span
                v-if="isAssessmentAssignedToStudent(assessmentId, goal.studentUid)"
                class="status-assigned"
              >
                ✅ Assigned
              </span>
              <button
                v-else
                @click="$emit('assign-to-student', assessmentId, goal.studentUid, goal.id)"
                class="btn btn-xs btn-primary"
                title="Assign to student"
              >
                📝 Assign to Student
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-assessments">
        <p>No assessments assigned yet</p>
      </div>

      <div class="assessment-actions">
        <select
          :value="selectedAssessmentId"
          @change="(e) => $emit('assign-assessment', goal.id, (e.target as HTMLSelectElement).value)"
          class="form-select form-select-sm"
        >
          <option value="">Assign existing assessment...</option>
          <option v-for="assessment in availableAssessments" :key="assessment.id" :value="assessment.id">
            {{ assessment.title }} ({{ assessment.category }})
          </option>
        </select>
        <button @click="$emit('create-assessment', goal.id)" class="btn btn-sm btn-secondary" title="Create new assessment for this goal">
          ➕ New
        </button>
        <div class="generate-assessments-controls">
          <select
            :value="difficultyLevel"
            @change="(e) => $emit('update-difficulty', (e.target as HTMLSelectElement).value)"
            class="form-select form-select-sm difficulty-select"
            title="Select difficulty level for generated questions"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            @click="$emit('generate-assessments', goal.id)"
            class="btn btn-sm btn-info"
            title="Generate 3 AI assessments for this goal"
          >
            🤖 Generate Assessments
          </button>
        </div>
        <button
          v-if="goal.assignedAssessments?.length > 0"
          @click="$emit('assign-all', goal)"
          class="btn btn-sm btn-success"
          title="Assign all assessments to all students in this goal"
        >
          📤 Assign All to Students
        </button>
      </div>
    </div>

    <!-- Goal Actions -->
    <div class="goal-actions">
      <button @click="$emit('edit', goal)" class="btn btn-sm btn-primary">✏️ Edit</button>

      <button
        v-if="goal.isActive && !goal.isMet"
        @click="$emit('mark-met', goal.id)"
        class="btn btn-sm btn-success"
      >
        ✅ Mark Met
      </button>

      <button
        v-if="goal.isActive && !goal.isArchived"
        @click="$emit('archive', goal.id)"
        class="btn btn-sm btn-warning"
      >
        📦 Archive
      </button>

      <button
        v-if="!goal.isActive || goal.isArchived"
        @click="$emit('reactivate', goal.id)"
        class="btn btn-sm btn-info"
      >
        🔄 Reactivate
      </button>

      <button
        @click="$emit('delete', goal.id)"
        class="btn btn-sm btn-danger"
        :disabled="goal.assignedAssessments?.length > 0"
        :title="goal.assignedAssessments?.length > 0 ? 'Remove all assessments first' : 'Delete goal'"
      >
        🗑️ Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Goal, Assessment } from '@/types/iep'
import type { Student } from '@/types/users'

defineProps<{
  goal: Goal
  students: Student[]
  assessments: Assessment[]
  availableAssessments: Assessment[]
  selectedAssessmentId: string
  difficultyLevel: 'easy' | 'medium' | 'hard'
  getStudentName: (uid: string) => string
  getAssessmentTitle: (id: string) => string
  isAssessmentAssignedToStudent: (assessmentId: string, studentUid: string) => boolean
}>()

defineEmits<{
  edit: [goal: Goal]
  'mark-met': [goalId: string]
  archive: [goalId: string]
  reactivate: [goalId: string]
  delete: [goalId: string]
  'assign-assessment': [goalId: string, assessmentId: string]
  'remove-assessment': [goalId: string, assessmentId: string]
  'create-assessment': [goalId: string]
  'generate-assessments': [goalId: string]
  'assign-to-student': [assessmentId: string, studentUid: string, goalId: string]
  'assign-all': [goal: Goal]
  'view-edit': [assessmentId: string]
  'update-difficulty': [difficulty: string]
}>()
</script>

<style scoped>
.goal-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.goal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  line-height: 1.3;
}

.goal-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.met {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.archived {
  background: #fff3cd;
  color: #856404;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.goal-details {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.detail-row strong {
  min-width: 100px;
  color: #495057;
  font-size: 0.875rem;
}

.detail-row span {
  flex: 1;
  color: #6c757d;
  font-size: 0.875rem;
}

.no-students-assigned {
  color: #6c757d;
  font-style: italic;
}

.assessments-section {
  margin-bottom: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.assessments-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #495057;
}

.assessment-list {
  margin-bottom: 1rem;
}

.assessment-item-expanded {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.assessment-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.assessment-actions-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.assessment-title {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.student-assignment-status {
  margin-top: 0.5rem;
}

.student-assignment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.student-name-small {
  color: #6c757d;
}

.status-assigned {
  color: #28a745;
  font-weight: 600;
  font-size: 0.75rem;
}

.no-assessments {
  color: #6c757d;
  font-style: italic;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.assessment-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.generate-assessments-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.difficulty-select {
  min-width: 100px;
}

.goal-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-xs {
  padding: 0.125rem 0.375rem;
  font-size: 0.7rem;
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

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.form-select-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
