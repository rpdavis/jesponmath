<template>
  <div v-if="show" class="bulk-print-dialog-overlay" @click.self="closeDialog">
    <div class="bulk-print-dialog">
      <div class="dialog-header">
        <h2>🖨️ Print Bulk Student Summaries</h2>
        <button @click="closeDialog" class="close-button" title="Close">×</button>
      </div>

      <div class="dialog-content">
        <div class="selection-section">
          <label class="section-label">📅 Filter by Quarter:</label>
          <select v-model="selectedPeriodId" class="period-select">
            <option value="">All Quarters</option>
            <option
              v-for="period in periodsWithStatus"
              :key="period.id"
              :value="period.id"
            >
              {{ period.name }} {{ period.isActive ? '(Current)' : period.isFuture ? '(Future)' : '(Past)' }}
            </option>
          </select>
        </div>

        <div class="selection-section">
          <label class="section-label">Select Class:</label>
          <select v-model="selectedClassForPrint" class="class-select">
            <option value="">All Classes</option>
            <option v-for="className in availableClasses" :key="className" :value="className">
              {{ className }}
            </option>
          </select>
        </div>

        <div class="students-preview">
          <p class="preview-label">
            Students to print: <strong>{{ filteredStudentsForPrint.length }}</strong>
          </p>
          <div v-if="filteredStudentsForPrint.length > 0" class="students-list">
            <div
              v-for="student in filteredStudentsForPrint"
              :key="student.uid"
              class="student-preview-item"
            >
              {{ student.lastName }}, {{ student.firstName }}
              <span class="student-class-info">
                ({{ student.courseName || student.className }} - Period {{ student.section || student.period }})
              </span>
            </div>
          </div>
          <div v-else class="no-students">
            No students match the selected filters.
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="closeDialog" class="cancel-button">Cancel</button>
        <button
          @click="printBulkSummaries"
          :disabled="filteredStudentsForPrint.length === 0 || printing"
          class="print-button"
        >
          {{ printing ? '🖨️ Printing...' : `🖨️ Print ${filteredStudentsForPrint.length} Summaries` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Student } from '@/types/users'
import type { AcademicPeriod } from '@/types/academicPeriods'

const props = defineProps<{
  show: boolean
  students: Student[]
  periodsWithStatus: AcademicPeriod[]
}>()

const emit = defineEmits<{
  close: []
  print: [studentUids: string[], periodId: string | null]
}>()


const selectedClassForPrint = ref('')
const selectedPeriodForPrint = ref('')
const selectedPeriodId = ref('')
const printing = ref(false)

const availableClasses = computed(() => {
  const classes = [...new Set(props.students.map(s => s.courseName || s.className).filter(Boolean))]
  return classes.sort()
})

const availablePeriods = computed(() => {
  const periods = [...new Set(props.students.map(s => s.section || s.period).filter(Boolean))]
  return periods.sort()
})

const filteredStudentsForPrint = computed(() => {
  return props.students.filter(student => {
    const studentClass = student.courseName || student.className
    const studentPeriod = student.section || student.period

    if (selectedClassForPrint.value && studentClass !== selectedClassForPrint.value) return false
    if (selectedPeriodForPrint.value && studentPeriod !== selectedPeriodForPrint.value) return false
    return true
  })
})

const closeDialog = () => {
  if (!printing.value) {
    emit('close')
  }
}

const printBulkSummaries = async () => {
  if (filteredStudentsForPrint.value.length === 0) return

  // Prevent multiple clicks
  if (printing.value) {
    console.warn('Print already in progress, ignoring duplicate click');
    return;
  }

  printing.value = true
  const studentUids = filteredStudentsForPrint.value.map(s => s.uid)

  console.log('Emitting print event for', studentUids.length, 'students', 'periodId:', selectedPeriodId.value || 'null');
  emit('print', studentUids, selectedPeriodId.value || null)

  // Close dialog immediately after emitting - parent will handle the printing
  // This prevents the user from clicking multiple times
  setTimeout(() => {
    emit('close');
  }, 100);
}

watch(() => props.show, (newVal) => {
  console.log('BulkPrintSummaryDialog show changed:', newVal, 'students:', props.students.length)
  if (newVal) {
    // Reset selections when dialog opens
    selectedClassForPrint.value = ''
    selectedPeriodId.value = ''
    printing.value = false
  }
})
</script>

<style scoped>
.bulk-print-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.bulk-print-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
}

.dialog-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.selection-section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: block;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.class-select,
.period-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  color: #333;
  cursor: pointer;
  transition: border-color 0.2s;
}

.class-select:hover,
.period-select:hover {
  border-color: #3b82f6;
}

.class-select:focus,
.period-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.students-preview {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.preview-label {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  color: #555;
}

.students-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.student-preview-item {
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #333;
  border: 1px solid #e5e7eb;
}

.student-class-info {
  color: #666;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.no-students {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-style: italic;
}

.dialog-footer {
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button,
.print-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: #f3f4f6;
  color: #555;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.print-button {
  background: #3b82f6;
  color: white;
}

.print-button:hover:not(:disabled) {
  background: #2563eb;
}

.print-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
