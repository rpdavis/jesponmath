# GoalManagement.vue Refactoring Plan
## Target: Reduce from 3,034 lines to under 1,000 lines

---

## 📊 Current Structure Analysis

**Current Size:** 3,034 lines, 92 KB

**Main Sections:**
1. **Template** (~700 lines): Header, filters, goals grid, 5+ modals
2. **Script** (~1,800 lines): State management, CRUD operations, assessment generation
3. **Styles** (~500 lines): Component-specific CSS

---

## 🎯 Refactoring Strategy

### Phase 1: Extract Modal Components (~800 lines saved)

#### 1.1 Create `GoalFormModal.vue` (~250 lines)
**Extract:** Create/Edit Goal Modal (lines ~254-450)
- Form fields for goal creation/editing
- Student selector component
- Props: `goal`, `isEditing`, `@save`, `@close`
- Estimated: 250 lines

#### 1.2 Create `CreateAssessmentModal.vue` (~100 lines)
**Extract:** Create Progress Assessment Modal (lines ~738-800)
- Simple form for assessment creation
- Props: `activeGoals`, `@create`, `@close`
- Estimated: 100 lines

#### 1.3 Create `AssessmentPreviewModal.vue` (~300 lines)
**Extract:** Assessment Preview Modal (lines ~452-566)
- Preview generated assessments
- Question editing interface
- Props: `assessments`, `@approve`, `@close`, `@regenerate`
- Estimated: 300 lines

#### 1.4 Create `SingleQuestionPreviewModal.vue` (~150 lines)
**Extract:** Single Question Preview Modal (lines ~568-729)
- Proofread single question
- Props: `question`, `goal`, `@approve`, `@close`, `@regenerate`
- Estimated: 150 lines

**Total Modal Extraction: ~800 lines**

---

### Phase 2: Extract UI Components (~400 lines saved)

#### 2.1 Create `GoalCard.vue` (~200 lines)
**Extract:** Goal card display (lines ~81-250)
- Goal header, details, actions
- Assessment list display
- Props: `goal`, `students`, `assessments`, `@edit`, `@delete`, etc.
- Estimated: 200 lines

#### 2.2 Create `GoalFilters.vue` (~100 lines)
**Extract:** Filter section (lines ~19-62)
- Student, status, subject filters
- Search input
- Props: `students`, `@filter`
- Emits: `update:filters`
- Estimated: 100 lines

#### 2.3 Create `StudentSelector.vue` (~100 lines)
**Extract:** Student selection dropdown (lines ~275-343)
- Searchable student dropdown
- Selected students display
- Props: `students`, `selected`, `@update`
- Estimated: 100 lines

**Total UI Component Extraction: ~400 lines**

---

### Phase 3: Extract Composables (~600 lines saved)

#### 3.1 Create `useGoalManagement.ts` (~200 lines)
**Extract:** Goal CRUD operations
- `loadGoals()`, `saveGoal()`, `deleteGoal()`
- `markGoalAsMet()`, `archiveGoal()`, `reactivateGoal()`
- `assignAssessmentToGoal()`, `removeAssessmentFromGoal()`
- Estimated: 200 lines

#### 3.2 Create `useAssessmentGeneration.ts` (~300 lines)
**Extract:** Assessment generation logic
- `generateAssessmentsForGoal()`
- `generateQuestionsForGoal()`
- `generateProofreadQuestion()`
- `generateAssessmentDescription()`
- `detectQuestionType()`
- Preview management
- Estimated: 300 lines

#### 3.3 Create `useGoalFilters.ts` (~100 lines)
**Extract:** Filtering logic
- `filteredGoals` computed
- `activeGoals` computed
- Filter state management
- Estimated: 100 lines

**Total Composable Extraction: ~600 lines**

---

### Phase 4: Extract Utility Functions (~100 lines saved)

#### 4.1 Create `goalUtils.ts` (~50 lines)
**Extract:** Utility functions
- `getSubjectArea()`
- `getStudentName()`
- `formatDate()`
- `getAssessmentTitle()`
- Estimated: 50 lines

#### 4.2 Move to existing services (~50 lines)
**Extract:** Service calls
- Move assignment functions to `assignmentServices.ts`
- Move assessment creation to `iepServices.ts` (already exists)
- Estimated: 50 lines

**Total Utility Extraction: ~100 lines**

---

## 📁 New File Structure

```
src/components/management/
├── GoalManagement.vue (~900 lines) ⬅️ Main component
├── GoalCard.vue (~200 lines) ⬅️ NEW
├── GoalFilters.vue (~100 lines) ⬅️ NEW
├── modals/
│   ├── GoalFormModal.vue (~250 lines) ⬅️ NEW
│   ├── CreateAssessmentModal.vue (~100 lines) ⬅️ NEW
│   ├── AssessmentPreviewModal.vue (~300 lines) ⬅️ NEW
│   └── SingleQuestionPreviewModal.vue (~150 lines) ⬅️ NEW
└── shared/
    └── StudentSelector.vue (~100 lines) ⬅️ NEW

src/composables/
├── useGoalManagement.ts (~200 lines) ⬅️ NEW
├── useAssessmentGeneration.ts (~300 lines) ⬅️ NEW
└── useGoalFilters.ts (~100 lines) ⬅️ NEW

src/utils/
└── goalUtils.ts (~50 lines) ⬅️ NEW
```

---

## 📝 Refactored GoalManagement.vue Structure

### Template (~200 lines)
```vue
<template>
  <div class="goal-management">
    <!-- Header -->
    <GoalManagementHeader 
      @create-goal="showCreateGoalModal = true"
      @create-assessment="showCreateAssessmentModal = true"
    />
    
    <!-- Filters -->
    <GoalFilters 
      :students="students"
      @update:filters="handleFilterUpdate"
    />
    
    <!-- Goals List -->
    <div class="goals-section">
      <GoalCard
        v-for="goal in filteredGoals"
        :key="goal.id"
        :goal="goal"
        :students="students"
        :assessments="assessments"
        @edit="editGoal"
        @delete="deleteGoal"
        @generate="generateAssessmentsForGoal"
        ...
      />
    </div>
    
    <!-- Modals -->
    <GoalFormModal
      v-if="showCreateGoalModal || showEditGoalModal"
      :goal="editingGoal"
      :is-editing="showEditGoalModal"
      @save="saveGoal"
      @close="closeModals"
    />
    
    <CreateAssessmentModal
      v-if="showCreateAssessmentModal"
      :active-goals="activeGoals"
      @create="createProgressAssessment"
      @close="closeModals"
    />
    
    <AssessmentPreviewModal
      v-if="showAssessmentPreview"
      :assessments="previewAssessments"
      :goal="previewGoal"
      @approve="handleApproval"
      @regenerate="regenerateRemainingQuestions"
      @close="showAssessmentPreview = false"
    />
    
    <SingleQuestionPreviewModal
      v-if="showSingleQuestionPreview"
      :question="singlePreviewQuestion"
      :goal="currentGoalForGeneration"
      @approve="handleApproval"
      @regenerate="generateProofreadQuestion"
      @close="showSingleQuestionPreview = false"
    />
  </div>
</template>
```

### Script (~400 lines)
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGoalManagement } from '@/composables/useGoalManagement'
import { useAssessmentGeneration } from '@/composables/useAssessmentGeneration'
import { useGoalFilters } from '@/composables/useGoalFilters'
import GoalCard from './GoalCard.vue'
import GoalFilters from './GoalFilters.vue'
import GoalFormModal from './modals/GoalFormModal.vue'
import CreateAssessmentModal from './modals/CreateAssessmentModal.vue'
import AssessmentPreviewModal from './modals/AssessmentPreviewModal.vue'
import SingleQuestionPreviewModal from './modals/SingleQuestionPreviewModal.vue'

// Composables
const {
  goals,
  students,
  assessments,
  loading,
  loadData,
  ...goalOperations
} = useGoalManagement()

const {
  generateAssessmentsForGoal,
  previewAssessments,
  showAssessmentPreview,
  ...generationOperations
} = useAssessmentGeneration()

const {
  filteredGoals,
  activeGoals,
  ...filterOperations
} = useGoalFilters(goals)

// Modal state
const showCreateGoalModal = ref(false)
const showEditGoalModal = ref(false)
const showCreateAssessmentModal = ref(false)
const editingGoal = ref<Goal | null>(null)

// Lifecycle
onMounted(() => {
  loadData()
})
</script>
```

### Styles (~300 lines)
- Keep only layout-specific styles
- Move component-specific styles to respective components

---

## 🎯 Estimated Line Count After Refactoring

| Section | Current | After | Saved |
|---------|---------|-------|-------|
| Template | ~700 | ~200 | 500 |
| Script | ~1,800 | ~400 | 1,400 |
| Styles | ~500 | ~300 | 200 |
| **Total** | **3,034** | **~900** | **2,134** |

---

## ✅ Implementation Steps

### Step 1: Extract Modals (Highest Impact)
1. Create `GoalFormModal.vue`
2. Create `CreateAssessmentModal.vue`
3. Create `AssessmentPreviewModal.vue`
4. Create `SingleQuestionPreviewModal.vue`
5. Update `GoalManagement.vue` to use modals

**Estimated Time:** 4-6 hours
**Lines Saved:** ~800

### Step 2: Extract Composables
1. Create `useGoalManagement.ts`
2. Create `useAssessmentGeneration.ts`
3. Create `useGoalFilters.ts`
4. Update `GoalManagement.vue` to use composables

**Estimated Time:** 3-4 hours
**Lines Saved:** ~600

### Step 3: Extract UI Components
1. Create `GoalCard.vue`
2. Create `GoalFilters.vue`
3. Create `StudentSelector.vue`
4. Update `GoalManagement.vue` to use components

**Estimated Time:** 2-3 hours
**Lines Saved:** ~400

### Step 4: Extract Utilities
1. Create `goalUtils.ts`
2. Move utility functions
3. Update imports

**Estimated Time:** 1 hour
**Lines Saved:** ~100

### Step 5: Cleanup & Testing
1. Remove unused code
2. Test all functionality
3. Update imports across codebase
4. Verify build passes

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 12-17 hours

---

## 🔍 Key Benefits

1. **Maintainability:** Each component has a single responsibility
2. **Reusability:** Modals and components can be reused elsewhere
3. **Testability:** Composables can be unit tested independently
4. **Readability:** Main component is much easier to understand
5. **Performance:** Smaller components = better tree-shaking

---

## ⚠️ Considerations

1. **Props/Events:** Need to carefully define interfaces for all component props
2. **State Management:** Some state may need to be lifted to parent or use Pinia
3. **Testing:** Need to test each extracted component/composable
4. **Backward Compatibility:** Ensure all existing functionality works
5. **TypeScript:** Maintain strict typing throughout

---

## 📋 Checklist

- [ ] Extract GoalFormModal
- [ ] Extract CreateAssessmentModal
- [ ] Extract AssessmentPreviewModal
- [ ] Extract SingleQuestionPreviewModal
- [ ] Extract GoalCard component
- [ ] Extract GoalFilters component
- [ ] Extract StudentSelector component
- [ ] Create useGoalManagement composable
- [ ] Create useAssessmentGeneration composable
- [ ] Create useGoalFilters composable
- [ ] Create goalUtils utility file
- [ ] Update all imports
- [ ] Test all functionality
- [ ] Verify build passes
- [ ] Update documentation

---

## 🎉 Expected Result

**GoalManagement.vue:** ~900 lines (down from 3,034)
- Clean, focused main component
- Easy to understand and maintain
- Well-organized codebase
- Reusable components and composables



