# Adaptive Diagnostic Update Plan

## Requested Features

1. **Assignment Capability** - Allow assigning the diagnostic to students as an assessment
2. **Hide Difficulty Levels** - Don't show difficulty to students during test
3. **Mixed Question Types** - Combine multiple choice and short answer
4. **Foundational Skills** - Include 4th-6th grade readiness questions
5. **Student Goals Integration** - Include questions based on student IEP goals

## Implementation Status

### ✅ Completed
- Created `foundationalDiagnosticGenerator.ts` with:
  - 7 categories of foundational questions (4th-6th grade)
  - Mix of multiple choice (20) and short answer (5)
  - Question bank covering:
    - Whole Numbers & Operations
    - Fractions & Decimals
    - Ratios & Proportions
    - Algebraic Thinking
    - Geometry Basics
    - Integers
    - Word Problems
  - Support for goal-based question generation

### 🔄 Next Steps

1. **Update AdaptiveMathDiagnostic.vue Component**
   - Add assignment/save functionality
   - Hide difficulty level from students (keep internal tracking)
   - Support multiple choice rendering (radio buttons)
   - Support short answer input
   - Integrate with foundational question bank
   - Load student goals and generate goal-based questions
   
2. **Add Assignment Features**
   - Save diagnostic as an assessment in Firestore
   - Allow teachers to assign to students
   - Students can take assigned diagnostics
   - Results saved to gradebook
   
3. **Update UI**
   - Remove difficulty display for students
   - Add multiple choice option rendering
   - Show question type indicator (MC vs SA)
   - Progress bar without difficulty indication

## File Structure

```
src/
├── utils/
│   ├── adaptiveDiagnosticGenerator.ts (existing - adaptive only)
│   └── foundationalDiagnosticGenerator.ts (NEW - foundational + goals)
├── components/
│   └── diagnostics/
│       ├── AdaptiveMathDiagnostic.vue (TO UPDATE)
│       └── FoundationalDiagnostic.vue (TO CREATE - new component)
```

## Usage Flow

### For Teachers:
1. Navigate to Foundational Diagnostic
2. Select student(s)
3. System loads student goals from database
4. Generates 25 questions (20 MC + 5 SA)
   - Mix of foundational skills
   - Student-specific goal questions
5. Teacher can:
   - Assign to student(s)
   - Preview questions
   - Save as reusable assessment

### For Students:
1. See assigned diagnostics in dashboard
2. Take diagnostic (difficulty hidden)
3. Answer mix of MC and SA questions
4. Submit for grading
5. Teacher reviews results

## Technical Notes

- Multiple choice questions have 4 options
- Short answer accepts various formats (numbers, fractions, etc.)
- Difficulty levels maintained internally for adaptive logic
- Results include detailed breakdown by category
- Can be integrated with existing gradebook system

