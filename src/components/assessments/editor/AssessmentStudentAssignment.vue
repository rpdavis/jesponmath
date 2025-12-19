<template>
  <div>
    <h2>👥 Student Assignment</h2>

    <div class="form-group">
      <label>Assign to Students</label>
      <div class="students-assignment">
        <!-- Loading state -->
        <div v-if="loadingStudents" class="students-loading">
          <div class="loading-spinner-small"></div>
          <span>Loading students...</span>
        </div>

        <!-- Assignment Mode Selection -->
        <div v-else-if="availableStudents.length > 0" class="assignment-modes">
          <div class="assignment-mode-selector">
              <label class="mode-option">
                <input type="radio" :value="'template'" :checked="assignmentMode === 'template'" @change="emit('update:assignmentMode', 'template'); onAssignmentModeChange()" name="assignmentMode">
                <span>📋 Create Template (No Students)</span>
              </label>
              <label class="mode-option">
                <input type="radio" :value="'all'" :checked="assignmentMode === 'all'" @change="emit('update:assignmentMode', 'all'); onAssignmentModeChange()" name="assignmentMode">
                <span>👥 Assign to All My Students</span>
              </label>
              <label class="mode-option">
                <input type="radio" :value="'class'" :checked="assignmentMode === 'class'" @change="emit('update:assignmentMode', 'class'); onAssignmentModeChange()" name="assignmentMode">
                <span>🏫 Assign by Class/Period</span>
              </label>
              <label class="mode-option">
                <input type="radio" :value="'individual'" :checked="assignmentMode === 'individual'" @change="emit('update:assignmentMode', 'individual'); onAssignmentModeChange()" name="assignmentMode">
                <span>👤 Select Individual Students</span>
              </label>
          </div>

          <!-- Quarter/Period Selection -->
          <div class="quarter-selection">
            <h4>📅 Academic Quarter</h4>
            <div class="form-group">
              <label class="form-label">
                Which quarter is this assessment for?
                <span class="help-text">Controls when students can see this assessment</span>
              </label>
              <select :value="selectedQuarter" @change="emit('update:selectedQuarter', ($event.target as HTMLSelectElement).value)" class="form-select">
                <option value="auto">🔄 Auto-Detect (Current Quarter)</option>
                <option value="all">📚 All Year (No Quarter Restriction)</option>
                <option value="q1">Q1 - Quarter 1 (Aug-Oct)</option>
                <option value="q2">Q2 - Quarter 2 (Nov-Jan)</option>
                <option value="q3">Q3 - Quarter 3 (Feb-Apr)</option>
                <option value="q4">Q4 - Quarter 4 (May-Jul)</option>
              </select>
              <small class="form-help">
                <strong>Quarterly:</strong> Students see only in specific quarter (ESAs, regular assignments)<br>
                <strong>All Year:</strong> Students see anytime (diagnostics, tutoring, benchmarks)<br>
                <strong>Auto-Detect:</strong> Uses current quarter automatically
              </small>
            </div>
          </div>

          <!-- Class Selection (when mode is 'class') -->
          <div v-if="assignmentMode === 'class'" class="class-selection">
            <h4>Select Classes/Periods</h4>
            <div class="class-checkboxes">
              <label
                v-for="classGroup in uniqueClasses"
                :key="classGroup.key"
                class="class-checkbox"
              >
                <input
                  type="checkbox"
                  :value="classGroup.key"
                  :checked="selectedClasses.includes(classGroup.key)"
                  @change="(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const newClasses = target.checked
                      ? [...selectedClasses, classGroup.key]
                      : selectedClasses.filter(c => c !== classGroup.key);
                    emit('update:selectedClasses', newClasses);
                    updateStudentsByClass();
                  }"
                >
                <span>{{ classGroup.label }} ({{ classGroup.count }} students)</span>
              </label>
            </div>
          </div>

          <!-- Individual Student Selection (when mode is 'individual') -->
          <div v-if="assignmentMode === 'individual'" class="individual-selection">
            <h4>Select Students</h4>
            <div class="student-search">
              <input
                :value="studentSearchQuery"
                @input="emit('update:studentSearchQuery', ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="Search students..."
                class="form-input"
              >
            </div>
            <div class="student-checkboxes">
              <label
                v-for="student in filteredStudents"
                :key="student.uid"
                class="student-checkbox"
              >
                <input
                  type="checkbox"
                  :value="student.uid"
                  :checked="selectedStudents.includes(student.uid)"
                  @change="(e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const newStudents = target.checked
                      ? [...selectedStudents, student.uid]
                      : selectedStudents.filter(uid => uid !== student.uid);
                    emit('update:selectedStudents', newStudents);
                  }"
                >
                <span>{{ student.firstName }} {{ student.lastName }}</span>
                <small>{{ getStudentClassName(student) }} - {{ getStudentPeriod(student) || 'No period' }}</small>
              </label>
            </div>
          </div>
        </div>

        <!-- No students state -->
        <div v-else class="no-students-available">
          <p>{{ permissions.isAdmin ? 'No students in the system yet.' : 'No students assigned to you yet.' }}</p>
          <small class="form-help">
            {{ permissions.isAdmin ? 'Add students first, then create assessments.' : 'Contact your administrator to assign students to you.' }}
          </small>
        </div>

        <div class="assignment-summary">
          <strong>{{ getSelectedStudentsCount() }} student(s) will receive this assessment</strong>
          <small class="form-help">{{ getAssignmentSummaryText() }}</small>
        </div>
      </div>
    </div>

    <!-- Accommodations -->
    <div class="form-group">
      <label>Accommodations</label>
      <div class="accommodations-grid">
        <label
          v-for="accommodation in availableAccommodations"
          :key="accommodation"
          class="accommodation-checkbox"
        >
          <input
            type="checkbox"
            :value="accommodation"
            v-model="assessment.accommodations"
          >
          <span>{{ accommodation }}</span>
        </label>
      </div>
      <div class="custom-accommodation">
        <input
          v-model="customAccommodation"
          type="text"
          class="form-input"
          placeholder="Add custom accommodation..."
          @keyup.enter="addCustomAccommodation"
        >
        <button
          type="button"
          @click="addCustomAccommodation"
          class="add-button"
          :disabled="!customAccommodation.trim()"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm'
import type { Student } from '@/types/users'
import type { AssignmentMode } from '@/composables/assessment/useStudentAssignment'

interface Props {
  assessment: AssessmentFormData
  availableStudents: Student[]
  loadingStudents: boolean
  assignmentMode: AssignmentMode
  selectedStudents: string[]
  selectedClasses: string[]
  selectedQuarter: string
  studentSearchQuery: string
}

interface Emits {
  (e: 'update:assignmentMode', value: AssignmentMode): void
  (e: 'update:selectedStudents', value: string[]): void
  (e: 'update:selectedClasses', value: string[]): void
  (e: 'update:selectedQuarter', value: string): void
  (e: 'update:studentSearchQuery', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const permissions = usePermissions()
const customAccommodation = ref('')

const availableAccommodations = [
  'Extended Time (1.5x)',
  'Extended Time (2x)',
  'Read Aloud',
  'Small Group Setting',
  'Separate Location',
  'Frequent Breaks',
  'Use of Calculator',
  'Use of Reference Sheet',
  'Simplified Language',
  'Highlighted Instructions',
]

// Computed properties
const filteredStudents = computed(() => {
  if (!props.studentSearchQuery) return props.availableStudents

  const query = props.studentSearchQuery.toLowerCase()
  return props.availableStudents.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
    return fullName.includes(query)
  })
})

const uniqueClasses = computed(() => {
  const classMap = new Map<string, { key: string; label: string; count: number }>()

  props.availableStudents.forEach((student) => {
    const className = student.className || student.section || 'No Class'
    const period = student.period || 'No Period'
    const key = `${className}-${period}`

    if (!classMap.has(key)) {
      classMap.set(key, {
        key,
        label: `${className} - Period ${period}`,
        count: 0,
      })
    }

    const group = classMap.get(key)!
    group.count++
  })

  return Array.from(classMap.values())
})

// Methods
const updateStudentsByClass = () => {
  if (props.assignmentMode !== 'class') return

  const studentsInSelectedClasses = props.availableStudents
    .filter((student) => {
      const className = student.className || student.section || 'No Class'
      const period = student.period || 'No Period'
      const key = `${className}-${period}`
      return props.selectedClasses.includes(key)
    })
    .map((s) => s.uid)

  emit('update:selectedStudents', studentsInSelectedClasses)
}

const getSelectedStudentsCount = () => {
  if (props.assignmentMode === 'template') {
    return 0
  } else if (props.assignmentMode === 'all') {
    return props.availableStudents.length
  } else {
    return props.selectedStudents.length
  }
}

const getAssignmentSummaryText = () => {
  if (props.assignmentMode === 'template') {
    return 'Creating a template - no students assigned yet'
  } else if (props.assignmentMode === 'all') {
    return 'All your students will receive this assessment'
  } else if (props.assignmentMode === 'class') {
    return `Students in ${props.selectedClasses.length} selected class(es)`
  } else {
    return 'Individually selected students'
  }
}

const getStudentClassName = (student: Student) => {
  return student.className || student.section || 'No Class'
}

const getStudentPeriod = (student: Student) => {
  return student.period || ''
}

const onAssignmentModeChange = () => {
  emit('update:selectedStudents', [])
  emit('update:selectedClasses', [])

  if (props.assignmentMode === 'all') {
    emit('update:selectedStudents', props.availableStudents.map((s) => s.uid))
  }
}

const addCustomAccommodation = () => {
  const trimmed = customAccommodation.value.trim()
  if (trimmed && !availableAccommodations.includes(trimmed)) {
    availableAccommodations.push(trimmed)
    customAccommodation.value = ''
  }
}
</script>

<style scoped>
.students-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #6b7280;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.assignment-mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:has(input:checked) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.mode-option input[type="radio"] {
  margin: 0;
}

.quarter-selection,
.class-selection,
.individual-selection {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.class-checkboxes,
.student-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.class-checkbox,
.student-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.class-checkbox:hover,
.student-checkbox:hover {
  background: #f9fafb;
}

.student-checkbox {
  flex-direction: column;
  align-items: flex-start;
}

.student-search {
  margin-bottom: 1rem;
}

.assignment-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
}

.accommodations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.accommodation-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.custom-accommodation {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.add-button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-button:hover:not(:disabled) {
  background: #2563eb;
}

.add-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.no-students-available {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}
</style>
