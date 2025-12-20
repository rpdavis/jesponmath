# Manual Score Not Saving Issue

## Problem

When entering manual scores in the gradebook:
1. Enter scores for questions
2. Click "Save Scores"
3. No change appears in gradebook
4. No submitted assessment shows up

## What to Check

### 1. Open Browser Console

When you save manual scores, look for these messages:

**Success:**
```
✅ Manual scores saved successfully
✅ Created manual assessment result with ID: ...
```

**Error:**
```
❌ Error saving manual scores: ...
Failed to save scores: ...
```

### 2. Check Firestore

After attempting to save:
1. Open Firebase Console
2. Go to Firestore Database
3. Check `assessmentResults` collection
4. Look for a new result with:
   - `studentUid`: Israel Ramos's UID
   - `assessmentId`: The assessment ID
   - `manuallyAdjusted`: true

**Is it there?**
- YES → Saving works, but gradebook not refreshing
- NO → Save is failing (check console for errors)

### 3. Check Browser Network Tab

1. Open DevTools → Network tab
2. Try saving manual score
3. Look for Firestore requests
4. Check if any fail (red)

## Possible Issues

### Issue 1: Save Failing Silently
**Symptom:** No error message, but nothing saves
**Cause:** Permission denied or validation error
**Fix:** Check Firestore rules

### Issue 2: Gradebook Not Refreshing
**Symptom:** Data saves but doesn't appear
**Cause:** `loadGradebookData()` not working or cache issue
**Fix:** Clear cache and refresh

### Issue 3: UID Mismatch
**Symptom:** Saves to wrong student
**Cause:** Student UID mismatch
**Fix:** Check that `selectedStudent.value.uid` is correct

## What I Need

**Please check browser console after trying to save and tell me:**
1. Do you see "✅ Manual scores saved successfully"?
2. Do you see any errors (red text)?
3. Do you see "✅ Created manual assessment result with ID: ..."?

OR

**Check Firestore:**
1. Does a new result appear in `assessmentResults` collection?
2. What is its `studentUid` field?
3. Does it have `responses` array with question scores?

This will tell me if it's a save issue or a display issue.
