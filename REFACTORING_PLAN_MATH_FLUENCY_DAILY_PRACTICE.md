# Refactoring Plan: MathFluencyDailyPractice.vue → <500 lines

**Current State:**
- **Total:** 2,951 lines
- **Template:** 526 lines
  - Round 1: ~310 lines (NOT extracted) ❌
  - Round 2: ~101 lines (NOT extracted) ❌
  - Round 3: ~21 lines (NOT extracted) ❌
  - Session Complete: ~7 lines (NOT extracted) ❌
  - Container/loading: ~87 lines
- **Script:** 1,352 lines  
- **Style:** 1,073 lines

**Target:** <500 lines total (orchestrator only)

**Reference Pattern:** CaseManageVue structure (composables, services, component organization)

---

## 🎯 Aggressive Refactoring Strategy

### Phase 1: Extract ALL Remaining Template Sections → Template: 526 → ~90 lines (-436)

**Priority: HIGHEST** - This gives immediate reduction and fixes build errors.

#### Still Need to Extract:
1. **Round 1 (Learning)** → `MathFluencyRound1Learning.vue` (~310 lines)
   - Encoding phase with visuals
   - Consolidation phase
   - Recall phase
   - Feedback phase
   - All visual components (ten-frame, number line, arrays, division groups)

2. **Round 2 (Practice)** → `MathFluencyRound2Practice.vue` (~101 lines)
   - Practice question display
   - Immediate feedback
   - Timer display
   - Stats display

3. **Round 3 (Assessment)** → `MathFluencyRound3Assessment.vue` (~21 lines)
   - Assessment question display
   - Timer display

4. **Session Complete** → `MathFluencySessionComplete.vue` (~7 lines)
   - Session summary
   - Achievements display
   - Promotions list

**After Phase 1:**
- Template: ~90 lines (just container divs and component tags)
- **Total: 2,951 → ~2,515 lines**

---

### Phase 2: Extract ALL Styles → Style: 1,073 → 0 lines (-1,073)

**Priority: HIGH** - Easy win, huge reduction.

#### Extract to:
- `src/components/diagnostics/mathFluency/styles/dailyPracticeStyles.css` (~1,073 lines)

**Import in component:**
```vue
<style scoped src="./mathFluency/styles/dailyPracticeStyles.css"></style>
```

**After Phase 2:**
- Style: 0 lines
- **Total: ~2,515 → ~1,442 lines**

---

### Phase 3: Extract ALL Business Logic to Composables → Script: 1,352 → ~200 lines (-1,152)

**Priority: HIGH** - This is the big reduction.

#### 1. `src/composables/useMathFluencyPractice.ts` (~600 lines)
**Extract ALL state and core logic:**
- All `ref()` declarations (loading, rounds, problems, timers, etc.)
- `loadProgress()`, `loadProgressSilently()`
- `preparePracticeSession()`
- `startPractice()`, `finishSession()`, `viewProgress()`
- `continueCurrentLevel()`, `skipToNextSubLevel()`
- Progress and session management

**Returns:**
```typescript
{
  // State
  loading, completedToday, practiceStarted, sessionComplete, currentRound
  progress, todaysSession, assignmentId
  warmupNumbers, diagnosticProblems, round1Problems, round2Problems, round3Problems
  // ... all state refs
  
  // Methods
  loadProgress, preparePracticeSession, startPractice, finishSession
  viewProgress, continueCurrentLevel, skipToNextSubLevel
}
```

#### 2. `src/composables/useMathFluencyRounds.ts` (~400 lines)
**Extract ALL round-specific logic:**
- Round 1: `startRound1()`, `proceedToRecall()`, `submitRound1Answer()`, `finishRound1()`
- Round 1 phases: encoding, consolidation, recall, feedback
- Round 1 timers and state
- Round 2: `showNextRound2Problem()`, `submitRound2Answer()`, `finishRound2()`
- Round 2 timers and feedback
- Round 3: `startRound3()`, `showNextRound3Problem()`, `submitRound3Answer()`
- Round 3 timers
- All timer management functions

#### 3. `src/composables/useMathFluencyDiagnostic.ts` (~150 lines)
**Extract diagnostic logic:**
- `generateDiagnosticProblems()`
- `handleDiagnosticAnswer()`, `handleDiagnosticComplete()`
- `startDiagnosticTimer()`
- Diagnostic state management

**After Phase 3:**
- Script: ~200 lines (just imports, composable usage, and minimal orchestration)
- **Total: ~1,442 → ~290 lines** ✅ **UNDER 500!**

---

### Phase 4: Extract Utility Functions to Services → Script: ~200 → ~150 lines (-50)

**Priority: MEDIUM** - Final cleanup.

#### 1. `src/services/mathFluencyPracticeSessionService.ts` (~200 lines)
**Extract:**
- `preparePracticeSession()` (if not already in composable)
- `generateDiagnosticProblems()` (if not already in composable)
- Problem selection and filtering logic
- Session creation logic

#### 2. `src/utils/mathFluencyDisplayUtils.ts` (~100 lines)
**Extract:**
- `getProblemDisplay()`
- `getNewLevel()`
- `capitalizeOperation()`
- `getOperationSymbol()`
- `problemBelongsToSubLevel()`
- All display formatting utilities

**After Phase 4:**
- Script: ~150 lines
- **Total: ~290 → ~240 lines** ✅ **WELL UNDER 500!**

---

## 📊 Expected Results Summary

| Phase | Template | Script | Style | **Total** |
|-------|----------|--------|-------|-----------|
| **Current** | 526 | 1,352 | 1,073 | **2,951** |
| After Phase 1 (Components) | 90 | 1,352 | 1,073 | **2,515** |
| After Phase 2 (Styles) | 90 | 1,352 | 0 | **1,442** |
| After Phase 3 (Composables) | 90 | 200 | 0 | **290** ✅ |
| After Phase 4 (Services) | 90 | 150 | 0 | **240** ✅ |

---

## 🗂️ Final File Structure

```
src/
├── components/
│   └── diagnostics/
│       ├── MathFluencyDailyPractice.vue (~240 lines) ← Orchestrator only
│       └── mathFluency/
│           ├── rounds/
│           │   ├── MathFluencyStartScreen.vue ✅
│           │   ├── MathFluencyWarmupRound.vue ✅
│           │   ├── MathFluencyDiagnosticRound.vue ✅
│           │   ├── MathFluencyDiagnosticResults.vue ✅
│           │   ├── MathFluencyRound1Learning.vue ← TODO (~310 lines template)
│           │   ├── MathFluencyRound2Practice.vue ← TODO (~101 lines template)
│           │   ├── MathFluencyRound3Assessment.vue ← TODO (~21 lines template)
│           │   └── MathFluencySessionComplete.vue ← TODO (~7 lines template)
│           ├── visuals/
│           │   ├── MathFluencyTimerBar.vue ✅
│           │   ├── MathFluencyTenFrame.vue ✅
│           │   ├── MathFluencyNumberLine.vue ✅
│           │   ├── MathFluencyArrayGrid.vue ✅
│           │   └── MathFluencyDivisionGroups.vue ✅
│           └── styles/
│               └── dailyPracticeStyles.css ← All styles (~1,073 lines)
│
├── composables/
│   ├── useMathFluencyPractice.ts (~600 lines) ← Main state & business logic
│   ├── useMathFluencyRounds.ts (~400 lines) ← Round-specific logic
│   └── useMathFluencyDiagnostic.ts (~150 lines) ← Diagnostic logic
│
├── services/
│   └── mathFluencyPracticeSessionService.ts (~200 lines) ← Session preparation
│
└── utils/
    └── mathFluencyDisplayUtils.ts (~100 lines) ← Display utilities
```

---

## 🚀 Implementation Order (Recommended)

1. **Phase 1: Extract Components** (HIGHEST PRIORITY)
   - Fixes build errors
   - Immediate ~436 line reduction
   - Makes file more manageable

2. **Phase 2: Extract Styles** (HIGH PRIORITY)
   - Easiest to do
   - Huge ~1,073 line reduction
   - No logic changes needed

3. **Phase 3: Extract Composables** (HIGH PRIORITY)
   - Biggest logic refactor
   - ~1,152 line reduction
   - Makes code testable and reusable

4. **Phase 4: Extract Services** (MEDIUM PRIORITY)
   - Final cleanup
   - ~50 line reduction
   - Better separation of concerns

---

## 📝 Final MathFluencyDailyPractice.vue Structure

After all phases, the main file will be:

```vue
<template>
  <div class="daily-practice-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">...</div>
    
    <!-- Completed Today -->
    <div v-else-if="completedToday" class="completed-state">...</div>
    
    <!-- Component Orchestration -->
    <MathFluencyStartScreen 
      v-else-if="!practiceStarted" 
      :current-operation="currentOperation"
      :distribution="distribution"
      :proficiency-percentage="proficiencyPercentage"
      :next-operation-name="nextOperationName"
      :practice-streak="practiceStreak"
      :round1-count="round1Problems.length"
      :round2-count="round2Problems.length"
      :round3-count="round3Problems.length"
      @start-practice="startPractice"
    />
    
    <MathFluencyWarmupRound 
      v-if="practiceStarted && currentRound === 0" 
      :numbers="warmupNumbers"
      @complete="handleWarmupComplete"
    />
    
    <MathFluencyDiagnosticRound 
      v-if="practiceStarted && currentRound === 0.5" 
      :problems="diagnosticProblems"
      :time-per-problem="10"
      @answer="handleDiagnosticAnswer"
      @complete="handleDiagnosticComplete"
    />
    
    <MathFluencyDiagnosticResults 
      v-if="practiceStarted && currentRound === 0.75" 
      :score="diagnosticScore"
      :correct="diagnosticCorrect"
      :total="diagnosticProblems.length"
      :wrong-problems="diagnosticWrongProblems"
      @continue="continueCurrentLevel"
    />
    
    <MathFluencyRound1Learning 
      v-if="practiceStarted && currentRound === 1" 
      :problems="round1Problems"
      :current-index="round1CurrentIndex"
      :phase="round1Phase"
      @proceed-to-recall="proceedToRecall"
      @submit-answer="submitRound1Answer"
      @complete="finishRound1"
    />
    
    <MathFluencyRound2Practice 
      v-if="practiceStarted && currentRound === 2" 
      :problems="round2Problems"
      :current-index="round2CurrentIndex"
      @submit-answer="submitRound2Answer"
      @complete="finishRound2"
    />
    
    <MathFluencyRound3Assessment 
      v-if="practiceStarted && currentRound === 3" 
      :problems="round3Problems"
      :current-index="round3CurrentIndex"
      @submit-answer="submitRound3Answer"
      @complete="finishSession"
    />
    
    <MathFluencySessionComplete 
      v-if="sessionComplete" 
      :session="session"
      :promotions-earned="promotionsEarned"
      :session-quality="sessionQualityDisplay"
      :total-time="totalSessionTime"
      :distribution="distribution"
      @view-progress="viewProgress"
      @finish="finishSession"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// Composables
import { useMathFluencyPractice } from '@/composables/useMathFluencyPractice'
import { useMathFluencyRounds } from '@/composables/useMathFluencyRounds'
import { useMathFluencyDiagnostic } from '@/composables/useMathFluencyDiagnostic'

// Components
import MathFluencyStartScreen from './mathFluency/rounds/MathFluencyStartScreen.vue'
import MathFluencyWarmupRound from './mathFluency/rounds/MathFluencyWarmupRound.vue'
import MathFluencyDiagnosticRound from './mathFluency/rounds/MathFluencyDiagnosticRound.vue'
import MathFluencyDiagnosticResults from './mathFluency/rounds/MathFluencyDiagnosticResults.vue'
import MathFluencyRound1Learning from './mathFluency/rounds/MathFluencyRound1Learning.vue'
import MathFluencyRound2Practice from './mathFluency/rounds/MathFluencyRound2Practice.vue'
import MathFluencyRound3Assessment from './mathFluency/rounds/MathFluencyRound3Assessment.vue'
import MathFluencySessionComplete from './mathFluency/rounds/MathFluencySessionComplete.vue'

const router = useRouter()

// Use composables
const practice = useMathFluencyPractice()
const rounds = useMathFluencyRounds()
const diagnostic = useMathFluencyDiagnostic()

// Expose state and methods for template
const {
  loading,
  completedToday,
  practiceStarted,
  sessionComplete,
  currentRound,
  currentOperation,
  distribution,
  proficiencyPercentage,
  nextOperationName,
  practiceStreak,
  warmupNumbers,
  diagnosticProblems,
  round1Problems,
  round2Problems,
  round3Problems,
  diagnosticScore,
  diagnosticCorrect,
  diagnosticWrongProblems,
  session,
  promotionsEarned,
  sessionQualityDisplay,
  totalSessionTime,
  startPractice,
  continueCurrentLevel,
  viewProgress,
  finishSession,
} = practice

const {
  round1CurrentIndex,
  round1Phase,
  round2CurrentIndex,
  round3CurrentIndex,
  handleWarmupComplete,
  proceedToRecall,
  submitRound1Answer,
  finishRound1,
  submitRound2Answer,
  finishRound2,
  submitRound3Answer,
} = rounds

const {
  handleDiagnosticAnswer,
  handleDiagnosticComplete,
} = diagnostic

// Lifecycle
onMounted(() => {
  practice.loadProgress()
})

onUnmounted(() => {
  rounds.clearAllTimers()
})
</script>

<style scoped src="./mathFluency/styles/dailyPracticeStyles.css"></style>
```

**Estimated final size: ~240 lines** ✅

---

## ✅ Benefits

1. **Maintainability:** Logic separated by concern, easy to find and modify
2. **Testability:** Composables and services can be unit tested independently
3. **Reusability:** Composables can be used in other components
4. **Performance:** Tiny main file = fast parsing, no language server issues
5. **Readability:** Main file is just orchestration, easy to understand flow
6. **Scalability:** Easy to add new rounds or features

---

## 🎯 Next Steps

**Start with Phase 1** - Extract Round 1, 2, 3, and Session Complete components. This will:
- Fix the current build error
- Reduce file by ~436 lines immediately
- Make the file more manageable for further refactoring

Should I proceed with Phase 1?
