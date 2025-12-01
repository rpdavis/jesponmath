# Stage 1: Core Data Structure - COMPLETE ✅

## What Was Built

### 1. **Enhanced Type Definitions** (`src/types/mathFluency.ts`)

Added comprehensive sub-level types:
- `SubLevel` type with 14 total levels (3 addition, 3 subtraction, 4 multiplication, 4 division)
- `SubLevelProgress` interface for tracking individual sub-level progression
- Updated `MathFluencyProgress` to include:
  - `currentSubLevel: SubLevel | null`
  - `completedSubLevels: SubLevel[]`
  - `subLevelProgress: { [key: string]: SubLevelProgress }`

### 2. **Sub-Level Configuration** (`src/config/fluencySubLevels.ts`)

Created comprehensive configuration for all 14 sub-levels including:
- **Problem counts** for each level (36-90 questions)
- **Problem filters** to identify which questions belong to each level
- **Assessment criteria** (1-minute duration, 90% passing, CPM targets by grade)
- **Practice thresholds** (85% proficiency to take assessment)
- **Teaching strategies** for each level
- **Motivational elements** (icons, colors, messages)

Helper functions:
- `getSubLevelConfig()` - Get configuration for a sub-level
- `getSubLevelsForOperation()` - Get all sub-levels for an operation
- `getFirstSubLevel()` - Get starting sub-level for operation
- `getNextSubLevel()` - Get next sub-level in sequence
- `isSubLevelComplete()` - Check if all sub-levels in operation are done
- `getTargetCPM()` - Get CPM threshold by grade level

### 3. **Sub-Level Utilities** (`src/utils/subLevelUtils.ts`)

Created utility functions for working with sub-levels:
- `determineStartingSubLevel()` - Decide where student should start based on diagnostic
- `filterProblemsBySubLevel()` - Filter problem banks by sub-level criteria
- `selectMaintenanceProblems()` - Get problems from previous levels for retention
- `calculateSubLevelProficiency()` - Calculate proficiency within a sub-level
- `isReadyForSubLevelAssessment()` - Check if student is ready (85% threshold)
- `didPassSubLevelAssessment()` - Check if assessment was passed (90% accuracy)
- `calculateCPM()` - Calculate correct per minute
- `selectDailyPracticeProblems()` - **60% current level, 20% maintenance, 20% extra**

---

## 📊 Sub-Level Structure (Final)

### **Addition** (81 total unique problems)
1. **Addition Within 10** (36 problems) - Sums 2-10
2. **Addition Within 20** (45 problems) - Sums 11-20, bridging 10
3. **Addition Mixed** (30 sample problems) - All addition facts

### **Subtraction** (171 total unique problems)
4. **Subtraction Within 10** (36 problems) - From 2-10
5. **Subtraction Within 20** (90 problems) - From 11-20, crossing 10
6. **Subtraction Mixed** (30 sample problems) - All subtraction facts

### **Multiplication** (66 total unique problems, excluding 0 and 1)
7. **Multiplication Easy** (29 problems) - ×0,1,2,5,10 (patterns)
8. **Multiplication Medium** (31 problems) - ×3,4,6 + squares
9. **Multiplication Hard** (36 problems) - ×7,8,9,11,12
10. **Multiplication Mixed** (40 sample problems) - All multiplication facts

### **Division** (132 total unique problems)
11. **Division Easy** (36 problems) - ÷2,5,10
12. **Division Medium** (36 problems) - ÷3,4,6
13. **Division Hard** (60 problems) - ÷7,8,9,11,12
14. **Division Mixed** (40 sample problems) - All division facts

---

## 🎯 Key Thresholds

### **Progression Rules**
- **Ready for Assessment**: 85% proficiency (approaching + proficient + mastered)
- **Pass Assessment**: 90% accuracy on 1-minute paper test
- **Advance to Next Sub-Level**: Pass assessment
- **Complete Operation**: Pass all sub-levels including mixed review
- **Unlock Next Operation**: Complete current operation

### **CPM Targets** (Correct Per Minute on Paper Tests)

| Sub-Level Type | Grades 3-5 | Grades 6-8 | Grades 9-12 |
|----------------|------------|------------|-------------|
| Easy facts (×2,5,10) | 40 CPM | 50 CPM | 60 CPM |
| Medium facts | 35 CPM | 45 CPM | 55 CPM |
| Hard facts (×7,8,9) | 30 CPM | 40 CPM | 50 CPM |
| Hardest (div ÷7-12) | 25 CPM | 35 CPM | 45 CPM |

### **Practice Algorithm**
- **60%** - Current sub-level focus (doesNotKnow, emerging, approaching)
- **20%** - Maintenance from previous sub-levels (proficient facts)
- **20%** - Additional current level or preview
- **Exclude** - Mastered facts (unless in maintenance pool)

---

## 🔄 Self-Pacing Logic

Students who score **90%+ on initial placement diagnostic** for a sub-level:
- **Skip to next sub-level** (e.g., skip "Within 10", start at "Within 20")
- **Automatically marked as ready** for assessment
- **Fast-track** advanced students

Students who score **<70% on diagnostic**:
- Start at first sub-level
- May need additional support/strategy instruction

---

## ✅ Completed in Stage 1

- [x] SubLevel type definition (14 levels)
- [x] SubLevelProgress interface
- [x] Updated MathFluencyProgress interface
- [x] Complete sub-level configuration (SUB_LEVEL_CONFIGS)
- [x] Helper functions for sub-level operations
- [x] Problem filtering by sub-level
- [x] Maintenance problem selection
- [x] Daily practice problem selection algorithm
- [x] Proficiency calculation per sub-level
- [x] Assessment readiness checking
- [x] CPM calculation and thresholds

---

## 🚀 Next Steps: Stage 2

**Goal**: Connect sub-levels to existing systems

**Tasks**:
1. Update placement diagnostic to set initial sub-level
2. Modify daily practice to use sub-level filtering
3. Update proficiency calculations to work per sub-level
4. Add sub-level display to student dashboard

**Estimated Time**: 1-2 days

---

## 📝 Notes

- All problem filters are defined and ready to use
- Categories overlap intentionally (e.g., "7+8" is both "Bridging 10" and "Sums 11-20")
- Mixed reviews sample from all problems in the operation
- Maintenance problems keep previous skills sharp
- System supports self-pacing for advanced students
- Older students will progress faster through early levels

---

*Stage 1 Completed: Core data structure ready for integration*

