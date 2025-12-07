<template>
  <div class="student-selector">
    <input
      id="studentSearch"
      v-model="searchQuery"
      type="text"
      class="form-input"
      placeholder="Search students by name..."
      @focus="showDropdown = true"
    />

    <div v-if="showDropdown" class="student-dropdown">
      <div class="dropdown-header">
        <span>{{ filteredStudents.length }} students found</span>
        <button type="button" @click="showDropdown = false" class="btn-close-dropdown">✕</button>
      </div>

      <div v-if="filteredStudents.length === 0" class="no-students">No students found</div>

      <div v-else class="student-list">
        <label v-for="student in filteredStudents" :key="student.uid" class="student-item">
          <input
            type="checkbox"
            :value="student.uid"
            :checked="selected.includes(student.uid)"
            @change="handleToggle(student.uid)"
          />
          <span class="student-info">
            <strong>{{ student.firstName }} {{ student.lastName }}</strong>
            <small v-if="student.period">Period {{ student.period }}</small>
            <small v-if="student.grade">Grade {{ student.grade }}</small>
          </span>
        </label>
      </div>
    </div>

    <!-- Selected Students Display -->
    <div v-if="selected.length > 0" class="selected-students">
      <h4>Selected Students ({{ selected.length }})</h4>
      <div class="selected-student-tags">
        <div v-for="studentUid in selected" :key="studentUid" class="student-tag">
          <span>{{ getStudentName(studentUid) }}</span>
          <button
            type="button"
            @click="$emit('remove', studentUid)"
            class="btn-remove-student"
            title="Remove student"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <small class="form-help">
      Select one or more students for this goal. You can leave this empty and assign students later.
    </small>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Student } from '@/types/users'

const props = defineProps<{
  students: Student[]
  selected: string[]
  getStudentName: (uid: string) => string
}>()

const emit = defineEmits<{
  'update:selected': [value: string[]]
  remove: [uid: string]
}>()

const searchQuery = ref('')
const showDropdown = ref(false)

const filteredStudents = computed(() => {
  if (!searchQuery.value) return props.students

  const query = searchQuery.value.toLowerCase()
  return props.students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(query),
  )
})

const handleToggle = (studentUid: string) => {
  const newSelected = [...props.selected]
  const index = newSelected.indexOf(studentUid)

  if (index > -1) {
    newSelected.splice(index, 1)
  } else {
    newSelected.push(studentUid)
  }

  emit('update:selected', newSelected)
}
</script>

<style scoped>
.student-selector {
  position: relative;
}

.student-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.25rem;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.btn-close-dropdown {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close-dropdown:hover {
  background: #e9ecef;
  color: #495057;
}

.no-students {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.student-list {
  padding: 0.5rem 0;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  gap: 0.75rem;
}

.student-item:hover {
  background: #f8f9fa;
}

.student-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.student-info strong {
  color: #2c3e50;
  font-size: 0.875rem;
}

.student-info small {
  color: #6c757d;
  font-size: 0.75rem;
}

.selected-students {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.selected-students h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #495057;
  font-weight: 600;
}

.selected-student-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.student-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 20px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: #004085;
}

.btn-remove-student {
  background: none;
  border: none;
  color: #004085;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn-remove-student:hover {
  background: #b3d9ff;
}

.form-help {
  display: block;
  margin-top: 0.5rem;
  color: #6c757d;
  font-size: 0.75rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>


