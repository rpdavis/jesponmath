# Quarter and Dates Field Debug Logging

## Issue
The assessment quarter field does not appear to save correctly when edited from "Q2" to "Q3" (3rd quarter). This document describes the comprehensive logging added to debug this issue.

## Logging Added

### 1. Assessment Editor Component (`src/components/assessments/AssessmentEditor.vue`)

#### Watch on `selectedQuarter`
Added a watch that triggers whenever the quarter selection changes:
```
🔍 DEBUG QUARTER WATCH - selectedQuarter changed!
  - Old value: [previous value]
  - New value: [new value]
  - Type: [typeof value]
```
This will show a stack trace to help identify where the quarter value is being changed.

#### In `performSave()` function
Logs the state of all key fields right before saving:
```
🔍 DEBUG - performSave called
🔍 DEBUG - selectedQuarter.value: [value]
🔍 DEBUG - assessment.value.assignDate: [date]
🔍 DEBUG - assessment.value.dueDate: [date]
🔍 DEBUG - assessment.value.academicPeriod: [value]
```

### 2. Assessment Form Composable (`src/composables/assessment/useAssessmentForm.ts`)

#### Date Update Functions
Added logging to `updateAssignDate()` and `updateDueDate()`:
```
🔍 DEBUG DATES - updateAssignDate called
  - Input value: [input field value]
  - Set assignDate to: [Date object]
  - Date ISO string: [ISO format]
```

```
🔍 DEBUG DATES - updateDueDate called
  - Input value: [input field value]
  - Set dueDate to: [Date object]
  - Date ISO string: [ISO format]
```

### 3. Assessment Save Composable (`src/composables/assessment/useAssessmentSave.ts`)

#### Quarter Processing
Extensive logging during quarter value determination:
```
🔍 DEBUG QUARTER - Starting quarter processing...
🔍 DEBUG QUARTER - Input selectedQuarter: [value]
🔍 DEBUG QUARTER - Type of selectedQuarter: [type]
🔍 DEBUG QUARTER - Using auto-detect, result: [value]
🔍 DEBUG QUARTER - Using "all" year
🔍 DEBUG QUARTER - Using specific quarter: [q1/q2/q3/q4]
🔍 DEBUG QUARTER - Invalid value, falling back to auto-detect: [value]
```

#### Assessment Data Before/After Conversion
Logs the state before and after converting dates to Firestore timestamps:
```
🔍 DEBUG DATES - Original assignDate: [value]
🔍 DEBUG DATES - Original dueDate: [value]
🔍 DEBUG DATES - assignDate type: [type]
🔍 DEBUG DATES - dueDate type: [type]

🔍 DEBUG QUARTER - Assessment data BEFORE timestamp conversion:
  - academicPeriod: [value]
  - assignDate: [value]
  - dueDate: [value]

📅 Converted assignDate to Timestamp: [date]
📅 Converted dueDate to Timestamp: [date]
⚠️ WARNING: assignDate is not a Date object: [value]

🔍 DEBUG QUARTER - Assessment data AFTER timestamp conversion:
  - academicPeriod: [value]
  - assignDate: [value]
  - dueDate: [value]
```

#### Before Update Call
Logs data being sent to the update function:
```
✏️ EDITING MODE: Updating assessment
🔍 DEBUG - Data being sent to updateAssessment:
  - assessmentId: [id]
  - academicPeriod: [value]
  - assignDate: [value]
  - dueDate: [value]
🔍 DEBUG - Full assessmentData object: [JSON]
```

### 4. Firebase IEP Services (`src/firebase/iepServices.ts`)

#### In `updateAssessment()` function
Comprehensive logging of data before and after the `removeUndefined()` call:
```
🔍 DEBUG - updateAssessment called with ID: [id]
🔍 DEBUG - Incoming assessmentData fields:
  - academicPeriod: [value]
  - assignDate: [value]
  - dueDate: [value]

🔍 DEBUG - After removeUndefined, cleanedData fields:
  - academicPeriod: [value]
  - assignDate: [value]
  - dueDate: [value]
🔍 DEBUG - Full cleanedData object: [JSON]

🔍 DEBUG - About to call updateDoc...
✅ DEBUG - updateDoc completed successfully
```

## How to Use This Logging

1. **Open Browser Console** (F12 or Cmd+Option+I)

2. **Edit an Assessment**:
   - Navigate to an existing assessment
   - Change the quarter from Q2 to Q3
   - Make any date changes if needed
   - Click Save

3. **Review Console Output** in this order:
   - Look for `🔍 DEBUG QUARTER WATCH` entries to see when the quarter changes
   - Look for `🔍 DEBUG - performSave` to see what values are being sent
   - Look for `🔍 DEBUG QUARTER - Starting quarter processing` to see how the quarter is transformed
   - Look for `🔍 DEBUG - Data being sent to updateAssessment` to see the final data
   - Look for `🔍 DEBUG - updateAssessment called` to see what Firebase receives
   - Look for `🔍 DEBUG - After removeUndefined` to see if data is being filtered out

4. **Common Issues to Check**:
   - Is `selectedQuarter` the correct value when `performSave()` is called?
   - Is `academicPeriod` being set correctly in the assessment data?
   - Is `removeUndefined()` removing the `academicPeriod` field?
   - Are dates being converted properly to Firestore Timestamps?
   - Is the `updateDoc()` call completing successfully?

## Expected Flow

When editing quarter from Q2 to Q3:
1. User changes dropdown → `DEBUG QUARTER WATCH` shows "q2" → "q3"
2. User clicks Save → `performSave` shows `selectedQuarter: "q3"`
3. Save composable processes → `academicPeriod: "q3"` set
4. Data sent to Firebase → `academicPeriod: "q3"` included
5. After `removeUndefined()` → `academicPeriod: "q3"` still present
6. `updateDoc()` completes successfully

If any step shows an unexpected value or the field is missing, that's where the bug is occurring.

## Clean Up

After debugging is complete, these console.log statements can be removed or converted to a debug flag system.
