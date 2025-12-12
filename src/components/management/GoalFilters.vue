<template>
  <div class="filters-section">
    <div class="filter-group">
      <label for="studentFilter">Student:</label>
      <select
        id="studentFilter"
        :value="selectedStudentUid"
        @change="(e) => $emit('update:selectedStudentUid', (e.target as HTMLSelectElement).value)"
        class="form-select"
      >
        <option value="">All Students</option>
        <option v-for="student in students" :key="student.uid" :value="student.uid">
          {{ student.firstName }} {{ student.lastName }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label for="statusFilter">Status:</label>
      <select
        id="statusFilter"
        :value="selectedStatus"
        @change="(e) => $emit('update:selectedStatus', (e.target as HTMLSelectElement).value)"
        class="form-select"
      >
        <option value="">All Goals</option>
        <option value="active">Active Goals</option>
        <option value="met">Goals Met</option>
        <option value="archived">Archived Goals</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="subjectFilter">Subject Area:</label>
      <select
        id="subjectFilter"
        :value="selectedSubject"
        @change="(e) => $emit('update:selectedSubject', (e.target as HTMLSelectElement).value)"
        class="form-select"
      >
        <option value="">All Subjects</option>
        <option value="math">Math</option>
        <option value="ela">ELA</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="searchQuery">Search:</label>
      <input
        id="searchQuery"
        :value="searchQuery"
        @input="(e) => $emit('update:searchQuery', (e.target as HTMLInputElement).value)"
        type="text"
        placeholder="Search goals..."
        class="form-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student } from '@/types/users'

defineProps<{
  students: Student[]
  selectedStudentUid: string
  selectedStatus: string
  selectedSubject: string
  searchQuery: string
}>()

defineEmits<{
  'update:selectedStudentUid': [value: string]
  'update:selectedStatus': [value: string]
  'update:selectedSubject': [value: string]
  'update:searchQuery': [value: string]
}>()
</script>

<style scoped>
.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 200px;
}

.filter-group label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.form-select,
.form-input {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}
</style>





