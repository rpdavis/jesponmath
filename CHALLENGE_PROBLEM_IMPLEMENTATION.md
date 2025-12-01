# Challenge Problem Implementation Plan - Prioritized

**Priority:** HIGH - Critical for student awareness and engagement  
**Timeline:** Week 1 (5-7 days)  
**Status:** Ready to implement

---

## 🎯 Goal

Implement explicit challenge problem highlighting with animations, especially for operation changes, to ensure students understand when they're practicing problems from different operations or levels.

---

## Phase 1: Type Definitions & Data Structure (Day 1)

### Step 1.1: Add Challenge Fields to ProblemProgress Type

**File:** `src/types/mathFluency.ts`

**Add to ProblemProgress interface:**
```typescript
export interface ProblemProgress {
  // ... existing fields ...
  
  // ⭐ NEW: Challenge Problem Tracking
  isChallenge?: boolean  // True if this is a challenge problem
  challengeType?: 'next-level' | 'previous-operation' | 'previous-level' | null
  isOperationChange?: boolean  // True if operation differs from current
  challengeMessage?: string  // Custom message explaining the challenge
}
```

**Add Challenge Type:**
```typescript
export type ChallengeType = 
  | 'next-level'          // Preview of next sub-level
  | 'previous-operation'  // Review from previous operation
  | 'previous-level'      // Review from previous sub-level
  | null
```

---

## Phase 2: Challenge Problem Selection Logic (Day 1-2)

### Step 2.1: Create Challenge Selection Function

**File:** `src/utils/challengeProblemSelector.ts` (NEW FILE)

```typescript
import type { ProblemProgress, OperationType, SubLevel, MathFluencyProgress } from '@/types/mathFluency'
import { getNextSubLevel, getPreviousOperation, getSubLevelsForOperation } from '@/config/fluencySubLevels'
import { filterProblemsBySubLevel } from '@/utils/subLevelUtils'
import { sampleRandom } from '@/utils/mathFluencyProblemGenerator'

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
  if (nextSubLevel) {
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
  
  // 2. Get previous operation problems (retention check - second priority)
  const previousOperation = getPreviousOperation(currentOperation)
  if (previousOperation && challenges.length < targetCount) {
    const prevOpProgress = allProgress.find(p => p.operation === previousOperation)
    if (prevOpProgress) {
      // Get mastered problems from previous operation
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
      const currentIndex = currentSubLevels.findIndex(sl => sl.id === currentSubLevel)
      
      // Get problems from previous sub-levels
      for (let i = 0; i < currentIndex && challenges.length < targetCount; i++) {
        const prevSubLevel = currentSubLevels[i].id
        const prevLevelProblems = filterProblemsBySubLevel(allProblems, prevSubLevel)
        const maintenanceProblems = prevLevelProblems.filter(p => 
          p.proficiencyLevel === 'proficient' || p.proficiencyLevel === 'mastered'
        )
        
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
  
  return challenges.slice(0, targetCount)
}

/**
 * Get previous operation (for challenge problems)
 */
function getPreviousOperation(current: OperationType): OperationType | null {
  const order: OperationType[] = ['addition', 'subtraction', 'multiplication', 'division']
  const index = order.indexOf(current)
  return index > 0 ? order[index - 1] : null
}
```

---

## Phase 3: Integrate Challenge Problems into Practice Session (Day 2)

### Step 3.1: Modify preparePracticeSession()

**File:** `src/components/diagnostics/MathFluencyDailyPractice.vue`

**Add import:**
```typescript
import { selectChallengeProblems } from '@/utils/challengeProblemSelector'
import { getAllFluencyProgress } from '@/services/mathFluencyServices'
```

**Modify preparePracticeSession() function:**
```typescript
async function preparePracticeSession() {
  // ... existing code ...
  
  // ⭐ NEW: Get all operations progress for challenge selection
  const allProgress = await getAllFluencyProgress(authStore.currentUser!.uid)
  
  // ... existing gap-filling and normal flow code ...
  
  // After Round 2 problems are selected, add challenge problems
  if (progress.value.currentSubLevel && allProblems.length > 0) {
    // ... existing Round 2 selection ...
    
    // ⭐ ADD CHALLENGE PROBLEMS
    const challengeProblems = selectChallengeProblems(
      currentOperation.value,
      progress.value.currentSubLevel,
      allProgress,
      4  // 3-5 challenge problems
    )
    
    // Mix challenge problems into Round 2
    round2Problems.value = shuffleArray([
      ...round2Problems.value,  // Existing adaptive selection
      ...challengeProblems      // Challenge problems
    ])
    round2Stack.value = [...round2Problems.value]
    
    console.log('🎯 Challenge problems added:', {
      total: challengeProblems.length,
      nextLevel: challengeProblems.filter(p => p.challengeType === 'next-level').length,
      previousOp: challengeProblems.filter(p => p.challengeType === 'previous-operation').length,
      previousLevel: challengeProblems.filter(p => p.challengeType === 'previous-level').length,
      operationChanges: challengeProblems.filter(p => p.isOperationChange).length
    })
  }
  
  // ... rest of existing code ...
}
```

---

## Phase 4: Create Challenge Problem Display Component (Day 3-4)

### Step 4.1: Create ChallengeProblemDisplay.vue

**File:** `src/components/diagnostics/ChallengeProblemDisplay.vue` (NEW FILE)

```vue
<template>
  <div 
    class="challenge-problem-container"
    :class="{
      'operation-change': isOperationChange,
      'next-level': challengeType === 'next-level',
      'previous-operation': challengeType === 'previous-operation',
      'previous-level': challengeType === 'previous-level'
    }"
  >
    <!-- Challenge Label with Animation -->
    <div class="challenge-label" :class="{ 'operation-change-label': isOperationChange }">
      <span class="challenge-text" ref="challengeTextRef">CHALLENGE</span>
      <span v-if="isOperationChange" class="operation-change-text">OPERATION CHANGE</span>
    </div>
    
    <!-- Challenge Message -->
    <div v-if="challengeMessage" class="challenge-message">
      {{ challengeMessage }}
    </div>
    
    <!-- Operation Change Alert (if applicable) -->
    <Transition name="operation-alert">
      <div v-if="isOperationChange && showOperationAlert" class="operation-change-alert">
        <div class="alert-icon">🔄</div>
        <div class="alert-text">
          <strong>Switching Operations!</strong><br>
          This is {{ getOperationName(problem.operation) }} - different from what you've been practicing!
        </div>
      </div>
    </Transition>
    
    <!-- Problem Display (slot for actual problem) -->
    <div class="challenge-problem-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import type { ProblemProgress, ChallengeType, OperationType } from '@/types/mathFluency'

interface Props {
  problem: ProblemProgress
  currentOperation: OperationType
  challengeType?: ChallengeType
  isOperationChange?: boolean
  challengeMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOperationChange: false,
  challengeMessage: ''
})

const challengeTextRef = ref<HTMLElement | null>(null)
const showOperationAlert = ref(true)

onMounted(async () => {
  await nextTick()
  
  // Animate challenge label
  if (challengeTextRef.value) {
    animateChallengeLabel(challengeTextRef.value)
  }
  
  // Hide operation alert after 3 seconds
  if (props.isOperationChange) {
    setTimeout(() => {
      showOperationAlert.value = false
    }, 3000)
  }
})

function animateChallengeLabel(element: HTMLElement) {
  // Slide-in bounce animation
  element.style.animation = 'slideInBounce 0.6s ease-out'
}

function getOperationName(op: OperationType): string {
  const names = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division'
  }
  return names[op]
}
</script>

<style scoped>
/* Challenge Problem Container */
.challenge-problem-container {
  position: relative;
  border: 3px solid #ff6b35;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  animation: challengePulse 2s ease-in-out infinite;
}

/* Operation Change Styling */
.challenge-problem-container.operation-change {
  border-color: #e63946;
  background: linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%);
  animation: operationChangePulse 1.5s ease-in-out infinite;
}

/* Challenge Label */
.challenge-label {
  position: absolute;
  top: -12px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.challenge-text {
  background: #ff6b35;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  animation: challengeLabelBounce 1.5s ease-in-out infinite;
}

.operation-change-label .challenge-text {
  background: #e63946;
  animation: operationChangeLabelBounce 1s ease-in-out infinite;
}

.operation-change-text {
  background: #e63946;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
  animation: operationChangeTextPulse 1s ease-in-out infinite;
}

/* Challenge Message */
.challenge-message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

/* Operation Change Alert */
.operation-change-alert {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(230, 57, 70, 0.95);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 10;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  animation: operationChangeAlert 0.8s ease-out;
}

.alert-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.alert-text {
  line-height: 1.4;
}

/* Challenge Problem Content */
.challenge-problem-content {
  position: relative;
  z-index: 1;
}

/* Animations */
@keyframes challengePulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 10px rgba(255, 107, 53, 0);
  }
}

@keyframes operationChangePulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 0 15px rgba(230, 57, 70, 0);
    transform: scale(1.02);
  }
}

@keyframes challengeLabelBounce {
  0%, 100% { 
    transform: translateY(0);
  }
  50% { 
    transform: translateY(-3px);
  }
}

@keyframes operationChangeLabelBounce {
  0%, 100% { 
    transform: translateY(0) scale(1);
  }
  50% { 
    transform: translateY(-3px) scale(1.1);
  }
}

@keyframes operationChangeTextPulse {
  0%, 100% { 
    opacity: 1;
  }
  50% { 
    opacity: 0.7;
  }
}

@keyframes slideInBounce {
  0% {
    transform: translateX(-100px);
    opacity: 0;
  }
  60% {
    transform: translateX(10px);
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes operationChangeAlert {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* Transition for operation alert */
.operation-alert-enter-active,
.operation-alert-leave-active {
  transition: all 0.5s ease;
}

.operation-alert-enter-from,
.operation-alert-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}
</style>
```

---

## Phase 5: Integrate Challenge Display into Round 2 (Day 4-5)

### Step 5.1: Update Round 2 Problem Display

**File:** `src/components/diagnostics/MathFluencyDailyPractice.vue`

**Add import:**
```typescript
import ChallengeProblemDisplay from '@/components/diagnostics/ChallengeProblemDisplay.vue'
```

**Modify Round 2 problem display section:**
```vue
<!-- ROUND 2: Practice -->
<div v-if="practiceStarted && currentRound === 2" class="round-section round-2">
  <!-- ... existing header ... -->
  
  <!-- Question Display -->
  <div v-if="round2ShowingQuestion" class="practice-question">
    <!-- ⭐ WRAP PROBLEM IN CHALLENGE DISPLAY IF IT'S A CHALLENGE -->
    <ChallengeProblemDisplay
      v-if="currentRound2Problem?.isChallenge"
      :problem="currentRound2Problem"
      :current-operation="currentOperation"
      :challenge-type="currentRound2Problem.challengeType"
      :is-operation-change="currentRound2Problem.isOperationChange"
      :challenge-message="currentRound2Problem.challengeMessage"
    >
      <!-- Existing problem display code -->
      <div class="question-stacked">
        <div class="stack-top-number">{{ currentRound2Problem?.num1 }}</div>
        <div class="stack-operation-row">
          <span class="operation-symbol">{{ getOperationSymbol(currentRound2Problem?.operation) }}</span>
          <span class="stack-bottom-number">{{ currentRound2Problem?.num2 }}</span>
        </div>
        <div class="stack-line"></div>
      </div>
      <input
        ref="round2Input"
        v-model="round2Answer"
        type="number"
        class="answer-input-large stack-answer-input"
        placeholder="?"
        @keyup.enter="submitRound2Answer"
        autofocus
      />
    </ChallengeProblemDisplay>
    
    <!-- Normal problem display (if not challenge) -->
    <div v-else>
      <div class="question-stacked">
        <div class="stack-top-number">{{ currentRound2Problem?.num1 }}</div>
        <div class="stack-operation-row">
          <span class="operation-symbol">{{ getOperationSymbol(currentRound2Problem?.operation) }}</span>
          <span class="stack-bottom-number">{{ currentRound2Problem?.num2 }}</span>
        </div>
        <div class="stack-line"></div>
      </div>
      <input
        ref="round2Input"
        v-model="round2Answer"
        type="number"
        class="answer-input-large stack-answer-input"
        placeholder="?"
        @keyup.enter="submitRound2Answer"
        autofocus
      />
    </div>
  </div>
  
  <!-- ... rest of Round 2 code ... -->
</div>
```

---

## Phase 6: Testing & Refinement (Day 6-7)

### Step 6.1: Test Checklist

- [ ] Challenge problems appear in Round 2
- [ ] Challenge label animates correctly
- [ ] Operation change detection works
- [ ] Operation change alert appears and disappears
- [ ] Challenge problems have correct styling
- [ ] Animations don't cause performance issues
- [ ] Mobile responsiveness works
- [ ] Challenge problems are distributed correctly (3-5 per session)
- [ ] Operation changes are clearly visible

### Step 6.2: Edge Cases

- [ ] First session (no previous operation)
- [ ] First sub-level (no previous sub-levels)
- [ ] Last sub-level (no next sub-level)
- [ ] All operations completed
- [ ] Very few problems available

---

## Implementation Order

1. **Day 1 Morning:** Type definitions (Step 1.1)
2. **Day 1 Afternoon:** Challenge selection logic (Step 2.1)
3. **Day 2:** Integrate into practice session (Step 3.1)
4. **Day 3:** Create ChallengeProblemDisplay component (Step 4.1)
5. **Day 4:** Integrate display component (Step 5.1)
6. **Day 5:** Refinement and styling
7. **Day 6-7:** Testing and bug fixes

---

## Success Criteria

✅ **Visual:**
- Challenge problems have orange border
- Challenge label animates smoothly
- Operation changes have red border and alert
- Animations are visible but not distracting

✅ **Functional:**
- 3-5 challenge problems per session
- Operation change detection works correctly
- Challenge problems distributed across rounds
- No performance degradation

✅ **User Experience:**
- Students understand challenge problems
- Operation changes are clear
- Animations enhance, not distract
- Mobile experience works well

---

## Next Steps After Phase 1

Once challenge highlighting is complete:
1. Add to Round 1 (optional challenge preview)
2. Add to Round 3 (challenge retention check)
3. Add to paper assessments (challenge indicators)
4. Add teacher controls (enable/disable challenges)

---

**Status:** Ready for implementation  
**Estimated Time:** 5-7 days  
**Priority:** HIGH


