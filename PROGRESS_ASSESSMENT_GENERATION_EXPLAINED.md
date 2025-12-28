# Progress Assessment Generation System - Architecture & Workflow

## 📚 Overview

This system generates **Progress Assessments (PA)** from IEP goals to track student mastery. It uses a hybrid approach combining **templates** and **AI (Gemini)** to create customized questions.

---

## 🎯 Current Workflow

### Step 1: Teacher Selects Goal
**Location:** Progress Assessment Management page (`/src/components/management/ProgressAssessmentManagement.vue`)

**Action:** Teacher clicks "Generate Assessments" for a specific IEP goal

**Example Goal:**
```
Goal Title: "Two-Step Word Problems - Money"
Goal Text: "Student will solve two-step word problems involving money with 80% accuracy in 4 out of 5 trials"
Area of Need: "Math Computation"
Subject: "math"
```

---

### Step 2: System Analyzes Goal
**Location:** `useAssessmentGeneration` composable

**What it does:**
1. **Detects subject area:** Math, ELA, or Other
2. **Parses goal text** for keywords:
   - "two-step" → two-step equations
   - "word problem" → real-world scenarios
   - "money" → monetary context
3. **Determines question type:** short-answer, algebra-tiles, etc.

---

### Step 3: Generate Questions (Hybrid Approach)
**Location:** `goalQuestionGenerator.ts` service

**Three Methods:**

#### A. Template-Based (Fast, Reliable)
```typescript
// Uses pre-defined question templates
// Example: Two-step equation template
questionText: "Solve for x: 2x + 3 = 11"
correctAnswer: "4"
```

**Pros:**
- Fast (instant)
- Consistent format
- Always works
- No API costs

**Cons:**
- Generic questions
- Limited variety
- No real-world context

#### B. AI-Generated (Gemini)
```typescript
// Calls Google Gemini AI API
const prompt = `Generate a two-step word problem about money for 7th grade.
Goal: ${goal.goalText}
Requirements:
- Real-world scenario
- Appropriate difficulty
- Clear answer
- Include explanation`

// AI Response:
questionText: "Sarah bought 3 notebooks for $2.50 each. She paid with a $10 bill. How much change did she receive?"
correctAnswer: "$2.50"
explanation: "Cost: 3 × $2.50 = $7.50. Change: $10 - $7.50 = $2.50"
```

**Pros:**
- Contextual questions
- Varied scenarios
- Student-relevant
- Detailed explanations

**Cons:**
- Requires API key
- Costs money per question
- Can fail/timeout
- Inconsistent format

#### C. Hybrid (Current Default) ⭐
```typescript
// Try AI first, fall back to template if it fails
1. Attempt Gemini AI generation
2. If successful → Use AI question
3. If fails → Use template question
4. Mark source for teacher review
```

**Best of both worlds:**
- Contextual when possible
- Always has a question (fallback)
- Teacher can see which are AI vs template

---

### Step 4: Create Preview
**Location:** `ConfirmationPreviewModal.vue`

**Shows:**
- 3 assessments (Check #1, #2, #3)
- 5 questions each
- Total points: 5 (1 point per question)
- Source indicator (✨ AI, 📋 Template, ⚠️ AI Failed)

**Teacher can:**
- ✅ Review all questions
- ✅ See which are AI-generated
- ✅ Approve and create
- ❌ Cancel and regenerate

---

### Step 5: Create Assessments
**What gets created:**
```javascript
Assessment {
  title: "Two-Step Word Problems - Money - Check #1"
  description: "This assessment measures the ability to solve two-step word problems..."
  instructions: "Read each problem carefully. Show all your work..."
  category: "PA" (Progress Assessment)
  goalId: "[goal-id]"
  questions: [5 questions]
  totalPoints: 5
  allowFileUpload: true
  requireFileUpload: true // Students MUST upload work
}
```

**Saved to:**
- Firestore `assessments` collection
- Linked to goal via `goalId`
- Assigned to goal's students

---

## 🔌 Integration Points for External Resources

### Where CK-12 or Khan Academy Could Fit

#### Option 1: Pre-Assessment Lesson Link
**Before student takes assessment:**

```javascript
Assessment {
  title: "Two-Step Equations - Check #1"
  
  // NEW: Lesson resources
  lessonResources: [
    {
      provider: "Khan Academy",
      title: "Two-step equations",
      url: "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solving-equations-inequalities/x2f8bb11595b61c86:two-step-equations/v/solving-equations-1",
      type: "video",
      duration: "5 min",
      recommended: true
    },
    {
      provider: "CK-12",
      title: "Two-Step Equations Practice",
      url: "https://www.ck12.org/book/ck-12-middle-school-math-concepts-grade-7/section/9.8/",
      type: "interactive",
      exercises: 10
    }
  ],
  
  // NEW: Pre-assessment instructions
  preAssessmentMessage: "📚 Before starting, review these resources if you need help:"
}
```

**Student sees:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Two-Step Equations - Check #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Need Help? Review These First:
  🎥 Khan Academy: Two-step equations (5 min video)
  ✏️ CK-12: Practice Problems (10 exercises)
  
[View Resources] [Start Assessment]
```

#### Option 2: Post-Assessment Remediation
**If student scores < 70%:**

```javascript
AssessmentResult {
  percentage: 40, // Failed
  
  // NEW: Remediation resources
  remediationResources: [
    {
      provider: "Khan Academy",
      title: "Two-step equations review",
      url: "...",
      targetedTo: ["Question 2", "Question 4"] // Which they got wrong
    }
  ],
  
  // NEW: Practice link
  practiceUrl: "https://www.khanacademy.org/math/algebra/..."
}
```

**Teacher/Student sees:**
```
Score: 2/5 (40%) ❌

📚 Recommended Review:
  • Two-step equations basics (Khan Academy)
  • Practice: 10 similar problems
  • Video: Step-by-step walkthrough
  
[Start Practice] [Retake Assessment]
```

#### Option 3: Adaptive Learning Path
**Based on performance:**

```javascript
// Student takes Check #1 → Scores 40%
// System recommends:
1. Khan Academy lesson on two-step equations
2. CK-12 practice (10 problems)
3. Mini-lesson (in-app tutorial)
4. Try Check #2 when ready

// Student completes practice → Scores 80%
// System says:
✅ Great improvement! Ready for Check #2
```

---

## 🏗️ How It Currently Works

### Question Generation Pipeline

```
┌─────────────┐
│  IEP Goal   │ (Input)
└──────┬──────┘
       │
       ├─ Parse goal text
       ├─ Detect subject (math/ela)
       ├─ Identify skill type
       │  (two-step, word problem, etc.)
       │
       ▼
┌──────────────────┐
│ Question Gener   │
│ (3 strategies)   │
└────────┬─────────┘
         │
    ┌────┴────┬─────────┬────────┐
    │         │         │        │
    ▼         ▼         ▼        ▼
Template   AI-Gemini  Hybrid  Fallback
(fast)     (smart)    (both)  (backup)
    │         │         │        │
    └────┬────┴─────────┴────────┘
         │
         ▼
  ┌──────────────┐
  │  Question    │
  │  + Answer    │
  │  + Explanation│
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Assessment   │
  │ (5 questions)│
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Student Takes│
  │ Assessment   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Results →    │
  │ Progress     │
  │ Tracking     │
  └──────────────┘
```

---

## 💡 Proposed Integration Architecture

### New Lesson Service

```typescript
// src/services/lessonResourceService.ts

interface LessonResource {
  id: string
  provider: 'khan-academy' | 'ck12' | 'custom'
  title: string
  url: string
  type: 'video' | 'interactive' | 'reading' | 'practice'
  duration?: string
  difficulty: 'easy' | 'medium' | 'hard'
  topics: string[] // e.g., ["two-step-equations", "word-problems"]
  gradeLevel: number
  standards?: string[] // CCSS alignment
}

// Match resources to goal
export async function findResourcesForGoal(goal: Goal): Promise<LessonResource[]> {
  // 1. Parse goal text for keywords
  // 2. Query CK-12/Khan Academy APIs or local database
  // 3. Return matched resources
  // 4. Sort by relevance
}

// Match resources to assessment results
export async function getRemediationResources(
  assessment: Assessment,
  result: AssessmentResult
): Promise<LessonResource[]> {
  // 1. Identify which questions student got wrong
  // 2. Extract topics from those questions
  // 3. Find targeted resources
  // 4. Return practice materials
}
```

### Enhanced Assessment Flow

```typescript
// Before assessment
interface EnhancedAssessment extends Assessment {
  preAssessmentResources?: LessonResource[]
  recommendedPreparation?: string
  estimatedStudyTime?: number
}

// After assessment
interface EnhancedResult extends AssessmentResult {
  remediationResources?: LessonResource[]
  nextSteps?: {
    action: 'practice' | 'lesson' | 'retake' | 'advance'
    resources: LessonResource[]
    message: string
  }
}
```

---

## 🔧 Implementation Options

### Option A: Static Resource Mapping (Simple)
**Create a lookup table:**

```typescript
const RESOURCE_MAP = {
  'two-step-equations': [
    {
      provider: 'khan-academy',
      url: 'https://www.khanacademy.org/...',
      title: 'Two-step equations',
      type: 'video'
    },
    {
      provider: 'ck12',
      url: 'https://www.ck12.org/...',
      title: 'Two-step equation practice',
      type: 'interactive'
    }
  ],
  'word-problems-money': [
    // ... resources
  ]
}

// Match based on goal keywords
export function getResourcesForGoal(goal: Goal): LessonResource[] {
  const keywords = extractKeywords(goal.goalText)
  const resources: LessonResource[] = []
  
  keywords.forEach(keyword => {
    if (RESOURCE_MAP[keyword]) {
      resources.push(...RESOURCE_MAP[keyword])
    }
  })
  
  return resources
}
```

**Pros:** Simple, fast, no external API  
**Cons:** Manual curation needed, limited scalability

---

### Option B: API Integration (Advanced)
**Use Khan Academy/CK-12 APIs:**

```typescript
// Khan Academy API
export async function searchKhanAcademy(topic: string, gradeLevel: number) {
  const response = await fetch(
    `https://www.khanacademy.org/api/v1/search?query=${topic}&kind=Video,Exercise`
  )
  return await response.json()
}

// CK-12 API (if available)
export async function searchCK12(topic: string, grade: number) {
  // Query CK-12 for resources
}

// Combined search
export async function findLessons(goal: Goal): Promise<LessonResource[]> {
  const topic = extractMainTopic(goal)
  const grade = goal.gradeLevel || 7
  
  const [khanResults, ck12Results] = await Promise.all([
    searchKhanAcademy(topic, grade),
    searchCK12(topic, grade)
  ])
  
  return [...khanResults, ...ck12Results]
    .filter(r => isRelevant(r, goal))
    .sort((a, b) => relevanceScore(b, goal) - relevanceScore(a, goal))
}
```

**Pros:** Dynamic, comprehensive, scales automatically  
**Cons:** Requires API access, rate limits, complexity

---

### Option C: Hybrid (Recommended)
**Combine static mapping with optional API:**

```typescript
export async function getResourcesForGoal(
  goal: Goal,
  options: { useAPI?: boolean } = {}
): Promise<LessonResource[]> {
  // 1. Start with curated static resources (always fast)
  const staticResources = getStaticResources(goal)
  
  // 2. Optionally enhance with API results (if enabled)
  if (options.useAPI) {
    try {
      const apiResources = await searchExternalAPIs(goal)
      return [...staticResources, ...apiResources]
    } catch (error) {
      console.warn('API search failed, using static resources only')
    }
  }
  
  return staticResources
}
```

---

## 📊 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    CURRENT SYSTEM                             │
└──────────────────────────────────────────────────────────────┘

┌─────────┐      ┌──────────────┐      ┌─────────────┐
│ Teacher │─────▶│ Select Goal  │─────▶│ Generate    │
│         │      │              │      │ Assessments │
└─────────┘      └──────────────┘      └──────┬──────┘
                                              │
                   ┌──────────────────────────┴──────┐
                   │                                 │
            ┌──────▼──────┐                  ┌──────▼──────┐
            │ AI (Gemini) │                  │  Template   │
            │  Question   │                  │  Question   │
            └──────┬──────┘                  └──────┬──────┘
                   │                                 │
                   └─────────┬──────────────────────┘
                             │
                      ┌──────▼──────┐
                      │  Preview &  │
                      │  Confirm    │
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │ Create 3    │
                      │ Assessments │
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │ Assign to   │
                      │ Students    │
                      └─────────────┘


┌──────────────────────────────────────────────────────────────┐
│              PROPOSED WITH LESSON INTEGRATION                 │
└──────────────────────────────────────────────────────────────┘

┌─────────┐      ┌──────────────┐      ┌──────────────┐
│ Teacher │─────▶│ Select Goal  │─────▶│ Find Lessons │◀─┐
│         │      │              │      │ (Khan/CK-12) │  │
└─────────┘      └──────────────┘      └──────┬───────┘  │
                                              │          │
                                       ┌──────▼──────┐   │
                                       │ Link Lessons│   │
                                       │ to Goal     │   │
                                       └──────┬──────┘   │
                                              │          │
                                       ┌──────▼──────┐   │
                                       │ Generate    │   │
                                       │ Assessments │   │
                                       └──────┬──────┘   │
                                              │          │
                   ┌──────────────────────────┴──────┐   │
                   │                                 │   │
            ┌──────▼──────┐                  ┌──────▼──────┐
            │ AI Question │                  │  Template   │
            │ + Lessons   │                  │  + Lessons  │
            └──────┬──────┘                  └──────┬──────┘
                   │                                 │
                   └─────────┬──────────────────────┘
                             │
                      ┌──────▼──────┐
                      │  Preview    │
                      │  + Lessons  │
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │  Student    │
                      │  Views      │
                      └──────┬──────┘
                             │
                 ┌───────────┴────────────┐
                 │                        │
          ┌──────▼──────┐         ┌──────▼──────┐
          │ 1. Review   │         │ 2. Take     │
          │    Lessons  │────────▶│    Test     │
          └─────────────┘         └──────┬──────┘
                                         │
                                  ┌──────▼──────┐
                                  │  Results    │
                                  └──────┬──────┘
                                         │
                            ┌────────────┴────────────┐
                            │                         │
                     ┌──────▼──────┐          ┌──────▼──────┐
                     │ Pass (≥70%) │          │ Fail (<70%) │
                     └─────────────┘          └──────┬──────┘
                                                     │
                                              ┌──────▼──────┐
                                              │ Remediation │
                                              │  Lessons    │
                                              └──────┬──────┘
                                                     │
                                              ┌──────▼──────┐
                                              │  Practice   │
                                              │  & Retake   │
                                              └─────────────┘
```

---

## 🎨 UI Mockup

### Student View - Before Assessment

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Two-Step Word Problems - Money - Check #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Preparation Resources (Optional)

  🎥 Khan Academy: Two-step equations intro (5 min)
      Perfect for: Understanding the basics
      [Watch Video]

  ✏️ CK-12: Interactive Practice (10 problems)
      Perfect for: Hands-on practice
      [Try Practice]

  📖 Math is Fun: Two-step equations guide
      Perfect for: Step-by-step reference
      [Read Guide]

[Skip to Assessment] [I've Reviewed - Start Assessment]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Student View - After Failed Assessment

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Assessment Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score: 2/5 (40%) ❌

You got these wrong:
  • Question 2: Two-step equation
  • Question 4: Money word problem
  • Question 5: Inverse operations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Recommended Review

Based on what you missed, try these:

  🎥 Two-Step Equations Review (Khan Academy)
      Focus on: Inverse operations
      Time: 8 minutes
      [Watch Now]

  ✏️ Practice: Similar Problems (CK-12)
      10 problems just like the ones you missed
      [Start Practice]

  💡 Quick Tip: Remember to work backwards!
      1. Undo addition/subtraction
      2. Then undo multiplication/division

[View More Resources] [Retake Assessment]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔑 Key Files to Modify

### 1. Add Resource Service
```
src/services/lessonResourceService.ts (NEW)
├── Resource type definitions
├── Static resource mapping
├── Optional API integration
└── Relevance scoring
```

### 2. Update Assessment Type
```
src/types/iep.ts
├── Add lessonResources field to Assessment
├── Add remediationResources to AssessmentResult
└── Add LessonResource interface
```

### 3. Enhance Assessment Generation
```
src/composables/useAssessmentGeneration.ts
├── Call findResourcesForGoal()
├── Attach resources to assessment
└── Show in preview
```

### 4. Student Assessment View
```
src/components/assessments/AssessmentTaking.vue
├── Show pre-assessment resources
├── "Review Lessons" button
└── Link to external content
```

### 5. Results View
```
src/components/assessments/AssessmentResult.vue
├── Analyze wrong answers
├── Show remediation resources
└── Practice/retake workflow
```

---

## 🎯 Benefits

### For Students
- ✅ Guided learning before assessment
- ✅ Targeted help for what they got wrong
- ✅ Multiple resource types (video, interactive, reading)
- ✅ Self-paced review

### For Teachers
- ✅ Less time explaining concepts
- ✅ Students come prepared
- ✅ Differentiated support automatically
- ✅ Track which resources students use

### For IEP Compliance
- ✅ Shows intervention attempts
- ✅ Demonstrates scaffolding
- ✅ Documents support provided
- ✅ Progress monitoring with remediation

---

## 📋 Implementation Phases

### Phase 1: Static Resource Library (2-3 hours)
1. Create `lessonResourceService.ts`
2. Build topic → resource mapping for common IEP goals
3. Add resources to assessment preview
4. Link from student assessment view

### Phase 2: Pre-Assessment Resources (2 hours)
1. Show resources before student starts
2. "Skip" or "I've Reviewed" buttons
3. Track if student viewed resources

### Phase 3: Post-Assessment Remediation (3 hours)
1. Analyze incorrect answers
2. Match to targeted resources
3. Show remediation path
4. Enable retake after review

### Phase 4: API Integration (Optional - 4-6 hours)
1. Khan Academy API integration
2. CK-12 API (if available)
3. Dynamic resource discovery
4. Caching for performance

---

## 🚀 Next Steps for ChatGPT Discussion

### Questions to Explore
1. **Resource Curation:** How many topics to cover? (10? 50? 100?)
2. **API Access:** Do you have Khan Academy/CK-12 API keys?
3. **Storage:** Store resources in Firestore or hardcode?
4. **Student Tracking:** Track which resources students view?
5. **Teacher Control:** Can teachers add/remove/reorder resources?

### Use Cases to Consider
1. Student struggles with concept → needs lesson before assessment
2. Student fails assessment → needs targeted remediation
3. Student passes → ready for next level (link to advanced resources)
4. Student plateaus → needs different approach (alternative resources)

---

## 📝 Sample Resource Database Structure

```typescript
const MATH_RESOURCES = {
  'two-step-equations': {
    beginner: [
      {
        provider: 'khan-academy',
        title: 'Intro to two-step equations',
        url: 'https://...',
        type: 'video',
        duration: '5:32',
        description: 'Learn the basics of solving two-step equations'
      }
    ],
    intermediate: [
      {
        provider: 'ck12',
        title: 'Two-step equations practice',
        url: 'https://...',
        type: 'interactive',
        exercises: 10
      }
    ],
    advanced: [
      {
        provider: 'khan-academy',
        title: 'Word problems with two-step equations',
        url: 'https://...',
        type: 'practice',
        problems: 8
      }
    ]
  },
  
  'word-problems-money': {
    // Similar structure
  }
}
```

---

## 🎓 Example: Full Integration

### Scenario: Student "Maria" with Two-Step Equations Goal

**1. Goal Created:**
```
"Solve two-step equations with 80% accuracy in 4/5 trials"
```

**2. Teacher Generates Assessments:**
```
System finds resources:
- Khan: "Two-step equations" (video)
- CK-12: "Practice problems" (interactive)
- Links them to all 3 assessments
```

**3. Maria Opens Check #1:**
```
Sees:
📚 Want to review first?
  🎥 5-min video
  ✏️ 10 practice problems
[Review] or [Start Now]
```

**4. Maria Scores 40%:**
```
Results show:
You got these wrong:
- Subtraction then division
- Negative numbers
  
Try these:
🎥 Review: Inverse operations (3 min)
✏️ Practice: 5 similar problems
[Do Practice] → [Retake]
```

**5. Maria Practices & Retakes:**
```
Retake score: 80% ✅
Ready for Check #2!
```

---

## 💾 Database Schema Additions

### Assessment Collection
```javascript
{
  // Existing fields...
  title: "Two-Step Equations - Check #1",
  description: "...",
  questions: [...],
  
  // NEW: Lesson integration
  lessonResources: [
    {
      id: "les_123",
      provider: "khan-academy",
      title: "Two-step equations",
      url: "https://...",
      type: "video",
      duration: "5:32",
      recommended: true,
      order: 1
    },
    {
      id: "les_124",
      provider: "ck12",
      title: "Practice problems",
      url: "https://...",
      type: "interactive",
      exercises: 10,
      recommended: true,
      order: 2
    }
  ],
  
  showResourcesBeforeAssessment: true,
  requireResourceReview: false // Optional: force students to view
}
```

### Assessment Result Collection
```javascript
{
  // Existing fields...
  score: 2,
  totalPoints: 5,
  percentage: 40,
  
  // NEW: Resource tracking
  resourcesViewed: [
    {
      resourceId: "les_123",
      viewedAt: "2025-12-18T10:30:00Z",
      duration: 180 // seconds watched
    }
  ],
  
  // NEW: Remediation
  remediationRecommended: true,
  remediationResources: [
    {
      resourceId: "les_125",
      reason: "Missed inverse operations questions",
      targetQuestions: ["q2", "q4"]
    }
  ]
}
```

---

This documentation should help ChatGPT understand the current system and propose integration strategies for CK-12/Khan Academy resources!



