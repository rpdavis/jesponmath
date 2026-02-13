# Backslash to Forward Slash Auto-Correction

## Feature Overview

Students' answers now automatically convert backslashes (`\`) to forward slashes (`/`) for fraction notation. This helps students who might type `3\4` (confusing LaTeX syntax) when they mean `3/4`.

## The Problem

Students were typing backslashes in fraction answers because:
- They see LaTeX syntax in questions (e.g., `\frac{1}{2}`)
- They might think `\` is used for division
- Keyboard muscle memory from other contexts

This caused their answers to be marked incorrect even when mathematically correct.

## The Solution

**Auto-correction in real-time** - as students type, backslashes are automatically converted to forward slashes.

### Implementation Location

**File:** `/src/components/RichTextAnswerInput.vue` (lines 36-48)

```typescript
const cleanedValue = value
  .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with regular spaces
  .replace(/<[^>]*>/g, '')  // Remove any HTML tags
  .replace(/\\/g, '/')      // ← NEW: Convert backslashes to forward slashes
  .trim();                  // Trim leading/trailing spaces
```

### Why This Is Safe

1. ✅ **No conflict with prefix/suffix affixes** - Affixes (like units with LaTeX) are stored separately in `answerPrefix`/`answerSuffix` fields and are NOT part of the student's answer
2. ✅ **No valid use for backslash in math answers** - Students should never need to type `\` in numeric/algebraic answers
3. ✅ **Won't affect LaTeX in questions** - Questions use a separate rendering system; student input is plain text
4. ✅ **Transparent to student** - They see the correction immediately as they type

### Examples

| Student Types | Auto-Corrected To | Result |
|---------------|-------------------|--------|
| `3\4` | `3/4` | ✅ Correct |
| `1\2 + 1\4` | `1/2 + 1/4` | ✅ Correct |
| `3 \ 4` | `3 / 4` | ✅ Correct (with spaces) |
| `x\y` | `x/y` | ✅ Correct (algebraic) |

### What Gets Stored in Database

The **corrected answer** is stored in Firestore:
- Student types: `3\4`
- Stored in database: `3/4`
- Compared against: `3/4`

This means the correction is permanent and consistent across all grading/comparison logic.

### Components Affected

This change affects all short-answer question inputs because they all use `RichTextAnswerInput.vue`:
- ✅ Short Answer questions
- ✅ Fill-in-the-blank questions (when using text input)
- ✅ Any custom question types using this component

### Technical Notes

**Why replace ALL backslashes (not just between digits)?**
- Simple and robust: `.replace(/\\/g, '/')`
- Handles edge cases: `3 \ 4`, `x\y`, multiple fractions
- No legitimate use case for backslash in student answers
- More maintainable code

**Alternative considered:**
- `.replace(/(\d)\s*\\\s*(\d)/g, '$1/$2')` - only between digits
- Rejected because it's more complex and doesn't handle algebraic fractions

### User Experience

**Before:**
- Student types `3\4`
- Answer marked incorrect
- Student confused why

**After:**
- Student types `3\4`
- Input immediately shows `3/4`
- Answer marked correct
- Student learns correct notation

### Testing Checklist

To verify this feature works:
1. ✅ Create a short-answer question with answer `3/4`
2. ✅ Student types `3\4` → should auto-correct to `3/4`
3. ✅ Submit assessment → should be marked correct
4. ✅ Check database → should store `3/4` (not `3\4`)
5. ✅ Verify questions with LaTeX still render correctly

## Build Status

✅ No TypeScript errors  
✅ No linter errors  
✅ Ready to deploy

## Related Files

- `/src/components/RichTextAnswerInput.vue` - Input component with auto-correction
- `/src/utils/answerUtils.ts` - Answer comparison/normalization utilities
- `/src/components/assessments/AssessmentTaking.vue` - Assessment taking interface
- `/src/types/iep.ts` - Type definitions (includes `answerPrefix`/`answerSuffix`)
