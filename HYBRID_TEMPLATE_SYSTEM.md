# Hybrid Template System Implementation

**Date**: December 22, 2025  
**Feature**: Saved templates now actually used for question generation with fallback to coded templates

---

## 🎯 Implementation Overview

The system now uses a **hybrid approach** for question generation:

1. **Check for saved templates first** (from database)
2. **Fall back to coded templates** (from code) if no match found
3. **Use AI for variation** (optional, based on config)

---

## 🔄 How It Works

### Question Generation Flow:

```
┌─────────────────────────────────────────┐
│  Teacher Generates Assessment for Goal  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  STEP 1: Search Database for Matching  │
│  Saved Templates                        │
└─────────────────┬───────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
       ▼ Found               ▼ Not Found
┌─────────────┐       ┌────────────────┐
│ Use Saved   │       │ Use Coded      │
│ Template    │       │ Template       │
│ (Database)  │       │ (From Code)    │
└──────┬──────┘       └────────┬───────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ Hybrid Mode?        │
         └─────────┬───────────┘
                   │
       ┌───────────┴──────────┐
       │                      │
       ▼ Yes                  ▼ No
┌─────────────┐        ┌─────────────┐
│ Add AI      │        │ Use Template│
│ Variation   │        │ As-Is       │
└──────┬──────┘        └──────┬──────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Return Question│
         └────────────────┘
```

---

## 📁 Files Modified

### 1. `src/services/goalQuestionGenerator.ts`

**New Functions Added**:

```typescript
// Find matching template from database
async function findMatchingTemplate(goal: Goal): Promise<GoalTemplate | null>

// Generate question from saved template
function generateQuestionFromTemplate(
  template: GoalTemplate,
  goal: Goal,
  questionNumber: number
): QuestionResult | null

// Modified main function to check templates first
export async function generateQuestionForGoal(...)
```

**Imports Added**:
```typescript
import type { GoalTemplate } from '@/types/iep'
import { getActiveTemplates, incrementTemplateUsage } from '@/firebase/templateServices'
```

---

## 🎯 Template Matching Algorithm

The system scores each saved template based on:

| Criteria | Score | Description |
|----------|-------|-------------|
| **Area of Need Match** | +10 | Exact match on area of need |
| **Area of Need Contains** | +5 | Goal area contains template area |
| **Topic Match** | +15 | Goal text/title contains template topic |
| **Subject Match** | +5 | Same subject (math, ela, other) |
| **Grade Level Match** | +3 | Exact grade level match |
| **Grade Level Close** | +1 | Within 1 grade level |
| **Assessment Method** | +2 | Same method (app/paper/hybrid) |
| **Has Example Question** | +5 | Template has example question/answer |

**Threshold**: Score must be ≥ 15 to use template

**Result**: Best matching template is used, or falls back to coded templates

---

## 🔑 Key Features

### 1. **Automatic Template Detection**
- System automatically finds best matching template
- No manual template selection needed
- Transparent to teacher

### 2. **Intelligent Scoring**
- Multiple criteria for matching
- Weighted scoring prioritizes important factors
- Threshold ensures good matches only

### 3. **Usage Tracking**
- Increments `usageCount` when template is used
- Helps identify popular/useful templates
- Can inform template management

### 4. **Fallback Safety**
- If no templates match: uses coded templates ✅
- If template fetch fails: uses coded templates ✅
- If template missing fields: uses coded templates ✅
- System never fails due to template issues

### 5. **AI Variation (Optional)**
- In hybrid mode, AI adds variation to template questions
- Prevents identical questions across assessments
- Maintains template structure/quality

---

## 💡 Example Scenarios

### Scenario 1: Perfect Match Found

**Goal**: 
```
Title: "Elapsed Time Word Problems - Grade 3"
Text: "Given elapsed time word problems, student will solve correctly"
Area of Need: "Math Computation"
Grade Level: 3
```

**Saved Template**:
```
Name: "Elapsed Time Word Problems Template"
Topic: "elapsed time"
Area of Need: "Math Computation"
Grade Level: 3
Example Question: "Sarah started reading at 2:15 PM. She read for 45 minutes. What time did she finish?"
Example Answer: "3:00 PM"
```

**Score**: 10 (area) + 15 (topic) + 5 (subject) + 3 (grade) + 5 (has example) = **38**

**Result**: ✅ Template used! (score ≥ 15)

---

### Scenario 2: Partial Match (Still Used)

**Goal**:
```
Title: "Two-Step Word Problems"
Text: "Student will solve two-step word problems"
Area of Need: "Math Problem Solving"
Grade Level: 7
```

**Saved Template**:
```
Name: "Multi-Step Word Problem Template"
Topic: "two-step"
Area of Need: "Math Computation"
Grade Level: 7
Example Question: "Maria had $25. She bought a book for $12..."
```

**Score**: 5 (area contains) + 15 (topic match) + 5 (subject) + 3 (grade) + 5 (has example) = **33**

**Result**: ✅ Template used!

---

### Scenario 3: No Good Match (Falls Back)

**Goal**:
```
Title: "Reading Comprehension - Main Idea"
Text: "Student will identify main idea in passages"
Area of Need: "Reading Comprehension"
Grade Level: 5
```

**Saved Templates**: Only math templates available

**Best Score**: 5 (subject mismatch = 0, no topic match = 0...)

**Result**: ❌ No match (score < 15) → **Uses coded template from code**

---

## 📊 How This Helps You

### **Before This Change:**

```
1. Save template → Success message
2. Generate new assessment → Uses coded template
3. "Why isn't my saved template being used?!" 😡
```

### **After This Change:**

```
1. Save template with topic "elapsed time"
2. Generate assessment for "elapsed time" goal
3. System finds your template automatically
4. Uses your example question as the pattern
5. "It's using my template! Perfect!" 😊
```

---

## 🛠️ Technical Details

### Template Search Query:
```typescript
// Fetches from Firestore
const templates = await getActiveTemplates()

// Filters for isActive: true
// Returns all active templates
```

### Scoring Function:
```typescript
const scoredTemplates = templates.map(template => {
  let score = 0
  // ... apply scoring criteria ...
  return { template, score }
})

// Sort by score (highest first)
scoredTemplates.sort((a, b) => b.score - a.score)

// Return if score ≥ 15
if (bestMatch.score >= 15) {
  return bestMatch.template
}
return null // Fall back to coded templates
```

### Usage Tracking:
```typescript
// Increments usageCount in database
await incrementTemplateUsage(template.id)
```

---

## ✅ Testing Checklist

### Test 1: Template Match
1. Create a template with topic "elapsed time"
2. Save with example question/answer
3. Create goal with "elapsed time" in text
4. Generate assessment
5. **Expected**: Uses your template's example question

### Test 2: No Match Fallback
1. Create goal with unique topic (e.g., "geometry angles")
2. No saved templates for this topic
3. Generate assessment
4. **Expected**: Uses coded template (still works!)

### Test 3: Template Variation (Hybrid Mode)
1. Generate multiple assessments from same goal
2. Same template matches each time
3. **Expected**: Questions similar but with AI variation

### Test 4: Template Usage Count
1. Note template's usageCount in database
2. Generate assessment using that template
3. Check usageCount again
4. **Expected**: Incremented by 1

---

## 🎓 Understanding the Source Tags

Questions now have a `_source` tag indicating origin:

| Source Tag | Meaning |
|------------|---------|
| `template` | From **saved** template (database) |
| `ai` | Generated by AI from scratch |
| `ai-with-template-reference` | AI used **saved** template as reference |
| `fallback` | AI failed, fell back to coded template |

*If no tag or tag is `template`*, could be either:
- Coded template (from `goalQuestionGenerator.ts`)
- Saved template (from database)

To tell which:
- Check console: "✨ Found matching template" = saved
- Check console: "📋 No matching template found" = coded

---

## 🚀 Future Enhancements

### Potential Improvements:

1. **Manual Template Selection**
   - UI to browse/select templates
   - Override automatic matching

2. **Template Preview**
   - Show which template will be used
   - Preview before generating

3. **Template Suggestion**
   - Suggest creating template for frequently used goals
   - "Save this pattern as template?"

4. **Template Analytics**
   - Dashboard showing most-used templates
   - Template effectiveness metrics

5. **Template Sharing**
   - Share templates between teachers
   - District-wide template library

---

## 📝 Summary

### What Changed:
- ✅ Saved templates now **actually used** for generation
- ✅ Automatic matching based on goal characteristics
- ✅ Falls back to coded templates if no match
- ✅ Usage tracking for template analytics
- ✅ Works with existing AI variation in hybrid mode

### What Stayed the Same:
- ✅ Coded templates still work as before
- ✅ No breaking changes to existing functionality
- ✅ Same UI for teachers
- ✅ Same generation workflow

### Result:
**Best of both worlds**: Leverage saved templates when available, use reliable coded templates as fallback!

---

**Status**: ✅ **IMPLEMENTED** - Hybrid template system is now live




