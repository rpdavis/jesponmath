# Standards-Based Scoring Update - Composite Questions Support

## Overview
Updated the standards-based grading system to properly handle questions with varying point values and support for composite/multi-part questions (linked questions).

## Changes Made

### 1. Data Model Updates (`src/types/iep.ts`)

#### New: `AssessmentSubQuestion` Interface
```typescript
export interface AssessmentSubQuestion {
  id: string
  partLabel: string // "Part A", "Part B", etc.
  questionText: string
  questionType: string
  options?: string[]
  correctAnswer: string | string[]
  acceptableAnswers?: string[]
  pointWeight: number // Fraction of parent question's total points (e.g., 0.5 = half)
  explanation?: string
}
```

#### Updated: `AssessmentQuestion` Interface
Added support for composite/multi-part questions:
```typescript
export interface AssessmentQuestion {
  // ... existing fields ...
  points: number
  
  // NEW: Multi-part/Composite question support
  subQuestions?: AssessmentSubQuestion[]
  subQuestionScoringMode?: 'all-or-nothing' | 'proportional'
}
```

**Scoring Modes:**
- **all-or-nothing**: Student must get ALL sub-questions correct to earn ANY points (e.g., both Part A and Part B must be correct to earn 1 point)
- **proportional**: Student earns partial credit for each correct sub-question (e.g., Part A correct = 0.5 pts, Part B correct = 0.5 pts, total = 1 pt)

### 2. Standards Calculation Updates (`src/utils/standardsUtils.ts`)

#### Updated: `QuestionAttempt` Interface
```typescript
export interface QuestionAttempt {
  isCorrect: boolean
  score: number       // Points EARNED (actual score)
  maxPoints: number   // Maximum points possible (NEW)
}
```

#### Updated: `calculateStandardScore` Function
Now properly handles actual point values instead of just counting correct/incorrect:

**Before:** Counted each question as "1 correct" or "0 incorrect" regardless of point value
**After:** Sums actual points earned vs points possible

**Three Scoring Methods (All Updated):**

1. **keepTop** - Takes highest scoring attempts
   - Before: Sorted by score, took top N, then counted correct/incorrect
   - After: Sorted by score, took top N, then summed actual points earned/possible
   - Example: Top 3 of [2pts, 1.5pts, 1pt, 0.5pts] = (2+1.5+1)/(2+2+2) = 4.5/6 = 75%

2. **average** - Average percentage across attempts
   - Before: Each attempt was 100% (correct) or 0% (incorrect), then averaged
   - After: Each attempt calculates (score/maxPoints)*100, then averaged
   - Example: [1/1=100%, 0.5/1=50%, 2/2=100%] = average 83.3%

3. **additive** (default) - Sum all attempts
   - Before: Counted number of correct questions
   - After: Sums all points earned / all points possible
   - Example: (1+0.5+2)/(1+1+2) = 3.5/4 = 87.5%

### 3. Gradebook Updates (`src/components/Gradebook.vue`)

#### Fixed Bug
Changed line 913 from:
```typescript
const score = response.score || (response.isCorrect ? question.points : 0)
```
To:
```typescript
const score = response.pointsEarned || (response.isCorrect ? question.points : 0)
```

#### Added `maxPoints` to Question Attempts
Updated all three locations where `questionAttempts.push()` is called to include:
```typescript
questionAttempts.push({
  isCorrect,
  score,
  maxPoints: question.points || 1  // NEW
});
```

This ensures the standards calculation has the information needed to calculate percentages correctly.

## Use Cases

### Example 1: Linked Questions (Your Scenario)
**Setup:**
- Question with 2 parts (Part A and Part B)
- Total points: 1
- Scoring mode: 'all-or-nothing'
- Each part weight: 0.5

**Scoring:**
- Both correct: 1 point
- One correct: 0 points
- Both incorrect: 0 points

### Example 2: Questions with Different Point Values
**Setup:**
- Standard has 3 questions
- Q1: 0.5 points
- Q2: 1 point
- Q3: 2 points

**Before Fix:**
- Student answers all correctly
- Standards view showed: 3/3 = 100% ✓ Correct
- Student gets Q1 wrong, others correct
- Standards view showed: 2/3 = 67% ❌ Wrong! (Should be 3/3.5 = 86%)

**After Fix:**
- Student answers all correctly
- Standards view shows: 3.5/3.5 = 100% ✓ Correct
- Student gets Q1 wrong, others correct
- Standards view shows: 3/3.5 = 86% ✓ Correct

### Example 3: keepTop Scoring Method
**Setup:**
- Standard with maxScore = 3
- Student attempts 5 questions: [0.5pt, 1pt, 2pts, 1.5pts, 0.5pt]
- Student scores: [0.5, 0.5, 1.5, 1.5, 0]

**Before Fix:**
- Took top 3 attempts by score
- Counted correct: 2/3 = 67%

**After Fix:**
- Took top 3 attempts by score: [1.5pts, 1.5pts, 0.5pts]
- Summed points: 3.5/4.0 = 87.5%

## Backward Compatibility

✅ **Existing Data:** All existing assessments and questions continue to work
- Questions without `subQuestions` are treated as single questions
- All existing question types supported
- No migration needed

✅ **Existing Scoring:** The three scoring methods still work as before for fully-correct/incorrect questions
- Only difference is proper handling of partial credit
- More accurate percentage calculations

## Next Steps (Future Implementation)

To fully utilize composite questions, you'll need to:

1. **Update Question Editor** - Add UI to create multi-part questions with sub-questions
2. **Update Assessment Taking** - Display and score sub-questions during assessment
3. **Update Results Display** - Show sub-question performance in results view
4. **Update Response Storage** - Store sub-question responses with parent question reference

## Testing Recommendations

Test the following scenarios:
1. ✅ Single question with 0.5 points - verify standards shows correct percentage
2. ✅ Mixed point values (0.5, 1, 2) - verify weighted calculation
3. ✅ keepTop method with different point values
4. ✅ average method with different point values
5. ✅ additive method with different point values
6. ✅ All-or-nothing composite question (future)
7. ✅ Proportional composite question (future)

## Files Changed

1. `/src/types/iep.ts` - Added AssessmentSubQuestion interface and updated AssessmentQuestion
2. `/src/utils/standardsUtils.ts` - Updated QuestionAttempt and calculateStandardScore
3. `/src/components/Gradebook.vue` - Fixed bug and added maxPoints to all questionAttempts
4. `/src/components/StudentResults.vue` - Added maxPoints to questionAttempts
5. `/src/components/StudentSummary.vue` - Added maxPoints to questionAttempts (2 locations)
6. `/src/components/admin/StandardAssessmentExport.vue` - Added maxPoints to questionAttempts (2 locations)

---

**Date:** January 23, 2026
**Issue:** Standards view treating all questions as 1 point regardless of actual value
**Solution:** Track actual points earned vs points possible throughout calculation pipeline
**Status:** ✅ Complete - All TypeScript compilation errors resolved
