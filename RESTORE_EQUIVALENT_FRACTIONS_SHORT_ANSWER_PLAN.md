# Plan: Restore Equivalent Fractions Checkbox for Short Answer Questions

## Background

During the assessment editor refactoring (commit `238e8ca` - "Bump version to 1.0.9 - Add assessment editor refactoring"), the assessment editor was refactored to use separate field components for each question type. The "Accept equivalent fractions" checkbox that existed for short-answer questions in the old `AssessmentEditor.vue` was not included in the new `ShortAnswerFields.vue` component.

### Evidence Found

1. **Old Implementation**: In `src/components/assessments/AssessmentEditor.vue.old` (lines 1269-1284), there was a checkbox for short-answer questions:
   ```vue
   <div v-if="question.questionType === 'short-answer'" class="form-group">
     <label class="checkbox-label">
       <input 
         type="checkbox" 
         v-model="question.acceptEquivalentFractions"
         class="form-checkbox"
       >
       <span class="checkbox-text">
         🔢 Accept equivalent fractions (e.g., 1/2 = 2/4 = 3/6)
       </span>
     </label>
     <small class="form-help">
       When enabled, students get credit for any equivalent fraction, even if not simplified
     </small>
   </div>
   ```

2. **Current State**: 
   - `ShortAnswerFields.vue` does NOT have this checkbox
   - `FractionFields.vue` DOES have this checkbox (for fraction question types)
   - The type definition in `src/types/iep.ts` still includes `acceptEquivalentFractions?: boolean`
   - The `areAnswersEquivalent` function in `answerUtils.ts` checks for equivalent fractions, but doesn't respect the flag for short-answer questions

3. **When Removed**: During commit `238e8ca` (Bump version to 1.0.9) when the editor was refactored into separate field components.

## Implementation Plan

### Step 1: Add Checkbox to ShortAnswerFields.vue
- Add the equivalent fractions checkbox to `src/components/assessments/editor/questionTypes/ShortAnswerFields.vue`
- Place it after the "Alternative Acceptable Answers" section and before the "Answer Prefix/Suffix" section
- Use the same styling and structure as in `FractionFields.vue` for consistency

### Step 2: Update Answer Evaluation Logic
- Modify `src/components/assessments/AssessmentTaking.vue` in the short-answer evaluation section (around line 1000-1034)
- Currently, `areAnswersEquivalent` always checks for equivalent fractions (line 276 in answerUtils.ts)
- Need to conditionally check equivalent fractions ONLY when `question.acceptEquivalentFractions === true` for short-answer questions
- **Approach**: Create a helper function `areAnswersEquivalentBasic` in `answerUtils.ts` that does everything `areAnswersEquivalent` does EXCEPT fraction equivalence checking
- The logic should:
  1. First check exact match and basic equivalence (using `areAnswersEquivalentBasic`)
  2. Then check acceptable answers (using same logic)
  3. Then check equivalent fractions (if flag is enabled) using `areFractionsEquivalent` directly

### Step 3: Create Basic Answer Comparison Function
- Add `areAnswersEquivalentBasic` function to `src/utils/answerUtils.ts`
- This function should be identical to `areAnswersEquivalent` but skip the fraction equivalence check (remove lines 275-278)
- Export `areFractionsEquivalent` function (currently it's private) so it can be used directly in AssessmentTaking.vue
- This allows us to control when fraction equivalence is checked based on the flag

### Step 4: Testing Checklist
- [ ] Checkbox appears in ShortAnswerFields.vue for short-answer questions
- [ ] Checkbox state is saved/loaded correctly with assessments
- [ ] When checkbox is checked: equivalent fractions are accepted (e.g., 1/2 = 2/4 = 3/6)
- [ ] When checkbox is unchecked: only exact matches and acceptable answers are accepted
- [ ] Works with answer prefix/suffix
- [ ] Works with alternative acceptable answers
- [ ] Existing fraction question type behavior is unchanged

## Files to Modify

1. **src/components/assessments/editor/questionTypes/ShortAnswerFields.vue**
   - Add checkbox UI component

2. **src/components/assessments/AssessmentTaking.vue**
   - Update short-answer evaluation logic (around lines 1000-1034)
   - Add conditional check for `acceptEquivalentFractions` flag

3. **src/utils/answerUtils.ts**
   - Add `areAnswersEquivalentBasic` function (same as `areAnswersEquivalent` but without fraction checking)
   - Export `areFractionsEquivalent` function so it can be used directly in AssessmentTaking.vue

## Code Structure Reference

### Current ShortAnswerFields.vue Structure:
```vue
<template>
  <div class="short-answer-section">
    <div class="form-group">
      <!-- Correct Answer -->
    </div>
    <div class="form-group">
      <!-- Alternative Acceptable Answers -->
    </div>
    <!-- NEW: Add checkbox here -->
    <div class="form-row">
      <!-- Answer Prefix/Suffix -->
    </div>
  </div>
</template>
```

### Current AssessmentTaking.vue Logic (lines 1000-1034):
```typescript
// For other question types (short-answer, essay, etc.), use enhanced comparison
if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
  const trimmedUserAnswer = userAnswer.trim();
  const trimmedCorrectAnswer = question.correctAnswer.trim();
  
  // Use the enhanced answer comparison that handles HTML fractions
  isCorrect = areAnswersEquivalent(trimmedUserAnswer, trimmedCorrectAnswer);
  
  // Also check acceptable answers if available
  if (!isCorrect && question.acceptableAnswers && question.acceptableAnswers.length > 0) {
    // ... check acceptable answers
  }
}
```

### Proposed Logic:
```typescript
// For other question types (short-answer, essay, etc.), use enhanced comparison
if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
  const trimmedUserAnswer = userAnswer.trim();
  const trimmedCorrectAnswer = question.correctAnswer.trim();
  
  // For short-answer questions, check if equivalent fractions should be accepted
  const shouldCheckFractions = question.questionType === 'short-answer' && question.acceptEquivalentFractions;
  
  // Use basic comparison (no fraction equivalence) first
  isCorrect = areAnswersEquivalentBasic(trimmedUserAnswer, trimmedCorrectAnswer);
  
  // If basic check failed and equivalent fractions are enabled, check fraction equivalence
  if (!isCorrect && shouldCheckFractions) {
    if (areFractionsEquivalent(trimmedUserAnswer, trimmedCorrectAnswer)) {
      isCorrect = true;
      console.log(`✅ Short answer matched equivalent fraction`);
    }
  }
  
  // Also check acceptable answers if available
  if (!isCorrect && question.acceptableAnswers && question.acceptableAnswers.length > 0) {
    for (const acceptableAnswer of question.acceptableAnswers) {
      const trimmedAcceptableAnswer = acceptableAnswer.trim();
      // Use basic comparison for acceptable answers too
      if (areAnswersEquivalentBasic(trimmedUserAnswer, trimmedAcceptableAnswer)) {
        isCorrect = true;
        console.log(`✅ Matched acceptable answer: "${trimmedAcceptableAnswer}"`);
        break;
      }
      // If equivalent fractions enabled, also check fraction equivalence
      if (!isCorrect && shouldCheckFractions) {
        if (areFractionsEquivalent(trimmedUserAnswer, trimmedAcceptableAnswer)) {
          isCorrect = true;
          console.log(`✅ Matched acceptable answer as equivalent fraction: "${trimmedAcceptableAnswer}"`);
          break;
        }
      }
    }
  }
}
```

## Notes

- The `acceptEquivalentFractions` field already exists in the type definition, so no type changes are needed
- The fraction equivalence logic already exists in `answerUtils.ts` - we just need to make it conditional
- This feature should work seamlessly with existing assessments (backward compatible - if flag is undefined, default behavior applies)

