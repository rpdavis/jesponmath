import { ref, computed } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/composables/usePermissions'
import type { Student } from '@/types/users'

export type AssignmentMode = 'template' | 'all' | 'class' | 'individual'

export interface ClassGroup {
  key: string
  label: string
  count: number
}

export function useStudentAssignment() {
  const authStore = useAuthStore()
  const permissions = usePermissions()

  // State
  const availableStudents = ref<Student[]>([])
  const loadingStudents = ref(false)
  const assignmentMode = ref<AssignmentMode>('template')
  const selectedStudents = ref<string[]>([])
  const selectedClasses = ref<string[]>([])
  const selectedQuarter = ref('auto')
  const studentSearchQuery = ref('')

  // Computed
  const filteredStudents = computed(() => {
    if (!studentSearchQuery.value) return availableStudents.value

    const query = studentSearchQuery.value.toLowerCase()
    return availableStudents.value.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
      return fullName.includes(query)
    })
  })

  const uniqueClasses = computed(() => {
    const classMap = new Map<string, ClassGroup>()

    availableStudents.value.forEach((student) => {
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
  const loadStudents = async () => {
    loadingStudents.value = true
    try {
      const studentsQuery = permissions.isAdmin.value
        ? query(collection(db, 'students'))
        : query(
            collection(db, 'students'),
            where('assignedTeacher', '==', authStore.currentUser?.uid),
          )

      const snapshot = await getDocs(studentsQuery)
      availableStudents.value = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          uid: doc.id,
        } as unknown as Student
      })

      console.log(`✅ Loaded ${availableStudents.value.length} students`)
    } catch (error) {
      console.error('❌ Error loading students:', error)
      availableStudents.value = []
    } finally {
      loadingStudents.value = false
    }
  }

  const updateStudentsByClass = () => {
    if (assignmentMode.value !== 'class') return

    const studentsInSelectedClasses = availableStudents.value
      .filter((student) => {
        const className = student.className || student.section || 'No Class'
        const period = student.period || 'No Period'
        const key = `${className}-${period}`
        return selectedClasses.value.includes(key)
      })
      .map((s) => s.uid)

    selectedStudents.value = studentsInSelectedClasses
  }

  const getSelectedStudentsCount = () => {
    if (assignmentMode.value === 'template') {
      return 0
    } else if (assignmentMode.value === 'all') {
      return availableStudents.value.length
    } else {
      return selectedStudents.value.length
    }
  }

  const getAssignmentSummaryText = () => {
    if (assignmentMode.value === 'template') {
      return 'Creating a template - no students assigned yet'
    } else if (assignmentMode.value === 'all') {
      return 'All your students will receive this assessment'
    } else if (assignmentMode.value === 'class') {
      return `Students in ${selectedClasses.value.length} selected class(es)`
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

  const selectAllStudents = () => {
    selectedStudents.value = availableStudents.value.map((s) => s.uid)
  }

  const clearSelection = () => {
    selectedStudents.value = []
    selectedClasses.value = []
  }

  // Handle assignment mode changes
  const onAssignmentModeChange = () => {
    clearSelection()

    if (assignmentMode.value === 'all') {
      selectAllStudents()
    }
  }

  return {
    // State
    availableStudents,
    loadingStudents,
    assignmentMode,
    selectedStudents,
    selectedClasses,
    selectedQuarter,
    studentSearchQuery,

    // Computed
    filteredStudents,
    uniqueClasses,

    // Methods
    loadStudents,
    updateStudentsByClass,
    getSelectedStudentsCount,
    getAssignmentSummaryText,
    getStudentClassName,
    getStudentPeriod,
    selectAllStudents,
    clearSelection,
    onAssignmentModeChange,
  }
}

// Export types for better TypeScript support
export type UseStudentAssignmentReturn = ReturnType<typeof useStudentAssignment>
