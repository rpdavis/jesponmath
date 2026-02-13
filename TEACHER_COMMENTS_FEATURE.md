# Teacher Comments on Manual Score Adjustments

## Overview

Added the ability for teachers to leave comments for students when manually adjusting their assessment points. This provides feedback explaining why points were changed.

## The Feature

### For Teachers (Editing Points)

When editing a question's points:

1. **Click "✏️ Edit"** on any question
2. **Adjust points** (0 to max points)
3. **Add comment** in the textarea (optional)
4. **Click "✅ Save"**

**Comment field:**
```
💬 Comment for student (optional):
┌─────────────────────────────────────┐
│ Explain why points were adjusted... │
│                                     │
└─────────────────────────────────────┘
```

### For Students (Viewing Results)

Students see the comment under the adjusted points:

```
Points: 2 / 3 pts (Adjusted by teacher)

💬 Teacher Comment:
Great work! Gave partial credit because you showed 
correct process but had a small calculation error.
```

## Use Cases

### Partial Credit
**Points:** 0 → 2 (out of 3)  
**Comment:** "Correct method, minor calculation error in step 3"

### Extra Credit
**Points:** 3 → 4 (out of 3)  
**Comment:** "Excellent! Used a more efficient method. Bonus point."

### Grading Mistake Correction
**Points:** 0 → 3 (full credit)  
**Comment:** "My apologies - this was actually correct. Auto-grader didn't recognize your format."

### Variable Letter Issue (Before Auto-fix)
**Points:** 0 → 1  
**Comment:** "Your equation was correct, just used 'c' instead of 'x'. Both are acceptable."

### Show Work Partial Credit
**Points:** 0 → 1 (out of 2)  
**Comment:** "Correct final answer but missing work shown. Half credit."

## Technical Implementation

### New Field Added

**File:** `/src/types/iep.ts` (line 246)

```typescript
export interface AssessmentResponse {
  questionId: string
  studentAnswer: string | string[]
  isCorrect: boolean
  pointsEarned: number
  // ... existing fields ...
  teacherComment?: string  // ← NEW FIELD
  // ... other fields ...
}
```

### UI Changes

**File:** `/src/components/assessments/AssessmentResult.vue`

**Added:**
1. **Comment textarea** in editing mode (lines 110-116)
2. **Comment display** for students (lines 142-146)
3. **Reactive state** for editing comments (`editingComments`)
4. **Save logic** to store/remove comments
5. **CSS styling** for comment field and display

### State Management

```typescript
// Reactive refs
const editingComments = ref<Record<string, string>>({});

// Load existing comment when editing starts
const startEditingPoints = (questionId: string, currentPoints: number) => {
  const response = result.value?.responses?.find(r => r.questionId === questionId);
  editingComments.value[questionId] = response?.teacherComment || '';
};

// Save comment with points
const savePointsEdit = async (questionId: string) => {
  const newComment = editingComments.value[questionId]?.trim() || '';
  
  if (newComment) {
    response.teacherComment = newComment;  // Save
  } else {
    delete response.teacherComment;  // Remove if cleared
  }
};
```

### Database Storage

Stored in Firestore at:
```
/assessmentResults/{resultId}/responses[i]/teacherComment
```

Example document:
```json
{
  "responses": [
    {
      "questionId": "q1",
      "studentAnswer": "4c+5=6",
      "pointsEarned": 1,
      "isCorrect": true,
      "manuallyAdjusted": true,
      "adjustedBy": "teacher@school.edu",
      "adjustedAt": "2026-01-22T10:30:00Z",
      "adjustmentReason": "Partial credit given",
      "teacherComment": "Correct equation, just used different variable"
    }
  ]
}
```

## User Experience

### Teacher Workflow

**Before:**
```
1. Click "✏️ Edit"
2. Change points
3. Click "✅ Save"
   ↓
Student sees: "2 / 3 pts (Adjusted by teacher)"
Student wonders: "Why did I lose a point?"
```

**After:**
```
1. Click "✏️ Edit"
2. Change points
3. Type comment: "Correct method, minor calc error"
4. Click "✅ Save"
   ↓
Student sees: 
  "2 / 3 pts (Adjusted by teacher)"
  💬 Teacher Comment: "Correct method, minor calc error"
Student understands: "Oh, I see where I went wrong!"
```

### Student Benefit

**Clear Feedback:**
- Knows exactly why points changed
- Learns from mistakes
- Feels communication is transparent

**Motivating:**
- Positive comments for partial credit
- Encouragement for improvement
- Recognition of effort

## Comment Features

### Optional
- Teachers can leave comment OR skip it
- Empty comments are not saved
- Clearing comment removes it from database

### Preserved
- Comments survive across edits
- Editing points again shows previous comment
- Can update comment anytime

### Multi-line
- Textarea supports line breaks
- `white-space: pre-wrap` preserves formatting
- Can write detailed feedback

### Character Limit
- No hard limit (Firestore supports large strings)
- Recommend keeping under 500 characters for UX

## Styling

### Comment Input (Teacher View)
```css
- Full width textarea
- 2 rows minimum
- Border highlights on focus (blue)
- Placeholder text
- Resize handle for longer comments
```

### Comment Display (Student View)
```css
- Light blue background (#eff6ff)
- Blue left border (3px)
- Rounded corners
- Pre-wrap text (respects line breaks)
- Clear label: "💬 Teacher Comment:"
```

## Examples by Scenario

### Scenario 1: Backslash Issue (Pre-fix)

**Before feature was enabled:**

**Teacher edits:**
- Points: 0 → 1
- Comment: "Your answer was correct! The system didn't accept your backslash. I've enabled a new feature so this won't happen again."

**Student sees:**
```
Your Answer: 4\5+6=7
Points: 1 / 1 pts (Adjusted by teacher)

💬 Teacher Comment:
Your answer was correct! The system didn't accept 
your backslash. I've enabled a new feature so this 
won't happen again.
```

---

### Scenario 2: Partial Credit for Process

**Teacher edits:**
- Points: 0 → 2 (out of 3)
- Comment: "Great work showing your process! You set up the equation correctly. Just a small error in the final calculation."

**Student sees:**
```
Your Answer: x = 7
Correct Answer: x = 8
Points: 2 / 3 pts (Adjusted by teacher)

💬 Teacher Comment:
Great work showing your process! You set up the 
equation correctly. Just a small error in the 
final calculation.
```

---

### Scenario 3: Alternative Method

**Teacher edits:**
- Points: 0 → 3 (full credit)
- Comment: "Excellent! You used a different but equally valid method. The auto-grader didn't recognize your approach."

**Student sees:**
```
Your Answer: 2(x+3)=10
Correct Answer: 2x+6=10
Points: 3 / 3 pts (Adjusted by teacher)

💬 Teacher Comment:
Excellent! You used a different but equally valid 
method. The auto-grader didn't recognize your approach.
```

---

### Scenario 4: Encouragement

**Teacher edits:**
- Points: 1 → 2 (out of 3)
- Comment: "Good effort! You understood the concept but made a sign error. Keep practicing!"

**Student sees:**
```
Points: 2 / 3 pts (Adjusted by teacher)

💬 Teacher Comment:
Good effort! You understood the concept but made 
a sign error. Keep practicing!
```

## Best Practices

### ✅ DO Write Comments When:

1. **Partial credit given** - Explain what was right/wrong
2. **Grading errors** - Apologize and explain the correction
3. **Alternative methods** - Recognize creative approaches
4. **Encouragement needed** - Motivate struggling students
5. **Learning opportunity** - Point out specific mistakes to learn from

### ⚠️ Consider Skipping When:

1. **Obvious full credit** - No explanation needed
2. **Clearly wrong** - 0 points is self-explanatory
3. **Bulk adjustments** - Same comment for many students (use announcement instead)

### 💡 Tips for Effective Comments:

1. **Be specific:** "Step 3 calculation error" vs "Wrong answer"
2. **Be positive:** "Good process, small error" vs "You messed up"
3. **Be brief:** 1-2 sentences usually enough
4. **Be constructive:** Point to what to study or practice

## Accessibility

- Label associated with textarea (screen readers)
- Clear visual hierarchy
- High contrast colors
- Keyboard navigation supported

## Future Enhancements

### Possible Additions:

1. **Comment templates** - Pre-written common feedback
2. **Rich text** - Bold, italics, links
3. **Character counter** - Show remaining space
4. **Comment history** - Track all past comments
5. **Bulk comments** - Add same comment to multiple students
6. **Student replies** - Allow students to ask follow-ups

## Build Status

✅ TypeScript check passed  
✅ Feature fully functional  
✅ UI responsive and styled  
✅ Database field added  
✅ **Ready to use!**

## Files Modified

1. `/src/types/iep.ts` - Added `teacherComment` field to `AssessmentResponse`
2. `/src/components/assessments/AssessmentResult.vue` - Added UI, logic, and styling

## Summary

**For Teachers:**
- Click Edit → Adjust points → Add comment (optional) → Save
- Comment explains why points changed
- Can update comment anytime

**For Students:**
- See adjusted points with teacher's explanation
- Understand mistakes and learn
- Feel transparent communication

**Benefits:**
- Better feedback loop
- Clearer grading rationale
- Improved student learning
- Reduced confusion and questions

Perfect for explaining partial credit, grading corrections, and encouraging students! 🎉
