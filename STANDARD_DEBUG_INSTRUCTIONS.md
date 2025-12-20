# 🔍 Debug Instructions - Standard Connection Issue

## What I Added

I added **comprehensive debug logging** to the Gradebook to help diagnose why standards aren't connecting.

---

## 🧪 How to Test

### 1. Open the Gradebook
- Navigate to your gradebook
- Switch to **Standards View**
- Open browser console (F12 or Cmd+Option+I)

### 2. Look at the Console Output

You should see logs like this:

```javascript
🔍 Assessment "Two-Step Equations Practice":
  assessmentStandard: "CUSTOM:two-step-equation"
  parsedStandards: ["CUSTOM:two-step-equation"]
  lookingFor: "CUSTOM:two-step-equation"
  matches: true

  📝 Question: "Solve for x: 2x + 3 = 11..."
    questionStandard: "CUSTOM:two-step-equation"
    parsedStandards: ["CUSTOM:two-step-equation"]
    inheritedFromAssessment: true
    matches: true
    
    ✅ Added attempt: CORRECT (1 pts)
    
  📝 Question: "Solve for x: 3x - 5 = 10..."
    questionStandard: "(none)"
    parsedStandards: []
    inheritedFromAssessment: true
    matches: true
    
    ✅ Added attempt: WRONG (0 pts)

📊 Standard "CUSTOM:two-step-equation" for student:
  targetStandard: "CUSTOM:two-step-equation"
  assessmentsChecked: 5
  assessmentsWithResults: 3
  questionsFound: 12
  questionsMatched: 12
  totalAttempts: 12
  correctAttempts: 3
```

---

## 🎯 What to Look For

### ✅ GOOD - Standards Are Connecting

If you see:
```
matches: true
✅ Added attempt: ...
totalAttempts: 12
```

**Then standards ARE connecting!** The issue is the **scoring method** (see GRADEBOOK_SCORING_ISSUE.md)

---

### ❌ BAD - Standards NOT Connecting

If you see:
```
🔍 Assessment "...":
  assessmentStandard: undefined (or different code)
  matches: false

📝 Question: "...":
  questionStandard: "(none)"
  matches: false

📊 Standard "...":
  questionsMatched: 0
  totalAttempts: 0  ← THIS IS THE PROBLEM
```

**Then standards are NOT set on the assessment/questions!**

---

## 🔧 Fixes Based on What You Find

### If `totalAttempts: 0`

**Problem:** Standards not saved on questions

**Fix:**
1. Edit the assessment
2. Click on a question to expand it
3. Click "📏 Standards for this Question"
4. Select the standard from dropdown
5. Repeat for all questions
6. Save

### If `assessmentStandard: undefined`

**Problem:** Assessment-level standard not set

**Fix:**
1. Edit the assessment
2. In "Overall Standard" field at the top
3. Select your standard
4. Save

### If Standard Codes Don't Match

**Example of mismatch:**
```
lookingFor: "CUSTOM:two-step-equation"
assessmentStandard: "CUSTOM:Two-Step-Equation"  ← Capital letters!
matches: false  ← MISMATCH!
```

**Fix:** Ensure exact match (case-sensitive):
- Standard code in customStandards: `"two-step-equation"`
- Assessment standard: `"CUSTOM:two-step-equation"`
- Question standards: `"CUSTOM:two-step-equation"`

---

## 📋 Common Issues

### 1. Missing CUSTOM: Prefix

**Wrong:**
```javascript
assessment.standard = "two-step-equation"
```

**Correct:**
```javascript
assessment.standard = "CUSTOM:two-step-equation"
```

### 2. Case Sensitivity

**Wrong:**
```javascript
customStandard.code = "Two-Step-Equation"
assessment.standard = "CUSTOM:two-step-equation"
// Won't match!
```

**Correct:**
```javascript
customStandard.code = "two-step-equation"
assessment.standard = "CUSTOM:two-step-equation"
// Matches!
```

### 3. Standards Not Saved to Questions

**If you edited an OLD assessment** (before refactoring):
- It might only have assessment-level standard
- Questions might not have individual standards set
- You'll need to add them manually

---

## 🚀 Next Steps

1. **Open gradebook → Standards view**
2. **Open browser console**
3. **Find your student/standard**
4. **Read the console logs**
5. **Report back what you see:**
   - What is `assessmentStandard`?
   - What are `questionStandard` values?
   - What is `totalAttempts`?
   - Do the codes match exactly?

Then I can tell you exactly what to fix!

---

## 💡 Quick Test

**Check one assessment in Firestore:**

1. Firebase Console → Firestore
2. Find your assessment
3. Look at the data:

```json
{
  "title": "Two-Step Equations",
  "standard": "CUSTOM:two-step-equation",  ← Is this set?
  "questions": [
    {
      "id": "q1",
      "questionText": "...",
      "standard": "CUSTOM:two-step-equation",  ← Is THIS set?
      "questionType": "multiple-choice",
      // ...
    }
  ]
}
```

**Both should have the standard field!**

---

Let me know what the console shows and I'll help you fix it!

