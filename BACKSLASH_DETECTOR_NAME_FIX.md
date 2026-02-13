# Backslash Detector - Student Name Display Fix

## Issue
Student names were showing as "undefined undefined" in the detector table.

## Root Cause
The student data fetching logic wasn't properly handling cases where:
- `firstName` or `lastName` fields were missing/empty
- Student documents had different field structures
- No fallback logic for missing names

## Fix Applied

Updated `/src/components/admin/BackslashAnswerDetector.vue` with robust name handling:

```typescript
// Format student name with fallbacks
let studentName = 'Unknown Student'
if (student) {
  if (student.displayName) {
    studentName = student.displayName
  } else if (student.firstName || student.lastName) {
    studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim()
  } else if (student.email) {
    studentName = student.email.split('@')[0] // Use email username as fallback
  }
}
```

## Fallback Priority

1. **`displayName`** - If available, use it (most reliable)
2. **`firstName` + `lastName`** - Combine if either exists, trim whitespace
3. **Email username** - Extract username part before @ symbol
4. **"Unknown Student"** - Final fallback if nothing else available

## What Changed

**Before:**
```
Student: undefined undefined
```

**After:**
```
Student: John Smith          (if displayName or firstName/lastName exist)
Student: john.smith          (if only email exists: john.smith@school.edu)
Student: Unknown Student     (if no data at all)
```

## Testing

✅ TypeScript check passed  
✅ No linter errors  
✅ Build successful

## How to Verify

1. Navigate to `/admin/backslash-detector`
2. Click "Scan All Assessment Results"
3. Check the "Student" column in the results table
4. Should now show actual student names instead of "undefined undefined"

## Impact

- **Better UX:** Admins can now identify which students need correction
- **Better Exports:** CSV exports will have actual student names
- **No Breaking Changes:** Existing functionality unchanged, just display improvement

## Related Files

- `/src/components/admin/BackslashAnswerDetector.vue` - Fixed student name display logic
- `/src/types/users.ts` - Student interface reference (displayName, firstName, lastName)
- `/src/firebase/userServices.ts` - Similar patterns used elsewhere in codebase
