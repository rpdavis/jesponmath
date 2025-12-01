# Refactoring Plan: Student Grouping Logic

## Overview
The student grouping logic in `Gradebook.vue` is complex, hard to maintain, and duplicated across multiple components. This plan outlines a systematic refactoring to extract, test, and reuse this logic.

## Current Issues

### 1. **Code Duplication**
- Student grouping logic appears in multiple components (`Gradebook.vue`, `AssessmentEditor.vue`, `StudentManagement.vue`)
- Period/className extraction pattern (`courseName || className`, `section || period`) is repeated 50+ times
- No single source of truth for grouping logic

### 2. **Complexity & Maintainability**
- 130+ lines of grouping logic embedded in a computed property
- Multiple passes over student data (inefficient)
- Nested loops for finding most common period
- Hard to test in isolation
- Hard to understand the flow

### 3. **Type Safety**
- No types for normalized student data
- Inline helper functions without proper typing
- Group structure defined inline without type export

### 4. **Performance**
- Multiple iterations over the same data
- Inefficient period counting (nested forEach loops)
- Could be optimized with better data structures

## Refactoring Strategy

### Phase 1: Extract Utility Functions (Low Risk)
**Goal**: Create reusable utility functions for student data normalization

#### 1.1 Create `src/utils/studentGroupingUtils.ts`
Extract core logic into well-typed, testable functions:

```typescript
// Types
export interface NormalizedStudent {
  student: Student;
  className: string;
  period: string;
}

export interface StudentGroup {
  key: string;
  className: string;
  period: string;
  students: Student[];
}

// Functions to extract:
- getStudentClassName(student: Student): string
- getStudentPeriod(student: Student): string
- extractPeriodFromClassName(className: string): string | null
- normalizePeriod(period: string | undefined, className: string): string
- normalizeStudent(student: Student): NormalizedStudent
- findMostCommonPeriod(students: NormalizedStudent[], className: string): string | null
- groupStudentsByClassAndPeriod(students: Student[]): StudentGroup[]
```

**Benefits**:
- Single source of truth
- Testable in isolation
- Reusable across components
- Better type safety

**Files to Create**:
- `src/utils/studentGroupingUtils.ts` (new)

**Files to Update**:
- `src/components/Gradebook.vue` (refactor to use utilities)
- `src/components/assessments/AssessmentEditor.vue` (use utilities)
- `src/components/StudentManagement.vue` (use utilities)

---

### Phase 2: Optimize Grouping Algorithm (Medium Risk)
**Goal**: Improve performance and readability of grouping logic

#### 2.1 Single-Pass Grouping
Replace multiple passes with a single efficient pass:

**Current Approach** (3 passes):
1. Normalize all students
2. Build period map
3. Group students

**New Approach** (1 pass):
- Single pass that normalizes, counts periods, and groups simultaneously
- Use Map for O(1) lookups
- Pre-compute period counts during normalization

**Performance Improvement**: O(3n) → O(n)

#### 2.2 Better Data Structures
- Use `Map<string, Map<string, Student[]>>` for nested grouping
- Pre-compute period frequency during normalization
- Cache normalized values

---

### Phase 3: Add Unit Tests (Low Risk)
**Goal**: Ensure correctness and prevent regressions

#### 3.1 Test Cases to Cover
- Period extraction from various className formats
- Period normalization (ordinal suffixes)
- Missing period handling
- Most common period detection
- Group key generation
- Edge cases (empty data, null values, etc.)

**Files to Create**:
- `src/utils/__tests__/studentGroupingUtils.test.ts` (new)

---

### Phase 4: Update Components (Medium Risk)
**Goal**: Replace inline logic with utility functions

#### 4.1 Gradebook.vue
- Replace 130+ lines of grouping logic with utility call
- Keep component focused on UI concerns
- Maintain existing functionality

#### 4.2 Other Components
- Update `AssessmentEditor.vue` to use utilities
- Update `StudentManagement.vue` display logic
- Remove duplicated code

---

### Phase 5: Add Configuration (Low Risk)
**Goal**: Make grouping behavior configurable

#### 5.1 Configuration Options
- Default period format (e.g., "6th Period" vs "Period 6")
- Fallback behavior for missing periods
- Grouping key format
- Period extraction patterns (configurable regex)

**Files to Create**:
- `src/config/studentGrouping.ts` (new, optional)

---

## Implementation Order

### Step 1: Extract Core Utilities (Week 1)
1. ✅ Create `studentGroupingUtils.ts`
2. ✅ Extract `getStudentClassName()` and `getStudentPeriod()`
3. ✅ Extract `extractPeriodFromClassName()`
4. ✅ Extract `normalizePeriod()`
5. ✅ Write unit tests for each function

### Step 2: Extract Grouping Logic (Week 1)
1. ✅ Extract `normalizeStudent()`
2. ✅ Extract `findMostCommonPeriod()`
3. ✅ Extract `groupStudentsByClassAndPeriod()`
4. ✅ Write unit tests for grouping

### Step 3: Refactor Gradebook.vue (Week 2)
1. ✅ Import utilities
2. ✅ Replace inline logic with utility calls
3. ✅ Test in browser
4. ✅ Verify no regressions

### Step 4: Update Other Components (Week 2)
1. ✅ Update `AssessmentEditor.vue`
2. ✅ Update `StudentManagement.vue`
3. ✅ Remove duplicated code

### Step 5: Optimize & Polish (Week 3)
1. ✅ Optimize grouping algorithm (single pass)
2. ✅ Add configuration options (if needed)
3. ✅ Performance testing
4. ✅ Documentation

---

## File Structure

```
src/
├── utils/
│   ├── studentGroupingUtils.ts          [NEW]
│   └── __tests__/
│       └── studentGroupingUtils.test.ts [NEW]
├── config/
│   └── studentGrouping.ts               [NEW, optional]
└── components/
    ├── Gradebook.vue                    [REFACTOR]
    ├── StudentManagement.vue            [REFACTOR]
    └── assessments/
        └── AssessmentEditor.vue          [REFACTOR]
```

---

## Testing Strategy

### Unit Tests
- Test each utility function independently
- Test edge cases (null, undefined, empty strings)
- Test period extraction patterns
- Test grouping correctness

### Integration Tests
- Test full grouping flow with real student data
- Test with various data quality scenarios
- Test performance with large datasets (1000+ students)

### Manual Testing
- Verify gradebook displays correctly
- Verify no students are lost or duplicated
- Verify grouping matches expected behavior
- Test with real production data

---

## Risk Assessment

### Low Risk
- ✅ Extracting utility functions (isolated, testable)
- ✅ Adding unit tests (no behavior change)
- ✅ Creating new files (no breaking changes)

### Medium Risk
- ⚠️ Refactoring Gradebook.vue (UI component, needs careful testing)
- ⚠️ Optimizing algorithm (could introduce bugs if not careful)
- ⚠️ Updating multiple components (coordination needed)

### High Risk
- ❌ None identified

---

## Success Criteria

1. ✅ All grouping logic extracted to utilities
2. ✅ No code duplication across components
3. ✅ Unit tests with >90% coverage
4. ✅ Performance improved or maintained
5. ✅ No regressions in gradebook display
6. ✅ Code is more maintainable and readable

---

## Rollback Plan

If issues arise:
1. Keep old code commented out initially
2. Use feature flag to toggle between old/new logic
3. Revert to previous version if critical bugs found
4. Gradual rollout: test in dev → staging → production

---

## Estimated Timeline

- **Week 1**: Extract utilities and write tests
- **Week 2**: Refactor components
- **Week 3**: Optimize, test, and document

**Total**: ~3 weeks for complete refactoring

---

## Notes

- Start with low-risk extractions first
- Test thoroughly at each step
- Keep old code until new code is proven
- Document any deviations from this plan








