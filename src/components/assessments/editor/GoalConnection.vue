<template>
  <div class="goal-connection-content">
    <p class="section-description">Connect this progress assessment to an IEP goal for tracking student progress.</p>

    <div class="form-group">
      <label for="goalSelect">Connect to Goal</label>
      <select id="goalSelect" :value="assessment.goalId" @change="emit('update:goalId', ($event.target as HTMLSelectElement).value)" class="form-select">
        <option value="">No goal connection (standalone assessment)</option>
        <option v-for="goal in availableGoals" :key="goal.id" :value="goal.id">
          {{ goal.goalTitle }} - {{ getStudentNames(goal) }} ({{ goal.areaOfNeed }})
        </option>
      </select>
      <small class="form-help">
        Progress assessments can be connected to IEP goals for automatic progress tracking.
        <router-link to="/goals" target="_blank">Manage Goals →</router-link>
      </small>
    </div>

    <div v-if="selectedGoal" class="connected-goal-info">
      <div class="goal-card">
        <h4>📋 Connected Goal Details</h4>
        <div class="goal-details">
          <div class="detail-row">
            <strong>Students:</strong>
            <span>{{ getStudentNames(selectedGoal) }}</span>
          </div>
          <div class="detail-row">
            <strong>Area of Need:</strong> {{ selectedGoal.areaOfNeed }}
          </div>
          <div class="detail-row">
            <strong>Baseline:</strong> {{ selectedGoal.baseline }}
          </div>
          <div class="detail-row">
            <strong>Goal:</strong> {{ selectedGoal.goalText }}
          </div>
          <div v-if="selectedGoal.iepDate" class="detail-row">
            <strong>IEP Date:</strong> {{ formatDate(selectedGoal.iepDate) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AssessmentFormData } from '@/composables/assessment/useAssessmentForm';
import type { Goal } from '@/types/iep';

interface Props {
  assessment: AssessmentFormData;
  availableGoals: Goal[];
}

interface Emits {
  (e: 'update:goalId', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedGoal = computed(() => {
  return props.availableGoals.find(g => g.id === props.assessment.goalId);
});

const getStudentNames = (goal: Goal): string => {
  if (goal.assignedStudents?.length) {
    return `${goal.assignedStudents.length} student(s)`;
  } else if (goal.studentUid) {
    return 'Student assigned';
  }
  return 'No students assigned';
};

const formatDate = (date: any): string => {
  if (!date) return 'N/A';

  try {
    if (date?.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};
</script>

<style scoped>
.goal-connection-content {
  /* Styles moved to parent CollapsibleSection */
}

.section-description {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.connected-goal-info {
  margin-top: 1.5rem;
}

.goal-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #bfdbfe;
}

.goal-card h4 {
  margin: 0 0 1rem 0;
  color: #1e40af;
}

.goal-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  line-height: 1.6;
}

.detail-row strong {
  color: #374151;
  min-width: 120px;
  flex-shrink: 0;
}

.detail-row span {
  color: #6b7280;
}
</style>
