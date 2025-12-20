# 🐛 Gradebook Scoring Issue - Adding Instead of Taking Top Score

## Problem Description

**Expected Behavior:**
- Student takes 3 assessments, scores 1/4 on each
- Standard is set to "take highest scoring attempts" with maxScore=4
- Should show: 1/4 (the highest individual score)

**Actual Behavior:**
- Shows: 3/4 (adding the scores: 1+1+1 = 3)
- Treating it as additive instead of keepTop

---

## 🔍 Root Cause Analysis

### The Scoring Logic (in `standardsUtils.ts`)

There are **3 scoring methods**:

#### 1. **'keepTop'** (What you want)
```typescript
// Takes the HIGHEST scoring attempts up to maxScore limit
if (scoringMethod === 'keepTop') {
  const sortedAttempts = [...questionAttempts].sort((a, b) => b.score - a.score)
  const topAttempts = sortedAttempts.slice(0, maxScore)  // Take top 4
  correct = topAttempts.filter(attempt => attempt.isCorrect).length
  total = maxScore  // Fixed denominator of 4
}
```

**With your data:**
- Student has 9 question attempts (3 assessments × 3 questions each)
- Sorted by score, take top 4 attempts
- Of those top 4, count how many are correct
- Result: Should show correct count / 4

#### 2. **'additive'** (Default - what's happening now)
```typescript
// ADDS all attempts, caps at maxScore
const rawCorrect = questionAttempts.filter(attempt => attempt.isCorrect).length
correct = Math.min(rawCorrect, maxScore)  // Cap at 4
total = maxScore  // 4
```

**With your data:**
- Student has 9 question attempts
- Count ALL correct: 3 correct total
- Cap at maxScore: min(3, 4) = 3
- Result: 3/4 ← **THIS IS WHAT'S SHOWING**

#### 3. **'average'** (Alternative)
- Averages percentage across all attempts

---

## 🎯 The Issue

**Line 61 in `standardsUtils.ts`:**
```typescript
const scoringMethod = customStandard?.scoringMethod || 'additive'
```

**If `scoringMethod` is not set, it defaults to 'additive'!**

This means your standard is either:
1. Not configured with `scoringMethod: 'keepTop'`
2. The field is not being saved to Firestore
3. The field is not being loaded from Firestore

---

## 🔍 How to Diagnose

### Check the Custom Standard in Firestore

1. Open **Firebase Console**
2. Go to **Firestore Database**
3. Find **customStandards** collection
4. Find your standard
5. Check if it has:
   ```
   scoringMethod: "keepTop"
   maxScore: 4
   ```

### Check in the Code

Add console logging to see what's loaded:

```typescript
// In Gradebook.vue, line 884
const customStd = getCustomStandardByCode(standard);
console.log('🔍 Standard config:', {
  standard,
  customStd,
  scoringMethod: customStd?.scoringMethod,
  maxScore: customStd?.maxScore
});
```

---

## ✅ Solutions

### Solution 1: Set scoringMethod in Database (Immediate)

**If using StandardsManager component:**
1. Go to Standards Manager (admin panel)
2. Find your standard
3. Set **Scoring Method** to "Keep Top"
4. Set **Max Score** to 4
5. Save

**Manually in Firestore:**
1. Open Firestore console
2. Find your standard document
3. Edit the document
4. Add/update field: `scoringMethod: "keepTop"`
5. Verify `maxScore: 4` exists
6. Save

### Solution 2: Fix the Code to Check scoringMethod

**Add debug logging** to verify it's working:

```typescript
// In Gradebook.vue getStandardScore function (line 884)
const customStd = getCustomStandardByCode(standard);

console.log(`📊 Calculating score for ${standard}:`, {
  foundCustomStandard: !!customStd,
  scoringMethod: customStd?.scoringMethod,
  maxScore: customStd?.maxScore,
  attemptCount: questionAttempts.length
});
```

### Solution 3: Verify StandardsManager Saves Correctly

Check `StandardsManager.vue` to ensure it's saving `scoringMethod`:

```typescript
// Should have something like:
const saveStandard = async () => {
  await setDoc(doc(db, 'customStandards', standardId), {
    code: standard.code,
    name: standard.name,
    maxScore: standard.maxScore,
    scoringMethod: standard.scoringMethod,  // ← Must be here!
    // ... other fields
  });
};
```

---

## 🧪 Test the Fix

### After Setting scoringMethod='keepTop'

**Example Scenario:**
- Student takes 3 assessments
- Assessment 1: Gets 1 question right out of 4 questions
- Assessment 2: Gets 1 question right out of 4 questions  
- Assessment 3: Gets 1 question right out of 4 questions
- Total: 12 question attempts (3 correct, 9 incorrect)

**With 'additive' (WRONG):**
```
questionAttempts = [12 attempts total]
rawCorrect = 3 (all correct questions)
correct = min(3, 4) = 3
total = 4
Result: 3/4 (75%) ❌ WRONG
```

**With 'keepTop' (CORRECT):**
```
questionAttempts = [12 attempts total]
sortedAttempts = [sort by score, highest first]
topAttempts = [take top 4]
correct = count how many of top 4 are correct
total = 4
Result: varies based on which were the top 4
```

Actually wait - I need to understand the scenario better. Let me check what "got 1/4 on each" means.

---

## ❓ Questions to Clarify

**What does "got 1/4 on each assessment" mean?**

**Option A:** Scored 1 out of 4 total points (25%)
- Assessment has 4 points total
- Student earned 1 point
- Could be: 1 question right (1pt), 3 questions wrong (0pt each)

**Option B:** Got 1 question correct out of 4 questions
- Assessment has 4 questions
- Student got 1 correct
- Each question worth 1 point

**Option C:** Something else?

---

## 🔧 Immediate Fix

**Add this console logging to diagnose:**

In `Gradebook.vue`, line 884-925, add:

```typescript
const customStd = getCustomStandardByCode(standard);

// DEBUG: Log the standard configuration
console.log(`🔍 DEBUG Standard Score for ${standard}:`, {
  studentUid,
  standard,
  customStd: customStd ? {
    code: customStd.code,
    name: customStd.name,
    scoringMethod: customStd.scoringMethod,
    maxScore: customStd.maxScore
  } : null,
  totalAttempts: questionAttempts.length
});

const result = calculateStandardScore(questionAttempts, customStd);

console.log(`📊 Calculated result:`, {
  correct: result.correct,
  total: result.total,
  percentage: result.percentage,
  scoringMethodUsed: customStd?.scoringMethod || 'additive (default)'
});
```

Run this and check the console to see:
1. Is `customStd` being found?
2. What is `scoringMethod` set to?
3. What is `maxScore` set to?
4. How many `questionAttempts` are there?

---

## 📋 Most Likely Issues

1. **scoringMethod not set in database** (most likely)
   - Fix: Go to StandardsManager and set it to "Keep Top"

2. **scoringMethod not being loaded**
   - Fix: Check Firestore rules allow reading that field

3. **Wrong standard being checked**
   - Fix: Verify the standard code matches exactly

---

**Want me to:**
1. Add debug logging to help diagnose?
2. Check the StandardsManager to see if it saves scoringMethod?
3. Create a migration script to set scoringMethod for existing standards?

Let me know what you'd like me to investigate!

