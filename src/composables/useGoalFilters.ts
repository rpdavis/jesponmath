// Goal Filters Composable
// Handles filtering and searching goals

import { ref, computed, type Ref } from 'vue'
import type { Goal } from '@/types/iep'

export function useGoalFilters(goals: Ref<Goal[]>) {
  // Filter state
  const selectedStudentUid = ref('')
  const selectedStatus = ref('')
  const selectedSubject = ref('')
  const searchQuery = ref('')

  // Computed filters
  const filteredGoals = computed(() => {
    let filtered = [...goals.value]

    // Filter by student
    if (selectedStudentUid.value) {
      filtered = filtered.filter((goal) => {
        if (goal.assignedStudents?.length) {
          return goal.assignedStudents.includes(selectedStudentUid.value)
        }
        return goal.studentUid === selectedStudentUid.value
      })
    }

    // Filter by status
    if (selectedStatus.value) {
      if (selectedStatus.value === 'active') {
        filtered = filtered.filter((g) => g.isActive && !g.isMet && !g.isArchived)
      } else if (selectedStatus.value === 'met') {
        filtered = filtered.filter((g) => g.isMet)
      } else if (selectedStatus.value === 'archived') {
        filtered = filtered.filter((g) => g.isArchived)
      }
    }

    // Filter by subject area
    if (selectedSubject.value) {
      filtered = filtered.filter((goal) => {
        const area = goal.areaOfNeed?.toLowerCase() || ''
        if (selectedSubject.value === 'math') {
          return area.includes('math') || area.includes('calculation')
        } else if (selectedSubject.value === 'ela') {
          return (
            area.includes('reading') ||
            area.includes('comprehension') ||
            area.includes('ela') ||
            area.includes('writing')
          )
        }
        return true
      })
    }

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        (goal) =>
          goal.goalTitle?.toLowerCase().includes(query) ||
          goal.areaOfNeed?.toLowerCase().includes(query) ||
          goal.goalText?.toLowerCase().includes(query) ||
          goal.baseline?.toLowerCase().includes(query),
      )
    }

    return filtered
  })

  const activeGoals = computed(() =>
    goals.value.filter((g) => g.isActive && !g.isMet && !g.isArchived),
  )

  // Utility function to get subject area from goal
  const getSubjectArea = (goal: Goal): 'math' | 'ela' | 'other' => {
    const area = goal.areaOfNeed?.toLowerCase() || ''
    if (area.includes('math') || area.includes('calculation')) return 'math'
    if (area.includes('reading') || area.includes('comprehension') || area.includes('ela'))
      return 'ela'
    if (area.includes('writing')) return 'ela'
    return 'other'
  }

  // Reset filters
  const resetFilters = () => {
    selectedStudentUid.value = ''
    selectedStatus.value = ''
    selectedSubject.value = ''
    searchQuery.value = ''
  }

  return {
    // State
    selectedStudentUid,
    selectedStatus,
    selectedSubject,
    searchQuery,

    // Computed
    filteredGoals,
    activeGoals,

    // Methods
    getSubjectArea,
    resetFilters,
  }
}











