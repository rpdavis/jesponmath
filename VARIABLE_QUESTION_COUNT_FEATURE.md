# Variable Question Count Feature - Complete

## Summary

Added flexibility to control the number of template questions from **1 to 20** (default: 5).

## Changes Made

### 1. Database Schema (`src/types/iep.ts`)
- Added `numberOfQuestions?: number` to `GoalTemplate` interface
- Default value: 5
- Range: 1-20

### 2. Template Management Form (`src/components/admin/GoalTemplateManagement.vue`)
- Added "Number of Questions (1-20)" input field
- Field appears above the Template Question Editor
- Default value: 5
- Updates UI dynamically as you change the number

### 3. Question Editor (`src/components/admin/TemplateQuestionEditor.vue`)
- Accepts `numberOfQuestions` prop
- Updates header: "Template Questions (X/N)" where N is configurable
- Generate button text updates: "Generate N Questions with AI"
- Max questions enforced when adding/duplicating
- Add button shows "Add Question (X/N)"

### 4. Assessment Generation (`src/composables/useAssessmentGeneration.ts`)
- Works with any number of template questions (not just 5)
- Detects templates with `templateQuestions.length > 0` instead of `=== 5`
- Logs the number of questions found

## User Interface

**New Field in Template Form:**
```
Number of Questions (1-20)
[  5  ]  ← Input field (number, min=1, max=20)
Default is 5. Specify how many questions this template should have.
```

**Dynamic Question Editor:**
- Header updates: "📝 Template Questions (3/10)" if you set 10 questions
- Generate button: "🤖 Generate 10 Questions with AI"
- Add button: "➕ Add Question (3/10)"

## How to Use

### Creating a 10-Question Template:
1. Admin → Template Management → Create New Template
2. Set "Number of Questions" to **10**
3. Fill in goal info
4. Click "🤖 Generate 10 Questions with AI"
5. Edit the 10 generated questions
6. Save template

### Creating a 1-Question Template:
1. Set "Number of Questions" to **1**
2. Generate or manually create 1 question
3. Perfect for simple skill assessments

### Creating a 20-Question Template:
1. Set "Number of Questions" to **20**
2. Generate 20 questions with AI
3. Great for comprehensive assessments

## Use Cases

**1 Question**: Quick check-ins, single skill assessment
**3-5 Questions**: Standard progress monitoring (default)
**10 Questions**: Mid-length assessments
**15-20 Questions**: Comprehensive skill assessments, unit tests

## Validation

- Minimum: 1 question
- Maximum: 20 questions
- Default: 5 questions
- Input type: number with min/max attributes

## Backward Compatibility

✅ **Existing templates without `numberOfQuestions` field:**
- Default to 5 questions
- Continue working as before

✅ **Templates with different question counts:**
- Assessment generation adapts automatically
- First assessment uses all template questions
- Variations match the template count

## Deployment

✅ **Deployed**: January 19, 2026
📦 **Version**: 1.0.10+
🔗 **URL**: https://jepsonmath.web.app

All changes are live in production.
