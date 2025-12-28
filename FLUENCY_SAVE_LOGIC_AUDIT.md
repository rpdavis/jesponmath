# Math Fluency Module - Save Logic Audit

## Overview
This document audits all save logic throughout the Math Fluency module to ensure data is properly persisted to Firestore.

## ✅ 1. Lesson Completion Saving

**Location**: `src/services/strategyLessonService.ts` → `completeLesson()`

**Status**: ✅ **FIXED** - Previously missing `lessonId` and `studentUid` fields

**What Gets Saved**:
- `lessonId` - ⭐ **CRITICAL** - Now included
- `studentUid` - ⭐ **CRITICAL** - Now included
- `practiceStarted: true`
- `practiceCompleted: true`
- `problemsAttempted`
- `problemsCorrect`
- `accuracy` (calculated)
- `passedCriteria`
- `completedAt: serverTimestamp()`
- `lastAttemptAt: serverTimestamp()`

**Document ID Format**: `${studentUid}_${lessonId}`

**Collection**: `strategyLessonProgress`

**Issues Found & Fixed**:
- ❌ **FIXED**: `lessonId` and `studentUid` were not being saved, causing `getCompletedLessonIds()` to fail
- ✅ **FIXED**: Added fallback in `getCompletedLessonIds()` to extract lessonId from document ID if missing

---

## ✅ 2. Round 1 (Learning) Saving

**Location**: `src/composables/useMathFluencyRounds.ts` → `finishRound1()`

**Status**: ✅ **WORKING CORRECTLY**

**What Gets Saved** (to `session.value.round1_learning`):
- `problemsTargeted: string[]` - Added during round
- `problemsCompleted: string[]` - Added when problem learned
- `problemsStillUnmet: string[]` - Calculated
- `attemptsPerProblem: { [problemId]: { encodingCycles, recallAttempts, timesSpent } }`
- `newlyLearned: string[]` - Problems moved to "emerging"
- `timeSpent: number` (seconds)
- `completed: true`

**Real-time Updates**:
- Each problem attempt calls `updateProblemInProgress()` immediately
- Newly learned problems are added to `newlyLearned` array

**Final Save**: Saved to Firestore via `finishSession()` → `createPracticeSession()`

---

## ✅ 3. Round 2 (Practice) Saving

**Location**: `src/composables/useMathFluencyRounds.ts` → `finishRound2()`

**Status**: ✅ **WORKING CORRECTLY**

**What Gets Saved** (to `session.value.round2_practice`):
- `problemsPresented: string[]` - Set at round start
- `problemsMixed: true`
- `mixComposition: { emerging, proficient, mastered }` - Set during session prep
- `results: { [problemId]: { attempts, correct, responseTimes[], returnedToStack } }`
- `accuracy: number` (percentage)
- `averageResponseTime: number` (milliseconds)
- `timeSpent: number` (seconds)
- `completed: true`

**Real-time Updates**:
- Each answer calls `updateProblemInProgress()` immediately
- Results accumulated in `round2Results.value` during round
- Incorrect problems returned to stack

**Final Save**: Saved to Firestore via `finishSession()` → `createPracticeSession()`

---

## ✅ 4. Round 3 (Assessment) Saving

**Location**: `src/composables/useMathFluencyRounds.ts` → `finishRound3()`

**Status**: ✅ **WORKING CORRECTLY**

**What Gets Saved** (to `session.value.round3_assessment`):
- `problemsAssessed: string[]` - Set at round start
- `results: { [problemId]: { correct, responseTime, previousLevel, maintainedLevel } }`
- `accuracy: number` (percentage)
- `averageResponseTime: number` (milliseconds)
- `timeSpent: number` (seconds)
- `completed: true`

**Real-time Updates**:
- Each answer calls `updateProblemInProgress()` immediately
- Results accumulated in `round3Results.value` during round

**Final Save**: Saved to Firestore via `finishSession()` → `createPracticeSession()`

---

## ✅ 5. Practice Session Saving

**Location**: `src/composables/useMathFluencyPractice.ts` → `finishSession()`

**Status**: ✅ **WORKING CORRECTLY**

**What Gets Saved** (to `mathFluencyPracticeSessions` collection):
- `studentUid`
- `studentName`
- `operation`
- `sessionDate: Timestamp.now()`
- `dayOfWeek`
- `weekNumber`
- `completed: boolean`
- `completionPercentage: number`
- `totalTimeSpent: number` (seconds)
- `round1_learning: LearningRoundData` - Full round 1 data
- `round2_practice: PracticeRoundData` - Full round 2 data
- `round3_assessment: AssessmentRoundData` - Full round 3 data
- `promotionsEarned: string[]`
- `demotionsOccurred: []`
- `consecutiveDaysUpdated: {}`
- `sessionQuality: 'excellent' | 'good' | 'fair' | 'incomplete'`
- `engagementScore: number`
- `createdAt: Timestamp.now()`

**Function**: `createPracticeSession()` in `src/services/mathFluencyServices.ts`

**Collection**: `mathFluencyPracticeSessions`

**After Session Save**:
- Calls `updateProgressAfterSession()` to update main progress document
- Marks assignment complete if applicable

---

## ✅ 6. Progress Document Update

**Location**: `src/services/mathFluencyServices.ts` → `updateProgressAfterSession()`

**Status**: ✅ **WORKING CORRECTLY** (Previously fixed sub-level filtering bug)

**What Gets Updated** (in `mathFluencyProgress` collection):
- `problemBanks: ProblemBanks` - Reorganized by proficiency level
- `proficiencyDistribution: ProficiencyDistribution`
- `proficiencyPercentage: number`
- `masteryPercentage: number`
- `canUnlockNext: boolean` (if >= 95%)
- `lastPracticeDate: Timestamp.now()`
- `consecutivePracticeDays: number`
- `totalPracticeDays: number` (+1)
- `practiceDatesLog: Timestamp[]`
- `subLevelProgress: { [subLevel]: SubLevelProgress }` - ⭐ Updated with sub-level metrics
- `currentSubLevel: SubLevel` - Updated if advanced
- `completedSubLevels: SubLevel[]` - Updated if advanced
- `updatedAt: Timestamp.now()`

**Key Logic**:
1. Combines all results from diagnostic, round 2, and round 3
2. Updates each problem's proficiency level based on last 5 attempts
3. Reorganizes problems into proficiency banks
4. Calculates sub-level proficiency percentages
5. Checks for sub-level auto-advancement (90% proficiency)
6. Checks for operation unlock (95% proficiency + all sub-levels complete)

**Document ID Format**: `${studentUid}_${operation}`

**Collection**: `mathFluencyProgress`

**Previous Bug Fixed**:
- ❌ **FIXED**: Sub-level proficiency calculation was using all problems instead of filtering by current sub-level
- ✅ **FIXED**: Now correctly uses `filterProblemsBySubLevel(updatedProblems, progress.currentSubLevel)`

---

## ✅ 7. Diagnostic Round Saving

**Location**: `src/components/diagnostics/MathFluencyDailyPractice.vue`

**Status**: ✅ **WORKING CORRECTLY**

**What Gets Saved**:
- Diagnostic results stored in `session.value.diagnosticResults`
- Format: `{ [problemId]: { correct: boolean, responseTime: number } }`
- Saved to session object before `finishSession()` is called
- Included in `updateProgressAfterSession()` call

**Flow**:
1. Diagnostic round completes → stores results in `diagnosticResults.value`
2. Before `finishSession()`: `session.value.diagnosticResults = diagnosticResults.value`
3. `finishSession()` includes diagnostic results in `updateProgressAfterSession()` call
4. Results merged with round 2 and round 3 results for progress update

---

## ✅ 8. Real-time Problem Updates

**Location**: `src/services/mathFluencyServices.ts` → `updateProblemInProgress()`

**Status**: ✅ **WORKING CORRECTLY**

**When Called**:
- Round 1: When problem is answered correctly (line 166 in `useMathFluencyRounds.ts`)
- Round 2: After each answer submission (line 281 in `useMathFluencyRounds.ts`)
- Round 3: After each answer submission (line 395 in `useMathFluencyRounds.ts`)

**What It Does**:
- Updates problem's `last5Attempts` array
- Recalculates proficiency level
- Updates problem in memory (not Firestore - saved at session end)

**Note**: This is an in-memory update. Final save happens via `updateProgressAfterSession()` at session end.

---

## ✅ 9. Cloud Function Backup

**Location**: `functions/src/fluencyTriggers.ts` → `onPracticeSessionComplete`

**Status**: ⚠️ **PARTIAL** - Missing sub-level advancement logic

**What It Does**:
- Triggers when a practice session document is created/updated
- Only processes if `completed === true`
- Updates progress document as backup mechanism
- Currently missing:
  - ❌ Sub-level proficiency calculation
  - ❌ Sub-level auto-advancement logic
  - ❌ Operation unlock logic

**Current Implementation**:
- Updates problem proficiency levels
- Reorganizes into banks
- Updates basic progress fields
- Does NOT handle sub-level progression

**Recommendation**: Complete the Cloud Function implementation to match client-side logic.

---

## Summary of Issues Found & Fixed

### ✅ Fixed Issues:
1. **Lesson Completion**: Missing `lessonId` and `studentUid` fields in saved document
2. **Sub-level Proficiency**: Was calculating using all problems instead of filtering by current sub-level
3. **Lesson Query**: Added fallback to extract lessonId from document ID if missing

### ⚠️ Remaining Issues:
1. **Cloud Function**: Missing sub-level advancement and operation unlock logic (5% backup mechanism)

---

## Data Flow Summary

```
1. Student completes rounds
   ↓
2. Each round saves to session object (in-memory)
   ↓
3. finishSession() called
   ↓
4. createPracticeSession() → Saves session to Firestore
   ↓
5. updateProgressAfterSession() → Updates progress document
   ↓
6. Cloud Function triggers (backup) → Updates progress again
```

---

## Recommendations

1. ✅ **Complete Cloud Function**: Add sub-level advancement logic to match client-side implementation
2. ✅ **Add Error Handling**: Ensure all save operations have proper error handling and retry logic
3. ✅ **Add Validation**: Validate data before saving to prevent corrupted documents
4. ✅ **Add Logging**: Add comprehensive logging for debugging save issues

---

## Testing Checklist

- [ ] Lesson completion saves correctly and prevents re-showing
- [ ] Round 1 results saved to session object
- [ ] Round 2 results saved to session object
- [ ] Round 3 results saved to session object
- [ ] Practice session document created in Firestore
- [ ] Progress document updated with correct proficiency levels
- [ ] Sub-level proficiency calculated correctly
- [ ] Sub-level auto-advancement works (90% threshold)
- [ ] Operation unlock works (95% threshold + all sub-levels)
- [ ] Diagnostic results included in progress update
- [ ] Cloud Function backup updates progress correctly

---

*Last Updated: 2025-01-XX*












