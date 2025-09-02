import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { areAnswersEquivalent } from '@/utils/answerUtils';
import { checkFractionAnswer } from '@/utils/fractionUtils';
import type { Assessment, AssessmentResult, AssessmentResponse } from '@/types/iep';

export interface MigrationResult {
  totalResults: number;
  updatedResults: number;
  scoreChanges: Array<{
    studentEmail: string;
    studentUid: string;
    oldScore: number;
    newScore: number;
    oldPercentage: number;
    newPercentage: number;
    questionsChanged: Array<{
      questionId: string;
      questionText: string;
      oldPoints: number;
      newPoints: number;
      reason: string;
    }>;
  }>;
}

/**
 * Get all existing results for an assessment
 */
export const getExistingResults = async (assessmentId: string): Promise<AssessmentResult[]> => {
  try {
    const q = query(
      collection(db, 'assessmentResults'),
      where('assessmentId', '==', assessmentId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AssessmentResult));
  } catch (error) {
    console.error('Error getting existing results:', error);
    throw error;
  }
};

/**
 * Re-grade a single question response with updated assessment data
 */
const regradeQuestionResponse = (
  response: AssessmentResponse, 
  updatedQuestion: any
): { newPoints: number; wasChanged: boolean; reason: string } => {
  const userAnswer = response.studentAnswer;
  let isCorrect = false;
  let reason = '';

  // Handle different question types for answer comparison
  if (updatedQuestion.questionType === 'multiple-choice') {
    const selectedOptionText = updatedQuestion.options?.[parseInt(userAnswer as string)] || '';
    isCorrect = userAnswer === updatedQuestion.correctAnswer || selectedOptionText === updatedQuestion.correctAnswer;
  } else if (updatedQuestion.questionType === 'fraction') {
    if (updatedQuestion.correctFractionAnswers && typeof userAnswer === 'object') {
      isCorrect = checkFractionAnswer(userAnswer as any, updatedQuestion.correctFractionAnswers);
    } else if (updatedQuestion.correctFractionAnswers && typeof userAnswer === 'string') {
      isCorrect = checkFractionAnswer(userAnswer, updatedQuestion.correctFractionAnswers);
    }
  } else {
    // For other question types, use enhanced comparison
    if (typeof userAnswer === 'string' && typeof updatedQuestion.correctAnswer === 'string') {
      isCorrect = areAnswersEquivalent(userAnswer, updatedQuestion.correctAnswer);
      
      // Also check acceptable answers
      if (!isCorrect && updatedQuestion.acceptableAnswers && updatedQuestion.acceptableAnswers.length > 0) {
        for (const acceptableAnswer of updatedQuestion.acceptableAnswers) {
          if (areAnswersEquivalent(userAnswer, acceptableAnswer)) {
            isCorrect = true;
            break;
          }
        }
      }
    } else {
      isCorrect = userAnswer?.toString().trim().toLowerCase() === updatedQuestion.correctAnswer?.toString().trim().toLowerCase();
    }
  }

  const newPoints = isCorrect ? updatedQuestion.points : 0;
  const oldPoints = response.pointsEarned || 0;
  const wasChanged = newPoints !== oldPoints;

  if (wasChanged) {
    if (newPoints > oldPoints) {
      reason = isCorrect ? 'Answer key updated - now correct' : 'Points increased';
    } else {
      reason = !isCorrect ? 'Answer key updated - now incorrect' : 'Points decreased';
    }
  }

  return { newPoints, wasChanged, reason };
};

/**
 * Migrate existing assessment results to match updated assessment
 */
export const migrateAssessmentResults = async (
  assessmentId: string, 
  updatedAssessment: Assessment,
  performedBy: string
): Promise<MigrationResult> => {
  try {
    console.log('🔄 Starting assessment result migration for:', assessmentId);
    
    // Get all existing results
    const existingResults = await getExistingResults(assessmentId);
    
    if (existingResults.length === 0) {
      return {
        totalResults: 0,
        updatedResults: 0,
        scoreChanges: []
      };
    }

    const batch = writeBatch(db);
    const scoreChanges: MigrationResult['scoreChanges'] = [];

    // Process each result
    for (const result of existingResults) {
      let hasChanges = false;
      let newScore = 0;
      const questionsChanged: any[] = [];

      // Update each response based on new assessment data
      const updatedResponses = result.responses?.map(response => {
        const updatedQuestion = updatedAssessment.questions?.find(q => q.id === response.questionId);
        
        if (!updatedQuestion) {
          // Question was removed - keep original response but note it
          questionsChanged.push({
            questionId: response.questionId,
            questionText: 'Question removed from assessment',
            oldPoints: response.pointsEarned || 0,
            newPoints: response.pointsEarned || 0,
            reason: 'Question removed from updated assessment'
          });
          return response;
        }

        const gradeResult = regradeQuestionResponse(response, updatedQuestion);
        
        if (gradeResult.wasChanged) {
          hasChanges = true;
          questionsChanged.push({
            questionId: response.questionId,
            questionText: updatedQuestion.questionText?.substring(0, 50) + '...' || 'Question text',
            oldPoints: response.pointsEarned || 0,
            newPoints: gradeResult.newPoints,
            reason: gradeResult.reason
          });
        }

        newScore += gradeResult.newPoints;

        return {
          ...response,
          pointsEarned: gradeResult.newPoints,
          isCorrect: gradeResult.newPoints > 0,
          // Track that this was re-graded
          regraded: gradeResult.wasChanged,
          regradedAt: gradeResult.wasChanged ? new Date() : response.regradedAt,
          regradedBy: gradeResult.wasChanged ? performedBy : response.regradedBy
        };
      }) || [];

      // Calculate new totals
      const newTotalPoints = updatedAssessment.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
      const newPercentage = newTotalPoints > 0 ? Math.round((newScore / newTotalPoints) * 100) : 0;

      // Only update if there were changes
      if (hasChanges || newTotalPoints !== result.totalPoints) {
        const oldScore = result.score || 0;
        const oldPercentage = result.percentage || 0;

        // Add to batch update
        const resultRef = doc(db, 'assessmentResults', result.id);
        batch.update(resultRef, {
          responses: updatedResponses,
          score: newScore,
          totalPoints: newTotalPoints,
          percentage: newPercentage,
          migratedAt: serverTimestamp(),
          migratedBy: performedBy,
          migrationReason: 'Assessment updated - results re-graded'
        });

        // Track the change
        if (questionsChanged.length > 0 || newScore !== oldScore) {
          scoreChanges.push({
            studentEmail: result.studentEmail || 'Unknown',
            studentUid: result.studentUid || result.studentSeisId || '',
            oldScore,
            newScore,
            oldPercentage,
            newPercentage,
            questionsChanged
          });
        }
      }
    }

    // Commit all changes
    if (scoreChanges.length > 0) {
      await batch.commit();
      console.log('✅ Migration completed:', scoreChanges.length, 'results updated');
    }

    return {
      totalResults: existingResults.length,
      updatedResults: scoreChanges.length,
      scoreChanges
    };

  } catch (error) {
    console.error('Error migrating assessment results:', error);
    throw error;
  }
};

/**
 * Check if an assessment has any existing results
 */
export const hasExistingResults = async (assessmentId: string): Promise<{
  hasResults: boolean;
  resultCount: number;
  studentEmails: string[];
}> => {
  try {
    const results = await getExistingResults(assessmentId);
    const studentEmails = results
      .map(r => r.studentEmail || 'Unknown')
      .filter((email, index, arr) => arr.indexOf(email) === index); // Unique emails

    return {
      hasResults: results.length > 0,
      resultCount: results.length,
      studentEmails
    };
  } catch (error) {
    console.error('Error checking existing results:', error);
    return {
      hasResults: false,
      resultCount: 0,
      studentEmails: []
    };
  }
};
