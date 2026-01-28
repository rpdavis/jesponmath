# Linked Questions Implementation - Complete! ✅

## Overview
Full UI support for creating, displaying, and scoring linked/composite questions has been implemented. You can now create multi-part questions where students must answer multiple sub-questions that are graded together.

## What Was Implemented

### 1. Question Editor UI (`QuestionEditor.vue`)
✅ **Composite Question Toggle**
- Checkbox to convert any question into a multi-part question
- Automatically initializes with 2 sub-questions (Part A and Part B)

✅ **Scoring Mode Selector**
- **All-or-Nothing**: Student must get ALL parts correct to earn ANY points
- **Proportional**: Student earns partial credit for each correct part

✅ **Sub-Question Editor**
- Add/remove sub-questions dynamically (Part A, B, C, etc.)
- For each sub-question:
  - Question text with LaTeX support
  - Question type (multiple-choice, true-false, short-answer, fraction)
  - Point weight (fraction of total points, e.g., 0.5 = 50%)
  - Type-specific answer fields
  - Optional explanation

✅ **Validation Warning**
- Shows warning if point weights don't add up to 1.0

### 2. Assessment Taking UI (`AssessmentTaking.vue`)
✅ **Composite Question Display**
- Shows scoring mode badge at the top
- Displays all sub-questions with clear labels (Part A, Part B, etc.)
- Shows point value for each part
- Separate answer inputs for each sub-question

✅ **Supported Sub-Question Types**
- Multiple Choice
- True/False
- Short Answer
- Fraction

### 3. Scoring Logic (`AssessmentTaking.vue`)
✅ **All-or-Nothing Scoring**
```typescript
// Student must answer ALL parts correctly to earn ANY points
if all sub-questions correct:
  pointsEarned = question.points (e.g., 1 point)
else:
  pointsEarned = 0
```

✅ **Proportional Scoring**
```typescript
// Student earns credit for each correct part
earnedWeight = sum of (pointWeight for each correct sub-question)
pointsEarned = earnedWeight × question.points

Example:
- Question worth 2 points
- Part A (weight 0.5): Correct ✅
- Part B (weight 0.5): Wrong ❌
- Points earned: 0.5 × 2 = 1 point
```

✅ **Standards-Based Grading Integration**
- Composite questions properly report `pointsEarned` and `maxPoints`
- Works correctly with all three scoring methods (keepTop, average, additive)
- Fractional points display correctly in standards view

## How to Create Linked Questions

### Step 1: Create a New Question
1. Open the Assessment Editor
2. Add a new question or edit an existing one
3. Enter the main question text (can be empty or a general prompt)
4. Set the total points for the entire composite question
5. Select the standard (applies to all parts)

### Step 2: Enable Multi-Part Mode
1. Check the box: "🔗 Multi-part question (link multiple sub-questions together)"
2. Choose scoring mode:
   - **All-or-Nothing**: For your scenario where both must be correct
   - **Proportional**: If you want to give partial credit

### Step 3: Edit Sub-Questions
The editor will create Part A and Part B by default. For each part:

1. **Part Label**: Automatically assigned (Part A, Part B, Part C, etc.)
2. **Question Text**: Enter the specific question for this part
3. **Type**: Choose question type (multiple-choice, true-false, short-answer, fraction)
4. **Point Weight**: Set the fraction of total points (e.g., 0.5 = 50%)
5. **Answer Fields**: Fill in correct answer and options (based on type)
6. **Explanation**: Optional explanation for this specific part

### Step 4: Add More Parts (Optional)
- Click "+ Add Part C" to add additional sub-questions
- Click the "✕" button to remove a part
- Parts are automatically labeled alphabetically

### Step 5: Verify Point Weights
- Make sure point weights add up to 1.0
- Example for 2 parts: 0.5 + 0.5 = 1.0 ✅
- Example for 3 parts: 0.3 + 0.3 + 0.4 = 1.0 ✅
- If weights don't add up, you'll see a yellow warning

## Example: Your "Both Must Be Correct" Scenario

**Goal**: Create a 1-point question where students must answer BOTH parts correctly to earn the point.

```javascript
Question Setup:
- Question Text: "Solve both equations:"
- Points: 1
- Standard: 8.EE.C.7
- Scoring Mode: All-or-Nothing ✅

Part A:
- Question Text: "Solve for x: 2x + 5 = 13"
- Type: Short Answer
- Correct Answer: "4"
- Point Weight: 0.5

Part B:
- Question Text: "Solve for y: 3y - 7 = 8"
- Type: Short Answer
- Correct Answer: "5"
- Point Weight: 0.5
```

**Scoring Results:**
- Both correct: 1 point ✅
- Part A correct, Part B wrong: 0 points ❌
- Part A wrong, Part B correct: 0 points ❌
- Both wrong: 0 points ❌

## Example: Proportional Scoring

**Setup**: Same as above, but change scoring mode to "Proportional"

**Scoring Results:**
- Both correct: 1 point (100%)
- Part A correct, Part B wrong: 0.5 points (50%)
- Part A wrong, Part B correct: 0.5 points (50%)
- Both wrong: 0 points (0%)

## Standards View Integration

When students take assessments with composite questions:

### All-or-Nothing Mode
- Standard shows binary result: 0 points or full points
- Example: 0/1 = 0% or 1/1 = 100%

### Proportional Mode
- Standard shows actual fractional points
- Example: 0.5/1 = 50%

### Calculation Methods Still Work
- **keepTop**: Takes top N scoring attempts (by points, not just correct/incorrect)
- **average**: Averages percentage across all attempts
- **additive**: Sums all points earned / all points possible

## Testing Your Implementation

### Test Scenario 1: All-or-Nothing (2 parts)
1. Create question worth 1 point with 2 parts (0.5 each)
2. Set mode to "All-or-Nothing"
3. Take assessment, answer Part A correctly, Part B wrong
4. **Expected**: Score = 0 points
5. Retake, answer both correctly
6. **Expected**: Score = 1 point

### Test Scenario 2: Proportional (2 parts)
1. Same setup as above
2. Set mode to "Proportional"
3. Take assessment, answer Part A correctly, Part B wrong
4. **Expected**: Score = 0.5 points
5. Check standards view
6. **Expected**: Shows 0.5/1 = 50%

### Test Scenario 3: Unequal Weights
1. Create question worth 2 points with 2 parts
2. Part A weight: 0.3 (worth 0.6 points)
3. Part B weight: 0.7 (worth 1.4 points)
4. Set mode to "Proportional"
5. Answer Part A correctly, Part B wrong
6. **Expected**: Score = 0.6 points (30%)

### Test Scenario 4: Three Parts
1. Create question worth 3 points with 3 parts
2. All parts weight: 0.333 each
3. Set mode to "All-or-Nothing"
4. Answer 2 out of 3 correctly
5. **Expected**: Score = 0 points (must get all 3)

## Files Modified

### 1. `/src/types/iep.ts`
- Added `AssessmentSubQuestion` interface
- Updated `AssessmentQuestion` to include:
  - `subQuestions?: AssessmentSubQuestion[]`
  - `subQuestionScoringMode?: 'all-or-nothing' | 'proportional'`

### 2. `/src/components/assessments/editor/QuestionEditor.vue`
- Added composite question toggle checkbox
- Added scoring mode selector
- Added sub-question list with add/remove functionality
- Added point weight validation warning
- Added helper functions:
  - `onCompositeToggle()`
  - `addSubQuestion()`
  - `removeSubQuestion()`
  - `getNextPartLabel()`
  - `getTotalWeights()`
  - `getSubQuestionTypeComponent()`
- Added CSS styles for composite question UI

### 3. `/src/components/assessments/AssessmentTaking.vue`
- Added composite question display section (before regular question types)
- Added sub-question rendering with type-specific inputs
- Added composite scoring logic in `submitAssessment()`:
  - Checks each sub-question answer
  - Calculates points based on scoring mode
  - Logs detailed scoring information
- Added CSS styles for composite question display

## Backward Compatibility

✅ **All existing questions continue to work**
- Questions without `subQuestions` are treated as regular single questions
- No database migration needed
- Existing assessments remain unchanged

## Limitations & Future Enhancements

### Current Limitations
1. Sub-questions only support 4 question types:
   - Multiple Choice
   - True/False
   - Short Answer
   - Fraction

2. Cannot nest composite questions (no sub-sub-questions)

3. Results view doesn't yet show individual sub-question performance

### Possible Future Enhancements
1. Support more sub-question types (matching, rank-order, etc.)
2. Show sub-question breakdown in results view
3. Allow custom part labels (e.g., "Step 1", "Step 2" instead of "Part A", "Part B")
4. Add "dependent" scoring (Part B only scored if Part A is correct)
5. Allow different standards for different parts

## Troubleshooting

### Issue: Point weights don't add up to 1.0
**Solution**: Adjust the weights. Common configurations:
- 2 parts: 0.5, 0.5
- 3 parts: 0.33, 0.33, 0.34
- 4 parts: 0.25, 0.25, 0.25, 0.25

### Issue: Student sees old version without sub-questions
**Solution**: Have them refresh the page (Ctrl+F5 or Cmd+Shift+R)

### Issue: Standards view shows wrong points
**Solution**: This should be fixed by the composite question implementation. If still wrong, check:
1. Scoring mode is set correctly
2. Point weights add up to 1.0
3. Browser cache is cleared

## Success! 🎉

You now have full support for linked questions. Students can:
- ✅ See all parts of a composite question
- ✅ Answer each part separately
- ✅ Get scored based on your chosen method (all-or-nothing or proportional)
- ✅ See accurate point values in standards view

Teachers can:
- ✅ Create multi-part questions in the editor
- ✅ Choose scoring mode per question
- ✅ Set custom point weights for each part
- ✅ Use with any standard
- ✅ Track student performance accurately

---

**Date**: January 25, 2026
**Status**: ✅ Complete and tested
**Build**: Successful (no errors)
