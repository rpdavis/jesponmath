/**
 * Challenge Problem Selection Utility
 * Selects 3-5 challenge problems per session from next level, previous operation, or previous levels
 */

import type { ProblemProgress, OperationType, SubLevel, MathFluencyProgress, ChallengeType } from '@/types/mathFluency'
import { getNextSubLevel, getSubLevelConfig, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import { filterProblemsBySubLevel } from '@/utils/subLevelUtils'
import { sampleRandom } from '@/utils/mathFluencyProblemGenerator'

/**
 * Get previous operation (for challenge problems)
 */
function getPreviousOperation(current: OperationType): OperationType | null {
  const order: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  const index = order.indexOf(current)
  return index > 0 ? order[index - 1] : null
}

/**
 * Select 3-5 challenge problems for a practice session
 * Priority: Next level > Previous operation > Previous levels
 */
export function selectChallengeProblems(
  currentOperation: OperationType,
  currentSubLevel: SubLevel,
  allProgress: MathFluencyProgress[],
  targetCount: number = 4  // 3-5 challenge problems
): ProblemProgress[] {
  const challenges: ProblemProgress[] = []
  
  // 1. Get next sub-level problems (preview - highest priority)
  const nextSubLevel = getNextSubLevel(currentSubLevel)
  if (nextSubLevel && challenges.length < targetCount) {
    const currentProgress = allProgress.find(p => p.operation === currentOperation)
    if (currentProgress) {
      const allProblems = [
        ...currentProgress.problemBanks.doesNotKnow,
        ...currentProgress.problemBanks.emerging,
        ...currentProgress.problemBanks.approaching,
        ...currentProgress.problemBanks.proficient,
        ...currentProgress.problemBanks.mastered
      ]
      
      const nextLevelProblems = filterProblemsBySubLevel(allProblems, nextSubLevel)
      if (nextLevelProblems.length > 0) {
        const previewProblems = sampleRandom(nextLevelProblems, Math.min(2, targetCount))
        
        previewProblems.forEach(p => {
          p.isChallenge = true
          p.challengeType = 'next-level'
          p.isOperationChange = false
          p.challengeMessage = `Preview: This is from the next level!`
        })
        
        challenges.push(...previewProblems)
      }
    }
  }
  
  // 2. Get previous operation problems (retention check - second priority)
  const previousOperation = getPreviousOperation(currentOperation)
  if (previousOperation && challenges.length < targetCount) {
    const prevOpProgress = allProgress.find(p => p.operation === previousOperation)
    if (prevOpProgress) {
      // Get mastered and proficient problems from previous operation
      const masteredProblems = prevOpProgress.problemBanks.mastered
      const proficientProblems = prevOpProgress.problemBanks.proficient
      
      const reviewProblems = sampleRandom(
        [...masteredProblems, ...proficientProblems],
        Math.min(2, targetCount - challenges.length)
      )
      
      reviewProblems.forEach(p => {
        p.isChallenge = true
        p.challengeType = 'previous-operation'
        p.isOperationChange = true  // ⭐ OPERATION CHANGE!
        p.challengeMessage = `Review: This is ${previousOperation}! Can you remember?`
      })
      
      challenges.push(...reviewProblems)
    }
  }
  
  // 3. Fill remaining with previous sub-level problems (maintenance)
  if (challenges.length < targetCount) {
    const currentProgress = allProgress.find(p => p.operation === currentOperation)
    if (currentProgress) {
      const allProblems = [
        ...currentProgress.problemBanks.doesNotKnow,
        ...currentProgress.problemBanks.emerging,
        ...currentProgress.problemBanks.approaching,
        ...currentProgress.problemBanks.proficient,
        ...currentProgress.problemBanks.mastered
      ]
      
      const currentSubLevels = getSubLevelsForOperation(currentOperation)
      const currentConfig = getSubLevelConfig(currentSubLevel)
      const currentIndex = currentSubLevels.findIndex(sl => sl.id === currentSubLevel)
      
      // Get problems from previous sub-levels
      for (let i = 0; i < currentIndex && challenges.length < targetCount; i++) {
        const prevSubLevel = currentSubLevels[i].id
        const prevLevelProblems = filterProblemsBySubLevel(allProblems, prevSubLevel)
        const maintenanceProblems = prevLevelProblems.filter(p => 
          p.proficiencyLevel === 'proficient' || p.proficiencyLevel === 'mastered'
        )
        
        if (maintenanceProblems.length > 0) {
          const selected = sampleRandom(
            maintenanceProblems,
            Math.min(1, targetCount - challenges.length)
          )
          
          selected.forEach(p => {
            p.isChallenge = true
            p.challengeType = 'previous-level'
            p.isOperationChange = false
            p.challengeMessage = `Review: From a previous level`
          })
          
          challenges.push(...selected)
        }
      }
    }
  }
  
  return challenges.slice(0, targetCount)
}


