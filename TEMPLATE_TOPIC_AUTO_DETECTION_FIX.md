# Template Topic Auto-Detection Fix

## Problem Identified

**User Report**: "I think we need to assign the template to the goal. the topic is left blank by default right now. so the verbage was saved originally with no topic field and the elapsed time was inserted into it by the app"

### Root Cause
When saving templates from PA generation preview:
1. Templates were created with **blank/undefined `topic` field**
2. Template prefill used `goal?.topicHint` which doesn't exist on most goals
3. Templates would save whatever random question was generated (potentially wrong type)
4. Later matching would miss the +15 topic bonus, but still match on other criteria (~23 points)
5. **Wrong template would be used** because topics weren't properly assigned

Example:
- Goal: "Math - Elapsed Time"
- Generated Question: Money problem (random)
- Saved Template: `topic: ''` (blank), `exampleQuestion: "Rose wants to buy a tablet..."`
- Next time: Matches on area/subject but generates money problems instead of elapsed time

## Solution Implemented

### 1. Added Topic to GoalDetection Interface

**File**: `src/services/goalQuestionGenerator.ts`

```typescript
export interface GoalDetection {
  subject: 'math' | 'ela' | 'other'
  topic: string // NEW: Detected topic (e.g., "Money", "Elapsed Time", "Fractions")
  isMultiStep: boolean
  // ... other fields
}
```

### 2. Comprehensive Topic Detection Logic

Added intelligent topic detection in `detectGoalCharacteristics()`:

```typescript
// Topic detection - check for specific math/ELA topics
let topic = ''
const topicKeywords = [
  { keywords: ['elapsed time', 'time elapsed', 'time calculation'], topic: 'Elapsed Time' },
  { keywords: ['money', 'dollar', 'cost', 'price', 'purchase', 'buy'], topic: 'Money' },
  { keywords: ['fraction', 'fractions', 'numerator', 'denominator'], topic: 'Fractions' },
  { keywords: ['decimal', 'decimals'], topic: 'Decimals' },
  { keywords: ['percent', 'percentage'], topic: 'Percentages' },
  { keywords: ['area', 'perimeter', 'volume', 'geometry'], topic: 'Geometry' },
  { keywords: ['algebra', 'equation', 'variable', 'expression'], topic: 'Algebra' },
  { keywords: ['ratio', 'proportion'], topic: 'Ratios & Proportions' },
  { keywords: ['measurement', 'measure', 'length', 'weight'], topic: 'Measurement' },
  { keywords: ['graph', 'chart', 'data', 'statistics'], topic: 'Data & Graphs' },
  { keywords: ['reading comprehension', 'main idea', 'inference'], topic: 'Reading Comprehension' },
  { keywords: ['vocabulary', 'word meaning', 'context clue'], topic: 'Vocabulary' },
  { keywords: ['writing', 'essay', 'paragraph'], topic: 'Writing' },
  { keywords: ['grammar', 'punctuation', 'syntax'], topic: 'Grammar' },
]

// Check for topic matches (first match wins)
for (const { keywords, topic: topicName } of topicKeywords) {
  if (keywords.some(k => goalText.includes(k) || areaOfNeed.includes(k) || goalTitle.includes(k))) {
    topic = topicName
    break
  }
}

// Fallback to generic topic if no match
if (!topic) {
  if (subject === 'math') topic = 'Math'
  else if (subject === 'ela') topic = 'Reading/Writing'
  else topic = 'General'
}
```

### 3. Updated Template Prefill to Use Detection

**File**: `src/components/management/modals/SingleQuestionPreviewModal.vue`

```typescript
import { detectGoalCharacteristics } from '@/services/goalQuestionGenerator'

const prefillTemplateForm = () => {
  // ... existing code ...

  // CRITICAL FIX: Auto-detect topic from goal text
  let detectedTopic = ''
  if (goal) {
    const detection = detectGoalCharacteristics(goal)
    detectedTopic = detection.topic
    console.log(`✨ Auto-detected topic for template: "${detectedTopic}"`)
  }

  templateFormData.value = {
    // ...
    topic: detectedTopic, // NOW PROPERLY DETECTED FROM GOAL
    // ...
  }
}
```

## How It Works Now

### Before Fix
1. User generates PA for "Elapsed Time" goal
2. AI generates random question (could be money problem)
3. User clicks "Save as Template"
4. Template saves with `topic: ''` (blank)
5. Next time: Wrong template matches, generates wrong question type

### After Fix
1. User generates PA for "Elapsed Time" goal
2. AI generates random question
3. User clicks "Save as Template"
4. **System auto-detects topic: "Elapsed Time"** ✨
5. Template saves with `topic: 'Elapsed Time'`
6. Next time: Correct template gets +15 topic bonus, wins match, generates correct question type

## Benefits

1. **Templates automatically get correct topic** based on goal text
2. **Better template matching** with +15 topic bonus
3. **Consistent question types** for each goal
4. **No manual topic entry required** - fully automatic
5. **Works for all subjects** - Math, ELA, and other

## Testing

To verify the fix:
1. Generate PA for "Elapsed Time" goal
2. Click "💾 Save as Template"
3. Check console: Should show `✨ Auto-detected topic for template: "Elapsed Time"`
4. Verify in Firestore: Template should have `topic: 'Elapsed Time'`
5. Next PA generation: Should use elapsed time template (not money template)

## Related Files

- `src/services/goalQuestionGenerator.ts` - Topic detection logic
- `src/components/management/modals/SingleQuestionPreviewModal.vue` - Template prefill
- `src/types/iep.ts` - GoalDetection interface



