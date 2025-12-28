# ✅ Explicit Template Assignment Implementation Complete

## What Was Implemented

We've added a new **explicit template assignment system** that allows you to directly link specific question templates to specific goals, bypassing the fuzzy matching algorithm.

---

## The Problem We Solved

### Issue
Your "Elapsed Time" goal was generating **money questions** instead of time questions because:

1. A saved template in the database had:
   - `areaOfNeed`: "Math - Elapsed Time" ✅ (correct)
   - `exampleQuestion`: "Rose wants to buy a new scooter..." ❌ (money problem!)

2. The system's fuzzy matching found this template first (because the area of need matched)
3. The AI then generated variations of the money question
4. The hard-coded `generateElapsedTimeProblem` function was never called

### Root Cause
Templates saved from the PA preview modal were getting their metadata from the wrong goal context, creating "poisoned" templates with mismatched content.

---

## New Features

### 1. Explicit Template Assignment in Goal Management

**Location**: Goal Management page (`/goals`)

**What it does**:
- Each goal card now has a **"Preferred Question Templates"** section
- Click "➕ Assign Template" to open a modal showing all available templates
- Select one or more templates to explicitly assign to that goal
- Assigned templates are displayed with numbered badges
- Click ❌ to remove a template assignment

**How it works**:
- Assigned template IDs are stored in `goal.preferredTemplateIds` (array of template IDs)
- When generating questions, the system checks for preferred templates FIRST
- If preferred templates exist, fuzzy matching is skipped entirely
- This ensures you always get the question type you want

### 2. Linked Goals Display in Template Management

**Location**: Goal Template Management page (`/admin/templates`)

**What it does**:
- Each template card now shows a **"🔗 Linked Goals"** section
- Displays all goals that have this template assigned
- Shows goal title and number of students
- Shows "No goals currently using this template" if none

**How it works**:
- System loads all goals and checks which ones reference this template in `preferredTemplateIds`
- Provides visibility into which goals will use which templates
- Helps you audit and manage template usage

---

## Updated Database Schema

### Goal Interface (`types/iep.ts`)
```typescript
export interface Goal {
  // ... existing fields ...
  preferredTemplateIds?: string[]  // NEW: Explicitly assigned template IDs
}
```

### GoalTemplate Interface (`types/iep.ts`)
```typescript
export interface GoalTemplate {
  // ... existing fields ...
  linkedGoalIds?: string[]  // NEW: For future bidirectional linking (not yet implemented)
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[]  // NEW: Restrict operations
  topic?: string  // EXISTING: Auto-detected from question content
}
```

---

## How Question Generation Now Works

### Priority Order (with Explicit Assignment)

1. **Check `goal.preferredTemplateIds`** (NEW!)
   - If the goal has explicitly assigned templates, use the first active one
   - Increment usage count
   - Skip fuzzy matching entirely

2. **Fall back to fuzzy matching** (if no preferred templates or all inactive)
   - Score all active templates based on:
     - Area of need match
     - Topic match (from `template.topic`)
     - Subject match
     - Grade level match
     - Assessment method match
     - Example question presence
     - Allowed operations match
   - Use the highest-scoring template

3. **Fall back to hard-coded templates** (if no database template found)
   - `generateElapsedTimeProblem`
   - `generateMultiStepNumericalExpression`
   - `generateWordProblemWithEquation`
   - etc.

4. **Use AI generation** (in hybrid mode)
   - If a template (database or hard-coded) is found, use it as a reference
   - Generate a variation with AI for variety
   - If no template found, generate from scratch with AI

---

## Files Modified

### New/Modified Components
1. **`src/components/management/GoalCard.vue`**
   - Added "Preferred Templates" section
   - Added template assignment UI
   - New emits: `assign-template`, `remove-template`

2. **`src/components/management/GoalManagement.vue`**
   - Added template assignment modal
   - New handlers: `handleAssignTemplate`, `handleRemoveTemplate`, `confirmTemplateAssignment`
   - Integrated with `goalServices.updateGoal` to save `preferredTemplateIds`

3. **`src/components/admin/GoalTemplateManagement.vue`**
   - Added "Linked Goals" display in each template card
   - Added `loadGoals()` function
   - New methods: `getLinkedGoals`, `getGoalStudents`

### Updated Services
4. **`src/services/goalQuestionGenerator.ts`**
   - Modified `findMatchingTemplate` to check `goal.preferredTemplateIds` first
   - Added explicit template assignment logic before fuzzy matching

5. **`src/types/iep.ts`**
   - Added `preferredTemplateIds?: string[]` to `Goal` interface
   - Added `linkedGoalIds?: string[]` to `GoalTemplate` interface (for future use)

---

## How to Use (Step-by-Step)

### Scenario: You want your "Elapsed Time" goal to ALWAYS use a specific template

1. **Go to Goal Management** (`/goals`)
2. Find your "Elapsed Time" goal
3. Scroll down to the **"🎯 Preferred Question Templates"** section
4. Click **"➕ Assign Template"**
5. A modal opens showing all active templates
6. Select the template(s) you want to use (check the boxes)
   - You can assign multiple templates - the system will use them in order
7. Click **"Assign X Template(s)"**
8. The template IDs now appear in the goal card
9. **Next time you generate an assessment for this goal**, it will use your assigned template(s) instead of fuzzy matching!

### To Remove a Template Assignment
1. Find the template in the "Preferred Templates" section
2. Click the **❌** button next to it
3. Confirm the removal

---

## Remaining Issues to Fix

### ⚠️ Mismatched Templates in Database

You still have "poisoned" templates in your Firestore database:
- Template `bZdnb1j4SLMpgbN9WXHk` and `g8ATbc3g0OOWGsbN0O8V` have:
  - `areaOfNeed`: "Math - Elapsed Time"
  - `exampleQuestion`: Money problem

**Fix Options:**

#### Option 1: Deactivate them manually
1. Go to `/admin/templates`
2. Find templates with "Elapsed Time" in the area of need
3. Check the example question - if it's about money, click the 👁️ button to deactivate

#### Option 2: Delete them
1. In Firestore Console, go to `goalTemplates` collection
2. Delete documents: `bZdnb1j4SLMpgbN9WXHk` and `g8ATbc3g0OOWGsbN0O8V`

#### Option 3: Use explicit assignment (recommended)
1. Create a NEW correct template for elapsed time
2. Explicitly assign it to your elapsed time goal
3. The bad templates will be ignored since you have a preferred template

---

## Testing Checklist

- [x] Can assign templates to goals via Goal Management
- [x] Can remove assigned templates
- [x] Template assignment saves to Firestore (`preferredTemplateIds` array)
- [x] Linked goals display shows in Template Management
- [ ] **Generate assessment with explicit template** (NEEDS TESTING)
- [ ] **Verify hard-coded templates are used as fallback** (NEEDS TESTING)
- [ ] **Deactivate/delete mismatched templates** (MANUAL STEP REQUIRED)

---

## Next Steps

1. **Test the explicit assignment workflow**:
   - Assign a template to your money goal
   - Generate an assessment
   - Verify it uses the assigned template

2. **Clean up bad templates**:
   - Review all templates in `/admin/templates`
   - Deactivate or delete any with mismatched content
   - Use the "🔗 Linked Goals" section to see which goals are affected

3. **Optional future enhancement**:
   - Implement bidirectional linking (`template.linkedGoalIds`)
   - Add a "Link to Goals" button in Template Management
   - Auto-sync when templates or goals are updated

---

## Summary

✅ **Explicit template assignment is now live!**

You can now directly control which templates are used for which goals, eliminating the problem of fuzzy matching picking the wrong template.

The root cause of your elapsed time goal generating money questions was:
- Bad templates in the database with mismatched metadata
- Fuzzy matching prioritizing these templates over hard-coded ones

The solution:
- Explicitly assign correct templates to goals
- Fuzzy matching is bypassed entirely for goals with preferred templates
- Bad templates can now be ignored or deleted safely

🎉 **You now have full control over question generation!**


