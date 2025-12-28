# Template System Refactor - Implementation Plan

## Problem Statement
Current system has hardcoded problem-type logic in the AI prompt, leading to:
- "Whack-a-mole" bug fixing (fixing one thing breaks another)
- Non-scalable architecture for multiple problem types
- Difficulty maintaining and extending

## Solution Architecture

### 1. Make Templates the Single Source of Truth

**Key Principle**: Each template defines ALL the rules for its problem type

### 2. New Template Structure

```typescript
interface GoalTemplate {
  // ... existing fields ...
  
  // NEW: Structured problem characteristics
  problemStructure?: {
    numberOfSteps?: 1 | 2 | 3 | 4
    questionTypes?: string[] // e.g., ["find-percent", "find-part", "find-whole"]
    contextTypes?: string[] // e.g., ["quiz", "basketball", "pizza"]
    numberRanges?: {
      question1?: string // e.g., "15/20 (75%)"
      question2?: string // e.g., "18/24 (75%)"
      ...
    }
    forbiddenPatterns?: string[] // e.g., ["8/10", "$25"]
  }
  
  customAIPrompt?: string // Freeform instructions
}
```

### 3. Implementation Stages

#### Stage 1: Update Data Model ✅
- [x] Add `problemStructure` to `GoalTemplate` interface
- [x] Keep backward compatibility with existing templates

#### Stage 2: Create Template Editor UI
- [ ] Add "Generate Draft from Goal" button
  - AI analyzes goal text
  - Generates structured fields
  - Pre-populates form
- [ ] Add fields for:
  - Number of steps
  - Question types
  - Context types
  - Number ranges per question
  - Forbidden patterns
  - Custom AI prompt
- [ ] Visual preview of how AI will use template

#### Stage 3: Simplify Base Prompt
- [ ] Remove all hardcoded problem-type logic
- [ ] Use template fields dynamically
- [ ] Keep base prompt under 200 lines

#### Stage 4: Migrate Existing Templates
- [ ] Percentage template → Add structured fields
- [ ] Money template → Add structured fields
- [ ] Test both still work

#### Stage 5: Add New Problem Types (Easy Now!)
- [ ] Linear equations template
- [ ] Fraction operations template
- [ ] Division template
- [ ] Multiplication template
- Each is just a new template, no code changes!

## Benefits

✅ **Scalable**: Add new problem types without code changes
✅ **Maintainable**: Fix templates independently
✅ **Self-documenting**: Template shows all its rules
✅ **Teacher-controlled**: Teachers can edit without developers
✅ **No conflicts**: Each template isolated
✅ **AI-assisted**: Can generate draft templates from goal text

## Example: Percentage Template

```javascript
{
  name: "Percentage - Find Percent from Fraction",
  exampleQuestion: "Joe got 18 correct out of 20 problems. What percent?",
  exampleAnswer: "90%",
  
  problemStructure: {
    numberOfSteps: 1,
    questionTypes: ["find-percent"],
    contextTypes: ["quiz", "test", "basketball", "pizza", "homework", "spelling"],
    numberRanges: {
      question1: "15/20 (75%)",
      question2: "18/24 (75%)",
      question3: "22/25 (88%)",
      question4: "12/15 (80%)",
      question5: "27/30 (90%)"
    },
    forbiddenPatterns: ["8/10", "9/10", "18/20"]
  },
  
  customAIPrompt: "Vary the context but keep the structure: 'X out of Y. What percent?'"
}
```

## Example: Two-Step Money Template

```javascript
{
  name: "Two-Step Money Word Problem",
  exampleQuestion: "Rose wants to buy a scooter that costs $100. She has $30 saved and received $20. How much more does she need?",
  exampleAnswer: "$50",
  
  problemStructure: {
    numberOfSteps: 2,
    questionTypes: ["find-missing-amount"],
    contextTypes: ["skateboard", "tablet", "headphones", "guitar", "concert-ticket"],
    numberRanges: {
      question1: "$45-$55 total, $10-$18 saved",
      question2: "$70-$90 total, $30-$42 saved",
      question3: "$35-$48 total, $12-$20 saved",
      question4: "$95-$120 total, $48-$65 saved",
      question5: "$55-$75 total, $20-$32 saved"
    },
    forbiddenPatterns: ["$25 saved", "$65 cost", "answer=$28"],
    allowedOperations: ["addition", "subtraction"]
  }
}
```

## Next Steps

1. ✅ Update TypeScript types
2. Create "Generate Draft Template" AI service
3. Update GoalTemplateManagement UI
4. Simplify aiQuestionGenerator.ts
5. Test with existing templates
6. Document for teachers


