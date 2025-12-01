# Systematic Math Fluency Implementation Status

## 🎯 Overview
Building a systematic math fluency system with quick placement, daily practice, and paper assessment workflow.

---

## ✅ COMPLETED Components

### 1. **Placement Diagnostic Generator** (`src/utils/placementDiagnosticGenerator.ts`)
- ✅ Stratified sampling across difficulty levels
- ✅ 25 strategic problems (vs 90-150 in full diagnostic)
- ✅ Intelligent bank estimation using similarity
- ✅ Proficiency level determination (foundational/developing/proficient/advanced)
- ✅ Weeks-to-mastery estimation

### 2. **Paper Assessment Strategies** (`src/utils/paperAssessmentStrategies.ts`)
- ✅ Optimal problem distribution by week number
- ✅ Week 1-2: Focus on learning (35% doesNotKnow, 40% emerging)
- ✅ Week 3-6: Balanced growth
- ✅ Week 7+: Maintenance focus
- ✅ CPM (Correct Per Minute) estimation and targets
- ✅ Quick entry estimation algorithm

### 3. **Placement Diagnostic Vue Component** (`src/components/diagnostics/MathFluencyPlacementDiagnostic.vue`)
- ✅ 25-problem quick test (~8-10 minutes)
- ✅ Real-time analysis and results
- ✅ Proficiency level visualization
- ✅ Category performance breakdown
- ✅ Estimated bank distribution
- ✅ Save results and initialize practice banks

### 4. **Enhanced Paper Assessment Generator** (`src/components/diagnostics/MathFluencyPaperAssessment.vue`)
- ✅ Uses intelligent distribution from paperAssessmentStrategies
- ✅ Logs distribution and metrics for each student
- ✅ **NEW**: Creates pre-filled score entry template in Firestore
- ✅ Links paper test to score template via `templateId`

### 5. **Paper Assessment Template System** (`src/services/mathFluencyServices.ts`)
- ✅ `createPaperAssessmentTemplate()` - Creates pre-filled template
- ✅ All problems marked as CORRECT by default
- ✅ Stored in `mathFluencyPaperAssessments` collection
- ✅ `getPaperAssessmentTemplate()` - Retrieve template
- ✅ `getPendingPaperAssessments()` - List pending templates
- ✅ `updatePaperAssessmentScore()` - Update with actual scores

---

## 🔄 IN PROGRESS / NEEDS COMPLETION

### 6. **Enhanced Score Entry** (`src/components/diagnostics/MathFluencyScoreEntry.vue`)
**Status**: Needs update to load templates

**Required Changes:**
```typescript
// Add to setup section:
const pendingTemplates = ref<any[]>([])
const selectedTemplateId = ref('')
const usingTemplate = ref(false)

// Add function to load pending templates
async function loadPendingTemplates() {
  const templates = await getPendingPaperAssessments(authStore.currentUser?.uid)
  pendingTemplates.value = templates
}

// Add function to load specific template
async function loadTemplate(templateId: string) {
  const template = await getPaperAssessmentTemplate(templateId)
  
  // Pre-populate form
  assessmentName.value = template.assessmentName
  assessmentCategory.value = template.operation
  weekNumber.value = template.weekNumber
  
  // Pre-select student
  selectedStudentUids.value = [template.studentUid]
  
  // Load problems (all marked correct)
  currentAssessmentProblems.value = template.problems
  
  // Pre-fill scoring
  currentEntry.value = {
    attempted: template.scoring.attempted,
    correct: template.scoring.correct,
    incorrectProblems: [],  // Teacher will mark incorrect ones
    notes: ''
  }
  
  usingTemplate.value = true
  selectedTemplateId.value = templateId
  startEntry()
}

// Modify saveEntry to update template
async function saveEntry() {
  // ... existing code ...
  
  if (usingTemplate.value && selectedTemplateId.value) {
    // Update template with actual scores
    await updatePaperAssessmentScore(
      selectedTemplateId.value,
      problemsWithScores,
      currentEntry.value.attempted,
      currentEntry.value.correct,
      authStore.currentUser?.uid
    )
  }
  
  // ... rest of existing code ...
}
```

**UI Changes Needed:**
- Add "Load Template" button at top of setup section
- Show list of pending paper assessments
- Allow teacher to click to load pre-filled data
- Teacher only needs to UNCHECK incorrect problems
- Much faster workflow!

---

### 7. **Daily Practice Enhancement** (src/components/diagnostics/MathFluencyDailyPractice.vue`)
**Status**: Needs paper assessment priority

**Required Changes:**
```typescript
// Update selectRound1Problems to prioritize recent paper failures
function selectRound1Problems(banks: ProblemBanks): Problem[] {
  const doesNotKnow = banks.doesNotKnow
  
  // NEW: Prioritize facts recently marked incorrect on paper
  const recentPaperFailures = doesNotKnow.filter(p => 
    p.last5Attempts.some(a => 
      a.source === 'paper-assessment' && 
      !a.correct &&
      isWithinDays(a.date, 7)
    )
  )
  
  if (recentPaperFailures.length >= 3) {
    return sample(recentPaperFailures, 3)
  }
  
  return sample(doesNotKnow, 3)
}
```

---

### 8. **Router & Dashboard Updates**
**Status**: Not started

**Required:**
- Add route for `/diagnostic/math-fluency-placement`
- Update TeacherDashboard with new card
- Link to placement diagnostic

---

## 📊 System Workflow (Final State)

```
┌─────────────────────────────────────────────────────────┐
│ WEEK 1: PLACEMENT                                       │
├─────────────────────────────────────────────────────────┤
│ 1. Teacher assigns Placement Diagnostic (25 problems)   │
│ 2. Student completes (~8 min)                          │
│ 3. System estimates starting banks                      │
│ 4. Ready for daily practice!                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ WEEKS 2-10: PRACTICE CYCLE                             │
├─────────────────────────────────────────────────────────┤
│ Monday-Thursday:                                        │
│   • Student does daily practice (10-12 min)            │
│   • Round 1: Learn 3 new facts                        │
│   • Round 2: Mixed practice (15 problems)              │
│   • Round 3: Quick check (10 problems)                │
│   • Banks update automatically                         │
│                                                         │
│ Friday:                                                 │
│   • Teacher generates paper assessment                  │
│   • System creates pre-filled score template           │
│   • Student takes 1-minute timed test                  │
│   • Teacher loads template in score entry              │
│   • Teacher unchecks incorrect problems only           │
│   • Submit → Banks update with paper results           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CONTINUOUS: TRACKING                                     │
├─────────────────────────────────────────────────────────┤
│ • Dashboard shows proficiency distribution              │
│ • Weekly CPM growth chart                              │
│ • Problem-level history (last 5 attempts)             │
│ • Paper assessments are source of truth for fluency    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Benefits

### **For Students:**
- ✅ Less testing fatigue (25 vs 90+ problems initially)
- ✅ Practice discovers actual proficiency organically
- ✅ Clear progression through banks
- ✅ Daily practice targets weak areas

### **For Teachers:**
- ✅ Quick placement (8 min vs 40+ min)
- ✅ **FAST scoring** - just mark incorrect (vs entering all)
- ✅ Personalized paper assessments by week
- ✅ Paper tests measure true fluency (CPM)
- ✅ System handles all bank updates

### **Systematic & Research-Based:**
- ✅ Stratified sampling (testing best practice)
- ✅ Distributed practice (spaced repetition)
- ✅ Curriculum-Based Measurement (CBM) for fluency
- ✅ Progress monitoring through weekly probes

---

## 🚀 Next Steps to Complete

1. **Update Score Entry UI** - Add template loading (~30 min)
2. **Update Daily Practice** - Add paper priority selection (~15 min)
3. **Update Router** - Add placement route (~5 min)
4. **Update Dashboard** - Add placement card (~10 min)
5. **Test & Deploy** (~20 min)

**Total Remaining:** ~90 minutes of work

---

## 📝 Notes

- Placement diagnostic uses same generator as full diagnostic, just fewer problems
- Paper templates are stored separately from final assessment records
- Score entry can work with OR without templates (backward compatible)
- Banks are the source of truth for daily practice
- Paper assessments are the source of truth for fluency measurement (CPM)

