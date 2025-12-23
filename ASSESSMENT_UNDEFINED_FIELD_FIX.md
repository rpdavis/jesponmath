# Assessment Undefined Field Fix

## Issue
When creating a new assessment, the save operation was failing with the following error:

```
FirebaseError: [code=invalid-argument]: Function addDoc() called with invalid data. 
Unsupported field value: undefined (found in field timeLimit in document assessments/...)
```

## Root Cause
The `createAssessment`, `updateAssessment`, and `duplicateAssessment` functions in `src/firebase/iepServices.ts` were not removing `undefined` values before saving to Firestore. Firestore does not allow `undefined` values in documents - fields must either have a defined value or be omitted entirely.

When creating an assessment without specifying a time limit, the `timeLimit` field was being set to `undefined`, which caused the save operation to fail.

## Solution
Applied the existing `removeUndefined` helper function (which was already being used for `saveAssessmentResult`) to all assessment creation and update operations:

### Changes Made

1. **`createAssessment` function** - Now cleans undefined values before saving:
```typescript
export const createAssessment = async (
  assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>,
) => {
  try {
    // Remove undefined values before saving (Firestore doesn't allow undefined)
    const cleanedData = removeUndefined({
      ...assessmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    const docRef = await addDoc(collection(db, 'assessments'), cleanedData)
    return docRef.id
  } catch (error) {
    console.error('Error creating assessment:', error)
    throw error
  }
}
```

2. **`updateAssessment` function** - Now cleans undefined values before updating:
```typescript
export const updateAssessment = async (
  assessmentId: string,
  assessmentData: Partial<Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>>,
) => {
  try {
    // Remove undefined values before updating (Firestore doesn't allow undefined)
    const cleanedData = removeUndefined({
      ...assessmentData,
      updatedAt: serverTimestamp(),
    })
    
    const docRef = doc(db, 'assessments', assessmentId)
    await updateDoc(docRef, cleanedData)
  } catch (error) {
    console.error('Error updating assessment:', error)
    throw error
  }
}
```

3. **`duplicateAssessment` function** - Now cleans undefined values before saving the duplicate:
```typescript
// Remove undefined values before saving
const cleanedData = removeUndefined(duplicatedData)

const docRef = await addDoc(collection(db, 'assessments'), cleanedData)
```

## Impact
- ✅ Assessments can now be created without specifying a time limit
- ✅ Assessments can be updated with partial data containing undefined fields
- ✅ Assessments can be duplicated without errors
- ✅ All assessment save operations now follow the same data cleaning pattern
- ✅ Consistent with the existing `saveAssessmentResult` function

## Testing
After the fix:
1. Create a new assessment without setting a time limit
2. Save the assessment - should succeed without errors
3. The `timeLimit` field will be omitted from the Firestore document (rather than being set to undefined)

## Status
✅ **Fixed and deployed to production** 

**Build:** ✅ Successful  
**Deploy:** ✅ Complete  
**Hosting URL:** https://jepsonmath.web.app

## Deployment Details
- **Build completed:** Successfully (0 errors)
- **Deployed to:** Firebase Hosting (jepsonmath)
- **Files deployed:** 88 files from dist/
- **Status:** ✅ Live

## Next Steps
1. Clear your browser cache or hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Navigate to https://jepsonmath.web.app
3. Try creating a new assessment - the `timeLimit: undefined` error should be gone!

