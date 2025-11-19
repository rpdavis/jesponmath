# Math Fluency System - Data Collection & Reporting Plan

## Executive Summary

This document outlines the complete data architecture for a comprehensive math fluency system that combines:
1. **Practice Storage Buckets** (Does Not Know → Emerging → Approaching → Proficient → Mastery)
2. **Weekly Fluency Assessments** (Paper-based, 1-minute probes)
3. **Daily Digital Practice** (Mon-Thu adaptive practice)
4. **Comprehensive Reporting** (Teacher, Student, IEP)

---

## 📊 Current System State

### Existing Collections (As-Is)

#### 1. `diagnosticResults` Collection
**Current Usage**: Stores results from math facts diagnostic tests

**Current Structure**:
```typescript
{
  studentUid: string
  studentName: string
  diagnosticType: 'math-facts' | 'foundational'
  testType: 'all' | 'addition' | 'subtraction' | 'multiplication' | 'division'
  testName: string
  overallScore: number  // percentage
  totalQuestions: number
  correctAnswers: number
  timeSpent: number  // seconds
  averageTimePerQuestion: number  // seconds
  questionsPerMinute: number
  fluencyLevel: 'Excellent' | 'Good' | 'Developing' | 'Needs Practice'
  
  operationResults: {
    [operation: string]: {
      correct: number
      total: number
      avgTime: number
    }
  }
  
  answers: Array<{
    questionId: string
    answer: string
    isCorrect: boolean
    timeSpent: number  // milliseconds
    category?: string  // e.g., "Doubles", "Make 10"
    factFamily?: string  // e.g., "7s", "Sums 11-15"
    operation?: string  // 'addition', 'subtraction', etc.
  }>
  
  completedAt: Timestamp
  createdAt: Timestamp
}
```

**What It Does Well**:
✅ Tracks overall fluency metrics
✅ Breaks down by operation
✅ Records individual question responses with timing
✅ Already has category/factFamily tracking (added recently)

**What's Missing for New System**:
❌ No proficiency level tracking (unmet/emerging/proficient/mastered)
❌ No problem-level history over time
❌ No consecutive day counters
❌ No practice vs. assessment differentiation
❌ No paper assessment support

---

## 🗄️ Proposed New Data Architecture

### Overview: Two-Tier System

```
Tier 1: PRACTICE PROGRESS (ongoing, per-problem tracking)
└─ Collection: mathFluencyProgress
   └─ Tracks each problem's journey through proficiency levels
   
Tier 2: ASSESSMENT RESULTS (weekly snapshots)
└─ Collection: mathFluencyAssessments  
   └─ Tracks weekly fluency checks (paper-based)
   
Tier 3: DAILY PRACTICE SESSIONS (granular tracking)
└─ Collection: mathFluencyPracticeSessions
   └─ Tracks each day's practice (Mon-Thu digital)
```

---

## 📦 NEW COLLECTION 1: `mathFluencyProgress`

### Purpose
Track each student's **current proficiency state** for every math fact problem.

### Document Structure
**Document ID**: `{studentUid}_{operation}` (e.g., `abc123_addition`)

**Schema**:
```typescript
interface MathFluencyProgress {
  // Identification
  id: string  // Firestore doc ID
  studentUid: string
  studentName: string
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division'
  
  // Operation Status
  currentlyPracticing: boolean  // True if this is active operation
  unlocked: boolean  // True if student has access to this operation
  completedOperation: boolean  // True if 95%+ proficiency achieved
  unlockedDate: Timestamp | null
  completedDate: Timestamp | null
  
  // Problem Banks (5 proficiency levels)
  problemBanks: {
    doesNotKnow: ProblemProgress[]     // Incorrect on diagnostic
    emerging: ProblemProgress[]         // Correct 1-2 days (unstable)
    approaching: ProblemProgress[]      // Correct 3-4 days, 6-12s response
    proficient: ProblemProgress[]       // Correct 5+ days, 3-6s response
    mastered: ProblemProgress[]         // Correct consistently, <3s response
  }
  
  // Distribution Statistics
  proficiencyDistribution: {
    doesNotKnow: number     // Count
    emerging: number
    approaching: number
    proficient: number
    mastered: number
    total: number           // Total unique problems
  }
  
  // Proficiency Metrics
  proficiencyPercentage: number  // (approaching + proficient + mastered) / total
  masteryPercentage: number      // (proficient + mastered) / total
  canUnlockNext: boolean         // True if proficiencyPercentage >= 95%
  
  // Practice Tracking
  totalPracticeDays: number
  consecutivePracticeDays: number
  lastPracticeDate: Timestamp | null
  practiceDatesLog: Timestamp[]  // All practice dates
  
  // Assessment Tracking
  lastAssessmentDate: Timestamp | null
  lastAssessmentScore: number | null  // CPM (correct per minute)
  assessmentHistory: {
    date: Timestamp
    correctPerMinute: number
    accuracy: number
    totalAttempted: number
    totalCorrect: number
  }[]
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string  // Teacher UID who initiated
}

interface ProblemProgress {
  // Problem Identification
  problemId: string  // e.g., "7+8" or "ADD_7_8"
  num1: number
  num2: number
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division'
  correctAnswer: string
  displayText: string  // "7 + 8 = ?"
  
  // Categorization (for analysis)
  category: string  // "Doubles", "Make 10", "7s facts", etc.
  factFamily: string  // More specific grouping
  difficulty: number  // 1-5 scale
  
  // Current Proficiency (DERIVED FROM LAST 5 ATTEMPTS)
  proficiencyLevel: 'doesNotKnow' | 'emerging' | 'approaching' | 'proficient' | 'mastered'
  
  // ⭐ LAST 5 ATTEMPTS TRACKING (Core of proficiency calculation)
  last5Attempts: Array<{
    date: Timestamp
    correct: boolean
    responseTime: number | null  // null for paper assessments
    source: 'paper-assessment' | 'digital-practice' | 'digital-assessment' | 'initial-diagnostic'
    assessmentId?: string  // If from assessment
    sessionId?: string  // If from practice session
  }>
  
  // Proficiency Calculation (auto-computed from last5Attempts)
  proficiencyCalculation: {
    correctOutOfLast5: number  // e.g., 3 out of 5 = 60%
    averageTimeOfLast5: number | null  // Average response time (ms), null if no timing data
    last5Trend: 'improving' | 'stable' | 'regressing'  // Based on chronological order
    confidenceLevel: 'low' | 'medium' | 'high'  // Low if <5 attempts total
  }
  
  // Progression Tracking
  consecutiveCorrectDays: number  // Days in a row correct (for promotion rules)
  daysInCurrentLevel: number  // How long in this proficiency level
  totalAttempts: number  // All-time attempts (beyond last 5)
  correctAttempts: number  // All-time correct
  
  // Timing Data (last 10 for broader trend, but last 5 used for proficiency)
  responseTimes: number[]  // Last 10 response times (milliseconds), includes nulls for paper
  averageResponseTime: number | null  // milliseconds, calculated from non-null times
  fastestResponseTime: number | null  // milliseconds
  slowestResponseTime: number | null  // milliseconds
  
  // History
  firstAttemptDate: Timestamp
  lastAttemptDate: Timestamp
  dateEnteredEmerging: Timestamp | null
  dateEnteredApproaching: Timestamp | null
  dateEnteredProficient: Timestamp | null
  dateEnteredMastered: Timestamp | null
  
  // Daily Practice Tracking (for 3-day consecutive rule)
  dailyResults: {
    date: string  // YYYY-MM-DD format
    correct: boolean
    responseTime: number | null  // milliseconds, null for paper
    round: 'learning' | 'practice' | 'assessment' | 'weekly-check'
    assessmentId?: string
  }[]
  
  // Error Analysis
  commonErrors: string[]  // Student's common wrong answers
  errorPattern: 'calculation' | 'strategy' | 'careless' | 'unknown' | null
  needsStrategyInstruction: boolean
  
  // Flags
  flaggedForReview: boolean  // Teacher can manually flag
  regressionCount: number  // Times demoted from higher level
  lastRegressionDate: Timestamp | null
}

// Helper function: Calculate proficiency from last 5 attempts
function calculateProficiencyFromLast5(
  correctCount: number, 
  avgTime: number | null
): ProficiencyLevel {
  // Need at least 3 correct out of last 5 to advance from "doesNotKnow"
  if (correctCount === 0) return 'doesNotKnow'
  if (correctCount <= 2) return 'emerging'
  
  // 3-5 correct - use timing to differentiate
  if (avgTime === null) {
    // Paper only - no timing data
    if (correctCount === 5) return 'proficient'  // Perfect accuracy
    if (correctCount === 4) return 'approaching'
    return 'emerging'  // 3 correct
  }
  
  // Have timing data - use speed + accuracy
  if (correctCount === 5) {
    // Perfect accuracy - differentiate by speed
    if (avgTime < 3000) return 'mastered'  // <3s
    if (avgTime < 6000) return 'proficient'  // 3-6s
    return 'approaching'  // >6s but 100% accurate
  }
  
  if (correctCount === 4) {
    // 80% accuracy
    if (avgTime < 6000) return 'proficient'  // <6s
    return 'approaching'  // Slower
  }
  
  // 60% accuracy (3/5)
  return 'emerging'
}
```

### Example Document:
```json
{
  "id": "studentXYZ_addition",
  "studentUid": "studentXYZ",
  "studentName": "Almeida, Rose",
  "operation": "addition",
  "currentlyPracticing": true,
  "unlocked": true,
  "completedOperation": false,
  "proficiencyDistribution": {
    "doesNotKnow": 12,
    "emerging": 15,
    "approaching": 18,
    "proficient": 28,
    "mastered": 27,
    "total": 100
  },
  "proficiencyPercentage": 73,
  "masteryPercentage": 55,
  "canUnlockNext": false,
  "totalPracticeDays": 21,
  "consecutivePracticeDays": 7,
  "problemBanks": {
    "doesNotKnow": [
      {
        "problemId": "ADD_7_8",
        "num1": 7,
        "num2": 8,
        "operation": "addition",
        "correctAnswer": "15",
        "displayText": "7 + 8 = ?",
        "category": "Sums 11-15",
        "factFamily": "Make 10 Strategy",
        "proficiencyLevel": "doesNotKnow",
        "consecutiveCorrectDays": 0,
        "totalAttempts": 5,
        "correctAttempts": 0,
        "responseTimes": [18000, 15000, 20000],
        "averageResponseTime": 17666,
        "dailyResults": [
          {
            "date": "2025-11-14",
            "correct": false,
            "responseTime": 18000,
            "round": "learning"
          }
        ],
        "needsStrategyInstruction": true
      }
    ],
    "mastered": [
      {
        "problemId": "ADD_5_5",
        "num1": 5,
        "num2": 5,
        "correctAnswer": "10",
        "category": "Doubles",
        "proficiencyLevel": "mastered",
        "consecutiveCorrectDays": 14,
        "averageResponseTime": 1200,
        "dateEnteredMastered": "2025-11-03T..."
      }
    ]
  }
}
```

---

## 📝 NEW COLLECTION 2: `mathFluencyAssessments`

### Purpose
Store **weekly fluency check results** (Friday paper assessments) and initial comprehensive diagnostic.

### Document Structure
**Document ID**: Auto-generated

**Schema**:
```typescript
interface MathFluencyAssessment {
  // Identification
  id: string  // Firestore doc ID (teacher manually inputs this in app)
  assessmentName: string  // e.g., "Week 3 Addition Fluency Check"
  studentUid: string
  studentName: string
  teacherUid: string  // Who administered/scored
  
  // Assessment Details
  assessmentType: 'initial-diagnostic' | 'weekly-fluency-check' | 'comprehensive-review'
  assessmentCategory: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
  week: number  // Week number of practice (0 for initial diagnostic, 1, 2, 3, etc.)
  assessmentDate: Timestamp
  
  // Format
  deliveryMethod: 'paper' | 'digital'
  timeLimit: number  // seconds (60 for 1-min probe, 2000 for initial diagnostic)
  
  // Overall Results
  totalProblemsAttempted: number  // How many student attempted
  totalProblemsCorrect: number    // How many were correct
  totalProblemsIncorrect: number  // How many were incorrect
  totalProblemsOnAssessment: number  // Total problems available
  accuracy: number                // percentage (correct/attempted)
  
  // Fluency Metrics (for 1-minute probes)
  correctPerMinute: number  // Primary fluency metric (CPM)
  incorrectPerMinute: number  // Errors per minute
  fluencyLevel: 'mastered' | 'proficient' | 'developing' | 'emerging' | 'needs-support'
  fluencyLevelCriteria: {
    mastered: '40+ CPM',
    proficient: '30-39 CPM',
    developing: '20-29 CPM',
    emerging: '10-19 CPM',
    needsSupport: '<10 CPM'
  }
  
  // Problem-Level Data (manually tracked in app)
  // Each problem has history of last 5 attempts to determine proficiency level
  problemResults: Array<{
    problemId: string  // e.g., "ADD_7_8"
    problemNumber: number  // Position on sheet (1-60)
    num1: number
    num2: number
    operation: string
    correctAnswer: string
    displayText: string  // "7 + 8 = ?"
    
    // This assessment's result
    wasAttempted: boolean
    isCorrect: boolean
    responseTime: number | null  // null for paper, milliseconds for digital
    
    // Historical tracking (last 5 attempts from any assessment/practice)
    last5Attempts: Array<{
      date: Timestamp
      correct: boolean
      responseTime: number | null
      source: 'paper-assessment' | 'digital-practice' | 'digital-assessment'
    }>
    
    // Derived proficiency (from last 5 attempts)
    currentProficiencyLevel: 'doesNotKnow' | 'emerging' | 'approaching' | 'proficient' | 'mastered'
    proficiencyCalculation: {
      correctOutOfLast5: number  // e.g., 3/5
      averageTimeOfLast5: number | null  // Average of last 5 response times
      trend: 'improving' | 'stable' | 'regressing'
    }
    
    // Category for analysis
    category: string  // "Doubles", "Make 10", "7s facts"
    factFamily: string
  }>
  
  // Growth Tracking
  growthFromLastWeek: {
    cpmChange: number  // e.g., +6 CPM
    accuracyChange: number  // e.g., +8%
    proficiencyLevelChange: string  // e.g., "Emerging → Developing"
  } | null
  
  // Problem Bank Impact
  promotions: {
    emergingToProficient: number  // Count of facts promoted
    approachingToProficient: number
    proficientToMastered: number
    totalPromoted: number
  }
  
  demotions: {
    proficientToEmerging: number
    masteredToProficient: number
    totalDemoted: number
  }
  
  // Focus Areas Identified
  weakFactFamilies: string[]  // e.g., ["Make 10", "7s facts"]
  errorPatterns: string[]     // e.g., ["Struggles with sums 11-15"]
  
  // Metadata
  scoredBy: string  // Teacher UID
  scoredAt: Timestamp
  entryMethod: 'quick' | 'detailed'  // Quick = total only, Detailed = per-problem
  notes: string  // Teacher observations
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Example Document:
```json
{
  "id": "abc123_week3_addition",
  "studentUid": "studentXYZ",
  "studentName": "Almeida, Rose",
  "teacherUid": "teacherABC",
  "assessmentType": "weekly-fluency-check",
  "operation": "addition",
  "week": 3,
  "assessmentDate": "2025-11-17T...",
  "deliveryMethod": "paper",
  "timeLimit": 60,
  
  "totalProblemsAttempted": 32,
  "totalProblemsCorrect": 28,
  "totalProblemsOnSheet": 60,
  "accuracy": 87.5,
  
  "correctPerMinute": 28,
  "fluencyLevel": "developing",
  
  "growthFromLastWeek": {
    "cpmChange": 6,
    "accuracyChange": 8,
    "proficiencyLevelChange": "Emerging → Developing"
  },
  
  "promotions": {
    "emergingToProficient": 4,
    "proficientToMastered": 2,
    "totalPromoted": 6
  },
  
  "demotions": {
    "proficientToEmerging": 3,
    "totalDemoted": 3
  },
  
  "weakFactFamilies": ["Make 10", "Sums 11-15"],
  "errorPatterns": ["Tends to reverse addends in sums >10"],
  
  "entryMethod": "quick",
  "scoredBy": "teacherABC",
  "scoredAt": "2025-11-17T10:15:00Z",
  "notes": "Showed improvement. Still hesitates on Make 10 facts."
}
```

---

## 🎯 NEW COLLECTION 3: `mathFluencyPracticeSessions`

### Purpose
Track **each daily practice session** (Monday-Thursday).

### Document Structure
**Document ID**: Auto-generated

**Schema**:
```typescript
interface MathFluencyPracticeSession {
  // Identification
  id: string
  studentUid: string
  studentName: string
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division'
  
  // Session Info
  sessionDate: Timestamp
  dayOfWeek: number  // 1=Monday, 2=Tuesday, etc.
  weekNumber: number  // Which week of practice for this operation
  
  // Session Completion
  completed: boolean
  completionPercentage: number  // 0-100
  totalTimeSpent: number  // seconds
  
  // Round 1: Learning (Unmet Facts)
  round1_learning: {
    problemsTargeted: string[]  // Problem IDs
    problemsCompleted: string[]  // Successfully learned
    problemsStillUnmet: string[]  // Still struggling
    
    attemptsPerProblem: {
      [problemId: string]: {
        encodingCycles: number  // Times shown answer
        recallAttempts: number  // Times tested
        finalResult: 'learned' | 'retry-later' | 'incomplete'
        timesSpent: number[]  // Each recall attempt time
      }
    }
    
    newlyLearned: string[]  // Moved to "emerging" this session
    timeSpent: number
    completed: boolean
  }
  
  // Round 2: Practice (Interleaved)
  round2_practice: {
    problemsPresented: string[]  // All problems shown
    problemsMixed: boolean  // Was it interleaved (70/20/10)?
    
    mixComposition: {
      emerging: number  // 70%
      proficient: number  // 20%
      mastered: number  // 10%
    }
    
    results: {
      [problemId: string]: {
        attempts: number  // May attempt multiple times if wrong
        correct: boolean  // Final result for this session
        responseTimes: number[]  // Each attempt time
        returnedToStack: boolean  // Was it wrong and re-added?
      }
    }
    
    accuracy: number  // percentage
    averageResponseTime: number  // milliseconds
    timeSpent: number
    completed: boolean
  }
  
  // Round 3: Quick Assessment
  round3_assessment: {
    problemsAssessed: string[]  // 10 problems tested
    
    results: {
      [problemId: string]: {
        correct: boolean
        responseTime: number
        previousLevel: string
        maintainedLevel: boolean  // Did it stay in same level?
      }
    }
    
    accuracy: number
    averageResponseTime: number
    timeSpent: number
    completed: boolean
  }
  
  // Session Outcomes
  promotionsEarned: string[]  // Problem IDs promoted
  demotionsOccurred: string[]  // Problem IDs demoted
  consecutiveDaysUpdated: {
    [problemId: string]: number  // New consecutive day count
  }
  
  // Session Quality
  sessionQuality: 'excellent' | 'good' | 'fair' | 'incomplete'
  engagementScore: number  // 0-100 based on completion and speed
  
  // Metadata
  createdAt: Timestamp
  completedAt: Timestamp | null
}
```

---

## 📊 Data Collection Points

### What Gets Tracked & When

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA FLOW TIMELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ WEEK 1, DAY 1: Initial Paper Diagnostic                     │
│ ├─ Teacher administers paper test                           │
│ ├─ Teacher scores: attempted/correct + specific errors      │
│ ├─ Teacher inputs to system                                 │
│ └─ System creates:                                           │
│    ├─ mathFluencyProgress document (initial problem banks)  │
│    ├─ mathFluencyAssessments document (baseline)            │
│    └─ Categorizes all 100 addition facts into buckets       │
│                                                              │
│ MONDAY-THURSDAY: Daily Digital Practice                     │
│ Each day:                                                    │
│ ├─ Student completes 3 rounds                               │
│ ├─ System creates mathFluencyPracticeSession document       │
│ ├─ System updates mathFluencyProgress:                      │
│ │  ├─ Increments consecutiveCorrectDays counters            │
│ │  ├─ Updates response times                                │
│ │  ├─ Moves problems between buckets                        │
│ │  └─ Recalculates proficiency percentages                  │
│ └─ Student sees progress (facts learned, promoted)          │
│                                                              │
│ FRIDAY: Weekly Paper Fluency Check                          │
│ ├─ App generates personalized 1-min probe (60 problems)     │
│ ├─ Teacher administers to whole class                       │
│ ├─ Teacher scores (attempted/correct +/- specific errors)   │
│ ├─ Teacher inputs to system                                 │
│ └─ System:                                                   │
│    ├─ Creates mathFluencyAssessment document                │
│    ├─ Updates mathFluencyProgress (promotions/demotions)    │
│    ├─ Calculates week-over-week growth                      │
│    ├─ Identifies weak fact families                         │
│    └─ Prepares next week's practice plan                    │
│                                                              │
│ REPEAT WEEKLY until 95% proficiency → Unlock next operation │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Metrics Tracked

### Per-Problem Metrics (Micro Level)

| Metric | Purpose | Tracked In |
|--------|---------|------------|
| **Consecutive Correct Days** | Determine promotion eligibility | `ProblemProgress.consecutiveCorrectDays` |
| **Response Time Trend** | Measure automaticity development | `ProblemProgress.responseTimes[]` |
| **Total Attempts** | Calculate accuracy rate | `ProblemProgress.totalAttempts` |
| **Current Proficiency** | Bucket assignment | `ProblemProgress.proficiencyLevel` |
| **Error Pattern** | Inform instruction | `ProblemProgress.errorPattern` |

### Per-Operation Metrics (Macro Level)

| Metric | Purpose | Tracked In |
|--------|---------|------------|
| **Proficiency %** | Operation mastery | `MathFluencyProgress.proficiencyPercentage` |
| **CPM (Correct/Min)** | Weekly fluency rate | `MathFluencyAssessment.correctPerMinute` |
| **Distribution** | Bucket counts | `MathFluencyProgress.proficiencyDistribution` |
| **Consecutive Days** | Practice consistency | `MathFluencyProgress.consecutivePracticeDays` |
| **Unlock Status** | Ready for next operation? | `MathFluencyProgress.canUnlockNext` |

### Per-Student Metrics (Portfolio Level)

| Metric | Purpose | Source |
|--------|---------|--------|
| **Operations Unlocked** | Overall progress | Count of `MathFluencyProgress` docs |
| **Total Facts Mastered** | Across all operations | Sum of `mastered` counts |
| **Practice Consistency** | Engagement tracking | `consecutivePracticeDays` |
| **Growth Rate** | Learning velocity | Week-over-week CPM change |
| **Weak Areas** | Intervention targets | Aggregated `weakFactFamilies` |

---

## 📈 Reporting Requirements

### 1. Teacher Dashboard (Daily View)

**Purpose**: Monitor class-wide practice completion and identify students needing attention

**Data Displayed**:
```
┌────────────────────────────────────────────────────────┐
│ Math Fluency - Class Overview                          │
│ Period 4 - Math 7                                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│ Today's Practice (Thursday, Nov 16):                   │
│ Completed: 24/28 students (86%)                        │
│ Avg Time: 11 minutes                                   │
│                                                         │
│ Current Week Focus: Addition                           │
│ Class Avg Proficiency: 67%                             │
│ Students at 95%+: 6/28 (ready for next operation)      │
│                                                         │
├────────────────────────────────────────────────────────┤
│ Student Alerts:                                         │
│ 🔴 Grijalva, Jesus - No practice 3 days (intervention) │
│ 🟡 Mobley, Jayden - Accuracy dropped to 45%            │
│ 🟢 Chatfield, Lexee - Hit 95%! Ready for subtraction   │
├────────────────────────────────────────────────────────┤
│                                                         │
│ [View Individual Progress] [Assign Practice] [Reports] │
└────────────────────────────────────────────────────────┘
```

**Data Sources**:
- `mathFluencyPracticeSessions` (last 7 days, completion status)
- `mathFluencyProgress` (proficiency percentages, unlock status)
- Aggregated from all students in class

---

### 2. Individual Student View (Teacher)

**Purpose**: Deep dive into one student's progress

**Data Displayed**:
```
┌─────────────────────────────────────────────────────────────┐
│ Almeida, Rose - Math Fluency Progress                       │
│ Current Operation: Addition (Week 3 of 6 estimated)         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Proficiency Status:                                         │
│ ┌────────────────────────────────────────────────┐          │
│ │ 🏆 Mastered:     27 facts (27%) ████████░░     │          │
│ │ 🔵 Proficient:   28 facts (28%) █████████░     │          │
│ │ 🟡 Approaching:  18 facts (18%) ██████░░░      │          │
│ │ 🟢 Emerging:     15 facts (15%) █████░░░       │          │
│ │ 🔴 Unknown:      12 facts (12%) ████░░░        │          │
│ └────────────────────────────────────────────────┘          │
│                                                              │
│ Overall: 73/100 facts proficient (73%)                      │
│ Progress to Unlock Subtraction: 73/95 (need 22 more)       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Weekly Fluency Checks (Paper Assessments):                  │
│                                                              │
│ Week 3 (Nov 17): 28 CPM, 87% acc  📈 Developing            │
│ Week 2 (Nov 10): 22 CPM, 79% acc  📊 Emerging    (+6 CPM)  │
│ Week 1 (Nov 3):  16 CPM, 71% acc  📉 Emerging    (+6 CPM)  │
│                                                              │
│ Growth Trend: ✅ Improving (+12 CPM in 3 weeks)            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Practice Consistency:                                        │
│ This Week: ████████████░░ 6/7 days                         │
│ Last Week: ██████████████ 7/7 days 🔥                      │
│ Total: 21 practice days, 7-day streak                       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Problem Areas (Focus for Next Week):                        │
│                                                              │
│ 🔴 Does Not Know (12 facts):                               │
│    - Make 10: 7+3, 6+4, 8+2  (0/6 correct)                 │
│    - Sums 11-15: 7+8, 9+6, 8+7  (0/9 correct)              │
│                                                              │
│ 🟡 Emerging (15 facts - need 3 consecutive days):          │
│    - Doubles: 8+8 (2 days), 9+9 (1 day)                    │
│    - Make 10: 9+1 (2 days), 7+3 (1 day)                    │
│    - Sums 6-10: 5+4, 6+3, 7+2  (1-2 days each)             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Recommended Actions:                                         │
│ 1. Focus daily practice on Make 10 strategy                 │
│ 2. Use ten-frame manipulatives for sums crossing 10        │
│ 3. Continue current pace - on track for 95% in 3-4 weeks   │
│                                                              │
│ [View Problem Details] [Print IEP Report] [Adjust Settings] │
└─────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- `mathFluencyProgress` (proficiency distribution, unlock progress)
- `mathFluencyAssessments` (weekly fluency checks, growth trend)
- `mathFluencyPracticeSessions` (daily completion, streak tracking)

---

### 3. Student View (Simplified, Motivational)

**Purpose**: Show progress in student-friendly format

**Data Displayed**:
```
┌─────────────────────────────────────────────────────┐
│ 🎯 My Math Facts Progress                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Current Mission: Addition Facts                     │
│                                                      │
│ Your Achievement Stars:                             │
│ 🏆 Mastered:     27 facts  ★★★★★★★★★★★★★★★       │
│ 🔵 Proficient:   28 facts  ★★★★★★★★★★★★★★★★       │
│ 🟡 Practicing:   33 facts  ★★★★★★★★★★★★★░░       │
│                                                      │
│ Total Stars Earned: 55/100 ⭐                       │
│                                                      │
│ ┌──────────────────────────────────────────┐        │
│ │ Unlock Next Level: Subtraction           │        │
│ │ Progress: ████████████████░░░░ 73/95     │        │
│ │ Keep going! You're almost there! 🚀      │        │
│ └──────────────────────────────────────────┘        │
│                                                      │
│ Practice Streak: 7 days 🔥🔥🔥                      │
│ Last Practice: Today                                │
│                                                      │
│ This Week:                                          │
│ ✅ Monday     - 3 new facts learned!                │
│ ✅ Tuesday    - 2 facts promoted!                   │
│ ✅ Wednesday  - Great session!                      │
│ ✅ Thursday   - 5 facts mastered!                   │
│ ⏳ Friday     - Fluency Check (in class)            │
│                                                      │
│ Speed Challenge:                                     │
│ Last Week: 22 correct/minute                        │
│ This Week: 28 correct/minute 📈 (+6!)              │
│                                                      │
│ [Start Today's Practice] [See My Facts]             │
└─────────────────────────────────────────────────────┘
```

**Data Sources**:
- `mathFluencyProgress` (proficiency distribution, unlock status)
- `mathFluencyPracticeSessions` (streak, daily completion)
- `mathFluencyAssessments` (weekly CPM scores)

---

### 4. IEP Progress Report (Formal Documentation)

**Purpose**: Comprehensive report for IEP meetings, progress monitoring

**Format**: Printable PDF with graphs

**Data Displayed**:
```
═══════════════════════════════════════════════════════════
  IEP PROGRESS MONITORING REPORT - MATH FACT FLUENCY
═══════════════════════════════════════════════════════════

Student: Almeida, Rose                 Grade: 7
Teacher: Mr. Davis                     Report Period: Nov 1-30, 2025
IEP Goal: Improve math fact fluency to 95% proficiency

───────────────────────────────────────────────────────────
BASELINE DATA (November 1, 2025)
───────────────────────────────────────────────────────────
Operation: Addition (0-20)
Initial Assessment: 16 correct per minute, 71% accuracy
Proficiency Level: Emerging

Initial Distribution:
- Mastered:    12 facts (12%)
- Proficient:  23 facts (23%)
- Emerging:    28 facts (28%)
- Unknown:     37 facts (37%)

───────────────────────────────────────────────────────────
CURRENT STATUS (November 30, 2025)
───────────────────────────────────────────────────────────
Latest Assessment: 28 correct per minute, 87% accuracy
Proficiency Level: Developing

Current Distribution:
- Mastered:    27 facts (27%)  [+15 facts in 4 weeks]
- Proficient:  28 facts (28%)  [+5 facts]
- Approaching: 18 facts (18%)  [New category]
- Emerging:    15 facts (15%)  [-13 facts]
- Unknown:     12 facts (12%)  [-25 facts]

Overall Proficiency: 73% (need 95% for goal)

───────────────────────────────────────────────────────────
PROGRESS SUMMARY
───────────────────────────────────────────────────────────
Growth:
✅ Fluency Rate: +12 CPM (75% increase)
✅ Accuracy: +16 percentage points
✅ Facts Mastered: +15 facts
✅ Facts Proficient: +5 facts
✅ Unknown Facts: -25 facts (67% reduction)

Weekly Fluency Checks:
Week 1: 16 CPM (Baseline)
Week 2: 22 CPM (+6)
Week 3: 28 CPM (+6)
Week 4: 32 CPM (+4)

[Line Graph Would Appear Here]

Practice Consistency:
- Total Practice Days: 28/28 possible (100%)
- Longest Streak: 14 days
- Average Session Time: 11 minutes
- Engagement Score: 94/100 (Excellent)

───────────────────────────────────────────────────────────
SKILL AREA ANALYSIS
───────────────────────────────────────────────────────────
Strengths (90%+ accuracy):
✅ Doubles (6+6, 7+7, etc.): 100% mastered
✅ Sums to 5: 100% mastered
✅ Sums 6-10: 95% proficient

Areas Needing Support (</=70% accuracy):
⚠️ Make 10 facts: 50% accuracy (6/12 correct)
⚠️ Sums 11-15: 60% accuracy (9/15 correct)

Recommended Interventions:
1. Continue focused practice on Make 10 strategy
2. Use ten-frame visual supports
3. Daily 5-minute Make 10 drill
4. Expected proficiency: 2-3 weeks

───────────────────────────────────────────────────────────
PROGRESS TOWARD IEP GOAL
───────────────────────────────────────────────────────────
Goal: 95% proficiency in addition facts by January 15, 2026

Current: 73% proficiency
Needed: 22 more facts to proficiency
Timeline: 3-4 weeks at current pace
Status: ON TRACK ✅

Projected Completion: December 20, 2025
Pace: Ahead of schedule by 3 weeks

───────────────────────────────────────────────────────────
NEXT STEPS
───────────────────────────────────────────────────────────
1. Continue daily practice (Mon-Thu, 10-12 min)
2. Weekly fluency checks every Friday
3. Focus on Make 10 and Sums 11-15
4. Upon reaching 95%: Begin subtraction facts
5. Next progress review: December 15, 2025

───────────────────────────────────────────────────────────
Teacher Signature: ________________  Date: ___________

═══════════════════════════════════════════════════════════
```

**Data Sources**:
- All three collections aggregated
- Historical comparison (baseline vs. current)
- Trend analysis from weekly assessments
- Practice consistency from session logs

---

### 5. Parent Report (Simplified)

**Purpose**: Communicate progress to parents in accessible language

**Format**: Email or printed handout

```
═══════════════════════════════════════════════════
  MATH FACTS PROGRESS REPORT
═══════════════════════════════════════════════════

Dear Parent/Guardian of Almeida, Rose,

I'm pleased to share Rose's progress in our Math Facts 
Fluency program!

WHAT WE'RE WORKING ON:
Rose is building automaticity with addition facts (0-20).
This means being able to quickly recall facts like 7+8=15
without counting or calculating.

PROGRESS THIS MONTH:
✅ Facts Mastered: 27 (started with 12)
✅ Speed Improved: From 16 to 28 facts per minute
✅ Accuracy Improved: From 71% to 87%
✅ Practice Days: 28 out of 28 (perfect attendance!)

WHAT THIS MEANS:
Rose is making excellent progress! She has mastered
basic doubles (5+5, 6+6, etc.) and is working on more
challenging facts like "make 10" combinations (7+3=10).

NEXT STEPS:
In 3-4 weeks, Rose should master addition and move on
to subtraction facts. She's on track to complete all
four operations by March 2026.

HOW TO SUPPORT AT HOME (Optional):
- Practice "make 10" facts (7+3, 8+2, 9+1, etc.)
- 5 minutes daily using flashcards
- Focus on speed: answer in 3 seconds or less

Questions? Contact me at rdavis@vacavilleusd.org

Sincerely,
Mr. Davis

═══════════════════════════════════════════════════
```

**Data Sources**:
- `mathFluencyProgress` (proficiency distribution)
- `mathFluencyAssessments` (CPM growth, accuracy trend)
- `mathFluencyPracticeSessions` (practice days count)

---

## 🎯 Initial Diagnostic Flow (Week 1)

### Comprehensive Digital Diagnostic (All 100 Problems)

**Purpose**: Establish accurate baseline for each problem individually

**Structure**:
```
Initial Addition Diagnostic
├─ Total Problems: 100 (all addition facts 0-20)
├─ Time per problem: 20 seconds (untimed feel, but tracked)
├─ Chunked: 4 sessions × 25 problems
├─ Breaks: 2-minute rest between chunks
└─ Total time: ~40 minutes

Session 1: Problems 1-25
┌──────────────────────────────────────────────┐
│ Addition Diagnostic - Part 1 of 4             │
│ Answer each problem. Take your time!         │
├──────────────────────────────────────────────┤
│                                               │
│         7 + 8 = ?                            │
│                                               │
│         [____] ←─ Type answer                │
│                                               │
│ Progress: ████████░░░░░░░░░░░░ 8/25         │
│                                               │
│ (Auto-advances after 20s or submit)          │
│ (No feedback shown during diagnostic)        │
└──────────────────────────────────────────────┘

After 25 problems:
┌──────────────────────────────────────────────┐
│ Great! Part 1 complete.                      │
│ Take a 2-minute break! 🎉                   │
│                                               │
│ [Continue to Part 2 (25 more problems)]      │
└──────────────────────────────────────────────┘
```

**Data Captured Per Problem**:
```typescript
{
  problemId: "ADD_7_8",
  num1: 7,
  num2: 8,
  correctAnswer: "15",
  studentAnswer: "13",
  isCorrect: false,
  responseTime: 8500,  // milliseconds
  
  // Initialize last5Attempts with this first attempt
  last5Attempts: [{
    date: now,
    correct: false,
    responseTime: 8500,
    source: 'initial-diagnostic'
  }],
  
  // Initial proficiency assignment
  proficiencyLevel: 'doesNotKnow',  // Because incorrect
  proficiencyCalculation: {
    correctOutOfLast5: 0,
    averageTimeOfLast5: 8500,
    last5Trend: 'stable',
    confidenceLevel: 'low'  // Only 1 attempt so far
  }
}
```

**System Processing After All 100 Problems**:
```typescript
async function processInitialDiagnostic(studentUid, operation, results) {
  // Results = array of 100 problem results
  
  const problemBanks = {
    doesNotKnow: [],
    emerging: [],
    approaching: [],
    proficient: [],
    mastered: []
  }
  
  results.forEach(result => {
    // Each result has: isCorrect, responseTime
    
    const problem = {
      problemId: result.problemId,
      num1: result.num1,
      num2: result.num2,
      operation: operation,
      correctAnswer: result.correctAnswer,
      displayText: `${result.num1} + ${result.num2} = ?`,
      category: categorize(result),
      factFamily: getFactFamily(result),
      
      // Initialize with first attempt
      last5Attempts: [{
        date: new Date(),
        correct: result.isCorrect,
        responseTime: result.responseTime,
        source: 'initial-diagnostic'
      }],
      
      proficiencyCalculation: {
        correctOutOfLast5: result.isCorrect ? 1 : 0,
        averageTimeOfLast5: result.responseTime,
        last5Trend: 'stable',
        confidenceLevel: 'low'
      },
      
      totalAttempts: 1,
      correctAttempts: result.isCorrect ? 1 : 0,
      responseTimes: [result.responseTime],
      averageResponseTime: result.responseTime,
      
      firstAttemptDate: new Date(),
      lastAttemptDate: new Date()
    }
    
    // Initial categorization based on first attempt
    if (!result.isCorrect) {
      problem.proficiencyLevel = 'doesNotKnow'
      problemBanks.doesNotKnow.push(problem)
    } else if (result.responseTime < 3000) {
      problem.proficiencyLevel = 'mastered'
      problemBanks.mastered.push(problem)
    } else if (result.responseTime < 6000) {
      problem.proficiencyLevel = 'proficient'
      problemBanks.proficient.push(problem)
    } else if (result.responseTime < 12000) {
      problem.proficiencyLevel = 'approaching'
      problemBanks.approaching.push(problem)
    } else {
      problem.proficiencyLevel = 'emerging'
      problemBanks.emerging.push(problem)
    }
  })
  
  // Create mathFluencyProgress document
  const progressDoc = {
    studentUid: studentUid,
    operation: operation,
    problemBanks: problemBanks,
    proficiencyDistribution: {
      doesNotKnow: problemBanks.doesNotKnow.length,
      emerging: problemBanks.emerging.length,
      approaching: problemBanks.approaching.length,
      proficient: problemBanks.proficient.length,
      mastered: problemBanks.mastered.length,
      total: 100
    },
    proficiencyPercentage: calculateProficiency(problemBanks),
    currentlyPracticing: true,
    unlocked: true,
    createdAt: new Date()
  }
  
  await setDoc(
    doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`),
    progressDoc
  )
  
  // Also create baseline assessment record
  const baselineAssessment = {
    studentUid: studentUid,
    assessmentType: 'initial-diagnostic',
    assessmentCategory: operation,
    assessmentName: `${operation} Initial Diagnostic`,
    totalProblemsAttempted: 100,
    totalProblemsCorrect: results.filter(r => r.isCorrect).length,
    totalProblemsIncorrect: results.filter(r => !r.isCorrect).length,
    problemResults: results,
    deliveryMethod: 'digital',
    week: 0,
    assessmentDate: new Date()
  }
  
  await addDoc(collection(db, 'mathFluencyAssessments'), baselineAssessment)
}
```

---

## 🔄 Data Update Workflows

### Workflow 1: Friday Paper Assessment Entry

```typescript
// Teacher enters Friday assessment results
async function saveFridayAssessment(data: {
  studentUid: string,
  operation: string,
  attempted: number,
  correct: number,
  incorrectProblems?: string[]  // Optional: specific problem IDs
}) {
  
  // 1. Create assessment record
  const assessment = await createMathFluencyAssessment({
    ...data,
    correctPerMinute: data.correct,  // 1-minute test
    accuracy: (data.correct / data.attempted) * 100,
    fluencyLevel: calculateFluencyLevel(data.correct),
    deliveryMethod: 'paper',
    week: getCurrentWeekNumber(studentUid, operation)
  })
  
  // 2. Update mathFluencyProgress
  const progressDoc = await getProgressDoc(studentUid, operation)
  
  // 3. Process promotions/demotions
  if (data.incorrectProblems) {
    // Detailed entry - update specific problems
    for (const problemId of data.incorrectProblems) {
      await demoteProblem(progressDoc, problemId)
    }
  }
  
  // 4. Update proficiency distribution
  await recalculateProficiencyDistribution(progressDoc)
  
  // 5. Calculate growth from last week
  const lastWeek = await getLastWeekAssessment(studentUid, operation)
  if (lastWeek) {
    assessment.growthFromLastWeek = {
      cpmChange: assessment.correctPerMinute - lastWeek.correctPerMinute,
      accuracyChange: assessment.accuracy - lastWeek.accuracy,
      proficiencyLevelChange: `${lastWeek.fluencyLevel} → ${assessment.fluencyLevel}`
    }
  }
  
  // 6. Update unlock status
  if (progressDoc.proficiencyPercentage >= 95) {
    progressDoc.canUnlockNext = true
    await unlockNextOperation(studentUid, getNextOperation(operation))
  }
  
  return assessment
}
```

### Workflow 2: Daily Practice Session Completion

```typescript
// Student completes daily practice
async function completeDailyPractice(session: MathFluencyPracticeSession) {
  
  // 1. Save session record
  await createPracticeSession(session)
  
  // 2. Update mathFluencyProgress for each problem
  const progressDoc = await getProgressDoc(session.studentUid, session.operation)
  
  for (const [problemId, result] of Object.entries(session.round2_practice.results)) {
    const problem = findProblemInBanks(progressDoc, problemId)
    
    if (result.correct) {
      // Increment consecutive days
      problem.consecutiveCorrectDays++
      problem.dailyResults.push({
        date: formatDate(session.sessionDate),
        correct: true,
        responseTime: result.responseTimes[result.responseTimes.length - 1],
        round: 'practice'
      })
      
      // Check for promotion
      if (shouldPromote(problem)) {
        await promoteProblem(progressDoc, problem)
      }
    } else {
      // Reset consecutive days
      problem.consecutiveCorrectDays = 0
      problem.dailyResults.push({
        date: formatDate(session.sessionDate),
        correct: false,
        responseTime: result.responseTimes[result.responseTimes.length - 1],
        round: 'practice'
      })
    }
    
    // Update response times
    problem.responseTimes.push(...result.responseTimes)
    problem.responseTimes = problem.responseTimes.slice(-10)  // Keep last 10
    problem.averageResponseTime = calculateAverage(problem.responseTimes)
  }
  
  // 3. Update streak tracking
  progressDoc.lastPracticeDate = session.sessionDate
  progressDoc.totalPracticeDays++
  
  const yesterday = new Date(session.sessionDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const practiceYesterday = progressDoc.practiceDatesLog.some(d => 
    isSameDay(d, yesterday)
  )
  
  if (practiceYesterday || progressDoc.totalPracticeDays === 1) {
    progressDoc.consecutivePracticeDays++
  } else {
    progressDoc.consecutivePracticeDays = 1  // Streak broken
  }
  
  progressDoc.practiceDatesLog.push(session.sessionDate)
  
  // 4. Recalculate proficiency distribution
  await recalculateProficiencyDistribution(progressDoc)
  
  // 5. Save updated progress
  await updateProgressDoc(progressDoc)
}
```

---

## 🎨 Reporting Components (UI Views)

### Component 1: `MathFluencyDashboard.vue` (Teacher)

**Route**: `/fluency/dashboard`

**Sections**:
1. **Class Overview Card**
   - Today's practice completion
   - Current operation focus
   - Class average proficiency
   - Students needing attention

2. **Student List with Quick Stats**
   - Name, proficiency %, CPM, days practiced
   - Color-coded by status
   - Click to drill down

3. **Weekly Assessment Tracker**
   - Who completed Friday assessment
   - Pending score entries
   - Quick entry button

4. **Action Buttons**
   - Generate Friday assessments (print)
   - Enter Friday scores
   - Assign/manage practice
   - View class trends

**Data Queries**:
```typescript
// Get all students' current progress for this class
const classProgress = await getDocs(
  query(
    collection(db, 'mathFluencyProgress'),
    where('studentUid', 'in', classStudentUids)
  )
)

// Get this week's practice sessions
const thisWeekSessions = await getDocs(
  query(
    collection(db, 'mathFluencyPracticeSessions'),
    where('studentUid', 'in', classStudentUids),
    where('sessionDate', '>=', startOfWeek),
    where('sessionDate', '<=', endOfWeek)
  )
)

// Get latest assessments
const recentAssessments = await getDocs(
  query(
    collection(db, 'mathFluencyAssessments'),
    where('studentUid', 'in', classStudentUids),
    orderBy('assessmentDate', 'desc'),
    limit(classStudentUids.length)
  )
)
```

---

### Component 2: `MathFluencyStudentDetail.vue` (Teacher)

**Route**: `/fluency/student/:studentUid`

**Sections**:
1. **Progress Overview**
   - Proficiency distribution (pie chart or bar chart)
   - Unlock progress bar
   - Current operation and week number

2. **Timeline View**
   - Weekly fluency check results (line graph)
   - Practice completion calendar (heat map)
   - Promotions/demotions timeline

3. **Problem-Level Detail**
   - Expandable sections for each proficiency level
   - List of specific problems with stats
   - Filter by fact family/category

4. **Recommendations Panel**
   - System-generated focus areas
   - Teacher notes section
   - Intervention suggestions

**Data Queries**:
```typescript
// Get student's progress
const progress = await getDoc(
  doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
)

// Get all assessments for this student/operation
const assessments = await getDocs(
  query(
    collection(db, 'mathFluencyAssessments'),
    where('studentUid', '==', studentUid),
    where('operation', '==', operation),
    orderBy('assessmentDate', 'asc')
  )
)

// Get practice sessions for last 30 days
const sessions = await getDocs(
  query(
    collection(db, 'mathFluencyPracticeSessions'),
    where('studentUid', '==', studentUid),
    where('operation', '==', operation),
    where('sessionDate', '>=', thirtyDaysAgo),
    orderBy('sessionDate', 'desc')
  )
)
```

---

### Component 3: `MathFluencyStudentView.vue` (Student)

**Route**: `/fluency/my-progress`

**Sections**:
1. **Hero Section**
   - Current operation with visual
   - Total stars/facts mastered
   - Unlock progress bar
   - Practice streak counter

2. **This Week Card**
   - Checkmarks for completed days
   - Facts learned/promoted this week
   - Friday assessment result (if available)

3. **Facts Explorer** (Optional)
   - See which facts are in each category
   - "Try me!" button to practice a specific fact
   - Visual badges for mastered facts

4. **Start Practice Button**
   - Prominent call-to-action
   - Shows estimated time (10-12 min)
   - Disabled if already practiced today

**Data Queries**:
```typescript
// Get current progress
const myProgress = await getDoc(
  doc(db, 'mathFluencyProgress', `${currentUser.uid}_${currentOperation}`)
)

// Get this week's sessions
const thisWeekSessions = await getDocs(
  query(
    collection(db, 'mathFluencyPracticeSessions'),
    where('studentUid', '==', currentUser.uid),
    where('sessionDate', '>=', startOfWeek)
  )
)

// Get latest assessment
const latestAssessment = await getDocs(
  query(
    collection(db, 'mathFluencyAssessments'),
    where('studentUid', '==', currentUser.uid),
    where('operation', '==', currentOperation),
    orderBy('assessmentDate', 'desc'),
    limit(1)
  )
)
```

---

### Component 4: `MathFluencyIEPReport.vue` (Teacher/Admin)

**Route**: `/fluency/iep-report/:studentUid`

**Purpose**: Generate formal IEP documentation

**Sections**:
1. **Header** - Student info, date range, IEP goal
2. **Baseline Data** - Initial assessment results
3. **Current Status** - Latest proficiency distribution
4. **Progress Summary** - Growth metrics with graphs
5. **Skill Area Analysis** - Strengths and weaknesses
6. **Progress Toward Goal** - % complete, timeline
7. **Recommendations** - Next steps, interventions
8. **Signature Lines** - Teacher, parent, date

**Export Options**:
- Print to PDF
- Export to CSV (data only)
- Copy formatted text for IEP system

**Data Queries**: Same as Student Detail + historical aggregation

---

## 🔍 Critical Reporting Views

### View 1: Problem-Level Progress Table

**Purpose**: See every fact's status for a student

**Display**:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Almeida, Rose - Addition Facts Detail                                │
├──────────────────────────────────────────────────────────────────────┤
│ Problem  Category    Level        Days  Avg Time  Last Attempt      │
├──────────────────────────────────────────────────────────────────────┤
│ 5 + 5    Doubles     Mastered ✅  14    1.2s      Nov 16 (correct)  │
│ 6 + 6    Doubles     Mastered ✅  14    1.1s      Nov 16 (correct)  │
│ 7 + 7    Doubles     Mastered ✅  12    1.3s      Nov 16 (correct)  │
│ 7 + 8    Sums 11-15  Emerging 🟡   2    6.2s      Nov 16 (correct)  │
│ 8 + 7    Sums 11-15  Emerging 🟡   2    5.8s      Nov 16 (correct)  │
│ 9 + 6    Sums 11-15  Unknown 🔴    0    --        Nov 14 (incorrect)│
│ 7 + 3    Make 10     Unknown 🔴    0    --        Nov 15 (incorrect)│
│ ... (100 total problems)                                             │
├──────────────────────────────────────────────────────────────────────┤
│ Filters: [All] [Unknown Only] [Needs Practice] [By Category]        │
│ Sort By: [Proficiency] [Last Attempt] [Avg Time] [Consecutive Days] │
└──────────────────────────────────────────────────────────────────────┘
```

**Data Source**: `mathFluencyProgress.problemBanks` (all 5 arrays combined)

---

### View 2: Weekly Fluency Trend Graph

**Purpose**: Visual growth over time

**Display**:
```
Fluency Rate Trend - Addition Facts
Correct Per Minute (CPM)

40 ╭─────────────────────────────────────────────
   │                                    ⭐ Goal (40 CPM)
35 │                               ╭────
   │                          ╭────┤
30 │                     ╭────┤    │
   │                ╭────┤    │    │
25 │           ╭────┤    │    │    │
   │      ╭────┤    │    │    │    │
20 │ ╭────┤    │    │    │    │    │
   │─┤────┼────┼────┼────┼────┼────┼────┼─────
15 │ │    │    │    │    │    │    │    │
   ╰─┴────┴────┴────┴────┴────┴────┴────┴─────
   W1   W2   W3   W4   W5   W6   W7   W8

   Baseline: 16 CPM (Emerging)
   Current:  28 CPM (Developing) - +12 in 3 weeks
   Goal:     40 CPM (Mastered) - Est. 4-5 weeks
   
Color Key:
🔴 Needs Support (<10)  🟡 Emerging (10-19)  🟢 Developing (20-29)
🔵 Proficient (30-39)   🏆 Mastered (40+)
```

**Data Source**: `mathFluencyAssessments.correctPerMinute` (time series)

---

### View 3: Proficiency Distribution Over Time

**Purpose**: Show how facts move between buckets

**Display**:
```
Fact Distribution - Addition (100 total facts)

Week 1 (Baseline):
Unknown    ████████████████████████████████████░ (37 facts)
Emerging   ████████████████████████░░░░░░░░░░░░ (28 facts)
Proficient ███████████████░░░░░░░░░░░░░░░░░░░░░ (23 facts)
Mastered   ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (12 facts)

Week 2:
Unknown    ████████████████████░░░░░░░░░░░░░░░░ (25 facts) ↓12
Emerging   ████████████████████████░░░░░░░░░░░░ (30 facts) ↑2
Proficient ████████████████████░░░░░░░░░░░░░░░░ (25 facts) ↑2
Mastered   ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░ (20 facts) ↑8

Week 3:
Unknown    ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (12 facts) ↓13
Emerging   ███████████░░░░░░░░░░░░░░░░░░░░░░░░░ (15 facts) ↓15
Approaching ██████████████░░░░░░░░░░░░░░░░░░░░░ (18 facts) NEW
Proficient ████████████████████░░░░░░░░░░░░░░░░ (28 facts) ↑3
Mastered   ████████████████░░░░░░░░░░░░░░░░░░░░ (27 facts) ↑7

Trend: ✅ Moving toward proficiency
       ✅ 73% proficient or higher
       ✅ On track for 95% by Week 6
```

**Data Source**: `mathFluencyProgress.proficiencyDistribution` (historical snapshots)

---

## 📋 Data Collection: Specific Scenarios

### Scenario 1: Initial Comprehensive Diagnostic (Week 1)

**Purpose**: Test ALL 100 problems to establish accurate baseline proficiency levels

**Diagnostic Structure**:
- **All 100 addition facts** (or all problems for the operation)
- **20 seconds per problem** (no rushing - we want accuracy, not speed)
- **Chunked into 4 sessions of 25 problems each** (student gets breaks)
- **Administered digitally** to capture exact timing data

**Administration Flow**:
```
Session 1: Problems 1-25 (8 minutes total)
├─ Student sees: "You have 20 seconds per problem"
├─ Problem appears: "7 + 8 = ?"
├─ Student types answer
├─ Auto-advances after submit OR after 20 seconds
├─ No feedback during diagnostic (just moves to next)
└─ After 25 problems: "Take a 2-minute break!"

Session 2: Problems 26-50 (8 minutes + 2 min break)
Session 3: Problems 51-75 (8 minutes + 2 min break)
Session 4: Problems 76-100 (8 minutes)

Total Time: ~40 minutes (can be split across multiple days if needed)
```

**System Processing After Diagnostic**:
```typescript
async function processInitialDiagnostic(results) {
  // For each problem, we have:
  // - correct/incorrect
  // - response time
  
  const problemBanks = {
    doesNotKnow: [],
    emerging: [],
    approaching: [],
    proficient: [],
    mastered: []
  }
  
  results.forEach(result => {
    const problem = {
      ...result.problem,
      last5Attempts: [{
        date: new Date(),
        correct: result.isCorrect,
        responseTime: result.timeSpent,
        source: 'digital-assessment'
      }],
      correctOutOfLast5: result.isCorrect ? 1 : 0,
      averageTimeOfLast5: result.timeSpent
    }
    
    // Categorize based on correctness AND speed
    if (!result.isCorrect) {
      problemBanks.doesNotKnow.push(problem)
    } else if (result.timeSpent < 3000) {  // <3 seconds
      problemBanks.mastered.push(problem)
    } else if (result.timeSpent < 6000) {  // 3-6 seconds
      problemBanks.proficient.push(problem)
    } else if (result.timeSpent < 12000) {  // 6-12 seconds
      problemBanks.approaching.push(problem)
    } else {  // >12 seconds
      problemBanks.emerging.push(problem)
    }
  })
  
  // Create initial mathFluencyProgress document
  await createProgressDocument(student, operation, problemBanks)
}
```

**Data Entry Interface** (for paper assessments later):
```
Weekly Fluency Check - Score Entry (App-Based)
─────────────────────────────────────────────────────

Assessment ID: [Auto-generated: FLU_ADD_W3_20251117]
Assessment Name: [Week 3 Addition Fluency Check]
Category: [Addition ▼]  (dropdown: Addition, Subtraction, Multiplication, Division, Mixed)

┌─ Manual Entry ────────────────────────────────────┐
│                                                     │
│ Student: Almeida, Rose                             │
│                                                     │
│ OVERALL RESULTS:                                    │
│ Total Attempted: [32]  (problems student reached)  │
│ Total Correct:   [28]                              │
│ Total Incorrect: [4]   (auto-calculated)           │
│                                                     │
│ Fluency Metrics:                                    │
│ Problems/Minute: 28 CPM  (auto-calculated)         │
│ Accuracy: 87.5%          (auto-calculated)         │
│ Level: Developing        (auto-assigned)           │
│                                                     │
├─ SPECIFIC PROBLEMS INCORRECT (Optional) ───────────┤
│                                                     │
│ Click to select which problems were wrong:         │
│ [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]          │
│ [11][12][13][14][15][16][17][18][19][20]          │
│ [21][22][23][24][25][26][27][28][29][30]          │
│ [31][32][33][34][35][36][37][38][39][40]          │
│                                                     │
│ Selected (4): [3][7][12][15] ✓                     │
│                                                     │
│ For each selected, system shows:                   │
│ ┌───────────────────────────────────────────┐     │
│ │ Problem #3: 7 + 8 = ?                     │     │
│ │ Student's answer: [13] (or leave blank)   │     │
│ │ Correct answer: 15                         │     │
│ │                                            │     │
│ │ History (last 5 attempts):                 │     │
│ │ 1. Nov 14: ✗ (15s) - Digital practice     │     │
│ │ 2. Nov 15: ✓ (8s)  - Digital practice     │     │
│ │ 3. Nov 16: ✓ (7s)  - Digital practice     │     │
│ │ 4. Nov 17: ✗ (N/A) - Paper assessment     │     │
│ │ Last 5: 2/4 correct = EMERGING level      │     │
│ └───────────────────────────────────────────┘     │
│                                                     │
│ System Actions:                                     │
│ ✓ Add this attempt to problem history              │
│ ✓ Recalculate proficiency (now 2/5 = EMERGING)    │
│ ✓ Reset consecutive correct days to 0              │
│ ✓ Move to "emerging" bucket if was higher          │
│                                                     │
│ [Save & Next Problem] [Skip Detailed Entry]        │
└─────────────────────────────────────────────────────┘

[Save Assessment] [Cancel]
```

**System Processing After Entry**:
```typescript
// Quick Entry Mode
async function processQuickDiagnostic(student, attempted, correct, operation) {
  // 1. Calculate accuracy
  const accuracy = (correct / attempted) * 100
  
  // 2. Estimate proficiency distribution (proportional allocation)
  const estimated = {
    mastered: Math.floor(correct * 0.3),      // Top 30% of correct → mastered
    proficient: Math.floor(correct * 0.4),    // Next 40% → proficient
    emerging: Math.floor(correct * 0.3),      // Bottom 30% → emerging
    doesNotKnow: attempted - correct          // All incorrect → unknown
  }
  
  // 3. Generate all 100 possible problems for this operation
  const allProblems = generateAllProblems(operation)  // e.g., all addition 0-20 combos
  
  // 4. Randomly assign to buckets based on estimated distribution
  // (Later refined by actual practice performance)
  const problemBanks = distributeProblemsProportionally(allProblems, estimated)
  
  // 5. Create mathFluencyProgress document
  await createProgressDocument(student, operation, problemBanks)
  
  // 6. Create baseline mathFluencyAssessment
  await createAssessment({
    type: 'baseline-diagnostic',
    deliveryMethod: 'paper',
    correctPerMinute: correct,  // Assumes 1-minute test
    week: 0
  })
}

// Detailed Entry Mode
async function processDetailedDiagnostic(student, problems, operation) {
  // 1. Generate all possible problems
  const allProblems = generateAllProblems(operation)
  
  // 2. Mark specific problems as correct/incorrect
  const problemBanks = {
    doesNotKnow: [],
    emerging: [],
    proficient: [],
    mastered: []
  }
  
  allProblems.forEach(problem => {
    const result = problems.find(p => p.id === problem.id)
    
    if (!result || !result.attempted) {
      // Not attempted - assume unknown
      problemBanks.doesNotKnow.push(problem)
    } else if (!result.correct) {
      // Attempted but incorrect - definitely unknown
      problemBanks.doesNotKnow.push(problem)
    } else {
      // Correct - estimate level based on position on sheet
      // Earlier problems = likely faster = higher proficiency
      if (result.problemNumber <= 15) {
        problemBanks.mastered.push(problem)  // Fast, correct
      } else if (result.problemNumber <= 30) {
        problemBanks.proficient.push(problem)  // Moderate speed
      } else {
        problemBanks.emerging.push(problem)  // Slower, but correct
      }
    }
  })
  
  // 3. Create progress document with detailed problem assignment
  await createProgressDocument(student, operation, problemBanks)
}
```

---

### Scenario 2: Friday Paper Assessment Entry

**Teacher Actions:**
1. Click "Generate Friday Assessments" button
2. System generates PDFs (one per student, personalized)
3. Print and distribute
4. Administer (1 minute, whole class)
5. Collect and score
6. Enter scores via interface

**Data Entry Interface**:
```
Friday Fluency Check - Score Entry
Week 3, Addition Facts - November 17, 2025
─────────────────────────────────────────────────────

Entry Mode: ○ Quick (Total only)  ● Detailed (Mark errors)

┌─ Detailed Entry ──────────────────────────────────┐
│                                                     │
│ Student: Almeida, Rose                             │
│                                                     │
│ Last problem attempted: #32                        │
│ (Student got to problem 32 before time ran out)    │
│                                                     │
│ Mark INCORRECT problems (tap numbers):             │
│ ┌─────────────────────────────────────────────┐   │
│ │ [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]   │   │
│ │ [11][12][13][14][15][16][17][18][19][20]   │   │
│ │ [21][22][23][24][25][26][27][28][29][30]   │   │
│ │ [31][32][33][34][35][36][37][38][39][40]   │   │
│ │                                              │   │
│ │ Selected: [3][7][12][15]  (4 errors)        │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Auto-calculated:                                    │
│ Attempted: 32                                      │
│ Correct:   28  (32 - 4 errors)                     │
│ Accuracy:  87.5%                                   │
│ CPM:       28                                       │
│ Level:     Developing ↑ (was Emerging last week)   │
│                                                     │
│ Errors by Category:                                 │
│ - Make 10: 2 errors (problems #3, #7)             │
│ - Sums 11-15: 2 errors (problems #12, #15)        │
│                                                     │
│ System will:                                        │
│ ✓ Return these 4 facts to "Emerging" level        │
│ ✓ Reset consecutive day counters                   │
│ ✓ Prioritize in Monday practice                    │
│                                                     │
│ Teacher Notes (optional):                           │
│ [Showed improvement on doubles. Still hesitates on │
│  Make 10 strategy problems. Will provide ten-frame │
│  visual support next week.]                        │
│                                                     │
│ [Save & Next Student]  [Save & Done]               │
└─────────────────────────────────────────────────────┘
```

**System Processing**:
```typescript
async function processFridayAssessment(entry) {
  // 1. Create assessment record
  const assessment = {
    studentUid: entry.studentUid,
    operation: entry.operation,
    week: entry.week,
    assessmentDate: new Date(),
    deliveryMethod: 'paper',
    
    totalProblemsAttempted: entry.attempted,
    totalProblemsCorrect: entry.correct,
    totalProblemsOnSheet: 60,
    accuracy: (entry.correct / entry.attempted) * 100,
    correctPerMinute: entry.correct,  // 1-minute test
    
    fluencyLevel: calculateFluencyLevel(entry.correct),
    
    // If detailed entry, include problem-level data
    problemResults: entry.incorrectProblems ? 
      mapProblemsToResults(entry) : null,
      
    entryMethod: entry.incorrectProblems ? 'detailed' : 'quick',
    notes: entry.teacherNotes
  }
  
  // 2. Get last week's assessment for comparison
  const lastWeek = await getLastWeekAssessment(entry.studentUid, entry.operation)
  if (lastWeek) {
    assessment.growthFromLastWeek = {
      cpmChange: assessment.correctPerMinute - lastWeek.correctPerMinute,
      accuracyChange: assessment.accuracy - lastWeek.accuracy,
      proficiencyLevelChange: `${lastWeek.fluencyLevel} → ${assessment.fluencyLevel}`
    }
  }
  
  // 3. Update mathFluencyProgress
  const progress = await getProgressDoc(entry.studentUid, entry.operation)
  
  let promotions = { emergingToProficient: 0, proficientToMastered: 0, totalPromoted: 0 }
  let demotions = { proficientToEmerging: 0, masteredToProficient: 0, totalDemoted: 0 }
  
  if (entry.incorrectProblems) {
    // Detailed mode - demote specific problems
    for (const problemId of entry.incorrectProblems) {
      const result = await demoteProblem(progress, problemId)
      if (result.demoted) {
        demotions[`${result.from}To${result.to}`]++
        demotions.totalDemoted++
      }
    }
    
    // Check all emerging/approaching problems for promotion
    // If they were correct (not in incorrect list) and meet day criteria
    for (const problem of [...progress.problemBanks.emerging, ...progress.problemBanks.approaching]) {
      if (!entry.incorrectProblems.includes(problem.problemId)) {
        // Was correct this week
        const shouldPromote = checkPromotionCriteria(problem)
        if (shouldPromote) {
          const result = await promoteProblem(progress, problem.problemId)
          promotions[`${result.from}To${result.to}`]++
          promotions.totalPromoted++
        }
      }
    }
  }
  
  assessment.promotions = promotions
  assessment.demotions = demotions
  
  // 4. Identify weak fact families
  const weakFamilies = identifyWeakFactFamilies(progress, entry.incorrectProblems)
  assessment.weakFactFamilies = weakFamilies
  
  // 5. Save assessment
  await createMathFluencyAssessment(assessment)
  
  // 6. Update progress document
  progress.lastAssessmentDate = assessment.assessmentDate
  progress.lastAssessmentScore = assessment.correctPerMinute
  progress.assessmentHistory.push({
    date: assessment.assessmentDate,
    correctPerMinute: assessment.correctPerMinute,
    accuracy: assessment.accuracy,
    totalAttempted: entry.attempted,
    totalCorrect: entry.correct
  })
  await updateProgressDoc(progress)
  
  return assessment
}
```

---

## 🎨 Report Templates

### Template 1: Weekly Progress Summary (In-App Dashboard Banner)

**Trigger**: Every Friday after assessments are entered

**Display Location**: Top of teacher fluency dashboard

**Content**:
```
┌────────────────────────────────────────────────────────────┐
│ 📊 Week 3 Fluency Results - Addition (Period 4)            │
├────────────────────────────────────────────────────────────┤
│ ✅ Assessments Scored: 24/28 students                      │
│ 📈 Class Average: 28 CPM (↑6 from last week)              │
│ ⭐ Ready for Next Operation: 6 students                    │
│                                                             │
│ 🏆 Top Performers:                                         │
│    Chatfield, Lexee - 42 CPM  |  Reese, Carter - 38 CPM   │
│                                                             │
│ ⚠️  Needs Support:                                         │
│    Grijalva, Jesus - 12 CPM  |  Mobley, Jayden - 14 CPM   │
│                                                             │
│ 🎯 Class Weak Areas:                                       │
│    Make 10 (58% avg)  |  Sums 11-15 (62% avg)             │
│                                                             │
│ [View Detailed Report] [Print Class Summary] [Dismiss]     │
└────────────────────────────────────────────────────────────┘
```

**Data Source**: Aggregated from this week's `mathFluencyAssessments`

---

### Template 2: Student Progress Certificate (Motivational)

**Trigger**: When student reaches 95% proficiency in an operation

**Content**:
```
╔═══════════════════════════════════════════════════╗
║                                                    ║
║           🏆 MATH FACTS MASTERY 🏆               ║
║                                                    ║
║              Certificate of Achievement            ║
║                                                    ║
╠═══════════════════════════════════════════════════╣
║                                                    ║
║                 Almeida, Rose                      ║
║                                                    ║
║              has successfully mastered             ║
║                                                    ║
║              ADDITION FACTS (0-20)                ║
║                                                    ║
║              with 95% proficiency!                 ║
║                                                    ║
╠═══════════════════════════════════════════════════╣
║                                                    ║
║  Facts Mastered: 52/100                           ║
║  Facts Proficient: 43/100                         ║
║  Fluency Rate: 42 correct per minute              ║
║  Practice Days: 28 consecutive days               ║
║                                                    ║
║  Next Challenge: SUBTRACTION FACTS                ║
║  Status: UNLOCKED! 🔓                             ║
║                                                    ║
╠═══════════════════════════════════════════════════╣
║                                                    ║
║  Teacher: Mr. Davis      Date: December 1, 2025   ║
║                                                    ║
╚═══════════════════════════════════════════════════╝
```

---

## 🔐 Firestore Security Rules

### Required Rules for New Collections:

```javascript
// Math Fluency Progress - ongoing progress tracking
match /mathFluencyProgress/{progressId} {
  allow read: if request.auth != null && (
    // Students can read their own progress
    resource.data.studentUid == request.auth.uid ||
    // Teachers can read their students' progress
    isTeacherOf(resource.data.studentUid) ||
    // Admins can read all
    isAdmin()
  );
  
  allow write: if request.auth != null && (
    // System/teacher can write during practice/assessment
    isTeacherOf(request.resource.data.studentUid) ||
    isAdmin() ||
    // Student can update during practice (via system)
    request.resource.data.studentUid == request.auth.uid
  );
}

// Math Fluency Assessments - weekly fluency checks
match /mathFluencyAssessments/{assessmentId} {
  allow read: if request.auth != null && (
    resource.data.studentUid == request.auth.uid ||
    isTeacherOf(resource.data.studentUid) ||
    isAdmin()
  );
  
  allow create: if request.auth != null && (
    isTeacher() || isAdmin()
  );
  
  allow update, delete: if request.auth != null && (
    resource.data.teacherUid == request.auth.uid ||
    isAdmin()
  );
}

// Math Fluency Practice Sessions - daily practice logs
match /mathFluencyPracticeSessions/{sessionId} {
  allow read: if request.auth != null && (
    resource.data.studentUid == request.auth.uid ||
    isTeacherOf(resource.data.studentUid) ||
    isAdmin()
  );
  
  allow create: if request.auth != null && (
    request.resource.data.studentUid == request.auth.uid ||
    isTeacher() ||
    isAdmin()
  );
  
  allow update: if request.auth != null && (
    resource.data.studentUid == request.auth.uid ||
    isAdmin()
  );
}
```

---

## 📊 Analytics & Aggregations

### Query Examples for Common Reports

**1. Class Proficiency Overview:**
```typescript
// Get all students' current progress for a class
async function getClassFluencyOverview(classStudentUids: string[], operation: string) {
  const progressDocs = await Promise.all(
    classStudentUids.map(uid => 
      getDoc(doc(db, 'mathFluencyProgress', `${uid}_${operation}`))
    )
  )
  
  const classData = progressDocs
    .filter(doc => doc.exists())
    .map(doc => ({
      studentUid: doc.data().studentUid,
      studentName: doc.data().studentName,
      proficiency: doc.data().proficiencyPercentage,
      mastery: doc.data().masteryPercentage,
      canUnlock: doc.data().canUnlockNext,
      lastPractice: doc.data().lastPracticeDate,
      streak: doc.data().consecutivePracticeDays
    }))
  
  return {
    students: classData,
    classAverage: average(classData.map(s => s.proficiency)),
    readyToUnlock: classData.filter(s => s.canUnlock).length,
    needsIntervention: classData.filter(s => s.proficiency < 50).length,
    highPerformers: classData.filter(s => s.proficiency >= 80).length
  }
}
```

**2. Student Growth Over Time:**
```typescript
// Get student's fluency growth across all weeks
async function getStudentGrowthTrend(studentUid: string, operation: string) {
  const assessments = await getDocs(
    query(
      collection(db, 'mathFluencyAssessments'),
      where('studentUid', '==', studentUid),
      where('operation', '==', operation),
      orderBy('assessmentDate', 'asc')
    )
  )
  
  return assessments.docs.map(doc => ({
    week: doc.data().week,
    date: doc.data().assessmentDate,
    cpm: doc.data().correctPerMinute,
    accuracy: doc.data().accuracy,
    level: doc.data().fluencyLevel
  }))
}
```

**3. Fact Family Performance:**
```typescript
// Get accuracy by fact family for intervention planning
async function getFactFamilyBreakdown(studentUid: string, operation: string) {
  const progress = await getDoc(
    doc(db, 'mathFluencyProgress', `${studentUid}_${operation}`)
  )
  
  const allProblems = [
    ...progress.data().problemBanks.doesNotKnow,
    ...progress.data().problemBanks.emerging,
    ...progress.data().problemBanks.approaching,
    ...progress.data().problemBanks.proficient,
    ...progress.data().problemBanks.mastered
  ]
  
  // Group by fact family
  const families = groupBy(allProblems, 'factFamily')
  
  return Object.entries(families).map(([family, problems]) => ({
    factFamily: family,
    totalProblems: problems.length,
    mastered: problems.filter(p => p.proficiencyLevel === 'mastered').length,
    proficient: problems.filter(p => p.proficiencyLevel === 'proficient').length,
    accuracy: (problems.filter(p => p.correctAttempts > 0).length / problems.length) * 100,
    avgResponseTime: average(problems.map(p => p.averageResponseTime)),
    needsWork: problems.filter(p => 
      p.proficiencyLevel === 'doesNotKnow' || p.proficiencyLevel === 'emerging'
    )
  }))
  .sort((a, b) => a.accuracy - b.accuracy)  // Worst first
}
```

---

## ✅ Confirmed Design Decisions

Based on requirements, here are the confirmed specifications:

### **1. Error Tracking** ✓ CONFIRMED
- **Manually input in app** after paper assessment
- **Required fields**: Assessment ID, Assessment Name, Category (operation type), Amount Correct, Amount Incorrect, Problems per Minute
- **Optional but recommended**: Specific problems incorrect
- **Per-problem tracking**: Each problem has object tracking history
- **Last 5 attempts** determine proficiency level (not overall average)
- **Rationale**: Last 5 gives recent performance snapshot, ignores early learning struggles

### **2. Initial Distribution** ✓ CONFIRMED
- **Comprehensive diagnostic** tests ALL 100 problems for operation
- **20 seconds per problem** (no rushing)
- **Chunked into 4 sessions of 25 problems** each (student gets breaks)
- **Digital administration** to capture exact timing
- **Total time**: ~40 minutes (can split across multiple days)
- **Categorization**: Based on correctness + response time from this diagnostic
- **Rationale**: Accurate baseline crucial for effective practice targeting

### **3. Proficiency Level Names** ✓ CONFIRMED
Using: **Does Not Know → Emerging → Approaching → Proficient → Mastered**
- Clear progression path
- IEP-friendly terminology
- Aligns with educational standards

### **4. Response Time Storage** ✓ CONFIRMED
- **Last 10 response times** per problem
- **Stored in array**: `problem.responseTimes[]`
- **Auto-calculated**: Average from last 10
- **Rationale**: Sufficient for trend analysis without excessive storage

### **5. Practice Assignment** ✓ CONFIRMED
- **Auto-assigned** to all students by default
- **Teacher override**: Can pause/resume for individual students
- **Both manual and automatic** control available
- **Rationale**: Ensures consistency while allowing flexibility

### **6. Mixed Operation Practice** ✓ CONFIRMED
- **80% current operation** / **20% maintenance** of previous operations
- Example: If student at 95% addition, 40% subtraction:
  - 80% of practice = subtraction problems
  - 20% of practice = addition problems (maintain mastery)
- **Rationale**: Research-backed spacing prevents forgetting

### **7. Reporting** ✓ CONFIRMED
- **In-app only** (no email digests)
- **Teacher dashboard** for daily monitoring
- **Student view** for personal progress
- **Exportable** IEP reports (PDF)
- **Rationale**: Reduces email fatigue, centralizes data in app

---

## 🚀 Implementation Checklist

When ready to build, here's the priority order:

### Phase 1: Data Foundation (Week 1-2)
- [ ] Create Firestore collections (`mathFluencyProgress`, `mathFluencyAssessments`, `mathFluencyPracticeSessions`)
- [ ] Define TypeScript interfaces with `last5Attempts` tracking per problem
- [ ] Write security rules
- [ ] Build comprehensive initial diagnostic (100 problems, 20s each, chunked in 25s)
- [ ] Build problem proficiency calculator (uses last 5 attempts, not overall average)

### Phase 2: Paper Assessment System (Week 2-3)
- [ ] Paper assessment generator (PDF export for 1-minute probes)
- [ ] Manual score entry interface in app with:
  - [ ] Assessment ID field (teacher enters or auto-generated)
  - [ ] Assessment Name field
  - [ ] Category dropdown (operation type or mixed)
  - [ ] Amount Correct field
  - [ ] Amount Incorrect field
  - [ ] Problems per Minute (auto-calculated)
  - [ ] Optional: Specific problems incorrect (grid selector)
- [ ] Per-problem history tracking (last 5 attempts)
- [ ] Proficiency recalculation based on last 5 attempts

### Phase 3: Daily Practice Core (Week 3-6)
- [ ] Round 1: Learning interface (encoding + recall)
- [ ] Round 2: Practice interface (80% current operation / 20% maintenance)
- [ ] Round 3: Quick assessment interface
- [ ] Session completion tracking
- [ ] Problem bank updates (promotions/demotions based on last 5 attempts)
- [ ] Auto-assignment system (daily practice auto-assigned)
- [ ] Teacher override controls (pause/resume individual students)

### Phase 4: Reporting (Week 6-8)
- [ ] Teacher dashboard (class overview - in-app only, no emails)
- [ ] Student detail view (teacher) with per-problem last-5 history
- [ ] Student progress view (student-facing)
- [ ] IEP report generator (exportable PDF)
- [ ] Growth trend visualizations (CPM over weeks)
- [ ] Fact family analysis (based on last 5 attempts)

### Phase 5: Advanced Features (Week 8-12)
- [ ] Operation sequencing/unlocking (95% gate, 80/20 maintenance)
- [ ] Parent reports (in-app, printable)
- [ ] Strategy hints system (when problem incorrect 3+ times)
- [ ] Gamification elements (XP, badges, streaks)
- [ ] Bulk class operations (assign practice to all, generate all assessments)

---

## 📝 Key Implementation Notes

### Critical Design Specifications (Per User Requirements):

**✅ Assessment Data Entry (Manual in App)**
```
Required Fields:
- Assessment ID (teacher-entered or auto-generated)
- Assessment Name
- Category (operation type: addition/subtraction/mult/div/mixed)
- Amount Correct
- Amount Incorrect
- Problems per Minute (auto-calculated from correct + time)

Optional Fields:
- Specific problems incorrect (grid selector)
- Student answer for each error
- Teacher notes/observations
```

**✅ Per-Problem History Object**
```typescript
// Each problem tracks last 5 attempts (not lifetime average)
// Proficiency determined by: correct count + avg time of last 5
// Example: Problem goes 2/5 → 3/5 → 4/5 = progression visible
//          Not masked by early failures (10 wrong, then 5 right = still looks bad)
```

**✅ Initial Diagnostic**
- ALL 100 problems tested
- 20 seconds each (2000ms timeout)
- Chunked: 4 groups of 25 (with breaks)
- Total time: ~40 minutes
- Digital format to capture exact timing
- No feedback during diagnostic

**✅ Auto-Assignment + Teacher Control**
- Practice auto-assigned daily by default
- Teacher can pause/resume for individuals
- Teacher can manually assign to specific students
- Both modes supported simultaneously

**✅ 80/20 Maintenance Split**
- When multiple operations unlocked
- 80% practice = current operation
- 20% practice = review previous operations
- Prevents forgetting while advancing

**✅ In-App Reporting Only**
- No email digests
- All data in teacher dashboard
- Exportable IEP reports (PDF)
- Parent-friendly printable summaries

---

## 🚀 Ready to Build

**All requirements clarified.** The plan now includes:

1. ✅ 3 Firestore collections with complete schemas
2. ✅ Per-problem history tracking (last 5 attempts)
3. ✅ Initial comprehensive diagnostic (100 problems, chunked)
4. ✅ Manual assessment entry interface (app-based)
5. ✅ Complete reporting suite (teacher, student, IEP)
6. ✅ Auto-assignment with teacher overrides
7. ✅ 80/20 maintenance protocol
8. ✅ Proficiency calculation based on recent performance

**Next step**: Begin Phase 1 implementation (data foundation + initial diagnostic component).

**Estimated Timeline:**
- Phase 1: 2-3 weeks (foundation + initial diagnostic)
- Phase 2: 2 weeks (paper assessment + manual entry)
- Phase 3: 3-4 weeks (daily practice system)
- Phase 4: 2-3 weeks (reporting dashboards)
- Phase 5: 3-4 weeks (advanced features)
- **Total: 12-16 weeks for complete system**

**MVP (Phases 1-2): 4-5 weeks** - Can start collecting data immediately

---

**Document Complete** ✅
Saved to: `/MATH_FLUENCY_DATA_PLAN.md`

