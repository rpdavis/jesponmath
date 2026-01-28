# How to Create Linked Questions

## Quick Start: Manual Method (Works Now)

You can create linked questions by directly editing the assessment data in the database or through JSON import. Here's the structure:

```json
{
  "id": "unique-question-id",
  "questionText": "Multi-part problem:",
  "questionType": "short-answer",
  "points": 1,
  "standard": "6.NS.B.3",
  "correctAnswer": "",
  
  "subQuestions": [
    {
      "id": "unique-question-id-a",
      "partLabel": "Part A",
      "questionText": "What is 5 + 3?",
      "questionType": "short-answer",
      "correctAnswer": "8",
      "pointWeight": 0.5,
      "explanation": "5 + 3 = 8"
    },
    {
      "id": "unique-question-id-b",
      "partLabel": "Part B",
      "questionText": "What is 10 - 2?",
      "questionType": "short-answer",
      "correctAnswer": "8",
      "pointWeight": 0.5,
      "explanation": "10 - 2 = 8"
    }
  ],
  
  "subQuestionScoringMode": "all-or-nothing"
}
```

## Scoring Modes

### Option 1: "all-or-nothing" (Both Must Be Correct)
```json
"subQuestionScoringMode": "all-or-nothing"
```
- Student must get ALL parts correct to earn ANY points
- Use case: Your scenario where both questions must be correct for 1 point
- Example: If question worth 1pt, student gets Part A ✅ and Part B ❌ = **0 points**

### Option 2: "proportional" (Partial Credit)
```json
"subQuestionScoringMode": "proportional"
```
- Student earns points for each correct part based on pointWeight
- Use case: Multi-step problems where partial credit is fair
- Example: If question worth 1pt, student gets Part A (0.5 weight) ✅ and Part B (0.5 weight) ❌ = **0.5 points**

## Point Weights

The `pointWeight` field determines what fraction of the total points each sub-question is worth:

```json
{
  "points": 2,  // Total points for the question
  "subQuestions": [
    {
      "pointWeight": 0.25,  // Worth 0.5 points (2 × 0.25)
      ...
    },
    {
      "pointWeight": 0.75,  // Worth 1.5 points (2 × 0.75)
      ...
    }
  ]
}
```

**Important:** Point weights should add up to 1.0 (representing 100% of total points)

## Standards-Based Grading

When a composite question is graded, the system automatically:

1. **Calculates sub-question scores** based on scoring mode
2. **Determines final points earned** (0 to max points)
3. **Reports to standards view** with actual point value (not just "correct" or "incorrect")

Example with standards:
- Question tagged with "6.NS.B.3"
- Worth 1 point total
- Student answers 1 of 2 parts correctly
- **All-or-nothing mode:** Standards view shows 0/1 = 0%
- **Proportional mode:** Standards view shows 0.5/1 = 50%

## UI Implementation Needed

To create linked questions through the UI, you'll need to add to `QuestionEditor.vue`:

### 1. Add "Composite Question" Toggle
```vue
<div class="form-group">
  <label>
    <input type="checkbox" v-model="isCompositeQuestion" />
    Make this a multi-part question
  </label>
</div>
```

### 2. Show Sub-Question Editor (when toggled on)
```vue
<div v-if="isCompositeQuestion" class="sub-questions-section">
  <h4>Sub-Questions</h4>
  
  <!-- Scoring Mode Selection -->
  <div class="form-group">
    <label>Scoring Mode</label>
    <select v-model="question.subQuestionScoringMode">
      <option value="all-or-nothing">All-or-Nothing (all parts must be correct)</option>
      <option value="proportional">Proportional (partial credit allowed)</option>
    </select>
  </div>
  
  <!-- Sub-Questions List -->
  <div v-for="(subQ, index) in question.subQuestions" :key="subQ.id" class="sub-question">
    <h5>{{ subQ.partLabel }}</h5>
    <!-- Add fields for: questionText, questionType, correctAnswer, pointWeight -->
  </div>
  
  <button @click="addSubQuestion">+ Add Part</button>
</div>
```

### 3. Update Assessment Taking Component

The `AssessmentTaking.vue` component will need to:
- Detect when a question has `subQuestions`
- Display each sub-question separately
- Store responses for each sub-part
- Calculate final score based on `subQuestionScoringMode`

## Example: Creating a 2-Part Question Worth 1 Point

**Scenario:** Student must answer BOTH parts correctly to earn 1 point

### Step 1: Create the parent question
```javascript
const question = {
  id: generateId(),
  questionText: "Solve both equations:",
  questionType: "short-answer",
  points: 1,
  standard: "8.EE.C.7",
  correctAnswer: "", // Not used for composite questions
  subQuestions: [],
  subQuestionScoringMode: "all-or-nothing"
}
```

### Step 2: Add sub-questions
```javascript
question.subQuestions.push({
  id: generateId(),
  partLabel: "Part A",
  questionText: "Solve for x: $2x + 5 = 13$",
  questionType: "short-answer",
  correctAnswer: "4",
  pointWeight: 0.5,
  explanation: "Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4"
})

question.subQuestions.push({
  id: generateId(),
  partLabel: "Part B", 
  questionText: "Solve for y: $3y - 7 = 8$",
  questionType: "short-answer",
  correctAnswer: "5",
  pointWeight: 0.5,
  explanation: "Add 7 to both sides: 3y = 15, then divide by 3: y = 5"
})
```

### Step 3: Student takes assessment

**If scoring mode is "all-or-nothing":**
- Both correct: 1 point ✅
- One correct: 0 points ❌
- Both wrong: 0 points ❌

**If scoring mode is "proportional":**
- Both correct: 1 point (0.5 + 0.5)
- One correct: 0.5 points
- Both wrong: 0 points

## Temporary Workaround (Until UI is Built)

You can manually create linked questions by:

1. **Using Assessment Importer** - Create a JSON file with the composite question structure and import it
2. **Database Console** - Directly edit the assessment document in Firebase
3. **Export/Import** - Export an assessment, add the `subQuestions` array in the JSON, then re-import

## File Locations for UI Development

If you want to add UI support:

1. **Question Editor:** `/src/components/assessments/editor/QuestionEditor.vue`
   - Add composite question toggle
   - Add sub-question editor fields

2. **Assessment Taking:** `/src/components/assessments/AssessmentTaking.vue`
   - Display sub-questions during test
   - Collect sub-question responses
   - Calculate composite score

3. **Response Storage:** `/src/types/iep.ts`
   - May need to extend `AssessmentResponse` to store sub-question answers

## Testing Your Linked Questions

Once created, linked questions will automatically:
- ✅ Display in standards view with correct point values
- ✅ Calculate with keepTop, average, and additive methods
- ✅ Show proper percentages (not just "correct/incorrect")
- ✅ Support 0.5, 1, 2, or any point value
- ✅ Work with all existing features

---

**Need Help?** Check `STANDARDS_SCORING_UPDATE.md` for details on how the scoring system works behind the scenes.
