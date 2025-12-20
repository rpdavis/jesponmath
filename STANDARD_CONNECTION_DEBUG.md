# 🐛 Standard Connection Issue - Questions Not Linking to Standards

## Problem

**Symptom:**
- Student gets 3/4 on assessment with "two-step equation" standard
- Score shows in assignments view: 3/4 ✅
- Score shows 0/4 in standards view ❌
- Questions not connecting to the standard

---

## 🔍 How Standards Are Linked

### The Gradebook Logic (Lines 899-921)

```typescript
// Check if assessment-level standard matches
const assessmentStandards = parseStandards(assessment.standard);
const assessmentCoversStandard = assessmentStandards.includes(standard);

assessment.questions?.forEach(question => {
  // Check if question covers this standard
  const questionStandards = parseStandards(question.standard);
  const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;
  
  if (questionCoversStandard) {
    // Found a match! Count this question
    const response = result.responses?.find(r => r.questionId === question.id);
    if (response) {
      questionAttempts.push({
        isCorrect: response.isCorrect,
        score: response.score
      });
    }
  }
});
```

**The logic checks BOTH:**
1. `assessment.standard` (assessment-level)
2. `question.standard` (question-level)

**If EITHER matches the target standard, the question counts.**

---

## 🎯 Why It's Not Working

### Possible Issues

#### 1. **Assessment-level standard is empty**
```javascript
assessment.standard = undefined  // or empty string
```

**AND**

#### 2. **Question-level standards are also empty**
```javascript
question.standard = undefined  // for each question
```

**Result:** No match found, 0/4 shows in standards view

---

## 🔍 Diagnosis Steps

### Step 1: Check the Assessment in Firestore

1. Open **Firebase Console**
2. Go to **Firestore Database**
3. Find **assessments** collection
4. Find your assessment
5. Check:
   ```
   standard: "CUSTOM:two-step-equation" (or whatever the code is)
   questions: [
     {
       id: "...",
       standard: "CUSTOM:two-step-equation",  ← Should be here!
       questionText: "...",
       // ...
     }
   ]
   ```

### Step 2: Check Standard Code Format

The standard code must match **EXACTLY**:

**In customStandards:**
```
code: "two-step-equation"
```

**In assessment:**
```
standard: "CUSTOM:two-step-equation"  ← Note the CUSTOM: prefix!
```

**In questions:**
```
standard: "CUSTOM:two-step-equation"  ← Same format!
```

### Step 3: Add Debug Logging

In `Gradebook.vue` around line 899, add:

```typescript
// Check if assessment-level standard matches
const assessmentStandards = parseStandards(assessment.standard);
const assessmentCoversStandard = assessmentStandards.includes(standard);

console.log(`🔍 Checking assessment "${assessment.title}":`, {
  lookingFor: standard,
  assessmentStandard: assessment.standard,
  assessmentStandards: assessmentStandards,
  assessmentCoversStandard: assessmentCoversStandard,
  questionCount: assessment.questions?.length || 0
});

assessment.questions?.forEach(question => {
  const questionStandards = parseStandards(question.standard);
  const questionCoversStandard = questionStandards.includes(standard) || assessmentCoversStandard;
  
  console.log(`  Question "${question.questionText?.substring(0, 30)}...":`, {
    questionStandard: question.standard,
    questionStandards: questionStandards,
    matches: questionCoversStandard
  });
  
  if (questionCoversStandard) {
    // ... rest of code
  }
});
```

---

## 🔧 Most Likely Issue

### The AssessmentEditor Refactoring Lost Standard Assignment!

When you manually edit an assessment, the question standards might not be saved properly.

Let me check the AssessmentEditor save logic...

**In the original (`AssessmentEditor.vue.old`):**
- Questions had standards set at question level
- Standard selector component for each question

**In the refactored version:**
- QuestionEditor has standard selector
- But is it actually SAVING the standard to the question object?

Let me check `QuestionEditor.vue`:

```vue
<!-- Line 80-84 -->
<StandardSelector
  :modelValue="(question.standard || '') as any"
  :grade="gradeLevel.toString()"
  @update:modelValue="(val: any) => { 
    question.standard = typeof val === 'string' ? val : val?.standardId || '' 
  }"
/>
```

**This SHOULD be setting `question.standard`** when you select a standard.

---

## 🎯 Things to Check

### 1. Edit Your Assessment
1. Open the assessment in editor
2. Expand a question
3. Click on "📏 Standards for this Question"
4. Check if a standard is selected
5. If not, select "CUSTOM:two-step-equation" (or whatever your standard is)
6. Save the assessment

### 2. Verify in Firestore
After saving, check Firestore:
```javascript
assessments/{assessmentId}/questions[0]/standard
```

Should show:
```
"CUSTOM:two-step-equation"
```

### 3. Check the Standard Code
Make sure the standard codes match:

**In customStandards collection:**
```
code: "two-step-equation"
```

**In assessment/questions:**
```
standard: "CUSTOM:two-step-equation"
```

Note the `CUSTOM:` prefix!

---

## ❓ Questions for You

1. **When you view the assessment in the editor:**
   - Do the questions show a selected standard?
   - Or is the standard selector empty?

2. **What is the exact standard code?**
   - In Firebase customStandards, what is the `code` field?
   - Is it "two-step-equation" or "Two-Step Equation" or something else?

3. **Is this an OLD assessment** (created before refactoring)?
   - If yes, it might be missing the question-level standards
   - You'll need to edit it and add standards to each question

---

## 🔧 Quick Fix

**If standards aren't set on questions:**

1. **Edit the assessment**
2. **For each question:**
   - Expand the question
   - Click "📏 Standards for this Question"  
   - Select your standard from the dropdown
3. **Save the assessment**
4. **Refresh gradebook**

---

**Want me to:**
1. Add logging to show what standards are found when saving?
2. Check if there's a bug in how QuestionEditor saves standards?
3. Create a migration script to add standards to questions based on assessment-level standard?

Let me know what you need!
