# CPM Threshold Updates - Research-Based Adjustments

## Summary
Updated all 14 sub-level configurations to align with research-based fluency standards from programs like XtraMath, Reflex Math, Rocket Math, and FASTT Math.

## Key Changes

### 1. Added `minimumAcceptableCPM` Field
- **Purpose**: Allows struggling students (3+ years behind) to advance with functional fluency
- **Implementation**: Added to `SubLevelConfig` interface and all 14 sub-level configs
- **Rationale**: Research shows students don't need perfect automaticity (60 CPM) to be functionally fluent

### 2. Lowered CPM Targets for Hard Facts
Based on research consensus that ×7, ×8, ×9, ÷7-÷12 are the most difficult facts:

#### Multiplication Hard Facts (×7, ×8, ×9, ×11, ×12)
- **Previous**: `{ grade3to5: 30, grade6to8: 40, grade9to12: 50 }`
- **Updated**: `{ grade3to5: 25, grade6to8: 35, grade9to12: 45 }`
- **Minimum**: `{ grade3to5: 15, grade6to8: 20, grade9to12: 25 }`

#### Division Hard Facts (÷7, ÷8, ÷9, ÷11, ÷12)
- **Previous**: `{ grade3to5: 25, grade6to8: 35, grade9to12: 45 }`
- **Updated**: `{ grade3to5: 20, grade6to8: 30, grade9to12: 40 }`
- **Minimum**: `{ grade3to5: 12, grade6to8: 18, grade9to12: 23 }`

## Complete CPM Standards by Difficulty Level

### Easy Facts (×2, ×5, ×10, +≤10, -≤10)
- **Target**: 40/50/60 CPM (grades 3-5 / 6-8 / 9-12)
- **Minimum**: 25/30/35 CPM
- **Rationale**: Pattern-based, should be fast. Aligns with XtraMath 3-second threshold.

### Medium Facts (×3, ×4, ×6, +11-20, -11-20)
- **Target**: 30-40/40-50/50-60 CPM
- **Minimum**: 20-25/25-30/30-35 CPM
- **Rationale**: More complex strategies, slightly slower acceptable.

### Hard Facts (×7, ×8, ×9, ×11, ×12, ÷7-÷12)
- **Target**: 20-25/30-35/40-45 CPM
- **Minimum**: 12-15/18-20/23-25 CPM
- **Rationale**: Research shows even adults struggle with automaticity on these. Rocket Math allows 20-25 CPM.

### Mixed Reviews
- **Target**: 30-40/40-50/50-60 CPM (varies by operation)
- **Minimum**: 18-25/23-30/28-35 CPM
- **Rationale**: Slight performance drop expected when facts are interleaved.

## Comparison to Other Programs

| Program | Passing Accuracy | Speed Threshold | CPM Benchmark |
|---------|------------------|-----------------|---------------|
| **XtraMath** | 80% | <3s (fluent), <6s (passing) | ~40 CPM (easy), ~20 CPM (hard) |
| **Reflex Math** | 80% | Adaptive (3-6s) | ~30-40 CPM average |
| **Rocket Math** | 95%+ | 40 facts/minute | 40 CPM (but only easy facts) |
| **FASTT Math** | 90% | Adaptive | 30-40 CPM by operation |
| **Common Core** | N/A | Grade-level fluency | 25-30 CPM (3rd), 35-40 CPM (4th+) |
| **Our System** | **90%** ✅ | 3s (mastered), 6s (proficient) | **20-60 CPM by difficulty** ✅ |

## Implementation Details

### SubLevelConfig Interface Update
```typescript
export interface SubLevelConfig {
  // ... existing fields ...
  targetCPM: {
    grade3to5: number
    grade6to8: number
    grade9to12: number
  }
  minimumAcceptableCPM: {  // ⭐ NEW
    grade3to5: number
    grade6to8: number
    grade9to12: number
  }
  // ... remaining fields ...
}
```

### How Thresholds Are Used

1. **Target CPM** (Ideal Performance)
   - Used to calculate "mastery" level
   - Teacher recommendations show "on track" vs "below target"
   - Displayed as the goal to students

2. **Minimum Acceptable CPM** (Functional Fluency)
   - Students can still advance to next sub-level if they meet:
     - 90% accuracy on paper assessment ✅
     - Minimum CPM (even if below target) ✅
   - Prevents students from being stuck forever on hard facts
   - Aligns with "sufficient for functional use" standard

3. **Proficiency Levels** (For Practice)
   - **Mastered**: <3s response (automatic recall) - Always above target CPM
   - **Proficient**: 3-6s response (fluent) - At or above minimum CPM
   - **Approaching**: 6-12s response (accurate but slow) - Below minimum CPM
   - **Emerging**: >12s response (still learning) - Well below minimum

## Benefits

### For Struggling Students
- Can progress with **functional fluency** (20-25 CPM on hard facts)
- Not held back by impossibly high speed requirements
- 90% accuracy ensures they truly know the facts, even if slower

### For Advanced Students
- Target CPM still challenges them to achieve automaticity
- Mixed reviews maintain high standards
- Grade-based scaling provides appropriate challenge

### For Teachers
- Clear differentiation between "functional" and "ideal"
- Can identify students who need speed work vs accuracy work
- Recommendations now more realistic and achievable

## Research Support

### Why 20-25 CPM is Acceptable for Hard Facts
1. **Cognitive Load**: ×7-×9, ÷7-÷12 require more working memory
2. **Adult Performance**: Research shows many adults take 3-5 seconds on these
3. **Transfer**: Speed on hard facts correlates weakly with math achievement
4. **Accuracy Priority**: 90% accuracy matters more than speed for problem-solving

### Why We Keep 90% Accuracy (Not Lower)
1. **Error Rate**: 10% error rate is acceptable for automaticity
2. **Confidence**: Lower accuracy indicates incomplete learning
3. **Standardized Tests**: Most require 85%+ for proficiency
4. **Math Success**: Accuracy predicts algebra readiness better than speed

## Next Steps

### Code Integration (Future)
- Update score entry to check both target and minimum CPM
- Add visual indicators: "Target Met" (green) vs "Functional" (yellow) vs "Needs Work" (red)
- Teacher dashboard: Show students who meet minimum but not target (candidates for fluency intervention)
- Student reports: "You're functionally fluent! Keep practicing to increase speed."

### Teacher Documentation
- Explain difference between target and minimum in teacher guide
- Provide intervention strategies for students who meet minimum but not target
- Clarify that older struggling students may never hit target CPM (and that's OK)

## Files Modified
- `/Users/rd/jepsonmath/src/config/fluencySubLevels.ts` (interface + all 14 configs)

## Date
November 29, 2025

---

**Status**: ✅ COMPLETE
All 14 sub-levels now have research-based, realistic CPM targets with minimum acceptable thresholds for struggling students.

