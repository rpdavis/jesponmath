# Progress Assessment File Map

This document maps out all files that interact with Progress Assessments (PA) in the app.

## Overview

**Progress Assessments** are assessments tied to IEP goals to track student mastery over time. They are identified by the category `'PA'` in the database.

---

## 📁 File Organization by Function

### 1️⃣ **DATA TYPES & INTERFACES**

#### `src/types/iep.ts`
- **Purpose**: TypeScript definitions for all IEP-related data structures
- **Key Interfaces**:
  - `Assessment` - Main assessment structure with `category: 'PA'` for Progress Assessments
  - `AssessmentQuestion` - Question structure with multiple question types
  - `AssessmentResult` - Student results/submissions
  - `AssessmentResponse` - Individual question responses
  - `Goal` - IEP goal structure that PAs are linked to
- **Usage**: Imported throughout the app for type checking

---

### 2️⃣ **DATABASE SERVICES**

#### `src/firebase/iepServices.ts`
- **Purpose**: Firestore CRUD operations for assessments and results
- **Key Functions**:
  - `createAssessment(assessmentData)` - Creates new PA in database
  - `getAssessmentById(id)` - Retrieves assessment by ID
  - `updateAssessment(id, data)` - Updates existing assessment
  - `deleteAssessment(id)` - Deletes assessment and related data
  - `getAssessmentsByGoal(goalId)` - Gets all assessments for a goal
  - `saveAssessmentResult(resultData)` - Saves student submission
  - `getAssessmentResults(assessmentId)` - Gets all results for an assessment
  - `getStudentResults(studentUid)` - Gets all results for a student
  - `assignAssessmentService(goalId, assessmentId)` - Links PA to goal
  - `removeAssessmentService(goalId, assessmentId)` - Unlinks PA from goal
  - `regradeAssessmentResults(assessmentId, updatedAssessment)` - Regrades after edits

**Database Collections Used**:
- `assessments` - Stores assessment definitions
- `assessmentResults` - Stores student submissions
- `assessmentProgress` - Stores in-progress attempts
- `goals` - Stores IEP goals (links to assessments via `assessmentIds` array)

---

### 3️⃣ **QUESTION GENERATION**

#### `src/services/goalQuestionGenerator.ts` ⭐ **CRITICAL**
- **Purpose**: Generates questions for Progress Assessments from IEP goals
- **NEW**: Hybrid system - checks for saved templates first, falls back to coded templates
- **Generation Methods**:
  - **Saved Templates** (NEW): Searches database for matching templates first
  - **Template-based**: Fast, free, reliable for common math patterns (fallback)
  - **AI-generated**: Uses Gemini API for complex/unique goals
  - **Hybrid**: Combines both with intelligent fallback
- **Key Functions**:
  - `findMatchingTemplate(goal)` - NEW: Searches database for best matching template
  - `generateQuestionFromTemplate(template, goal, questionNumber)` - NEW: Generates from saved template
  - `generateQuestionForGoal(goal, questionNumber, config)` - Main generation function (now checks saved templates first!)
  - `detectGoalCharacteristics(goal)` - Analyzes goal to determine question type
  - `generateWithTemplate(goal, detection, questionNumber)` - Coded template generation
  - `generateMathTemplate()` - Math-specific templates
  - `generateMultiStepWordProblem()` - Multi-step scenarios
  - `generateWordProblemWithEquation()` - Word problems with equations
  - `generateFractionProblem()` - Fraction questions
  - `generateELATemplate()` - ELA questions
- **Template Matching**: Scores templates based on:
  - Area of need match (+10 points)
  - Topic match (+15 points)
  - Subject match (+5 points)
  - Grade level match (+3 points)
  - Assessment method match (+2 points)
  - Has example question (+5 points)
  - Threshold: ≥15 points to use template
- **Supported Goal Types**:
  - Multi-step word problems
  - Single-step word problems
  - Equations (one-step and two-step)
  - Fractions, decimals
  - Numerical/algebraic expressions
  - Basic operations (addition, subtraction, multiplication, division)
  - ELA comprehension and writing

#### `src/firebase/templateServices.ts` ⭐ **NEW**
- **Purpose**: Database operations for goal templates (saved question patterns)
- **Key Functions**:
  - `createTemplate(templateData)` - Saves new template to database
  - `getActiveTemplates()` - Fetches all active templates
  - `getTemplate(templateId)` - Gets single template by ID
  - `getTemplatesBySubject(subject)` - Filters templates by subject
  - `getTemplatesByTopic(topic)` - Filters templates by topic
  - `updateTemplate(templateId, updates)` - Updates existing template
  - `incrementTemplateUsage(templateId)` - Tracks template usage
  - `deleteTemplate(templateId)` - Deletes template
  - `generateGoalFromTemplate(template, variables)` - Creates goal from template
- **Database Collection**: `goalTemplates`
- **Purpose**: AI-powered question generation using Gemini or OpenAI
- **Key Functions**:
  - `generateQuestionWithAI(goal, subject, questionNumber, config, templateReference?)` - Generates questions using AI
- **Features**:
  - Uses AI for more contextual, varied questions
  - Falls back to templates if AI fails
  - Can use template as reference for consistency

---

### 4️⃣ **GENERATION & MANAGEMENT (Teacher-Facing)**

#### `src/composables/useAssessmentGeneration.ts` ⭐ **CRITICAL**
- **Purpose**: Composable for generating and managing Progress Assessments
- **Key Functions**:
  - `generateQuestionsForGoal(goal, assessmentNumber)` - Generates 5 questions for a PA
  - `generatePreviewAssessments(goal)` - Creates preview of 3 PAs
  - `confirmCreateAssessments(assessments)` - Creates PAs in database
  - `regenerateQuestion(assessmentId, questionId)` - Regenerates single question
  - `saveEditedQuestion(assessmentId, questionId, updates)` - Saves manual edits
- **Used By**: `ProgressAssessmentManagement.vue`, `GoalManagement.vue`

#### `src/composables/useGoalManagement.ts`
- **Purpose**: Composable for managing IEP goals and their assessments
- **Key Functions**:
  - `createProgressAssessment(assessmentData)` - Creates empty PA and navigates to editor
  - `assignAssessmentToGoal(goalId, assessmentId)` - Links PA to goal
  - `removeAssessmentFromGoal(goalId, assessmentId)` - Unlinks PA from goal
  - `getAssessmentTitle(assessmentId)` - Gets assessment title from ID

#### `src/components/management/ProgressAssessmentManagement.vue` ⭐ **PRIMARY UI**
- **Route**: `/progress-assessment-management`
- **Purpose**: Main teacher interface for generating and managing Progress Assessments
- **Features**:
  - View all goals with their PAs
  - Generate 3 PAs per goal (5 questions each)
  - Preview questions before creating
  - Edit questions after generation
  - Assign PAs to students
  - View results
  - Delete assessments
- **Key Actions**:
  - Generate assessments for a goal
  - Edit assessment in editor
  - View student results
  - Assign to students
  - Delete assessments

#### `src/components/management/GoalManagement.vue`
- **Route**: `/goals`
- **Purpose**: Manage IEP goals and their connected assessments
- **PA Features**:
  - Link existing PAs to goals
  - Generate new PAs for goals
  - View PAs connected to each goal
  - Remove PAs from goals

---

### 5️⃣ **ASSESSMENT EDITING**

#### `src/components/assessments/AssessmentEditor.vue`
- **Route**: `/assessment/edit/:id`
- **Purpose**: Edit assessment questions, settings, and metadata
- **Features**:
  - Edit all question types
  - Add/remove questions
  - Set points, correct answers
  - Configure file upload requirements
  - Set retake options
  - Manage standards/grading
- **Used For**: Editing PAs after generation

#### Question Type Field Components:
- `src/components/assessments/editor/questionTypes/MultipleChoiceFields.vue`
- `src/components/assessments/editor/questionTypes/ShortAnswerFields.vue` ⭐ (currently open)
- `src/components/assessments/editor/questionTypes/EssayFields.vue`
- `src/components/assessments/editor/questionTypes/TrueFalseFields.vue`
- `src/components/assessments/editor/questionTypes/FillBlankFields.vue`
- `src/components/assessments/editor/questionTypes/MatchingFields.vue`
- `src/components/assessments/editor/questionTypes/FractionFields.vue`
- `src/components/assessments/editor/questionTypes/RankOrderFields.vue` ⭐ (recently viewed)
- `src/components/assessments/editor/questionTypes/CheckboxFields.vue`
- `src/components/assessments/editor/questionTypes/HorizontalOrderingFields.vue`
- `src/components/assessments/editor/questionTypes/AlgebraTilesFields.vue`

---

### 6️⃣ **STUDENT TAKING ASSESSMENTS**

#### `src/components/assessments/AssessmentTaking.vue` ⭐ **STUDENT VIEW**
- **Route**: `/assessment/:id`
- **Purpose**: Student interface for taking assessments
- **Features**:
  - Display questions one at a time (or all at once)
  - Handle all question types
  - File/photo upload
  - Timer (if enabled)
  - Auto-save progress
  - Submit answers
  - Retake support
- **Key Functions**:
  - `submitAssessment()` - Submits completed assessment
  - `saveProgress()` - Auto-saves during assessment
  - `loadSavedProgress()` - Resumes in-progress assessment
  - `uploadFile()` - Handles file uploads
  - Auto-grading for objective question types

#### Question Display Components:
- `src/components/assessments/taking/MultipleChoiceQuestion.vue`
- `src/components/assessments/taking/ShortAnswerQuestion.vue`
- `src/components/assessments/taking/EssayQuestion.vue`
- `src/components/assessments/taking/TrueFalseQuestion.vue`
- `src/components/assessments/taking/FillBlankQuestion.vue`
- `src/components/assessments/taking/MatchingQuestion.vue`
- `src/components/assessments/taking/FractionQuestion.vue`
- `src/components/assessments/taking/RankOrderQuestion.vue`
- `src/components/assessments/taking/CheckboxQuestion.vue`
- `src/components/assessments/taking/HorizontalOrderingQuestion.vue`
- `src/components/assessments/taking/AlgebraTilesQuestion.vue`

---

### 7️⃣ **VIEWING RESULTS (Teacher)**

#### `src/components/assessments/AssessmentResult.vue`
- **Route**: `/assessment/:assessmentId/results/:resultId`
- **Purpose**: View individual student's assessment submission
- **Features**:
  - View all questions and student answers
  - See correct/incorrect status
  - View uploaded files/photos
  - Manual grading for essay/open-ended
  - Add feedback
  - Regrade after changes

#### `src/components/ProgressAssessment.vue` ⭐ **PROGRESS TRACKING**
- **Route**: `/progress-assessment`
- **Purpose**: Track student progress on IEP goals via Progress Assessments
- **Features**:
  - View all goals with PAs
  - See assessment attempts and scores
  - Track best score, latest score
  - View progress trends
  - Filter by student
  - View detailed results
  - Assign assessments
- **Displays**:
  - Goal status (Active, Met, Archived)
  - Student assignments
  - Assessment list per goal
  - Attempt history
  - Score trends

#### `src/components/ProgressAssessmentGradebook.vue`
- **Route**: `/progress-assessment-gradebook`
- **Purpose**: Gradebook view of PA results
- **Features**:
  - View by student or by goal
  - See all PA scores for a student
  - Track progress trends
  - View attempt counts
  - Navigate to detailed results
  - Filter by student/goal

---

### 8️⃣ **DASHBOARD INTEGRATION**

#### `src/components/dashboards/TeacherDashboard.vue`
- **Route**: `/teacher-dashboard`
- **PA Features**:
  - Quick access to PA management
  - Overview of recent PA submissions
  - Pending grading notifications

#### `src/components/dashboards/StudentDashboard.vue`
- **Route**: `/student-dashboard`
- **PA Features**:
  - View assigned PAs
  - See upcoming PAs
  - View PA results

---

### 9️⃣ **ROUTING**

#### `src/router/index.ts`
- **PA-Related Routes**:
  - `/assessment/create` - Create new assessment
  - `/assessment/edit/:id` - Edit assessment
  - `/assessment/:id` - Take assessment
  - `/assessment/:assessmentId/results/:resultId` - View result
  - `/progress-assessment` - Progress tracking view
  - `/progress-assessment-gradebook` - Gradebook view
  - `/progress-assessment-management` - Management interface

---

## 🔄 Data Flow

### Creating a Progress Assessment

```
1. Teacher navigates to ProgressAssessmentManagement.vue
   ↓
2. Clicks "Generate Assessments" for a goal
   ↓
3. useAssessmentGeneration.generateProofreadQuestion(goal)
   ↓
4. Calls goalQuestionGenerator.generateQuestionForGoal()
   ↓
5. NEW: Searches database for matching saved templates
   ├─ Match found? Use saved template (with example question)
   └─ No match? Use coded template patterns
   ↓
6. If hybrid mode: AI adds variation to template
   ↓
7. Preview shown to teacher with edit options
   ↓
8. Teacher can optionally "Save as Template" for reuse
   ↓
9. Teacher confirms → confirmCreateAssessments()
   ↓
10. Generates 3 more assessments (questions 2-5 each)
    ↓
11. Creates 3 assessments via iepServices.createAssessment()
    ↓
12. Links to goal via iepServices.assignAssessmentService()
    ↓
13. Assessments saved in Firestore 'assessments' collection
```

### Student Taking Assessment

```
1. Student navigates to /assessment/:id
   ↓
2. AssessmentTaking.vue loads assessment from iepServices.getAssessmentById()
   ↓
3. Student answers questions (progress auto-saved)
   ↓
4. Student clicks "Submit"
   ↓
5. AssessmentTaking.submitAssessment() called
   ↓
6. Auto-grades objective questions
   ↓
7. Saves result via iepServices.saveAssessmentResult()
   ↓
8. Result stored in 'assessmentResults' collection
   ↓
9. Student shown confirmation/score
```

### Viewing Progress

```
1. Teacher navigates to /progress-assessment
   ↓
2. ProgressAssessment.vue loads goals and assessments
   ↓
3. Gets results via iepServices.getAssessmentResults()
   ↓
4. Displays progress for each goal
   ↓
5. Teacher clicks "View" on a result
   ↓
6. Navigates to /assessment/:assessmentId/results/:resultId
   ↓
7. AssessmentResult.vue displays full submission
```

---

## 📊 Database Structure

### Collections Involved

**goalTemplates** (saved question patterns)
```typescript
{
  id: string
  name: string
  subject: 'math' | 'ela' | 'other'
  topic: string  // e.g., "elapsed time", "two-step equations"
  areaOfNeed: string
  goalTitleTemplate: string  // "{{topic}} - Grade {{gradeLevel}}"
  goalTextTemplate: string
  assessmentMethod: 'app' | 'paper' | 'hybrid'
  
  // Example question (MOST IMPORTANT)
  exampleQuestion: string  // "Sarah started reading at 2:15..."
  exampleAnswer: string  // "3:00 PM"
  exampleAlternativeAnswers: string  // "3:00, 3 PM, 15:00"
  exampleExplanation: string
  
  // Matching criteria
  defaultGradeLevel: number
  defaultStandard: string
  
  // Tracking
  usageCount: number  // Incremented when template is used
  isActive: boolean
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**assessments** (main collection)
```typescript
{
  id: string
  goalId: string
  category: 'PA'  // ← Identifies Progress Assessments
  title: string
  description: string
  gradeLevel: number
  questions: AssessmentQuestion[]
  totalPoints: number
  createdBy: string  // Teacher UID
  createdAt: Timestamp
  updatedAt: Timestamp
  // ... other fields
}
```

**assessmentResults** (submissions)
```typescript
{
  id: string
  assessmentId: string
  studentUid: string
  goalId: string  // ← Links result to goal
  responses: AssessmentResponse[]
  score: number
  totalPoints: number
  percentage: number
  completedAt: Timestamp
  attemptNumber: number
  isRetake: boolean
  // ... other fields
}
```

**goals** (IEP goals)
```typescript
{
  id: string
  goalTitle: string
  goalText: string
  studentUid: string
  assessmentIds: string[]  // ← Array of linked PA IDs
  // ... other fields
}
```

---

## 🎯 Key Files Summary

| File | Purpose | Type |
|------|---------|------|
| `iepServices.ts` | Database operations | Service |
| `goalQuestionGenerator.ts` | Generate questions from goals | Service |
| `aiQuestionGenerator.ts` | AI-powered generation | Service |
| `useAssessmentGeneration.ts` | Generation composable | Composable |
| `useGoalManagement.ts` | Goal management composable | Composable |
| `ProgressAssessmentManagement.vue` | Main teacher management UI | Component |
| `AssessmentEditor.vue` | Edit assessments | Component |
| `AssessmentTaking.vue` | Student takes assessment | Component |
| `AssessmentResult.vue` | View individual result | Component |
| `ProgressAssessment.vue` | Progress tracking view | Component |
| `ProgressAssessmentGradebook.vue` | Gradebook view | Component |
| `iep.ts` | Type definitions | Types |

---

## 📝 Additional Documentation

Related documentation files:
- `PROGRESS_ASSESSMENT_GENERATION_EXPLAINED.md` - Detailed explanation of generation system
- `ASSESSMENT_TRACKING_TODO.md` - Future improvements
- `DATABASE_COLLECTIONS_STRUCTURE.md` - Database schema details
- `GOAL_ASSESSMENT_ANALYSIS.md` - Analysis of goal-assessment relationships

---

## 🔍 Finding PA Files in Code

### Search Patterns

To find all PA-related code:

**Database queries**:
```javascript
where('category', '==', 'PA')
```

**Type references**:
```typescript
category: 'PA'
Assessment with category PA
```

**Route patterns**:
```
/progress-assessment
/assessment/:id
```

**Service calls**:
```javascript
createAssessment({ category: 'PA' })
getAssessmentsByGoal(goalId)
assignAssessmentService(goalId, assessmentId)
```

---

## 🚀 Common Development Tasks

### To add a new question type:
1. Add type to `AssessmentQuestion.questionType` in `src/types/iep.ts`
2. Create editor component in `src/components/assessments/editor/questionTypes/`
3. Create display component in `src/components/assessments/taking/`
4. Add case in `AssessmentEditor.vue` component selector
5. Add case in `AssessmentTaking.vue` component selector
6. Add auto-grading logic if applicable

### To modify question generation:
1. Edit `src/services/goalQuestionGenerator.ts`
2. Add new template functions for specific goal patterns
3. Update `detectGoalCharacteristics()` for new patterns
4. Add to priority list in `generateMathTemplate()`

### To add new PA features:
1. Update types in `src/types/iep.ts`
2. Update service functions in `src/firebase/iepServices.ts`
3. Update UI in `ProgressAssessmentManagement.vue`
4. Update taking/viewing components as needed

---

**Last Updated**: December 22, 2025

