# Fluency Module Restoration Status & Action Plan

**Date**: January 2025  
**Status**: Assessment Complete - Restoration Plan Needed

---

## 🎯 Executive Summary

The fluency module consists of **TWO separate systems**:

1. **Math Fluency System** (Math Facts Practice) - Main system for addition/subtraction/multiplication/division facts
2. **Foundational Fluency System** - Subitizing, Making 5, Making 10, Symbolic fluency

Both systems exist but may have missing backend functions, incomplete lesson integration, and data synchronization issues.

---

## 📊 Current State Assessment

### ✅ What EXISTS and Works

#### Frontend Components (All Present)
- ✅ `MathFluencyDailyPractice.vue` - Main practice component (3 rounds: warmup, diagnostic, learning, practice, assessment)
- ✅ `MathFluencyDashboard.vue` - Teacher dashboard
- ✅ `MathFluencyInitialDiagnostic.vue` - Baseline assessment
- ✅ `MathFluencyPaperAssessment.vue` - PDF generator for Friday assessments
- ✅ `MathFluencyScoreEntry.vue` - Manual score entry
- ✅ `FoundationalFluency.vue` - Foundational fluency practice/assessment
- ✅ All round components extracted (Warmup, Diagnostic, Round 1-3, Session Complete)
- ✅ All visual components (TimerBar, TenFrame, NumberLine, ArrayGrid, DivisionGroups)
- ✅ `StrategyLesson.vue` - Strategy lesson component (Making 5, Making 10, Decomposing)

#### Services & Utilities
- ✅ `mathFluencyServices.ts` - CRUD operations for Firestore
- ✅ `mathFluencyProblemGenerator.ts` - Problem generation
- ✅ `strategyLessonService.ts` - Lesson completion tracking
- ✅ `foundationalFluencyGenerator.ts` - Foundational problem generation
- ✅ `fluencySubLevels.ts` - Sub-level configuration

#### Data Types
- ✅ `mathFluency.ts` - Complete type definitions
- ✅ `strategyLessons.ts` - Lesson type definitions

#### Configuration
- ✅ `strategyLessons.ts` - Lesson definitions (Making 5, Making 10, Decomposing)
- ✅ Firestore rules deployed
- ✅ Routes configured

---

## ❌ What's MISSING or BROKEN

### 🔴 Critical Backend Functions (Cloud Functions)

**Current Backend Functions** (`functions/src/index.ts`):
- ✅ `createUser`, `updateUser` - User management
- ✅ `generateWithGemini` - AI question generation
- ❌ **NO fluency-related cloud functions**

**Missing Cloud Functions Needed**:

#### 1. **Auto-Update Progress After Session** ⚠️ CRITICAL
```typescript
// functions/src/fluencyTriggers.ts
export const onPracticeSessionComplete = onDocumentWritten(
  'mathFluencyPracticeSessions/{sessionId}',
  async (event) => {
    // When a practice session is saved, automatically:
    // 1. Update mathFluencyProgress document
    // 2. Recalculate proficiency levels
    // 3. Move problems between banks
    // 4. Update streaks and dates
    // 5. Check for sub-level advancement
    // 6. Check for operation unlock
  }
)
```

**Why Needed**: Currently, practice sessions save but don't automatically update the main progress document. This means:
- Progress bars don't update
- Proficiency percentages stay at 0%
- Problem banks don't get updated
- Streaks don't increment
- Auto-advancement doesn't work

**Status**: Function exists in `mathFluencyServices.ts` (`updateProgressAfterSession`) but is **NOT called automatically**. Needs cloud function trigger.

#### 2. **Auto-Check for Required Lessons** ⚠️ IMPORTANT
```typescript
export const onBeforePracticeSession = onDocumentCreated(
  'mathFluencyPracticeSessions/{sessionId}',
  async (event) => {
    // Before practice starts, check if student needs a lesson
    // If yes, redirect to lesson page
    // This should happen client-side, but could be enforced server-side
  }
)
```

**Status**: Currently handled client-side in `MathFluencyDailyPractice.vue` but may have issues (see RECOVERED_DAILY_PRACTICE_CHANGES.md - lesson check is disabled).

#### 3. **Weekly Assessment Reminders** (Optional)
```typescript
export const weeklyFluencyReminder = onSchedule('every friday 08:00', async () => {
  // Send reminders to teachers to generate Friday assessments
  // Could integrate with notification system
})
```

#### 4. **Data Cleanup & Validation** (Optional)
```typescript
export const validateFluencyData = onSchedule('every day 02:00', async () => {
  // Validate data integrity
  // Fix orphaned problems
  // Recalculate proficiencies if needed
})
```

---

### 🟡 Lesson System Issues

#### Current Status
- ✅ Lesson components exist (`StrategyLesson.vue`)
- ✅ Lesson config exists (`strategyLessons.ts`)
- ✅ Lesson service exists (`strategyLessonService.ts`)
- ⚠️ **Lesson triggering may be broken**

#### Issues Found
1. **Lesson Check Disabled**: According to `RECOVERED_DAILY_PRACTICE_CHANGES.md`:
   ```typescript
   // TEMP: Disabled to prevent redirect loop
   console.log('📚 Lesson check temporarily disabled to prevent redirect loop')
   ```

2. **Missing Backend Validation**: Lessons are tracked in Firestore (`strategyLessonProgress` collection) but there's no server-side enforcement that students complete lessons before practicing.

3. **Lesson Completion Not Syncing**: When a lesson is completed, it may not properly update the student's readiness for practice.

#### What Needs to Be Fixed
- [ ] Re-enable lesson check in `MathFluencyDailyPractice.vue`
- [ ] Fix redirect loop issue
- [ ] Add cloud function to validate lesson completion before allowing practice
- [ ] Ensure lesson completion properly updates student state

---

### 🟡 Data Synchronization Issues

#### Problem: Sessions Save But Progress Doesn't Update

**Current Flow**:
```
Student completes practice
  ↓
Session saved to mathFluencyPracticeSessions ✅
  ↓
mathFluencyProgress document NOT updated ❌
```

**Expected Flow**:
```
Student completes practice
  ↓
Session saved to mathFluencyPracticeSessions ✅
  ↓
Cloud function triggers automatically ✅
  ↓
mathFluencyProgress document updated ✅
  - Problem banks updated
  - Proficiency recalculated
  - Streaks incremented
  - Sub-level advancement checked
```

**Files Affected**:
- `src/components/diagnostics/MathFluencyDailyPractice.vue` - Needs to call `updateProgressAfterSession` OR cloud function should handle it
- `src/services/mathFluencyServices.ts` - Function exists but not triggered automatically

---

### 🟡 Missing Features

#### 1. **Auto-Assignment System**
- Students can manually access practice, but there's no automatic daily assignment
- Teacher dashboard shows "Add to Program" but no automatic scheduling
- **Status**: Partially implemented - students can self-access, but no assignment integration

#### 2. **Progress Update After Diagnostic**
- Diagnostic results may not properly initialize problem banks
- **Status**: Function exists (`createInitialFluencyProgress`) but may not be called correctly

#### 3. **Sub-Level Progression Tracking**
- Auto-advancement logic exists in `updateProgressAfterSession` but may not be triggered
- **Status**: Code exists but needs cloud function trigger

#### 4. **Operation Unlock Logic**
- Auto-unlock next operation exists in code but may not trigger
- **Status**: Code exists in `updateProgressAfterSession` but needs to be called

---

## 🔧 Restoration Plan

### Phase 1: Critical Backend Functions (HIGHEST PRIORITY)

#### Step 1.1: Create Cloud Function for Session Completion
**File**: `functions/src/fluencyTriggers.ts` (NEW)

```typescript
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { updateProgressAfterSession } from '../services/mathFluencyServices' // Need to port this

export const onPracticeSessionComplete = onDocumentWritten(
  {
    document: 'mathFluencyPracticeSessions/{sessionId}',
    region: 'us-west1'
  },
  async (event) => {
    const sessionData = event.data?.after?.data()
    if (!sessionData || !sessionData.completed) return
    
    // Extract session results
    const sessionResults = {
      diagnosticResults: sessionData.diagnosticResults || {},
      round2Results: sessionData.round2_practice?.results || {},
      round3Results: sessionData.round3_assessment?.results || {},
      allProblems: extractProblemsFromSession(sessionData)
    }
    
    // Update progress
    await updateProgressAfterSession(
      sessionData.studentUid,
      sessionData.operation,
      sessionResults
    )
  }
)
```

**Dependencies**:
- Port `updateProgressAfterSession` from `src/services/mathFluencyServices.ts` to `functions/src/services/fluencyServices.ts`
- Port helper functions (`updateProblemProficiencyLevel`, etc.)
- Port type definitions

**Estimated Time**: 4-6 hours

#### Step 1.2: Test Cloud Function
- Deploy function
- Create test practice session
- Verify progress document updates
- Check problem banks update correctly
- Verify streaks increment
- Test sub-level advancement

**Estimated Time**: 2-3 hours

---

### Phase 2: Fix Lesson System (HIGH PRIORITY)

#### Step 2.1: Re-enable Lesson Check
**File**: `src/components/diagnostics/MathFluencyDailyPractice.vue`

1. Find where lesson check is disabled
2. Fix redirect loop issue (likely caused by checking on every navigation)
3. Only check once per session start, not on every mount

**Estimated Time**: 2-3 hours

#### Step 2.2: Add Server-Side Lesson Validation (Optional)
**File**: `functions/src/fluencyTriggers.ts` (NEW)

```typescript
export const validateLessonCompletion = onCall(async (request) => {
  const { studentUid, sessionNumber } = request.data
  const requiredLesson = await checkForRequiredLesson(studentUid, sessionNumber)
  
  if (requiredLesson) {
    const completed = await hasCompletedLesson(studentUid, requiredLesson)
    if (!completed) {
      throw new HttpsError('failed-precondition', 'Lesson required before practice')
    }
  }
  
  return { allowed: true }
})
```

**Estimated Time**: 2-3 hours

---

### Phase 3: Data Integrity & Testing (MEDIUM PRIORITY)

#### Step 3.1: Create Data Migration Script
**File**: `scripts/fix-fluency-progress.cjs` (NEW)

- Find all practice sessions without corresponding progress updates
- Backfill progress documents
- Recalculate proficiencies
- Fix orphaned problems

**Estimated Time**: 4-6 hours

#### Step 3.2: Add Progress Update to Client-Side (Fallback)
**File**: `src/components/diagnostics/MathFluencyDailyPractice.vue`

- Add explicit call to `updateProgressAfterSession` after saving session
- This ensures progress updates even if cloud function fails
- Keep cloud function as primary method

**Estimated Time**: 1-2 hours

---

### Phase 4: Missing Features (LOW PRIORITY)

#### Step 4.1: Auto-Assignment System
- Create cloud function to auto-assign daily practice
- Integrate with existing assignment system
- Add teacher controls (pause/resume)

**Estimated Time**: 6-8 hours

#### Step 4.2: Enhanced Reporting
- Teacher dashboard improvements
- Student progress views
- IEP report generation

**Estimated Time**: 8-12 hours

---

## 📋 Immediate Action Items

### 🔴 CRITICAL (Do First)
1. ✅ **Add fallback client-side progress update** - COMPLETE
   - ✅ Added call to `updateProgressAfterSession` after saving session
   - ✅ Ensures progress updates even if cloud function fails
   - ✅ Added diagnostic results storage
   - ⏳ **NEEDS TESTING**

2. **Create cloud function for session completion** (`functions/src/fluencyTriggers.ts`)
   - Port `updateProgressAfterSession` to cloud functions
   - Set up trigger on `mathFluencyPracticeSessions` write
   - Test thoroughly
   - **Status**: TODO (client-side fix done first)

3. **Fix lesson check in daily practice**
   - Re-enable lesson check
   - Fix redirect loop
   - Test lesson flow
   - **Status**: TODO

### 🟡 IMPORTANT (Do Next)
4. **Test data synchronization**
   - Verify sessions update progress
   - Check problem banks update
   - Verify streaks increment
   - Test sub-level advancement

5. **Create data migration script**
   - Backfill missing progress updates
   - Fix orphaned data

### 🟢 NICE TO HAVE (Later)
6. Auto-assignment system
7. Enhanced reporting
8. Weekly reminders
9. Data validation functions

---

## 🧪 Testing Checklist

### After Phase 1 (Cloud Functions)
- [ ] Practice session saves
- [ ] Cloud function triggers automatically
- [ ] Progress document updates
- [ ] Problem banks update correctly
- [ ] Proficiency percentage recalculates
- [ ] Streak increments
- [ ] Sub-level advancement works (at 90%+)
- [ ] Operation unlock works (at 95%+)

### After Phase 2 (Lessons)
- [ ] Lesson check triggers before practice
- [ ] Redirect to lesson works
- [ ] Lesson completion tracked
- [ ] Can return to practice after lesson
- [ ] No redirect loops

### After Phase 3 (Data Integrity)
- [ ] All existing sessions have progress updates
- [ ] No orphaned problems
- [ ] All proficiencies accurate
- [ ] All streaks correct

---

## 📁 Files That Need Changes

### New Files to Create
1. `functions/src/fluencyTriggers.ts` - Cloud function triggers
2. `functions/src/services/fluencyServices.ts` - Ported services for cloud functions
3. `scripts/fix-fluency-progress.cjs` - Data migration script

### Files to Modify
1. `src/components/diagnostics/MathFluencyDailyPractice.vue` - Re-enable lesson check, add fallback progress update
2. `functions/src/index.ts` - Export new fluency triggers
3. `functions/package.json` - Add any new dependencies

### Files to Review
1. `src/services/mathFluencyServices.ts` - Verify `updateProgressAfterSession` is complete
2. `src/services/strategyLessonService.ts` - Verify lesson completion tracking
3. `src/config/strategyLessons.ts` - Verify lesson definitions

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- ✅ Practice sessions automatically update progress documents
- ✅ Problem banks update correctly
- ✅ Proficiency percentages recalculate
- ✅ Streaks increment properly
- ✅ Sub-level advancement works automatically
- ✅ Operation unlock works automatically

### Phase 2 Complete When:
- ✅ Lessons trigger before practice when needed
- ✅ No redirect loops
- ✅ Lesson completion properly tracked
- ✅ Students can complete lessons and return to practice

### Phase 3 Complete When:
- ✅ All existing data is consistent
- ✅ No orphaned problems
- ✅ All progress documents accurate

---

## 📚 Reference Documents

- `MATH_FLUENCY_SYSTEM_STATUS.md` - Overall system status
- `MATH_FLUENCY_PHASE3_COMPLETE.md` - Phase 3 implementation details
- `SESSION_SUMMARY_FLUENCY_OVERHAUL.md` - Recent changes
- `RECOVERED_DAILY_PRACTICE_CHANGES.md` - Recovered changes
- `CRITICAL_MISSING_PIECE.md` - Progress update issue
- `MINI_LESSONS_IMPLEMENTED.md` - Lesson system details
- `FOUNDATIONAL_FLUENCY_SYSTEM.md` - Foundational fluency docs

---

## 🚀 Next Steps

1. **Review this document** - Confirm priorities and approach
2. **Start Phase 1** - Create cloud function for session completion
3. **Test thoroughly** - Ensure data synchronization works
4. **Fix lessons** - Re-enable and fix lesson check
5. **Migrate data** - Backfill missing progress updates

---

**Status**: Ready to begin restoration work  
**Estimated Total Time**: 15-25 hours  
**Priority**: HIGH - System is functional but data doesn't sync properly












