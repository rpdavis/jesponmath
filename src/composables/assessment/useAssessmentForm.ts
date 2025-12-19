import { ref, computed, type Ref } from 'vue'
import { serverTimestamp } from 'firebase/firestore'
import type { Assessment } from '@/types/iep'

export interface AssessmentFormData extends Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> {
  goalId: string
  createdBy: string
  title: string
  description: string
  standard?: string
  gradeLevel: number
  category: 'HW' | 'Assign' | 'ESA' | 'SA' | 'PA' | 'Other'
  academicPeriod?: string
  questions: any[]
  totalPoints: number
  timeLimit?: number
  instructions: string
  accommodations: string[]
  allowFileUpload?: boolean
  requireFileUpload?: boolean
  fileUploadInstructions?: string
  maxFileSize?: number
  allowedFileTypes?: string[]
  photoOrientation?: 'portrait' | 'landscape'
  requireMultiplePages?: boolean
  requiredPageCount?: number
  pageLabels?: string[]
  allowExtraPages?: boolean
  allowRetakes?: boolean
  maxRetakes?: number
  retakeMode?: 'separate' | 'combined'
  retakeInstructions?: string
  assignDate?: any
  dueDate?: any
}

export function useAssessmentForm(initialData?: Partial<Assessment>) {
  const assessment = ref<AssessmentFormData>({
    goalId: initialData?.goalId || '',
    createdBy: initialData?.createdBy || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    standard: initialData?.standard || '',
    gradeLevel: initialData?.gradeLevel || 7,
    category: initialData?.category || 'HW',
    academicPeriod: initialData?.academicPeriod || undefined,
    questions: initialData?.questions || [],
    totalPoints: initialData?.totalPoints || 0,
    timeLimit: initialData?.timeLimit || undefined,
    instructions: initialData?.instructions || '',
    accommodations: initialData?.accommodations || [],

    // File upload settings
    allowFileUpload: initialData?.allowFileUpload || false,
    requireFileUpload: initialData?.requireFileUpload || false,
    fileUploadInstructions: initialData?.fileUploadInstructions || '',
    maxFileSize: initialData?.maxFileSize || 10,
    allowedFileTypes: initialData?.allowedFileTypes || ['jpg', 'jpeg', 'png', 'pdf'],
    photoOrientation: initialData?.photoOrientation || 'portrait',
    requireMultiplePages: initialData?.requireMultiplePages || false,
    requiredPageCount: initialData?.requiredPageCount || 1,
    pageLabels: initialData?.pageLabels || [],
    allowExtraPages: initialData?.allowExtraPages || false,

    // Retake settings
    allowRetakes: initialData?.allowRetakes || false,
    maxRetakes: initialData?.maxRetakes || 0,
    retakeMode: initialData?.retakeMode || 'separate',
    retakeInstructions: initialData?.retakeInstructions || '',

    // Assignment dates
    assignDate: initialData?.assignDate || undefined,
    dueDate: initialData?.dueDate || undefined,
  })

  const noTimeLimit = ref(!initialData?.timeLimit)
  const selectedStandard = ref(initialData?.standard || '')
  const assignDateInput = ref('')
  const dueDateInput = ref('')

  // Computed properties
  const totalPoints = computed(() => {
    return assessment.value.questions.reduce((sum, q) => sum + (q.points || 0), 0)
  })

  const isValid = computed(() => {
    return Boolean(
      assessment.value.title &&
        assessment.value.description &&
        assessment.value.gradeLevel &&
        assessment.value.category &&
        assessment.value.questions.length > 0,
    )
  })

  // Methods
  const updateTotalPoints = () => {
    assessment.value.totalPoints = totalPoints.value
  }

  const toggleTimeLimit = () => {
    if (noTimeLimit.value) {
      assessment.value.timeLimit = undefined
    }
  }

  const updateAssessmentStandard = (standard: string) => {
    assessment.value.standard = standard
    selectedStandard.value = standard
  }

  const updateAssignDate = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.value) {
      assessment.value.assignDate = new Date(input.value)
    } else {
      assessment.value.assignDate = undefined
    }
  }

  const updateDueDate = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.value) {
      assessment.value.dueDate = new Date(input.value)
    } else {
      assessment.value.dueDate = undefined
    }
  }

  return {
    assessment,
    noTimeLimit,
    selectedStandard,
    assignDateInput,
    dueDateInput,
    totalPoints,
    isValid,
    updateTotalPoints,
    toggleTimeLimit,
    updateAssessmentStandard,
    updateAssignDate,
    updateDueDate,
  }
}
