// Assessment Generation Composable
// Handles AI-powered assessment generation from goals

import { ref, type Ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { createAssessment } from '@/firebase/iepServices'
import { assignAssessmentToGoal } from '@/firebase/goalServices'
import { generateQuestionForGoal } from '@/services/goalQuestionGenerator'
import type { Goal, AssessmentQuestion } from '@/types/iep'

// Extended question type for preview (includes editing fields)
export interface PreviewQuestion extends AssessmentQuestion {
  acceptableAnswersString?: string
  _source?: 'template' | 'ai' | 'ai-with-template-reference' | 'fallback'
  _aiError?: string
}

export interface PreviewAssessment {
  title: string
  description: string
  instructions?: string
  questions: PreviewQuestion[]
  totalPoints: number
}

export function useAssessmentGeneration(
  getSubjectArea?: (goal: Goal) => 'math' | 'ela' | 'other',
  loadData?: () => Promise<void>,
) {
  const authStore = useAuthStore()

  // State
  const showAssessmentPreview = ref(false)
  const previewAssessments = ref<PreviewAssessment[]>([])
  const showSingleQuestionPreview = ref(false)
  const singlePreviewQuestion = ref<PreviewQuestion | null>(null)
  const isGeneratingRemaining = ref(false)
  const isGenerating = ref(false)
  const currentGoalForGeneration = ref<Goal | null>(null)
  const previewGoal = ref<Goal | null>(null)
  const generationMethod = ref<'template' | 'ai-gemini' | 'hybrid'>('hybrid')
  const geminiApiKey = ref('')
  const difficultyLevel = ref<'easy' | 'medium' | 'hard'>('medium')
  const showConfirmationPreview = ref(false)
  const generatedAssessmentsForPreview = ref<PreviewAssessment[]>([])
  const saving = ref(false)

  // Utility Functions
  const generateAssessmentDescription = (goal: Goal, subject: 'math' | 'ela' | 'other'): string => {
    const goalText = goal.goalText.toLowerCase()
    const goalTitle = goal.goalTitle.toLowerCase()
    const areaOfNeed = goal.areaOfNeed

    if (subject === 'math') {
      // Two-step equations
      if (goalText.includes('two-step') || goalText.includes('two step')) {
        return 'This assessment measures the ability to solve two-step equations using inverse operations.'
      }
      // Multi-step equations
      if (goalText.includes('multi-step') || goalText.includes('multi step')) {
        return 'This assessment measures the ability to solve multi-step equations using multiple inverse operations.'
      }
      // Solve equations (general)
      if (goalText.includes('solve') && goalText.includes('equation')) {
        return 'This assessment measures the ability to solve linear equations using algebraic methods.'
      }
      // Evaluate expressions
      if (
        goalText.includes('evaluate') &&
        (goalText.includes('expression') || goalText.includes('input value'))
      ) {
        return 'This assessment measures the ability to evaluate algebraic expressions by substituting values for variables.'
      }
      // Numerical expressions
      if (goalText.includes('numerical expression')) {
        return 'This assessment measures the ability to write and evaluate numerical expressions.'
      }
      // Algebraic expressions
      if (goalText.includes('algebraic expression')) {
        return 'This assessment measures the ability to write and work with algebraic expressions.'
      }
      // Word problems with equations
      if (goalText.includes('word problem') && goalText.includes('equation')) {
        return 'This assessment measures the ability to solve word problems by writing and solving equations.'
      }
      // Word problems (general)
      if (goalText.includes('word problem') || goalText.includes('story problem')) {
        return 'This assessment measures the ability to solve mathematical word problems using appropriate strategies.'
      }
      // Fractions
      if (goalText.includes('fraction')) {
        if (goalText.includes('add') || goalText.includes('addition')) {
          return 'This assessment measures the ability to add fractions with like and unlike denominators.'
        }
        if (goalText.includes('subtract') || goalText.includes('subtraction')) {
          return 'This assessment measures the ability to subtract fractions with like and unlike denominators.'
        }
        if (goalText.includes('multiply') || goalText.includes('multiplication')) {
          return 'This assessment measures the ability to multiply fractions.'
        }
        if (goalText.includes('divide') || goalText.includes('division')) {
          return 'This assessment measures the ability to divide fractions.'
        }
        if (goalText.includes('compare')) {
          return 'This assessment measures the ability to compare fractions using various strategies.'
        }
        return 'This assessment measures fraction skills including operations, comparisons, and problem-solving.'
      }
      // Decimals
      if (goalText.includes('decimal')) {
        if (goalText.includes('add') || goalText.includes('addition')) {
          return 'This assessment measures the ability to add decimals.'
        }
        if (goalText.includes('subtract') || goalText.includes('subtraction')) {
          return 'This assessment measures the ability to subtract decimals.'
        }
        if (goalText.includes('multiply') || goalText.includes('multiplication')) {
          return 'This assessment measures the ability to multiply decimals.'
        }
        if (goalText.includes('divide') || goalText.includes('division')) {
          return 'This assessment measures the ability to divide decimals.'
        }
        return 'This assessment measures decimal operations and problem-solving skills.'
      }
      // Multiplication
      if (goalText.includes('multiplication') || goalText.includes('multiply')) {
        return 'This assessment measures multiplication skills with multi-digit numbers.'
      }
      // Division
      if (goalText.includes('division') || goalText.includes('divide')) {
        return 'This assessment measures division skills with multi-digit numbers.'
      }
      // Addition
      if (goalText.includes('addition') || goalText.includes('add')) {
        return 'This assessment measures addition skills, including regrouping with multi-digit numbers.'
      }
      // Subtraction
      if (goalText.includes('subtraction') || goalText.includes('subtract')) {
        return 'This assessment measures subtraction skills, including regrouping with multi-digit numbers.'
      }
      // Model/represent problems
      if (goalText.includes('model') || goalText.includes('represent')) {
        return 'This assessment measures the ability to model mathematical situations using equations, expressions, or visual representations.'
      }
      // Default math description
      return `This assessment measures skills in ${areaOfNeed} as described in the IEP goal.`
    } else if (subject === 'ela') {
      // Reading comprehension
      if (goalText.includes('reading comprehension') || goalText.includes('main idea')) {
        return 'This assessment measures reading comprehension and the ability to identify main ideas and supporting details.'
      }
      // Inference
      if (goalText.includes('inference') || goalText.includes('infer')) {
        return 'This assessment measures the ability to make inferences from text using evidence.'
      }
      // Writing
      if (goalText.includes('writing') || goalText.includes('paragraph')) {
        return 'This assessment measures writing skills, including paragraph structure and organization.'
      }
      // Vocabulary
      if (goalText.includes('vocabulary')) {
        return 'This assessment measures vocabulary knowledge and word usage.'
      }
      // Summarizing
      if (goalText.includes('summariz')) {
        return 'This assessment measures the ability to summarize text by identifying key information.'
      }
      // Default ELA description
      return `This assessment measures skills in ${areaOfNeed} as described in the IEP goal.`
    }

    return `This assessment measures progress toward the IEP goal: ${goal.goalTitle}.`
  }

  const detectQuestionType = (questionText: string): 'short-answer' | 'algebra-tiles' => {
    const text = questionText.toLowerCase()
    const algebraTilePatterns = [
      'algebra tile',
      'algebra tiles',
      'use the algebra tile',
      'use algebra tile',
      'use algebra tiles',
      'draw on the image',
      'shown in the image',
      'shown in image',
      'evaluate.*algebra tile',
      'evaluate.*using.*tile',
    ]

    for (const pattern of algebraTilePatterns) {
      if (text.includes(pattern) || new RegExp(pattern).test(text)) {
        console.log(`🔍 Detected algebra tiles question based on pattern: "${pattern}"`)
        return 'algebra-tiles'
      }
    }

    return 'short-answer'
  }

  // Generate questions for goal
  const generateQuestionsForGoal = async (
    goal: Goal,
    approvedQuestion: PreviewQuestion,
  ): Promise<PreviewAssessment[]> => {
    const numberOfQuestions = 5
    const assessments: PreviewAssessment[] = []

    for (let i = 1; i <= 3; i++) {
      const questions: PreviewQuestion[] = []

      // Use the approved question as the first question of the first assessment
      if (i === 1) {
        const cleanedQuestionText =
          typeof approvedQuestion.questionText === 'string'
            ? approvedQuestion.questionText.trim().replace(/^\n+/, '').replace(/\n+$/, '')
            : approvedQuestion.questionText
        const cleanedAnswer =
          typeof approvedQuestion.correctAnswer === 'string'
            ? approvedQuestion.correctAnswer.trim()
            : approvedQuestion.correctAnswer
        questions.push({
          ...approvedQuestion,
          id: 'q1',
          questionText: cleanedQuestionText,
          correctAnswer: cleanedAnswer,
        })
        // Generate remaining questions
        for (let j = 2; j <= numberOfQuestions; j++) {
          const questionData = await generateQuestionForGoal(goal, j, {
            method: generationMethod.value,
            geminiApiKey: geminiApiKey.value,
            difficulty: difficultyLevel.value,
          })
          const altAnswers = questionData.alternativeAnswers || []
          const questionType = detectQuestionType(questionData.question)
          questions.push({
            id: `q${j}`,
            questionText: questionData.question
              ? typeof questionData.question === 'string'
                ? questionData.question
                    .trim()
                    .replace(/^\n+/, '')
                    .replace(/\n+$/, '')
                    .replace(/\\n/g, '\n')
                    .replace(/^\*\s+/, '')
                    .replace(/\n\*\s+/g, '\n• ')
                    .replace(/\n{3,}/g, '\n\n')
                : questionData.question
              : '',
            questionType: questionType,
            points: 1,
            correctAnswer: questionData.answer?.trim() || questionData.answer,
            acceptableAnswers: altAnswers,
            acceptableAnswersString: altAnswers.join(', '),
            _source: questionData.source,
            _aiError: questionData.aiError,
          } as PreviewQuestion)
        }
      } else {
        // Generate questions for other assessments
        for (let j = 1; j <= numberOfQuestions; j++) {
          const questionData = await generateQuestionForGoal(goal, j, {
            method: generationMethod.value,
            geminiApiKey: geminiApiKey.value,
            difficulty: difficultyLevel.value,
          })
          const altAnswers = questionData.alternativeAnswers || []
          const questionType = detectQuestionType(questionData.question)
          questions.push({
            id: `q${j}`,
            questionText: questionData.question
              ? typeof questionData.question === 'string'
                ? questionData.question
                    .trim()
                    .replace(/^\n+/, '')
                    .replace(/\n+$/, '')
                    .replace(/\\n/g, '\n')
                    .replace(/^\*\s+/, '')
                    .replace(/\n\*\s+/g, '\n• ')
                    .replace(/\n{3,}/g, '\n\n')
                : questionData.question
              : '',
            questionType: questionType,
            points: 1,
            correctAnswer: questionData.answer?.trim() || questionData.answer,
            acceptableAnswers: altAnswers,
            acceptableAnswersString: altAnswers.join(', '),
            _source: questionData.source,
            _aiError: questionData.aiError,
          } as PreviewQuestion)
        }
      }

      const subject = getSubjectArea ? getSubjectArea(goal) : 'other'
      assessments.push({
        title: `${goal.goalTitle} - Check #${i}`,
        description: generateAssessmentDescription(goal, subject),
        instructions: 'Complete all questions to the best of your ability.',
        questions: questions,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      })
    }

    return assessments
  }

  // Generate proofread question (single question preview)
  const generateProofreadQuestion = async (goal: Goal) => {
    console.log('generateProofreadQuestion called for goal:', goal.goalTitle)
    isGenerating.value = true
    singlePreviewQuestion.value = null

    try {
      console.log('Calling generateQuestionForGoal with method:', generationMethod.value)
      const questionData = await generateQuestionForGoal(goal, 1, {
        method: generationMethod.value,
        geminiApiKey: geminiApiKey.value,
        difficulty: difficultyLevel.value,
      })

      console.log('Question data received:', questionData)
      const altAnswers = questionData.alternativeAnswers || []
      const questionType = detectQuestionType(questionData.question)
      singlePreviewQuestion.value = {
        id: `q1`,
        questionText: questionData.question,
        questionType: questionType,
        points: 1,
        correctAnswer: questionData.answer,
        acceptableAnswers: altAnswers,
        acceptableAnswersString: altAnswers.join(', '),
        _source: questionData.source,
        _aiError: questionData.aiError,
      } as PreviewQuestion

      showSingleQuestionPreview.value = true
    } catch (error) {
      console.error('Failed to generate single question', error)
      alert(error instanceof Error ? error.message : 'An unknown error occurred.')
    } finally {
      isGenerating.value = false
    }
  }

  // Generate assessments for goal (entry point)
  const generateAssessmentsForGoal = async (goalId: string, goals: Goal[]) => {
    console.log('generateAssessmentsForGoal called with goalId:', goalId)
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) {
      console.error('Goal not found:', goalId)
      alert('Goal not found. Please refresh the page and try again.')
      return
    }

    console.log('Found goal:', goal.goalTitle)
    try {
      isGenerating.value = true
      currentGoalForGeneration.value = goal
      console.log('Calling generateProofreadQuestion...')
      await generateProofreadQuestion(goal)
      console.log('generateProofreadQuestion completed')
    } catch (error) {
      console.error('Error generating proofread question:', error)
      alert(
        `Failed to generate a preview question: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      isGenerating.value = false
    }
  }

  // Handle approval of single question
  const handleApproval = async () => {
    if (!currentGoalForGeneration.value || !singlePreviewQuestion.value) return

    showSingleQuestionPreview.value = false
    isGeneratingRemaining.value = true

    try {
      const generatedAssessments = await generateQuestionsForGoal(
        currentGoalForGeneration.value,
        singlePreviewQuestion.value,
      )
      generatedAssessmentsForPreview.value = generatedAssessments
      isGeneratingRemaining.value = false
      showConfirmationPreview.value = true
    } catch (error) {
      console.error('Error generating assessments:', error)
      alert('Failed to generate assessments.')
      isGeneratingRemaining.value = false
    }
  }

  // Update alternative answers from comma-separated string
  const updateAlternativeAnswers = (
    assessment: { questions: PreviewQuestion[] },
    qIndex: number,
  ) => {
    const question = assessment.questions[qIndex]
    if (question.acceptableAnswersString) {
      question.acceptableAnswers = question.acceptableAnswersString
        .split(',')
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0)
    } else {
      question.acceptableAnswers = []
    }
  }

  // Regenerate remaining questions based on edited question
  const regenerateRemainingQuestions = async (
    assessmentIndex: number,
    editedQuestionIndex: number,
  ) => {
    const assessment = previewAssessments.value[assessmentIndex]
    const editedQuestion = assessment.questions[editedQuestionIndex]

    if (!previewGoal.value) return

    try {
      saving.value = true

      const remainingIndices = assessment.questions
        .map((_, i) => i)
        .filter((i) => i !== editedQuestionIndex)

      for (const qIndex of remainingIndices) {
        const questionData = await generateQuestionForGoal(previewGoal.value, qIndex + 1, {
          method: 'hybrid',
          referenceQuestion: {
            question: editedQuestion.questionText,
            answer: editedQuestion.correctAnswer,
            explanation: editedQuestion.explanation,
            alternativeAnswers: editedQuestion.acceptableAnswers || [],
          },
        } as any)

        assessment.questions[qIndex] = {
          ...assessment.questions[qIndex],
          questionText:
            questionData.question?.trim().replace(/^\n+/, '').replace(/\n+$/, '') ||
            questionData.question,
          correctAnswer: questionData.answer?.trim() || questionData.answer,
          acceptableAnswers: questionData.alternativeAnswers || [],
          acceptableAnswersString: (questionData.alternativeAnswers || []).join(', '),
          explanation: questionData.explanation || assessment.questions[qIndex].explanation,
          _source: questionData.source,
          _aiError: questionData.aiError,
        } as PreviewQuestion
      }

      alert('✅ Remaining questions regenerated based on your edits!')
    } catch (error) {
      console.error('Error regenerating questions:', error)
      alert('Error regenerating questions. Please try again.')
    } finally {
      saving.value = false
    }
  }

  // Confirm and create assessments
  const confirmCreateAssessments = async (assessmentsToCreate?: PreviewAssessment[]) => {
    const assessments = assessmentsToCreate || previewAssessments.value
    const goal = currentGoalForGeneration.value || previewGoal.value
    if (!assessments || assessments.length === 0 || !goal) return

    try {
      saving.value = true
      const createdAssessments: string[] = []

      for (const preview of assessments) {
        // Clean up questions: remove preview-only fields
        const cleanedQuestions = preview.questions.map((q: PreviewQuestion): AssessmentQuestion => {
          let acceptableAnswers = q.acceptableAnswers || []
          if (q.acceptableAnswersString) {
            acceptableAnswers = q.acceptableAnswersString
              .split(',')
              .map((a: string) => a.trim())
              .filter((a: string) => a.length > 0)
          }

          const { acceptableAnswersString, _source, _aiError, ...cleanQuestion } = q
          return {
            ...cleanQuestion,
            acceptableAnswers,
          }
        })

        const assessmentData = {
          title: preview.title,
          description: preview.description,
          gradeLevel: goal.gradeLevel ?? 7,
          category: 'PA' as const,
          goalId: goal.id,
          createdBy: authStore.currentUser!.uid,
          questions: cleanedQuestions,
          totalPoints: preview.totalPoints,
          instructions:
            preview.instructions || 'Complete all questions to the best of your ability.',
          accommodations: [],
          allowFileUpload: true,
          requireFileUpload: true,
          fileUploadInstructions:
            'Upload photos of your work for all questions that require it. Make sure your work is clear and legible.',
          allowRetakes: false,
          maxRetakes: 0,
          retakeMode: 'separate' as const,
          retakeInstructions: '',
        }

        const assessmentId = await createAssessment(assessmentData)
        await assignAssessmentToGoal(goal.id, assessmentId)
        createdAssessments.push(assessmentId)
      }

      showAssessmentPreview.value = false
      previewAssessments.value = []
      previewGoal.value = null

      alert(
        `✅ Successfully created ${createdAssessments.length} assessments with 5 questions each!\n\nEach assessment has:\n• 5 questions with answers\n• 5 points total (1 point per question)\n\nYou can now assign them to students or edit the questions.`,
      )
      if (loadData) {
        await loadData()
      }
    } catch (error) {
      console.error('Error creating assessments:', error)
      alert('Error creating assessments. Please try again.')
    } finally {
      saving.value = false
    }
  }

  const confirmAndCreateAssessments = async () => {
    if (!generatedAssessmentsForPreview.value || generatedAssessmentsForPreview.value.length === 0)
      return

    try {
      isGeneratingRemaining.value = true
      await confirmCreateAssessments(generatedAssessmentsForPreview.value)
      showConfirmationPreview.value = false
      generatedAssessmentsForPreview.value = []
      currentGoalForGeneration.value = null
      alert('Successfully created assessments!')
    } catch (error) {
      console.error('Error creating assessments:', error)
      alert('Failed to create assessments.')
    } finally {
      isGeneratingRemaining.value = false
    }
  }

  // Cancel/Close functions
  const cancelPreview = () => {
    showAssessmentPreview.value = false
    previewAssessments.value = []
    previewGoal.value = null
  }

  const cancelConfirmationPreview = () => {
    showConfirmationPreview.value = false
    generatedAssessmentsForPreview.value = []
    currentGoalForGeneration.value = null
  }

  return {
    // State
    showAssessmentPreview,
    previewAssessments,
    showSingleQuestionPreview,
    singlePreviewQuestion,
    isGeneratingRemaining,
    isGenerating,
    currentGoalForGeneration,
    previewGoal,
    generationMethod,
    geminiApiKey,
    difficultyLevel,
    showConfirmationPreview,
    generatedAssessmentsForPreview,
    saving,

    // Methods
    generateAssessmentsForGoal,
    generateProofreadQuestion,
    handleApproval,
    updateAlternativeAnswers,
    regenerateRemainingQuestions,
    confirmCreateAssessments,
    confirmAndCreateAssessments,
    cancelPreview,
    cancelConfirmationPreview,
  }
}









