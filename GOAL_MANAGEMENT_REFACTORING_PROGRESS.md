# GoalManagement.vue Refactoring Progress
## Following Math Fluency Pattern

**Current Status:** Composables created ✅ | Components extraction in progress

---

## ✅ Phase 1: Composables Created (Following Fluency Pattern)

### 1. `useGoalManagement.ts` ✅
- **Location:** `src/composables/useGoalManagement.ts`
- **Purpose:** Goal CRUD operations, data loading, state management
- **Exports:**
  - State: `loading`, `saving`, `goals`, `students`, `assessments`, `studentAssignments`
  - Methods: `loadData()`, `saveGoal()`, `deleteGoal()`, `markGoalAsMet()`, `archiveGoal()`, `reactivateGoal()`, `assignAssessmentToGoal()`, `removeAssessmentFromGoal()`, `createProgressAssessment()`
  - Utilities: `getStudentName()`, `getAssessmentTitle()`, `isAssessmentAssignedToStudent()`, `formatDate()`

### 2. `useGoalFilters.ts` ✅
- **Location:** `src/composables/useGoalFilters.ts`
- **Purpose:** Filtering and searching goals
- **Exports:**
  - State: `selectedStudentUid`, `selectedStatus`, `selectedSubject`, `searchQuery`
  - Computed: `filteredGoals`, `activeGoals`
  - Methods: `getSubjectArea()`, `resetFilters()`

### 3. `useAssessmentGeneration.ts` ✅
- **Location:** `src/composables/useAssessmentGeneration.ts`
- **Purpose:** AI-powered assessment generation from goals
- **Exports:**
  - State: All preview/generation state
  - Methods: `generateAssessmentsForGoal()`, `generateProofreadQuestion()`, `handleApproval()`, `updateAlternativeAnswers()`, `regenerateRemainingQuestions()`, `confirmCreateAssessments()`, etc.

**Lines Saved:** ~600 lines moved to composables

---

## 🔄 Phase 2: Component Extraction (In Progress)

Following the fluency pattern where components are extracted to subdirectories:

### Planned Structure:
```
src/components/management/
├── GoalManagement.vue (orchestrator, ~900 lines target)
├── GoalCard.vue (~200 lines)
├── GoalFilters.vue (~100 lines)
└── modals/
    ├── GoalFormModal.vue (~250 lines)
    ├── CreateAssessmentModal.vue (~100 lines)
    ├── AssessmentPreviewModal.vue (~300 lines)
    └── SingleQuestionPreviewModal.vue (~150 lines)
```

### Status:
- [ ] GoalCard component
- [ ] GoalFilters component
- [ ] GoalFormModal component
- [ ] CreateAssessmentModal component
- [ ] AssessmentPreviewModal component
- [ ] SingleQuestionPreviewModal component

---

## 📊 Progress Summary

| Phase | Status | Lines Saved | Target |
|-------|--------|-------------|--------|
| Composables | ✅ Complete | ~600 | ~600 |
| Components | 🔄 In Progress | ~0 | ~1,500 |
| **Total** | **🔄 40%** | **~600** | **~2,100** |

**Current File Size:** 3,034 lines
**Target File Size:** ~900 lines
**Remaining Work:** ~1,500 lines to extract

---

## 🎯 Next Steps

1. Extract GoalFilters component (simple, good starting point)
2. Extract GoalCard component
3. Extract modals (largest impact)
4. Refactor main GoalManagement.vue to use composables and components
5. Test all functionality
6. Verify build passes

---

## 📝 Notes

- Composables follow the same pattern as `useMathFluencyPractice.ts` and `useMathFluencyRounds.ts`
- Components will follow the pattern of `MathFluencyRound1Learning.vue`, etc.
- Main component will be a simple orchestrator like `MathFluencyDailyPractice.vue`







