# Template Question System - Complete Implementation

## Overview

Successfully implemented a new template-based question system for Progress Assessments. Instead of having the AI struggle to generate varied questions on the fly, templates now contain 5 actual questions that can be edited and refined by teachers. These template questions are then used to generate 3 assessments:

1. **First Assessment**: Uses the exact 5 template questions
2. **Second & Third Assessments**: AI generates variations of the template questions

## What Changed

### 1. Database Schema Updates (`src/types/iep.ts`)

**New Interface: `TemplateQuestion`**
- Stores complete question data (text, type, answer, points, etc.)
- Includes helper fields for UI editing (`acceptableAnswersString`, `optionsString`)
- Supports all question types: short-answer, multiple-choice, fraction, etc.

**Updated Interface: `GoalTemplate`**
- Added `templateQuestions?: TemplateQuestion[]` field to store the 5 template questions
- Marked old fields as DEPRECATED but kept for backward compatibility:
  - `problemStructure`
  - `customAIPrompt`
  - Single `exampleQuestion` approach

### 2. AI Question Generation Service (`src/services/templateQuestionGenerator.ts`)

**New Service Functions:**

```typescript
generateTemplateQuestions(params) → TemplateQuestion[]
```
- Generates 5 initial template questions using AI
- Takes goal information and creates diverse questions
- Uses improved prompting with double backslashes for LaTeX
- Handles dollar sign escaping ($\$18.25$)

```typescript
generateQuestionVariations(templateQuestions, goalText, numberOfVariations) → TemplateQuestion[][]
```
- Generates variations of existing template questions
- Keeps same structure/type but varies numbers, contexts, scenarios
- Used to create assessments #2 and #3

### 3. Template Question Editor UI (`src/components/admin/TemplateQuestionEditor.vue`)

**New Component Features:**
- **AI Generation Button**: "Generate 5 Questions with AI" - creates initial questions from goal text
- **Question Editor**: Rich interface for editing each of the 5 questions
  - Question type selector (short-answer, multiple-choice, fraction, etc.)
  - Question text editor with LaTeX hints
  - Type-specific fields (options for MC, fraction equivalence, etc.)
  - Points and standard assignment
  - Explanation field
- **Question Management**:
  - Duplicate questions
  - Delete questions
  - Add new questions (up to 5 max)
  - Regenerate all questions

**UI Tips:**
- Shows LaTeX formatting help (use `\\frac{1}{2}` for fractions)
- Shows dollar sign escaping help (use `$\$25.50$`)
- Real-time editing of all question fields

### 4. Template Management Integration (`src/components/admin/GoalTemplateManagement.vue`)

**Changes:**
- Imported `TemplateQuestionEditor` component
- Added `templateQuestions` to form data
- Integrated editor into template create/edit modal
- Save/load logic updated to handle template questions
- Template duplication includes questions

**New Section in Form:**
```
📝 Template Questions (NEW System)
Define 5 template questions that will be used to generate assessments.
The AI will create variations of these questions for each Progress Assessment.

[TemplateQuestionEditor component renders here]
```

### 5. Assessment Generation Logic (`src/composables/useAssessmentGeneration.ts`)

**Updated Function: `generateQuestionsForGoal`**

**New Logic Flow:**
1. **Check for template questions**:
   - Look for goals with `preferredTemplateIds`
   - Load template and check if it has `templateQuestions` (5 questions)
   - If yes, use NEW system; if no, fall back to OLD system

2. **NEW System (with template questions)**:
   - **Assessment #1**: Use exact 5 template questions
   - **Assessment #2 & #3**: Call `generateQuestionVariations()` to create AI-generated variations
   - Add template instructions (directions, Khan Academy video) to all assessments
   - If variation generation fails, duplicate template questions with warning

3. **OLD System (fallback)**:
   - Continue using existing AI generation from scratch
   - For backward compatibility with old templates

**Helper Function Added:**
```typescript
getTemplateInstructions(template) → string
```
- Formats template directions and video links for assessment instructions

## How to Use the New System

### For Teachers

#### Step 1: Create or Edit a Template
1. Go to **Admin** → **Template Management**
2. Click **Create New Template** or edit an existing one
3. Fill in basic template info (name, subject, area of need, goal text, etc.)

#### Step 2: Generate 5 Template Questions
1. Scroll to the **Template Questions** section
2. Click **🤖 Generate 5 Questions with AI**
3. AI will create 5 diverse questions based on your goal

#### Step 3: Edit the Questions
1. Review each of the 5 generated questions
2. Edit question text, answers, points, explanations
3. Change question types if needed
4. Ensure variety across all 5 questions

#### Step 4: Save Template
1. Click **Create Template** or **Update Template**
2. Template is now ready to use

#### Step 5: Generate Assessments
1. Go to **Goal Management**
2. Find a goal that uses this template
3. Click **Generate Assessment**
4. Click **Proceed** in the template preview
5. System will create 3 assessments:
   - **Check #1**: Exact template questions
   - **Check #2**: AI variation of template questions
   - **Check #3**: Another AI variation

### For Developers

**Creating a New Template with Questions:**
```typescript
const template: GoalTemplate = {
  name: "Multi-digit Operations",
  subject: "math",
  areaOfNeed: "Math Computation",
  // ... other fields ...
  templateQuestions: [
    {
      id: "q1",
      questionText: "Solve: $\\begin{array}{r} 456 \\\\ + \\underline{278} \\\\\\end{array}$",
      questionType: "short-answer",
      correctAnswer: "734",
      points: 1,
      standard: "7.NS.A.2"
    },
    // ... 4 more questions ...
  ]
}
```

**Detecting if a Template Uses New System:**
```typescript
if (template.templateQuestions && template.templateQuestions.length === 5) {
  // NEW system: use template questions
} else {
  // OLD system: generate from scratch
}
```

## Benefits of New System

### 1. **Quality Control**
- Teachers can review and perfect questions before they're used
- No more AI-generated errors or weird problems
- Consistent question quality across all assessments

### 2. **Faster Assessment Creation**
- No need to generate all questions with AI each time
- First assessment is instant (uses template questions)
- Only 2 variations need to be generated

### 3. **Better Question Variety**
- Teachers define the variety upfront in the 5 template questions
- AI variations maintain structure while changing numbers/contexts
- Avoids repetitive patterns (e.g., "8 out of 10" repeated)

### 4. **Easier Debugging**
- If questions are wrong, edit the template once
- All future assessments benefit from the fix
- Clear source of truth for question structure

### 5. **Supports Multiple Problem Types**
- A single template can have mixed question types
- E.g., addition, subtraction, multiplication, division, fractions all in one template
- Perfect for goals like "whole numbers, fractions, OR decimals"

## LaTeX Formatting Guide

### Fractions
```
\\frac{1}{2}    → 1/2
\\frac{3}{4}    → 3/4
```

### Stacked Operations
```
$\\begin{array}{r}
  456 \\\\
+ \\underline{278} \\\\
\\end{array}$
```

### Dollar Amounts
```
$\\$18.25$    → $18.25 (rendered in math mode)
$\\$99.99$    → $99.99
```

### Long Division
```
$6,\\enclose{longdiv}{294}$
```

## Backward Compatibility

**Old Templates Still Work:**
- Templates without `templateQuestions` use the old AI generation system
- No breaking changes to existing templates
- Gradual migration path for teachers

**Deprecated Fields:**
- `problemStructure` - no longer needed, questions define structure
- `customAIPrompt` - no longer needed, questions define variety
- `exampleQuestion` - replaced by 5 template questions

## Files Changed

### New Files
- `src/services/templateQuestionGenerator.ts` - AI service for generating template questions
- `src/components/admin/TemplateQuestionEditor.vue` - UI component for editing template questions
- `TEMPLATE_QUESTION_SYSTEM_COMPLETE.md` - This documentation

### Modified Files
- `src/types/iep.ts` - Added `TemplateQuestion` interface, updated `GoalTemplate`
- `src/components/admin/GoalTemplateManagement.vue` - Integrated question editor
- `src/composables/useAssessmentGeneration.ts` - New generation logic for template questions

## Testing

**To Test the Complete Workflow:**

1. **Create a New Template**:
   - Go to Admin → Template Management
   - Create a new template (e.g., "Test Multi-digit Operations")
   - Click "Generate 5 Questions with AI"
   - Edit questions as needed
   - Save template

2. **Assign Template to Goal**:
   - Go to Goal Management
   - Create or edit a goal
   - Click "Manage Templates"
   - Add your new template

3. **Generate Assessments**:
   - Click "Generate Assessment" on the goal
   - Preview should show template info
   - Click "Proceed"
   - Verify 3 assessments are created
   - Check that Assessment #1 uses exact template questions
   - Check that Assessments #2 and #3 are variations

4. **Verify Questions**:
   - Open each assessment
   - Verify question text, answers, points are correct
   - Check LaTeX rendering (fractions, stacked operations, dollar signs)

## Future Enhancements

Possible improvements for future iterations:

1. **Question Bank**: Allow saving template questions to a shared bank
2. **Import/Export**: Import questions from CSV or JSON
3. **Version History**: Track changes to template questions over time
4. **More AI Options**: Allow teachers to request specific variations
5. **Preview Variations**: Show what variations might look like before generating

## Support

For questions or issues:
- Check the LaTeX formatting guide above
- Review example templates in the system
- Test with a simple goal first (e.g., 2-step word problems)

## Deployment

✅ **Deployed**: January 19, 2026
📦 **Version**: 1.0.10+
🔗 **URL**: https://jepsonmath.web.app

All changes are now live in production.
