# Equivalent Fractions Behavior Confirmation

## Current State Analysis

### What I Found:

1. **Checkbox Existed in Old UI**: 
   - In `src/components/assessments/AssessmentEditor.vue.old` (lines 1269-1284), there was a checkbox for short-answer questions:
     ```vue
     <div v-if="question.questionType === 'short-answer'" class="form-group">
       <label class="checkbox-label">
         <input type="checkbox" v-model="question.acceptEquivalentFractions">
         <span>🔢 Accept equivalent fractions (e.g., 1/2 = 2/4 = 3/6)</span>
       </label>
       <small>When enabled, students get credit for any equivalent fraction, even if not simplified</small>
     </div>
     ```

2. **Type Definition Still Has It**:
   - `src/types/iep.ts` line 142: `acceptEquivalentFractions?: boolean` exists in `AssessmentQuestion` interface

3. **Current Answer Checking Logic**:
   - `src/components/assessments/AssessmentTaking.vue` line 1007: Uses `areAnswersEquivalent()` for short-answer questions
   - `src/utils/answerUtils.ts` line 276: `areAnswersEquivalent()` **ALWAYS** checks for equivalent fractions
   - **PROBLEM**: The flag is NOT being checked in the answer evaluation logic

4. **Checkbox Missing from Current UI**:
   - `src/components/assessments/editor/questionTypes/ShortAnswerFields.vue` does NOT have the checkbox
   - It was removed during the refactoring (commit `238e8ca`)

## Intended Behavior (Based on Checkbox Label)

Based on the checkbox label text: **"When enabled, students get credit for any equivalent fraction, even if not simplified"**

The intended behavior should be:

### ✅ **When Checkbox is UNCHECKED (default)**:
- Answers must match the answer key **exactly**
- NO equivalent fraction checking
- Example: If answer key is `1/2`, student must enter `1/2` (not `2/4` or `3/6`)

### ✅ **When Checkbox is CHECKED**:
- Answers can be any equivalent fraction
- Equivalent fraction checking is enabled
- Example: If answer key is `1/2`, student can enter `1/2`, `2/4`, `3/6`, `0.5`, etc.

## Current Bug

**The current implementation is INCORRECT**:
- `areAnswersEquivalent()` always checks for equivalent fractions (line 276 in answerUtils.ts)
- The `acceptEquivalentFractions` flag is **never checked** for short-answer questions
- This means equivalent fractions are **always accepted** for short-answer questions, regardless of checkbox state

## Confirmation

**YES, you are correct**: The intended behavior was that answers needed to match the answer key exactly for fractions **UNLESS** the "accept equivalent fractions" checkbox was checked.

The checkbox was meant to control whether equivalent fractions should be accepted, and by default (unchecked), only exact matches should be accepted.

## What Needs to Be Fixed

1. **Add checkbox back to UI**: `ShortAnswerFields.vue`
2. **Fix answer evaluation logic**: Make fraction equivalence checking conditional based on the flag
3. **Create basic comparison function**: One that doesn't check fractions (for when flag is unchecked)
4. **Update logic**: Check the flag before allowing equivalent fractions

This aligns with the checkbox description: "When enabled, students get credit for any equivalent fraction" - implying that when NOT enabled, they must match exactly.



