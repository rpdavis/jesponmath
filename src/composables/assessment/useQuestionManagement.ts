import { ref, computed, type Ref } from 'vue'
import type { AssessmentQuestion } from '@/types/iep'

export function useQuestionManagement(questionsRef: Ref<AssessmentQuestion[]>) {
  const editingQuestionId = ref<string | null>(null)
  const expandedQuestionIds = ref<Set<string>>(new Set())

  // Computed
  const questionCount = computed(() => questionsRef.value.length)

  const totalPoints = computed(() => {
    return questionsRef.value.reduce(
      (sum: number, q: AssessmentQuestion) => sum + (q.points || 0),
      0,
    )
  })

  // Methods
  const addQuestion = (type: string = 'multiple-choice') => {
    const newQuestion: Partial<AssessmentQuestion> = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionText: '',
      questionType: type as any,
      correctAnswer: '',
      points: 1,
      options: type === 'multiple-choice' || type === 'checkbox' ? ['', '', '', ''] : undefined,
      explanation: '',
      hints: [],
    }

    questionsRef.value.push(newQuestion as AssessmentQuestion)
    editingQuestionId.value = newQuestion.id!
    expandedQuestionIds.value.add(newQuestion.id!)

    return newQuestion.id
  }

  const duplicateQuestion = (questionId: string) => {
    const questionIndex = questionsRef.value.findIndex(
      (q: AssessmentQuestion) => q.id === questionId,
    )
    if (questionIndex === -1) return

    const originalQuestion = questionsRef.value[questionIndex]
    const duplicatedQuestion = {
      ...JSON.parse(JSON.stringify(originalQuestion)),
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionText: `${originalQuestion.questionText} (Copy)`,
    }

    questionsRef.value.splice(questionIndex + 1, 0, duplicatedQuestion)
    editingQuestionId.value = duplicatedQuestion.id
    expandedQuestionIds.value.add(duplicatedQuestion.id)

    return duplicatedQuestion.id
  }

  const deleteQuestion = (questionId: string) => {
    const index = questionsRef.value.findIndex((q: AssessmentQuestion) => q.id === questionId)
    if (index !== -1) {
      questionsRef.value.splice(index, 1)
      expandedQuestionIds.value.delete(questionId)
      if (editingQuestionId.value === questionId) {
        editingQuestionId.value = null
      }
    }
  }

  const moveQuestionUp = (questionId: string) => {
    const index = questionsRef.value.findIndex((q: AssessmentQuestion) => q.id === questionId)
    if (index > 0) {
      const temp = questionsRef.value[index]
      questionsRef.value[index] = questionsRef.value[index - 1]
      questionsRef.value[index - 1] = temp
    }
  }

  const moveQuestionDown = (questionId: string) => {
    const index = questionsRef.value.findIndex((q: AssessmentQuestion) => q.id === questionId)
    if (index < questionsRef.value.length - 1) {
      const temp = questionsRef.value[index]
      questionsRef.value[index] = questionsRef.value[index + 1]
      questionsRef.value[index + 1] = temp
    }
  }

  const toggleQuestionExpanded = (questionId: string) => {
    if (expandedQuestionIds.value.has(questionId)) {
      expandedQuestionIds.value.delete(questionId)
    } else {
      expandedQuestionIds.value.add(questionId)
    }
  }

  const isQuestionExpanded = (questionId: string) => {
    return expandedQuestionIds.value.has(questionId)
  }

  const expandAllQuestions = () => {
    questionsRef.value.forEach((q: AssessmentQuestion) => {
      expandedQuestionIds.value.add(q.id)
    })
  }

  const collapseAllQuestions = () => {
    expandedQuestionIds.value.clear()
  }

  const getQuestionNumber = (questionId: string) => {
    return questionsRef.value.findIndex((q: AssessmentQuestion) => q.id === questionId) + 1
  }

  return {
    // State
    editingQuestionId,
    expandedQuestionIds,

    // Computed
    questionCount,
    totalPoints,

    // Methods
    addQuestion,
    duplicateQuestion,
    deleteQuestion,
    moveQuestionUp,
    moveQuestionDown,
    toggleQuestionExpanded,
    isQuestionExpanded,
    expandAllQuestions,
    collapseAllQuestions,
    getQuestionNumber,
  }
}
